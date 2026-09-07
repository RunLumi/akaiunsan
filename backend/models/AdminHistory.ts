module.exports = (sequelize, DataTypes) =>{
  const AdminHistory = sequelize.define('AdminHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    admin_username: {
      type: DataTypes.STRING(30)
    },
    path: {
      type: DataTypes.STRING
    },
    params: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'admin_history'
  });
  return AdminHistory;
}