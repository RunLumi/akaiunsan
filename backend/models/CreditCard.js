module.exports = (sequelize, DataTypes) => {
  const CreditCard = sequelize.define('CreditCard', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    expiration_month: {
      type: DataTypes.INTEGER
    },
    expiration_year: {
      type: DataTypes.INTEGER
    },
    brand: {
      type: DataTypes.STRING
    },
    last_digits: {
      type: DataTypes.STRING
    },
    omise_card_id: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'credit_card'
  });
  return CreditCard;
}