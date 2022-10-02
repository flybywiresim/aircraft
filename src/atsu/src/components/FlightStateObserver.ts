import { AirplaneData } from '../airplane/AirplaneData';
import { Atsu } from '../ATSU';

export class Waypoint {
    public ident: string = '';

    public altitude: number = 0;

    public utc: number = 0;

    constructor(ident: string) {
        this.ident = ident;
    }
}

export class FlightStateObserver {
    public LastWaypoint: Waypoint | undefined = undefined;

    public PresentPosition = { lat: null, lon: null, altitude: null, heading: null, track: null, indicatedAirspeed: null, groundSpeed: null, verticalSpeed: null };

    public FcuSettings = { apActive: false, speed: null, machMode: false, altitude: null };

    public EnvironmentData = { windDirection: null, windSpeed: null, temperature: null }

    public ActiveWaypoint: Waypoint | undefined = undefined;

    public NextWaypoint: Waypoint | undefined = undefined;

    public Destination: Waypoint | undefined = undefined;

    private static findLastWaypoint(fp) {
        if (fp) {
            let idx = fp.activeWaypointIndex;
            while (idx >= 0) {
                const wp = fp.getWaypoint(idx);
                if (wp?.waypointReachedAt !== 0) {
                    return wp;
                }

                idx -= 1;
            }
        }

        return null;
    }

    private resetPresentPosition(): void {
        this.PresentPosition = { lat: null, lon: null, altitude: null, heading: null, track: null, indicatedAirspeed: null, groundSpeed: null, verticalSpeed: null };
    }

    private updatePresentPosition(airplane: AirplaneData): void {
        this.resetPresentPosition();

        const latLon = airplane.currentLatLon();
        if (latLon.valid) {
            this.PresentPosition.lat = latLon.lat;
            this.PresentPosition.lon = latLon.lon;
        }

        const altitude = airplane.currentAltitude();
        if (altitude.valid) {
            this.PresentPosition.altitude = altitude.altitude;
        }

        const heading = airplane.currentTrueHeading();
        if (heading.valid) {
            this.PresentPosition.heading = heading.heading;
        }

        const track = airplane.currentGroundTrack();
        if (track.valid) {
            this.PresentPosition.track = track.track;
        }

        const indicatedAirspeed = airplane.currentIndicatedAirspeed();
        if (indicatedAirspeed.valid) {
            this.PresentPosition.indicatedAirspeed = indicatedAirspeed.airspeed;
        }

        const groundspeed = airplane.currentGroundspeed();
        if (groundspeed.valid) {
            this.PresentPosition.groundSpeed = groundspeed.groundspeed;
        }

        const verticalSpeed = airplane.currentVerticalSpeed();
        if (verticalSpeed.valid) {
            this.PresentPosition.verticalSpeed = verticalSpeed.verticalSpeed;
        }
    }

    private resetFcuSettings(): void {
        this.FcuSettings = { apActive: false, speed: null, machMode: false, altitude: null };
    }

    private updateFcu(airplane: AirplaneData): void {
        this.resetFcuSettings();

        this.FcuSettings.apActive = airplane.autopilotActive();

        if (this.FcuSettings.apActive) {
            this.FcuSettings.machMode = airplane.autopilotMachModeActive();
            const apAltitude = airplane.autopilotSelectedAltitude();
            if (apAltitude.valid) {
                this.FcuSettings.altitude = apAltitude.altitude;
            }

            const apSpeed = airplane.autopilotSelectedSpeed();
            if (airplane.autopilotAutoThrustActive() && apSpeed.valid) {
                this.FcuSettings.speed = apSpeed.speed;
            }
        }
    }

    private updateEnvironment(airplane: AirplaneData): void {
        const direction = airplane.windDirection();
        if (direction.valid) {
            this.EnvironmentData.windDirection = direction.direction;
        }

        const speed = airplane.windSpeed();
        if (speed.valid) {
            this.EnvironmentData.windSpeed = speed.speed;
        }

        const temperatur = airplane.staticAirTemperature();
        if (temperatur.valid) {
            this.EnvironmentData.temperature = temperatur.temperatur;
        }
    }

    constructor(airplane: AirplaneData, atsu: Atsu, callback: (atsu: Atsu) => void) {
        setInterval(() => {
            const fp = airplane.activeFlightPlan();
            const last = FlightStateObserver.findLastWaypoint(fp);
            const active = fp?.getWaypoint(fp.activeWaypointIndex);
            const next = fp?.getWaypoint(fp.activeWaypointIndex + 1);
            const destination = fp?.getWaypoint(fp.waypoints.length - 1);
            let waypointPassed = false;

            this.updatePresentPosition(airplane);
            this.updateFcu(airplane);
            this.updateEnvironment(airplane);

            if (last) {
                if (!this.LastWaypoint || last.ident !== this.LastWaypoint.ident) {
                    this.LastWaypoint = new Waypoint(last.ident);
                    this.LastWaypoint.utc = last.waypointReachedAt;
                    this.LastWaypoint.altitude = this.PresentPosition.altitude;
                    waypointPassed = true;
                }
            }

            if (active && next) {
                const ppos = {
                    lat: this.PresentPosition.lat,
                    long: this.PresentPosition.lon,
                };
                const stats = fp.computeWaypointStatistics(ppos);

                if (!this.ActiveWaypoint || this.ActiveWaypoint.ident !== active.ident) {
                    this.ActiveWaypoint = new Waypoint(active.ident);
                }
                this.ActiveWaypoint.utc = Math.round(stats.get(fp.activeWaypointIndex).etaFromPpos);

                if (!this.NextWaypoint || this.NextWaypoint.ident !== next.ident) {
                    this.NextWaypoint = new Waypoint(next.ident);
                }
                this.ActiveWaypoint.utc = Math.round(stats.get(fp.activeWaypointIndex + 1).etaFromPpos);

                if (!this.Destination || this.Destination.ident !== destination.ident) {
                    this.Destination = new Waypoint(destination.ident);
                }
                this.Destination.utc = Math.round(stats.get(fp.waypoints.length - 1).etaFromPpos);
            }

            if (waypointPassed) {
                callback(atsu);
            }
        }, 1000);
    }
}
