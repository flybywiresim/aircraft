// Copyright (c) 2021 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { WayPoint } from '@fmgc/types/fstypes/FSTypes';
import { FlightPlanManager } from '@fmgc/wtsdk';

export interface FixInfoRadial {
    // true degrees
    trueBearing: number,
    magneticBearing: number,
    time?: number,
    dtg?: number,
    alt?: number,
}

export interface FixInfoRadius {
    // nautical miles
    radius: number,
    time?: number,
    dtg?: number,
    alt?: number,
}

export class FixInfo {
    private flightPlanManager: FlightPlanManager;

    private refFix: WayPoint;

    private radials: FixInfoRadial[] = [];

    private radius: FixInfoRadius;

    private abeam: boolean = false;

    constructor(flightPlanManager: FlightPlanManager) {
        this.flightPlanManager = flightPlanManager;
    }

    setRefFix(fix?: WayPoint): void {
        this.radials.length = 0;
        this.radius = undefined;
        this.abeam = false;
        this.refFix = fix;
        this.flightPlanManager.updateFlightPlanVersion();
    }

    getRefFix(): WayPoint | undefined {
        return this.refFix;
    }

    getRefFixIdent(): string | undefined {
        return this.refFix?.ident;
    }

    setRadial(index: 0 | 1, magneticBearing?: number): void {
        if (magneticBearing !== undefined) {
            const trueBearing = Avionics.Utils.clampAngle(magneticBearing + Facilities.getMagVar(this.refFix.infos.coordinates.lat, this.refFix.infos.coordinates.long));
            this.radials[index] = { magneticBearing, trueBearing };
        } else {
            this.radials.splice(index, 1);
        }
        // TODO calculate flight plan intercepts
        this.flightPlanManager.updateFlightPlanVersion();
    }

    getRadial(index: 0 | 1): FixInfoRadial | undefined {
        return this.radials[index];
    }

    getRadialTrueBearings(): number[] {
        return this.radials.map((r) => r.trueBearing);
    }

    setRadius(radius?: number): void {
        if (radius !== undefined) {
            this.radius = { radius };
        } else {
            this.radius = undefined;
        }
        // TODO calculate flight plan intercepts
        this.flightPlanManager.updateFlightPlanVersion();
    }

    getRadius(): FixInfoRadius | undefined {
        return this.radius;
    }

    getRadiusValue(): number | undefined {
        return this.radius?.radius;
    }
}
