export default (sequelize, DataTypes) => {
  const ErrorLog = sequelize.define('ErrorLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    message: {
      type: DataTypes.TEXT
    },
    location: {
      type: DataTypes.STRING
    },
  }, {
    tableName: 'error_log'
  });
  return ErrorLog;
}