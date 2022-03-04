/// <reference types="msfstypes/JS/simvar" />

import { EventBus, PublishPacer } from '../data/EventBus';
import { SimVarValueType, SimVarDefinition } from '../data/SimVars';
import { SimVarPublisher } from './BasePublishers';

/**
 * An interface that describes the possible ADC events
 * on the event bus.
 */
export interface ADCEvents {

    /** An indicated airspeed event. */
    ias: number;

    /** A true airspeed event. */
    tas: number;

    /** An indicated altitude (index 0) event. */
    alt: number;

    /** A vertical speed event. */
    vs: number;

    /** A heading in degrees magnetic event. */
    hdg_deg: number;

    /** A heading in degrees true event */
    hdg_deg_true: number;

    /** A degrees of airplane pitch event. */
    pitch_deg: number;

    /** A degrees of airplane roll event. */
    roll_deg: number;

    /** A selected altimeter setting inHg. */
    kohlsman_setting_hg_1: number;

    /** A selected altimeter setting mb. */
    kohlsman_setting_mb_1: number;

    /** A turn coordinator ball value. */
    turn_coordinator_ball: number;

    /** A delta heading value. */
    delta_heading_rate: number;

    /** An ambient temperature in Celsius. */
    ambient_temp_c: number;

    /** The ambient wind velocity, in knots. */
    ambient_wind_velocity: number;

    /** The ambient wind direction, in degrees north. */
    ambient_wind_direction: number;

    /** The baro setting (true=hpa, false=inhg). */
    baro_units_hpa_1: boolean;

    /** Whether baro index 1 is set to STD (true=STD, false=set pressure). */
    baro_std_1: boolean;

    /** Whether the plane is on the ground. */
    on_ground: boolean;

    /** The angle of attack. */
    aoa: number;
}

/**
 * A publisher for basic ADC/AHRS information.
 */
export class ADCPublisher extends SimVarPublisher<ADCEvents> {
    private static simvars = new Map<keyof ADCEvents, SimVarDefinition>([
        ['ias', { name: 'AIRSPEED INDICATED', type: SimVarValueType.Knots }],
        ['tas', { name: 'AIRSPEED TRUE', type: SimVarValueType.Knots }],
        ['alt', { name: 'INDICATED ALTITUDE', type: SimVarValueType.Feet }],
        ['vs', { name: 'VERTICAL SPEED', type: SimVarValueType.FPM }],
        ['hdg_deg', { name: 'PLANE HEADING DEGREES MAGNETIC', type: SimVarValueType.Degree }],
        ['pitch_deg', { name: 'PLANE PITCH DEGREES', type: SimVarValueType.Degree }],
        ['roll_deg', { name: 'PLANE BANK DEGREES', type: SimVarValueType.Degree }],
        ['hdg_deg_true', { name: 'PLANE HEADING DEGREES TRUE', type: SimVarValueType.Degree }],
        ['kohlsman_setting_hg_1', { name: 'KOHLSMAN SETTING HG', type: SimVarValueType.InHG }],
        ['turn_coordinator_ball', { name: 'TURN COORDINATOR BALL', type: SimVarValueType.Number }],
        ['delta_heading_rate', { name: 'DELTA HEADING RATE', type: SimVarValueType.Degree }],
        ['ambient_temp_c', { name: 'AMBIENT TEMPERATURE', type: SimVarValueType.Celsius }],
        ['ambient_wind_velocity', { name: 'AMBIENT WIND VELOCITY', type: SimVarValueType.Knots }],
        ['ambient_wind_direction', { name: 'AMBIENT WIND DIRECTION', type: SimVarValueType.Degree }],
        ['kohlsman_setting_mb_1', { name: 'KOHLSMAN SETTING MB', type: SimVarValueType.MB }],
        ['baro_units_hpa_1', { name: 'L:XMLVAR_Baro_Selector_HPA_1', type: SimVarValueType.Bool }],
        ['on_ground', { name: 'SIM ON GROUND', type: SimVarValueType.Bool }],
        ['aoa', { name: 'INCIDENCE ALPHA', type: SimVarValueType.Degree }]
    ]);

    /**
     * Updates the ADC publisher.
     */
    public onUpdate(): void {
        super.onUpdate();
    }

    /**
     * Create an ADCPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the rate of publishing
     */
    public constructor(bus: EventBus, pacer: PublishPacer<ADCEvents> | undefined = undefined) {
        super(ADCPublisher.simvars, bus, pacer);
    }
}