// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Arinc429LocalVarConsumerSubject, NXLogicConfirmNode, NXLogicPulseNode } from '@flybywiresim/fbw-sdk';
import {
  ConsumerSubject,
  EventBus,
  Instrument,
  MappedSubject,
  SimVarValueType,
  Subscription,
} from '@microsoft/msfs-sdk';
import PitchTrimUtils from '@shared/PitchTrimUtils';
import { PseudoFwcSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/PseudoFwcPublisher';

/**
 * Utility class for auto-setting the THS trim. Will be superseded by the proper PRIM implementation in some point in the future
 */

export class AutoThsTrimmer implements Instrument {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.bus.getSubscriber<PseudoFwcSimvars>();

  constructor(
    private readonly bus: EventBus,
    private readonly instrument: BaseInstrument,
  ) {}

  private readonly leftLgCompressed = ConsumerSubject.create(this.sub.on('left_blg_compressed'), true);
  private readonly rightLgCompressed = ConsumerSubject.create(this.sub.on('left_blg_compressed'), true);
  private readonly onGround = MappedSubject.create(([l, r]) => l || r, this.leftLgCompressed, this.rightLgCompressed);
  private readonly onGroundConfNode = new NXLogicConfirmNode(1);

  private readonly engineState = [
    ConsumerSubject.create(this.sub.on('engine_state_1'), 0),
    ConsumerSubject.create(this.sub.on('engine_state_2'), 0),
    ConsumerSubject.create(this.sub.on('engine_state_3'), 0),
    ConsumerSubject.create(this.sub.on('engine_state_4'), 0),
  ];
  private readonly thrustLever = [
    ConsumerSubject.create(this.sub.on('throttle_position_1'), 0),
    ConsumerSubject.create(this.sub.on('throttle_position_2'), 0),
    ConsumerSubject.create(this.sub.on('throttle_position_3'), 0),
    ConsumerSubject.create(this.sub.on('throttle_position_4'), 0),
  ];
  private readonly greenPressurized = ConsumerSubject.create(this.sub.on('hyd_green_sys_pressurized'), false);
  private readonly yellowPressurized = ConsumerSubject.create(this.sub.on('hyd_yellow_sys_pressurized'), false);

  private readonly oneEngineStartedAndHydPressPulse = new NXLogicPulseNode();

  private readonly fcdcDiscreteWord4 = [
    Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_4_1')),
    Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_4_2')),
  ];

  private readonly groundSpoilersArmedPulse = new NXLogicPulseNode();

  private readonly cas = Arinc429LocalVarConsumerSubject.create(this.sub.on('adr_cas_word_1'));
  private readonly flapsLever = ConsumerSubject.create(this.sub.on('flaps_handle'), 0);
  private previousFlapsLeverPos = 0;

  private readonly flapsSlatsMovedPulse = new NXLogicPulseNode();
  private readonly groundSpoilersDisarmedPulse = new NXLogicPulseNode(false);
  private readonly oneThrustLeverMovedOutOfIdle = new NXLogicPulseNode();

  /** in percent */
  private readonly cgPercent = ConsumerSubject.create(this.sub.on('gw_cg_percent'), 0);
  private readonly targetThsPosition = this.cgPercent.map((cg) => PitchTrimUtils.cgToPitchTrim(cg));
  /** in radians */
  private readonly trimPosition = ConsumerSubject.create(this.sub.on('ths_position'), 0);

  init() {
    this.subscriptions.push(
      this.leftLgCompressed,
      this.rightLgCompressed,
      this.onGround,
      this.greenPressurized,
      this.yellowPressurized,
      this.fcdcDiscreteWord4[0],
      this.fcdcDiscreteWord4[1],
      this.cas,
      this.flapsLever,
      this.cgPercent,
      this.targetThsPosition,
      this.trimPosition,
    );

    for (const s of this.engineState) {
      this.subscriptions.push(s);
    }

    for (const s of this.thrustLever) {
      this.subscriptions.push(s);
    }
  }

  private shouldAutoTrim = false;

  public onUpdate(): void {
    this.onGroundConfNode.write(this.onGround.get(), this.instrument.deltaTime);

    this.oneEngineStartedAndHydPressPulse.write(
      this.engineState.some((es) => es.get() === 1) && (this.greenPressurized.get() || this.yellowPressurized.get()),
      this.instrument.deltaTime,
    );

    const groundSpoilersArmed =
      this.fcdcDiscreteWord4[0].get().bitValueOr(27, false) || this.fcdcDiscreteWord4[1].get().bitValueOr(27, false);
    this.groundSpoilersArmedPulse.write(groundSpoilersArmed, this.instrument.deltaTime);

    this.flapsSlatsMovedPulse.write(this.previousFlapsLeverPos !== this.flapsLever.get(), this.instrument.deltaTime);
    this.previousFlapsLeverPos = this.flapsLever.get();
    this.groundSpoilersDisarmedPulse.write(groundSpoilersArmed, this.instrument.deltaTime);
    this.oneThrustLeverMovedOutOfIdle.write(
      this.thrustLever.some((tl) => tl.get() > 20),
      this.instrument.deltaTime,
    );

    const startupCondition =
      (this.onGround.get() && this.oneEngineStartedAndHydPressPulse.read()) || this.groundSpoilersArmedPulse.read();
    const touchAndGoCondition =
      this.onGroundConfNode.read() &&
      this.cas.get().valueOr(0) > 80 &&
      (this.flapsSlatsMovedPulse.read() ||
        this.groundSpoilersDisarmedPulse.read() ||
        this.oneThrustLeverMovedOutOfIdle.read());

    if (startupCondition || touchAndGoCondition) {
      this.shouldAutoTrim = true;
    }

    if (!this.onGround.get()) {
      this.shouldAutoTrim = false;
    }
  }

  /** This needs to be called with a high frequency (at least the FBW CPP code frequency) to ensure adequate trimming rates */
  public autoTrim() {
    if (this.shouldAutoTrim) {
      const trimPositionDeg = SimVar.GetSimVarValue('ELEVATOR TRIM POSITION', SimVarValueType.Degree);
      const thsTrimDiff = this.targetThsPosition.get() - trimPositionDeg;

      // Difference by 0.008° guarantees accuracy within 0.05% CG, but we have to account for some lag of the THS actuation, so stop early
      if (Math.abs(thsTrimDiff) < 0.02) {
        this.shouldAutoTrim = false;
      } else {
        if (thsTrimDiff > 0) {
          SimVar.SetSimVarValue('K:ELEV_TRIM_UP', SimVarValueType.Number, 1);
        } else {
          SimVar.SetSimVarValue('K:ELEV_TRIM_DN', SimVarValueType.Number, 1);
        }
      }
    }
  }

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }
  }
}
