import fs from 'fs';
import { Admin, Role, ErrorLog } from '../models/index.ts';
import { genTxt, getAdminData } from '../helpers/util.ts';
import { encryptPassword } from '../helpers/security.ts';
import __interop_model from '../models/index.ts';
import __esModuleChain_Op from 'sequelize';
const model = (__interop_model as any).sequelize;
const { substring, or } = (__esModuleChain_Op as any).Op;
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  const t = await model.transaction();
  try {
    let data = req.body;
    const exist_admin = await Admin.findOne({ where: { username: data.username }});
    if (exist_admin)
      throw { message: 'This admin is already registered.' };
    if (!data.password) {
      data.password = genTxt(10);
    }
    let { admin }: { admin: any } = await getAdminData(data);
    admin.password = await encryptPassword(admin.password);
    const result = await Admin.create(admin, { transaction: t });
    await t.commit();
    return res.status(200).json({
      id: result.id,
      firstname: result.firstname,
      lastname: result.lastname,
      email: result.email,
      phone_number: result.phone_number,
      line_id: result.line_id,
      profile_image_url: result. profile_image_url
    });
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { admin_id } = req.params;
    let data = req.body;
    const exist_admin = await Admin.findOne({ where: { username: data.username }});
    if (exist_admin && admin_id != exist_admin.id)
      throw { message: 'This username is already in used.' };
    let { admin }: { admin: any } = await getAdminData(data);
    await Admin.update(admin, { where: { id: admin_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updatePassword (req, res) {
  const t = await model.transaction();
  try {
    let { admin_id } = req.params;
    let { password } = req.body;
    const admin = await Admin.findOne({ where: { id: admin_id }});
    if (!admin)
      throw { message: 'Admin not found.' };
    const hashed_password = await encryptPassword(password);
    await Admin.update({ password: hashed_password }, { where: { id: admin_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.updatePassword', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { admin_id } = req.params;
    const admin = await Admin.findOne({ where: { id: admin_id }, attributes: { exclude: ['password'] }});
    if (!admin)
      throw { message: 'Admin not found' };
    return res.status(200).json(admin);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.getDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    let { page = 0, limit = 10, sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter, keyword } = req.query;
    page = page - 1;
    let offset = (!page) ? 0 : limit * page;
    if (offset < 0)
      offset = 0;
    let fields = {};
    if (filter) {
      Object.keys(filter).forEach(prop => {
        fields[prop] = filter[prop];
      });
    } else if (keyword) {
      let field_list = ['firstname', 'lastname', 'username', 'phone_number', 'email', 'line_id'];
      fields = {
        [or]: []
      };
      field_list.forEach(item => {
        fields[or].push({
          [item]: {
            [substring]: keyword
          }
        });
      });
    }
    const list = await Admin.findAll({
      where: fields,
      attributes: { exclude: ['password'] },
      limit: Number(limit),
      offset: offset,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(list);
  } catch (err) {
    // console.log(error);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function count (req, res) {
  try {
    let { sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter, keyword } = req.query;
    let fields = {};
    if (filter) {
      Object.keys(filter).forEach(prop => {
        fields[prop] = filter[prop];
      });
    } else if (keyword) {
      let field_list = ['firstname', 'lastname', 'username', 'phone_number', 'email', 'line_id'];
      fields = {
        [or]: []
      };
      field_list.forEach(item => {
        fields[or].push({
          [item]: {
            [substring]: keyword
          }
        });
      });
    }
    const count = await Admin.count({
      where: fields,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(count);
  } catch (error) {
    // console.log(error);
    error.message ? error_message = error.message : error_message;
    typeof error == 'string' ? error_message = error : error_message;
    await ErrorLog.create({ location: 'admin.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { admin_id } = req.params;
    const admin = await Admin.findOne({ where: { id: admin_id }});
    if (admin.role == 'Super Admin' || admin.role_id == 1)
      throw { message: 'Unable to remove user.' }
    await Admin.destroy({ where: { id: admin_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function uploadProfile (req, res) {
  try {
    if (req.file) {
      return res.status(200).json(`/uploads/admins/${req.file.filename}`);
    } else
      throw { message: 'No file uploaded' }
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.uploadProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function removeProfile (req, res) {
  try {
    let { profile_image } = req.params;
    fs.unlinkSync(`uploads/admins/${profile_image}`);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.removeProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getDetail as getDetail, getList as getList, create as create, update as update, remove as remove, count as count, uploadProfile as uploadProfile, removeProfile as removeProfile, updatePassword as updatePassword };
const defaultExport = { getDetail, getList, create, update, remove, count, uploadProfile, removeProfile, updatePassword };
export default defaultExport;