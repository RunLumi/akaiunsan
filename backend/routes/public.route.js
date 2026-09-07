// public route is for accessing data without the need of authorization
// but it is still needs key in header
const { headerValidator } = require('./../middlewares/validator');

const AccountController = require('../controllers/account/account.controller');
const BlogController = require('./../controllers/blog.controller');
const SupporterController = require('../controllers/supporter.controller');
const BannerController = require('./../controllers/banner.controller');
const MailController = require('./../controllers/mail.controller');
const ErrorController = require('./../controllers/error.controller');
const SupporterViewCountController = require('./../controllers/supporter.viewcount.controller');
const AddressJsonController = require('./../controllers/address.json.controller');

module.exports = app => {
  // authentication
  app.use('/auth/*', headerValidator);
  app.post('/auth/admin/forget-password', AccountController.admin.requestForgetPassword);
  app.post('/auth/admin/reset-password', AccountController.admin.resetPassword);
  app.post('/auth/admin/signin', AccountController.admin.signin);
  app.post('/auth/admin/signup', AccountController.admin.register);
  app.post('/auth/forget-password', AccountController.customer.requestForgetPassword);
  app.post('/auth/reset-password', AccountController.customer.resetPassword);
  app.post('/auth/signin', AccountController.customer.signin);
  app.post('/auth/signup', AccountController.customer.signup);

  //banner
  app.get('/banners/:lang_code', BannerController.getDisplay);

  //blog
  app.use('/blog/*', headerValidator);
  app.post('/blog/content', BlogController.getContent);
  app.get('/blog/search', BlogController.getSearch);
  app.get('/blog', BlogController.getList);

  app.use('/guest/*', headerValidator);
  //address json
  app.get('/guest/provinces', AddressJsonController.getProvinceList);
  app.get('/guest/provinces/:province_id/districts', AddressJsonController.getDistrictList);
  app.get('/guest/districts/:district_id/sub-districts', AddressJsonController.getSubDistrictList);

  //get supporter informations to display on front-end
  app.get('/guest/supporters', SupporterController.getPublicList);
  app.get('/guest/supporters/count', SupporterController.getPublicCount);
  app.get('/guest/supporters/view-count', SupporterViewCountController.createCount);
  app.get('/guest/supporters/:supporter_id', SupporterController.getPublicDetail);

  //contat us form, send mail
  app.post('/guest/contact-us', MailController.contactUs);
  app.post('/guest/biz-quotation', MailController.contactBiz);
  app.post('/guest/employment-request', MailController.employment);

  //store error log from front-end
  app.post('/guest/error-logs', ErrorController);
}