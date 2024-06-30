// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { t } from '../../Localization/translation';

import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ProgressBar } from '../../UtilComponents/Progress/Progress';

interface Props {
  upperBoundDetentSetter;
  lowerBoundDetentSetter;
  lowerBoundDetentGetter;
  upperBoundDetentGetter;
  detentValue;
  throttlePosition;
  index;
  expertMode: boolean;
}

export const DetentConfig: React.FC<Props> = (props: Props) => {
  const [showWarning, setShowWarning] = useState(false);
  const [deadZone, setDeadZone] = useState(Math.abs(props.upperBoundDetentGetter - props.lowerBoundDetentGetter) / 2);
  const [previousMode, setPreviousMode] = useState(props.expertMode);

  // sets the throttle vars to the current throttle position + deadzone for each given throttle
  // multiple throttles can be set at once to have mappings with less axis than throttles (e.g. 2 axis for 4 throttles)
  const setFromTo = (
    throttle1Position: any,
    settingLower: any[],
    settingUpper: any[],
    deadZone: number,
    overrideValue?: string,
  ) => {
    const newSetting = overrideValue || throttle1Position;
    settingLower.forEach((f) => f(newSetting - deadZone < -1 ? -1 : newSetting - deadZone));
    settingUpper.forEach((f) => f(newSetting + deadZone > 1 ? 1 : newSetting + deadZone));
  };

  useEffect(() => {
    setPreviousMode(props.expertMode);
  }, [props.expertMode]);

  return (
    <div className="flex shrink-0 flex-col items-center justify-between overflow-hidden text-white">
      <div className="h-64">
        <ProgressBar
          height="225px"
          width="40px"
          isLabelVisible={false}
          displayBar
          borderRadius="0px"
          completedBarBegin={(props.lowerBoundDetentGetter + 1) * 50}
          completedBarBeginValue={props.lowerBoundDetentGetter.toFixed(2)}
          completedBarEnd={(props.upperBoundDetentGetter + 1) * 50}
          completedBarEndValue={props.upperBoundDetentGetter.toFixed(2)}
          bgcolor="var(--color-highlight)"
          vertical
          baseBgColor="var(--color-accent)"
          completed={((props.throttlePosition + 1) / 2) * 100}
          completionValue={props.throttlePosition}
          greenBarsWhenInRange
        />
      </div>
      <div className="flex flex-col">
        {!props.expertMode && (
          <div className="my-2">
            <div>
              <p>{t('Settings.ThrottleConfig.Deadband')} +/-</p>
            </div>
            <div>
              <SimpleInput
                className="mb-6 w-60"
                value={deadZone.toFixed(2)}
                reverse
                onChange={(deadZone) => {
                  if (parseFloat(deadZone) >= 0.01) {
                    if (previousMode === props.expertMode) {
                      setShowWarning(false);
                      setDeadZone(parseFloat(deadZone));
                    }
                  } else {
                    setShowWarning(true);
                  }
                }}
              />
            </div>
            <div>
              <button
                className="w-60 rounded-md border-2 border-theme-highlight bg-theme-highlight px-2 py-1 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
                onClick={() => {
                  setFromTo(
                    props.throttlePosition,
                    props.lowerBoundDetentSetter,
                    props.upperBoundDetentSetter,
                    deadZone,
                  );
                }}
                type="button"
              >
                {t('Settings.ThrottleConfig.SetFromThrottle')}
              </button>
            </div>
          </div>
        )}
        {props.expertMode && (
          <div className="my-2">
            <p>{t('Settings.ThrottleConfig.ConfigureEnd')}</p>
            <SimpleInput
              reverse
              className="mr-0 w-60"
              value={!props.expertMode ? deadZone : props.upperBoundDetentGetter.toFixed(2)}
              onChange={(deadZone) => {
                if (previousMode === props.expertMode && deadZone.length > 1 && !Number.isNaN(Number(deadZone))) {
                  props.upperBoundDetentSetter.forEach((f) => f(parseFloat(deadZone)));
                  setShowWarning(false);
                }
              }}
            />

            <p>
              {props.expertMode ? t('Settings.ThrottleConfig.ConfigureStart') : t('Settings.ThrottleConfig.Deadband')}
            </p>
            <SimpleInput
              className="mt-2 w-60"
              reverse
              value={!props.expertMode ? deadZone : props.lowerBoundDetentGetter.toFixed(2)}
              onChange={(deadZone) => {
                if (previousMode === props.expertMode && deadZone.length > 1 && !Number.isNaN(Number(deadZone))) {
                  props.lowerBoundDetentSetter.forEach((f) => f(parseFloat(deadZone)));
                  setShowWarning(false);
                }
              }}
            />
          </div>
        )}
        <h2
          style={{ visibility: showWarning ? 'visible' : 'hidden' }}
          className="my-2 h-12 w-48 text-xl text-utility-red"
        >
          {t('Settings.ThrottleConfig.PleaseEnterAValidDeadzone')} (&gt; 0.01)
        </h2>
      </div>
    </div>
  );
};

// this is a dummy component that is used to display the detent config without the ability to change it
export const DummyDetentConfig: React.FC<Props> = (props: Props) => (
  <div className="flex shrink-0 flex-col items-center justify-between overflow-hidden text-white">
    <div className="h-64">
      <ProgressBar
        height="225px"
        width="40px"
        vertical
        displayBar={false}
        isLabelVisible={false}
        bgcolor="var(--color-highlight)"
        baseBgColor="var(--color-accent)"
        completedBarBegin={(props.lowerBoundDetentGetter + 1) * 50}
        completedBarBeginValue={props.lowerBoundDetentGetter.toFixed(2)}
        completedBarEnd={(props.upperBoundDetentGetter + 1) * 50}
        completedBarEndValue={props.upperBoundDetentGetter.toFixed(2)}
        completed={((props.throttlePosition + 1) / 2) * 100}
        borderRadius="0px"
      />
    </div>
  </div>
);
