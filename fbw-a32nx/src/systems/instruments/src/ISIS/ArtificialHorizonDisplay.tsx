import { DisplayComponent, EventBus, FSComponent } from '@microsoft/msfs-sdk';
import { ArtificialHorizon } from './ArtificialHorizon';

type ArtificialHorizonDisplayProps = {
    bus: EventBus,
   // bugs: Bug[]
}

export class ArtificialHorizonDisplay extends DisplayComponent<ArtificialHorizonDisplayProps> {
/*     const [alt] = useSimVar('INDICATED ALTITUDE:2', 'feet');

    const [mda] = useSimVar('L:A32NX_MINIMUM_DESCENT_ALTITUDE', 'feet'); */

    render() {
        return (
            <svg id="ISIS" class="ISIS" version="1.1" viewBox="0 0 512 512">
                <g id="ArtificialHorizonDisplay">
                    <ArtificialHorizon bus={this.props.bus} />
                    {/*   <AirspeedIndicator indicatedAirspeed={indicatedAirspeed} bugs={bugs.filter(({ isActive, type }) => isActive && type === BugType.SPD)} />
            <AltitudeIndicator altitude={Math.floor(alt)} mda={mda} bugs={bugs.filter(({ isActive, type }) => isActive && type === BugType.ALT)} />
            <AirplaneSymbol />
            <LandingSystem />
            <PressureIndicator />
            <MachIndicator /> */}
                </g>
            </svg>
        );
    }
}
