/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { useState } from 'react';
import BasePage from './BasePage.jsx';
import NXDataStore from '../../../NXDataStore.mjs';

function determineActiveSystem(textOptions, setTextOptions, setMcduText) {
    setTextOptions((prevState) => ({
        ...prevState,
        textFMGC: {
            color: NXDataStore.get('ACTIVE_SYS', null) === 'FMGC' ? 'green' : 'white',
        },
        textATSU: {
            color: NXDataStore.get('ACTIVE_SYS', null) === 'ATSU' ? 'green' : 'white',
        },
        textAIDS: {
            color: NXDataStore.get('ACTIVE_SYS', null) === 'CFDS' ? 'green' : 'white',
        },
        textCFDS: {
            color: NXDataStore.get('ACTIVE_SYS', null) === 'CFDS' ? 'green' : 'white',
        },
        textMaint: {
            color: NXDataStore.get('ACTIVE_SYS', null) === 'MAINT' ? 'green' : 'white',
        },
    }));

    setMcduText((prevState) => ({
        ...prevState,
        L0: {
            text: textOptions.textFMGC.text,
            color: textOptions.textFMGC.color,
        },
        L1: {
            text: textOptions.textATSU.text,
            color: textOptions.textATSU.color,
        },
        L2: {
            text: textOptions.textAIDS.text,
            color: textOptions.textAIDS.color,
        },
        L3: {
            text: textOptions.textCFDS.text,
            color: textOptions.textCFDS.color,
        },
        R5: {
            text: textOptions.textReturn,
        },
    }));
}

export const MenuPage = () => {
    const mcduLabels = {
        L0: {
            text: '',
            class: 'text__small__left__label',
            color: 'white',
        },
        L1: {
            text: '',
            class: 'text__small__left__label',
            color: 'white',
        },
        L2: {
            text: '',
            class: 'text__small__left__label',
            color: 'white',
        },
        L3: {
            text: '',
            class: 'text__small__left__label',
            color: 'white',
        },
        L4: {
            text: '',
            class: 'text__small__left__label',
            color: 'white',
        },
        L5: {
            text: '',
            class: 'text__small__left__label',
            color: 'white',
        },
        R0: {
            text: 'SELECT\xa0',
            class: 'text__small__right__label',
            color: 'white',
        },
        R1: {
            text: '',
            class: 'text__small__right__label',
            color: 'amber',
        },
        R2: {
            text: '',
            class: 'text__small__right',
            color: 'white',
        },
        R3: {
            text: '',
            class: '',
            color: '',
        },
        R4: {
            text: '',
            class: 'text__small__right__label',
            color: 'inop',
        },
        R5: {
            text: '',
            class: 'text__small__right__label',
            color: 'white',
        },
    };
    const [textOptions, setTextOptions] = useState({
        textFMGC: {
            text: '<FMGC (REQ)',
            color: 'white',
        },
        textATSU: {
            text: '<ATSU',
            color: 'white',
        },
        textAIDS: {
            text: '<AIDS',
            color: 'white',
        },
        textCFDS: {
            text: '<CFDS',
            color: 'white',
        },
        textMaint: {
            text: 'MCDU MAINT>',
            color: 'white',
        },
        textReturn: {
            text: 'RETURN>',
            color: 'white',
        },
    });
    const [mcduText, setMcduText] = useState({
        L0: {
            text: '',
            class: 'text__small__left',
            color: 'amber',
        },
        L1: {
            text: '',
            class: 'text__small__left',
            color: 'white',
        },
        L2: {
            text: '',
            class: 'text__small__left',
            color: 'amber',
        },
        L3: {
            text: '',
            class: 'text__small__left',
            color: 'white',
        },
        L4: {
            text: '',
            class: 'text__small__left',
            color: 'white',
        },
        L5: {
            text: '',
            class: 'text__small__left',
            color: 'white',
        },
        R0: {
            text: '',
            class: 'text__small__right',
            color: 'amber',
        },
        R1: {
            text: '',
            class: 'text__small__right',
            color: 'AMBER',
        },
        R2: {
            text: '',
            class: 'text__small__right',
            color: 'white',
        },
        R3: {
            text: '',
            class: 'text__small__right',
            color: 'white',
        },
        R4: {
            text: '',
            class: 'text__small__right',
            color: 'white',
        },
        R5: {
            text: '',
            class: 'text__small__right',
            color: 'cyan',
        },
    });

    determineActiveSystem(textOptions, setTextOptions, setMcduText);

    /**
     * TODO create event handlers
     * TODO create handling of scratchpad messages
     */

    return (
        <BasePage data={mcduText} labels={mcduLabels} />
    );
};
