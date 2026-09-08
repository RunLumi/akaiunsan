import { Supporter, SupporterExperience, SupporterSkill, SupporterLanguage, SupporterEducation, ImportData, ErrorLog } from '../../models/index.ts';
import { pairSkill, pairExperience, getAllStat, getMaidProfile, correctNationality } from '../../helpers/agencyData.ts';
import __interop_model from '../../models/index.ts';
import fs from 'fs';
const model = (__interop_model as any).sequelize;
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  const t = await model.transaction();
  try {
    let maid = {
      maid_id: Number(req.body.maid_id),
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
      job_location: req.body.job_location,
      job_type: req.body.job_type,
      job_live: req.body.job_live,
      marriage_status: req.body.marriage_status,
      active: req.body.active,
      remark: req.body.remark,
      comment: req.body.comment,
      work_permit: false
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
      maid.birthday = born;
    }
    if (maid.remark) {
      const remark = maid.remark.toLowerCase();
      if (remark.includes('work-permit')) {
        maid.work_permit = true;
      }
    }
    
    const maid_id = maid.maid_id;
    const supporter_result = await Supporter.findOne({ where: { maid_id }});
    let supporter_id = (supporter_result) ? supporter_result.id : 0;
    switch (supporter_id) {
      case 0:
        const supporter_result = await Supporter.create(maid, { transaction: t });
        supporter_id = supporter_result.id;
        break;
      default:
        await Supporter.update(maid, { where: { maid_id }, transaction: t });
        break;
    }

    let { skill_array = [], experience_array = [] } = req.body;
    let { skill_list = [], language_list = [] }: { skill_list: any[]; language_list: any[] } = await pairSkill(skill_array, supporter_id);
    let experience_list: any[] = await pairExperience(experience_array, supporter_id);
    await SupporterSkill.bulkCreate(skill_list, { transaction: t });
    await SupporterLanguage.bulkCreate(language_list, { transaction: t });
    await SupporterExperience.bulkCreate(experience_list, { transaction: t });

    // await ImportData.findOrCreate({ where: { id: 1 }, defaults: { latest_maid_id: maid.maid_id }});
    // await ImportData.update({ latest_maid_id: maid.maid_id }, { where: { id: 1 }});

    await t.commit();

    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'agency/maid.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { maid_id } = req.params;
    let maid = {
      maid_id: Number(maid_id),
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
      job_location: req.body.job_location,
      job_type: req.body.job_type,
      job_live: req.body.job_live,
      marriage_status: req.body.marriage_status,
      active: req.body.active,
      remark: req.body.remark,
      comment: req.body.comment,
      work_permit: false
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
      maid.birthday = born;
    }
    if (maid.remark) {
      const remark = maid.remark.toLowerCase();
      if (remark.includes('work-permit')) {
        maid.work_permit = true;
      }
    }

    const supporter_result = await Supporter.findOne({ where: { maid_id }});
    let supporter_id = supporter_result ? supporter_result.id : 0;
    switch (supporter_id) {
      case 0:
        const supporter_result = await Supporter.create(maid, { transaction: t });
        supporter_id = supporter_result.id;
        break;
      default:
        await Supporter.update(maid, { where: { maid_id }, transaction: t });
        break;
    }

    // let { skill_array = [], experience_array = [] } = req.body;
    // let { skill_list = [], language_list = [] }: { skill_list: any[]; language_list: any[] } = await pairSkill(skill_array, supporter_id);
    // let experience_list: any[] = await pairExperience(experience_array, supporter_id);
    // await SupporterExperience.destroy({ where: { supporter_id }, transaction: t });
    // await SupporterSkill.destroy({ where: { supporter_id }, transaction: t });
    // await SupporterLanguage.destroy({ where: { supporter_id }, transaction: t });
    // await SupporterSkill.bulkCreate(skill_list, { transaction: t });
    // await SupporterLanguage.bulkCreate(language_list, { transaction: t });
    // await SupporterExperience.bulkCreate(experience_list, { transaction: t });

    await t.commit();

    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'agency/maid.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { maid_id } = req.params;
    const supporter = await Supporter.findOne({ where: { maid_id }});
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
    await ErrorLog.create({ location: 'agency/maid.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function uploadProfile (req, res) {
  try {
    let { maid_id } = req.params;
    const profile_url = await getMaidProfile(maid_id);
    let maid_id_number = Number(maid_id)
    await Supporter.update({ profile_image_url: profile_url }, { where: { maid_id: maid_id_number }});
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'agency/maid.controller.uploadProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updateAllStat (req, res) {
  const t = await model.transaction();
  try {
    const stat_list = await getAllStat();
    for (let stat of stat_list) {
      if (stat.count) {
        let maid_id = Number(stat.id);
        await Supporter.update({ interest: stat.count }, { where: { maid_id }, transaction: t });
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