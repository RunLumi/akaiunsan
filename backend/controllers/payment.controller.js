const OmiseHelper = require('./../helpers/omise')
const CustomerHelper = require('./../helpers/customer')
const PaymentHelper = require('./../helpers/payment')

/**
 * For both new and existing omise customer
 * @param card_token for customer that does not have any omiseId yet.
 * @param card_id for existed omise customer whom already have saved card on the omise and select the card for the payment
 * 
 * TODO Link with order when the charge was success
 */
const makePayment = async (req, res) => {
    const { card_token, card_id } = req.body;
    const chargeAmount = 3000

    try {
        if (!req.user.omise_customer_id || req.user.omise_customer_id.length === 0) {
            // create new omise customer
            const omiseId = await OmiseHelper.createOmiseCustomer(req.user.email, `${req.user.firstname} ${req.user.lastname} (id=${req.user.id})`, card_token);
            // save omiseId to customer data
            await CustomerHelper.saveCustomerOmiseId(req.user.id, omiseId);

            // save customer cards
            await CustomerHelper.saveCustomerCards(req.user.id, await OmiseHelper.getCustomerCardsById(req.user.omise_customer_id))

            const chargeDetail = await OmiseHelper.chargeCustomerCardById(omiseId, chargeAmount)
            await PaymentHelper.recordChargeDetail(
                chargeDetail.id,
                chargeDetail.amount,
                'credit_card',
                '',
                888,
                req.user.id,
                chargeDetail.status 
            )
            // Charge card successfully.
            // ... update order


        } else {
            // customer already have omiseId presented
            await OmiseHelper.findOmiseCustomerById(req.user.omise_customer_id);

            let chargeDetail = null
            if (card_id) {
                // charge specific card
                chargeDetail = await OmiseHelper.chargeCustomerCardById(req.user.omise_customer_id, chargeAmount, card_id)
            } else {
                // Charge default card
                chargeDetail = await OmiseHelper.chargeCustomerCardById(req.user.omise_customer_id, chargeAmount)
            }
            console.log(chargeDetail)
            await PaymentHelper.recordChargeDetail(
                chargeDetail.id,
                chargeDetail.amount,
                'credit_card',
                '',
                888,
                req.user.id,
                chargeDetail.status 
            )
            // Charge card successfully.
            // ... update order

        }

        return res.status(200).send({ result: req.user })
    } catch (e) {
        return res.status(400).send({ message: e.message });
    }
}

/**
 * Get customer saved cards on omise.
 * 
 * @return cards[]
 */
const getCustomerCards = async (req, res) => {
    try {
        if (!req.user.omise_customer_id) {
            throw new Error(`Customer does not have any saved cards.`)
        }
        await CustomerHelper.saveCustomerCards(
            req.user.id, 
            await OmiseHelper.getCustomerCardsById(req.user.omise_customer_id)
        );
        const cards = await CustomerHelper.findCustomerCards(req.user.id);
        return res.status(200).send({ result: cards })
    } catch (e) {
        return res.status(400).send({ message: e.message });
    }
}

module.exports = {
    makePayment,
    getCustomerCards
}