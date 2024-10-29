import React, { FC } from 'react';
import { Wheel } from './Wheel';
import { BodyWheelSteering, NoseWheelSteering } from './Steering';

export enum WheelBogeyPosition {
  Nose,
  Left,
  Right,
}

export enum WheelBogeyType {
  Nose,
  WLG,
  BLG,
}

interface WheelBogeyProps {
  x: number;
  y: number;
  position: WheelBogeyPosition;
  type: WheelBogeyType;
  moreActive: boolean;
}

export const WheelBogey: FC<WheelBogeyProps> = ({ x, y, position, type, moreActive }) => {
  let numberOfWheels;
  if (type === WheelBogeyType.Nose) {
    numberOfWheels = 2;
  } else if (type === WheelBogeyType.WLG) {
    numberOfWheels = 4;
  } else {
    numberOfWheels = 6;
  }

  const wheels: JSX.Element[] = [];

  for (let i = 0; i < numberOfWheels; i++) {
    let wheelNumber: number;
    let xOffset = 0;
    if (type === WheelBogeyType.WLG) {
      wheelNumber = i + Math.floor(i / 2) * 2 + (position === WheelBogeyPosition.Left ? 1 : 3);
    } else if (type === WheelBogeyType.BLG) {
      wheelNumber = i + Math.floor(i / 2) * 2 + (position === WheelBogeyPosition.Left ? 9 : 11);
    } else {
      wheelNumber = i;
      xOffset = i === 0 ? 8 : -5;
    }

    wheels.push(
      <Wheel
        x={xOffset}
        y={Math.floor(i / 2) * (type === WheelBogeyType.BLG ? 90 : 92)}
        number={type !== WheelBogeyType.Nose ? wheelNumber : null}
        hasBrake={wheelNumber < 17 && type !== WheelBogeyType.Nose}
        isLeftSide={wheelNumber % 2 !== 0}
        moreActive={moreActive}
      />,
    );
  }

  return (
    <g id={`bogey-${position}-${type}`} transform={`translate(${x} ${y})`}>
      {type !== WheelBogeyType.Nose && moreActive && (
        <text className="F22 Green LS1" x={-43} y={-54}>
          A-SKID
        </text>
      )}

      {type !== WheelBogeyType.Nose && (
        <path
          className="Grey NoFill SW4"
          d={
            type === WheelBogeyType.WLG
              ? 'm0,0 v 92 M -13,0 h 26 M -13,92 h 26'
              : 'm0,0 v 176 M -13,0 h 26 M -13,91 h 26'
          }
        />
      )}
      {type === WheelBogeyType.Nose && <NoseWheelSteering x={0} y={10} />}
      {type === WheelBogeyType.BLG && <BodyWheelSteering x={0} y={181} />}
      {wheels}
      {(type === WheelBogeyType.BLG || type === WheelBogeyType.WLG) && (
        <AccuFlag x={-6} y={type === WheelBogeyType.BLG ? 24 : -22} />
      )}
      {type === WheelBogeyType.WLG && <AccuFlag x={-6} y={70} />}
    </g>
  );
};

interface AccuFlagProps {
  x: number;
  y: number;
}

const AccuFlag: FC<AccuFlagProps> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <text className="F24 Green" x={0} y={0}>
      A
    </text>
    <text className="F24 Green" x={0} y={22}>
      C
    </text>
    <text className="F24 Green" x={0} y={44}>
      C
    </text>
    <text className="F24 Green" x={0} y={66}>
      U
    </text>
  </g>
);
