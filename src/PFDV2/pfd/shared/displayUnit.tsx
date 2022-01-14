import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';

import './common.scss';

import { PFDSimvars } from './PFDSimvarPublisher';

type DisplayUnitProps = {
    // electricitySimvar: number
    potentiometerIndex?: number
    failed?: boolean,
    coldDark?: boolean,
    bus: EventBus,
}

enum DisplayUnitState {
    On,
    Off,
    Selftest,
    Standby
}

export class DisplayUnit extends DisplayComponent<DisplayUnitProps> {
    // FIXME obvious
    private state: Subject<DisplayUnitState> = Subject.create<DisplayUnitState>(DisplayUnitState.Off);// this.props.coldDark ? DisplayUnitState.Off : DisplayUnitState.Standby;
    // const [timer, setTimer] = useState<number | null>(null);

    // const [potentiometer] = useSimVar(`LIGHT POTENTIOMETER:${this.props.potentiometerIndex}`, 'percent over 100', 200);

    private readonly simvarPublisher;

    private electricityState: number = 0;

    private potentiometer: number = 0;

    private timeOut: number = 0;

    private readonly selfTestRef = FSComponent.createRef<SVGElement>();

    private readonly pfdRef = FSComponent.createRef<HTMLDivElement>();

    constructor(props: DisplayUnitProps) {
        super(props);
        this.simvarPublisher = this.props.bus.getSubscriber<PFDSimvars>();

        // const consumer = subscriber.on('elec');
        // this.electricityState = ConsumerSubject.create(consumer, 0);
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        // this.updateState();

        this.simvarPublisher.on('potentiometer_captain').whenChanged().handle((value) => {
            this.potentiometer = value;
            this.updateState();
        });
        this.simvarPublisher.on('elec').whenChanged().handle((value) => {
            this.electricityState = value;
            this.updateState();
        });

        this.state.sub((v) => {
            if (v === DisplayUnitState.Selftest) {
                this.selfTestRef.instance.setAttribute('visibility', 'visible');
                this.pfdRef.instance.setAttribute('style', 'display:none');
            } else if (v === DisplayUnitState.On) {
                this.selfTestRef.instance.setAttribute('visibility', 'hidden');
                this.pfdRef.instance.setAttribute('style', 'display:block');
            } else {
                this.selfTestRef.instance.setAttribute('visibility', 'hidden');
                this.pfdRef.instance.setAttribute('style', 'display:none');
            }
        }, true);
    }

    /*      useUpdate((deltaTime) => {
        if (timer !== null) {
            if (timer > 0) {
                setTimer(timer - (deltaTime / 1000));
            } else if (state === DisplayUnitState.Standby) {
                setState(DisplayUnitState.Off);
                setTimer(null);
            } else if (state === DisplayUnitState.Selftest) {
                setState(DisplayUnitState.On);
                setTimer(null);
            }
        }
    }); */

    setTimer(time: number) {
        console.log('setting timouet');
        this.timeOut = window.setTimeout(() => {
            console.log('firimng timouet');

            if (this.state.get() === DisplayUnitState.Standby) {
                this.state.set(DisplayUnitState.Off);
            } if (this.state.get() === DisplayUnitState.Selftest) {
                this.state.set(DisplayUnitState.On);
            }
        }, time * 1000);
    }

    updateState() {
        if (this.state.get() !== DisplayUnitState.Off && this.props.failed) {
            this.state.set(DisplayUnitState.Off);
        } else if (this.state.get() === DisplayUnitState.On && (this.potentiometer === 0 || this.electricityState === 0)) {
            this.state.set(DisplayUnitState.Standby);
            this.setTimer(10);
        } else if (this.state.get() === DisplayUnitState.Standby && (this.potentiometer !== 0 && this.electricityState !== 0)) {
            this.state.set(DisplayUnitState.On);
            // setTimer(null);
            clearTimeout(this.timeOut);
        } else if (this.state.get() === DisplayUnitState.Off && (this.potentiometer !== 0 && this.electricityState !== 0 && !this.props.failed)) {
            this.state.set(DisplayUnitState.Selftest);
            this.setTimer(1);

            // setTimer(parseInt(NXDataStore.get('CONFIG_SELF_TEST_TIME', '15')));
        } else if (this.state.get() === DisplayUnitState.Selftest && (this.potentiometer === 0 || this.electricityState === 0)) {
            this.state.set(DisplayUnitState.Off);
            clearTimeout(this.timeOut);
        }
    }

    render(): VNode {
        return (

            <>
                <div class="BacklightBleed" />

                <svg ref={this.selfTestRef} class="SelfTest" viewBox="0 0 600 600">
                    <rect class="SelfTestBackground" x="0" y="0" width="100%" height="100%" />

                    <text
                        class="SelfTestText"
                        x="50%"
                        y="50%"
                    >
                        SELF TEST IN PROGRESS
                    </text>
                    <text
                        class="SelfTestText"
                        x="50%"
                        y="56%"
                    >
                        (MAX 40 SECONDS)
                    </text>
                </svg>

                <div style="display:none" ref={this.pfdRef}>{this.props.children}</div>
            </>

        );

        /*    return (
            <svg class="dcdu-lines">
            <g>
                <path d="m 21 236 h 450" />
                <path d="m 130 246 v 124" />
                <path d="m 362 246 v 124" />
            </g>
        </svg>); */
    }
}
