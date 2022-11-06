/// <reference types="msfstypes/JS/simvar" />

import { EventBus, IndexedEventType } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { SimVarDefinition, SimVarValueType } from '../data/SimVars';
import { SimVarPublisher } from './BasePublishers';

/**
 * An interface that describes the possible Engine Parameter events
 * on the event bus.
 */
export type EngineEvents = {

    /** An RPM for engine 1. */
    rpm_1: number;

    /** An RPM for engine 2. */
    rpm_2: number;

    /** N1% for engine 1 */
    n1_1: number;

    /** N1% for engine 2 */
    n1_2: number;

    /** N2% for engine 1 */
    n2_1: number;

    /** N2% for engine 2 */
    n2_2: number;

    /** Fuel flow rate, in gallons per hour, for an indexed engine. */
    [fuel_flow: IndexedEventType<'fuel_flow'>]: number;

    /** Total fuel flow rate, in gallons per hour. */
    fuel_flow_total: number;

    /** A fuel flow rate for recip engine 1 */
    recip_ff_1: number;

    /** A fuel flow rate for recip engine 2 */
    recip_ff_2: number;

    /** A oil press for engine 1 */
    oil_press_1: number;

    /** A oil press for engine 2 */
    oil_press_2: number;

    /** A oil temp for engine 1 */
    oil_temp_1: number;

    /** A oil temp for engine 2 */
    oil_temp_2: number;

    /** ITT in celsius for engine 1 */
    itt_1: number;

    /** ITT in celsius for engine 2 */
    itt_2: number;

    /** A egt for engine 1 */
    egt_1: number;

    /** A egt for engine 2 */
    egt_2: number;

    /** A pressure value for vacuum system */
    vac: number;

    /** The total amount of fuel remaining, in gallons. */
    fuel_total: number;

    /** The amount of fuel remaining in the left tank, in gallons. */
    fuel_left: number;

    /** The amount of fuel remaining in the right tank, in gallons. */
    fuel_right: number;

    /**
     * The fuel weight per gallon, in pounds per gallon
     */
    fuel_weight_per_gallon: number;

    /** A hours value for engine 1 total elapsed time */
    eng_hours_1: number;

    /** A hydraulic pressure value for engine 1 */
    eng_hyd_press_1: number;

    /** A hydraulic pressure value for engine 2 */
    eng_hyd_press_2: number;

    /** A value indicating if engine 1 starter is on */
    eng_starter_1: number;

    /** A value indicating if engine 2 starter is on */
    eng_starter_2: number;

    /** A value indicating if engine 1 combustion is on */
    eng_combustion_1: number;

    /** A value indicating if engine 2 combustion is on */
    eng_combustion_2: number;

    /** A value indicating if engine 1 manual ignition is on */
    eng_manual_ignition_1: number;

    /** A value indicating if engine 2 manual ignition is on */
    eng_manual_ignition_2: number;
}

/**
 * A publisher for Engine information.
 */
export class EISPublisher extends SimVarPublisher<EngineEvents> {
    private static simvars = new Map<keyof EngineEvents, SimVarDefinition>([
        ['rpm_1', { name: 'GENERAL ENG RPM:1', type: SimVarValueType.RPM }],
        ['rpm_2', { name: 'GENERAL ENG RPM:2', type: SimVarValueType.RPM }],
        ['n1_1', { name: 'TURB ENG CORRECTED N1:1', type: SimVarValueType.Percent }],
        ['n1_2', { name: 'TURB ENG CORRECTED N1:2', type: SimVarValueType.Percent }],
        ['n2_1', { name: 'TURB ENG CORRECTED N2:1', type: SimVarValueType.Percent }],
        ['n2_2', { name: 'TURB ENG CORRECTED N2:2', type: SimVarValueType.Percent }],
        ['recip_ff_1', { name: 'RECIP ENG FUEL FLOW:1', type: SimVarValueType.PPH }],
        ['recip_ff_2', { name: 'RECIP ENG FUEL FLOW:2', type: SimVarValueType.PPH }],
        ['oil_press_1', { name: 'ENG OIL PRESSURE:1', type: SimVarValueType.PSI }],
        ['oil_press_2', { name: 'ENG OIL PRESSURE:2', type: SimVarValueType.PSI }],
        ['oil_temp_1', { name: 'ENG OIL TEMPERATURE:1', type: SimVarValueType.Farenheit }],
        ['oil_temp_2', { name: 'ENG OIL TEMPERATURE:2', type: SimVarValueType.Farenheit }],
        ['itt_1', { name: 'TURB ENG1 ITT', type: SimVarValueType.Celsius }],
        ['itt_2', { name: 'TURB ENG2 ITT', type: SimVarValueType.Celsius }],
        ['egt_1', { name: 'ENG EXHAUST GAS TEMPERATURE:1', type: SimVarValueType.Farenheit }],
        ['egt_2', { name: 'ENG EXHAUST GAS TEMPERATURE:2', type: SimVarValueType.Farenheit }],
        ['vac', { name: 'SUCTION PRESSURE', type: SimVarValueType.InHG }],
        ['fuel_total', { name: 'FUEL TOTAL QUANTITY', type: SimVarValueType.GAL }],
        ['fuel_left', { name: 'FUEL LEFT QUANTITY', type: SimVarValueType.GAL }],
        ['fuel_right', { name: 'FUEL RIGHT QUANTITY', type: SimVarValueType.GAL }],
        ['fuel_weight_per_gallon', { name: 'FUEL WEIGHT PER GALLON', type: SimVarValueType.LBS }],
        ['eng_hours_1', { name: 'GENERAL ENG ELAPSED TIME:1', type: SimVarValueType.Hours }],
        ['eng_hyd_press_1', { name: 'ENG HYDRAULIC PRESSURE:1', type: SimVarValueType.PSI }],
        ['eng_hyd_press_2', { name: 'ENG HYDRAULIC PRESSURE:2', type: SimVarValueType.PSI }],
        ['eng_starter_1', { name: 'GENERAL ENG STARTER:1', type: SimVarValueType.Number }],
        ['eng_starter_2', { name: 'GENERAL ENG STARTER:2', type: SimVarValueType.Number }],
        ['eng_combustion_1', { name: 'GENERAL ENG COMBUSTION:1', type: SimVarValueType.Number }],
        ['eng_combustion_2', { name: 'GENERAL ENG COMBUSTION:2', type: SimVarValueType.Number }],
        ['eng_manual_ignition_1', { name: 'TURB ENG IGNITION SWITCH EX1:1', type: SimVarValueType.Number }],
        ['eng_manual_ignition_2', { name: 'TURB ENG IGNITION SWITCH EX1:2', type: SimVarValueType.Number }]
    ]);

    private readonly engineCount: number;

    /**
     * Create an EISPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    public constructor(bus: EventBus, pacer: PublishPacer<EngineEvents> | undefined = undefined) {
        const simvars = new Map(EISPublisher.simvars);

        // add engine-indexed simvars
        const engineCount = SimVar.GetSimVarValue('NUMBER OF ENGINES', SimVarValueType.Number);
        for (let i = 1; i <= engineCount; i++) {
            simvars.set(`fuel_flow_${i}`, { name: `ENG FUEL FLOW GPH:${i}`, type: SimVarValueType.GPH });
        }

        super(simvars, bus, pacer);

        this.engineCount = engineCount;

        this.subscribed.add('fuel_flow_total');
    }

    /** @inheritdoc */
    public onUpdate(): void {
        super.onUpdate();

        if (this.subscribed.has('fuel_flow_total')) {
            let totalFuelFlow = 0;

            for (let i = 1; i <= this.engineCount; i++) {
                totalFuelFlow += SimVar.GetSimVarValue(`ENG FUEL FLOW GPH:${i}`, SimVarValueType.GPH);
            }

            this.publish('fuel_flow_total', totalFuelFlow);
        }
    }
}
