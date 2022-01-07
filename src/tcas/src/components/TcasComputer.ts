/* eslint-disable camelcase */
/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-underscore-dangle */
import { UpdateThrottler } from '@shared/UpdateThrottler';
import { MathUtils } from '@shared/MathUtils';
import { Arinc429Word } from '@shared/arinc429';
import { TcasComponent } from '@tcas/lib/TcasComponent';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { LocalSimVar } from '@shared/simvar';
import { NXDataStore } from '@shared/persistence';
import {
    TCAS_CONST as TCAS, JS_NPCPlane,
    TcasState, TcasMode, XpdrMode, TcasThreat,
    RaParams, RaSense, RaType, TaRaIndex, TaRaIntrusion, Intrude,
    Inhibit, Limits,
} from '../lib/TcasConstants';
import { TcasSoundManager } from './TcasSoundManager';

export class NDTcasTraffic {
    ID: string;
    // TODO: If this is ever implemented << GET_AIR_TRAFFIC
    // name: string;

    lat: number;

    lon: number;

    alt: number;

    relativeAlt: number;

    vertSpeed: number;

    heading: number;

    hrzDistance: number;

    intrusionLevel: TaRaIntrusion;

    posX?: number;

    posY?: number;

    constructor(traffic: TcasTraffic) {
        this.ID = traffic.ID;
        this.lat = traffic.lat;
        this.lon = traffic.lon;
        this.alt = traffic.alt;
        this.relativeAlt = Math.round((traffic.relativeAlt) / 100);
        this.vertSpeed = traffic.vertSpeed;
        this.heading = traffic.heading;
        this.intrusionLevel = traffic.intrusionLevel;
        this.hrzDistance = traffic.hrzDistance;
    }
}

export class NDTcasDebugTraffic extends NDTcasTraffic {
    seen: number;

    hidden: boolean;

    raTau: number;

    taTau: number;

    vTau: number;

    closureRate: number;

    closureAccel: number;

    constructor(traffic: TcasTraffic) {
        super(traffic);
        this.seen = traffic.seen;
        this.hidden = false;
        this.raTau = traffic.raTau;
        this.taTau = traffic.taTau;
        this.vTau = traffic.vTau;
        this.closureRate = traffic.closureRate;
        this.closureAccel = traffic.closureAccel;
    }
}

export class TcasTraffic {
    alive: boolean;

    ID: string;

    implausible: boolean;

    seen: number;

    lat: number;

    lon: number;

    alt: number;

    vertSpeed: number;

    onGround: boolean;

    groundSpeed: number;

    heading: number;

    relativeAlt: number;

    slantDistance: number;

    hrzDistance: number;

    closureRate: number;

    closureAccel: number;

    intrusionLevel: TaRaIntrusion;

    isDisplayed: boolean;

    taTau: number;

    raTau: number;

    vTau: number;

    taExpiring: boolean;

    secondsSinceLastTa: number;

    constructor(tf: JS_NPCPlane, ppos: LatLongData, alt: number) {
        this.alive = true;
        this.seen = 0;
        this.ID = tf.uId.toFixed(0);
        this.implausible = false;
        this.lat = tf.lat;
        this.lon = tf.lon;
        this.alt = tf.alt * 3.281;
        this.relativeAlt = tf.alt * 3.281 - alt;
        this.heading = tf.heading;
        this.slantDistance = MathUtils.computeDistance3D(tf.lat, tf.lon, tf.alt * 3.281, ppos.lat, ppos.long, alt);
        this.hrzDistance = MathUtils.computeGreatCircleDistance(ppos.lat, ppos.long, tf.lat, tf.lon);
        this.onGround = false;
        this.groundSpeed = 0;
        this.isDisplayed = false;
        this.vertSpeed = 0;
        this.closureRate = 0;
        this.intrusionLevel = TaRaIntrusion.TRAFFIC;
        this.taTau = Infinity;
        this.raTau = Infinity;
        this.vTau = Infinity;
        this.taExpiring = false;
        this.secondsSinceLastTa = 0;
    }
}

export class ResAdvisory {
    constructor(
        public info: RaParams | null,
        public isReversal: boolean,
        public secondsSinceStart: number,
        public hasBeenAnnounced: boolean,
    ) {
    }
}

export class TcasComputer implements TcasComponent {
    private static _instance?: TcasComputer;

    private recListener: ViewListener.ViewListener = RegisterViewListener('JS_LISTENER_MAPS', () => {
        this.recListener.trigger('JS_BIND_BINGMAP', 'nxMap', false);
    });

    private debug: boolean;

    private sendListener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private updateThrottler: UpdateThrottler; // Utility to restrict updates

    private airTraffic: TcasTraffic[]; // Air Traffic List

    private raTraffic: TcasTraffic[]; // Traffic with RA

    private sendAirTraffic: (NDTcasTraffic|NDTcasDebugTraffic)[];

    private activeXpdr: number; // Active XPDR

    private xpdrStatus: number; // Active XPDR ON/OFF

    private tcasPower: boolean; // is TCAS computer powered?

    private tcasSwitchPos: number; // TCAS Switch position STBY/TA/TARA

    private tcasMode: LocalSimVar<TcasMode>; // TCAS S/MODE TODO FIXME: ARINC429

    private tcasThreat: number; // TCAS Threat Setting

    private tcasState: LocalSimVar<TcasState>; // TCAS Advisory State (None/TA/RA)

    private taOnly: LocalSimVar<boolean>; // Issuing TA Only message (yes/no) TODO FIXME: ARINC429

    private tcasFault: LocalSimVar<boolean>; // Issuing TCAS fault message (yes/no) TODO FIXME: ARINC429

    private correctiveRa: LocalSimVar<boolean>; // Is currently issuing a corrective RA (yes/no) TODO FIXME: ARINC429

    private isSlewActive: boolean; // Slew Mode on?

    private simRate: number; // Simulation Rate

    private ppos: LatLongData; // Plane PPOS

    private altitude: Arinc429Word | null; // ADR1/2 Altitude

    private altitudeStandby: Arinc429Word | null; // ADR3 Altitude

    private pressureAlt: number | null; // Pressure Altitude

    private planeAlt: number | null; // Plane Altitude

    private radioAlt: number | null; // Radio Altitude

    private verticalSpeed: number | null; // Vertical Speed

    private trueHeading: number;

    private sensitivity: LocalSimVar<number>;

    private activeRa: ResAdvisory | null; // Currently Active RA

    private _newRa: ResAdvisory | null; // avoiding GC

    private inhibitions: Inhibit;

    private advisoryState: TcasState; // Overall TCAS state for callout latching (None, TA, or RA)

    private soundManager: TcasSoundManager;

    private gpwsWarning: boolean;

    public static get instance(): TcasComputer {
        if (!this._instance) {
            this._instance = new TcasComputer();
        }
        return this._instance;
    }

    init(): void {
        SimVar.SetSimVarValue('L:A32NX_TCAS_STATE', 'Enum', 0);
        this.debug = false;
        this.tcasPower = false;
        this.tcasMode = new LocalSimVar('L:A32NX_TCAS_MODE', 'Enum');
        this.tcasState = new LocalSimVar('L:A32NX_TCAS_STATE', 'Enum');
        this.tcasFault = new LocalSimVar('L:A32NX_TCAS_FAULT', 'bool');
        this.taOnly = new LocalSimVar('L:A32NX_TCAS_TA_ONLY', 'bool');
        this.correctiveRa = new LocalSimVar('L:A32NX_TCAS_RA_CORRECTIVE', 'bool');
        this.airTraffic = [];
        this.raTraffic = [];
        this.sensitivity = new LocalSimVar('L:A32NX_TCAS_SENSITIVITY', 'number');
        this.sensitivity.setVar(1);
        this.updateThrottler = new UpdateThrottler(TCAS.REFRESH_RATE); // P5566074 pg 11:45
        this.inhibitions = Inhibit.NONE;
        this.ppos = { lat: NaN, long: NaN };
        this._newRa = new ResAdvisory(null, false, 0, false);
        this.advisoryState = TcasState.NONE;
        this.sendAirTraffic = [];
        this.activeRa = new ResAdvisory(null, false, 0, false);
        this.soundManager = new TcasSoundManager();
    }

    private updateVars(): void {
        // Note: these values are calculated/not used in the real TCAS computer, here we just read SimVars
        this.debug = NXDataStore.get('TCAS_DEBUG', '0') !== '0';
        this.verticalSpeed = SimVar.GetSimVarValue('VERTICAL SPEED', 'feet per minute');
        this.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        this.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

        this.tcasPower = !!SimVar.GetSimVarValue('A32NX_ELEC_DC_1_BUS_IS_POWERED', 'boolean');
        this.tcasSwitchPos = SimVar.GetSimVarValue('L:A32NX_SWITCH_TCAS_Position', 'number');
        this.tcasThreat = SimVar.GetSimVarValue('L:A32NX_SWITCH_TCAS_Traffic_Position', 'number');
        this.xpdrStatus = SimVar.GetSimVarValue('TRANSPONDER STATE:1', 'number'); // TODO: refactor When XPDR2 is implemented
        this.activeXpdr = SimVar.GetSimVarValue('L:A32NX_SWITCH_ATC', 'number'); // TODO: refactor When XPDR2 is implemented
        // workaround for altitude issues due to MSFS bug, needs to be changed to PRESSURE ALTITUDE again when solved
        this.pressureAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE:3', 'feet');
        this.planeAlt = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
        this.radioAlt = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND', 'feet');
        this.altitude = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${this.activeXpdr + 1}_ALTITUDE`);
        this.altitudeStandby = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_3_ALTITUDE');
        this.trueHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');
        this.isSlewActive = !!SimVar.GetSimVarValue('IS SLEW ACTIVE', 'boolean');
        this.simRate = SimVar.GetGlobalVarValue('SIMULATION RATE', 'number');
        this.gpwsWarning = !!SimVar.GetSimVarValue('L:A32NX_GPWS_Warning_Active', 'boolean');

        this.tcasMode.setVar((this.xpdrStatus === XpdrMode.STBY || !this.tcasPower) ? TcasMode.STBY : this.tcasSwitchPos);
    }

    /**
     * TODO: Documentation & complete missing inhibitions
     */
    private updateInhibitions(): void {
        // TODO: Add more TA only conditions here (i.e GPWS active, Windshear warning active, stall)
        // TODO FIXME: Less magic numbers, Use constants defined in TcasConstants
        if (this.radioAlt < 500 || this.gpwsWarning || this.tcasMode.getVar() === TcasMode.STBY) {
            this.inhibitions = Inhibit.ALL_RA_AURAL_TA;
        } else if (this.radioAlt < 1000 || this.tcasMode.getVar() === TcasMode.TA) {
            this.inhibitions = Inhibit.ALL_RA;
        } else if (this.radioAlt < 1100) {
            this.inhibitions = Inhibit.ALL_DESC_RA;
        } else if (this.radioAlt < 1550) {
            this.inhibitions = Inhibit.ALL_INCR_DESC_RA;
        } else if (this.pressureAlt > 39000) {
            this.inhibitions = Inhibit.ALL_CLIMB_RA;
        } else {
            this.inhibitions = Inhibit.NONE;
        }
    }

    private updateStatus(): void {
        if (this.tcasMode.getVar() === TcasMode.STBY) {
            this.taOnly.setVar(false);
            this.tcasFault.setVar(false);
        } else {
            // Update "TA ONLY" message at the bottom of the ND
            if (this.inhibitions === Inhibit.ALL_RA || this.inhibitions === Inhibit.ALL_RA_AURAL_TA) {
                this.taOnly.setVar(true);
            } else {
                this.taOnly.setVar(false);
            }

            // Amber TCAS warning on fault (and on PFD) - 34-43-00:A24/34-43-010
            if (!this.altitude || !this.altitudeStandby
                    || !this.altitude.isNormalOperation() || !this.altitudeStandby.isNormalOperation()
                    || this.altitude.value - this.altitudeStandby.value > 300) {
                this.tcasFault.setVar(true);
            } else {
                this.tcasFault.setVar(false);
            }
        }
    }

    private updateSensitivity(): void {
        if (this.activeRa.info === null) {
            if (this.inhibitions === Inhibit.ALL_RA || this.inhibitions === Inhibit.ALL_RA_AURAL_TA) {
                this.sensitivity.setVar(2);
            } else if (this.radioAlt > TCAS.SENSE[3][Limits.MIN] && this.radioAlt <= TCAS.SENSE[3][Limits.MAX]) {
                this.sensitivity.setVar(3);
            } else if (this.pressureAlt > TCAS.SENSE[4][Limits.MIN] && this.pressureAlt <= TCAS.SENSE[4][Limits.MAX]) {
                this.sensitivity.setVar(4);
            } else if (this.pressureAlt > TCAS.SENSE[5][Limits.MIN] && this.pressureAlt <= TCAS.SENSE[5][Limits.MAX]) {
                this.sensitivity.setVar(5);
            } else if (this.pressureAlt > TCAS.SENSE[6][Limits.MIN] && this.pressureAlt <= TCAS.SENSE[6][Limits.MAX]) {
                this.sensitivity.setVar(6);
            } else if (this.pressureAlt > TCAS.SENSE[7][Limits.MIN] && this.pressureAlt <= TCAS.SENSE[7][Limits.MAX]) {
                this.sensitivity.setVar(7);
            } else {
                this.sensitivity.setVar(8);
            }
        }
    }

    private fetchRawTraffic(_deltaTime): void {
        Coherent.call('GET_AIR_TRAFFIC').then((obj: JS_NPCPlane[]) => {
            this.airTraffic.forEach((traffic) => {
                traffic.alive = false;
            });
            obj.forEach((tf) => {
                // Junk bad air traffic
                if (!tf.lat && !tf.lon && !tf.alt && !tf.heading) {
                    return;
                }
                let traffic: TcasTraffic | undefined = this.airTraffic.find((p) => p && p.ID === tf.uId.toFixed(0));
                if (!traffic) {
                    traffic = new TcasTraffic(tf, this.ppos, this.planeAlt);
                    this.airTraffic.push(traffic);
                }

                traffic.alive = true;
                traffic.seen = Math.min(traffic.seen + 1, 10);
                const newAlt = tf.alt * 3.281;
                traffic.vertSpeed = (newAlt - traffic.alt) / (_deltaTime / 1000) * 60; // feet per minute
                traffic.groundSpeed = Math.abs(MathUtils.computeGreatCircleDistance(tf.lat, tf.lon, traffic.lat, traffic.lon) / (_deltaTime / 1000) * 3600);
                const newSlantDist = MathUtils.computeDistance3D(traffic.lat, traffic.lon, traffic.alt, this.ppos.lat, this.ppos.long, this.pressureAlt);
                const newClosureRate = (traffic.slantDistance - newSlantDist) / (_deltaTime / 1000) * 3600; // knots = nautical miles per hour
                traffic.closureAccel = (newClosureRate - traffic.closureRate) / (_deltaTime / 1000);
                traffic.closureRate = newClosureRate;
                traffic.slantDistance = newSlantDist;
                traffic.lat = tf.lat;
                traffic.lon = tf.lon;
                traffic.alt = tf.alt * 3.281;
                traffic.heading = tf.heading;
                traffic.relativeAlt = newAlt - this.planeAlt;

                traffic.implausible = (
                    Math.abs(traffic.vertSpeed) > 6000
                    || traffic.groundSpeed > 600
                );

                let taTau = (traffic.slantDistance - TCAS.DMOD[this.sensitivity.getVar()][TaRaIndex.TA] ** 2 / traffic.slantDistance) / traffic.closureRate * 3600;
                let raTau = (traffic.slantDistance - TCAS.DMOD[this.sensitivity.getVar()][TaRaIndex.RA] ** 2 / traffic.slantDistance) / traffic.closureRate * 3600;
                let vTau = traffic.relativeAlt / (this.verticalSpeed - traffic.vertSpeed) * 60;

                if (raTau < 0) {
                    taTau = Infinity;
                    raTau = Infinity;
                }
                if (vTau < 0) {
                    vTau = Infinity;
                }
                traffic.taTau = taTau;
                traffic.raTau = raTau;
                traffic.vTau = vTau;
                if (traffic.intrusionLevel === TaRaIntrusion.TA && traffic.secondsSinceLastTa < 10 && traffic.taExpiring) {
                    traffic.secondsSinceLastTa += _deltaTime / 1000;
                }
            });

            if (this.airTraffic.length > TCAS.MEMORY_MAX) {
                this.airTraffic = this.airTraffic
                    .filter((traffic) => traffic.alive === true)
                    .sort((a, b) => a.raTau - b.raTau);
                this.airTraffic.length = TCAS.MEMORY_MAX;
            }
        }).catch(console.error);
    }

    private updateTraffic(): void {
        this.airTraffic.forEach((traffic: TcasTraffic) => {
            // check if traffic is on ground. Mode-S transponders would transmit that information themselves, but since Asobo doesn't provide that
            // information, we need to rely on the fallback method
            // this also leads to problems above 1750 ft (the threshold for ground detection), since the aircraft on ground are then shown again.
            // Currently just hide all above currently ground alt (of ppos) + 380, not ideal but works better than other solutions.
            const groundAlt = this.planeAlt - this.radioAlt; // altitude of the terrain
            const onGround = traffic.alt < (groundAlt + 360) || traffic.groundSpeed < 30;
            traffic.onGround = onGround;
            let isDisplayed = false;
            if (!onGround && !traffic.implausible) {
                if (traffic.groundSpeed >= 30) { // Workaround for MSFS live traffic, TODO: add option to disable
                    if (this.tcasThreat === TcasThreat.THREAT) {
                        if (traffic.intrusionLevel >= TaRaIntrusion.TA
                                && traffic.relativeAlt >= TCAS.THREAT[TcasThreat.THREAT][Limits.MIN]
                                && traffic.relativeAlt <= TCAS.THREAT[TcasThreat.THREAT][Limits.MAX]) {
                            isDisplayed = true;
                        }
                    } else if (this.tcasThreat) {
                        if (traffic.relativeAlt >= TCAS.THREAT[this.tcasThreat][Limits.MIN]
                                && traffic.relativeAlt <= TCAS.THREAT[this.tcasThreat][Limits.MAX]) {
                            isDisplayed = true;
                        }
                    }
                }
            }

            if (isDisplayed) {
                const bearing = MathUtils.computeGreatCircleHeading(this.ppos.lat, this.ppos.long, traffic.lat, traffic.lon) - this.trueHeading + 90;
                const x = traffic.hrzDistance * Math.cos(bearing * Math.PI / 180);
                const y = traffic.hrzDistance * Math.sin(bearing * Math.PI / 180);

                // TODO: Extend at higher altitudes
                // x^2 / xLim ^2 + y^2 / yLim ^2 <= 1
                if (!MathUtils.pointInEllipse(x, y, TCAS.RANGE.side, TCAS.RANGE.forward[Limits.MIN], TCAS.RANGE.side, TCAS.RANGE.back)
                    || Math.abs(traffic.relativeAlt) > TCAS.RANGE.alt) {
                    isDisplayed = false;
                    traffic.taTau = Infinity;
                    traffic.raTau = Infinity;
                }
            }
            traffic.isDisplayed = isDisplayed;

            // if traffic is implausible ignore it
            if (traffic.implausible) {
                traffic.taExpiring = false;
                traffic.secondsSinceLastTa = 0;
                traffic.intrusionLevel = TaRaIntrusion.TRAFFIC;
                return;
            }

            const intrusionLevel: TaRaIntrusion[] = [0, 0, 0];

            // Perform range test
            if (traffic.raTau < TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.RA]
                    || traffic.slantDistance < TCAS.DMOD[this.sensitivity.getVar()][TaRaIndex.RA]) {
                intrusionLevel[Intrude.RANGE] = TaRaIntrusion.RA;
            } else if (traffic.taTau < TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.TA]
                    || traffic.slantDistance < TCAS.DMOD[this.sensitivity.getVar()][TaRaIndex.TA]) {
                intrusionLevel[Intrude.RANGE] = TaRaIntrusion.TA;
            } else if (traffic.hrzDistance < 6) {
                intrusionLevel[Intrude.RANGE] = TaRaIntrusion.PROXIMITY;
            }

            // Perform altitude test
            if (traffic.vTau < ((Math.abs(this.verticalSpeed) <= 600) ? TCAS.TVTHR[this.sensitivity.getVar()] : TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.RA])
            || Math.abs(traffic.relativeAlt) < TCAS.ZTHR[this.sensitivity.getVar()][TaRaIndex.RA]) {
                intrusionLevel[Intrude.ALT] = TaRaIntrusion.RA;
            } else if (traffic.vTau < TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.TA] || Math.abs(traffic.relativeAlt) < TCAS.ZTHR[this.sensitivity.getVar()][TaRaIndex.TA]) {
                intrusionLevel[Intrude.ALT] = TaRaIntrusion.TA;
            } else if (Math.abs(traffic.relativeAlt) < 1200) {
                intrusionLevel[Intrude.ALT] = TaRaIntrusion.PROXIMITY;
            }

            // Perform acceleration test
            // TODO FIXME: Proper HMD based true-to-life filtering
            if (Math.abs(traffic.closureAccel) <= TCAS.ACCEL[this.sensitivity.getVar()][TaRaIndex.RA]) {
                intrusionLevel[Intrude.SPEED] = TaRaIntrusion.RA;
            } else if (Math.abs(traffic.closureAccel) <= TCAS.ACCEL[this.sensitivity.getVar()][TaRaIndex.TA]) {
                intrusionLevel[Intrude.SPEED] = TaRaIntrusion.TA;
            } else {
                intrusionLevel[Intrude.SPEED] = TaRaIntrusion.PROXIMITY;
            }

            const desiredIntrusionLevel: TaRaIntrusion = Math.min(...intrusionLevel);
            if (traffic.intrusionLevel === TaRaIntrusion.TA
                    && desiredIntrusionLevel < TaRaIntrusion.TA
                    && traffic.secondsSinceLastTa >= TCAS.TA_EXPIRATION_DELAY) {
                traffic.taExpiring = false;
                traffic.secondsSinceLastTa = 0;
                traffic.intrusionLevel = desiredIntrusionLevel;
            // Don't allow TA to resolve if less than 4s
            } else if (traffic.intrusionLevel === TaRaIntrusion.TA
                    && desiredIntrusionLevel < TaRaIntrusion.TA
                    && traffic.secondsSinceLastTa < TCAS.TA_EXPIRATION_DELAY) {
                traffic.taExpiring = true;
                traffic.intrusionLevel = TaRaIntrusion.TA;
            // Don't allow RA to resolve if duration is less than 5s
            } else if (this.activeRa.info !== null
                    && traffic.intrusionLevel === TaRaIntrusion.RA
                    && desiredIntrusionLevel < TaRaIntrusion.RA
                    && this.activeRa.secondsSinceStart < TCAS.MIN_RA_DURATION) {
                traffic.intrusionLevel = TaRaIntrusion.RA;
            } else if (this.activeRa.info !== null
                    && traffic.intrusionLevel === TaRaIntrusion.RA
                    && desiredIntrusionLevel < TaRaIntrusion.RA
                    && (traffic.taTau < TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.TA] * TCAS.VOL_BOOST
                        || traffic.slantDistance < TCAS.DMOD[this.sensitivity.getVar()][TaRaIndex.TA] * TCAS.VOL_BOOST)
                    && (traffic.vTau < TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.TA] * TCAS.VOL_BOOST
                        || Math.abs(traffic.relativeAlt) < TCAS.ZTHR[this.sensitivity.getVar()][TaRaIndex.TA] * TCAS.VOL_BOOST)
                    && traffic.closureRate >= TCAS.CLOSURE_RATE_THRESH) {
                traffic.intrusionLevel = TaRaIntrusion.RA;
            } else if (!this.isSlewActive) {
                traffic.intrusionLevel = desiredIntrusionLevel;
            }
        });
    }

    private updateRa(_deltaTime: number): void {
        const raTime = _deltaTime;
        this.getRa(raTime);
        this.updateAdvisoryState(raTime);
    }

    private calculateTrajectory(targetVS: number, traffic: TcasTraffic, delay: number, accel: number): number {
        // accel must be in f/s^2
        accel = targetVS < this.verticalSpeed ? -1 * accel : accel;
        const timeToAccelerate = Math.min(traffic.raTau - delay, ((targetVS - this.verticalSpeed) / 60) / accel); // raTau can be infinity?
        const remainingTime = traffic.raTau - (delay + timeToAccelerate);
        return (
            this.planeAlt
            + Math.round(this.verticalSpeed / 60) * (delay + timeToAccelerate)
            + 0.5 * accel * timeToAccelerate ** 2
            + (targetVS / 60) * remainingTime
        );
    }

    /**
     * TODO: Documentation
     * @returns
     */
    private getPredictedSep(): number {
        let minSeparation = TCAS.REALLY_BIG_NUMBER;
        this.raTraffic.forEach((traffic) => {
            const trafficAltAtCPA = traffic.alt + ((traffic.vertSpeed / 60) * traffic.raTau);
            const myAltAtCPA = this.planeAlt + ((this.verticalSpeed / 60) * traffic.raTau);
            const _sep = Math.abs(myAltAtCPA - trafficAltAtCPA);
            if (_sep < minSeparation) {
                minSeparation = _sep;
            }
        });
        return minSeparation;
    }

    /**
     * TODO: Documentation
     * @param {*} sense Direction up/down
     * @param {*} targetVS Target Vertical Speed
     * @param {*} delay
     * @param {*} accel
     * @returns
     */
    private getVerticalSep(sense: RaSense, targetVS: number, delay: number, accel: number): [number, boolean] {
        let isCrossing = false;
        let minSeparation = TCAS.REALLY_BIG_NUMBER;

        this.raTraffic.forEach((traffic) => {
            const trafficAltAtCPA = traffic.alt + ((traffic.vertSpeed / 60) * traffic.raTau);

            let _sep = TCAS.REALLY_BIG_NUMBER;
            if (sense === RaSense.UP) {
                const _delay = this.verticalSpeed < targetVS ? Math.min(traffic.raTau, delay) : 0;
                _sep = Math.max(this.calculateTrajectory(targetVS, traffic, _delay, accel) - trafficAltAtCPA, 0); // max might not be needed
                if (!isCrossing && (this.planeAlt + 100) < traffic.alt) {
                    isCrossing = true;
                }
            } else if (sense === RaSense.DOWN) {
                const _delay = this.verticalSpeed > targetVS ? Math.min(traffic.raTau, delay) : 0;
                _sep = Math.max(trafficAltAtCPA - this.calculateTrajectory(targetVS, traffic, _delay, accel), 0); // max might not be needed
                if (!isCrossing && (this.planeAlt - 100) > traffic.alt) {
                    isCrossing = true;
                }
            }

            if (_sep < minSeparation) {
                minSeparation = _sep;
            }
        });

        return [minSeparation, isCrossing];
    }

    private getRa(_deltaTime: number): void {
        // TODO: Store 10 most recent RA and 60 most recent TA - 34-43-00
        // TODO: Refactor, remove unneeeded if else
        if (this.tcasFault.getVar()) {
            this._newRa.info = null;
            this.activeRa.info = null;
            return;
        }

        this.raTraffic = this.airTraffic
            .filter((traffic) => traffic.intrusionLevel === TaRaIntrusion.RA && traffic.alive)
            .sort((a, b) => a.raTau - b.raTau);
        this._newRa.info = null;
        this._newRa.isReversal = false;
        this._newRa.secondsSinceStart = 0;
        this._newRa.hasBeenAnnounced = false;
        const previousRa = this.activeRa;
        const ALIM = TCAS.ALIM[this.sensitivity.getVar()];

        if (this.raTraffic.length === 0) {
            return;
        }

        if (this.activeRa.info === null) {
            // First RA
            const [upVerticalSep, upIsCrossing]: [number, boolean] = this.getVerticalSep(
                RaSense.UP,
                1500,
                TCAS.INITIAL_DELAY,
                TCAS.INITIAL_ACCEL,
            );
            const [downVerticalSep, downIsCrossing]: [number, boolean] = this.getVerticalSep(
                RaSense.DOWN,
                -1500,
                TCAS.INITIAL_DELAY,
                TCAS.INITIAL_ACCEL,
            );

            // Select sense
            let sense: RaSense = RaSense.UP;

            console.log('TCAS: INITIAL RA: SELECTING SENSE');
            console.log('---------------------------------');
            console.log(`UP VERTICAL SEPARATION at 1500: ${upVerticalSep}; upIsCrssing: ${upIsCrossing}`);
            console.log(`DOWN VERTICAL SEPARATION at -1500: ${downVerticalSep}; downIsCrossing: ${downIsCrossing}`);
            console.log('ALIM IS ', ALIM);

            // Override if climb/desc RAs are inhibited.
            if (this.inhibitions === Inhibit.ALL_DESC_RA) {
                sense = RaSense.UP;
            } else if (this.inhibitions === Inhibit.ALL_CLIMB_RA) {
                sense = RaSense.DOWN;
            } else {
                // If both achieve ALIM, prefer non-crossing
                if (upVerticalSep >= ALIM && downVerticalSep >= ALIM) {
                    console.log('BOTH ACHIEVE ALIM');
                    if (upIsCrossing && !downIsCrossing) {
                        sense = RaSense.DOWN;
                    } else if (!upIsCrossing && downIsCrossing) {
                        sense = RaSense.UP;
                    } else {
                        sense = upVerticalSep > downVerticalSep ? RaSense.UP : RaSense.DOWN;
                    }
                }

                // If neither achieve ALIM, choose sense with greatest separation
                if (upVerticalSep < ALIM && downVerticalSep < ALIM) {
                    sense = upVerticalSep > downVerticalSep ? RaSense.UP : RaSense.DOWN;
                    console.log('NEITHER ACHIEVE ALIM, PICKING GREATEST SEPARATION');
                }

                // If only one achieves ALIM, pick it
                if (upVerticalSep >= ALIM && downVerticalSep < ALIM) {
                    console.log('UP ACHIEVES ALIM');
                    sense = RaSense.UP;
                } else {
                    console.log('DOWN ACHIEVES ALIM');
                    sense = RaSense.DOWN;
                }
            }

            // Useful later
            const [levelSep]: [number, boolean] = this.getVerticalSep(
                sense,
                0,
                TCAS.INITIAL_DELAY,
                TCAS.INITIAL_ACCEL,
            );
            console.log(`levelSep is: ${levelSep}`);
            if (Math.abs(this.verticalSpeed) < 1500 || (this.verticalSpeed <= -1500 && sense === RaSense.UP) || (this.verticalSpeed >= 1500 && sense === RaSense.DOWN)) {
                // Choose preventive or corrective
                const predictedSep = this.getPredictedSep();
                if (predictedSep >= ALIM) {
                    // We already achieve ALIM, so preventive RA
                    // Multiplier for vertical speed (test negative VS for climb sense, positive VS for descend sense)
                    const mul = sense === RaSense.UP ? -1 : 1;
                    const [sep500] = this.getVerticalSep(
                        sense,
                        (mul * 500),
                        TCAS.INITIAL_DELAY,
                        TCAS.INITIAL_ACCEL,
                    );
                    const [sep1000] = this.getVerticalSep(
                        sense,
                        (mul * 1000),
                        TCAS.INITIAL_DELAY,
                        TCAS.INITIAL_ACCEL,
                    );
                    const [sep2000] = this.getVerticalSep(
                        sense,
                        (mul * 2000),
                        TCAS.INITIAL_DELAY,
                        TCAS.INITIAL_ACCEL,
                    );

                    // Find preventive RA's which achieve ALIM
                    // If none achieve ALIM, then use nominal RA
                    if (sep2000 >= ALIM) {
                        this._newRa.info = (sense === RaSense.UP) ? TCAS.RA_VARIANTS.monitor_vs_climb_2000 : TCAS.RA_VARIANTS.monitor_vs_descend_2000;
                    } else if (sep1000 >= ALIM) {
                        this._newRa.info = (sense === RaSense.UP) ? TCAS.RA_VARIANTS.monitor_vs_climb_1000 : TCAS.RA_VARIANTS.monitor_vs_descend_1000;
                    } else if (sep500 >= ALIM) {
                        this._newRa.info = (sense === RaSense.UP) ? TCAS.RA_VARIANTS.monitor_vs_climb_500 : TCAS.RA_VARIANTS.monitor_vs_descend_500;
                    } else if (levelSep >= ALIM) {
                        this._newRa.info = (sense === RaSense.UP) ? TCAS.RA_VARIANTS.monitor_vs_climb_0 : TCAS.RA_VARIANTS.monitor_vs_descend_0;
                    } else if (sense === RaSense.UP) {
                        this._newRa.info = upIsCrossing ? TCAS.RA_VARIANTS.climb_cross : TCAS.RA_VARIANTS.climb;
                    } else {
                        this._newRa.info = downIsCrossing ? TCAS.RA_VARIANTS.descend_cross : TCAS.RA_VARIANTS.descend;
                    }
                } else {
                    // Corrective RA (either climb/descend or level off)
                    const nominalSep = sense === RaSense.UP ? upVerticalSep : downVerticalSep;
                    if (nominalSep > levelSep) {
                        if (sense === RaSense.UP) {
                            this._newRa.info = upIsCrossing ? TCAS.RA_VARIANTS.climb_cross : TCAS.RA_VARIANTS.climb;
                        } else {
                            this._newRa.info = downIsCrossing ? TCAS.RA_VARIANTS.descend_cross : TCAS.RA_VARIANTS.descend;
                        }
                    } else {
                        this._newRa.info = sense === RaSense.UP ? TCAS.RA_VARIANTS.level_off_300_above : TCAS.RA_VARIANTS.level_off_300_below;
                    }
                }
            } else {
                // We're above 1500 FPM already, so either maintain VS or level off
                const nominalSep = sense === RaSense.UP ? upVerticalSep : downVerticalSep;
                if (nominalSep > levelSep) {
                    if (sense === RaSense.UP) {
                        this._newRa.info = upIsCrossing ? TCAS.RA_VARIANTS.climb_maintain_vs_crossing : TCAS.RA_VARIANTS.climb_maintain_vs;
                    } else {
                        this._newRa.info = downIsCrossing ? TCAS.RA_VARIANTS.descend_maintain_vs_crossing : TCAS.RA_VARIANTS.descend_maintain_vs;
                    }
                } else {
                    this._newRa.info = sense === RaSense.UP ? TCAS.RA_VARIANTS.level_off_300_above : TCAS.RA_VARIANTS.level_off_300_below;
                }
            }
        } else {
            // There is a previous RA, so revise it if necessary
            let alreadyAchievedTaZTHR = true;
            let minTimeToCPA = TCAS.REALLY_BIG_NUMBER;
            this.raTraffic.forEach((traffic) => {
                if (Math.abs(this.planeAlt - traffic.alt) < TCAS.ZTHR[this.sensitivity.getVar()][TaRaIndex.TA]) {
                    alreadyAchievedTaZTHR = false;
                }
                if (traffic.raTau < minTimeToCPA) {
                    minTimeToCPA = traffic.raTau;
                }
            });

            const sense = previousRa.info.sense;
            this._newRa.isReversal = previousRa.isReversal;
            this._newRa.secondsSinceStart = previousRa.secondsSinceStart;

            if (alreadyAchievedTaZTHR) {
                // We've already achieved TA ZTHR (formerly ALIM)
                // If 10 seconds or more elapsed since start of RA
                //   & (DEFERRED) we haven't yet reached CPA
                //   & our previous RA wasn't a monitor VS or level off,
                // THEN issue a level-off weakening RA
                // ! NOTE: This was originally ALIM, but revised the condition to require greater altitude difference,
                // !       so as not to cause a second RA
                // TODO: Revise conditions for level-off weakening, since nominal RA's are often issued right afterwards

                if (previousRa.secondsSinceStart >= 10
                    && previousRa.info.callout.id !== TCAS.CALLOUTS.level_off.id
                    && previousRa.info.callout.id !== TCAS.CALLOUTS.monitor_vs.id) {
                    this._newRa.info = (previousRa.info.sense === RaSense.UP) ? TCAS.RA_VARIANTS.level_off_300_above : TCAS.RA_VARIANTS.level_off_300_below;
                } else {
                    // Continue with same RA
                    this._newRa.info = previousRa.info;
                    this._newRa.hasBeenAnnounced = true;
                }
            } else {
                const predictedSep = this.getPredictedSep(); // need this to factor in level off/maintain VS RA's
                let strengthenRaInfo = null;
                if (predictedSep < ALIM) {
                    // Won't achieve ALIM anymore :(
                    const mul = (sense === RaSense.UP) ? 1 : -1;
                    let increaseSep = null;
                    let increaseCross = null;
                    switch (previousRa.info.callout.id) {
                    case TCAS.CALLOUTS.level_off.id:
                    case TCAS.CALLOUTS.monitor_vs.id:
                        [increaseSep, increaseCross] = this.getVerticalSep(
                            sense,
                            mul * 1500,
                            TCAS.FOLLOWUP_DELAY,
                            TCAS.FOLLOWUP_ACCEL,
                        );
                        if (increaseCross) {
                            strengthenRaInfo = (sense === RaSense.UP) ? TCAS.RA_VARIANTS.climb_cross : TCAS.RA_VARIANTS.descend_cross;
                        } else {
                            strengthenRaInfo = (sense === RaSense.UP) ? TCAS.RA_VARIANTS.climb : TCAS.RA_VARIANTS.descend;
                        }
                        console.log('StrengthenRAInfo: level 0 to 1: ', strengthenRaInfo);
                        break;
                    case TCAS.CALLOUTS.climb.id:
                    case TCAS.CALLOUTS.climb_cross.id:
                    case TCAS.CALLOUTS.climb_now.id:
                    case TCAS.CALLOUTS.descend.id:
                    case TCAS.CALLOUTS.descend_now.id:
                    case TCAS.CALLOUTS.maintain_vs.id:
                    case TCAS.CALLOUTS.maintain_vs_cross.id:
                        if ((previousRa.info.sense === RaSense.UP && this.verticalSpeed >= 1500) || (previousRa.info.sense === RaSense.DOWN && this.verticalSpeed <= -1500)) {
                            [increaseSep, increaseCross] = this.getVerticalSep(
                                sense,
                                mul * 2500,
                                TCAS.FOLLOWUP_DELAY,
                                TCAS.FOLLOWUP_ACCEL,
                            );
                            // Check for inhibiting increasing descent
                            if (this.inhibitions !== Inhibit.ALL_INCR_DESC_RA) {
                                strengthenRaInfo = (sense === RaSense.UP) ? TCAS.RA_VARIANTS.climb_increase : TCAS.RA_VARIANTS.descend_increase;
                            }
                            console.log('StrengthenRAInfo: level 1 to 2 ', strengthenRaInfo);
                        } else {
                            console.log('StrengthenRAInfo: condition not met. Callout: ', previousRa.info.callout);
                        }
                        break;
                    default:
                        console.log('StrengthenRAInfo: condition not met. Callout: ', previousRa.info.callout);
                        break;
                    }

                    if (previousRa.isReversal || previousRa.secondsSinceStart < 10 || minTimeToCPA < 4) {
                        // We've reversed before, or less than 10 seconds have elapsed since start of RA, or less than 4 seconds until CPA
                        // Can only increase strength if able
                        if (strengthenRaInfo === null) {
                            // We're at the strongest RA type possible. So cannot reverse.
                            this._newRa.info = previousRa.info;
                            this._newRa.hasBeenAnnounced = true;
                        } else {
                            this._newRa.info = strengthenRaInfo;
                        }
                    // Do not allow reversal if CLIMB/DESC is inhibited
                    } else if (this.inhibitions !== Inhibit.ALL_CLIMB_RA && this.inhibitions !== Inhibit.ALL_DESC_RA) {
                        // Haven't reversed before, so it's still a possibility
                        const reversedSense = (sense === RaSense.UP) ? RaSense.DOWN : RaSense.UP;
                        const revMul = (reversedSense === RaSense.UP) ? 1 : -1;
                        const [reverseSep] = this.getVerticalSep(
                            reversedSense,
                            revMul * 1500,
                            TCAS.FOLLOWUP_DELAY,
                            TCAS.FOLLOWUP_ACCEL,
                        );

                        // If cannot increase RA, then pick between current separation and reverse
                        if (strengthenRaInfo === null) {
                            if (predictedSep >= reverseSep) {
                                this._newRa.info = previousRa.info;
                                this._newRa.hasBeenAnnounced = true;
                                return;
                            }
                            this._newRa.info = (reversedSense === RaSense.UP) ? TCAS.RA_VARIANTS.climb_now : TCAS.RA_VARIANTS.descend_now;
                            this._newRa.isReversal = true;
                        }

                        // If both achieve ALIM, prefer non-reversal
                        if (increaseSep >= ALIM && reverseSep >= ALIM) {
                            this._newRa.info = strengthenRaInfo;
                        }

                        // If neither achieve ALIM, choose sense with greatest separation
                        if (increaseSep < ALIM && reverseSep < ALIM) {
                            if (increaseSep >= reverseSep) {
                                this._newRa.info = strengthenRaInfo;
                            } else {
                                this._newRa.info = (reversedSense === RaSense.UP) ? TCAS.RA_VARIANTS.climb_now : TCAS.RA_VARIANTS.descend_now;
                                this._newRa.isReversal = true;
                            }
                        }

                        // If only one achieves ALIM, pick it
                        if (increaseSep >= ALIM && reverseSep < ALIM) {
                            this._newRa.info = strengthenRaInfo;
                        } else {
                            this._newRa.info = (reversedSense === RaSense.UP) ? TCAS.RA_VARIANTS.climb_now : TCAS.RA_VARIANTS.descend_now;
                            this._newRa.isReversal = true;
                        }
                    } else if (strengthenRaInfo !== null) {
                        this._newRa.info = strengthenRaInfo;
                    } else {
                        this._newRa.info = previousRa.info;
                        this._newRa.hasBeenAnnounced = true;
                    }
                } else {
                    // Continue with same RA
                    this._newRa.info = previousRa.info;
                    this._newRa.hasBeenAnnounced = true;
                }
            }
        }
    }

    private updateAdvisoryState(_deltaTime) {
        const taThreatCount = this.airTraffic.reduce((acc, aircraft) => acc + (aircraft.alive && aircraft.intrusionLevel === TaRaIntrusion.TA ? 1 : 0), 0);
        const raThreatCount = this.raTraffic.length;

        switch (this.advisoryState) {
        case TcasState.TA:
            if (raThreatCount > 0 && (this.inhibitions !== Inhibit.ALL_RA && this.inhibitions !== Inhibit.ALL_RA_AURAL_TA)) {
                this.advisoryState = TcasState.RA;
                this.tcasState.setVar(TcasState.RA);
                console.log('TCAS: TA UPGRADED TO RA');
            } else if (taThreatCount === 0) {
                this.advisoryState = TcasState.NONE;
                this.tcasState.setVar(TcasState.NONE);
            }
            break;
        case TcasState.RA:
            if (raThreatCount === 0) {
                if (taThreatCount > 0) {
                    this.advisoryState = TcasState.TA;
                    this.tcasState.setVar(TcasState.TA);
                } else {
                    this.advisoryState = TcasState.NONE;
                    this.tcasState.setVar(TcasState.NONE);
                }
                console.log('TCAS: CLEAR OF CONFLICT');
                this.soundManager.tryPlaySound(TCAS.SOUNDS.clear_of_conflict, true);
                this.activeRa.info = null;
            }
            break;
        default:
            if (raThreatCount > 0 && (this.inhibitions !== Inhibit.ALL_RA && this.inhibitions !== Inhibit.ALL_RA_AURAL_TA)) {
                this.advisoryState = TcasState.RA;
                this.tcasState.setVar(TcasState.RA);
            } else if (taThreatCount > 0) {
                this.advisoryState = TcasState.TA;
                this.tcasState.setVar(TcasState.TA);
                if (this.inhibitions !== Inhibit.ALL_RA_AURAL_TA) {
                    this.soundManager.tryPlaySound(TCAS.SOUNDS.traffic_traffic, true);
                }
            }
            break;
        }

        if (this._newRa.info !== null && this.advisoryState === TcasState.RA) {
            // Replace old RA with new RA
            this.activeRa.info = this._newRa.info;
            this.activeRa.isReversal = this._newRa.isReversal;
            this.activeRa.secondsSinceStart = this._newRa.secondsSinceStart;
            this.activeRa.hasBeenAnnounced = this._newRa.hasBeenAnnounced;
            this.activeRa.secondsSinceStart += _deltaTime / 1000;
            if (!this.activeRa.hasBeenAnnounced) {
                console.log('RA Intruders: ');
                console.log(' ================================ ');
                this.raTraffic.forEach((traffic) => {
                    console.log(` id | ${traffic.ID}`);
                    console.log(` alt | ${traffic.alt}`);
                    console.log(` rAlt | ${traffic.relativeAlt}`);
                    console.log(` sDist | ${traffic.slantDistance}`);
                    console.log(` bearing | ${MathUtils.computeGreatCircleHeading(this.ppos.lat, this.ppos.long, traffic.lat, traffic.lon)}`);
                    console.log(` hDist | ${MathUtils.computeGreatCircleDistance(this.ppos.lat, this.ppos.long, traffic.lat, traffic.lon)}`);
                    console.log(` closureRate | ${traffic.closureRate}`);
                    console.log(` closureAccel | ${traffic.closureAccel}`);
                    console.log(` RA TAU | ${traffic.raTau} <<< : ${TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.RA]}`);
                    console.log(` V TAU | ${traffic.vTau} <<< : ${TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.TA]}`);
                    console.log(` TA TAU | ${traffic.taTau} <<< : ${TCAS.TAU[this.sensitivity.getVar()][TaRaIndex.RA]}`);
                    console.log(' ================================ ');
                });
                console.log('TCAS: RA GENERATED: ', this.activeRa.info.callout);

                if (this.activeRa.info.callout.repeat) {
                    this.soundManager.tryPlaySound(this.activeRa.info.callout.sound, true, true);
                } else {
                    this.soundManager.tryPlaySound(this.activeRa.info.callout.sound, true, false);
                }

                const isCorrective = this.activeRa.info.type === RaType.CORRECT;
                this.correctiveRa.setVar(isCorrective);
                SimVar.SetSimVarValue('L:A32NX_TCAS_VSPEED_RED:1', 'Number', this.activeRa.info.vs.red[Limits.MIN]);
                SimVar.SetSimVarValue('L:A32NX_TCAS_VSPEED_RED:2', 'Number', this.activeRa.info.vs.red[Limits.MAX]);
                if (isCorrective) {
                    SimVar.SetSimVarValue('L:A32NX_TCAS_VSPEED_GREEN:1', 'Number', this.activeRa.info.vs.green[Limits.MIN]);
                    SimVar.SetSimVarValue('L:A32NX_TCAS_VSPEED_GREEN:2', 'Number', this.activeRa.info.vs.green[Limits.MAX]);
                }

                this.activeRa.hasBeenAnnounced = true;
            }
        }
    }

    private emitDisplay(): void {
        this.sendAirTraffic.length = 0;
        const sentAirTraffic = this.airTraffic
            .filter((traffic) => traffic.alive === true && traffic.isDisplayed === true)
            .sort((a, b) => b.intrusionLevel - a.intrusionLevel || a.raTau - b.raTau || a.taTau - b.taTau || a.slantDistance - b.slantDistance);
            // Limit number of contacts displayed to 8
        sentAirTraffic.forEach((traffic: TcasTraffic, index) => {
            if (this.debug) {
                const debugTraffic = new NDTcasDebugTraffic(traffic);
                debugTraffic.hidden = index >= TCAS.DISPLAY_MAX;
                this.sendAirTraffic.push(debugTraffic);
            } else {
                if (index >= TCAS.DISPLAY_MAX) {
                    return;
                }
                this.sendAirTraffic.push(new NDTcasTraffic(traffic));
            }
        });
        this.raTraffic.forEach((tf) => {
            const traffic: TcasTraffic | undefined = sentAirTraffic.find((p) => p && p.ID === tf.ID);
            if (!traffic) {
                console.log(`ERROR: RA ${tf.ID} NOT SENT`);
            }
        });

        this.sendListener.triggerToAllSubscribers('A32NX_TCAS_TRAFFIC', this.sendAirTraffic);
    }

    update(_deltaTime: number): void {
        this.soundManager.update(_deltaTime);

        const deltaTime = this.updateThrottler.canUpdate(_deltaTime * (this.simRate || 1));
        if (deltaTime === -1) {
            return;
        }
        this.updateVars();
        this.updateInhibitions();
        this.updateStatus();
        if (this.tcasMode.getVar() === TcasMode.STBY) {
            if (this.sendAirTraffic.length !== 0) {
                this.sendAirTraffic.length = 0;
                this.sendListener.triggerToAllSubscribers('A32NX_TCAS_TRAFFIC', this.sendAirTraffic);
            }
            return;
        }
        this.updateSensitivity();
        this.fetchRawTraffic(deltaTime);
        this.updateTraffic();
        this.updateRa(deltaTime);
        this.emitDisplay();
    }
}
