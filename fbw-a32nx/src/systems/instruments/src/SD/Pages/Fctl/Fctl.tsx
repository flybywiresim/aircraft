// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { useArinc429Var, Arinc429Word, useSimVar } from '@flybywiresim/fbw-sdk';
import { SvgGroup } from '../../Common/SvgGroup';
import { HydraulicsProvider, useHydraulics } from '../../Common/HydraulicsProvider';
import { ComponentPositionProps } from '../../Common/ComponentPositionProps';
import { HydraulicSystem } from '../../Common/HydraulicSystem';
import { HydraulicIndicator } from '../../Common/HydraulicIndicator';
import { ComponentSidePositionProps } from '../../Common/ComponentSidePositionProps';
import { Spoilers } from '../../Common/Spoilers';

import '../../Common/CommonStyles.scss';

interface HydraulicSystemPairProps {
  leftHydraulicSystem: HydraulicSystem;
  rightHydraulicSystem: HydraulicSystem;
}

export const FctlPage = () => {
  const fcdc1DiscreteWord1 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_1');
  const fcdc2DiscreteWord1 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_1');
  const fcdc1DiscreteWord2 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_2');
  const fcdc2DiscreteWord2 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_2');
  const fcdc1DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_1_DISCRETE_WORD_3');
  const fcdc2DiscreteWord3 = useArinc429Var('L:A32NX_FCDC_2_DISCRETE_WORD_3');

  const fcdcDiscreteWord1ToUse = !fcdc1DiscreteWord1.isFailureWarning() ? fcdc1DiscreteWord1 : fcdc2DiscreteWord1;
  const fcdcDiscreteWord2ToUse = !fcdc1DiscreteWord2.isFailureWarning() ? fcdc1DiscreteWord2 : fcdc2DiscreteWord2;
  const fcdcDiscreteWord3ToUse = !fcdc1DiscreteWord3.isFailureWarning() ? fcdc1DiscreteWord3 : fcdc2DiscreteWord3;

  return (
    <svg
      id="ecam-fctl"
      className="ecam-common-styles"
      viewBox="0 0 768 768"
      style={{ marginTop: '-60px' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text className="Title UnderlineWhite" x={8} y={33}>
        F/CTL
      </text>

      <HydraulicsProvider>
        <Wings x={124} y={11} />

        <Aileron
          x={88}
          y={197}
          side="left"
          leftHydraulicSystem="B"
          rightHydraulicSystem="G"
          fcdcDiscreteWord2={fcdcDiscreteWord2ToUse}
          fcdcDiscreteWord3={fcdcDiscreteWord3ToUse}
        />
        <Aileron
          x={678}
          y={197}
          side="right"
          leftHydraulicSystem="G"
          rightHydraulicSystem="B"
          fcdcDiscreteWord2={fcdcDiscreteWord2ToUse}
          fcdcDiscreteWord3={fcdcDiscreteWord3ToUse}
        />

        <text className="Center Standard" x={248} y={226}>
          ELAC
        </text>
        <Elac x={215} y={234} num={1} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />
        <Elac x={245} y={252} num={2} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />

        <text className="Center Standard" x={430} y={226}>
          SEC
        </text>
        <Sec x={395} y={234} num={1} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />
        <Sec x={425} y={252} num={2} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />
        <Sec x={455} y={270} num={3} fcdcDiscreteWord1={fcdcDiscreteWord1ToUse} />

        <Elevator
          x={212}
          y={424}
          side="left"
          leftHydraulicSystem="B"
          rightHydraulicSystem="G"
          fcdcDiscreteWord2={fcdcDiscreteWord2ToUse}
          fcdcDiscreteWord3={fcdcDiscreteWord3ToUse}
        />
        <Elevator
          x={555}
          y={424}
          side="right"
          leftHydraulicSystem="Y"
          rightHydraulicSystem="B"
          fcdcDiscreteWord2={fcdcDiscreteWord2ToUse}
          fcdcDiscreteWord3={fcdcDiscreteWord3ToUse}
        />

        <PitchTrim x={356} y={350} fcdcDiscreteWord2={fcdcDiscreteWord2ToUse} />

        <Stabilizer x={341} y={446} />

        <Rudder x={384} y={454} />
      </HydraulicsProvider>
    </svg>
  );
};

const Wings = ({ x = 0, y = 0 }: ComponentPositionProps) => (
  <SvgGroup x={x} y={y}>
    <text className="Large Center" x={262} y={125}>
      SPD BRK
    </text>

    <HydraulicIndicator x={225} y={0} type="G" />
    <HydraulicIndicator x={250} y={0} type="B" />
    <HydraulicIndicator x={275} y={0} type="Y" />

    <Spoilers x={9} y={89} />

    {/* Left spoiler wing shape */}
    <path className="LightGreyLine" d="M0 60 l0 -6 l182 -30 l0 6" />
    <path className="LightGreyLine" d="M49 119 l0 6 l135 -14 l0 -6" />

    {/* Right spoiler wing shape */}
    <path className="LightGreyLine" d="M519 60 l0 -6 l-182 -30 l0 6" />
    <path className="LightGreyLine" d="M470 119 l0 6 l-135 -14 l0 -6" />
  </SvgGroup>
);

interface PitchTrimProps extends ComponentPositionProps {
  fcdcDiscreteWord2: Arinc429Word;
}
const PitchTrim = ({ x, y, fcdcDiscreteWord2 }: PitchTrimProps) => {
  const fcdc1ThsPosition = useArinc429Var('L:A32NX_FCDC_1_ELEVATOR_TRIM_POS');
  const fcdc2ThsPosition = useArinc429Var('L:A32NX_FCDC_2_ELEVATOR_TRIM_POS');
  const thsPositionToUse = !fcdc1ThsPosition.isFailureWarning() ? fcdc1ThsPosition : fcdc2ThsPosition;
  const posValid = thsPositionToUse.isNormalOperation();

  let pitchIntegral: string;
  let pitchFractional: string;
  if (thsPositionToUse.isNormalOperation()) {
    [pitchIntegral, pitchFractional] = Math.abs(thsPositionToUse.value).toFixed(1).split('.');
  } else {
    pitchIntegral = 'XX';
    pitchFractional = 'X';
  }

  const hydraulics = useHydraulics();
  const hydraulicAvailableClass =
    thsPositionToUse.isNormalOperation() && (hydraulics.G.available || hydraulics.Y.available) ? 'Green' : 'Amber';

  const thsJam = fcdcDiscreteWord2.bitValueOr(27, false);

  return (
    <SvgGroup x={x} y={y}>
      <text className={`Large ${thsJam ? 'Amber ' : ''}Center`} x={0} y={22}>
        PITCH TRIM
      </text>
      <g visibility={posValid ? 'visible' : 'hidden'}>
        <text x={-1} y={53} className={`${hydraulicAvailableClass} Huge End`}>
          {pitchIntegral}
        </text>
        <text x={4} y={53} className={`${hydraulicAvailableClass} Huge Center`}>
          .
        </text>
        <text x={21} y={53} className={`${hydraulicAvailableClass} Standard Center`}>
          {pitchFractional}
        </text>
        <text x={41} y={56} className="Cyan Title Center">
          °
        </text>
        <text
          x={74}
          y={52}
          visibility={Math.abs(thsPositionToUse.valueOr(0)) > 0.05 ? 'visible' : 'hidden'}
          className={`${hydraulicAvailableClass} Standard Center`}
        >
          {Math.sign(thsPositionToUse.valueOr(0)) === 1 ? 'DN' : 'UP'}
        </text>
      </g>

      <text x={28} y={50} visibility={!posValid ? 'visible' : 'hidden'} className="Amber Large Center">
        XX
      </text>

      <HydraulicIndicator x={102} y={0} type="G" />
      <HydraulicIndicator x={128} y={0} type="Y" />
    </SvgGroup>
  );
};

const Rudder = ({ x, y }: ComponentPositionProps) => {
  const [rudderDeflectionState] = useSimVar('L:A32NX_HYD_RUDDER_DEFLECTION', 'Percent', 50);
  const rudderAngle = (-rudderDeflectionState * 25) / 100;

  const hydraulics = useHydraulics();
  const hydraulicAvailableClass =
    hydraulics.G.available || hydraulics.B.available || hydraulics.Y.available ? 'GreenLine' : 'AmberLine';

  return (
    <SvgGroup x={x} y={y}>
      <text className="Large Center" x={-1} y={0}>
        RUD
      </text>

      <HydraulicIndicator x={-38} y={14} type="G" />
      <HydraulicIndicator x={-13} y={14} type="B" />
      <HydraulicIndicator x={12} y={14} type="Y" />

      <path id="rudderPath" className="WhiteLine" d="M66 131 A 122 122 0 0 1 -66 131" />
      <path id="rudderCenter" className="WhiteLine" d="m-3 151 v 6 h 5 v-6" />

      <path id="rudderLeftBorder" className="WhiteLine" transform="rotate(25 0 26)" d="m-4.5 151 v 6 h 9 v-6" />
      <path id="rudderRightBorder" className="WhiteLine" transform="rotate(-25 0 26)" d="m-4.5 151 v 6 h 9 v-6" />

      <RudderTravelLimit />

      <g id="rudderCursor" transform={`rotate(${rudderAngle} 0 26)`}>
        <path id="rudderCircle" className={hydraulicAvailableClass} d="M -9 93 A 9 9 0 0 1 9 93" />
        <path id="rudderTail" className={hydraulicAvailableClass} d="M-9 93 l9 57 l9,-57" />
      </g>

      <RudderTrim />
    </SvgGroup>
  );
};

const RudderTrim = () => {
  // Should use data from FAC through FWC, but since that is not implemented yet it is read directly

  const fac1DiscreteWord2 = useArinc429Var('L:A32NX_FAC_1_DISCRETE_WORD_2');
  const fac2DiscreteWord2 = useArinc429Var('L:A32NX_FAC_2_DISCRETE_WORD_2');

  const anyTrimEngaged =
    fac1DiscreteWord2.bitValueOr(13, false) ||
    fac1DiscreteWord2.bitValueOr(14, false) ||
    fac2DiscreteWord2.bitValueOr(13, false) ||
    fac2DiscreteWord2.bitValueOr(14, false);

  const facSourceForTrim = fac2DiscreteWord2.bitValueOr(13, false) ? 2 : 1;
  const trimPosWord = useArinc429Var(`L:A32NX_FAC_${facSourceForTrim}_RUDDER_TRIM_POS`);

  return (
    <>
      <g
        id="rudderTrimCursor"
        transform={`rotate(${trimPosWord.value} 0 26)`}
        visibility={trimPosWord.isNormalOperation() ? 'visible' : 'hidden'}
      >
        <path className={anyTrimEngaged ? 'ThickCyanLine' : 'AmberLine'} d="m0 159 v 11" />
      </g>
      <text
        id="rudderTrimFailedFlag"
        className="Large Amber Center"
        visibility={trimPosWord.isNormalOperation() ? 'hidden' : 'visible'}
        x="1"
        y="190"
      >
        XX
      </text>
    </>
  );
};

const RudderTravelLimit = () => {
  const fac1DiscreteWord2 = useArinc429Var('L:A32NX_FAC_1_DISCRETE_WORD_2');
  const fac2DiscreteWord2 = useArinc429Var('L:A32NX_FAC_2_DISCRETE_WORD_2');

  const anyTluEngaged =
    fac1DiscreteWord2.bitValueOr(15, false) ||
    fac1DiscreteWord2.bitValueOr(16, false) ||
    fac2DiscreteWord2.bitValueOr(15, false) ||
    fac2DiscreteWord2.bitValueOr(16, false);

  const facSourceForTlu = fac2DiscreteWord2.bitValueOr(15, false) ? 2 : 1;
  const rtluPosWord = useArinc429Var(`L:A32NX_FAC_${facSourceForTlu}_RUDDER_TRAVEL_LIMIT_COMMAND`);
  const rtluDisplayAngle = rtluPosWord.value + 2;

  return (
    <>
      <g visibility={rtluPosWord.isNormalOperation() ? 'visible' : 'hidden'}>
        <g id="rudderLeftMaxAngle" transform={`rotate(${rtluDisplayAngle} 0 26)`}>
          <path className={anyTluEngaged ? 'GreenLine' : 'AmberLine'} d="m0 151 l 0 21 l 7 0" />
        </g>

        <g id="rudderRightMaxAngle" transform={`rotate(${-rtluDisplayAngle} 0 26)`}>
          <path className={anyTluEngaged ? 'GreenLine' : 'AmberLine'} d="m0 151 l 0 21 l -7 0" />
        </g>
      </g>
      <g visibility={rtluPosWord.isNormalOperation() ? 'hidden' : 'visible'}>
        <text x="-82" y="180" className="Large Amber Center">
          TLU
        </text>
        <text x="84" y="180" className="Large Amber Center">
          TLU
        </text>
      </g>
    </>
  );
};

const Stabilizer = ({ x, y }: ComponentPositionProps) => (
  <SvgGroup x={x} y={y}>
    <path id="stabLeft" className="LightGreyLine" d="M0 0 l-72,9 l0,-28 l38,-19" />
    <path id="stabRight" className="LightGreyLine" d="M85 0 l72,9 l0,-28 l-38,-19" />
  </SvgGroup>
);

interface AileronElevatorProps {
  fcdcDiscreteWord2: Arinc429Word;
  fcdcDiscreteWord3: Arinc429Word;
}

const Aileron = ({
  x,
  y,
  side,
  leftHydraulicSystem,
  rightHydraulicSystem,
  fcdcDiscreteWord2,
  fcdcDiscreteWord3,
}: ComponentPositionProps & ComponentSidePositionProps & HydraulicSystemPairProps & AileronElevatorProps) => {
  const textPositionX = side === 'left' ? -53 : 54;

  const fcdc1AileronDeflection = useArinc429Var(`L:A32NX_FCDC_1_AILERON_${side.toUpperCase()}_POS`);
  const fcdc2AileronDeflection = useArinc429Var(`L:A32NX_FCDC_2_AILERON_${side.toUpperCase()}_POS`);
  const aileronDeflection = !fcdc1AileronDeflection.isFailureWarning()
    ? fcdc1AileronDeflection
    : fcdc2AileronDeflection;

  const cursorPath = `M0 57 l${side === 'right' ? '-' : ''}15 -9 l0 18Z`;

  const aileronDeflectPctNormalized = (aileronDeflection.valueOr(0) * 68.5) / 25;
  const servcontrol1Avail = fcdcDiscreteWord3.bitValue(side === 'left' ? 11 : 13);
  const servcontrol2Avail = fcdcDiscreteWord3.bitValue(side === 'left' ? 12 : 14);
  const cursorClassName = servcontrol1Avail || servcontrol2Avail ? 'GreenLine' : 'AmberLine';
  const aileronPositionValid = aileronDeflection.isNormalOperation();

  const servcontrol1Fault = fcdcDiscreteWord2.bitValueOr(side === 'left' ? 11 : 13, false);
  const servcontrol2Fault = fcdcDiscreteWord2.bitValueOr(side === 'left' ? 12 : 14, false);

  return (
    <SvgGroup x={x} y={y}>
      <text className="Huge Center" x={textPositionX} y={0}>
        {side === 'left' ? 'L' : 'R'}
      </text>
      <text className="Large Center" x={textPositionX} y={26}>
        AIL
      </text>

      <AileronAxis side={side} x={0} y={8} />

      <SvgGroup x={0} y={aileronDeflectPctNormalized}>
        <path className={cursorClassName} visibility={aileronPositionValid ? 'visible' : 'hidden'} d={cursorPath} />
      </SvgGroup>

      <text
        x={side === 'left' ? 26 : -26}
        y={74}
        visibility={!aileronPositionValid ? 'visible' : 'hidden'}
        className="Large Amber Center"
      >
        XX
      </text>

      <HydraulicIndicator x={side === 'left' ? 27 : -75} y={96} type={leftHydraulicSystem} />
      <HydraulicIndicator x={side === 'left' ? 52 : -50} y={96} type={rightHydraulicSystem} />
      <ServoControlIndicator x={side === 'left' ? 27 : -75} y={96} servoFailed={servcontrol1Fault} />
      <ServoControlIndicator x={side === 'left' ? 52 : -50} y={96} servoFailed={servcontrol2Fault} />
    </SvgGroup>
  );
};

interface ElacSecProps extends ComponentPositionProps {
  num: number;
  fcdcDiscreteWord1: Arinc429Word;
}

const Elac = ({ x, y, num, fcdcDiscreteWord1 }: ElacSecProps) => {
  const infoAvailable = !fcdcDiscreteWord1.isFailureWarning();
  const computerFailed = fcdcDiscreteWord1.bitValueOr(22 + num, false);
  return <ElacSecShape x={x} y={y} num={num} infoAvailable={infoAvailable} computerFailed={computerFailed} />;
};

const Sec = ({ x, y, num, fcdcDiscreteWord1 }: ElacSecProps) => {
  const infoAvailable = !fcdcDiscreteWord1.isFailureWarning();
  const computerFailed = fcdcDiscreteWord1.bitValueOr(num === 3 ? 29 : 24 + num, false);

  return <ElacSecShape x={x} y={y} num={num} infoAvailable={infoAvailable} computerFailed={computerFailed} />;
};

interface ElacSecShapeProps {
  x: number;
  y: number;
  num: number;
  infoAvailable: boolean;
  computerFailed: boolean;
}

const ElacSecShape = ({ x, y, num, infoAvailable, computerFailed }: ElacSecShapeProps) => (
  <SvgGroup x={x} y={y}>
    <path className={!computerFailed || !infoAvailable ? 'LightGreyLine' : 'AmberLine'} d="M0 0 l97,0 l0,-33 l-10,0" />
    <text x={84} y={-7} className={`Large Center ${!computerFailed && infoAvailable ? 'Green' : 'Amber'}`}>
      {infoAvailable ? num : 'X'}
    </text>
  </SvgGroup>
);

const AileronAxis = ({ x, y, side }: ComponentPositionProps & ComponentSidePositionProps) => {
  const d1 = `M0 0 l${side === 'left' ? '-' : ''}6 0 l0 -25 l${
    side === 'right' ? '-' : ''
  }6 0 l0 147 l${side === 'left' ? '-' : ''}6 0 l0 -10 l${side === 'right' ? '-' : ''}6 0`;
  const d2 = `M0 46 l${side === 'left' ? '-' : ''}6 0`;
  const d3 = `M0 52 l${side === 'left' ? '-' : ''}6 0`;
  const d4 = `M0 59 l${side === 'left' ? '-' : ''}6 0 l0 6 l${side === 'right' ? '-' : ''}6 0`;

  return (
    <SvgGroup x={x} y={y}>
      <path className="WhiteLine" d={d1} />
      <path className="WhiteLine" d={d2} />
      <path className="WhiteLine" d={d3} />
      <path className="WhiteLine" d={d4} />
    </SvgGroup>
  );
};

const Elevator = ({
  x,
  y,
  side,
  leftHydraulicSystem,
  rightHydraulicSystem,
  fcdcDiscreteWord2,
  fcdcDiscreteWord3,
}: ComponentPositionProps & ComponentSidePositionProps & HydraulicSystemPairProps & AileronElevatorProps) => {
  const textPositionX = side === 'left' ? -59 : 62;
  const textLetter = side === 'left' ? 'L' : 'R';

  const fcdc1ElevatorDeflection = useArinc429Var(`L:A32NX_FCDC_1_ELEVATOR_${side.toUpperCase()}_POS`);
  const fcdc2ElevatorDeflection = useArinc429Var(`L:A32NX_FCDC_2_ELEVATOR_${side.toUpperCase()}_POS`);
  const elevatorDeflection = !fcdc1ElevatorDeflection.isFailureWarning()
    ? fcdc1ElevatorDeflection
    : fcdc2ElevatorDeflection;
  const elevatorPositionValid = elevatorDeflection.isNormalOperation();

  const cursorPath = `M0,77 l${side === 'right' ? '-' : ''}15,-9 l0,18Z`;

  // Need to scale the "nose down" elevator position up, since the current elevator limits are wrong.
  const elevatorDeflectPctNormalized = (elevatorDeflection.value * 90) / 30;

  const servcontrolLeftAvail = fcdcDiscreteWord3.bitValue(side === 'left' ? 15 : 18);
  const servcontrolRightAvail = fcdcDiscreteWord3.bitValue(side === 'left' ? 16 : 17);
  const cursorClassName = servcontrolLeftAvail || servcontrolRightAvail ? 'GreenLine' : 'AmberLine';

  const servcontrolLeftFault = fcdcDiscreteWord2.bitValueOr(side === 'left' ? 15 : 18, false);
  const servcontrolRightFault = fcdcDiscreteWord2.bitValueOr(side === 'left' ? 16 : 17, false);

  return (
    <SvgGroup x={x} y={y}>
      <text className="Huge Center" x={textPositionX} y={0}>
        {textLetter}
      </text>
      <text className="Large Center" x={textPositionX} y={27}>
        ELEV
      </text>

      <ElevatorAxis side={side} x={0} y={5} />

      <SvgGroup x={0} y={elevatorDeflectPctNormalized}>
        <path
          id={`${side}ElevatorCursor`}
          visibility={elevatorPositionValid ? 'visible' : 'hidden'}
          className={cursorClassName}
          d={cursorPath}
        />
      </SvgGroup>

      <text
        x={side === 'left' ? 26 : -26}
        y={76}
        visibility={!elevatorPositionValid ? 'visible' : 'hidden'}
        className="Amber Large Center"
      >
        XX
      </text>

      <HydraulicIndicator x={side === 'left' ? -78 : 28} y={91} type={leftHydraulicSystem} />
      <HydraulicIndicator x={side === 'left' ? -53 : 53} y={91} type={rightHydraulicSystem} />
      <ServoControlIndicator x={side === 'left' ? -78 : 28} y={91} servoFailed={servcontrolLeftFault} />
      <ServoControlIndicator x={side === 'left' ? -53 : 53} y={91} servoFailed={servcontrolRightFault} />
    </SvgGroup>
  );
};

const ElevatorAxis = ({ x, y, side }: ComponentPositionProps & ComponentSidePositionProps) => {
  const d1 = `M0 -13 l${side === 'left' ? '-' : ''}6 0 l0 -12 l${
    side === 'right' ? '-' : ''
  }6 0 l0 148 l${side === 'left' ? '-' : ''}6 0 l0 -12 l${side === 'right' ? '-' : ''}6 0`;
  const d2 = `M0 69 l${side === 'left' ? '-' : ''}6 0 l0 6 l${side === 'right' ? '-' : ''}6 0`;

  return (
    <SvgGroup x={x} y={y}>
      <path className="WhiteLine" d={d1} />
      <path className="WhiteLine" d={d2} />
    </SvgGroup>
  );
};

interface ServoControlIndicatorProps extends ComponentPositionProps {
  servoFailed: boolean;
}

const ServoControlIndicator = ({ x, y, servoFailed }: ServoControlIndicatorProps) => (
  <SvgGroup x={x} y={y}>
    <path visibility={servoFailed ? 'visible' : 'hidden'} className="AmberLine" d="m 1 29 l 23 0 l 0 -32 l -23 0" />
  </SvgGroup>
);
