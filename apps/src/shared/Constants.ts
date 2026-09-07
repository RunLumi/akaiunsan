export default {
  SCREENS: {
    AUTH: {
      LOGIN: "Auth/Login",
      SIGNUP: "Auth/Signup",
      FORGOT_PASSWORD: "Auth/ForgotPassword",
    },
    MAIN: {
      BOTTOM_BAR: "Main/BottomBar",
      HOME: "Home",
      ACCOUNT: "Account",
      BOOKING: "Booking",
      INBOX: "Inbox",
    },
    ADDRESS: {
      ADDRESS: "Address",
      PICK_ADDRESS: "Address/Pick",
    },
    BOOKING: {
      CALENDAR: "Booking/Calendar",
      DETAIL: "Booking/BookingDetail",
      DETAIL_HISTORY: "Booking/DetailHistory",
    },
    MYBOOKING: {
      LIST: "MyBooking/List",
      DETAIL_MYBOOKING: "MyBooking/Detail",
    },
    PAYMENT: {
      LIST: "Payment/List",
    },
    FAVOURITE: {
      MENU: "Favourite",
      SERVICE: "Favourite/Service",
      SERVICE_PROVIDER: "Favourite/ServiceProvider",
    },
    PROMOTIOM: {
      DETAIL: "Promotion/Detail",
      LIST_PROMOTION: "Promotion/List",
    },
    HISTORY: {
      DETAIL: "History/Detail",
      LIST_HISTORY: "History/List",
    },
    SUBSCRIPTION: {
      DETAIL: "Subscription/Detail",
      AllSubscriptionPlan: "AllSubscriptionPlan",
    },
    SERVICE: {
      SERVICE: "Service",
      AllService: "AllService",
      EDITANDREORDERANDEDITSERVICE: "EditAndReOrderAndEditService",
    },

    OTHER: {
      PREFERTOFRIEND: "PreferToFriend",
      INBOXDETAIL: "InboxDetail",
      EditProfile: "EditProfile",
      PAYMENT_PETCARE: "PaymentPetcare",

      UPGRADE_FEXIBLE_PLAN: "FexiblePlan/Upgrade",
      LIST_FEXIBLE_PLAN: "FexiblePlan/ListPlan",
      AGREE_FEXIBLE_PLAN: "FexiblePlan/Agree",
      DETAIL_FEXIBLE_PLAN: "FexiblePlan/Detail",
      ADD_FIX_PLAN: "FixPlan/AddFixPlan",
      ADDRESS_FIX_PLAN: "FixPlan/PickAddress",

      ABOUT_US: "AboutUs",
      ABOUT_US_VIEW: "AboutUs/View",
    },
  },
  API: {
    // dev
    dev: "http://api-mobile-ayasan.dev.ncs.int",
    // base: 'http://api-mobile-ayasan.dev.ncs.int:80',
    stg: "https://api-mobile-ayasan.stg.nichietsuvn.com",
    //prod
    base: "https://api-mobile.ayasan.vn",
    upload_image: "/uploads/image",

    // AUTH
    login: "/users/login",
    register: "/users/register",
    forgot_password: "/users/get-otp-forget-password",
    check_otp: "/users/check-otp-forget-password",
    change_password: "/users/change-password",
    reset_password: "/users/reset-password",
    line_login: "/users/line-login",
    google_login: "/users/google-login",
    apple_login: "/users/apple-login",
    remove_account: "/users/delete-profile",
    // HOME
    get_version: "/configuration/versions",
    update_language: "/users/update-language",
    get_profile: "/users/me",
    edit_profile: "/users/update-profile",
    get_banner: "/banner/get-banner",
    get_promotion: "/promotion/get-promotion",
    promotion_updates: "/promotion/promotion-updates",
    promotion_detail: "/promotion/detail",
    promotion_apply: "/promotion/apply",
    promotion_used: "/promotion/get-promotion-used",
    get_notification: "/notification/get",
    add_device_notification: "/notification/add-device",
    get_notification_detail: "/notification/detail",
    delete_notification: "/notification/delete",
    read_all_notification: "/notification/read-all",
    referral_list: "/referral/referral-list",
    configuration_province: "/configuration/province",
    configuration_district: "/configuration/district",
    country: "/country",
    languages: "/languages",
    get_frequent_activity: "/favourite/services",

    // SERVICE
    services_management: "/services-management",
    services_management_item: "/services-management/service-item",
    services_management_helper: "/services-management/helpers",
    services_management_helper_suggest: "/services-management/suggest",
    config_price: "/config-price/get",
    config_point: "/config-point/get",
    price_special_request: "/config-price/price-special-request",
    config_subscription_prices: "/config-price/subscription-prices",
    get_payment: "/payment-method/get",

    // BOOKING
    booking_detail: "/booking/detail",
    booking_get: "/booking/get",
    orders_edit: "/booking/detail/edit",

    // ORDER
    orders_maid: "/orders/maid-service",
    orders_nany: "/orders/nany",
    orders_elder: "/orders/elder",
    orders_ac_cleaning: "/orders/ac-cleaning",
    orders_petcare: "/orders/petcare",
    orders_cancel: "/orders/cancel",
    charges: "/charges",
    chargescard: "/charges-card",
    chargesplan: "/charges-plan",

    payment_petcare: "/payment/petcare",
    payment_card_list: "/payment-card/get-customer-card",
    payment_card_delete: "/payment-card/delete-card",
    payment_card_add: "/payment-card/add-card",
    payment_card_default: "/payment-card/update-default-card",

    list_address: "/user-address",
    add_address: "/user-address/add",
    edit_address: "/user-address/edit",
    delete_address: "/user-address/delete",

    list_favourite_service: "/favourite/services",
    update_favourite_service: "/favourite/services-update",
    delete_favourite_service: "/favourite/services-delete",
    list_favourite_service_provider: "/favourite/service-providers",
    update_favourite_service_provider: "/favourite/services-provider-update",
    delete_favourite_service_provider: "/favourite/services-provider-delete",

    get_booking: "/booking/get",
    detail_booking: "/booking/detail",

    cancel_order: "/orders/cancel",
    review_order: "/orders/review",
    special_request: "/special-request/create",

    get_plan: "/subscription-plan/get",
    get_subscription: "/booking/get-v2",
    cancel_subscription: "/orders/cancel-fix-plan",
    get_current_plan: "/subscription-plan/get-current-plan",
    order_flexible_plan: "/subscription-plan/order-flexible",
    upgrade_flexible_plan: "/subscription-plan/upgrade-flexible",
    downgrade_flexible_plan: "/subscription-plan/downgrade-flexible",
    cancel_flexible_plan: "/subscription-plan/cancel-flexible",
    get_current_fixplan: "/orders/curent-fixplan",
    order_fix_plan_maid: "/orders/fix-plan-maid-service",
    order_fix_plan_nanny: "/orders/fix-plan-nanny-service",
    order_fix_plan_elder: "/orders/fix-plan-elder-service",
    order_fix_plan_petcare: "/orders/fix-plan-pet-care-service",
    order_cancel_fix_plan: "/orders/cancel-fix-plan",
    get_agree_plan: "/subscription-plan/get-agree",
    toggle_renew_flexible: "/subscription-plan/toggle-renew-flexible",
    toggle_renew_fix: "/subscription-plan/toggle-renew-fix",
    config_price_subscription: "/config-price/subscription-prices",

    services_suggest_fixplan: "/services-management/suggest-fixplan",
    services_helper_fixplan: "/services-management/helper-fix-plan",
  },
  //stg
  LOGINLINE:
    "https://admin-ayasan.stg.nichietsuvn.com/assets/html/PageRedirectLineLogin.html",
  // pro
  // LOGINLINE:'https://admincp.ayasan.vn/assets/html/RedirectLineLogin.html',
  //dev
  // LOGINLINE:'https://admin-ayasan.dev.nichietsuvn.com/assets/html/PageRedirectLineLoginDev.html',
  iOSLink: "com.akaiunsan.customer://",
  androidLink: "akaiunsan://",
  //Nhờ KH cung cấp key google mapp cấu hình ở đây và app.json
  GOOGLEMAPSAPIKEYIOS: "AIzaSyD6rt8Bo6w4maFl8LBeX7zYczkEJfulwco",
  GOOGLEMAPSAPIKEYANDROIND: "AIzaSyD6rt8Bo6w4maFl8LBeX7zYczkEJfulwco",
};
