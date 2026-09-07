const path = require('path');
const SupporterController = require('../controllers/supporter.controller.ts');
const InstallController = require('../controllers/install.controller.ts');
const AgencyController = require('../controllers/agency/index.controller.ts');

module.exports = (app) => {
  // infrastructure health check (load balancers / orchestrators) — no auth
  app.get('/health', async (req, res) => {
    try {
      const db = require('../models/index.ts');
      await db.sequelize.query('SELECT 1');
      return res.status(200).json({ status: 'ok', env: process.env.NODE_ENV, db: 'up' });
    } catch (err) {
      return res.status(503).json({ status: 'error', env: process.env.NODE_ENV, db: 'down' });
    }
  });

  //test route
  app.get('/import/supporter-agency-profile-image', SupporterController.matchAgencyProfileImage);
  app.get('/import/supporter-agency-stat', AgencyController.maid.updateAllStat);
  app.get('/import/supporter-agency', SupporterController.getOldSupporterData);
  app.get('/import/supporter-driver-experience', SupporterController.getOldDriverExperienceData);
  app.get('/import/supporter-driver-skill', SupporterController.getOldDriverSkillData);
  app.get('/import/supporter-driver-match-skill', SupporterController.matchDriverId);
  app.get('/import/supporter-driver-profile-image', SupporterController.matchDriverProfileImage);
  app.get('/import/supporter-driver', SupporterController.getOldDriverData);

  //install first admin
  app.get('/back/office/install', InstallController);

  // images and files access
  app.get('/uploads/*s', (req, res, next) => {
    res.sendFile(path.resolve(`${__dirname}/..${req.originalUrl}`));
  })

  // Un-authentication routes
  require('./public.route.ts')(app);
  
  //ayasan bot api routes
  require('./bot.route.ts')(app);

  require('./agency.route.ts')(app);

  // authentication required
  require('./backoffice.route.ts')(app);
  require('./client.route.ts')(app);

  require('./error.ts')(app);
}