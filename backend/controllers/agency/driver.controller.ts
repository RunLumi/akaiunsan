import { Supporter, SupporterExperience, SupporterSkill, SupporterLanguage, SupporterEducation, ImportData, ErrorLog } from '../../models/index.ts';
import { pairSkill, pairExperience, getAllStat, correctNationality, getDriverProfile } from '../../helpers/agencyData.ts';
import __interop_model from '../../models/index.ts';
const model = (__interop_model as any).sequelize;
let error_status = 500;
let error_message = 'Unexpected error';
const job_location_list = {
  1: "Airport Suvarnabhumi / Bang Na",
  2: "BangkokRiverside",
  3: "Chatuchak",
  4: "ChinaTown",
  5: "Don Muang / Impact",
  6: "Khaosan / Grand Palace",
  7: "Pratunam",
  8: "Ratchadapisek",
  9: "Siam",
  10: "Silom / Sathorn",
  11: "Sukhumvit",
  12: "Thonburi",
  13: "Thonburi - South",
  14: "Wireless / Chidlom",
  15: "Bang Kapi",
  16: "Rama2",
  17: "Nonthaburi",
  18: "Pathumthani",
  19: "Latphrao",
  20: "Bangkok",
  21: "Bangna",
  22: "Ramindra",
  23: "Udom Suk",
  24: "Prapadaeng",
  25: "Sam Rong",
  26: "Ayutthaya",
  27: "Din Daeng",
  28: "Bang Yai",
  29: "Samutprakarn",
  30: "Ramkhameng",
  31: "Thong Lor",
  32: "Charoennakor",
  33: "SaphanKwai",
  34: "Ratkrabang",
  35: "On Nut",
  36: "Rangsit",
  37: "Phatthanakan",
  38: "Patanakarn",
  39: "Phahonyothin",
  40: "Prawet ",
  41: "Thepharak",
  42: "Khlong Toei",
  43: "Lak Si",
  44: "Rama 9",
  45: "Dusit",
  46: "Sathu Pradit",
  47: "Rama 4",
  48: "Bangkok Yai",
  49: "Lat Krabang",
  50: "Minburi",
  51: "Rayong",
  52: "Predee",
  53: "Ratchayotin",
  54: "Ekamai",
  55: "krongtun",
  56: "Saraburi",
  57: "Charoenkung",
  58: "Chonburi",
  59: "Prajeeburi",
  60: "Puthamuntun",
  61: "Nakorn Swan",
  62: "Salaya",
  63: "Bang Plee",
  64: "Suk Sawat",
  65: "Sutthisan",
  66: "Bangkhae",
  67: "Phra Khanong",
  68: "Charan Sanit",
  69: "Phet Kasem",
  70: "Seri Thai",
  71: "Klong 10",
  72: "Bearing",
  73: "Ladprao",
  74: "Bangkapi",
  75: "Paknam",
  76: "Rama3",
  77: "Bang khen",
  78: "Rama 7",
  79: "Serithai",
  80: "Bang Sue",
  81: "Taling Chan",
  82: "Srinakarin",
  83: "Bang Plud",
  84: "SuanLuang",
  85: "1"
}

async function create (req, res) {
  const t = await model.transaction();
  try {
    let driver = {
      driver_id: Number(req.body.driver_id),
      internal_code: req.body.internal_code,
      job_roles: req.body.job_roles,
      phone_number: req.body.phone_number,
      nationality: correctNationality(req.body.nationality),
      firstname: req.body.name,
      birthday: null,
      expected_salary: req.body.expected_salary ? Number(req.body.expected_salary) : null,
      currency: req.body.currency,
      weight: req.body.weight,
      height: req.body.height,
      job_location: req.body.job_location_id ? job_location_list[req.body.job_location_id] : null,
      job_type: req.body.job_type,
      job_live: req.body.job_live,
      marriage_status: req.body.marriage_status,
      active: req.body.active,
      remark: req.body.remark,
      comment: req.body.comment,
    }
    let birthday = (req.body.birthday) ? req.body.birthday.split('/') : null;
    if (birthday && birthday.length && req.body.birthday[0] != '/'
      && req.body.birthday != '0000-00-00' && req.body.birthday != '') {
      // inner `let birthday = new Date()` used to shadow the split array,
      // producing Invalid Date for every real birthday
      const born = new Date();
      born.setFullYear(Number(birthday[0]));
      born.setMonth(Number(birthday[1]) - 1);
      born.setDate(Number(birthday[2]));
      driver.birthday = born;
    }
    
    const driver_id = driver.driver_id;
    const supporter_result = await Supporter.findOne({ where: { driver_id }});
    let supporter_id = (supporter_result) ? supporter_result.id : 0;
    switch (supporter_id) {
      case 0:
        const supporter_result = await Supporter.create(driver, { transaction: t });
        supporter_id = supporter_result.id;
        break;
      default:
        await Supporter.update(driver, { where: { driver_id }, transaction: t });
        break;
    }

    let { skill_array = [], experience_array = [] } = req.body;
    let { skill_list = [], language_list = [] }: { skill_list: any[]; language_list: any[] } = await pairSkill(skill_array, supporter_id);
    let experience_list: any[] = await pairExperience(experience_array, supporter_id);
    await SupporterSkill.bulkCreate(skill_list, { transaction: t });
    await SupporterLanguage.bulkCreate(language_list, { transaction: t });
    await SupporterExperience.bulkCreate(experience_list, { transaction: t });

    // await ImportData.findOrCreate({ where: { id: 1 }, defaults: { latest_driver_id: driver.driver_id }});
    // await ImportData.update({ latest_driver_id: driver.driver_id }, { where: { id: 1 }});

    await t.commit();

    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'agency/driver.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { driver_id } = req.params;
    let driver = {
      driver_id: Number(driver_id),
      internal_code: req.body.internal_code,
      job_roles: req.body.job_roles,
      phone_number: req.body.phone_number,
      nationality: correctNationality(req.body.nationality),
      firstname: req.body.name,
      birthday: null,
      expected_salary: req.body.expected_salary ? Number(req.body.expected_salary) : null,
      currency: req.body.currency,
      weight: req.body.weight,
      height: req.body.height,
      job_location: req.body.job_location_id ? job_location_list[req.body.job_location_id] : null,
      job_type: req.body.job_type,
      job_live: req.body.job_live,
      marriage_status: req.body.marriage_status,
      active: req.body.active,
      remark: req.body.remark,
      comment: req.body.comment,
    }
    let birthday = (req.body.birthday) ? req.body.birthday.split('-') : null;
    if (birthday && birthday.length && req.body.birthday[0] != '-'
      && req.body.birthday != '0000-00-00' && req.body.birthday != '') {
      // inner `let birthday = new Date()` used to shadow the split array,
      // producing Invalid Date for every real birthday
      const born = new Date();
      born.setFullYear(Number(birthday[0]));
      born.setMonth(Number(birthday[1]) - 1);
      born.setDate(Number(birthday[2]));
      driver.birthday = born;
    }

    const supporter_result = await Supporter.findOne({ where: { driver_id }});
    let supporter_id = supporter_result ? supporter_result.id : 0;
    switch (supporter_id) {
      case 0:
        const supporter_result = await Supporter.create(driver, { transaction: t });
        supporter_id = supporter_result.id;
        break;
      default:
        await Supporter.update(driver, { where: { driver_id }, transaction: t });
        break;
    }

    let { skill_array = [], experience_array = [] } = req.body;
    let { skill_list = [], language_list = [] }: { skill_list: any[]; language_list: any[] } = await pairSkill(skill_array, supporter_id);
    let experience_list: any[] = await pairExperience(experience_array, supporter_id);
    await SupporterSkill.bulkCreate(skill_list, { transaction: t });
    await SupporterLanguage.bulkCreate(language_list, { transaction: t });
    await SupporterExperience.bulkCreate(experience_list, { transaction: t });

    await t.commit();

    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'agency/driver.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { driver_id } = req.params;
    const supporter = await Supporter.findOne({ where: { driver_id }});
    if (!supporter)
      throw { status: 404, message: 'Driver not found' }; // was a null deref 500
    await Supporter.destroy({ where: { id: supporter.id }, transaction: t });
    await SupporterExperience.destroy({ where: { supporter_id: supporter.id }, transaction: t });
    await SupporterSkill.destroy({ where: { supporter_id: supporter.id }, transaction: t });
    await SupporterLanguage.destroy({ where: { supporter_id: supporter.id }, transaction: t });
    await SupporterEducation.destroy({ where: { supporter_id: supporter.id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    const respond_status = (err && typeof err == 'object' && typeof err.status == 'number') ? err.status : error_status;
    await ErrorLog.create({ location: 'agency/driver.controller.remove', message: error_message });
    return res.status(respond_status).json({ message: error_message });
  }
}

async function uploadProfile (req, res) {
  try {
    console.log('upload driver profile');
    let { driver_id } = req.params;
    const profile_url = await getDriverProfile(driver_id);
    let driver_id_number = Number(driver_id)
    await Supporter.update({ profile_image_url: profile_url }, { where: { driver_id: driver_id_number }});
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'agency/driver.controller.uploadProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updateAllStat (req, res) {
  const t = await model.transaction();
  try {
    const stat_list = await getAllStat();
    for (let stat of stat_list) {
      if (stat.count) {
        let driver_id = Number(stat.id);
        await Supporter.update({ interest: stat.count }, { where: { driver_id }, transaction: t });
      }
    }
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.updateAllStat', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { create, update, remove, uploadProfile, updateAllStat };
const defaultExport = { create, update, remove, uploadProfile, updateAllStat };
export default defaultExport;