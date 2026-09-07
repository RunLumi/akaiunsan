export default (sequelize, DataTypes) =>{
  const Customer = sequelize.define('Customer', {
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
    email: {
      type: DataTypes.STRING
    },
    display_name: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    },
    phone_number: {
      type: DataTypes.STRING
    },
    line_id: {
      type: DataTypes.STRING
    },
    facebook_name: {
      type: DataTypes.STRING
    },
    authData: {
      type: DataTypes.TEXT
    },
    profile_image_url: {
      type: DataTypes.STRING
    },
    active: {
      type: DataTypes.BOOLEAN
    },
    omise_customer_id: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'customer'
  });
  return Customer;
}