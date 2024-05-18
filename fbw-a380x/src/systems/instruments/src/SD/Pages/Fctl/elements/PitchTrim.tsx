import React, { FC } from 'react';
import { ActuatorIndication, ActuatorType, HydraulicPowerSource } from './ActuatorIndication';

interface PitchTrimProps {
    x: number,
    y: number,
}

export const PitchTrim: FC<PitchTrimProps> = ({ x, y }) => {
    const positionInfoValid = true;
    const thsPosition = 0;

    const powerSource1Avail = true;
    const powerSource2Avail = true;
    const thsJam = false;

    const [pitchIntegral, pitchFractional] = Math.abs(thsPosition).toFixed(1).split('.');

    const hydraulicAvailableClass = powerSource1Avail || powerSource2Avail ? 'Green' : 'Amber';
    const pitchTrimTitleClass = (powerSource1Avail || powerSource2Avail) && !thsJam ? 'White' : 'Amber';

    return (
        <g id='ths' transform={`translate(${x} ${y})`}>
            <path className={`${hydraulicAvailableClass} SW2 LineRound LineJoinRound`} d='m-5,98 l-21,-11 v23 l21,-11 z' />
            <path className='White SW4 LineRound' d='m0,0 v119 M-10,0 h20 M-10,118 h20 M-10,98 h20' />

            <text x={57} y={-6} className={`F22 ${pitchTrimTitleClass} MiddleAlign LS1`}>
                PITCH
            </text>
            <text x={57} y={17} className={`F22 ${pitchTrimTitleClass} MiddleAlign LS1`}>
                TRIM
            </text>

            <g visibility={positionInfoValid ? 'visible' : 'hidden'}>
                <text x={38} y={67} className={`${hydraulicAvailableClass} F26 EndAlign`}>{pitchIntegral}</text>
                <text x={37} y={67} className={`${hydraulicAvailableClass} F26`}>.</text>
                <text x={55} y={67} className={`${hydraulicAvailableClass} F26`}>{pitchFractional}</text>
                <text x={65} y={68} className='Cyan F26'>°</text>
                <text
                    x={82}
                    y={68}
                    visibility={Math.abs(thsPosition) > 0.05 ? 'visible' : 'hidden'}
                    className={`${hydraulicAvailableClass} F26`}
                >
                    {Math.sign(thsPosition) === 1 ? 'DN' : 'UP'}
                </text>
            </g>

            <text
                x={26}
                y={68}
                visibility={!positionInfoValid ? 'visible' : 'hidden'}
                className='Amber F26'
            >
                XX
            </text>

            <ActuatorIndication
                x={-63}
                y={24}
                type={ActuatorType.Conventional}
                powerSource={HydraulicPowerSource.Green}
            />
            <ActuatorIndication
                x={-63}
                y={66}
                type={ActuatorType.Conventional}
                powerSource={HydraulicPowerSource.Yellow}
            />
        </g>
    );
};
