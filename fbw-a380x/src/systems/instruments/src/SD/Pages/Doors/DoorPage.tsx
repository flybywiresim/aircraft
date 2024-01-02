import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { PageTitle } from '../Generic/PageTitle';
import A380XDoors from './elements/A380XDoors';
import CabinDoor from './elements/CabinDoor';
import Oxygen from './elements/Oxygen';

import '../../../index.scss';
import CargoDoor from './elements/CargoDoor';

export const DoorPage = () => {
    const [windowLeft] = useSimVar('L:CPT_SLIDING_WINDOW', 'number');
    const [windowRight] = useSimVar('L:FO_SLIDING_WINDOW', 'number');
    const engineRunning = true;
    const sdacActive = true;
    const onGround = true;

    return (
        <>
            <PageTitle x={6} y={29}>DOOR</PageTitle>
            <text x="599" y="28" className="ecam-page-title">OXYGEN</text>
            <Oxygen x={629} y={104} active={sdacActive} onGround={onGround} />

            <path className="White SW3" d="M564,0 l 0,660" />

            <text x={280} y={150} className="White F22 MiddleAlign LS1">MAIN</text>
            <A380XDoors windowLeft={windowLeft === 0} windowRight={windowRight === 0} />
            <text x={281} y={208} className="White F22 MiddleAlign LS1">UPPER</text>

            {/* Cabin Doors */}
            <CabinDoor x={182} y={214} side="L" mainOrUpper="MAIN" doorNumber={1} engineRunning={engineRunning} />
            <CabinDoor x={182} y={327} side="L" mainOrUpper="MAIN" doorNumber={2} engineRunning={engineRunning} />
            <CabinDoor x={182} y={415} side="L" mainOrUpper="MAIN" doorNumber={3} engineRunning={engineRunning} />
            <CabinDoor x={182} y={491} side="L" mainOrUpper="MAIN" doorNumber={4} engineRunning={engineRunning} />
            <CabinDoor x={182} y={634} side="L" mainOrUpper="MAIN" doorNumber={5} engineRunning={engineRunning} />

            <CabinDoor x={363} y={214} side="R" mainOrUpper="MAIN" doorNumber={1} engineRunning={engineRunning} />
            <CabinDoor x={363} y={327} side="R" mainOrUpper="MAIN" doorNumber={2} engineRunning={engineRunning} />
            <CabinDoor x={363} y={415} side="R" mainOrUpper="MAIN" doorNumber={3} engineRunning={engineRunning} />
            <CabinDoor x={363} y={491} side="R" mainOrUpper="MAIN" doorNumber={4} engineRunning={engineRunning} />
            <CabinDoor x={363} y={634} side="R" mainOrUpper="MAIN" doorNumber={5} engineRunning={engineRunning} />

            <CabinDoor x={239} y={364} side="L" mainOrUpper="UPPER" doorNumber={1} engineRunning={engineRunning} />
            <CabinDoor x={239} y={454} side="L" mainOrUpper="UPPER" doorNumber={2} engineRunning={engineRunning} />
            <CabinDoor x={239} y={570} side="L" mainOrUpper="UPPER" doorNumber={3} engineRunning={engineRunning} />

            <CabinDoor x={305} y={364} side="R" mainOrUpper="UPPER" doorNumber={1} engineRunning={engineRunning} />
            <CabinDoor x={305} y={454} side="R" mainOrUpper="UPPER" doorNumber={2} engineRunning={engineRunning} />
            <CabinDoor x={305} y={570} side="R" mainOrUpper="UPPER" doorNumber={3} engineRunning={engineRunning} />

            {/* Cargo Doors */}
            <CargoDoor x={220} y={155} label="AVNCS" width={26} height={21} engineRunning={engineRunning} />
            <CargoDoor x={356} y={242} label="FWD CARGO" width={26} height={48} engineRunning={engineRunning} />
            <CargoDoor x={356} y={506} label="AFT CARGO" width={26} height={40} engineRunning={engineRunning} />
            <CargoDoor x={356} y={580} label="BULK" width={26} height={26} engineRunning={engineRunning} />
        </>
    );
};