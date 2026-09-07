export default (sequelize, DataTypes) => {
  const SupplyOrderDetail = sequelize.define('SupplyOrderDetail', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
  }, {
    tableName: 'supply_order_detail'
  });
  return SupplyOrderDetail;
}