/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { toRadians } from './CommonCalculations';

type flexAircraftData = {
    isaInc: number,
    vrisa: number,
    towt1isa: number,
    towt2isa: number,
    towt3isa: number,
    todist1: number,
    todist2: number,
    todist3: number,
    todist1isa: number,
    todist2isa: number,
    todist3isa: number,
    toaltAdj: number,
    tmaxflex: number,
    trefaice: number,
    engThrust: number,
    f1: number,
    f2: number,
    f3: number,
    to2k: number,
    to4k: number,
    to6k: number,
    to8k: number,
    runwayModifier: number,
};

// credit to Paul Gale (https://flightsim.to/profile/galeair) for raw data and trend seeds
const a20n : flexAircraftData = {
    isaInc: 15,
    vrisa: 142,
    towt1isa: 50000,
    towt2isa: 75000,
    towt3isa: 85000,
    todist1: 1000,
    todist2: 1690,
    todist3: 2300,
    todist1isa: 1050,
    todist2isa: 1750,
    todist3isa: 2390,
    toaltAdj: 100,
    tmaxflex: 60,
    trefaice: 30,
    engThrust: 10031,
    f1: 10,
    f2: 1e-7,
    f3: -5,
    to2k: 1770,
    to4k: 1920,
    to6k: 2050,
    to8k: 2330,
    runwayModifier: 100,
};

export enum TakeoffFlapsConfig {
    OnePlusF,
    Two,
    Three,
}

const takeoffFlapsData = {
    [TakeoffFlapsConfig.OnePlusF]: a20n.f1,
    [TakeoffFlapsConfig.Two]: a20n.f2,
    [TakeoffFlapsConfig.Three]: a20n.f3,
};

export class FlexCalculator {
    private flexToTemp : number = 0;

    private requiredRunway : number = 0;

    // Private vars
    private BARO_SEA : number = 1013; // 29.92 inhg

    private availRunway : number;

    private windHeading : number;

    private windKts : number;

    private tow : number;

    private baro : number;

    private oat : number;

    private flaps : TakeoffFlapsConfig = TakeoffFlapsConfig.OnePlusF;

    private runwayHeading : number;

    private runwayAltitude : number;

    private antiIce : boolean = true;

    private packs : boolean = false;

    private flapWindAIPackCorrection: number;

    /**
     * flex
     * @param runwayLength the length of the runway in either meters or feet
     * @param windDir heading of the current winds
     * @param windSpeed speed of the current winds in knots
     * @param takeoffWeight takeoff weight in either KG or LBS
     * @param pressure current barometric pressure in either inHG or HPA
     * @param temperature current outside air temperature in Celsius
     * @param flapsConfig flaps setting for takeoff @TakeoffFlapsConfig
     * @param heading runway heading
     * @param altitude runway altitude in Feet
     * @param antiIceOn true if antiice is on
     * @param acOn true if air conditioning (packs) is on
     * @returns flex and required runway in an array [flex, requiredRunway]
     */
    public flex(
        runwayLength : number,
        windDir : number,
        windSpeed : number,
        takeoffWeight : number,
        pressure : number,
        temperature : number,
        flapsConfig : number,
        heading : number,
        altitude : number,
        antiIceOn : boolean,
        acOn : boolean,
    ) : number[] {
        this.availRunway = runwayLength;
        this.windHeading = windDir;
        this.windKts = windSpeed;
        this.tow = takeoffWeight;
        this.baro = pressure;
        this.oat = temperature;
        this.flaps = flapsConfig;
        this.runwayHeading = heading;
        this.runwayAltitude = altitude;
        this.antiIce = antiIceOn;
        this.packs = acOn;
        this.calculateFlexDist();
        return [this.flexToTemp, this.requiredRunway];
    }

    private calculateDensityCorrection(density: number, AltCorrectionsTable: number[], perfDistDiffTable: number[]) {
        let densityCorrection: number = 0;

        for (let i = 0; i < AltCorrectionsTable.length; i++) {
            densityCorrection += ((density > AltCorrectionsTable[i]) ? perfDistDiffTable[i] : (density / 200) * (perfDistDiffTable[i] / 100));
        }
        densityCorrection += ((density < AltCorrectionsTable[3]) ? 0 : ((density - AltCorrectionsTable[3]) / 200) * (perfDistDiffTable[4] / 100));

        return (densityCorrection >= 0) ? densityCorrection : 0;
    }

    private plantSeeds(perfWeight : number, a : flexAircraftData) {
        let seedModifierstd = 0;
        let seedModifierisa = 0;
        const nest = (perfWeight < a.towt3isa) ? (a.todist3 - a.todist2)
        / (a.towt3isa - a.towt2isa) * (perfWeight - a.towt2isa) : (a.todist3 - a.todist2)
        / (a.towt3isa - a.towt2isa) * (a.towt3isa - a.towt2isa);

        const nest2 = (perfWeight < a.towt3isa) ? (a.todist3isa - a.todist2isa)
        / (a.towt3isa - a.towt2isa) * (perfWeight - a.towt2isa) : (a.todist3isa - a.todist2isa)
        / (a.towt3isa - a.towt2isa) * (a.towt3isa - a.towt2isa);

        const stdSeedTable = [
            ((perfWeight < a.towt2isa) ? (a.todist2 - a.todist1) / (a.towt2isa - a.towt1isa)
            * (perfWeight - a.towt1isa) : (a.todist2 - a.todist1) / (a.towt2isa - a.towt1isa)
            * (a.towt2isa - a.towt1isa)),
            (perfWeight < a.towt2isa) ? 0 : nest,
            ((perfWeight < a.towt3isa) ? 0 : ((a.todist3 - a.todist2) / (a.towt3isa - a.towt2isa) * 1.5) * (perfWeight - a.towt3isa)),
            a.todist1,
        ];

        const isaSeedTable = [
            ((perfWeight < a.towt2isa) ? (a.todist2isa - a.todist1isa) / (a.towt2isa - a.towt1isa)
            * (perfWeight - a.towt1isa) : (a.todist2isa - a.todist1isa) / (a.towt2isa - a.towt1isa) * (a.towt2isa - a.towt1isa)),
            (perfWeight < a.towt2isa) ? 0 : nest2,
            ((perfWeight < a.towt3isa) ? 0 : ((a.todist3isa - a.todist2isa) / (a.towt3isa - a.towt2isa) * 1.5) * (perfWeight - a.towt3isa)),
            a.todist1isa,
        ];

        for (let i = 0; i < stdSeedTable.length; i++) {
            seedModifierstd += stdSeedTable[i];
        }

        for (let i = 0; i < isaSeedTable.length; i++) {
            seedModifierisa += isaSeedTable[i];
        }

        return [seedModifierstd, seedModifierisa];
    }

    private trend(knownY: number[], knownX: number[], newX: number[]) : number[] {
        const [m, b] = this.lsft(knownY, knownX);

        const newY : number[] = [];
        for (let j = 0; j < newX.length; j++) {
            const y = (m * newX[j]) + b;
            newY.push(y);
        }

        return newY;
    }

    private lsft(knownY: number[], knownX: number[], offsetX = 0) : number[] {
        if (knownY.length !== knownX.length) return [0];

        const numPoints = knownY.length;
        let x1 = 0; let y1 = 0; let xy = 0; let x2 = 0;

        for (let i = 0; i < numPoints; i++) {
            knownX[i] -= offsetX;
            x1 += knownX[i];
            y1 += knownY[i];
            xy += knownX[i] * knownY[i];
            x2 += knownX[i] * knownX[i];
        }

        const J = (numPoints * x2) - (x1 * x1);

        if (J === 0) return [0];

        const M = ((numPoints * xy) - (x1 * y1)) / J;
        const B = ((y1 * x2) - (x1 * xy)) / J;

        return [M, B];
    }

    private growth(knownY: number[], knownX: number[], newX: number[], useConst: boolean) : number[] {
        let tbeta: number;
        let talpha: number;
        // default values for optional parameters:
        if (typeof (knownX) === 'undefined') {
            knownX = [];
            for (let i = 1; i <= knownY.length; i++) knownX.push(i);
        }
        if (typeof (newX) === 'undefined') {
            newX = [];
            for (let i = 1; i <= knownY.length; i++) newX.push(i);
        }
        if (typeof (useConst) === 'undefined') useConst = true;

        // calculate sums over the data:
        const n = knownY.length;
        let avgX = 0; let avgY = 0; let avgXY = 0; let avgXX = 0;
        for (let i = 0; i < n; i++) {
            const x = knownX[i]; const y = Math.log(knownY[i]);
            avgX += x; avgY += y; avgXY += x * y; avgXX += x * x;
        }
        avgX /= n; avgY /= n; avgXY /= n; avgXX /= n;

        // compute linear regression coefficients:
        if (useConst) {
            tbeta = (avgXY - avgX * avgY) / (avgXX - avgX * avgX);
            talpha = avgY - tbeta * avgX;
        } else {
            tbeta = avgXY / avgXX;
            talpha = 0;
        }

        // compute and return result array:
        const newY : number[] = [];
        for (let i = 0; i < newX.length; i++) {
            const v = Math.exp(talpha + tbeta * newX[i]);
            newY.push(v);
        }
        return newY;
    }

    private calculateFlexDist() {
        const density = (
            this.runwayAltitude
        + (this.BARO_SEA - this.baro) * 27
        + (this.oat - (15 - (this.runwayAltitude / 1000) * 2)) * 120
        );

        const TREF = a20n.trefaice + (this.runwayAltitude / 1000 * 2);
        const ISA = this.oat - 15 + (this.runwayAltitude / 1000) * 1.98;

        const flexTrendModifierTable = [
            this.oat,
            0 + this.oat - ISA,
            a20n.isaInc + this.oat - ISA,
            1 + a20n.isaInc + this.oat - ISA,
            (TREF > this.oat) ? Math.floor(TREF) : this.oat + 1,
            33,
            a20n.tmaxflex + this.oat - ISA,
            this.oat,
        ];

        const AltCorrectionsTable = [
            2000,
            4000,
            6000,
            8000,
            10000,
        ];

        const perfDistDiffTable = [
            a20n.to2k - a20n.todist2,
            a20n.to4k - a20n.to2k,
            a20n.to6k - a20n.to4k,
            a20n.to8k - a20n.to6k,
            (a20n.to8k - a20n.to6k) * 1.53,
        ];

        const densityCorrection = this.calculateDensityCorrection(density, AltCorrectionsTable, perfDistDiffTable);

        const perfWeight = this.tow;

        const altBelowToWt2ISA = densityCorrection - (densityCorrection - (densityCorrection / 100 * (perfWeight / (a20n.towt2isa / 100)))) / 100 * a20n.toaltAdj;
        const altAboveToWt2ISA = altBelowToWt2ISA; // the correction is the same above or below for the currently implemented aircraft

        const distanceByDensity = (perfWeight < a20n.towt2isa) ? altBelowToWt2ISA : altAboveToWt2ISA;

        const seedModifiers = this.plantSeeds(perfWeight, a20n);

        const seedModStd = seedModifiers[0];

        const seedModIsa = seedModifiers[1];

        const growthSeed = [
            seedModStd + distanceByDensity,
            seedModIsa + distanceByDensity,
        ];

        const growthTrend = this.growth(
            growthSeed,
            [
                flexTrendModifierTable[1],
                flexTrendModifierTable[2],
            ],
            flexTrendModifierTable,
            true,
        );

        const trendBase = [
            growthTrend[0],
            growthTrend[1],
            growthTrend[2],
            growthTrend[3] ** (a20n.engThrust / 10000),
        ];

        const trendWithModifiers = this.trend(
            [
                trendBase[2],
                trendBase[3],
            ],
            [
                flexTrendModifierTable[2],
                flexTrendModifierTable[3],
            ],
            [
                flexTrendModifierTable[2],
                flexTrendModifierTable[3],
                flexTrendModifierTable[4],
                flexTrendModifierTable[5],
                flexTrendModifierTable[6],
                flexTrendModifierTable[7],
            ],
        );

        const isaCorrection = (ISA > a20n.isaInc) ? trendWithModifiers[5] : growthTrend[0];

        const flapCorr = isaCorrection + (isaCorrection / 100) * takeoffFlapsData[this.flaps];

        const headwind = Math.cos(toRadians(this.windHeading - (this.runwayHeading * 10))) * this.windKts;

        const windLen = (headwind > 0)
            ? (flapCorr - ((flapCorr / 100) * (headwind / (a20n.vrisa / 100))) / 2)
            : flapCorr - ((flapCorr / 100) * (headwind / (a20n.vrisa / 150)));

        let totDist = windLen;
        totDist += (this.antiIce) ? ((windLen / 100) * 3) : 0;
        totDist += (this.packs) ? ((windLen / 100) * 4) : 0;

        this.flapWindAIPackCorrection = totDist / (isaCorrection / 100);

        // do i need this?
        trendBase[4] = (growthTrend[4] / 100 * this.flapWindAIPackCorrection);

        const distanceTrendTablePreFlex = [
            ((trendWithModifiers[0] / 100) * this.flapWindAIPackCorrection),
            ((trendWithModifiers[1] / 100) * this.flapWindAIPackCorrection),
            ((trendWithModifiers[2] / 100) * this.flapWindAIPackCorrection),
            ((trendWithModifiers[3] / 100) * this.flapWindAIPackCorrection),
            ((trendWithModifiers[4] / 100) * this.flapWindAIPackCorrection),
            this.availRunway - a20n.runwayModifier,
        ];

        const flexTrendTable : number[] = this.trend(
            [
                flexTrendModifierTable[2],
                flexTrendModifierTable[3],
                flexTrendModifierTable[4],
                flexTrendModifierTable[5],
                flexTrendModifierTable[6],
            ],
            [
                distanceTrendTablePreFlex[0],
                distanceTrendTablePreFlex[1],
                distanceTrendTablePreFlex[2],
                distanceTrendTablePreFlex[3],
                distanceTrendTablePreFlex[4],
            ],
            distanceTrendTablePreFlex,
        );

        // this will be our final flex number.
        flexTrendTable[6] = (flexTrendTable[5] < flexTrendTable[4]) ? Math.floor(flexTrendTable[5]) : Math.floor(flexTrendTable[4]);

        const TakeoffDistanceTrendTable = this.trend(
            [
                distanceTrendTablePreFlex[2],
                distanceTrendTablePreFlex[3],
                distanceTrendTablePreFlex[4],
            ],
            [
                flexTrendTable[2],
                flexTrendTable[3],
                flexTrendTable[4],
            ],
            [
                flexTrendTable[2],
                flexTrendTable[3],
                flexTrendTable[4],
                flexTrendTable[5],
                flexTrendTable[6],
            ],
        );

        this.flexToTemp = flexTrendTable[6];
        this.requiredRunway = TakeoffDistanceTrendTable[4];
    }
}
