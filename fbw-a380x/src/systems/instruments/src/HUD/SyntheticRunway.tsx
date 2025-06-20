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
  MappedSubject,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';
import { Arinc429ConsumerSubject, ArincEventBus, HUDSyntheticRunway } from '@flybywiresim/fbw-sdk';
import { getSmallestAngle, HudElems } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars, HUDSymbolData } from './shared/HUDSimvarPublisher';

export class SyntheticRunway extends DisplayComponent<{
  bus: ArincEventBus;
  filteredRadioAlt: Subscribable<number>;
}> {
  private flightPhase = -1;
  private crosswindMode = false;
  private sVisibility = Subject.create<String>('');
  private data: HUDSyntheticRunway;
  private validData = false;
  private alt: number;
  private logOnce = 0;
  private belowMda = true; //set true for debug | false for prod
  private lat: number;
  private long: number;
  private heading: number;
  private MdaOrDh: number;
  private nMda = 0;
  private aMda = 0;
  private landingElevation = 0;
  private altMode: 'STD' | 'QNH' | 'QFE' = 'STD';
  private prevRwyHdg;
  // private centerlineGroupRef = FSComponent.createRef<SVGGElement>();

  private pathRefs: NodeReference<SVGTextElement>[] = [];
  private centerlinePathRefs: NodeReference<SVGTextElement>[] = [];

  private sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HUDSymbolData & HudElems>();

  private readonly altitude = Arinc429ConsumerSubject.create(this.sub.on('altitudeAr'));
  private readonly ra = Arinc429ConsumerSubject.create(this.sub.on('chosenRa').whenChanged());
  private readonly mda = ConsumerSubject.create(this.sub.on('mda').whenChanged(), 0);
  private readonly dh = ConsumerSubject.create(this.sub.on('dh').whenChanged(), 0);
  private readonly declutterMode = ConsumerSubject.create(this.sub.on('decMode').whenChanged(), 0);

  private readonly visToggle = MappedSubject.create(
    ([mda, dh, altitude, ra, declutterMode]) => {
      const mdaDiff = altitude.value - mda;
      const dhDiff = ra.value - dh;

      if (declutterMode === 0) {
        if (mda > 50 || dh > 50) {
          if (mda > 0) {
            return mdaDiff < -50 ? 'none' : 'block';
          } else if (dh > 0) {
            return dhDiff < -50 ? 'none' : 'block';
          }
        } else if (dh > 25 && dh <= 50) {
          return dhDiff < -25 ? 'none' : 'block';
        } else if (dh <= 25) {
          return dhDiff <= 0 ? 'none' : 'block';
        } else {
          return 'block';
        }
      } else {
        return 'none';
      }
    },
    this.mda,
    this.dh,
    this.altitude,
    this.ra,
    this.declutterMode,
  );

  private updateIndication(): void {
    this.sVisibility.set(this.visToggle.get());
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('symbol')
      .whenChanged()
      .handle((data) => {
        this.data = data;
        if (this.data === undefined) {
          console.log('symbol data not loaded');
        }
      });

    this.sub
      .on('headingAr')
      .whenChanged()
      .handle((h) => {
        this.heading = this.magneticToTrue(h.value);
      });

    this.sub.on('realTime').handle(this.onFrameUpdate.bind(this));
  }

  private onFrameUpdate(_realTime: number): void {
    this.alt = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
    this.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
    this.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

    if (this.data !== undefined) {
      if (this.prevRwyHdg !== this.data.direction) {
        this.prevRwyHdg = this.data.direction;
        this.logOnce = 0;
        //console.log("defined data");
      }
      this.updateSyntheticRunway();
      this.updateIndication();
    } else {
      this.logOnce == 0;
      console.log('undefined data...');
    }
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

  //aiming point 311 meters (1020ft) from threshold
  // https://www.faa.gov/documentLibrary/media/Advisory_Circular/150-5340-1M-Chg-1-Airport-Markings.pdf
  private threshHeighAbvGnd = 1020 * Math.tan((3 / 180) * Math.PI);

  updateSyntheticRunway() {
    const data2 = JSON.parse(JSON.stringify(this.data));
    //if anyone has a better way to pass this.data by value I want to knwow
    //console.log('update...');
    const JKCoords: LatLongAlt[] = [];
    const centerLineCoords: LatLongAlt[] = [];

    JKCoords[0] = data2.cornerCoordinates[0];
    JKCoords[1] = data2.cornerCoordinates[1];
    JKCoords[2] = data2.cornerCoordinates[2];
    JKCoords[3] = data2.cornerCoordinates[3];

    centerLineCoords[0] = data2.centerlineCoordinates[0];
    centerLineCoords[1] = data2.centerlineCoordinates[1];
    centerLineCoords[2] = data2.centerlineCoordinates[2];
    centerLineCoords[3] = data2.centerlineCoordinates[3];
    centerLineCoords[4] = data2.centerlineCoordinates[4];

    JKCoords[0].alt = JKCoords[0].alt - this.threshHeighAbvGnd;
    JKCoords[1].alt = JKCoords[1].alt - this.threshHeighAbvGnd;
    JKCoords[2].alt = JKCoords[2].alt - this.threshHeighAbvGnd;
    JKCoords[3].alt = JKCoords[3].alt - this.threshHeighAbvGnd;

    // //extended centerline   //1852: nautical miles to meters

    centerLineCoords[0].alt = centerLineCoords[0].alt - this.threshHeighAbvGnd;
    centerLineCoords[1].alt = centerLineCoords[1].alt - this.threshHeighAbvGnd;
    centerLineCoords[2].alt = centerLineCoords[2].alt - this.threshHeighAbvGnd;
    centerLineCoords[3].alt = centerLineCoords[3].alt - this.threshHeighAbvGnd;
    centerLineCoords[4].alt = centerLineCoords[4].alt - this.threshHeighAbvGnd;

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

        'p3 lat: ' + JKCoords[2].lat,
        'p3 lon: ' + JKCoords[2].long,
        'p3 alt: ' + JKCoords[2].alt,

        'p4 lat: ' + JKCoords[3].lat,
        'p4 lon: ' + JKCoords[3].long,
        'p4 alt: ' + JKCoords[3].alt,

        'p5 lat: ' + centerLineCoords[0].lat,
        'p5 lon: ' + centerLineCoords[0].long,
        'p5 alt: ' + centerLineCoords[0].alt,

        'p6 lat: ' + centerLineCoords[1].lat,
        'p6 lon: ' + centerLineCoords[1].long,
        'p6 alt: ' + centerLineCoords[1].alt,
      );
    }

    if (JKCoords.length) {
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
