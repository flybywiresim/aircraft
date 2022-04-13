// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */

import { NXDataStore } from '@shared/persistence';
import { ar } from './Localization/ar';
import { cs } from './Localization/cs';
import { de } from './Localization/de';
import { el } from './Localization/el';
import { en } from './Localization/en';
import { es } from './Localization/es';
import { fi } from './Localization/fi';
import { fr } from './Localization/fr';
import { he } from './Localization/he';
import { it } from './Localization/it';
import { ja } from './Localization/ja';
import { ko } from './Localization/ko';
import { nb } from './Localization/nb';
import { nl } from './Localization/nl';
import { pl } from './Localization/pl';
import { pt } from './Localization/pt';
import { ru } from './Localization/ru';
import { sl } from './Localization/sl';
import { sv } from './Localization/sv';
import { th } from './Localization/th';
import { vi } from './Localization/vi';
import { zhHantHK } from './Localization/zh-Hant-HK';

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

init('ar', ar);
init('cs', cs);
init('de', de);
init('el', el);
init('en', en);
init('es', es);
init('fi', fi);
init('fr', fr);
init('he', he);
init('it', it);
init('ja', ja);
init('ko', ko);
init('nb', nb);
init('nl', nl);
init('pl', pl);
init('pt', pt);
init('ru', ru);
init('sl', sl);
init('sv', sv);
init('th', th);
init('vi', vi);
init('zh-HK', zhHantHK);

interface LanguageOption {
    langCode: string;
    alias: string;
}

// used for the dropdown in the flyPad settings page
export const languageOptions: LanguageOption[] = [
    { langCode: 'ar', alias: 'اَلْعَرَبِيَّةُ (Arabic)' },
    { langCode: 'cs', alias: 'Čeština (Czech)' },
    { langCode: 'de', alias: 'Deutsch (German)' },
    { langCode: 'el', alias: 'Ελληνικά (Greek)' },
    { langCode: 'en', alias: 'English' },
    { langCode: 'es', alias: 'Español (Spanish)' },
    { langCode: 'fi', alias: 'Suomen kieli (Finnish)' },
    { langCode: 'fr', alias: 'Français (French)' },
    { langCode: 'he', alias: 'עִבְרִית (Hebrew)' },
    { langCode: 'it', alias: 'Italiano (Italian)' },
    { langCode: 'jp', alias: '日本語 (Japanese)' },
    { langCode: 'ko', alias: '한국어 (Korean)' },
    { langCode: 'nb', alias: 'Norsk (Norwegian)' },
    { langCode: 'nl', alias: 'Nederlands (Dutch)' },
    { langCode: 'pl', alias: 'Polski (Polish)' },
    { langCode: 'pt', alias: 'Português (Portuguese)' },
    { langCode: 'ru', alias: 'Русский (Russian)' },
    { langCode: 'sl', alias: 'Slovenščina (Slovenian)' },
    { langCode: 'sv', alias: 'Svenska (Swedish)' },
    { langCode: 'th', alias: 'ภาษาไทย (Thai)' },
    { langCode: 'vi', alias: 'Tiếng Việt (Vietnamese)' },
    { langCode: 'zh-HK', alias: '正體字 (Chinese HK)' },
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
    const lMap = langMap.get(NXDataStore.get('EFB_LANGUAGE', 'en'));
    if (lMap === undefined) return key;
    const s = lMap.get(key);
    if (s === undefined) return key;
    return s;
}
