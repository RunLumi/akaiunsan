module.exports = (sequelize, DataTypes) =>{
  const SupplierProduct = sequelize.define('SupplierProduct', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
  }, {
    tableName: 'supplier_product'
  });
  return SupplierProduct;
}