/// <reference types="msfstypes/JS/simvar" />

import { EventBus, IndexedEventType, PublishPacer } from '../data/EventBus';
import { SimVarValueType, SimVarDefinition } from '../data/SimVars';
import { SimVarPublisher } from './BasePublishers';

/**
 * An interface that describes the possible Engine Parameter events
 * on the event bus.
 */
export interface EngineEvents {

    /** An RPM for engine 1. */
    rpm_1: number;

    /** Fuel flow rate, in gallons per hour, for an indexed engine. */
    [fuel_flow: IndexedEventType<'fuel_flow'>]: number;

    /** Total fuel flow rate, in gallons per hour. */
    fuel_flow_total: number;

    /** A fuel flow rate for recip engine 1 */
    recip_ff_1: number;

    /** A oil press for engine 1 */
    oil_press_1: number;

    /** A oil temp for engine 1 */
    oil_temp_1: number;

    /** A egt for engine 1 */
    egt_1: number;

    /** A pressure value for vacuum system */
    vac: number;

    /** The total amount of fuel remaining, in gallons. */
    fuel_total: number;

    /** The amount of fuel remaining in the left tank, in gallons. */
    fuel_left: number;

    /** The amount of fuel remaining in the right tank, in gallons. */
    fuel_right: number;

    /** A hours value for engine 1 total elapsed time */
    eng_hours_1: number;

    /** A voltage value for the main elec bus */
    elec_bus_main_v: number;

    /** A current value for the main elec bus */
    elec_bus_main_a: number;

    /** A voltage value for the avionics bus */
    elec_bus_avionics_v: number;

    /** A current value for the avinoics bus */
    elec_bus_avionics_a: number;

    /** A voltage value for the generator/alternator 1 bus */
    elec_bus_genalt_1_v: number;

    /** A current value for the generator/alternator 1 bus */
    elec_bus_genalt_1_a: number;

    /** A voltage value for the battery */
    elec_bat_v: number;

    /** A current value for the battery */
    elec_bat_a: number;


}

/**
 * A publisher for Engine information.
 */
export class EISPublisher extends SimVarPublisher<EngineEvents> {
    private static simvars = new Map<keyof EngineEvents, SimVarDefinition>([
        ['rpm_1', { name: 'GENERAL ENG RPM:1', type: SimVarValueType.RPM }],
        ['recip_ff_1', { name: 'RECIP ENG FUEL FLOW:1', type: SimVarValueType.PPH }],
        ['oil_press_1', { name: 'ENG OIL PRESSURE:1', type: SimVarValueType.PSI }],
        ['oil_temp_1', { name: 'ENG OIL TEMPERATURE:1', type: SimVarValueType.Farenheit }],
        ['egt_1', { name: 'ENG EXHAUST GAS TEMPERATURE:1', type: SimVarValueType.Farenheit }],
        ['vac', { name: 'SUCTION PRESSURE', type: SimVarValueType.InHG }],
        ['fuel_total', { name: 'FUEL TOTAL QUANTITY', type: SimVarValueType.GAL }],
        ['fuel_left', { name: 'FUEL LEFT QUANTITY', type: SimVarValueType.GAL }],
        ['fuel_right', { name: 'FUEL RIGHT QUANTITY', type: SimVarValueType.GAL }],
        ['eng_hours_1', { name: 'GENERAL ENG ELAPSED TIME:1', type: SimVarValueType.Hours }],
        ['elec_bus_main_v', { name: 'ELECTRICAL MAIN BUS VOLTAGE', type: SimVarValueType.Volts }],
        ['elec_bus_main_a', { name: 'ELECTRICAL MAIN BUS AMPS', type: SimVarValueType.Amps }],
        ['elec_bus_avionics_v', { name: 'ELECTRICAL AVIONICS BUS VOLTAGE', type: SimVarValueType.Volts }],
        ['elec_bus_avionics_a', { name: 'ELECTRICAL AVIONICS BUS AMPS', type: SimVarValueType.Amps }],
        ['elec_bus_genalt_1_v', { name: 'ELECTRICAL GENALT BUS VOLTAGE:1', type: SimVarValueType.Volts }],
        ['elec_bus_genalt_1_a', { name: 'ELECTRICAL GENALT BUS AMPS:1', type: SimVarValueType.Amps }],
        ['elec_bat_a', { name: 'ELECTRICAL BATTERY LOAD', type: SimVarValueType.Amps }],
        ['elec_bat_v', { name: 'ELECTRICAL BATTERY VOLTAGE', type: SimVarValueType.Volts }]
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