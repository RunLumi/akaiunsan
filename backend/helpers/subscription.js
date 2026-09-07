const dayjs = require("dayjs");
const { Subscription, SubscriptionTransaction } = require("./../models");
const { Op } = require("sequelize");
const OmiseHelper = require("./../helpers/omise");
const PaymentHelper = require("./../helpers/payment");
const CustomerHelper = require("./../helpers/customer");

const findSubscriptionByCustomerId = async (customerId, status = "active") => {
  return await Subscription.findOne({
    where: {
      customer_id: customerId,
      status,
    },
  });
};

const findSubscriptionById = async (subscriptionId) => {
  return await Subscription.findOne({ id: subscriptionId });
};

const createSubscription = async (customerId, totalHours, jobType, address_id) => {
  return await Subscription.create({
    customer_id: customerId,
    total_hour: totalHours,
    used_hour: 0,
    job_type: jobType,
    status: "active",
    next_payment: dayjs().add(1, "month").format("YYYY-MM-DD"),
    address_id
  });
};

const createSubscriptionTransaction = async (
  subscriptionId,
  amount,
  action,
  jobId,
  adminId
) => {
  return await SubscriptionTransaction.create({
    subscription_id: subscriptionId,
    job_id: jobId,
    admin_id: adminId,
    amount,
    action,
  });
};

/**
 * Use for prevent to charge twice a day when manually call processSubscriptionsPayment
 * @param {subscriptionId} subscriptionId
 */
const isSubscriptionTransactionProcessed = async (subscriptionId) => {
  const founds = await SubscriptionTransaction.findAll({
    where: {
      subscription_id: subscriptionId,
      action: "buy (recurring)",
    },
  });

  if (founds.length > 0) {
    let isProcessed = false;
    for (const found of founds) {
      if (dayjs(found.createdAt).isSame(dayjs(), "day")) {
        isProcessed = true;
      }
    }
    return isProcessed;
  }
  return false;
};

// *This method is meant to use with cronjob
const processSubscriptionsPayment = async () => {
  const HOUR_WAGE = 150;
  // get all active and suspended subscriptions.
  const subscriptions = await Subscription.findAll({
    where: {
      [Op.or]: [
        {
          status: "active",
        },
        {
          status: "suspended",
        },
      ],
    },
  });

  for (const subscription of subscriptions) {
    if (dayjs().isSame(dayjs(subscription.next_payment), "day")) {
      console.log("process payment for", subscription.id);
      if (!(await isSubscriptionTransactionProcessed(subscription.id))) {
        const customerDetail = await CustomerHelper.findCustomerById(
          subscription.customer_id
        );
        const chargeAmount = subscription.total_hour * HOUR_WAGE;
        // charge default card
        try {
          const chargeDetail = await OmiseHelper.chargeCustomerCardById(
            customerDetail.omise_customer_id,
            chargeAmount
          );
          // save charge detail
          await PaymentHelper.recordChargeDetail(
            chargeDetail.id,
            chargeDetail.amount,
            "credit_card",
            "",
            888,
            customerDetail.id,
            chargeDetail.status
          );

          // reset subscription
          subscription.used_hour = 0;
          subscription.status = "active";
          const nextPayment = dayjs(subscription.next_payment)
            .add(1, "month")
            .format("YYYY-MM-DD");
          subscription.next_payment = nextPayment;
          await subscription.save();

          // record to subscription transaction
          await createSubscriptionTransaction(
            subscription.id,
            subscription.total_hour,
            "buy (recurring)",
            null,
            null
          );
        } catch (e) {
          // In case of charge fail, will try to charge tomorrow
          const nextChargeDate = dayjs(subscription.next_payment)
            .add(1, "day")
            .format("YYYY-MM-DD");
          subscription.next_payment = nextChargeDate;
          subscription.status = "suspended"; // mark as suspended due to the payment fail
          await subscription.save();
        }
      } else {
        console.log("Subscription transaction is already processed. Skip");
      }
    }
  }
};

module.exports = {
  findSubscriptionByCustomerId,
  createSubscription,
  createSubscriptionTransaction,
  findSubscriptionById,
  processSubscriptionsPayment,
};
