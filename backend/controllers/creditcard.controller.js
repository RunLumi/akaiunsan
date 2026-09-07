const { Customer, CreditCard, ErrorLog } = require('../models');
const model = require('../models').sequelize;
const { substring, or, and } = require('sequelize').Op;
const { findCustomerById } = require('../helpers/customer');
const { createOmiseCustomer, attachOmiseCard, removeOmiseCard } = require('../helpers/omise');
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  const t = await model.transaction();
  try {
    let { name, expiration_month, expiration_year,
      brand, last_digits, card_token } = req.body;
    let customer_id = req.customer.id;
    const customer = await findCustomerById(customer_id);
    if (customer.omise_customer_id) {
      const customer = await attachOmiseCard(customer.omise_customer_id, card_token);
      let card = customer.cards.data.slice(-1)[0];
      const result = await CreditCard.create({ name, expiration_month, expiration_year,
        brand, last_digits, omise_card_id: card.id, customer_id }, { transaction: t });
      await t.commit();
      return res.status(200).json(result);
    } else {
      const omise_detail = await createOmiseCustomer(customer.email, `${customer.firstname} ${customer.lastname} (id: ${customer.id})`, card_token);
      let { card } = omise_detail;
      await Customer.update({ omise_card_id: omise_detail.id }, { where: { id: customer_id }, transaction: t });
      const result = await CreditCard.create({ name, expiration_month, expiration_year,
        brand, last_digits, omise_card_id: card.id, customer_id }, { transaction: t });
      await t.commit();
      return res.status(200).json(result);
    }
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'creditcard.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { credit_card_id } = req.params;
    let customer_id = req.customer.id;
    const credit_card = await CreditCard.findOne({ where: { id: credit_card_id, customer_id }});
    if (!credit_card)
      throw { message: 'Credit card not found' };
    return res.status(200).json(credit_card);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'creditcard.controller.getDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    let { page = 0, limit = 10, sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter } = req.query;
    let customer_id = req.customer.id;
    page = page - 1;
    let offset = (!page) ? 0 : limit * page;
    if (offset < 0)
      offset = 0;
    let fields = {};
    if (filter) {
      Object.keys(filter).forEach(prop => {
        fields[prop] = filter[prop];
      });
    }
    fields[and] = [{ customer_id }]
    const list = await CreditCard.findAll({
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
    await ErrorLog.create({ location: 'creditcard.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function count (req, res) {
  try {
    let { sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter } = req.query;
    let customer_id = req.customer.id;
    let fields = {};
    if (filter) {
      Object.keys(filter).forEach(prop => {
        fields[prop] = filter[prop];
      });
    }
    fields[and] = [{ customer_id }];
    const count = await CreditCard.count({
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
    await ErrorLog.create({ location: 'creditcard.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { credit_card_id } = req.params;
    let customer_id = req.customer.id;
    const credit_card = await CreditCard.findOne({
      where: { id: credit_card_id },
      include: [
        { model: Customer }
      ]
    });
    await CreditCard.destroy({ where: { id: credit_card_id, customer_id }, transaction: t });
    await t.commit();
    await removeOmiseCard(credit_card.Customer.omise_customer_id, credit_card.omise_card_id);
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'creditcard.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

module.exports = {
  getDetail: getDetail,
  getList: getList,
  create: create,
  remove: remove,
  count: count,
}