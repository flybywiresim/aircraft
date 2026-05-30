import { EngineEvents, EngineState } from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, MappedSubject, Subject } from '@microsoft/msfs-sdk';

import { FmgcFlightPhase } from '../../../shared/src/flightphase';
import { EngineOutControlEvents, EngineOutEvents, EngineOutTargetPage } from '../events/EngineOutEvents';
import { FlightPhaseManagerEvents } from '../flightphase';
import { Fms } from '../Fms';
import { FmsModule } from './FmsModule';

export class EngineOutMonitor extends FmsModule {
  private readonly publisher = this.bus.getPublisher<EngineOutEvents>();

  private readonly sub = this.bus.getSubscriber<FlightPhaseManagerEvents & EngineEvents & EngineOutControlEvents>();

  private readonly flightPhase = ConsumerSubject.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly engine1FadecHealthy = ConsumerSubject.create(this.sub.on('fbw_engine_fadec_powered_1'), true);
  private readonly engine2FadecHealthy = ConsumerSubject.create(this.sub.on('fbw_engine_fadec_powered_2'), true);

  private readonly engine1Master = ConsumerSubject.create(this.sub.on('fbw_engine_master_1'), true);
  private readonly engine2Master = ConsumerSubject.create(this.sub.on('fbw_engine_master_2'), true);

  private readonly engine1State = ConsumerSubject.create(this.sub.on('fbw_engine_state_1'), EngineState.On);
  private readonly engine2State = ConsumerSubject.create(this.sub.on('fbw_engine_state_2'), EngineState.On);

  private readonly engine1Tla = ConsumerSubject.create(this.sub.on('fbw_engine_thrust_lever_angle_1'), 0);
  private readonly engine2Tla = ConsumerSubject.create(this.sub.on('fbw_engine_thrust_lever_angle_2'), 0);

  private engineOutActivationTime = 0;
  private isAutoExitInhibited = false;

  private readonly areBothEnginesOn = MappedSubject.create(
    ([fadec1Healthy, fadec2Healthy, engine1State, engine2State, tla1, tla2, master1, master2], wasEngineOut) => {
      if (wasEngineOut) {
        return (
          !this.isAutoExitInhibited &&
          fadec1Healthy &&
          fadec2Healthy &&
          master1 &&
          master2 &&
          engine1State === EngineState.On &&
          engine2State === EngineState.On &&
          tla1 >= 5 &&
          tla2 >= 5
        );
      } else {
        if (!master1 || !master2) {
          return false;
        }
        if (tla1 <= 5 && tla2 >= 22) {
          return false;
        }
        if (tla2 <= 5 && tla1 >= 22) {
          return false;
        }
        return fadec1Healthy && fadec2Healthy && engine1State === EngineState.On && engine2State === EngineState.On;
      }
    },
    this.engine1FadecHealthy,
    this.engine2FadecHealthy,
    this.engine1State,
    this.engine2State,
    this.engine1Tla,
    this.engine2Tla,
    this.engine1Master,
    this.engine2Master,
  );

  private readonly engineOutCondition = Subject.create(false);

  private fms?: Fms;

  /** @inheritdoc */
  public init(fms: Fms): void {
    this.fms = fms;

    this.engineOutCondition.sub((v) => this.publisher.pub('fms_engine_out_active', v, false, true), true);
    this.engineOutCondition.sub((v) => v && this.onEngineOut());

    this.areBothEnginesOn.sub((v) => {
      if (v) {
        this.engineOutActivationTime = 0;
        this.engineOutCondition.set(false);
      } else {
        switch (this.flightPhase.get()) {
          case FmgcFlightPhase.Approach:
          case FmgcFlightPhase.Climb:
          case FmgcFlightPhase.Cruise:
          case FmgcFlightPhase.Descent:
          case FmgcFlightPhase.GoAround:
          case FmgcFlightPhase.Takeoff:
            this.engineOutActivationTime = this.fms?.simDuration ?? 0;
            return this.engineOutCondition.set(true);
          default:
        }
      }
    });

    this.sub.on('fms_engine_out_clear').handle(() => {
      this.engineOutCondition.set(false);
      this.fms?.flightPlanService.tryEraseEngineOutSid();
    });
  }

  public onUpdate(): void {
    if (this.engineOutActivationTime > 0) {
      const simDuration = this.fms?.simDuration ?? 0;
      this.isAutoExitInhibited = simDuration - this.engineOutActivationTime < 30_000;
    }
  }

  private async onEngineOut(): Promise<void> {
    const flightPhase = this.flightPhase.get();
    let eoSidReady = false;
    if (flightPhase === FmgcFlightPhase.Takeoff || flightPhase === FmgcFlightPhase.Climb) {
      eoSidReady = (await this.fms?.flightPlanService.tryActivateEngineOutSid()) ?? false;
    }

    this.publisher.pub(
      'fms_engine_out_page_request',
      eoSidReady ? EngineOutTargetPage.FlightPlan : EngineOutTargetPage.Perf,
      false,
      false,
    );
  }
}
