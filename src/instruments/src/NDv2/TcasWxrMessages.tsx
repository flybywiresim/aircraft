import { FSComponent, DisplayComponent, VNode, Subject, MappedSubject, EventBus } from 'msfssdk';
import { EfisNdMode, TcasWxrMessage } from '@shared/NavigationDisplay';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { TcasSimVars } from '../MsfsAvionicsCommon/providers/TcasBusPublisher';

export interface TcasWXMessagesProps {
    bus: EventBus,
    mode: EfisNdMode,
}

export class TcasWxrMessages extends DisplayComponent<TcasWXMessagesProps> {
    private readonly taOnlySub = Subject.create(false);

    private readonly failSub = Subject.create(false);

    private readonly leftMessage = Subject.create<TcasWxrMessage | undefined>(undefined);

    private readonly rightMessage = Subject.create<TcasWxrMessage | undefined>(undefined);

    private readonly y = (this.props.mode === EfisNdMode.ROSE_VOR || this.props.mode === EfisNdMode.ROSE_ILS) ? 713 : 678;

    private readonly backgroundFillShown = this.props.mode === EfisNdMode.ARC || this.props.mode === EfisNdMode.ROSE_NAV;

    private shown = MappedSubject.create(([left, right]) => {
        const improperMode = this.props.mode !== EfisNdMode.ARC && this.props.mode !== EfisNdMode.ROSE_NAV
            && this.props.mode !== EfisNdMode.ROSE_VOR && this.props.mode !== EfisNdMode.ROSE_ILS;

        return !improperMode && (left !== undefined || right !== undefined);
    }, this.leftMessage, this.rightMessage);

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<TcasSimVars>();

        sub.on('tcasTaOnly').whenChanged().handle((value) => this.taOnlySub.set(value));
        sub.on('tcasFault').whenChanged().handle((value) => this.failSub.set(value));

        MappedSubject.create(([taOnly, failed]) => {
            if (failed) {
                this.leftMessage.set({ text: 'TCAS', color: 'Amber' });
            } else if (taOnly) {
                this.leftMessage.set({ text: 'TA ONLY', color: 'White' });
            } else {
                this.leftMessage.set(undefined);
            }
        }, this.taOnlySub, this.failSub);
    }

    render(): VNode | null {
        return (
            <Layer x={164} y={this.y} visible={this.shown}>
                <rect
                    visibility={this.backgroundFillShown ? 'visible' : 'hidden'}
                    x={0}
                    y={0}
                    width={440}
                    height={59}
                    class="BackgroundFill"
                    stroke="none"
                />

                <rect
                    x={0}
                    y={0}
                    width={440}
                    height={30}
                    class="White BackgroundFill"
                    strokeWidth={1.75}
                />

                <text
                    x={8}
                    y={25}
                    class={this.leftMessage.map((it) => it?.color ?? '')}
                    textAnchor="start"
                    fontSize={25}
                >
                    {this.leftMessage.map((it) => it?.text ?? '')}
                </text>

                <text
                    x={425}
                    y={25}
                    class={this.rightMessage.map((it) => it?.color ?? '')}
                    textAnchor="end"
                    fontSize={25}
                >
                    {this.rightMessage.map((it) => it?.text ?? '')}
                </text>
            </Layer>
        );
    }
}
