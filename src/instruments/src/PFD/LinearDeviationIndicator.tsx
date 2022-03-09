import { DisplayComponent, EventBus, FSComponent, NodeReference, Subject, VNode } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { PFDSimvars } from './shared/PFDSimvarPublisher';

 type LinearDeviationIndicatorProps = {
     bus: EventBus,
 }

export class LinearDeviationIndicator extends DisplayComponent<LinearDeviationIndicatorProps> {
     private lastIsActive: boolean = false;

     private component = FSComponent.createRef<SVGGElement>();

     private upperLinearDeviationReadout = FSComponent.createRef<SVGTextElement>();

     private lowerLinearDeviationReadout = FSComponent.createRef<SVGTextElement>();

     private linearDeviationDot = FSComponent.createRef<SVGPathElement>();

     private linearDeviationDotUpperHalf = FSComponent.createRef<SVGPathElement>();

     private linearDeviationDotLowerHalf = FSComponent.createRef<SVGPathElement>();

     private latchSymbol = FSComponent.createRef<SVGPathElement>();

     private altitude = Subject.create(new Arinc429Word(0));

     onAfterRender(node: VNode): void {
         super.onAfterRender(node);

         const sub = this.props.bus.getSubscriber<PFDSimvars>();

         sub.on('altitude').handle((alt) => {
             const altitude = new Arinc429Word(alt);

             this.altitude.set(altitude);
         });

         sub.on('linearDeviationActive').whenChanged().handle((isActive) => {
             this.lastIsActive = isActive;

             hideOrShow(this.component)(isActive);
             hideOrShow(this.upperLinearDeviationReadout)(isActive);
             hideOrShow(this.lowerLinearDeviationReadout)(isActive);
         });

         sub.on('verticalProfileLatched').whenChanged().handle(hideOrShow(this.latchSymbol));

         sub.on('targetAltitude').atFrequency(3).handle((targetAltitude) => {
             const altitude = this.altitude.get();
             if (!altitude.isNormalOperation()) {
                 return;
             }

             const deviation = altitude.value - targetAltitude;

             // Only update this if it's actually active
             if (!this.lastIsActive) {
                 return;
             }

             const pixelOffset = this.pixelOffsetFromDeviation(Math.max(Math.min(deviation, 500), -500));

             this.component.instance.style.transform = `translate3d(0px, ${pixelOffset}px, 0px)`;

             const linearDeviationReadoutText = Math.round(Math.abs(deviation) / 100).toFixed(0).padStart(2, '0');

             this.upperLinearDeviationReadout.instance.textContent = linearDeviationReadoutText;
             this.lowerLinearDeviationReadout.instance.textContent = linearDeviationReadoutText;

             if (deviation > 540) {
                 this.lowerLinearDeviationReadout.instance.style.visibility = 'visible';
                 this.linearDeviationDotLowerHalf.instance.style.visibility = 'visible';

                 this.upperLinearDeviationReadout.instance.style.visibility = 'hidden';
                 this.linearDeviationDotUpperHalf.instance.style.visibility = 'hidden';

                 this.linearDeviationDot.instance.style.visibility = 'hidden';
             } else if (deviation > -500 && deviation < 500) {
                 this.lowerLinearDeviationReadout.instance.style.visibility = 'hidden';
                 this.linearDeviationDotLowerHalf.instance.style.visibility = 'hidden';

                 this.upperLinearDeviationReadout.instance.style.visibility = 'hidden';
                 this.linearDeviationDotUpperHalf.instance.style.visibility = 'hidden';

                 this.linearDeviationDot.instance.style.visibility = 'visible';
             } else if (deviation < -540) {
                 this.lowerLinearDeviationReadout.instance.style.visibility = 'hidden';
                 this.linearDeviationDotLowerHalf.instance.style.visibility = 'hidden';

                 this.upperLinearDeviationReadout.instance.style.visibility = 'visible';
                 this.linearDeviationDotUpperHalf.instance.style.visibility = 'visible';

                 this.linearDeviationDot.instance.style.visibility = 'hidden';
             }
         });
     }

     render(): VNode {
         return (
             <g id="LinearDeviationIndicator">
                 <text ref={this.upperLinearDeviationReadout} x="110" y="42.5" class="FontSmallest Green" />
                 <g ref={this.component} id="LinearDeviationDot">
                     <path id="EntireDot" ref={this.linearDeviationDot} d="m119.26 80.796a1.511 1.5119 0 1 0-3.022 0 1.511 1.5119 0 1 0 3.022 0z" class="Fill Green" />
                     <path
                         id="DotUpperHalf"
                         style="visiblity: hidden;"
                         ref={this.linearDeviationDotUpperHalf}
                         d="m116.24 80.796c4.9e-4 -0.83466 0.67686-1.511 1.511-1.511 0.83418 0 1.5105 0.67635 1.511 1.511h-1.511z"
                         class="Fill Green"
                     />
                     <path
                         id="DotLowerHalf"
                         style="visiblity: hidden;"
                         ref={this.linearDeviationDotLowerHalf}
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
