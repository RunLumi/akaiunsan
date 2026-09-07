import { Charge } from './../models/index.ts';

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

export { recordChargeDetail };