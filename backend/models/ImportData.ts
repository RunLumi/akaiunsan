export default (sequelize, DataTypes) => {
  const ImportData = sequelize.define('ImportData', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    latest_maid_id: {
      type: DataTypes.INTEGER
    },
    latest_driver_id: {
      type: DataTypes.INTEGER
    },
  }, {
    tableName: 'import_data'
  });
  return ImportData;
}