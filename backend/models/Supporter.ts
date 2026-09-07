export default (sequelize, DataTypes) => {
  const Supporter = sequelize.define(
    "Supporter",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      profile_image_url: {
        type: DataTypes.STRING,
      },
      firstname: {
        type: DataTypes.STRING,
      },
      display_name: {
        type: DataTypes.STRING,
      },
      gender: {
        type: DataTypes.STRING,
      },
      birthday: {
        type: DataTypes.DATE,
      },
      weight: {
        type: DataTypes.INTEGER,
      },
      height: {
        type: DataTypes.INTEGER,
      },
      marriage_status: {
        type: DataTypes.STRING,
      },
      nationality: {
        type: DataTypes.STRING,
      },
      nationality_other: {
        type: DataTypes.STRING,
      },
      religion: {
        type: DataTypes.STRING,
      },
      personal_id: {
        type: DataTypes.STRING,
      },
      passport_id: {
        type: DataTypes.STRING,
      },
      driving_license: {
        type: DataTypes.BOOLEAN,
      },
      motorbike_driving_license: {
        type: DataTypes.BOOLEAN,
      },
      vaccine: {
        type: DataTypes.BOOLEAN,
      },
      work_permit: {
        type: DataTypes.BOOLEAN,
      },
      work_permit_expiration_date: {
        type: DataTypes.DATE,
      },
      email: {
        type: DataTypes.STRING,
      },
      phone_number: {
        type: DataTypes.STRING,
      },
      line_id: {
        type: DataTypes.STRING,
      },
      address_glat: {
        type: DataTypes.STRING,
      },
      address_glng: {
        type: DataTypes.STRING,
      },
      address_sub_district: {
        type: DataTypes.STRING,
      },
      address_district: {
        type: DataTypes.STRING,
      },
      address_province: {
        type: DataTypes.STRING,
      },
      address_country: {
        type: DataTypes.STRING,
      },
      address_detail: {
        type: DataTypes.TEXT,
      },
      address_postal_code: {
        type: DataTypes.STRING,
      },
      emergency_contact_person: {
        type: DataTypes.STRING,
      },
      emergency_contact_phone: {
        type: DataTypes.STRING,
      },
      job_roles: {
        type: DataTypes.STRING,
      },
      job_live: {
        type: DataTypes.ENUM(["Live in", "Live out", "Live in and out"]),
      },
      job_type: {
        type: DataTypes.ENUM([
          "Full time",
          "Part time",
          "Full time or Part time",
        ]),
      },
      expected_salary: {
        type: DataTypes.INTEGER,
      },
      currency: {
        type: DataTypes.STRING,
      },
      job_location: {
        type: DataTypes.STRING,
      },
      bank_name: {
        type: DataTypes.STRING,
      },
      bank_account_name: {
        type: DataTypes.STRING,
      },
      bank_account_number: {
        type: DataTypes.STRING,
      },
      reference_person: {
        type: DataTypes.STRING,
      },
      reference_contact: {
        type: DataTypes.STRING,
      },
      active: {
        type: DataTypes.BOOLEAN,
      },
      internal_code: {
        type: DataTypes.STRING,
      },
      remark: {
        type: DataTypes.TEXT,
      },
      comment: {
        type: DataTypes.TEXT,
      },
      sum_job_rating: {
        type: DataTypes.INTEGER,
      },
      driver_id: {
        type: DataTypes.INTEGER,
      },
      maid_id: {
        type: DataTypes.INTEGER,
      },
      interest: {
        type: DataTypes.INTEGER,
      },
      address_location: {
        type: DataTypes.STRING,
      },
      is_pet: {
        type: DataTypes.BOOLEAN,
      },
      pet_detail: {
        type: DataTypes.STRING,
      },
      is_app: {
        type: DataTypes.BOOLEAN,
      },
      app_available_days: {
        type: DataTypes.STRING,
      },
      app_available_time: {
        type: DataTypes.STRING,
      },
      interest_count: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "supporter",
    }
  );

  return Supporter;
};
