/* eslint-disable camelcase */
import { Arinc429Word, useArinc429Var } from '@instruments/common/arinc429';
import { useUpdate } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, FC, useState } from 'react';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
// import { Layer } from '@instruments/common/utils';

export interface TcasTraffic {
    alive: boolean,
    created: boolean,
    ID: string,
    name: string,
    lat: number,
    lon: number,
    alt: number,
    vertSpeed: number,
    onGround: boolean,
    heading: number,
    relativeAlt: number,
    slantDistance: number,
    closureRate: number,
    instrusionLevel: number,
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

export const TcasInfo: FC<TcasProps> = ({ adrs, irs, ppos }) => {
    const [airTraffic, setAirTraffic] = useState<TcasTraffic[]>([]);

    const inertialVerticalSpeed: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_IR_${irs}_VERTICAL_SPEED`);
    const barometricVerticalSpeed: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_ADR_${adrs}_BAROMETRIC_VERTICAL_SPEED`);
    const verticalSpeed: Arinc429Word = inertialVerticalSpeed.isNormalOperation() ? inertialVerticalSpeed : barometricVerticalSpeed;
    const altitude: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_ADR_${adrs}_ALTITUDE`);
    const [radioAlt] = useSimVar('PLANE ALT ABOVE GROUND', 'feet', 200);
    const [timer, setTimer] = useState(200);

    const groundAlt = altitude.value - radioAlt; // altitude of the terrain

    // const [nxMapListener, setNxMapListener] = useState<any>(null);

    useEffect(() => {
        const listener = RegisterViewListener('JS_LISTENER_MAPS', () => {
            listener.trigger('JS_BIND_BINGMAP', 'testMap', false);
            // setNxMapListener(listener);
        });
        return () => {
            listener.unregister();
        };
    }, []);

    useUpdate((deltaTime) => {
        setTimer(timer - (deltaTime));

        if (timer <= 0) {
            setTimer(200);
            Coherent.call('GET_AIR_TRAFFIC').then((obj: JS_NPCPlane[]) => {
                airTraffic.forEach((aircraft) => {
                    aircraft.alive = false;
                });
                obj.forEach((ac) => {
                    let aircraft = airTraffic.find((p) => p.ID === ac.uId.toFixed(0));
                    if (aircraft) {
                        aircraft.alive = true;
                        const newSlantDist = computeDistance3D([aircraft.lat, aircraft.lon, aircraft.alt], [ppos.lat, ppos.long, altitude.value]);
                        aircraft.closureRate = (aircraft.slantDistance - newSlantDist) / deltaTime * 3600;
                        /* Do stuff */
                    } else {
                        aircraft = {
                            ID: ac.uId.toFixed(0),
                            alive: true,
                            created: false,
                            name: `npc-airplane-${ac.uId.toFixed(0)}`,
                            lat: ac.lat,
                            lon: ac.lon,
                            alt: ac.alt * 3.281,
                            vertSpeed: 0,
                            heading: ac.heading,
                            onGround: false,
                            relativeAlt: ac.alt * 3.281 - altitude.value,
                            // Distance to traffic aircraft in 3D space, in nautical miles
                            slantDistance: computeDistance3D([ac.lat, ac.lon, ac.alt * 3.281], [ppos.lat, ppos.long, altitude.value]),
                            closureRate: 0,
                            instrusionLevel: 0,
                            isDisplayed: false,
                            taTau: Infinity,
                            raTau: Infinity,
                            vTau: Infinity,
                            taExpiring: false,
                            secondsSinceLastTa: 0,
                        };
                        setAirTraffic([...airTraffic, aircraft]);
                    }
                });
            }).catch(console.error);
        }
    });

    useEffect(() => {
        console.log(airTraffic);
    }, [airTraffic]);

    /*
    {__Type: "JS_NPCPlane", name: "", uId: 3422, lat: 48.95180130004883, lon: 2.437999963760376, alt: 48.9661, heading: 42}
    1 {__Type: "JS_NPCPlane", name: "", uId: 3427, lat: 48.999000549316406, lon: 2.563199996948242, alt: 48.9661, heading: 42}
    2 {__Type: "JS_NPCPlane", name: "", uId: 3428, lat: 49.0004997253418, lon: 2.575000047683716, alt: 48.9661, heading: 42}
    3 {__Type: "JS_NPCPlane", name: "", uId: 3448, lat: 48.72570037841797, lon: 2.3657000064849854, alt: 48.9661, heading: 42}
    4 {__Type: "JS_NPCPlane", name: "", uId: 3449, lat: 49.02090072631836, lon: 2.560699939727783, alt: 48.9661, heading: 42}
    5 {__Type: "JS_NPCPlane", name: "", uId: 3453, lat: 48.7239990234375, lon: 2.3561999797821045, alt: 48.9661, heading: 42}
    6 {__Type: "JS_NPCPlane", name: "", uId: 3455, lat: 48.99829864501953, lon: 2.557800054550171, alt: 48.9661, heading: 42}
    7 {__Type: "JS_NPCPlane", name: "", uId: 3458, lat: 49.618953704833984, lon: 2.817383289337158, alt: 48.9661, heading: 42}
    8 {__Type: "JS_NPCPlane", name: "", uId: 3461, lat: 49.007301330566406, lon: 2.5548999309539795, alt: 48.9661, heading: 42}
    9 {__Type: "JS_NPCPlane", name: "", uId: 3462, lat: 49.02134323120117, lon: 2.5181684494018555, alt: 48.9661, heading: 42}
    10 {__Type: "JS_NPCPlane", name: "", uId: 3464, lat: 48.972450256347656, lon: 2.690858840942383, alt: 48.9661, heading: 42}
    11 {__Type: "JS_NPCPlane", name: "", uId: 3465, lat: 48.85364532470703, lon: 2.7003591060638428, alt: 48.9661, heading: 42}
    12 {__Type: "JS_NPCPlane", name: "", uId: 3466, lat: 49.117271423339844, lon: 2.7506299018859863, alt: 48.9661, heading: 42}
    13 {__Type: "JS_NPCPlane", name: "", uId: 3467, lat: 49.0004997253418, lon: 2.583199977874756, alt: 48.9661, heading: 42}
    14 {__Type: "JS_NPCPlane", name: "", uId: 3468, lat: 48.79289245605469, lon: 2.6348679065704346, alt: 48.9661, heading: 42}
    15 {__Type: "JS_NPCPlane", name: "", uId: 3469, lat: 48.99714660644531, lon: 2.574340343475342, alt: 48.9661, heading: 42}
    16 {__Type: "JS_NPCPlane", name: "", uId: 3470, lat: 48.73109817504883, lon: 2.3578999042510986, alt: 48.9661, heading: 42}
    17 {__Type: "JS_NPCPlane", name: "", uId: 3471, lat: 49.014549255371094, lon: 2.7671351432800293, alt: 48.9661, heading: 42}
    18 {__Type: "JS_NPCPlane", name: "", uId: 3474, lat: 49.253849029541016, lon: 2.7913331985473633, alt: 48.9661, heading: 42}
    19 {__Type: "JS_NPCPlane", name: "", uId: 3475, lat: 48.73310089111328, lon: 2.3785998821258545, alt: 48.9661, heading: 42}
    */

    /*
    useEffect(() => {
        // gets traffic. obj is an array, which contains the NPC aircraft data.
        // The aircraft data is: uID, name, latitude in degrees, longitude in degrees, altitude in meters, heading in degrees.
        Coherent.call('GET_AIR_TRAFFIC').then((obj) => {
            for (const aircraft of traffic) {
                aircraft.alive = false;
            }
            for (const traffic of obj) {
                let aircraft = traffic.find((p) => p.ID === traffic.uId.toFixed(0));
                if (!aircraft) {
                    aircraft = new A32NX_TCAS_Airplane(traffic.uId.toFixed(0), traffic.lat, traffic.lon, traffic.alt * 3.281, traffic.heading, lat, lon, altitude);
                    traffic.push(aircraft);
                } else {
                    aircraft.update(localDeltaTime, traffic.lat, traffic.lon, traffic.alt * 3.281, traffic.heading, lat, lon, altitude, vertSpeed);
                }
                aircraft.alive = true;
            }

            for (let i = 0; i < traffic.length; i++) {
                if (traffic[i].alive === false) {
                    traffic.splice(i, 1);
                    i--;
                }
            }
        });
    }, []);
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
