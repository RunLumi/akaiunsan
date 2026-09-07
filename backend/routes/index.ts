import r_public from './public.route.ts';
import r_bot from './bot.route.ts';
import r_agency from './agency.route.ts';
import r_backoffice from './backoffice.route.ts';
import r_client from './client.route.ts';
import r_error from './error.ts';
import path from 'path';
import db from '../models/index.ts';
import * as SupporterController from '../controllers/supporter.controller.ts';
import InstallController from '../controllers/install.controller.ts';
import AgencyController from '../controllers/agency/index.controller.ts';
import { getHealthInfo } from '../helpers/version.ts';

export default (app) => {

  // infrastructure health check (load balancers / orchestrators) — no auth
  app.get('/health', async (req, res) => {
    const health = getHealthInfo();
    try {
      await db.sequelize.query('SELECT 1');
      return res.status(200).json({ ...health, db: 'up' });
    } catch (err: any) {
      return res.status(503).json({ ...health, status: 'error', db: 'down', dbError: err?.message });
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
    res.sendFile(path.resolve(`.${req.originalUrl}`));
  })

  // Un-authentication routes
  r_public(app);
  
  //ayasan bot api routes
  r_bot(app);

  r_agency(app);

  // authentication required
  r_backoffice(app);
  r_client(app);

  r_error(app);
}