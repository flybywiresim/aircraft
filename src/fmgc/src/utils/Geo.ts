import { computeDestinationPoint as geolibDestPoint, getDistance as geolibDistance, getGreatCircleBearing as geolibBearing } from 'geolib';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { MathUtils } from '@shared/MathUtils';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';

const sin = (input: Degrees) => Math.sin(input * (Math.PI / 180));

const asin = (input: Degrees) => Math.asin(input) * (180 / Math.PI);

export class Geo {
    static getDistance(a: Coordinates, b: Coordinates): NauticalMiles {
        // FIXME rm -f geolib ?
        return geolibDistance({ ...a, lon: a.long }, { ...b, lon: b.long }) / 1852;
    }

    static getGreatCircleBearing(a: Coordinates, b: Coordinates): Degrees {
        // FIXME rm -f geolib ?
        return geolibBearing({ ...a, lon: a.long }, { ...b, lon: b.long });
    }

    static computeDestinationPoint(start: Coordinates, distance: NauticalMiles, bearing: DegreesTrue, radius: Metres = 6371000): Coordinates {
        // FIXME rm -f geolib ?
        const a = geolibDestPoint({ ...start, lon: start.long }, distance * 1852, bearing, radius);
        return {
            lat: a.latitude,
            long: a.longitude,
        };
    }

    static distanceToLeg(from: Coordinates, leg: Leg): NauticalMiles {
        return Geo.getDistance(from, Geo.doublePlaceBearingIntercept(from, leg.getPathEndPoint(), leg.outboundCourse - 90, leg.outboundCourse - 180));
    }

    static legIntercept(from: Coordinates, bearing: DegreesTrue, leg: Leg): Coordinates {
        return Geo.doublePlaceBearingIntercept(from, leg.getPathEndPoint(), bearing, leg.outboundCourse - 180);
    }

    static placeBearingPlaceDistanceIntercept(bearingPoint: Coordinates, distancePoint: Coordinates, bearing: DegreesTrue, distance: NauticalMiles): Coordinates {
        const relativeBearing = Geo.getGreatCircleBearing(bearingPoint, distancePoint);
        const distanceBetween = Geo.getDistance(bearingPoint, distancePoint);
        const angleA = Math.abs(MathUtils.diffAngle(relativeBearing, bearing));
        const angleC = angleA > 90 ? asin(distanceBetween * (sin(angleA) / distance)) : 180 - asin(distanceBetween * (sin(angleA) / distance));
        const angleB = 180 - angleA - angleC;
        return Geo.computeDestinationPoint(bearingPoint, Math.abs(sin(angleB) * (distance / sin(angleA))), bearing);
    }

    static doublePlaceBearingIntercept(pointA: Coordinates, pointB: Coordinates, bearingA: DegreesTrue, bearingB: DegreesTrue): Coordinates {
        const distanceBetween = Geo.getDistance(pointA, pointB);
        const bearingBetween = Geo.getGreatCircleBearing(pointA, pointB);
        const angleA = bearingBetween - bearingA;
        const angleB = bearingB - bearingBetween - 180;
        const angleC = 180 - angleA - angleB;

        const dist = Math.sin(angleA * (Math.PI / 180)) * (distanceBetween / Math.sin(angleC * (Math.PI / 180)));
        return Geo.computeDestinationPoint(pointB, dist, bearingB);
    }
}
