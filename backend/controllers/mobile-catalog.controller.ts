/**
 * Public mobile catalog contract.
 *
 * The mobile client still consumes these legacy paths while the admin/catalog
 * migration is completed. Keep this data deliberately small and explicit: it
 * describes the five service groups documented in biz-docs and never embeds
 * Maestro test accounts, orders, or production customer data.
 */
const services = [
  { id: 1, serviceItemId: 1, serviceType: 1, type: 0, serviceName: 'Maid Service', serviceNameVi: 'Dịch vụ giúp việc', icon: '' },
  { id: 2, serviceItemId: 2, serviceType: 2, type: 0, serviceName: 'Nanny Service', serviceNameVi: 'Chăm sóc em bé', icon: '' },
  { id: 3, serviceItemId: 3, serviceType: 3, type: 0, serviceName: 'Elder Care', serviceNameVi: 'Chăm sóc người cao tuổi', icon: '' },
  { id: 4, serviceItemId: 4, serviceType: 4, type: 0, serviceName: 'AC Cleaning', serviceNameVi: 'Vệ sinh máy lạnh', icon: '' },
  { id: 5, serviceItemId: 5, serviceType: 5, type: 0, serviceName: 'Petcare Service', serviceNameVi: 'Chăm sóc thú cưng', icon: '' },
];

const prices = {
  1: { two: 300, threePlus: 280, twoPlus: 280 },
  2: { two: 350, threePlus: 330, twoPlus: 330 },
  3: { two: 400, threePlus: 380, twoPlus: 380 },
  5: { two: 300, threePlus: 280, twoPlus: 280 },
};

export function getCatalog(_req, res) {
  return res.status(200).json({ items: services });
}

export function getCatalogItem(_req, res) {
  return res.status(200).json({ extraService: '[]' });
}

export function getCatalogPrice(req, res) {
  const requested = Number(req.query?.price);
  const serviceType = requested === 3 ? 2 : requested === 5 ? 3 : requested === 7 ? 5 : 1;
  return res.status(200).json({
    items: [{ serviceType, pricesModel: JSON.stringify(prices[serviceType]) }],
  });
}

export function getCatalogBanners(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getCatalogHelpers(_req, res) {
  return res.status(200).json({ items: [] });
}
