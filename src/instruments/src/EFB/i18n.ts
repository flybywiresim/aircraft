import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { NXDataStore } from '@shared/persistence';
import { en } from './Localization/en';
import { es } from './Localization/es';
import { fr } from './Localization/fr';

export const resources = {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
};

interface LanguageOption {
    langCode: string;
    alias: string;
}

export const languageOptions: LanguageOption[] = [
    {
        langCode: 'en',
        alias: 'English',
    },
    {
        langCode: 'es',
        alias: 'Español',
    },
    {
        langCode: 'fr',
        alias: 'Français',
    },
];

i18n
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: true,
        supportedLngs: languageOptions.map((option) => option.langCode),
        interpolation: { escapeValue: false },
        resources,
    });

const watchLanguageChanges = () => {
    NXDataStore.getAndSubscribe(
        'EFB_LANGUAGE',
        (_, value) => {
            i18n.changeLanguage(value);
        },
        'en',
    );
};

if (process.env.VITE_BUILD) {
    window.addEventListener('AceInitialized', watchLanguageChanges);
} else {
    watchLanguageChanges();
}

export default i18n;
