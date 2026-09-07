import { CleaningSupply, ErrorLog, SupplierProduct, Supplier } from '../models/index.ts';
import __interop_model from '../models/index.ts';
import __esModuleChain_Op from 'sequelize';
import { json2csv, writeCsvFile } from '../helpers/util.ts';
const model = (__interop_model as any).sequelize;
const { substring, or, and } = (__esModuleChain_Op as any).Op;
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  const t = await model.transaction();
  try {
    let { name, price } = req.body;
    const result = await CleaningSupply.create({ name, price }, { transaction: t });
    await t.commit();
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'cleaningsupply.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { cleaning_supply_id } = req.params;
    let { name, price } = req.body;
    await CleaningSupply.update({ name, price }, { where: { id: cleaning_supply_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'cleaningsupply.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { cleaning_supply_id } = req.params;
    const cleaning_supply = await CleaningSupply.findOne({
      where: { id: cleaning_supply_id },
      include: [
        { model: Supplier }
      ]
    });
    if (!cleaning_supply)
      throw { message: 'Cleaning Supply not found' };
    return res.status(200).json(cleaning_supply);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'cleaningsupply.controller.getDetail', message: error_message });
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
      let field_list = ['name', 'price'];
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
    const list = await CleaningSupply.findAll({
      where: fields,
      limit: Number(limit),
      offset: offset,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(list);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'cleaningsupply.controller.getList', message: error_message });
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
      let field_list = ['name', 'price'];
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
    const count = await CleaningSupply.count({
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
    await ErrorLog.create({ location: 'cleaningsupply.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { cleaning_supply_id } = req.params;
    await CleaningSupply.destroy({ where: { id: cleaning_supply_id }, transaction: t });
    await SupplierProduct.destroy({ where: { cleaning_supply_id: cleaning_supply_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'cleaningsupply.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updateSupplier (req, res) {
  const t = await model.transaction();
  try {
    let { cleaning_supply_id } = req.params;
    let { suppliers } = req.body;
    await SupplierProduct.destroy({ where: { cleaning_supply_id: cleaning_supply_id }, transaction: t });
    let supplier_products = [];
    for (let supplier_id of suppliers) {
      supplier_products.push({ cleaning_supply_id, supplier_id });
    }
    await SupplierProduct.bulkCreate(supplier_products, { transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'cleaningsupply.controller.updateSupplier', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function exportFile (req, res) {
  try {
    const list = await CleaningSupply.findAll();
    let headers = [];
    if (!list.length)
      throw { message: 'No data to export.' };
    for (let prop in list[0].dataValues) {
      headers.push(prop);
    }
    const result = await json2csv(headers, list);
    let today = new Date();
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let filename = `cleaning-supplies_${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear()}_${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.csv`;
    await writeCsvFile(filename, result);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'cleaningsupply.controller.exportFile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getDetail as getDetail, getList as getList, create as create, update as update, remove as remove, count as count, updateSupplier as updateSupplier, exportFile };
const defaultExport = { getDetail, getList, create, update, remove, count, updateSupplier, exportFile };
export default defaultExport;