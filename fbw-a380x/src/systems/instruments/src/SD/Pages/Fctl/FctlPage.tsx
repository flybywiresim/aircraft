import React, { JSX } from 'react';
import { PageTitle } from '../Generic/PageTitle';

import '../../../index.scss';
import { Flaps, Prims, Secs, Slats } from './elements/ComputerIndication';
import { SlatFlapActuatorIndication } from './elements/SlatFlapActuators';
import { PitchTrim } from './elements/PitchTrim';
import { Elevator, ElevatorPosition, ElevatorSide } from './elements/Elevator';
import { Aileron, AileronPosition, AileronSide } from './elements/Aileron';
import { Rudder, RudderPosition } from './elements/Rudder';
import { RudderTrim } from './elements/RudderTrim';
import { Spoiler, SpoilerSide } from './elements/Spoiler';
import { useSimVar } from '@flybywiresim/fbw-sdk';

export const FctlPage = () => {
  const [onGround] = useSimVar('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'boolean', 500); // TODO: Use better logic

  const spoilersLeft: JSX.Element[] = [];
  const spoilersRight: JSX.Element[] = [];
  for (let i = 0; i < 8; i++) {
    spoilersLeft.push(
      <Spoiler x={147 + 26 * i} y={545} side={SpoilerSide.Left} position={(8 - i) as any} onGround={onGround} />,
    );
    spoilersRight.push(
      <Spoiler x={425 + 26 * i} y={545} side={SpoilerSide.Right} position={(i + 1) as any} onGround={onGround} />,
    );
  }

  return (
    <>
      <PageTitle x={6} y={29}>
        F/CTL
      </PageTitle>

      <image xlinkHref="/Images/fbw-a380x/SD_FCTL_WING.png" x={-2} y={518} width={774} height={204} />
      <image xlinkHref="/Images/fbw-a380x/SD_FCTL_TAIL.png" x={100} y={-15} width={570} height={570} />

      <Prims x={0} y={0} />
      <Secs x={0} y={78} />

      <Slats x={609} y={9} />
      <Flaps x={609} y={78} />

      <PitchTrim x={385} y={273} onGround={onGround} />

      <Elevator x={196} y={212} side={ElevatorSide.Left} position={ElevatorPosition.Outboard} onGround={onGround} />
      <Elevator x={218} y={212} side={ElevatorSide.Left} position={ElevatorPosition.Inboard} onGround={onGround} />
      <Elevator x={536} y={212} side={ElevatorSide.Right} position={ElevatorPosition.Inboard} onGround={onGround} />
      <Elevator x={558} y={212} side={ElevatorSide.Right} position={ElevatorPosition.Outboard} onGround={onGround} />

      <Aileron x={41} y={474} side={AileronSide.Left} position={AileronPosition.Outboard} onGround={onGround} />
      <Aileron x={63} y={474} side={AileronSide.Left} position={AileronPosition.Mid} onGround={onGround} />
      <Aileron x={86} y={474} side={AileronSide.Left} position={AileronPosition.Inboard} onGround={onGround} />
      <Aileron x={670} y={474} side={AileronSide.Right} position={AileronPosition.Inboard} onGround={onGround} />
      <Aileron x={692} y={474} side={AileronSide.Right} position={AileronPosition.Mid} onGround={onGround} />
      <Aileron x={715} y={474} side={AileronSide.Right} position={AileronPosition.Outboard} onGround={onGround} />

      {spoilersLeft}
      {spoilersRight}

      <RudderTrim x={385} y={123} />
      <Rudder x={327} y={108} position={RudderPosition.Upper} onGround={onGround} />
      <Rudder x={327} y={140} position={RudderPosition.Lower} onGround={onGround} />

      <SlatFlapActuatorIndication x={336} y={437} type="SLATS" />
      <SlatFlapActuatorIndication x={336} y={594} type="FLAPS" />
    </>
  );
};
