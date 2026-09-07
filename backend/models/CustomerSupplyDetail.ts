export default (sequelize, DataTypes) =>{
  const CustomerSupplyDetail = sequelize.define('CustomerSupplyDetail', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cleaning_supply_id: {
      type: DataTypes.INTEGER
    },
    cleaning_supply_name: {
      type: DataTypes.STRING
    },
    unit_price: {
      type: DataTypes.FLOAT
    },
    quantity: {
      type: DataTypes.INTEGER
    },
    total: {
      type: DataTypes.FLOAT
    }
  }, {
    tableName: 'customer_supply_detail'
  });
  return CustomerSupplyDetail;
}