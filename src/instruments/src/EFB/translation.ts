// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */

import { NXDataStore } from '@shared/persistence';

// source language
import en from './Localization/en.json';
// translations
import ar from './Localization/ar.json';
import cs from './Localization/cs.json';
import de from './Localization/de.json';
import da from './Localization/da-DK.json';
import el from './Localization/el.json';
import es from './Localization/es.json';
import eu from './Localization/eu.json';
import fi from './Localization/fi.json';
import fr from './Localization/fr.json';
import he from './Localization/he.json';
import hi from './Localization/hi.json';
import hu from './Localization/hu.json';
import hr from './Localization/hr.json';
import id from './Localization/id.json';
import it from './Localization/it.json';
import ja from './Localization/ja.json';
import ko from './Localization/ko.json';
import lt from './Localization/lt.json';
import nb from './Localization/nb.json';
import nl from './Localization/nl.json';
import pl from './Localization/pl.json';
import ptBR from './Localization/pt-BR.json';
import ptPT from './Localization/pt-PT.json';
import ro from './Localization/ro.json';
import ru from './Localization/ru.json';
import sk from './Localization/sk.json';
import sl from './Localization/sl.json';
import sv from './Localization/sv.json';
import th from './Localization/th.json';
import tr from './Localization/tr.json';
import vi from './Localization/vi.json';
import zhHansCN from './Localization/zh-Hans-CN.json';
import zhHantHK from './Localization/zh-Hant-HK.json';
import zhHantTW from './Localization/zh-Hant-TW.json';

console.log('Initializing Translation');

// map of maps to hold key-value maps for each language
const allLanguagesMap = new Map<string, Map<string, string>>();

// Recursively iterates through a language data structure and creates a map with keys based on the
// property names of the children - essentially flatten the hierarchy:
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

// adds a key-value map to allLanguagesMap and initializes the map
const init = (lang:string, data) => {
    const map = new Map<string, string>();
    allLanguagesMap.set(lang, map);
    initMap(allLanguagesMap.get(lang), data, []);
    return map;
};

interface LanguageOption {
    langCode: string;
    langData: any;
    langName: string;
    alias: string;
}

// used to initialize languages and for the dropdown in the flyPad settings page
export const languageOptions: LanguageOption[] = [
    // Source language first
    { langCode: 'en', langData: en, langName: 'English', alias: 'English' },
    // translations sorted by language code
    { langCode: 'ar', langData: ar, langName: 'Arabic', alias: 'اَلْعَرَبِيَّةُ' },
    { langCode: 'cs', langData: cs, langName: 'Czech', alias: 'Čeština' },
    { langCode: 'da', langData: da, langName: 'Dansk', alias: 'Dansk' },
    { langCode: 'de', langData: de, langName: 'German', alias: 'Deutsch' },
    { langCode: 'el', langData: el, langName: 'Greek', alias: 'Ελληνικά' },
    { langCode: 'eu', langData: eu, langName: 'Basque', alias: 'Euskara' },
    { langCode: 'es', langData: es, langName: 'Spanish', alias: 'Español' },
    { langCode: 'fi', langData: fi, langName: 'Finnish', alias: 'Suomen kieli' },
    { langCode: 'fr', langData: fr, langName: 'French', alias: 'Français' },
    { langCode: 'he', langData: he, langName: 'Hebrew', alias: 'עִבְרִית' },
    { langCode: 'hi', langData: hi, langName: 'Hindi', alias: 'हिंदी' },
    { langCode: 'hu', langData: hu, langName: 'Hungarian', alias: 'Magyar' },
    { langCode: 'hr', langData: hr, langName: 'Croatian', alias: 'Hrvatski' },
    { langCode: 'id', langData: id, langName: 'Indonesian', alias: 'Bahasa Indonesia' },
    { langCode: 'it', langData: it, langName: 'Italian', alias: 'Italiano' },
    { langCode: 'ja', langData: ja, langName: 'Japanese', alias: '日本語' },
    { langCode: 'ko', langData: ko, langName: 'Korean', alias: '한국어' },
    { langCode: 'lt', langData: lt, langName: 'Lithuanian', alias: 'Lietuvių kalba' },
    { langCode: 'nb', langData: nb, langName: 'Norwegian', alias: 'Norsk' },
    { langCode: 'nl', langData: nl, langName: 'Dutch', alias: 'Nederlands' },
    { langCode: 'pl', langData: pl, langName: 'Polish', alias: 'Polski' },
    { langCode: 'pt-BR', langData: ptBR, langName: 'Portuguese', alias: 'Português brasileiro' },
    { langCode: 'pt-PT', langData: ptPT, langName: 'Portuguese', alias: 'Português' },
    { langCode: 'ro', langData: ro, langName: 'Romanian', alias: 'Română' },
    { langCode: 'ru', langData: ru, langName: 'Russian', alias: 'Русский' },
    { langCode: 'sk', langData: sk, langName: 'Slovak', alias: 'Slovenčina' },
    { langCode: 'sl', langData: sl, langName: 'Slovenian', alias: 'Slovenščina' },
    { langCode: 'sv', langData: sv, langName: 'Swedish', alias: 'Svenska' },
    { langCode: 'th', langData: th, langName: 'Thai', alias: 'ภาษาไทย' },
    { langCode: 'tr', langData: tr, langName: 'Turkish', alias: 'Türkçe' },
    { langCode: 'vi', langData: vi, langName: 'Vietnamese', alias: 'Tiếng Việt' },
    { langCode: 'zh-CN', langData: zhHansCN, langName: 'Chinese - CN', alias: '中国简体' },
    { langCode: 'zh-HK', langData: zhHantHK, langName: 'Chinese - HK', alias: '香港繁體' },
    { langCode: 'zh-TW', langData: zhHantTW, langName: 'Chinese - TW', alias: '台灣繁體' },
];

// Init default language
const defaultLanguage = init('en', en);

// Initialize all translated languages
languageOptions.forEach((ln) => {
    if (ln.langCode !== 'en') {
        init(ln.langCode, ln.langData);
    }
});

// Current flyPad language
let currentEfbLanguage = 'en';
let currentLanguageMap = defaultLanguage;

// Listener to change the currently set language in the flyPad.
const watchLanguageChanges = () => {
    NXDataStore.getAndSubscribe(
        'EFB_LANGUAGE',
        (_, value) => {
            currentEfbLanguage = value;
            currentLanguageMap = allLanguagesMap.get(currentEfbLanguage) || defaultLanguage;
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

/**
 * Returns localized string in the currently configured language when provided with
 * correct identifier key.
 * It will fall back to the default language and will try to
 * find the key there.
 * If the key is not available in the default language the key itself will be returned.
 *
 * Note: Currently all language files are imported and contain all keys so this is redundant
 * but still implemented for future changes.
 * @param key String identifier key
 * @return translated string in the current language if available, or default
 *         language, or key string
 */
export function t(key: string): string {
    return currentLanguageMap.get(key) || defaultLanguage.get(key) || key;
}

// Workaround after simvar hook changes - only required on FlyPadPage.tsx from flypad settings
// to ensure correct update of the page when user changes language. Update timing/order changed
// with simvar hook change and the page was refreshing before the t() function had the updated
// language code.
export function tt(key: string, lang: string): string {
    currentEfbLanguage = lang;
    currentLanguageMap = allLanguagesMap.get(currentEfbLanguage) || currentLanguageMap;
    return currentLanguageMap.get(key) || defaultLanguage.get(key) || key;
}
