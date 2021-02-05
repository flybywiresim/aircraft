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
import React from "react";
import Card from "../../Components/Card/Card";
import {TOD_CALCULATOR_REDUCER} from "../../Store";
import {addTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeed} from "../../Store/action-creator/tod-calculator";

import './GroundSpeed.scss'
import Button, {BUTTON_TYPE} from "../../Components/Button/Button";

const GroundSpeed = ({groundSpeed, addTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeed, ...props}) => {
    return (
        <Card {...props} title={'Ground Speed'}>
            <div className={'ground-speed-container mb-4'}>
                {groundSpeed.map(({ from, groundSpeed }, key) => (
                    <div className={'flex w-full mb-4 bg-blue-darker rounded-lg'}>
                        <Input
                            label={'Alt'}
                            type={'number'}
                            className={'dark-option w-6/12 mr-4'}
                            value={from}
                            rightComponent={<span className={'text-2xl'}>ft</span>}
                            disabled={key === 0}
                            onChange={(from) => setTodGroundSpeed(key, { from })}
                        />

                        <Input
                            label={'GS'}
                            type={'number'}
                            className={'dark-option w-6/12'}
                            rightComponent={<span className={'text-2xl'}>kt</span>}
                            value={groundSpeed}
                            onChange={(groundSpeed) => setTodGroundSpeed(key, { groundSpeed })}
                        />
                    </div>
                ))}
            </div>

            <div className={'flex flex-row justify-end'}>
                {groundSpeed.length > 1 && (
                    <Button text={'Remove last'} type={BUTTON_TYPE.RED} onClick={() => removeTodGroundSpeed(groundSpeed.length - 1)} />
                )}

                {groundSpeed.length < 6 && (
                    <Button className={'ml-4'} text={'Add'} type={BUTTON_TYPE.GREEN} onClick={() => addTodGroundSpeed({ from: undefined, groundSpeed: undefined })} />
                )}
            </div>
        </Card>
    );
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { groundSpeed } }) => ({ groundSpeed }),
    { addTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeed }
)(GroundSpeed);