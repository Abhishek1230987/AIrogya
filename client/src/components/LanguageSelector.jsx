import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || "en");

  const languages = [
    { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  ];

  useEffect(() => {
    setSelectedLang(i18n.language);
  }, [i18n.language]);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("selectedLanguage", langCode);
    setSelectedLang(langCode);
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center space-x-2">
        <GlobeAltIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        <select
          value={selectedLang}
          onChange={(e) => changeLanguage(e.target.value)}
          className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.nativeName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
