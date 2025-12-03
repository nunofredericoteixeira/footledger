import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { type Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, userId }: { children: ReactNode; userId: string | null }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (userId) {
      loadUserLanguage(userId);
    }
  }, [userId]);

  const loadUserLanguage = async (userId: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('language')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.language) {
      setLanguageState(profile.language as Language);
    }
  };

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);

    if (userId) {
      await supabase
        .from('user_profiles')
        .update({ language: newLang })
        .eq('id', userId);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
