export default (sequelize, DataTypes) =>{
  const Banner = sequelize.define('Banner', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    active: {
      type: DataTypes.BOOLEAN
    },
    ordering: {
      type: DataTypes.INTEGER
    },
    start_date: {
      type: DataTypes.STRING(10)
    },
    end_date: {
      type: DataTypes.STRING(10)
    }
  }, {
    tableName: 'banner'
  });
  return Banner;
}