import { getHealthInfo } from '../helpers/version.ts';

/** Small compatibility surface for the current mobile client during the API migration. */
export function getMobileVersion(_req, res) {
  const version = process.env.MOBILE_APP_VERSION || '4.0.1';
  return res.status(200).json({
    items: [{ version }, { version }],
    backend: getHealthInfo(),
  });
}

export function updateLanguage(_req, res) {
  return res.status(200).json(true);
}

export function getNotifications(_req, res) {
  return res.status(200).json({ items: [], page: 1, totalUnRead: 0 });
}

export function acknowledgeNotification(_req, res) {
  return res.status(200).json(true);
}

/**
 * The local Maestro database intentionally contains no catalog seed data.
 * These read-only fixtures keep the local app shell navigable while the
 * production catalog endpoints are migrated into this API.
 */
export function getMaestroBanners(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroPromotionUpdates(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroPromotions(_req, res) {
  return res.status(200).json({ items: [], page: 1 });
}

export function getMaestroServices(_req, res) {
  return res.status(200).json({
    items: [
      {
        id: 1,
        serviceItemId: 1,
        serviceType: 1,
        type: 0,
        serviceName: 'Maid Service',
        serviceNameTl: 'Maid Service',
        icon: '',
      },
    ],
  });
}

export function getMaestroFavouriteServices(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroCurrentPlan(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroBookings(_req, res) {
  return res.status(200).json({ items: [], page: 1 });
}

export function getMaestroServiceItem(_req, res) {
  return res.status(200).json({ extraService: '[]' });
}

export function getMaestroConfigPrice(_req, res) {
  return res.status(200).json({
    items: [
      {
        serviceType: 1,
        pricesModel: JSON.stringify({ two: 100, threePlus: 100, twoPlus: 100 }),
      },
    ],
  });
}
