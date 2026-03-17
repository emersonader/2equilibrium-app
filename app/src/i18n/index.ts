import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// UI translations
import en_ui from './locales/en/ui.json';
import es_ui from './locales/es/ui.json';
import pt_ui from './locales/pt/ui.json';

// Detect device language, map to supported
function getDeviceLanguage(): string {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      const lang = locales[0].languageCode;
      if (lang === 'es') return 'es';
      if (lang === 'pt') return 'pt';
    }
  } catch (e) {
    console.warn('Failed to detect device locale:', e);
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en_ui },
    es: { translation: es_ui },
    pt: { translation: pt_ui },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'es', 'pt'],
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
