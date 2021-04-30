import { LnavDriver } from './lnav/LnavDriver';
import { FlightPlanManager } from '../flightplanning/FlightPlanManager';
import { GuidanceManager } from './GuidanceManager';
import { GuidanceComponent } from './GuidanceComponent';

export class GuidanceController implements GuidanceComponent {
    flightPlanManager: FlightPlanManager;

    guidanceManager: GuidanceManager;

    lnavDriver: LnavDriver;

    constructor(flightPlanManager: FlightPlanManager, guidanceManager: GuidanceManager) {
        this.flightPlanManager = flightPlanManager;
        this.guidanceManager = guidanceManager;

        this.lnavDriver = new LnavDriver(this);
    }

    init() {
        console.log('[FMGC/Guidance] GuidanceController initialized!');

        this.lnavDriver.init();
    }

    update(deltaTime: number) {
        this.lnavDriver.update(deltaTime);
    }
}
