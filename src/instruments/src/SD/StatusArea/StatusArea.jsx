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

            <Text title x={410} y={532} alignStart>
                GW
            </Text>
            <Text value x={520} y={532} alignEnd>
                {Math.round(gw)}
            </Text>
            <Text unit x={556} y={532}>
                KG
            </Text>
        </>
    );
};
