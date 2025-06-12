import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
// import { LowerArea } from 'instruments/src/HUD/LowerArea';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import './style.scss';

export const FIVE_DEG = 182.857;
export const ONE_DEG = 36.5714;

export const calculateHorizonOffsetFromPitch = (pitch: number) => {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 655ccacf88efcabb4496cd2a50ce21632c5b84c4
  if (pitch > -5 && pitch <= 20) {
    return pitch * 1.8;
  }
  if (pitch > 20 && pitch <= 30) {
    return -0.04 * pitch ** 2 + 3.4 * pitch - 16;
  }
  if (pitch > 30) {
    return 20 + pitch;
  }
  if (pitch < -5 && pitch >= -15) {
    return 0.04 * pitch ** 2 + 2.2 * pitch + 1;
  }
  return pitch - 8;
<<<<<<< HEAD
=======
  const offset = (pitch * 1024) / 28;
  return offset;
>>>>>>> 412fe6564dca7e0d2c74cb35c05eac94a6e82aaa
=======
>>>>>>> 655ccacf88efcabb4496cd2a50ce21632c5b84c4
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
      <g id="Grid" display="block">
        {res}
      </g>
    );
  }
}
