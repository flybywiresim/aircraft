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
import { getSimVar, useUpdate } from '../../util.mjs';
import BasePage from './BasePage.jsx';
import NXDataStore from '../../../../../A32NX/html_ui/Pages/A32NX_Utils/NXDataStore';

export const InitPage = () => {
    const mcduLabels = {
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
            text: 'WIND/TEMP>',
            class: 'text__small__right__label',
            color: 'inop',
        },
        R5: {
            text: 'GND TEMP',
            class: 'text__small__right__label',
            color: 'white',
        },
    };
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
    const FMGC_DATA = NXDataStore.get('FMGC_DATA', null);

    if (FMGC_DATA) {
        if (FMGC_DATA.booleans.fromToEntered) {
            setMcduText((prevState) => ({
                ...prevState,
                R0: {
                    text: `${FMGC_DATA.flightPlanManager.origin.ident}/${FMGC_DATA.flightPlanManager.destination.ident}`,
                    color: 'cyan',
                },
            }));

            if (getSimVar('ATC FLIGHT NUMBER', 'string')) {
                setMcduText((prevState) => ({
                    ...prevState,
                    L2: {
                        text: `${getSimVar('ATC FLIGHT NUMBER', 'string')}`,
                        color: 'cyan',
                    },
                }));
            }

            if (FMGC_DATA.costIndex) {
                setMcduText((prevState) => ({
                    ...prevState,
                    L4: {
                        text: `${FMGC_DATA.costIndex}`,
                        color: 'cyan',
                    },
                }));
            }

            if (FMGC_DATA.booleans.cruiseEntered) {
                setMcduText((prevState) => ({
                    ...prevState,
                    L5: {
                        text: `FL${FMGC_DATA.cruiseFlightLevel.toFixed(0).padStart(3, '0')}/-52°`,
                        color: 'cyan',
                    },
                }));
            }

            // Since CoRte isn't implemented, AltDest defaults to None Ref: Ares's documents
            setMcduText((prevState) => ({
                ...prevState,
                L1: {
                    text: 'NONE',
                    color: 'cyan',
                },
            }));
            if (FMGC_DATA.flightPlanManager.alternate.ident) {
                setMcduText((prevState) => ({
                    ...prevState,
                    L1: {
                        text: `${FMGC_DATA.flightPlanManager.alternate.ident}`,
                        color: 'cyan',
                    },
                }));
            }
        }
    }

    return (
        <BasePage data={mcduText} labels={mcduLabels} />
    );
};
