import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { NavAidMode } from '@flybywiresim/fbw-sdk';
import { FcuSimvars } from '../Publishers/FcuSimvarPublisher';

interface NdDataDisplayProps {
  readonly bus: EventBus;
  readonly index: number;
}

export class NdDataDisplay extends DisplayComponent<NdDataDisplayProps> {
  private static readonly TEST_IMAGE: string = '/Images/fbw-a380x/fcu/TEST.png';

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

  private readonly sub = this.props.bus.getSubscriber<FcuSimvars>();

  private readonly navaidMode1 = ConsumerSubject.create(
    this.sub.on(this.props.index === 1 ? 'eisDisplayRightNavaid1Mode' : 'eisDisplayLeftNavaid1Mode'),
    NavAidMode.Off,
  );
  private readonly navaidMode2 = ConsumerSubject.create(
    this.sub.on(this.props.index === 1 ? 'eisDisplayRightNavaid2Mode' : 'eisDisplayLeftNavaid2Mode'),
    NavAidMode.Off,
  );

  private readonly isLightTestActive = ConsumerSubject.create(this.sub.on('lightsTest'), false);

  private readonly navaidImage1 = this.navaidMode1.map((mode) => NdDataDisplay.NAVAID_1_IMAGES[mode as NavAidMode]);

  private readonly navaidImage2 = this.navaidMode2.map((mode) => NdDataDisplay.NAVAID_2_IMAGES[mode as NavAidMode]);

  render(): VNode | null {
    return (
      <div
        class={{
          NdData: true,
          [`${this.props.index === 1 ? 'Right' : 'Left'}Side`]: true,
        }}
      >
        <div class="TopRow">
          <img
            style="position: absolute; top: 0; left: 0"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/CSTR.png"
          />
          <img
            style="position: absolute; top: 0; left: 445px"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/WPT.png"
          />
          <img
            style="position: absolute; top: 0; left: 920px"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/VORD.png"
          />
          <img
            style="position: absolute; top: 0; left: 1395px"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/NDB.png"
          />
          <img
            style="position: absolute; top: 0; left: 1870px"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/ARPT.png"
          />

          {/* LIGHT TESTS */}
          <img
            style="position: absolute; top: 0; left: 0"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 445px"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 920px"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 1395px"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 1870px"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
        </div>

        <div class="BottomRow">
          <img
            style="position: absolute; top: 0; left: 0"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src={this.navaidImage1}
          />
          <img
            style="position: absolute; top: 0; left: 445px"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/WX.png"
          />
          <img
            style="position: absolute; top: 0; left: 920px"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/TERR.png"
          />
          <img
            style="position: absolute; top: 0; left: 1395px"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src="/Images/fbw-a380x/fcu/TRAF.png"
          />
          <img
            style="position: absolute; top: 0; left: 1870px"
            width="310px"
            class={{ hidden: this.isLightTestActive }}
            src={this.navaidImage2}
          />

          {/* LIGHT TESTS */}
          <img
            style="position: absolute; top: 0; left: 0"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 445px"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 920px"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 1395px"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
          <img
            style="position: absolute; top: 0; left: 1870px"
            width="310px"
            class={{ hidden: this.isLightTestActive.map(SubscribableMapFunctions.not()) }}
            src="/Images/fbw-a380x/fcu/TEST.png"
          />
        </div>
      </div>
    );
  }
}
