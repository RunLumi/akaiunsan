import { Customer, ErrorLog } from '../models/index.ts';
import { genTxt, getCustomerData, json2csv, writeCsvFile } from '../helpers/util.ts';
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
    let { customer } = await getCustomerData(data);
    const exist_customer = await Customer.findOne({ where: { email: customer.email }});
    if (exist_customer)
      throw { message: 'This email is already registered.' }
    let password = genTxt(10);
    customer.password = await encryptPassword(password);
    const result = await Customer.create(customer, { transaction: t });
    await t.commit();
    return res.status(200).json({
      id: result.id,
      firstname: result.firstname,
      lastname: result.lastname,
      email: result.email,
    });
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { customer_id } = req.params;
    let data = req.body;
    let { customer } = await getCustomerData(data);
    await Customer.update(customer, { where: { id: customer_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { customer_id } = req.params;
    const customer = await Customer.findOne({ where: { id: customer_id }});
    if (!customer)
      throw { message: 'Customer not found' };
    return res.status(200).json(customer);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.getDetail', message: error_message });
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
      let field_list = ['firstname', 'lastname', 'phone_number', 'email', 'line_id'];
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
    const list = await Customer.findAll({
      where: fields,
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
    await ErrorLog.create({ location: 'customer.controller.getList', message: error_message });
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
      let field_list = ['firstname', 'lastname', 'phone_number', 'email', 'line_id'];
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
    const count = await Customer.count({
      where: fields,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(count);
  } catch (error) {
    // console.log(error);
    error.message ? error_message = error.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { customer_id } = req.params;
    await Customer.destroy({ where: { id: customer_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function uploadProfile (req, res) {
  try {
    if (req.file) {
      return res.status(200).json(`/uploads/customers/${req.file.filename}`);
    } else
      throw { message: 'No file uploaded' }
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.uploadProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function removeProfile (req, res) {
  try {
    let { profile_image } = req.params;
    fs.unlinkSync(`uploads/customers/${profile_image}`);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.removeProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function exportFile (req, res) {
  try {
    const list = await Customer.findAll();
    let headers = [];
    if (!list.length)
      throw { message: 'No data to export.' };
    for (let prop in list[0].dataValues) {
      headers.push(prop);
    }
    const result = await json2csv(headers, list);
    let today = new Date();
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let filename = `customers_${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear()}_${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.csv`;
    await writeCsvFile(filename, result);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.exportFile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getDetail as getDetail, getList as getList, create as create, update as update, remove as remove, count as count, uploadProfile as uploadProfile, removeProfile as removeProfile, exportFile };
const defaultExport = { getDetail, getList, create, update, remove, count, uploadProfile, removeProfile, exportFile };
export default defaultExport;