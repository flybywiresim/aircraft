import React, { FC, useState } from 'react';
import { ActiveFrequency } from '../Components/ActiveFrequency';
import { StandbyFrequency } from '../Components/StandbyFrequency';
import { TextRow } from '../Components/TextRow';
import { useInteractionEvent } from '../../Common/hooks';
import { Layer } from '../Components/Layer';
import { Arrow } from '../Components/Arrow';

type HfTransceiverLabelProps = {
    x?: number;
    y?: number;
    text: string;
}

type HfCellProps = {
    y?: number;
    transceiver: number;
    enabled: boolean;
}

const HfTransceiverLabel: FC<HfTransceiverLabelProps> = (props) => (
    <text x={props.x} y={props.y} fontSize={80} fontFamily="RMP-13" fill="white" dominantBaseline="right">
        {props.text}
    </text>
);

const HfCell: FC<HfCellProps> = (props) => (
    <Layer x={0} y={props.y}>
        <ActiveFrequency x={30} y={180} value={props.transceiver === 2 ? 'DATA' : '12.020'} />
        <HfTransceiverLabel x={850} y={150} text={`HF${props.transceiver}`} />
        <StandbyFrequency x={1075} y={70} value="18.100" selected={props.enabled} />
        {/* {props.enabled && <Arrow x={50} y={30} angle={0} />} */}
        <line x1="30" y1="311" x2="1664" y2="311" stroke="white" strokeWidth={10} />
    </Layer>
);

const AmToggleCell = (props) => (
    <TextRow right={props.amEnabled ? 'HF1 AM ON: SELECT OFF*' : 'HF1 AM SELECT ON*'} rightFill="cyan" />
);

export const HfPage = () => {
    const [amEnabled, setAmEnabled] = useState(false);
    const [currentHf, setCurrentHF] = useState(1);
    useInteractionEvent('A380X_RMPL_LSK1_PRESSED', () => setCurrentHF(1));
    useInteractionEvent('A380X_RMPL_LSK2_PRESSED', () => setCurrentHF(2));
    useInteractionEvent('A380X_RMPL_LSK3_PRESSED', () => setAmEnabled((old) => !old));
    return (
        <Layer>
            <HfCell enabled={currentHf === 1} transceiver={1} />
            <HfCell enabled={currentHf === 2} y={311} transceiver={2} />
            <AmToggleCell amEnabled={amEnabled} />
        </Layer>
    );
};
