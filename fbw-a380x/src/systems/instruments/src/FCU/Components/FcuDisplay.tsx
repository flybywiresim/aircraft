//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, EventBus, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { Altitude } from './Altitude';
import { Baro } from './Baro';
import { Heading } from './Heading';
import { Speed } from './Speed';
import { VerticalSpeed } from './VerticalSpeed';

export interface FcuDisplayProps {
  readonly bus: EventBus;
  readonly isHidden: Subscribable<boolean>;
}

export class FcuDisplay extends DisplayComponent<FcuDisplayProps> {
  render(): VNode | null {
    return <>
      <div id="Mainframe">
        <div id="Electricity" state={this.props.isHidden.map((v) => v ? 'off' : 'on')}>
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

          <img style="position: absolute; top: 1750px; left: 240px" width="620px" src="/Images/fbw-a380x/fcu/CSTR.png" />
          <img style="position: absolute; top: 1750px; left: 1130px" width="620px" src="/Images/fbw-a380x/fcu/WPT.png" />
          <img style="position: absolute; top: 1750px; left: 2080px" width="620px" src="/Images/fbw-a380x/fcu/VORD.png" />
          <img style="position: absolute; top: 1750px; left: 3030px" width="620px" src="/Images/fbw-a380x/fcu/NDB.png" />
          <img style="position: absolute; top: 1750px; left: 3980px" width="620px" src="/Images/fbw-a380x/fcu/ARPT.png" />

          <img style="position: absolute; top: 2300px; left: 240px" width="620px" src="/Images/fbw-a380x/fcu/POINTER1.png" />
          <img style="position: absolute; top: 2300px; left: 1130px" width="620px" src="/Images/fbw-a380x/fcu/WX.png" />
          <img style="position: absolute; top: 2300px; left: 2080px" width="620px" src="/Images/fbw-a380x/fcu/TERR.png" />
          <img style="position: absolute; top: 2300px; left: 3030px" width="620px" src="/Images/fbw-a380x/fcu/TRAF.png" />
          <img style="position: absolute; top: 2300px; left: 3980px" width="620px" src="/Images/fbw-a380x/fcu/POINTER2.png" />

          <img style="position: absolute; top: 2900px; left: 300px" width="620px" src="/Images/fbw-a380x/fcu/CSTR.png" />
          <img style="position: absolute; top: 2900px; left: 1190px" width="620px" src="/Images/fbw-a380x/fcu/WPT.png" />
          <img style="position: absolute; top: 2900px; left: 2140px" width="620px" src="/Images/fbw-a380x/fcu/VORD.png" />
          <img style="position: absolute; top: 2900px; left: 3090px" width="620px" src="/Images/fbw-a380x/fcu/NDB.png" />
          <img style="position: absolute; top: 2900px; left: 4040px" width="620px" src="/Images/fbw-a380x/fcu/ARPT.png" />

          <img style="position: absolute; top: 3450px; left: 300px" width="620px" src="/Images/fbw-a380x/fcu/POINTER1.png" />
          <img style="position: absolute; top: 3450px; left: 1190px" width="620px" src="/Images/fbw-a380x/fcu/WX.png" />
          <img style="position: absolute; top: 3450px; left: 2140px" width="620px" src="/Images/fbw-a380x/fcu/TERR.png" />
          <img style="position: absolute; top: 3450px; left: 3090px" width="620px" src="/Images/fbw-a380x/fcu/TRAF.png" />
          <img style="position: absolute; top: 3450px; left: 4040px" width="620px" src="/Images/fbw-a380x/fcu/POINTER2.png" />
        </div>
      </div>
    </>;
  }
}
