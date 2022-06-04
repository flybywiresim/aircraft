import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';
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

    const [slatPos, setSlatPos] = useState([-15, 0]);
    const [deltaSlatsAngle, setDeltaSlatsAngle] = useState(slatsAngle);

    const [flapsPos, setFlapsPos] = useState([0, 0]);
    const [deltaFlapsAngle, setDeltaFlapsAngle] = useState(flapsAngle);

    const [flapsPos, setFlapsPos] = useState([0, 0]);
    const [hideTargetFlapIndex, setHideTargetFlapIndex] = useState(false);

    useEffect(() => {
        const xFactor = -4.66637;
        const yFactor = 1.62042;

        const synchroFactor = 0.081;
        let synchroOffset = 0;
        let positionFactor = 0;
        let positionOffset = 0;

        if (slatsInitial) {
            setSlatsInitial(false);
            if (handleIndex) {
                switch (true) {
                case (slatsAngle === 18):
                    setSlatPos([-49, 12]);
                    break;
                case (slatsAngle === 22):
                    setSlatPos([-83, 24]);
                    break;
                case (slatsAngle === 27):
                    setSlatPos([-117, 36]);
                    break;
                default:
                    setSlatPos([-15, 0]);
                    break;
                }
            }
        } else {
            switch (true) {
            case (slatsAngle > 22):
                setSlatPos(
                    [
                        currX - ((xVal / 5) * (slatsAngle - deltaSlatsAngle)),
                        currY + ((yVal / 5) * (slatsAngle - deltaSlatsAngle)),
                    ],
                );
                break;
            case (slatsAngle > 18):
                setSlatPos(
                    [
                        currX - ((xVal / 4) * (slatsAngle - deltaSlatsAngle)),
                        currY + ((yVal / 4) * (slatsAngle - deltaSlatsAngle)),
                    ],
                );
                break;
            default:
                setSlatPos(
                    [
                        currX - ((xVal / 18) * (slatsAngle - deltaSlatsAngle)),
                        currY + ((yVal / 18) * (slatsAngle - deltaSlatsAngle)),
                    ],
                );
            }
        }
        // Hack to cater for strange behaviour when loading in on approach
        if (slatsAngle === 27) {
            setSlatPos([-117, 36]);
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

        if (flapsInitial) {
            setFlapsInitial(false);
            if (handleIndex) {
                switch (true) {
                case (flapsAngle === 10):
                    setFlapsPos([43, 9]);
                    break;
                case (flapsAngle === 15):
                    setFlapsPos([86, 18]);
                    break;
                case (flapsAngle === 20):
                    setFlapsPos([129, 27]);
                    break;
                case (flapsAngle === 40):
                    setFlapsPos([172, 36]);
                    break;
                default:
                    setFlapsPos([0, 0]);
                    break;
                }
            }
        } else {
            switch (true) {
            case (flapsAngle > 20):
                setFlapsPos(
                    [
                        currX + ((xVal / 20) * (flapsAngle - deltaFlapsAngle)),
                        currY + ((yVal / 20) * (flapsAngle - deltaFlapsAngle)),
                    ],
                );
                break;
            case (flapsAngle > 10):
                setFlapsPos(
                    [
                        currX + ((xVal / 5) * (flapsAngle - deltaFlapsAngle)),
                        currY + ((yVal / 5) * (flapsAngle - deltaFlapsAngle)),
                    ],
                );
                break;
            default:
                setFlapsPos(
                    [
                        currX + ((xVal / 10) * (flapsAngle - deltaFlapsAngle)),
                        currY + ((yVal / 10) * (flapsAngle - deltaFlapsAngle)),
                    ],
                );
            }
        }

        if (flapsAngle === 40) {
            setFlapsPos([172, 36]);
        }

        const value = Math.max((flapsIppuAngle * synchroFactor - synchroConstant - synchroOffset) * positionFactor + positionOffset, 0);
        setFlapsPos([xFactor * value + x, yFactor * value + y]);
    }, [flapsIppuAngle]);

    return (
        <Layer x={x} y={y}>
            <path d="M0, 0l -16,0 l -4,13 l 26,0 Z" className="DarkGreyBox" />
            <text
                className={`Huge Center
                ${flapsMoving || slatsMoving ? 'Cyan' : 'Green'}
                ${!flapsPowered || (!flapsMoving && !slatsMoving && handleIndex === 0) ? 'Hide' : 'Show'}`}
                x={0}
                y={57}
            >
                {flapText}

            </text>
            <g id="SlatsPositionIndicators" className={(flapsPowered || slatsPowered) && (flapsAngle > 0 || slatsAngle > 0) ? 'Show' : 'Hide'}>
                <text className="Standard Center" x={-100} y={14}>S</text>
                <text className="Standard Center" x={102} y={14}>F</text>
            </g>
            {/* Slats */}
            <g id="SlatsPositionIndicators" className={(flapsPowered || slatsPowered) && (flapsAngle > 0 || slatsAngle > 0) ? 'Show' : 'Hide'}>
                <path d="M -58,19 l -7,2 l -1,4 l 7,-2 Z" className="SlatsSmallWhite" />
                <path d="M -92,31 l -7,2 l -1,4 l 7,-2 Z" className="SlatsSmallWhite" />
                <path d="M -126,43 l -7,2 l -1,4 l 7,-2 Z" className="SlatsSmallWhite" />
                <path d="M -26,23 l -7,2 l -1,4 l 7,-2 Z" className={`SlatsSmallCyan ${targetSlatsAngle === 0 && slatsAngle > 0.5 ? 'Show' : 'Hide'}`} />
                <path d="M -58,34 l -7,2 l -1,4 l 7,-2 Z" className={`SlatsSmallCyan ${targetSlatsAngle === 18 && slatsAngle !== 18 ? 'Show' : 'Hide'}`} />
                <path d="M -92,46 l -7,2 l -1,4 l 7,-2 Z" className={`SlatsSmallCyan ${targetSlatsAngle === 22 && slatsAngle !== 22 ? 'Show' : 'Hide'}`} />
                <path d="M -126,57 l -7,2 l -1,4 l 7,-2 Z" className={`SlatsSmallCyan ${targetSlatsAngle === 27 && slatsAngle !== 27 ? 'Show' : 'Hide'}`} />
            </g>
            {alphaLockEngaged === 1 && <text className="Medium Center GreenPulseNoFill" x={-95} y={-10}>A LOCK</text>}
            <path className={`Slats ${alphaLockEngaged === 1 ? 'GreenPulseNoFill' : ''}`} d={`M ${slatPos[0]},${slatPos[1]} l -19,7 l -4,13 l 19,-7 Z`} />
            <line className={`GreenLine ${alphaLockEngaged === 1 ? 'GreenPulse' : ''}`} x1={-16} y1={0} x2={slatPos[0]} y2={slatPos[1]} />
            {/* Flaps */}
            <g id="Flaps" className={(flapsPowered || slatsPowered) && (flapsAngle > 0 || slatsAngle > 0) ? 'Show' : 'Hide'}>
                <path d="M 52,15 l 3,5 l 5,1 l 0,-4 Z" className="FlapsSmallWhite" />
                <path d="M 95,24 l 3,5 l 5,1 l 0,-4 Z" className="FlapsSmallWhite" />
                <path d="M 138,33 l 3,5 l 5,1 l 0,-4 Z" className="FlapsSmallWhite" />
                <path d="M 181,42 l 3,5 l 5,1 l 0,-4 Z" className="FlapsSmallWhite" />
                <path d="M 12,23 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${targetFlapsAngle === 0 && flapsAngle > 0.5 ? 'Show' : 'Hide'}`} />
                <path d="M 52,30 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${targetFlapsAngle === 10 && flapsAngle !== 10 ? 'Show' : 'Hide'}`} />
                <path d="M 95,39 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${Math.round(targetFlapsAngle) === 15 && Math.round(flapsAngle) !== 15 ? 'Show' : 'Hide'}`} />
                <path d="M 138,48 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${targetFlapsAngle === 20 && flapsAngle !== 20 ? 'Show' : 'Hide'}`} />
                <path d="M 181,57 l 3,5 l 5,1 l 0,-4 Z" className={`FlapsSmallCyan ${targetFlapsAngle === 40 && flapsAngle !== 40 ? 'Show' : 'Hide'}`} />
            </g>
            <path d={`M${flapsPos[0]},${flapsPos[1]} l 22,5 l 0,12, l -15,-3 Z`} className="Flaps" />
            <line className="GreenLine" x1={0} y1={0} x2={flapsPos[0]} y2={flapsPos[1]} />
        </Layer>
    );
};

export default Slats;
