export default (sequelize, DataTypes) =>{
  const Job = sequelize.define('Job', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    status: {
      type: DataTypes.STRING
    },
    job_type: {
      type: DataTypes.STRING
    },
    remark: {
      type: DataTypes.TEXT
    },
    expect_work_hour: {
      type: DataTypes.INTEGER
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
    phone_number: {
      type: DataTypes.STRING
    },
    schedule: {
      type: DataTypes.DATE
    },
    requested_helper_id: {
      type: DataTypes.INTEGER
    },
    base_price: {
      type: DataTypes.FLOAT
    },
    full_price: {
      type: DataTypes.FLOAT
    },
    total_discount: {
      type: DataTypes.FLOAT
    },
    final_price: {
      type: DataTypes.FLOAT
    },
    omise_card_id: {
      type: DataTypes.STRING
    },
    payment_method: {
      type: DataTypes.STRING
    },
    // These columns exist in the production `job` table (and every controller
    // filters on them) but were missing from the model — fresh sync()'d
    // databases failed with "Unknown column 'Job.customer_id'".
    customer_id: {
      type: DataTypes.INTEGER
    },
    supporter_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'job'
  });
  return Job;
}