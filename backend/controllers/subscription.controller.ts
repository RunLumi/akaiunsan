import db from '../models/index.ts';
const { Subscription, ErrorLog } = db;
import SubscriptionHelper from "./../helpers/subscription.ts";
import OmiseHelper from "./../helpers/omise.ts";
import PaymentHelper from "./../helpers/payment.ts";
let error_status = 500;
let error_message = 'Unexpected error';

async function getList (req, res) {
  try {
    let { page = 0, limit = 10, sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter, keyword } = req.query;
    let { customer_id } = req.params;
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
      field_list = ['status', 'job_type', 'total_hour'];
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
    if (customer_id) {
      fields[and] = [{ customer_id }]
    }
    const list = await Subscription.findAll({
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

const findSubscription = async (req, res) => {
  try {
    let { subscription_id } = req.params;
    const subscription = await Subscription.findOne({
      where: { id: subscription_id }
    });
    if (!subscription)
      throw { message: 'Subscription not found' };
    return res.status(200).json(subscription);
  } catch (e) {
    return res.status(400).send({
      message: e.message,
    });
  }
};

const createSubscription = async (req, res) => {
  const {
    total_hour, // (REQUIRED)
    job_type, // (REQUIRED)
    card_id, // (OPTIONAL) customer select their saved card to process payment
    charge_amount, // (required) calculate from price server
    address_id // (required)
  } = req.body;

  try {
    const found = await SubscriptionHelper.findSubscriptionByCustomerId(
      req.customer.id
    );
    if (found) {
      throw new Error(
        "You have running subscription. You have to cancel old subscription before create new subscription."
      );
    }
    if (!card_id) {
      throw new Error(
        "Please insert your credit card in order to proceed."
      );
    }
    if (!address_id) {
      throw new Error(
        "Please specify your address for subscription."
      );
    }
    let chargeDetail = null;
    chargeDetail = await OmiseHelper.chargeCustomerCardById(
      req.user.omise_customer_id,
      charge_amount,
      card_id
    );
    const subscriptionData = await SubscriptionHelper.createSubscription(
      req.user.id,
      total_hour,
      job_type,
      address_id
    );
    // save charge detail
    await PaymentHelper.recordChargeDetail(
      chargeDetail.id,
      chargeDetail.amount,
      "credit_card",
      "subscription",
      subscriptionData.id,
      req.user.id,
      chargeDetail.status
    );

    await SubscriptionHelper.createSubscriptionTransaction(
      subscriptionData.id,
      total_hour,
      "buy",
      null,
      null
    );

    return res.status(201).send({
      result: subscriptionData,
    });
  } catch (e) {
    return res.status(400).send({
      message: e.message,
    });
  }
};

const cancelSubscription = async (req, res) => {
  const { subscriptionId } = req.params;
  try {
    const subscriptionData = await SubscriptionHelper.findSubscriptionById(
      subscriptionId
    );
    if (subscriptionData.status !== "active") {
      throw new Error("You cannot cancel subscription that not active.");
    }
    await SubscriptionHelper.createSubscriptionTransaction(
      subscriptionData.id,
      subscriptionData.total_hour - subscriptionData.used_hour,
      "cancel",
      null,
      null
    );

    subscriptionData.status = "cancel";
    await subscriptionData.save();
    return res.status(201).send({
      result: subscriptionData,
    });
  } catch (e) {
    return res.status(400).send({
      message: e.message,
    });
  }
};

const processSubscriptionsPayment = async (req, res) => {
  await SubscriptionHelper.processSubscriptionsPayment();
};

export { getList, findSubscription, createSubscription, cancelSubscription, processSubscriptionsPayment };
