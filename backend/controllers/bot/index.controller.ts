const { Supporter, SupporterViewCount, SupporterSkill, SupporterExperience,
  SupporterLanguage, ErrorLog } = require('../../models/index.ts');
const { substring, and, eq, ne, gte, lte } = require('sequelize').Op;
let error_status = 500;
let error_message = 'Unexpected error';
const NODE_ENV = process.env.NODE_ENV || 'local';
const config = require(`../../config/${NODE_ENV}.json`);
const IMAGE_BASE_URL = config.image_base_url;
let DEFAULT_PROFILE_IMAGE_URL = config.default_image_url;

async function getDetail (req, res) {
  try {
    let { helper_id } = req.params;
    const supporter = await Supporter.findOne({
      where: { id: helper_id },
      attributes: ['id', 'profile_image_url', 'firstname', 'interest_count',
        'internal_code', 'birthday', 'weight', 'height', 'nationality',
        'job_location', 'job_live', 'job_roles', 'job_type', 'marriage_status',
        'nationality', 'expected_salary', 'currency', 'profile_image_url', 'remark'],
      include: [
        { model: SupporterSkill },
        { model: SupporterLanguage },
        { model: SupporterExperience }
      ],
    });
    if (!supporter)
      throw { message: 'Supporter not found' };
    let profile_image = '';
    if (supporter.profile_image_url)
      profile_image = `${IMAGE_BASE_URL}supporters/${supporter.profile_image_url}`;
    else
      profile_image = DEFAULT_PROFILE_IMAGE_URL;
    let job_roles = supporter.job_roles ? supporter.job_roles.split(',') : '';
    // let position = '';
    // for (let pos of job_roles) {
    //   position += `${pos[0].toUpperCase()}${pos.substring(1, pos.length)} / `
    // }
    let age = 0;
    if (supporter.birthday) {
      let today = new Date();
      let difference = today.getTime() - supporter.birthday.getTime();
      let ageDate = new Date(difference);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    let skills = [];
    supporter.SupporterLanguages.forEach(item => {
      skills.push(`speak ${item.language.toLowerCase()}`);
    });
    supporter.SupporterSkills.forEach(item => {
      skills.push(item.skill);
    });
    let experiences = [];
    supporter.SupporterExperiences.forEach(item => {
      experiences.push(item.experience);
    });
    let helper = {
      id: supporter.id,
      code: supporter.internal_code,
      birthday: supporter.birthday || '',
      age: age,
      weight: supporter.weight || 0,
      height: supporter.height || 0,
      nationality: supporter.nationality || '',
      location: supporter.job_location || '',
      position_name: job_roles,
      job_live: supporter.job_live,
      job_type: supporter.job_type,
      job_location: supporter.job_location,
      salary: supporter.expected_salary || 0,
      currency: supporter.currency || '',
      experience: experiences,
      skill_name: skills,
      status: supporter.marriage_status,
      image: profile_image,
      score: supporter.interest_count || 0,
      interested: supporter.interest_count || 0,
      url: '',
      remark: supporter.remark,
    };
    return res.status(200).json(helper);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'bot/index.controller.getDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    let query = req.query;
    let { page = 1 } = req.query;
    page = page - 1;
    let fields = {
      [and]: [{
        active: {
          [eq]: true
        }
      }, {
        job_location: {
          [and]: [{
            [ne]: 'Laos'
          }, {
            [ne]: 'Cambodia'
          }]
        }
      }]
    };
    let include_clause = []
    for (let prop in query) {
      switch (prop) {
        case 'job_roles':
          let job_roles = query[prop].split('-')
          let job_roles_group = [];
          for (let job of job_roles) {
            job_roles_group.push({ [substring]: job });
          }
          fields[and].push({
            job_roles: {
              [and]: job_roles_group
            }
          });
          break;
        case 'skill':
          include_clause.push({
            model: SupporterSkill,
            where: { skill: query[prop] },
            attributes: ['skill']
          })
          break;
        case 'language':
          include_clause.push({
            model: SupporterLanguage,
            where: { language: query[prop] }
          })
          break;
        case 'min_salary':
          fields[and].push({
            expected_salary: {
              [gte]: query[prop]
            }
          });
          break;
        case 'max_salary':
          fields[and].push({
            expected_salary: {
              [lte]: query[prop]
            }
          });
          break;
        case 'job_live':
          fields[and].push({
            job_live: {
              [eq]: query[prop]
            }
          });
          break;
        case 'job_type':
          fields[and].push({
            job_type: {
              [eq]: query[prop]
            }
          });
          break;
        default:
          break;
      }
    }
    const list = await Supporter.findAll({
      where: fields,
      include: include_clause
    });
    const helper_list = [];
    for (let supporter of list) {
      let helper = {
        id: supporter.id,
        code: supporter.internal_code || '',
        currency: supporter.currency || '',
        height: supporter.height || 0,
        weight: supporter.weight || 0,
        salary: supporter.expected_salary || 0,
        position_name: supporter.job_roles ? supporter.job_roles.split(',') : '',
        nationality: supporter.nationality || '',
        age: 0,
        image: '',
        score: supporter.interest_count || 0,
        skill_name: [],
        interested: supporter.interest_count || 0,
        job_live: supporter.job_live,
        job_type: supporter.job_type,
        job_location: supporter.job_location || ''
      };
      if (supporter.profile_image_url)
        helper.image = `${IMAGE_BASE_URL}supporters/${supporter.profile_image_url}`;
      else
        helper.image = DEFAULT_PROFILE_IMAGE_URL;
      if (supporter.birthday) {
        const bdate = supporter.birthday.split('-')
        const birthday = new Date(Number(bdate[0]), Number(bdate[1])-1, Number(bdate[2]))
        const today = new Date()
        let age = today.getFullYear() - birthday.getFullYear()
        const month = today.getMonth() - birthday.getMonth()
        if (month < 0 || (month === 0 && today.getDate() < birthday.getDate())) {
          age--
        }
        helper.age = age
      }
      const min_age = Number(query.min_age)
      const max_age = Number(query.max_age)
      if (helper.age >= min_age && helper.age <= max_age) {
        if (supporter.SupporterLanguages) {
          supporter.SupporterLanguages.forEach(item => {
            helper.skill_name.push(`speak ${item.language.toLowerCase()}`);
          });
        }
        if (supporter.SupporterSkills) {
          supporter.SupporterSkills.forEach(item => {
            helper.skill_name.push(item.skill.toLowerCase());
          });
        }
        helper_list.push(helper);
      }
    }
    return res.status(200).json(helper_list);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'bot/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updateInterest (req, res) {
  try {
    const supporter_list = await Supporter.findAll({ include: [{ model: SupporterViewCount }]});
    for (let supporter of supporter_list) {
      if (supporter.SupporterViewCounts.length > 0) {
        supporter.interest_count = supporter.SupporterViewCounts[0].count;
        await supporter.save();
      }
    }
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'bot/index.controller.updateInterest', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

module.exports = {
  getDetail,
  getList,
  updateInterest
}
