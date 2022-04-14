// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */

import { NXDataStore } from '@shared/persistence';
import ar from './Localization/ar.json';
import cs from './Localization/cs.json';
import de from './Localization/de.json';
import el from './Localization/el.json';
import en from './Localization/en.json';
import es from './Localization/es.json';
import fi from './Localization/fi.json';
import fr from './Localization/fr.json';
import he from './Localization/he.json';
import hi from './Localization/hi.json';
import id from './Localization/id.json';
import it from './Localization/it.json';
import ja from './Localization/ja.json';
import ko from './Localization/ko.json';
import nb from './Localization/nb.json';
import nl from './Localization/nl.json';
import pl from './Localization/pl.json';
import pt from './Localization/pt-PT.json';
import ru from './Localization/ru.json';
import sl from './Localization/sl.json';
import sv from './Localization/sv.json';
import th from './Localization/th.json';
import tr from './Localization/tr.json';
import vi from './Localization/vi.json';
import zhHantHK from './Localization/zh-Hant-HK.json';

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

interface LanguageOption {
    langCode: string;
    langData: any;
    langName: string;
    alias: string;
}

// used for the dropdown in the flyPad settings page
export const languageOptions: LanguageOption[] = [
    { langCode: 'ar', langData: ar, langName: 'Arabic', alias: 'اَلْعَرَبِيَّةُ' },
    { langCode: 'cs', langData: cs, langName: 'Czech', alias: 'Čeština' },
    { langCode: 'de', langData: de, langName: 'German', alias: 'Deutsch' },
    { langCode: 'el', langData: el, langName: 'Greek', alias: 'Ελληνικά' },
    { langCode: 'en', langData: en, langName: 'English', alias: 'English' },
    { langCode: 'es', langData: es, langName: 'Spanish', alias: 'Español' },
    { langCode: 'fi', langData: fi, langName: 'Finnish', alias: 'Suomen kieli' },
    { langCode: 'fr', langData: fr, langName: 'French', alias: 'Français' },
    { langCode: 'he', langData: he, langName: 'Hebrew', alias: 'עִבְרִית' },
    { langCode: 'hi', langData: hi, langName: 'Hindi', alias: 'हिंदी' },
    { langCode: 'id', langData: id, langName: 'Indonesian', alias: 'Bahasa Indonesia' },
    { langCode: 'it', langData: it, langName: 'Italian', alias: 'Italiano' },
    { langCode: 'ja', langData: ja, langName: 'Japanese', alias: '日本語' },
    { langCode: 'ko', langData: ko, langName: 'Korean', alias: '한국어' },
    { langCode: 'nb', langData: nb, langName: 'Norwegian', alias: 'Norsk' },
    { langCode: 'nl', langData: nl, langName: 'Dutch', alias: 'Nederlands' },
    { langCode: 'pl', langData: pl, langName: 'Polish', alias: 'Polski' },
    { langCode: 'pt', langData: pt, langName: 'Portuguese', alias: 'Português' },
    { langCode: 'ru', langData: ru, langName: 'Russian', alias: 'Русский' },
    { langCode: 'sl', langData: sl, langName: 'Slovenian', alias: 'Slovenščina' },
    { langCode: 'sv', langData: sv, langName: 'Swedish', alias: 'Svenska' },
    { langCode: 'th', langData: th, langName: 'Thai', alias: 'ภาษาไทย' },
    { langCode: 'tr', langData: tr, langName: 'Turkish', alias: 'Türkçe' },
    { langCode: 'vi', langData: vi, langName: 'Vietnamese', alias: 'Tiếng Việt' },
    { langCode: 'zh-HK', langData: zhHantHK, langName: 'Chinese - HK', alias: '香港繁體' },
];

// Initialize all languages
languageOptions.forEach((ln) => {
    init(ln.langCode, ln.langData);
});

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
