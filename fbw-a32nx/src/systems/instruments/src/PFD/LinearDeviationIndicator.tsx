import { DisplayComponent, EventBus, FSComponent, NodeReference, Subject, VNode } from '@microsoft/msfs-sdk';
import { FmsVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { Arinc429Values } from 'instruments/src/PFD/shared/ArincValueProvider';

type LinearDeviationIndicatorProps = {
    bus: EventBus,
}

export class LinearDeviationIndicator extends DisplayComponent<LinearDeviationIndicatorProps> {
    private lastIsActive: boolean = false;

    private component = FSComponent.createRef<SVGGElement>();

    private upperLinearDeviationReadout = FSComponent.createRef<SVGTextElement>();

    private upperLinearDeviationReadoutVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private lowerLinearDeviationReadout = FSComponent.createRef<SVGTextElement>();

    private lowerLinearDeviationReadoutVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private linearDeviationDotVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private linearDeviationDotUpperHalfVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private linearDeviationDotLowerHalfVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private latchSymbol = FSComponent.createRef<SVGPathElement>();

    // TODO: Use ARINC value for this
    private flightPathAltitude: Feet = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<Arinc429Values & FmsVars>();

        sub.on('altitudeAr').handle((alt) => {
            if (!alt.isNormalOperation()) {
                // TODO: Should probably hide the yoyo in this case
                return;
            }

            // Only update this if it's actually active
            if (!this.lastIsActive) {
                return;
            }

            const deviation = alt.value - this.flightPathAltitude;
            const pixelOffset = this.pixelOffsetFromDeviation(Math.max(Math.min(deviation, 500), -500));

            this.component.instance.style.transform = `translate3d(0px, ${pixelOffset}px, 0px)`;

            const linearDeviationReadoutText = Math.min(99, Math.round(Math.abs(deviation) / 100)).toFixed(0).padStart(2, '0');

            this.upperLinearDeviationReadout.instance.textContent = linearDeviationReadoutText;
            this.lowerLinearDeviationReadout.instance.textContent = linearDeviationReadoutText;

            if (deviation > 540) {
                this.lowerLinearDeviationReadoutVisibility.set('visible');
                this.linearDeviationDotLowerHalfVisibility.set('visible');

                this.upperLinearDeviationReadoutVisibility.set('hidden');
                this.linearDeviationDotUpperHalfVisibility.set('hidden');

                this.linearDeviationDotVisibility.set('hidden');
            } else if (deviation > -500 && deviation < 500) {
                this.lowerLinearDeviationReadoutVisibility.set('hidden');
                this.linearDeviationDotLowerHalfVisibility.set('hidden');

                this.upperLinearDeviationReadoutVisibility.set('hidden');
                this.linearDeviationDotUpperHalfVisibility.set('hidden');

                this.linearDeviationDotVisibility.set('visible');
            } else if (deviation < -540) {
                this.lowerLinearDeviationReadoutVisibility.set('hidden');
                this.linearDeviationDotLowerHalfVisibility.set('hidden');

                this.upperLinearDeviationReadoutVisibility.set('visible');
                this.linearDeviationDotUpperHalfVisibility.set('visible');

                this.linearDeviationDotVisibility.set('hidden');
            }
        });

        sub.on('linearDeviationActive').whenChanged().handle((isActive) => {
            this.lastIsActive = isActive;

            hideOrShow(this.component)(isActive);
            hideOrShow(this.upperLinearDeviationReadout)(isActive);
            hideOrShow(this.lowerLinearDeviationReadout)(isActive);
        });

        sub.on('verticalProfileLatched').whenChanged().handle(hideOrShow(this.latchSymbol));

        sub.on('targetAltitude').atFrequency(1000 / 60).handle((targetAltitude) => {
            this.flightPathAltitude = targetAltitude;
        });
    }

    render(): VNode {
        return (
            <g id="LinearDeviationIndicator">
                <text ref={this.upperLinearDeviationReadout} x="110" y="42.5" class="FontSmallest Green" />
                <g ref={this.component} id="LinearDeviationDot">
                    <path id="EntireDot" visibility={this.linearDeviationDotVisibility} d="m119.26 80.796a1.511 1.5119 0 1 0-3.022 0 1.511 1.5119 0 1 0 3.022 0z" class="Fill Green" />
                    <path
                        id="DotUpperHalf"
                        visibility={this.linearDeviationDotUpperHalfVisibility}
                        d="m116.24 80.796c4.9e-4 -0.83466 0.67686-1.511 1.511-1.511 0.83418 0 1.5105 0.67635 1.511 1.511h-1.511z"
                        class="Fill Green"
                    />
                    <path
                        id="DotLowerHalf"
                        visibility={this.linearDeviationDotLowerHalfVisibility}
                        d="m116.24 80.796c4.9e-4 0.83465 0.67686 1.511 1.511 1.511 0.83418 0 1.5105-0.67636 1.511-1.511h-1.511z"
                        class="Fill Green"
                    />
                    <path ref={this.latchSymbol} d="m 119 78.3 h -3 v 5 h 3" class="Magenta" />
                </g>
                <text ref={this.lowerLinearDeviationReadout} x="110" y="123" class="FontSmallest Green" />
            </g>
        );
    }

    private pixelOffsetFromDeviation(deviation: number) {
        return deviation * 40.5 / 500;
    }
}

function hideOrShow<T extends(HTMLElement | SVGElement)>(component: NodeReference<T>) {
    return (isActive: boolean) => {
        if (isActive) {
            component.instance.removeAttribute('style');
        } else {
            component.instance.setAttribute('style', 'display: none');
        }
    };
}
