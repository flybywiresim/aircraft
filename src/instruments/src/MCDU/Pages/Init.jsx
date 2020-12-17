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
import { getSimVar, useUpdate } from '../../util';
import BasePage from './BasePage';

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
    const [data, setData] = useState({
        L0: {
            text: 'Left Data 1',
            class: 'text__small__left',
            color: 'green',
        },
        L1: {
            text: 'Left Data 1',
            class: 'text__small__left',
            color: 'green',
        },
        L2: {
            text: 'Left Data 1',
            class: 'text__small__left',
            color: 'green',
        },
        L3: {
            text: 'Left Data 1',
            class: 'text__small__left',
            color: 'green',
        },
        L4: {
            text: 'Left Data 1',
            class: 'text__small__left',
            color: 'green',
        },
        L5: {
            text: 'Left Data 1',
            class: 'text__small__left',
            color: 'green',
        },
        R0: {
            text: 'Left Data 1',
            class: 'text__small__right',
            color: 'green',
        },
        R1: {
            text: 'Left Data 1',
            class: 'text__small__right',
            color: 'green',
        },
        R2: {
            text: 'Left Data 1',
            class: 'text__small__right',
            color: 'green',
        },
        R3: {
            text: 'Left Data 1',
            class: 'text__small__right',
            color: 'green',
        },
        R4: {
            text: 'Left Data 1',
            class: 'text__small__right',
            color: 'green',
        },
        R5: {
            text: 'Left Data 1',
            class: 'text__small__right',
            color: 'green',
        },
    });

    return (
        <BasePage data={data} labels={labels} />
    );
};
