import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

export const LANGUAGES = {
  en: { label: "English", short: "EN", flag: "🇬🇧" },
  hi: { label: "हिन्दी", short: "HI", flag: "🇮🇳" },
  or: { label: "ଓଡ଼ିଆ", short: "OR", flag: "🇮🇳" },
};

const translations = {
  en: {
    features: "Features",
    security: "Security",
    howItWorks: "How It Works",
    login: "Login",
    getStarted: "Get Started",
    aiProtection: "AI-Powered Real-Time Protection",
    stopFraud: "Stop Fraud",
    beforeItHappens: "Before It Happens.",
    protectAccount: "Protect My Account",
    seeHowItWorks: "See How It Works",
    realTimeDetection: "Real-Time Detection",
    explainableAI: "Explainable AI",
    privacyFirst: "Privacy First",
    powerfulProtection: "POWERFUL PROTECTION",
    moreThanFraud: "More than just",
    fraudDetection: "fraud detection.",
    transactionSecurity: "TRANSACTION SECURITY",
    highRisk: "HIGH RISK",
    suspiciousActivity: "Suspicious Activity",
    multipleSignals: "Multiple unusual signals detected",
    newBeneficiary: "New beneficiary",
    unusualAmount: "Unusual amount",
    newDevice: "New device",
    suspiciousVoice: "Suspicious voice interaction",
    reviewTransaction: "Review Transaction",
    language: "Language",
  },
  hi: {
    features: "विशेषताएँ",
    security: "सुरक्षा",
    howItWorks: "यह कैसे काम करता है",
    login: "लॉगिन",
    getStarted: "शुरू करें",
    aiProtection: "AI-संचालित रियल-टाइम सुरक्षा",
    stopFraud: "धोखाधड़ी रोकें",
    beforeItHappens: "होने से पहले।",
    protectAccount: "मेरे खाते को सुरक्षित करें",
    seeHowItWorks: "देखें यह कैसे काम करता है",
    realTimeDetection: "रियल-टाइम पहचान",
    explainableAI: "समझाने योग्य AI",
    privacyFirst: "गोपनीयता पहले",
    powerfulProtection: "शक्तिशाली सुरक्षा",
    moreThanFraud: "सिर्फ धोखाधड़ी पहचान से",
    fraudDetection: "कहीं अधिक।",
    transactionSecurity: "लेनदेन सुरक्षा",
    highRisk: "उच्च जोखिम",
    suspiciousActivity: "संदिग्ध गतिविधि",
    multipleSignals: "कई असामान्य संकेत मिले",
    newBeneficiary: "नया लाभार्थी",
    unusualAmount: "असामान्य राशि",
    newDevice: "नया डिवाइस",
    suspiciousVoice: "संदिग्ध वॉइस इंटरैक्शन",
    reviewTransaction: "लेनदेन की समीक्षा करें",
    language: "भाषा",
  },
  or: {
    features: "ବୈଶିଷ୍ଟ୍ୟ",
    security: "ସୁରକ୍ଷା",
    howItWorks: "ଏହା କିପରି କାମ କରେ",
    login: "ଲଗଇନ୍",
    getStarted: "ଆରମ୍ଭ କରନ୍ତୁ",
    aiProtection: "AI-ଚାଳିତ ରିଅଲ୍-ଟାଇମ୍ ସୁରକ୍ଷା",
    stopFraud: "ଠକେଇ ବନ୍ଦ କରନ୍ତୁ",
    beforeItHappens: "ଘଟିବା ପୂର୍ବରୁ।",
    protectAccount: "ମୋ ଆକାଉଣ୍ଟ ସୁରକ୍ଷିତ କରନ୍ତୁ",
    seeHowItWorks: "ଏହା କିପରି କାମ କରେ ଦେଖନ୍ତୁ",
    realTimeDetection: "ରିଅଲ୍-ଟାଇମ୍ ଚିହ୍ନଟ",
    explainableAI: "ବ୍ୟାଖ୍ୟାଯୋଗ୍ୟ AI",
    privacyFirst: "ଗୋପନୀୟତା ପ୍ରଥମେ",
    powerfulProtection: "ଶକ୍ତିଶାଳୀ ସୁରକ୍ଷା",
    moreThanFraud: "କେବଳ ଠକେଇ ଚିହ୍ନଟଠାରୁ",
    fraudDetection: "ଅଧିକ।",
    transactionSecurity: "ଲେନଦେନ ସୁରକ୍ଷା",
    highRisk: "ଉଚ୍ଚ ବିପଦ",
    suspiciousActivity: "ସନ୍ଦେହଜନକ କାର୍ଯ୍ୟକଳାପ",
    multipleSignals: "ଅନେକ ଅସାଧାରଣ ସଙ୍କେତ ଚିହ୍ନଟ ହୋଇଛି",
    newBeneficiary: "ନୂଆ ଲାଭାର୍ଥୀ",
    unusualAmount: "ଅସାଧାରଣ ରାଶି",
    newDevice: "ନୂଆ ଡିଭାଇସ୍",
    suspiciousVoice: "ସନ୍ଦେହଜନକ ଭଏସ୍ ଇଣ୍ଟରାକ୍ସନ୍",
    reviewTransaction: "ଲେନଦେନ ସମୀକ୍ଷା କରନ୍ତୁ",
    language: "ଭାଷା",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("fraudshield-language") || "en";
  });

  useEffect(() => {
    const selected = LANGUAGES[language] ? language : "en";
    document.documentElement.setAttribute("lang", selected);
    document.documentElement.setAttribute("data-language", selected);
    document.body.setAttribute("data-language", selected);
    localStorage.setItem("fraudshield-language", selected);
  }, [language]);

  const changeLanguage = (nextLanguage) => {
    if (LANGUAGES[nextLanguage]) setLanguage(nextLanguage);
  };

  const t = useMemo(() => {
    return (key) => translations[language]?.[key] ?? translations.en[key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: changeLanguage, changeLanguage, t, languages: LANGUAGES }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
