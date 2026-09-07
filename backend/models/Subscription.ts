export default (sequelize, DataTypes) =>{
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
    // job.controller filters subscriptions on `active` (legacy flag) while
    // subscription.controller uses `status` — the model needs both to match
    // the production table and keep job creation testable.
    active: {
      type: DataTypes.BOOLEAN
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