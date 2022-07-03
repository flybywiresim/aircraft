import {
    FSComponent,
    ComponentProps,
    DisplayComponent,
    VNode,
    Subscribable,
    MappedSubject,
    Subject,
    EventBus,
} from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { EfisNdRangeValue } from '@shared/NavigationDisplay';
import { TcasMode } from '@tcas/lib/TcasConstants';
import { MathUtils } from '@shared/MathUtils';
import { NDPage } from '../NDPage';

export interface RoseModeProps extends ComponentProps {
    bus: EventBus,
    heading: Subscribable<Arinc429Word>,
    rangeValue: Subscribable<EfisNdRangeValue>,
    tcasMode: Subscribable<TcasMode>,
    isUsingTrackUpMode: Subscribable<boolean>,
}

export abstract class RoseMode<P extends RoseModeProps = RoseModeProps> extends DisplayComponent<P> implements NDPage {
    abstract isVisible: Subject<boolean>;
}
