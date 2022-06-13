import { Layer } from '@instruments/common/utils';
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
        const xFactor = -4.5766;
        const yFactor = 1.519;

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
        setSlatPos([xFactor * value - 18, yFactor * value]);
    }, [slatsIppuAngle]);

    useEffect(() => {
        const xFactor = 4.71;
        const yFactor = 0.97;

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
        setFlapsPos([xFactor * value, yFactor * value + 1]);
    }, [flapsIppuAngle]);

    return (
        <Layer x={x} y={y}>
            <path d="M0, 0l -18,0 l -4,14 l 28,1 Z" className="DarkGreyBox" />
            <text
                className={`Huge Center
                ${!hideTargetSlatIndex || !hideTargetFlapIndex ? 'Cyan' : 'Green'}
                ${(flapsOut || slatsOut || !cleanConfigSelected) ? 'Show' : 'Hide'}`}
                x={-3}
                y={59}
            >
                {flapText}
            </text>
            <g id="SlatsPositionIndicators" className={flapsOut || slatsOut || !cleanConfigSelected ? 'Show' : 'Hide'}>
                <text className="Standard Center" x={-101} y={15}>S</text>
                <text className="Standard Center" x={105} y={15}>F</text>
            </g>
            {/* Slats */}
            <g id="SlatsPositionIndicators" className={flapsOut || slatsOut || !cleanConfigSelected ? 'Show' : 'Hide'}>
                <path d="M -63,19 l -7,2 l -1,4 l 7,-2 Z" className="SlatsSmallWhite" />
                <path d="M -96,30 l -7,2 l -1,4 l 7,-2 Z" className="SlatsSmallWhite" />
                <path d="M -129,41 l -7,2 l -1,4 l 7,-2 Z" className="SlatsSmallWhite" />
                <path d="M -26,23 l -7,2 l -1,4 l 7,-2 Z" className={`SlatsSmallCyan ${cleanConfigSelected && !hideTargetSlatIndex ? 'Show' : 'Hide'}`} />
                <path d="M -63,34 l -7,2 l -1,4 l 7,-2 Z" className={`SlatsSmallCyan ${config1Selected && !hideTargetSlatIndex ? 'Show' : 'Hide'}`} />
                <path d="M -96,45 l -7,2 l -1,4 l 7,-2 Z" className={`SlatsSmallCyan ${(config2Selected || config3Selected) && !hideTargetSlatIndex ? 'Show' : 'Hide'}`} />
                <path d="M -129,56 l -7,2 l -1,4 l 7,-2 Z" className={`SlatsSmallCyan ${configFullSelected && !hideTargetSlatIndex ? 'Show' : 'Hide'}`} />
            </g>
            {alphaLockEngaged && <text className="Medium Center GreenPulseNoFill" x={-95} y={-10}>A LOCK</text>}
            <path className={`Slats ${alphaLockEngaged ? 'GreenPulseNoFill' : ''}`} d={`M ${slatPos[0]},${slatPos[1]} l -22,7 l -5,14 l 23,-8 Z`} />
            <line className={`GreenLine ${alphaLockEngaged ? 'GreenPulse' : ''}`} x1={-18} y1={0} x2={slatPos[0]} y2={slatPos[1]} />
            {/* Flaps */}
            <g id="Flaps" className={flapsOut || slatsOut || !cleanConfigSelected ? 'Show' : 'Hide'}>
                <path d="M 58,17 l 3,5 l 5,1 l 0,-4 Z" className="FlapsSmallWhite" />
                <path d="M 95,25 l 3,5 l 5,1 l 0,-4 Z" className="FlapsSmallWhite" />
                <path d="M 133,33 l 3,5 l 5,1 l 0,-4 Z" className="FlapsSmallWhite" />
                <path d="M 170,41 l 3,5 l 5,1 l 0,-4 Z" className="FlapsSmallWhite" />
                <path
                    d="M 12,23 l 3,5 l 5,1 l 0,-4 Z"
                    className={`FlapsSmallCyan ${(cleanConfigSelected || flapAutoRetractConfig1) && !hideTargetFlapIndex ? 'Show' : 'Hide'}`}
                />
                <path d="M 58,32 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${config1Selected && !flapAutoRetractConfig1 && !hideTargetFlapIndex ? 'Show' : 'Hide'}`} />
                <path d="M 95,40 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${config2Selected && !hideTargetFlapIndex ? 'Show' : 'Hide'}`} />
                <path d="M 133,48 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${config3Selected && !hideTargetFlapIndex ? 'Show' : 'Hide'}`} />
                <path d="M 170,56 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${configFullSelected && !hideTargetFlapIndex ? 'Show' : 'Hide'}`} />
            </g>
            <path d={`M${flapsPos[0]},${flapsPos[1]} l 24.5,6 l 0,13.5 l -18,-4 Z`} className="Flaps" />
            <line className="GreenLine" x1={0} y1={0} x2={flapsPos[0]} y2={flapsPos[1]} />
        </Layer>
    );
};

export default Slats;
