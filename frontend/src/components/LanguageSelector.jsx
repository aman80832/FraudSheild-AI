import { Languages } from "lucide-react";
import { LANGUAGES, useLanguage } from "../context/LanguageContext";

function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="language-selector" title="Choose language">
      <Languages size={16} aria-hidden="true" />
      <select
        value={language}
        onChange={(event) => changeLanguage(event.target.value)}
        aria-label="Choose language"
      >
        {Object.entries(LANGUAGES).map(([code, item]) => (
          <option key={code} value={code}>
            {item.flag} {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
