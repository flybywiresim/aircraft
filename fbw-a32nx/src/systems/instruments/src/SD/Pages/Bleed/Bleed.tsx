// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useEffect, useState } from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { PageTitle } from '../../Common/PageTitle';
import { EcamPage } from '../../Common/EcamPage';
import EngineBleed from './elements/EngineBleed';
import Valve from './elements/Valve';
import APUValve from './elements/APUValve';
import { Triangle } from '../../Common/Shapes';

import './Bleed.scss';

const useConfirmedState = (state: boolean, confirmationTime: number, initialState: boolean = false) => {
  const [confirmedState, setConfirmedState] = useState(initialState);

  useEffect(() => {
    if (state) {
      const timeout = setTimeout(() => {
        setConfirmedState(true);
      }, confirmationTime);

      return () => clearTimeout(timeout);
    }
    setConfirmedState(false);

    return () => {};
  }, [state]);

  return confirmedState;
};

export const BleedPage: FC = () => {
  const sdacDatum = true;
  const [xbleedAirValveFullyOpen] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_FULLY_OPEN', 'bool', 500);
  const [xbleedAirValveFullyClosed] = useSimVar('L:A32NX_PNEU_XBLEED_VALVE_FULLY_CLOSED', 'bool', 500);
  const xbleedAirValveInTransit = !xbleedAirValveFullyOpen && !xbleedAirValveFullyClosed;
  const xbleedAirValveFullyOpenAndClosed = xbleedAirValveFullyOpen && xbleedAirValveFullyClosed;
  let xbleedAirValvePosition: 'V' | 'H' | 'D' = 'D';
  if (xbleedAirValveFullyOpen) {
    xbleedAirValvePosition = 'H';
  } else if (xbleedAirValveFullyClosed) {
    xbleedAirValvePosition = 'V';
  }

  const [engine1PRValveOpen] = useSimVar('L:A32NX_PNEU_ENG_1_PR_VALVE_OPEN', 'bool', 500);
  const engine1PRValveFullyClosed5s = useConfirmedState(!engine1PRValveOpen, 5_000, !engine1PRValveOpen);
  const [engine2PRValveOpen] = useSimVar('L:A32NX_PNEU_ENG_2_PR_VALVE_OPEN', 'bool', 500);
  const engine2PRValveFullyClosed5s = useConfirmedState(!engine2PRValveOpen, 5_000, !engine2PRValveOpen);
  const [apuBleedAirValveOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool', 500);
  const [apuMasterSwitchOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool', 500);
  const [apuIsAvailable] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'bool', 500);
  const [packFlowValve1Open] = useSimVar('L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN', 'bool', 500);
  const [packFlowValve2Open] = useSimVar('L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN', 'bool', 500);
  const [ramAirToggle] = useSimVar('L:A32NX_AIRCOND_RAMAIR_TOGGLE', 'bool', 500);
  const leftPrValveLowRegulation = false; // TODO: Implement
  const rightPrValveLowRegulation = false; // TODO: Implement

  const leftVerticalDuctColour =
    xbleedAirValveFullyClosed &&
    (!apuBleedAirValveOpen || (!apuMasterSwitchOn && !apuIsAvailable)) &&
    !engine1PRValveOpen &&
    leftPrValveLowRegulation &&
    sdacDatum
      ? 'Amber'
      : 'Green';
  const leftHorizontalDuct =
    xbleedAirValveFullyClosed && (!apuBleedAirValveOpen || (!apuMasterSwitchOn && !apuIsAvailable))
      ? 'Hide'
      : 'GreenLine';
  const rightVerticalDuctColour =
    xbleedAirValveFullyClosed && !engine2PRValveOpen && rightPrValveLowRegulation && sdacDatum ? 'Amber' : 'Green';
  const indicationBleedUsers = !packFlowValve1Open && !packFlowValve2Open && ramAirToggle === 0 ? 'Amber' : 'Green';

  const [left1LandingGear] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool', 1000);
  const [right1LandingGear] = useSimVar('L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED', 'bool', 1000);
  const aircraftOnGround: boolean = left1LandingGear === 1 || right1LandingGear === 1;

  const [wingAntiIceOn] = useSimVar('L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON', 'bool', 500);
  const [wingAntiIceTimer] = useSimVar('L:A32NX_PNEU_WING_ANTI_ICE_GROUND_TIMER', 'number', 1000);

  return (
    <EcamPage name="main-bleed">
      <PageTitle x={6} y={18} text="BLEED" />

      {/* Indication of bleed users */}
      <Triangle x={185} y={24} colour={indicationBleedUsers} orientation={0} fill={0} scale={0.75} />
      <Triangle x={300} y={24} colour={indicationBleedUsers} orientation={0} fill={0} scale={0.75} />
      <Triangle x={429} y={24} colour={indicationBleedUsers} orientation={0} fill={0} scale={0.75} />
      <path className={`${indicationBleedUsers}Line`} d="M 135,62 l 0,-19 l 329,0 l 0,19" />

      {/* Ram air */}
      <path className={ramAirToggle === 1 || !sdacDatum ? 'GreenLine' : 'Hide'} d="M 300,78 l 0,-35" />
      <Valve
        x={300}
        y={93}
        radius={15}
        css={aircraftOnGround && ramAirToggle === 1 ? 'AmberLine' : 'GreenLine'}
        position={ramAirToggle === 1 ? 'V' : 'H'}
        sdacDatum={sdacDatum}
      />
      <path className="GreenLine" d="M 300,108 l 0,19" />
      <text className="Large White Center" x={300} y={145}>
        RAM
      </text>
      <text className="Large White Center" x={300} y={166}>
        AIR
      </text>

      {/* Cross Bleed Duct  */}
      <g id="cross-bleed">
        <path className={`${leftVerticalDuctColour}Line`} d="M 135, 227 l 0,82" />
        <path className={leftHorizontalDuct} d="M 135,267 l 165,0" />
        <path className={!xbleedAirValveFullyClosed ? 'GreenLine' : 'Hide'} d={`M ${300},${267} l 40,0`} />
        <path className={!xbleedAirValveFullyClosed ? 'GreenLine' : 'Hide'} d="M 370,267 l 94,0" />
        <Valve
          x={355}
          y={267}
          radius={15}
          css={xbleedAirValveInTransit ? 'AmberLine' : 'GreenLine'}
          position={xbleedAirValvePosition}
          sdacDatum={sdacDatum || xbleedAirValveFullyOpenAndClosed}
        />
        <path className={`${rightVerticalDuctColour}Line`} d={`M ${464},${227} l 0,82`} />
      </g>

      {/* APU */}
      <APUValve x={300} y={338} sdacDatum={sdacDatum} />

      <EngineBleed
        x={135}
        y={62}
        engine={1}
        sdacDatum={sdacDatum}
        enginePRValveOpen={!engine1PRValveFullyClosed5s}
        packFlowValveOpen={packFlowValve1Open}
        onGround={aircraftOnGround}
        wingAntiIceOn={wingAntiIceOn === 1}
        wingAntiIceTimer={wingAntiIceTimer}
      />
      <EngineBleed
        x={464}
        y={62}
        engine={2}
        sdacDatum={sdacDatum}
        enginePRValveOpen={!engine2PRValveFullyClosed5s}
        packFlowValveOpen={packFlowValve2Open}
        onGround={aircraftOnGround}
        wingAntiIceOn={wingAntiIceOn === 1}
        wingAntiIceTimer={wingAntiIceTimer}
      />

      {/* Ground Supply of Compressed Air */}
      <g id="CompressedAir" className={aircraftOnGround ? 'Show' : 'Hide'}>
        <Triangle x={248} y={274} colour="White" orientation={0} fill={0} scale={0.75} />
        <text className="Medium White Center" x={250} y={306}>
          GND
        </text>
      </g>
    </EcamPage>
  );
};
