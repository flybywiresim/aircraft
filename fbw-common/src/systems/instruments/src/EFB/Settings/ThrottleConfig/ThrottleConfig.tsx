// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useContext, useEffect, useState } from 'react';
import { usePersistentNumberProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { ExclamationCircleFill } from 'react-bootstrap-icons';
import {
  AircraftContext,
  PromptModal,
  SelectGroup,
  SelectItem,
  t,
  Toggle,
  useModals,
  VerticalSelectGroup,
} from '@flybywiresim/flypad';
import { BaseThrottleConfig } from './BaseThrottleConfig';
import { ThrottleSimvar } from './ThrottleSimVar';

/**
 * The throttle config component props
 * @param isShown - if the component is shown
 * @param onClose - the function to call when the component is closed
 */
interface ThrottleConfigProps {
  isShown: boolean;
  onClose: () => void;
}

/**
 * The throttle config component is used to configure the throttle mappings in the EFB.
 * It is flexible and can be used for 1, 2 or 4 axis for the A320 (2 throttles) and A380 (4 throttles).
 *
 * The current implementation is a refactor from the initial A320-only implementation which was not
 * intended to be used for the A380. It might be worth to refactor this component to be more generic
 * and clean up the code.
 *
 * @see ThrottleConfigProps
 * @constructor
 */
export const ThrottleConfig = ({ isShown, onClose }: ThrottleConfigProps) => {
  const aircraftContext = useContext(AircraftContext);

  // the number of throttles that are used in the aircraft (2 or 4)
  const numberOfThrottles = aircraftContext.settingsPages.throttle.numberOfAircraftThrottles;

  const [axisNum, setAxisNum] = usePersistentNumberProperty('THROTTLE_AXIS', numberOfThrottles);
  // this makes sure that the axis number is set to 2 when the A320 is selected when previously the A380 with 4 axis was used
  if (axisNum > numberOfThrottles) {
    setAxisNum(numberOfThrottles);
  }

  const [selectedDetent, setSelectedDetent] = useState(2);
  const [validConfig, setValidConfig] = useState(true);
  const [validationError, setValidationError] = useState<string>();

  // prettier-ignore
  const [reverserOnAxis1, setReverserOnAxis1] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:1', 'number', 1000,);
  const [, setReverserOnAxis2] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:2', 'number', 1000);
  const [, setReverserOnAxis3] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:3', 'number', 1000);
  const [, setReverserOnAxis4] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:4', 'number', 1000);

  const [togaOnAxis1, setTogaOnAxis1] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_TOGA_ON_AXIS:1', 'number', 1000);
  const [, setTogaOnAxis2] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_TOGA_ON_AXIS:2', 'number', 1000);

  const [, syncToDisk] = useSimVar('K:A32NX.THROTTLE_MAPPING_SAVE_TO_FILE', 'number', 1000);
  const [, defaultsToThrottle] = useSimVar('K:A32NX.THROTTLE_MAPPING_SET_DEFAULTS', 'number', 100);
  const [, syncToThrottle] = useSimVar('K:A32NX.THROTTLE_MAPPING_LOAD_FROM_FILE', 'number', 100);
  const [, applyLocalVar] = useSimVar('K:A32NX.THROTTLE_MAPPING_LOAD_FROM_LOCAL_VARIABLES', 'number', 1000);

  const { showModal } = useModals();

  // simvars for each virtual throttle (we define 4 even for the A320 and ignore 3 + 4)
  const throttleOneSimvars: Array<ThrottleSimvar> = [
    new ThrottleSimvar('Reverse Full', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 1),
    new ThrottleSimvar('Reverse Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 1),
    new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 1),
    new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 1),
    new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 1),
    new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 1),
  ];
  const throttleTwoSimvars: Array<ThrottleSimvar> = [
    new ThrottleSimvar('Reverse Full', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 2),
    new ThrottleSimvar('Reverse Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 2),
    new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 2),
    new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 2),
    new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 2),
    new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 2),
  ];
  const throttleThreeSimvars: Array<ThrottleSimvar> = [
    new ThrottleSimvar('Reverse Full', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 3),
    new ThrottleSimvar('Reverse Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 3),
    new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 3),
    new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 3),
    new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 3),
    new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 3),
  ];
  const throttleFourSimvars: Array<ThrottleSimvar> = [
    new ThrottleSimvar('Reverse Full', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 4),
    new ThrottleSimvar('Reverse Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 4),
    new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 4),
    new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 4),
    new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 4),
    new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 4),
  ];

  // if there is no reverser on axis 1, set the selected detent to idle
  useEffect(() => {
    if (reverserOnAxis1 === 0 && selectedDetent < 2) {
      setSelectedDetent(2);
    }
    if (togaOnAxis1 === 0 && selectedDetent > 4) {
      setSelectedDetent(4);
    }
  }, [reverserOnAxis1, selectedDetent]);

  // checks if there are any overlaps in the throttle mappings and returns an array of errors
  const getOverlapErrors = (axis: number, mappingsAxis: ThrottleSimvar[]) => {
    const overlapErrors: string[] = [];
    for (
      let index = reverserOnAxis1 ? 0 : 2;
      index < (togaOnAxis1 ? mappingsAxis.length : mappingsAxis.length - 1);
      index++
    ) {
      // A380 has 4 throttles but only throttles 2 + 3 are used for Reverse Full and Reverse Idle - therefore we skip
      // these checks as the UI does not even allow to set these mappings from the throttles
      if (numberOfThrottles === 4 && (axis === 1 || axis === 4) && index < 2) {
        continue;
      }
      const element = mappingsAxis[index];
      for (
        let nextIndex = index + 1;
        nextIndex < (togaOnAxis1 ? mappingsAxis.length : mappingsAxis.length - 1);
        nextIndex++
      ) {
        const nextElement = mappingsAxis[nextIndex];
        if (
          element.getHiGetter() >= nextElement.getLowGetter() ||
          element.getLowGetter() >= nextElement.getHiGetter()
        ) {
          overlapErrors.push(
            `${t('Settings.ThrottleConfig.Axis')} ${axis}: ${element.readableName} (${element.getLowGetter().toFixed(2)}) ${t('Settings.ThrottleConfig.ErrorOverlapMsg')} ${nextElement.readableName} (${nextElement.getLowGetter().toFixed(2)})`,
          );
        }
      }
    }
    return overlapErrors;
  };

  // when a throttle config changes this checks if there are any overlaps in the throttle mappings
  // and sets the validation error and valid config
  useEffect(() => {
    const errors: string[] = [];
    errors.push(...getOverlapErrors(1, throttleOneSimvars));
    errors.push(...getOverlapErrors(2, throttleTwoSimvars));
    // to avoid false errors only 2 axis are used
    if (numberOfThrottles === 4) {
      errors.push(...getOverlapErrors(3, throttleThreeSimvars));
      errors.push(...getOverlapErrors(4, throttleFourSimvars));
    }
    setValidationError(errors[0]);
    setValidConfig(errors.length === 0);
  }, [throttleOneSimvars, throttleTwoSimvars, throttleThreeSimvars, throttleFourSimvars]);

  const setReversersOnAxis = (reverserOnAxis: number) => {
    setReverserOnAxis1(reverserOnAxis);
    setReverserOnAxis2(reverserOnAxis);
    setReverserOnAxis3(reverserOnAxis);
    setReverserOnAxis4(reverserOnAxis);
    if (reverserOnAxis === 0 && selectedDetent < 2) {
      setSelectedDetent(2);
    }
  };

  const setTogaOnAxis = (togaOnAxis: number) => {
    setTogaOnAxis1(togaOnAxis);
    setTogaOnAxis2(togaOnAxis);
    if (togaOnAxis === 0 && selectedDetent > 4) {
      setSelectedDetent(4);
    }
  };

  const switchDetent = (index: number) => {
    if (index >= 0 && index <= 5) {
      setSelectedDetent(index);
    }
  };

  const navigationBar = (
    <VerticalSelectGroup>
      <SelectItem
        disabled={!togaOnAxis1}
        className={`${togaOnAxis1 ? '' : 'opacity-30'}`}
        onSelect={() => {
          if (togaOnAxis1) {
            switchDetent(5);
          }
        }}
        selected={selectedDetent === 5}
      >
        TO/GA
      </SelectItem>
      <SelectItem onSelect={() => switchDetent(4)} selected={selectedDetent === 4}>
        FLX
      </SelectItem>
      <SelectItem onSelect={() => switchDetent(3)} selected={selectedDetent === 3}>
        CLB
      </SelectItem>
      <SelectItem onSelect={() => switchDetent(2)} selected={selectedDetent === 2}>
        Idle
      </SelectItem>
      <SelectItem
        disabled={!reverserOnAxis1}
        className={`${reverserOnAxis1 ? '' : 'opacity-30'}`}
        onSelect={() => {
          if (reverserOnAxis1) {
            switchDetent(1);
          }
        }}
        selected={selectedDetent === 1}
      >
        {t('Settings.ThrottleConfig.ReverseIdle')}
      </SelectItem>
      <SelectItem
        disabled={!reverserOnAxis1}
        className={`${reverserOnAxis1 ? '' : 'opacity-30'}`}
        onSelect={() => {
          if (reverserOnAxis1) {
            switchDetent(0);
          }
        }}
        selected={selectedDetent === 0}
      >
        {t('Settings.ThrottleConfig.ReverseFull')}
      </SelectItem>
    </VerticalSelectGroup>
  );

  const axisSelectGroup = (
    <SelectGroup>
      {aircraftContext.settingsPages.throttle.axisOptions.map((option) => (
        <SelectItem selected={axisNum === option} onSelect={() => setAxisNum(option)}>
          {option}
        </SelectItem>
      ))}
    </SelectGroup>
  );

  // The calibration UI displays a number of axes usually corresponding to the number of levers/axes a user has for their throttle.
  // The UI will display 1, 2 or 4 axis depending on the user's setting (usually based on the aircraft and the user's hardware).
  // So we must configure this UI to display the correct number of axes with the correct throttle MSFS mappings (input) and
  // behavior.
  // E.g.:
  // - A320 with 2 hardware axis and 2 throttles will use hardware axis 1 for throttle 1, and hardware axis 2 for throttle 2
  // - A380 with 2 hardware axis and 4 throttles will use hardware axis 1 for throttle 1 + 2 and 2 for throttle 3 + 4
  // We call the current user hardware axis to be displayed the "userAxis".
  // We call the throttle mappings the "inputThrottle". (e.g. A380X userAxis 2 will use inputThrottle 3 as per MSFSconfig).
  // We call the number of user hardware axes the "numberOfUserAxes".
  // We call the number of throttles of the aircraft the "numberOfThrottles".

  // A320 uses axis 1 for throttle 1 and axis 2 for throttle 2
  const oneAxis = (
    <div className="flex flex-row justify-center rounded-xl">
      <BaseThrottleConfig
        userAxis={1}
        inputThrottle={1}
        numberOfUserAxes={1}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleOneSimvars}
        throttleSimvarsSet2={throttleTwoSimvars}
        throttleSimvarsSet3={throttleThreeSimvars}
        throttleSimvarsSet4={throttleFourSimvars}
        activeDetent={selectedDetent}
      />
      <div className="my-auto ml-8 text-center">{navigationBar}</div>
    </div>
  );

  // A320 uses axis 1 for throttle 1 and axis 2 for throttle 2
  const twoAxisA320 = (
    <div className="mx-32 flex flex-row">
      <BaseThrottleConfig
        userAxis={1}
        inputThrottle={1}
        numberOfUserAxes={2}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleOneSimvars}
        activeDetent={selectedDetent}
      />
      <div className="m-auto text-center">{navigationBar}</div>
      <BaseThrottleConfig
        userAxis={2}
        inputThrottle={2}
        numberOfUserAxes={2}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleTwoSimvars}
        activeDetent={selectedDetent}
      />
    </div>
  );

  // A380 uses axis 1 for throttle 1 + 2 and axis 2 for throttle 3 + 4
  const twoAxisA380 = (
    <div className="mx-32 flex flex-row">
      <BaseThrottleConfig
        userAxis={1}
        inputThrottle={1}
        numberOfUserAxes={2}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleOneSimvars}
        throttleSimvarsSet2={throttleTwoSimvars}
        activeDetent={selectedDetent}
      />
      <div className="m-auto text-center">{navigationBar}</div>
      <BaseThrottleConfig
        userAxis={2}
        inputThrottle={3} // A380X uses input of throttle 3 for the second user hardware axis as per MSFS mapping
        numberOfUserAxes={2}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleThreeSimvars}
        throttleSimvarsSet2={throttleFourSimvars}
        activeDetent={selectedDetent}
      />
    </div>
  );

  const fourAxis = (
    <div className="mx-16 flex flex-row">
      <BaseThrottleConfig
        userAxis={1}
        inputThrottle={1}
        numberOfUserAxes={4}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleOneSimvars}
        activeDetent={selectedDetent}
        reverseDisabled
      />
      <BaseThrottleConfig
        userAxis={2}
        inputThrottle={2}
        numberOfUserAxes={4}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleTwoSimvars}
        activeDetent={selectedDetent}
      />
      <div className="m-auto text-center">{navigationBar}</div>
      <BaseThrottleConfig
        userAxis={3}
        inputThrottle={3}
        numberOfUserAxes={4}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleThreeSimvars}
        activeDetent={selectedDetent}
      />
      <BaseThrottleConfig
        userAxis={4}
        inputThrottle={4}
        numberOfUserAxes={4}
        numberOfThrottles={numberOfThrottles}
        throttleSimvarsSet1={throttleFourSimvars}
        activeDetent={selectedDetent}
        reverseDisabled
      />
    </div>
  );

  const getAxis = () => {
    switch (axisNum) {
      case 4:
        if (aircraftContext.settingsPages.throttle.numberOfAircraftThrottles === 4) {
          return fourAxis;
        }
        console.warn('A320 does not have 4 axis - defaulting to 2 axis');
        return twoAxisA320;
      case 2:
        if (aircraftContext.settingsPages.throttle.numberOfAircraftThrottles === 4) {
          return twoAxisA380;
        }
        return twoAxisA320;
      case 1:
      default:
        return oneAxis;
    }
  };

  if (!isShown) return null;

  return (
    <div className="flex h-content-section-full flex-col justify-between">
      <div className="space-y-2">
        <div>
          <div className="mb-8 mt-auto flex w-full flex-row items-center justify-center space-x-16 rounded-lg border-2 border-theme-accent p-4">
            <div className="flex flex-row items-center justify-center space-x-4">
              <div>{t('Settings.ThrottleConfig.TogaOnAxis')}</div>
              <Toggle value={!!togaOnAxis1} onToggle={(value) => setTogaOnAxis(value ? 1 : 0)} />
            </div>
            <div className="flex flex-row items-center justify-center space-x-4">
              <div>{t('Settings.ThrottleConfig.ReverserOnAxis')}</div>
              <Toggle value={!!reverserOnAxis1} onToggle={(value) => setReversersOnAxis(value ? 1 : 0)} />
            </div>
            <div className="flex flex-row items-center justify-center space-x-4">
              <div>{t('Settings.ThrottleConfig.IndependentAxis')}</div>
              {axisSelectGroup}
            </div>
          </div>
          {getAxis()}
        </div>

        {/* To make sure users map throttles 1+2 to axis 1 and 3+4 to axis 2 and not any other grouping */}
        {validConfig && numberOfThrottles === 4 && axisNum === 2 && (
          <div className="w-full overflow-hidden rounded-md border-2 border-theme-accent">
            <h2 className="py-4 text-center">{t('Settings.ThrottleConfig.FourThrottleWarning')}</h2>
          </div>
        )}

        {!validConfig && (
          <div className="w-full overflow-hidden rounded-md border-2 border-theme-accent">
            <div className="flex w-full items-center justify-center bg-utility-red py-3">
              <ExclamationCircleFill size={25} />
            </div>
            <h2 className="py-4 text-center">{validationError}</h2>
          </div>
        )}
      </div>

      <div className="flex w-full flex-row justify-between rounded-lg border-2 border-theme-accent p-4">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border-2 border-theme-highlight bg-theme-highlight px-5 py-2.5 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
          >
            {t('Settings.ThrottleConfig.Back')}
          </button>
        </div>
        <div className="flex flex-row space-x-3">
          <button
            type="button"
            onClick={() => {
              showModal(
                <PromptModal
                  title={t('Settings.ThrottleConfig.ThrottleConfigurationReset')}
                  bodyText={t(
                    'Settings.ThrottleConfig.AreYouSureThatYouWantToResetYourCurrentThrottleConfigurationToTheirDefaultStates',
                  )}
                  onConfirm={() => {
                    defaultsToThrottle(1);
                  }}
                />,
              );
            }}
            className="rounded-md border-2 border-theme-highlight bg-theme-highlight px-5 py-2.5 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
          >
            {t('Settings.ThrottleConfig.ResetToDefaults')}
          </button>
          <button
            type="button"
            onClick={() => {
              syncToThrottle(1);
            }}
            className="rounded-md border-2 border-theme-highlight bg-theme-highlight px-5 py-2.5 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
          >
            {t('Settings.ThrottleConfig.LoadFromFile')}
          </button>
          <button
            type="button"
            onClick={() => applyLocalVar(1)}
            className={`rounded-md border-2 px-5 py-2.5 transition duration-100 ${
              validConfig
                ? 'border-theme-highlight bg-theme-highlight text-theme-body hover:bg-theme-body hover:text-theme-highlight'
                : 'border-theme-accent bg-theme-accent opacity-30'
            }`}
          >
            {t('Settings.ThrottleConfig.Apply')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (validConfig) {
                syncToDisk(1);
                applyLocalVar(1);
              }
            }}
            disabled={!validConfig}
            className={`rounded-md border-2 px-5 py-2.5 transition duration-100 ${
              validConfig
                ? 'border-green-400 bg-green-400 text-theme-body hover:bg-theme-body hover:text-green-400'
                : 'border-theme-accent bg-theme-accent opacity-30'
            }`}
          >
            {t('Settings.ThrottleConfig.SaveAndApply')}
          </button>
        </div>
      </div>
    </div>
  );
};
