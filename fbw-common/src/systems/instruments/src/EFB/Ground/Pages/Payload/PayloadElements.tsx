// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import {
  ArrowLeftRight,
  BoxArrowRight,
  BriefcaseFill,
  CaretDownFill,
  PersonFill,
  Shuffle,
  StopCircleFill,
} from 'react-bootstrap-icons';
import { AirframeInfo, Units } from '@flybywiresim/fbw-sdk';
import { ProgressBar, t, TooltipWrapper, SimpleInput } from '@flybywiresim/flypad';

export type AirframeSpec = {
  prefix: string;
  weights: AirframeWeights;
  pax: PaxWeights;
};

export type AirframeWeights = {
  maxGw: number;
  maxZfw: number;
  minZfw: number;
  maxGwCg: number;
  maxZfwCg: number;
};

export type PaxWeights = {
  defaultPaxWeight: number;
  defaultBagWeight: number;
  minPaxWeight: number;
  maxPaxWeight: number;
  minBagWeight: number;
  maxBagWeight: number;
};

interface PayloadValueInputProps {
  min: number;
  max: number;
  value: number;
  onBlur: (v: string) => void;
  unit: string;
  disabled?: boolean;
}

export const PayloadValueInput: React.FC<PayloadValueInputProps> = ({ min, max, value, onBlur, unit, disabled }) => (
  <div className="relative w-44">
    <SimpleInput
      disabled={disabled}
      className="my-2 w-full font-mono"
      fontSizeClassName="text-2xl"
      number
      min={min}
      max={max}
      value={value.toFixed(0)}
      onBlur={onBlur}
    />
    <div className="absolute right-3 top-0 flex h-full items-center font-mono text-2xl text-gray-400">{unit}</div>
  </div>
);

// TODO: To be removed, relocated from Constants
interface CargoStationInfo {
  name: string;
  weight: number;
  simVar: string;
  stationIndex: number;
  progressBarWidth: number;
  position: number;
}

interface CargoBarProps {
  cargoId: number;
  cargo: number[];
  cargoDesired: number[];
  cargoMap: CargoStationInfo[];
  onClickCargo: (cargoStation: number, event: any) => void;
}

export const CargoBar: React.FC<CargoBarProps> = ({ cargoId, cargo, cargoDesired, cargoMap, onClickCargo }) => (
  <>
    <div>
      <BriefcaseFill size={25} className="mx-3 my-1" />
    </div>
    <div className="cursor-pointer" onClick={(e) => onClickCargo(cargoId, e)}>
      <ProgressBar
        height="20px"
        width={`${cargoMap[cargoId].progressBarWidth}px`}
        displayBar={false}
        completedBarBegin={100}
        isLabelVisible={false}
        bgcolor="var(--color-highlight)"
        completed={(cargo[cargoId] / cargoMap[cargoId].weight) * 100}
      />
      <CaretDownFill
        size={25}
        className="absolute top-0"
        style={{
          transform: `translateY(-12px) translateX(${(cargoDesired[cargoId] / cargoMap[cargoId].weight) * cargoMap[cargoId].progressBarWidth - 12}px)`,
        }}
      />
    </div>
  </>
);

interface MiscParamsProps {
  disable: boolean;
  minPaxWeight: number;
  maxPaxWeight: number;
  defaultPaxWeight: number;
  minBagWeight: number;
  maxBagWeight: number;
  defaultBagWeight: number;
  paxWeight: number;
  bagWeight: number;
  massUnitForDisplay: string;
  setPaxWeight: (w: number) => void;
  setBagWeight: (w: number) => void;
}

export const MiscParamsInput: React.FC<MiscParamsProps> = ({
  disable,
  minPaxWeight,
  maxPaxWeight,
  defaultPaxWeight,
  minBagWeight,
  maxBagWeight,
  defaultBagWeight,
  paxWeight,
  bagWeight,
  massUnitForDisplay,
  setPaxWeight,
  setBagWeight,
}) => (
  <>
    <TooltipWrapper text={t('Ground.Payload.TT.PerPaxWeight')}>
      <div className="text-medium relative flex flex-row items-center font-light">
        <PersonFill size={25} className="mx-3" />
        <SimpleInput
          disabled={disable}
          className="w-24"
          number
          min={minPaxWeight}
          max={maxPaxWeight}
          placeholder={defaultPaxWeight.toString()}
          value={Units.kilogramToUser(paxWeight).toFixed(0)}
          onBlur={(x) => {
            if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) setPaxWeight(Units.userToKilogram(parseInt(x)));
          }}
        />
        <div className="absolute right-3 top-2 text-lg text-gray-400">{massUnitForDisplay}</div>
      </div>
    </TooltipWrapper>

    <TooltipWrapper text={t('Ground.Payload.TT.PerPaxBagWeight')}>
      <div className="text-medium relative flex flex-row items-center font-light">
        <BriefcaseFill size={25} className="mx-3" />
        <SimpleInput
          disabled={disable}
          className="w-24"
          number
          min={minBagWeight}
          max={maxBagWeight}
          placeholder={defaultBagWeight.toString()}
          value={Units.kilogramToUser(bagWeight).toFixed(0)}
          onBlur={(x) => {
            if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) setBagWeight(Units.userToKilogram(parseInt(x)));
          }}
        />
        <div className="absolute right-3 top-2 text-lg text-gray-400">{massUnitForDisplay}</div>
      </div>
    </TooltipWrapper>
  </>
);

interface BoardingInputProps {
  boardingStatusClass: string;
  boardingStarted: boolean;
  totalPax: number;
  totalCargo: number;
  setBoardingStarted: (boardingStarted: boolean) => void;
  handleDeboarding: () => void;
}

export const BoardingInput: React.FC<BoardingInputProps> = ({
  boardingStatusClass,
  boardingStarted,
  totalPax,
  totalCargo,
  setBoardingStarted,
  handleDeboarding,
}) => (
  <>
    <TooltipWrapper text={t('Ground.Payload.TT.StartBoarding')}>
      <button
        type="button"
        className={`ml-auto flex h-12 w-24 items-center justify-center rounded-lg ${boardingStatusClass} bg-current`}
        onClick={() => setBoardingStarted(!boardingStarted)}
      >
        <div className="text-theme-body">
          <ArrowLeftRight size={32} className={boardingStarted ? 'hidden' : ''} />
          <StopCircleFill size={32} className={boardingStarted ? '' : 'hidden'} />
        </div>
      </button>
    </TooltipWrapper>

    <TooltipWrapper text={t('Ground.Payload.TT.StartDeboarding')}>
      <button
        type="button"
        className={`ml-1 flex h-12 w-16 items-center justify-center rounded-lg bg-current text-theme-highlight ${((totalPax === 0 && totalCargo === 0) || boardingStarted) && 'pointer-events-none opacity-20'}`}
        onClick={() => handleDeboarding()}
      >
        <div className="text-theme-body">
          {' '}
          <BoxArrowRight size={32} />
        </div>
      </button>
    </TooltipWrapper>
  </>
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

export const PayloadValueUnitDisplay: React.FC<NumberUnitDisplayProps> = ({ value, padTo, unit }) => {
  const fixedValue = value.toFixed(0);
  const leadingZeroCount = Math.max(0, padTo - fixedValue.length);

  return (
    <span className="flex items-center">
      <span className="flex w-20 justify-end pr-2 text-2xl">
        <span className="text-2xl text-gray-400">{'0'.repeat(leadingZeroCount)}</span>
        {fixedValue}
      </span>{' '}
      <span className="text-2xl text-gray-500">{unit}</span>
    </span>
  );
};

export const PayloadPercentUnitDisplay: React.FC<{ value: number }> = ({ value }) => {
  const fixedValue = value.toFixed(2);

  return (
    <span className="flex items-center">
      <span className="flex w-20 justify-end pr-2 text-2xl">{fixedValue}</span>{' '}
      <span className="text-2xl text-gray-500">%</span>
    </span>
  );
};

interface PayloadInputTableProps {
  airframeInfo: AirframeInfo;
  emptyWeight: number;
  massUnitForDisplay: string;
  displayZfw: boolean;
  BoardingInProgress: boolean;
  totalPax: number;
  totalPaxDesired: number;
  maxPax: number;
  totalCargo: number;
  totalCargoDesired: number;
  maxCargo: number;
  zfw: number;
  zfwDesired: number;
  zfwCgMac: number;
  desiredZfwCgMac: number;
  gw: number;
  gwDesired: number;
  gwCgMac: number;
  desiredGwCgMac: number;
  setTargetPax: (targetPax: number) => void;
  setTargetCargo: (targetCargo: number, cargoStation: number) => void;
  processZfw: (zfw: number) => void;
  processGw: (zfw: number) => void;
  setDisplayZfw: (displayZfw: boolean) => void;
}

export const PayloadInputTable: React.FC<PayloadInputTableProps> = ({
  airframeInfo,
  emptyWeight,
  massUnitForDisplay,
  BoardingInProgress,
  displayZfw,
  totalPax,
  totalPaxDesired,
  maxPax,
  totalCargo,
  totalCargoDesired,
  maxCargo,
  zfw,
  zfwDesired,
  zfwCgMac,
  desiredZfwCgMac,
  gw,
  gwDesired,
  gwCgMac,
  desiredGwCgMac,
  setTargetPax,
  setTargetCargo,
  processZfw,
  processGw,
  setDisplayZfw,
}) => (
  <table className="w-full table-fixed">
    <thead className="mx-2 w-full border-b px-8">
      <tr className="py-2">
        <th scope="col" className="text-md w-2/5 px-4 py-2 text-left font-medium">
          {' '}
        </th>
        <th scope="col" className="text-md w-1/2 px-4 py-2 text-left font-medium">
          {t('Ground.Payload.Planned')}
        </th>
        <th scope="col" className="text-md w-1/4 px-4 py-2 text-left font-medium">
          {t('Ground.Payload.Current')}
        </th>
      </tr>
    </thead>

    <tbody>
      <tr className="h-2" />
      <tr>
        <td className="text-md whitespace-nowrap px-4 font-light">{t('Ground.Payload.Passengers')}</td>
        <td className="mx-8">
          <TooltipWrapper text={`${t('Ground.Payload.TT.MaxPassengers')} ${maxPax}`}>
            <div className="text-md whitespace-nowrap px-4 font-light">
              <PayloadValueInput
                min={0}
                max={maxPax > 0 ? maxPax : 999}
                value={totalPaxDesired}
                onBlur={(x) => {
                  if (!Number.isNaN(parseInt(x) || parseInt(x) === 0)) {
                    setTargetPax(parseInt(x));
                    setTargetCargo(parseInt(x), 0);
                  }
                }}
                unit="PAX"
                disabled={BoardingInProgress}
              />
            </div>
          </TooltipWrapper>
        </td>
        <td className="text-md w-20 whitespace-nowrap px-4 font-mono font-light">
          <PayloadValueUnitDisplay value={totalPax} padTo={3} unit="PAX" />
        </td>
      </tr>

      <tr>
        <td className="text-md whitespace-nowrap px-4 font-light">{t('Ground.Payload.Cargo')}</td>
        <td>
          <TooltipWrapper
            text={`${t('Ground.Payload.TT.MaxCargo')} ${Units.kilogramToUser(maxCargo).toFixed(0)} ${massUnitForDisplay}`}
          >
            <div className="text-md whitespace-nowrap px-4 font-light">
              <PayloadValueInput
                min={0}
                max={maxCargo > 0 ? Math.round(Units.kilogramToUser(maxCargo)) : 99999}
                value={Units.kilogramToUser(totalCargoDesired)}
                onBlur={(x) => {
                  if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) {
                    setTargetCargo(0, Units.userToKilogram(parseInt(x)));
                  }
                }}
                unit={massUnitForDisplay}
                disabled={BoardingInProgress}
              />
            </div>
          </TooltipWrapper>
        </td>
        <td className="text-md w-20 whitespace-nowrap px-4 font-mono font-light">
          <PayloadValueUnitDisplay value={Units.kilogramToUser(totalCargo)} padTo={5} unit={massUnitForDisplay} />
        </td>
      </tr>

      <tr>
        <td className="text-md whitespace-nowrap px-4 font-light">
          {displayZfw ? t('Ground.Payload.ZFW') : t('Ground.Payload.GW')}
        </td>
        <td>
          {displayZfw ? (
            <TooltipWrapper
              text={`${t('Ground.Payload.TT.MaxZFW')} ${Units.kilogramToUser(airframeInfo?.designLimits.weights.maxZfw).toFixed(0)} ${massUnitForDisplay}`}
            >
              <div className="text-md whitespace-nowrap px-4 font-light">
                <PayloadValueInput
                  min={Math.round(Units.kilogramToUser(emptyWeight))}
                  max={Math.round(Units.kilogramToUser(airframeInfo?.designLimits.weights.maxZfw))}
                  value={Units.kilogramToUser(zfwDesired)}
                  onBlur={(x) => {
                    if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) processZfw(Units.userToKilogram(parseInt(x)));
                  }}
                  unit={massUnitForDisplay}
                  disabled={BoardingInProgress}
                />
              </div>
            </TooltipWrapper>
          ) : (
            <TooltipWrapper
              text={`${t('Ground.Payload.TT.MaxGW')} ${Units.kilogramToUser(airframeInfo?.designLimits.weights.maxGw).toFixed(0)} ${massUnitForDisplay}`}
            >
              <div className="text-md whitespace-nowrap px-4 font-light">
                <PayloadValueInput
                  min={Math.round(Units.kilogramToUser(emptyWeight))}
                  max={Math.round(Units.kilogramToUser(airframeInfo?.designLimits.weights.maxGw))}
                  value={Units.kilogramToUser(gwDesired)}
                  onBlur={(x) => {
                    if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) processGw(Units.userToKilogram(parseInt(x)));
                  }}
                  unit={massUnitForDisplay}
                  disabled={BoardingInProgress}
                />
              </div>
            </TooltipWrapper>
          )}
        </td>
        <td className="text-md w-20 whitespace-nowrap px-4 font-mono">
          <PayloadValueUnitDisplay
            value={displayZfw ? Units.kilogramToUser(zfw) : Units.kilogramToUser(gw)}
            padTo={5}
            unit={massUnitForDisplay}
          />
        </td>
      </tr>
      <tr>
        <td className="text-md whitespace-nowrap px-4 font-light">
          <div className="relative flex flex-row items-center justify-start">
            <div>{t(displayZfw ? 'Ground.Payload.ZFWCG' : 'Ground.Payload.GWCG')}</div>
            <div className="ml-auto">
              <button
                type="button"
                className={`ml-auto flex h-8 w-12 items-center justify-center rounded-lg
                                                        bg-current text-theme-highlight`}
                onClick={() => setDisplayZfw(!displayZfw)}
              >
                <div className="text-theme-body">
                  <Shuffle size={24} />
                </div>
              </button>
            </div>
          </div>
        </td>
        <td>
          <TooltipWrapper
            text={
              displayZfw
                ? `${t('Ground.Payload.TT.MaxZFWCG')} ${airframeInfo?.designLimits.weights.maxZfwCg}%`
                : `${t('Ground.Payload.TT.MaxGWCG')} ${airframeInfo?.designLimits.weights.maxGwCg}%`
            }
          >
            <div className="text-md whitespace-nowrap px-4 font-mono">
              {/* TODO FIXME: Setting pax/cargo given desired ZFWCG, ZFW, total pax, total cargo */}
              <div className="rounded-md px-3 py-4 transition">
                <PayloadPercentUnitDisplay value={displayZfw ? desiredZfwCgMac : desiredGwCgMac} />
              </div>
              {/*
                                <SimpleInput
                                    className="my-2 w-24"
                                    number
                                    disabled
                                    min={0}
                                    max={maxPax > 0 ? maxPax : 999}
                                    value={zfwCgMac.toFixed(2)}
                                    onBlur={{(x) => processZfwCg(x)}
                                />
                            */}
            </div>
          </TooltipWrapper>
        </td>
        <td className="text-md whitespace-nowrap px-4 font-mono">
          <PayloadPercentUnitDisplay value={displayZfw ? zfwCgMac : gwCgMac} />
        </td>
      </tr>
    </tbody>
  </table>
);
