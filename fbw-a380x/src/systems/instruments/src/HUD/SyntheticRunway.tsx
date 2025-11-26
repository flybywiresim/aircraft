// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  DisplayComponent,
  FSComponent,
  Subscribable,
  VNode,
  NodeReference,
  MappedSubject,
  ConsumerSubject,
  Subscription,
} from '@microsoft/msfs-sdk';
import {
  Arinc429ConsumerSubject,
  ArincEventBus,
  HUDSyntheticRunway,
  Arinc429RegisterSubject,
} from '@flybywiresim/fbw-sdk';
import { getSmallestAngle, HudElems, MdaMode } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars, HUDSymbolData } from './shared/HUDSimvarPublisher';

export class SyntheticRunway extends DisplayComponent<{
  bus: ArincEventBus;
  filteredRadioAlt: Subscribable<number>;
}> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<
    HUDSimvars & Arinc429Values & ClockEvents & HUDSymbolData & HudElems
  >();

  private data?: HUDSyntheticRunway;
  private alt = 0;
  private logOnce = 0;
  private lat = 0;
  private long = 0;
  private heading = 0;
  private prevRwyHdg = 0;

  private pathRefs: NodeReference<SVGTextElement>[] = [];
  private centerlinePathRefs: NodeReference<SVGTextElement>[] = [];

  private JKCoords: LatLongAlt[] = [];
  private centerLineCoords: LatLongAlt[] = [];
  private threshHeighAbvGnd = 1020 * Math.tan((3 / 180) * Math.PI);
  private data2?: HUDSyntheticRunway;
  /** bit 29 is NO DH selection */
  private readonly fmEisDiscrete2 = Arinc429RegisterSubject.createEmpty();

  private readonly altitude = Arinc429ConsumerSubject.create(this.sub.on('altitudeAr'));
  private readonly ra = Arinc429ConsumerSubject.create(this.sub.on('chosenRa').whenChanged());
  private readonly syntheticRunwway = ConsumerSubject.create(this.sub.on('syntheticRunwway').whenChanged(), '');
  private readonly mda = Arinc429RegisterSubject.createEmpty();
  private readonly dh = Arinc429RegisterSubject.createEmpty();
  private readonly noDhSelected = this.fmEisDiscrete2.map((r) => r.bitValueOr(29, false));
  private readonly symb = ConsumerSubject.create(this.sub.on('symbol'), undefined);
  private readonly mdaDhMode = MappedSubject.create(
    ([noDh, dh, mda]) => {
      if (noDh) {
        return MdaMode.NoDh;
      }

      if (!dh.isNoComputedData() && !dh.isFailureWarning()) {
        return MdaMode.Radio;
      }

      if (!mda.isNoComputedData() && !mda.isFailureWarning()) {
        return MdaMode.Baro;
      }

      return MdaMode.None;
    },
    this.noDhSelected,
    this.dh,
    this.mda,
  );

  private readonly isDefined = MappedSubject.create(([symb]) => {
    this.data = symb;
    if (this.data === undefined) {
      //console.log('M symbol data not loaded');
    } else {
      //console.log('M symbol data loaded');
      this.data2 = JSON.parse(JSON.stringify(this.data));
      this.initRwyPoints();
    }

    return symb !== undefined;
  }, this.symb);

  private readonly mdaDhValue = MappedSubject.create(
    ([mdaMode, dh, mda]) => {
      switch (mdaMode) {
        case MdaMode.Baro:
          return mda.value;
        case MdaMode.Radio:
          return dh.value;
        default:
          return 0;
      }
    },
    this.mdaDhMode,
    this.dh,
    this.mda,
  );

  private readonly visToggle = MappedSubject.create(
    ([mda, dh, mdaDhMode, altitude, ra, syntheticRunwway]) => {
      let diff;
      const minAlt = this.mdaDhValue.get();
      if (syntheticRunwway === 'block' && this.isDefined.get() === true) {
        switch (mdaDhMode) {
          case MdaMode.Baro:
            diff = altitude.value - mda.value;

            break;
          case MdaMode.Radio:
            diff = ra.value - dh.value;
            break;
          case MdaMode.NoDh:
            diff = ra.value;
            break;
          default:
            diff = 0;
            break;
        }
        if (mdaDhMode === MdaMode.Baro) {
          return diff < -50 ? 'none' : 'block';
        }

        if (mdaDhMode === MdaMode.Radio) {
          if (minAlt > 50) {
            return diff < -50 ? 'none' : 'block';
          } else if (minAlt > 25 && minAlt <= 50) {
            return diff < -25 ? 'none' : 'block';
          } else if (minAlt <= 25) {
            return diff <= 0 ? 'none' : 'block';
          }
        }

        if (mdaDhMode === MdaMode.NoDh || mdaDhMode === MdaMode.None) {
          return diff > 10 ? 'none' : 'block';
        }
      } else {
        return 'none';
      }
    },
    this.mda,
    this.dh,
    this.mdaDhMode,
    this.altitude,
    this.ra,
    this.syntheticRunwway,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.altitude, this.ra, this.syntheticRunwway, this.noDhSelected, this.symb);

    this.subscriptions.push(this.sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda)));
    this.subscriptions.push(this.sub.on('fmDhRaw').handle(this.dh.setWord.bind(this.dh)));

    this.subscriptions.push(
      this.sub
        .on('headingAr')
        .whenChanged()
        .handle((h) => {
          this.heading = this.magneticToTrue(h.value);
        }),
    );

    this.subscriptions.push(this.sub.on('realTime').handle(this.onFrameUpdate.bind(this)));
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.visToggle.get() === 'block') {
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
      } else {
        this.logOnce == 0;
        console.log('undefined data...');
      }
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

  //if anyone has a better way to pass this.data by value I want to knwow

  private initRwyPoints() {
    //console.log('update...');
    if (this.data2 !== undefined) {
      this.JKCoords[0] = this.data2.cornerCoordinates[0];
      this.JKCoords[1] = this.data2.cornerCoordinates[1];
      this.JKCoords[2] = this.data2.cornerCoordinates[2];
      this.JKCoords[3] = this.data2.cornerCoordinates[3];
      this.centerLineCoords[0] = this.data2.centerlineCoordinates[0];
      this.centerLineCoords[1] = this.data2.centerlineCoordinates[1];
      this.centerLineCoords[2] = this.data2.centerlineCoordinates[2];
      this.centerLineCoords[3] = this.data2.centerlineCoordinates[3];
      this.centerLineCoords[4] = this.data2.centerlineCoordinates[4];

      this.JKCoords[0].alt = this.JKCoords[0].alt - this.threshHeighAbvGnd;
      this.JKCoords[1].alt = this.JKCoords[1].alt - this.threshHeighAbvGnd;
      this.JKCoords[2].alt = this.JKCoords[2].alt - this.threshHeighAbvGnd;
      this.JKCoords[3].alt = this.JKCoords[3].alt - this.threshHeighAbvGnd;

      // //extended centerline   //1852: nautical miles to meters

      this.centerLineCoords[0].alt = this.centerLineCoords[0].alt - this.threshHeighAbvGnd;
      this.centerLineCoords[1].alt = this.centerLineCoords[1].alt - this.threshHeighAbvGnd;
      this.centerLineCoords[2].alt = this.centerLineCoords[2].alt - this.threshHeighAbvGnd;
      this.centerLineCoords[3].alt = this.centerLineCoords[3].alt - this.threshHeighAbvGnd;
      this.centerLineCoords[4].alt = this.centerLineCoords[4].alt - this.threshHeighAbvGnd;
    }
  }

  updateSyntheticRunway() {
    if (this.logOnce === 0 && this.data !== undefined) {
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

        '\np1 lat: ' + this.JKCoords[0].lat,
        'p1 long: ' + this.JKCoords[0].long,
        'p1 alt: ' + this.JKCoords[0].alt,

        'p2 lat: ' + this.JKCoords[1].lat,
        'p2 lon: ' + this.JKCoords[1].long,
        'p2 alt: ' + this.JKCoords[1].alt,

        'p3 lat: ' + this.JKCoords[2].lat,
        'p3 lon: ' + this.JKCoords[2].long,
        'p3 alt: ' + this.JKCoords[2].alt,

        'p4 lat: ' + this.JKCoords[3].lat,
        'p4 lon: ' + this.JKCoords[3].long,
        'p4 alt: ' + this.JKCoords[3].alt,

        'p5 lat: ' + this.centerLineCoords[0].lat,
        'p5 lon: ' + this.centerLineCoords[0].long,
        'p5 alt: ' + this.centerLineCoords[0].alt,

        'p6 lat: ' + this.centerLineCoords[1].lat,
        'p6 lon: ' + this.centerLineCoords[1].long,
        'p6 alt: ' + this.centerLineCoords[1].alt,
      );
    }

    if (this.JKCoords.length === 4) {
      for (let i = 0; i < 4; i++) {
        this.pathRefs[i].instance.setAttribute('d', this.drawPath(this.JKCoords[i], this.JKCoords[(i + 1) % 4]));
      }
      for (let i = 0; i < 4; i++) {
        this.centerlinePathRefs[i].instance.setAttribute(
          'd',
          this.drawPath(this.centerLineCoords[i], this.centerLineCoords[i + 1]),
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

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
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
      <g id="SyntheticRunway" display={this.visToggle}>
        {res}
      </g>
    );
  }
}
