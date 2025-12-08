import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { LateralMode, VerticalMode } from '@shared/autopilot';

export enum FgLateralArmedFlags {
  None = 0,
  Nav = 1 << 0,
  Loc = 1 << 1,
}

export enum FgVerticalArmedFlags {
  None = 0,
  Alt = 1 << 0,
  AltCst = 1 << 1,
  Clb = 1 << 2,
  Des = 1 << 3,
  Gs = 1 << 4,
  Final = 1 << 5,
  Tcas = 1 << 6,
}

export enum AutoThrustModeMessage {
  None = 0,
  ThrustLock = 1,
  LeverToga = 2,
  LeverClb = 3,
  LeverMct = 4,
  LeverAsym = 5,
}

export interface FGVars {
  'fg.fma.lateralMode': LateralMode;
  'fg.fma.lateralArmedBitmask': FgLateralArmedFlags;
  'fg.fma.verticalMode': VerticalMode;
  'fg.fma.verticalArmedBitmask': FgVerticalArmedFlags;
  'fg.speeds.managed': number;
  /** Altitude constraint in ft. 0 if not set. */
  'fg.altitudeConstraint': number;

  /**
   * Autothrust mode message.
   * 0 = None
   * 1 = THR LK
   * 2=  LVR TOGA
   * 3 = LVR CLB
   * 4 = LVR MCT
   * 5 = LVR ASYM
   */
  'fg.athr.message': AutoThrustModeMessage;
}

export class FGDataPublisher extends SimVarPublisher<FGVars> {
  constructor(bus: EventBus) {
    super(
      new Map([
        ['fg.fma.lateralMode', { name: 'L:A32NX_FMA_LATERAL_MODE', type: SimVarValueType.Number }],
        ['fg.fma.lateralArmedBitmask', { name: 'L:A32NX_FMA_LATERAL_ARMED', type: SimVarValueType.Number }],
        ['fg.fma.verticalMode', { name: 'L:A32NX_FMA_VERTICAL_MODE', type: SimVarValueType.Number }],
        ['fg.fma.verticalArmedBitmask', { name: 'L:A32NX_FMA_VERTICAL_ARMED', type: SimVarValueType.Number }],
        ['fg.speeds.managed', { name: 'L:A32NX_SPEEDS_MANAGED_PFD', type: SimVarValueType.Knots }],
        ['fg.altitudeConstraint', { name: 'L:A32NX_FG_ALTITUDE_CONSTRAINT', type: SimVarValueType.Number }],
        ['fg.athr.message', { name: 'L:A32NX_AUTOTHRUST_MODE_MESSAGE', type: SimVarValueType.Enum }],
      ]),
      bus,
    );
  }
}
