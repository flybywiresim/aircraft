import React, { FC } from 'react';
import { useSimVar } from '../../Common/simVars';
import { Layer } from './Layer';

type MessageAreaProps = {
    showSquawk: boolean;
}

export const MessageArea: FC<MessageAreaProps> = (props) => {
    const [squawkCode, setSquawkCode] = useSimVar('TRANSPONDER CODE', 'BCO16');
    return (
        <Layer x={0} y={934}>
            <line x1="10" y1="0" x2="1654" y2="0" stroke="white" strokeWidth={6} />
            {props.showSquawk && <text x={15} y={45} fontSize={40} fontFamily="RMP-10" fill="white" dominantBaseline="middle">{`SQUAWK : ${squawkCode}`}</text>}
        </Layer>
    );
};
