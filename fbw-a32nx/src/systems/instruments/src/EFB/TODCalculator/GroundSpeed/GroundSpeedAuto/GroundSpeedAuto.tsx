// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect } from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { t } from '../../../translation';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { removeTodGroundSpeed, setTodGroundSpeed, setTodGroundSpeedMode } from '../../../Store/features/todCalculator';
import { TOD_INPUT_MODE } from '../../../Enum/TODInputMode';

export const GroundSpeedAuto = () => {
    const dispatch = useAppDispatch();

    const currentAltitude = useAppSelector((state) => state.todCalculator.currentAltitude);
    const groundSpeedData = useAppSelector((state) => state.todCalculator.groundSpeed);
    const { groundSpeed } = groundSpeedData[groundSpeedData.length - 1];

    let [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    simGroundSpeed = Math.round(simGroundSpeed);

    const setCurrentGroundSpeed = () => {
        if ((currentAltitude ?? 0) > 10000 && groundSpeed >= 250) {
            dispatch(setTodGroundSpeed({ index: 0, value: { from: 0, groundSpeed: 250 } }));
            dispatch(setTodGroundSpeed({ index: 1, value: { from: 10000, groundSpeed: simGroundSpeed } }));
        } else {
            dispatch(setTodGroundSpeed({ index: 0, value: { from: 0, groundSpeed: simGroundSpeed > 0 ? simGroundSpeed : '' } }));
            dispatch(removeTodGroundSpeed(1));
        }
    };

    useEffect(() => {
        setCurrentGroundSpeed();
    }, [currentAltitude, simGroundSpeed]);

    if (Number.isNaN(groundSpeed)) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="bg-theme-accent absolute top-0 flex w-full flex-row items-center space-x-4 p-2">
                <div className="bg-theme-highlight h-6 w-6 shrink-0 rounded-full" />
                <p>{t('Performance.TopOfDescent.GroundSpeed.FetchingSpeedFromSimulator')}</p>
            </div>

            <span className="mb-4 text-5xl">
                {groundSpeed || 0}
                {' '}
                {t('Performance.TopOfDescent.GroundSpeed.UnitKt')}
            </span>

            <button
                type="button"
                className="text-theme-highlight hover:text-theme-body hover:bg-theme-highlight border-theme-highlight flex justify-center rounded-md border-2 p-3 transition duration-100"
                onClick={() => dispatch(setTodGroundSpeedMode(TOD_INPUT_MODE.MANUAL))}
            >
                <p className="text-current">{t('Performance.TopOfDescent.GroundSpeed.ManualInput')}</p>
            </button>
        </div>
    );
};
