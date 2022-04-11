/* eslint-disable no-console */
// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { en } from './Localization/en';
import { es } from './Localization/es';
import { fr } from './Localization/fr';
import { de } from './Localization/de';
import { ru } from './Localization/ru';
import { zhHant } from './Localization/zhHant';

// export const resources = {
//     en: { translation: en },
//     es: { translation: es },
//     fr: { translation: fr },
//     de: { translation: de },
//     ru: { translation: ru },
//     zhHant: { translation: zhHant },
// };

console.log('Init Translation');

const initMap = (map, ln, path: Array<string>) => {
    const props = Object.getOwnPropertyNames(ln);
    if (typeof ln !== 'object') {
        map.set(path.join('.'), ln);
        return;
    }
    props.forEach((p: string) => {
        path.push(p);
        initMap(map, ln[p], path);
        path.pop();
    });
};

const langMap = new Map<string, Map<string, string>>();

const init = (lang:string, data) => {
    langMap.set(lang, new Map<string, string>());
    initMap(langMap.get(lang), data, []);
};

init('en', en);
init('es', es);
init('fr', fr);
init('de', de);
init('ru', ru);
init('zhHant', zhHant);

console.log('Init Translation done.');

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
    {
        langCode: 'de',
        alias: 'Deutsch',
    },
    {
        langCode: 'ru',
        alias: 'Русский',
    },
    {
        langCode: 'zhHant',
        alias: '傳統的',
    },
];

const watchLanguageChanges = () => {
    NXDataStore.getAndSubscribe(
        'EFB_LANGUAGE',
        (_, value) => {
            // eslint-disable-next-line no-console
            console.log(`language changed to ${value}`);
        },
        'en',
    );
};

if (process.env.VITE_BUILD) {
    window.addEventListener('AceInitialized', watchLanguageChanges);
} else {
    watchLanguageChanges();
}

// const resolve = (path, obj, separator = '.') => {
//     const properties = Array.isArray(path) ? path : path.split(separator);
//     return properties.reduce((prev, curr) => prev && prev[curr], obj);
// };

// Returns localized string in the currently configured language when provided with
// correct identifier key.
// Otherwise, returns the key itself.
export function t(key: string): string {
    try { // prevents a timing error when loading
        const efbLanguage: string = NXDataStore.get('EFB_LANGUAGE', 'en');

        const lMap = langMap.get(efbLanguage);
        if (lMap === undefined) return key;
        const s = lMap.get(key);
        if (s === undefined) return key;
        return s.trim();
    // return resolve(key, resources[efbLanguage].translation);
    } catch (e) {
        return '';
    }
}
