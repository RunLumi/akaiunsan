export default (sequelize, DataTypes) => {
  const SupporterExperience = sequelize.define('SupporterExperience', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    detail: {
      type: DataTypes.TEXT
    },
    employer_nationality: {
      type: DataTypes.STRING
    },
    experience_month: {
      type: DataTypes.INTEGER
    },
    experience_year: {
      type: DataTypes.INTEGER
    },
    start_date: {
      type: DataTypes.STRING
    },
    end_date: {
      type: DataTypes.STRING
    },
    driver_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'supporter_experience'
  });

  return SupporterExperience;
}