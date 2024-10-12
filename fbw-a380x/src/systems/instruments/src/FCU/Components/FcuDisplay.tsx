//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, EventBus, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { Altitude } from './Altitude';
import { Baro } from './Baro';
import { Heading } from './Heading';
import { Speed } from './Speed';
import { VerticalSpeed } from './VerticalSpeed';
import { NdData } from 'instruments/src/FCU/Components/NdData';

export interface FcuDisplayProps {
  readonly bus: EventBus;
  readonly isHidden: Subscribable<boolean>;
}

export class FcuDisplay extends DisplayComponent<FcuDisplayProps> {
  render(): VNode | null {
    return (
      <>
        <div id="Mainframe">
          <div id="Electricity" state={this.props.isHidden.map((v) => (v ? 'off' : 'on'))}>
            <div id="LargeScreen">
              <Speed />
              <Heading />

              <div id="AltVS">
                <Altitude bus={this.props.bus} />
                <VerticalSpeed />
              </div>
            </div>

            <Baro bus={this.props.bus} />
            {/* FIXME need a second baro for FO side */}

            <NdData bus={this.props.bus} index={1} />
            <NdData bus={this.props.bus} index={2} />
          </div>
        </div>
      </>
    );
  }
}
