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

import React from "react";
import { connect } from 'react-redux';
import {TOD_CALCULATOR_REDUCER} from "../../Store";
import {setTodData} from "../../Store/action-creator/tod-calculator";
import TODCalculator from "../../Service/TODCalculator";
import {round, isNil, toNumber} from 'lodash';
import Card from "../../Components/Card/Card";
import {TOD_CALCULATION_TYPE} from '../../Enum/TODCalculationType.enum';

const Result = ({currentAltitude, targetAltitude, calculation, groundSpeed, ...props}) => {
    const todCalculator = new TODCalculator(toNumber(currentAltitude), toNumber(targetAltitude), groundSpeed);

    if(isNil(calculation.type)) {
        return null;
    }

    const {headerText, footerText, calculate, unit} = ({
        [TOD_CALCULATION_TYPE.DISTANCE]: {
            headerText: 'Desired vertical speed',
            footerText: '',
            unit: 'ft/min',
            calculate: () => todCalculator.calculateVS(calculation.input)
        },
        [TOD_CALCULATION_TYPE.VERTICAL_SPEED]: {
            headerText: `Start your ${targetAltitude > currentAltitude ? 'ascend' : 'descent'} about`,
            footerText: 'before target',
            unit: 'NM',
            calculate: () => todCalculator.calculateDistance(Math.abs(calculation.input))
        },
    }[calculation.type]);

    const output = round(calculate());

    if(!isNaN(output) && isFinite(output)) {
        return (
            <Card {...props} title={'Result'}>
                <div className={'flex flex-col items-center justify-center'}>
                    <h1 className="text-white font-medium mb-4 text-2xl">{headerText}</h1>

                    <span className={'text-white text-7xl'}>
                        {output} {unit}
                    </span>

                    {!!footerText && <span className="text-white font-medium mt-4 text-2xl">{footerText}</span>}
                </div>
            </Card>
        );
    }

    return null;
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { currentAltitude, targetAltitude, calculation, groundSpeed } }) => ({ currentAltitude, targetAltitude, calculation, groundSpeed }),
    { setTodData }
)(Result);