export default (sequelize, DataTypes) =>{
  const BannerLanguage = sequelize.define('BannerLanguage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    lang_code: {
      type: DataTypes.STRING(2)
    },
    title: {
      type: DataTypes.STRING
    },
    link: {
      type: DataTypes.STRING
    },
    image_url: {
      type: DataTypes.STRING
    },
    mobile_image_url: {
      type: DataTypes.STRING
    },
  }, {
    tableName: 'banner_language'
  });
  return BannerLanguage;
}