import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import hiTranslations from "./locales/hi.json";
import taTranslations from "./locales/ta.json";
import bnTranslations from "./locales/bn.json";
import teTranslations from "./locales/te.json";
import mrTranslations from "./locales/mr.json";
import guTranslations from "./locales/gu.json";
import knTranslations from "./locales/kn.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  hi: {
    translation: hiTranslations,
  },
  ta: {
    translation: taTranslations,
  },
  bn: {
    translation: bnTranslations,
  },
  te: {
    translation: teTranslations,
  },
  mr: {
    translation: mrTranslations,
  },
  gu: {
    translation: guTranslations,
  },
  kn: {
    translation: knTranslations,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: "en", // Default language
    lng: localStorage.getItem("selectedLanguage") || "en", // Load saved language or default to English

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
