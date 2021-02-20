/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
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

import {connect} from 'react-redux';
import React, {useEffect} from "react";
import {TOD_CALCULATOR_REDUCER} from "../../../Store";
import {round, isNaN, last} from 'lodash';
import {
    removeTodGroundSpeed,
    setTodData,
    setTodGroundSpeed,
    setTodGroundSpeedMode
} from "../../../Store/action-creator/tod-calculator";
import './GroundSpeedAuto.scss'
import Button, {BUTTON_TYPE} from "../../../Components/Button/Button";
import {TOD_INPUT_MODE} from "../../../Enum/TODInputMode.enum";
import {useSimVar} from "../../../../Common/simVars";

const GroundSpeedAuto = ({groundSpeedData, currentAltitude, setTodData, setTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeedMode, ...props}) => {
    let [simGroundSpeed] = useSimVar("GPS GROUND SPEED", "knots", 1_000);
    simGroundSpeed = round(simGroundSpeed);

    const setCurrentGroundSpeed = () => {
        if(currentAltitude > 10000 && groundSpeed >= 250) {
            setTodGroundSpeed(0, {from: 0, groundSpeed: 250});
            setTodGroundSpeed(1, {from: 10000, groundSpeed: simGroundSpeed});
        } else{
            setTodGroundSpeed(0, {from: 0, groundSpeed: simGroundSpeed});
            removeTodGroundSpeed(1);
        }
    };

    useEffect(() => {
        setCurrentGroundSpeed();
    }, [currentAltitude, simGroundSpeed]);

    const groundSpeed = last(groundSpeedData)['groundSpeed'];

    if(isNaN(groundSpeed)) {
        return null;
    }

    return (
        <div {...props}>
            <div className={'flex flex-col items-center justify-center'}>
                <span className={'font-medium mb-4 text-xl'}>Fetching from sim</span>

                <span className={'font-medium mb-4 text-5xl'}>{groundSpeed} kt</span>

                <Button text={'Manual input'} onClick={() => setTodGroundSpeedMode(TOD_INPUT_MODE.MANUAL)} type={BUTTON_TYPE.BLUE} />
            </div>
        </div>
    );
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { groundSpeed, currentAltitude } }) => ({ groundSpeedData: groundSpeed, currentAltitude }),
    { setTodData, setTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeedMode }
)(GroundSpeedAuto);