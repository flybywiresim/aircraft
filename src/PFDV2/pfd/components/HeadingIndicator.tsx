import { DisplayComponent, EventBus, FSComponent, HEvent, Subject, Subscribable, VNode } from 'msfssdk';
import { HorizontalTape } from './PFDUtils';
import { Arinc429Word } from '../shared/arinc429';
import { getSmallestAngle } from '../shared/utils';
import { PFDSimvars } from '../shared/PFDSimvarPublisher';
import { Arinc429Values } from '../shared/ArincValueProvider';
import { SimplaneValues } from '../shared/SimplaneValueProvider';

const DisplayRange = 24;
const DistanceSpacing = 7.555;
const ValueSpacing = 5;

class GraduationElement extends DisplayComponent<{heading: number, offset: number}> {
    render(): VNode {
        let text = '';
        let classText = '';
        let tickLength = 3.8302;
        let textYPos: number | undefined;

        const roundedHeading = Math.round(this.props.heading);
        if (roundedHeading % 10 === 0) {
            if (roundedHeading % 30 === 0) {
                classText = 'FontMedium';
                textYPos = 154.74206;
            } else {
                classText = 'FontSmallest';
                textYPos = 154.27985;
            }
            let textVal = Math.round(this.props.heading / 10) % 36;
            if (textVal < 0) {
                textVal += 36;
            }
            text = textVal.toString();
        } else {
            tickLength *= 0.42;
        }
        return (
            <g id="HeadingTick" transform={`translate(${this.props.offset} 0)`}>
                <path class="NormalStroke White" d={`m68.913 145.34v${tickLength}`} />
                <text id="HeadingLabel" class={`White MiddleAlign ${classText}`} x="68.979425" y={textYPos}>{text}</text>
            </g>
        );
    }
}

interface HeadingTapeProps {
    bus: EventBus;
    failed: Subscribable<boolean>;
}

export class HeadingTape extends DisplayComponent<HeadingTapeProps> {
    private headingTapeRef = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.failed.sub((failed) => {
            if (failed) {
                this.headingTapeRef.instance.style.visibility = 'hidden';
            } else {
                this.headingTapeRef.instance.style.visibility = 'visible';
            }
        });
    }

    render(): VNode {
        /*        if (!this.props.heading.isNormalOperation()) {
                return <></>;
            }
          */
        const bugs = [] as [number][];
        return (
            <g ref={this.headingTapeRef}>
                <path id="HeadingTapeBackground" d="m32.138 145.34h73.536v10.382h-73.536z" class="TapeBackground" />
                <HorizontalTape
                    bus={this.props.bus}
                    bugs={bugs}
                    type="headingTape"
                    displayRange={DisplayRange + 3}
                    valueSpacing={ValueSpacing}
                    distanceSpacing={DistanceSpacing}
                />
            </g>
        );
    }
}

export class HeadingOfftape extends DisplayComponent<{ bus: EventBus, failed: Subscribable<boolean>}> {
    private normalRef = FSComponent.createRef<SVGGElement>();

    private abnormalRef = FSComponent.createRef<SVGGElement>();

    private heading = Subject.create(0);

    private ILSCourse = Subject.create(0);

    private lsPressed = Subject.create(false);

    private getDisplayIndex = () => {
        const url = document.getElementsByTagName('a32nx-pfd')[0].getAttribute('url');
        return url ? parseInt(url.substring(url.length - 1), 10) : 0;
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & HEvent>();

        sub.on('headingAr').handle((h) => {
            this.heading.set(h.value);

            if (h.isNormalOperation()) {
                this.normalRef.instance.style.visibility = 'visible';
                this.abnormalRef.instance.style.visibility = 'hidden';
            } else {
                this.normalRef.instance.style.visibility = 'hidden';
                this.abnormalRef.instance.style.visibility = 'visible';
            }
        });

        sub.on('ilsCourse').whenChanged().handle((n) => {
            this.ILSCourse.set(n);
        });

        sub.on('hEvent').handle((eventName) => {
            if (eventName === `A320_Neo_PFD_BTN_LS_${this.getDisplayIndex()}`) {
                this.lsPressed.set(!this.lsPressed.get());
            }
        });
    }

    render(): VNode {
        return (
            <>
                <g ref={this.abnormalRef}>
                    <path id="HeadingTapeBackground" d="m32.138 145.34h73.536v10.382h-73.536z" class="TapeBackground" />
                    <path id="HeadingTapeOutline" class="NormalStroke Red" d="m32.138 156.23v-10.886h73.536v10.886" />
                    <text id="HDGFailText" class="Blink9Seconds FontLargest EndAlign Red" x="75.926208" y="151.95506">HDG</text>
                </g>
                <g id="HeadingOfftapeGroup" ref={this.normalRef}>
                    <path id="HeadingTapeOutline" class="NormalStroke White" d="m32.138 156.23v-10.886h73.536v10.886" />
                    <SelectedHeading heading={this.heading} bus={this.props.bus} />
                    <QFUIndicator heading={this.heading} ILSCourse={this.ILSCourse} lsPressed={this.lsPressed} />
                    <path class="Fill Yellow" d="m69.61 147.31h-1.5119v-8.0635h1.5119z" />
                    <GroundTrackBug bus={this.props.bus} heading={this.heading} />
                </g>
            </>
        );
    }
}

interface SelectedHeadingProps {
    bus: EventBus;
    heading: Subscribable<number>;
}

class SelectedHeading extends DisplayComponent<SelectedHeadingProps> {
    private selectedHeading = NaN;

    private showSelectedHeading = 0;

    private targetIndicator = FSComponent.createRef<SVGPathElement>();

    private headingTextRight = FSComponent.createRef<SVGPathElement>();

    private headingTextLeft = FSComponent.createRef<SVGPathElement>();

    private text = Subject.create('');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();

        const spsub = this.props.bus.getSubscriber<SimplaneValues>();

        spsub.on('selectedHeading').whenChanged().handle((h) => {
            if (this.showSelectedHeading) {
                this.selectedHeading = h;
                this.handleDelta(this.props.heading.get(), this.selectedHeading);
            } else {
                this.selectedHeading = NaN;
            }
        });

        sub.on('showSelectedHeading').whenChanged().handle((sh) => {
            this.showSelectedHeading = sh;
            this.handleDelta(this.props.heading.get(), this.selectedHeading);
        });

        this.props.heading.sub((h) => {
            this.handleDelta(h, this.selectedHeading);
        }, true);
    }

    private handleDelta(heading: number, selectedHeading: number) {
        const headingDelta = getSmallestAngle(selectedHeading, heading);

        this.text.set(Math.round(selectedHeading).toString().padStart(3, '0'));

        if (Number.isNaN(selectedHeading)) {
            this.headingTextLeft.instance.classList.add('HideLocDiamond');
            this.targetIndicator.instance.classList.add('HideLocDiamond');
            this.headingTextRight.instance.classList.add('HideLocDiamond');
            return;
        }

        if (Math.abs(headingDelta) < DisplayRange) {
            const offset = headingDelta * DistanceSpacing / ValueSpacing;

            this.targetIndicator.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
            this.targetIndicator.instance.classList.remove('HideLocDiamond');
            this.headingTextRight.instance.classList.add('HideLocDiamond');
            this.headingTextLeft.instance.classList.add('HideLocDiamond');
            return;
        }
        this.targetIndicator.instance.classList.add('HideLocDiamond');

        if (headingDelta > 0) {
            this.headingTextRight.instance.classList.remove('HideLocDiamond');
            this.headingTextLeft.instance.classList.add('HideLocDiamond');
        } else {
            this.headingTextRight.instance.classList.add('HideLocDiamond');
            this.headingTextLeft.instance.classList.remove('HideLocDiamond');
        }
    }

    render(): VNode {
        return (

            <>
                <path ref={this.targetIndicator} id="HeadingTargetIndicator" class="NormalStroke Cyan CornerRound" d="m69.978 145.1 1.9501-5.3609h-6.0441l1.9501 5.3609" />

                <text ref={this.headingTextRight} id="SelectedHeadingTextRight" class="FontSmallest MiddleAlign Cyan" x="101.70432" y="144.34792">{this.text}</text>

                <text ref={this.headingTextLeft} id="SelectedHeadingTextLeft" class="FontSmallest MiddleAlign Cyan" x="36.418198" y="144.32108">{this.text}</text>
            </>
        );
    }
}

interface GroundTrackBugProps {
    heading: Subscribable<number>;
    bus: EventBus;
}

class GroundTrackBug extends DisplayComponent<GroundTrackBugProps> {
    private trackIndicator = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<Arinc429Values>();

        sub.on('groundTrackAr').handle((groundTrack) => {
            //  if (groundTrack.isNormalOperation()) {
            const offset = getSmallestAngle(groundTrack.value, this.props.heading.get()) * DistanceSpacing / ValueSpacing;
            this.trackIndicator.instance.style.display = 'inline';
            this.trackIndicator.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
            //   } else {
            //       this.trackIndicator.instance.style.display = 'none';
            //   }
        });
    }

    render(): VNode {
        return (
            <g ref={this.trackIndicator} id="ActualTrackIndicator">
                <path class="ThickOutline CornerRound" d="m68.906 145.75-1.2592 1.7639 1.2592 1.7639 1.2592-1.7639z" />
                <path class="ThickStroke Green CornerRound" d="m68.906 145.75-1.2592 1.7639 1.2592 1.7639 1.2592-1.7639z" />
            </g>
        );
    }
}

class QFUIndicator extends DisplayComponent<{ ILSCourse: Subscribable<number>, heading: Subscribable<number>, lsPressed: Subscribable<boolean> }> {
    private qfuContainer = FSComponent.createRef<SVGGElement>();

    private ilsCourseRight = FSComponent.createRef<SVGGElement>();

    private ilsCourseLeft = FSComponent.createRef<SVGGElement>();

    private ilsCoursePointer = FSComponent.createRef<SVGGElement>();

    private heading = 0;

    private ilsCourse = -1;

    private lsPressed = false;

    private text = Subject.create('');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.heading.sub((h) => {
            this.heading = h;

            const delta = getSmallestAngle(this.ilsCourse, this.heading);
            this.text.set(Math.round(this.ilsCourse).toString().padStart(3, '0'));

            if (this.ilsCourse < 0) {
                this.qfuContainer.instance.classList.add('HideLocDiamond');
            } else if (this.lsPressed) {
                this.qfuContainer.instance.classList.remove('HideLocDiamond');
                if (Math.abs(delta) > DisplayRange) {
                    if (delta > 0) {
                        this.ilsCourseRight.instance.classList.remove('HideLocDiamond');
                        this.ilsCourseLeft.instance.classList.add('HideLocDiamond');
                        this.ilsCoursePointer.instance.classList.add('HideLocDiamond');
                    } else {
                        this.ilsCourseLeft.instance.classList.remove('HideLocDiamond');
                        this.ilsCourseRight.instance.classList.add('HideLocDiamond');
                        this.ilsCoursePointer.instance.classList.add('HideLocDiamond');
                    }
                } else {
                    const offset = getSmallestAngle(this.ilsCourse, this.heading) * DistanceSpacing / ValueSpacing;
                    this.ilsCoursePointer.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
                    this.ilsCoursePointer.instance.classList.remove('HideLocDiamond');
                    this.ilsCourseRight.instance.classList.add('HideLocDiamond');
                    this.ilsCourseLeft.instance.classList.add('HideLocDiamond');
                }
            }
        });

        this.props.ILSCourse.sub((c) => {
            this.ilsCourse = c;

            const delta = getSmallestAngle(this.ilsCourse, this.heading);
            this.text.set(Math.round(this.ilsCourse).toString().padStart(3, '0'));

            if (c < 0) {
                this.qfuContainer.instance.classList.add('HideLocDiamond');
            } else if (this.lsPressed) {
                this.qfuContainer.instance.classList.remove('HideLocDiamond');
                if (Math.abs(delta) > DisplayRange) {
                    if (delta > 0) {
                        this.ilsCourseRight.instance.classList.remove('HideLocDiamond');
                        this.ilsCourseLeft.instance.classList.add('HideLocDiamond');
                        this.ilsCoursePointer.instance.classList.add('HideLocDiamond');
                    } else {
                        this.ilsCourseLeft.instance.classList.remove('HideLocDiamond');
                        this.ilsCourseRight.instance.classList.add('HideLocDiamond');
                        this.ilsCoursePointer.instance.classList.add('HideLocDiamond');
                    }
                } else {
                    const offset = getSmallestAngle(this.ilsCourse, this.heading) * DistanceSpacing / ValueSpacing;
                    this.ilsCoursePointer.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
                    this.ilsCoursePointer.instance.classList.remove('HideLocDiamond');
                    this.ilsCourseRight.instance.classList.add('HideLocDiamond');
                    this.ilsCourseLeft.instance.classList.add('HideLocDiamond');
                }
            }
        });

        this.props.lsPressed.sub((ls) => {
            this.lsPressed = ls;
            if (ls) {
                this.qfuContainer.instance.classList.remove('HideLocDiamond');
            } else {
                this.qfuContainer.instance.classList.add('HideLocDiamond');
            }
        });
    }

    render(): VNode {
        return (
            <g ref={this.qfuContainer}>
                <g id="ILSCoursePointer" class="HideLocDiamond" ref={this.ilsCoursePointer}>
                    <path class="ThickOutline" d="m66.992 152.82h3.8279m-1.914-6.5471v9.4518" />
                    <path class="ThickStroke Magenta" d="m66.992 152.82h3.8279m-1.914-6.5471v9.4518" />
                </g>
                <g id="ILSCourseRight" class="HideLocDiamond" ref={this.ilsCourseRight}>
                    <path class="BlackFill NormalStroke White" d="m100.57 149.68h12.088v6.5516h-12.088z" />
                    <text id="ILSCourseTextRight" class="FontMedium MiddleAlign Magenta" x="106.95047" y="155.22305">{this.text}</text>
                </g>
                <g id="ILSCourseLeft" class="HideLocDiamond" ref={this.ilsCourseLeft}>
                    <path class="BlackFill NormalStroke White" d="m26.094 156.18v-6.5516h12.088v6.5516z" />
                    <text id="ILSCourseTextLeft" class="FontMedium MiddleAlign Magenta" x="32.406616" y="155.22305">{this.text}</text>
                </g>
            </g>
        );
    }
}
