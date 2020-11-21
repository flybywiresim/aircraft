import './StatusArea.scss';
import { Text } from '../Text/Text.jsx';
import { useGlobalVar, useSimVar } from '../../util.mjs';

export const StatusArea = () => {
    const gw = useSimVar('TOTAL WEIGHT', 'kg');
    const zulu = useGlobalVar('ZULU TIME', 'seconds');

    const seconds = Math.floor(zulu);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - (hours * 3600)) / 60);

    return (
        <>
            <path className="sd-status-line" d="M 0   510 h 600" />
            <path className="sd-status-line" d="M 200 510 v 100" />
            <path className="sd-status-line" d="M 400 510 v 100" />

            {/* Time */}

            <Text bigValue x={251} y={560} alignStart>{hours}</Text>
            <Text unit x={290} y={560} alignStart>H</Text>
            <Text value x={316} y={560} alignStart>{minutes}</Text>

            {/* Gross weight */}

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
