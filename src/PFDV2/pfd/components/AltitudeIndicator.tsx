import { Clock, ClockEvents, DisplayComponent, EventBus, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import { PFDSimvars } from '../shared/PFDSimvarPublisher';
import { Arinc429Word } from '../shared/arinc429';
import { DigitalAltitudeReadout } from './DigitalAltitudeReadout';
import { SimplaneValues } from '../shared/SimplaneValueProvider';
import { VerticalTape } from './NewVerticalTape';
import { Arinc429Values } from '../shared/ArincValueProvider';

const DisplayRange = 600;
const ValueSpacing = 100;
const DistanceSpacing = 7.5;

class LandingElevationIndicator extends DisplayComponent<{bus: EventBus}> {
    private landingElevationIndicator = FSComponent.createRef<SVGPathElement>();

    private altitude =0;

    private landingElevation = 0;

    private handleLandingElevation() {
        const delta = this.altitude - this.landingElevation;
        const offset = (delta - DisplayRange) * DistanceSpacing / ValueSpacing;
        if (delta > DisplayRange) {
            this.landingElevationIndicator.instance.classList.add('HideLocDiamond');
        } else {
            this.landingElevationIndicator.instance.classList.add('HideLocDiamond');
        }
        this.landingElevationIndicator.instance.setAttribute('d', `m130.85 123.56h-13.096v${offset}h13.096z`);
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

        sub.on('fwcFlightPhase').whenChanged().handle((fp) => {
            if (fp !== 7 && fp !== 8) {
                this.landingElevationIndicator.instance.classList.add('HideLocDiamond');
            } else {
                this.landingElevationIndicator.instance.classList.remove('HideLocDiamond');
            }
        });

        sub.on('landingElevation').whenChanged().handle((le) => {
            this.landingElevation = le;
            this.handleLandingElevation();
        });

        sub.on('altitudeAr').handle((a) => {
            this.altitude = a.value;
            this.handleLandingElevation();
        });
    }

    render(): VNode {
        return (
            <path ref={this.landingElevationIndicator} id="AltTapeLandingElevation" class="EarthFill" />
        );
    }
}

class RadioAltIndicator extends DisplayComponent<{ bus: EventBus }> {
    private visibilitySub = Subject.create('hidden');

    private offsetSub = Subject.create('');

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();

        sub.on('radio_alt').handle((ra) => {
            if (ra > DisplayRange) {
                this.visibilitySub.set('hidden');
            } else {
                this.visibilitySub.set('visible');
            }
            const offset = (ra - DisplayRange) * DistanceSpacing / ValueSpacing;

            this.offsetSub.set(`m131.15 123.56h2.8709v${offset}h-2.8709z`);
        });
    }

    render(): VNode {
        return (
            <path visibility={this.visibilitySub} id="AltTapeGroundReference" class="Fill Red" d={this.offsetSub} />
        );
    }
}

interface AltitudeIndicatorProps {

    bus: EventBus;
}

export class AltitudeIndicator extends DisplayComponent<AltitudeIndicatorProps> {
    private subscribable = Subject.create<number>(0);

    private tapeRef = FSComponent.createRef<HTMLDivElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        console.log('RENDER ALTITUDEINDICATOR');
        const pf = this.props.bus.getSubscriber<Arinc429Values>();

        pf.on('altitudeAr').handle((a) => {
            if (a.isNormalOperation()) {
                this.subscribable.set(a.value);
                this.tapeRef.instance.style.display = 'inline';
            } else {
                this.tapeRef.instance.style.display = 'none';
            }
        });
    }

    render(): VNode {
        /*         if (!altitude.isNormalOperation()) {
            return (
                <AltTapeBackground />
            );
        } */

        return (
            <g id="AltitudeTape">
                <AltTapeBackground />
                <LandingElevationIndicator bus={this.props.bus} />
                <g ref={this.tapeRef}>
                    <VerticalTape
                        bugs={[]}
                        displayRange={DisplayRange + 30}
                        valueSpacing={ValueSpacing}
                        distanceSpacing={DistanceSpacing}
                        lowerLimit={-1500}
                        upperLimit={50000}
                        tapeValue={this.subscribable}
                        type="altitude"
                    />

                </g>

            </g>
        );
    }
}

class AltTapeBackground extends DisplayComponent<any> {
    render(): VNode {
        return (<path id="AltTapeBackground" d="m130.85 123.56h-13.096v-85.473h13.096z" class="TapeBackground" />);
    }
}

 interface AltitudeIndicatorOfftapeProps {

    bus: EventBus;
}

export class AltitudeIndicatorOfftape extends DisplayComponent<AltitudeIndicatorOfftapeProps> {
    private abnormal = FSComponent.createRef<SVGGElement>();

    private tcasFailed = FSComponent.createRef<SVGGElement>();

    private normal = FSComponent.createRef<SVGGElement>();

    private altitude = Subject.create(new Arinc429Word(0));

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();

        sub.on('altitude').handle((a) => {
            const altitude = new Arinc429Word(a);
            this.altitude.set(altitude);

            if (!altitude.isNormalOperation()) {
                this.normal.instance.setAttribute('style', 'display: none');
                this.abnormal.instance.removeAttribute('style');
            } else {
                this.abnormal.instance.setAttribute('style', 'display: none');
                this.normal.instance.removeAttribute('style');
            }
        });

        sub.on('tcasFail').whenChanged().handle((tcasFailed) => {
            if (tcasFailed) {
                this.tcasFailed.instance.style.display = 'inline';
            } else {
                this.tcasFailed.instance.style.display = 'none';
            }
        });
    }

    render(): VNode {
        return (

            <>
                <g ref={this.abnormal} style="display: none">
                    <path id="AltTapeOutline" class="NormalStroke Red" d="m117.75 123.56h13.096v-85.473h-13.096" />
                    <path id="AltReadoutBackground" class="BlackFill" d="m131.35 85.308h-13.63v-8.9706h13.63z" />
                    <text id="AltFailText" class="Blink9Seconds FontLargest Red EndAlign" x="131.16769" y="83.433167">ALT</text>
                </g>
                <g ref={this.tcasFailed} style="display: none">
                    <text class="Blink9Seconds FontLargest Amber EndAlign" x="141.5" y="96">T</text>
                    <text class="Blink9Seconds FontLargest Amber EndAlign" x="141.5" y="104">C</text>
                    <text class="Blink9Seconds FontLargest Amber EndAlign" x="141.5" y="112">A</text>
                    <text class="Blink9Seconds FontLargest Amber EndAlign" x="141.5" y="120">S</text>
                </g>
                <g ref={this.normal} style="display: none">
                    <path id="AltTapeOutline" class="NormalStroke White" d="m117.75 123.56h17.83m-4.7345-85.473v85.473m-13.096-85.473h17.83" />
                    {/*  <LinearDeviationIndicator altitude={altitude} linearDeviation={NaN} /> */}
                    <SelectedAltIndicator bus={this.props.bus} />
                    <AltimeterIndicator bus={this.props.bus} altitude={this.altitude} />
                    <MetricAltIndicator bus={this.props.bus} />
                    <path id="AltReadoutBackground" class="BlackFill" d="m130.85 85.308h-13.13v-8.9706h13.13v-2.671h8.8647v14.313h-8.8647z" />
                    <RadioAltIndicator bus={this.props.bus} />
                    <DigitalAltitudeReadout bus={this.props.bus} />
                </g>
            </>
        );
    }
}

interface SelectedAltIndicatorProps {
    bus: EventBus
}

class SelectedAltIndicator extends DisplayComponent<SelectedAltIndicatorProps> {
    private mode: 'QNH' | 'QFE' | 'STD' = 'QNH';

    lowerGroupRef =FSComponent.createRef<SVGGElement>();

    SelectedAltLowerText=FSComponent.createRef<SVGTextElement>();

    SelectedAltLowerFLText=FSComponent.createRef<SVGTextElement>();

    upperGroupRef=FSComponent.createRef<SVGGElement>();

    SelectedAltUpperText=FSComponent.createRef<SVGTextElement>();

    SelectedAltUpperFLText=FSComponent.createRef<SVGTextElement>();

    targetGroupRef=FSComponent.createRef<SVGGElement>();

    BlackFill=FSComponent.createRef<SVGPathElement>();

    targetSymbolRef=FSComponent.createRef<SVGPathElement>();

    AltTapeTargetText=FSComponent.createRef<SVGTextElement>();

    private altitude = new Arinc429Word(0);

    private targetAltitudeSelected = 0;

    private shownTargetAltitude = 0;

    private constraint = 0;

    private textSub = Subject.create('');

    private isManaged = false;

    private armedVerticalBitmask =0;

    private armedLateralBitmask = 0;

    private activeVerticalMode = 0;

    private fmgcFlightPhase = 0;

    private handleAltManagedChange() {
        const altArmed = (this.armedVerticalBitmask >> 1) & 1;

        const clbArmed = (this.armedVerticalBitmask >> 2) & 1;

        const navArmed = (this.armedLateralBitmask >> 0) & 1;

        this.isManaged = !!(altArmed || this.activeVerticalMode === 21 || this.activeVerticalMode === 20 || (!!this.constraint && this.fmgcFlightPhase < 2 && clbArmed && navArmed));

        this.shownTargetAltitude = this.updateTargetAltitude(this.targetAltitudeSelected, this.isManaged, this.constraint);

        if (this.isManaged) {
            this.SelectedAltLowerFLText.instance.classList.remove('Cyan');
            this.SelectedAltLowerFLText.instance.classList.add('Magenta');

            this.SelectedAltLowerText.instance.classList.remove('Cyan');
            this.SelectedAltLowerText.instance.classList.add('Magenta');

            this.SelectedAltUpperFLText.instance.classList.remove('Cyan');
            this.SelectedAltUpperFLText.instance.classList.add('Magenta');

            this.SelectedAltUpperText.instance.classList.remove('Cyan');
            this.SelectedAltUpperText.instance.classList.add('Magenta');

            this.AltTapeTargetText.instance.classList.remove('Cyan');
            this.AltTapeTargetText.instance.classList.add('Magenta');

            this.targetSymbolRef.instance.classList.remove('Cyan');
            this.targetSymbolRef.instance.classList.add('Magenta');
        } else {
            this.SelectedAltLowerFLText.instance.classList.add('Cyan');
            this.SelectedAltLowerFLText.instance.classList.remove('Magenta');

            this.SelectedAltLowerText.instance.classList.add('Cyan');
            this.SelectedAltLowerText.instance.classList.remove('Magenta');

            this.SelectedAltUpperFLText.instance.classList.add('Cyan');
            this.SelectedAltUpperFLText.instance.classList.remove('Magenta');

            this.SelectedAltUpperText.instance.classList.add('Cyan');
            this.SelectedAltUpperText.instance.classList.remove('Magenta');

            this.AltTapeTargetText.instance.classList.add('Cyan');
            this.AltTapeTargetText.instance.classList.remove('Magenta');

            this.targetSymbolRef.instance.classList.add('Cyan');
            this.targetSymbolRef.instance.classList.remove('Magenta');
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();
        const spsub = this.props.bus.getSubscriber<SimplaneValues>();

        sub.on('fmaVerticalArmed').whenChanged().handle((v) => {
            this.armedVerticalBitmask = v;
            this.handleAltManagedChange();
        });

        sub.on('activeVerticalMode').whenChanged().handle((v) => {
            this.activeVerticalMode = v;
            this.handleAltManagedChange();
        });

        sub.on('fmaLateralArmed').whenChanged().handle((l) => {
            this.armedLateralBitmask = l;
            this.handleAltManagedChange();
        });

        sub.on('fmgcFlightPhase').whenChanged().handle((f) => {
            this.fmgcFlightPhase = f;
            this.handleAltManagedChange();
        });

        spsub.on('selectedAltitude').whenChanged().handle((m) => {
            this.targetAltitudeSelected = m;
            this.handleAltManagedChange();

            this.getOffset();
            this.handleUpperGroup();
            this.getText();
        });

        sub.on('altConstraint').handle((m) => {
            this.constraint = m;
            this.handleAltManagedChange();

            this.getOffset();
            this.handleUpperGroup();
            this.getText();
        });

        sub.on('altitude').handle((m) => {
            const altitude = new Arinc429Word(m);

            this.altitude = altitude;
            this.handleUpperGroup();
            this.getOffset();
        });

        spsub.on('baroMode').whenChanged().handle((m) => {
            this.mode = m;

            if (this.mode === 'STD') {
                this.SelectedAltLowerFLText.instance.setAttribute('visibility', 'visible');
                this.SelectedAltUpperFLText.instance.setAttribute('visibility', 'visible');
            } else {
                this.SelectedAltLowerFLText.instance.setAttribute('visibility', 'hidden');
                this.SelectedAltUpperFLText.instance.setAttribute('visibility', 'hidden');
            }
            this.handleUpperGroup();
            this.getText();
        });
    }

    private updateTargetAltitude(targetAltitude: number, isManaged: boolean, constraint: number) {
        return isManaged ? constraint : targetAltitude;
    }

    private handleUpperGroup() {
        if (this.altitude.value - this.shownTargetAltitude > DisplayRange) {
            this.lowerGroupRef.instance.setAttribute('style', 'display:block');
            this.upperGroupRef.instance.setAttribute('style', 'display:none');
            this.targetGroupRef.instance.setAttribute('visibility', 'hidden');
        } else if (this.altitude.value - this.shownTargetAltitude < -DisplayRange) {
            this.targetGroupRef.instance.setAttribute('visibility', 'hidden');

            this.upperGroupRef.instance.setAttribute('style', 'display:block');
            this.lowerGroupRef.instance.setAttribute('style', 'display:none');
        } else {
            this.upperGroupRef.instance.setAttribute('style', 'display:none');
            this.lowerGroupRef.instance.setAttribute('style', 'display:none');
            this.targetGroupRef.instance.setAttribute('visibility', 'visible');
        }
    }

    private getText() {
        let boxLength = 19.14;
        let text = '0';
        if (this.mode === 'STD') {
            text = Math.round(this.shownTargetAltitude / 100).toString().padStart(3, '0');
            boxLength = 12.5;
        } else {
            text = Math.round(this.shownTargetAltitude).toString().padStart(5, ' ');
        }
        this.textSub.set(text);
        this.BlackFill.instance.setAttribute('d', `m117.75 77.784h${boxLength}v6.0476h-${boxLength}z`);
    }

    private getOffset() {
        const offset = (this.altitude.value - this.shownTargetAltitude) * DistanceSpacing / ValueSpacing;
        this.targetGroupRef.instance.setAttribute('transform', `translate(0 ${offset})`);
    }

    render(): VNode | null {
        return (
            <>
                <g id="SelectedAltLowerGroup" ref={this.lowerGroupRef}>
                    <text id="SelectedAltLowerText" ref={this.SelectedAltLowerText} class="FontMedium EndAlign Cyan" x="135.7511" y="128.70299" xml:space="preserve">{this.textSub}</text>
                    <text id="SelectedAltLowerFLText" ref={this.SelectedAltLowerFLText} class="FontSmall MiddleAlign Cyan" x="120.87094" y="128.71681">FL</text>
                </g>
                <g id="SelectedAltUpperGroup" ref={this.upperGroupRef}>
                    <text id="SelectedAltUpperText" ref={this.SelectedAltUpperText} class="FontMedium EndAlign Cyan" x="136.22987" y="37.250134" xml:space="preserve">{this.textSub}</text>
                    <text id="SelectedAltUpperFLText" ref={this.SelectedAltUpperFLText} class="FontSmall MiddleAlign Cyan" x="120.85925" y="37.125755">FL</text>
                </g>
                <g id="AltTapeTargetSymbol" ref={this.targetGroupRef}>
                    <path class="BlackFill" ref={this.BlackFill} />
                    <path class="NormalStroke Cyan" ref={this.targetSymbolRef} d="m122.79 83.831v6.5516h-7.0514v-8.5675l2.0147-1.0079m4.8441-3.0238v-6.5516h-6.8588v8.5675l2.0147 1.0079" />
                    <text id="AltTapeTargetText" ref={this.AltTapeTargetText} class="FontMedium StartAlign Cyan" x="118.228" y="83.067062" xml:space="preserve">{this.textSub}</text>
                </g>
            </>
        );
    }
}
/*
interface LinearDeviationIndicatorProps {
    linearDeviation: number;
    altitude: Arinc429Word;
}

const LinearDeviationIndicator = ({ linearDeviation, altitude }: LinearDeviationIndicatorProps) => {
    if (Number.isNaN(linearDeviation)) {
        return null;
    }
    const circleRadius = 30;
    if (altitude.value - linearDeviation > DisplayRange - circleRadius) {
        return (
            <path id="VDevDotLower" class="Fill Green" d="m116.24 121.85c4.9e-4 0.83465 0.67686 1.511 1.511 1.511 0.83418 0 1.5105-0.67636 1.511-1.511h-1.511z" />
        );
    } if (altitude.value - linearDeviation < -DisplayRange + circleRadius) {
        return (
            <path id="VDevDotUpper" class="Fill Green" d="m116.24 39.8c4.9e-4 -0.83466 0.67686-1.511 1.511-1.511 0.83418 0 1.5105 0.67635 1.511 1.511h-1.511z" />
        );
    }
    const offset = (altitude.value - linearDeviation) * DistanceSpacing / ValueSpacing;

    return (
        <path id="VDevDot" class="Fill Green" transform={`translate(0 ${offset})`} d="m119.26 80.796a1.511 1.5119 0 1 0-3.022 0 1.511 1.5119 0 1 0 3.022 0z" />
    );
};
*/
interface AltimeterIndicatorProps {
    altitude: Subscribable<Arinc429Word>,
    bus: EventBus,
}

class AltimeterIndicator extends DisplayComponent<AltimeterIndicatorProps> {
    private mode = Subject.create('');

    private text = Subject.create('');

    private pressure = 0;

    private unit = '';

    private transAlt = 0;

    private transAltAppr = 0;

    private flightPhase = 0;

    private stdGroup = FSComponent.createRef<SVGGElement>();

    private qfeGroup = FSComponent.createRef<SVGGElement>();

    private qfeBorder = FSComponent.createRef<SVGGElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars>();

        const simPlaneSub = this.props.bus.getSubscriber<SimplaneValues>();

        simPlaneSub.on('baroMode').whenChanged().handle((m) => {
            if (m === 'QFE') {
                this.mode.set(m);
                this.stdGroup.instance.classList.add('HideLocDiamond');
                this.qfeGroup.instance.classList.remove('HideLocDiamond');
                this.qfeBorder.instance.classList.remove('HideLocDiamond');
            } else if (m === 'QNH') {
                this.mode.set(m);
                this.stdGroup.instance.classList.add('HideLocDiamond');
                this.qfeGroup.instance.classList.remove('HideLocDiamond');
                this.qfeBorder.instance.classList.add('HideLocDiamond');
            } else if (m === 'STD') {
                this.mode.set(m);
                this.stdGroup.instance.classList.remove('HideLocDiamond');
                this.qfeGroup.instance.classList.add('HideLocDiamond');
                this.qfeBorder.instance.classList.add('HideLocDiamond');
            } else {
                this.mode.set(m);
                this.stdGroup.instance.classList.add('HideLocDiamond');
                this.qfeGroup.instance.classList.add('HideLocDiamond');
                this.qfeBorder.instance.classList.add('HideLocDiamond');
            }
            this.getText();
        });

        sub.on('fmgcFlightPhase').whenChanged().handle((fp) => {
            this.flightPhase = fp;

            this.handleBlink();
        });

        sub.on('transAlt').whenChanged().handle((ta) => {
            this.transAlt = ta;

            this.handleBlink();
            this.getText();
        });

        sub.on('transAltAppr').whenChanged().handle((ta) => {
            this.transAltAppr = ta;

            this.handleBlink();
            this.getText();
        });

        simPlaneSub.on('units').whenChanged().handle((u) => {
            this.unit = u;
            this.getText();
        });

        simPlaneSub.on('pressure').whenChanged().handle((p) => {
            this.pressure = p;
            this.getText();
        });

        this.props.altitude.sub((a) => {
            this.handleBlink();
        });
    }

    private handleBlink() {
        if (this.mode.get() === 'STD') {
            if (this.flightPhase > 3 && this.transAltAppr > this.props.altitude.get().value && this.transAltAppr !== 0) {
                this.stdGroup.instance.classList.add('BlinkInfinite');
            } else {
                this.stdGroup.instance.classList.remove('BlinkInfinite');
            }
        } else if (this.flightPhase <= 3 && this.transAlt < this.props.altitude.get().value && this.transAlt !== 0) {
            this.qfeGroup.instance.classList.add('BlinkInfinite');
        } else {
            this.qfeGroup.instance.classList.remove('BlinkInfinite');
        }
    }

    private getText() {
        if (this.pressure !== null) {
            if (this.unit === 'millibar') {
                this.text.set(Math.round(this.pressure).toString());
            } else {
                this.text.set(this.pressure.toFixed(2));
            }
        } else {
            this.text.set('');
        }
    }

    render(): VNode {
        return (
            <>
                <g ref={this.stdGroup} id="STDAltimeterModeGroup">
                    <path class="NormalStroke Yellow" d="m124.79 131.74h13.096v7.0556h-13.096z" />
                    <text class="FontMedium Cyan AlignLeft" x="125.75785" y="137.36">STD</text>
                </g>
                <g id="AltimeterGroup">

                    <g ref={this.qfeGroup} id="QFEGroup">
                        <path ref={this.qfeBorder} class="NormalStroke White" d="m 116.83686,133.0668 h 13.93811 v 5.8933 h -13.93811 z" />
                        <text id="AltimeterModeText" class="FontMedium White" x="118.23066" y="138.11342">{this.mode}</text>
                        <text id="AltimeterSettingText" class="FontMedium MiddleAlign Cyan" x="141.25583" y="138.09006">{this.text}</text>
                    </g>
                </g>
            </>
        );
    }
}

 interface MetricAltIndicatorState {
    altitude: Arinc429Word;
    MDA: number;
    targetAltSelected: number;
    targetAltManaged: number;
    altIsManaged: boolean;
    metricAltToggle: boolean;
}

class MetricAltIndicator extends DisplayComponent<{bus: EventBus }> {
    private needsUpdate = false;

    private metricAlt = FSComponent.createRef<SVGGElement>();

    private metricAltText = FSComponent.createRef<SVGTextElement>();

    private metricAltTargetText = FSComponent.createRef<SVGTextElement>();

    private state: MetricAltIndicatorState = {
        altitude: new Arinc429Word(0),
        MDA: 0,
        targetAltSelected: 0,
        targetAltManaged: 0,
        altIsManaged: false,
        metricAltToggle: false,
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & ClockEvents & SimplaneValues>();

        sub.on('mda').whenChanged().handle((mda) => {
            this.state.MDA = mda;
            this.needsUpdate = true;
        });

        sub.on('altitudeAr').handle((a) => {
            this.state.altitude = a;
            this.needsUpdate = true;
        });

        sub.on('selectedAltitude').whenChanged().handle((m) => {
            this.state.targetAltSelected = m;
            this.needsUpdate = true;
        });
        sub.on('altConstraint').handle((m) => {
            this.state.targetAltManaged = m;
            this.needsUpdate = true;
        });

        sub.on('metricAltToggle').whenChanged().handle((m) => {
            this.state.metricAltToggle = m;
            this.needsUpdate = true;
        });

        sub.on('realTime').handle(this.updateState.bind(this));
    }

    private updateState(_time: number) {
        if (this.needsUpdate) {
            this.needsUpdate = false;
            const showMetricAlt = this.state.metricAltToggle;
            if (!showMetricAlt) {
                this.metricAlt.instance.style.display = 'none';
            } else {
                this.metricAlt.instance.style.display = 'inline';
                const currentMetricAlt = Math.round(this.state.altitude.value * 0.3048 / 10) * 10;
                this.metricAltText.instance.textContent = currentMetricAlt.toString();

                const targetMetric = Math.round((this.state.altIsManaged ? this.state.targetAltManaged : this.state.targetAltSelected) * 0.3048 / 10) * 10;
                this.metricAltTargetText.instance.textContent = targetMetric.toString();

                if (this.state.altIsManaged) {
                    this.metricAltTargetText.instance.classList.replace('Cyan', 'Magenta');
                } else {
                    this.metricAltTargetText.instance.classList.replace('Magenta', 'Cyan');
                }

                if (this.state.altitude.value > this.state.MDA) {
                    this.metricAltText.instance.classList.replace('Green', 'Amber');
                } else {
                    this.metricAltText.instance.classList.replace('Amber', 'Green');
                }
            }
        }
    }

    render(): VNode {
        return (
            <g id="MetricAltGroup" ref={this.metricAlt}>
                <path class="NormalStroke Yellow" d="m116.56 140.22h29.213v7.0556h-29.213z" />
                <text class="FontMedium Cyan MiddleAlign" x="142.03537" y="145.8689">M</text>
                <text ref={this.metricAltText} id="MetricAltText" class="FontMedium Cyan MiddleAlign" x="128.64708" y="145.86191">0</text>
                <g id="MetricAltTargetGroup">
                    <text id="MetricAltTargetText" ref={this.metricAltTargetText} class="FontSmallest Green MiddleAlign" x="94.088852" y="37.926617">0</text>
                    <text class="FontSmallest Cyan MiddleAlign" x="105.25774" y="37.872921">M</text>
                </g>
            </g>
        );
    }
}
