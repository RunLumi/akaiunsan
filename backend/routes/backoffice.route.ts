const { headerValidator, backofficeValidator } = require('./../middlewares/validator.ts');
const { recordHistory, checkPermission } = require('../middlewares/admin.ts');

const multer = require('multer');
const { genTxt } = require('../helpers/util.ts');
const adminStorage = multer.diskStorage(
  {
    destination: 'uploads/admins',
    filename: function (req, file, cb) {
      let file_name = genTxt(20);
      let original_file_name = file.originalname.split('.');
      cb(null, file_name + '.' + original_file_name[original_file_name.length - 1]);
    }
  }
);
const adminUpload = multer({ storage: adminStorage });
const customerStorage = multer.diskStorage(
  {
    destination: 'uploads/customers',
    filename: function (req, file, cb) {
      let file_name = genTxt(20);
      let original_file_name = file.originalname.split('.');
      cb(null, file_name + '.' + original_file_name[original_file_name.length - 1]);
    }
  }
);
const customerUpload = multer({ storage: customerStorage });
const supporterStorage = multer.diskStorage(
  {
    destination: 'uploads/supporters',
    filename: function (req, file, cb) {
      let file_name = genTxt(20);
      let original_file_name = file.originalname.split('.');
      cb(null, file_name + '.' + original_file_name[original_file_name.length - 1]);
    }
  }
);
const supporterUpload = multer({ storage: supporterStorage });
const bannerStorage = multer.diskStorage(
  {
    destination: 'uploads/banners',
    filename: function (req, file, cb) {
      let file_name = genTxt(20);
      let original_file_name = file.originalname.split('.');
      cb(null, file_name + '.' + original_file_name[original_file_name.length - 1]);
    }
  }
);
const bannerUpload = multer({ storage: bannerStorage });

const AccountController = require('../controllers/account/account.controller.ts');
const AdminController = require('../controllers/admin.controller.ts');
const AddressController = require('../controllers/address.controller.ts');
const BannerController = require('./../controllers/banner.controller.ts');
const BizCustomerController = require('../controllers/bizcustomer.controller.ts');
const CleaningSupplyController = require('../controllers/cleaningsupply.controller.ts');
const CustomerController = require('../controllers/customer.controller.ts');
const CustomerSupplyController = require('../controllers/customersupply.controller.ts');
const JobController = require('../controllers/job.controller.ts');
const JobReviewController = require('../controllers/jobreview.controller.ts');
const SupplierController = require('../controllers/supplier.controller.ts');
const SubscriptionController = require('./../controllers/subscription.controller.ts');
const SupporterController = require('../controllers/supporter.controller.ts');
const RoleController = require('../controllers/role.controller.ts');
const RequestController = require('../controllers/requesthelper/index.controller.ts');

module.exports = app => {
  app.use('/back-office/*s', headerValidator);
  app.use('/back-office/*s', backofficeValidator)
  app.use('/back-office/*s', recordHistory);

  //verify token
  app.get('/back-office/verify-token', (req, res) => {
    return res.status(200).json(true);
  })

  //address
  app.get('/back-office/addresses', AddressController.getList);
  app.get('/back-office/addresses/count', AddressController.count);
  app.get('/back-office/addresses/:address_id', AddressController.getDetail);

  app.post('/back-office/addresses', AddressController.create);

  app.put('/back-office/addresses/:address_id', AddressController.update);

  app.delete('/back-office/addresses/:address_id', AddressController.remove);

  //admin
  app.use('/back-office/admins/*s', checkPermission);

  app.get('/back-office/admins', AdminController.getList);
  app.get('/back-office/admins/count', AdminController.count);
  app.get('/back-office/admins/:admin_id', AdminController.getDetail);

  app.post('/back-office/admins/profile-image', adminUpload.single('profile'), AdminController.uploadProfile);
  app.post('/back-office/admins', AdminController.create);

  app.put('/back-office/admins/:admin_id/password', AdminController.updatePassword);
  app.put('/back-office/admins/:admin_id', AdminController.update);

  app.delete('/back-office/admins/profile-image/:profile_image', AdminController.removeProfile);
  app.delete('/back-office/admins/:admin_id', AdminController.remove);

  //admin user
  app.get('/back-office/user', AccountController.admin.getAdminFromToken);

  app.post('/back-office/user/profile-image', adminUpload.single('profile'), AccountController.admin.uploadProfile);

  app.put('/back-office/user', AccountController.admin.update);
  app.put('/back-office/user/password', AccountController.admin.updatePassword);

  app.delete('/back-office/user/profile-image/:profile_image', AccountController.admin.removeProfile);

  //banner
  app.use('/back-office/banners/*s', checkPermission);

  app.get('/back-office/banners', BannerController.getList);

  app.post('/back-office/banners/image', bannerUpload.single('banner'), BannerController.uploadImage);

  app.put('/back-office/banners', BannerController.update);

  //biz customer
  app.get('/back-office/biz-customers', BizCustomerController.getList);
  app.get('/back-office/biz-customers/count', BizCustomerController.count);
  app.get('/back-office/biz-customers/:biz_customer_id', BizCustomerController.getDetail);

  app.post('/back-office/biz-customers', BizCustomerController.create);

  app.put('/back-office/biz-customers/:biz_customer_id', BizCustomerController.update);

  app.delete('/back-office/biz-customers/:biz_customer_id', BizCustomerController.remove);

  //cleaning supply
  app.get('/back-office/cleaning-supplies', CleaningSupplyController.getList);
  app.get('/back-office/cleaning-supplies/count', CleaningSupplyController.count);
  app.get('/back-office/cleaning-supplies/:cleaning_supply_id', CleaningSupplyController.getDetail);

  app.post('/back-office/cleaning-supplies/export', CleaningSupplyController.exportFile);
  app.post('/back-office/cleaning-supplies', CleaningSupplyController.create);

  app.put('/back-office/cleaning-supplies/:cleaning_supply_id/suppliers', CleaningSupplyController.updateSupplier);
  app.put('/back-office/cleaning-supplies/:cleaning_supply_id', CleaningSupplyController.update);

  app.delete('/back-office/cleaning-supplies/:cleaning_supply_id', CleaningSupplyController.remove);

  //customer
  app.get('/back-office/customers', CustomerController.getList);
  app.get('/back-office/customers/count', CustomerController.count);
  app.get('/back-office/customers/:customer_id/addresses', AddressController.getList);
  app.get('/back-office/customers/:customer_id/addresses/count', AddressController.count);
  app.get('/back-office/customers/:customer_id/addresses/:address_id', AddressController.getDetail);
  app.get('/back-office/customers/:customer_id', CustomerController.getDetail);

  app.post('/back-office/customers/export', CustomerController.exportFile);
  app.post('/back-office/customers/profile-image', customerUpload.single('profile'), CustomerController.uploadProfile);
  app.post('/back-office/customers/:customer_id/addresses', AddressController.create);
  app.post('/back-office/customers', CustomerController.create);

  app.put('/back-office/customers/:customer_id/addresses/:address_id', AddressController.update);
  app.put('/back-office/customers/:customer_id', CustomerController.update);

  app.delete('/back-office/customers/profile-image/:profile_image', CustomerController.removeProfile);
  app.delete('/back-office/customers/:customer_id/addresses/:address_id', AddressController.remove);
  app.delete('/back-office/customers/:customer_id', CustomerController.remove);

  //request helper
  app.use('/back-office/request-helpers/*s', checkPermission);

  app.get('/back-office/request-helpers', RequestController.getList);
  app.get('/back-office/request-helpers/count', RequestController.getCount);
  app.get('/back-office/request-helpers/:request_helper_id', RequestController.getDetail);

  app.put('/back-office/request-helpers/:request_helper_id', RequestController.update);
  app.put('/back-office/request-helpers/:request_helper_id/status/:request_helper_status_id', RequestController.updateStatus);

  app.delete('/back-office/request-helpers/:request_helper_id', RequestController.remove);

  //request helper status
  app.use('/back-office/request-helper-status/*s', checkPermission);

  app.get('/back-office/request-helper-status', RequestController.status.getList);
  app.get('/back-office/request-helper-status/count', RequestController.status.getCount);
  app.get('/back-office/request-helper-status/:request_helper_status_id', RequestController.status.getDetail);

  app.post('/back-office/request-helper-status', RequestController.status.create);

  app.put('/back-office/request-helper-status/:request_helper_status_id', RequestController.status.update);

  app.delete('/back-office/request-helper-status/:request_helper_status_id', RequestController.status.remove);

  app.get('/back-office/request-statistics', RequestController.getRequestStatistics);

  app.get('/back-office/request-schedule-statistics', RequestController.getRequestScheduleStatistics);
  app.get('/back-office/request-national-statistics', RequestController.getRequestNationalStatistics);
  app.get('/back-office/request-day-statistics', RequestController.getRequestDayStatistics);
  app.get('/back-office/request-language-statistics', RequestController.getRequestLanguageStatistics);
  app.get('/back-office/request-cooking-statistics', RequestController.getRequestCookingStatistics);
  app.get('/back-office/request-kid-statistics', RequestController.getRequesKidStatistics);
  app.get('/back-office/request-pet-statistics', RequestController.getRequesPetStatistics);
  app.get('/back-office/request-current-helper-statistics', RequestController.getRequesCurrentHelperStatistics);
  app.get('/back-office/request-driver-language-statistics', RequestController.getRequestDriverLanguageStatistics);
  app.get('/back-office/request-driver-owncar-statistics', RequestController.getRequestDriverOwnCarStatistics);
  app.get('/back-office/request-driver-current-driver-statistics', RequestController.getRequestDriverCurrentDriverStatistics);
  app.get('/back-office/request-driver-is-ot-statistics', RequestController.getRequestDriverIsOTStatistics);
  app.get('/back-office/request-driver-age-statistics', RequestController.getRequestDriverAgeStatistics);
  app.get('/back-office/request-driver-schedule-statistics', RequestController.getRequestDriverScheduleStatistics);
  app.get('/back-office/request-driver-salary-statistics', RequestController.getRequestDriverSalaryStatistics);
  app.get('/back-office/request-driver-hiring-statistics', RequestController.getRequestDriverHiringStatistics);
  app.get('/back-office/request-driver-interview-statistics', RequestController.getRequestDriverInterviewStatistics);
  app.get('/back-office/request-driver-replacement-gurantee-statistics', RequestController.getRequestDriverReplacementGuranteeStatistics);

  //job
  app.get('/back-office/jobs', JobController.getList);
  app.get('/back-office/jobs/count', JobController.count);
  app.get('/back-office/jobs/:job_id', JobController.getDetail);

  app.post('/back-office/jobs', JobController.create);

  app.put('/back-office/jobs/:job_id/match/:supporter_id', JobController.matchSupporter);
  app.put('/back-office/jobs/:job_id/status/:status', JobController.updateStatus);
  app.put('/back-office/jobs/:job_id', JobController.update);

  app.delete('/back-office/jobs/:job_id', JobController.remove);

  //job review
  app.get('/back-office/job-reviews', JobReviewController.getList);
  app.get('/back-office/job-reviews/count', JobReviewController.count);
  app.get('/back-office/job-reviews/:job_review_id', JobReviewController.getDetail);

  app.put('/back-office/job-reviews/:job_review_id', JobReviewController.update);

  //supplier
  app.get('/back-office/suppliers', SupplierController.getList);
  app.get('/back-office/suppliers/count', SupplierController.count);
  app.get('/back-office/suppliers/:supplier_id', SupplierController.getDetail);

  app.post('/back-office/suppliers/export', SupplierController.exportFile);
  app.post('/back-office/suppliers', SupplierController.create);

  app.put('/back-office/suppliers/:supplier_id/cleaning-supplies', SupplierController.updateProduct);
  app.put('/back-office/suppliers/:supplier_id', SupplierController.update);

  app.delete('/back-office/suppliers/:supplier_id', SupplierController.remove);

  //supporter
  app.use('/back-office/supporters/*s', checkPermission);

  app.get('/back-office/supporters', SupporterController.getList);
  app.get('/back-office/supporters/count', SupporterController.count);
  app.get('/back-office/supporters/:supporter_id', SupporterController.getDetail);

  app.post('/back-office/supporters/export', SupporterController.exportFile);
  app.post('/back-office/supporters/profile-image', supporterUpload.single('profile'), SupporterController.uploadProfile);
  app.post('/back-office/supporters', SupporterController.create);

  app.put('/back-office/supporters/:supporter_id', SupporterController.update);

  app.delete('/back-office/supporters/profile-image/:profile_image', SupporterController.removeProfile);
  app.delete('/back-office/supporters/:supporter_id', SupporterController.remove);

  //customer supply
  app.get('/back-office/customer-supplies', CustomerSupplyController.getList);
  app.get('/back-office/customer-supplies/count', CustomerSupplyController.count);
  app.get('/back-office/customer-supplies/:customer_supply_id', CustomerSupplyController.getDetail);

  app.post('/back-office/customer-supplies', CustomerSupplyController.create);

  app.put('/back-office/customer-supplies/:customer_supply_id', CustomerSupplyController.update);

  app.delete('/back-office/customer-supplies/:customer_supply_id', CustomerSupplyController.remove);

  //subscription
  app.get('/back-office/subscriptions', SubscriptionController.getList);
  app.get('/back-office/subscriptions/:subscription_id', SubscriptionController.findSubscription);

  //role
  app.use('/back-office/roles/*s', checkPermission);

  app.get('/back-office/roles', RoleController.getList);
  app.get('/back-office/roles/count', RoleController.count);
  app.get('/back-office/roles/:role_id', RoleController.getDetail);

  app.post('/back-office/roles', RoleController.create);

  app.put('/back-office/roles/:role_id', RoleController.update);

  app.delete('/back-office/roles/:role_id', RoleController.remove);
}