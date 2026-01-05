// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ArraySubject, EventBus } from '@microsoft/msfs-sdk';
import { along, length } from '@turf/turf';
import { LineString, Point, Position } from 'geojson';
import { Label, LabelStyle, Oanc, OansControlEvents } from './';
import { OancLabelManager } from './OancLabelManager';
import { AmdbFeature, FeatureType } from '@flybywiresim/fbw-sdk';

const MAX_SYMBOL_DIST_NEIGHBORHOOD_SEARCH = 20;
const TAXIWAY_SYMBOL_SPACING = 250;

export class OancMarkerManager<T extends number> {
  constructor(
    public oanc: Oanc<T>,
    private readonly labelManager: OancLabelManager<T>,
    private readonly bus: EventBus,
  ) {
    this.crosses.sub(() => this.updateSymbolsForFeatureIds(), true);
    this.flags.sub(() => this.updateSymbolsForFeatureIds(), true);
  }

  private crosses = ArraySubject.create<Label>();

  private flags = ArraySubject.create<Label>();

  private nextCrossId = 0;
  private nextFlagId = 0;

  addCross(coords: Position, feature?: AmdbFeature) {
    const crossSymbolLabel: Label = {
      text: (this.nextCrossId++).toString(),
      style: LabelStyle.CrossSymbol,
      position: coords,
      rotation: 0,
      associatedFeature: feature,
    };
    this.labelManager.visibleLabels.insert(crossSymbolLabel);
    this.labelManager.labels.push(crossSymbolLabel);
    this.crosses.insert(crossSymbolLabel);
  }

  addFlag(coords: Position, feature?: AmdbFeature) {
    const flagSymbolLabel: Label = {
      text: (this.nextFlagId++).toString(),
      style: LabelStyle.FlagSymbol,
      position: coords,
      rotation: 0,
      associatedFeature: feature,
    };
    this.labelManager.visibleLabels.insert(flagSymbolLabel);
    this.labelManager.labels.push(flagSymbolLabel);
    this.flags.insert(flagSymbolLabel);
  }

  removeCross(id: number) {
    if (!this.crosses.getArray().some((l) => l.text === id.toString())) {
      return;
    }

    const label = this.crosses.getArray().filter((l) => l.text === id.toString())[0];
    this.labelManager.visibleLabels.removeAt(
      this.labelManager.visibleLabels
        .getArray()
        .findIndex((it) => it.text === label.text && it.style === LabelStyle.CrossSymbol),
    );
    this.labelManager.labels = this.labelManager.labels.filter(
      (it) => !(it.text === label.text && it.style === LabelStyle.CrossSymbol),
    );
    this.crosses.removeAt(this.crosses.getArray().findIndex((l) => l.text === id.toString()));
  }

  removeFlag(id: number) {
    if (!this.flags.getArray().some((l) => l.text === id.toString())) {
      return;
    }

    const label = this.flags.getArray().filter((l) => l.text === id.toString())[0];
    this.labelManager.visibleLabels.removeAt(
      this.labelManager.visibleLabels
        .getArray()
        .findIndex((it) => it.text === label.text && it.style === LabelStyle.FlagSymbol),
    );
    this.labelManager.labels = this.labelManager.labels.filter(
      (it) => !(it.text === label.text && it.style === LabelStyle.FlagSymbol),
    );
    this.flags.removeAt(this.flags.getArray().findIndex((l) => l.text === id.toString()));
  }

  eraseAllCrosses() {
    while (this.labelManager.visibleLabels.getArray().findIndex((it) => it.style === LabelStyle.CrossSymbol) !== -1) {
      this.labelManager.visibleLabels.removeAt(
        this.labelManager.visibleLabels.getArray().findIndex((it) => it.style === LabelStyle.CrossSymbol),
      );
    }
    this.labelManager.labels = this.labelManager.labels.filter((it) => !(it.style === LabelStyle.CrossSymbol));
    this.crosses.clear();
  }

  eraseAllFlags() {
    while (this.labelManager.visibleLabels.getArray().findIndex((it) => it.style === LabelStyle.FlagSymbol) !== -1) {
      this.labelManager.visibleLabels.removeAt(
        this.labelManager.visibleLabels.getArray().findIndex((it) => it.style === LabelStyle.FlagSymbol),
      );
    }
    this.labelManager.labels = this.labelManager.labels.filter((it) => !(it.style === LabelStyle.FlagSymbol));
    this.flags.clear();
  }

  updateSymbolsForFeatureIds() {
    const data = {
      featureIdsWithCrosses: [
        ...new Set(
          this.crosses
            .getArray()
            .map((l) => l.associatedFeature?.properties.id)
            .filter((it) => it !== undefined),
        ),
      ],
      featureIdsWithFlags: [
        ...new Set(
          this.flags
            .getArray()
            .map((l) => l.associatedFeature?.properties.id)
            .filter((it) => it !== undefined),
        ),
      ],
    };
    this.bus.getPublisher<OansControlEvents>().pub('oans_symbols_for_feature_ids', data, true);
  }

  addSymbolAtFeature(
    id: number,
    feattype: FeatureType,
    addFunction: (coords: Position, feature?: AmdbFeature) => void,
  ) {
    // Find feature by id in loaded airport data
    const feature = this.oanc.data?.features.filter(
      (it) => it.properties?.id === id && it.properties.feattype === feattype,
    );
    if (feature) {
      if (feattype === FeatureType.TaxiwayGuidanceLine) {
        // Look up all taxiways by name
        const taxiwayLines = this.oanc.data?.features.filter(
          (f) =>
            f.properties.idlin === feature[0].properties.idlin &&
            (f.properties.feattype === FeatureType.TaxiwayGuidanceLine ||
              f.properties.feattype === FeatureType.RunwayExitLine),
        );
        if (taxiwayLines) {
          for (const tw of taxiwayLines) {
            if (tw.geometry.type === 'LineString') {
              const twLength = length(tw, { units: 'degrees' });
              const lineString = tw.geometry as LineString;
              if (twLength > TAXIWAY_SYMBOL_SPACING) {
                // One point every 250m
                for (let alongDistance = 0; alongDistance < twLength; alongDistance += TAXIWAY_SYMBOL_SPACING) {
                  addFunction(
                    along(lineString, Math.min(alongDistance, twLength), { units: 'degrees' }).geometry.coordinates,
                    tw,
                  );
                }
              } else {
                addFunction(lineString.coordinates[0], tw);
                addFunction(lineString.coordinates[lineString.coordinates.length - 1], tw);
              }
            }
          }
        }
      } else if (feattype === FeatureType.RunwayThreshold || feattype === FeatureType.ParkingStandLocation) {
        const geo = this.oanc.data?.features.filter(
          (f) =>
            f.properties.id === id &&
            (f.properties.feattype === FeatureType.RunwayThreshold ||
              f.properties.feattype === FeatureType.ParkingStandLocation),
        );
        if (geo && geo[0].geometry.type === 'Point') {
          const point = geo[0].geometry as Point;
          addFunction(point.coordinates, geo[0]);
        }
      }
    }
  }

  addCrossAtFeature(id: number, feattype: FeatureType) {
    this.addSymbolAtFeature(id, feattype, this.addCross.bind(this));
  }

  addFlagAtFeature(id: number, feattype: FeatureType) {
    this.addSymbolAtFeature(id, feattype, this.addFlag.bind(this));
  }

  removeSymbolAtFeature(
    id: number,
    feattype: FeatureType,
    symbols: readonly Label[],
    removeFunction: (index: number) => void,
  ) {
    const isTaxiway = symbols.some(
      (v) =>
        v.associatedFeature?.properties.id === id &&
        v.associatedFeature.properties.feattype === FeatureType.TaxiwayGuidanceLine,
    );

    if (isTaxiway) {
      // Find by name
      let taxiwayName = '';
      for (const label of symbols) {
        if (label.associatedFeature?.properties.id === id && label.associatedFeature.properties.feattype === feattype) {
          taxiwayName = label.associatedFeature.properties.idlin ?? '';
          break;
        }
      }

      const idsToDelete = symbols
        .map((label) => (label.associatedFeature?.properties.idlin === taxiwayName ? parseInt(label.text) : null))
        .filter((i) => i !== null);
      idsToDelete.forEach((i) => removeFunction(i));
    } else {
      // Find by ID
      const idsToDelete = symbols
        .map((label) =>
          label.associatedFeature?.properties.id === id && label.associatedFeature.properties.feattype === feattype
            ? parseInt(label.text)
            : null,
        )
        .filter((i) => i !== null);
      idsToDelete.forEach((i) => removeFunction(i));
    }
  }

  removeCrossAtFeature(id: number, feattype: FeatureType) {
    this.removeSymbolAtFeature(id, feattype, this.crosses.getArray(), this.removeCross.bind(this));
  }

  removeFlagAtFeature(id: number, feattype: FeatureType) {
    this.removeSymbolAtFeature(id, feattype, this.flags.getArray(), this.removeFlag.bind(this));
  }

  findSymbolAtCursor(position: Position): { cross: number | null; flag: number | null } {
    const flag = this.flags
      .getArray()
      .find(
        (label) =>
          Math.hypot(position[0] - label.position[0], position[1] - label.position[1]) <
          MAX_SYMBOL_DIST_NEIGHBORHOOD_SEARCH,
      );
    const cross = this.crosses
      .getArray()
      .find(
        (label) =>
          Math.hypot(position[0] - label.position[0], position[1] - label.position[1]) <
          MAX_SYMBOL_DIST_NEIGHBORHOOD_SEARCH,
      );

    return {
      cross: cross !== undefined ? parseInt(cross.text) : null,
      flag: flag !== undefined ? parseInt(flag.text) : null,
    };
  }

  findSymbolAtFeature(id: number, feattype: FeatureType): { hasCross: boolean; hasFlag: boolean } {
    return {
      hasCross: this.crosses
        .getArray()
        .some(
          (label) =>
            label.associatedFeature?.properties.id === id && label.associatedFeature.properties.feattype === feattype,
        ),
      hasFlag: this.flags
        .getArray()
        .some(
          (label) =>
            label.associatedFeature?.properties.id === id && label.associatedFeature.properties.feattype === feattype,
        ),
    };
  }
}
