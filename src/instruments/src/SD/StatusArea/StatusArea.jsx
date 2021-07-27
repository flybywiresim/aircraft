/**
 * WARNING
 *
 * CODE IN THIS FILE IS OLD. THIS STATUS AREA WAS UNUSED AND THE ORIGINAL ASOBO
 * STATUS AREA WAS EXTENDED FURTHER. WHEN STARTING TO USE THIS COMPONENT. PLEASE
 * PORT ANY FUNCTIONALITY FOUND ON THE ORIGINAL STATUS AREA.
 */

import './StatusArea.scss';
import { ADIRS } from '@instruments/common/adirs';
import { Text } from '../Text/Text.jsx';
import { useGlobalVar, getSimVar } from '../../util.js';

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
    // TODO FIXME improve this
    const adirsAlign = !ADIRS.mapNotAvailable(1) || !ADIRS.mapNotAvailable(2);

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
            { adirsAlign
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
            { adirsAlign
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
