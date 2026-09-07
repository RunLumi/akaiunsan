export default (sequelize, DataTypes) => {
  const SupporterViewCount = sequelize.define('SupporterViewCount', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    count: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'supporter_view_count'
  });

  return SupporterViewCount;
}