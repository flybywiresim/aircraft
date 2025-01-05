//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { CpdlcMessage } from '../messages/CpdlcMessage';
import { Clock, Waypoint } from '../types';

export enum UplinkMonitorType {
  Unknown = -1,
  Time = 0,
  Altitude = 1,
  Position = 2,
}

export abstract class UplinkMonitor {
  private static positionMonitoringMessageIds = [
    'UM22',
    'UM25',
    'UM65',
    'UM77',
    'UM83',
    'UM84',
    'UM97',
    'UM118',
    'UM121',
    'UM130',
  ];

  private static timeMonitoringMessageIds = ['UM21', 'UM24', 'UM66', 'UM76', 'UM119', 'UM122', 'UM184'];

  private static levelMonitoringMessageIds = ['UM78', 'UM128', 'UM129', 'UM130', 'UM175', 'UM180'];

  public type: UplinkMonitorType;

  public messageId = -1;

  constructor(message: CpdlcMessage) {
    this.messageId = message.UniqueMessageID;
  }

  public static relevantMessage(message: CpdlcMessage): boolean {
    if (
      UplinkMonitor.positionMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) === -1 &&
      UplinkMonitor.timeMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) === -1 &&
      UplinkMonitor.levelMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) === -1
    ) {
      return false;
    }

    return true;
  }

  public static createMessageMonitor(message: CpdlcMessage): UplinkMonitor {
    if (UplinkMonitor.positionMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) !== -1) {
      return new PositionMonitor(message);
    }
    if (UplinkMonitor.timeMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) !== -1) {
      return new TimeMonitor(message);
    }
    if (UplinkMonitor.levelMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) !== -1) {
      return new LevelMonitor(message);
    }

    return null;
  }

  abstract conditionsMet(condition: Waypoint | Clock | number): boolean;
}

class PositionMonitor extends UplinkMonitor {
  private positionMonitor = '';

  constructor(message: CpdlcMessage) {
    super(message);
    this.type = UplinkMonitorType.Position;
    this.positionMonitor = message.Content[0]?.Content[0]?.Value;
  }

  public conditionsMet(condition: Waypoint | Clock | number): boolean {
    if (typeof condition !== 'number' && 'ident' in condition) {
      const lastPosition = condition.ident;
      return this.positionMonitor === lastPosition;
    }

    return false;
  }
}

class TimeMonitor extends UplinkMonitor {
  private static deferredMessageIDs = ['UM66', 'UM69', 'UM119', 'UM122'];

  private timeOffset = 0;

  private timeMonitor = -1;

  private static extractSeconds(value: string): number {
    const matches = value.match(/[0-9]{2}/g);
    const hours = parseInt(matches[0]);
    const minutes = parseInt(matches[1]);
    return (hours * 60 + minutes) * 60;
  }

  constructor(message: CpdlcMessage) {
    super(message);
    this.type = UplinkMonitorType.Time;

    if (TimeMonitor.deferredMessageIDs.findIndex((id) => id === message.Content[0]?.TypeId) !== -1) {
      this.timeOffset = 30;
    }
    this.timeMonitor = TimeMonitor.extractSeconds(message.Content[0]?.Content[0]?.Value);
  }

  public conditionsMet(condition: Waypoint | Clock | number): boolean {
    if (condition instanceof Clock) {
      if (condition.secondsOfDay + this.timeOffset >= this.timeMonitor) {
        // avoid errors due to day change (2359 to 0001)
        return condition.secondsOfDay - this.timeMonitor < 30;
      }
    }

    return false;
  }
}

class LevelMonitor extends UplinkMonitor {
  private lowerLevel = -1;

  private upperLevel = -1;

  private reachingLevel = false;

  private leavingLevel = false;

  private reachedLevel = false;

  private static extractAltitude(value: string): number {
    let altitude = parseInt(value.match(/[0-9]+/)[0]);
    if (value.startsWith('FL')) {
      altitude *= 100;
    } else if (value.endsWith('M')) {
      altitude *= 3.28084;
    }
    return altitude;
  }

  constructor(message: CpdlcMessage) {
    super(message);
    this.type = UplinkMonitorType.Altitude;

    this.lowerLevel = LevelMonitor.extractAltitude(message.Content[0]?.Content[0]?.Value);
    if (message.Content[0]?.TypeId === 'UM180') {
      this.upperLevel = LevelMonitor.extractAltitude(message.Content[0]?.Content[1].Value);
      this.reachingLevel = true;
    } else if (
      message.Content[0]?.TypeId === 'UM78' ||
      message.Content[0]?.TypeId === 'UM129' ||
      message.Content[0]?.TypeId === 'UM175'
    ) {
      this.reachingLevel = true;
    } else if (message.Content[0]?.TypeId === 'UM128') {
      this.reachingLevel = false;
    } else if (message.Content[0]?.TypeId === 'UM130') {
      this.reachingLevel = true;
      this.leavingLevel = true;
    }
  }

  public conditionsMet(condition: Waypoint | Clock | number): boolean {
    if (typeof condition === 'number') {
      if (this.reachingLevel && this.leavingLevel) {
        if (!this.reachedLevel) {
          this.reachedLevel = Math.abs(condition - this.lowerLevel) <= 100;
        } else {
          return Math.abs(condition - this.lowerLevel) > 100;
        }
      }
      if (!this.reachingLevel) {
        return Math.abs(condition - this.lowerLevel) > 100;
      }
      if (this.upperLevel > -1) {
        return this.lowerLevel <= condition && this.upperLevel >= condition;
      }

      return Math.abs(condition - this.lowerLevel) <= 100;
    }

    return false;
  }
}
