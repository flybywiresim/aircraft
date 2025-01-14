// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ArraySubject, SubscribableArrayEventType } from '@microsoft/msfs-sdk';
import { Position } from '@turf/turf';
import { Label, LabelStyle, Oanc } from 'instruments/src/OANC';
import { OancLabelManager } from 'instruments/src/OANC/OancLabelManager';

const MAX_SYMBOL_DIST_NEIGHBORHOOD_SEARCH = 20;
export class OancMarkerManager<T extends number> {
  constructor(
    public oanc: Oanc<T>,
    private readonly labelManager: OancLabelManager<T>,
  ) {
    this.crosses.sub((index, type, item, _array) => {
      if (type === SubscribableArrayEventType.Added) {
        if (item && !Array.isArray(item[0])) {
          const crossSymbolLabel: Label = {
            text: index.toString(),
            style: LabelStyle.CrossSymbol,
            position: item as Position,
            rotation: 0,
            associatedFeature: undefined,
          };
          this.labelManager.visibleLabels.insert(crossSymbolLabel);
          this.labelManager.labels.push(crossSymbolLabel);
        } else {
          (item as readonly Position[]).forEach((pos) => {
            const crossSymbolLabel: Label = {
              text: index.toString(),
              style: LabelStyle.CrossSymbol,
              position: pos,
              rotation: 0,
              associatedFeature: undefined,
            };
            this.labelManager.visibleLabels.insert(crossSymbolLabel);
            this.labelManager.labels.push(crossSymbolLabel);
          });
        }
      } else if (type === SubscribableArrayEventType.Removed) {
        if (item && !Array.isArray(item[0])) {
          this.labelManager.visibleLabels.removeAt(
            this.labelManager.visibleLabels
              .getArray()
              .findIndex((it) => it.text === index.toString() && it.style === LabelStyle.CrossSymbol),
          );
          this.labelManager.labels = this.labelManager.labels.filter(
            (it) => !(it.text === index.toString() && it.style === LabelStyle.CrossSymbol),
          );
        }
      } else if (type === SubscribableArrayEventType.Cleared) {
        while (
          this.labelManager.visibleLabels.getArray().findIndex((it) => it.style === LabelStyle.CrossSymbol) !== -1
        ) {
          this.labelManager.visibleLabels.removeAt(
            this.labelManager.visibleLabels.getArray().findIndex((it) => it.style === LabelStyle.CrossSymbol),
          );
        }
        this.labelManager.labels = this.labelManager.labels.filter((it) => !(it.style === LabelStyle.CrossSymbol));
      }
    });

    this.flags.sub((index, type, item, _array) => {
      if (type === SubscribableArrayEventType.Added) {
        if (item && !Array.isArray(item[0])) {
          const flagSymbolLabel: Label = {
            text: index.toString(),
            style: LabelStyle.FlagSymbol,
            position: item as Position,
            rotation: 0,
            associatedFeature: undefined,
          };
          this.labelManager.visibleLabels.insert(flagSymbolLabel);
          this.labelManager.labels.push(flagSymbolLabel);
        } else {
          (item as readonly Position[]).forEach((pos) => {
            const flagSymbolLabel: Label = {
              text: index.toString(),
              style: LabelStyle.FlagSymbol,
              position: pos,
              rotation: 0,
              associatedFeature: undefined,
            };
            this.labelManager.visibleLabels.insert(flagSymbolLabel);
            this.labelManager.labels.push(flagSymbolLabel);
          });
        }
      } else if (type === SubscribableArrayEventType.Removed) {
        if (item && !Array.isArray(item[0])) {
          this.labelManager.visibleLabels.removeAt(
            this.labelManager.visibleLabels
              .getArray()
              .findIndex((it) => it.text === index.toString() && it.style === LabelStyle.FlagSymbol),
          );
          this.labelManager.labels = this.labelManager.labels.filter(
            (it) => !(it.text === index.toString() && it.style === LabelStyle.FlagSymbol),
          );
        }
      } else if (type === SubscribableArrayEventType.Cleared) {
        while (
          this.labelManager.visibleLabels.getArray().findIndex((it) => it.style === LabelStyle.FlagSymbol) !== -1
        ) {
          this.labelManager.visibleLabels.removeAt(
            this.labelManager.visibleLabels.getArray().findIndex((it) => it.style === LabelStyle.FlagSymbol),
          );
        }
        this.labelManager.labels = this.labelManager.labels.filter((it) => !(it.style === LabelStyle.FlagSymbol));
      }
    });
  }

  private crosses = ArraySubject.create<Position>();

  private flags = ArraySubject.create<Position>();

  addCross(coords: Position) {
    this.crosses.insert(coords);
  }

  addFlag(coords: Position) {
    this.flags.insert(coords);
  }

  removeCross(index: number) {
    this.crosses.removeAt(index);
  }

  removeFlag(index: number) {
    this.flags.removeAt(index);
  }

  eraseAllCrosses() {
    this.crosses.clear();
  }

  eraseAllFlags() {
    this.flags.clear();
  }

  findSymbolAtCursor(position: Position): { cross: number | null; flag: number | null } {
    const flagIndex = this.flags
      .getArray()
      .findIndex((pos) => Math.hypot(position[0] - pos[0], position[1] - pos[1]) < MAX_SYMBOL_DIST_NEIGHBORHOOD_SEARCH);
    const crossIndex = this.crosses
      .getArray()
      .findIndex((pos) => Math.hypot(position[0] - pos[0], position[1] - pos[1]) < MAX_SYMBOL_DIST_NEIGHBORHOOD_SEARCH);

    return {
      cross: crossIndex === -1 ? null : crossIndex,
      flag: flagIndex === -1 ? null : flagIndex,
    };
  }
}
