import { Instrument, ClockEvents, ConsumerSubject, MappedSubject } from '@microsoft/msfs-sdk';
import { getDisplayIndex } from 'instruments/src/HUD/HUD';
import { HUDSimvars } from './HUDSimvarPublisher';
import { HudMode, PitchscaleMode, HudElems } from '../HUDUtils';
import { AutoThrustMode } from '../../../../shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';
import { Arinc429ConsumerSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { Arinc429Values } from './ArincValueProvider';

export class HudValueProvider implements Instrument {
  private flightPhase = 0;
  private declutterMode = 0;
  private crosswindMode = false;

  private elems: HudElems = {
    spdTape: '',
    xWindSpdTape: '',
    altTape: '',
    xWindAltTape: '',
    attitudeIndicator: '',
    FMA: '',
    headingTrk: '',
    gndAcftRef: '',
    inAirAcftRef: '',
    flightPathDirector: '',
    flightPathVector: '',
    VSI: '',
    ra: '',
    IlsGS: '',
    IlsLoc: '',
    IlsHorizonTrk: '',
    syntheticRunwway: '',
    windIndicator: '',
    QFE: '',
    metricAlt: true,
    pitchScaleMode: -1,
    hudFlightPhaseMode: 0,
    cWndMode: true,
    decMode: -1,
    spdChevrons: 'block',
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
            this.elems.spdTape = 'block';
            this.elems.xWindSpdTape = 'none';
            this.elems.altTape = 'block';
            this.elems.xWindAltTape = 'none';
            this.elems.attitudeIndicator = 'none';
            this.elems.FMA = 'block';
            this.elems.headingTrk = 'none';
            this.elems.gndAcftRef = 'block';
            this.elems.inAirAcftRef = 'none';
            this.elems.flightPathDirector = 'none';
            this.elems.flightPathVector = 'block';
            this.elems.VSI = 'none';
            this.elems.ra = 'none';
            this.elems.IlsGS = 'none';
            this.elems.IlsLoc = 'block';
            this.elems.IlsHorizonTrk = 'block';
            this.elems.syntheticRunwway = 'none';
            this.elems.windIndicator = 'none';
            this.elems.QFE = 'block';
            this.elems.metricAlt = true;
            this.elems.pitchScaleMode = PitchscaleMode.FULL;
            this.elems.hudFlightPhaseMode = this.hudMode.get();
            this.elems.cWndMode = false;
            this.elems.decMode = 0;
            this.elems.spdChevrons = 'block';
            this.logCase = ' A ';
          } else {
            // hudmode  Taxi     flightpahse  notApp  xwind  ANY  dec  1or2
            this.elems.spdTape = 'none';
            this.elems.xWindSpdTape = 'none';
            this.elems.altTape = 'none';
            this.elems.xWindAltTape = 'none';
            this.elems.attitudeIndicator = 'none';
            this.elems.FMA = 'none';
            this.elems.headingTrk = 'none';
            this.elems.gndAcftRef = 'block';
            this.elems.inAirAcftRef = 'none';
            this.elems.flightPathDirector = 'none';
            this.elems.flightPathVector = 'block';
            this.elems.VSI = 'none';
            this.elems.ra = 'none';
            this.elems.IlsGS = 'none';
            this.elems.IlsLoc = 'block';
            this.elems.IlsHorizonTrk = 'block';
            this.elems.syntheticRunwway = 'none';
            this.elems.windIndicator = 'none';
            this.elems.QFE = 'none';
            this.elems.metricAlt = false;
            this.elems.pitchScaleMode = PitchscaleMode.OFF;
            this.elems.hudFlightPhaseMode = this.hudMode.get();
            this.elems.cWndMode = false;
            this.elems.decMode = 2;
            this.elems.spdChevrons = 'block';
            this.logCase = ' B ';
          }
        } else if (this.hudMode.get() === HudMode.TAKEOFF) {
          // hudmode  takeoff  flightpahse  ANY  xwind  ANY  dec  ANY
          this.elems.spdTape = 'block';
          this.elems.xWindSpdTape = 'none';
          this.elems.altTape = 'block';
          this.elems.xWindAltTape = 'none';
          this.elems.attitudeIndicator = 'none';
          this.elems.FMA = 'block';
          this.elems.headingTrk = 'none';
          this.elems.gndAcftRef = 'block';
          this.elems.inAirAcftRef = 'none';
          this.elems.flightPathDirector = 'none';
          this.elems.flightPathVector = 'block';
          this.elems.VSI = 'block';
          this.elems.ra = 'none';
          this.elems.IlsGS = 'none';
          this.elems.IlsLoc = 'block';
          this.elems.IlsHorizonTrk = 'block';
          this.elems.syntheticRunwway = 'none';
          this.elems.windIndicator = 'none';
          this.elems.QFE = 'block';
          this.elems.metricAlt = true;
          this.elems.pitchScaleMode = PitchscaleMode.FULL;
          this.elems.hudFlightPhaseMode = this.hudMode.get();
          this.elems.cWndMode = false;
          this.elems.decMode = 0;
          this.elems.spdChevrons = 'block';
          this.logCase = ' C ';
        } else if (this.hudMode.get() === HudMode.ROLLOUT_OR_RTO) {
          // hudmode    RTO    flightpahse  ANY  xwind  ANY  dec  ANY
          this.elems.spdTape = 'block';
          this.elems.xWindSpdTape = 'none';
          this.elems.altTape = 'none';
          this.elems.xWindAltTape = 'none';
          this.elems.attitudeIndicator = 'none';
          this.elems.FMA = 'block';
          this.elems.headingTrk = 'none';
          this.elems.gndAcftRef = 'none';
          this.elems.inAirAcftRef = 'none';
          this.elems.flightPathDirector = 'none';
          this.elems.flightPathVector = 'block';
          this.elems.VSI = 'none';
          this.elems.ra = 'none';
          this.elems.IlsGS = 'none';
          this.elems.IlsLoc = 'block';
          this.elems.IlsHorizonTrk = 'block';
          this.elems.syntheticRunwway = 'none';
          this.elems.windIndicator = 'none';
          this.elems.QFE = 'none';
          this.elems.metricAlt = false;
          this.elems.pitchScaleMode = PitchscaleMode.OFF;
          this.elems.hudFlightPhaseMode = this.hudMode.get();
          this.elems.cWndMode = false;
          this.elems.decMode = 0;
          this.elems.spdChevrons = 'none';
          this.logCase = ' D ';
        } else {
          //HudMode Normal
          if (this.flightPhase === FmgcFlightPhase.Approach) {
            if (this.declutterMode === 0) {
              if (this.crosswindMode === false) {
                // flightPhase App dec 0 xwind 0
                this.elems.spdTape = 'block';
                this.elems.xWindSpdTape = 'none';
                this.elems.altTape = 'block';
                this.elems.xWindAltTape = 'none';
                this.elems.attitudeIndicator = 'block';
                this.elems.FMA = 'block';
                this.elems.headingTrk = 'block';
                this.elems.gndAcftRef = 'none';
                this.elems.inAirAcftRef = 'block';
                this.elems.flightPathDirector = 'block';
                this.elems.flightPathVector = 'block';
                this.elems.VSI = 'block';
                this.elems.ra = 'block';
                this.elems.IlsGS = 'block';
                this.elems.IlsLoc = 'block';
                this.elems.IlsHorizonTrk = 'block';
                this.elems.syntheticRunwway = 'block';
                this.elems.windIndicator = 'block';
                this.elems.QFE = 'block';
                this.elems.metricAlt = true;
                this.elems.pitchScaleMode = PitchscaleMode.FULL;
                this.elems.hudFlightPhaseMode = this.hudMode.get();
                this.elems.cWndMode = false;
                this.elems.decMode = 0;
                this.elems.spdChevrons = 'block';
                this.logCase = ' E ';
              } else {
                // flightPhase App dec 0 xwind 1
                this.elems.spdTape = 'none';
                this.elems.xWindSpdTape = 'block';
                this.elems.altTape = 'none';
                this.elems.xWindAltTape = 'block';
                this.elems.attitudeIndicator = 'block';
                this.elems.FMA = 'block';
                this.elems.headingTrk = 'block';
                this.elems.gndAcftRef = 'none';
                this.elems.inAirAcftRef = 'block';
                this.elems.flightPathDirector = 'block';
                this.elems.flightPathVector = 'block';
                this.elems.VSI = 'block';
                this.elems.ra = 'block';
                this.elems.IlsGS = 'block';
                this.elems.IlsLoc = 'block';
                this.elems.IlsHorizonTrk = 'block';
                this.elems.syntheticRunwway = 'block';
                this.elems.windIndicator = 'block';
                this.elems.QFE = 'block';
                this.elems.metricAlt = true;
                this.elems.pitchScaleMode = PitchscaleMode.FULL;
                this.elems.hudFlightPhaseMode = this.hudMode.get();
                this.elems.cWndMode = true;
                this.elems.decMode = 0;
                this.elems.spdChevrons = 'block';
                this.logCase = ' F ';
              }
            } else if (this.declutterMode === 1) {
              if (this.crosswindMode === false) {
                // flightPhase App dec 1 xwind 0
                this.elems.spdTape = 'block';
                this.elems.xWindSpdTape = 'none';
                this.elems.altTape = 'block';
                this.elems.xWindAltTape = 'none';
                this.elems.attitudeIndicator = 'block';
                this.elems.FMA = 'block';
                this.elems.headingTrk = 'block';
                this.elems.gndAcftRef = 'none';
                this.elems.inAirAcftRef = 'block';
                this.elems.flightPathDirector = 'block';
                this.elems.flightPathVector = 'block';
                this.elems.VSI = 'block';
                this.elems.ra = 'block';
                this.elems.IlsGS = 'block';
                this.elems.IlsLoc = 'block';
                this.elems.IlsHorizonTrk = 'block';
                this.elems.syntheticRunwway = 'none';
                this.elems.windIndicator = 'block';
                this.elems.QFE = 'block';
                this.elems.metricAlt = true;
                this.elems.pitchScaleMode = PitchscaleMode.FULL;
                this.elems.hudFlightPhaseMode = this.hudMode.get();
                this.elems.cWndMode = false;
                this.elems.decMode = 1;
                this.elems.spdChevrons = 'block';
                this.logCase = ' G ';
              } else {
                // flightPhase App dec 1 xwind 1
                this.elems.spdTape = 'none';
                this.elems.xWindSpdTape = 'block';
                this.elems.altTape = 'none';
                this.elems.xWindAltTape = 'block';
                this.elems.attitudeIndicator = 'block';
                this.elems.FMA = 'block';
                this.elems.headingTrk = 'block';
                this.elems.gndAcftRef = 'none';
                this.elems.inAirAcftRef = 'block';
                this.elems.flightPathDirector = 'block';
                this.elems.flightPathVector = 'block';
                this.elems.VSI = 'block';
                this.elems.ra = 'block';
                this.elems.IlsGS = 'block';
                this.elems.IlsLoc = 'block';
                this.elems.IlsHorizonTrk = 'block';
                this.elems.syntheticRunwway = 'none';
                this.elems.windIndicator = 'block';
                this.elems.QFE = 'block';
                this.elems.metricAlt = true;
                this.elems.pitchScaleMode = PitchscaleMode.FULL;
                this.elems.hudFlightPhaseMode = this.hudMode.get();
                this.elems.cWndMode = true;
                this.elems.decMode = 1;
                this.elems.spdChevrons = 'block';
                this.logCase = ' H ';
              }
            } else {
              // flightPhase App dec 2 xwind 0
              // flightPhase App dec 2 xwind 1    no xwind mode in dec 2 xwind tapes are forced
              this.elems.spdTape = 'none';
              this.elems.xWindSpdTape = 'block';
              this.elems.altTape = 'none';
              this.elems.xWindAltTape = 'block';
              this.elems.attitudeIndicator = 'none';
              this.elems.FMA = 'block';
              this.elems.headingTrk = 'none';
              this.elems.gndAcftRef = 'none';
              this.elems.inAirAcftRef = 'none';
              this.elems.flightPathDirector = 'block';
              this.elems.flightPathVector = 'block';
              this.elems.VSI = 'none';
              this.elems.ra = 'block';
              this.elems.IlsGS = 'none';
              this.elems.IlsLoc = 'none';
              this.elems.IlsHorizonTrk = 'none';
              this.elems.syntheticRunwway = 'none';
              this.elems.windIndicator = 'none';
              this.elems.QFE = 'none';
              this.elems.metricAlt = false;
              this.elems.pitchScaleMode = PitchscaleMode.FIVEDEG;
              this.elems.hudFlightPhaseMode = this.hudMode.get();
              this.elems.cWndMode = true;
              this.elems.decMode = 2;
              this.elems.spdChevrons = 'block';
              this.logCase = ' I ';
            }
          } else {
            if (this.declutterMode === 0) {
              if (this.crosswindMode === false) {
                // flightPhase NOTApp dec 0 xwind 0
                this.elems.spdTape = 'block';
                this.elems.xWindSpdTape = 'none';
                this.elems.altTape = 'block';
                this.elems.xWindAltTape = 'none';
                this.elems.attitudeIndicator = 'block';
                this.elems.FMA = 'block';
                this.elems.headingTrk = 'block';
                this.elems.gndAcftRef = 'none';
                this.elems.inAirAcftRef = 'block';
                this.elems.flightPathDirector = 'block';
                this.elems.flightPathVector = 'block';
                this.elems.VSI = 'block';
                this.elems.ra = 'block';
                this.elems.IlsGS = 'block';
                this.elems.IlsLoc = 'block';
                this.elems.IlsHorizonTrk = 'block';
                this.elems.syntheticRunwway = 'block';
                this.elems.windIndicator = 'block';
                this.elems.QFE = 'block';
                this.elems.metricAlt = true;
                this.elems.pitchScaleMode = PitchscaleMode.FULL;
                this.elems.hudFlightPhaseMode = this.hudMode.get();
                this.elems.cWndMode = false;
                this.elems.decMode = 0;
                this.elems.spdChevrons = 'block';
                this.logCase = ' J ';
              } else {
                // flightPhase NOTApp dec 0 xwind 1
                this.elems.spdTape = 'none';
                this.elems.xWindSpdTape = 'block';
                this.elems.altTape = 'none';
                this.elems.xWindAltTape = 'block';
                this.elems.attitudeIndicator = 'block';
                this.elems.FMA = 'block';
                this.elems.headingTrk = 'block';
                this.elems.gndAcftRef = 'none';
                this.elems.inAirAcftRef = 'block';
                this.elems.flightPathDirector = 'block';
                this.elems.flightPathVector = 'block';
                this.elems.VSI = 'block';
                this.elems.ra = 'block';
                this.elems.IlsGS = 'block';
                this.elems.IlsLoc = 'block';
                this.elems.IlsHorizonTrk = 'block';
                this.elems.syntheticRunwway = 'block';
                this.elems.windIndicator = 'block';
                this.elems.QFE = 'block';
                this.elems.metricAlt = true;
                this.elems.pitchScaleMode = PitchscaleMode.FULL;
                this.elems.hudFlightPhaseMode = this.hudMode.get();
                this.elems.cWndMode = true;
                this.elems.decMode = 0;
                this.elems.spdChevrons = 'block';
                this.logCase = ' K ';
              }
            } else if (!(this.declutterMode === 0)) {
              if (this.crosswindMode === false) {
                // flightPhase NOTApp dec !0 xwind 0
                this.elems.spdTape = 'block';
                this.elems.xWindSpdTape = 'none';
                this.elems.altTape = 'block';
                this.elems.xWindAltTape = 'none';
                this.elems.attitudeIndicator = 'none';
                this.elems.FMA = 'block';
                this.elems.headingTrk = 'block';
                this.elems.gndAcftRef = 'none';
                this.elems.inAirAcftRef = 'none';
                this.elems.flightPathDirector = 'block';
                this.elems.flightPathVector = 'block';
                this.elems.VSI = 'none';
                this.elems.ra = 'block';
                this.elems.IlsGS = 'none';
                this.elems.IlsLoc = 'none';
                this.elems.IlsHorizonTrk = 'none';
                this.elems.syntheticRunwway = 'none';
                this.elems.windIndicator = 'none';
                this.elems.QFE = 'none';
                this.elems.metricAlt = false;
                this.elems.pitchScaleMode = PitchscaleMode.FIVEDEG;
                this.elems.hudFlightPhaseMode = this.hudMode.get();
                this.elems.cWndMode = false;
                this.elems.decMode = 2;
                this.elems.spdChevrons = 'block';
                this.logCase = ' L ';
              } else {
                // flightPhase NOTApp dec !0 xwind 1
                this.elems.spdTape = 'none';
                this.elems.xWindSpdTape = 'block';
                this.elems.altTape = 'none';
                this.elems.xWindAltTape = 'block';
                this.elems.attitudeIndicator = 'none';
                this.elems.FMA = 'block';
                this.elems.headingTrk = 'block';
                this.elems.gndAcftRef = 'none';
                this.elems.inAirAcftRef = 'none';
                this.elems.flightPathDirector = 'block';
                this.elems.flightPathVector = 'block';
                this.elems.VSI = 'none';
                this.elems.ra = 'block';
                this.elems.IlsGS = 'none';
                this.elems.IlsLoc = 'none';
                this.elems.IlsHorizonTrk = 'none';
                this.elems.syntheticRunwway = 'none';
                this.elems.windIndicator = 'none';
                this.elems.QFE = 'none';
                this.elems.metricAlt = false;
                this.elems.pitchScaleMode = PitchscaleMode.FIVEDEG;
                this.elems.hudFlightPhaseMode = this.hudMode.get();
                this.elems.cWndMode = true;
                this.elems.decMode = 2;
                this.elems.spdChevrons = 'block';
                this.logCase = ' M ';
              }
            }
          }
        }

        //console.log(this.logCase);
        publisher.pub('cWndMode', this.elems.cWndMode, false, false);
        publisher.pub('decMode', this.elems.decMode, false, false);
        publisher.pub('hudFlightPhaseMode', this.elems.hudFlightPhaseMode, false, false);

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
        publisher.pub('VSI', this.elems.VSI, false, false);
        publisher.pub('ra', this.elems.ra, false, false);
        publisher.pub('IlsGS', this.elems.IlsGS, false, false);
        publisher.pub('IlsLoc', this.elems.IlsLoc, false, false);
        publisher.pub('IlsHorizonTrk', this.elems.IlsHorizonTrk, false, false);
        publisher.pub('syntheticRunwway', this.elems.syntheticRunwway, false, false);
        publisher.pub('windIndicator', this.elems.windIndicator, false, false);
        publisher.pub('QFE', this.elems.QFE, false, false);
        publisher.pub('metricAlt', this.elems.metricAlt, false, false);
        publisher.pub('pitchScaleMode', this.elems.pitchScaleMode, false, false);
        publisher.pub('spdChevrons', this.elems.spdChevrons, false, false);
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
    });
  }

  private setCrossWindMode(value: boolean) {
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
