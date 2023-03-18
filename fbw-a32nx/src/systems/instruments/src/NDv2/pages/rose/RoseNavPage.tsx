import { ConsumerSubject, FSComponent, Subject, VNode } from 'msfssdk';
import { EfisNdMode, rangeSettings } from '@shared/NavigationDisplay';
import { RoseMode } from './RoseMode';
import { TrackLine } from '../../shared/TrackLine';
import { TrackBug } from '../../shared/TrackBug';
import { RoseModeUnderlay } from './RoseModeUnderlay';
import { Arinc429RegisterSubject } from '../../../MsfsAvionicsCommon/Arinc429RegisterSubject';
import { AdirsSimVars } from '../../../MsfsAvionicsCommon/SimVarTypes';
import { EcpSimVars } from '../../../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';
import { NDControlEvents } from '../../NDControlEvents';

export class RoseNavPage extends RoseMode {
    private readonly pposLatWord = Arinc429RegisterSubject.createEmpty();

    private readonly pposLonWord = Arinc429RegisterSubject.createEmpty();

    private readonly mapRangeSub = ConsumerSubject.create(this.props.bus.getSubscriber<EcpSimVars>().on('ndRangeSetting').whenChanged(), -1);

    isVisible = Subject.create(false);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.isVisible.sub((visible) => {
            if (visible) {
                this.handleMoveMap();
                this.handleScaleMap();
            }
        });

        const sub = this.props.bus.getSubscriber<AdirsSimVars & EcpSimVars>();

        sub.on('latitude').whenChanged().handle((v) => this.pposLatWord.setWord(v));
        sub.on('longitude').whenChanged().handle((v) => this.pposLonWord.setWord(v));

        this.pposLatWord.sub(() => this.handleMoveMap());
        this.pposLonWord.sub(() => this.handleMoveMap());

        this.mapRangeSub.sub(() => this.handleScaleMap());
    }

    private handleMoveMap() {
        if (!this.isVisible.get()) {
            return;
        }

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        const latWord = this.pposLatWord.get();
        const lonWord = this.pposLonWord.get();

        if (latWord.isNormalOperation() && lonWord.isNormalOperation()) {
            publisher.pub('set_show_map', true);
            publisher.pub('set_map_center_lat', latWord.value);
            publisher.pub('set_map_center_lon', lonWord.value);
        } else {
            publisher.pub('set_show_map', false);
        }
    }

    private handleScaleMap() {
        if (!this.isVisible.get()) {
            return;
        }

        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        const rangeSetting = this.mapRangeSub.get();
        const range = rangeSettings[rangeSetting];

        publisher.pub('set_map_efis_mode', EfisNdMode.ROSE_NAV);
        publisher.pub('set_map_pixel_radius', 250);
        publisher.pub('set_map_range_radius', range / 2);
        publisher.pub('set_map_center_y_bias', 0);
    }

    render(): VNode | null {
        return (
            <g visibility={this.isVisible.map((v) => (v ? 'visible' : 'hidden'))}>
                {/* inverted map overlays for terrain map in WASM module  */}
                <path name="rose-mode-bottom-left-map-area" d="M45,625 L122,625 L174,683 L174,768 L0,768 L0,0 L45,0L45,625" className="nd-inverted-map-area" />
                <path name="rose-mode-bottom-right-map-area" d="M591,768 L591,626 L648,562 L723,562 L723,0 L768,0 L768,768 L591,769" className="nd-inverted-map-area" />
                <path name="rose-mode-top-map-area" d="M45,0 L45,155, L282,155 a250,250 0 0 1 204,0 L723,155 L723,0 L45,0" className="nd-inverted-map-area" />

                <RoseModeUnderlay
                    bus={this.props.bus}
                    heading={this.props.heading}
                    visible={this.isVisible}
                />

                <TrackLine
                    bus={this.props.bus}
                    x={384}
                    y={384}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                />
                <TrackBug
                    bus={this.props.bus}
                    isUsingTrackUpMode={this.props.isUsingTrackUpMode}
                />
            </g>
        );
    }
}
