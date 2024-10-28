import { KeyboardEvent } from 'react';

export type Position = { x: number; y: number };

export type OneDimensionalSize = { size: number };

export type TwoDimensionalSize = { width: number; height: number };

export type OnClick = { onClick: () => void };

export type OnKeyDown = { onKeyDown: (event: KeyboardEvent<SVGGElement>) => void };

export type EngineNumber = { engine: 1 | 2 | 3 | 4 };

export type FadecActive = { active: boolean };

export type SdacActive = { active: boolean };

export type IgnitionActive = { ignition: boolean };

export type n1Degraded = { n1Degraded: boolean };

export type PackNumber = { pack: 1 | 2 };

export type EGTProps = {
  engine: 1 | 2 | 3 | 4;
  x: number;
  y: number;
  active: boolean;
};

export type CabinDoorProps = {
  doorNumber: number;
  interactivePoint: number;
  slideArmed: boolean;
  side: 'L' | 'R';
  engineRunning: boolean;
  mainOrUpper: 'MAIN' | 'UPPER';
};

export type CargoDoorProps = {
  label: 'AFT' | 'FWD' | 'BULK' | 'AVNCS' | 'FWD CARGO' | 'AFT CARGO';
  closed: boolean;
  width: number;
  height: number;
  engineRunning: boolean;
};

export type OnGround = {
  onGround: boolean;
};

export type ValidRedundantSystem = { system: 0 | 1 | 2 | 3 | 4 };
