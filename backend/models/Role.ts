export default (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role_name: {
      type: DataTypes.STRING
    },
    permission: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'role'
  });
  return Role;
}