import { ClockEvents, DisplayComponent, EventBus, FSComponent, Subscribable, VNode } from 'msfssdk';

import './common.scss';

import { NXDataStore } from '@shared/persistence';
import { PFDSimvars } from './PFDSimvarPublisher';
import { getDisplayIndex } from '../PFD';

type DisplayUnitProps = {
    bus: EventBus,
    failed: Subscribable<boolean>;
}

enum DisplayUnitState {
    On,
    Off,
    Selftest,
    Standby
}

export class DisplayUnit extends DisplayComponent<DisplayUnitProps> {
    private state: DisplayUnitState = SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool') ? DisplayUnitState.Off : DisplayUnitState.Standby;

    private electricityState: number = 0;

    private potentiometer: number = 0;

    private timeOut: number = 0;

    private selfTestRef = FSComponent.createRef<SVGElement>();

    private pfdRef = FSComponent.createRef<HTMLDivElement>();

    private backLightBleedRef = FSComponent.createRef<HTMLDivElement>();

    private isHomeCockpitMode = false;

    private failed = false;

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars & ClockEvents>();
        const isCaptainSide = getDisplayIndex() === 1;

        sub.on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo').whenChanged().handle((value) => {
            this.potentiometer = value;
            this.updateState();
        });

        sub.on(isCaptainSide ? 'elec' : 'elecFo').whenChanged().handle((value) => {
            this.electricityState = value;
            this.updateState();
        });

        sub.on('realTime').atFrequency(1).handle((_t) => {
            // override MSFS menu animations setting for this instrument
            if (!document.documentElement.classList.contains('animationsEnabled')) {
                document.documentElement.classList.add('animationsEnabled');
            }
        });

        this.props.failed.sub((f) => {
            this.failed = f;
            this.updateState();
        });

        NXDataStore.getAndSubscribe('HOME_COCKPIT_ENABLED', (_key, val) => {
            this.isHomeCockpitMode = val === '1';
            this.updateState();
        }, '0');
    }

    setTimer(time: number) {
        this.timeOut = window.setTimeout(() => {
            if (this.state === DisplayUnitState.Standby) {
                this.state = DisplayUnitState.Off;
            } if (this.state === DisplayUnitState.Selftest) {
                this.state = DisplayUnitState.On;
            }
            this.updateState();
        }, time * 1000);
    }

    updateState() {
        if (this.state !== DisplayUnitState.Off && this.failed) {
            this.state = DisplayUnitState.Off;
            clearTimeout(this.timeOut);
        } else if (this.state === DisplayUnitState.On && (this.potentiometer === 0 || this.electricityState === 0)) {
            this.state = DisplayUnitState.Standby;
            this.setTimer(10);
        } else if (this.state === DisplayUnitState.Standby && (this.potentiometer !== 0 && this.electricityState !== 0)) {
            this.state = DisplayUnitState.On;
            clearTimeout(this.timeOut);
        } else if (this.state === DisplayUnitState.Off && (this.potentiometer !== 0 && this.electricityState !== 0 && !this.failed)) {
            this.state = DisplayUnitState.Selftest;
            this.setTimer(parseInt(NXDataStore.get('CONFIG_SELF_TEST_TIME', '15')));
        } else if (this.state === DisplayUnitState.Selftest && (this.potentiometer === 0 || this.electricityState === 0)) {
            this.state = DisplayUnitState.Off;
            clearTimeout(this.timeOut);
        }

        if (this.state === DisplayUnitState.Selftest) {
            this.selfTestRef.instance.style.display = 'block';
            this.pfdRef.instance.style.display = 'none';
            this.backLightBleedRef.instance.style.display = this.isHomeCockpitMode ? 'none' : 'block';
        } else if (this.state === DisplayUnitState.On) {
            this.selfTestRef.instance.style.display = 'none';
            this.pfdRef.instance.style.display = 'block';
            this.backLightBleedRef.instance.style.display = this.isHomeCockpitMode ? 'none' : 'block';
        } else {
            this.selfTestRef.instance.style.display = 'none';
            this.pfdRef.instance.style.display = 'none';
            this.backLightBleedRef.instance.style.display = 'none';
        }
    }

    render(): VNode {
        return (

            <>
                <div ref={this.backLightBleedRef} class="BacklightBleed" />

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
    }
}
