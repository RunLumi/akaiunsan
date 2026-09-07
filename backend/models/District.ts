export default (sequelize, DataTypes) => {
  const District = sequelize.define('District', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    district_name_th: {
      type: DataTypes.STRING
    },
    district_name_en: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'th_district'
  });
  return District;
}