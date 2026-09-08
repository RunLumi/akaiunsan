// creditcard.controller writes customer.omise_card_id (legacy column name,
// actually stores the omise CUSTOMER id) — the column was missing from the
// baseline schema, so those writes were silently dropped. Add it for real.
'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: sequelize }) => {
    const qi = sequelize.getQueryInterface();
    const desc = await qi.describeTable('customer');
    if (!desc.omise_card_id) {
      await qi.addColumn('customer', 'omise_card_id', { type: DataTypes.STRING });
    }
  },
  down: async ({ context: sequelize }) => {
    const qi = sequelize.getQueryInterface();
    const desc = await qi.describeTable('customer');
    if (desc.omise_card_id) {
      await qi.removeColumn('customer', 'omise_card_id');
    }
  },
};
