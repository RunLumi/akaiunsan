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
  return res.status(200).json({ items: [], totalUnRead: 0 });
}

export function acknowledgeNotification(_req, res) {
  return res.status(200).json(true);
}
