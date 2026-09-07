module.exports = (sequelize, DataTypes) =>{
  const SubDistrict = sequelize.define('SubDistrict', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sub_district_name_th: {
      type: DataTypes.STRING
    },
    sub_district_name_en: {
      type: DataTypes.STRING
    },
    zip_code: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'th_subdistrict'
  });
  return SubDistrict;
}