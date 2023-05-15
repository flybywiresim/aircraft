import { ApproachUtils } from '@shared/ApproachUtils';
import { FlightPlanManager } from './flightplanning/FlightPlanManager';
import { getFlightPhaseManager } from './flightphase';
import { FlightPlanAsoboSync } from './flightplanning/FlightPlanAsoboSync';
import { GuidanceManager } from './guidance/GuidanceManager';
import { ManagedFlightPlan } from './flightplanning/ManagedFlightPlan';
import { GuidanceController } from './guidance/GuidanceController';
import { EfisSymbols } from './efis/EfisSymbols';
import { DescentPathBuilder } from './guidance/vnav/descent/DescentPathBuilder';
import { initComponents, updateComponents, recallMessageById } from './components';
import { WaypointBuilder } from './flightplanning/WaypointBuilder';
import { RawDataMapper } from './flightplanning/RawDataMapper';
import { Navigation, SelectedNavaidMode, SelectedNavaidType } from './navigation/Navigation';

function initFmgcLoop(baseInstrument: BaseInstrument, flightPlanManager: FlightPlanManager): void {
    initComponents(baseInstrument, flightPlanManager);
}

function updateFmgcLoop(deltaTime: number): void {
    updateComponents(deltaTime);
}

export {
    getFlightPhaseManager,
    FlightPlanManager,
    ManagedFlightPlan,
    FlightPlanAsoboSync,
    GuidanceManager,
    GuidanceController,
    initFmgcLoop,
    updateFmgcLoop,
    recallMessageById,
    EfisSymbols,
    DescentPathBuilder,
    WaypointBuilder,
    RawDataMapper,
    ApproachUtils,
    Navigation,
    SelectedNavaidMode,
    SelectedNavaidType,
};
