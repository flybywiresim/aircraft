//  Copyright (c) 2025-2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  MappedSubscribable,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './style.scss';
import { OitDisplayUnit, OitDisplayUnitID } from './OitDisplayUnit';
import { FailuresConsumer, NXDataStore } from '@flybywiresim/fbw-sdk';
import { OnScreenKeyboard, OSK_OIT_LAYOUT } from '@flybywiresim/msfs-avionics-common';
import { OisLaptop } from './OisLaptop';
import { OitFltOpsContainer } from './OitFltOpsContainer';
import { OitUiService } from './OitUiService';
import { OitAvncsContainer } from './OitAvncsContainer';
import { InternalKbdKeyEvent, OitSimvars } from './OitSimvarPublisher';
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

  private readonly oskRef = FSComponent.createRef<OnScreenKeyboard>();

  private readonly oskTarget = Subject.create<HTMLElement | null>(null);

  private readonly autoOsk = Subject.create(false);

  private readonly oskField = MappedSubject.create(
    ([target, autoOsk]) => (autoOsk ? target : null),
    this.oskTarget,
    this.autoOsk,
  );

  private readonly oskVisible = this.oskField.map((field) => field !== null);

  private readonly contentTransform = Subject.create('');

  private readonly kbdKeyPublisher = this.props.bus.getPublisher<InternalKbdKeyEvent>();

  private readonly kbdSide = this.props.captOrFo === 'CAPT' ? 'L' : 'R';

  private cancelAutoOskSub: (() => void) | undefined;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.oisDomainSwitch,
      this.avncsOrFltOps,
      this.oskField,
      this.oskVisible,
      this.oskField.sub((field) => {
        // Measured unshifted, as moving between fields with the keyboard up would otherwise include the old shift
        this.contentTransform.set('');
        const offset = field ? this.oskRef.instance.coveredHeight(field) : 0;
        this.contentTransform.set(offset > 0 ? `translateY(-${offset}px)` : '');
      }),
    );

    this.cancelAutoOskSub = NXDataStore.getAndSubscribeLegacy(
      'EFB_AUTO_OSK',
      (_, value) => this.autoOsk.set(value === '1'),
      '0',
    );
  }

  // Treat dismiss as Enter so the typed value is kept (ESC would discard)
  private readonly onOskKey = (key: string) =>
    this.kbdKeyPublisher.pub('kbdKeyEvent', [this.kbdSide, key === 'DISMISS' ? 'ENT' : key]);

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }
    this.cancelAutoOskSub?.();

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
        <div style={{ transform: this.contentTransform }}>
          <OitFltOpsContainer
            bus={this.props.bus}
            laptop={this.props.laptop}
            displayUnitRef={this.displayUnitRef}
            captOrFo={this.props.captOrFo}
            avncsOrFltOps={this.avncsOrFltOps}
            oskTarget={this.oskTarget}
          />
          <OitAvncsContainer
            bus={this.props.bus}
            ansu={this.props.avncsAnsu}
            displayUnitRef={this.displayUnitRef}
            captOrFo={this.props.captOrFo}
            avncsOrFltOps={this.avncsOrFltOps}
          />
        </div>
        <OnScreenKeyboard ref={this.oskRef} layout={OSK_OIT_LAYOUT} visible={this.oskVisible} onKey={this.onOskKey} />
      </OitDisplayUnit>
    );
  }
}
