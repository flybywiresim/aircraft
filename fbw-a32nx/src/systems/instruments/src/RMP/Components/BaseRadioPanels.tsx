// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useState } from 'react';
import { useSimVar, useInteractionSimVar, useInteractionEvent } from '@flybywiresim/fbw-sdk';
import { TransceiverType } from './StandbyFrequency';
import { VhfRadioPanel } from './VhfRadioPanel';
import { NavRadioPanel } from './NavRadioPanel';
import { RadioPanelDisplay } from './RadioPanelDisplay';

interface Props {
  /**
   * The RMP side (e.g. 'L' or 'R').
   */
  side: string;
}

/**
 * Root radio management panel React component.
 * Hooks into toggleSwitch and powerAvailable SimVars.
 * Renders a Powered or Unpowered sub-component.
 */
export const RootRadioPanel = (props: Props) => {
  const toggleSwitchName = `A32NX_RMP_${props.side}_TOGGLE_SWITCH`;
  const [panelSwitch] = useInteractionSimVar(`L:${toggleSwitchName}`, 'Boolean', toggleSwitchName);
  // On the A320 the captain's RMP is powered by the DC ESS BUS. The F/O's RMP by the DC 2 BUS.
  const [powerAvailable] = useSimVar(
    `L:A32NX_ELEC_${props.side === 'L' ? 'DC_ESS' : 'DC_2'}_BUS_IS_POWERED`,
    'Boolean',
    250,
  );
  const powered = powerAvailable && panelSwitch;

  if (!powered) return <UnpoweredRadioPanel />;
  return <PoweredRadioPanel side={props.side} />;
};

/**
 * If a radio panel is unpowered, we render two empty <svg> to ensure the correct vertical spacing.
 * E.g. if left RMP is off but right RMP is on, we need the left RMP space to be reserved.
 */
const UnpoweredRadioPanel = () => (
  <span>
    <svg />
    <svg />
  </span>
);

/**
 * Powered radio management panel React component.
 * Hooks into panelMode SimVar and wires RMP mode buttons.
 * Renders appropriate mode sub-component (e.g. VhfRadioPanel).
 */
const PoweredRadioPanel = (props: Props) => {
  const [navTransceiverType, setNavTransceiverType] = useState(TransceiverType.RADIO_VHF);

  // Used to turn on the associated led
  const [panelMode, setPanelMode] = useSimVar(`L:A32NX_RMP_${props.side}_SELECTED_MODE`, 'Number', 250);
  // Used to determine (in the FGMC for instance) if the system is in NAV backup mode. L and R simvars have to be checked
  const [navButtonPressed, setNavButton] = useSimVar(`L:A32NX_RMP_${props.side}_NAV_BUTTON_SELECTED`, 'boolean', 250);
  // Used to return to the selected VHF once NAV is pushed again
  const [previousPanelMode, setPreviousPanelMode] = useState(panelMode);

  // Hook radio management panel mode buttons to set panelMode SimVar.
  useInteractionEvent(`A32NX_RMP_${props.side}_VHF1_BUTTON_PRESSED`, () => {
    setPanelMode(1);
    setPreviousPanelMode(1);
    setNavTransceiverType(TransceiverType.RADIO_VHF);
  });

  useInteractionEvent(`A32NX_RMP_${props.side}_VHF2_BUTTON_PRESSED`, () => {
    setPanelMode(2);
    setPreviousPanelMode(2);
    setNavTransceiverType(TransceiverType.RADIO_VHF);
  });

  useInteractionEvent(`A32NX_RMP_${props.side}_VHF3_BUTTON_PRESSED`, () => {
    setPanelMode(3);
    setPreviousPanelMode(3);
    setNavTransceiverType(TransceiverType.RADIO_VHF);
  });

  useInteractionEvent(`A32NX_RMP_${props.side}_NAV_BUTTON_PRESSED`, () => {
    if (navButtonPressed) {
      setPanelMode(previousPanelMode);
      setNavTransceiverType(TransceiverType.RADIO_VHF);
    }

    setNavButton(!navButtonPressed);
  });

  useInteractionEvent(`A32NX_RMP_${props.side}_VOR_BUTTON_PRESSED`, () => {
    if (navButtonPressed) {
      setPanelMode(6);
      setNavTransceiverType(TransceiverType.VOR);
    }
  });

  useInteractionEvent(`A32NX_RMP_${props.side}_ILS_BUTTON_PRESSED`, () => {
    if (navButtonPressed) {
      setPanelMode(7);
      setNavTransceiverType(TransceiverType.ILS);
    }
  });

  useInteractionEvent(`A32NX_RMP_${props.side}_GLS_BUTTON_PRESSED`, () => {
    if (navButtonPressed) {
      setPanelMode(8);
      setNavTransceiverType(TransceiverType.GLS);
    }
  });

  useInteractionEvent(`A32NX_RMP_${props.side}_MLS_BUTTON_PRESSED`, () => {
    if (navButtonPressed) {
      setPanelMode(9);
      setNavTransceiverType(TransceiverType.MLS);
    }
  });

  useInteractionEvent(`A32NX_RMP_${props.side}_ADF_BUTTON_PRESSED`, () => {
    if (navButtonPressed) {
      setPanelMode(10);
      setNavTransceiverType(TransceiverType.ADF);
    }
  });

  // This means we're in a VHF communications mode.
  switch (navTransceiverType) {
    case TransceiverType.RADIO_VHF:
      return <VhfRadioPanel side={props.side} vhf={panelMode} />;
    case TransceiverType.VOR:
    case TransceiverType.ILS:
    case TransceiverType.ADF:
      return <NavRadioPanel side={props.side} transceiver={navTransceiverType} />;
    default:
      // If we reach this block, something's gone wrong. We'll just render a broken panel.
      return (
        <span>
          <RadioPanelDisplay value="808.080" />
          <RadioPanelDisplay value="808.080" />
        </span>
      );
  }
};
