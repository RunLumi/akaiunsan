export default (sequelize, DataTypes) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstname: {
      type: DataTypes.STRING
    },
    lastname: {
      type: DataTypes.STRING
    },
    company_name: {
      type: DataTypes.STRING
    },
    company_branch: {
      type: DataTypes.STRING
    },
    tax_id: {
      type: DataTypes.STRING
    },
    address_meta: {
      type: DataTypes.JSON
    },
    address_type: {
      type: DataTypes.STRING
    },
    address_glat: {
      type: DataTypes.STRING
    },
    address_glng: {
      type: DataTypes.STRING
    },
    address_detail: {
      type: DataTypes.TEXT
    },
    address_sub_district: {
      type: DataTypes.STRING
    },
    address_district: {
      type: DataTypes.STRING
    },
    address_province: {
      type: DataTypes.STRING
    },
    address_country: {
      type: DataTypes.STRING
    },
    address_postal_code: {
      type: DataTypes.STRING
    },
    phone_number: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'address'
  });
  return Address;
}