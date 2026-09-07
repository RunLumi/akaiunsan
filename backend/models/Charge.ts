export default (sequelize, DataTypes) =>{
  const Charge = sequelize.define('Charge', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    omise_charge_id: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.STRING
    },
    amount: {
      type: DataTypes.INTEGER
    },
    payment_method: {
      type: DataTypes.STRING
    },
    object_name: {
      type: DataTypes.STRING
    },
    object_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'charge'
  });
  return Charge;
}