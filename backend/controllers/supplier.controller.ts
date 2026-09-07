import { Supplier, ErrorLog, SupplierProduct, CleaningSupply } from '../models/index.ts';
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
    let { name, branch } = req.body;
    const result = await Supplier.create({ name, branch }, { transaction: t });
    await t.commit();
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'suppleir.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { supplier_id } = req.params;
    let { name, branch } = req.body;
    await Supplier.update({ name, branch }, { where: { id: supplier_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supplier.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { supplier_id } = req.params;
    const supplier = await Supplier.findOne({
      where: { id: supplier_id },
      include: [
        { model: CleaningSupply }
      ]
    });
    if (!supplier)
      throw { message: 'Cleaning Supply not found' };
    return res.status(200).json(supplier);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'suppleir.controller.getDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    let { page = 0, limit = 10, sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter, keyword } = req.query;
    let { supplier_id } = req.params;
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
      field_list = ['name', 'branch'];
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
    if (supplier_id) {
      fields[and] = [{ supplier_id }]
    }
    const list = await Supplier.findAll({
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
    await ErrorLog.create({ location: 'supplier.controller.getList', message: error_message });
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
      field_list = ['name', 'branch'];
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
    const count = await Supplier.count({
      where: fields,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(count);
  } catch (err) {
    // console.log(error);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supplier.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { supplier_id } = req.params;
    await Supplier.destroy({ where: { id: supplier_id }, transaction: t });
    await SupplierProduct.destroy({ where: { supplier_id: supplier_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supplier.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updateProduct (req, res) {
  const t = await model.transaction();
  try {
    let { supplier_id } = req.params;
    let { cleaning_supplies } = req.body;
    await SupplierProduct.destroy({ where: { supplier_id: supplier_id }, transaction: t });
    let supplier_products = [];
    for (let cleaning_supply_id of cleaning_supplies) {
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
    await ErrorLog.create({ location: 'supplier.controller.updateProduct', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function exportFile (req, res) {
  try {
    const list = await Supplier.findAll();
    let headers = [];
    if (!list.length)
      throw { message: 'No data to export.' };
    for (let prop in list[0].dataValues) {
      headers.push(prop);
    }
    const result = await json2csv(headers, list);
    let today = new Date();
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let filename = `suppliers_${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear()}_${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.csv`;
    await writeCsvFile(filename, result);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supplier.controller.exportFile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getDetail as getDetail, getList as getList, create as create, update as update, remove as remove, count as count, updateProduct as updateProduct, exportFile };
const defaultExport = { getDetail, getList, create, update, remove, count, updateProduct, exportFile };
export default defaultExport;