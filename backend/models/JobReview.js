module.exports = (sequelize, DataTypes) =>{
  const JobReview = sequelize.define('JobReview', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rating: {
      type: DataTypes.INTEGER
    },
    text: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'job_review'
  });
  return JobReview;
}