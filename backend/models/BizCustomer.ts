export default (sequelize, DataTypes) =>{
  const BizCustomer = sequelize.define('BizCustomer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    company_name: {
      type: DataTypes.STRING
    },
    remark: {
      type: DataTypes.TEXT
    },
  }, {
    tableName: 'biz_customer'
  });
  return BizCustomer;
}