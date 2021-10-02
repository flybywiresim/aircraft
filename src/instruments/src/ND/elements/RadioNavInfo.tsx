import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { TuningMode } from '@fmgc/radionav';
import { EfisSide } from '@shared/NavigationDisplay';

export enum NavAidMode {
    Off = 0,
    ADF,
    VOR,
}

export type RadioNavInfoProps = { index: 1 | 2, side: EfisSide }

const TuningModeIndicator: React.FC<{ index: 1 | 2, frequency: number }> = ({ index, frequency }) => {
    const [tuningMode] = useSimVar(`L:A32NX_FMGC_RADIONAV_${index}_TUNING_MODE`, 'enum');

    return (
        frequency > 1 && tuningMode !== TuningMode.Auto && (
            <text x={index === 1 ? 138 : 616} y={720} fontSize={20} textDecoration="underline" fill="#ffffff">{tuningMode === TuningMode.Manual ? 'M' : 'R'}</text>
        ) || null
    );
};

const VorInfo: React.FC<{index: 1 | 2}> = ({ index }) => {
    const [vorIdent] = useSimVar(`NAV IDENT:${index}`, 'string');
    const [vorFrequency] = useSimVar(`NAV ACTIVE FREQUENCY:${index}`, 'megahertz');
    const [vorHasDme] = useSimVar(`NAV HAS DME:${index}`, 'bool');
    const [dmeDistance] = useSimVar(`NAV DME:${index}`, 'nautical miles');
    const [vorAvailable] = useSimVar(`NAV HAS NAV:${index}`, 'boolean');

    const x = index === 1 ? 37 : 668;

    const bigLittle = (value: number, digits: number) => {
        const [intPart, decimalPart] = value.toFixed(digits).split('.', 2);
        return (
            <>
                {intPart}
                <tspan fontSize={20}>
                    .
                    {decimalPart}
                </tspan>
            </>
        );
    };

    // FIXME: Use actual JSX syntax for this
    const freqText = bigLittle(vorFrequency, 2);
    let dmeText = '---';
    if (vorHasDme && dmeDistance > 0) {
        if (dmeDistance > 20) {
            dmeText = dmeDistance.toFixed(0);
        } else {
            dmeText = bigLittle(dmeDistance, 1);
        }
    }

    const path = index === 1 ? 'M25,675 L25,680 L37,696 L13,696 L25,680 M25,696 L25,719' : 'M749,719 L749,696 L755,696 L743,680 L731,696 L737,696 L737,719 M743,680 L743,675';

    return (
        <g className="GtLayer">
            {(vorAvailable && (
                <path
                    d={path}
                    strokeWidth={2.6}
                    className="White"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            ))}
            <text x={x} y={692} fontSize={24} className="White">
                VOR
                {index}
            </text>
            {(vorAvailable || vorHasDme) && vorFrequency > 1 && (
                <text x={x} y={722} fontSize={24} className="White">{vorIdent}</text>
            )}
            {!(vorAvailable || vorHasDme) && vorFrequency > 1 && (
                <text x={index === 2 ? x - 26 : x} y={722} fontSize={24} className="White">{freqText}</text>
            )}
            <g transform={`translate(${index === 1 ? -16 : 0})`}>
                <text x={dmeDistance > 20 ? x + 46 : x + 58} y={759} fontSize={24} fill="#00ff00" textAnchor="end">{dmeText}</text>
                <text x={x + 66} y={759} fontSize={20} fill="#00ffff">NM</text>
            </g>
            <TuningModeIndicator index={index} frequency={vorFrequency} />
        </g>
    );
};

const AdfInfo: React.FC<{index: 1 | 2}> = ({ index }) => {
    const [adfIdent] = useSimVar(`ADF IDENT:${index}`, 'string');
    const [adfFrequency] = useSimVar(`ADF ACTIVE FREQUENCY:${index}`, 'kilohertz');
    const [adfAvailable] = useSimVar(`ADF SIGNAL:${index}`, 'boolean');

    const x = index === 1 ? 37 : 668;

    const path = index === 1 ? 'M31,686 L25,680 L19,686 M25,680 L25,719' : 'M749,719 L749,696 L743,690 L737,696 L737,719 M743,690 L743,675';

    return (
        <g className="GtLayer">
            <path
                d={path}
                strokeWidth={2.6}
                className="Green"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <text x={x} y={692} fontSize={24} className="Green">
                ADF
                {index}
            </text>
            <text x={x} y={722} fontSize={24} className="Green">{adfAvailable ? adfIdent : adfFrequency.toFixed(0)}</text>
            {adfAvailable && (
                <text x={x} y={722} fontSize={24} className="Green">{adfIdent}</text>
            )}
            {!adfAvailable && (
                <text x={x} y={722} fontSize={24} className="Green">{Math.floor(adfFrequency).toFixed(0)}</text>
            )}
            <TuningModeIndicator index={index} frequency={adfFrequency} />
        </g>
    );
};

export const RadioNavInfo: React.FC<RadioNavInfoProps> = ({ index, side }) => {
    const [mode] = useSimVar(`L:A32NX_EFIS_${side}_NAVAID_${index}_MODE`, 'enum');

    if (mode === NavAidMode.VOR) {
        return <VorInfo index={index} />;
    }
    if (mode === NavAidMode.ADF) {
        return <AdfInfo index={index} />;
    }
    return <></>;
};
