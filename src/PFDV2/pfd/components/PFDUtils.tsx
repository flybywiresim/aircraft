import { DisplayComponent, EventBus, FSComponent, NodeReference, Subscribable, VNode } from 'msfssdk';
import { Arinc429Word } from '../shared/arinc429';
import { HeadingBug } from './horizon';
import { PFDSimvars } from '../shared/PFDSimvarPublisher';
import { Arinc429Values } from '../shared/ArincValueProvider';

export const calculateHorizonOffsetFromPitch = (pitch: number) => {
    if (pitch > -5 && pitch <= 20) {
        return pitch * 1.8;
    } if (pitch > 20 && pitch <= 30) {
        return -0.04 * pitch ** 2 + 3.4 * pitch - 16;
    } if (pitch > 30) {
        return 20 + pitch;
    } if (pitch < -5 && pitch >= -15) {
        return 0.04 * pitch ** 2 + 2.2 * pitch + 1;
    }
    return pitch - 8;
};

export const calculateVerticalOffsetFromRoll = (roll: number) => {
    let offset = 0;

    if (Math.abs(roll) > 60) {
        offset = Math.max(0, 41 - 35.87 / Math.sin(Math.abs(roll) / 180 * Math.PI));
    }
    return offset;
};

interface HorizontalTapeProps {
    displayRange: number;
    valueSpacing: number;
    distanceSpacing: number;
    // graduationElementFunction: (elementHeading: number, offset: number) => JSX.Element;
    bugs: [number][];
    yOffset?: number;
    type: 'horizon' | 'headingTape'
    bus: EventBus;
}

export class HorizontalTape extends DisplayComponent<HorizontalTapeProps> {
    private refElement = FSComponent.createRef<SVGGElement>();

    private tickRefs: NodeReference<SVGGElement>[] = [];

    private tickPathRefs: NodeReference<SVGPathElement>[] = [];

    private yOffset=0;

    private tapeOffset=0;

    private tickNumberRefs: NodeReference<SVGTextElement>[] = [];

    private currentDrawnHeading = 0;

    private buildHorizonTicks():{ticks: SVGPathElement[], labels?: SVGTextElement[]} {
        const result = { ticks: [] as SVGPathElement[], labels: [] as SVGTextElement[] };

        result.ticks.push(<path transform="translate(0 0)" class="NormalStroke White" d="m68.906 80.823v1.8" />);

        for (let i = 0; i < 6; i++) {
            const headingOffset = (1 + i) * this.props.valueSpacing;
            const dX = this.props.distanceSpacing / this.props.valueSpacing * headingOffset;

            if (headingOffset % 10 === 0) {
                result.ticks.push(<path class="NormalStroke White" d="m68.906 80.823v1.8" transform={`translate(${dX} 0)`} />);
                //           result.ticks.push(<line class="NormalStroke White" x1={dX} y1="0" x2={dX} y2={-tickLength} stroke="rgb(203,203,203)" stroke-width="1" />);
                result.ticks.unshift(<path class="NormalStroke White" d="m68.906 80.823v1.8" transform={`translate(${-dX} 0)`} />);
            } /* else {
                result.ticks.push(<path class="NormalStroke White" d="m68.906 80.823v1.8" transform={`translate(${dX} 0)`} />);
                //           result.ticks.push(<line class="NormalStroke White" x1={dX} y1="0" x2={dX} y2={-tickLength} stroke="rgb(203,203,203)" stroke-width="1" />);
                result.ticks.unshift(<path class="NormalStroke White" d="m68.906 80.823v1.8" transform={`translate(${-dX} 0)`} />);
            } */
        }

        return result;
    }

    private buildHeadingTicks(): { ticks: SVGLineElement[], labels: SVGTextElement[] } {
        const result = {
            ticks: [] as SVGLineElement[],
            labels: [] as SVGTextElement[],
        };

        const tickLength = 4;
        const labelBottomY = -6;
        let textRef = FSComponent.createRef<SVGTextElement>();

        result.ticks.push(<path class="NormalStroke White" d={`m68.913 145.34v${tickLength}`} transform="translate(0 0)" />);

        // result.ticks.push(<line x1="0" y1="0" x2="0" y2={-tickLength} stroke="rgb(203,203,203)" stroke-width="1" />);
        result.labels.push(
            <text
                id="HeadingLabel"
                class="White MiddleAlign FontMedium"
                ref={textRef}
                x="68.979425"
                y="154.64206"
                transform={`translate(${0} 0)`}
            >
                360

            </text>,

        );
        this.tickNumberRefs.push(textRef);

        for (let i = 0; i < 6; i++) {
            const headingOffset = (1 + i) * this.props.valueSpacing;
            const dX = this.props.distanceSpacing / this.props.valueSpacing * headingOffset;

            if (headingOffset % 10 === 0) {
                result.ticks.push(<path class="NormalStroke White" d={`m68.913 145.34v${tickLength}`} transform={`translate(${dX} 0)`} />);
                //           result.ticks.push(<line class="NormalStroke White" x1={dX} y1="0" x2={dX} y2={-tickLength} stroke="rgb(203,203,203)" stroke-width="1" />);
                result.ticks.unshift(<path class="NormalStroke White" d={`m68.913 145.34v${tickLength}`} transform={`translate(${-dX} 0)`} />);
            } else {
                result.ticks.push(<path class="NormalStroke White" d={`m68.913 145.34v${tickLength * 0.42}`} transform={`translate(${dX} 0)`} />);
                //           result.ticks.push(<line class="NormalStroke White" x1={dX} y1="0" x2={dX} y2={-tickLength} stroke="rgb(203,203,203)" stroke-width="1" />);
                result.ticks.unshift(<path class="NormalStroke White" d={`m68.913 145.34v${tickLength * 0.42}`} transform={`translate(${-dX} 0)`} />);
            }

            if (headingOffset % 10 === 0) {
                textRef = FSComponent.createRef<SVGTextElement>();

                result.labels.unshift(
                    <text
                        id="HeadingLabel"
                        class={`White MiddleAlign ${i % 3 === 0 ? 'FontSmallest' : 'FontMedium'}`}
                        ref={textRef}
                        x="68.979425"
                        y="154.64206"
                        transform={`translate(${-dX} 0)`}
                    >
                        {headingOffset}

                    </text>,
                );
                this.tickNumberRefs.unshift(textRef);
                textRef = FSComponent.createRef<SVGTextElement>();
                result.labels.push(
                    <text
                        id="HeadingLabel"
                        class={`White MiddleAlign ${i % 3 === 0 ? 'FontSmallest' : 'FontMedium'}`}
                        ref={textRef}
                        x="68.979425"
                        y="154.64206"
                        transform={`translate(${dX} 0)`}
                    >
                        {(360 - headingOffset)}

                    </text>,
                );
                this.tickNumberRefs.push(textRef);
            }

            /* textRef = FSComponent.createRef<SVGTextElement>();
            result.labels.push(<text id="HeadingLabel" class="White MiddleAlign FontSmallest"x="68.979425" y="x="68.979425"" transform={`translate(${dX} 0)`}>30</text>);
            this.tickNumberRefs.push(textRef); */
        }

        return result;
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const pf = this.props.bus.getSubscriber<Arinc429Values>();

        pf.on('pitchAr').handle((pitch) => {
            if (this.props.type === 'horizon') {
                const multiplier = Math.pow(10, 2);
                const currentValueAtPrecision = Math.round(pitch.value * multiplier) / multiplier;
                const yOffset = Math.max(Math.min(calculateHorizonOffsetFromPitch(-currentValueAtPrecision), 31.563), -31.563);
                this.yOffset = yOffset;
                this.refElement.instance.style.transform = `translate3d(${this.tapeOffset}px, ${yOffset}px, 0px)`;
            }
        });

        pf.on('headingAr').handle((newVal) => {
            const tapeOffset = -newVal.value % 10 * this.props.distanceSpacing / this.props.valueSpacing;

            // const start = 300 + (this.currentDrawnHeading) * 10;
            if (newVal.value / 10 >= this.currentDrawnHeading + 1 || newVal.value / 10 <= this.currentDrawnHeading) {
                this.currentDrawnHeading = Math.floor(newVal.value / 10);

                const start = 330 + (this.currentDrawnHeading) * 10;

                this.tickNumberRefs.forEach((t, index) => {
                    const scrollerValue = t.instance;
                    if (scrollerValue !== null) {
                        const hdg = (start + index * 10) % 360;
                        if (hdg % 10 === 0) {
                            const content = hdg !== 0 ? (hdg / 10).toFixed(0) : '0';
                            if (scrollerValue.textContent !== content) {
                                scrollerValue.textContent = content;
                            }
                        } else {
                            scrollerValue.textContent = '';
                        }
                        if (hdg % 30 === 0) {
                            scrollerValue.classList.remove('FontSmallest');
                            scrollerValue.classList.add('FontMedium');
                        } else {
                            scrollerValue.classList.add('FontSmallest');
                            scrollerValue.classList.remove('FontMedium');
                        }
                    }
                });
            }
            this.tapeOffset = tapeOffset;

            this.refElement.instance.style.transform = `translate3d(${tapeOffset}px, ${this.yOffset}px, 0px)`;
            // this.refElement2.instance.setAttribute('transform', `translate(${offset2} 0)`);
        });
    }

    render(): VNode {
        /*     let leftmostHeading = Math.round((this.props.heading.value - this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing;
    if (leftmostHeading < this.props.heading.value - this.props.displayRange) {
        leftmostHeading += this.props.valueSpacing;
    } */

        // const graduationElements: JSX.Element[] = [];
        const bugElements: number[] = [];

        const tapeStuff = this.props.type === 'horizon' ? this.buildHorizonTicks() : this.buildHeadingTicks();

        /*     for (let i = 0; i < numTicks; i++) {
        const elementHeading = leftmostHeading + i * this.props.valueSpacing;
        const offset = elementHeading * this.props.distanceSpacing / this.props.valueSpacing;
        //graduationElements.push(graduationElementFunction(elementHeading, offset));
    }
 */
        /*     this.props.bugs.forEach((currentElement) => {
        const angleToZero = getSmallestAngle(this.props.heading.value, 0);
        const smallestAngle = getSmallestAngle(currentElement[0], 0);
        let offset = currentElement[0];
        if (Math.abs(angleToZero) < 90 && Math.abs(smallestAngle) < 90) {
            if (angleToZero > 0 && smallestAngle < 0) {
                offset = currentElement[0] - 360;
            } else if (angleToZero < 0 && smallestAngle > 0) {
                offset = currentElement[0] + 360;
            }
        }

        offset *= this.props.distanceSpacing / this.props.valueSpacing;
        bugElements.push(offset);
    }); */

        return (

            <g id="HeadingTick" ref={this.refElement}>
                {/* {graduationElements} */}
                {/* {this.buildGraduationElements()} */}

                {tapeStuff.ticks}

                {this.props.type === 'headingTape' && tapeStuff.labels}

                {bugElements.forEach((offet) => {
                    <HeadingBug offset={offet} />;
                })}
            </g>

        );
    }
}

interface VerticalTapeProps {
    displayRange: number;
    valueSpacing: number;
    distanceSpacing: number;
    bugs: [(offset: number) => SVGElement, number][];
    tapeValue: Subscribable<number>;
    lowerLimit: number;
    upperLimit?: number;
    type: 'altitude' | 'speed';
}
/**
 * @deprecated slow
 */
export class VerticalTape extends DisplayComponent<VerticalTapeProps> {
    private refElement = FSComponent.createRef<SVGGElement>();

    private buildSpeedGraduationPoints(): NodeReference<SVGGElement>[] {
        const numTicks = Math.round(this.props.displayRange * 10 / this.props.valueSpacing);

        const lowestValue = 30;

        /*    if (lowestValue < this.props.tapeValue.get() - this.props.displayRange) {
            lowestValue += this.props.valueSpacing;
        }
 */
        const graduationPoints = [];

        for (let i = 0; i < numTicks; i++) {
            const elementValue = lowestValue + i * this.props.valueSpacing;
            if (elementValue <= (this.props.upperLimit ?? Infinity)) {
                const offset = -elementValue * this.props.distanceSpacing / this.props.valueSpacing;
                const element = { elementValue, offset };
                if (element) {
                    // console.log("ADDING", elementValue);
                    // this.refElement.instance.append(<this.props.graduationElementFunction offset={offset} alt={elementValue} />);

                    /*  if (elementValue < 30) {
                        return <></>;
                    } */

                    let text = '';
                    if (elementValue % 20 === 0) {
                        text = Math.abs(elementValue).toString().padStart(3, '0');
                    }

                    graduationPoints.push(
                        <g transform={`translate(0 ${offset})`}>
                            <path class="NormalStroke White" d="m19.031 80.818h-2.8206" />
                            <text class="FontMedium MiddleAlign White" x="8.0348943" y="82.936722">{text}</text>
                        </g>,
                    );
                }
            }
        }
        return graduationPoints;
    }

    private buildAltitudeGraduationPoints(): NodeReference<SVGGElement>[] {
        const numTicks = Math.round(this.props.displayRange * 100 / this.props.valueSpacing);

        const lowestValue = 0;
        const graduationPoints = [];

        for (let i = 0; i < numTicks; i++) {
            const elementValue = lowestValue + i * this.props.valueSpacing;
            if (elementValue <= (this.props.upperLimit ?? Infinity)) {
                const offset = -elementValue * this.props.distanceSpacing / this.props.valueSpacing;
                const element = { elementValue, offset };
                if (element) {
                    // console.log("ADDING", newValue.value);
                    // this.refElement.instance.append(<this.props.graduationElementFunction offset={offset} alt={elementValue} />);

                    let text = '';
                    if (elementValue % 500 === 0) {
                        text = (Math.abs(elementValue) / 100).toString().padStart(3, '0');
                    }

                    graduationPoints.push(
                        <g style={`transform: translate3d(0px, ${offset}px, 0px)`}>
                            {text
                                     && <path class="NormalStroke White" d="m115.79 81.889 1.3316-1.0783-1.3316-1.0783" />}
                            <path class="NormalStroke White" d="m130.85 80.819h-2.0147" />
                            <text class="FontMedium MiddleAlign White" x="122.98842" y="82.939713">{text}</text>
                        </g>,
                    );
                }
            }
        }
        return graduationPoints;
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.props.tapeValue.sub((a) => {
            const newValue = new Arinc429Word(a);

            const clampedValue = Math.max(Math.min(newValue.value, this.props.upperLimit ?? Infinity), this.props.lowerLimit ?? -Infinity);

            /*   let lowestValue = 30;// Math.max(Math.round((clampedValue - this.props.displayRange) / this.props.valueSpacing) *this.props. valueSpacing, this.props.lowerLimit??-Infinity);
            if (lowestValue < newValue.value - this.props.displayRange) {
                lowestValue += this.props.valueSpacing;
            } */

            this.refElement.instance.style.transform = `translate3d(0px, ${clampedValue * this.props.distanceSpacing / this.props.valueSpacing}px, 0px)`;
        });
    }

    render(): VNode {
        // const bugElements: number[] = [];

        /*    this.props.bugs.forEach((currentElement) => {
            const value = currentElement[0];
            const offset = -value * this.props.distanceSpacing / this.props.valueSpacing;
            bugElements.push(offset);
        }); */
        return (
            <g ref={this.refElement}>
                {this.props.type === 'altitude' && this.buildAltitudeGraduationPoints()}
                {this.props.type === 'speed' && this.buildSpeedGraduationPoints()}
                {this.props.children}
                {/*   {this.graduationElements.sub(leThing => {
                   leThing.forEach(v => {
                    <graduationElementFunction offset={v.offset} alt={v.elementValue} />
                   })
               })}  */}
                {/*  {bugElements.forEach(offet => {
                    <HeadingBug offset={offet}/>
                })} */}
            </g>
        );
    }
}

/* export const BarberpoleIndicator = (
    tapeValue: number, border: number, isLowerBorder: boolean, displayRange: number,
    element: (offset: number) => JSX.Element, elementSize: number,
) => {
    const Elements: [(offset: number) => JSX.Element, number][] = [];

    const sign = isLowerBorder ? 1 : -1;
    const isInRange = isLowerBorder ? border <= tapeValue + displayRange : border >= tapeValue - displayRange;
    if (!isInRange) {
        return Elements;
    }
    const numElements = Math.ceil((border + sign * tapeValue - sign * (displayRange + 2)) / elementSize);
    for (let i = 0; i < numElements; i++) {
        const elementValue = border + sign * elementSize * i;
        Elements.push([element, elementValue]);
    }

    return Elements;
}; */

export const SmoothSin = (origin: number, destination: number, smoothFactor: number, dTime: number) => {
    if (origin === undefined) {
        return destination;
    }
    if (Math.abs(destination - origin) < Number.EPSILON) {
        return destination;
    }
    const delta = destination - origin;
    let result = origin + delta * Math.sin(Math.min(smoothFactor * dTime, 1.0) * Math.PI / 2.0);
    if ((origin < destination && result > destination) || (origin > destination && result < destination)) {
        result = destination;
    }
    return result;
};

export class LagFilter {
    private PreviousInput: number;

    private PreviousOutput: number;

    private TimeConstant: number;

    constructor(timeConstant: number) {
        this.PreviousInput = 0;
        this.PreviousOutput = 0;

        this.TimeConstant = timeConstant;
    }

    reset() {
        this.PreviousInput = 0;
        this.PreviousOutput = 0;
    }

    /**
     *
     * @param input Input to filter
     * @param deltaTime in seconds
     * @returns {number} Filtered output
     */
    step(input: number, deltaTime: number): number {
        const filteredInput = !Number.isNaN(input) ? input : 0;

        const scaledDeltaTime = deltaTime * this.TimeConstant;
        const sum0 = scaledDeltaTime + 2;

        const output = (filteredInput + this.PreviousInput) * scaledDeltaTime / sum0
            + (2 - scaledDeltaTime) / sum0 * this.PreviousOutput;

        this.PreviousInput = filteredInput;

        if (Number.isFinite(output)) {
            this.PreviousOutput = output;
            return output;
        }
        return 0;
    }
}

export class RateLimiter {
    private PreviousOutput: number;

    private RisingRate: number;

    private FallingRate: number;

    constructor(risingRate: number, fallingRate: number) {
        this.PreviousOutput = 0;

        this.RisingRate = risingRate;
        this.FallingRate = fallingRate;
    }

    step(input: number, deltaTime: number) {
        const filteredInput = !Number.isNaN(input) ? input : 0;

        const subInput = filteredInput - this.PreviousOutput;

        const scaledUpper = deltaTime * this.RisingRate;
        const scaledLower = deltaTime * this.FallingRate;

        const output = this.PreviousOutput + Math.max(Math.min(scaledUpper, subInput), scaledLower);
        this.PreviousOutput = output;
        return output;
    }
}
