import fs from 'fs';
import omiseFactory from 'omise';
import { loadConfig } from '../helpers/config.ts';

const NODE_ENV = process.env.NODE_ENV || 'local';
const key = loadConfig(NODE_ENV);

const omise = (omiseFactory as any)({
    omiseVersion: key.omise.omiseVersion,
    secretKey: key.omise.secretKey
})

const createOmiseCustomer = async (email, description, card) => {
    try {
        const omiseDetail = await omise.customers.create({
            email,
            description,
            card
        })
        console.log(omiseDetail)
        return omiseDetail.id
    } catch (e) {
        console.error(e)
        throw new Error(e.message)
    }
}

const findOmiseCustomerById = async (omiseId) => {
    try {
        return await omise.customers.retrieve(omiseId)
    } catch (e) {
        console.error(e)
        throw new Error(e.message)
    }
} 


const chargeCustomerCardById = async (omiseId, amount, cardId) => {
    try {
        const chargeData = {
            amount,
            currency: 'thb',
            customer: omiseId,
        }
        if (cardId) {
            chargeData.card = cardId
        }
        return omise.charges.create(chargeData)
    } catch (e) {
        console.error(e)
        throw new Error(e.message)
    }
}

const getCustomerCardsById = async (omiseId) => {
    try {
        const { data } = await omise.customers.retrieveCard(omiseId)
        return data;
    } catch (e) {
        console.error(e)
        throw new Error(e.message)
    }
}

const attachOmiseCard = async (omise_customer_id, card_token) => {
    try {
        const omise_customer = await omise.customers.update(
            omise_customer_id,
            { card: card_token }
        )
        console.log(omise_customer)
        return omise_customer
    } catch (e) {
        console.error(e)
        throw new Error(e.message)
    }
}

const removeOmiseCard = async (omise_customer_id, omise_card_id) => {
    try {
        const omise_card = await omise.customers.update(
            omise_customer_id,
            omise_card_id
        )
        return omise_card
    } catch (e) {
        console.error(e)
        throw new Error(e.message)
    }
}

export { createOmiseCustomer, findOmiseCustomerById, chargeCustomerCardById, getCustomerCardsById, attachOmiseCard, removeOmiseCard };