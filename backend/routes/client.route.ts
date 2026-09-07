import fs from 'fs';
import middlewareValidators from './../middlewares/validator.ts';
const { headerValidator, clientValidator } = middlewareValidators;
import multer from 'multer';
import { genTxt } from '../helpers/util.ts';
import AccountController from '../controllers/account/account.controller.ts';
import * as AddressController from '../controllers/address.controller.ts';
import * as CreditCardController from '../controllers/creditcard.controller.ts';
import * as RequestController from '../controllers/requesthelper/index.controller.ts';
import * as JobController from '../controllers/job.controller.ts';
import * as JobReviewController from '../controllers/jobreview.controller.ts';
import * as SubscriptionController from './../controllers/subscription.controller.ts';

const customerStorage = multer.diskStorage(
  {
      destination: function (_req, _file, cb) {
      fs.mkdirSync('uploads/customers', { recursive: true });
      cb(null, 'uploads/customers');
    },
      filename: function ( req, file, cb ) {
        let file_name = genTxt(20);
        let original_file_name = file.originalname.split('.');
        cb( null, file_name + '.' + original_file_name[original_file_name.length - 1] );
      }
  }
);
const customerUpload = multer({ storage: customerStorage });


export default app => {
  app.use('/client/*s', headerValidator);
  app.use('/client/*s', clientValidator)

  //verify token
  app.get('/client/verify-token', (req, res) => {
    return res.status(200).json(true);
  })

  //address
  app.get('/client/addresses', AddressController.getList);
  app.get('/client/addresses/count', AddressController.count);
  app.get('/client/addresses/:address_id', AddressController.getDetail);

  app.post('/client/addresses', AddressController.create);

  app.put('/client/addresses/:address_id', AddressController.update);

  app.delete('/client/addresses/:address_id', AddressController.remove);

  //credit card
  app.get('/client/credit-cards', CreditCardController.getList);
  app.get('/client/credit-cards/count', CreditCardController.count);
  app.get('/client/credit-cards/:credit_card_id', CreditCardController.getDetail);

  app.post('/client/credit-cards', CreditCardController.create);

  app.delete('/client/credit-cards/:credit_card_id', CreditCardController.remove);

  //customer
  app.get('/client/user', AccountController.customer.getCustomerFromToken);

  app.post('/client/user/profile-image', customerUpload.single('profile'), AccountController.customer.uploadProfile);

  app.put('/client/user/password', AccountController.customer.updatePassword);
  app.put('/client/user', AccountController.customer.update);

  app.delete('/client/user/profile-image/:profile_image', AccountController.customer.removeProfile);

  //request helper
  app.get('/client/user/request-helper/last/:request_type', RequestController.getLastItem);
  app.get('/client/user/request-helper/count', RequestController.getCountHistory);
  app.get('/client/user/request-helper/:request_helper_id', RequestController.getDetail);
  app.get('/client/user/request-helper', RequestController.getHistory);

  app.post('/client/user/request-helper', RequestController.create);

  app.put('/client/user/request-helper/:request_helper_id', RequestController.update);

  app.delete('/client/user/request-helper/:request_helper_id', RequestController.remove);

  //job
  app.get('/client/jobs', JobController.getList);
  app.get('/client/jobs/count', JobController.count);
  app.get('/client/jobs/:job_id', JobController.getDetail);
  app.get('/client/jobs/:job_id/job-reviews/:job_review_id', JobController.getReviewDetail);

  app.post('/client/jobs', JobController.create);
  app.post('/client/jobs/:job_id/job-reviews', JobController.createReview);

  app.put('/client/jobs/:job_id/status/:status', JobController.updateStatus);

  //job review
  app.get('/client/job-reviews', JobReviewController.getList);
  app.get('/client/job-reviews/count', JobReviewController.count);
  app.get('/client/job-reviews/:job_review_id', JobReviewController.getDetail);

  app.put('/client/job-reviews/:job_review_id', JobReviewController.update);

  //subscription
  app.get('/client/subscriptions', SubscriptionController.getList);
  app.get('/client/subscriptions/:subscription_id', SubscriptionController.findSubscription);

  app.post('/client/subscriptions', SubscriptionController.createSubscription);

  app.put('/client/subscriptions/:subscriptionId/status/cancel', SubscriptionController.cancelSubscription);
}