import { useSimVar } from '@flybywiresim/fbw-sdk';
import React, { FC } from 'react';

interface FctlComputerShapeProps {
  x: number;
  y: number;
  num: 1 | 2 | 3;
  infoAvailable: boolean;
  computerFailed: boolean;
}

const FctlComputerShape: FC<FctlComputerShapeProps> = ({ x, y, num, infoAvailable, computerFailed }) => {
  let path: string;
  let textX: number;
  let textY: number;
  if (num === 1) {
    path = 'M0 0 l98,0 l0,-35 l-21,0';
    textX = 81;
    textY = -8;
  } else if (num === 2) {
    path = 'M0 0 l94,0 l0,-35 l-23,0';
    textX = 75;
    textY = -10;
  } else {
    path = 'M0 0 l93,0 l0,-35 l-23,0';
    textX = 74;
    textY = -8;
  }

  return (
    <g transform={`translate(${x} ${y})`}>
      <path className={`SW3 NoFill LineRound ${!computerFailed || !infoAvailable ? 'Grey' : 'Amber'}`} d={path} />
      <text x={textX} y={textY} className={`F26 ${!computerFailed && infoAvailable ? 'Green' : 'Amber'}`}>
        {infoAvailable ? num : 'X'}
      </text>
    </g>
  );
};

interface PrimSecProps {
  x: number;
  y: number;
}

export const Prims: FC<PrimSecProps> = ({ x, y }) => {
  const infoAvailable = true;
  const [prim1Healthy]: [boolean, (v: boolean) => void] = useSimVar(`L:A32NX_PRIM_1_HEALTHY`, 'boolean', 1000);
  const [prim2Healthy]: [boolean, (v: boolean) => void] = useSimVar(`L:A32NX_PRIM_2_HEALTHY`, 'boolean', 1000);
  const [prim3Healthy]: [boolean, (v: boolean) => void] = useSimVar(`L:A32NX_PRIM_3_HEALTHY`, 'boolean', 1000);

  return (
    <g id="prim-computers" transform={`translate(${x} ${y})`}>
      <text className="F22 White MiddleAlign LS1" x={45} y={85}>
        PRIM
      </text>
      <FctlComputerShape x={8} y={100} num={1} infoAvailable={infoAvailable} computerFailed={!prim1Healthy} />
      <FctlComputerShape x={36} y={112} num={2} infoAvailable={infoAvailable} computerFailed={!prim2Healthy} />
      <FctlComputerShape x={62} y={124} num={3} infoAvailable={infoAvailable} computerFailed={!prim3Healthy} />
    </g>
  );
};

export const Secs: FC<PrimSecProps> = ({ x, y }) => {
  const infoAvailable = true;
  const [sec1Healthy]: [boolean, (v: boolean) => void] = useSimVar(`L:A32NX_SEC_1_HEALTHY`, 'boolean', 1000);
  const [sec2Healthy]: [boolean, (v: boolean) => void] = useSimVar(`L:A32NX_SEC_2_HEALTHY`, 'boolean', 1000);
  const [sec3Healthy]: [boolean, (v: boolean) => void] = useSimVar(`L:A32NX_SEC_3_HEALTHY`, 'boolean', 1000);

  return (
    <g id="sec-computers" transform={`translate(${x} ${y})`}>
      <text className="F22 White MiddleAlign LS1" x={48} y={84}>
        SEC
      </text>
      <FctlComputerShape x={8} y={100} num={1} infoAvailable={infoAvailable} computerFailed={!sec1Healthy} />
      <FctlComputerShape x={36} y={112} num={2} infoAvailable={infoAvailable} computerFailed={!sec2Healthy} />
      <FctlComputerShape x={62} y={124} num={3} infoAvailable={infoAvailable} computerFailed={!sec3Healthy} />
    </g>
  );
};

export const Slats: FC<PrimSecProps> = ({ x, y }) => {
  const infoAvailable = true;
  const computerFailed = false;

  return (
    <g id="slat-computers" transform={`translate(${x} ${y})`}>
      <text className="F22 White MiddleAlign LS1" x={46} y={85}>
        SLATS
      </text>
      <FctlComputerShape x={8} y={100} num={1} infoAvailable={infoAvailable} computerFailed={computerFailed} />
      <FctlComputerShape x={36} y={112} num={2} infoAvailable={infoAvailable} computerFailed={computerFailed} />
    </g>
  );
};

export const Flaps: FC<PrimSecProps> = ({ x, y }) => {
  const infoAvailable = true;
  const computerFailed = false;

  return (
    <g id="flap-computers" transform={`translate(${x} ${y})`}>
      <text className="F22 White MiddleAlign LS1" x={46} y={84}>
        FLAPS
      </text>
      <FctlComputerShape x={8} y={100} num={1} infoAvailable={infoAvailable} computerFailed={computerFailed} />
      <FctlComputerShape x={36} y={112} num={2} infoAvailable={infoAvailable} computerFailed={computerFailed} />
    </g>
  );
};
