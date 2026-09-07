import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import en from './en';
import th from './th';
i18n.translations = {
	en,
	th,
};
// Set the locale once at the beginning of your app.
const locale = Localization.getLocales()[0]?.languageCode;
i18n.locale = locale && locale.toLowerCase().includes('th') ? 'th' : 'en';

export default i18n;
