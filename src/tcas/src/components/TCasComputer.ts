/* eslint-disable camelcase */
/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
/* eslint-disable no-underscore-dangle */
import { UpdateThrottler } from '@shared/updateThrottler';
import { MathUtils } from '@shared/MathUtils';
import { Arinc429Word } from '@shared/arinc429';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { TCasComponent } from '@tcas/lib/TCasComponent';
import { TcasConst, JS_NPCPlane, TaRaIndex, RaSense, TcasThreat, Intrude, RaParams, Inhibit, TcasState, RaType, TaRaIntrusion } from '../lib/TCasConstants';
import { TCasSoundManager } from './TCasSoundManager';

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

    intrusionLevel: TaRaIntrusion;

    posX: number;

    posY: number;

    constructor(traffic: TcasTraffic) {
        this.ID = traffic.ID;
        // this.name = traffic.name;
        this.lat = traffic.lat;
        this.lon = traffic.lon;
        this.alt = traffic.alt;
        this.relativeAlt = Math.round((traffic.relativeAlt) / 100);
        this.vertSpeed = traffic.vertSpeed;
        this.heading = traffic.heading;
        this.intrusionLevel = traffic.intrusionLevel;
        this.posX = -1;
        this.posY = -1;
    }
}
export class TcasTraffic {
    alive: boolean;

    ID: string;

    // name: string;

    lat: number;

    lon: number;

    alt: number;

    vertSpeed: number;

    onGround: boolean;

    heading: number;

    relativeAlt: number;

    slantDistance: number;

    closureRate: number;

    // closureAccel: number;

    intrusionLevel: TaRaIntrusion;

    isDisplayed: boolean;

    taTau: number;

    raTau: number;

    vTau: number;

    taExpiring: boolean;

    secondsSinceLastTa: number;

    constructor(tf: JS_NPCPlane, ppos: LatLongData, alt: number) {
        this.alive = true;
        this.ID = tf.uId.toFixed(0);
        // this.name = `npc-airplane-${tf.uId.toFixed(0)}`;
        this.lat = tf.lat;
        this.lon = tf.lon;
        this.alt = tf.alt * 3.281;
        this.relativeAlt = tf.alt * 3.281 - alt;
        this.heading = tf.heading;
        this.slantDistance = MathUtils.computeDistance3D([tf.lat, tf.lon, tf.alt * 3.281], [ppos.lat, ppos.long, alt]);
        this.onGround = false;
        this.isDisplayed = false;
        this.vertSpeed = 0;
        this.closureRate = 0;
        // this.closureAccel = 0;
        this.intrusionLevel = TaRaIntrusion.TRAFFIC;
        this.taTau = Infinity;
        this.raTau = Infinity;
        this.vTau = Infinity;
        this.taExpiring = false;
        this.secondsSinceLastTa = 0;
    }
}

export class ResAdvisory {
    info: RaParams | null;

    isReversal: boolean;

    secondsSinceStart: number;

    hasBeenAnnounced: boolean;

    constructor(_inf: RaParams | null, _isRev: boolean, _sinceStart: number, _announced: boolean) {
        this.info = _inf;
        this.isReversal = _isRev;
        this.secondsSinceStart = _sinceStart;
        this.hasBeenAnnounced = _announced;
    }
}

export class TCasComputer implements TCasComponent {
    private static _instance?: TCasComputer;

    private recListener: ViewListener.ViewListener = RegisterViewListener('JS_LISTENER_MAPS', () => {
        this.recListener.trigger('JS_BIND_BINGMAP', 'nxMap', false);
    });

    private sendListener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private updateThrottler: UpdateThrottler; // Utility to restrict updates (1 sec) //

    private airTraffic: TcasTraffic[]; // Air Traffic List

    private raTraffic: TcasTraffic[]; // Traffic with RA

    private sendAirTraffic: NDTcasTraffic[];

    private activeXpdr: number; // Active XPDR

    private xpdrStatus: number; // Active XPDR ON/OFF

    private tcasOn: number; // TCAS ON/OFF

    private tcasMode: number; // TCAS S/MODE

    private tcasThreat: number; // TCAS Threat Setting

    private isSlewActive: boolean; // Slew Mode on?

    private ppos: LatLongData; // Plane PPOS

    private _pposLatLong: LatLong; // avoiding GC

    private _trafficPpos: LatLong;

    private altitude: Arinc429Word | null; // ADR1/2 Altitude

    private altitudeStandby: Arinc429Word | null; // ADR3 Altitude

    private pressureAlt: number | null; // Pressure Altitude

    private radioAlt: number | null; // Radio Altitude

    private verticalSpeed: number | null; // Vertical Speed

    private sensitivity: number;

    private activeRa: ResAdvisory | null; // Currently Active RA

    private _newRa: ResAdvisory | null; // avoiding GC

    private inhibitions: Inhibit;

    private advisoryState: TcasState; // Overall TCAS state for callout latching (None, TA, or RA)

    private soundManager: TCasSoundManager;

    private taOnly: boolean;

    private skipRa: boolean;

    constructor() {}

    public static get instance(): TCasComputer {
        if (!this._instance) {
            this._instance = new TCasComputer();
        }
        return this._instance;
    }

    init(): void {
        SimVar.SetSimVarValue('L:A32NX_TCAS_STATE', 'Enum', 0);
        this.airTraffic = [];
        this.raTraffic = [];
        this.sensitivity = 1;
        this.updateThrottler = new UpdateThrottler(1000); // P5566074 pg 11:45
        this.inhibitions = Inhibit.NONE;
        this.ppos = { lat: NaN, long: NaN };
        this._pposLatLong = new LatLong(NaN, NaN);
        this._trafficPpos = new LatLong(NaN, NaN);
        this._newRa = new ResAdvisory(null, false, 0, false);
        this.advisoryState = TcasState.NONE;
        this.sendAirTraffic = [];
        this.activeRa = new ResAdvisory(null, false, 0, false);
        this.soundManager = new TCasSoundManager();
        this.taOnly = false;
        this.skipRa = false;
    }

    private updateVars(): void {
        // Note: these values are calculated/not used in the real TCAS computer, here we just read SimVars
        this.verticalSpeed = SimVar.GetSimVarValue('VERTICAL SPEED', 'feet per minute');
        this.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        this.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

        this.tcasOn = SimVar.GetSimVarValue('L:A32NX_SWITCH_TCAS_Position', 'number');
        this.tcasThreat = SimVar.GetSimVarValue('L:A32NX_SWITCH_TCAS_Traffic_Position', 'number');
        this.xpdrStatus = SimVar.GetSimVarValue('TRANSPONDER STATE:1', 'number'); // TODO: When XPDR2 is implemented
        this.activeXpdr = SimVar.GetSimVarValue('L:A32NX_SWITCH_ATC', 'number');
        // TODO FIXME:  workaround for altitude issues due to MSFS bug, needs to be changed to PRESSURE ALTITUDE again when solved
        this.pressureAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE:3', 'feet');
        this.radioAlt = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND', 'feet');
        this.altitude = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${this.activeXpdr + 1}_ALTITUDE`);
        this.altitudeStandby = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_3_ALTITUDE');
        this.isSlewActive = !!SimVar.GetSimVarValue('IS SLEW ACTIVE', 'boolean');

        // TODO: Add more TA only conditions here (i.e GPWS active, Windshear warning active, stall)
        this.tcasMode = this.tcasOn;

        // Update "TA ONLY" message at the bottom of the ND
        if ((this.radioAlt < 1000 || this.tcasMode === 1)) {
            if (!this.taOnly) {
                // Set TA ONLY true
                this.taOnly = true;
                SimVar.SetSimVarValue('L:A32NX_TCAS_TA_ONLY', 'bool', true);
            }
        } else if (this.taOnly) {
            this.taOnly = false;
            SimVar.SetSimVarValue('L:A32NX_TCAS_TA_ONLY', 'bool', false);
        }

        // Red TCAS warning on fault (and on PFD) - AMM 34-43-00:A24
        if (!this.altitude || !this.altitudeStandby
            || !this.altitude.isNormalOperation() || !this.altitudeStandby.isNormalOperation() || this.altitude.value - this.altitudeStandby.value > 300) {
            if (!this.skipRa) {
                this.skipRa = true;
                SimVar.SetSimVarValue('L:A32NX_TCAS_FAULT', 'bool', true);
            }
        } else if (this.skipRa) {
            this.skipRa = false;
            SimVar.SetSimVarValue('L:A32NX_TCAS_FAULT', 'bool', false);
        }
    }

    private updateSensitivity(): void {
        if (this.activeRa.info === null) {
            if (this.taOnly) {
                this.sensitivity = 2;
            } else if (this.radioAlt <= 2350 && this.radioAlt > 1000) {
                this.sensitivity = 3;
            } else if (this.pressureAlt <= 5000 && this.pressureAlt > 2350) {
                this.sensitivity = 4;
            } else if (this.pressureAlt <= 10000 && this.pressureAlt > 5000) {
                this.sensitivity = 5;
            } else if (this.pressureAlt <= 20000 && this.pressureAlt > 10000) {
                this.sensitivity = 6;
            } else if (this.pressureAlt <= 47000 && this.pressureAlt > 20000) {
                this.sensitivity = 7;
            } else {
                this.sensitivity = 8;
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
                    traffic = new TcasTraffic(tf, this.ppos, this.pressureAlt);
                    this.airTraffic.push(traffic);
                }
                traffic.alive = true;
                const newAlt = tf.alt * 3.281;
                traffic.vertSpeed = (newAlt - traffic.alt) / (_deltaTime / 1000) * 60; // feet per minute
                const newSlantDist = MathUtils.computeDistance3D([traffic.lat, traffic.lon, traffic.alt], [this.ppos.lat, this.ppos.long, this.pressureAlt]);
                // const newClosureRate = (traffic.slantDistance - newSlantDist) / (_deltaTime / 1000) * 3600;
                // traffic.closureAccel = (newClosureRate - traffic.closureRate) / (_deltaTime / 1000);
                // traffic.closureRate = newClosureRate;
                traffic.closureRate = (traffic.slantDistance - newSlantDist) / (_deltaTime / 1000) * 3600;
                traffic.slantDistance = newSlantDist;
                traffic.slantDistance = newSlantDist;
                traffic.lat = tf.lat;
                traffic.lon = tf.lon;
                traffic.alt = tf.alt * 3.281;
                traffic.heading = tf.heading;
                traffic.relativeAlt = newAlt - this.pressureAlt;

                let taTau = (traffic.slantDistance - TcasConst.DMOD[this.sensitivity][TaRaIndex.TA] ** 2 / traffic.slantDistance) / traffic.closureRate * 3600;
                let raTau = (traffic.slantDistance - TcasConst.DMOD[this.sensitivity][TaRaIndex.RA] ** 2 / traffic.slantDistance) / traffic.closureRate * 3600;
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

            if (this.airTraffic.length > 200) {
                this.airTraffic = this.airTraffic
                    .sort((a, b) => a.raTau - b.raTau)
                    .filter((traffic) => traffic.alive === true);
                this.airTraffic.length = 100;
            }
        }).catch(console.error);
    }

    private updateTraffic(): void {
        this.airTraffic.forEach((traffic: TcasTraffic) => {
            // check if traffic is on ground. Mode-S transponders would transmit that information themselves, but since Asobo doesn't provide that
            // information, we need to rely on the fallback method
            const groundAlt = this.pressureAlt - this.radioAlt; // altitude of the terrain
            const onGround = !!((this.pressureAlt < groundAlt + 1750 && traffic.alt < groundAlt + 380));
            traffic.onGround = onGround;
            let isDisplayed = false;
            if (!onGround) {
                switch (this.tcasThreat) {
                case TcasThreat.THREAT:
                    if (Math.abs(traffic.relativeAlt) <= 2700 && traffic.intrusionLevel >= TaRaIntrusion.TA) {
                        isDisplayed = true;
                    }
                    break;
                case TcasThreat.ALL:
                    if (Math.abs(traffic.relativeAlt) <= 2700) {
                        isDisplayed = true;
                    }
                    break;
                case TcasThreat.ABOVE:
                    if (traffic.relativeAlt <= 9900 && traffic.relativeAlt >= -2700) {
                        isDisplayed = true;
                    }
                    break;
                case TcasThreat.BELOW:
                    if (traffic.relativeAlt <= 2700 && traffic.relativeAlt >= -9900) {
                        isDisplayed = true;
                    }
                    break;
                default:
                    break;
                }
            }
            traffic.isDisplayed = isDisplayed;

            this._pposLatLong.lat = this.ppos.lat;
            this._pposLatLong.long = this.ppos.long;
            this._trafficPpos.lat = traffic.lat;
            this._trafficPpos.long = traffic.lon;

            const horizontalDistance = Avionics.Utils.computeGreatCircleDistance(this._pposLatLong, this._trafficPpos);
            const bearing = Avionics.Utils.computeGreatCircleHeading(this._pposLatLong, this._trafficPpos);
            const x = horizontalDistance * Math.cos(bearing * Math.PI / 180);
            const y = horizontalDistance * Math.sin(bearing * Math.PI / 180);

            // TODO: Extend at higher altitudes
            // x^2 / xLim ^2 + y^2 / yLim ^2 <= 1
            // Detection Range: 60-100 Nm Forwards, 20Nm behind , 30 Nm Side to Side - AMM 34-43-00 6:2339
            if ((x) ** 2 / ((x >= 0) ? 60 : 20) ** 2 + (y) ** 2 / 900 > 1 || Math.abs(traffic.relativeAlt) > 9900) {
                traffic.isDisplayed = false;
                traffic.taTau = Infinity;
                traffic.raTau = Infinity;
            }

            const intrusionLevel: TaRaIntrusion[] = [0, 0];

            // Perform range test
            if (traffic.raTau < TcasConst.TAU[this.sensitivity][TaRaIndex.RA]
                    || traffic.slantDistance < TcasConst.DMOD[this.sensitivity][TaRaIndex.RA]) {
                intrusionLevel[Intrude.RANGE] = TaRaIntrusion.RA;
            } else if (traffic.taTau < TcasConst.TAU[this.sensitivity][TaRaIndex.TA]
                    || traffic.slantDistance < TcasConst.DMOD[this.sensitivity][TaRaIndex.TA]) {
                intrusionLevel[Intrude.RANGE] = TaRaIntrusion.TA;
            } else if (horizontalDistance < 6) {
                intrusionLevel[Intrude.RANGE] = TaRaIntrusion.PROXIMITY;
            }

            // Perform altitude test
            if (traffic.vTau < TcasConst.TAU[this.sensitivity][TaRaIndex.RA]
                    || Math.abs(traffic.relativeAlt) < TcasConst.ZTHR[this.sensitivity][TaRaIndex.RA]) {
                intrusionLevel[Intrude.ALT] = TaRaIntrusion.RA;
            } else if (traffic.vTau < TcasConst.TAU[this.sensitivity][TaRaIndex.TA]
                    || Math.abs(traffic.relativeAlt) < TcasConst.ZTHR[this.sensitivity][TaRaIndex.TA]) {
                intrusionLevel[Intrude.ALT] = TaRaIntrusion.TA;
            } else if (Math.abs(traffic.relativeAlt) < 1200) {
                intrusionLevel[Intrude.ALT] = TaRaIntrusion.PROXIMITY;
            }

            const desiredIntrusionLevel: TaRaIntrusion = Math.min(...intrusionLevel);
            if (traffic.intrusionLevel === TaRaIntrusion.TA
                    && desiredIntrusionLevel < TaRaIntrusion.TA
                    && traffic.secondsSinceLastTa >= TcasConst.TA_EXPIRATION_DELAY) {
                traffic.taExpiring = false;
                traffic.secondsSinceLastTa = 0;
                traffic.intrusionLevel = desiredIntrusionLevel;
            } else if (traffic.intrusionLevel === TaRaIntrusion.TA
                    && desiredIntrusionLevel < TaRaIntrusion.TA
                    && traffic.secondsSinceLastTa < TcasConst.TA_EXPIRATION_DELAY) {
                traffic.taExpiring = true;
                traffic.intrusionLevel = TaRaIntrusion.TA;
            } else if (this.activeRa.info !== null
                    && traffic.intrusionLevel === TaRaIntrusion.RA
                    && desiredIntrusionLevel < TaRaIntrusion.RA
                    && this.activeRa.secondsSinceStart < 5) {
                traffic.intrusionLevel = TaRaIntrusion.RA;
            } else if (this.activeRa.info !== null
                    && traffic.intrusionLevel === TaRaIntrusion.RA
                    && desiredIntrusionLevel < TaRaIntrusion.RA
                    && (traffic.taTau < TcasConst.TAU[this.sensitivity][TaRaIndex.TA] * TcasConst.VOL_BOOST
                        || traffic.slantDistance < TcasConst.DMOD[this.sensitivity][TaRaIndex.TA] * TcasConst.VOL_BOOST)
                    && (traffic.vTau < TcasConst.TAU[this.sensitivity][TaRaIndex.TA] * TcasConst.VOL_BOOST
                        || Math.abs(traffic.relativeAlt) < TcasConst.ZTHR[this.sensitivity][TaRaIndex.TA] * TcasConst.VOL_BOOST)
                    && traffic.closureRate >= TcasConst.CLOSURE_RATE_THRESH) {
                traffic.intrusionLevel = TaRaIntrusion.RA;
            } else if (!this.isSlewActive) {
                traffic.intrusionLevel = desiredIntrusionLevel;
                if (traffic.intrusionLevel > TaRaIntrusion.PROXIMITY) {
                    console.log(`NEW ${traffic.intrusionLevel === TaRaIntrusion.RA ? 'RA' : 'TA'}for ${traffic.ID}`);
                    console.log(`TA TAU: ${traffic.taTau} RA TAU : ${traffic.raTau}`);
                }
            }
        });
    }

    private updateRa(_deltaTime: number): void {
        const raTime = _deltaTime;
        this.getRa(raTime);
        this.updateInhibitions();
        this.updateAdvisoryState(raTime);
    }

    private calculateTrajectory(targetVS: number, traffic: TcasTraffic, delay: number, accel: number): number {
        // accel must be in f/s^2
        accel = targetVS < this.verticalSpeed ? -1 * accel : accel;
        const timeToAccelerate = Math.min(traffic.raTau - delay, ((targetVS - this.verticalSpeed) / 60) / accel); // raTau can be infinity?
        const remainingTime = traffic.raTau - (delay + timeToAccelerate);
        const predicted_elevation = this.pressureAlt
                                    + Math.round(this.verticalSpeed / 60) * (delay + timeToAccelerate)
                                    + 0.5 * accel * timeToAccelerate ** 2
                                    + (targetVS / 60) * remainingTime;

        return predicted_elevation;
    }

    /**
     * TODO: Documentation
     * @returns
     */
    private getPredictedSep(): number {
        let minSeparation = TcasConst.REALLY_BIG_NUMBER;
        this.raTraffic.forEach((traffic) => {
            const trafficAltAtCPA = traffic.alt + ((traffic.vertSpeed / 60) * traffic.raTau);
            const myAltAtCPA = this.pressureAlt + ((this.verticalSpeed / 60) * traffic.raTau);
            const _sep = Math.abs(myAltAtCPA - trafficAltAtCPA);
            if (_sep < minSeparation) {
                minSeparation = _sep;
            }
        });
        return minSeparation;
    }

    /**
     * TODO: Documentation
     * @param {*} sense
     * @param {*} targetVS
     * @param {*} delay
     * @param {*} accel
     * @returns
     */
    private getVerticalSep(sense: RaSense, targetVS: number, delay: number, accel: number): [number, boolean] {
        let isCrossing = false;
        let minSeparation = TcasConst.REALLY_BIG_NUMBER;

        this.raTraffic.forEach((traffic) => {
            const trafficAltAtCPA = traffic.alt + ((traffic.vertSpeed / 60) * traffic.raTau);

            let _sep = TcasConst.REALLY_BIG_NUMBER;
            if (sense === RaSense.UP) {
                const _delay = this.verticalSpeed < targetVS ? Math.min(traffic.raTau, delay) : 0;
                _sep = Math.max(this.calculateTrajectory(targetVS, traffic, _delay, accel) - trafficAltAtCPA, 0); // max might not be needed
                if (!isCrossing && (this.pressureAlt + 100) < traffic.alt) {
                    isCrossing = true;
                }
            } else if (sense === RaSense.DOWN) {
                const _delay = this.verticalSpeed > targetVS ? Math.min(traffic.raTau, delay) : 0;
                _sep = Math.max(trafficAltAtCPA - this.calculateTrajectory(targetVS, traffic, _delay, accel), 0); // max might not be needed
                if (!isCrossing && (this.pressureAlt - 100) > traffic.alt) {
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
        // TODO: Store 10 most recent RA and 60 most recent TA - AMM 34-43-00:6
        // TODO: Red TCAS error messages on PFD and ND
        if (this.skipRa) {
            this._newRa.info = null;
            this.activeRa.info = null;
            return;
        }

        this.raTraffic = this.airTraffic
            .filter((traffic) => traffic.intrusionLevel === TaRaIntrusion.RA && traffic.raTau !== Infinity)
            .sort((a, b) => a.raTau - b.raTau);
        this._newRa.info = null;
        this._newRa.isReversal = false;
        this._newRa.secondsSinceStart = 0;
        this._newRa.hasBeenAnnounced = false;
        const previousRa = this.activeRa;
        const ALIM = TcasConst.ALIM[this.sensitivity];

        if (this.activeRa.info === null) {
            // First RA
            if (this.raTraffic.length === 0) {
                this._newRa.info = null;
                return;
            }

            const [upVerticalSep, upIsCrossing]: [number, boolean] = this.getVerticalSep(
                RaSense.UP,
                1500,
                TcasConst.INITIAL_DELAY,
                TcasConst.INITIAL_ACCEL,
            );
            const [downVerticalSep, downIsCrossing]: [number, boolean] = this.getVerticalSep(
                RaSense.DOWN,
                -1500,
                TcasConst.INITIAL_DELAY,
                TcasConst.INITIAL_ACCEL,
            );

            // Select sense
            let sense: RaSense = RaSense.UP;

            console.log('TCAS: INITIAL RA: SELECTING SENSE');
            console.log('---------------------------------');
            console.log(`UP VERTICAL SEPARATION at 1500: ${upVerticalSep}; upIsCrssing: ${upIsCrossing}`);
            console.log(`DOWN VERTICAL SEPARATION at -1500: ${downVerticalSep}; downIsCrossing: ${downIsCrossing}`);
            console.log('ALIM IS ', ALIM);

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

            // Useful later
            const [levelSep]: [number, boolean] = this.getVerticalSep(
                sense,
                0,
                TcasConst.INITIAL_DELAY,
                TcasConst.INITIAL_ACCEL,
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
                        TcasConst.INITIAL_DELAY,
                        TcasConst.INITIAL_ACCEL,
                    );
                    const [sep1000] = this.getVerticalSep(
                        sense,
                        (mul * 1000),
                        TcasConst.INITIAL_DELAY,
                        TcasConst.INITIAL_ACCEL,
                    );
                    const [sep2000] = this.getVerticalSep(
                        sense,
                        (mul * 2000),
                        TcasConst.INITIAL_DELAY,
                        TcasConst.INITIAL_ACCEL,
                    );

                    // Find preventive RA's which achieve ALIM
                    // If none achieve ALIM, then use nominal RA
                    if (sep2000 >= ALIM) {
                        this._newRa.info = (sense === RaSense.UP) ? TcasConst.RA_VARIANTS.monitor_vs_climb_2000 : TcasConst.RA_VARIANTS.monitor_vs_descend_2000;
                    } else if (sep1000 >= ALIM) {
                        this._newRa.info = (sense === RaSense.UP) ? TcasConst.RA_VARIANTS.monitor_vs_climb_1000 : TcasConst.RA_VARIANTS.monitor_vs_descend_1000;
                    } else if (sep500 >= ALIM) {
                        this._newRa.info = (sense === RaSense.UP) ? TcasConst.RA_VARIANTS.monitor_vs_climb_500 : TcasConst.RA_VARIANTS.monitor_vs_descend_500;
                    } else if (levelSep >= ALIM) {
                        this._newRa.info = (sense === RaSense.UP) ? TcasConst.RA_VARIANTS.monitor_vs_climb_0 : TcasConst.RA_VARIANTS.monitor_vs_descend_0;
                    } else if (sense === RaSense.UP) {
                        this._newRa.info = upIsCrossing ? TcasConst.RA_VARIANTS.climb_cross : TcasConst.RA_VARIANTS.climb;
                    } else {
                        this._newRa.info = downIsCrossing ? TcasConst.RA_VARIANTS.descend_cross : TcasConst.RA_VARIANTS.descend;
                    }
                } else {
                    // Corrective RA (either climb/descend or level off)
                    const nominalSep = sense === RaSense.UP ? upVerticalSep : downVerticalSep;
                    if (nominalSep > levelSep) {
                        if (sense === RaSense.UP) {
                            this._newRa.info = upIsCrossing ? TcasConst.RA_VARIANTS.climb_cross : TcasConst.RA_VARIANTS.climb;
                        } else {
                            this._newRa.info = downIsCrossing ? TcasConst.RA_VARIANTS.descend_cross : TcasConst.RA_VARIANTS.descend;
                        }
                    } else {
                        this._newRa.info = sense === RaSense.UP ? TcasConst.RA_VARIANTS.level_off_300_above : TcasConst.RA_VARIANTS.level_off_300_below;
                    }
                }
            } else {
                // We're above 1500 FPM already, so either maintain VS or level off
                const nominalSep = sense === RaSense.UP ? upVerticalSep : downVerticalSep;
                if (nominalSep > levelSep) {
                    if (sense === RaSense.UP) {
                        this._newRa.info = upIsCrossing ? TcasConst.RA_VARIANTS.climb_maintain_vs_crossing : TcasConst.RA_VARIANTS.climb_maintain_vs;
                    } else {
                        this._newRa.info = downIsCrossing ? TcasConst.RA_VARIANTS.descend_maintain_vs_crossing : TcasConst.RA_VARIANTS.descend_maintain_vs;
                    }
                } else {
                    this._newRa.info = sense === RaSense.UP ? TcasConst.RA_VARIANTS.level_off_300_above : TcasConst.RA_VARIANTS.level_off_300_below;
                }
            }
        } else {
            // There is a previous RA, so revise it if necessary
            // If no RA threats, then just return null
            if (this.raTraffic.length === 0) {
                this._newRa.info = null;
                return;
            }

            // let alreadyAchievedALIM = true;
            let alreadyAchievedTaZTHR = true;
            let minTimeToCPA = TcasConst.REALLY_BIG_NUMBER;
            this.raTraffic.forEach((traffic) => {
                /*
                if (Math.abs(this.pressureAlt - traffic.alt) < ALIM) {
                    alreadyAchievedALIM = false;
                }
                */
                if (Math.abs(this.pressureAlt - traffic.alt) < TcasConst.ZTHR[this.sensitivity][TaRaIndex.TA]) {
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
                    && previousRa.info.callout.id !== TcasConst.CALLOUTS.level_off.id
                    && previousRa.info.callout.id !== TcasConst.CALLOUTS.monitor_vs.id) {
                    this._newRa.info = (previousRa.info.sense === RaSense.UP) ? TcasConst.RA_VARIANTS.level_off_300_above : TcasConst.RA_VARIANTS.level_off_300_below;
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
                    // let strength = 0;

                    if (previousRa.info.callout.id === TcasConst.CALLOUTS.level_off.id
                        || previousRa.info.callout.id === TcasConst.CALLOUTS.monitor_vs.id) {
                        // strength = 1;
                        [increaseSep, increaseCross] = this.getVerticalSep(
                            sense,
                            mul * 1500,
                            TcasConst.FOLLOWUP_DELAY,
                            TcasConst.FOLLOWUP_ACCEL,
                        );
                        if (increaseCross) {
                            strengthenRaInfo = (sense === RaSense.UP) ? TcasConst.RA_VARIANTS.climb_cross : TcasConst.RA_VARIANTS.descend_cross;
                        } else {
                            strengthenRaInfo = (sense === RaSense.UP) ? TcasConst.RA_VARIANTS.climb : TcasConst.RA_VARIANTS.descend;
                        }
                        console.log('StrengthenRAInfo: level 0 to 1: ', strengthenRaInfo);
                    } else if ((previousRa.info.callout.id === TcasConst.CALLOUTS.climb.id
                        || previousRa.info.callout.id === TcasConst.CALLOUTS.climb_cross.id
                        || previousRa.info.callout.id === TcasConst.CALLOUTS.climb_now.id
                        || previousRa.info.callout.id === TcasConst.CALLOUTS.descend.id
                        || previousRa.info.callout.id === TcasConst.CALLOUTS.descend_cross.id
                        || previousRa.info.callout.id === TcasConst.CALLOUTS.descend_now.id
                        || previousRa.info.callout.id === TcasConst.CALLOUTS.maintain_vs.id
                        || previousRa.info.callout.id === TcasConst.CALLOUTS.maintain_vs_cross.id)
                        && ((previousRa.info.sense === RaSense.UP && this.verticalSpeed >= 1500) || (previousRa.info.sense === RaSense.DOWN && this.verticalSpeed <= -1500))) {
                        // strength = 2;
                        [increaseSep, increaseCross] = this.getVerticalSep(
                            sense,
                            mul * 2500,
                            TcasConst.FOLLOWUP_DELAY,
                            TcasConst.FOLLOWUP_ACCEL,
                        );
                        strengthenRaInfo = (sense === RaSense.UP) ? TcasConst.RA_VARIANTS.climb_increase : TcasConst.RA_VARIANTS.descend_increase;
                        console.log('StrengthenRAInfo: level 1 to 2 ', strengthenRaInfo);
                    } else {
                        console.log('StrengthenRAInfo: condition not met. Callout: ', previousRa.info.callout);
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
                    } else {
                        // Haven't reversed before, so it's still a possibility
                        const reversedSense = (sense === RaSense.UP) ? RaSense.DOWN : RaSense.UP;
                        const revMul = (reversedSense === RaSense.UP) ? 1 : -1;
                        const [reverseSep] = this.getVerticalSep(
                            reversedSense,
                            revMul * 1500,
                            TcasConst.FOLLOWUP_DELAY,
                            TcasConst.FOLLOWUP_ACCEL,
                        );

                        // If cannot increase RA, then pick between current separation and reverse
                        if (strengthenRaInfo === null) {
                            if (predictedSep >= reverseSep) {
                                this._newRa.info = previousRa.info;
                                this._newRa.hasBeenAnnounced = true;
                                return;
                            }
                            this._newRa.info = (reversedSense === RaSense.UP) ? TcasConst.RA_VARIANTS.climb_now : TcasConst.RA_VARIANTS.descend_now;
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
                                this._newRa.info = (reversedSense === RaSense.UP) ? TcasConst.RA_VARIANTS.climb_now : TcasConst.RA_VARIANTS.descend_now;
                                this._newRa.isReversal = true;
                            }
                        }

                        // If only one achieves ALIM, pick it
                        if (increaseSep >= ALIM && reverseSep < ALIM) {
                            this._newRa.info = strengthenRaInfo;
                        } else {
                            this._newRa.info = (reversedSense === RaSense.UP) ? TcasConst.RA_VARIANTS.climb_now : TcasConst.RA_VARIANTS.descend_now;
                            this._newRa.isReversal = true;
                        }
                    }
                } else {
                    // Continue with same RA
                    this._newRa.info = previousRa.info;
                    this._newRa.hasBeenAnnounced = true;
                }
            }
        }
    }

    /**
     * TODO: Documentation & complete missing inhibitions
     */
    private updateInhibitions(): void {
        if (this.radioAlt < 500) {
            this.inhibitions = Inhibit.ALL_RA_AURAL_TA;
        } else if (this.radioAlt < 1000) {
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

    private updateAdvisoryState(_deltaTime) {
        const taThreatCount = this.airTraffic.reduce((acc, aircraft) => acc + (aircraft.intrusionLevel === TaRaIntrusion.TA ? 1 : 0), 0);
        const raThreatCount = this.airTraffic.reduce((acc, aircraft) => acc + (aircraft.intrusionLevel === TaRaIntrusion.RA ? 1 : 0), 0);

        switch (this.advisoryState) {
        case TcasState.TA:
            if (raThreatCount > 0 && (this.inhibitions !== Inhibit.ALL_RA && this.inhibitions !== Inhibit.ALL_RA_AURAL_TA)) {
                this.advisoryState = TcasState.RA;
                SimVar.SetSimVarValue('L:A32NX_TCAS_STATE', 'Enum', 2);
                console.log('TCAS: TA UPGRADED TO RA');
            } else if (taThreatCount === 0) {
                this.advisoryState = TcasState.NONE;
                SimVar.SetSimVarValue('L:A32NX_TCAS_STATE', 'Enum', 0);
                console.log('TCAS: TA RESOLVED');
            }
            break;
        case TcasState.RA:
            if (raThreatCount === 0) {
                if (taThreatCount > 0) {
                    this.advisoryState = TcasState.TA;
                    SimVar.SetSimVarValue('L:A32NX_TCAS_STATE', 'Enum', 1);
                } else {
                    this.advisoryState = TcasState.NONE;
                    SimVar.SetSimVarValue('L:A32NX_TCAS_STATE', 'Enum', 0);
                }
                console.log('TCAS: CLEAR OF CONFLICT');
                this.soundManager.tryPlaySound(TcasConst.SOUNDS.clear_of_conflict, true);
                this.activeRa.info = null;
            }
            break;
        default:
            if (raThreatCount > 0 && (this.inhibitions !== Inhibit.ALL_RA && this.inhibitions !== Inhibit.ALL_RA_AURAL_TA)) {
                this.advisoryState = TcasState.RA;
                SimVar.SetSimVarValue('L:A32NX_TCAS_STATE', 'Enum', 2);
            } else if (taThreatCount > 0) {
                this.advisoryState = TcasState.TA;
                SimVar.SetSimVarValue('L:A32NX_TCAS_STATE', 'Enum', 1);
                console.log('TCAS: TA GENERATED');
                if (this.inhibitions !== Inhibit.ALL_RA_AURAL_TA) {
                    console.log('TCAS: TA GENERATED SOUND');
                    this.soundManager.tryPlaySound(TcasConst.SOUNDS.traffic_traffic, true);
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
                console.log('TCAS: RA GENERATED: ', this.activeRa.info.callout);

                if (this.activeRa.info.callout.repeat) {
                    this.soundManager.tryPlaySound(this.activeRa.info.callout.sound, true, true);
                } else {
                    this.soundManager.tryPlaySound(this.activeRa.info.callout.sound, true, false);
                }

                const isCorrective = this.activeRa.info.type === RaType.CORRECT;
                SimVar.SetSimVarValue('L:A32NX_TCAS_RA_CORRECTIVE', 'bool', isCorrective);
                SimVar.SetSimVarValue('L:A32NX_TCAS_VSPEED_RED:1', 'Number', this.activeRa.info.vs.red[0]);
                SimVar.SetSimVarValue('L:A32NX_TCAS_VSPEED_RED:2', 'Number', this.activeRa.info.vs.red[1]);
                if (isCorrective) {
                    SimVar.SetSimVarValue('L:A32NX_TCAS_VSPEED_GREEN:1', 'Number', this.activeRa.info.vs.green[0]);
                    SimVar.SetSimVarValue('L:A32NX_TCAS_VSPEED_GREEN:2', 'Number', this.activeRa.info.vs.green[1]);
                }

                this.activeRa.hasBeenAnnounced = true;
            }
        }
    }

    private emitDisplay(): void {
        this.sendAirTraffic.length = 0;
        // TODO: Refactor
        // TODO: Limit number of contacts displayed to 40 - AMM 34-43-00:6a
        this.airTraffic
            .filter((traffic) => traffic.alive === true && traffic.isDisplayed === true)
            .forEach((traffic: TcasTraffic) => {
                this.sendAirTraffic.push(new NDTcasTraffic(traffic));
            });
        this.sendListener.triggerToAllSubscribers('A32NX_TCAS_TRAFFIC', this.sendAirTraffic);
    }

    update(_deltaTime: number): void {
        this.soundManager.update(_deltaTime);

        const deltaTime = this.updateThrottler.canUpdate(_deltaTime);
        if (deltaTime === -1) {
            return;
        }

        this.updateVars();

        if (this.tcasOn === 0 || this.xpdrStatus === 1) {
            return;
        }

        this.updateSensitivity();
        this.fetchRawTraffic(deltaTime);
        this.updateTraffic();
        this.updateRa(deltaTime);
        this.emitDisplay();
    }
}
