module.exports = (sequelize, DataTypes) =>{
  const SubscriptionTransaction = sequelize.define('SubscriptionTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: {
      type: DataTypes.INTEGER
    },
    action: {
      type: DataTypes.STRING
    },
    admin_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'subscription_transaction'
  });
  return SubscriptionTransaction;
}