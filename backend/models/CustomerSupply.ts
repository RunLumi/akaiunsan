export default (sequelize, DataTypes) =>{
  const CustomerSupply = sequelize.define('CustomerSupply', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_date: {
      type: DataTypes.DATE
    },
    total_supply_cost: {
      type: DataTypes.FLOAT
    },
    maid_quantity: {
      type: DataTypes.INTEGER
    },
    maid_salary: {
      type: DataTypes.FLOAT
    },
    total_maid_salary: {
      type: DataTypes.FLOAT
    },
    total_cost: {
      type: DataTypes.FLOAT
    },
    total_price: {
      type: DataTypes.FLOAT
    },
    remark: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'customer_supply'
  });
  return CustomerSupply;
}