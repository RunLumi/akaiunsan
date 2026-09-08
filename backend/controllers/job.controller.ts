import { Job, JobDetail, Customer, ErrorLog, Subscription, SubscriptionTransaction, JobReview, Supporter } from '../models/index.ts';
import __interop_model from '../models/index.ts';
import __esModuleChain_Op from 'sequelize';
import * as OmiseHelper from './../helpers/omise.ts';
import * as PaymentHelper from './../helpers/payment.ts';
const model = (__interop_model as any).sequelize;
const { substring, or, and } = (__esModuleChain_Op as any).Op;
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  const t = await model.transaction();
  try {
    let { job_type, remark, expect_work_hour, omise_card_id,
      address_glat, address_glng, address_detail, address_sub_district,
      address_district, address_province, phone_number, schedule, requested_helper_id, base_price,
      full_price, total_discount, final_price, customer_id, payment_method, job_details = [] } = req.body;
    if (req.customer)
      customer_id = req.customer.id;
    const subscription = await Subscription.findOne({ where: { active: true, customer_id, job_type }});
    if (subscription) {
      payment_method = 'subscription';
    }
    const result = await Job.create({ status: 'waiting', job_type, remark, expect_work_hour,
      address_glat, address_glng, address_detail, address_sub_district, payment_method,
      address_district, address_province, schedule, requested_helper_id, omise_card_id, base_price,
      phone_number, full_price, total_discount, final_price, customer_id }, { transaction: t });
    for (let detail of job_details) {
      detail.job_id = result.id;
    }
    await JobDetail.bulkCreate(job_details, { transaction: t });
    if (subscription) {
      let used_hour = subscription.used_hour;
      used_hour += expect_work_hour;
      await Subscription.update({ used_hour }, { where: { active: true, customer_id }, transaction: t });
      await SubscriptionTransaction.create({ amount: expect_work_hour, action: 'consume' }, { transaction: t });
      await t.commit();
      return res.status(200).json(result);
    } else {
      await t.commit();
      return res.status(200).json(result);
    }
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'job.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let { job_id } = req.params;
    let { schedule, job_details, full_price, total_discount, total_price } = req.body;
    await Job.update({ schedule, full_price, total_discount, total_price },
      { where: { id: job_id }, transaction: t });
    await JobDetail.destroy({ where: { id: job_id }, transaction: t });
    for (let detail of job_details) {
      detail.job_id = job_id;
    }
    await JobDetail.bulkCreate(job_details, { transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'job.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { job_id } = req.params;
    let where_clause: any = { id: job_id };
    if (req.customer)
      where_clause.customer_id = req.customer.id;
    const job = await Job.findOne({
      where: where_clause,
      include: [
        { model: JobDetail }
      ]
    });
    if (!job)
      throw { message: 'Job not found' };
    return res.status(200).json(job);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'job.controller.getDetail', message: error_message });
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
      let field_list = ['status', 'job_type',
        'address_sub_district', 'address_district', 'address_province'];
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
    const list = await Job.findAll({
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
    await ErrorLog.create({ location: 'job.controller.getList', message: error_message });
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
      let field_list = ['status', 'schedule', 'job_type',
      'address_sub_district', 'address_district', 'address_province',
      'address_glat', 'address_glng'];
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
    const count = await Job.count({
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
    await ErrorLog.create({ location: 'job.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  const t = await model.transaction();
  try {
    let { job_id } = req.params;
    await Job.destroy({ where: { id: job_id }, transaction: t });
    await JobDetail.destroy({ where: { job_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'job.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updateStatus (req, res) {
  const t = await model.transaction();
  try {
    let { job_id, status } = req.params;
    let where_clause: any = { id: job_id };
    if (req.customer)
      where_clause.customer_id = req.customer.id;
    const job = await Job.findOne({ where: where_clause });
    const subscription = await Subscription.findOne({ where: { active: true, customer_id: job.customer_id, job_type: job.job_type }});
    await Job.update({ status },
      { where: where_clause, transaction: t });
    if (status == 'cancel' && job.payment_method == 'subscription' && subscription) {
      let used_hour = subscription.used_hour;
      used_hour -= job.expect_work_hour;
      await Subscription.update({ used_hour }, { where: { active: true, customer_id: job.customer_id }, transaction: t });
      await SubscriptionTransaction.create({ amount: job.expect_work_hour, action: 'cancel_job' }, { transaction: t });
      await t.commit();
      return res.status(200).json(true);
    } else {
      await t.commit();
      return res.status(200).json(true);
    }
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'job.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function matchSupporter (req, res) {
  const t = await model.transaction();
  try {
    let { job_id, supporter_id } = req.params;
    await Job.update({ supporter_id, status: 'match' },
      { where: { id: job_id }, transaction: t });
    const job = await Job.findOne({ where: { id: job_id },
      include: [
        { model: Customer }
      ]});
    if (job.payment_method == 'credit_card') {
      let { omise_card_id, final_price: total_price } = job;
      let { omise_customer_id, id } = job.Customer;
      //charge omise here
      const chargeDetail = await OmiseHelper.chargeCustomerCardById(omise_customer_id, total_price, omise_card_id);
      console.log(chargeDetail);
      await PaymentHelper.recordChargeDetail(
        chargeDetail.id,
        chargeDetail.amount,
        'credit_card',
        'Job',
        job.id,
        id,
        chargeDetail.status 
      );
      await t.commit();
      return res.status(200).json(true);
    } else {
      await t.commit();
      return res.status(200).json(true);
    }
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'job.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function createReview (req, res) {
  const t = await model.transaction();
  try {
    let { job_id } = req.params;
    let { rating, comment } = req.body;
    let customer_id = req.customer.id;
    let { supporter_id } = await Job.findOne({ where: { id: job_id }});
    await JobReview.create({ rating, comment, job_id, customer_id, supporter_id }, { transaction: t });
    const supporter = await Supporter.findOne({ where: { id: supporter_id }});
    const count_job = await Job.count({ where: { supporter_id }});
    let sum = supporter.sum_job_rating || 0;
    if (count_job)
      sum = parseFloat(String((sum + rating)/count_job));
    else
      sum = rating;
    await Supporter.update({ sum_job_rating: sum }, { where: { id: supporter_id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'job.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getReviewDetail (req, res) {
  try {
    let { job_review_id, job_id } = req.params;
    let where_clause: any = { id: job_review_id };
    if (req.customer) {
      where_clause.customer_id = req.customer.id;
      where_clause.job_id = job_id;
    }
    const job_review = await JobReview.findOne({ where: where_clause });
    return res.status(200).json(job_review);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'job.controller.getReviewDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getDetail as getDetail, getList as getList, create as create, update as update, remove as remove, count as count, updateStatus, matchSupporter, createReview, getReviewDetail };
const defaultExport = { getDetail, getList, create, update, remove, count, updateStatus, matchSupporter, createReview, getReviewDetail };
export default defaultExport;