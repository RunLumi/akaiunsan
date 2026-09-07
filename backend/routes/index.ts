import r_public_route from './public.route.ts';
import r_bot_route from './bot.route.ts';
import r_agency_route from './agency.route.ts';
import r_backoffice_route from './backoffice.route.ts';
import r_client_route from './client.route.ts';
import r_error from './error.ts';
const routeModules: any = { 'public': r_public_route, 'bot': r_bot_route, 'agency': r_agency_route, 'backoffice': r_backoffice_route, 'client': r_client_route, 'error': r_error };
import path from 'path';
import db from '../models/index.ts';

import SupporterController from '../controllers/supporter.controller.ts';
import InstallController from '../controllers/install.controller.ts';
import AgencyController from '../controllers/agency/index.controller.ts';

export default (app) => {
  // infrastructure health check (load balancers / orchestrators) — no auth
  app.get('/health', async (req, res) => {
    try {
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
  routeModules['public'](app);
  
  //ayasan bot api routes
  routeModules['bot'](app);

  routeModules['agency'](app);

  // authentication required
  routeModules['backoffice'](app);
  routeModules['client'](app);

  routeModules['error'](app);
}