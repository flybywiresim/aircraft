/* eslint-disable no-console */
// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { en } from './Localization/en';
import { es } from './Localization/es';
import { fr } from './Localization/fr';
import { de } from './Localization/de';
import { ru } from './Localization/ru';
import { sl } from './Localization/sl';
import { zhHant } from './Localization/zhHant';

console.log('Initializing Translation');

// map of maps to hold key-value maps for each language
const langMap = new Map<string, Map<string, string>>();

// Recursively iterates though a language data structure and creates a map with keys based on the
// property names of the children:
// "Dashboard.ImportantInformation.GoToPage" ==> "Go to Page"
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

// adds a key-value map to langMap and initializes the map
const init = (lang:string, data) => {
    langMap.set(lang, new Map<string, string>());
    initMap(langMap.get(lang), data, []);
};

init('en', en);
init('es', es);
init('fr', fr);
init('de', de);
init('ru', ru);
init('sl', sl);
init('zhHant', zhHant);

interface LanguageOption {
    langCode: string;
    alias: string;
}

// used for the dropdown in the flyPad settings page
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
        langCode: 'sl',
        alias: 'Slovenščina',
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

// // version without initialization into map
// const resolve = (path, obj, separator = '.') => {
//     const properties = Array.isArray(path) ? path : path.split(separator);
//     return properties.reduce((prev, curr) => prev && prev[curr], obj);
// };
//
// export function t(key: string): string {
// return resolve(key, resources[NXDataStore.get('EFB_LANGUAGE', 'en')].translation);
// }

// Returns localized string in the currently configured language when provided with
// correct identifier key.
// Otherwise, returns the key itself.
export function t(key: string): string {
    try { // prevents a timing error when loading in ACE/vite
        const lMap = langMap.get(NXDataStore.get('EFB_LANGUAGE', 'en'));
        if (lMap === undefined) return key;
        const s = lMap.get(key);
        if (s === undefined) return key;
        return s.trim();
    } catch (e) {
        return '';
    }
}
