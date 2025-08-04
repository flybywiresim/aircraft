// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { get, orderBy, min, max, inRange, set, last, head } from 'lodash';

export type groundSpeed = { from: number; groundSpeed: number };
type groundSpeedRange = { groundSpeed: number; range: [number, number] };

export class TODCalculator {
  private readonly avgGroundSpeed: number;

  public constructor(
    private from: number,
    private to: number,
    groundSpeeds: groundSpeed[],
  ) {
    const groundSpeedRanges = TODCalculator.findGroundSpeedRanges(groundSpeeds);
    const filteredGroundSpeedRanges = TODCalculator.filterGroundSpeedRanges(from, to, groundSpeedRanges);

    this.avgGroundSpeed = this.findAverageGroundSpeed(filteredGroundSpeedRanges);
  }

  public calculateVS(distance: number): number {
    const time = (distance / this.avgGroundSpeed) * 60;

    return (this.to - this.from) / time;
  }

  public calculateDegree(distance: number): number {
    const verticalDistance = Math.abs(this.from - this.to);

    return (Math.atan(verticalDistance / (distance * 6076.12)) * 180) / Math.PI;
  }

  public calculateDistance(input: number, unit: 'FTM' | 'DEGREE'): number {
    const verticalDistance = Math.abs(this.from - this.to);

    if (unit === 'FTM') {
      const verticalDistanceTime = verticalDistance / Math.abs(input);

      return (this.avgGroundSpeed / 60) * verticalDistanceTime;
    }

    return (verticalDistance / Math.tan((input * Math.PI) / 180)) * 0.000164579;
  }

  private findAverageGroundSpeed(groundSpeedsRanges: groundSpeedRange[]) {
    let sum = 0;

    groundSpeedsRanges.forEach(({ groundSpeed, range: [bottom, top] }) => {
      sum += groundSpeed * (top - bottom);
    });

    const totalVerticalDistance =
      get(last(groundSpeedsRanges), ['range', 1]) - get(head(groundSpeedsRanges), ['range', 0]);

    return sum / totalVerticalDistance;
  }

  private static findGroundSpeedRanges(groundSpeeds: groundSpeed[]): groundSpeedRange[] {
    groundSpeeds = orderBy(groundSpeeds, 'from', 'asc');

    const ranges: groundSpeedRange[] = [];

    for (let i = 0; i < groundSpeeds.length; i++) {
      const groundSpeed = get(groundSpeeds, [i, 'groundSpeed']);
      const rangeStart = get(groundSpeeds, [i, 'from']);
      const rangeEnd = get(groundSpeeds, [i + 1, 'from'], 1000000); // Unrealistic default value to avoid many IFs later

      if (groundSpeed !== '' && groundSpeed !== 0 && rangeStart !== '') {
        ranges.push({ groundSpeed, range: [rangeStart, rangeEnd] });
      }
    }

    return ranges;
  }

  private static filterGroundSpeedRanges(from: number, to: number, groundSpeedsArg: groundSpeedRange[]) {
    const groundSpeeds = [...groundSpeedsArg];

    const bottom = min([from, to]);
    const top = max([from, to]);

    let rangeStartElementIndex: number;
    let rangeEndElementIndex: number;

    for (let i = 0; i < groundSpeeds.length; i++) {
      const rangeStart = get(groundSpeeds, [i, 'range', 0]);
      const rangeEnd = get(groundSpeeds, [i, 'range', 1]);

      if (inRange(bottom, rangeStart, rangeEnd)) {
        rangeStartElementIndex = i;
      }

      if (inRange(top, rangeStart, rangeEnd)) {
        rangeEndElementIndex = i;
      }
    }

    const rangeStartElement = set({ ...groundSpeeds[rangeStartElementIndex] }, ['range', 0], bottom);

    if (rangeStartElementIndex !== rangeEndElementIndex) {
      const rangeEndElement = set({ ...groundSpeeds[rangeEndElementIndex] }, ['range', 1], top);

      return [
        rangeStartElement,
        ...groundSpeeds.slice(rangeStartElementIndex + 1, rangeEndElementIndex),
        rangeEndElement,
      ];
    }

    return [set({ ...rangeStartElement }, ['range', 1], top)];
  }
}
