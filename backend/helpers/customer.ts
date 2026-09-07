import { Customer, CreditCard } from './../models/index.ts';

const findCustomerByEmail = async (email) => {
    const found = await Customer.findOne({ where: { email }});
    if (!found) {
        throw Error(`Customer does not found.`);
    }
    return found;
}

const findCustomerById = async (customerId) => {
    const found = await Customer.findOne({ where: { id: customerId } });
    if (!found) {
        throw Error(`Customer does not found.`);
    }
    return found;
}

const saveCustomerOmiseId = async (customerId, omiseId) => {
    const customerDetail = await findCustomerById(customerId);
    customerDetail.omise_customer_id = omiseId;
    return await customerDetail.save();
}

const saveCustomerCards = async (customerId, cards) => {
    for (const card of cards) {
        await CreditCard.findOrCreate({
            where: {
                customer_id: customerId,
                omise_card_id: card.id,
            },
            defaults: {
                customer_id: customerId,
                name: card.name,
                expiration_month: card.expiration_month,
                expiration_year: card.expiration_year,
                brand: card.brand,
                last_digits: card.last_digits,
                omise_card_id: card.id,
            }
        })
    }
}

const findCustomerCards = async (customerId) => {
    return await CreditCard.findAll({ where: { customer_id: customerId } })
}


export { findCustomerByEmail, findCustomerById, saveCustomerOmiseId, saveCustomerCards, findCustomerCards };