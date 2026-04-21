//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './style.scss';
import { OitDisplayUnit, OitDisplayUnitID } from './OitDisplayUnit';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { OisLaptop } from './OisLaptop';
import { OitFltOpsContainer } from './OitFltOpsContainer';
import { OitUiService } from './OitUiService';
import { OitAvncsContainer } from './OitAvncsContainer';
import { OitSimvars } from './OitSimvarPublisher';
import { AnsuOps } from './System/AnsuOps';

export interface AbstractOitFltOpsPageProps extends ComponentProps {
  bus: EventBus;
  uiService: OitUiService;
  container: OitFltOpsContainer;
}

export interface AbstractOitAvncsPageProps extends ComponentProps {
  bus: EventBus;
  uiService: OitUiService;
  container: OitAvncsContainer;
}

export type OisDomain = 'nss-avncs' | 'flt-ops';

export interface OitProps {
  readonly bus: EventBus;
  readonly instrument: BaseInstrument;
  readonly captOrFo: 'CAPT' | 'FO';
  readonly failuresConsumer: FailuresConsumer;
  readonly laptop: OisLaptop;
  readonly avncsAnsu: AnsuOps;
}

export class OIT extends DisplayComponent<OitProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getSubscriber<OitSimvars>();

  /** True: NSS AVNCS, False: FLT OPS */
  private readonly oisDomainSwitch = ConsumerSubject.create(
    this.sub.on(this.props.captOrFo === 'CAPT' ? 'oisDomainSwitchCapt' : 'oisDomainSwitchFo'),
    false,
  );

  public readonly avncsOrFltOps: MappedSubscribable<OisDomain> = this.oisDomainSwitch.map((domainSwitch) =>
    domainSwitch ? 'nss-avncs' : 'flt-ops',
  );

  private readonly displayUnitRef = FSComponent.createRef<OitDisplayUnit>();

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.oisDomainSwitch, this.avncsOrFltOps);
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode | null {
    return (
      <OitDisplayUnit
        ref={this.displayUnitRef}
        bus={this.props.bus}
        displayUnitId={this.props.captOrFo === 'CAPT' ? OitDisplayUnitID.CaptOit : OitDisplayUnitID.FoOit}
        failuresConsumer={this.props.failuresConsumer}
        avncsOrFltOps={this.avncsOrFltOps}
      >
        <OitFltOpsContainer
          bus={this.props.bus}
          laptop={this.props.laptop}
          displayUnitRef={this.displayUnitRef}
          captOrFo={this.props.captOrFo}
          avncsOrFltOps={this.avncsOrFltOps}
        />
        <OitAvncsContainer
          bus={this.props.bus}
          ansu={this.props.avncsAnsu}
          displayUnitRef={this.displayUnitRef}
          captOrFo={this.props.captOrFo}
          avncsOrFltOps={this.avncsOrFltOps}
        />
      </OitDisplayUnit>
    );
  }
}
