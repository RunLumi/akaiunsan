import { Customer, Address, ErrorLog } from '../models/index.ts';
import { getAddressData } from '../helpers/util.ts';
import { findCustomerById } from './../helpers/customer.ts';
import __interop_model from '../models/index.ts';
import __esModuleChain_Op from 'sequelize';
const model = (__interop_model as any).sequelize;
const { substring, or, and } = (__esModuleChain_Op as any).Op;
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  const t = await model.transaction();
  try {
    let { customer_id } = req.body;
    if (req.customer) {
      customer_id = req.customer.id;
    }
    if (!customer_id)
      throw { message: 'Customer not found' };
    await findCustomerById(customer_id);
    let { address } = await getAddressData(customer_id, req.body);
    const result = await Address.create(address, { transaction: t });
    await t.commit();
    return res.status(200).json(result);
  } catch (err) {
    // console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'address.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { address_id } = req.params;
    let { customer_id } = req.body;
    if (req.customer) {
      customer_id = req.customer.id;
    }
    if (!customer_id)
      throw { message: 'Customer not found' };
    await findCustomerById(customer_id);
    let { address } = await getAddressData(customer_id, req.body);
    await Address.update(address, { where: { id: address_id, customer_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'address.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { address_id } = req.params;
    let where_clause;
    if (req.customer) {
      let customer_id = req.customer.id;
      where_clause = { id: address_id, customer_id };
    } else {
      where_clause = { id: address_id };
    }
      const address = await Address.findOne({ where: where_clause });
      if (!address)
        throw { message: 'Address not found' };
      return res.status(200).json(address);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'address.controller.getDetail', message: error_message });
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
      field_list = ['firstname', 'lastname', 'company_name', 'company_branch', 'tax_id',
        'address_detail', 'address_sub_district', 'address_district', 'address_province',
        'address_country', 'address_postal_code', 'phone_number'];
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
    if (req.customer) {
      fields[and] = [{ customer_id: req.customer.id }]
    }
    const list = await Address.findAll({
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
    await ErrorLog.create({ location: 'address.controller.getList', message: error_message });
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
      field_list = ['firstname', 'lastname', 'company_name', 'company_branch', 'tax_id',
        'address_detail', 'address_sub_district', 'address_district', 'address_province',
        'address_country', 'address_postal_code', 'phone_number'];
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
    if (req.customer) {
      fields[and] = [{ customer_id: req.customer.id }]
    }
    const count = await Address.count({
      where: fields,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(count);
  } catch (error) {
    // console.log(error);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'address.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { address_id } = req.params;
    let where_clause;
    if (req.customer) {
      where_clause = { id: address_id, customer_id: req.customer.id };
    } else {
      where_clause = { id: address_id };
    }
    await Address.destroy({ where: where_clause, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'address.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getDetail as getDetail, getList as getList, create as create, update as update, remove as remove, count as count };
const defaultExport = { getDetail, getList, create, update, remove, count };
export default defaultExport;