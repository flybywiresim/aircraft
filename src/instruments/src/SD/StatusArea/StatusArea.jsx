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

import './StatusArea.scss';
import { Text } from '../Text/Text.jsx';
import { useGlobalVar, getSimVar } from '../../util.mjs';

export const StatusArea = () => {
    const gw = getSimVar('TOTAL WEIGHT', 'kg');
    const zulu = useGlobalVar('ZULU TIME', 'seconds');
    let tat = Math.round(getSimVar('TOTAL AIR TEMPERATURE', 'celsius'));
    if (tat > 99 || tat < -99) {
        tat = tat > 99 ? 99 : -99;
    }
    let sat = Math.round(getSimVar('AMBIENT TEMPERATURE', 'celsius'));
    if (sat > 99 || sat < -99) {
        sat = sat > 99 ? 99 : -99;
    }
    const adirsState = getSimVar('L:A320_Neo_ADIRS_STATE', 'Enum');
    const satPrefix = sat > 0 ? '+' : '';
    const tatPrefix = tat > 0 ? '+' : '';
    const seconds = Math.floor(zulu);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - (hours * 3600)) / 60);
    const padMinutes = String(minutes).padStart(2, '0');
    const padHours = String(hours).padStart(2, '0');

    return (
        <>
            <path className="sd-status-line" d="M 0   510 h 600" />
            <path className="sd-status-line" d="M 200 510 v 100" />
            <path className="sd-status-line" d="M 400 510 v 100" />

            {/* Temperatures */}

            <Text title x={35} y={534} alignStart>
                TAT
            </Text>
            { adirsState !== 2
                ? (
                    <Text warning x={125} y={534} alignEnd>
                        XX
                    </Text>
                )
                : (
                    <Text value x={125} y={534} alignEnd>
                        {tatPrefix}
                        {tat}
                    </Text>
                )}
            <Text unit x={170} y={534} alignEnd>
                &#176;C
            </Text>

            <Text title x={35} y={560} alignStart>
                SAT
            </Text>
            { adirsState !== 2
                ? (
                    <Text warning x={125} y={560} alignEnd>
                        XX
                    </Text>
                )
                : (
                    <Text value x={125} y={560} alignEnd>
                        {satPrefix}
                        {sat}
                    </Text>
                )}
            <Text unit x={170} y={560} alignEnd>
                &#176;C
            </Text>

            {/* Time */}

            <Text bigValue x={251} y={560} alignStart>{padHours}</Text>
            <Text unit x={290} y={560} alignStart>H</Text>
            <Text value x={316} y={560} alignStart>{padMinutes}</Text>

            {/* Gross weight */}

            <Text title x={415} y={534} alignStart>
                GW
            </Text>
            <Text value x={535} y={534} alignEnd>
                {Math.round(gw)}
            </Text>
            <Text unit x={570} y={534} alignEnd>
                KG
            </Text>
        </>
    );
};
