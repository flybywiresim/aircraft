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
import React from "react";
import Card from "../../Components/Card/Card";
import {TOD_CALCULATOR_REDUCER} from "../../Store";
import {TOD_GROUND_SPEED_MODE} from "../../Enum/TODGroundSpeedMode.enum";
import GroundSpeedAuto from "./GroundSpeedAuto/GroundSpeedAuto";
import GroundSpeedManual from "./GroundSpeedManual/GroundSpeedManual";

const GroundSpeed = ({groundSpeedMode, ...props}) => {
    const groundSpeedComponent = ({
        [TOD_GROUND_SPEED_MODE.AUTO]: {
            render: () => <GroundSpeedAuto />,
            childrenContainerClassName: 'flex-1 flex flex-col justify-center'
        },
        [TOD_GROUND_SPEED_MODE.MANUAL]: {
            render: () => <GroundSpeedManual />,
            childrenContainerClassName: 'flex-1 flex flex-col justify-start'
        },
    })[groundSpeedMode];

    return (
        <Card title={'Ground Speed'} childrenContainerClassName={groundSpeedComponent.childrenContainerClassName} {...props}>
            {groundSpeedComponent.render()}
        </Card>
    );
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { groundSpeedMode } }) => ({ groundSpeedMode })
)(GroundSpeed);