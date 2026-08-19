import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', region: 'Popular' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'Popular' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'Popular' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Popular' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'Popular' },
  { code: 'zh-CN', name: 'Chinese (Simp)', nativeName: '中文 (简体)', flag: '🇨🇳', region: 'Popular' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: 'Popular' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'Popular' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'Europe' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'Europe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'Europe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', region: 'Europe' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'Europe' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', region: 'Europe' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', region: 'Europe' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', region: 'Europe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', region: 'Europe' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', region: 'Europe' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', region: 'Europe' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', region: 'Asia & Pacific' },
  { code: 'zh-TW', name: 'Chinese (Trad)', nativeName: '中文 (繁體)', flag: '🇹🇼', region: 'Asia & Pacific' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', region: 'Asia & Pacific' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'Asia & Pacific' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', region: 'Asia & Pacific' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', region: 'Asia & Pacific' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', region: 'Asia & Pacific' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', region: 'Asia & Pacific' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', region: 'Asia & Pacific' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', region: 'Asia & Pacific' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'Asia & Pacific' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Asia & Pacific' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', region: 'Asia & Pacific' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Filipino', flag: '🇵🇭', region: 'Asia & Pacific' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', region: 'Middle East & Americas' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', region: 'Middle East & Americas' },
];

const LanguageContext = createContext();

const CACHE_KEY = 'bms_translation_cache';

const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem('bms_language');
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }
  } catch (e) {
    /* ignore */
  }
  return 'en';
};

const getTranslationCache = () => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (e) {
    return {};
  }
};

const setTranslationCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    /* ignore quota limits */
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);

  // Set Google Translate cookie and handle DOM language switching
  const applyLanguageCookie = (langCode) => {
    try {
      const hostname = window.location.hostname;
      if (langCode === 'en') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;
        if (hostname && hostname !== 'localhost') {
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`;
        }
      } else {
        const cookieValue = `/en/${langCode}`;
        document.cookie = `googtrans=${cookieValue}; path=/;`;
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${hostname}`;
        if (hostname && hostname !== 'localhost') {
          document.cookie = `googtrans=${cookieValue}; path=/; domain=.${hostname}`;
        }
      }
    } catch (e) {
      console.warn('Could not set googtrans cookie', e);
    }
  };

  const changeLanguage = useCallback((langCode) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === langCode)) return;
    setCurrentLanguage(langCode);
    try {
      localStorage.setItem('bms_language', langCode);
    } catch (e) {
      /* ignore */
    }

    applyLanguageCookie(langCode);

    // Trigger Google Translate element change if available
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = langCode;
      selectElem.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  }, []);

  // Initialize Google Translate Element script on mount & dynamically offset navbar below banner
  useEffect(() => {
    const initialLang = getInitialLanguage();
    if (initialLang && initialLang !== 'en') {
      applyLanguageCookie(initialLang);
    }

    const updateBannerOffset = () => {
      // Find Google Translate banner frame
      const banner = document.querySelector(
        '.goog-te-banner-frame, iframe.goog-te-banner-frame, .VIpgJd-ZVi9od-ORHb-OEVmcd, iframe.skiptranslate'
      );
      let bannerHeight = 0;

      if (banner) {
        const style = window.getComputedStyle(banner);
        if (style.display !== 'none' && style.visibility !== 'hidden' && banner.offsetHeight > 0) {
          bannerHeight = banner.offsetHeight || 40;
        }
      }

      // Check if body top style was set by Google Translate
      if (!bannerHeight && document.body && document.body.style.top) {
        const parsedTop = parseInt(document.body.style.top, 10);
        if (parsedTop > 0) {
          bannerHeight = parsedTop;
        }
      }

      document.documentElement.style.setProperty('--gt-banner-height', `${bannerHeight}px`);
    };

    updateBannerOffset();
    const observer = new MutationObserver(updateBannerOffset);
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    }
    if (document.documentElement) {
      observer.observe(document.documentElement, { attributes: true });
    }
    window.addEventListener('resize', updateBannerOffset);
    const interval = setInterval(updateBannerOffset, 200);

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: SUPPORTED_LANGUAGES.map(l => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateBannerOffset);
      clearInterval(interval);
    };
  }, []);

  // Translate text via Google Translate REST API with local caching
  const translateText = useCallback(async (text, targetLang = currentLanguage) => {
    if (!text || targetLang === 'en') return text;

    const cacheKey = `${targetLang}:${text}`;
    const cache = getTranslationCache();
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    setIsTranslating(true);
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      if (data && data[0]) {
        const translated = data[0].map(item => item[0]).join('');
        cache[cacheKey] = translated;
        setTranslationCache(cache);
        setIsTranslating(false);
        return translated;
      }
    } catch (err) {
      console.warn('Google Translate API error, returning fallback:', err);
    }
    setIsTranslating(false);
    return text;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        translateText,
        isTranslating,
        languages: SUPPORTED_LANGUAGES,
        currentLangObj: SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0],
      }}
    >
      <div id="google_translate_element" style={{ display: 'none' }} />
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
