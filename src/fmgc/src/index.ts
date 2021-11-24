import { FlightPlanManager } from './flightplanning/FlightPlanManager';
import { FlightPlanAsoboSync } from './flightplanning/FlightPlanAsoboSync';
import { GuidanceManager } from './guidance/GuidanceManager';
import { ManagedFlightPlan } from './flightplanning/ManagedFlightPlan';
import { GuidanceController } from './guidance/GuidanceController';
import { NavRadioManager } from './radionav/NavRadioManager';
import { FmsMessages } from './components/FmsMessages';
import { EfisSymbols } from './efis/EfisSymbols';
import { DescentBuilder } from './guidance/vnav/descent/DescentBuilder';
import { DecelPathBuilder } from './guidance/vnav/descent/DecelPathBuilder';
import { VerticalFlightPlanBuilder } from './guidance/vnav/verticalFlightPlan/VerticalFlightPlanBuilder';
import { FmgcComponent } from './lib/FmgcComponent';

const fmsMessages = new FmsMessages();

const components: FmgcComponent[] = [
    fmsMessages,
];

function initFmgcLoop(): void {
    components.forEach((component) => component.init());
}

function updateFmgcLoop(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}

function recallMessageById(id: number) {
    fmsMessages.recallId(id);
}

export {
    FlightPlanManager,
    ManagedFlightPlan,
    FlightPlanAsoboSync,
    GuidanceManager,
    GuidanceController,
    NavRadioManager,
    initFmgcLoop,
    updateFmgcLoop,
    recallMessageById,
    FmsMessages,
    EfisSymbols,
    DescentBuilder,
    DecelPathBuilder,
    VerticalFlightPlanBuilder,
};
