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

import './Fctl.scss';
import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
import { renderTarget } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

export const FctlPage = () => {
    console.log('FCTL');

    const [aileronLeftDeflectionState] = useSimVar('AILERON LEFT DEFLECTION PCT', 'percent over 100', 50);
    const [aileronRightDeflectionState] = useSimVar('AILERON RIGHT DEFLECTION PCT', 'percent over 100', 50);

    const [elevatorDeflectionState] = useSimVar('ELEVATOR DEFLECTION PCT', 'percent over 100', 50);

    const [elac1SwitchState] = useSimVar('FLY BY WIRE ELAC SWITCH:1', 'boolean', 1000);
    const [elac1FailState] = useSimVar('FLY BY WIRE ELAC FAILED:1', 'boolean', 1000);

    const [elac2SwitchState] = useSimVar('FLY BY WIRE ELAC SWITCH:2', 'boolean', 1000);
    const [elac2FailState] = useSimVar('FLY BY WIRE ELAC FAILED:2', 'boolean', 1000);

    const [sec1SwitchState] = useSimVar('FLY BY WIRE SEC SWITCH:1', 'boolean', 1000);
    const [sec1FailState] = useSimVar('FLY BY WIRE SEC FAILED:1', 'boolean', 1000);

    const [sec2SwitchState] = useSimVar('FLY BY WIRE SEC SWITCH:2', 'boolean', 1000);
    const [sec2FailState] = useSimVar('FLY BY WIRE SEC FAILED:2', 'boolean', 1000);

    const [sec3SwitchState] = useSimVar('FLY BY WIRE SEC SWITCH:3', 'boolean', 1000);
    const [sec3FailState] = useSimVar('FLY BY WIRE SEC FAILED:3', 'boolean', 1000);

    const [pitchTrimState] = useSimVar('ELEVATOR TRIM INDICATOR', 'Position 16k', 50);

    const [rawPitchTrim, setRawPitchTrim] = useState(0);

    useEffect(() => {
        let rPT = pitchTrimState / 1213.6296;
        // Cap pitch trim at 13.5 up, 4 down
        if (rPT > 16384.0) {
            rPT = 16384.0;
        } else if (rPT < -4854) {
            rPT = -4854;
        }
        setRawPitchTrim(rPT);
    }, [pitchTrimState]);

    const pitchValueArray = Math.abs(rawPitchTrim).toFixed(1).toString().split('.');
    const pitchTrimSign = Math.sign(rawPitchTrim);

    const [rudderDeflectionState] = useSimVar('RUDDER DEFLECTION PCT', 'percent over 100', 50);

    const [rudderAngle, setRudderAngle] = useState(0);

    useEffect(() => {
        setRudderAngle(-rudderDeflectionState * 25);
    }, [rudderDeflectionState]);

    // Update rudder limits
    const [indicatedAirspeedState] = useSimVar('AIRSPEED INDICATED', 'knots', 500);

    const [maxAngleNorm, setMaxAngleNorm] = useState(1);

    useEffect(() => {
        const ias : number = indicatedAirspeedState;
        console.log(`The IAS is ${ias}`);
        if (ias > 380) {
            setMaxAngleNorm(3.4 / 25);
        } else if (ias > 160) {
            const newAngleNorm = (69.2667 - (0.351818 * ias) + (0.00047 * ias ** 2)) / 2;
            setMaxAngleNorm(newAngleNorm);
        }
    }, [indicatedAirspeedState]);

    // Check Hydraulics state
    // Will probably need changing once hydraulics fully implemented.

    const [engine1State] = useSimVar('ENG COMBUSTION:1', 'bool', 1000);
    const [engine2State] = useSimVar('ENG COMBUSTION:2', 'bool', 1000);

    const hydraulicGAvailable = true;
    const hydraulicBAvailable = true;
    const hydraulicYAvailable = true;

    const [leftSpoilerState] = useSimVar('SPOILERS LEFT POSITION', 'percent over 100', 50);
    const [rightSpoilerState] = useSimVar('SPOILERS RIGHT POSITION', 'percent over 100', 50);

    const [groundSpeedState] = useSimVar('SURFACE RELATIVE GROUND SPEED', 'feet_per_second', 50);

    const [spoilersArmedState] = useSimVar('SPOILERS ARMED', 'boolean', 500);
    console.log(`Spoilers armed ${spoilersArmedState}`);

    const [onGroundState] = useSimVar('SIM ON GROUND', 'boolean', 500);

    const [engine1ModeState] = useSimVar('GENERAL ENG THROTTLE MANAGED MODE:1', 'number', 1000);
    const [engine2ModeState] = useSimVar('GENERAL ENG THROTTLE MANAGED MODE:2', 'number', 1000);

    return (
        <>
            <svg id="ecam-fctl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                <text
                    id="pageTitle"
                    className="PageTitle"
                    x="45"
                    y="18"
                    textAnchor="middle"
                    alignmentBaseline="central"
                >
                    F/CTL

                </text>
            </svg>
        </>

    );
};

ReactDOM.render(<SimVarProvider><FctlPage /></SimVarProvider>, renderTarget);
