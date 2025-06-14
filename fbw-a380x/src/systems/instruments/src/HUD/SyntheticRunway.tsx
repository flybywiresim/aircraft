// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Subject,
  ClockEvents,
  DisplayComponent,
  FSComponent,
  Subscribable,
  VNode,
  NodeReference,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, HUDSyntheticRunway } from '@flybywiresim/fbw-sdk';
import { getSmallestAngle, HudElems } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars, HUDSymbolData } from './shared/HUDSimvarPublisher';

export class SyntheticRunway extends DisplayComponent<{
  bus: ArincEventBus;
  filteredRadioAlt: Subscribable<number>;
}> {
  private filteredRadioAltitude = 0;
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private sVisibility = Subject.create<String>('');
  private data: HUDSyntheticRunway;
  private validData = false;
  private alt: number;
  private logOnce = 0;
  private belowMda = true; //set true for debug | false for prod
  private altitude = 0;
  private lat: number;
  private long: number;
  private heading: number;
  private MdaOrDh: number;
  private mda: number;
  private dh: number;
  private nMda = 0;
  private aMda = 0;
  private landingElevation = 0;
  private altMode: 'STD' | 'QNH' | 'QFE' = 'STD';
  private prevRwyHdg;
  // private centerlineGroupRef = FSComponent.createRef<SVGGElement>();

  private pathRefs: NodeReference<SVGTextElement>[] = [];
  private centerlinePathRefs: NodeReference<SVGTextElement>[] = [];

  private updateIndication(): void {
    if (this.filteredRadioAltitude < 100) {
      this.sVisibility.set('none');
    }
    // console.log(
    //   'altDelta' +
    //     this.mda +
    //     ' altDeltaDh' +
    //     this.dh +
    //     ' mdaOrDh: ' +
    //     this.MdaOrDh +
    //     ' this.belowMda: ' +
    //     this.belowMda +
    //     ' this.filteredRadioAltitude: ' +
    //     this.filteredRadioAltitude,
    // );
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HUDSymbolData & HudElems>();

    sub
      .on('radioAltitude1')
      .whenChanged()
      .handle(() => {
        this.updateIndication();
      });

    this.props.filteredRadioAlt.sub((fra) => {
      this.filteredRadioAltitude = fra;
    }, true);

    sub
      .on('decMode')

      .handle((value) => {
        //console.log(this.filteredRadioAltitude + ' ' + this.sVisibility);
        if (this.filteredRadioAltitude < 100) {
          this.sVisibility.set('none');
        } else {
          value.get() > 0 ? this.sVisibility.set('none') : this.sVisibility.set('block');
        }
      });

    sub.on('symbol').handle((data) => {
      this.data = data;
      if (this.data === undefined) {
        console.log('symbol data not loaded');
      }
    });

    sub
      .on('realTime')
      .atFrequency(4)
      .handle((_t) => {
        this.alt = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
        this.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        this.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
        this.mda = SimVar.GetSimVarValue('L:AIRLINER_MINIMUM_DESCENT_ALTITUDE', 'feet');
        this.dh = SimVar.GetSimVarValue('L:AIRLINER_DECISION_HEIGHT', 'feet');

        if (this.data !== undefined) {
          if (this.prevRwyHdg !== this.data.direction) {
            this.prevRwyHdg = this.data.direction;
            this.logOnce = 0;
            //console.log("defined data");
          }
          this.updateSyntheticRunway();
        } else {
          console.log('undefined data...');
        }
        this.updateIndication();
      });

    sub.on('headingAr').handle((h) => {
      this.heading = this.magneticToTrue(h.value);
    });
  }

  private magneticToTrue(magneticHeading: Degrees, amgVar?: Degrees): Degrees {
    return (720 + magneticHeading + (amgVar || SimVar.GetSimVarValue('MAGVAR', 'degree'))) % 360;
  }

  private trueToMagnetic(trueHeading: DegreesTrue, magVar?: Degrees): Degrees {
    return (720 + trueHeading - (magVar || SimVar.GetSimVarValue('MAGNAR', 'degree'))) % 360;
  }

  // 	Phiφ is latitude, Lambdaλ is longitude, θ is the bearing (clockwise from north), δ is the angular distance d/R; d being the distance travelled, R the earth’s radius
  //  (all angles in radians)

  DestFromPointCoordsBearingDistance(brng: number, d: number, Lat1: number, Lon1: number): LatLongAlt {
    const rBrng = (brng / 180) * Math.PI;
    const rLat1 = (Lat1 / 180) * Math.PI;
    const rLon1 = (Lon1 / 180) * Math.PI;
    const R = 6371;
    const L = d / 1000;

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
    //console.log('update...');
    const JKCoords: LatLongAlt[] = [];
    const centerLineCoords: LatLongAlt[] = [];

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
    const p5 = new LatLongAlt();
    p5.lat = this.data.thresholdLocation.lat;
    p5.long = this.data.thresholdLocation.long;
    p5.alt = this.data.thresholdCrossingHeight - 50; //in feet
    centerLineCoords.push(p5);

    const p6 = this.DestFromPointCoordsBearingDistance((this.data.direction + 180) % 360, 7500, p5.lat, p5.long);
    p6.alt = this.data.thresholdCrossingHeight - 50; //in feet
    centerLineCoords.push(p6);
    const p7 = this.DestFromPointCoordsBearingDistance((this.data.direction + 180) % 360, 7500, p6.lat, p6.long);
    p7.alt = this.data.thresholdCrossingHeight - 50; //in feet
    centerLineCoords.push(p7);
    const p8 = this.DestFromPointCoordsBearingDistance((this.data.direction + 180) % 360, 7500, p7.lat, p7.long);
    p8.alt = this.data.thresholdCrossingHeight - 50; //in feet
    centerLineCoords.push(p8);
    const p9 = this.DestFromPointCoordsBearingDistance((this.data.direction + 180) % 360, 7500, p8.lat, p8.long);
    p9.alt = this.data.thresholdCrossingHeight - 50; //in feet
    centerLineCoords.push(p9);

    if (this.logOnce == 0) {
      this.logOnce += 1;

      console.log(
        '\nlocation lat: ' + this.data.location.lat,
        'location lon: ' + this.data.location.long,

        'thresholdLocation lat: ' + this.data.thresholdLocation.lat,
        'thresholdLocation lon: ' + this.data.thresholdLocation.long,

        'startLocation lat: ' + this.data.startLocation.lat,
        'startLocation lon: ' + this.data.startLocation.long,

        'runway bearing: ' + this.data.direction,
        'runway magnetic bearing: ' + this.data.direction,

        'runway length: ' + this.data.length,

        'threshold elev: ' + this.data.elevation,

        'runway gradient: ' + this.data.gradient,

        'threshold crossing height: ' + this.data.thresholdCrossingHeight,

        '\np1 lat: ' + JKCoords[0].lat,
        'p1 long: ' + JKCoords[0].long,
        'p1 alt: ' + JKCoords[0].alt,

        'p2 lat: ' + JKCoords[1].lat,
        'p2 lon: ' + JKCoords[1].long,
        'p2 alt: ' + JKCoords[1].alt,

        'p3 lat: ' + this.data.cornerCoordinates[2].lat,
        'p3 lon: ' + this.data.cornerCoordinates[2].long,
        'p3 alt: ' + this.data.cornerCoordinates[2].alt,

        'p4 lat: ' + this.data.cornerCoordinates[3].lat,
        'p4 lon: ' + this.data.cornerCoordinates[3].long,
        'p4 alt: ' + this.data.cornerCoordinates[3].alt,

        'p5 lat: ' + centerLineCoords[0].lat,
        'p5 lon: ' + centerLineCoords[0].long,
        'p5 alt: ' + centerLineCoords[0].alt,

        'p6 lat: ' + centerLineCoords[1].lat,
        'p6 lon: ' + centerLineCoords[1].long,
        'p6 alt: ' + centerLineCoords[1].alt,
      );
    }

    if (this.data && JKCoords.length === 4) {
      for (let i = 0; i < 4; i++) {
        this.pathRefs[i].instance.setAttribute('d', this.drawPath(JKCoords[i], JKCoords[(i + 1) % 4]));
      }
      for (let i = 0; i < 4; i++) {
        this.centerlinePathRefs[i].instance.setAttribute(
          'd',
          this.drawPath(centerLineCoords[i], centerLineCoords[i + 1]),
        );
      }
    }
  }

  drawPath(p1: LatLongAlt, p2: LatLongAlt) {
    const deltaDeg1 = this.calcDeltaDegrees(p1);
    const deltaDeg2 = this.calcDeltaDegrees(p2);
    const vis1 = this.inView(deltaDeg1);
    const vis2 = this.inView(deltaDeg2);
    if (vis1 && vis2) {
      return `M${(deltaDeg1[0] * 1280) / 35 + 640},${(-deltaDeg1[1] * 1024) / 28 + 512}
            L${(deltaDeg2[0] * 1280) / 35 + 640},${(-deltaDeg2[1] * 1024) / 28 + 512}`;
    }
    if (vis1 && !vis2) {
      const deltaDegNew = this.calcDeltaDegrees(this.getInViewPoint(p1, p2));
      return `M${(deltaDeg1[0] * 1280) / 35 + 640},${(-deltaDeg1[1] * 1024) / 28 + 512}
            L${(deltaDegNew[0] * 1280) / 35 + 640},${(-deltaDegNew[1] * 1024) / 28 + 512}`;
    }
    if (!vis1 && vis2) {
      const deltaDegNew = this.calcDeltaDegrees(this.getInViewPoint(p2, p1));
      return `M${(deltaDeg2[0] * 1280) / 35 + 640},${(-deltaDeg2[1] * 1024) / 28 + 512}
            L${(deltaDegNew[0] * 1280) / 35 + 640},${(-deltaDegNew[1] * 1024) / 28 + 512}`;
    }
    return '';
  }

  getInViewPoint(p1: LatLongAlt, p2: LatLongAlt) {
    let alpha = 0.5;
    let bestP = p1;
    for (let i = 0; i < 5; i++) {
      const newP = new LatLongAlt(
        alpha * p1.lat + (1 - alpha) * p2.lat,
        alpha * p1.long + (1 - alpha) * p2.long,
        alpha * p1.alt + (1 - alpha) * p2.alt,
      );

      if (this.inView(this.calcDeltaDegrees(newP))) {
        alpha -= 1 / 2 ** (i + 2);
        bestP = newP;
      } else {
        alpha += 1 / 2 ** (i + 2);
      }
    }
    return bestP;
  }

  calcDeltaDegrees(p: LatLongAlt) {
    const dist = Avionics.Utils.computeGreatCircleDistance({ lat: this.lat, long: this.long }, p); // in nautical miles
    const heading = Avionics.Utils.computeGreatCircleHeading({ lat: this.lat, long: this.long }, p); // in degrees
    const deltaHeading = getSmallestAngle(heading, this.heading);
    const deltaPitch = (Math.atan(((p.alt - this.alt) * 0.3048) / (dist * 1852)) / Math.PI) * 180;
    return [deltaHeading, deltaPitch]; // in degrees
  }

  inView(delta: number[]) {
    //return Math.abs(delta[0]) <= 25 && Math.abs(delta[1]) <= 28;  //ori
    return Math.abs(delta[0]) <= 35 && Math.abs(delta[1]) <= 28;
  }

  render(): VNode {
    const res: SVGPathElement[] = [];
    for (let i = 0; i < 4; i++) {
      const pathRef = FSComponent.createRef<SVGTextElement>();
      res.push(<path class="SmallStroke Green" ref={pathRef} d="" />);
      this.pathRefs.push(pathRef);
    }
    for (let i = 0; i < 4; i++) {
      const centerlineRef = FSComponent.createRef<SVGTextElement>();
      res.push(<path class="SmallStroke Green" ref={centerlineRef} d="" />);
      this.centerlinePathRefs.push(centerlineRef);
    }

    return (
      <g id="SyntheticRunway" display={this.sVisibility}>
        {res}
      </g>
    );
  }
}
