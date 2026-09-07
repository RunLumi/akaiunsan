export default (sequelize, DataTypes) =>{
    const RequestDriver = sequelize.define('RequestDriver', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    driving_area: {
      type: DataTypes.TEXT
    },
    has_car: {
      type: DataTypes.BOOLEAN
    },
    car_type: {
      type: DataTypes.STRING
    },
    car_type_other: {
      type: DataTypes.STRING
    },
    car_gear_type: {
      type: DataTypes.STRING
    },
    expect_language: {
      type: DataTypes.STRING
    },
    prefer_age_range: {
      type: DataTypes.STRING
    },
    work_day: {
      type: DataTypes.STRING
    },
    work_time: {
      type: DataTypes.STRING
    },
    any_driver: {
      type: DataTypes.BOOLEAN
    },
    is_ot: {
      type: DataTypes.BOOLEAN
    },
    expect_salary: {
      type: DataTypes.STRING
    },
    start_hiring: {
      type: DataTypes.STRING
    },
    interview_channel: {
      type: DataTypes.STRING
    },
    replacement_guarantee: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'request_driver'
  });
  return RequestDriver;
}