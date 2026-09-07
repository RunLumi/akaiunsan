export default (models) => {
  //supporter
  models.Supporter.hasMany(models.SupporterSkill, { foreignKey: 'supporter_id' });
  models.Supporter.hasMany(models.SupporterExperience, { foreignKey: 'supporter_id' });
  models.Supporter.hasMany(models.SupporterEducation, { foreignKey: 'supporter_id' });
  models.Supporter.hasMany(models.SupporterLanguage, { foreignKey: 'supporter_id' });
  models.Supporter.hasMany(models.Job, { foreignKey: 'supporter_id' });
  models.Supporter.hasMany(models.JobReview, { foreignKey: 'supporter_id' });
  models.Supporter.hasMany(models.SupporterViewCount, { foreignKey: 'supporter_id' });

  //supporter view count
  models.SupporterViewCount.belongsTo(models.Supporter, { foreignKey: 'supporter_id' });

  //supporter skill
  models.SupporterSkill.belongsTo(models.Supporter, { foreignKey: 'supporter_id' });

  //supporter experience
  models.SupporterExperience.belongsTo(models.Supporter, { foreignKey: 'supporter_id' });

  //supporter education
  models.SupporterEducation.belongsTo(models.Supporter, { foreignKey: 'supporter_id' });
  
  //supporter language
  models.SupporterLanguage.belongsTo(models.Supporter, { foreignKey: 'supporter_id' });

  //customer
  models.Customer.hasMany(models.Address, { foreignKey: 'customer_id' });
  models.Customer.hasMany(models.CreditCard, { foreignKey: 'customer_id' });
  models.Customer.hasMany(models.Subscription, { foreignKey: 'customer_id' });
  models.Customer.hasMany(models.Charge, { foreignKey: 'customer_id' });
  models.Customer.hasMany(models.JobReview, { foreignKey: 'customer_id' });
  models.Customer.hasOne(models.RequestHelper, { foreignKey: 'customer_id' });
  // job.controller matchSupporter includes Customer on Job — the association
  // existed in the production schema but was missing here, making every
  // match attempt fail with "Customer is not associated to Job!".
  models.Customer.hasMany(models.Job, { foreignKey: 'customer_id' });
  models.Job.belongsTo(models.Customer, { foreignKey: 'customer_id' });

  //credit card
  models.CreditCard.belongsTo(models.Customer, { foreignKey: 'customer_id' });

  //address
  models.Address.belongsTo(models.Customer, { foreignKey: 'customer_id' });
  models.Address.hasMany(models.Subscription, { foreignKey: 'address_id' });

  //charge
  models.Charge.belongsTo(models.Customer, { foreignKey: 'customer_id' });

  //job
  models.Job.belongsTo(models.Supporter, { foreignKey: 'supporter_id' });
  models.Job.hasOne(models.SubscriptionTransaction, { foreignKey: 'job_id' });
  models.Job.hasMany(models.JobDetail, { foreignKey: 'job_id' });
  models.Job.hasOne(models.JobReview, { foreignKey: 'job_id' });

  //job detail
  models.JobDetail.belongsTo(models.Job, { foreignKey: 'job_id' });

  //job review
  models.JobReview.belongsTo(models.Customer, { foreignKey: 'customer_id' });
  models.JobReview.belongsTo(models.Job, { foreignKey: 'job_id' });
  models.JobReview.belongsTo(models.Supporter, { foreignKey: 'supporter_id' });

  //request helper
  models.RequestHelper.belongsTo(models.Customer, { foreignKey: 'customer_id' });
  models.RequestHelper.hasOne(models.RequestMaid, { foreignKey: 'request_helper_id' });
  models.RequestHelper.hasOne(models.RequestDriver, { foreignKey: 'request_helper_id' });

  //request maid
  models.RequestMaid.belongsTo(models.RequestHelper, { foreignKey: 'request_helper_id' });

  //request driver
  models.RequestDriver.belongsTo(models.RequestHelper, { foreignKey: 'request_helper_id' });

  //subscription
  models.Subscription.belongsTo(models.Customer, { foreignKey: 'customer_id' });
  models.Subscription.hasMany(models.SubscriptionTransaction, { foreignKey: 'subscription_id' });
  models.Subscription.belongsTo(models.Address, { foreignKey: 'address_id' });

  //subscription transaction
  models.SubscriptionTransaction.belongsTo(models.Subscription, { foreignKey: 'subscription_id' });
  models.SubscriptionTransaction.belongsTo(models.Job, { foreignKey: 'job_id' });

  //biz
  models.Supplier.belongsToMany(models.CleaningSupply, { through: 'SupplierProduct', foreignKey: 'supplier_id' });
  models.CleaningSupply.belongsToMany(models.Supplier, { through: 'SupplierProduct', foreignKey: 'cleaning_supply_id' });
  models.BizCustomer.hasMany(models.CustomerSupply, { foreignKey: 'biz_customer_id' });
  models.CustomerSupply.belongsTo(models.BizCustomer, { foreignKey: 'biz_customer_id' });
  models.CustomerSupply.hasMany(models.CustomerSupplyDetail, { foreignKey: 'customer_supply_id' });
  models.CustomerSupplyDetail.belongsTo(models.CustomerSupply, { foreignKey: 'customer_supply_id' });

  //admin
  models.Admin.belongsTo(models.Role, { foreignKey: 'role_id' });
  models.Admin.hasMany(models.AdminHistory, { foreignKey: 'admin_id' });

  //admin history
  models.AdminHistory.belongsTo(models.Admin, { foreignKey: 'admin_id' });

  //role
  models.Role.hasMany(models.Admin, { foreignKey: 'role_id' });

  //thai address
  models.Province.hasMany(models.District, { foreignKey: 'province_id' });
  models.District.belongsTo(models.Province, { foreignKey: 'province_id' });
  models.District.hasMany(models.SubDistrict, { foreignKey: 'district_id' });
  models.SubDistrict.belongsTo(models.District, { foreignKey: 'district_id' });

  //banner
  models.Banner.hasMany(models.BannerLanguage, { foreignKey: 'banner_id' });
  models.BannerLanguage.belongsTo(models.Banner, { foreignKey: 'banner_id' });
}