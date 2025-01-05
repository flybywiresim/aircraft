// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import React, { FC } from 'react';
import { useSimVar, Units, AirframeType } from '@flybywiresim/fbw-sdk';
import { IconPlane } from '@tabler/icons';
import { Box, LightningFill, PeopleFill, Rulers, Speedometer2 } from 'react-bootstrap-icons';
import { t, A320NoseOutline, A380NoseOutline, useAppSelector, getMaxPax } from '@flybywiresim/flypad';

interface InformationEntryProps {
  title: string;
  info: string;
}

const InformationEntry: FC<InformationEntryProps> = ({ children, title, info }) => (
  <div>
    <div className="flex flex-row items-center space-x-4 text-theme-highlight">
      {children}
      <p className="whitespace-nowrap">{title}</p>
    </div>
    <p className="font-bold">{info}</p>
  </div>
);

export const OverviewPage = () => {
  let [airline] = useSimVar('ATC AIRLINE', 'String', 1_000);

  airline ||= 'FlyByWire Simulations';
  const [actualGrossWeight] = useSimVar('TOTAL WEIGHT', 'kilograms', 5_000);

  const getConvertedInfo = (metricValue: number, unitType: 'weight' | 'volume' | 'distance') => {
    const numberWithCommas = (x: number) => x.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    switch (unitType) {
      case 'weight':
        return `${numberWithCommas(Units.kilogramToUser(metricValue))} [${Units.userWeightSuffixEis2}]`;
      case 'volume':
        return `${numberWithCommas(Units.litreToUser(metricValue))} [${Units.userVolumeSuffixEis2}]`;
      case 'distance':
        return `${numberWithCommas(metricValue)} [nm]`;
      default:
        throw new Error('Invalid unit type');
    }
  };

  const airframeInfo = useAppSelector((state) => state.config.airframeInfo);

  return (
    <div className="mr-3 h-content-section-reduced w-min overflow-hidden rounded-lg border-2 border-theme-accent p-6">
      <h1 className="font-bold">{airframeInfo.name}</h1>
      <p>{airline}</p>

      <div className="mt-6 flex items-center justify-center">
        {/* TODO: Make this SVG configurable */}
        {airframeInfo.variant === AirframeType.A380_842 ? (
          <A380NoseOutline className="-ml-56 mr-32 h-64 text-theme-text" />
        ) : (
          <A320NoseOutline className="flip-horizontal -ml-96 mr-32 h-64 text-theme-text" />
        )}
      </div>

      <div className="mt-8 flex flex-row space-x-16">
        <div className="flex flex-col space-y-8">
          <InformationEntry
            title={t('Dispatch.Overview.Model')}
            info={`${airframeInfo.variant} [${airframeInfo.icao}]`}
          >
            <IconPlane className="fill-current" size={23} stroke={1.5} strokeLinejoin="miter" />
          </InformationEntry>

          <InformationEntry
            title={t('Dispatch.Overview.Range')}
            info={getConvertedInfo(airframeInfo.designLimits.endurance.range, 'distance')}
          >
            <Rulers size={23} />
          </InformationEntry>

          <InformationEntry
            title={t('Dispatch.Overview.ActualGW')}
            info={getConvertedInfo(actualGrossWeight, 'weight')}
          >
            <Box size={23} />
          </InformationEntry>

          <InformationEntry
            title={t('Dispatch.Overview.MZFW')}
            info={getConvertedInfo(airframeInfo.designLimits.weights.maxZfw, 'weight')}
          >
            <Box size={23} />
          </InformationEntry>

          <InformationEntry title={t('Dispatch.Overview.MaximumPassengers')} info={`${getMaxPax()} passengers`}>
            <PeopleFill size={23} />
          </InformationEntry>
        </div>
        <div className="flex flex-col space-y-8">
          <InformationEntry title={t('Dispatch.Overview.Engines')} info={airframeInfo.engines}>
            <LightningFill size={23} />
          </InformationEntry>

          <InformationEntry title={t('Dispatch.Overview.MMO')} info={airframeInfo.designLimits.endurance.mmo}>
            <Speedometer2 size={23} />
          </InformationEntry>

          <InformationEntry
            title={t('Dispatch.Overview.MTOW')}
            info={getConvertedInfo(airframeInfo.designLimits.weights.maxGw, 'weight')}
          >
            <Box size={23} />
          </InformationEntry>

          <InformationEntry
            title={t('Dispatch.Overview.MaximumFuelCapacity')}
            info={getConvertedInfo(airframeInfo.designLimits.weights.maxFuel, 'volume')}
          >
            <Box size={23} />
          </InformationEntry>

          <InformationEntry
            title={t('Dispatch.Overview.MaximumCargo')}
            info={getConvertedInfo(airframeInfo.designLimits.weights.maxCargo, 'weight')}
          >
            <Box size={23} />
          </InformationEntry>
        </div>
      </div>
    </div>
  );
};
