import fs from 'fs';
import { Supporter, ErrorLog } from '../models/index.ts';
import mysql from 'mysql';
import Client from 'ssh2-sftp-client';
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = JSON.parse(fs.readFileSync(`config/${NODE_ENV}.json`, 'utf8'));
const agency_connection = mysql.createConnection(key['agency-connection']);
// SFTP credentials come from config ("sftp-connection") or env vars — never hardcode them here.
const sftpConfig = Object.assign(
  {},
  key['sftp-connection'],
  {
    host: process.env.SFTP_HOST || (key['sftp-connection'] || {}).host,
    username: process.env.SFTP_USER || (key['sftp-connection'] || {}).username,
    password: process.env.SFTP_PASSWORD || (key['sftp-connection'] || {}).password
  }
);
const skill_pair_list = {
  '85': {
    skill: 'Cook Thai',
    level: 'fair'
  },
  '86': {
    skill: 'Cook Western',
    level: 'fair'
  },
  '87': {
    skill: 'Cook Chinese',
    level: 'fair'
  },
  '88': {
    skill: 'Cook Indian',
    level: 'fair'
  },
  '89': {
    skill: 'Cook Japanese',
    level: 'fair'
  },
  '90': {
    skill: 'Cook Thai',
    level: 'little'
  },
  '91': {
    skill: 'Cook Western',
    level: 'little'
  },
  '92': {
    skill: 'Take care of new-born baby',
    level: 'fair'
  },
  '93': {
    skill: 'Take care of pet',
    level: 'fair'
  },
  '95': {
    skill: 'Cook Korean',
    level: 'fair'
  },
  '100': {
    skill: 'Cook Lao',
    level: 'fair'
  },
  '101': {
    skill: 'Cook Indian',
    level: 'little'
  },
  '102': {
    skill: 'Cook Arabia',
    level: 'fair'
  },
  '103': {
    skill: 'Cook Chinese',
    level: 'little'
  },
  '105': {
    skill: 'Cook Korean',
    level: 'little'
  },
  '106': {
    skill: 'Cook Japanese',
    level: 'little'
  },
  '107': {
    skill: 'Cook Baby/Kid food',
    level: 'fair'
  },
  '109': {
    skill: 'Cook Filipino',
    level: 'little'
  },
  '110': {
    skill: 'Cook Filipino',
    level: 'fair'
  },
  '111': {
    skill: 'Read Thai',
    level: 'fair'
  }
}
const language_pair_list = {
  '77': {
    language: 'Thai',
    level: 'fair'
  },
  '78': {
    language: 'Thai',
    level: 'little'
  },
  '79': {
    language: 'English',
    level: 'fair'
  },
  '80': {
    language: 'English',
    level: 'little'
  },
  '81': {
    language: 'Chinese',
    level: 'little'
  },
  '82': {
    language: 'Japanese',
    level: 'little'
  },
  '83': {
    language: 'Korean',
    level: 'little'
  },
  '84': {
    language: 'Hindi',
    level: 'fair'
  },
  '94': {
    language: 'Chinese',
    level: 'fair'
  },
  '99': {
    language: 'Lao',
    level: 'fair'
  },
  '104': {
    language: 'Hindi',
    level: 'little'
  },
  '108': {
    language: 'Japanese',
    level: 'fair'
  },
  '112': {
    language: 'Korean',
    level: 'fair'
  }
}

function correctNationality (maid_nationality) {
  maid_nationality = maid_nationality ? maid_nationality.toLowerCase() : null;
  let nationality = null;
  switch (maid_nationality) {
    case 'thai':
      nationality = 'Thai';
      break;
    case 'thailand':
      nationality = 'Thai';
      break;
    case 'vietnam':
      nationality = 'Vietnamese';
      break;
    case 'vietnamese':
      nationality = 'Vietnamese';
      break;
    case 'lao':
      nationality = 'Lao';
      break;
    case 'laos':
      nationality = 'Lao';
      break;
    case 'myanmar':
      nationality = 'Myanmar';
      break;
    case 'myanmar(ไทยใหญ่)':
      nationality = 'Myanmar/Thaiyai';
      break;
    case 'myanmar/thaiyai':
      nationality = 'Myanmar/Thaiyai';
      break;
    case 'cambodia':
      nationality = 'Combodian';
      break;
    case 'cambodian':
      nationality = 'Combodian';
      break;
    case 'filipino':
      nationality = 'Filipino';
      break;
    case 'philipine':
      nationality = 'Filipino';
      break;
    case 'philipines':
      nationality = 'Filipino';
      break;
    default:
      break;
  }
  return nationality;
}

async function getSuppoterFromAgency (start_id, max_id) {
  let start_id_string = (`0000000000${start_id}`).slice(-11);
  let max_id_string = (`0000000000${max_id}`).slice(-11);
  return new Promise((resolve, reject) => {
    agency_connection.query(`SELECT 
      m.maid_ID as id, m.code as internal_code, m.name as name, m.birthday as birthday, m.tel as phone_number,
      m.weight as weight, m.height as height, m.national as nationality, m.location_ID as location_ID, m.ltype as ltype,
      m.jtype as jtype, m.salary as expected_salary, m.currency as currency, m.mstatus as mstatus,
      m.remark as remark, m.comment as comment, m.position_ID as position_ID, m.jstatus as jstatus
      FROM maid as m
      where maid_ID >= "${start_id_string}" AND maid_ID <= "${max_id_string}"
      ORDER BY id ASC`, function (error, result, fields) {
      if (error || !result.length) {
        reject({ message: 'unable to get maid record' });
      } else {
        // console.log(result)
        let supporter_list = [];
        result.forEach(maid => {
          let supporter = {
            // id: Number(maid.id),
            firstname: maid.name,
            internal_code: maid.internal_code,
            birthday: null,
            phone_number: maid.phone_number,
            weight: Number(maid.weight),
            height: Number(maid.height),
            nationality: correctNationality(maid.nationality),
            job_location: null,
            job_type: null,
            job_live: null,
            expected_salary: maid.expected_salary,
            currency: maid.currency,
            remark: maid.remark,
            comment: maid.comment,
            marriage_status: null,
            job_roles: null,
            active: true,
            maid_id: Number(maid.id),
            work_permit: false
          }
          let birthday = maid.birthday.split('-');
          if (birthday && birthday.length && maid.birthday[0] != '-'
            && maid.birthday != '0000-00-00' && maid.birthday != '') {
            let birthday = new Date();
            birthday.setFullYear(birthday[0]);
            birthday.setMonth(birthday[1]-1);
            birthday.setDate(birthday[2]);
            supporter.birthday = birthday;
          }
          if (supporter.remark) {
            const remark = supporter.remark.toLowerCase();
            if (remark.includes('work-permit')) {
              supporter.work_permit = true;
            }
          }
          switch (maid.location_ID) {
            case '72':
              supporter.job_location = 'Bangkok';
              break;
            case '73':
              supporter.job_location = 'Nonthaburi';
              break;
            case '79':
              supporter.job_location = 'Cambodia';
              break;
            case '80':
              supporter.job_location = 'Laos';
              break;
            default:
              break;
          }
          switch (maid.ltype) {
            case 1:
              supporter.job_live = 'Live in';
              break;
            case 2:
              supporter.job_live = 'Live out';
              break;
            case 3:
              supporter.job_live = 'Live in and out';
              break;
            default:
              break;
          }
          switch (maid.jtype) {
            case 1:
              supporter.job_type = 'Full time';
              break;
            case 2:
              supporter.job_type = 'Part time';
              break;
            default:
              break;
          }
          switch (maid.mstatus) {
            case 1:
              supporter.marriage_status = 'Single';
              break;
            case 2:
              supporter.marriage_status = 'Married';
              break;
            case 3:
              supporter.marriage_status = 'Divorced';
              break;
            default:
              break;
          }
          switch (maid.position_ID) {
            case 18: //maid
              supporter.job_roles = 'maid';
              break;
            case 19: //nanny
              supporter.job_roles = 'nanny';
              break;
            case 20: //maid/nanny
              supporter.job_roles = 'maid,nanny';
              break;
            case 21: //maid/cook
              supporter.job_roles = 'maid,cook';
              break;
            case 22: //maid/elder
              supporter.job_roles = 'maid,elder';
              break;
            case 23: //maid/pet
              supporter.job_roles = 'maid,pet';
              break;
            case 24: //premium nanny
              supporter.job_roles = 'premium';
              break;
            case 28: //elder
              supporter.job_roles = 'elder';
              break;
            case 29: //restaurant
              supporter.job_roles = 'restaurant';
              break;
            default:
              break;
          }
          if (maid.jstatus == 2)
            supporter.active = false;
          supporter_list.push(supporter);
        })
        resolve(supporter_list);
      }
    });
  });
}

async function getSkillFromAgency (start_id, max_id) {
  let start_id_string = (`0000000000${start_id}`).slice(-11);
  let max_id_string = (`0000000000${max_id}`).slice(-11);
  return new Promise((resolve, reject) => {
    let sql_query = `SELECT 
    s.skill_name as skill_name, sm.maid_ID as maid_ID, s.skill_ID as skill_ID
    FROM skill as s
    LEFT JOIN skillmatch as sm on (sm.skill_ID = s.skill_ID)
    where sm.maid_ID >= "${start_id_string}" AND sm.maid_ID <= "${max_id_string}"`
    agency_connection.query(sql_query, function (error, result, fields) {
      if (error || !result.length) {
        reject({ message: 'unable to get skill record' });
      } else {
        let languages = [];
        let skills = [];
        let promise_list = [];
        for (let agency_skill of result) {
          let maid_id = Number(agency_skill.maid_ID);
          promise_list.push(new Promise((resolve_2, reject_2) => {
            Supporter.findOne({ where: { maid_id }}).then((supporter) => {
              let supporter_id = supporter.id;
              let skillID = agency_skill.skill_ID;
              if (skill_pair_list[skillID]) {
                let skill = {
                  skill: skill_pair_list[skillID].skill,
                  level: skill_pair_list[skillID].level,
                  supporter_id
                }
                skills.push(skill);
              }
              resolve_2(true);
            })
            .catch((error) => {
              ErrorLog.create({ location: 'helpers.agencyData.getSkillFromAgency', message: `maidId: ${maid_id},${error}` })
              .then(() => resolve_2(false))
            });;
          }));
        }
        Promise.all(promise_list).then((values) => {
          resolve({ skills, languages });
        });
      }
    });
  });
}

async function getExperienceFromAgency (start_id, max_id) {
  let start_id_string = (`0000000000${start_id}`).slice(-11);
  let max_id_string = (`0000000000${max_id}`).slice(-11);
  return new Promise((resolve, reject) => {
    let sql_query = `SELECT 
    maid_ID, worktime, exp_location
    FROM experience
    where maid_ID >= "${start_id_string}" AND maid_ID <= "${max_id_string}"`;
    agency_connection.query(sql_query, function (error, result, fields) {
      if (error || !result.length) {
        reject({ message: 'unable to get experience record' });
      } else {
        let experiences = [];
        let promise_list = [];
        result.forEach(exp => {
          let employer_nationality = null;
          let detail = '';
          promise_list.push(new Promise((resolve_2, reject_2) => {
            let maid_id = Number(exp.maid_ID);
            Supporter.findOne({ where: { maid_id }})
              .then((supporter) => {
                let supporter_id = supporter.id;
                if (exp.exp_location.includes('family') || exp.exp_location.includes('Family')) {
                  employer_nationality = exp.exp_location;
                  detail = exp.worktime;
                } else {
                  if (exp.worktime)
                    detail = `${exp.worktime}`;
                  if (exp.exp_location)
                    detail += ` (${exp.exp_location})`;
                }
                if (detail || employer_nationality)
                  experiences.push({
                    detail,
                    employer_nationality,
                    supporter_id
                  });
                  resolve_2(true);
              })
              .catch((error) => {
                ErrorLog.create({ location: 'helpers.agencyData.getExperienceFromAgency', message: `maidId: ${maid_id},${error}` })
                .then(() => resolve_2(false))
              });
          }));
        });
        Promise.all(promise_list).then((values) => {
          resolve(experiences);
        });
      }
    });
  });
}

async function getDriver () {
  return new Promise((resolve, reject) => {
    var obj;
    fs.readFile('m.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      let drivers = [];
      obj.forEach(driver => {
        let supporter = {
          driver_id: Number(driver.id),
          internal_code: driver.internal_code,
          firstname: driver.name,
          birthday: null,
          phone_number: driver.phone_number,
          weight: Number(driver.weight),
          height: Number(driver.height),
          nationality: driver.nationality,
          job_location: null,
          job_type: null,
          job_live: null,
          expected_salary: driver.expected_salary,
          currency: 'THB',
          remark: driver.remark,
          comment: driver.comment,
          marriage_status: null,
          job_roles: null,
          active: true
        }
        let birthday = driver.birthday.split('-');
        if (birthday && birthday.length && req.body.birthday[0] != '-'
          && req.body.birthday != '0000-00-00' && req.body.birthday != '') {
          let birthday = new Date();
          birthday.setFullYear(birthday[0]);
          birthday.setMonth(birthday[1]-1);
          birthday.setDate(birthday[2]);
          supporter.birthday = birthday;
        }
        switch (driver.ltype) {
          case 1:
            supporter.job_live = 'Live in';
            break;
          case 2:
            supporter.job_live = 'Live out';
            break;
          case 3:
            supporter.job_live = 'Live in and out';
            break;
          default:
            break;
        }
        switch (driver.jtype) {
          case 1:
            supporter.job_type = 'Full time';
            break;
          case 2:
            supporter.job_type = 'Part time';
            break;
          default:
            break;
        }
        switch (driver.mstatus) {
          case 1:
            supporter.marriage_status = 'single';
            break;
          case 2:
            supporter.marriage_status = 'Married';
            break;
          case 3:
            supporter.marriage_status = 'Divorced';
            break;
          default:
            break;
        }
        if (driver.jstatus == 2)
          supporter.active = false;
        switch (driver.position_ID) {
          case 13:
            supporter.job_roles = 'driver';
            break;
          case 14:
            supporter.job_roles = 'driver/car';
            break;
          case 15:
            supporter.job_roles = 'messanger';
            break;
          default:
            break;
        }
        drivers.push(supporter);
      });
      resolve(drivers);
    });
  });
}

async function getDriverSkill () {
  return new Promise((resolve, reject) => {
    var obj;
    fs.readFile('skill.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      let languages = [];
      obj.forEach(skill => {
        let driver_id = Number(skill.maid_ID);
        let language = '';
        let level = 'fair';
        if (skill.skill_name.includes('little')) {
          level = 'little';
        } else if (skill.skill_name.includes('good')) {
          level = 'good';
        }
        if (skill.skill_name.includes('Mandarin')) {
          languages.push({ language: 'Thai', level, supporter_id: driver_id });
          languages.push({ language: 'Chinese (Mandarin)', level, supporter_id: driver_id });
        } else {
          let language_array = skill.skill_name.split(' ');
          let index = language_array.length - 1;
          switch (language_array[index]) {
            case 'Thai':
              language = 'Thai';
              break;
            case 'English':
              language = 'English';
              break;
            case 'Japanese':
              language = 'Japanese';
              break;
            case 'Nepali':
              language = 'Nepali';
              break;
            case 'Chinese':
              language = 'Chinese';
              break;
            case 'Korean':
              language = 'Korean';
              break;
            case 'French':
              language = 'French';
              break;
            case 'Chinese':
              language = 'Chinese';
              break;
            case 'Hindi':
              language = 'Hindi';
              break;
            case 'Spanish':
              language = 'Spanish';
              break;
            case 'Italian':
              language = 'Italian';
              break;
            default:
              break;
          }
          languages.push({ language, level, driver_id });
        }
      });
      resolve(languages);
    });
  });
}

async function getDriverExperience () {
  return new Promise((resolve, reject) => {
    var obj;
    fs.readFile('experience.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      let experiences = [];
      obj.forEach(exp => {
        let employer_nationality = null;
          let detail = '';
          let driver_id = Number(exp.maid_ID);
          if (exp.exp_location.includes('family') || exp.exp_location.includes('Family')) {
            employer_nationality = exp.exp_location;
            detail = exp.worktime;
          } else {
            if (exp.worktime)
              detail = `${exp.worktime}`;
            if (exp.exp_location)
              detail += ` (${exp.exp_location})`;
          }
          if (detail || employer_nationality)
            experiences.push({
              detail,
              employer_nationality,
              driver_id
            });
      });
      resolve(experiences);
    });
  });
}

async function pairSkill (skill_array, supporter_id) {
  return new Promise((resolve, reject) => {
    let skill_list = [], language_list = [];
    for (let item of skill_array) {
      let skill_id = item['skill_ID'];
      if (skill_pair_list[skill_id]) {
        let skill = {
          skill: skill_pair_list[skill_id].skill,
          level: skill_pair_list[skill_id].level,
          supporter_id
        }
        console.log(skill);
        skill_list.push(skill);
      }
      if (language_pair_list[skill_id]) {
        let language = {
          language: language_pair_list[skill_id].language,
          level: language_pair_list[skill_id].level,
          supporter_id
        }
        language_list.push(language);
      }
    }
    resolve({ skill_list, language_list });
  });
}

async function pairExperience (experience_array, supporter_id) {
  return new Promise((resolve, reject) => {
    let experience_list = [];
    for (let item of experience_array) {
      let employer_nationality = null;
      let detail = '';
      if (item.exp_location.includes('family') || item.exp_location.includes('Family')) {
        employer_nationality = item.exp_location;
        detail = item.worktime;
      } else {
        if (item.worktime)
          detail = `${item.worktime}`;
        if (item.exp_location)
          detail += ` (${item.exp_location})`;
      }
      if (detail || employer_nationality)
        experience_list.push({
          detail,
          employer_nationality,
          supporter_id
        });
    }
    resolve(experience_list);
  });
}

async function getMaidNannyList () {
  let sql_query = `SELECT maid_ID as maid_id FROM maid
    where position_ID = 20`;
    return new Promise((resolve, reject) => {
      agency_connection.query(sql_query, function (error, result, fields) {
        if (error || !result.length) {
          console.log(error)
          reject({ message: 'unable to get maid/nanny record' });
        } else {
          resolve(result);
        }
      });
    });
}

async function getAllStat () {
  return new Promise((resolve, reject) => {
    agency_connection.query(`SELECT id, count
      FROM view_summary
      ORDER BY id ASC`, function (error, result, fields) {
        if (error || !result.length) {
          reject({ message: 'unable to get stat record' });
        } else {
          resolve(result);
        }
      }
    );
  });
}

async function getMaidProfile (maid_id) {
  return new Promise((resolve, reject) => {

    const remoteDir = `/var/www/vhosts/ayasan-service.com/httpdocs/assets/uploads/profilepicture/${maid_id}/1.jpg`;


    let sftp = new Client();
    const config = Object.assign({ port: '22' }, sftpConfig);

    // get file
    sftp.connect(config).then(() => {
      sftp.get(remoteDir).then((data) => {
        fs.writeFile(`uploads/supporters/maid_${maid_id}.jpg`, data, (err) => {
          if (err) throw err;
          resolve(`maid_${maid_id}.jpg`)
        });
      }).catch((err2) => {
        reject(err2)
      });
    }).catch((err1) => {
      reject(err1)
    });
  });
}

async function getDriverProfile (driver_id) {
  return new Promise((resolve, reject) => {

    const driver_uri = `https://www.ayasan-driver.com/profilepicture/${driver_id}/1.jpg`;
    const new_driver_uri = `uploads/supporters/driver_${driver_id}.jpg`;

    (async () => {
      const response = await fetch(driver_uri, { method: 'HEAD' });
      if (!response.ok)
        return reject({ message: 'driver profile picture not found' });

      const imageResponse = await fetch(driver_uri);
      if (!imageResponse.ok)
        return reject({ message: 'driver profile picture not found' });

      const stream = fs.createWriteStream(new_driver_uri);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      stream.end(buffer, () => resolve(`driver_${driver_id}.jpg`));
    })().catch((err) => reject(err));
  });
}

/**
 * sql for driver
 * 
 * SELECT 
      m.maid_ID as id, m.code as internal_code, m.name as name, m.birthday as birthday, m.tel as phone_number,
      m.weight as weight, m.height as height, m.national as nationality, l.location_name as job_location, m.ltype as ltype,
      m.jtype as jtype, m.salary as expected_salary, m.mstatus as mstatus, m.remark as remark, m.comment as comment,
      m.position_ID as position_ID, m.jstatus as jstatus, m.gstatus as gender
      FROM maid as m
      LEFT JOIN location as l on(m.location_ID = l.location_ID)
      where 1;
 * SELECT 
      maid_ID, worktime, exp_location
      FROM experience
      where 1;
 *
 *
 * most fields of driver can be used too.
 * ****careful with location_ID
 * 
 * experiences
 * SELECT maid_ID (become old_driver_id), worktime, exp_location
 * FROM experience
 * //do the same as supporter
 */

export { getSuppoterFromAgency, getSkillFromAgency, getExperienceFromAgency, getDriver, getDriverSkill, getDriverExperience, pairSkill, pairExperience, getMaidNannyList, getAllStat, getMaidProfile, getDriverProfile, correctNationality };