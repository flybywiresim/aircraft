import { A320Failure, FailuresConsumer } from '@flybywiresim/failures';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, Subject, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { LagFilter } from './PFDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { DisplayUnit } from './shared/displayUnit';
import './style.scss';
import { AltitudeIndicator, AltitudeIndicatorOfftape } from './AltitudeIndicator';
import { AttitudeIndicatorFixedCenter, AttitudeIndicatorFixedUpper } from './AttitudeIndicatorFixed';
import { FMA } from './FMA';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator';
import { Horizon } from './AttitudeIndicatorHorizon';
import { LandingSystem } from './LandingSystemIndicator';
import { LinearDeviationIndicator } from './LinearDeviationIndicator';
import { AirspeedIndicator, AirspeedIndicatorOfftape, MachNumber } from './SpeedIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a32nx-pfd')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

interface PFDProps extends ComponentProps {
    bus: EventBus;
    instrument: BaseInstrument;
}

export class PFDComponent extends DisplayComponent<PFDProps> {
    private headingFailed = Subject.create(true);

    private displayFailed = Subject.create(false);

    private isAttExcessive = Subject.create(false);

    private pitch = new Arinc429Word(0);

    private roll = new Arinc429Word(0);

    private ownRadioAltitude = new Arinc429Word(0);

    private filteredRadioAltitude = Subject.create(0);

    private radioAltitudeFilter = new LagFilter(5);

    private failuresConsumer;

    constructor(props: PFDProps) {
        super(props);
        this.failuresConsumer = new FailuresConsumer('A32NX');
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.failuresConsumer.register(getDisplayIndex() === 1 ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay);

        const sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents>();

        sub.on('headingAr').handle((h) => {
            if (this.headingFailed.get() !== h.isNormalOperation()) {
                this.headingFailed.set(!h.isNormalOperation());
            }
        });

        sub.on('rollAr').handle((r) => {
            this.roll = r;
        });

        sub.on('pitchAr').handle((p) => {
            this.pitch = p;
        });

        sub.on('realTime').atFrequency(1).handle((_t) => {
            this.failuresConsumer.update();
            this.displayFailed.set(this.failuresConsumer.isActive(getDisplayIndex() === 1 ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay));
            if (!this.isAttExcessive.get() && ((this.pitch.isNormalOperation()
            && (-this.pitch.value > 25 || -this.pitch.value < -13)) || (this.roll.isNormalOperation() && Math.abs(this.roll.value) > 45))) {
                this.isAttExcessive.set(true);
            } else if (this.isAttExcessive.get() && this.pitch.isNormalOperation() && -this.pitch.value < 22 && -this.pitch.value > -10
            && this.roll.isNormalOperation() && Math.abs(this.roll.value) < 40) {
                this.isAttExcessive.set(false);
            }
        });

        sub.on('chosenRa').handle((ra) => {
            this.ownRadioAltitude = ra;
            const filteredRadioAltitude = this.radioAltitudeFilter.step(this.ownRadioAltitude.value, this.props.instrument.deltaTime / 1000);
            this.filteredRadioAltitude.set(filteredRadioAltitude);
        });
    }

    render(): VNode {
        return (
            <DisplayUnit
                failed={this.displayFailed}
                bus={this.props.bus}
            >
                <svg class="pfd-svg" version="1.1" viewBox="0 0 158.75 158.75" xmlns="http://www.w3.org/2000/svg">
                    <Horizon
                        bus={this.props.bus}
                        instrument={this.props.instrument}
                        isAttExcessive={this.isAttExcessive}
                        filteredRadioAlt={this.filteredRadioAltitude}
                    />
                    <AttitudeIndicatorFixedCenter bus={this.props.bus} isAttExcessive={this.isAttExcessive} />
                    <path
                        id="Mask1"
                        class="BackgroundFill"
                        // eslint-disable-next-line max-len
                        d="m32.138 101.25c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66z"
                    />
                    <HeadingTape bus={this.props.bus} failed={this.headingFailed} />
                    <AltitudeIndicator bus={this.props.bus} />
                    <AirspeedIndicator
                        bus={this.props.bus}
                        instrument={this.props.instrument}
                    />
                    <path
                        id="Mask2"
                        class="BackgroundFill"
                        // eslint-disable-next-line max-len
                        d="m32.138 145.34h73.536v10.382h-73.536zm0-44.092c7.4164 13.363 21.492 21.652 36.768 21.652 15.277 0 29.352-8.2886 36.768-21.652v-40.859c-7.4164-13.363-21.492-21.652-36.768-21.652-15.277 0-29.352 8.2886-36.768 21.652zm-32.046 57.498h158.66v-158.75h-158.66zm115.14-35.191v-85.473h20.344v85.473zm-113.33 0v-85.473h27.548v85.473z"
                    />
                    <AirspeedIndicatorOfftape bus={this.props.bus} />

                    <LandingSystem bus={this.props.bus} instrument={this.props.instrument} />
                    <AttitudeIndicatorFixedUpper bus={this.props.bus} />
                    <VerticalSpeedIndicator bus={this.props.bus} instrument={this.props.instrument} filteredRadioAltitude={this.filteredRadioAltitude} />
                    <HeadingOfftape bus={this.props.bus} failed={this.headingFailed} />
                    <AltitudeIndicatorOfftape bus={this.props.bus} filteredRadioAltitude={this.filteredRadioAltitude} />
                    <LinearDeviationIndicator bus={this.props.bus} />

                    <MachNumber bus={this.props.bus} />
                    <FMA bus={this.props.bus} isAttExcessive={this.isAttExcessive} />
                </svg>
            </DisplayUnit>
        );
    }
}
