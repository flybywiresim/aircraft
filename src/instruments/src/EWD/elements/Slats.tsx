import { useArinc429Var } from '@instruments/common/arinc429';
import React, { useEffect, useState } from 'react';

type SlatsProps = {
    x: number,
    y: number,
};

const Slats: React.FC<SlatsProps> = ({ x, y }) => {
    // The SFCC bus data should come from the SDACs, and also of course from both SFCCs. As these things are not simulated
    // yet, we just use the word directly here. The SDAC just copies the words 1 to 1, so the bit allocation should not change.
    const sfccSlatFlapSystemStatusWord = useArinc429Var('L:A32NX_SFCC_SLAT_FLAP_SYSTEM_STATUS_WORD');
    const cleanConfigSelected = sfccSlatFlapSystemStatusWord.getBitValue(17);
    const config1Selected = sfccSlatFlapSystemStatusWord.getBitValue(18);
    const config2Selected = sfccSlatFlapSystemStatusWord.getBitValue(19);
    const config3Selected = sfccSlatFlapSystemStatusWord.getBitValue(20);
    const configFullSelected = sfccSlatFlapSystemStatusWord.getBitValue(21);
    const flapAutoRetractConfig1 = sfccSlatFlapSystemStatusWord.getBitValue(26);

    const alphaLockEngaged = sfccSlatFlapSystemStatusWord.getBitValue(24); // TODO: this SimVar is part of PR #6647

    // Same as above, the IPPU angle should come from the FWCs, or as a backup the FPPU angle from the
    // SDACs/SFFCs can be used.
    const slatsActualPositionWord = useArinc429Var('L:A32NX_SFCC_SLAT_ACTUAL_POSITION_WORD');
    const flapsActualPositionWord = useArinc429Var('L:A32NX_SFCC_FLAP_ACTUAL_POSITION_WORD');
    const slatsIppuAngle = slatsActualPositionWord.valueOr(0);
    const flapsIppuAngle = flapsActualPositionWord.valueOr(0);

    let flapText = '';
    if (cleanConfigSelected) {
        flapText = '0';
    } else if (config1Selected && flapAutoRetractConfig1) {
        flapText = '1';
    } else if (config1Selected && !flapAutoRetractConfig1) {
        flapText = '1+F';
    } else if (config2Selected) {
        flapText = '2';
    } else if (config3Selected) {
        flapText = '3';
    } else if (configFullSelected) {
        flapText = 'FULL';
    }

    const slatsOut = slatsIppuAngle > 6.1;
    const flapsOut = slatsIppuAngle > 73.1;

    const [slatPos, setSlatPos] = useState([0, 0]);
    const [hideTargetSlatIndex, setHideTargetSlatIndex] = useState(false);

    const [flapsPos, setFlapsPos] = useState([0, 0]);
    const [hideTargetFlapIndex, setHideTargetFlapIndex] = useState(false);

    useEffect(() => {
        const xFactor = -4.66637;
        const yFactor = 1.62042;

        const synchroFactor = 0.081;
        let synchroOffset = 0;
        let positionFactor = 0;
        let positionOffset = 0;

        if (slatsIppuAngle >= 0 && slatsIppuAngle < 222.8) {
            synchroOffset = 0;
            positionFactor = 0.43;
            positionOffset = 0;
        } else if (slatsIppuAngle >= 222.8 && slatsIppuAngle < 272.8) {
            synchroOffset = 18;
            positionFactor = 1.8;
            positionOffset = 7.71;
        } else if (slatsIppuAngle >= 272.8 && slatsIppuAngle < 346) {
            synchroOffset = 22;
            positionFactor = 1.44;
            positionOffset = 14.92;
        }

        if (cleanConfigSelected && slatsIppuAngle >= 0 && slatsIppuAngle <= 6.1) {
            setHideTargetSlatIndex(true);
        } else if (config1Selected && slatsIppuAngle >= 209.9 && slatsIppuAngle <= 234.6) {
            setHideTargetSlatIndex(true);
        } else if ((config2Selected || config3Selected) && slatsIppuAngle >= 259.3 && slatsIppuAngle <= 284) {
            setHideTargetSlatIndex(true);
        } else if (configFullSelected && slatsIppuAngle >= 327.2 && slatsIppuAngle <= 339.5) {
            setHideTargetSlatIndex(true);
        } else {
            setHideTargetSlatIndex(false);
        }

        const value = (slatsIppuAngle * synchroFactor - synchroOffset) * positionFactor + positionOffset;
        setSlatPos([xFactor * value + x - 15, yFactor * value + y]);
    }, [slatsIppuAngle]);

    useEffect(() => {
        const xFactor = 5.04306;
        const yFactor = 1.05552;

        const synchroFactor = 0.22;
        const synchroConstant = 15.88;
        let synchroOffset = 0;
        let positionFactor = 0;
        let positionOffset = 0;

        if (flapsIppuAngle >= 0 && flapsIppuAngle < 120.5) {
            synchroOffset = 0;
            positionFactor = 0.97;
            positionOffset = 0;
        } else if (flapsIppuAngle >= 120.5 && flapsIppuAngle < 145.5) {
            synchroOffset = 10.63;
            positionFactor = 1.4;
            positionOffset = 10.34;
        } else if (flapsIppuAngle >= 145.5 && flapsIppuAngle < 168.3) {
            synchroOffset = 16.3;
            positionFactor = 1.62;
            positionOffset = 18.27;
        } else if (flapsIppuAngle >= 168.3 && flapsIppuAngle < 355) {
            synchroOffset = 21.19;
            positionFactor = 0.43;
            positionOffset = 26.21;
        }

        if ((cleanConfigSelected || flapAutoRetractConfig1) && flapsIppuAngle >= 0 && flapsIppuAngle <= 73.1) {
            setHideTargetFlapIndex(true);
        } else if (config1Selected && !flapAutoRetractConfig1 && flapsIppuAngle >= 113.1 && flapsIppuAngle <= 122.2) {
            setHideTargetFlapIndex(true);
        } else if (config2Selected && flapsIppuAngle >= 140.4 && flapsIppuAngle <= 149.5) {
            setHideTargetFlapIndex(true);
        } else if (config3Selected && flapsIppuAngle >= 163.1 && flapsIppuAngle <= 172.2) {
            setHideTargetFlapIndex(true);
        } else if (configFullSelected && flapsIppuAngle >= 246.8 && flapsIppuAngle <= 257.2) {
            setHideTargetFlapIndex(true);
        } else {
            setHideTargetFlapIndex(false);
        }

        const value = Math.max((flapsIppuAngle * synchroFactor - synchroConstant - synchroOffset) * positionFactor + positionOffset, 0);
        setFlapsPos([xFactor * value + x, yFactor * value + y]);
    }, [flapsIppuAngle]);

    return (
        <>
            <path d={`M ${x},${y} l -16,0 l -4,13 l 26,0 Z`} className="DarkGreyBox" />
            <text
                className={`Large Center
                ${!hideTargetSlatIndex || !hideTargetFlapIndex ? 'Cyan' : 'Green'}
                ${(flapsOut || slatsOut || !cleanConfigSelected) ? 'Show' : 'Hide'}`}
                x={x - 5}
                y={y + 60}
            >
                {flapText}

            </text>
            <g id="SlatsPositionIndicators" className={flapsOut || slatsOut || !cleanConfigSelected ? 'Show' : 'Hide'}>
                <text className="Medium Center" x={x - 100} y={y + 14}>S</text>
                <text className="Medium Center" x={x + 106} y={y + 14}>F</text>
            </g>
            {/* Slats */}
            <g id="SlatsPositionIndicators" className={flapsOut || slatsOut || !cleanConfigSelected ? 'Show' : 'Hide'}>
                <path d={`M ${x - 58},${y + 19} l -7,2 l -1,4 l 7,-2 Z`} className="SlatsSmallWhite" />
                <path d={`M ${x - 92},${y + 31} l -7,2 l -1,4 l 7,-2 Z`} className="SlatsSmallWhite" />
                <path d={`M ${x - 126},${y + 43} l -7,2 l -1,4 l 7,-2 Z`} className="SlatsSmallWhite" />
                <path d={`M ${x - 26},${y + 23} l -7,2 l -1,4 l 7,-2 Z`} className={`SlatsSmallCyan ${cleanConfigSelected && !hideTargetSlatIndex ? 'Show' : 'Hide'}`} />
                <path d={`M ${x - 58},${y + 34} l -7,2 l -1,4 l 7,-2 Z`} className={`SlatsSmallCyan ${config1Selected && !hideTargetSlatIndex ? 'Show' : 'Hide'}`} />
                <path d={`M ${x - 92},${y + 46} l -7,2 l -1,4 l 7,-2 Z`} className={`SlatsSmallCyan ${(config2Selected || config3Selected) && !hideTargetSlatIndex ? 'Show' : 'Hide'}`} />
                <path d={`M ${x - 126},${y + 57} l -7,2 l -1,4 l 7,-2 Z`} className={`SlatsSmallCyan ${configFullSelected && !hideTargetSlatIndex ? 'Show' : 'Hide'}`} />
            </g>
            {alphaLockEngaged && <text className="Medium Center GreenPulseNoFill" x={x - 95} y={y - 10}>A LOCK</text>}
            <path className={`Slats ${alphaLockEngaged ? 'GreenPulseNoFill' : ''}`} d={`M ${slatPos[0]},${slatPos[1]} l -19,7 l -4,13 l 19,-7 Z`} />
            <line className={`GreenLine ${alphaLockEngaged ? 'GreenPulse' : ''}`} x1={x - 16} y1={y} x2={slatPos[0]} y2={slatPos[1]} />
            {/* Flaps */}
            <g id="Flaps" className={flapsOut || slatsOut || !cleanConfigSelected ? 'Show' : 'Hide'}>
                <path d={`M ${x + 61},${y + 17} l 3,5 l 5,1 l 0,-4 Z`} className="FlapsSmallWhite" />
                <path d={`M ${x + 100},${y + 25} l 3,5 l 5,1 l 0,-4 Z`} className="FlapsSmallWhite" />
                <path d={`M ${x + 141},${y + 34} l 3,5 l 5,1 l 0,-4 Z`} className="FlapsSmallWhite" />
                <path d={`M ${x + 181},${y + 42} l 3,5 l 5,1 l 0,-4 Z`} className="FlapsSmallWhite" />
                <path
                    d={`M ${x + 12},${y + 23} l 3,5 l 5,1 l 0,-4 Z`}
                    className={`FlapsSmallCyan ${(cleanConfigSelected || flapAutoRetractConfig1) && !hideTargetFlapIndex ? 'Show' : 'Hide'}`}
                />
                <path d={`M ${x + 61},${y + 32} l 3,5 l 5,1 l 0,-4 Z`} className={`FlapsSmallCyan ${config1Selected && !flapAutoRetractConfig1 && !hideTargetFlapIndex ? 'Show' : 'Hide'}`} />
                <path d={`M ${x + 100},${y + 40} l 3,5 l 5,1 l 0,-4 Z`} className={`FlapsSmallCyan ${config2Selected && !hideTargetFlapIndex ? 'Show' : 'Hide'}`} />
                <path d={`M ${x + 141},${y + 49} l 3,5 l 5,1 l 0,-4 Z`} className={`FlapsSmallCyan ${config3Selected && !hideTargetFlapIndex ? 'Show' : 'Hide'}`} />
                <path d={`M ${x + 181},${y + 57} l 3,5 l 5,1 l 0,-4 Z`} className={`FlapsSmallCyan ${configFullSelected && !hideTargetFlapIndex ? 'Show' : 'Hide'}`} />
            </g>
            <path d={`M${flapsPos[0]},${flapsPos[1]} l 22,5 l 0,12, l -15,-3 Z`} className="Flaps" />
            <line className="GreenLine" x1={x} y1={y} x2={flapsPos[0]} y2={flapsPos[1]} />
        </>
    );
};

export default Slats;
