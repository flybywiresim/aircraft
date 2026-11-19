import { ConsumerSubject, FSComponent } from '@microsoft/msfs-sdk';
import { PageTitle } from '../Generic/PageTitle';
import { DestroyableComponent } from '../../../MsfsAvionicsCommon/DestroyableComponent';

import '../../../index.scss';
import { Flaps, Prims, Secs, Slats } from './elements/ComputerIndication';
import { SlatFlapActuatorIndication } from './elements/SlatFlapActuators';
import { PitchTrim } from './elements/PitchTrim';
import { Elevator, ElevatorPosition, ElevatorSide } from './elements/Elevator';
import { Aileron, AileronPosition, AileronSide } from './elements/Aileron';
import { Rudder, RudderPosition } from './elements/Rudder';
import { RudderTrim } from './elements/RudderTrim';
import { Spoiler, SpoilerSide } from './elements/Spoiler';
import { SdPageProps } from '../../SD';
import { SDSimvars } from '../../SDSimvarPublisher';

export class FctlPage extends DestroyableComponent<SdPageProps> {
  private readonly onGround = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on('lgciu1LeftGearCompressed'),
    false,
  ); // TODO: Use better logic

  private readonly topSvgDisplay = this.props.visible.map((v) => (v ? 'inline' : 'none'));

  destroy(): void {
    super.destroy();
  }

  render() {
    const spoilersLeft: JSX.Element[] = [];
    const spoilersRight: JSX.Element[] = [];
    for (let i = 0; i < 8; i++) {
      spoilersLeft.push(
        <Spoiler
          x={147 + 26 * i}
          y={545}
          side={SpoilerSide.Left}
          position={(8 - i) as any}
          onGround={this.onGround}
          bus={this.props.bus}
        />,
      );
      spoilersRight.push(
        <Spoiler
          x={425 + 26 * i}
          y={545}
          side={SpoilerSide.Right}
          position={(i + 1) as any}
          onGround={this.onGround}
          bus={this.props.bus}
        />,
      );
    }

    return (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 768 1024"
        style={{ display: this.topSvgDisplay }}
      >
        <PageTitle x={6} y={29}>
          F/CTL
        </PageTitle>

        <image xlink:href="/Images/fbw-a380x/SD_FCTL_WING.png" x={-2} y={518} width={774} height={204} />
        <image xlink:href="/Images/fbw-a380x/SD_FCTL_TAIL.png" x={100} y={-15} width={570} height={570} />

        <Prims x={0} y={0} bus={this.props.bus} />
        <Secs x={0} y={78} bus={this.props.bus} />

        <Slats x={609} y={9} bus={this.props.bus} />
        <Flaps x={609} y={78} bus={this.props.bus} />

        <PitchTrim x={385} y={273} onGround={this.onGround} bus={this.props.bus} />

        <Elevator
          x={196}
          y={212}
          side={ElevatorSide.Left}
          position={ElevatorPosition.Outboard}
          onGround={this.onGround}
          bus={this.props.bus}
        />
        <Elevator
          x={218}
          y={212}
          side={ElevatorSide.Left}
          position={ElevatorPosition.Inboard}
          onGround={this.onGround}
          bus={this.props.bus}
        />
        <Elevator
          x={536}
          y={212}
          side={ElevatorSide.Right}
          position={ElevatorPosition.Inboard}
          onGround={this.onGround}
          bus={this.props.bus}
        />
        <Elevator
          x={558}
          y={212}
          side={ElevatorSide.Right}
          position={ElevatorPosition.Outboard}
          onGround={this.onGround}
          bus={this.props.bus}
        />

        <Aileron
          x={41}
          y={474}
          side={AileronSide.Left}
          position={AileronPosition.Outboard}
          onGround={this.onGround}
          bus={this.props.bus}
        />
        <Aileron
          x={63}
          y={474}
          side={AileronSide.Left}
          position={AileronPosition.Mid}
          onGround={this.onGround}
          bus={this.props.bus}
        />
        <Aileron
          x={86}
          y={474}
          side={AileronSide.Left}
          position={AileronPosition.Inboard}
          onGround={this.onGround}
          bus={this.props.bus}
        />
        <Aileron
          x={670}
          y={474}
          side={AileronSide.Right}
          position={AileronPosition.Inboard}
          onGround={this.onGround}
          bus={this.props.bus}
        />
        <Aileron
          x={692}
          y={474}
          side={AileronSide.Right}
          position={AileronPosition.Mid}
          onGround={this.onGround}
          bus={this.props.bus}
        />
        <Aileron
          x={715}
          y={474}
          side={AileronSide.Right}
          position={AileronPosition.Outboard}
          onGround={this.onGround}
          bus={this.props.bus}
        />

        {spoilersLeft}
        {spoilersRight}

        <RudderTrim x={385} y={123} bus={this.props.bus} />
        <Rudder x={327} y={108} position={RudderPosition.Upper} onGround={this.onGround} bus={this.props.bus} />
        <Rudder x={327} y={140} position={RudderPosition.Lower} onGround={this.onGround} bus={this.props.bus} />

        <SlatFlapActuatorIndication x={336} y={437} type="SLATS" bus={this.props.bus} />
        <SlatFlapActuatorIndication x={336} y={594} type="FLAPS" bus={this.props.bus} />
      </svg>
    );
  }
}
