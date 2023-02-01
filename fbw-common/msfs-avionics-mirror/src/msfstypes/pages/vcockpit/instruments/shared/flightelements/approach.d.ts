declare class Approach {
    name: string;
    runway: string;
    wayPoints: Array<ApproachWayPoint>;
    transitions: Transition[];
    vorFrequency: number;
    vorIdent: string;
    constructor();
    isLocalizer(): boolean;
}
declare class ApproachWayPoint extends WayPoint {
    segmentType: number;
}
declare class Transition {
    name: string;
    latitude: number;
    longitude: number;
    waypoints: WayPoint[];
}
