export default (sequelize, DataTypes) =>{
  const JobDetail = sequelize.define('JobDetail', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    detail: {
      type: DataTypes.STRING
    },
    value: {
      type: DataTypes.STRING
    },
    price: {
      type: DataTypes.FLOAT
    }
  }, {
    tableName: 'job_detail'
  });
  return JobDetail;
}