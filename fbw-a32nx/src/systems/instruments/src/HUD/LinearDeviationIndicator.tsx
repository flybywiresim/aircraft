import { DisplayComponent, EventBus, FSComponent, Subject, VNode,ConsumerSubject, SubscribableMapFunctions, HEvent  } from '@microsoft/msfs-sdk';
import { FmsVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { Arinc429Values } from 'instruments/src/HUD/shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';

export const getDisplayIndex = () => {
    const url = document.getElementsByTagName('a32nx-hud')[0].getAttribute('url');
    return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

type LinearDeviationIndicatorProps = {
    bus: EventBus,
}

export class LinearDeviationIndicator extends DisplayComponent<LinearDeviationIndicatorProps> {
    
    private flightPhase = -1;
    private declutterMode = 0;
    private crosswindMode = false;
    private sVisibility = Subject.create<String>('');
    private lgRightCompressed = false;
        
    private shouldShowLinearDeviation = false;

    private componentTransform = Subject.create('');

    private upperLinearDeviationReadoutText = Subject.create('00');

    private upperLinearDeviationReadoutVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private lowerLinearDeviationReadoutText = Subject.create('00');

    private lowerLinearDeviationReadoutVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private linearDeviationDotVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private linearDeviationDotUpperHalfVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private linearDeviationDotLowerHalfVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    private latchSymbolVisibility = Subject.create<'visible' | 'hidden'>('hidden');

    // TODO: Use ARINC value for this
    private flightPathAltitude: Feet = 0;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<Arinc429Values & FmsVars & HEvent   & HUDSimvars>();
    
        sub.on('fwcFlightPhase').whenChanged().handle((fp) => {
            this.crosswindMode = SimVar.GetSimVarValue('L:A32NX_HUD_CROSSWIND_MODE','Bool');
            this.declutterMode = SimVar.GetSimVarValue('L:A32NX_HUD_DECLUTTER_MODE','Number');
            this.flightPhase = fp;
            this.lgRightCompressed = SimVar.GetSimVarValue('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED','Bool');
              //preflight / taxi
              if(this.flightPhase <= 2 ){
                if(this.declutterMode == 2 ){
                  this.sVisibility.set("none");
                } 
                if(this.declutterMode < 2 ) {
                  this.sVisibility.set(this.crosswindMode ? "none" : "block");
                }  
              }
              //takeoff
              if(this.flightPhase >= 3 && this.flightPhase <= 5){
                this.sVisibility.set(this.crosswindMode ? "none" : "block");
              }  
              //clb crz des
              if( this.flightPhase == 6 || this.flightPhase == 7){
                if(this.declutterMode == 2 ){
                  this.sVisibility.set("none");
                }  
                if(this.declutterMode < 2 ) {   
                  this.sVisibility.set(this.crosswindMode ? "none" : "block");
                }   
              }
            });
              
            // remove alt tape on rollout
            sub.on('leftMainGearCompressed').whenChanged().handle((value) => {
              this.lgRightCompressed = value;
              //console.log('lgleftComp: '+ this.lgRightCompressed);
              if(this.lgRightCompressed == true){
                if(this.flightPhase >= 7 ){
                  this.sVisibility.set("none");
                  console.log('lgleftComp2: ' + this.lgRightCompressed);
                }
              }
            });
        
        
            sub.on('declutterMode').whenChanged().handle((value) => {
              this.crosswindMode = SimVar.GetSimVarValue('L:A32NX_HUD_CROSSWIND_MODE','Bool');
              this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE','Number');
              this.declutterMode = value;
              //preflight / taxi
              if(this.flightPhase <= 2 ){
                if(this.declutterMode == 2 ){
                  this.sVisibility.set("none");
                } 
                if(this.declutterMode < 2 ) {
                  this.sVisibility.set(this.crosswindMode ? "none" : "block");
                }  
              }
              //takeoff
              if(this.flightPhase >= 3 && this.flightPhase <= 5){
                this.sVisibility.set(this.crosswindMode ? "none" : "block");
              }  
              //clb crz des
              if( this.flightPhase == 6 || this.flightPhase == 7){
                if(this.declutterMode == 2 ){
                  this.sVisibility.set("none");
                }  
                if(this.declutterMode < 2 ) {   
                  this.sVisibility.set(this.crosswindMode ? "none" : "block");
                }   
              }
            }); 
            
            sub.on('crosswindMode').whenChanged().handle((value) => {
              this.declutterMode = SimVar.GetSimVarValue('L:A32NX_HUD_DECLUTTER_MODE','Number');
              this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE','Number');
              this.crosswindMode = value;
              //preflight / taxi
              if(this.flightPhase <= 2 ){
                if(this.declutterMode == 2 ){
                  this.sVisibility.set("none");
                } 
                if(this.declutterMode < 2 ) {
                  this.sVisibility.set(this.crosswindMode ? "none" : "block");
                }  
              }
              //takeoff
              if(this.flightPhase >= 3 && this.flightPhase <= 5){
                this.sVisibility.set(this.crosswindMode ? "none" : "block");
              }  
              //clb crz des
              if( this.flightPhase == 6 || this.flightPhase == 7){
                if(this.declutterMode == 2 ){
                  this.sVisibility.set("none");
                }  
                if(this.declutterMode < 2 ) {   
                  this.sVisibility.set(this.crosswindMode ? "none" : "block");
                }   
              }
            });

        sub.on('altitudeAr').handle((alt) => {
            if (!alt.isNormalOperation() || !this.shouldShowLinearDeviation) {
                this.upperLinearDeviationReadoutVisibility.set('hidden');
                this.lowerLinearDeviationReadoutVisibility.set('hidden');
                this.linearDeviationDotLowerHalfVisibility.set('hidden');
                this.linearDeviationDotUpperHalfVisibility.set('hidden');
                this.linearDeviationDotVisibility.set('hidden');

                return;
            }

            const deviation = alt.value - this.flightPathAltitude;
            const pixelOffset = this.pixelOffsetFromDeviation(Math.max(Math.min(deviation, 500), -500));

            this.componentTransform.set(`translate(0 ${pixelOffset})`);

            const linearDeviationReadoutText = Math.min(99, Math.round(Math.abs(deviation) / 100)).toFixed(0).padStart(2, '0');

            if (this.upperLinearDeviationReadoutVisibility.get() === 'visible') {
                this.upperLinearDeviationReadoutText.set(linearDeviationReadoutText);
            }

            if (this.lowerLinearDeviationReadoutVisibility.get() === 'visible') {
                this.lowerLinearDeviationReadoutText.set(linearDeviationReadoutText);
            }

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

        sub.on('linearDeviationActive').whenChanged().handle((isActive) => this.shouldShowLinearDeviation = isActive);

        sub.on('verticalProfileLatched').whenChanged().handle((s) => this.latchSymbolVisibility.set(s ? 'visible' : 'hidden'));

        sub.on('targetAltitude').atFrequency(1000 / 60).handle((targetAltitude) => {
            this.flightPathAltitude = targetAltitude;
        });
    }

    render(): VNode {
        return (
            <g id="LinearDeviationIndicator" transform="scale(4.25 4.25) translate(131 38)"  display={this.sVisibility}>
                <text visibility={this.upperLinearDeviationReadoutVisibility} x="110" y="42.5" class="FontMediumSmaller  Green">{this.upperLinearDeviationReadoutText}</text>
                <g id="LinearDeviationDot" transform={this.componentTransform}>
                    <path
                        id="EntireDot"
                        visibility={this.linearDeviationDotVisibility}
                        d="m119.26 80.796a1.511 1.5119 0 1 0-3.022 0 1.511 1.5119 0 1 0 3.022 0z"
                        class="Fill Green"
                    />
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
                    <path visibility={this.latchSymbolVisibility} d="m 119 78.3 h -3 v 5 h 3" class="Magenta" />
                </g>
                <text visibility={this.lowerLinearDeviationReadoutVisibility} x="110" y="123" class="FontMediumSmaller  Green">{this.lowerLinearDeviationReadoutText}</text>
            </g>
        );
    }

    private pixelOffsetFromDeviation(deviation: number) {
        return deviation * 40.5 / 500;
    }
}
