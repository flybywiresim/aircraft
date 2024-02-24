//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageComStatus, CpdlcMessage, UplinkMonitor } from '../../../common/src';
import { Atc } from '../ATC';

export class UplinkMessageMonitoring {
  private monitoredMessages: UplinkMonitor[] = [];

  constructor(private readonly atc: Atc) {}

  public monitorMessage(message: CpdlcMessage): boolean {
    if (UplinkMonitor.relevantMessage(message)) {
      this.monitoredMessages.push(UplinkMonitor.createMessageMonitor(message));
      this.atc.digitalOutputs.sendMonitoredMessages(this.atc.monitoredMessages());
      return true;
    }
    return false;
  }

  public removeMessage(uid: number): void {
    const idx = this.monitoredMessages.findIndex((message) => message.messageId === uid);
    if (idx > -1) {
      this.monitoredMessages.splice(idx, 1);
      this.atc.digitalOutputs.sendMonitoredMessages(this.atc.monitoredMessages());
    }
  }

  public monitoredMessageIds(): number[] {
    const ids = [];
    this.monitoredMessages.forEach((monitor) => ids.push(monitor.messageId));
    return ids;
  }

  private findAtcMessage(uid: number): CpdlcMessage | undefined {
    for (const message of this.atc.messages()) {
      if (message.UniqueMessageID === uid) {
        return message as CpdlcMessage;
      }
    }
    return undefined;
  }

  public checkMessageConditions(): number[] {
    const ids = [];

    const currentTime = this.atc.digitalInputs.UtcClock;
    const currentAltitude = this.atc.digitalInputs.PresentPosition.altitude.value;
    const currentWaypoint = this.atc.digitalInputs.FlightRoute.lastWaypoint;

    let idx = this.monitoredMessages.length - 1;
    while (idx >= 0) {
      const monitorInstance = this.monitoredMessages[idx];
      let conditionMet = monitorInstance.conditionsMet(currentTime);
      conditionMet ||= monitorInstance.conditionsMet(currentAltitude);
      conditionMet ||= monitorInstance.conditionsMet(currentWaypoint);

      if (conditionMet) {
        const message = this.findAtcMessage(this.monitoredMessages[idx].messageId);
        if (message !== undefined && message.Response?.ComStatus === AtsuMessageComStatus.Sent) {
          ids.push(this.monitoredMessages[idx].messageId);
          this.monitoredMessages.splice(idx, 1);
        }
      }
      idx -= 1;
    }

    return ids;
  }
}
