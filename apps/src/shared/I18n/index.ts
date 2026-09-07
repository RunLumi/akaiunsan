import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import en from './en';
import th from './th';
i18n.translations = {
	en,
	th,
};
// Set the locale once at the beginning of your app.
i18n.locale = Localization.locale.toLowerCase().includes('th') ? 'th' : 'en';

export default i18n;
