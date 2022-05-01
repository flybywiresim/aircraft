import { FSComponent, DisplayComponent, Subscribable, VNode, Subject } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { Airplane } from '../../shared/Airplane';
import { PlanModeUnderlay } from './PlanModeUnderlay';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { NDPage } from '../NDPage';

export interface PlanModePageProps {
    aircraftTrueHeading: Subscribable<Arinc429Word>,
    mapCenterLat: Subscribable<number>,
    mapCenterLong: Subscribable<number>,
    mapRangeRadius: Subscribable<number>,
}

export class PlanModePage extends DisplayComponent<PlanModePageProps> implements NDPage {
    public isVisible = Subject.create(false);

    private planeX = Subject.create(0);

    private planeY = Subject.create(0);

    private planeRotation = Subject.create(0);

    private planeAvailable = Subject.create(false);

    private readonly mapParams = new MapParameters();

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.props.aircraftTrueHeading.sub((v) => {
            if (v.isNormalOperation()) {
                this.planeRotation.set(v.value);
            } else {
                this.planeAvailable.set(false);
            }
        });

        this.props.mapCenterLat.sub(() => {
            this.handleRecomputeMapParameters();
            this.handlePpos();
        });

        this.props.mapCenterLong.sub(() => {
            this.handleRecomputeMapParameters();
            this.handlePpos();
        });

        this.props.mapRangeRadius.sub(() => {
            this.handleRecomputeMapParameters();
        });
    }

    private handlePpos() {
        const lat = this.props.mapCenterLat.get();
        const long = this.props.mapCenterLong.get();

        const [x, y] = this.mapParams.coordinatesToXYy({ lat, long });

        this.planeX.set(x);
        this.planeY.set(y);
    }

    private handleRecomputeMapParameters() {
        this.mapParams.compute(
            { lat: this.props.mapCenterLat.get(), long: this.props.mapCenterLong.get() },
            this.props.mapRangeRadius.get() * 2,
            768,
            0, // FIXME true north ?
        );
    }

    render(): VNode | null {
        return (
            <g visibility={this.isVisible.map((visible) => (visible ? 'visible' : 'hidden'))}>
                <PlanModeUnderlay mapRange={this.props.mapRangeRadius} />

                <Airplane
                    x={this.planeX}
                    y={this.planeY}
                    rotation={this.planeRotation}
                    available={this.planeAvailable}
                />
            </g>
        );
    }
}
