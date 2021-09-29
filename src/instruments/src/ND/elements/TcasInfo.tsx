/* eslint-disable camelcase */
import { Arinc429Word, useArinc429Var } from '@instruments/common/arinc429';
import { useUpdate } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, FC, useState } from 'react';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
// import { Layer } from '@instruments/common/utils';

enum TcasMode {
    THREAT = 0,
    ALL = 1,
    ABOVE = 2,
    BELOW = 3
}

enum TaRa {
    TA = 0,
    RA = 1
}

enum TaRaInfo {
    TAU = 0,
    DMOD = 1,
    ZTHR = 2,
    TVTHR = 3
}

enum Intrude {
    RANGE = 0,
    ALT = 1
}

enum TcasConstants {
    MIN_VS = -6000,
    MAX_VS = 6000,
    INHIBIT_CLB_RA = 39000, // for all climb RA's
    INHIBIT_INC_DES_RA_AGL = 1450, // for increase descent RA's
    INHIBIT_ALL_DES_RA_AGL = 1200, // 1200 takeoff, 1000 approach
    INHIBIT_ALL_RA = 1000, // 1100 in climb, 900 in descent
    REALLY_BIG_NUMBER = 1000000,
    INITIAL_DELAY = 5, // in seconds
    FOLLOWUP_DELAY = 2.5, // in deconds
    INITIAL_ACCEL = 8.04, // 0.25G in f/s^2
    FOLLOWUP_ACCEL = 10.62, // 0.33G in f/s^2
    TA_EXPIRATION_DELAY = 4, // in seconds
    MIN_RA_DURATION = 5, // in seconds
    VOL_BOOST = 1.25, // multiplier
    CLOSURE_RATE_THRESH = -40 // in knots
}

enum RaSense {
    up = 0,
    down = 1
}

enum RaType {
    corrective = 0,
    preventative = 1
}

interface ResAdvisory {
    info: RaParams,
    isReversal: boolean,
    secondsSinceStart: number,
    hasBeenAnnounced: boolean
}

interface RaParams {
    callout: RaCallout,
    sense: RaSense,
    type: RaType,
    vs: {
        green: number[],
        red: number[]
    }
}

interface RaCallout {
    id: number,
    repeat: boolean,
    sound: RaSound
}

interface RaSound {
    name: string,
    length: number
}

export interface TcasTraffic {
    alive: boolean,
    created: boolean,
    lastSeen: number,
    ID: string,
    name: string,
    lat: number,
    lon: number,
    alt: number,
    vertSpeed: number,
    onGround: boolean,
    heading: number,
    relativeAlt: number,
    slantDistance: number, // Distance to traffic aircraft in 3D space, in nautical miles
    closureRate: number,
    intrusionLevel: number,
    isDisplayed: boolean,
    taTau: number,
    raTau: number,
    vTau: number,
    taExpiring: boolean,
    secondsSinceLastTa: number,
    screenX?: number,
    screenY?: number,
    _lastIntrusionLevel?: number,
    _lastVertArrowCase?: number,
}

export interface JS_NPCPlane {
    name: string,
    uId: number,
    lat: number,
    lon: number,
    alt: number,
    heading: number
}

export type TcasProps = {
    adrs: number,
    irs: number,
    ppos: LatLongData
}

export const TcasInfo: FC = () => {
    // TODO: REDUCE RANGE and CHANGE MODE warnings - AMM 34-43-00:A21
    // TODO: red TCAS warning on fault (and on PFD) - AMM 34-43-00:A24

    const [airTraffic, setAirTraffic] = useState<TcasTraffic[]>([]);
    // const [raTraffic, setRaTraffic] = useState<TcasTraffic[]>([]);
    const [sensitivity, setSensitivity] = useState(8);
    const [taRaInfo, setTaRaInfo] = useState<number[][]>([[]]);

    const [activeRA, setActiveRA] = useState<ResAdvisory | null>(null);
    const [followupRaTimer, setFollowupRaTimer] = useState(0);

    // TCAS Computer
    const [verticalSpeed] = useSimVar('VERTICAL SPEED', 'feet per minute', 200);
    const [lat] = useSimVar('PLANE LATITUDE', 'degree latitude', 200);
    const [lon] = useSimVar('PLANE LONGITUDE', 'degree longitude', 200);
    const [xpdrActive] = useSimVar('L:A32NX_SWITCH_ATC', 'enum', 200);
    const altitude: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_ADR_${xpdrActive + 1}_ALTITUDE`);
    const altitudeStandby: Arinc429Word = useArinc429Var('L:A32NX_ADIRS_ADR_3_ALTITUDE');

    const enableRa = (altitude.isNormalOperation() && altitudeStandby.isNormalOperation() && altitude.value - altitudeStandby.value < 100);

    const [radioAlt] = useSimVar('PLANE ALT ABOVE GROUND', 'feet', 200);
    const [tcasMode] = useSimVar('L:A32NX_SWITCH_TCAS_Traffic_Position', 'number', 200);

    // TODO Add more TA only conditions here (i.e GPWS active, Windshear warning active, stall)
    // const tcasMode = tcasSetting;

    // Init Listener
    /*
    useEffect(() => {
        const listener = RegisterViewListener('JS_LISTENER_MAPS', () => {
            listener.trigger('JS_BIND_BINGMAP', 'testMap', false);
        });
        return () => {
            listener.unregister();
        };
    }, []);
    */

    // Set sensitivity
    /*
    useEffect(() => {
        if (activeRA === null) {
            if (radioAlt < 1000 || tcasMode === TcasMode.ALL) {
                setSensitivity(2);
                setTaRaInfo([
                    [20, -1], // TA/RA TAU
                    [0.3, -1], // TA/RA DMOD
                    [850, -1], // TA/RA ZTHR
                    [-1, -1], // RA ALIM
                ]);
            } else if (radioAlt <= 2350 && radioAlt > 1000) {
                setSensitivity(3);
                setTaRaInfo([
                    [25, 15],
                    [0.33, 0.2],
                    [850, 300],
                    [-1, 15],
                ]);
            } else if (altitude.value <= 5000 && altitude.value > 2350) {
                setSensitivity(4);
                setTaRaInfo([
                    [30, 20],
                    [0.48, 0.35],
                    [850, 300],
                    [-1, 18],
                ]);
            } else if (altitude.value <= 10000 && altitude.value > 5000) {
                setSensitivity(5);
                setTaRaInfo([
                    [40, 25],
                    [0.75, 0.55],
                    [850, 350],
                    [-1, 20],
                ]);
            } else if (altitude.value <= 20000 && altitude.value > 10000) {
                setSensitivity(6);
                setTaRaInfo([
                    [45, 30],
                    [1, 0.8],
                    [850, 400],
                    [-1, 22],
                ]);
            } else if (altitude.value <= 47000 && altitude.value > 20000) {
                setSensitivity(7);
                setTaRaInfo([
                    [48, 35],
                    [1.3, 1.1],
                    [850, 600],
                    [-1, 25],
                ]);
            } else {
                setSensitivity(8);
                setTaRaInfo([
                    [48, 35],
                    [1.3, 1.1],
                    [1200, 700],
                    [-1, 25],
                ]);
            }
        }
    }, [tcasMode, radioAlt, altitude.value]);
    */

    // Call Coherent for Air Traffic and refresh traffic data
    useUpdate((deltaTime) => {
        return;
        Coherent.call('GET_AIR_TRAFFIC').then((obj: JS_NPCPlane[]) => {
            airTraffic.forEach((traffic) => {
                traffic.alive = false;
            });
            obj.forEach((tf) => {
                let traffic: TcasTraffic | undefined = airTraffic.find((p) => p && p.ID === tf.uId.toFixed(0));
                if (!traffic) {
                    traffic = {
                        ID: tf.uId.toFixed(0),
                        alive: true,
                        created: false,
                        lastSeen: 0,
                        name: `npc-airplane-${tf.uId.toFixed(0)}`,
                        lat: 0,
                        lon: 0,
                        alt: 0,
                        vertSpeed: 0,
                        heading: 0,
                        onGround: false,
                        relativeAlt: tf.alt * 3.281 - altitude.value,
                        slantDistance: computeDistance3D([tf.lat, tf.lon, tf.alt * 3.281], [lat, lon, altitude.value]),
                        closureRate: 0,
                        intrusionLevel: 0,
                        isDisplayed: false,
                        taTau: Infinity,
                        raTau: Infinity,
                        vTau: Infinity,
                        taExpiring: false,
                        secondsSinceLastTa: 0,
                    };
                    setAirTraffic([...airTraffic, traffic]);
                }
                traffic.alive = true;
                traffic.lastSeen = new Date().getTime();
                traffic.vertSpeed = (altitude.value - traffic.alt) / deltaTime * 60; // feet per minute
                const newSlantDist = computeDistance3D([traffic.lat, traffic.lon, traffic.alt], [lat, lon, altitude.value]);
                traffic.closureRate = (traffic.slantDistance - newSlantDist) / deltaTime * 3600;
                traffic.slantDistance = newSlantDist;
                traffic.lat = tf.lat;
                traffic.lon = tf.lon;
                traffic.alt = tf.alt * 3.281;
                traffic.heading = tf.heading;
                traffic.relativeAlt = tf.alt * 3.281 - altitude.value;

                let taTau = traffic.slantDistance - taRaInfo[TaRaInfo.DMOD][TaRa.TA] / traffic.closureRate * 3600;
                let raTau = traffic.slantDistance - taRaInfo[TaRaInfo.DMOD][TaRa.RA] / traffic.closureRate * 3600;
                let vTau = traffic.relativeAlt / (verticalSpeed - traffic.vertSpeed) * 60;

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

                // check if traffic is on ground. Mode-S transponders would transmit that information themselves, but since Asobo doesn't provide that
                // information, we need to rely on the fallback method
                const groundAlt = altitude.value - radioAlt; // altitude of the terrain
                const onGround = !!((groundAlt < 1750 && traffic.alt < groundAlt + 380));
                traffic.onGround = onGround;
                let isDisplayed = false;
                if (!onGround) {
                    switch (tcasMode) {
                    case TcasMode.THREAT:
                        if (Math.abs(traffic.relativeAlt) <= 2700 && traffic.intrusionLevel >= 2) {
                            isDisplayed = true;
                        }
                        break;
                    case TcasMode.ALL:
                        if (Math.abs(traffic.relativeAlt) <= 2700) {
                            isDisplayed = true;
                        }
                        break;
                    case TcasMode.ABOVE:
                        if (traffic.relativeAlt <= 9900 && traffic.relativeAlt >= -2700) {
                            isDisplayed = true;
                        }
                        break;
                    case TcasMode.BELOW:
                        if (traffic.relativeAlt <= 2700 && traffic.relativeAlt >= -9900) {
                            isDisplayed = true;
                        }
                        break;
                    default:
                        break;
                    }
                }
                traffic.isDisplayed = isDisplayed;

                const horizontalDistance = Avionics.Utils.computeDistance(new LatLong(traffic.lat, traffic.lon), new LatLong(lat, lon));
                if (horizontalDistance > 35 && Math.abs(traffic.relativeAlt) > 9900) {
                    traffic.isDisplayed = false;
                    traffic.taTau = Infinity;
                    traffic.raTau = Infinity;
                }

                const intrusionLevel: number[] = [0, 0];

                // Perform range test
                if (traffic.raTau < taRaInfo[TaRaInfo.TAU][TaRa.RA] || traffic.slantDistance < taRaInfo[TaRaInfo.DMOD][TaRa.RA]) {
                    intrusionLevel[Intrude.RANGE] = 3;
                } else if (traffic.taTau < taRaInfo[TaRaInfo.TAU][TaRa.TA] || traffic.slantDistance < taRaInfo[TaRaInfo.DMOD][TaRa.TA]) {
                    intrusionLevel[Intrude.RANGE] = 2;
                } else if (horizontalDistance < 6) {
                    intrusionLevel[Intrude.RANGE] = 1;
                }

                // Perform altitude test
                if (traffic.vTau < taRaInfo[TaRaInfo.TAU][TaRa.RA] || Math.abs(traffic.relativeAlt) < taRaInfo[TaRaInfo.ZTHR][TaRa.RA]) {
                    intrusionLevel[Intrude.ALT] = 3;
                } else if (traffic.vTau < taRaInfo[TaRaInfo.TAU][TaRa.TA] || Math.abs(traffic.relativeAlt) < taRaInfo[TaRaInfo.ZTHR][TaRa.TA]) {
                    intrusionLevel[Intrude.ALT] = 2;
                } else if (Math.abs(traffic.relativeAlt) < 1200) {
                    intrusionLevel[Intrude.ALT] = 1;
                }

                const desiredIntrusionLevel = Math.min(...intrusionLevel);
                if (traffic.intrusionLevel === 2
                    && desiredIntrusionLevel < 2
                    && traffic.secondsSinceLastTa >= TcasConstants.TA_EXPIRATION_DELAY) {
                    traffic.taExpiring = false;
                    traffic.secondsSinceLastTa = 0;
                    traffic.intrusionLevel = desiredIntrusionLevel;
                } else if (traffic.intrusionLevel === 2
                    && desiredIntrusionLevel < 2
                    && traffic.secondsSinceLastTa < TcasConstants.TA_EXPIRATION_DELAY) {
                    traffic.taExpiring = true;
                    traffic.intrusionLevel = 2;
                } else if (activeRA !== null
                    && traffic.intrusionLevel === 3
                    && desiredIntrusionLevel < 3
                    && activeRA.secondsSinceStart < 5) {
                    traffic.intrusionLevel = 3;
                } else if (activeRA !== null
                    && traffic.intrusionLevel === 3
                    && desiredIntrusionLevel < 3
                    && (traffic.taTau < taRaInfo[TaRaInfo.TAU][TaRa.TA] * TcasConstants.VOL_BOOST || traffic.slantDistance < taRaInfo[TaRaInfo.DMOD][TaRa.TA] * TcasConstants.VOL_BOOST)
                    && (traffic.vTau < taRaInfo[TaRaInfo.TAU][TaRa.TA] * TcasConstants.VOL_BOOST || Math.abs(traffic.relativeAlt) < taRaInfo[TaRaInfo.ZTHR][TaRa.TA] * TcasConstants.VOL_BOOST)
                    && traffic.closureRate >= TcasConstants.CLOSURE_RATE_THRESH) {
                    traffic.intrusionLevel = 3;
                }

                // Only update followup RA's once per second
                if (activeRA !== null) {
                    setFollowupRaTimer(followupRaTimer + deltaTime / 1000);
                }
                if (activeRA === null || followupRaTimer >= 1) {
                    const previousRA = activeRA;
                    const raTraffic = airTraffic
                        .filter((aircraft) => aircraft.intrusionLevel === 3 && aircraft.raTau !== Infinity)
                        .sort((a, b) => a.raTau - b.raTau);

                    /*
                    ra = this.newRaLogic(
                        _deltaTime,
                        vertSpeed,
                        altitude,
                        this.getALIM(this.sensitivityLevel),
                        this.getTaRaZTHR(this.sensitivityLevel),
                    );
                    this.followupRaTimer = 0;
                    */
                }

                // this.updateInhibitions(altitude, radioAltitude);
                // this.updateAdvisoryState(_deltaTime, ra);

                /*
                if (traffic.RaTAU < TaRaTau[1] || traffic.slantDistance < TaRaDMOD[1]) {
                    rangeIntrusionLevel = 3;
                } else if (traffic.TaTAU < TaRaTau[0] || traffic.slantDistance < TaRaDMOD[0]) {
                    rangeIntrusionLevel = 2;
                } else if (horizontalDistance < 6) {
                    rangeIntrusionLevel = 1;
                } else {
                    rangeIntrusionLevel = 0;
                }
                */
            });
        }).catch(console.error);
    }, 200);

    // Remove stale traffic
    /*
    useEffect(() => {
        if (airTraffic.length > 100) {
            airTraffic.forEach((traffic, index) => {
                if (traffic.alive === false && new Date().getTime() > traffic.lastSeen + 18000) {
                    airTraffic.splice(index, 1);
                    setAirTraffic(airTraffic);
                }
            });
        }
    }, [airTraffic]);

    useEffect(() => {
        console.log(airTraffic);
    }, [airTraffic]);
    */

    return null;
};

/**
 * Gets the distance between 2 points, given in lat/lon/alt above sea level
 * @param pos1 {number[]} Position 1 [lat, lon, alt(feet)]
 * @param pos2 {number[]} Position 2 [lat, lon, alt(feet)]
 * @return {number} distance in nautical miles
 */
function computeDistance3D(pos1, pos2) {
    const earthRadius = 3440.065; // earth radius in nautcal miles
    const deg2rad = Math.PI / 180;

    const radius1 = pos1[2] / 6076 + earthRadius;
    const radius2 = pos2[2] / 6076 + earthRadius;

    const x1 = radius1 * Math.sin(deg2rad * (pos1[0] + 90)) * Math.cos(deg2rad * (pos1[1] + 180));
    const y1 = radius1 * Math.sin(deg2rad * (pos1[0] + 90)) * Math.sin(deg2rad * (pos1[1] + 180));
    const z1 = radius1 * Math.cos(deg2rad * (pos1[0] + 90));

    const x2 = radius2 * Math.sin(deg2rad * (pos2[0] + 90)) * Math.cos(deg2rad * (pos2[1] + 180));
    const y2 = radius2 * Math.sin(deg2rad * (pos2[0] + 90)) * Math.sin(deg2rad * (pos2[1] + 180));
    const z2 = radius2 * Math.cos(deg2rad * (pos2[0] + 90));

    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
}
