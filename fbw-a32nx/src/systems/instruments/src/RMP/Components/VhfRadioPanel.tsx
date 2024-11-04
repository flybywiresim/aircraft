// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect } from 'react';
import {
  useSplitSimVar,
  useInteractionEvent,
  Arinc429Register,
  Arinc429SignStatusMatrix,
  RadioUtils,
  useArinc429Var,
} from '@flybywiresim/fbw-sdk';
import { StandbyFrequency, TransceiverType } from './StandbyFrequency';
import { RadioPanelDisplay } from './RadioPanelDisplay';

interface Props {
  /**
   * The RMP side (e.g. 'L' or 'R').
   */
  side: string;

  /**
   * The VHF transceiver mode (VHF 1, 2, or 3).
   */
  vhf: number;
}

/**
 * React hook for the active VHF frequency SimVar, set via a K SimVar.
 * @param transceiver The VHF transceiver to use (VHF 1, 2, or 3).
 */
const useActiveVhfFrequency = (transceiver: number) => {
  const variableReadName = `COM ACTIVE FREQUENCY:${transceiver}`;
  const variableWriteName = `K:COM${transceiver === 1 ? '' : transceiver}_RADIO_SET_HZ`;
  return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Hz', 100);
};

/**
 * React hook for the standby VHF frequency SimVar, set via a K SimVar.
 * A custom SimVar is used for abnormal side/transceiver pairs (e.g. VHF 2 for left RMP).
 * @param side The RMP side (e.g. 'L' or 'R').
 * @param transceiver The VHF transceiver to use (VHF 1, 2, or 3).
 */
const useStandbyVhfFrequency = (side: string, transceiver: number) => {
  let variableReadName = `COM STANDBY FREQUENCY:${transceiver}`;
  let variableWriteName = `K:COM${transceiver === 1 ? '' : transceiver}_STBY_RADIO_SET_HZ`;

  // Use custom SimVars for abnormal standby frequency.
  // Allows true-to-life independent standby frequencies per RMP.
  // Be sure to update this if if we ever add a third "C"-side RMP.
  if ((side === 'L' && transceiver !== 1) || (side === 'R' && transceiver !== 2)) {
    variableReadName = `L:A32NX_RMP_${side}_VHF${transceiver}_STANDBY_FREQUENCY`;
    variableWriteName = variableReadName;
  }

  return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Hz', 100);
};

/**
 * VHF radio management panel React component.
 * Hooks into the mode active and standby frequency SimVars and wires transfer button.
 * Renders active frequency RadioPanelDisplay and appropriate StandbyFrequency sub-components.
 */
export const VhfRadioPanel = (props: Props) => {
  const [active, setActive] = useActiveVhfFrequency(props.vhf);
  const [standby, setStandby] = useStandbyVhfFrequency(props.side, props.vhf);
  const atsuFrequency = useArinc429Var('L:A32NX_ATSU_RMP_FREQUENCY');
  const [, setValueOppositePanelStandby] =
    props.side === 'L' ? useStandbyVhfFrequency('R', 3) : useStandbyVhfFrequency('L', 3);

  useEffect(() => {
    let modeId = 0;
    if (atsuFrequency.ssm === Arinc429SignStatusMatrix.NormalOperation) {
      modeId = 32;
    }

    SimVar.SetSimVarValue(`L:A32NX_RMP_${props.side}_AVAILABLE_MODE`, 'enum', modeId);
  }, [atsuFrequency]);

  // handle the load button
  useInteractionEvent(`A32NX_RMP_${props.side}_LOAD_BUTTON_PRESSED`, () => {
    const availableMode = SimVar.GetSimVarValue(`L:A32NX_RMP_${props.side}_AVAILABLE_MODE`, 'enum');

    // store the frequency as the new standby frequency
    if (atsuFrequency.ssm === Arinc429SignStatusMatrix.NormalOperation && availableMode === 32) {
      setStandby(RadioUtils.unpackVhfComFrequencyFromArincToHz(atsuFrequency.value));
      Arinc429Register.empty().writeToSimVar('L:A32NX_ATSU_RMP_FREQUENCY');
    }
  });

  // Handle Transfer Button Pressed.
  useInteractionEvent(`A32NX_RMP_${props.side}_TRANSFER_BUTTON_PRESSED`, () => {
    // Force the standby opposite side otherwise we would lose the frequency/data format
    // Otherwise it would become frequency/frequency
    if (props.vhf === 3) {
      setValueOppositePanelStandby(active);
    }
    setActive(standby);
    setStandby(active);
  });

  return (
    <span>
      <RadioPanelDisplay value={active} />
      <StandbyFrequency
        side={props.side}
        value={standby}
        setValue={setStandby}
        transceiver={TransceiverType.RADIO_VHF}
      />
    </span>
  );
};
