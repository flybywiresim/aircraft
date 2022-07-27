import { Mode, RangeSetting } from '@shared/NavigationDisplay';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { bearingTo, distanceTo, smallCircleGreatCircleIntersection } from 'msfs-geo';

export function withinEditArea(lla: Coordinates, range: RangeSetting, mode: Mode, planCentre: Coordinates, trueHeading: DegreesTrue): boolean {
    const [editAhead, editBehind, editBeside] = calculateEditArea(range, mode);

    const dist = Avionics.Utils.computeGreatCircleDistance(planCentre, lla);

    let bearing = Avionics.Utils.computeGreatCircleHeading(planCentre, lla);
    if (mode !== Mode.PLAN) {
        bearing = Avionics.Utils.clampAngle(bearing - trueHeading);
    }
    bearing = bearing * Math.PI / 180;

    const dx = dist * Math.sin(bearing);
    const dy = dist * Math.cos(bearing);

    return Math.abs(dx) < editBeside && dy > -editBehind && dy < editAhead;
}

export function calculateEditArea(range: RangeSetting, mode: Mode): [number, number, number] {
    switch (mode) {
    case Mode.ARC:
        if (range <= 10) {
            return [10.5, 3.5, 8.3];
        }
        if (range <= 20) {
            return [20.5, 7, 16.6];
        }
        if (range <= 40) {
            return [40.5, 14, 33.2];
        }
        if (range <= 80) {
            return [80.5, 28, 66.4];
        }
        if (range <= 160) {
            return [160.5, 56, 132.8];
        }
        return [320.5, 112, 265.6];
    case Mode.ROSE_NAV:
        if (range <= 10) {
            return [7.6, 7.1, 7.1];
        }
        if (range <= 20) {
            return [14.7, 14.2, 14.2];
        }
        if (range <= 40) {
            return [28.9, 28.4, 28.4];
        }
        if (range <= 80) {
            return [57.3, 56.8, 56.8];
        }
        if (range <= 160) {
            return [114.1, 113.6, 113.6];
        }
        return [227.7, 227.2, 227.2];
    case Mode.PLAN:
        if (range <= 10) {
            return [7, 7, 7];
        }
        if (range <= 20) {
            return [14, 14, 14];
        }
        if (range <= 40) {
            return [28, 28, 28];
        }
        if (range <= 80) {
            return [56, 56, 56];
        }
        if (range <= 160) {
            return [112, 112, 112];
        }
        return [224, 224, 224];
    default:
        return [0, 0, 0];
    }
}

export function linePortionWithinEditArea(llaStart: Coordinates, llaEnd: Coordinates, range: RangeSetting, mode: Mode, mapReference: Coordinates): [Coordinates, Coordinates] | undefined {
    const [editAhead, editBehind, editBeside] = calculateEditArea(range, mode);
    // FIXME atm we look at a larger area than necessary if the reference is not in the centre of the edit area
    const mapCentre = mapReference;
    const mapRadius = Math.sqrt(Math.max(editAhead, editBehind) ** 2 + editBeside ** 2);

    const startWithinArea = distanceTo(mapCentre, llaStart) < mapRadius;
    const endWithinArea = distanceTo(mapCentre, llaEnd) < mapRadius;
    if (startWithinArea && endWithinArea) {
        return [llaStart, llaEnd];
    }

    const bearing = bearingTo(llaStart, llaEnd);
    const intersections = smallCircleGreatCircleIntersection(
        mapCentre,
        mapRadius,
        llaStart,
        bearing,
    );

    if (!intersections) {
        return undefined;
    }

    if (startWithinArea) {
        return [llaStart, intersections[1]];
    }
    if (endWithinArea) {
        return [intersections[0], llaEnd];
    }

    // does the line go through the edit area?
    const bearings = intersections.map((intersection) => bearingTo(llaStart, intersection));
    if (Math.abs(bearings[0] - bearing % 360) < 90 && Math.abs(bearings[1] - bearing % 360) < 90) {
        return intersections as [Coordinates, Coordinates];
    }
    return undefined;
}
