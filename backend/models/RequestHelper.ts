export default (sequelize, DataTypes) =>{
  const RequestHelper = sequelize.define('RequestHelper', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    status_id: {
      type: DataTypes.INTEGER
    },
    status_name: {
      type: DataTypes.STRING(100)
    },
    contact_name: {
      type: DataTypes.STRING(50)
    },
    phone_number: {
      type: DataTypes.STRING(20)
    },
    line_id: {
      type: DataTypes.STRING(20)
    },
    email: {
      type: DataTypes.STRING(30)
    },
    province_id: {
      type: DataTypes.INTEGER
    },
    province_name_th: {
      type: DataTypes.STRING(50)
    },
    province_name_en: {
      type: DataTypes.STRING(50)
    },
    district_id: {
      type: DataTypes.INTEGER
    },
    district_name_th: {
      type: DataTypes.STRING(30)
    },
    district_name_en: {
      type: DataTypes.STRING(30)
    },
    sub_district_id: {
      type: DataTypes.INTEGER
    },
    sub_district_name_th: {
      type: DataTypes.STRING(30)
    },
    sub_district_name_en: {
      type: DataTypes.STRING(30)
    },
    type_of_building: {
      type: DataTypes.STRING(30)
    },
    address_detail: {
      type: DataTypes.TEXT
    },
    floor: {
      type: DataTypes.INTEGER
    },
    request_type: {
      type: DataTypes.STRING(10)
    },
    employer_nationality: {
      type: DataTypes.STRING(20)
    },
    request_helper_code: {
      type: DataTypes.STRING(10)
    }
  }, {
    tableName: 'request_helper'
  });
  return RequestHelper;
}