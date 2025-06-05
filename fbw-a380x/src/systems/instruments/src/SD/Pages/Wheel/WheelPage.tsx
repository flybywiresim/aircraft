import React from 'react';
import { MoreLabel, PageTitle } from '../Generic/PageTitle';
import { Gear, GearPosition, GearType } from './elements/Gear';

import '../../../index.scss';
import { WheelBogey, WheelBogeyPosition, WheelBogeyType } from './elements/WheelBogey';
import { BrakingSupply } from './elements/BrakingSupply';
import { ControlSystem, ControlSystemType } from './elements/ControlSystem';
import { Accumulator } from './elements/Accumulator';

export const WheelPage = () => {
  const moreActive = false;

  return (
    <>
      <PageTitle x={6} y={29}>
        WHEEL
      </PageTitle>

      <MoreLabel x={157} y={28} moreActive={moreActive} />

      <g id="brk-control" visibility={moreActive ? 'visible' : 'hidden'}>
        <text className="F22 White LS1" x={9} y={110}>
          BRK CTL
        </text>
        <text className="F28 White" x={128} y={112}>
          :
        </text>
        <ControlSystem x={145} y={114} type={ControlSystemType.Braking} number={1} />
        <ControlSystem x={170} y={114} type={ControlSystemType.Braking} number={2} />
        <ControlSystem x={198} y={114} type={ControlSystemType.Braking} number="E" />

        <text className="F26 Amber" x={9} y={144}>
          AUTO BRAKE
        </text>
      </g>

      <g id="steering-control" visibility={moreActive ? 'visible' : 'hidden'}>
        <text className="F22 White LS1" x={482} y={110}>
          STEER CTL
        </text>
        <text className="F28 White" x={631} y={112}>
          :
        </text>
        <ControlSystem x={650} y={114} type={ControlSystemType.Braking} number={1} />
        <ControlSystem x={677} y={114} type={ControlSystemType.Braking} number={2} />
      </g>

      <g id="lgers">
        <Gear x={351} y={59} position={GearPosition.Nose} type={GearType.Nose} />

        <text className="F22 Green WS-6" x={216} y={210} visibility={'hidden'}>
          L/G GRVTY EXTN IN PROGRESS
        </text>

        <text className="F26 Amber" x={482} y={144} visibility={'hidden'}>
          L/G CTL
        </text>

        <path
          className="Grey SW2 NoFill"
          d="m 5,207 l 31,4 m 98,7 c 3,14 14,30 27,34 h 43 m 106,0 h 149 m 106,0 h43 m27,-34 c -3,14 -14,30 -27,34 m 27,-34 m 98,-7 l 31,-4"
        />
        <Gear x={48} y={223} position={GearPosition.Left} type={GearType.WLG} />
        <Gear x={223} y={260} position={GearPosition.Left} type={GearType.BLG} />
        <Gear x={479} y={260} position={GearPosition.Right} type={GearType.BLG} />
        <Gear x={654} y={223} position={GearPosition.Right} type={GearType.WLG} />
      </g>

      <g id="wheels">
        <text className="F24 Cyan" x={370} y={580}>
          °C
        </text>
        <text className="F22 Cyan" x={367} y={634}>
          PSI
        </text>
        <WheelBogey
          x={384}
          y={140}
          position={WheelBogeyPosition.Nose}
          type={WheelBogeyType.Nose}
          moreActive={moreActive}
        />
        <WheelBogey
          x={81}
          y={403}
          position={WheelBogeyPosition.Left}
          type={WheelBogeyType.WLG}
          moreActive={moreActive}
        />
        <WheelBogey
          x={257}
          y={417}
          position={WheelBogeyPosition.Left}
          type={WheelBogeyType.BLG}
          moreActive={moreActive}
        />
        <WheelBogey
          x={513}
          y={417}
          position={WheelBogeyPosition.Right}
          type={WheelBogeyType.BLG}
          moreActive={moreActive}
        />
        <WheelBogey
          x={690}
          y={403}
          position={WheelBogeyPosition.Right}
          type={WheelBogeyType.WLG}
          moreActive={moreActive}
        />
      </g>

      <g id="braking">
        <text className="F22 White" x={366} y={320}>
          BRK
        </text>
        <path className="White SW2 NoFill" d="m 145,311 h 46 m 110,0 h 40 m 88,0 h 40 m 110,0 h 46" />
        <BrakingSupply x={81} y={328} type={WheelBogeyType.WLG} />
        <BrakingSupply x={258} y={328} type={WheelBogeyType.BLG} />
        <BrakingSupply x={513} y={328} type={WheelBogeyType.BLG} />
        <BrakingSupply x={690} y={328} type={WheelBogeyType.WLG} />
      </g>

      <Accumulator x={687} y={602} moreActive={moreActive} />
    </>
  );
};
