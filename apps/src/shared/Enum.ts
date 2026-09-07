export default {
	GENDER: [
		{ label: "Female", value: 0 },
		{ label: "Male", value: 1 },
		// { label: "Other", value: 2 },
		{ label: "Miss", value: 2 },
	],

	RoleMember: {
		Admin: {
			label: "Admin",
			value: 0
		},
		Member: {
			label: "Member",
			value: 1
		}
	},

	SERVICE_TYPE: {
		MaidService: 1,
		NanyService: 2,
		ElderService: 3,
		CleaningService: 4,
		PetcareService: 5,
	},

	PRICES: {
		MaidService: 1,
		MaidService_Eng: 2,
		NanyService: 3,
		NanyService_Eng: 4,
		ElderService: 5,
		ElderService_Eng: 6,
		PetcareService: 7,
		PetcareService_Eng: 8
	},

	POINT: {
		MONEY_CONVERT_POINT: 1,
		POINT_CONVERT_DISCOUNT: 2,
		REWARD_POINT: 3,
	},

	SETTING: {
		PAYMENT_METHOD_CASH: 1,
		PAYMENT_METHOD_CREDIT_CARD: 2
	},

	OrderStatus: {
		PENDING: 0,
		MATCH: 1,
		COMPLETED: 2,
		CANCEL: 3,
		ON_PROCESS: 4,
		WAITING_CONFIRM: 5,
		RECEIVED: 6
	},
	OrderStatusDetail: {
		"Pending": 0,
		"Match": 1,
		"Completed": 2,
		"Cancel": 3,
		"On process": 4,
		"Waiting confirm": 5
	},
	OrderStatusDetailColor: {
		"#ffeb3b": 0,
		"#4caf51": 1,
		"#4caf50": 2,
		"#f44336": 3,
		"#03a9f4": 4,
		"#00bcd4": 5
	},
	PaymentStatusDetail: {
		"": 0,
		"Done": 1,
		"Not": 2,
	},

	Type: {
		Order: 0,
		Promotion: 1
	},

	PromotionType: {
		GIFT_PERCENT: 1,
		GIFT_MONEY: 2,
		GIFT_POINT: 3,
		EXTRA_SERVICES: 4,
	},

	PromotionTypeText: {
		"": 0,
		"Gift Percent": 1,
		"Gift Money": 2,
		"Gift Point": 3,
		"Extra Services": 4,
	},
	PromotionStatus: {
		ACTIVE: 1,
		INACTIVE: 2,
		PROGRESSING: 3,
		EXPIRED: 4,
		STOPPED: 5,

	},
	InboxType: {
		ORDER: 0,
		PROMOTION: 1,
		NEWS: 2,
		SUBSCRIPTIONORDER: 3
	},

	PlanType: {
		FLEXIBLE: 1,
		FIX: 2,
	},

	PLAN_TYPE: {
		FLEXIBLE_PLAN: 1,
		FIX_PLAN: 2,
	},

	PLAN_RANK: {
		SILVER: 1,
		GOLD: 2,
		PLATINUM: 3,
	},
	SubscriptionStatus: {
		NEW: 1,
		ACTIVE: 2,
		EXPIRED: 3,
		CANCEL: 4,
	},
	PriceSpecialRequest: {
		COSTSP: 1,
		LANGUAGE: 2
	},
	PlatformType: {
		IOS: '1',
		ANDROID: '2',
		WEBSITE: '3',
	},
	HelperStatus: {
		ACTIVE: 1,
		INACTIVE: 2,
	}
};
