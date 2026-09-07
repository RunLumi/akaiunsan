export default (sequelize, DataTypes) => {
  const RequestHelperStatus = sequelize.define('RequestHelperStatus', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    status_name: {
      type: DataTypes.STRING(50)
    }
  }, {
    tableName: 'request_helper_status'
  });
  return RequestHelperStatus;
}