import * as i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as en from './en.json';
import * as id from './id.json';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    id: {
      translation: id,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
