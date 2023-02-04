import React from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';
import FOB from './FOB';
import N2 from './N2';
import EGT from './EGT';
import N1 from './N1';
import FF from './FF';
import N1Limit from './N1Limit';
import Idle from './Idle';
import Slats from './Slats';
import PacksNaiWai from './PacksNaiWai';

const UpperDisplay: React.FC = () => {
    const [unit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [flightPhase] = useSimVar('L:A32NX_FWC_FLIGHT_PHASE', 'enum', 1000);
    const debugFlag = false; // TODO add relevant SimVar when it is created
    const [autothrustMode] = useSimVar('L:A32NX_AUTOTHRUST_MODE', 'enum', 500);

    const [fadecEng1Active] = useSimVar('L:A32NX_FADEC_POWERED_ENG1', 'bool', 500);
    const [fadecEng2Active] = useSimVar('L:A32NX_FADEC_POWERED_ENG2', 'bool', 500);

    return (
        <>
            {/*   */}
            <text className={`Amber Large End ${autothrustMode === 13 ? 'Show' : 'Hide'}`} x={150} y={27}>A.FLOOR</text>
            <PacksNaiWai x={492} y={27} flightPhase={flightPhase} />
            <Idle x={374} y={55} />

            <N1Limit x={698} y={28} active={fadecEng1Active === 1 || fadecEng2Active === 1} />

            <Layer x={0} y={96}>
                <N1 engine={1} x={234} y={0} active={fadecEng1Active === 1} />
                <N1 engine={2} x={534} y={0} active={fadecEng2Active === 1} />
                <text className="Large Center" x={387} y={26}>N1</text>
                <text className="Medium Center Cyan" x={384} y={45}>%</text>
            </Layer>

            <Layer x={0} y={248}>
                <EGT engine={1} x={234} y={0} active={fadecEng1Active === 1} />
                <EGT engine={2} x={533} y={0} active={fadecEng2Active === 1} />
                <text className="Large Center" x={385} y={-16}>EGT</text>
                <text className="Medium Center Cyan" x={379} y={6}>&deg;C</text>
            </Layer>

            <Layer x={0} y={275}>
                <N2 engine={1} x={192} y={0} active={fadecEng1Active === 1} />
                <N2 engine={2} x={493} y={0} active={fadecEng2Active === 1} />
                <text className="Large Center" x={386} y={33}>N2</text>
                <text className="Medium Center Cyan" x={385} y={53}>%</text>
                <line className="Separator" x1="311" y1="37" x2="343" y2="28" strokeLinecap="round" />
                <line className="Separator" x1="424" y1="28" x2="456" y2="37" strokeLinecap="round" />
            </Layer>

            <Layer x={0} y={380}>
                <FF engine={1} x={273} y={0} unit={unit} active={fadecEng1Active === 1} />
                <FF engine={2} x={576} y={0} unit={unit} active={fadecEng2Active === 1} />
                <text className="Large Center" x={386} y={-10}>FF</text>
                <text className="Standard Center Cyan" x={385} y={10}>
                    {unit === '1' ? 'KG' : 'LBS'}
                    /H
                </text>
                <line className="Separator" x1="311" y1="-11" x2="343" y2="-20" strokeLinecap="round" />
                <line className="Separator" x1="424" y1="-20" x2="456" y2="-11" strokeLinecap="round" />
            </Layer>

            <Slats x={539} y={442} />

            <FOB unit={unit} x={40} y={490} />

            {debugFlag && <text className="Medium Center White" x={320} y={528}>{flightPhase}</text>}
        </>
    );
};

export default UpperDisplay;
