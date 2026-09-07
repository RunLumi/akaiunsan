module.exports = (sequelize, DataTypes) =>{
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    total_hour: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.STRING
    },
    job_type: {
      type: DataTypes.STRING
    },
    used_hour: {
      type: DataTypes.INTEGER
    },
    next_payment: {
      type: DataTypes.DATE,
    }
  }, {
    tableName: 'subscription'
  });
  return Subscription;
}