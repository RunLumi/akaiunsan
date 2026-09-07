module.exports = (sequelize, DataTypes) =>{
  const CleaningSupply = sequelize.define('CleaningSupply', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    price: {
      type: DataTypes.FLOAT
    },
  }, {
    tableName: 'cleaning_supply'
  });
  return CleaningSupply;
}