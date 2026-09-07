export default (sequelize, DataTypes) =>{
  const Province = sequelize.define('Province', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    province_name_th: {
      type: DataTypes.STRING
    },
    province_name_en: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'th_province'
  });
  return Province;
}