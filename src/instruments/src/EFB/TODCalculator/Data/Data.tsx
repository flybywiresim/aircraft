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

import { connect } from 'react-redux';
import Input from "../../Components/Form/Input/Input";
import React from "react";
import Card from "../../Components/Card/Card";
import Divider from "../../Components/Divider/Divider";
import {TOD_CALCULATOR_REDUCER} from "../../Store";
import {setTodData} from "../../Store/action-creator/tod-calculator";
import {TOD_CALCULATION_TYPE} from "../../Enum/TODCalculationType.enum";

const Data = ({
    currentAltitude,
    targetAltitude,
    calculation: { type: calculationType, input: calculationInput },
    setTodData,
    ...props
}) => {
    const calculationTypes = [
        {label: 'Distance', rightLabel: 'NM', type: TOD_CALCULATION_TYPE.DISTANCE},
        {label: 'Vertical speed', rightLabel: 'ft/min', type: TOD_CALCULATION_TYPE.VERTICAL_SPEED}
    ];

    return (
        <Card {...props} title={'Data'}>
            <Input
                label={'Current altitude'}
                type={'number'}
                className={'dark-option mb-4'}
                rightComponent={<span className={'text-2xl'}>ft</span>}
                value={currentAltitude}
                onChange={(currentAltitude) => setTodData({ currentAltitude })}
            />

            <Input
                label={'Target altitude'}
                type={'number'}
                className={'dark-option mb-6'}
                rightComponent={<span className={'text-2xl'}>ft</span>}
                value={targetAltitude}
                onChange={(targetAltitude) => setTodData({ targetAltitude })}
            />

            <Divider className={'mb-6'} />

            {calculationTypes.map(({ label, rightLabel, type }) => (!calculationInput || calculationType === type) && (
                <Input
                    label={label}
                    type={'number'}
                    className={'dark-option mb-4'}
                    rightComponent={<span className={'text-2xl'}>{rightLabel}</span>}
                    onChange={(input) => setTodData({ calculation: {input, type: input !== '' ? type : undefined }})}
                />
            ))}
        </Card>
    );
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { currentAltitude, targetAltitude, calculation } }) => ({ currentAltitude, targetAltitude, calculation }),
    { setTodData }
)(Data);