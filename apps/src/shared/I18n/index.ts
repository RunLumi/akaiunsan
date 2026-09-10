import i18n from 'i18n-js';
import en from './en';
import vi from './vi';
i18n.translations = {
	en,
	vi,
};
// Vietnamese is the product default. Users can still switch to English from
// the in-app language control; the device's system locale must not silently
// change the first-run experience.
i18n.locale = 'vi';

export default i18n;
