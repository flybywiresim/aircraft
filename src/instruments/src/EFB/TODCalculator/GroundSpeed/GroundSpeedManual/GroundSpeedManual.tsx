/* eslint-disable max-len */
import React from 'react';

import { t } from '../../../translation';
import { useAppDispatch, useAppSelector } from '../../../Store/store';

import { setTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeedMode, addTodGroundSpeed } from '../../../Store/features/todCalculator';
import { TOD_INPUT_MODE } from '../../../Enum/TODInputMode';

import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';

export const GroundSpeedManual = () => {
    const dispatch = useAppDispatch();
    const groundSpeed = useAppSelector((state) => state.todCalculator.groundSpeed);

    return (
        <div className="flex flex-col justify-between space-y-12 h-full">
            <div className="space-y-6">
                <div className="space-y-2">
                    {groundSpeed.map(({ from, groundSpeed }, index) => (
                        <>
                            <div className="flex flex-row space-x-4 w-full rounded-lg">
                                <div className="w-1/2">
                                    <p>{`${t('Performance.TopOfDescent.GroundSpeed.MinAltitude')} ${index + 1}`}</p>
                                </div>
                                <div className="w-1/2">
                                    <p>{t('Performance.TopOfDescent.GroundSpeed.GroundSpeed')}</p>
                                </div>
                            </div>
                            <div className="flex flex-row space-x-4 w-full rounded-lg">
                                <div>
                                    <SimpleInput
                                        placeholder="feet"
                                        number
                                        className="w-full"
                                        value={from}
                                        disabled={index === 0}
                                        onChange={(from) => dispatch(setTodGroundSpeed({
                                            index,
                                            value: {
                                                from: Number.parseFloat(from),
                                                groundSpeed,
                                            },
                                        }))}
                                    />
                                </div>

                                <div>
                                    <SimpleInput
                                        number
                                        className="w-full"
                                        placeholder={t('Performance.TopOfDescent.GroundSpeed.UnitKnots')}
                                        value={groundSpeed}
                                        onChange={(groundSpeed) => dispatch(setTodGroundSpeed({
                                            index,
                                            value: {
                                                from,
                                                groundSpeed: Number.parseInt(groundSpeed),
                                            },
                                        }))}
                                    />
                                </div>
                            </div>
                        </>
                    ))}
                </div>

                <div className="flex flex-row space-x-2">
                    <button
                        className={`w-full py-2 rounded-md bg-utility-red text-theme-body border-2 border-utility-red transition duration-100 ${groundSpeed.length <= 1 ? 'opacity-60' : 'hover:bg-theme-body hover:text-utility-red'}`}
                        type="button"
                        onClick={() => dispatch(removeTodGroundSpeed(groundSpeed.length - 1))}
                        disabled={groundSpeed.length <= 1}
                    >
                        {t('Performance.TopOfDescent.GroundSpeed.RemoveLast')}
                    </button>

                    <button
                        className={`w-full py-2 bg-colors-lime-500 text-theme-body rounded-md transition duration-100 border-2 border-colors-lime-500 ${groundSpeed.length >= 6 ? 'opacity-60' : 'hover:text-colors-lime-500 hover:bg-theme-body'}`}
                        type="button"
                        onClick={() => dispatch(addTodGroundSpeed({ from: -1, groundSpeed: -1 }))}
                        disabled={groundSpeed.length >= 6}
                    >
                        {t('Performance.TopOfDescent.GroundSpeed.Add')}
                    </button>
                </div>
            </div>

            <button
                type="button"
                className="flex justify-center p-3 w-full text-theme-highlight hover:text-theme-body hover:bg-theme-highlight rounded-md border-2 border-theme-highlight transition duration-100"
                onClick={() => dispatch(setTodGroundSpeedMode(TOD_INPUT_MODE.AUTO))}
            >
                <p className="text-current">{t('Performance.TopOfDescent.GroundSpeed.Sync')}</p>
            </button>
        </div>
    );
};
