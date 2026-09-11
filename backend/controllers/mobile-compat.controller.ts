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

export function getMaestroProfile(req, res) {
  return res.status(200).json({
    ...(req.customer || {}),
    id: req.customer?.id || 'maestro-customer',
    fullName: 'Maestro Smoke',
    firstname: 'Maestro',
    lastname: 'Smoke',
    email: req.customer?.email || 'maestro@example.test',
    phoneNumber: '0900000000',
    address: 'Maestro test address',
    gender: 1,
    point: 100,
    referralCode: 'MAESTRO',
    avatar: '',
  });
}

const maestroBooking = (orderStatus = 0, orderId = 'maestro-booking-1') => {
  const bookingDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  bookingDate.setHours(9, 0, 0, 0);
  const bookingHour = new Date(bookingDate.getTime() + 2 * 60 * 60 * 1000);
  return {
    orderId,
    orderDetailId: `${orderId}-detail`,
    orderCode: 'MAESTRO-001',
    serviceId: 1,
    serviceItemId: 1,
    serviceName: 'Maid Service',
    serviceType: 1,
    orderStatus,
    totalPrice: 300,
    paymentStatus: 1,
    pointReceived: 0,
    review: 0,
    hour: 2,
    bookingDate: bookingDate.toISOString(),
    address: 'Maestro test address',
    bookingDetail: {
      bookingDate: bookingDate.toISOString(),
      bookingHour: bookingHour.toISOString(),
      extraServices: [],
    },
    customerInfo: {
      address: 'Maestro test address',
      district: 'Test District',
      city: 'Test City',
    },
    serviceProvider: {
      fullName: 'Maestro Helper',
      old: 30,
      star: 5,
      avatar: '',
      skillLanguage: '["Vietnamese"]',
      serviceType: '[]',
      experiences: 10,
    },
  };
};

export function getNotifications(req, res) {
  if (req.query?.notificationId) return getMaestroNotificationDetail(req, res);
  const rawType = String(req.query?.type ?? '');
  const isPromotion = rawType.includes('1') || rawType.includes('2');
  const item = isPromotion
    ? {
        id: 'maestro-promotion-notification',
        title: 'Maestro promotion',
        createdDate: new Date().toISOString(),
        isRead: false,
        type: 1,
        promotionId: 'maestro-promotion',
        data: JSON.stringify({ PromotionId: 'maestro-promotion' }),
      }
    : {
        id: 'maestro-order-notification',
        notificationId: 'maestro-order-notification',
        title: 'Maestro booking update',
        createdDate: new Date().toISOString(),
        isRead: false,
        type: 0,
        data: JSON.stringify({ OrderId: 'maestro-petcare-order' }),
      };
  return res.status(200).json({ items: [item], page: 1, totalUnRead: 1 });
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
  return res.status(200).json({
    items: [
      {
        id: 'maestro-promotion',
        name: 'Maestro promotion',
        description: 'Local smoke-test promotion',
        promotionId: 'maestro-promotion',
        promotion: {
          name: 'Maestro promotion',
          description: 'Local smoke-test promotion',
        },
        usingTimes: 1,
      },
    ],
    page: 1,
  });
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
        serviceNameVi: 'Dịch vụ giúp việc',
        serviceNameTl: 'Maid Service',
        icon: '',
      },
    ],
  });
}

export function getMaestroFavouriteServices(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroFavouriteProviders(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroReferralList(_req, res) {
  return res.status(200).json({ items: [], total: 0, page: 1 });
}

export function getMaestroAddresses(_req, res) {
  return res.status(200).json({
    items: [
      {
        id: 'maestro-address',
        longAddress: 'Maestro test address, Test District, Test City',
        shortAddress: 'Maestro test address',
        district: 'Test District',
        province: 'Test City',
        phoneNumber: '0900000000',
        roomNo: '1',
        roomType: 3,
        bedroomNo: 1,
        batchroomNo: 1,
        remark: 'Smoke test only',
        isDefault: true,
        latitude: 10,
        longitude: 106,
      },
    ],
  });
}

export function getMaestroBookingList(req, res) {
  if (req.query?.orderId) return getMaestroBookingDetail(req, res);
  const rawStatus = String(req.query?.orderStatus ?? '');
  const status = rawStatus.includes('2') || rawStatus.includes('3') ? 2 : 0;
  return res.status(200).json({ items: [maestroBooking(status)], page: 1 });
}

export function getMaestroBookingDetail(req, res) {
  const orderId = String(req.query?.orderId ?? 'maestro-booking-1');
  const isPetcare = orderId === 'maestro-petcare-order';
  const booking: any = maestroBooking(isPetcare ? 5 : 0, orderId);
  if (isPetcare) {
    booking.serviceType = 5;
    booking.serviceName = 'Petcare Service';
    booking.bookingDetail.petProfiles = [{ name: 'Maestro pet', type: 'Cat' }];
    booking.bookingDetail.activity = 'Walk and feed';
  }
  return res.status(200).json(booking);
}

export function getMaestroPromotionDetail(_req, res) {
  return res.status(200).json({
    id: 'maestro-promotion',
    name: 'Maestro promotion',
    promotionType: 1,
    content: JSON.stringify({ percent: 10 }),
    banners: [],
    serviceName: 'Maid Service',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Local smoke-test promotion',
    promotionCode: 'MAESTRO10',
    isShowPromotionId: true,
  });
}

export function getMaestroNotificationDetail(req, res) {
  const id = String(req.query?.notificationId ?? '');
  return res.status(200).json({
    title: 'Maestro booking update',
    content: 'Local smoke-test notification',
    type: 0,
    banners: '[]',
    data: JSON.stringify({ OrderId: id === 'maestro-order-notification' ? 'maestro-petcare-order' : 'maestro-booking-1' }),
  });
}

export function getMaestroPaymentMethods(_req, res) {
  return res.status(200).json({
    items: [
      { id: 'maestro-cash', code: 1, status: true },
      { id: 'maestro-card', code: 2, status: false },
    ],
  });
}

export function getMaestroPriceSpecialRequest(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroPointConfig(_req, res) {
  return res.status(200).json({ items: [{ config: JSON.stringify({ fromMoney: 100, toPoint: 1, discounts: 1, point: 100 }) }] });
}

export function getMaestroSubscriptionPrices(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroCurrentPlan(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroBookings(_req, res) {
  return res.status(200).json({ items: [maestroBooking(2)], page: 1 });
}

export function getMaestroHelpers(_req, res) {
  return res.status(200).json({ items: [] });
}

export function getMaestroLanguages(_req, res) {
  return res.status(200).json({ items: [{ name: 'Vietnamese', code: 'vi' }] });
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
