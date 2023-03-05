import { FSComponent, ComponentProps, Subscribable, VNode, Subject, EventBus, ConsumerSubject } from 'msfssdk';
import { Arinc429Register, Arinc429Word, Arinc429WordData } from '@shared/arinc429';
import { EfisNdMode, rangeSettings } from '@shared/NavigationDisplay';
import { PlanModeUnderlay } from './PlanModeUnderlay';
import { MapParameters } from '../../../ND/utils/MapParameters';
import { NDPage } from '../NDPage';
import { NDControlEvents } from '../../NDControlEvents';
import { NDSimvars } from '../../NDSimvarPublisher';
import { EcpSimVars } from '../../../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';
import { AdirsSimVars } from '../../../MsfsAvionicsCommon/SimVarTypes';

export interface PlanModePageProps extends ComponentProps {
    bus: EventBus,
    aircraftTrueHeading: Subscribable<Arinc429WordData>,
}

export class PlanModePage extends NDPage<PlanModePageProps> {
    public isVisible = Subject.create(false);

    private readonly controlPublisher = this.props.bus.getPublisher<NDControlEvents>();

    private readonly subs = this.props.bus.getSubscriber<NDControlEvents & NDSimvars & AdirsSimVars>();

    private readonly pposLatSub = ConsumerSubject.create(this.subs.on('latitude').whenChanged(), -1);

    private readonly pposLatRegister = Arinc429Register.empty();

    private readonly pposLongSub = ConsumerSubject.create(this.subs.on('longitude').whenChanged(), -1);

    private readonly pposLongRegister = Arinc429Register.empty();

    private readonly mapCenterLatSub = ConsumerSubject.create(this.subs.on('set_map_center_lat').whenChanged(), -1);

    private readonly mapCenterLonSub = ConsumerSubject.create(this.subs.on('set_map_center_lon').whenChanged(), -1);

    private readonly mapRangeRadiusSub = ConsumerSubject.create(this.subs.on('set_map_range_radius').whenChanged(), -1);

    private readonly selectedWaypointLatSub = ConsumerSubject.create(this.subs.on('selectedWaypointLat').whenChanged(), -1);

    private readonly selectedWaypointLongSub = ConsumerSubject.create(this.subs.on('selectedWaypointLong').whenChanged(), -1);

    private readonly mapRangeSub = ConsumerSubject.create(this.props.bus.getSubscriber<EcpSimVars>().on('ndRangeSetting').whenChanged(), -1);

    private readonly mapParams = new MapParameters();

    onShow() {
        super.onShow();

        this.controlPublisher.pub('set_show_plane', true);
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.isVisible.sub((visible) => {
            if (visible) {
                this.handleSelectedWaypointPos();
                this.handleMovePlane();
                this.handleRotatePlane();
                this.handleScaleMap();
            }
        });

        this.props.aircraftTrueHeading.sub(() => this.handleRotatePlane());

        this.pposLatSub.sub(() => this.handleMovePlane());

        this.pposLongSub.sub(() => this.handleMovePlane());

        this.mapCenterLatSub.sub(() => {
            this.handleRecomputeMapParameters();
            this.handleMovePlane();
        });

        this.mapCenterLonSub.sub(() => {
            this.handleRecomputeMapParameters();
            this.handleMovePlane();
        });

        this.mapRangeRadiusSub.sub(() => {
            this.handleRecomputeMapParameters();
            this.handleMovePlane();
        });

        this.mapRangeSub.sub(() => this.handleScaleMap());

        this.selectedWaypointLatSub.sub(() => this.handleSelectedWaypointPos());
        this.selectedWaypointLongSub.sub(() => this.handleSelectedWaypointPos());
    }

    private handleMovePlane() {
        if (this.isVisible.get()) {
            const latRegister = this.pposLatRegister;
            const longRegister = this.pposLongRegister;

            latRegister.set(this.pposLatSub.get());
            longRegister.set(this.pposLongSub.get());

            if (latRegister.isNormalOperation() && longRegister.isNormalOperation()) {
                const lat = latRegister.value;
                const long = longRegister.value;

                const [x, y] = this.mapParams.coordinatesToXYy({ lat, long });

                this.controlPublisher.pub('set_plane_x', 768 / 2 + x);
                this.controlPublisher.pub('set_plane_y', 768 / 2 + y);
            }
        }
    }

    private handleRotatePlane() {
        if (this.isVisible.get()) {
            const planeRotation = this.props.aircraftTrueHeading.get();

            if (planeRotation.isNormalOperation()) {
                const ndRotation = this.mapParams.rotation(planeRotation.value);

                this.controlPublisher.pub('set_show_plane', true);
                this.controlPublisher.pub('set_plane_rotation', ndRotation);
            } else {
                this.controlPublisher.pub('set_show_plane', false);
            }
        }
    }

    private handleScaleMap() {
        if (this.isVisible.get()) {
            const rangeSetting = this.mapRangeSub.get();
            const range = rangeSettings[rangeSetting];

            this.controlPublisher.pub('set_map_efis_mode', EfisNdMode.PLAN);
            this.controlPublisher.pub('set_map_pixel_radius', 250);
            this.controlPublisher.pub('set_map_range_radius', range / 2);
            this.controlPublisher.pub('set_map_center_y_bias', 0);
        }
    }

    private handleSelectedWaypointPos() {
        const lat = this.selectedWaypointLatSub.get();
        const long = this.selectedWaypointLongSub.get();

        if (this.isVisible.get()) {
            this.controlPublisher.pub('set_map_center_lat', lat);
            this.controlPublisher.pub('set_map_center_lon', long);
            this.controlPublisher.pub('set_map_up_course', 0);
        }
    }

    private handleRecomputeMapParameters() {
        this.mapParams.compute(
            { lat: this.mapCenterLatSub.get(), long: this.mapCenterLonSub.get() },
            0,
            this.mapRangeRadiusSub.get(),
            250,
            0, // FIXME true north ?
        );
    }

    render(): VNode | null {
        return (
            <g visibility={this.isVisible.map((visible) => (visible ? 'visible' : 'hidden'))}>
                <PlanModeUnderlay mapRange={this.mapRangeRadiusSub} />
            </g>
        );
    }
}
