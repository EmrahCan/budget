import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import trTranslations from './locales/tr.json';
import enTranslations from './locales/en.json';

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources: {
      tr: { translation: trTranslations },
      en: { translation: enTranslations }
    },
    fallbackLng: 'tr', // Default language is Turkish
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

export default i18n;
