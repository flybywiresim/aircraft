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
import Input from "../../Components/Form/Input/Input";
import React, {useEffect, useState} from "react";
import Card from "../../Components/Card/Card";
import Divider from "../../Components/Divider/Divider";
import {TOD_CALCULATOR_REDUCER} from "../../Store";
import {setTodData} from "../../Store/action-creator/tod-calculator";
import {TOD_CALCULATION_TYPE} from "../../Enum/TODCalculationType.enum";
import Button, {BUTTON_TYPE} from "../../Components/Button/Button";
import {round} from 'lodash';

const Data = ({
    currentAltitude,
    targetAltitude,
    calculation: { type: calculationType, input: calculationInput },
    setTodData,
    ...props
}) => {
    const [currentAltitudeSyncEnabled, setCurrentAltitudeSyncEnabled] = useState(false);

    useEffect(() => {
        if(!currentAltitudeSyncEnabled) {
            return;
        }

        const i = setInterval(() => {
            let altitude;

            try {
                altitude = Simplane.getAltitude();
            } catch (e) {
                altitude = 28026.232132133212;
                console.log('Using mock data for current altitude, watch out');
            }

            setTodData({ currentAltitude: round(altitude, -1) });
        }, 1000);

        return () => {
            clearInterval(i);
        };
    }, [currentAltitudeSyncEnabled]);

    const calculationTypes = [
        {label: 'Distance', rightLabel: 'NM', type: TOD_CALCULATION_TYPE.DISTANCE},
        {label: 'Vertical speed', rightLabel: 'ft/min', type: TOD_CALCULATION_TYPE.VERTICAL_SPEED},
        {label: 'Angle', rightLabel: 'degrees', type: TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE}
    ];

    return (
        <Card title={'Data'} childrenContainerClassName={'flex-1 flex flex-col justify-start'} {...props}>
            <Input
                label={'Current altitude'}
                type={'number'}
                className={'dark-option mb-4 pr-1'}
                rightComponent={(
                    <div className={'flex items-center justify-center'}>
                        <span className={'text-2xl mr-4'}>ft</span>
                        <Button
                            text={'SYNC'}
                            type={currentAltitudeSyncEnabled ? BUTTON_TYPE.BLUE : BUTTON_TYPE.BLUE_OUTLINE}
                            onClick={() => setCurrentAltitudeSyncEnabled(!currentAltitudeSyncEnabled)}
                        />
                    </div>
                )}
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
                <>
                    <Input
                        label={label}
                        type={'number'}
                        className={'dark-option mb-2 pr-1'}
                        rightComponent={(
                            <div className={'flex items-center justify-center'}>
                                <span className={'text-2xl pr-3'}>{rightLabel}</span>

                                {!!calculationInput && (
                                    <Button
                                        className={'ml-1'}
                                        text={'X'}
                                        type={BUTTON_TYPE.RED_OUTLINE}
                                        onClick={() => setTodData({ calculation: {input: '', type: undefined }})}
                                    />
                                )}
                            </div>
                        )}
                        onChange={(input) => setTodData({ calculation: {input, type: input !== '' ? type : undefined }})}
                        value={calculationInput}
                    />

                    <span className={'w-full inline-block text-center mb-2 last:hidden'}>OR</span>
                </>
            ))}
        </Card>
    );
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { currentAltitude, targetAltitude, calculation } }) => ({ currentAltitude, targetAltitude, calculation }),
    { setTodData }
)(Data);