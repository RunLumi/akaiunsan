module.exports = (sequelize, DataTypes) =>{
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    branch: {
      type: DataTypes.STRING
    },
  }, {
    tableName: 'supplier'
  });
  return Supplier;
}