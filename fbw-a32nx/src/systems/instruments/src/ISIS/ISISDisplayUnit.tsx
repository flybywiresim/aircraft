import { DisplayComponent, VNode, FSComponent, EventBus, ClockEvents, Subject, MappedSubject } from '@microsoft/msfs-sdk';
import { ISISSimvars } from './shared/ISISSimvarPublisher';

enum DisplayUnitState {
    On,
    Off,
    Selftest,
    Standby
}

export class ISISDisplayUnit extends DisplayComponent<({ bus: EventBus })> {
    private readonly powerUpTime = 90;

    private readonly displayUnitRef = FSComponent.createRef<HTMLDivElement>();

    private readonly selfTestRef = FSComponent.createRef<SVGElement>()

    private readonly timer = Subject.create(null);

    private readonly state = Subject.create(DisplayUnitState.Off);

    private readonly dcEssLive = Subject.create(false);

    private readonly dcHotLive = Subject.create(false);

    private readonly ias = Subject.create(0);

    private readonly coldDark = Subject.create(false);

    /*  const [ias] = useSimVar('AIRSPEED INDICATED', 'knots', 200); */
    private readonly hasElectricity = MappedSubject.create(([dcEssLive, dcHotLive, ias]) => ias > 50 && dcHotLive || dcEssLive, this.dcEssLive, this.dcHotLive, this.ias)

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<ISISSimvars & ClockEvents>();

        this.hasElectricity.sub((e) => {
            if (this.state.get() === DisplayUnitState.On && !e) {
                this.state.set(DisplayUnitState.Standby);
                this.timer.set(10);
            } else if (this.state.get() === DisplayUnitState.Standby && e) {
                this.state.set(DisplayUnitState.On);
                this.timer.set(null);
            } else if (this.state.get() === DisplayUnitState.Off && e) {
                this.state.set(DisplayUnitState.Selftest);
                this.timer.set(this.powerUpTime);
            } else if (this.state.get() === DisplayUnitState.Selftest && !e) {
                this.state.set(DisplayUnitState.Off);
                this.timer.set(null);
            }
        }, true);

        sub.on('simTime').atFrequency(1).handle((_t) => {
            if (!document.documentElement.classList.contains('animationsEnabled')) {
                document.documentElement.classList.add('animationsEnabled');
            }

            if (this.timer.get() !== null) {
                if (this.timer.get() > 0) {
                    this.timer.set(this.timer.get() - 1);
                } else if (this.state.get() === DisplayUnitState.Standby) {
                    this.state.set(DisplayUnitState.Off);
                    this.timer.set(null);
                } else if (this.state.get() === DisplayUnitState.Selftest) {
                    console.log('ASU');
                    this.state.set(DisplayUnitState.On);
                    this.timer.set(null);
                }
            }
        });

        sub.on('dcEssLive').whenChanged().handle((dcEss) => {
            this.dcEssLive.set(dcEss);
        });

        sub.on('dcHotLive').whenChanged().handle((dcHot) => {
            this.dcHotLive.set(dcHot);
        });

        sub.on('coldDark').whenChanged().handle((cd) => {
            this.coldDark.set(cd);
        });

        sub.on('ias').atFrequency(1).handle((ias) => {
            this.ias.set(ias);
        });

        this.state.sub((s) => {
            if (s === DisplayUnitState.Selftest) {
                this.selfTestRef.instance.style.visibility = 'visible';
                this.displayUnitRef.instance.style.display = 'none';
            } else if (s === DisplayUnitState.Off) {
                this.selfTestRef.instance.style.visibility = 'hidden';
                this.displayUnitRef.instance.style.display = 'none';
            } else if (s === DisplayUnitState.On) {
                this.selfTestRef.instance.style.visibility = 'hidden';
                this.displayUnitRef.instance.style.display = 'block';
            } else {
                this.selfTestRef.instance.style.visibility = 'hidden';
                this.displayUnitRef.instance.style.display = 'none';
            }
        }, true);
    }

    render(): VNode {
        return (
            <>
                <svg id="SelfTest" ref={this.selfTestRef} style="backgroundColor: 'black'" class="SelfTest" version="1.1" viewBox="0 0 512 512">
                    <g id="AttFlag">
                        <rect id="AttTest" class="FillYellow" width="84" height="40" x="214" y="174" />
                        <text id="AltTestTxt" class="TextBackground" text-anchor="middle" x="256" y="206">ATT</text>
                    </g>
                    <g id="SpeedFlag">
                        <rect id="SpeedTest" class="FillYellow" width="84" height="40" x="70" y="244" />
                        <text id="SpeedTestTxt" class="TextBackground" text-anchor="middle" x="112" y="276">SPD</text>
                    </g>
                    <g id="AltFlag">
                        <rect id="AltTest" class="FillYellow" width="84" height="40" x="358" y="244" />
                        <text id="AltTestTxt" class="TextBackground" text-anchor="middle" x="400" y="276">ALT</text>
                    </g>
                    <g id="TimerFlag">
                        <rect id="TmrTest" class="FillYellow" width="160" height="40" x="178" y="332" />
                        <text id="TmrTestTxt" class="TextBackground" x="186" y="366">INIT</text>
                        <text id="TmrTestCountdown" class="TextBackground" text-anchor="end" x="330" y="366">
                            {this.timer.map((t) => `${Math.max(0, Math.ceil(t!))}\ns`)}
                        </text>
                    </g>
                </svg>
                <div ref={this.displayUnitRef}>{this.props.children}</div>
            </>
        );
    }


    /*     const [state, setState] = useState(isColdAndDark ? DisplayUnitState.Off : DisplayUnitState.Standby);

    const hasElectricity = indicatedAirspeed > 50 && dcHotLive || dcEssLive; */

    /*  useUpdate((deltaTime) => {
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


    });
 */
}
