// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';

import { t } from '../../../Localization/translation';
import { useAppDispatch, useAppSelector } from '../../../Store/store';

import {
  setTodGroundSpeed,
  removeTodGroundSpeed,
  setTodGroundSpeedMode,
  addTodGroundSpeed,
} from '../../../Store/features/todCalculator';
import { TOD_INPUT_MODE } from '../../../Enum/TODInputMode';

import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';

export const GroundSpeedManual = () => {
  const dispatch = useAppDispatch();
  const groundSpeed = useAppSelector((state) => state.todCalculator.groundSpeed);

  return (
    <div className="flex h-full flex-col justify-between space-y-12">
      <div className="space-y-6">
        <div className="space-y-2">
          {groundSpeed.map(({ from, groundSpeed }, index) => (
            <>
              <div className="flex w-full flex-row space-x-4 rounded-lg">
                <div className="w-1/2">
                  <p>{`${t('Performance.TopOfDescent.GroundSpeed.MinAltitude')} ${index + 1}`}</p>
                </div>
                <div className="w-1/2">
                  <p>{t('Performance.TopOfDescent.GroundSpeed.GroundSpeed')}</p>
                </div>
              </div>
              <div className="flex w-full flex-row space-x-4 rounded-lg">
                <div>
                  <SimpleInput
                    placeholder="feet"
                    number
                    className="w-full"
                    value={from}
                    disabled={index === 0}
                    onChange={(from) =>
                      dispatch(
                        setTodGroundSpeed({
                          index,
                          value: {
                            from: Number.parseFloat(from),
                            groundSpeed,
                          },
                        }),
                      )
                    }
                  />
                </div>

                <div>
                  <SimpleInput
                    number
                    className="w-full"
                    placeholder={t('Performance.TopOfDescent.GroundSpeed.UnitKnots')}
                    value={groundSpeed}
                    onChange={(groundSpeed) =>
                      dispatch(
                        setTodGroundSpeed({
                          index,
                          value: {
                            from,
                            groundSpeed: Number.parseInt(groundSpeed),
                          },
                        }),
                      )
                    }
                  />
                </div>
              </div>
            </>
          ))}
        </div>

        <div className="flex flex-row space-x-2">
          <button
            className={`w-full rounded-md border-2 border-utility-red bg-utility-red py-2 text-theme-body transition duration-100 ${groundSpeed.length <= 1 ? 'opacity-60' : 'hover:bg-theme-body hover:text-utility-red'}`}
            type="button"
            onClick={() => dispatch(removeTodGroundSpeed(groundSpeed.length - 1))}
            disabled={groundSpeed.length <= 1}
          >
            {t('Performance.TopOfDescent.GroundSpeed.RemoveLast')}
          </button>

          <button
            className={`bg-colors-lime-500 border-colors-lime-500 w-full rounded-md border-2 py-2 text-theme-body transition duration-100 ${groundSpeed.length >= 6 ? 'opacity-60' : 'hover:text-colors-lime-500 hover:bg-theme-body'}`}
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
        className="flex w-full justify-center rounded-md border-2 border-theme-highlight p-3 text-theme-highlight transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
        onClick={() => dispatch(setTodGroundSpeedMode(TOD_INPUT_MODE.AUTO))}
      >
        <p className="text-current">{t('Performance.TopOfDescent.GroundSpeed.Sync')}</p>
      </button>
    </div>
  );
};
