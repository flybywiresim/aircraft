// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import { round } from 'lodash';
import { CloudArrowDown, PlayFill, StopCircleFill } from 'react-bootstrap-icons';
import { useSimVar, usePersistentNumberProperty, usePersistentProperty, Units } from '@flybywiresim/fbw-sdk';
import Slider from 'rc-slider';
import {
  Card,
  A380FuelOutline,
  t,
  TooltipWrapper,
  SimpleInput,
  SelectGroup,
  SelectItem,
  ProgressBar,
  useAppSelector,
  setFuelImported,
  useAppDispatch,
} from '@flybywiresim/flypad';

// Page is very WIP, needs to be cleaned up and refactored

interface ValueSimbriefInputProps {
  min: number;
  max: number;
  value: number;
  onBlur: (v: string) => void;
  unit: string;
  showSimbriefButton: boolean;
  onClickSync: () => void;
  disabled?: boolean;
}

const ValueSimbriefInput: React.FC<ValueSimbriefInputProps> = ({
  min,
  max,
  value,
  onBlur,
  unit,
  showSimbriefButton,
  onClickSync,
  disabled,
}) => (
  <div className="relative w-52">
    <div className="flex flex-row">
      <div className="relative">
        <SimpleInput
          className={`${showSimbriefButton && 'rounded-r-none'} my-2 w-full font-mono ${disabled ? 'cursor-not-allowed text-theme-body placeholder:text-theme-body' : ''}`}
          fontSizeClassName="text-2xl"
          number
          min={min}
          max={max}
          value={value.toFixed(0)}
          onBlur={onBlur}
        />
        <div className="absolute right-3 top-0 flex h-full items-center font-mono text-2xl text-gray-400">{unit}</div>
      </div>
      {showSimbriefButton && (
        <TooltipWrapper text={t('Ground.Payload.TT.FillPayloadFromSimbrief')}>
          <div
            className={`my-2 flex h-auto items-center justify-center rounded-md rounded-l-none
                                        border-2 border-theme-highlight bg-theme-highlight
                                        px-2 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight`}
            onClick={onClickSync}
          >
            <CloudArrowDown size={26} />
          </div>
        </TooltipWrapper>
      )}
    </div>
  </div>
);

interface NumberUnitDisplayProps {
  /**
   * The value to show
   */
  value: number;

  /**
   * The amount of leading zeroes to pad with
   */
  padTo: number;

  /**
   * The unit to show at the end
   */
  unit: string;
}

const ValueUnitDisplay: React.FC<NumberUnitDisplayProps> = ({ value, padTo, unit }) => {
  const fixedValue = value.toFixed(0);
  const leadingZeroCount = Math.max(0, padTo - fixedValue.length);

  return (
    <span className="flex items-center">
      <span className="flex justify-end pr-2 text-2xl">
        <span className="text-2xl text-gray-600">{'0'.repeat(leadingZeroCount)}</span>
        {fixedValue}
      </span>{' '}
      <span className="text-2xl text-gray-500">{unit}</span>
    </span>
  );
};

interface FuelProps {
  simbriefDataLoaded: boolean;
  simbriefPlanRamp: number;
  simbriefUnits: string;
  massUnitForDisplay: string;
  isOnGround: boolean;
}
export const A380Fuel: React.FC<FuelProps> = ({
  simbriefDataLoaded,
  simbriefPlanRamp,
  simbriefUnits,
  massUnitForDisplay,
  isOnGround,
}) => {
  const TOTAL_FUEL_GALLONS = 85471.7; // 323545.6 litres
  const FUEL_GALLONS_TO_KG = 3.039075693483925; // Check: MSFS fuel density is currently always fixed, if this changes this will need to read from the var.
  const TOTAL_MAX_FUEL_KG = TOTAL_FUEL_GALLONS * FUEL_GALLONS_TO_KG;
  const TOTAL_UI_MAX_FUEL_KG = 220000.0; // Temporarily while we are using WV003, so the slider will not set a value that is far above current MTOW. OFP and manual entry not affected.

  const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'Bool', 1_000);
  const [eng2Running] = useSimVar('ENG COMBUSTION:2', 'Bool', 1_000);
  const [eng3Running] = useSimVar('ENG COMBUSTION:3', 'Bool', 1_000);
  const [eng4Running] = useSimVar('ENG COMBUSTION:4', 'Bool', 1_000);
  const [refuelRate, setRefuelRate] = usePersistentProperty('REFUEL_RATE_SETTING');

  const [INNER_FEED_MAX_KG] = useState(7753.2 * FUEL_GALLONS_TO_KG); // 23562.51 kg - 47053.02
  const [OUTER_FEED_MAX_KG] = useState(7299.6 * FUEL_GALLONS_TO_KG); // 22189.04 kg - 44378.08
  const [INNER_TANK_MAX_KG] = useState(12189.4 * FUEL_GALLONS_TO_KG); // 37044.51 kg
  const [MID_TANK_MAX_KG] = useState(9632 * FUEL_GALLONS_TO_KG); // 29299.51 kg
  const [OUTER_TANK_MAX_KG] = useState(2731.5 * FUEL_GALLONS_TO_KG); // 8299.51 kg
  const [TRIM_TANK_MAX_KG] = useState(6260.3 * FUEL_GALLONS_TO_KG); // 18999.51 kg

  const [leftOuterGal] = useSimVar('FUELSYSTEM TANK QUANTITY:1', 'Gallons', 2_000);
  const [feedOneGal] = useSimVar('FUELSYSTEM TANK QUANTITY:2', 'Gallons', 2_000);
  const [leftMidGal] = useSimVar('FUELSYSTEM TANK QUANTITY:3', 'Gallons', 2_000);
  const [leftInnerGal] = useSimVar('FUELSYSTEM TANK QUANTITY:4', 'Gallons', 2_000);
  const [feedTwoGal] = useSimVar('FUELSYSTEM TANK QUANTITY:5', 'Gallons', 2_000);
  const [feedThreeGal] = useSimVar('FUELSYSTEM TANK QUANTITY:6', 'Gallons', 2_000);
  const [rightInnerGal] = useSimVar('FUELSYSTEM TANK QUANTITY:7', 'Gallons', 2_000);
  const [rightMidGal] = useSimVar('FUELSYSTEM TANK QUANTITY:8', 'Gallons', 2_000);
  const [feedFourGal] = useSimVar('FUELSYSTEM TANK QUANTITY:9', 'Gallons', 2_000);
  const [rightOuterGal] = useSimVar('FUELSYSTEM TANK QUANTITY:10', 'Gallons', 2_000);
  const [trimGal] = useSimVar('FUELSYSTEM TANK QUANTITY:11', 'Gallons', 2_000);
  const [totalFuelWeightKg] = useSimVar('FUEL TOTAL QUANTITY WEIGHT', 'Kilograms', 2_000);

  const [fuelDesiredKg, setFuelDesiredKg] = useSimVar('L:A32NX_FUEL_DESIRED', 'Kilograms', 2_000);
  const [refuelStartedByUser, setRefuelStartedByUser] = useSimVar('L:A32NX_REFUEL_STARTED_BY_USR', 'Bool', 2_000);

  // Simbrief
  const [showSimbriefButton, setShowSimbriefButton] = useState(false);

  // GSX
  const [gsxFuelSyncEnabled] = usePersistentNumberProperty('GSX_FUEL_SYNC', 0);
  const [gsxFuelHoseConnected] = useSimVar('L:FSDT_GSX_FUELHOSE_CONNECTED', 'Number');

  const dispatch = useAppDispatch();
  const fuelImported = useAppSelector((state) => state.simbrief.fuelImported);

  useEffect(() => {
    if (simbriefDataLoaded === true && fuelImported === false) {
      handleSimbriefFuelSync();
      dispatch(setFuelImported(true));
    }
  }, []);

  useEffect(() => {
    // GSX
    if (gsxFuelSyncEnabled === 1) {
      /*
            TODO: Uncomment?
            if (boardingStarted) {
                setShowSimbriefButton(false);
                return;
            }
            */
      setShowSimbriefButton(simbriefDataLoaded);
      return;
    }
    // EFB
    if (Math.abs(Math.round(fuelDesiredKg) - roundUpNearest100(simbriefPlanRamp)) < 10) {
      setShowSimbriefButton(false);
      return;
    }
    setShowSimbriefButton(simbriefDataLoaded);
  }, [fuelDesiredKg, simbriefDataLoaded, gsxFuelSyncEnabled]);

  const canRefuel = useCallback(
    () => !(eng1Running || eng2Running || eng3Running || eng4Running || !isOnGround),
    [eng1Running, eng2Running, eng3Running, eng4Running, isOnGround],
  );

  const airplaneCanRefuel = useCallback(() => {
    if (refuelRate !== '2') {
      if (!canRefuel()) {
        setRefuelRate('2');
      }
    }

    if (gsxFuelSyncEnabled === 1) {
      if (gsxFuelHoseConnected === 1) {
        return true;
      }

      // In-flight refueling with GSX Sync enabled
      return (eng1Running || eng2Running || eng3Running || eng4Running || !isOnGround) && refuelRate === '2';
    }
    return true;
  }, [
    eng1Running,
    eng2Running,
    eng3Running,
    eng4Running,
    isOnGround,
    refuelRate,
    gsxFuelSyncEnabled,
    gsxFuelHoseConnected,
  ]);

  const updateDesiredFuel = (newDesiredFuelKg: number) => {
    if (newDesiredFuelKg > TOTAL_MAX_FUEL_KG) {
      newDesiredFuelKg = round(TOTAL_MAX_FUEL_KG);
    }

    setFuelDesiredKg(newDesiredFuelKg);
  };

  const updateDesiredFuelPercent = (percent: number) => {
    if (percent < 0.5) {
      percent = 0;
    }
    const fuel = Math.round(TOTAL_UI_MAX_FUEL_KG * (percent / 100));
    updateDesiredFuel(fuel);
  };

  /*
    TODO: Uncomment, refactor for new variable naming, and add 380 specific fueling estimate logic
    const calculateEta = () => {
        if (round(totalTarget) === totalFuelWeightKg || refuelRate === '2') { // instant
            return ' 0';
        }
        let estimatedTimeSeconds = 0;
        const totalWingFuel = TOTAL_FUEL_GALLONS - CENTER_TANK_GALLONS;
        const differentialFuelWings = Math.abs(currentWingFuel() - targetWingFuel());
        const differentialFuelCenter = Math.abs(centerTarget - centerCurrent);
        estimatedTimeSeconds += (differentialFuelWings / totalWingFuel) * wingTotalRefuelTimeSeconds;
        estimatedTimeSeconds += (differentialFuelCenter / CENTER_TANK_GALLONS) * CenterTotalRefuelTimeSeconds;
        if (refuelRate === '1') { // fast
            estimatedTimeSeconds /= 5;
        }
        if (estimatedTimeSeconds < 35) {
            return ' 0.5';
        }
        return ` ${Math.round(estimatedTimeSeconds / 60)}`;
    };
     */

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSimbriefFuelSync = () => {
    let fuelToLoad = -1;
    if (simbriefUnits === 'kgs') {
      fuelToLoad = roundUpNearest100(simbriefPlanRamp);
    } else {
      fuelToLoad = roundUpNearest100(Units.poundToKilogram(simbriefPlanRamp));
    }

    updateDesiredFuel(fuelToLoad);
  };

  const roundUpNearest100 = (plannedFuel: number) => Math.ceil(plannedFuel / 100) * 100;

  const switchRefuelState = useCallback(() => {
    if (airplaneCanRefuel()) {
      setRefuelStartedByUser(!refuelStartedByUser);
    }
  }, [refuelStartedByUser]);

  const formatRefuelStatusLabel = () => {
    if (airplaneCanRefuel()) {
      if (round(fuelDesiredKg) === totalFuelWeightKg) {
        return `(${t('Ground.Fuel.Completed')})`;
      }
      if (refuelStartedByUser) {
        return fuelDesiredKg > totalFuelWeightKg
          ? `(${t('Ground.Fuel.Refueling')}...)`
          : `(${t('Ground.Fuel.Defueling')}...)`;
      }
      return `(${t('Ground.Fuel.ReadyToStart')})`;
    }
    if (refuelStartedByUser) {
      setRefuelStartedByUser(false);
    }
    return gsxFuelSyncEnabled === 1 ? `(${t('Ground.Fuel.GSXFuelSyncEnabled')})` : `(${t('Ground.Fuel.Unavailable')})`;
  };

  const formatRefuelStatusClass = useCallback(() => {
    if (airplaneCanRefuel()) {
      if (round(fuelDesiredKg) === totalFuelWeightKg || !refuelStartedByUser) {
        if (refuelStartedByUser) {
          setRefuelStartedByUser(false);
        }
        return 'text-theme-highlight';
      }
      return fuelDesiredKg > totalFuelWeightKg ? 'text-green-500' : 'text-yellow-500';
    }
    return 'text-theme-accent';
  }, [fuelDesiredKg, totalFuelWeightKg, refuelStartedByUser]);

  return (
    <div className="relative flex flex-col justify-center">
      <div className="relative flex h-content-section-reduced w-full flex-row justify-between">
        <Card
          className="absolute left-0 top-6 flex w-fit"
          childrenContainerClassName={`w-full ${simbriefDataLoaded ? 'rounded-r-none' : ''}`}
        >
          <table className="table-fixed">
            <tbody>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Feed Two</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((feedTwoGal * FUEL_GALLONS_TO_KG) / INNER_FEED_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(feedTwoGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Left Inner</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((leftInnerGal * FUEL_GALLONS_TO_KG) / INNER_TANK_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(leftInnerGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Left Mid</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((leftMidGal * FUEL_GALLONS_TO_KG) / MID_TANK_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(leftMidGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Feed One</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((feedOneGal * FUEL_GALLONS_TO_KG) / OUTER_FEED_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(feedOneGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Left Outer</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((leftOuterGal * FUEL_GALLONS_TO_KG) / OUTER_TANK_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(leftOuterGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </Card>{' '}
        <Card
          className="absolute right-0 top-6 flex w-fit"
          childrenContainerClassName={`w-full ${simbriefDataLoaded ? 'rounded-r-none' : ''}`}
        >
          <table className="table-fixed">
            <tbody>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Feed Three</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((feedThreeGal * FUEL_GALLONS_TO_KG) / INNER_FEED_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(feedThreeGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Right Inner</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((rightInnerGal * FUEL_GALLONS_TO_KG) / INNER_TANK_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(rightInnerGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Right Mid</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((rightMidGal * FUEL_GALLONS_TO_KG) / MID_TANK_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(rightMidGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Feed Four</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((feedFourGal * FUEL_GALLONS_TO_KG) / OUTER_FEED_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(feedFourGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
              <tr>
                <td className="text-md whitespace-nowrap px-2 font-light">Right Outer</td>
                <td className="text-md whitespace-nowrap px-2 font-light">
                  <ProgressBar
                    height="10px"
                    width="80px"
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={((rightOuterGal * FUEL_GALLONS_TO_KG) / OUTER_TANK_MAX_KG) * 100}
                  />
                </td>
                <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                  <ValueUnitDisplay
                    value={Units.kilogramToUser(rightOuterGal * FUEL_GALLONS_TO_KG)}
                    padTo={6}
                    unit={massUnitForDisplay}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </Card>{' '}
        <A380FuelOutline
          className="absolute inset-x-0 right-4 top-20 mx-auto flex size-full text-theme-text"
          feed1Percent={(Math.max(feedThreeGal * FUEL_GALLONS_TO_KG, 0) / OUTER_FEED_MAX_KG) * 100}
          feed2Percent={(Math.max(feedThreeGal * FUEL_GALLONS_TO_KG, 0) / INNER_FEED_MAX_KG) * 100}
          feed3Percent={(Math.max(feedThreeGal * FUEL_GALLONS_TO_KG, 0) / INNER_FEED_MAX_KG) * 100}
          feed4Percent={(Math.max(feedThreeGal * FUEL_GALLONS_TO_KG, 0) / OUTER_FEED_MAX_KG) * 100}
          leftInnerPercent={(Math.max(leftInnerGal * FUEL_GALLONS_TO_KG, 0) / INNER_TANK_MAX_KG) * 100}
          leftMidPercent={(Math.max(leftMidGal * FUEL_GALLONS_TO_KG, 0) / MID_TANK_MAX_KG) * 100}
          leftOuterPercent={(Math.max(leftOuterGal * FUEL_GALLONS_TO_KG, 0) / OUTER_TANK_MAX_KG) * 100}
          rightInnerPercent={(Math.max(rightInnerGal * FUEL_GALLONS_TO_KG, 0) / INNER_TANK_MAX_KG) * 100}
          rightMidPercent={(Math.max(rightMidGal * FUEL_GALLONS_TO_KG, 0) / MID_TANK_MAX_KG) * 100}
          rightOuterPercent={(Math.max(rightOuterGal * FUEL_GALLONS_TO_KG, 0) / OUTER_TANK_MAX_KG) * 100}
          trimPercent={(Math.max(trimGal * FUEL_GALLONS_TO_KG, 0) / TRIM_TANK_MAX_KG) * 100}
          enableDynamic={(!eng1Running && !eng2Running && !eng3Running && !eng4Running) || refuelStartedByUser}
        />
      </div>

      <Card
        className="absolute bottom-40 left-20 flex"
        childrenContainerClassName={`w-full ${simbriefDataLoaded ? 'rounded-r-none' : ''}`}
      >
        <table className="table-fixed">
          <tbody>
            <tr>
              <td className="text-md whitespace-nowrap px-2 font-light">Trim</td>
              <td className="text-md whitespace-nowrap px-2 font-light">
                <ProgressBar
                  height="10px"
                  width="80px"
                  displayBar={false}
                  completedBarBegin={100}
                  isLabelVisible={false}
                  bgcolor="var(--color-highlight)"
                  completed={((trimGal * FUEL_GALLONS_TO_KG) / TRIM_TANK_MAX_KG) * 100}
                />
              </td>
              <td className="text-md my-2 whitespace-nowrap px-2 font-mono font-light">
                <ValueUnitDisplay
                  value={Units.kilogramToUser(trimGal * FUEL_GALLONS_TO_KG)}
                  padTo={6}
                  unit={massUnitForDisplay}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
      <div className="flex flex-col items-center justify-end">
        <div className="border-theme-accentborder-2 absolute bottom-0 left-0 z-10 flex max-w-4xl flex-row overflow-x-hidden rounded-2xl border">
          <div className="space-y-4 px-5 py-3">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center space-x-3">
                <h2 className="font-medium">{t('Ground.Fuel.Refuel')}</h2>
                <p className={formatRefuelStatusClass()}>{formatRefuelStatusLabel()}</p>
              </div>
              {/*
                            // TODO: Implement
                                <p>{`${t('Ground.Fuel.EstimatedDuration')}: 0`}</p>
                            */}
            </div>
            <div className="flex flex-row items-center space-x-32">
              <Slider
                style={{ width: '28rem' }}
                value={(fuelDesiredKg / TOTAL_UI_MAX_FUEL_KG) * 100}
                onChange={updateDesiredFuelPercent}
              />
              <div className="flex flex-row">
                <ValueSimbriefInput
                  min={0}
                  max={Math.ceil(Units.kilogramToUser(TOTAL_MAX_FUEL_KG))}
                  value={Units.kilogramToUser(fuelDesiredKg)}
                  onBlur={(x) => {
                    if (!Number.isNaN(parseInt(x) || parseInt(x) === 0)) {
                      updateDesiredFuel(Units.userToKilogram(parseInt(x)));
                    }
                  }}
                  unit={massUnitForDisplay}
                  showSimbriefButton={showSimbriefButton}
                  onClickSync={handleSimbriefFuelSync}
                  disabled={gsxFuelSyncEnabled === 1}
                />
              </div>
            </div>
          </div>
          <div
            className={`flex w-48 items-center justify-center ${formatRefuelStatusClass()} bg-current`}
            onClick={() => switchRefuelState()}
          >
            <div className={`${airplaneCanRefuel() ? 'text-white' : 'text-theme-unselected'}`}>
              <PlayFill size={50} className={refuelStartedByUser ? 'hidden' : ''} />
              <StopCircleFill size={50} className={refuelStartedByUser ? '' : 'hidden'} />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-6 flex flex-col items-center justify-center space-y-2 overflow-x-hidden rounded-2xl border border-theme-accent px-6 py-3">
        <h2 className="flex font-medium">{t('Ground.Fuel.RefuelTime')}</h2>
        <SelectGroup>
          <SelectItem selected={canRefuel() ? refuelRate === '2' : !canRefuel()} onSelect={() => setRefuelRate('2')}>
            {t('Settings.Instant')}
          </SelectItem>

          <TooltipWrapper
            text={!canRefuel() ? `${t('Ground.Fuel.TT.AircraftMustBeColdAndDarkToChangeRefuelTimes')}` : ''}
          >
            <div>
              <SelectItem
                className={`${!canRefuel() && 'opacity-20'}`}
                disabled={!canRefuel()}
                selected={refuelRate === '1'}
                onSelect={() => setRefuelRate('1')}
              >
                {t('Settings.Fast')}
              </SelectItem>
            </div>
          </TooltipWrapper>
          <TooltipWrapper
            text={!canRefuel() ? `${t('Ground.Fuel.TT.AircraftMustBeColdAndDarkToChangeRefuelTimes')}` : ''}
          >
            <div>
              <SelectItem
                className={`${!canRefuel() && 'opacity-20'}`}
                disabled={!canRefuel()}
                selected={refuelRate === '0'}
                onSelect={() => setRefuelRate('0')}
              >
                {t('Settings.Real')}
              </SelectItem>
            </div>
          </TooltipWrapper>
        </SelectGroup>
      </div>
    </div>
  );
};
