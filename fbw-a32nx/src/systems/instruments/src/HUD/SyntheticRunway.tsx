// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, DisplayComponent, FSComponent, Subscribable, VNode, NodeReference } from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData, GenericDataListenerSync, LegType, RunwaySurface, TurnDirection, VorType, EfisOption, EfisNdMode, NdSymbol, NdSymbolTypeFlags, HUDSyntheticRunway } from '@flybywiresim/fbw-sdk';

import { getDisplayIndex } from './HUD';
import { calculateHorizonOffsetFromPitch, getSmallestAngle } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars, HUDSymbolData } from './shared/HUDSimvarPublisher';

export class SyntheticRunway extends DisplayComponent<{bus: ArincEventBus}> {
    private flightPhase = -1;
    private data : HUDSyntheticRunway;
    private validData = false;
    private alt : number;

    private lat : number;

    private long: number;

    private heading : number;

    private rollGroupRef = FSComponent.createRef<SVGGElement>();
    private centerlineGroupRef = FSComponent.createRef<SVGGElement>();

    private pathRefs: NodeReference<SVGTextElement>[] = [];
    private centerlinePathRefs: NodeReference<SVGTextElement>;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HUDSymbolData>();

        sub.on('fwcFlightPhase').whenChanged().handle((fp) => {
            this.flightPhase = fp;
          });
        sub.on('realTime').atFrequency(8).handle((_t) => {
            this.alt = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
            this.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
            this.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
            if(this.flightPhase >= 4 && this.flightPhase <= 7){
                this.updateSyntheticRunway();
            }
        });
        //try other event to reload after flight load.
        sub.on('symbol').handle((data) => {
            //     if(this.data.cornerCoordinates === undefined){       
                //         this.validData = false;
                //     }else
                //    {
                    //         this.validData = true;
                    //         this.data = data;
                    //     }
                    this.data = data;
            
            
        });

        sub.on('trueHeading').handle((heading) => {
            if (heading.isNormalOperation) {
                this.heading = heading.value;
            }
        });
    }

        // 	Phiφ is latitude, Lambdaλ is longitude, θ is the bearing (clockwise from north), δ is the angular distance d/R; d being the distance travelled, R the earth’s radius
        //  (all angles in radians)

        DestFromPointCoordsBearingDistance(brng: number, d: number, Lat1: number, Lon1: number): LatLongAlt {
        const rBrng = (brng / 180) * Math.PI;
        const rLat1 = (Lat1 / 180) * Math.PI;
        const rLon1 = (Lon1 / 180) * Math.PI;
        const R = 6371;
        const L = d/1000;

        const rLat2 = Math.asin(Math.sin(rLat1) * Math.cos(L / R) + Math.cos(rLat1) * Math.sin(L / R) * Math.cos(rBrng));
        const rLon2 =
          rLon1 +
          Math.atan2(
            Math.sin(rBrng) * Math.sin(L / R) * Math.cos(rLat1),
            Math.cos(L / R) - Math.sin(rLat1) * Math.sin(rLat2),
          );
  
        const dLat2 = (rLat2 / Math.PI) * 180;
        const dLon2 = (rLon2 / Math.PI) * 180;
  
        return new LatLongAlt(dLat2, dLon2);
    }

        updateSyntheticRunway() {
        if(this.validData){

            const distToDestination = Avionics.Utils.computeGreatCircleDistance({ lat: this.lat, long: this.long }, this.data.cornerCoordinates[3]);
            const JKCoords: LatLongAlt[] = [];
            const centerLineCoords: LatLongAlt[] = [];
            
            if(distToDestination <= 150){        // remove on declutter mode
                
                const np1 = this.DestFromPointCoordsBearingDistance(
                this.data.direction,
                this.data.length,
                this.data.cornerCoordinates[3].lat,
                this.data.cornerCoordinates[3].long,
                );
                const np2 = this.DestFromPointCoordsBearingDistance(
                this.data.direction,
                this.data.length,
                this.data.cornerCoordinates[2].lat,
                this.data.cornerCoordinates[2].long,
                );
                JKCoords[0] = np1;
                JKCoords[1] = np2;
                JKCoords[2] = this.data.cornerCoordinates[2];
                JKCoords[3] = this.data.cornerCoordinates[3];
                
                JKCoords[0].alt = this.data.cornerCoordinates[0].alt - 50;
                JKCoords[1].alt = this.data.cornerCoordinates[1].alt - 50;
                JKCoords[2].alt = this.data.cornerCoordinates[2].alt - 50;
                JKCoords[3].alt = this.data.cornerCoordinates[3].alt - 50;
                
                //extended centerline   //1852: nautical miles to meters
                const p5 = Avionics.Utils.bearingDistanceToCoordinates(
                    this.data.direction - 90,
                    0,
                    this.data.thresholdLocation.lat,
                    this.data.thresholdLocation.long,
                );
                p5.alt = this.data.thresholdCrossingHeight - 50; //in feet
                centerLineCoords.push(p5);
                const p6 = this.DestFromPointCoordsBearingDistance((this.data.direction+180) % 360, 30000, p5.lat, p5.long);
                p6.alt = this.data.thresholdCrossingHeight - 50; //in feet
                centerLineCoords.push(p6);
                
                console.log(
                    "location lat: " +
                    this.data.location.lat,
                    "location lon: "+
                    this.data.location.long,
                    
                    "thresholdLocation lat: " +
                    this.data.thresholdLocation.lat,
                    "thresholdLocation lon: "+
                    this.data.thresholdLocation.long,
                    
                    "startLocation lat: " +
                    this.data.startLocation.lat,
                    "startLocation lon: "+
                    this.data.startLocation.long,
                    
                    "runway bearing: " +
                    this.data.direction,
                    "runway magnetic bearing: " +
                    this.data.direction,
                    
                    "runway length: " +
                    this.data.length,
                    
                    "threshold elev: " +
                    this.data.elevation,
                    
                    "runway gradient: " +
                    this.data.gradient,
                    
                    "threshold crossing height: " +
                    this.data.thresholdCrossingHeight,
                    
                    
                    "\np1 lat: " +
                    JKCoords[0].lat,
                    "p1 long: " +
                    JKCoords[0].long,
                    "p1 alt: " +
                    JKCoords[0].alt,
                    
                    
                    
                    "p2 lat: " +
                    JKCoords[1].lat,
                    "p2 lon: "+
                    JKCoords[1].long,
                    "p2 alt: "+
                    JKCoords[1].alt,
                    
                    "p3 lat: " +
                    this.data.cornerCoordinates[2].lat,
                    "p3 lon: "+
                    this.data.cornerCoordinates[2].long,
                    "p3 alt: "+
                    this.data.cornerCoordinates[2].alt,
                    
                    "p4 lat: " +
                    this.data.cornerCoordinates[3].lat,
                    "p4 lon: "+
                    this.data.cornerCoordinates[3].long,
                    "p4 alt: "+
                    this.data.cornerCoordinates[3].alt,
                    
                    "p5 lat: " +
                    centerLineCoords[0].lat,
                    "p5 lon: "+
                    centerLineCoords[0].long,
                    "p5 alt: "+
                    centerLineCoords[0].alt,
                    
                    "p6 lat: " +
                    centerLineCoords[1].lat,
                    "p6 lon: "+
                    centerLineCoords[1].long,
                    "p6 alt: "+
                    centerLineCoords[1].alt
                );
            }
        
            if (this.data && JKCoords.length === 4) {
                this.rollGroupRef.instance.style.display = 'block';
                for (let i = 0; i < 4; i++) {
                    this.pathRefs[i].instance.setAttribute('d', this.drawPath(JKCoords[i], JKCoords[(i + 1) % 4]));
                }
                
                this.centerlineGroupRef.instance.setAttribute('d', this.drawPath(centerLineCoords[0], centerLineCoords[1]));
                
            } else {
                this.rollGroupRef.instance.style.display = 'block';
                // this.rollGroupRef.instance.style.display = 'none';
            }
        }
    }
    
    drawPath(p1: LatLongAlt, p2:LatLongAlt) {
        const deltaDeg1 = this.calcDeltaDegrees(p1);
        const deltaDeg2 = this.calcDeltaDegrees(p2);
        const vis1 = this.inView(deltaDeg1);
        const vis2 = this.inView(deltaDeg2);
        if (vis1 && vis2) {
            return `M${deltaDeg1[0] * 1280 / 35 + 640},${-deltaDeg1[1] * 1024 / 28 + 512}
            L${deltaDeg2[0] * 1280 / 35 + 640},${-deltaDeg2[1] * 1024 / 28 + 512}`;
        } if (vis1 && !vis2) {
            const deltaDegNew = this.calcDeltaDegrees(this.getInViewPoint(p1, p2));
            return `M${deltaDeg1[0] * 1280 / 35 + 640},${-deltaDeg1[1] * 1024 / 28 + 512}
            L${deltaDegNew[0] * 1280 / 35 + 640},${-deltaDegNew[1] * 1024 / 28 + 512}`;
        } if (!vis1 && vis2) {
            const deltaDegNew = this.calcDeltaDegrees(this.getInViewPoint(p2, p1));
            return `M${deltaDeg2[0] * 1280 / 35 + 640},${-deltaDeg2[1] * 1024 / 28 + 512}
            L${deltaDegNew[0] * 1280 / 35 + 640},${-deltaDegNew[1] * 1024 / 28 + 512}`;
        }
        return '';
    }
    
    getInViewPoint(p1: LatLongAlt, p2:LatLongAlt) {
        let alpha = 0.5;
        let bestP = p1;
        for (let i = 0; i < 5; i++) {
            const newP = new LatLongAlt(alpha * p1.lat + (1 - alpha) * p2.lat, alpha * p1.long + (1 - alpha) * p2.long, alpha * p1.alt + (1 - alpha) * p2.alt);
            if (this.inView(this.calcDeltaDegrees(newP))) {
                alpha -= 1 / 2 ** (i + 2);
                bestP = newP;
            } else {
                alpha += 1 / 2 ** (i + 2);
            }
        }
        return bestP;
    }
    
    calcDeltaDegrees(p:LatLongAlt) {
        const dist = Avionics.Utils.computeGreatCircleDistance({ lat: this.lat, long: this.long }, p); // in nautical miles
        const heading = Avionics.Utils.computeGreatCircleHeading({ lat: this.lat, long: this.long }, p); // in degrees
        const deltaHeading = getSmallestAngle(heading, this.heading);
        const deltaPitch = Math.atan((p.alt - this.alt) * 0.3048 / (dist * 1852)) / Math.PI * 180;
        return [deltaHeading, deltaPitch]; // in degrees
    }
    
    inView(delta: number[]) {
        //return Math.abs(delta[0]) <= 25 && Math.abs(delta[1]) <= 28;  //ori
        return Math.abs(delta[0]) <= 35 && Math.abs(delta[1]) <= 28;
        
    }
    
    render(): VNode {
        const res : SVGPathElement[] = [];
        for (let i = 0; i < 4; i++) {
            const pathRef = FSComponent.createRef<SVGTextElement>();
            res.push(<path class="SmallStroke Green" ref={pathRef} d="" />);
            this.pathRefs.push(pathRef);
        }
        res.push(<path class="SmallStroke Green" ref={this.centerlineGroupRef} d="" />);
        
        return (
            <g id="SyntheticRunway" ref={this.rollGroupRef} style="display:block">
                {res}
            </g>
        );
    }
}
