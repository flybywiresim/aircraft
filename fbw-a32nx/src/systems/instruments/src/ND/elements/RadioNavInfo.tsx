import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { TuningMode } from '@fmgc/radionav';
import { EfisNdMode, EfisSide, NavAidMode } from '@shared/NavigationDisplay';

export type RadioNavInfoProps = {
    index: 1 | 2,
    side: EfisSide,
    trueRef: boolean,
    mode: EfisNdMode,
}

const TuningModeIndicator: React.FC<{ index: 1 | 2 }> = ({ index }) => {
    const [tuningMode] = useSimVar('L:A32NX_FMGC_RADIONAV_TUNING_MODE', 'enum');

    return (
        tuningMode !== TuningMode.Auto && (
            <text x={index === 1 ? 138 : 616} y={720} fontSize={20} textDecoration="underline" fill="#ffffff">{tuningMode === TuningMode.Manual ? 'M' : 'R'}</text>
        ) || null
    );
};

const VorInfo: React.FC<{index: 1 | 2, trueRef: boolean, mode: EfisNdMode }> = ({ index, trueRef, mode }) => {
    const [vorIdent] = useSimVar(`NAV IDENT:${index}`, 'string');
    const [vorFrequency] = useSimVar(`NAV ACTIVE FREQUENCY:${index}`, 'megahertz');
    const [vorHasDme] = useSimVar(`NAV HAS DME:${index}`, 'bool');
    const [dmeDistance] = useSimVar(`NAV DME:${index}`, 'nautical miles');
    const [vorAvailable] = useSimVar(`NAV HAS NAV:${index}`, 'boolean');
    // FIXME should be database magvar, not just when received
    const [stationDeclination] = useSimVar(`NAV MAGVAR:${index}`, 'degrees');
    const [stationLocation] = useSimVar(`NAV VOR LATLONALT:${index}`, 'latlonalt');
    const [stationRefTrue, setStationRefTrue] = useState(false);
    const [corrected, setCorrected] = useState(false);
    const [magWarning, setMagWarning] = useState(false);
    const [trueWarning, setTrueWarning] = useState(false);

    useEffect(() => {
        setStationRefTrue(stationLocation.lat > 75 && stationDeclination < Number.EPSILON);
    }, [stationDeclination, stationLocation.lat]);

    useEffect(() => {
        setCorrected(vorAvailable && !!(trueRef) !== stationRefTrue && mode !== EfisNdMode.ROSE_VOR && mode !== EfisNdMode.ROSE_ILS);
        setMagWarning(vorAvailable && !!(trueRef) && !stationRefTrue && (mode === EfisNdMode.ROSE_VOR || mode === EfisNdMode.ROSE_ILS));
        setTrueWarning(vorAvailable && !(trueRef) && stationRefTrue && (mode === EfisNdMode.ROSE_VOR || mode === EfisNdMode.ROSE_ILS));
    }, [trueRef, stationRefTrue, mode, vorAvailable]);

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

    const freqText = bigLittle(vorFrequency, 2);
    let dmeText = <>---</>;
    if (vorHasDme && dmeDistance > 0) {
        if (dmeDistance > 20) {
            dmeText = <>{dmeDistance.toFixed(0)}</>;
        } else {
            dmeText = bigLittle(dmeDistance, 1);
        }
    }

    const path = index === 1 ? 'M25,675 L25,680 L37,696 L13,696 L25,680 M25,696 L25,719' : 'M749,719 L749,696 L755,696 L743,680 L731,696 L737,696 L737,719 M743,680 L743,675';

    return (
        <g className="GtLayer">
            <path
                d={path}
                strokeWidth={2}
                className={vorAvailable && !!(trueRef) !== stationRefTrue && (mode === EfisNdMode.ARC || mode === EfisNdMode.ROSE_NAV) ? 'Magenta' : 'White'}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <text x={x} y={692} fontSize={24} className="White">
                VOR
                {index}
            </text>
            {(vorAvailable || vorHasDme) && vorFrequency > 1 && (
                <>
                    <text x={x} y={722} fontSize={24} className="White">{vorIdent}</text>
                    <text x={index === 2 ? x - 54 : x + 61} y={692} fontSize={20} className="Magenta" visibility={corrected ? 'inherit' : 'hidden'}>CORR</text>
                    <text x={index === 2 ? x - 54 : x + 73} y={692} fontSize={20} className="Amber" visibility={magWarning ? 'inherit' : 'hidden'}>MAG</text>
                    <text x={index === 2 ? x - 54 : x + 61} y={692} fontSize={20} className="Amber" visibility={trueWarning ? 'inherit' : 'hidden'}>TRUE</text>
                </>
            )}
            {!(vorAvailable || vorHasDme) && vorFrequency > 1 && (
                <text x={index === 2 ? x - 26 : x} y={722} fontSize={24} className="White">{freqText}</text>
            )}
            <g transform={`translate(${index === 1 ? -16 : 0})`}>
                <text x={dmeDistance > 20 ? x + 46 : x + 58} y={759} fontSize={24} fill="#00ff00" textAnchor="end">{dmeText}</text>
                <text x={x + 66} y={759} fontSize={20} fill="#00ffff">NM</text>
            </g>
            <TuningModeIndicator index={index} />
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
                strokeWidth={2}
                className="Green"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <text x={x} y={692} fontSize={24} className="Green">
                ADF
                {index}
            </text>
            {adfAvailable && (
                <text x={x} y={722} fontSize={24} className="Green">{adfIdent}</text>
            )}
            {!adfAvailable && adfFrequency > 0 && (
                <text x={x} y={722} fontSize={24} className="Green">{Math.floor(adfFrequency).toFixed(0)}</text>
            )}
            <TuningModeIndicator index={index} />
        </g>
    );
};

export const RadioNavInfo: React.FC<RadioNavInfoProps> = ({ index, side, trueRef, mode }) => {
    const [navaidMode] = useSimVar(`L:A32NX_EFIS_${side}_NAVAID_${index}_MODE`, 'enum');

    if (navaidMode === NavAidMode.VOR) {
        return <VorInfo index={index} trueRef={trueRef} mode={mode} />;
    }
    if (navaidMode === NavAidMode.ADF) {
        return <AdfInfo index={index} />;
    }
    return <></>;
};
