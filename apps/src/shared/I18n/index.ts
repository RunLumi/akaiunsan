import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import en from './en';
import vi from './vi';
i18n.translations = {
	en,
	vi,
};
// Set the locale once at the beginning of your app.
// Vietnamese is the default language; English devices get English.
const locale = Localization.getLocales()[0]?.languageCode;
i18n.locale = locale && locale.toLowerCase().includes('en') ? 'en' : 'vi';

export default i18n;
