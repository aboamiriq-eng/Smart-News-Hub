import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'ar' | 'en';

interface TranslationContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.breaking": "عاجل",
    "nav.admin": "لوحة التحكم",
    "nav.search": "بحث",
    "admin.dashboard": "لوحة التحكم",
    "admin.articles": "المقالات",
    "admin.categories": "التصنيفات",
    "admin.sources": "المصادر",
    "admin.advertisements": "الإعلانات",
    "admin.analytics": "التحليلات",
    "admin.settings": "الإعدادات",
    "search.placeholder": "ابحث عن مقالات...",
    "article.readMore": "اقرأ المزيد",
    "article.views": "مشاهدة",
    "article.published": "تاريخ النشر",
    "article.related": "مقالات ذات صلة",
    "category.all": "كل المقالات",
    "general.loading": "جاري التحميل...",
    "general.error": "حدث خطأ.",
  },
  en: {
    "nav.home": "Home",
    "nav.breaking": "Breaking",
    "nav.admin": "Admin",
    "nav.search": "Search",
    "admin.dashboard": "Dashboard",
    "admin.articles": "Articles",
    "admin.categories": "Categories",
    "admin.sources": "Sources",
    "admin.advertisements": "Advertisements",
    "admin.analytics": "Analytics",
    "admin.settings": "Settings",
    "search.placeholder": "Search articles...",
    "article.readMore": "Read more",
    "article.views": "views",
    "article.published": "Published",
    "article.related": "Related Articles",
    "category.all": "All Articles",
    "general.loading": "Loading...",
    "general.error": "An error occurred.",
  }
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'ar' || saved === 'en') return saved;
    return navigator.language.startsWith('ar') ? 'ar' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
