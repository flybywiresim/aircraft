import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import {
  AbstractSubscribable,
  Instrument,
  InstrumentBackplane,
  SimVarValueType,
  Subscribable,
} from '@microsoft/msfs-sdk';

interface MonitorVarDefinition {
  /** The var to read the circuit breaker tripped states from. */
  var: RegisteredSimVar<number>;
  /** A bitmask of the circuit breakers to be monitored (green caps on the physical panel). */
  monitoredMask: number;
}

/** A monitor for a group of circuit breakers. */
class CircuitBreakerMonitor extends AbstractSubscribable<boolean> implements Instrument, Subscribable<boolean> {
  private readonly vars: MonitorVarDefinition[] = [];

  private isAnyTripped = false;

  /**
   * Constructs a new monitor.
   * @param monitoredVars A map of the var to read the circuit breaker tripped states from,
   * to a bitmask of the circuit breakers to be monitored (green caps on the physical panel).
   */
  public constructor(monitoredVars: Record<string, number>) {
    super();

    for (const [varName, mask] of Object.entries(monitoredVars)) {
      this.vars.push({
        var: RegisteredSimVar.create(varName, SimVarValueType.Enum),
        monitoredMask: mask,
      });
    }
  }

  /** @inheritdoc */
  public init(): void {
    // noop
  }

  /** @inheritdoc */
  public onUpdate(): void {
    let isAnyTripped = false;
    for (let i = 0; i < this.vars.length; i++) {
      const tripped = this.vars[i].var.get();
      isAnyTripped ||= (tripped & this.vars[i].monitoredMask) > 0;
    }

    if (this.isAnyTripped !== isAnyTripped) {
      this.isAnyTripped = isAnyTripped;
      this.notify();
    }
  }

  /** @inheritdoc */
  public get(): boolean {
    return this.isAnyTripped;
  }
}

/** Represents the circuit breaker monitoring wiring and inputs in the SDAC. */
export class CircuitBreakerMonitors implements Instrument {
  private static readonly rearJMMonitored = {
    'L:1:A32NX_CB_121VU_J_TRIPPED_0': 0x30000,
    'L:1:A32NX_CB_121VU_K_TRIPPED_0': 0xc21,
    'L:1:A32NX_CB_121VU_K_TRIPPED_1': 0x1e40,
    'L:1:A32NX_CB_121VU_L_TRIPPED_0': 0x80000040,
    'L:1:A32NX_CB_121VU_L_TRIPPED_1': 0x4,
    'L:1:A32NX_CB_121VU_M_TRIPPED_0': 0x3ff8000,
    'L:1:A32NX_CB_121VU_M_TRIPPED_1': 0x8c0,
  };

  private static readonly rearNRMonitored = {
    'L:1:A32NX_CB_121VU_N_TRIPPED_0': 0x80098300,
    'L:1:A32NX_CB_121VU_N_TRIPPED_1': 0x1a98,
    'L:1:A32NX_CB_121VU_P_TRIPPED_0': 0x200cc700,
    'L:1:A32NX_CB_121VU_P_TRIPPED_1': 0xbc1,
    'L:1:A32NX_CB_121VU_Q_TRIPPED_0': 0x20180,
    'L:1:A32NX_CB_121VU_Q_TRIPPED_1': 0x86,
    'L:1:A32NX_CB_121VU_R_TRIPPED_0': 0x800886bc,
    'L:1:A32NX_CB_121VU_R_TRIPPED_1': 0x101,
  };

  private static readonly rearSVMonitored = {
    'L:1:A32NX_CB_122VU_V_TRIPPED_0': 0x800040,
    'L:1:A32NX_CB_122VU_U_TRIPPED_0': 0x900000,
    'L:1:A32NX_CB_122VU_T_TRIPPED_0': 0x7f841000,
    'L:1:A32NX_CB_122VU_S_TRIPPED_0': 0x8000060,
  };

  private static readonly rearWZMonitored = {
    'L:1:A32NX_CB_122VU_Z_TRIPPED_0': 0x3400000,
    'L:1:A32NX_CB_122VU_Y_TRIPPED_0': 0x408800,
    'L:1:A32NX_CB_122VU_X_TRIPPED_0': 0x3080800,
    'L:1:A32NX_CB_122VU_W_TRIPPED_0': 0x30880800,
  };

  private static readonly overheadMonitored = {
    'L:1:A32NX_CB_49VU_A_TRIPPED_0': 0x2f9f,
    'L:1:A32NX_CB_49VU_B_TRIPPED_0': 0x1c9f,
    'L:1:A32NX_CB_49VU_C_TRIPPED_0': 0x3501,
    'L:1:A32NX_CB_49VU_D_TRIPPED_0': 0x3a04,
    'L:1:A32NX_CB_49VU_E_TRIPPED_0': 0xf7f,
    'L:1:A32NX_CB_49VU_F_TRIPPED_0': 0x80,
    'L:1:A32NX_CB_49VU_G_TRIPPED_0': 0x2807,
    'L:1:A32NX_CB_49VU_H_TRIPPED_0': 0x3270,
    'L:1:A32NX_CB_49VU_HA_TRIPPED_0': 0xfff,
  };

  private static readonly leftElecBayMonitored = {
    'L:1:A32NX_CB_106VU_TOP_TRIPPED_0': 0x3b,
    'L:1:A32NX_CB_106VU_BOT_TRIPPED_0': 0x17d,
  };

  private static readonly rightElecBayMonitored = {
    'L:1:A32NX_CB_105VU_TOP_TRIPPED_0': 0x1fd,
    'L:1:A32NX_CB_105VU_BOT_TRIPPED_0': 0x7f,
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
