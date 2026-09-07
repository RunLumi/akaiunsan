module.exports = (sequelize, DataTypes) =>{
  const SupplyOrder = sequelize.define('SupplyOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
  }, {
    tableName: 'supply_order'
  });
  return SupplyOrder;
}