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
import * as MobileCompatController from '../controllers/mobile-compat.controller.ts';
import * as MobileCatalogController from '../controllers/mobile-catalog.controller.ts';

export default (app) => {

  // intentional-error route from the Sentry quick-start — hit once to confirm
  // events arrive in the Sentry project, then remove
  app.get('/debug-sentry', function mainHandler(req, res) {
    throw new Error('My first Sentry error!');
  });

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
  
  //akaiunsan bot api routes
  r_bot(app);

  r_agency(app);

  // Mobile catalog compatibility. These routes are product configuration
  // derived from FR-SVC-01/02, not disposable Maestro fixtures.
  if (process.env.NODE_ENV !== 'maestro') {
    app.get('/banner/get-banner', MobileCatalogController.getCatalogBanners);
    app.get('/services-management', MobileCatalogController.getCatalog);
    app.get('/services-management/service-item', MobileCatalogController.getCatalogItem);
    app.get('/services-management/helpers', MobileCatalogController.getCatalogHelpers);
    app.get('/services-management/suggest', MobileCatalogController.getCatalogHelpers);
    app.get('/config-price/get', MobileCatalogController.getCatalogPrice);
  }

  // Local-only catalog fixtures keep the Maestro smoke lane navigable without
  // seeding production catalog data into the disposable local database. These
  // routes must precede the normal client routes so they win over legacy
  // handlers that otherwise return empty database-backed lists.
  if (process.env.NODE_ENV === 'maestro') {
    app.get('/banner/get-banner', MobileCompatController.getMaestroBanners);
    app.get('/promotion/promotion-updates', MobileCompatController.getMaestroPromotionUpdates);
    app.get('/promotion/get-promotion', MobileCompatController.getMaestroPromotions);
    app.get('/promotion/get-promotion-used', MobileCompatController.getMaestroPromotions);
    app.get('/promotion/detail', MobileCompatController.getMaestroPromotionDetail);
    app.get('/booking/detail', MobileCompatController.getMaestroBookingDetail);
    app.get('/client/jobs', MobileCompatController.getMaestroBookingList);
    app.get('/config-price/price-special-request', MobileCompatController.getMaestroPriceSpecialRequest);
    app.get('/config-point/get', MobileCompatController.getMaestroPointConfig);
    app.get('/config-price/subscription-prices', MobileCompatController.getMaestroSubscriptionPrices);
    app.get('/payment-method/get', MobileCompatController.getMaestroPaymentMethods);
    app.get('/services-management/helpers', MobileCompatController.getMaestroHelpers);
    app.get('/services-management/suggest', MobileCompatController.getMaestroHelpers);
    app.get('/languages', MobileCompatController.getMaestroLanguages);
    app.get('/services-management', MobileCompatController.getMaestroServices);
    app.get('/services-management/service-item', MobileCompatController.getMaestroServiceItem);
    app.get('/config-price/get', MobileCompatController.getMaestroConfigPrice);
    app.get('/favourite/services', MobileCompatController.getMaestroFavouriteServices);
    app.get('/favourite/service-providers', MobileCompatController.getMaestroFavouriteProviders);
    app.get('/referral/referral-list', MobileCompatController.getMaestroReferralList);
    app.get('/subscription-plan/get-current-plan', MobileCompatController.getMaestroCurrentPlan);
    app.get('/booking/get', MobileCompatController.getMaestroBookings);
  }

  // authentication required
  r_backoffice(app);
  r_client(app);

  r_error(app);
}
