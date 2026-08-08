import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import {
  AbstractSubscribable,
  Instrument,
  InstrumentBackplane,
  SimVarValueType,
  Subscribable,
} from '@microsoft/msfs-sdk';

class CircuitBreakerMonitor extends AbstractSubscribable<boolean> implements Instrument, Subscribable<boolean> {
  private readonly vars: { var: RegisteredSimVar<number>; mask: number }[] = [];

  private isAnyTripped = false;

  public constructor(monitoredVars: Record<string, number>) {
    super();

    for (const [varName, mask] of Object.entries(monitoredVars)) {
      this.vars.push({
        var: RegisteredSimVar.create(varName, SimVarValueType.Enum),
        mask,
      });
    }
  }

  /** @inheritdoc */
  public init(): void {
    // noop
  }

  public onUpdate(): void {
    let isAnyTripped = false;
    for (let i = 0; i < this.vars.length; i++) {
      const tripped = this.vars[i].var.get();
      isAnyTripped ||= (tripped & this.vars[i].mask) > 0;
    }

    if (this.isAnyTripped !== isAnyTripped) {
      this.isAnyTripped = isAnyTripped;
      this.notify();
    }
  }

  public get(): boolean {
    return this.isAnyTripped;
  }
}

/** Represents the circuit breaker monitoring wiring and inputs in the SDAC. */
export class CircuitBreakerMonitors implements Instrument {
  private static readonly rearJMMonitored = {
    'L:1:A32NX_CB_121VU_J_TRIPPED_0': 196608,
    'L:1:A32NX_CB_121VU_K_TRIPPED_0': 3105,
    'L:1:A32NX_CB_121VU_K_TRIPPED_1': 7744,
    'L:1:A32NX_CB_121VU_L_TRIPPED_0': 2147483712,
    'L:1:A32NX_CB_121VU_L_TRIPPED_1': 4,
    'L:1:A32NX_CB_121VU_M_TRIPPED_0': 67076096,
    'L:1:A32NX_CB_121VU_M_TRIPPED_1': 2240,
  };

  private static readonly rearNRMonitored = {
    'L:1:A32NX_CB_121VU_N_TRIPPED_0': 2148107008,
    'L:1:A32NX_CB_121VU_N_TRIPPED_1': 6808,
    'L:1:A32NX_CB_121VU_P_TRIPPED_0': 537708288,
    'L:1:A32NX_CB_121VU_P_TRIPPED_1': 3009,
    'L:1:A32NX_CB_121VU_Q_TRIPPED_0': 131456,
    'L:1:A32NX_CB_121VU_Q_TRIPPED_1': 134,
    'L:1:A32NX_CB_121VU_R_TRIPPED_0': 2148042428,
    'L:1:A32NX_CB_121VU_R_TRIPPED_1': 257,
  };

  private static readonly rearSVMonitored = {
    'L:1:A32NX_CB_122VU_V_TRIPPED_0': 8388672,
    'L:1:A32NX_CB_122VU_U_TRIPPED_0': 9437184,
    'L:1:A32NX_CB_122VU_T_TRIPPED_0': 2139361280,
    'L:1:A32NX_CB_122VU_S_TRIPPED_0': 134217824,
  };

  private static readonly rearWZMonitored = {
    'L:1:A32NX_CB_122VU_Z_TRIPPED_0': 54525952,
    'L:1:A32NX_CB_122VU_Y_TRIPPED_0': 4229120,
    'L:1:A32NX_CB_122VU_X_TRIPPED_0': 50857984,
    'L:1:A32NX_CB_122VU_W_TRIPPED_0': 814221312,
  };

  private static readonly overheadMonitored = {
    'L:1:A32NX_CB_49VU_A_TRIPPED_0': 12191,
    'L:1:A32NX_CB_49VU_B_TRIPPED_0': 7327,
    'L:1:A32NX_CB_49VU_C_TRIPPED_0': 13569,
    'L:1:A32NX_CB_49VU_D_TRIPPED_0': 14852,
    'L:1:A32NX_CB_49VU_E_TRIPPED_0': 3967,
    'L:1:A32NX_CB_49VU_F_TRIPPED_0': 128,
    'L:1:A32NX_CB_49VU_G_TRIPPED_0': 10247,
    'L:1:A32NX_CB_49VU_H_TRIPPED_0': 12912,
    'L:1:A32NX_CB_49VU_HA_TRIPPED_0': 4095,
  };

  private static readonly leftElecBayMonitored = {
    'L:1:A32NX_CB_106VU_TOP_TRIPPED_0': 59,
    'L:1:A32NX_CB_106VU_BOT_TRIPPED_0': 381,
  };

  private static readonly rightElecBayMonitored = {
    'L:1:A32NX_CB_105VU_TOP_TRIPPED_0': 509,
    'L:1:A32NX_CB_105VU_BOT_TRIPPED_0': 127,
  };

  private readonly backplane = new InstrumentBackplane();

  public readonly rearJMTripped: Subscribable<boolean> = new CircuitBreakerMonitor(
    CircuitBreakerMonitors.rearJMMonitored,
  );

  public readonly rearNRTripped: Subscribable<boolean> = new CircuitBreakerMonitor(
    CircuitBreakerMonitors.rearNRMonitored,
  );

  public readonly rearSVTripped: Subscribable<boolean> = new CircuitBreakerMonitor(
    CircuitBreakerMonitors.rearSVMonitored,
  );

  public readonly rearWZTripped: Subscribable<boolean> = new CircuitBreakerMonitor(
    CircuitBreakerMonitors.rearWZMonitored,
  );

  public readonly overheadTripped: Subscribable<boolean> = new CircuitBreakerMonitor(
    CircuitBreakerMonitors.overheadMonitored,
  );

  public readonly leftElecBayTripped: Subscribable<boolean> = new CircuitBreakerMonitor(
    CircuitBreakerMonitors.leftElecBayMonitored,
  );

  public readonly rightElecBayTripped: Subscribable<boolean> = new CircuitBreakerMonitor(
    CircuitBreakerMonitors.rightElecBayMonitored,
  );

  /** @inheritdoc */
  public init(): void {
    this.backplane.addInstrument('rearJM', this.rearJMTripped as CircuitBreakerMonitor, true);
    this.backplane.addInstrument('rearNR', this.rearNRTripped as CircuitBreakerMonitor, true);
    this.backplane.addInstrument('rearSV', this.rearSVTripped as CircuitBreakerMonitor, true);
    this.backplane.addInstrument('rearWZ', this.rearWZTripped as CircuitBreakerMonitor, true);
    this.backplane.addInstrument('overhead', this.overheadTripped as CircuitBreakerMonitor, true);
    this.backplane.addInstrument('leftElecBay', this.leftElecBayTripped as CircuitBreakerMonitor, true);
    this.backplane.addInstrument('rightElecBay', this.rightElecBayTripped as CircuitBreakerMonitor, true);

    this.backplane.init();
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.backplane.onUpdate();
  }
}
