module.exports = (sequelize, DataTypes) =>{
  const SupporterEducation = sequelize.define('SupporterEducation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    school: {
      type: DataTypes.STRING
    },
    level: {
      type: DataTypes.STRING
    },
    start_date: {
      type: DataTypes.STRING
    },
    end_date: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'supporter_education'
  });
  return SupporterEducation;
}