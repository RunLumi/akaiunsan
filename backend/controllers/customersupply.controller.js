const { CustomerSupply, CustomerSupplyDetail, ErrorLog } = require('../models');
const { getCustomerSupplyData } = require('../helpers/util');
const model = require('../models').sequelize;
const { substring, or } = require('sequelize').Op;
let error_status = 500;
let error_message = 'Unexpected error';


async function create (req, res) {
  const t = await model.transaction();
  try {
    let data = req.body;
    let { customer_supply, customer_supply_details } = await getCustomerSupplyData(data);
    const result = await CustomerSupply.create(customer_supply, { transaction: t });
    for (let customer_supply_detail of customer_supply_details) {
      customer_supply_detail.customer_supply_id = result.id;
    }
    await CustomerSupplyDetail.bulkCreate(customer_supply_details, { transaction: t });
    await t.commit();
    return res.status(200).json(result);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customersupply.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { customer_supply_id } = req.params;
    let data = req.body;
    let { customer_supply, customer_supply_details } = await getCustomerSupplyData(data);
    await CustomerSupply.update(customer_supply, { where: { id: customer_supply_id }, transaction: t });
    await CustomerSupplyDetail.destroy({ where: { customer_supply_id }, transaction: t });
    await CustomerSupplyDetail.bulkCreate(customer_supply_details, { transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customersupply.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { customer_supply_id } = req.params;
    const result = await CustomerSupply.findOne({
      where: { id: customer_supply_id },
      include: [
        { model: CustomerSupplyDetail }
      ]
    });
    if (!result)
      throw { message: 'Customer supply not found' }
    return res.status(200).json(result);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customersupply.controller.getDetail', message: error_message });
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
      field_list = ['biz_customer_name'];
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
    const list = await CustomerSupply.findAll({
      where: fields,
      limit: Number(limit),
      offset: offset,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customersupply.controller.getList', message: error_message });
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
      field_list = ['biz_customer_name'];
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
    const count = await CustomerSupply.count({
      where: fields,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(count);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customersupply.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { customer_supply_id } = req.params;
    await CustomerSupply.destroy({ where: { id: customer_supply_id }, transaction: t })
    await CustomerSupplyDetail.destroy({ where: { customer_supply_id }, transaction: t })
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customersupply.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

module.exports = {
  create,
  update,
  getDetail,
  getList,
  count,
  remove
}