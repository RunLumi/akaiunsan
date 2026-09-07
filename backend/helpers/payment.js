const { Charge } = require('./../models')

const recordChargeDetail = async (
    omise_charge_id,
    amount,
    payment_method,
    object_name,
    object_id,
    customer_id,
    status
) => {
    try {
        return await Charge.create({
            omise_charge_id,
            amount,
            payment_method,
            object_name,
            object_id,
            customer_id,
            status
        })
    } catch (e) {
        throw new Error(e.message)
    }
}

module.exports = {
    recordChargeDetail
}