// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { getDisplayIndex } from 'instruments/src/PFD/PFD';

import {
  Arinc429LocalVarConsumerSubject,
  Arinc429RegisterSubject,
  Arinc429Word,
  MathUtils,
} from '@flybywiresim/fbw-sdk';
import {
  ClockEvents,
  ConsumerSubject,
  EventBus,
  ExpSmoother,
  Instrument,
  Publisher,
  Subscription,
} from '@microsoft/msfs-sdk';

import { PFDSimvars } from './PFDSimvarPublisher';
import { A380XFcuBusEvents } from '@shared/publishers/A380XFcuBusPublisher';

export interface Arinc429Values {
  slatsFlapsStatus: Arinc429Word;
  slatsPosition: Arinc429Word;
  flapsPosition: Arinc429Word;
  pitchAr: Arinc429Word;
  rollAr: Arinc429Word;

  /** The "displayed altitude" in feet. It's baro corrected for QFE/QNH modes, otherwise pressure alt. */
  altitudeAr: Arinc429Word;

  groundTrackAr: Arinc429Word;
  headingAr: Arinc429Word;
  speedAr: Arinc429Word;
  machAr: Arinc429Word;
  vs: Arinc429Word;
  gs: Arinc429Word;
  chosenRa: Arinc429Word;
  fpa: Arinc429Word;
  da: Arinc429Word;
  landingElevation: Arinc429Word;
  staticPressure: Arinc429Word;
  fcdcDiscreteWord1: Arinc429Word;
  fcdc1DiscreteWord1: Arinc429Word;
  fcdc2DiscreteWord1: Arinc429Word;
  facToUse: number;
  vAlphaMax: Arinc429Word;
  vAlphaProt: Arinc429Word;
  vStallWarn: Arinc429Word;
  vMax: Arinc429Word;
  vFeNext: Arinc429Word;
  vCTrend: Arinc429Word;
  vMan: Arinc429Word;
  v4: Arinc429Word;
  v3: Arinc429Word;
  vLs: Arinc429Word;
  estimatedBeta: Arinc429Word;
  betaTarget: Arinc429Word;
  fmEisDiscreteWord1Raw: number;
  fmEisDiscreteWord2Raw: number;
  fmMdaRaw: number;
  fmDhRaw: number;
  fmTransAltRaw: number;
  fmTransLvlRaw: number;
  lgciuDiscreteWord1: Arinc429Word;
}
export class ArincValueProvider implements Instrument {
  private readonly sub = this.bus.getSubscriber<A380XFcuBusEvents & ClockEvents & PFDSimvars & SimplaneValues>();

  private roll = new Arinc429Word(0);

  private pitch = new Arinc429Word(0);

  private groundTrack = new Arinc429Word(0);

  private heading = new Arinc429Word(0);

  private speed = new Arinc429Word(0);

  /** Displayed altitude. */
  private readonly altitude = Arinc429RegisterSubject.createEmpty();

  private readonly unfilteredAltitude = Arinc429RegisterSubject.createEmpty();

  private readonly baroCorrectedAltitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('baroCorrectedAltitude'));

  private readonly pressureAltitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('pressureAltitude'));

  private readonly altitudeFilter = new ExpSmoother(0.3, 0, 1);
  private lastAltitudeFilterTime = -1;

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private mach = new Arinc429Word(0);

  private vsInert = new Arinc429Word(0);

  private vsBaro = new Arinc429Word(0);

  private groundSpeed = new Arinc429Word(0);

  private radioAltitude1 = new Arinc429Word(0);

  private radioAltitude2 = new Arinc429Word(0);

  private radioAltitude3 = new Arinc429Word(0);

  private fpa = new Arinc429Word(0);

  private da = new Arinc429Word(0);

  private ownLandingElevation = new Arinc429Word(0);

  private oppLandingElevation = new Arinc429Word(0);

  private staticPressure = new Arinc429Word(0);

  private fac1Healthy = false;

  private fac2Healthy = false;

  private fac1VAlphaMax = new Arinc429Word(0);

  private fac2VAlphaMax = new Arinc429Word(0);

  private facToUse = 0;

  private lgciuDiscreteWord1 = new Arinc429Word(0);

  private readonly fm1Healthy = ConsumerSubject.create(null, 0);

  private readonly fm2Healthy = ConsumerSubject.create(null, 0);

  private readonly fm1Subs: Subscription[] = [];

  private readonly fm2Subs: Subscription[] = [];

  // each alti source should have a pipe, and only one pipe should be unpaused at a time
  private readonly baroAltitudePipe = this.baroCorrectedAltitude.pipe(this.unfilteredAltitude, true);
  private readonly pressureAltitudePipe = this.pressureAltitude.pipe(this.unfilteredAltitude, true);

  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const isFo = getDisplayIndex() === 2;

    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'a380x_fcu_eis_discrete_word_2_right' : 'a380x_fcu_eis_discrete_word_2_left'),
    );

    const publisher = this.bus.getPublisher<Arinc429Values>();
    const subscriber = this.bus.getSubscriber<PFDSimvars>();

    subscriber.on('slatsFlapsStatusRaw').handle((w) => {
      publisher.pub('slatsFlapsStatus', new Arinc429Word(w));
    });

    subscriber.on('slatsPositionRaw').handle((w) => {
      publisher.pub('slatsPosition', new Arinc429Word(w));
    });

    subscriber.on('flapsPositionRaw').handle((w) => {
      publisher.pub('flapsPosition', new Arinc429Word(w));
    });

    subscriber.on('pitch').handle((p) => {
      this.pitch = new Arinc429Word(p);
      publisher.pub('pitchAr', this.pitch);
    });
    subscriber.on('roll').handle((p) => {
      this.roll = new Arinc429Word(p);
      publisher.pub('rollAr', this.roll);
    });
    subscriber.on('groundTrack').handle((gt) => {
      this.groundTrack = new Arinc429Word(gt);
      publisher.pub('groundTrackAr', this.groundTrack);
    });
    subscriber.on('heading').handle((h) => {
      this.heading = new Arinc429Word(h);
      publisher.pub('headingAr', this.heading);
    });

    subscriber.on('speed').handle((s) => {
      this.speed = new Arinc429Word(s);
      publisher.pub('speedAr', this.speed);
    });

    this.altitude.sub((v) => publisher.pub('altitudeAr', v));

    this.fcuEisDiscreteWord2.sub((v) => {
      const isStd = v.bitValueOr(28, true);
      if (isStd) {
        this.baroAltitudePipe.pause();
        this.pressureAltitudePipe.resume(true);
      } else {
        this.pressureAltitudePipe.pause();
        this.baroAltitudePipe.resume(true);
      }
    }, true);

    subscriber.on('mach').handle((m) => {
      this.mach = new Arinc429Word(m);
      publisher.pub('machAr', this.mach);
    });

    subscriber.on('vsInert').handle((ivs) => {
      this.vsInert = new Arinc429Word(ivs);

      if (this.vsInert.isNormalOperation()) {
        publisher.pub('vs', this.vsInert);
      }
    });

    subscriber.on('vsBaro').handle((vsb) => {
      this.vsBaro = new Arinc429Word(vsb);
      if (!this.vsInert.isNormalOperation()) {
        publisher.pub('vs', this.vsBaro);
      }
    });

    subscriber.on('groundSpeed').handle((gs) => {
      this.groundSpeed = new Arinc429Word(gs);
      publisher.pub('gs', this.groundSpeed);
    });

    subscriber.on('radioAltitude1').handle((ra) => {
      this.radioAltitude1 = new Arinc429Word(ra);
      this.determineAndPublishChosenRadioAltitude(publisher);
    });

    subscriber.on('radioAltitude2').handle((ra) => {
      this.radioAltitude2 = new Arinc429Word(ra);
      this.determineAndPublishChosenRadioAltitude(publisher);
    });

    subscriber.on('radioAltitude3').handle((ra) => {
      this.radioAltitude3 = new Arinc429Word(ra);
      this.determineAndPublishChosenRadioAltitude(publisher);
    });

    subscriber.on('fpaRaw').handle((fpa) => {
      this.fpa = new Arinc429Word(fpa);
      publisher.pub('fpa', this.fpa);
    });

    subscriber.on('daRaw').handle((da) => {
      this.da = new Arinc429Word(da);
      publisher.pub('da', this.da);
    });

    subscriber.on('landingElevation1Raw').handle((elevation) => {
      if (getDisplayIndex() === 1) {
        this.ownLandingElevation = new Arinc429Word(elevation);
      } else {
        this.oppLandingElevation = new Arinc429Word(elevation);
      }
      this.determineAndPublishChosenLandingElevation(publisher);
    });

    subscriber.on('staticPressureRaw').handle((sp) => {
      this.staticPressure = new Arinc429Word(sp);
      publisher.pub('staticPressure', this.staticPressure);
    });

    subscriber.on('fac1Healthy').handle((val) => {
      this.fac1Healthy = val;
      this.determineFacToUse(publisher);
    });

    subscriber.on('fac2Healthy').handle((val) => {
      this.fac2Healthy = val;
      this.determineFacToUse(publisher);
    });

    subscriber.on('fac1VAlphaMaxRaw').handle((word) => {
      this.fac1VAlphaMax = new Arinc429Word(word);
      this.determineFacToUse(publisher);
      if (this.facToUse === 1) {
        publisher.pub('vAlphaMax', this.fac1VAlphaMax);
      } else if (this.facToUse === 0) {
        publisher.pub('vAlphaMax', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VAlphaMaxRaw').handle((word) => {
      this.fac2VAlphaMax = new Arinc429Word(word);
      this.determineFacToUse(publisher);
      if (this.facToUse === 2) {
        publisher.pub('vAlphaMax', this.fac2VAlphaMax);
      }
    });

    subscriber.on('fac1VAlphaProtRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vAlphaProt', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vAlphaProt', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VAlphaProtRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vAlphaProt', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VStallWarnRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vStallWarn', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vStallWarn', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VStallWarnRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vStallWarn', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VMaxRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vMax', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vMax', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VMaxRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vMax', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VFeNextRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vFeNext', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vFeNext', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VFeNextRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vFeNext', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VCTrendRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vCTrend', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vCTrend', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VCTrendRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vCTrend', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VManRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vMan', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vMan', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VManRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vMan', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1V4Raw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('v4', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('v4', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2V4Raw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('v4', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1V3Raw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('v3', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('v3', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2V3Raw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('v3', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1VLsRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('vLs', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('vLs', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2VLsRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('vLs', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1EstimatedBetaRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('estimatedBeta', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('estimatedBeta', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2EstimatedBetaRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('estimatedBeta', new Arinc429Word(word));
      }
    });

    subscriber.on('fac1BetaTargetRaw').handle((word) => {
      if (this.facToUse === 1) {
        publisher.pub('betaTarget', new Arinc429Word(word));
      } else if (this.facToUse === 0) {
        publisher.pub('betaTarget', new Arinc429Word(0));
      }
    });

    subscriber.on('fac2BetaTargetRaw').handle((word) => {
      if (this.facToUse === 2) {
        publisher.pub('betaTarget', new Arinc429Word(word));
      }
    });

    subscriber.on('lgciuDiscreteWord1Raw').handle((word) => {
      this.lgciuDiscreteWord1 = new Arinc429Word(word);
      publisher.pub('lgciuDiscreteWord1', this.lgciuDiscreteWord1);
    });

    // Word with Normal Operation status indicating that pitch and roll are in normal law. To be replaced by proper FCDC implementation.
    const pitchRollNormalLawNOWord = 14076346368;

    publisher.pub('fcdcDiscreteWord1', new Arinc429Word(pitchRollNormalLawNOWord));
    publisher.pub('fcdc1DiscreteWord1', new Arinc429Word(pitchRollNormalLawNOWord));
    publisher.pub('fcdc2DiscreteWord1', new Arinc429Word(pitchRollNormalLawNOWord));

    this.fm1Subs.push(
      subscriber.on('fm1EisDiscrete2Raw').handle((raw) => publisher.pub('fmEisDiscreteWord2Raw', raw), true),
    );
    this.fm2Subs.push(
      subscriber.on('fm2EisDiscrete2Raw').handle((raw) => publisher.pub('fmEisDiscreteWord2Raw', raw), true),
    );
    this.fm1Subs.push(subscriber.on('fm1MdaRaw').handle((raw) => publisher.pub('fmMdaRaw', raw), true));
    this.fm2Subs.push(subscriber.on('fm2MdaRaw').handle((raw) => publisher.pub('fmMdaRaw', raw), true));
    this.fm1Subs.push(subscriber.on('fm1DhRaw').handle((raw) => publisher.pub('fmDhRaw', raw), true));
    this.fm2Subs.push(subscriber.on('fm2DhRaw').handle((raw) => publisher.pub('fmDhRaw', raw), true));
    this.fm1Subs.push(subscriber.on('fm1TransAltRaw').handle((raw) => publisher.pub('fmTransAltRaw', raw), true));
    this.fm2Subs.push(subscriber.on('fm2TransAltRaw').handle((raw) => publisher.pub('fmTransAltRaw', raw), true));
    this.fm1Subs.push(subscriber.on('fm1TransLvlRaw').handle((raw) => publisher.pub('fmTransLvlRaw', raw), true));
    this.fm2Subs.push(subscriber.on('fm2TransLvlRaw').handle((raw) => publisher.pub('fmTransLvlRaw', raw), true));

    this.fm1Healthy.setConsumer(subscriber.on('fm1HealthyDiscrete'));
    this.fm2Healthy.setConsumer(subscriber.on('fm2HealthyDiscrete'));
    this.fm1Healthy.sub(this.determineFmToUse.bind(this));
    this.fm2Healthy.sub(this.determineFmToUse.bind(this), true);

    // Do the filter at hi freq for accuracy, but we don't want to publish the ARINC word at hi-freq
    // as hi-frequency SVG redraws would be very bad.
    this.sub.on('simTimeHiFreq').handle((time) => {
      const deltaTime = MathUtils.clamp(time - this.lastAltitudeFilterTime, 0, 300);
      this.lastAltitudeFilterTime = time;

      this.altitudeFilter.next(this.unfilteredAltitude.get().value, deltaTime / 1000);
    });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.altitude.setValueSsm(this.altitudeFilter.last() ?? 0, this.unfilteredAltitude.get().ssm);
  }

  private determineAndPublishChosenRadioAltitude(publisher: Publisher<Arinc429Values>) {
    const validRaMap = [this.radioAltitude1, this.radioAltitude2, this.radioAltitude3].map(
      (ra) => !ra.isFailureWarning() && !ra.isNoComputedData(),
    );
    const validCount = validRaMap.filter((x) => !!x).length;

    let chosenRas = [this.radioAltitude1, this.radioAltitude2]; // Default: 1 gets 1, 2 gets 2
    if (validCount === 3) {
      // pick the median
      const heights = [this.radioAltitude1, this.radioAltitude2, this.radioAltitude3].sort((a, b) => a.value - b.value);
      chosenRas = [heights[1], heights[1]];
    } else if (validCount === 2) {
      if (!validRaMap[0]) {
        // fail PFD 1 to RA 3
        chosenRas = [this.radioAltitude3, this.radioAltitude2];
      } else if (!validRaMap[1]) {
        // fail PFD 2 to RA 3
        chosenRas = [this.radioAltitude1, this.radioAltitude3];
      }
      // otherwise stick with the default (PFD 1 to 1, PFD 2 to 2)
    } else if (validCount === 1) {
      if (validRaMap[0]) {
        // both get RA 1
        chosenRas = [this.radioAltitude1, this.radioAltitude1];
      } else if (validRaMap[1]) {
        // both get RA 2
        chosenRas = [this.radioAltitude2, this.radioAltitude2];
      } else {
        // both get RA 3
        chosenRas = [this.radioAltitude3, this.radioAltitude3];
      }
    } else {
      // at this point all have either NCD or FW
      // try to fail back a bit more intelligently around FWs to prioritize NCDs
      const nonFailedMap = [this.radioAltitude1, this.radioAltitude2, this.radioAltitude3].map(
        (ra) => !ra.isFailureWarning(),
      );
      const nonFailedCount = nonFailedMap.filter((x) => !!x).length;
      if (nonFailedCount === 2) {
        if (!nonFailedMap[0]) {
          // fail PFD 1 to RA 3
          chosenRas = [this.radioAltitude3, this.radioAltitude2];
        } else if (!nonFailedMap[1]) {
          // fail PFD 2 to RA 3
          chosenRas = [this.radioAltitude1, this.radioAltitude3];
        }
      } else if (nonFailedCount === 1) {
        if (nonFailedMap[0]) {
          // both get RA 1
          chosenRas = [this.radioAltitude1, this.radioAltitude1];
        } else if (nonFailedMap[1]) {
          // both get RA 2
          chosenRas = [this.radioAltitude2, this.radioAltitude2];
        } else {
          // both get RA 3
          chosenRas = [this.radioAltitude3, this.radioAltitude3];
        }
      }
      // don't do anything in case of 3 FWs or 0 FWs and stick to the default
    }

    publisher.pub('chosenRa', getDisplayIndex() === 1 ? chosenRas[0] : chosenRas[1]);
  }

  private determineAndPublishChosenLandingElevation(publisher: Publisher<Arinc429Values>) {
    const useOpposite =
      (this.ownLandingElevation.isFailureWarning() || this.ownLandingElevation.isNoComputedData()) &&
      !this.oppLandingElevation.isFailureWarning() &&
      !this.oppLandingElevation.isNoComputedData();

    if (useOpposite) {
      publisher.pub('landingElevation', this.oppLandingElevation);
    } else {
      publisher.pub('landingElevation', this.ownLandingElevation);
    }
  }

  // Determine which FAC bus to use for FE function. If FAC HEALTHY discrete is low or any word is coded FW,
  // declare FAC as invalid. For simplicty reasons, only check SSM of words that use the same data, so all failure cases are
  // handled while minimizing the words that have to be checked.
  // Left PFD uses FAC 1 when both are valid, the right PFD uses FAC 2. In case of invalidity, switchover is performed.
  // If no FAC is valid, set facToUse to 0. This causes the SPD LIM flag to be displayed.
  private determineFacToUse(publisher: Publisher<Arinc429Values>) {
    const fac1Valid = this.fac1Healthy && !this.fac1VAlphaMax.isFailureWarning();
    const fac2Valid = this.fac2Healthy && !this.fac2VAlphaMax.isFailureWarning();
    if (getDisplayIndex() === 1 && fac1Valid) {
      this.facToUse = 1;
    } else if (getDisplayIndex() === 2 && fac2Valid) {
      this.facToUse = 2;
    } else if (fac1Valid) {
      this.facToUse = 1;
    } else if (fac2Valid) {
      this.facToUse = 2;
    } else {
      this.facToUse = 0;
    }

    publisher.pub('facToUse', this.facToUse);
  }

  private determineFmToUse(): void {
    const onSideIndex = MathUtils.clamp(getDisplayIndex(), 1, 2);

    const onlyFm1Healthy = this.fm1Healthy.get() && !this.fm2Healthy.get();
    const onlyFm2Healthy = this.fm2Healthy.get() && !this.fm1Healthy.get();

    if ((onSideIndex === 1 && !onlyFm2Healthy) || onlyFm1Healthy) {
      this.fm2Subs.forEach((sub) => sub.pause());
      this.fm1Subs.forEach((sub) => sub.resume(true));
    } else if ((onSideIndex === 2 && !onlyFm1Healthy) || onlyFm2Healthy) {
      this.fm1Subs.forEach((sub) => sub.pause());
      this.fm2Subs.forEach((sub) => sub.resume(true));
    }
  }
}
