//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NavAidMode } from '@flybywiresim/fbw-sdk';
import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  VNode,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { FcuEvents } from 'instruments/src/FCU/Publishers/FcuPublisher';
import { OverheadEvents } from '../../MsfsAvionicsCommon/providers/OverheadPublisher';

export interface NdDataProps {
  readonly bus: EventBus;
  readonly index: 1 | 2;
}

export class NdData extends DisplayComponent<NdDataProps> {
  private static readonly NAVAID_1_IMAGES: Record<NavAidMode, string> = {
    [NavAidMode.Off]: '/Images/fbw-a380x/fcu/POINTER1.png',
    [NavAidMode.VOR]: '/Images/fbw-a380x/fcu/VOR1.png',
    [NavAidMode.ADF]: '/Images/fbw-a380x/fcu/ADF1.png',
  };
  private static readonly NAVAID_2_IMAGES: Record<NavAidMode, string> = {
    [NavAidMode.Off]: '/Images/fbw-a380x/fcu/POINTER2.png',
    [NavAidMode.VOR]: '/Images/fbw-a380x/fcu/VOR2.png',
    [NavAidMode.ADF]: '/Images/fbw-a380x/fcu/ADF2.png',
  };

  private readonly sub = this.props.bus.getSubscriber<FcuEvents & OverheadEvents>();

  private readonly navaidMode1 = ConsumerSubject.create(
    this.sub.on(this.props.index === 2 ? 'fcu_right_navaid_mode_1' : 'fcu_left_navaid_mode_1'),
    NavAidMode.Off,
  );
  private readonly navaidMode2 = ConsumerSubject.create(
    this.sub.on(this.props.index === 2 ? 'fcu_right_navaid_mode_2' : 'fcu_left_navaid_mode_2'),
    NavAidMode.Off,
  );

  private readonly isLightTestActive = ConsumerSubject.create(this.sub.on('ovhd_ann_lt_test_active'), false);

  render(): VNode | null {
    return (
      <div
        class={{
          NdData: true,
          [`${this.props.index === 2 ? 'Right' : 'Left'}Side`]: true,
        }}
      >
        <div class="TopRow">
          <img
            style="position: absolute; top: 0; left: 0"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/CSTR.png"
          />
          <img
            style="position: absolute; top: 0; left: 890px"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/WPT.png"
          />
          <img
            style="position: absolute; top: 0; left: 1840px"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/VORD.png"
          />
          <img
            style="position: absolute; top: 0; left: 2790px"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/NDB.png"
          />
          <img
            style="position: absolute; top: 0; left: 3740px"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/ARPT.png"
          />
          {/* LIGHT TESTS */}
          <img
            style="position: absolute; top: 0; left: 0"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 890px"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 1840px"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 2790px"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 3740px"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
        </div>

        <div class="BottomRow">
          <img
            style="position: absolute; top: 0; left: 0"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src={this.navaidMode1.map((v) => NdData.NAVAID_1_IMAGES[v])}
          />
          <img
            style="position: absolute; top: 0; left: 890px"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/WX.png"
          />
          <img
            style="position: absolute; top: 0; left: 1840px"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/TERR.png"
          />
          <img
            style="position: absolute; top: 0; left: 2790px"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/TRAF.png"
          />
          <img
            style="position: absolute; top: 0; left: 3740px"
            width="620px"
            class={{ hidden: this.isLightTestActive }}
            src={this.navaidMode2.map((v) => NdData.NAVAID_2_IMAGES[v])}
          />
          {/* LIGHT TESTS */}
          <img
            style="position: absolute; top: 0; left: 0"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 890px"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 1840px"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 2790px"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 3740px"
            width="620px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
        </div>
      </div>
    );
  }
}
