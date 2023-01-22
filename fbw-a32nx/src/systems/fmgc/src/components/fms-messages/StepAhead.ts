import { FlightPlans } from '@fmgc/flightplanning/FlightPlanManager';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { FMMessage, FMMessageTypes } from '@shared/FmMessages';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';

export class StepAhead implements FMMessageSelector {
    message: FMMessage = FMMessageTypes.StepAhead;

    private guidanceController: GuidanceController;

    private lastState: boolean = false;

    init(baseInstrument: BaseInstrument): void {
        this.guidanceController = baseInstrument.guidanceController;
    }

    process(_: number): FMMessageUpdate {
        const fpm = this.guidanceController.flightPlanManager;
        const distanceToEnd = this.guidanceController.vnavDriver.distanceToEnd;

        if (!this.guidanceController.vnavDriver.currentNavGeometryProfile.isReadyToDisplay || distanceToEnd <= 0) {
            return FMMessageUpdate.NO_ACTION;
        }

        let newState = false;
        for (let i = fpm.getActiveWaypointIndex(); i < fpm.getWaypointsCount(FlightPlans.Active); i++) {
            const waypoint = fpm.getWaypoint(i, FlightPlans.Active);
            if (!waypoint || !waypoint.additionalData.cruiseStep) {
                continue;
            }

            if (distanceToEnd - waypoint.additionalData.distanceToEnd < 20) {
                newState = true;
            }
        }

        if (newState !== this.lastState) {
            this.lastState = newState;

            return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
        }

        return FMMessageUpdate.NO_ACTION;
    }
}
