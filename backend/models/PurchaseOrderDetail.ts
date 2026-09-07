export default (sequelize, DataTypes) =>{
  const PurchaseOrderDetail = sequelize.define('PurchaseOrderDetail', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
  }, {
    tableName: 'purchase_order_detail'
  });
  return PurchaseOrderDetail;
}