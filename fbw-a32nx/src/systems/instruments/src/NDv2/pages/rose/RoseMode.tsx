import { FSComponent, ComponentProps, Subscribable, Subject } from '@microsoft/msfs-sdk';
import { Arinc429WordData } from '@shared/arinc429';
import { EfisNdRangeValue } from '@shared/NavigationDisplay';
import { ArincEventBus } from 'instruments/src/MsfsAvionicsCommon/ArincEventBus';
import { NDPage } from '../NDPage';
import { NDControlEvents } from '../../NDControlEvents';

export interface RoseModeProps extends ComponentProps {
    bus: ArincEventBus,
    rangeValue: Subscribable<EfisNdRangeValue>,
    headingWord: Subscribable<Arinc429WordData>,
    trueHeadingWord: Subscribable<Arinc429WordData>,
    trackWord: Subscribable<Arinc429WordData>
    trueTrackWord: Subscribable<Arinc429WordData>
    isUsingTrackUpMode: Subscribable<boolean>,
}

export abstract class RoseMode<P extends RoseModeProps = RoseModeProps> extends NDPage<P> {
    abstract isVisible: Subject<boolean>;

    onShow() {
        super.onShow();

        this.movePlane();
    }

    private movePlane() {
        const publisher = this.props.bus.getPublisher<NDControlEvents>();

        publisher.pub('set_show_plane', true);
        publisher.pub('set_plane_x', 384);
        publisher.pub('set_plane_y', 384);
    }
}
