const { headerValidator } = require('./../middlewares/validator.ts');

const AgencyController = require('../controllers/agency/index.controller.ts');

module.exports = app => {
  app.use('/agency-back-office/*s', headerValidator);

  //driver
  app.post('/agency-back-office/driver', AgencyController.driver.create);

  app.put('/agency-back-office/driver/:driver_id/profile-pic', AgencyController.driver.uploadProfile)
  app.put('/agency-back-office/driver/:driver_id', AgencyController.driver.update)

  app.delete('/agency-back-office/driver/:driver_id', AgencyController.driver.remove);

  //maid
  app.post('/agency-back-office/maid', AgencyController.maid.create);

  app.put('/agency-back-office/maid/:maid_id/profile-pic', AgencyController.maid.uploadProfile)
  app.put('/agency-back-office/maid/:maid_id', AgencyController.maid.update)

  app.delete('/agency-back-office/maid/:maid_id', AgencyController.maid.remove);
}