module.exports = (sequelize, DataTypes) =>{
  const RequestMaid = sequelize.define('RequestMaid', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type_of_worker: {
      type: DataTypes.STRING
    },
    work_type: {
      type: DataTypes.STRING
    },
    work_day: {
      type: DataTypes.STRING
    },
    work_day_other: {
      type: DataTypes.STRING
    },
    work_time: {
      type: DataTypes.STRING
    },
    helper_nationality: {
      type: DataTypes.STRING
    },
    expect_language: {
      type: DataTypes.STRING
    },
    expect_language_other: {
      type: DataTypes.STRING
    },
    require_cooking: {
      type: DataTypes.BOOLEAN
    },
    cooking_type: {
      type: DataTypes.STRING
    },
    any_kid: {
      type: DataTypes.BOOLEAN
    },
    amount_kid: {
      type: DataTypes.INTEGER
    },
    age_month: {
      type: DataTypes.STRING
    },
    age_year: {
      type: DataTypes.STRING
    },
    any_pet: {
      type: DataTypes.BOOLEAN
    },
    amount_pet: {
      type: DataTypes.INTEGER
    },
    type_of_pet: {
      type: DataTypes.STRING
    },
    amount_current_helper: {
      type: DataTypes.INTEGER
    },
    special_requirement: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'request_maid'
  });
  return RequestMaid;
}