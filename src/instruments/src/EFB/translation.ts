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
    langName: string;
    alias: string;
}

// used for the dropdown in the flyPad settings page
export const languageOptions: LanguageOption[] = [
    { langCode: 'ar', langName: 'Arabic', alias: 'اَلْعَرَبِيَّةُ' },
    { langCode: 'cs', langName: 'Czech', alias: 'Čeština' },
    { langCode: 'de', langName: 'German', alias: 'Deutsch' },
    { langCode: 'el', langName: 'Greek', alias: 'Ελληνικά' },
    { langCode: 'en', langName: 'English', alias: 'English' },
    { langCode: 'es', langName: 'Spanish', alias: 'Español' },
    { langCode: 'fi', langName: 'Finnish', alias: 'Suomen kieli' },
    { langCode: 'fr', langName: 'French', alias: 'Français' },
    { langCode: 'he', langName: 'Hebrew', alias: 'עִבְרִית' },
    { langCode: 'it', langName: 'Italian', alias: 'Italiano' },
    { langCode: 'jp', langName: 'Japanese', alias: '日本語' },
    { langCode: 'ko', langName: 'Korean', alias: '한국어' },
    { langCode: 'nb', langName: 'Norwegian', alias: 'Norsk' },
    { langCode: 'nl', langName: 'Dutch', alias: 'Nederlands' },
    { langCode: 'pl', langName: 'Polish', alias: 'Polski' },
    { langCode: 'pt', langName: 'Portuguese', alias: 'Português' },
    { langCode: 'ru', langName: 'Russian', alias: 'Русский' },
    { langCode: 'sl', langName: 'Slovenian', alias: 'Slovenščina' },
    { langCode: 'sv', langName: 'Swedish', alias: 'Svenska' },
    { langCode: 'th', langName: 'Thai', alias: 'ภาษาไทย' },
    { langCode: 'vi', langName: 'Vietnamese', alias: 'Tiếng Việt' },
    { langCode: 'zh-HK', langName: 'Chinese HK', alias: '正體字' },
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
