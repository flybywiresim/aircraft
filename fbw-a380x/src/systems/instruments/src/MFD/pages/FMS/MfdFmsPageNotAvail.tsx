import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './F-PLN/MfdFmsFpln.scss';
import { FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { MfdSystem } from 'instruments/src/MFD/pages/common/MfdUiService';

interface MfdFmsPageNotAvailProps {
  bus: EventBus;
  fmcService: FmcServiceInterface;
  captOrFo: 'CAPT' | 'FO';
  requestedSystem: Subscribable<MfdSystem>;
}

export class MfdFmsPageNotAvail extends DisplayComponent<MfdFmsPageNotAvailProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private readonly fmsFailed = ConsumerSubject.create(
    this.props.bus.getSubscriber<MfdSimvars>().on(this.props.captOrFo === 'FO' ? 'fmsFoFailed' : 'fmsCaptFailed'),
    false,
  );

  private readonly warningDisplay = MappedSubject.create(
    ([failed, sys]) => (failed && sys === MfdSystem.Fms ? 'inherit' : 'none'),
    this.fmsFailed,
    this.props.requestedSystem,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="mfd-fms-fpln-dialog-outer" style={{ display: this.warningDisplay }}>
        <div class="mfd-fms-fpln-dialog-inner" style="top: 34px; height: 818px;">
          {/* begin page content */}
          <div class="mfd-page-container">
            <div class="mfd-amber-error-message">FMS PAGE NOT AVAIL</div>
          </div>
          {/* end page content */}
        </div>
      </div>
    );
  }
}
