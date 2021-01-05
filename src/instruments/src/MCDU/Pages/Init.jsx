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

import { useState, useContext } from 'react';
import { getSimVar, useUpdate } from '../../util';
import BasePage from './BasePage.jsx';
import FMGCData from '../FMGC/FMGC.jsx';

export const InitPage = () => {
    const [labels, setLabels] = useState({
        L0: {
            text: 'CO RTE',
            class: 'text__small__left__label',
            color: 'white',
        },
        L1: {
            text: 'ALTN/CO RTE',
            class: 'text__small__left__label',
            color: 'white',
        },
        L2: {
            text: 'FLT NBR',
            class: 'text__small__left__label',
            color: 'white',
        },
        L3: {
            text: '',
            class: 'text__small__left__label',
            color: 'white',
        },
        L4: {
            text: 'COST INDEX',
            class: 'text__small__left__label',
            color: 'white',
        },
        L5: {
            text: 'CRZ FL/TEMP',
            class: 'text__small__left__label',
            color: 'white',
        },
        R0: {
            text: 'FROM/TO',
            class: 'text__small__right__label',
            color: 'white',
        },
        R1: {
            text: 'INIT',
            class: 'text__small__right__label',
            color: 'amber',
        },
        R2: {
            text: 'IRS INIT',
            class: 'text__small__right',
            color: 'white',
        },
        R3: {
            text: '',
            class: '',
            color: '',
        },
        R4: {
            text: 'WIND/TEMP',
            class: 'text__small__right__label',
            color: 'inop',
        },
        R5: {
            text: 'GND TEMP',
            class: 'text__small__right__label',
            color: 'white',
        },
    });
    const [mcduText, setMcduText] = useState({
        L0: {
            text: '__________',
            class: 'text__small__left',
            color: 'amber',
        },
        L1: {
            text: '----|----------',
            class: 'text__small__left',
            color: 'white',
        },
        L2: {
            text: '________',
            class: 'text__small__left',
            color: 'amber',
        },
        L3: {
            text: '',
            class: 'text__small__left',
            color: 'white',
        },
        L4: {
            text: '---',
            class: 'text__small__left',
            color: 'white',
        },
        L5: {
            text: '-----|---°',
            class: 'text__small__left',
            color: 'white',
        },
        R0: {
            text: '____|____',
            class: 'text__small__right',
            color: 'amber',
        },
        R1: {
            text: 'REQUEST',
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
            text: '36090',
            class: 'text__small__right',
            color: 'cyan',
        },
    });
    const { data, setData } = useContext(FMGCData);

    if (data.booleans.fromToEntered) {
        setMcduText((prevState) => ({
            ...prevState,
            R0: `${data.flightPlanManager.origin.ident}/${data.flightPlanManager.destination.ident}`,
        }));
    }
    return (
        <BasePage data={mcduText} labels={labels} />
    );
};
