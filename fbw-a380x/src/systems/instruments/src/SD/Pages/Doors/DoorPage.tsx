import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { PageTitle } from '../Generic/PageTitle';
import Outline from './elements/Outline';
import CabinDoor from './elements/CabinDoor';
import Oxygen from './elements/Oxygen';

import '../../../index.scss';
import CargoDoor from './elements/CargoDoor';

export const DoorPage = () => {
  const [windowLeft] = useSimVar('L:CPT_SLIDING_WINDOW', 'number');
  const [windowRight] = useSimVar('L:FO_SLIDING_WINDOW', 'number');
  // TODO replace once proper slide implementation & fadec
  const [beaconOn] = useSimVar('LIGHT BEACON ON', 'bool', 1000);
  const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'enum', 1000);
  const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'enum', 1000);
  const [engine3State] = useSimVar('L:A32NX_ENGINE_STATE:3', 'enum', 1000);
  const [engine4State] = useSimVar('L:A32NX_ENGINE_STATE:4', 'enum', 1000);
  const engineRunning = engine1State === 1 || engine2State === 1 || engine3State === 1 || engine4State === 1;
  const sdacActive = true;
  const onGround = true;
  const [fwdCargoClosed] = useSimVar('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'bool', 1000);
  const [aftCargoClosed] = useSimVar('L:A32NX_AFT_DOOR_CARGO_LOCKED', 'bool', 1000);

  return (
    <>
      <PageTitle x={6} y={29}>
        DOOR
      </PageTitle>
      <text x="599" y="29" className="F36 White TextUnderline">
        OXYGEN
      </text>
      <Oxygen x={634} y={108} active={sdacActive} onGround={onGround} />

      <path className="White SW3 StrokeRound" d="M567,2 l 0,659" />

      <text x={285} y={159} className="White F22 MiddleAlign LS1">
        MAIN
      </text>
      <Outline windowLeft={windowLeft === 0} windowRight={windowRight === 0} />
      <text x={285} y={216} className="White F22 MiddleAlign LS1">
        UPPER
      </text>

      {/* Cabin Doors */}
      <CabinDoor
        x={183}
        y={201}
        side="L"
        mainOrUpper="MAIN"
        doorNumber={1}
        engineRunning={engineRunning}
        interactivePoint={0}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={183}
        y={314}
        side="L"
        mainOrUpper="MAIN"
        doorNumber={2}
        engineRunning={engineRunning}
        interactivePoint={2}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={183}
        y={402}
        side="L"
        mainOrUpper="MAIN"
        doorNumber={3}
        engineRunning={engineRunning}
        interactivePoint={4}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={183}
        y={477}
        side="L"
        mainOrUpper="MAIN"
        doorNumber={4}
        engineRunning={engineRunning}
        interactivePoint={6}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={183}
        y={621}
        side="L"
        mainOrUpper="MAIN"
        doorNumber={5}
        engineRunning={engineRunning}
        interactivePoint={8}
        slideArmed={beaconOn}
      />

      <CabinDoor
        x={368}
        y={201}
        side="R"
        mainOrUpper="MAIN"
        doorNumber={1}
        engineRunning={engineRunning}
        interactivePoint={1}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={368}
        y={314}
        side="R"
        mainOrUpper="MAIN"
        doorNumber={2}
        engineRunning={engineRunning}
        interactivePoint={3}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={368}
        y={402}
        side="R"
        mainOrUpper="MAIN"
        doorNumber={3}
        engineRunning={engineRunning}
        interactivePoint={5}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={368}
        y={477}
        side="R"
        mainOrUpper="MAIN"
        doorNumber={4}
        engineRunning={engineRunning}
        interactivePoint={7}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={368}
        y={621}
        side="R"
        mainOrUpper="MAIN"
        doorNumber={5}
        engineRunning={engineRunning}
        interactivePoint={9}
        slideArmed={beaconOn}
      />

      <CabinDoor
        x={239}
        y={350}
        side="L"
        mainOrUpper="UPPER"
        doorNumber={1}
        engineRunning={engineRunning}
        interactivePoint={10}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={239}
        y={440}
        side="L"
        mainOrUpper="UPPER"
        doorNumber={2}
        engineRunning={engineRunning}
        interactivePoint={12}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={239}
        y={556}
        side="L"
        mainOrUpper="UPPER"
        doorNumber={3}
        engineRunning={engineRunning}
        interactivePoint={14}
        slideArmed={beaconOn}
      />

      <CabinDoor
        x={310}
        y={350}
        side="R"
        mainOrUpper="UPPER"
        doorNumber={1}
        engineRunning={engineRunning}
        interactivePoint={11}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={310}
        y={440}
        side="R"
        mainOrUpper="UPPER"
        doorNumber={2}
        engineRunning={engineRunning}
        interactivePoint={13}
        slideArmed={beaconOn}
      />
      <CabinDoor
        x={310}
        y={556}
        side="R"
        mainOrUpper="UPPER"
        doorNumber={3}
        engineRunning={engineRunning}
        interactivePoint={15}
        slideArmed={beaconOn}
      />

      {/* Cargo Doors */}
      <CargoDoor x={222} y={165} label="AVNCS" width={27} height={20} engineRunning={engineRunning} closed={true} />
      <CargoDoor
        x={359}
        y={250}
        label="FWD CARGO"
        width={26}
        height={46}
        engineRunning={engineRunning}
        closed={fwdCargoClosed}
      />
      <CargoDoor
        x={359}
        y={515}
        label="AFT CARGO"
        width={26}
        height={42}
        engineRunning={engineRunning}
        closed={aftCargoClosed}
      />
      <CargoDoor x={359} y={590} label="BULK" width={26} height={26} engineRunning={engineRunning} closed={true} />
    </>
  );
};
