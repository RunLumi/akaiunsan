import BotController from '../controllers/bot/index.controller.ts';

export default app => {
  //akaiunsan bot route
  app.get('/bot/profile/:helper_id', BotController.getDetail);
  app.get('/bot/profile', BotController.getList);
  app.put('/bot/profile', BotController.updateInterest);
}