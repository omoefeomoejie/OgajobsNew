import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enHome from './locales/en/home.json';
import enServices from './locales/en/services.json';

import pcnCommon from './locales/pcn/common.json';
import pcnAuth from './locales/pcn/auth.json';
import pcnHome from './locales/pcn/home.json';
import pcnServices from './locales/pcn/services.json';

import yoCommon from './locales/yo/common.json';
import yoAuth from './locales/yo/auth.json';
import yoHome from './locales/yo/home.json';
import yoServices from './locales/yo/services.json';

import haCommon from './locales/ha/common.json';
import haAuth from './locales/ha/auth.json';
import haHome from './locales/ha/home.json';
import haServices from './locales/ha/services.json';

import igCommon from './locales/ig/common.json';
import igAuth from './locales/ig/auth.json';
import igHome from './locales/ig/home.json';
import igServices from './locales/ig/services.json';

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pcn', name: 'Pidgin English', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
];

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    home: enHome,
    services: enServices,
  },
  pcn: {
    common: pcnCommon,
    auth: pcnAuth,
    home: pcnHome,
    services: pcnServices,
  },
  yo: {
    common: yoCommon,
    auth: yoAuth,
    home: yoHome,
    services: yoServices,
  },
  ha: {
    common: haCommon,
    auth: haAuth,
    home: haHome,
    services: haServices,
  },
  ig: {
    common: igCommon,
    auth: igAuth,
    home: igHome,
    services: igServices,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;