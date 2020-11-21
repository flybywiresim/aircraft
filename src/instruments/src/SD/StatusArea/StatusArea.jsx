import './StatusArea.scss';
import { useState } from 'react';
import { Text } from '../Text/Text.jsx';
import { getSimVar, useUpdate } from '../../util.mjs';

export const StatusArea = () => {
    const [gw, setGw] = useState(0);

    useUpdate(() => setGw(getSimVar('TOTAL WEIGHT', 'kg')));

    return (
        <>
            <path className="sd-status-line" d="M 0   510 h 600" />
            <path className="sd-status-line" d="M 200 510 v 100" />
            <path className="sd-status-line" d="M 400 510 v 100" />

            <Text title x={415} y={534} alignStart>
                GW
            </Text>
            <Text value x={535} y={534} alignEnd>
                {Math.round(gw)}
            </Text>
            <Text unit x={570} y={534} alignEnd>
                KG
            </Text>
        </>
    );
};
