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
            <PageTitle showMore={false} x={5} y={28}>DOOR</PageTitle>
            <text x='599' y='28' className='EcamPageTitle'>OXYGEN</text>
            <Oxygen x={634} y={108} active={sdacActive} onGround={onGround} />

            <path className='White SW3 StrokeRound' d='M567,2 l 0,659' />

            <text x={285} y={159} className='White F22 MiddleAlign LS1'>MAIN</text>
            <A380XDoors windowLeft={windowLeft === 0} windowRight={windowRight === 0} />
            <text x={285} y={216} className='White F22 MiddleAlign LS1'>UPPER</text>

            {/* Cabin Doors */}
            <CabinDoor x={183} y={201} side='L' mainOrUpper='MAIN' doorNumber={1} engineRunning={engineRunning} />
            <CabinDoor x={183} y={314} side='L' mainOrUpper='MAIN' doorNumber={2} engineRunning={engineRunning} />
            <CabinDoor x={183} y={402} side='L' mainOrUpper='MAIN' doorNumber={3} engineRunning={engineRunning} />
            <CabinDoor x={183} y={477} side='L' mainOrUpper='MAIN' doorNumber={4} engineRunning={engineRunning} />
            <CabinDoor x={183} y={621} side='L' mainOrUpper='MAIN' doorNumber={5} engineRunning={engineRunning} />

            <CabinDoor x={368} y={201} side='R' mainOrUpper='MAIN' doorNumber={1} engineRunning={engineRunning} />
            <CabinDoor x={368} y={314} side='R' mainOrUpper='MAIN' doorNumber={2} engineRunning={engineRunning} />
            <CabinDoor x={368} y={402} side='R' mainOrUpper='MAIN' doorNumber={3} engineRunning={engineRunning} />
            <CabinDoor x={368} y={477} side='R' mainOrUpper='MAIN' doorNumber={4} engineRunning={engineRunning} />
            <CabinDoor x={368} y={621} side='R' mainOrUpper='MAIN' doorNumber={5} engineRunning={engineRunning} />

            <CabinDoor x={239} y={350} side='L' mainOrUpper='UPPER' doorNumber={1} engineRunning={engineRunning} />
            <CabinDoor x={239} y={440} side='L' mainOrUpper='UPPER' doorNumber={2} engineRunning={engineRunning} />
            <CabinDoor x={239} y={556} side='L' mainOrUpper='UPPER' doorNumber={3} engineRunning={engineRunning} />

            <CabinDoor x={310} y={350} side='R' mainOrUpper='UPPER' doorNumber={1} engineRunning={engineRunning} />
            <CabinDoor x={310} y={440} side='R' mainOrUpper='UPPER' doorNumber={2} engineRunning={engineRunning} />
            <CabinDoor x={310} y={556} side='R' mainOrUpper='UPPER' doorNumber={3} engineRunning={engineRunning} />

            {/* Cargo Doors */}
            <CargoDoor x={222} y={165} label='AVNCS' width={27} height={20} engineRunning={engineRunning} />
            <CargoDoor x={359} y={250} label='FWD CARGO' width={26} height={46} engineRunning={engineRunning} />
            <CargoDoor x={359} y={515} label='AFT CARGO' width={26} height={40} engineRunning={engineRunning} />
            <CargoDoor x={359} y={590} label='BULK' width={26} height={26} engineRunning={engineRunning} />
        </>
    );
};
