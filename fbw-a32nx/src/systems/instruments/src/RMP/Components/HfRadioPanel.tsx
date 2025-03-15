import React from 'react';
import { useSimVar, useInteractionEvent } from '@flybywiresim/fbw-sdk';
import { StandbyFrequency, TransceiverType } from './StandbyFrequency';
import { RadioPanelDisplay } from './RadioPanelDisplay';

interface Props {
  /**
   * The RMP side (e.g. 'L' or 'R').
   */
  side: string;

  /**
   * The HF transceiver mode (HF 1 or 2).
   */
  hf: number;
}

export const HfRadioPanel = (props: Props) => {
  const [active, setActive] = useSimVar(`L:A32NX_RMP_HF${props.hf}_ACTIVE_FREQUENCY`, 'Hz');
  const [standby, setStandby] = useSimVar(`L:A32NX_RMP_${props.side}_HF${props.hf}_STANDBY_FREQUENCY`, 'Hz');

  // Handle Transfer Button Pressed.
  useInteractionEvent(`A32NX_RMP_${props.side}_TRANSFER_BUTTON_PRESSED`, () => {
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
        transceiver={TransceiverType.RADIO_HF}
      />
    </span>
  );
};
