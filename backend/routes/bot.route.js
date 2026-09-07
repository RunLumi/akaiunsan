const BotController = require('../controllers/bot/index.controller');

module.exports = app => {
  //ayasan bot route
  app.get('/bot/profile/:helper_id', BotController.getDetail);
  app.get('/bot/profile', BotController.getList);
  app.put('/bot/profile', BotController.updateInterest);
}