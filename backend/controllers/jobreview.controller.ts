import { JobReview, ErrorLog } from '../models/index.ts';
import __interop_model from '../models/index.ts';
import __esModuleChain_Op from 'sequelize';
const model = (__interop_model as any).sequelize;
const { substring, or, and } = (__esModuleChain_Op as any).Op;
let error_status = 500;
let error_message = 'Unexpected error';

async function getDetail (req, res) {
  try {
    let { job_review_id } = req.params;
    let where_clause;
    if (req.customer) {
      let customer_id = req.customer.id;
      where_clause = { id: job_review_id, customer_id };
    } else {
      where_clause = { id: job_review_id };
    }
      const job_review = await JobReview.findOne({ where: where_clause });
      if (!job_review)
        throw { message: 'JobReview not found' };
      return res.status(200).json(job_review);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'jobreview.controller.getDetail', message: error_message });
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
      field_list = ['rating'];
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
    const list = await JobReview.findAll({
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
    await ErrorLog.create({ location: 'jobreview.controller.getList', message: error_message });
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
      field_list = ['rating'];
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
    const count = await JobReview.count({
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
    await ErrorLog.create({ location: 'jobreview.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { job_review_id } = req.params;
    let { rating, comment } = req.body;
    const result = await JobReview.update({ rating, comment },
      { where: { id: job_review_id }, transaction: t });
    await t.commit();
    return res.status(200).json(result);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'jobreview.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { job_review_id } = req.params;
    let where_clause;
    if (req.customer) {
      where_clause = { id: job_review_id, customer_id: req.customer.id };
    } else {
      where_clause = { id: job_review_id };
    }
    await JobReview.destroy({ where: where_clause, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'jobreview.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getDetail as getDetail, getList as getList, remove as remove, count as count, update };
const defaultExport = { getDetail, getList, remove, count, update };
export default defaultExport;