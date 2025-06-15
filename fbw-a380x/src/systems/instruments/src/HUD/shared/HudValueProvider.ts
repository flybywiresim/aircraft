import { Instrument, ClockEvents, ConsumerSubject, MappedSubject, Subject } from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { HUDSimvars } from './HUDSimvarPublisher';
import { HudMode, PitchscaleMode, HudElems } from '../HUDUtils';
import { AutoThrustMode } from '../../../../shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';
import { Arinc429ConsumerSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { Arinc429Values } from './ArincValueProvider';

// hudmode  Normal   flightpahse  notApp  xwind  0  dec  0
// spdTape ON   xWindSpdTape OFF  altTape: ON   xWindAltTape: OFF  attitudeIndicator: ON   FMA: ON   headingTrk: ON   gndAcftRef: OFF  inAirAcftRef: ON
//FPD: ON   FPV: ON   VS: ON   ra: ON   IlsGS: ON   IlsLoc: ON  IlsHorizonTrk: ON   syntheticRunwway: ON   windIndicator: ON   QFE: ON   pitchScaleMode: FULL
// hudmode  Normal   flightpahse  notApp  xwind  0  dec  1or2
// spdTape ON  xWindSpdTape OFF altTape: ON xWindAltTape: OFF  attitudeIndicator: ON   FMA: ON   headingTrk: ON   gndAcftRef: OFF  inAirAcftRef: ON
//FPD: ON   FPV: ON   VS: ON   ra: ON   IlsGS: ON   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: OFF   windIndicator: ON   QFE: ON   pitchScaleMode: FULL
//-----------------------------------------------------------
// hudmode  Normal   flightpahse  notApp  xwind  1  dec  0
// spdTape OFF  xWindSpdTape ON altTape: OFF xWindAltTape: ON  attitudeIndicator: ON   FMA: ON   headingTrk: ON   gndAcftRef: OFF  inAirAcftRef: ON
//FPD: ON   FPV: ON   VS: ON   ra: ON   IlsGS: ON   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: ON   windIndicator: ON   QFE: ON   pitchScaleMode: FULL
// hudmode  Normal   flightpahse  notApp  xwind  1  dec  1or2
// spdTape OFF  xWindSpdTape ON altTape: OFF xWindAltTape: ON  attitudeIndicator: ON   FMA: ON   headingTrk: ON   gndAcftRef: OFF  inAirAcftRef: ON
//FPD: ON   FPV: ON   VS: ON   ra: ON   IlsGS: ON   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: OFF   windIndicator: ON   QFE: ON   pitchScaleMode: FULL
//-----------------------------------------------------------
// hudmode  Normal   flightpahse   App    xwind  0  dec  0
// spdTape ON   xWindSpdTape OFF  altTape: ON   xWindAltTape: OFF  attitudeIndicator: ON   FMA: ON   headingTrk: ON   gndAcftRef: OFF  inAirAcftRef: ON
//FPD: ON   FPV: ON   VS: ON   ra: ON   IlsGS: ON   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: ON   windIndicator: ON   QFE: ON   pitchScaleMode: FULL
// hudmode  Normal   flightpahse   App    xwind  0  dec  1
// spdTape ON  xWindSpdTape OFF altTape: ON xWindAltTape: OFF  attitudeIndicator: ON   FMA: ON   headingTrk: ON   gndAcftRef: OFF  inAirAcftRef: ON
//FPD: ON   FPV: ON   VS: ON   ra: ON   IlsGS: ON   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: OFF   windIndicator: ON   QFE: ON   pitchScaleMode: FULL
// hudmode  Normal   flightpahse   App    xwind  0  dec  2   ////same as // hudmode  Normal   flightpahse   App    xwind  1  dec  2       (no xwind mode in dec 2 xwind tapes are forced)
// spdTape OFF  xWindSpdTape ON altTape: OFF xWindAltTape: ON  attitudeIndicator: OFF   FMA: ON   headingTrk: OFF   gndAcftRef: OFF  inAirAcftRef: OFF
//FPD: ON   FPV: ON   VS: OFF   ra: ON   IlsGS: OFF   IlsLoc: OFF   IlsHorizonTrk: OFF   syntheticRunwway: OFF   windIndicator: OFF   QFE: OFF   pitchScaleMode: 5DEG
//-----------------------------------------------------------
// hudmode  Normal   flightpahse   App    xwind  1  dec  0
// spdTape OFF  xWindSpdTape ON altTape: OFF xWindAltTape: ON  attitudeIndicator: ON   FMA: ON   headingTrk: ON   gndAcftRef: OFF  inAirAcftRef: ON
//FPD: ON   FPV: ON   VS: ON   ra: ON   IlsGS: ON   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: ON   windIndicator: ON   QFE: ON   pitchScaleMode: FULL
// hudmode  Normal   flightpahse   App    xwind  1  dec  1
// spdTape OFF  xWindSpdTape ON altTape: OFF xWindAltTape: ON  attitudeIndicator: ON   FMA: ON   headingTrk: ON   gndAcftRef: OFF  inAirAcftRef: ON
//FPD: ON   FPV: ON   VS: ON   ra: ON   IlsGS: ON   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: OFF   windIndicator: ON   QFE: ON   pitchScaleMode: FULL
// hudmode  Normal   flightpahse   App    xwind  1  dec  2   ////same as // hudmode  Normal   flightpahse   App    xwind  0  dec  2         (no xwind mode in dec 2 xwind tapes are forced)
// spdTape OFF  xWindSpdTape ON altTape: OFF xWindAltTape: ON  attitudeIndicator: OFF   FMA: ON   headingTrk: OFF   gndAcftRef: OFF  inAirAcftRef: OFF
//FPD: ON   FPV: ON   VS: OFF   ra: ON   IlsGS: OFF   IlsLoc: OFF   IlsHorizonTrk: OFF   syntheticRunwway: OFF   windIndicator: OFF   QFE: OFF   pitchScaleMode: 5DEG

//-----------------------------------------------------------
//-----------------------------------------------------------

// hudmode  Taxi     flightpahse  notApp  xwind  ANY  dec  0
// spdTape ON  xWindSpdTape OFF altTape: ON xWindAltTape: OFF attitudeIndicator: OFF  FMA: ON  headingTrk: OFF   gndAcftRef: ON  inAirAcftRef: OFF
//FPD: OFF  FPV: ON   VS: OFF   ra: OFF   IlsGS: OFF   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: OFF   windIndicator: OFF   QFE: ON   pitchScaleMode: ON
// hudmode  Taxi     flightpahse  notApp  xwind  ANY  dec  1or2
// spdTape OFF  xWindSpdTape OFF altTape: OFF xWindAltTape: OFF attitudeIndicator: OFF  FMA: OFF headingTrk: OFF   gndAcftRef: ON  inAirAcftRef: OFF
//FPD: OFF   FPV: ON   VS: OFF   ra: OFF   IlsGS: OFF   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: OFF   windIndicator: OFF   QFE: OFF   pitchScaleMode: OFF

//-----------------------------------------------------------
//-----------------------------------------------------------

// hudmode  takeoff  flightpahse  ANY  xwind  ANY  dec  ANY
// spdTape ON  xWindSpdTape OFF altTape: ON xWindAltTape: OFF attitudeIndicator: OFF  FMA: ON  headingTrk: OFF   gndAcftRef: ON  inAirAcftRef: OFF
//FPD: OFF  FPV: ON   VS: OFF   ra: OFF   IlsGS: OFF   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: OFF   windIndicator: OFF   QFE: ON   pitchScaleMode: ON

//-----------------------------------------------------------
//-----------------------------------------------------------

// hudmode    RTO    flightpahse  ANY  xwind  ANY  dec  ANY
// spdTape ON  xWindSpdTape OFF altTape: OFF xWindAltTape: OFF attitudeIndicator: OFF  FMA: ON  headingTrk: OFF   gndAcftRef: ON  inAirAcftRef: OFF
//FPD: OFF  FPV: ON   VS: OFF   ra: OFF   IlsGS: OFF   IlsLoc: ON   IlsHorizonTrk: ON   syntheticRunwway: OFF   windIndicator: OFF   QFE: ON   pitchScaleMode: ON

export class HudValueProvider implements Instrument {
  private flightPhase = 0;
  private declutterMode = 0;
  private crosswindMode = false;

  private elems: HudElems = {
    spdTape: Subject.create<String>(''),
    xWindSpdTape: Subject.create<String>(''),
    altTape: Subject.create<String>(''),
    xWindAltTape: Subject.create<String>(''),
    attitudeIndicator: Subject.create<String>(''),
    FMA: Subject.create<String>(''),
    headingTrk: Subject.create<String>(''),
    gndAcftRef: Subject.create<String>(''),
    inAirAcftRef: Subject.create<String>(''),
    flightPathDirector: Subject.create<String>(''),
    flightPathVector: Subject.create<String>(''),
    VS: Subject.create<String>(''),
    ra: Subject.create<String>(''),
    IlsGS: Subject.create<String>(''),
    IlsLoc: Subject.create<String>(''),
    IlsHorizonTrk: Subject.create<String>(''),
    syntheticRunwway: Subject.create<String>(''),
    windIndicator: Subject.create<String>(''),
    QFE: Subject.create<String>(''),
    metricAlt: Subject.create<String>(''),
    pitchScaleMode: Subject.create<number>(0),
    hudFlightPhaseMode: Subject.create<number>(0),
    cWndMode: Subject.create<boolean>(false),
    decMode: Subject.create<number>(0),
  };
  private logCase = '';

  private readonly sub = this.bus.getArincSubscriber<Arinc429Values & HUDSimvars & ClockEvents>();

  private readonly lmgc = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), true);
  private readonly rmgc = ConsumerSubject.create(this.sub.on('rightMainGearCompressed'), true);
  private readonly speed = Arinc429ConsumerSubject.create(this.sub.on('speedAr'));
  private readonly ra = Arinc429ConsumerSubject.create(this.sub.on('chosenRa'));
  private readonly athrMode = ConsumerSubject.create(this.sub.on('AThrMode'), AutoThrustMode.NONE);

  private readonly hudMode = MappedSubject.create(
    ([lmgc, rmgc, speed, ra, athrMode]) => {
      if (
        (lmgc || rmgc) &&
        speed.value < 40 &&
        !(athrMode === AutoThrustMode.MAN_FLEX || athrMode === AutoThrustMode.MAN_TOGA)
      ) {
        return HudMode.TAXI;
      } else if (
        (lmgc || rmgc || ra.value < 50) &&
        (athrMode === AutoThrustMode.MAN_FLEX || athrMode === AutoThrustMode.MAN_TOGA)
      ) {
        return HudMode.TAKEOFF;
      } else if (
        (lmgc || rmgc) &&
        speed.value >= 40 &&
        !(athrMode === AutoThrustMode.MAN_FLEX || athrMode === AutoThrustMode.MAN_TOGA)
      ) {
        return HudMode.ROLLOUT_OR_RTO;
      } else {
        return HudMode.NORMAL;
      }
    },
    this.lmgc,
    this.rmgc,
    this.speed,
    this.ra,
    this.athrMode,
  );

  constructor(private readonly bus: ArincEventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<HudElems>();

    const isCaptainSide = getDisplayIndex() === 1;

    this.sub
      .on('realTime')
      //.atFrequency(1) ///////////////
      .handle((_t) => {
        SimVar.SetSimVarValue('L:A380X_HUDMODE', 'number', this.hudMode.get());
        if (this.hudMode.get() === HudMode.TAXI) {
          // hudmode  Taxi     flightpahse  notApp  xwind  ANY  dec  0
          if (this.declutterMode === 0) {
            this.elems.spdTape.set('block');
            this.elems.xWindSpdTape.set('none');
            this.elems.altTape.set('block');
            this.elems.xWindAltTape.set('none');
            this.elems.attitudeIndicator.set('none');
            this.elems.FMA.set('block');
            this.elems.headingTrk.set('none');
            this.elems.gndAcftRef.set('block');
            this.elems.inAirAcftRef.set('none');
            this.elems.flightPathDirector.set('none');
            this.elems.flightPathVector.set('block');
            this.elems.VS.set('none');
            this.elems.ra.set('none');
            this.elems.IlsGS.set('none');
            this.elems.IlsLoc.set('block');
            this.elems.IlsHorizonTrk.set('block');
            this.elems.syntheticRunwway.set('none');
            this.elems.windIndicator.set('none');
            this.elems.QFE.set('block');
            this.elems.metricAlt.set('block');
            this.elems.pitchScaleMode.set(PitchscaleMode.FULL);
            this.elems.hudFlightPhaseMode.set(this.hudMode.get());
            this.elems.cWndMode.set(false);
            this.elems.decMode.set(0);
            this.logCase = ' A ';
          } else {
            // hudmode  Taxi     flightpahse  notApp  xwind  ANY  dec  1or2
            this.elems.spdTape.set('none');
            this.elems.xWindSpdTape.set('none');
            this.elems.altTape.set('none');
            this.elems.xWindAltTape.set('none');
            this.elems.attitudeIndicator.set('none');
            this.elems.FMA.set('none');
            this.elems.headingTrk.set('none');
            this.elems.gndAcftRef.set('block');
            this.elems.inAirAcftRef.set('none');
            this.elems.flightPathDirector.set('none');
            this.elems.flightPathVector.set('block');
            this.elems.VS.set('none');
            this.elems.ra.set('none');
            this.elems.IlsGS.set('none');
            this.elems.IlsLoc.set('block');
            this.elems.IlsHorizonTrk.set('block');
            this.elems.syntheticRunwway.set('none');
            this.elems.windIndicator.set('none');
            this.elems.QFE.set('none');
            this.elems.metricAlt.set('none');
            this.elems.pitchScaleMode.set(PitchscaleMode.OFF);
            this.elems.hudFlightPhaseMode.set(this.hudMode.get());
            this.elems.cWndMode.set(false);
            this.elems.decMode.set(2);
            this.logCase = ' B ';
          }
        } else if (this.hudMode.get() === HudMode.TAKEOFF) {
          // hudmode  takeoff  flightpahse  ANY  xwind  ANY  dec  ANY
          this.elems.spdTape.set('block');
          this.elems.xWindSpdTape.set('none');
          this.elems.altTape.set('block');
          this.elems.xWindAltTape.set('none');
          this.elems.attitudeIndicator.set('none');
          this.elems.FMA.set('block');
          this.elems.headingTrk.set('none');
          this.elems.gndAcftRef.set('block');
          this.elems.inAirAcftRef.set('none');
          this.elems.flightPathDirector.set('none');
          this.elems.flightPathVector.set('block');
          this.elems.VS.set('none');
          this.elems.ra.set('none');
          this.elems.IlsGS.set('none');
          this.elems.IlsLoc.set('block');
          this.elems.IlsHorizonTrk.set('block');
          this.elems.syntheticRunwway.set('none');
          this.elems.windIndicator.set('none');
          this.elems.QFE.set('block');
          this.elems.metricAlt.set('block');
          this.elems.pitchScaleMode.set(PitchscaleMode.FULL);
          this.elems.hudFlightPhaseMode.set(this.hudMode.get());
          this.elems.cWndMode.set(false);
          this.elems.decMode.set(0);
          this.logCase = ' C ';
        } else if (this.hudMode.get() === HudMode.ROLLOUT_OR_RTO) {
          // hudmode    RTO    flightpahse  ANY  xwind  ANY  dec  ANY
          this.elems.spdTape.set('block');
          this.elems.xWindSpdTape.set('none');
          this.elems.altTape.set('none');
          this.elems.xWindAltTape.set('none');
          this.elems.attitudeIndicator.set('none');
          this.elems.FMA.set('block');
          this.elems.headingTrk.set('none');
          this.elems.gndAcftRef.set('block');
          this.elems.inAirAcftRef.set('none');
          this.elems.flightPathDirector.set('none');
          this.elems.flightPathVector.set('block');
          this.elems.VS.set('none');
          this.elems.ra.set('none');
          this.elems.IlsGS.set('none');
          this.elems.IlsLoc.set('block');
          this.elems.IlsHorizonTrk.set('block');
          this.elems.syntheticRunwway.set('none');
          this.elems.windIndicator.set('none');
          this.elems.QFE.set('block');
          this.elems.metricAlt.set('block');
          this.elems.pitchScaleMode.set(PitchscaleMode.OFF);
          this.elems.hudFlightPhaseMode.set(this.hudMode.get());
          this.elems.cWndMode.set(false);
          this.elems.decMode.set(0);
          this.logCase = ' D ';
        } else {
          //HudMode Normal
          if (this.flightPhase === FmgcFlightPhase.Approach) {
            if (this.declutterMode === 0) {
              if (this.crosswindMode === false) {
                // flightPhase App dec 0 xwind 0
                this.elems.spdTape.set('block');
                this.elems.xWindSpdTape.set('none');
                this.elems.altTape.set('block');
                this.elems.xWindAltTape.set('none');
                this.elems.attitudeIndicator.set('block');
                this.elems.FMA.set('block');
                this.elems.headingTrk.set('block');
                this.elems.gndAcftRef.set('none');
                this.elems.inAirAcftRef.set('block');
                this.elems.flightPathDirector.set('block');
                this.elems.flightPathVector.set('block');
                this.elems.VS.set('block');
                this.elems.ra.set('block');
                this.elems.IlsGS.set('block');
                this.elems.IlsLoc.set('block');
                this.elems.IlsHorizonTrk.set('block');
                this.elems.syntheticRunwway.set('block');
                this.elems.windIndicator.set('block');
                this.elems.QFE.set('block');
                this.elems.metricAlt.set('block');
                this.elems.pitchScaleMode.set(PitchscaleMode.FULL);
                this.elems.hudFlightPhaseMode.set(this.hudMode.get());
                this.elems.cWndMode.set(false);
                this.elems.decMode.set(0);
                this.logCase = ' E ';
              } else {
                // flightPhase App dec 0 xwind 1
                this.elems.spdTape.set('none');
                this.elems.xWindSpdTape.set('block');
                this.elems.altTape.set('none');
                this.elems.xWindAltTape.set('block');
                this.elems.attitudeIndicator.set('block');
                this.elems.FMA.set('block');
                this.elems.headingTrk.set('block');
                this.elems.gndAcftRef.set('none');
                this.elems.inAirAcftRef.set('block');
                this.elems.flightPathDirector.set('block');
                this.elems.flightPathVector.set('block');
                this.elems.VS.set('block');
                this.elems.ra.set('block');
                this.elems.IlsGS.set('block');
                this.elems.IlsLoc.set('block');
                this.elems.IlsHorizonTrk.set('block');
                this.elems.syntheticRunwway.set('block');
                this.elems.windIndicator.set('block');
                this.elems.QFE.set('block');
                this.elems.metricAlt.set('block');
                this.elems.pitchScaleMode.set(PitchscaleMode.FULL);
                this.elems.hudFlightPhaseMode.set(this.hudMode.get());
                this.elems.cWndMode.set(true);
                this.elems.decMode.set(0);
                this.logCase = ' F ';
              }
            } else if (this.declutterMode === 1) {
              if (this.crosswindMode === false) {
                // flightPhase App dec 1 xwind 0
                this.elems.spdTape.set('block');
                this.elems.xWindSpdTape.set('none');
                this.elems.altTape.set('block');
                this.elems.xWindAltTape.set('none');
                this.elems.attitudeIndicator.set('block');
                this.elems.FMA.set('block');
                this.elems.headingTrk.set('block');
                this.elems.gndAcftRef.set('none');
                this.elems.inAirAcftRef.set('block');
                this.elems.flightPathDirector.set('block');
                this.elems.flightPathVector.set('block');
                this.elems.VS.set('block');
                this.elems.ra.set('block');
                this.elems.IlsGS.set('block');
                this.elems.IlsLoc.set('block');
                this.elems.IlsHorizonTrk.set('block');
                this.elems.syntheticRunwway.set('none');
                this.elems.windIndicator.set('block');
                this.elems.QFE.set('block');
                this.elems.metricAlt.set('block');
                this.elems.pitchScaleMode.set(PitchscaleMode.FULL);
                this.elems.hudFlightPhaseMode.set(this.hudMode.get());
                this.elems.cWndMode.set(false);
                this.elems.decMode.set(1);
                this.logCase = ' G ';
              } else {
                // flightPhase App dec 1 xwind 1
                this.elems.spdTape.set('none');
                this.elems.xWindSpdTape.set('block');
                this.elems.altTape.set('none');
                this.elems.xWindAltTape.set('block');
                this.elems.attitudeIndicator.set('block');
                this.elems.FMA.set('block');
                this.elems.headingTrk.set('block');
                this.elems.gndAcftRef.set('none');
                this.elems.inAirAcftRef.set('block');
                this.elems.flightPathDirector.set('block');
                this.elems.flightPathVector.set('block');
                this.elems.VS.set('block');
                this.elems.ra.set('block');
                this.elems.IlsGS.set('block');
                this.elems.IlsLoc.set('block');
                this.elems.IlsHorizonTrk.set('block');
                this.elems.syntheticRunwway.set('none');
                this.elems.windIndicator.set('block');
                this.elems.QFE.set('block');
                this.elems.metricAlt.set('block');
                this.elems.pitchScaleMode.set(PitchscaleMode.FULL);
                this.elems.hudFlightPhaseMode.set(this.hudMode.get());
                this.elems.cWndMode.set(true);
                this.elems.decMode.set(1);
                this.logCase = ' H ';
              }
            } else {
              // flightPhase App dec 2 xwind 0
              // flightPhase App dec 2 xwind 1    no xwind mode in dec 2 xwind tapes are forced
              this.elems.spdTape.set('none');
              this.elems.xWindSpdTape.set('block');
              this.elems.altTape.set('none');
              this.elems.xWindAltTape.set('block');
              this.elems.attitudeIndicator.set('none');
              this.elems.FMA.set('block');
              this.elems.headingTrk.set('none');
              this.elems.gndAcftRef.set('none');
              this.elems.inAirAcftRef.set('none');
              this.elems.flightPathDirector.set('block');
              this.elems.flightPathVector.set('block');
              this.elems.VS.set('none');
              this.elems.ra.set('block');
              this.elems.IlsGS.set('none');
              this.elems.IlsLoc.set('none');
              this.elems.IlsHorizonTrk.set('none');
              this.elems.syntheticRunwway.set('none');
              this.elems.windIndicator.set('none');
              this.elems.QFE.set('none');
              this.elems.metricAlt.set('none');
              this.elems.pitchScaleMode.set(PitchscaleMode.FIVEDEG);
              this.elems.hudFlightPhaseMode.set(this.hudMode.get());
              this.elems.cWndMode.set(true);
              this.elems.decMode.set(2);
              this.logCase = ' I ';
            }
          } else {
            if (this.declutterMode === 0) {
              if (this.crosswindMode === false) {
                // flightPhase NOTApp dec 0 xwind 0
                this.elems.spdTape.set('block');
                this.elems.xWindSpdTape.set('none');
                this.elems.altTape.set('block');
                this.elems.xWindAltTape.set('none');
                this.elems.attitudeIndicator.set('block');
                this.elems.FMA.set('block');
                this.elems.headingTrk.set('block');
                this.elems.gndAcftRef.set('none');
                this.elems.inAirAcftRef.set('block');
                this.elems.flightPathDirector.set('block');
                this.elems.flightPathVector.set('block');
                this.elems.VS.set('block');
                this.elems.ra.set('block');
                this.elems.IlsGS.set('block');
                this.elems.IlsLoc.set('block');
                this.elems.IlsHorizonTrk.set('block');
                this.elems.syntheticRunwway.set('block');
                this.elems.windIndicator.set('block');
                this.elems.QFE.set('block');
                this.elems.metricAlt.set('block');
                this.elems.pitchScaleMode.set(PitchscaleMode.FULL);
                this.elems.hudFlightPhaseMode.set(this.hudMode.get());
                this.elems.cWndMode.set(false);
                this.elems.decMode.set(0);
                this.logCase = ' J ';
              } else {
                // flightPhase NOTApp dec 0 xwind 1
                this.elems.spdTape.set('none');
                this.elems.xWindSpdTape.set('block');
                this.elems.altTape.set('none');
                this.elems.xWindAltTape.set('block');
                this.elems.attitudeIndicator.set('block');
                this.elems.FMA.set('block');
                this.elems.headingTrk.set('block');
                this.elems.gndAcftRef.set('none');
                this.elems.inAirAcftRef.set('block');
                this.elems.flightPathDirector.set('block');
                this.elems.flightPathVector.set('block');
                this.elems.VS.set('block');
                this.elems.ra.set('block');
                this.elems.IlsGS.set('block');
                this.elems.IlsLoc.set('block');
                this.elems.IlsHorizonTrk.set('block');
                this.elems.syntheticRunwway.set('block');
                this.elems.windIndicator.set('block');
                this.elems.QFE.set('block');
                this.elems.metricAlt.set('block');
                this.elems.pitchScaleMode.set(PitchscaleMode.FULL);
                this.elems.hudFlightPhaseMode.set(this.hudMode.get());
                this.elems.cWndMode.set(true);
                this.elems.decMode.set(0);
                this.logCase = ' K ';
              }
            } else if (!(this.declutterMode === 0)) {
              if (this.crosswindMode === false) {
                // flightPhase NOTApp dec !0 xwind 0
                this.elems.spdTape.set('block');
                this.elems.xWindSpdTape.set('none');
                this.elems.altTape.set('block');
                this.elems.xWindAltTape.set('none');
                this.elems.attitudeIndicator.set('none');
                this.elems.FMA.set('block');
                this.elems.headingTrk.set('none');
                this.elems.gndAcftRef.set('none');
                this.elems.inAirAcftRef.set('none');
                this.elems.flightPathDirector.set('block');
                this.elems.flightPathVector.set('block');
                this.elems.VS.set('none');
                this.elems.ra.set('block');
                this.elems.IlsGS.set('none');
                this.elems.IlsLoc.set('none');
                this.elems.IlsHorizonTrk.set('none');
                this.elems.syntheticRunwway.set('none');
                this.elems.windIndicator.set('none');
                this.elems.QFE.set('none');
                this.elems.metricAlt.set('none');
                this.elems.pitchScaleMode.set(PitchscaleMode.FIVEDEG);
                this.elems.hudFlightPhaseMode.set(this.hudMode.get());
                this.elems.cWndMode.set(false);
                this.elems.decMode.set(2);
                this.logCase = ' L ';
              } else {
                // flightPhase NOTApp dec !0 xwind 1
                this.elems.spdTape.set('none');
                this.elems.xWindSpdTape.set('block');
                this.elems.altTape.set('none');
                this.elems.xWindAltTape.set('block');
                this.elems.attitudeIndicator.set('none');
                this.elems.FMA.set('block');
                this.elems.headingTrk.set('none');
                this.elems.gndAcftRef.set('none');
                this.elems.inAirAcftRef.set('none');
                this.elems.flightPathDirector.set('block');
                this.elems.flightPathVector.set('block');
                this.elems.VS.set('none');
                this.elems.ra.set('block');
                this.elems.IlsGS.set('none');
                this.elems.IlsLoc.set('none');
                this.elems.IlsHorizonTrk.set('none');
                this.elems.syntheticRunwway.set('none');
                this.elems.windIndicator.set('none');
                this.elems.QFE.set('none');
                this.elems.metricAlt.set('none');
                this.elems.pitchScaleMode.set(PitchscaleMode.FIVEDEG);
                this.elems.hudFlightPhaseMode.set(this.hudMode.get());
                this.elems.cWndMode.set(true);
                this.elems.decMode.set(2);
                this.logCase = ' M ';
              }
            }
          }
        }

        //console.log(this.logCase);

        publisher.pub('spdTape', this.elems.spdTape, false, false);
        publisher.pub('xWindSpdTape', this.elems.xWindSpdTape, false, false);
        publisher.pub('altTape', this.elems.altTape, false, false);
        publisher.pub('xWindAltTape', this.elems.xWindAltTape, false, false);
        publisher.pub('attitudeIndicator', this.elems.attitudeIndicator, false, false);
        publisher.pub('FMA', this.elems.FMA, false, false);
        publisher.pub('headingTrk', this.elems.headingTrk, false, false);
        publisher.pub('gndAcftRef', this.elems.gndAcftRef, false, false);
        publisher.pub('inAirAcftRef', this.elems.inAirAcftRef, false, false);
        publisher.pub('flightPathDirector', this.elems.flightPathDirector, false, false);
        publisher.pub('flightPathVector', this.elems.flightPathVector, false, false);
        publisher.pub('VS', this.elems.VS, false, false);
        publisher.pub('ra', this.elems.ra, false, false);
        publisher.pub('IlsGS', this.elems.IlsGS, false, false);
        publisher.pub('IlsLoc', this.elems.IlsLoc, false, false);
        publisher.pub('IlsHorizonTrk', this.elems.IlsHorizonTrk, false, false);
        publisher.pub('syntheticRunwway', this.elems.syntheticRunwway, false, false);
        publisher.pub('windIndicator', this.elems.windIndicator, false, false);
        publisher.pub('QFE', this.elems.QFE, false, false);
        publisher.pub('metricAlt', this.elems.metricAlt, false, false);
        publisher.pub('pitchScaleMode', this.elems.pitchScaleMode, false, false);
        publisher.pub('cWndMode', this.elems.cWndMode, false, false);
        publisher.pub('decMode', this.elems.decMode, false, false);
        publisher.pub('hudFlightPhaseMode', this.elems.hudFlightPhaseMode, false, false);
      });

    this.sub.on('fmgcFlightPhase').handle((fp) => {
      this.flightPhase = fp;
      //this.setCrossWindMode(this.crosswindMode);
    });

    this.sub.on(isCaptainSide ? 'crosswindModeL' : 'crosswindModeR').handle((value) => {
      this.crosswindMode = value;
      //this.setCrossWindMode(value);
    });

    this.sub.on(isCaptainSide ? 'declutterModeL' : 'declutterModeR').handle((value) => {
      let side = '';
      getDisplayIndex() === 1 ? (side = 'L:A380X_HUD_L_DECLUTTER_MODE') : (side = 'L:A380X_HUD_R_DECLUTTER_MODE');

      if (this.flightPhase != FmgcFlightPhase.Approach) {
        if (!(value === 1)) {
          this.declutterMode = value;
        } else {
          SimVar.SetSimVarValue(side, 'number', 2);
          this.declutterMode = 2;
        }
      } else {
        this.declutterMode = value;
      }

      this.setCrossWindMode(this.crosswindMode);
      //console.log('setCrossWindMode: ' + this.elems.cWndMode.get(), this.elems.decMode.get());
    });
  }

  private setCrossWindMode(value) {
    if (this.hudMode.get() === HudMode.NORMAL) {
      if (this.flightPhase === FmgcFlightPhase.Approach) {
        if (this.declutterMode === 2) {
          this.crosswindMode = true;
        } else {
          this.crosswindMode = value;
        }
      } else {
        this.crosswindMode = value;
      }
    } else {
      this.crosswindMode = false;
    }
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}

///// Backup

// private spdTape = '';
// private xWindSpdTape = '';
// private altTape = '';
// private xWindAltTape = '';
// private attitudeIndicator = '';
// private FMA = '';
// private headingTrk = '';
// private gndAcftRef = '';
// private inAirAcftRef = '';
// private flightPathDirector = '';
// private flightPathVector = '';
// private VS = '';
// private ra = '';
// private IlsGS = '';
// private IlsLoc = '';
// private IlsHorizonTrk = '';
// private syntheticRunwway = '';
// private windIndicator = '';
// private QFE = '';
// private pitchScaleModeMode.set(PitchscaleMode.FULL);

// private spdTapeRef = FSComponent.createRef<SVGGElement>();
// private xWindSpdTapeRef = FSComponent.createRef<SVGGElement>();
// private altTapeRef = FSComponent.createRef<SVGGElement>();
// private xWindAltTapeRef = FSComponent.createRef<SVGGElement>();
// private altTapeMaskFillRef = FSComponent.createRef<SVGGElement>();
// private windIndicatorRef = FSComponent.createRef<SVGGElement>();
// private FMARef = FSComponent.createRef<SVGGElement>();
// private VSRef = FSComponent.createRef<SVGGElement>();
// private QFERef = FSComponent.createRef<SVGGElement>();
// private pitchScaleModeRef = FSComponent.createRef<SVGGElement>();

// sub.on('spdTape').handle((v) => {
//   this.spdTape = v.get().toString();
//   this.spdTapeRef.instance.style.display = `${this.spdTape}`;
//   //console.log('qsdqsd   ' + this.spdTape);
// });
// sub.on('xWindSpdTape').handle((v) => {
//   this.xWindSpdTape = v.get().toString();
//   this.xWindSpdTapeRef.instance.style.display = `${this.xWindSpdTape}`;
// });
// sub.on('altTape').handle((v) => {
//   this.altTape = v.get().toString();
//   this.altTapeRef.instance.style.display = `${this.altTape}`;
// });
// sub.on('xWindAltTape').handle((v) => {
//   this.xWindAltTape = v.get().toString();
//   this.xWindAltTapeRef.instance.style.display = `${this.xWindAltTape}`;
// });
// sub.on('altTapeMaskFill').handle((v) => {
//   this.altTapeMaskFill = v.get().toString();
//   this.altTapeMaskFillRef.instance.style.display = `${this.altTapeMaskFill}`;
// });
// sub.on('windIndicator').handle((v) => {
//   this.windIndicator = v.get().toString();
//   this.windIndicatorRef.instance.style.display = `${this.windIndicator}`;
// });
// sub.on('FMA').handle((v) => {
//   this.FMA = v.get().toString();
//   this.FMARef.instance.style.display = `${this.FMA}`;
// });
// sub.on('VS').handle((v) => {
//   this.VS = v.get().toString();
//   this.VSRef.instance.style.display = `${this.VS}`;
// });
// sub.on('QFE').handle((v) => {
//   this.QFE = v.get().toString();
//   this.QFERef.instance.style.display = `${this.QFE}`;
// });
