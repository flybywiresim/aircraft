import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
// import { LowerArea } from 'instruments/src/HUD/LowerArea';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import './style.scss';

export const FIVE_DEG = 182.857;
export const ONE_DEG = 36.5714;

export const ALT_TAPE_XPOS = 510;
export const ALT_TAPE_YPOS = 158;

export const SPD_TAPE_XPOS = 60;
export const SPD_TAPE_YPOS = 134;

export const XWIND_FULL_OFFSET = -311;
export const XWIND_TO_AIR_REF_OFFSET = -192; //-311

export const calculateHorizonOffsetFromPitch = (pitch: number) => {
  const offset = (pitch * 1024) / 28;
  return offset;
};

export const calculateVerticalOffsetFromRoll = (roll: number) => {
  let offset = 0;

  if (Math.abs(roll) > 60) {
    offset = Math.max(0, 41 - 35.87 / Math.sin((Math.abs(roll) / 180) * Math.PI));
  }
  return offset;
};

export const SmoothSin = (origin: number, destination: number, smoothFactor: number, dTime: number) => {
  if (origin === undefined) {
    return destination;
  }
  if (Math.abs(destination - origin) < Number.EPSILON) {
    return destination;
  }
  const delta = destination - origin;
  let result = origin + delta * Math.sin((Math.min(smoothFactor * dTime, 1.0) * Math.PI) / 2.0);
  if ((origin < destination && result > destination) || (origin > destination && result < destination)) {
    result = destination;
  }
  return result;
};

export class LagFilter {
  private PreviousInput: number;

  private PreviousOutput: number;

  private TimeConstant: number;

  constructor(timeConstant: number) {
    this.PreviousInput = 0;
    this.PreviousOutput = 0;

    this.TimeConstant = timeConstant;
  }

  reset() {
    this.PreviousInput = 0;
    this.PreviousOutput = 0;
  }

  /**
   *
   * @param input Input to filter
   * @param deltaTime in seconds
   * @returns {number} Filtered output
   */
  step(input: number, deltaTime: number): number {
    const filteredInput = !Number.isNaN(input) ? input : 0;

    const scaledDeltaTime = deltaTime * this.TimeConstant;
    const sum0 = scaledDeltaTime + 2;

    const output =
      ((filteredInput + this.PreviousInput) * scaledDeltaTime) / sum0 +
      ((2 - scaledDeltaTime) / sum0) * this.PreviousOutput;

    this.PreviousInput = filteredInput;

    if (Number.isFinite(output)) {
      this.PreviousOutput = output;
      return output;
    }
    return 0;
  }
}

export class RateLimiter {
  private PreviousOutput: number;

  private RisingRate: number;

  private FallingRate: number;

  constructor(risingRate: number, fallingRate: number) {
    this.PreviousOutput = 0;

    this.RisingRate = risingRate;
    this.FallingRate = fallingRate;
  }

  step(input: number, deltaTime: number) {
    const filteredInput = !Number.isNaN(input) ? input : 0;

    const subInput = filteredInput - this.PreviousOutput;

    const scaledUpper = deltaTime * this.RisingRate;
    const scaledLower = deltaTime * this.FallingRate;

    const output = this.PreviousOutput + Math.max(Math.min(scaledUpper, subInput), scaledLower);
    this.PreviousOutput = output;
    return output;
  }
}

/**
 * Gets the smallest angle between two angles
 * @param angle1 First angle in degrees
 * @param angle2 Second angle in degrees
 * @returns {number} Smallest angle between angle1 and angle2 in degrees
 */
export const getSmallestAngle = (angle1: number, angle2: number): number => {
  let smallestAngle = angle1 - angle2;
  if (smallestAngle > 180) {
    smallestAngle -= 360;
  } else if (smallestAngle < -180) {
    smallestAngle += 360;
  }
  return smallestAngle;
};

export const isCaptainSide = (displayIndex: number | undefined) => displayIndex === 1;

export const getSupplier = (displayIndex: number | undefined, knobValue: number) => {
  const adirs3ToCaptain = 0;
  const adirs3ToFO = 2;

  if (isCaptainSide(displayIndex)) {
    return knobValue === adirs3ToCaptain ? 3 : 1;
  }
  return knobValue === adirs3ToFO ? 3 : 2;
};

interface GridProps extends ComponentProps {
  bus: ArincEventBus;
}

export class Grid extends DisplayComponent<GridProps> {
  constructor(props: GridProps) {
    super(props);
  }

  private lines: SVGPathElement[] = [];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    const res: SVGPathElement[] = [];
    const gap = 8 * 8;
    for (let i = 0; i < 1280 / gap + 1; i++) {
      const x = i * gap;
      this.lines.push(<path class="NormalStroke Cyan" d={`m ${x},0 v 1024`} />);
    }
    for (let i = 0; i < 1024 / gap + 1; i++) {
      const y = i * gap;
      this.lines.push(<path class="NormalStroke Cyan" d={`m 0,${y} h 1280`} />);
    }

    for (let i = 0; i < this.lines.length; i++) {
      res.push(this.lines[i]);
    }
    return (
      <g id="Grid & Refs">
        <g display="none" transform="translate(0 139)">
          <path class="NormalStroke Red" d="m 111 -139 v 1024" />
          <path class="NormalStroke Red" d="m 209 -139 v 1024" />
          <path class="NormalStroke Red" d="m 0 71.5 h 1280" />
          <path class="NormalStroke Red" d="m 0 -20 h 1280" />
          <path class="NormalStroke Red" d="m 0 162 h 1280" />

          <path class="NormalStroke Red" d="m 640 ,0 v 1024" />
          <path class="NormalStroke Red" d="m 0 190 h 1280" />
          <path class="NormalStroke Red" d="m 0 573 h 1280" />
          <path class="NormalStroke Red" d="m 0 381.5 h 1280" />
        </g>
        <g id="Grid" display="none">
          {res}
        </g>
      </g>
    );
  }
}

// L:A32NX_FWC_FLIGHT_PHASE                         L:A32NX_FMGC_FLIGHT_PHASE
// | 0      |                             |                 |       0    |   Preflight
// | 1      | ELEC PWR                    | taxi            |       0    |
// | 2      | ENG 1 STARTED               | taxi            |       0    |
// | 3      | 2ND ENG TO PWR              | takeoff         |       0    |
// | 4      | 80 kt                       | takeoff         |       0    |
// | 5      | AtOrAboveV1                 | clb             |       0    |
// | 6      | LiftOff                     |                 |       1    |    Takeoff
// | 7      | AtOrAbove400Feet            |                 |       1    |
// | 8      | AtOrAbove1500FeetTo800Feet  | rollout         |       1    |   TO pwr to clb
// |        |                             |                 |       2    |   Climb
// |        |                             |                 |       3    |   Cruise
// |        |                             |                 |       4    |   Descent
// |        |                             |                 |       5    |   Approach  (at IAF reached)
// | 9      | AtOrBelow800Feet            | taxi            |       5    |
// | 10     | TouchDown                   |                 |       6    |   Go Around       taxi
// | 11     | AtOrBelowEightyKnots        |                 |       6    |   Go Around       taxi
// | 12     | EnginesShutdown             |                 |       6    |   Go Around       taxi
// | &gt; 1 | 5 MIN AFTER                 |                 |       7    |   Done  (auto brk off or 30kts)

export enum HudMode {
  NORMAL = 0,
  TAXI = 1,
  TAKEOFF = 2,
  ROLLOUT_OR_RTO = 3,
}

export enum PitchscaleMode {
  FULL = 0,
  FIVEDEG = 1,
  OFF = 2,
}

export enum WindMode {
  Normal,
  CrossWind,
}

export interface HudElems {
  spdTape: string;
  xWindSpdTape: string;
  altTape: string;
  xWindAltTape: string;
  attitudeIndicator: string;
  FMA: string;
  headingTrk: string;
  gndAcftRef: string;
  inAirAcftRef: string;
  flightPathDirector: string;
  flightPathVector: string;
  VSI: string;
  ra: string;
  IlsGS: string;
  IlsLoc: string;
  IlsHorizonTrk: string;
  syntheticRunwway: string;
  windIndicator: string;
  QFE: string;
  metricAlt: boolean;
  pitchScaleMode: number;
  hudFlightPhaseMode: number;
  cWndMode: boolean;
  decMode: number;
  spdChevrons: string;
}

export enum MdaMode {
  None = '',
  NoDh = 'NO DH',
  Radio = 'RADIO',
  Baro = 'BARO',
}
