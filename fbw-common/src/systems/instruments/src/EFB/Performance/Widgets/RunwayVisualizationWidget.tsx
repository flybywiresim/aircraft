// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */

import { Units } from '@flybywiresim/fbw-sdk';
import React, { useEffect, useState } from 'react';

export type DistanceLabel = {
  distance: number;
  label: string;
  type: LabelType;
};

export enum LabelType {
  Main,
  Asda,
  Toda,
}

interface RunwayVisualizationProps {
  mainLength?: number;
  asda?: number;
  toda?: number;
  labels?: DistanceLabel[];
  runwayHeading?: number;
  distanceUnit: 'ft' | 'm';
}

interface RunwayNumberProps {
  heading?: number;
}

const RunwayNumber = ({ heading }: RunwayNumberProps) => {
  const displayedHeading = heading! % 360 < 5 ? 360 : heading! % 360;

  return (
    <div className="mx-auto w-min text-4xl font-bold text-white">
      {heading !== undefined
        ? Math.round(displayedHeading / 10)
            .toString()
            .padStart(2, '0')
        : '??'}
    </div>
  );
};

const RunwayVisualizationWidget = ({
  asda = 0,
  labels = [],
  mainLength = 0,
  runwayHeading,
  toda = 0,
  distanceUnit,
}: RunwayVisualizationProps) => {
  const maxDist = () => {
    const distances = labels.map((label) => label.distance);

    return Math.max(mainLength ?? 0, asda ?? 0, toda ?? 0, ...distances);
  };

  const getLabelBottomPercentage = (label: DistanceLabel): number => (label.distance / maxDist()) * 100;

  const mainHeightPercentage = (): number => {
    const maximumDist = maxDist();

    if (mainLength === 0 || maximumDist === 0) {
      return 100;
    }

    const percentage = (mainLength / maxDist()) * 100;

    return Math.max(percentage, 20);
  };

  const asdaHeightPercentage = (): number => Math.max(((asda - mainLength) / maxDist()) * 100, 0);

  const todaHeightPercentage = (): number => Math.max(((toda - asda) / maxDist()) * 100, 0);

  const isLabelOverDistance = (label: DistanceLabel): boolean => {
    switch (label.type) {
      case LabelType.Asda:
        return label.distance > asda;
      case LabelType.Toda:
        return label.distance > toda;
      default:
        return label.distance > mainLength;
    }
  };

  const [labelComponents, setLabelComponents] = useState<JSX.Element>();

  useEffect(
    () =>
      setLabelComponents(() => {
        const elements = labels.map((label) => {
          const bottomPercentage = getLabelBottomPercentage(label);
          const showBelow = label.label === 'MAX';

          return (
            <div
              className={`absolute left-1/2 h-1 w-32 -translate-x-1/2 bg-current${isLabelOverDistance(label) ? 'text-white' : 'text-theme-highlight'}`}
              style={{ bottom: `${bottomPercentage}%` }}
            >
              <p
                className={`text-m absolute -top-0.5 w-full text-center font-bold text-current${isLabelOverDistance(label) ? 'bg-red-900' : 'bg-black'} ${bottomPercentage < 95 && !showBelow ? '-translate-y-full' : 'translate-y-1/4'}`}
              >
                {label.label} {Math.round(distanceUnit === 'ft' ? Units.metreToFoot(label.distance) : label.distance)}
                {distanceUnit}
              </p>
            </div>
          );
        });

        return <>{elements}</>;
      }),
    [labels, distanceUnit],
  );

  const runwayBoundMarkers = (
    <div className="flex flex-row space-x-1.5">
      <div className="h-12 w-1.5 bg-white " />
      <div className="h-12 w-1.5 bg-white " />
      <div className="h-12 w-1.5 bg-white " />
      <div className="h-12 w-1.5 bg-white " />
      <div className="h-12 w-1.5 bg-white " />
      <div className="h-12 w-1.5 bg-white " />
    </div>
  );

  return (
    <div className="flex h-full">
      <div className="relative flex h-full flex-col">
        <div className="shrink-0 bg-red-900" style={{ height: `${100 - mainHeightPercentage()}%` }} />
        <div className="bg-green-200 opacity-50" style={{ height: `${todaHeightPercentage()}%` }} />
        <div className="bg-gray-700 opacity-50" style={{ height: `${asdaHeightPercentage()}%` }} />
        <div className="relative h-full w-44 shrink-0 bg-black">
          <div className="absolute inset-0 flex h-full flex-col justify-between overflow-hidden border-4 border-white px-2.5 py-3">
            <div>
              <div className="flex flex-row justify-between">
                {runwayBoundMarkers}
                {runwayBoundMarkers}
              </div>
              <div className="rotate-180">
                <RunwayNumber heading={runwayHeading === undefined ? undefined : runwayHeading + 180} />
              </div>
            </div>

            <div className="flex h-full flex-col items-center space-y-4 px-2.5 py-3">
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
              <div className="h-full w-1 bg-white" />
            </div>

            <div>
              <RunwayNumber heading={runwayHeading} />
              <div className="flex flex-row justify-between">
                {runwayBoundMarkers}
                {runwayBoundMarkers}
              </div>
            </div>
          </div>
        </div>
        {labelComponents}
      </div>
    </div>
  );
};

export default RunwayVisualizationWidget;
