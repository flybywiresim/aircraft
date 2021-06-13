use std::time::Duration;
use systems::{
    engine::Engine,
    hydraulic::{
        brake_circuit::BrakeCircuit, ElectricPump, EngineDrivenPump, Fluid, HydraulicLoop,
        HydraulicLoopController, PowerTransferUnit, PowerTransferUnitController, PressureSwitch,
        PumpController, RamAirTurbine, RamAirTurbineController,
    },
    landing_gear::LandingGear,
    overhead::{
        AutoOffFaultPushButton, AutoOnFaultPushButton, MomentaryPushButton, OnOffFaultPushButton,
    },
    shared::{
        DelayedFalseLogicGate, DelayedTrueLogicGate, ElectricalBusType, ElectricalBuses,
        EmergencyElectricalRatPushButton, EmergencyElectricalState, EngineFirePushButtons,
        LandingGearPosition, RamAirTurbineHydraulicLoopPressurised,
    },
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
        UpdateContext, Write,
    },
};
use uom::si::{
    angular_velocity::revolution_per_minute, f64::*, pressure::pascal, pressure::psi,
    ratio::percent, volume::gallon,
};

pub(super) struct A320Hydraulic {
    hyd_brake_logic: A320HydraulicBrakingLogic,
    blue_loop: HydraulicLoop,
    blue_loop_controller: A320HydraulicLoopController,
    green_loop: HydraulicLoop,
    green_loop_controller: A320HydraulicLoopController,
    yellow_loop: HydraulicLoop,
    yellow_loop_controller: A320HydraulicLoopController,

    engine_driven_pump_1_pressure_switch: PressureSwitch,
    engine_driven_pump_1: EngineDrivenPump,
    engine_driven_pump_1_controller: A320EngineDrivenPumpController,

    engine_driven_pump_2_pressure_switch: PressureSwitch,
    engine_driven_pump_2: EngineDrivenPump,
    engine_driven_pump_2_controller: A320EngineDrivenPumpController,

    blue_electric_pump: ElectricPump,
    blue_electric_pump_controller: A320BlueElectricPumpController,

    yellow_electric_pump: ElectricPump,
    yellow_electric_pump_controller: A320YellowElectricPumpController,

    forward_cargo_door: Door,
    aft_cargo_door: Door,
    pushback_tug: PushbackTug,

    ram_air_turbine: RamAirTurbine,
    ram_air_turbine_controller: A320RamAirTurbineController,

    power_transfer_unit: PowerTransferUnit,
    power_transfer_unit_controller: A320PowerTransferUnitController,

    braking_circuit_norm: BrakeCircuit,
    braking_circuit_altn: BrakeCircuit,
    braking_force: A320BrakingForce,

    total_sim_time_elapsed: Duration,
    lag_time_accumulator: Duration,
}
impl A320Hydraulic {
    const BLUE_ELEC_PUMP_CONTROL_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;
    const BLUE_ELEC_PUMP_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrent(1);

    const YELLOW_ELEC_PUMP_CONTROL_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrent(2);
    const YELLOW_ELEC_PUMP_CONTROL_FROM_CARGO_DOOR_OPERATION_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentGndFltService;
    const YELLOW_ELEC_PUMP_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrentGndFltService;

    const YELLOW_EDP_CONTROL_POWER_BUS1: ElectricalBusType = ElectricalBusType::DirectCurrent(2);
    const YELLOW_EDP_CONTROL_POWER_BUS2: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;
    const GREEN_EDP_CONTROL_POWER_BUS1: ElectricalBusType =
        ElectricalBusType::DirectCurrentEssential;

    const PTU_CONTROL_POWER_BUS: ElectricalBusType = ElectricalBusType::DirectCurrentGndFltService;

    const RAT_CONTROL_SOLENOID1_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentHot(1);
    const RAT_CONTROL_SOLENOID2_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentHot(2);

    const MIN_PRESS_EDP_SECTION_LO_HYST: f64 = 1740.0;
    const MIN_PRESS_EDP_SECTION_HI_HYST: f64 = 2200.0;
    const MIN_PRESS_PRESSURISED_LO_HYST: f64 = 1450.0;
    const MIN_PRESS_PRESSURISED_HI_HYST: f64 = 1750.0;

    // Refresh rate of hydraulic simulation
    const HYDRAULIC_SIM_TIME_STEP_MILLISECONDS: u64 = 100;
    // Refresh rate of actuators as multiplier of hydraulics. 2 means double frequency update.
    const ACTUATORS_SIM_TIME_STEP_MULTIPLIER: u32 = 2;

    pub(super) fn new() -> A320Hydraulic {
        A320Hydraulic {
            hyd_brake_logic: A320HydraulicBrakingLogic::new(),

            blue_loop: HydraulicLoop::new(
                "BLUE",
                false,
                false,
                Volume::new::<gallon>(15.8),
                Volume::new::<gallon>(15.85),
                Volume::new::<gallon>(8.0),
                Volume::new::<gallon>(1.56),
                Fluid::new(Pressure::new::<pascal>(1450000000.0)),
                false,
                Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
                Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            ),
            blue_loop_controller: A320HydraulicLoopController::new(None),
            green_loop: HydraulicLoop::new(
                "GREEN",
                true,
                false,
                Volume::new::<gallon>(26.38),
                Volume::new::<gallon>(26.41),
                Volume::new::<gallon>(15.),
                Volume::new::<gallon>(3.6),
                Fluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
                Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
                Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            ),
            green_loop_controller: A320HydraulicLoopController::new(Some(1)),
            yellow_loop: HydraulicLoop::new(
                "YELLOW",
                false,
                true,
                Volume::new::<gallon>(19.81),
                Volume::new::<gallon>(19.81),
                Volume::new::<gallon>(10.0),
                Volume::new::<gallon>(3.6),
                Fluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
                Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
                Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            ),
            yellow_loop_controller: A320HydraulicLoopController::new(Some(2)),

            engine_driven_pump_1_pressure_switch: PressureSwitch::new(
                Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_HI_HYST),
                Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_LO_HYST),
            ),
            engine_driven_pump_1: EngineDrivenPump::new("GREEN"),
            engine_driven_pump_1_controller: A320EngineDrivenPumpController::new(
                1,
                vec![Self::GREEN_EDP_CONTROL_POWER_BUS1],
            ),

            engine_driven_pump_2_pressure_switch: PressureSwitch::new(
                Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_HI_HYST),
                Pressure::new::<psi>(Self::MIN_PRESS_EDP_SECTION_LO_HYST),
            ),
            engine_driven_pump_2: EngineDrivenPump::new("YELLOW"),
            engine_driven_pump_2_controller: A320EngineDrivenPumpController::new(
                2,
                vec![
                    Self::YELLOW_EDP_CONTROL_POWER_BUS1,
                    Self::YELLOW_EDP_CONTROL_POWER_BUS2,
                ],
            ),

            blue_electric_pump: ElectricPump::new("BLUE", Self::BLUE_ELEC_PUMP_SUPPLY_POWER_BUS),
            blue_electric_pump_controller: A320BlueElectricPumpController::new(
                Self::BLUE_ELEC_PUMP_CONTROL_POWER_BUS,
            ),

            yellow_electric_pump: ElectricPump::new(
                "YELLOW",
                Self::YELLOW_ELEC_PUMP_SUPPLY_POWER_BUS,
            ),
            yellow_electric_pump_controller: A320YellowElectricPumpController::new(
                Self::YELLOW_ELEC_PUMP_CONTROL_POWER_BUS,
                Self::YELLOW_ELEC_PUMP_CONTROL_FROM_CARGO_DOOR_OPERATION_POWER_BUS,
            ),

            forward_cargo_door: Door::new(5),
            aft_cargo_door: Door::new(3),
            pushback_tug: PushbackTug::new(),

            ram_air_turbine: RamAirTurbine::new(),
            ram_air_turbine_controller: A320RamAirTurbineController::new(
                Self::RAT_CONTROL_SOLENOID1_POWER_BUS,
                Self::RAT_CONTROL_SOLENOID2_POWER_BUS,
            ),

            power_transfer_unit: PowerTransferUnit::new(),
            power_transfer_unit_controller: A320PowerTransferUnitController::new(
                Self::PTU_CONTROL_POWER_BUS,
            ),

            braking_circuit_norm: BrakeCircuit::new(
                "NORM",
                Volume::new::<gallon>(0.),
                Volume::new::<gallon>(0.),
                Volume::new::<gallon>(0.13),
            ),

            braking_circuit_altn: BrakeCircuit::new(
                "ALTN",
                Volume::new::<gallon>(1.5),
                Volume::new::<gallon>(0.5),
                Volume::new::<gallon>(0.13),
            ),

            braking_force: A320BrakingForce::new(),

            total_sim_time_elapsed: Duration::new(0, 0),
            lag_time_accumulator: Duration::new(0, 0),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub(super) fn update<T: Engine, U: EngineFirePushButtons>(
        &mut self,
        context: &UpdateContext,
        engine1: &T,
        engine2: &T,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_push_buttons: &U,
        landing_gear: &LandingGear,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        emergency_elec_state: &impl EmergencyElectricalState,
    ) {
        let min_hyd_loop_timestep =
            Duration::from_millis(Self::HYDRAULIC_SIM_TIME_STEP_MILLISECONDS);

        self.total_sim_time_elapsed += context.delta();

        // Time to catch up in our simulation = new delta + time not updated last iteration
        let time_to_catch = context.delta() + self.lag_time_accumulator;

        // Number of time steps (with floating part) to do according to required time step
        let number_of_steps_floating_point =
            time_to_catch.as_secs_f64() / min_hyd_loop_timestep.as_secs_f64();

        // Here we update everything requiring same refresh as the sim calls us, more likely visual stuff
        self.update_every_frame(
            &context,
            &overhead_panel,
            rat_and_emer_gen_man_on,
            emergency_elec_state,
        );

        if number_of_steps_floating_point < 1.0 {
            // Can't do a full time step
            // we can decide either do an update with smaller step or wait next iteration
            // for now we only update lag accumulator and chose a hard fixed step: if smaller
            // than chosen time step we do nothing and wait next iteration

            // Time lag is float part only of num of steps (because is < 1.0 here) * fixed time step to get a result in time
            self.lag_time_accumulator = Duration::from_secs_f64(
                number_of_steps_floating_point * min_hyd_loop_timestep.as_secs_f64(),
            );
        } else {
            // Int part is the actual number of loops to do
            // rest of floating part goes into accumulator
            let num_of_update_loops = number_of_steps_floating_point.floor() as u32;

            self.lag_time_accumulator = Duration::from_secs_f64(
                (number_of_steps_floating_point - (num_of_update_loops as f64))
                    * min_hyd_loop_timestep.as_secs_f64(),
            ); // Keep track of time left after all fixed loop are done

            // Then run fixed update loop for main hydraulics
            for _ in 0..num_of_update_loops {
                // First update what is currently consumed and given back by each actuator
                // Todo: might have to split the actuator volumes by expected number of loops
                self.update_actuators_volume();

                self.update_fixed_step(
                    &context.with_delta(min_hyd_loop_timestep),
                    engine1,
                    engine2,
                    overhead_panel,
                    engine_fire_push_buttons,
                    landing_gear,
                );
            }

            // This is the "fast" update loop refreshing ACTUATORS_SIM_TIME_STEP_MULT times faster
            // here put everything that needs higher simulation rates like physics solving
            let num_of_actuators_update_loops =
                num_of_update_loops * Self::ACTUATORS_SIM_TIME_STEP_MULTIPLIER;

            // If X times faster we divide step by X
            let delta_time_physics =
                min_hyd_loop_timestep / Self::ACTUATORS_SIM_TIME_STEP_MULTIPLIER;
            for _ in 0..num_of_actuators_update_loops {
                self.update_fast_rate(&context, &delta_time_physics);
            }
        }
    }

    fn green_edp_has_low_press_fault(&self) -> bool {
        self.engine_driven_pump_1_controller
            .has_pressure_low_fault()
    }

    fn yellow_epump_has_low_press_fault(&self) -> bool {
        self.yellow_electric_pump_controller
            .has_pressure_low_fault()
    }

    fn yellow_edp_has_low_press_fault(&self) -> bool {
        self.engine_driven_pump_2_controller
            .has_pressure_low_fault()
    }

    fn blue_epump_has_fault(&self) -> bool {
        self.blue_electric_pump_controller.has_pressure_low_fault()
    }

    #[cfg(test)]
    fn should_pressurise_yellow_pump_for_cargo_door_operation(&self) -> bool {
        self.yellow_electric_pump_controller
            .should_pressurise_for_cargo_door_operation()
    }

    #[cfg(test)]
    fn nose_wheel_steering_pin_is_inserted(&self) -> bool {
        self.power_transfer_unit_controller
            .nose_wheel_steering_pin_is_inserted()
    }

    fn is_blue_pressurised(&self) -> bool {
        self.blue_loop.is_pressurised()
    }

    #[cfg(test)]
    fn is_green_pressurised(&self) -> bool {
        self.green_loop.is_pressurised()
    }

    #[cfg(test)]
    fn is_yellow_pressurised(&self) -> bool {
        self.yellow_loop.is_pressurised()
    }

    // Update with same refresh rate as the sim
    fn update_every_frame(
        &mut self,
        context: &UpdateContext,
        overhead_panel: &A320HydraulicOverheadPanel,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        emergency_elec_state: &impl EmergencyElectricalState,
    ) {
        // Updating rat stowed pos on all frames in case it's used for graphics
        self.ram_air_turbine.update_position(&context.delta());

        // Uses external conditions and momentary button: better to check each frame
        self.ram_air_turbine_controller.update(
            &overhead_panel,
            rat_and_emer_gen_man_on,
            emergency_elec_state,
        );

        // Tug has its angle changing on each frame and we'd like to detect this
        self.pushback_tug.update();

        self.braking_force
            .update_forces(&self.braking_circuit_norm, &self.braking_circuit_altn);
    }

    // All the higher frequency updates like physics
    fn update_fast_rate(&mut self, context: &UpdateContext, delta_time_physics: &Duration) {
        self.ram_air_turbine
            .update_physics(&delta_time_physics, &context.indicated_airspeed());
    }

    // For each hydraulic loop retrieves volumes from and to each actuator and pass it to the loops
    fn update_actuators_volume(&mut self) {
        self.update_green_actuators_volume();
        self.update_yellow_actuators_volume();
        self.update_blue_actuators_volume();
    }

    fn update_green_actuators_volume(&mut self) {
        self.green_loop
            .update_actuator_volumes(&self.braking_circuit_norm);
        self.braking_circuit_norm.reset_accumulators();
    }

    fn update_yellow_actuators_volume(&mut self) {
        self.yellow_loop
            .update_actuator_volumes(&self.braking_circuit_altn);
        self.braking_circuit_altn.reset_accumulators();
    }

    fn update_blue_actuators_volume(&mut self) {}

    // All the core hydraulics updates that needs to be done at the slowest fixed step rate
    fn update_fixed_step<T: Engine, U: EngineFirePushButtons>(
        &mut self,
        context: &UpdateContext,
        engine1: &T,
        engine2: &T,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_push_buttons: &U,
        landing_gear: &LandingGear,
    ) {
        // Process brake logic (which circuit brakes) and send brake demands (how much)
        self.hyd_brake_logic.update_brake_demands(
            context,
            &self.green_loop,
            &self.braking_circuit_altn,
            &landing_gear,
        );
        self.hyd_brake_logic.update_brake_pressure_limitation(
            &mut self.braking_circuit_norm,
            &mut self.braking_circuit_altn,
        );
        self.hyd_brake_logic.send_brake_demands(
            &mut self.braking_circuit_norm,
            &mut self.braking_circuit_altn,
        );

        self.power_transfer_unit_controller.update(
            context,
            overhead_panel,
            &self.forward_cargo_door,
            &self.aft_cargo_door,
            &self.pushback_tug,
        );
        self.power_transfer_unit.update(
            &self.green_loop,
            &self.yellow_loop,
            &self.power_transfer_unit_controller,
        );

        self.engine_driven_pump_1_pressure_switch
            .update(self.green_loop.pressure());
        self.engine_driven_pump_1_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engine1.corrected_n2(),
            engine1.oil_pressure(),
            self.engine_driven_pump_1_pressure_switch.is_pressurised(),
        );

        self.engine_driven_pump_1.update(
            context,
            &self.green_loop,
            engine1
                .hydraulic_pump_output_speed()
                .get::<revolution_per_minute>(),
            &self.engine_driven_pump_1_controller,
        );

        self.engine_driven_pump_2_pressure_switch
            .update(self.yellow_loop.pressure());
        self.engine_driven_pump_2_controller.update(
            overhead_panel,
            engine_fire_push_buttons,
            engine2.corrected_n2(),
            engine2.oil_pressure(),
            self.engine_driven_pump_2_pressure_switch.is_pressurised(),
        );

        self.engine_driven_pump_2.update(
            context,
            &self.yellow_loop,
            engine2
                .hydraulic_pump_output_speed()
                .get::<revolution_per_minute>(),
            &self.engine_driven_pump_2_controller,
        );

        self.blue_electric_pump_controller.update(
            overhead_panel,
            self.blue_loop.is_pressurised(),
            engine1.oil_pressure(),
            engine2.oil_pressure(),
            engine1.is_above_minimum_idle(),
            engine2.is_above_minimum_idle(),
        );
        self.blue_electric_pump.update(
            context,
            &self.blue_loop,
            &self.blue_electric_pump_controller,
        );

        self.yellow_electric_pump_controller.update(
            context,
            overhead_panel,
            &self.forward_cargo_door,
            &self.aft_cargo_door,
            self.yellow_loop.is_pressurised(),
        );
        self.yellow_electric_pump.update(
            context,
            &self.yellow_loop,
            &self.yellow_electric_pump_controller,
        );

        self.ram_air_turbine
            .update(context, &self.blue_loop, &self.ram_air_turbine_controller);

        self.green_loop_controller.update(engine_fire_push_buttons);
        self.green_loop.update(
            context,
            Vec::new(),
            vec![&self.engine_driven_pump_1],
            Vec::new(),
            vec![&self.power_transfer_unit],
            &self.green_loop_controller,
        );

        self.yellow_loop_controller.update(engine_fire_push_buttons);
        self.yellow_loop.update(
            context,
            vec![&self.yellow_electric_pump],
            vec![&self.engine_driven_pump_2],
            Vec::new(),
            vec![&self.power_transfer_unit],
            &self.yellow_loop_controller,
        );

        self.blue_loop_controller.update(engine_fire_push_buttons);
        self.blue_loop.update(
            context,
            vec![&self.blue_electric_pump],
            Vec::new(),
            vec![&self.ram_air_turbine],
            Vec::new(),
            &self.blue_loop_controller,
        );

        self.braking_circuit_norm.update(context, &self.green_loop);
        self.braking_circuit_altn.update(context, &self.yellow_loop);
    }
}
impl RamAirTurbineHydraulicLoopPressurised for A320Hydraulic {
    fn is_rat_hydraulic_loop_pressurised(&self) -> bool {
        self.is_blue_pressurised()
    }
}
impl SimulationElement for A320Hydraulic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.engine_driven_pump_1.accept(visitor);
        self.engine_driven_pump_1_controller.accept(visitor);

        self.engine_driven_pump_2.accept(visitor);
        self.engine_driven_pump_2_controller.accept(visitor);

        self.blue_electric_pump.accept(visitor);
        self.blue_electric_pump_controller.accept(visitor);

        self.yellow_electric_pump.accept(visitor);
        self.yellow_electric_pump_controller.accept(visitor);

        self.forward_cargo_door.accept(visitor);
        self.aft_cargo_door.accept(visitor);
        self.pushback_tug.accept(visitor);

        self.ram_air_turbine.accept(visitor);
        self.ram_air_turbine_controller.accept(visitor);

        self.power_transfer_unit.accept(visitor);
        self.power_transfer_unit_controller.accept(visitor);

        self.blue_loop.accept(visitor);
        self.green_loop.accept(visitor);
        self.yellow_loop.accept(visitor);

        self.hyd_brake_logic.accept(visitor);

        self.braking_circuit_norm.accept(visitor);
        self.braking_circuit_altn.accept(visitor);
        self.braking_force.accept(visitor);

        visitor.visit(self);
    }
}

struct A320HydraulicLoopController {
    engine_number: Option<usize>,
    should_open_fire_shutoff_valve: bool,
}
impl A320HydraulicLoopController {
    fn new(engine_number: Option<usize>) -> Self {
        Self {
            engine_number,
            should_open_fire_shutoff_valve: true,
        }
    }

    fn update<T: EngineFirePushButtons>(&mut self, engine_fire_push_buttons: &T) {
        if let Some(eng_number) = self.engine_number {
            self.should_open_fire_shutoff_valve = !engine_fire_push_buttons.is_released(eng_number);
        }
    }
}
impl HydraulicLoopController for A320HydraulicLoopController {
    fn should_open_fire_shutoff_valve(&self) -> bool {
        self.should_open_fire_shutoff_valve
    }
}

struct A320EngineDrivenPumpController {
    is_powered: bool,
    powered_by: Vec<ElectricalBusType>,
    engine_number: usize,
    engine_master_on_id: String,
    engine_master_on: bool,
    weight_on_wheels: bool,
    should_pressurise: bool,
    has_pressure_low_fault: bool,
    is_pressure_low: bool,
}
impl A320EngineDrivenPumpController {
    const MIN_ENGINE_OIL_PRESS_THRESHOLD_TO_INHIBIT_FAULT: f64 = 18.;

    fn new(engine_number: usize, powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            is_powered: false,
            powered_by,
            engine_number,
            engine_master_on_id: format!("GENERAL ENG STARTER ACTIVE:{}", engine_number),
            engine_master_on: false,
            weight_on_wheels: true,
            should_pressurise: true,
            has_pressure_low_fault: false,
            is_pressure_low: true,
        }
    }

    fn update_low_pressure_state(
        &mut self,
        engine_n2: Ratio,
        engine_oil_pressure: Pressure,
        pressure_switch_state: bool,
    ) {
        // Faking edp section pressure low level as if engine is slow we shouldn't have pressure
        let faked_is_edp_section_low_pressure = engine_n2.get::<percent>() < 5.;

        // Engine off state uses oil pressure threshold (treshold is 18psi)
        let is_engine_low_oil_pressure = engine_oil_pressure.get::<psi>()
            < Self::MIN_ENGINE_OIL_PRESS_THRESHOLD_TO_INHIBIT_FAULT;

        // TODO when edp section pressure is modeled we can remove fake low press and use dedicated pressure switch
        self.is_pressure_low = self.should_pressurise()
            && (!pressure_switch_state || faked_is_edp_section_low_pressure);

        // Fault inhibited if on ground AND engine oil pressure is low (11KS1 elec relay)
        self.has_pressure_low_fault =
            self.is_pressure_low && (!is_engine_low_oil_pressure || !self.weight_on_wheels);
    }

    fn update<T: EngineFirePushButtons>(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_push_buttons: &T,
        engine_n2: Ratio,
        engine_oil_pressure: Pressure,
        pressure_switch_state: bool,
    ) {
        let mut should_pressurise_if_powered = false;
        if overhead_panel.edp_push_button_is_auto(self.engine_number)
            && !engine_fire_push_buttons.is_released(self.engine_number)
        {
            should_pressurise_if_powered = true;
        } else if overhead_panel.edp_push_button_is_off(self.engine_number)
            || engine_fire_push_buttons.is_released(self.engine_number)
        {
            should_pressurise_if_powered = false;
        }

        // Inverted logic, no power means solenoid valve always leave pump in pressurise mode
        self.should_pressurise = !self.is_powered || should_pressurise_if_powered;

        self.update_low_pressure_state(engine_n2, engine_oil_pressure, pressure_switch_state);
    }

    fn has_pressure_low_fault(&self) -> bool {
        self.has_pressure_low_fault
    }
}
impl PumpController for A320EngineDrivenPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}
impl SimulationElement for A320EngineDrivenPumpController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.engine_master_on = reader.read(&self.engine_master_on_id);
        self.weight_on_wheels = reader.read("SIM ON GROUND");
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.engine_number == 1 {
            writer.write("HYD_GREEN_EDPUMP_LOW_PRESS", self.is_pressure_low);
        } else if self.engine_number == 2 {
            writer.write("HYD_YELLOW_EDPUMP_LOW_PRESS", self.is_pressure_low);
        } else {
            panic!("The A320 only supports two engines.");
        }
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.any_is_powered(&self.powered_by);
    }
}

struct A320BlueElectricPumpController {
    is_powered: bool,
    powered_by: ElectricalBusType,
    should_pressurise: bool,
    has_pressure_low_fault: bool,
    is_pressure_low: bool,
    weight_on_wheels: bool,
}
impl A320BlueElectricPumpController {
    const MIN_ENGINE_OIL_PRESS_THRESHOLD_TO_INHIBIT_FAULT: f64 = 18.;

    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            is_powered: false,
            powered_by,
            should_pressurise: false,
            has_pressure_low_fault: false,
            is_pressure_low: true,
            weight_on_wheels: true,
        }
    }

    fn update(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        pressure_switch_state: bool,
        engine1_oil_pressure: Pressure,
        engine2_oil_pressure: Pressure,
        engine1_above_min_idle: bool,
        engine2_above_min_idle: bool,
    ) {
        let mut should_pressurise_if_powered = false;
        if overhead_panel.blue_epump_push_button.is_auto() {
            if !self.weight_on_wheels
                || engine1_above_min_idle
                || engine2_above_min_idle
                || overhead_panel.blue_epump_override_push_button_is_on()
            {
                should_pressurise_if_powered = true;
            } else {
                should_pressurise_if_powered = false;
            }
        } else if overhead_panel.blue_epump_push_button_is_off() {
            should_pressurise_if_powered = false;
        }

        self.should_pressurise = self.is_powered && should_pressurise_if_powered;

        self.update_low_pressure_state(
            overhead_panel,
            pressure_switch_state,
            engine1_oil_pressure,
            engine2_oil_pressure,
        );
    }

    fn update_low_pressure_state(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        pressure_switch_state: bool,
        engine1_oil_pressure: Pressure,
        engine2_oil_pressure: Pressure,
    ) {
        // Low engine oil pressure inhibits fault under 18psi level
        let is_engine_low_oil_pressure = engine1_oil_pressure.get::<psi>()
            < Self::MIN_ENGINE_OIL_PRESS_THRESHOLD_TO_INHIBIT_FAULT
            && engine2_oil_pressure.get::<psi>()
                < Self::MIN_ENGINE_OIL_PRESS_THRESHOLD_TO_INHIBIT_FAULT;

        self.is_pressure_low = self.should_pressurise() && !pressure_switch_state;

        self.has_pressure_low_fault = self.is_pressure_low
            && ((!is_engine_low_oil_pressure || !self.weight_on_wheels)
                || overhead_panel.blue_epump_override_push_button_is_on());
    }

    fn has_pressure_low_fault(&self) -> bool {
        self.has_pressure_low_fault
    }
}

impl PumpController for A320BlueElectricPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}

impl SimulationElement for A320BlueElectricPumpController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.weight_on_wheels = reader.read("SIM ON GROUND");
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("HYD_BLUE_EPUMP_LOW_PRESS", self.is_pressure_low);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.bus_is_powered(self.powered_by);
    }
}

struct A320YellowElectricPumpController {
    is_powered: bool,
    powered_by: ElectricalBusType,
    powered_by_when_cargo_door_operation: ElectricalBusType,
    should_pressurise: bool,
    has_pressure_low_fault: bool,
    is_pressure_low: bool,
    should_activate_yellow_pump_for_cargo_door_operation: DelayedFalseLogicGate,
}
impl A320YellowElectricPumpController {
    const DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION: Duration =
        Duration::from_secs(20);

    fn new(
        powered_by: ElectricalBusType,
        powered_by_when_cargo_door_operation: ElectricalBusType,
    ) -> Self {
        Self {
            is_powered: false,
            powered_by,
            powered_by_when_cargo_door_operation,
            should_pressurise: false,
            has_pressure_low_fault: false,
            is_pressure_low: true,
            should_activate_yellow_pump_for_cargo_door_operation: DelayedFalseLogicGate::new(
                Self::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION,
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead_panel: &A320HydraulicOverheadPanel,
        forward_cargo_door: &Door,
        aft_cargo_door: &Door,
        pressure_switch_state: bool,
    ) {
        self.should_activate_yellow_pump_for_cargo_door_operation
            .update(
                context,
                forward_cargo_door.has_moved() || aft_cargo_door.has_moved(),
            );

        self.should_pressurise = (overhead_panel.yellow_epump_push_button.is_on()
            || self
                .should_activate_yellow_pump_for_cargo_door_operation
                .output())
            && self.is_powered;

        self.update_low_pressure_state(pressure_switch_state);
    }

    fn update_low_pressure_state(&mut self, pressure_switch_state: bool) {
        self.is_pressure_low = self.should_pressurise() && !pressure_switch_state;

        self.has_pressure_low_fault = self.is_pressure_low;
    }

    fn has_pressure_low_fault(&self) -> bool {
        self.has_pressure_low_fault
    }

    #[cfg(test)]
    fn should_pressurise_for_cargo_door_operation(&self) -> bool {
        self.should_activate_yellow_pump_for_cargo_door_operation
            .output()
    }
}
impl PumpController for A320YellowElectricPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}
impl SimulationElement for A320YellowElectricPumpController {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("HYD_YELLOW_EPUMP_LOW_PRESS", self.is_pressure_low);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        // Control of the pump is powered by dedicated bus OR manual operation of cargo door through another bus
        self.is_powered = buses.bus_is_powered(self.powered_by)
            || (self
                .should_activate_yellow_pump_for_cargo_door_operation
                .output()
                && buses.bus_is_powered(self.powered_by_when_cargo_door_operation))
    }
}

struct A320PowerTransferUnitController {
    is_powered: bool,
    powered_by: ElectricalBusType,
    should_enable: bool,
    should_inhibit_ptu_after_cargo_door_operation: DelayedFalseLogicGate,
    nose_wheel_steering_pin_inserted: DelayedFalseLogicGate,

    parking_brake_lever_pos: bool,
    eng_1_master_on: bool,
    eng_2_master_on: bool,
    weight_on_wheels: bool,
}
impl A320PowerTransferUnitController {
    const DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION: Duration = Duration::from_secs(40);
    const DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK: Duration =
        Duration::from_secs(15);

    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            is_powered: false,
            powered_by,
            should_enable: false,
            should_inhibit_ptu_after_cargo_door_operation: DelayedFalseLogicGate::new(
                Self::DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION,
            ),
            nose_wheel_steering_pin_inserted: DelayedFalseLogicGate::new(
                Self::DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK,
            ),

            parking_brake_lever_pos: false,
            eng_1_master_on: false,
            eng_2_master_on: false,
            weight_on_wheels: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        overhead_panel: &A320HydraulicOverheadPanel,
        forward_cargo_door: &Door,
        aft_cargo_door: &Door,
        pushback_tug: &PushbackTug,
    ) {
        self.should_inhibit_ptu_after_cargo_door_operation.update(
            context,
            forward_cargo_door.has_moved() || aft_cargo_door.has_moved(),
        );
        self.nose_wheel_steering_pin_inserted
            .update(context, pushback_tug.is_connected());

        let ptu_inhibited = self.should_inhibit_ptu_after_cargo_door_operation.output()
            && overhead_panel.yellow_epump_push_button_is_auto();

        let should_enable_if_powered = overhead_panel.ptu_push_button_is_auto()
            && (!self.weight_on_wheels
                || self.eng_1_master_on && self.eng_2_master_on
                || !self.eng_1_master_on && !self.eng_2_master_on
                || (!self.parking_brake_lever_pos
                    && !self.nose_wheel_steering_pin_inserted.output()))
            && !ptu_inhibited;

        // When there is no power, the PTU is always ON.
        self.should_enable = !self.is_powered || should_enable_if_powered;
    }

    #[cfg(test)]
    fn nose_wheel_steering_pin_is_inserted(&self) -> bool {
        self.nose_wheel_steering_pin_inserted.output()
    }
}
impl PowerTransferUnitController for A320PowerTransferUnitController {
    fn should_enable(&self) -> bool {
        self.should_enable
    }
}
impl SimulationElement for A320PowerTransferUnitController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.parking_brake_lever_pos = reader.read("PARK_BRAKE_LEVER_POS");
        self.eng_1_master_on = reader.read("GENERAL ENG STARTER ACTIVE:1");
        self.eng_2_master_on = reader.read("GENERAL ENG STARTER ACTIVE:2");
        self.weight_on_wheels = reader.read("SIM ON GROUND");
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.bus_is_powered(self.powered_by);
    }
}

struct A320RamAirTurbineController {
    is_solenoid_1_powered: bool,
    solenoid_1_bus: ElectricalBusType,

    is_solenoid_2_powered: bool,
    solenoid_2_bus: ElectricalBusType,

    should_deploy: bool,
    eng_1_master_on: bool,
    eng_2_master_on: bool,
}
impl A320RamAirTurbineController {
    fn new(solenoid_1_bus: ElectricalBusType, solenoid_2_bus: ElectricalBusType) -> Self {
        Self {
            is_solenoid_1_powered: false,
            solenoid_1_bus,

            is_solenoid_2_powered: false,
            solenoid_2_bus,

            should_deploy: false,
            eng_1_master_on: false,
            eng_2_master_on: false,
        }
    }

    fn update(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        emergency_elec_state: &impl EmergencyElectricalState,
    ) {
        let solenoid_1_should_trigger_deployment_if_powered =
            overhead_panel.rat_man_on_push_button_is_pressed();

        let solenoid_2_should_trigger_deployment_if_powered =
            emergency_elec_state.is_in_emergency_elec() || rat_and_emer_gen_man_on.is_pressed();

        self.should_deploy = (self.is_solenoid_1_powered
            && solenoid_1_should_trigger_deployment_if_powered)
            || (self.is_solenoid_2_powered && solenoid_2_should_trigger_deployment_if_powered);
    }
}
impl RamAirTurbineController for A320RamAirTurbineController {
    fn should_deploy(&self) -> bool {
        self.should_deploy
    }
}
impl SimulationElement for A320RamAirTurbineController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.eng_1_master_on = reader.read("GENERAL ENG STARTER ACTIVE:1");
        self.eng_2_master_on = reader.read("GENERAL ENG STARTER ACTIVE:2");
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_solenoid_1_powered = buses.bus_is_powered(self.solenoid_1_bus);
        self.is_solenoid_2_powered = buses.bus_is_powered(self.solenoid_2_bus);
    }
}

struct A320HydraulicBrakingLogic {
    parking_brake_demand: bool,
    weight_on_wheels: bool,
    is_gear_lever_down: bool,
    left_brake_pilot_input: f64,
    right_brake_pilot_input: f64,
    left_brake_green_output: f64,
    left_brake_yellow_output: f64,
    right_brake_green_output: f64,
    right_brake_yellow_output: f64,
    normal_brakes_available: bool,
    should_disable_auto_brake_when_retracting: DelayedTrueLogicGate,
    anti_skid_activated: bool,
    autobrakes_setting: u8,
}
/// Implements brakes computers logic
impl A320HydraulicBrakingLogic {
    // Minimum pressure hysteresis on green until main switched on ALTN brakes
    // Feedback by Cpt. Chaos — 25/04/2021 #pilot-feedback
    const MIN_PRESSURE_BRAKE_ALTN_HYST_LO: f64 = 1305.;
    const MIN_PRESSURE_BRAKE_ALTN_HYST_HI: f64 = 2176.;

    // Min pressure when parking brake enabled. Lower normal braking is allowed to use pilot input as emergency braking
    // Feedback by avteknisyan — 25/04/2021 #pilot-feedback
    const MIN_PRESSURE_PARK_BRAKE_EMERGENCY: f64 = 507.;

    const AUTOBRAKE_GEAR_RETRACTION_DURATION_S: f64 = 3.;

    fn new() -> A320HydraulicBrakingLogic {
        A320HydraulicBrakingLogic {
            // Position of parking brake lever
            parking_brake_demand: true,
            weight_on_wheels: true,
            is_gear_lever_down: true,
            left_brake_pilot_input: 0.0,
            right_brake_pilot_input: 0.0,
            // Actual command sent to left green circuit
            left_brake_green_output: 0.0,
            // Actual command sent to left yellow circuit. Init 1 as considering park brake on on init
            left_brake_yellow_output: 1.0,
            // Actual command sent to right green circuit
            right_brake_green_output: 0.0,
            // Actual command sent to right yellow circuit. Init 1 as considering park brake on on init
            right_brake_yellow_output: 1.0,
            normal_brakes_available: false,
            should_disable_auto_brake_when_retracting: DelayedTrueLogicGate::new(
                Duration::from_secs_f64(Self::AUTOBRAKE_GEAR_RETRACTION_DURATION_S),
            ),
            anti_skid_activated: true,
            autobrakes_setting: 0,
        }
    }

    fn update_normal_braking_availability(&mut self, normal_braking_loop_pressure: &Pressure) {
        if normal_braking_loop_pressure.get::<psi>() > Self::MIN_PRESSURE_BRAKE_ALTN_HYST_HI
            && (self.left_brake_pilot_input < 0.2 && self.right_brake_pilot_input < 0.2)
        {
            self.normal_brakes_available = true;
        } else if normal_braking_loop_pressure.get::<psi>() < Self::MIN_PRESSURE_BRAKE_ALTN_HYST_LO
        {
            self.normal_brakes_available = false;
        }
    }

    fn update_brake_pressure_limitation(
        &mut self,
        norm_brk: &mut BrakeCircuit,
        altn_brk: &mut BrakeCircuit,
    ) {
        let yellow_manual_braking_input = self.left_brake_pilot_input
            > self.left_brake_yellow_output + 0.2
            || self.right_brake_pilot_input > self.right_brake_yellow_output + 0.2;

        // Nominal braking from pedals is limited to 2538psi
        norm_brk.set_brake_limit_active(true);
        norm_brk.set_brake_press_limit(Pressure::new::<psi>(2538.));

        if self.parking_brake_demand {
            altn_brk.set_brake_limit_active(true);

            // If no pilot action, standard park brake pressure limit
            if !yellow_manual_braking_input {
                altn_brk.set_brake_press_limit(Pressure::new::<psi>(2103.));
            } else {
                // Else manual action limited to a higher max nominal pressure
                altn_brk.set_brake_press_limit(Pressure::new::<psi>(2538.));
            }
        } else if !self.anti_skid_activated {
            altn_brk.set_brake_press_limit(Pressure::new::<psi>(1160.));
            altn_brk.set_brake_limit_active(true);
        } else {
            // Else if any manual braking we use standard limit
            altn_brk.set_brake_press_limit(Pressure::new::<psi>(2538.));
            altn_brk.set_brake_limit_active(true);
        }
    }

    /// Updates final brake demands per hydraulic loop based on pilot pedal demands
    fn update_brake_demands(
        &mut self,
        context: &UpdateContext,
        green_loop: &HydraulicLoop,
        alternate_circuit: &BrakeCircuit,
        landing_gear: &LandingGear,
    ) {
        self.update_normal_braking_availability(&green_loop.pressure());

        let is_in_flight_gear_lever_up = !self.weight_on_wheels && !self.is_gear_lever_down;
        self.should_disable_auto_brake_when_retracting.update(
            context,
            !landing_gear.is_down_and_locked() && !self.is_gear_lever_down,
        );

        if is_in_flight_gear_lever_up {
            if self.should_disable_auto_brake_when_retracting.output() {
                self.left_brake_green_output = 0.;
                self.right_brake_green_output = 0.;
            } else {
                // Slight brake pressure to stop the spinning wheels (have no pressure data available yet, 0.2 is random one)
                self.left_brake_green_output = 0.2;
                self.right_brake_green_output = 0.2;
            }

            self.left_brake_yellow_output = 0.;
            self.right_brake_yellow_output = 0.;
        } else {
            let green_used_for_brakes = self.normal_brakes_available
                && self.anti_skid_activated
                && !self.parking_brake_demand;

            if green_used_for_brakes {
                self.left_brake_green_output = self.left_brake_pilot_input;
                self.right_brake_green_output = self.right_brake_pilot_input;
                self.left_brake_yellow_output = 0.;
                self.right_brake_yellow_output = 0.;
            } else {
                self.left_brake_green_output = 0.;
                self.right_brake_green_output = 0.;
                if !self.parking_brake_demand {
                    // Normal braking but using alternate circuit
                    self.left_brake_yellow_output = self.left_brake_pilot_input;
                    self.right_brake_yellow_output = self.right_brake_pilot_input;
                } else {
                    // Else we just use parking brake
                    self.left_brake_yellow_output = 1.;
                    self.right_brake_yellow_output = 1.;

                    // Special case: parking brake on but yellow can't provide enough brakes: green are allowed to brake for emergency
                    if alternate_circuit.left_brake_pressure().get::<psi>()
                        < Self::MIN_PRESSURE_PARK_BRAKE_EMERGENCY
                        || alternate_circuit.right_brake_pressure().get::<psi>()
                            < Self::MIN_PRESSURE_PARK_BRAKE_EMERGENCY
                    {
                        self.left_brake_green_output = self.left_brake_pilot_input;
                        self.right_brake_green_output = self.right_brake_pilot_input;
                    }
                }
            }
        }

        // Limiting final values
        self.left_brake_yellow_output = self.left_brake_yellow_output.min(1.).max(0.);
        self.right_brake_yellow_output = self.right_brake_yellow_output.min(1.).max(0.);
        self.left_brake_green_output = self.left_brake_green_output.min(1.).max(0.);
        self.right_brake_green_output = self.right_brake_green_output.min(1.).max(0.);
    }

    fn send_brake_demands(&mut self, norm: &mut BrakeCircuit, altn: &mut BrakeCircuit) {
        norm.set_brake_demand_left(self.left_brake_green_output);
        norm.set_brake_demand_right(self.right_brake_green_output);
        altn.set_brake_demand_left(self.left_brake_yellow_output);
        altn.set_brake_demand_right(self.right_brake_yellow_output);
    }
}

impl SimulationElement for A320HydraulicBrakingLogic {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.parking_brake_demand = reader.read("PARK_BRAKE_LEVER_POS");
        self.weight_on_wheels = reader.read("SIM ON GROUND");
        self.is_gear_lever_down = reader.read("GEAR HANDLE POSITION");
        self.anti_skid_activated = reader.read("ANTISKID BRAKES ACTIVE");
        self.left_brake_pilot_input = reader.read("LEFT_BRAKE_PEDAL_INPUT");
        self.right_brake_pilot_input = reader.read("RIGHT_BRAKE_PEDAL_INPUT");
        let autobrakes_setting: f64 = reader.read("AUTOBRAKES SETTING");
        self.autobrakes_setting = autobrakes_setting.floor() as u8;
    }
}

struct A320BrakingForce {
    left_braking_force: f64,
    right_braking_force: f64,

    park_brake_lever_is_set: bool,
}
impl A320BrakingForce {
    const REFERENCE_PRESSURE_FOR_MAX_FORCE: f64 = 2000.;

    pub fn new() -> Self {
        A320BrakingForce {
            left_braking_force: 0.,
            right_braking_force: 0.,

            park_brake_lever_is_set: true,
        }
    }

    pub fn update_forces(&mut self, norm_brakes: &BrakeCircuit, altn_brakes: &BrakeCircuit) {
        let left_force_norm =
            norm_brakes.left_brake_pressure().get::<psi>() / Self::REFERENCE_PRESSURE_FOR_MAX_FORCE;
        let left_force_altn =
            altn_brakes.left_brake_pressure().get::<psi>() / Self::REFERENCE_PRESSURE_FOR_MAX_FORCE;
        self.left_braking_force = left_force_norm + left_force_altn;
        self.left_braking_force = self.left_braking_force.max(0.).min(1.);

        let right_force_norm = norm_brakes.right_brake_pressure().get::<psi>()
            / Self::REFERENCE_PRESSURE_FOR_MAX_FORCE;
        let right_force_altn = altn_brakes.right_brake_pressure().get::<psi>()
            / Self::REFERENCE_PRESSURE_FOR_MAX_FORCE;
        self.right_braking_force = right_force_norm + right_force_altn;
        self.right_braking_force = self.right_braking_force.max(0.).min(1.);
    }
}

impl SimulationElement for A320BrakingForce {
    fn write(&self, writer: &mut SimulatorWriter) {
        // BRAKE XXXX FORCE FACTOR is the actual braking force we want the plane to generate in the simulator
        writer.write("BRAKE LEFT FORCE FACTOR", self.left_braking_force);
        writer.write("BRAKE RIGHT FORCE FACTOR", self.right_braking_force);
    }

    // We receive here the desired parking brake position. This is the parking brake lever input
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.park_brake_lever_is_set = reader.read("PARK_BRAKE_LEVER_POS");
    }
}

struct Door {
    exit_id: String,
    position: f64,
    previous_position: f64,
}
impl Door {
    fn new(id: usize) -> Self {
        Self {
            exit_id: format!("EXIT OPEN:{}", id),
            position: 0.,
            previous_position: 0.,
        }
    }

    fn has_moved(&self) -> bool {
        (self.position - self.previous_position).abs() > f64::EPSILON
    }
}
impl SimulationElement for Door {
    fn read(&mut self, state: &mut SimulatorReader) {
        self.previous_position = self.position;
        self.position = state.read(&self.exit_id);
    }
}

struct PushbackTug {
    angle: f64,
    previous_angle: f64,
    // Type of pushback:
    // 0 = Straight
    // 1 = Left
    // 2 = Right
    // 3 = Assumed to be no pushback
    // 4 = might be finishing pushback, to confirm
    state: f64,
    is_connected_to_nose_gear: bool,
}
impl PushbackTug {
    const STATE_NO_PUSHBACK: f64 = 3.;

    fn new() -> Self {
        Self {
            angle: 0.,
            previous_angle: 0.,
            state: Self::STATE_NO_PUSHBACK,
            is_connected_to_nose_gear: false,
        }
    }

    fn update(&mut self) {
        if self.is_pushing() {
            self.is_connected_to_nose_gear = true;
        } else if (self.state - PushbackTug::STATE_NO_PUSHBACK).abs() <= f64::EPSILON {
            self.is_connected_to_nose_gear = false;
        }
    }

    fn is_connected(&self) -> bool {
        self.is_connected_to_nose_gear
    }

    fn is_pushing(&self) -> bool {
        // The angle keeps changing while pushing or is frozen high on high angle manoeuvering.
        (self.angle - self.previous_angle).abs() > f64::EPSILON
            && (self.state - PushbackTug::STATE_NO_PUSHBACK).abs() > f64::EPSILON
    }
}
impl SimulationElement for PushbackTug {
    fn read(&mut self, state: &mut SimulatorReader) {
        self.previous_angle = self.angle;
        self.angle = state.read("PUSHBACK ANGLE");
        self.state = state.read("PUSHBACK STATE");
    }
}

pub(super) struct A320HydraulicOverheadPanel {
    edp1_push_button: AutoOffFaultPushButton,
    edp2_push_button: AutoOffFaultPushButton,
    blue_epump_push_button: AutoOffFaultPushButton,
    ptu_push_button: AutoOffFaultPushButton,
    rat_push_button: MomentaryPushButton,
    yellow_epump_push_button: AutoOnFaultPushButton,
    blue_epump_override_push_button: OnOffFaultPushButton,
}
impl A320HydraulicOverheadPanel {
    pub(super) fn new() -> A320HydraulicOverheadPanel {
        A320HydraulicOverheadPanel {
            edp1_push_button: AutoOffFaultPushButton::new_auto("HYD_ENG_1_PUMP"),
            edp2_push_button: AutoOffFaultPushButton::new_auto("HYD_ENG_2_PUMP"),
            blue_epump_push_button: AutoOffFaultPushButton::new_auto("HYD_EPUMPB"),
            ptu_push_button: AutoOffFaultPushButton::new_auto("HYD_PTU"),
            rat_push_button: MomentaryPushButton::new("HYD_RAT_MAN_ON"),
            yellow_epump_push_button: AutoOnFaultPushButton::new_auto("HYD_EPUMPY"),
            blue_epump_override_push_button: OnOffFaultPushButton::new_off("HYD_EPUMPY_OVRD"),
        }
    }

    pub(super) fn update(&mut self, hyd: &A320Hydraulic) {
        self.edp1_push_button
            .set_fault(hyd.green_edp_has_low_press_fault());
        self.edp2_push_button
            .set_fault(hyd.yellow_edp_has_low_press_fault());
        self.blue_epump_push_button
            .set_fault(hyd.blue_epump_has_fault());
        self.yellow_epump_push_button
            .set_fault(hyd.yellow_epump_has_low_press_fault());
    }

    fn yellow_epump_push_button_is_auto(&self) -> bool {
        self.yellow_epump_push_button.is_auto()
    }

    fn ptu_push_button_is_auto(&self) -> bool {
        self.ptu_push_button.is_auto()
    }

    fn edp_push_button_is_auto(&self, number: usize) -> bool {
        match number {
            1 => self.edp1_push_button.is_auto(),
            2 => self.edp2_push_button.is_auto(),
            _ => panic!("The A320 only supports two engines."),
        }
    }

    fn edp_push_button_is_off(&self, number: usize) -> bool {
        match number {
            1 => self.edp1_push_button.is_off(),
            2 => self.edp2_push_button.is_off(),
            _ => panic!("The A320 only supports two engines."),
        }
    }

    fn blue_epump_override_push_button_is_on(&self) -> bool {
        self.blue_epump_override_push_button.is_on()
    }

    fn blue_epump_push_button_is_off(&self) -> bool {
        self.blue_epump_push_button.is_off()
    }

    fn rat_man_on_push_button_is_pressed(&self) -> bool {
        self.rat_push_button.is_pressed()
    }
}
impl SimulationElement for A320HydraulicOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.edp1_push_button.accept(visitor);
        self.edp2_push_button.accept(visitor);
        self.blue_epump_push_button.accept(visitor);
        self.ptu_push_button.accept(visitor);
        self.rat_push_button.accept(visitor);
        self.yellow_epump_push_button.accept(visitor);
        self.blue_epump_override_push_button.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::Rng;

    mod a320_hydraulics {
        use super::*;
        use systems::electrical::test::TestElectricitySource;
        use systems::electrical::ElectricalBus;
        use systems::electrical::Electricity;
        use systems::engine::{leap_engine::LeapEngine, EngineFireOverheadPanel};
        use systems::shared::EmergencyElectricalState;
        use systems::shared::PotentialOrigin;
        use systems::simulation::{test::SimulationTestBed, Aircraft};
        use uom::si::{
            acceleration::foot_per_second_squared, length::foot, ratio::percent,
            thermodynamic_temperature::degree_celsius, velocity::knot,
        };

        struct A320TestEmergencyElectricalOverheadPanel {
            rat_and_emer_gen_man_on: MomentaryPushButton,
        }

        impl A320TestEmergencyElectricalOverheadPanel {
            pub fn new() -> Self {
                A320TestEmergencyElectricalOverheadPanel {
                    rat_and_emer_gen_man_on: MomentaryPushButton::new("EMER_ELEC_RAT_AND_EMER_GEN"),
                }
            }
        }
        impl SimulationElement for A320TestEmergencyElectricalOverheadPanel {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.rat_and_emer_gen_man_on.accept(visitor);

                visitor.visit(self);
            }
        }
        impl EmergencyElectricalRatPushButton for A320TestEmergencyElectricalOverheadPanel {
            fn is_pressed(&self) -> bool {
                self.rat_and_emer_gen_man_on.is_pressed()
            }
        }

        struct A320TestElectrical {
            airspeed: Velocity,
            all_ac_lost: bool,
        }
        impl A320TestElectrical {
            pub fn new() -> Self {
                A320TestElectrical {
                    airspeed: Velocity::new::<knot>(100.),
                    all_ac_lost: false,
                }
            }

            fn update(&mut self, context: &UpdateContext) {
                self.airspeed = context.indicated_airspeed();
            }
        }
        impl EmergencyElectricalState for A320TestElectrical {
            fn is_in_emergency_elec(&self) -> bool {
                self.all_ac_lost && self.airspeed >= Velocity::new::<knot>(100.)
            }
        }
        impl SimulationElement for A320TestElectrical {
            fn receive_power(&mut self, buses: &impl ElectricalBuses) {
                self.all_ac_lost = !buses.bus_is_powered(ElectricalBusType::AlternatingCurrent(1))
                    && !buses.bus_is_powered(ElectricalBusType::AlternatingCurrent(2));
            }
        }
        struct A320HydraulicsTestAircraft {
            engine_1: LeapEngine,
            engine_2: LeapEngine,
            hydraulics: A320Hydraulic,
            overhead: A320HydraulicOverheadPanel,
            emergency_electrical_overhead: A320TestEmergencyElectricalOverheadPanel,
            engine_fire_overhead: EngineFireOverheadPanel,
            landing_gear: LandingGear,
            electrical: A320TestElectrical,

            powered_source: TestElectricitySource,
            ac_ground_service_bus: ElectricalBus,
            dc_ground_service_bus: ElectricalBus,
            ac_1_bus: ElectricalBus,
            ac_2_bus: ElectricalBus,
            dc_1_bus: ElectricalBus,
            dc_2_bus: ElectricalBus,
            dc_ess_bus: ElectricalBus,
            dc_hot_1_bus: ElectricalBus,
            dc_hot_2_bus: ElectricalBus,

            // Electric buses states to be able to kill them dynamically
            is_ac_ground_service_powered: bool,
            is_dc_ground_service_powered: bool,
            is_ac_1_powered: bool,
            is_ac_2_powered: bool,
            is_dc_1_powered: bool,
            is_dc_2_powered: bool,
            is_dc_ess_powered: bool,
            is_dc_hot_1_powered: bool,
            is_dc_hot_2_powered: bool,
        }
        impl A320HydraulicsTestAircraft {
            fn new(electricity: &mut Electricity) -> Self {
                Self {
                    engine_1: LeapEngine::new(1),
                    engine_2: LeapEngine::new(2),
                    hydraulics: A320Hydraulic::new(),
                    overhead: A320HydraulicOverheadPanel::new(),
                    emergency_electrical_overhead: A320TestEmergencyElectricalOverheadPanel::new(),
                    engine_fire_overhead: EngineFireOverheadPanel::new(),
                    landing_gear: LandingGear::new(),
                    electrical: A320TestElectrical::new(),
                    powered_source: TestElectricitySource::powered(
                        PotentialOrigin::EngineGenerator(1),
                        electricity,
                    ),
                    ac_ground_service_bus: ElectricalBus::new(
                        ElectricalBusType::AlternatingCurrentGndFltService,
                        electricity,
                    ),
                    dc_ground_service_bus: ElectricalBus::new(
                        ElectricalBusType::DirectCurrentGndFltService,
                        electricity,
                    ),
                    ac_1_bus: ElectricalBus::new(
                        ElectricalBusType::AlternatingCurrent(1),
                        electricity,
                    ),
                    ac_2_bus: ElectricalBus::new(
                        ElectricalBusType::AlternatingCurrent(2),
                        electricity,
                    ),
                    dc_1_bus: ElectricalBus::new(ElectricalBusType::DirectCurrent(1), electricity),
                    dc_2_bus: ElectricalBus::new(ElectricalBusType::DirectCurrent(2), electricity),
                    dc_ess_bus: ElectricalBus::new(
                        ElectricalBusType::DirectCurrentEssential,
                        electricity,
                    ),
                    dc_hot_1_bus: ElectricalBus::new(
                        ElectricalBusType::DirectCurrentHot(1),
                        electricity,
                    ),
                    dc_hot_2_bus: ElectricalBus::new(
                        ElectricalBusType::DirectCurrentHot(2),
                        electricity,
                    ),
                    is_ac_ground_service_powered: true,
                    is_dc_ground_service_powered: true,
                    is_ac_1_powered: true,
                    is_ac_2_powered: true,
                    is_dc_1_powered: true,
                    is_dc_2_powered: true,
                    is_dc_ess_powered: true,
                    is_dc_hot_1_powered: true,
                    is_dc_hot_2_powered: true,
                }
            }

            fn is_rat_commanded_to_deploy(&self) -> bool {
                self.hydraulics.ram_air_turbine_controller.should_deploy()
            }

            fn is_green_edp_commanded_on(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_1_controller
                    .should_pressurise()
            }

            fn is_yellow_edp_commanded_on(&self) -> bool {
                self.hydraulics
                    .engine_driven_pump_2_controller
                    .should_pressurise()
            }

            fn get_yellow_brake_accumulator_fluid_volume(&self) -> Volume {
                self.hydraulics
                    .braking_circuit_altn
                    .accumulator_fluid_volume()
            }

            fn is_nws_pin_inserted(&self) -> bool {
                self.hydraulics.nose_wheel_steering_pin_is_inserted()
            }

            fn is_cargo_powering_yellow_epump(&self) -> bool {
                self.hydraulics
                    .should_pressurise_yellow_pump_for_cargo_door_operation()
            }

            fn is_ptu_enabled(&self) -> bool {
                self.hydraulics.power_transfer_unit.is_enabled()
            }

            fn is_blue_pressurised(&self) -> bool {
                self.hydraulics.is_blue_pressurised()
            }

            fn is_green_pressurised(&self) -> bool {
                self.hydraulics.is_green_pressurised()
            }

            fn is_yellow_pressurised(&self) -> bool {
                self.hydraulics.is_yellow_pressurised()
            }

            fn set_ac_bus_1_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_1_powered = bus_is_alive;
            }

            fn set_ac_bus_2_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_2_powered = bus_is_alive;
            }

            fn set_dc_ground_service_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_ground_service_powered = bus_is_alive;
            }

            fn set_ac_ground_service_is_powered(&mut self, bus_is_alive: bool) {
                self.is_ac_ground_service_powered = bus_is_alive;
            }

            fn set_dc_bus_2_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_2_powered = bus_is_alive;
            }
            fn set_dc_ess_is_powered(&mut self, bus_is_alive: bool) {
                self.is_dc_ess_powered = bus_is_alive;
            }
        }

        impl Aircraft for A320HydraulicsTestAircraft {
            fn update_before_power_distribution(
                &mut self,
                _context: &UpdateContext,
                electricity: &mut Electricity,
            ) {
                electricity.supplied_by(&self.powered_source);

                if self.is_ac_1_powered {
                    electricity.flow(&self.powered_source, &self.ac_1_bus);
                }

                if self.is_ac_2_powered {
                    electricity.flow(&self.powered_source, &self.ac_2_bus);
                }

                if self.is_ac_ground_service_powered {
                    electricity.flow(&self.powered_source, &self.ac_ground_service_bus);
                }

                if self.is_dc_ground_service_powered {
                    electricity.flow(&self.powered_source, &self.dc_ground_service_bus);
                }

                if self.is_dc_1_powered {
                    electricity.flow(&self.powered_source, &self.dc_1_bus);
                }

                if self.is_dc_2_powered {
                    electricity.flow(&self.powered_source, &self.dc_2_bus);
                }

                if self.is_dc_ess_powered {
                    electricity.flow(&self.powered_source, &self.dc_ess_bus);
                }

                if self.is_dc_hot_1_powered {
                    electricity.flow(&self.powered_source, &self.dc_hot_1_bus);
                }

                if self.is_dc_hot_2_powered {
                    electricity.flow(&self.powered_source, &self.dc_hot_2_bus);
                }
            }

            fn update_after_power_distribution(&mut self, context: &UpdateContext) {
                self.electrical.update(context);

                self.hydraulics.update(
                    context,
                    &self.engine_1,
                    &self.engine_2,
                    &self.overhead,
                    &self.engine_fire_overhead,
                    &self.landing_gear,
                    &self.emergency_electrical_overhead,
                    &self.electrical,
                );

                self.overhead.update(&self.hydraulics);
            }
        }
        impl SimulationElement for A320HydraulicsTestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.engine_1.accept(visitor);
                self.engine_2.accept(visitor);
                self.hydraulics.accept(visitor);
                self.overhead.accept(visitor);
                self.engine_fire_overhead.accept(visitor);
                self.landing_gear.accept(visitor);
                self.emergency_electrical_overhead.accept(visitor);
                self.electrical.accept(visitor);

                visitor.visit(self);
            }
        }

        struct A320HydraulicsTestBed {
            aircraft: A320HydraulicsTestAircraft,
            test_bed: SimulationTestBed,
        }
        impl A320HydraulicsTestBed {
            fn new() -> Self {
                let mut test_bed = SimulationTestBed::new();
                let mut aircraft = A320HydraulicsTestAircraft::new(test_bed.electricity_mut());
                test_bed.seed_with(&mut aircraft);

                Self { test_bed, aircraft }
            }

            fn run_one_tick(self) -> Self {
                self.run_waiting_for(Duration::from_millis(
                    A320Hydraulic::HYDRAULIC_SIM_TIME_STEP_MILLISECONDS,
                ))
            }

            fn run_waiting_for(mut self, delta: Duration) -> Self {
                self.test_bed.set_delta(delta);
                self.test_bed.run_aircraft(&mut self.aircraft);
                self
            }

            fn is_green_edp_commanded_on(&self) -> bool {
                self.aircraft.is_green_edp_commanded_on()
            }

            fn is_yellow_edp_commanded_on(&self) -> bool {
                self.aircraft.is_yellow_edp_commanded_on()
            }

            fn is_ptu_enabled(&self) -> bool {
                self.aircraft.is_ptu_enabled()
            }

            fn is_blue_pressurised(&self) -> bool {
                self.aircraft.is_blue_pressurised()
            }

            fn is_green_pressurised(&self) -> bool {
                self.aircraft.is_green_pressurised()
            }

            fn is_yellow_pressurised(&self) -> bool {
                self.aircraft.is_yellow_pressurised()
            }

            fn green_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.test_bed.read_f64("HYD_GREEN_PRESSURE"))
            }

            fn blue_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.test_bed.read_f64("HYD_BLUE_PRESSURE"))
            }

            fn yellow_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.test_bed.read_f64("HYD_YELLOW_PRESSURE"))
            }

            fn get_yellow_reservoir_volume(&mut self) -> Volume {
                Volume::new::<gallon>(self.test_bed.read_f64("HYD_YELLOW_RESERVOIR"))
            }

            fn is_green_edp_press_low(&mut self) -> bool {
                self.test_bed.read_bool("HYD_GREEN_EDPUMP_LOW_PRESS")
            }

            fn is_green_edp_press_low_fault(&mut self) -> bool {
                self.test_bed.read_bool("OVHD_HYD_ENG_1_PUMP_PB_HAS_FAULT")
            }

            fn is_yellow_edp_press_low_fault(&mut self) -> bool {
                self.test_bed.read_bool("OVHD_HYD_ENG_2_PUMP_PB_HAS_FAULT")
            }

            fn is_yellow_edp_press_low(&mut self) -> bool {
                self.test_bed.read_bool("HYD_YELLOW_EDPUMP_LOW_PRESS")
            }

            fn is_yellow_epump_press_low(&mut self) -> bool {
                self.test_bed.read_bool("HYD_YELLOW_EPUMP_LOW_PRESS")
            }

            fn is_blue_epump_press_low(&mut self) -> bool {
                self.test_bed.read_bool("HYD_BLUE_EPUMP_LOW_PRESS")
            }

            fn is_blue_epump_press_low_fault(&mut self) -> bool {
                self.test_bed.read_bool("OVHD_HYD_EPUMPB_PB_HAS_FAULT")
            }

            fn get_brake_left_yellow_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.test_bed.read_f64("HYD_BRAKE_ALTN_LEFT_PRESS"))
            }

            fn get_brake_right_yellow_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.test_bed.read_f64("HYD_BRAKE_ALTN_RIGHT_PRESS"))
            }

            fn get_green_reservoir_volume(&mut self) -> Volume {
                Volume::new::<gallon>(self.test_bed.read_f64("HYD_GREEN_RESERVOIR"))
            }

            fn get_blue_reservoir_volume(&mut self) -> Volume {
                Volume::new::<gallon>(self.test_bed.read_f64("HYD_BLUE_RESERVOIR"))
            }

            fn get_brake_left_green_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.test_bed.read_f64("HYD_BRAKE_NORM_LEFT_PRESS"))
            }

            fn get_brake_right_green_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.test_bed.read_f64("HYD_BRAKE_NORM_RIGHT_PRESS"))
            }

            fn get_brake_yellow_accumulator_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.test_bed.read_f64("HYD_BRAKE_ALTN_ACC_PRESS"))
            }

            fn get_brake_yellow_accumulator_fluid_volume(&self) -> Volume {
                self.aircraft.get_yellow_brake_accumulator_fluid_volume()
            }

            fn get_rat_position(&mut self) -> f64 {
                self.test_bed.read_f64("HYD_RAT_STOW_POSITION")
            }

            fn get_rat_rpm(&mut self) -> f64 {
                self.test_bed.read_f64("A32NX_HYD_RAT_RPM")
            }

            fn rat_deploy_commanded(&mut self) -> bool {
                self.aircraft.is_rat_commanded_to_deploy()
            }

            fn is_fire_valve_eng1_closed(&mut self) -> bool {
                !self.test_bed.read_bool("HYD_GREEN_FIRE_VALVE_OPENED")
                    && !self
                        .aircraft
                        .hydraulics
                        .green_loop
                        .is_fire_shutoff_valve_opened()
            }

            fn is_fire_valve_eng2_closed(&mut self) -> bool {
                !self.test_bed.read_bool("HYD_YELLOW_FIRE_VALVE_OPENED")
                    && !self
                        .aircraft
                        .hydraulics
                        .yellow_loop
                        .is_fire_shutoff_valve_opened()
            }

            fn engines_off(self) -> Self {
                self.stop_eng1().stop_eng2()
            }

            fn on_the_ground(mut self) -> Self {
                self.test_bed
                    .set_indicated_altitude(Length::new::<foot>(0.));
                self.test_bed.set_on_ground(true);
                self.test_bed
                    .set_indicated_airspeed(Velocity::new::<knot>(5.));
                self
            }

            fn in_flight(mut self) -> Self {
                self.test_bed.set_on_ground(false);
                self.test_bed
                    .set_indicated_altitude(Length::new::<foot>(2500.));
                self.test_bed
                    .set_indicated_airspeed(Velocity::new::<knot>(180.));
                self.start_eng1(Ratio::new::<percent>(80.))
                    .start_eng2(Ratio::new::<percent>(80.))
                    .set_gear_up()
                    .set_park_brake(false)
            }

            fn set_gear_compressed_switch(mut self, is_compressed: bool) -> Self {
                self.test_bed.set_on_ground(is_compressed);
                self
            }

            fn set_eng1_fire_button(mut self, is_active: bool) -> Self {
                self.test_bed.write_bool("FIRE_BUTTON_ENG1", is_active);
                self
            }

            fn set_eng2_fire_button(mut self, is_active: bool) -> Self {
                self.test_bed.write_bool("FIRE_BUTTON_ENG2", is_active);
                self
            }

            fn set_cargo_door_state(mut self, position: f64) -> Self {
                self.test_bed.write_f64("EXIT OPEN:5", position);
                self
            }

            fn set_pushback_state(mut self, is_pushed_back: bool) -> Self {
                if is_pushed_back {
                    let mut rng = rand::thread_rng();

                    self.test_bed
                        .write_f64("PUSHBACK ANGLE", rng.gen_range(0.0..0.1));
                    self.test_bed.write_f64("PUSHBACK STATE", 0.);
                } else {
                    self.test_bed.write_f64("PUSHBACK STATE", 3.);
                }
                self
            }

            fn start_eng1(mut self, n2: Ratio) -> Self {
                self.test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:1", true);
                self.test_bed
                    .write_f64("TURB ENG CORRECTED N2:1", n2.get::<percent>());

                self
            }

            fn start_eng2(mut self, n2: Ratio) -> Self {
                self.test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:2", true);
                self.test_bed
                    .write_f64("TURB ENG CORRECTED N2:2", n2.get::<percent>());

                self
            }

            fn stop_eng1(mut self) -> Self {
                self.test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:1", false);
                self.test_bed.write_f64("TURB ENG CORRECTED N2:1", 0.);

                self
            }

            fn stopping_eng1(mut self) -> Self {
                self.test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:1", false);
                self.test_bed.write_f64("TURB ENG CORRECTED N2:1", 25.);

                self
            }

            fn stop_eng2(mut self) -> Self {
                self.test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:2", false);
                self.test_bed.write_f64("TURB ENG CORRECTED N2:2", 0.);

                self
            }

            fn stopping_eng2(mut self) -> Self {
                self.test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:2", false);
                self.test_bed.write_f64("TURB ENG CORRECTED N2:2", 25.);

                self
            }

            fn set_park_brake(mut self, is_set: bool) -> Self {
                self.test_bed.write_bool("PARK_BRAKE_LEVER_POS", is_set);
                self
            }

            fn set_gear_up(mut self) -> Self {
                self.test_bed.write_f64("GEAR CENTER POSITION", 0.);
                self.test_bed.write_bool("GEAR HANDLE POSITION", false);

                self
            }

            fn set_gear_down(mut self) -> Self {
                self.test_bed.write_f64("GEAR CENTER POSITION", 100.);
                self.test_bed.write_bool("GEAR HANDLE POSITION", true);

                self
            }

            fn set_anti_skid(mut self, is_set: bool) -> Self {
                self.test_bed.write_bool("ANTISKID BRAKES ACTIVE", is_set);
                self
            }

            fn set_yellow_e_pump(mut self, is_auto: bool) -> Self {
                self.test_bed
                    .write_bool("OVHD_HYD_EPUMPY_PB_IS_AUTO", is_auto);
                self
            }

            fn set_blue_e_pump(mut self, is_auto: bool) -> Self {
                self.test_bed
                    .write_bool("OVHD_HYD_EPUMPB_PB_IS_AUTO", is_auto);
                self
            }

            fn set_blue_e_pump_ovrd(mut self, is_on: bool) -> Self {
                self.test_bed
                    .write_bool("OVHD_HYD_EPUMPY_OVRD_PB_IS_ON", is_on);
                self
            }

            fn set_green_ed_pump(mut self, is_auto: bool) -> Self {
                self.test_bed
                    .write_bool("OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO", is_auto);
                self
            }

            fn set_yellow_ed_pump(mut self, is_auto: bool) -> Self {
                self.test_bed
                    .write_bool("OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO", is_auto);
                self
            }

            fn set_ptu_state(mut self, is_auto: bool) -> Self {
                self.test_bed.write_bool("OVHD_HYD_PTU_PB_IS_AUTO", is_auto);
                self
            }

            fn ac_bus_1_lost(mut self) -> Self {
                self.aircraft.set_ac_bus_1_is_powered(false);
                self
            }

            fn ac_bus_2_lost(mut self) -> Self {
                self.aircraft.set_ac_bus_2_is_powered(false);
                self
            }

            fn dc_ground_service_lost(mut self) -> Self {
                self.aircraft.set_dc_ground_service_is_powered(false);
                self
            }
            fn dc_ground_service_avail(mut self) -> Self {
                self.aircraft.set_dc_ground_service_is_powered(true);
                self
            }

            fn ac_ground_service_lost(mut self) -> Self {
                self.aircraft.set_ac_ground_service_is_powered(false);
                self
            }

            fn dc_bus_2_lost(mut self) -> Self {
                self.aircraft.set_dc_bus_2_is_powered(false);
                self
            }

            fn dc_ess_lost(mut self) -> Self {
                self.aircraft.set_dc_ess_is_powered(false);
                self
            }

            fn set_cold_dark_inputs(self) -> Self {
                self.set_blue_e_pump_ovrd(false)
                    .set_eng1_fire_button(false)
                    .set_eng2_fire_button(false)
                    .set_blue_e_pump(true)
                    .set_yellow_e_pump(true)
                    .set_green_ed_pump(true)
                    .set_yellow_ed_pump(true)
                    .set_ptu_state(true)
                    .set_park_brake(true)
                    .set_anti_skid(true)
                    .set_cargo_door_state(0.)
                    .set_left_brake(Ratio::new::<percent>(0.))
                    .set_right_brake(Ratio::new::<percent>(0.))
                    .set_gear_down()
            }

            fn set_left_brake(self, position_percent: Ratio) -> Self {
                self.set_brake("LEFT_BRAKE_PEDAL_INPUT", position_percent)
            }

            fn set_right_brake(self, position_percent: Ratio) -> Self {
                self.set_brake("RIGHT_BRAKE_PEDAL_INPUT", position_percent)
            }

            fn set_brake(mut self, name: &str, position_percent: Ratio) -> Self {
                let scaled_value = position_percent.get::<percent>() / 100.;
                self.test_bed.write_f64(name, scaled_value.min(1.).max(0.));
                self
            }

            fn empty_brake_accumulator_using_park_brake(mut self) -> Self {
                self = self
                    .set_park_brake(true)
                    .run_waiting_for(Duration::from_secs(1));

                let mut number_of_loops = 0;
                while self
                    .get_brake_yellow_accumulator_fluid_volume()
                    .get::<gallon>()
                    > 0.001
                {
                    self = self
                        .set_park_brake(false)
                        .run_waiting_for(Duration::from_secs(1))
                        .set_park_brake(true)
                        .run_waiting_for(Duration::from_secs(1));
                    number_of_loops += 1;
                    assert!(number_of_loops < 20);
                }

                self = self
                    .set_park_brake(false)
                    .run_waiting_for(Duration::from_secs(1))
                    .set_park_brake(true)
                    .run_waiting_for(Duration::from_secs(1));

                self
            }

            fn empty_brake_accumulator_using_pedal_brake(mut self) -> Self {
                let mut number_of_loops = 0;
                while self
                    .get_brake_yellow_accumulator_fluid_volume()
                    .get::<gallon>()
                    > 0.001
                {
                    self = self
                        .set_left_brake(Ratio::new::<percent>(100.))
                        .set_right_brake(Ratio::new::<percent>(100.))
                        .run_waiting_for(Duration::from_secs(1))
                        .set_left_brake(Ratio::new::<percent>(0.))
                        .set_right_brake(Ratio::new::<percent>(0.))
                        .run_waiting_for(Duration::from_secs(1));
                    number_of_loops += 1;
                    assert!(number_of_loops < 50);
                }

                self = self
                    .set_left_brake(Ratio::new::<percent>(100.))
                    .set_right_brake(Ratio::new::<percent>(100.))
                    .run_waiting_for(Duration::from_secs(1))
                    .set_left_brake(Ratio::new::<percent>(0.))
                    .set_right_brake(Ratio::new::<percent>(0.))
                    .run_waiting_for(Duration::from_secs(1));

                self
            }
        }

        fn test_bed() -> A320HydraulicsTestBed {
            A320HydraulicsTestBed::new()
        }

        fn test_bed_with() -> A320HydraulicsTestBed {
            test_bed()
        }

        #[test]
        fn pressure_state_at_init_one_simulation_step() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(test_bed.is_ptu_enabled());

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn pressure_state_after_5s() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_ptu_enabled());

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn ptu_inhibits() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            // Ptu push button disables PTU accordingly
            test_bed = test_bed.set_ptu_state(false).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.set_ptu_state(true).run_one_tick();
            assert!(test_bed.is_ptu_enabled());

            // Not all engines on or off should disable ptu if on ground and park brake on
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.set_park_brake(false).run_one_tick();
            assert!(test_bed.is_ptu_enabled());
            test_bed = test_bed.set_park_brake(true).run_one_tick();
            test_bed = test_bed.set_gear_compressed_switch(true).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.set_gear_compressed_switch(false).run_one_tick();
            assert!(test_bed.is_ptu_enabled());
        }

        #[test]
        fn ptu_unpowered_cant_inhibit() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            // Ptu push button disables PTU accordingly
            test_bed = test_bed.set_ptu_state(false).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());

            // No power on closing valve : ptu become active
            test_bed = test_bed.dc_ground_service_lost().run_one_tick();
            assert!(test_bed.is_ptu_enabled());

            test_bed = test_bed.dc_ground_service_avail().run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
        }

        #[test]
        fn ptu_cargo_operation_inhibit() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            // Ptu push button disables PTU accordingly
            test_bed = test_bed.set_cargo_door_state(1.).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.run_waiting_for(
                A320PowerTransferUnitController::DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION,
            ); // Should re enabled after 40s
            assert!(test_bed.is_ptu_enabled());
        }

        #[test]
        fn nose_wheel_pin_detection() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.aircraft.is_nws_pin_inserted());

            test_bed = test_bed.set_pushback_state(true).run_one_tick();
            assert!(test_bed.aircraft.is_nws_pin_inserted());

            test_bed = test_bed
                .set_pushback_state(false)
                .run_waiting_for(Duration::from_secs(1));
            assert!(test_bed.aircraft.is_nws_pin_inserted());

            test_bed = test_bed.set_pushback_state(false).run_waiting_for(
                A320PowerTransferUnitController::DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK,
            );

            assert!(!test_bed.aircraft.is_nws_pin_inserted());
        }

        #[test]
        fn cargo_door_yellow_epump_powering() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            assert!(!test_bed.aircraft.is_cargo_powering_yellow_epump());

            test_bed = test_bed.set_cargo_door_state(1.0).run_one_tick();
            assert!(test_bed.aircraft.is_cargo_powering_yellow_epump());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(1));
            assert!(test_bed.aircraft.is_cargo_powering_yellow_epump());

            test_bed = test_bed.run_waiting_for(
                A320YellowElectricPumpController::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION,
            );

            assert!(!test_bed.aircraft.is_cargo_powering_yellow_epump());
        }

        #[test]
        fn ptu_pressurise_green_from_yellow_epump() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            // Yellow epump ON / Waiting 25s
            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(25));

            assert!(test_bed.is_ptu_enabled());

            // Now we should have pressure in yellow and green
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(3100.));

            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(-50.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3100.));

            // Ptu push button disables PTU / green press should fall
            test_bed = test_bed
                .set_ptu_state(false)
                .run_waiting_for(Duration::from_secs(20));
            assert!(!test_bed.is_ptu_enabled());

            // Now we should have pressure in yellow only
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
        }

        #[test]
        fn ptu_pressurise_green_from_yellow_epump_and_edp2() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .set_yellow_e_pump(false)
                .set_yellow_ed_pump(true) // Else Ptu inhibited by parking brake
                .run_waiting_for(Duration::from_secs(25));

            assert!(test_bed.is_ptu_enabled());

            // Now we should have pressure in yellow and green
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(3100.));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3100.));
        }

        #[test]
        fn green_edp_buildup() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting eng 1
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_one_tick();

            // ALMOST No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));

            // Blue is auto run from engine master switches logic
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

            // Stoping engine, pressure should fall in 20s
            test_bed = test_bed
                .stop_eng1()
                .run_waiting_for(Duration::from_secs(20));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(200.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn green_edp_no_fault_on_ground_eng_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());
            // EDP should have no fault
            assert!(!test_bed.is_green_edp_press_low_fault());
        }

        #[test]
        fn green_edp_fault_not_on_ground_eng_off() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .engines_off()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());

            assert!(!test_bed.is_green_pressurised());
            assert!(!test_bed.is_yellow_pressurised());
            // EDP should have a fault as we are in flight
            assert!(test_bed.is_green_edp_press_low_fault());
        }

        #[test]
        fn green_edp_fault_on_ground_eng_starting() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());
            // EDP should have no fault
            assert!(!test_bed.is_green_edp_press_low_fault());

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(3.))
                .run_one_tick();

            assert!(!test_bed.is_green_edp_press_low_fault());

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_one_tick();

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.is_green_edp_press_low_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_green_pressurised());
            assert!(!test_bed.is_green_edp_press_low_fault());
        }

        #[test]
        fn yellow_edp_no_fault_on_ground_eng_off() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());
            // EDP should have no fault
            assert!(!test_bed.is_yellow_edp_press_low_fault());
        }

        #[test]
        fn yellow_edp_fault_not_on_ground_eng_off() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .engines_off()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());

            assert!(!test_bed.is_green_pressurised());
            assert!(!test_bed.is_yellow_pressurised());
            // EDP should have a fault as we are in flight
            assert!(test_bed.is_yellow_edp_press_low_fault());
        }

        #[test]
        fn yellow_edp_fault_on_ground_eng_starting() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());
            // EDP should have no fault
            assert!(!test_bed.is_yellow_edp_press_low_fault());

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(3.))
                .run_one_tick();

            assert!(!test_bed.is_yellow_edp_press_low_fault());

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.is_yellow_edp_press_low_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_yellow_pressurised());
            assert!(!test_bed.is_yellow_edp_press_low_fault());
        }

        #[test]
        fn blue_epump_no_fault_on_ground_eng_starting() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Blue epump should have no fault
            assert!(!test_bed.is_blue_epump_press_low_fault());

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(3.))
                .run_one_tick();

            assert!(!test_bed.is_blue_epump_press_low_fault());

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.is_blue_epump_press_low_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_blue_pressurised());
            assert!(!test_bed.is_blue_epump_press_low_fault());
        }

        #[test]
        fn blue_epump_fault_on_ground_using_override() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Blue epump should have no fault
            assert!(!test_bed.is_blue_epump_press_low_fault());

            test_bed = test_bed.set_blue_e_pump_ovrd(true).run_one_tick();

            // As we use override, this bypasses eng off fault inhibit so we have a fault
            assert!(test_bed.is_blue_epump_press_low_fault());

            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // When finally pressurised no fault
            assert!(test_bed.is_blue_pressurised());
            assert!(!test_bed.is_blue_epump_press_low_fault());
        }

        #[test]
        fn green_edp_press_low_engine_off_to_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());

            // EDP should be LOW pressure state
            assert!(test_bed.is_green_edp_press_low());

            // Starting eng 1 N2 is low at start
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(3.))
                .run_one_tick();

            // Engine commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_green_edp_press_low());

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // No more fault LOW expected
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_green_edp_press_low());

            // Stoping pump, no fault expected
            test_bed = test_bed
                .set_green_ed_pump(false)
                .run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_green_edp_press_low());
        }

        #[test]
        fn green_edp_press_low_engine_on_to_off() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(75.))
                .run_waiting_for(Duration::from_secs(5));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_green_edp_commanded_on());
            assert!(test_bed.is_green_pressurised());
            // EDP should not be in fault low when engine running and pressure is ok
            assert!(!test_bed.is_green_edp_press_low());

            // Stoping eng 1 with N2 still turning
            test_bed = test_bed.stopping_eng1().run_one_tick();

            // Edp should still be in pressurized mode but as engine just stopped no fault
            assert!(test_bed.is_green_edp_commanded_on());
            assert!(!test_bed.is_green_edp_press_low());

            // Waiting for 25s pressure should drop and still no fault
            test_bed = test_bed
                .stop_eng1()
                .run_waiting_for(Duration::from_secs(25));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.is_green_edp_press_low());
        }

        #[test]
        fn yellow_edp_press_low_engine_on_to_off() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng2(Ratio::new::<percent>(75.))
                .run_waiting_for(Duration::from_secs(5));

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());
            assert!(test_bed.is_yellow_pressurised());
            // EDP should not be in fault low when engine running and pressure is ok
            assert!(!test_bed.is_yellow_edp_press_low());

            // Stoping eng 2 with N2 still turning
            test_bed = test_bed.stopping_eng2().run_one_tick();

            // Edp should still be in pressurized mode but as engine just stopped no fault
            assert!(test_bed.is_yellow_edp_commanded_on());
            assert!(!test_bed.is_yellow_edp_press_low());

            // Waiting for 25s pressure should drop and still no fault
            test_bed = test_bed
                .stop_eng2()
                .run_waiting_for(Duration::from_secs(25));

            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.is_yellow_edp_press_low());
        }

        #[test]
        fn yellow_edp_press_low_engine_off_to_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());

            // EDP should be LOW pressure state
            assert!(test_bed.is_yellow_edp_press_low());

            // Starting eng 2 N2 is low at start
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(3.))
                .run_one_tick();

            // Engine commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_yellow_edp_press_low());

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // No more fault LOW expected
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_yellow_edp_press_low());

            // Stoping pump, no fault expected
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_yellow_edp_press_low());
        }

        #[test]
        fn yellow_edp_press_low_engine_off_to_on_with_e_pump() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .set_yellow_e_pump(false)
                .run_one_tick();

            // EDP should be commanded on even without engine running
            assert!(test_bed.is_yellow_edp_commanded_on());

            // EDP should be LOW pressure state
            assert!(test_bed.is_yellow_edp_press_low());

            // Waiting for 20s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(20));

            // Yellow pressurised but edp still off, we expect fault LOW press
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.is_yellow_edp_press_low());

            // Starting eng 2 N2 is low at start
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(3.))
                .run_one_tick();

            // Engine commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_yellow_edp_press_low());

            // Waiting for 5s pressure should be at 3000 psi in EDP section
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // No more fault LOW expected
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_yellow_edp_press_low());
        }

        #[test]
        fn green_edp_press_low_engine_off_to_on_with_ptu() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_park_brake(false)
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            // EDP should be LOW pressure state
            assert!(test_bed.is_green_edp_press_low());

            // Waiting for 20s pressure should be at 2300+ psi thanks to ptu
            test_bed = test_bed.run_waiting_for(Duration::from_secs(20));

            // Yellow pressurised by engine2, green presurised from ptu we expect fault LOW press on EDP1
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2800.));
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2300.));
            assert!(test_bed.is_green_edp_press_low());

            // Starting eng 1 N2 is low at start
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(3.))
                .run_one_tick();

            // Engine commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_green_edp_press_low());

            // Waiting for 5s pressure should be at 3000 psi in EDP section
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // No more fault LOW expected
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_green_edp_press_low());
        }

        #[test]
        fn yellow_epump_press_low_at_pump_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should not be in fault low when cold start
            assert!(!test_bed.is_yellow_epump_press_low());

            // Starting epump
            test_bed = test_bed.set_yellow_e_pump(false).run_one_tick();

            // Pump commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_yellow_epump_press_low());

            // Waiting for 20s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(20));

            // No more fault LOW expected
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));
            assert!(!test_bed.is_yellow_epump_press_low());

            // Stoping epump, no fault expected
            test_bed = test_bed
                .set_yellow_e_pump(true)
                .run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_yellow_epump_press_low());
        }

        #[test]
        fn blue_epump_press_low_at_pump_on() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // EDP should not be in fault low when cold start
            assert!(!test_bed.is_blue_epump_press_low());

            // Starting epump
            test_bed = test_bed.set_blue_e_pump_ovrd(true).run_one_tick();

            // Pump commanded on but pressure couldn't rise enough: we are in fault low
            assert!(test_bed.is_blue_epump_press_low());

            // Waiting for 10s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

            // No more fault LOW expected
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2900.));
            assert!(!test_bed.is_blue_epump_press_low());

            // Stoping epump, no fault expected
            test_bed = test_bed
                .set_blue_e_pump_ovrd(false)
                .run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_blue_epump_press_low());
        }

        #[test]
        fn edp_deactivation() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .run_one_tick();

            // Starting eng 1 and eng 2
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();

            // ALMOST No pressure
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            // Stoping edp1, pressure should fall in 20s
            test_bed = test_bed
                .set_green_ed_pump(false)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            // Stoping edp2, pressure should fall in 20s
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
        }

        #[test]
        fn yellow_edp_buildup() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting eng 1
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_one_tick();
            // ALMOST No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());

            // Blue is auto run
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2800.));

            // Stoping engine, pressure should fall in 20s
            test_bed = test_bed
                .stop_eng2()
                .run_waiting_for(Duration::from_secs(20));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(200.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
        }

        #[test]
        fn when_yellow_edp_solenoid_main_power_bus_unavailable_backup_bus_keeps_pump_in_unpressurised_state(
        ) {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.is_yellow_pressurised());

            // Stoping EDP manually
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            assert!(!test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .dc_bus_2_lost()
                .run_waiting_for(Duration::from_secs(15));

            // Yellow solenoid has backup power from DC ESS BUS
            assert!(!test_bed.is_yellow_pressurised());
        }

        #[test]
        fn when_yellow_edp_solenoid_both_bus_unpowered_yellow_hydraulic_system_is_pressurised() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.is_yellow_pressurised());

            // Stoping EDP manually
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            assert!(!test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .dc_ess_lost()
                .dc_bus_2_lost()
                .run_waiting_for(Duration::from_secs(15));

            // Now solenoid defaults to pressurised without power
            assert!(test_bed.is_yellow_pressurised());
        }

        #[test]
        fn when_green_edp_solenoid_unpowered_yellow_hydraulic_system_is_pressurised() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.is_green_pressurised());

            // Stoping EDP manually
            test_bed = test_bed
                .set_green_ed_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            assert!(!test_bed.is_green_pressurised());

            test_bed = test_bed
                .dc_ess_lost()
                .run_waiting_for(Duration::from_secs(15));

            // Now solenoid defaults to pressurised
            assert!(test_bed.is_green_pressurised());
        }

        #[test]
        // Checks numerical stability of reservoir level: level should remain after multiple pressure cycles
        fn yellow_loop_reservoir_coherency() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                // Park brake off to not use fluid in brakes
                .set_park_brake(false)
                .run_one_tick();

            // Starting epump wait for pressure rise to make sure system is primed including brake accumulator
            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(20));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));

            // Shutdown and wait for pressure stabilisation
            test_bed = test_bed
                .set_yellow_e_pump(true)
                .run_waiting_for(Duration::from_secs(50));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(-50.));

            let reservoir_level_after_priming = test_bed.get_yellow_reservoir_volume();

            let total_fluid_res_plus_accumulator_before_loops = reservoir_level_after_priming
                + test_bed.get_brake_yellow_accumulator_fluid_volume();

            // Now doing cycles of pressurisation on EDP and ePump
            for _ in 1..6 {
                test_bed = test_bed
                    .start_eng2(Ratio::new::<percent>(80.))
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3100.));
                assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));

                let mut current_res_level = test_bed.get_yellow_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .stop_eng2()
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(-50.));

                test_bed = test_bed
                    .set_yellow_e_pump(false)
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3500.));
                assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));

                current_res_level = test_bed.get_yellow_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .set_yellow_e_pump(true)
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(-50.));
            }
            let total_fluid_res_plus_accumulator_after_loops = test_bed
                .get_yellow_reservoir_volume()
                + test_bed.get_brake_yellow_accumulator_fluid_volume();

            let total_fluid_difference = total_fluid_res_plus_accumulator_before_loops
                - total_fluid_res_plus_accumulator_after_loops;

            // Make sure no more deviation than 0.001 gallon is lost after full pressure and unpressurized states
            assert!(total_fluid_difference.get::<gallon>().abs() < 0.001);
        }

        #[test]
        // Checks numerical stability of reservoir level: level should remain after multiple pressure cycles
        fn green_loop_reservoir_coherency() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .run_one_tick();

            // Starting EDP wait for pressure rise to make sure system is primed
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(20));
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2500.));

            // Shutdown and wait for pressure stabilisation
            test_bed = test_bed
                .stop_eng1()
                .run_waiting_for(Duration::from_secs(50));
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(-50.));

            let reservoir_level_after_priming = test_bed.get_green_reservoir_volume();

            // Now doing cycles of pressurisation on EDP
            for _ in 1..6 {
                test_bed = test_bed
                    .start_eng1(Ratio::new::<percent>(80.))
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.green_pressure() < Pressure::new::<psi>(3500.));
                assert!(test_bed.green_pressure() > Pressure::new::<psi>(2500.));

                let current_res_level = test_bed.get_green_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .stop_eng1()
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.green_pressure() > Pressure::new::<psi>(-50.));
            }

            let total_fluid_difference =
                reservoir_level_after_priming - test_bed.get_green_reservoir_volume();

            // Make sure no more deviation than 0.001 gallon is lost after full pressure and unpressurized states
            assert!(total_fluid_difference.get::<gallon>().abs() < 0.001);
        }

        #[test]
        // Checks numerical stability of reservoir level: level should remain after multiple pressure cycles
        fn blue_loop_reservoir_coherency() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Starting blue_epump wait for pressure rise to make sure system is primed
            test_bed = test_bed
                .set_blue_e_pump_ovrd(true)
                .run_waiting_for(Duration::from_secs(20));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));

            // Shutdown and wait for pressure stabilisation
            test_bed = test_bed
                .set_blue_e_pump_ovrd(false)
                .run_waiting_for(Duration::from_secs(50));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(-50.));

            let reservoir_level_after_priming = test_bed.get_blue_reservoir_volume();

            // Now doing cycles of pressurisation on epump relying on auto run of epump when eng is on
            for _ in 1..6 {
                test_bed = test_bed
                    .start_eng1(Ratio::new::<percent>(80.))
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.blue_pressure() < Pressure::new::<psi>(3500.));
                assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));

                let current_res_level = test_bed.get_blue_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .stop_eng1()
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.blue_pressure() > Pressure::new::<psi>(-50.));

                // Now engine 2 is used
                test_bed = test_bed
                    .start_eng2(Ratio::new::<percent>(80.))
                    .run_waiting_for(Duration::from_secs(50));

                assert!(test_bed.blue_pressure() < Pressure::new::<psi>(3500.));
                assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));

                let current_res_level = test_bed.get_blue_reservoir_volume();
                assert!(current_res_level < reservoir_level_after_priming);

                test_bed = test_bed
                    .stop_eng2()
                    .run_waiting_for(Duration::from_secs(50));
                assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
                assert!(test_bed.blue_pressure() > Pressure::new::<psi>(-50.));
            }

            let total_fluid_difference =
                reservoir_level_after_priming - test_bed.get_blue_reservoir_volume();

            // Make sure no more deviation than 0.001 gallon is lost after full pressure and unpressurized states
            assert!(total_fluid_difference.get::<gallon>().abs() < 0.001);
        }

        #[test]
        fn yellow_green_edp_firevalve() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // PTU would mess up the test
            test_bed = test_bed.set_ptu_state(false).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());

            assert!(!test_bed.is_fire_valve_eng1_closed());
            assert!(!test_bed.is_fire_valve_eng2_closed());

            // Starting eng 1
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .start_eng1(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(5));

            // Waiting for 5s pressure should be at 3000 psi
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2800.));

            assert!(!test_bed.is_fire_valve_eng1_closed());
            assert!(!test_bed.is_fire_valve_eng2_closed());

            // Green shutoff valve
            test_bed = test_bed
                .set_eng1_fire_button(true)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.is_fire_valve_eng1_closed());
            assert!(!test_bed.is_fire_valve_eng2_closed());

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            // Yellow shutoff valve
            test_bed = test_bed
                .set_eng2_fire_button(true)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.is_fire_valve_eng1_closed());
            assert!(test_bed.is_fire_valve_eng2_closed());

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
        }

        #[test]
        fn yellow_brake_accumulator() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Getting accumulator pressure on cold start
            let mut accumulator_pressure = test_bed.get_brake_yellow_accumulator_pressure();

            // No brakes on green, no more pressure than in accumulator on yellow
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(
                test_bed.get_brake_left_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );
            assert!(
                test_bed.get_brake_right_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );

            // No brakes even if we brake on green, no more than accumulator pressure on yellow
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(5));

            accumulator_pressure = test_bed.get_brake_yellow_accumulator_pressure();

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(
                test_bed.get_brake_left_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );
            assert!(
                test_bed.get_brake_right_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );
            assert!(
                test_bed.get_brake_yellow_accumulator_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );

            // Park brake off, loading accumulator, we expect no brake pressure but accumulator loaded
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .set_park_brake(false)
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(30));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(3500.));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_yellow_accumulator_pressure() > Pressure::new::<psi>(2500.));

            // Park brake on, loaded accumulator, we expect brakes on yellow side only
            test_bed = test_bed
                .set_park_brake(true)
                .run_waiting_for(Duration::from_secs(3));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(2000.));

            assert!(test_bed.get_brake_yellow_accumulator_pressure() > Pressure::new::<psi>(2500.));
        }

        #[test]
        fn norm_brake_vs_altn_brake() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Getting accumulator pressure on cold start
            let accumulator_pressure = test_bed.get_brake_yellow_accumulator_pressure();

            // No brakes
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(
                test_bed.get_brake_left_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );
            assert!(
                test_bed.get_brake_right_yellow_pressure()
                    < accumulator_pressure + Pressure::new::<psi>(50.)
            );

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.is_yellow_pressurised());
            // No brakes if we don't brake
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Braking cause green braking system to rise
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Disabling Askid causes alternate braking to work and release green brakes
            test_bed = test_bed
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(950.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(3500.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(950.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(3500.));
        }

        #[test]
        fn no_brake_inversion() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.is_yellow_pressurised());
            // Braking left
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Braking right
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Disabling Askid causes alternate braking to work and release green brakes
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(950.));

            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(950.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn auto_brake_at_gear_retraction() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(15));

            // No brake inputs
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Positive climb, gear up
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(1));

            // Check auto brake is active
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(1500.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(1500.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Check no more autobrakes after 3s
            test_bed = test_bed.run_waiting_for(Duration::from_secs(3));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn alternate_brake_accumulator_is_emptying_while_braking() {
            let mut test_bed = test_bed_with()
                .on_the_ground()
                .set_cold_dark_inputs()
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(15));

            // Check we got yellow pressure and brake accumulator loaded
            assert!(test_bed.yellow_pressure() >= Pressure::new::<psi>(2500.));
            assert!(
                test_bed.get_brake_yellow_accumulator_pressure() >= Pressure::new::<psi>(2500.)
            );

            // Disabling green and yellow side so accumulator stop being able to reload
            test_bed = test_bed
                .set_ptu_state(false)
                .set_yellow_ed_pump(false)
                .set_green_ed_pump(false)
                .set_yellow_e_pump(true)
                .run_waiting_for(Duration::from_secs(30));

            assert!(test_bed.yellow_pressure() <= Pressure::new::<psi>(100.));
            assert!(test_bed.green_pressure() <= Pressure::new::<psi>(100.));
            assert!(
                test_bed.get_brake_yellow_accumulator_pressure() >= Pressure::new::<psi>(2500.)
            );

            // Now using brakes and check accumulator gets empty
            test_bed = test_bed
                .empty_brake_accumulator_using_pedal_brake()
                .run_waiting_for(Duration::from_secs(1));

            assert!(
                test_bed.get_brake_yellow_accumulator_pressure() <= Pressure::new::<psi>(1000.)
            );
            assert!(
                test_bed.get_brake_yellow_accumulator_fluid_volume() <= Volume::new::<gallon>(0.01)
            );
        }

        #[test]
        fn brakes_inactive_in_flight() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(10));

            // No brake inputs
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            // Now full brakes
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            // Check no action on brakes
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn brakes_norm_active_in_flight_gear_down() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(10));

            // Now full brakes gear down
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_gear_down()
                .run_waiting_for(Duration::from_secs(1));

            // Brakes norm should work normally
            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn brakes_alternate_active_in_flight_gear_down() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .set_gear_up()
                .run_waiting_for(Duration::from_secs(10));

            // Now full brakes gear down
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .set_gear_down()
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(1));

            // Brakes norm should work normally
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(900.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(900.));
        }

        #[test]
        // Testing that green for brakes is only available if park brake is on while altn pressure is at too low level
        fn brake_logic_green_backup_emergency() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            // Setting on ground with yellow side hydraulics off
            // This should prevent yellow accumulator to fill
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(true)
                .set_ptu_state(false)
                .set_yellow_e_pump(true)
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            // Braking but park is on: no output on green brakes expected
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(500.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(500.));

            // With no more fluid in yellow accumulator, green should work as emergency
            test_bed = test_bed
                .empty_brake_accumulator_using_park_brake()
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(1000.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
        }

        #[test]
        fn controller_blue_epump_activates_when_no_weight_on_wheels() {
            let engine_off_oil_pressure = Pressure::new::<psi>(10.);
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            overhead_panel.blue_epump_override_push_button.push_off();

            let mut blue_epump_controller = A320BlueElectricPumpController::new(
                A320Hydraulic::BLUE_ELEC_PUMP_CONTROL_POWER_BUS,
            );

            blue_epump_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                true,
            ));

            let eng1_above_idle = false;
            let eng2_above_idle = false;
            blue_epump_controller.weight_on_wheels = false;

            blue_epump_controller.update(
                &overhead_panel,
                true,
                engine_off_oil_pressure,
                engine_off_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(blue_epump_controller.should_pressurise());

            blue_epump_controller.weight_on_wheels = true;

            blue_epump_controller.update(
                &overhead_panel,
                true,
                engine_off_oil_pressure,
                engine_off_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(!blue_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_blue_epump_split_engine_states() {
            let engine_on_oil_pressure = Pressure::new::<psi>(30.);
            let engine_off_oil_pressure = Pressure::new::<psi>(10.);
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            overhead_panel.blue_epump_override_push_button.push_off();

            let mut blue_epump_controller = A320BlueElectricPumpController::new(
                A320Hydraulic::BLUE_ELEC_PUMP_CONTROL_POWER_BUS,
            );
            blue_epump_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                true,
            ));

            let eng1_above_idle = false;
            let eng2_above_idle = false;
            blue_epump_controller.update(
                &overhead_panel,
                true,
                engine_off_oil_pressure,
                engine_off_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(!blue_epump_controller.should_pressurise());

            let eng1_above_idle = true;
            let eng2_above_idle = false;
            blue_epump_controller.update(
                &overhead_panel,
                true,
                engine_on_oil_pressure,
                engine_off_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(blue_epump_controller.should_pressurise());

            let eng1_above_idle = false;
            let eng2_above_idle = true;
            blue_epump_controller.update(
                &overhead_panel,
                true,
                engine_off_oil_pressure,
                engine_on_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(blue_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_blue_epump_on_off_engines() {
            let engine_on_oil_pressure = Pressure::new::<psi>(30.);
            let engine_off_oil_pressure = Pressure::new::<psi>(10.);
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            overhead_panel.blue_epump_override_push_button.push_off();

            let mut blue_epump_controller = A320BlueElectricPumpController::new(
                A320Hydraulic::BLUE_ELEC_PUMP_CONTROL_POWER_BUS,
            );
            blue_epump_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                true,
            ));

            let eng1_above_idle = true;
            let eng2_above_idle = true;
            blue_epump_controller.update(
                &overhead_panel,
                true,
                engine_on_oil_pressure,
                engine_on_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(blue_epump_controller.should_pressurise());

            let eng1_above_idle = false;
            let eng2_above_idle = false;
            blue_epump_controller.update(
                &overhead_panel,
                false,
                engine_off_oil_pressure,
                engine_off_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(!blue_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_blue_epump_override() {
            let engine_off_oil_pressure = Pressure::new::<psi>(10.);

            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let mut blue_epump_controller = A320BlueElectricPumpController::new(
                A320Hydraulic::BLUE_ELEC_PUMP_CONTROL_POWER_BUS,
            );
            blue_epump_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                true,
            ));

            let eng1_above_idle = false;
            let eng2_above_idle = false;
            overhead_panel.blue_epump_override_push_button.push_on();
            blue_epump_controller.update(
                &overhead_panel,
                true,
                engine_off_oil_pressure,
                engine_off_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(blue_epump_controller.should_pressurise());

            let eng1_above_idle = false;
            let eng2_above_idle = false;
            overhead_panel.blue_epump_override_push_button.push_off();
            blue_epump_controller.update(
                &overhead_panel,
                false,
                engine_off_oil_pressure,
                engine_off_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(!blue_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_blue_epump_override_without_power_shall_not_run_blue_pump() {
            let engine_off_oil_pressure = Pressure::new::<psi>(10.);

            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let mut blue_epump_controller = A320BlueElectricPumpController::new(
                A320Hydraulic::BLUE_ELEC_PUMP_CONTROL_POWER_BUS,
            );

            let eng1_above_idle = false;
            let eng2_above_idle = false;
            overhead_panel.blue_epump_override_push_button.push_on();

            blue_epump_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                false,
            ));
            blue_epump_controller.update(
                &overhead_panel,
                false,
                engine_off_oil_pressure,
                engine_off_oil_pressure,
                eng1_above_idle,
                eng2_above_idle,
            );
            assert!(!blue_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_yellow_epump_overhead_button_logic() {
            let fwd_door = Door::new(1);
            let aft_door = Door::new(2);
            let context = context(Duration::from_millis(100));

            let mut overhead_panel = A320HydraulicOverheadPanel::new();

            let mut yellow_epump_controller = A320YellowElectricPumpController::new(
                A320Hydraulic::YELLOW_ELEC_PUMP_CONTROL_POWER_BUS,
                A320Hydraulic::YELLOW_ELEC_PUMP_CONTROL_FROM_CARGO_DOOR_OPERATION_POWER_BUS,
            );
            yellow_epump_controller
                .receive_power(&test_electricity(ElectricalBusType::DirectCurrent(2), true));

            overhead_panel.yellow_epump_push_button.push_auto();
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, true);
            assert!(!yellow_epump_controller.should_pressurise());

            overhead_panel.yellow_epump_push_button.push_on();
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, true);
            assert!(yellow_epump_controller.should_pressurise());

            overhead_panel.yellow_epump_push_button.push_auto();
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, true);
            assert!(!yellow_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_yellow_epump_unpowered_cant_command_pump() {
            let fwd_door = Door::new(1);
            let aft_door = Door::new(2);
            let context = context(Duration::from_millis(100));

            let mut overhead_panel = A320HydraulicOverheadPanel::new();

            let mut yellow_epump_controller = A320YellowElectricPumpController::new(
                A320Hydraulic::YELLOW_ELEC_PUMP_CONTROL_POWER_BUS,
                A320Hydraulic::YELLOW_ELEC_PUMP_CONTROL_FROM_CARGO_DOOR_OPERATION_POWER_BUS,
            );

            yellow_epump_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrent(2),
                false,
            ));
            overhead_panel.yellow_epump_push_button.push_on();
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, true);
            assert!(!yellow_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_yellow_epump_cargo_doors_starts_pump_for_timeout_delay() {
            let context = context(Duration::from_millis(100));

            let mut overhead_panel = A320HydraulicOverheadPanel::new();

            let mut yellow_epump_controller = A320YellowElectricPumpController::new(
                A320Hydraulic::YELLOW_ELEC_PUMP_CONTROL_POWER_BUS,
                A320Hydraulic::YELLOW_ELEC_PUMP_CONTROL_FROM_CARGO_DOOR_OPERATION_POWER_BUS,
            );
            yellow_epump_controller
                .receive_power(&test_electricity(ElectricalBusType::DirectCurrent(2), true));

            overhead_panel.yellow_epump_push_button.push_auto();
            assert!(!yellow_epump_controller.should_pressurise());

            let aft_door = non_moving_door(2);
            let fwd_door = moving_door(1);
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, true);
            assert!(yellow_epump_controller.should_pressurise());
            let fwd_door = non_moving_door(1);

            yellow_epump_controller.update(&context.with_delta(Duration::from_secs(1) + A320YellowElectricPumpController::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION), &overhead_panel,&fwd_door,&aft_door, true);
            assert!(!yellow_epump_controller.should_pressurise());

            let aft_door = moving_door(2);
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, true);
            assert!(yellow_epump_controller.should_pressurise());
            let aft_door = non_moving_door(2);

            yellow_epump_controller.update(&context.with_delta(Duration::from_secs(1) + A320YellowElectricPumpController::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION), &overhead_panel,&fwd_door,&aft_door, true);
            assert!(!yellow_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_yellow_epump_can_operate_from_cargo_door_without_main_control_power_bus() {
            let context = context(Duration::from_millis(100));

            let mut overhead_panel = A320HydraulicOverheadPanel::new();

            let mut yellow_epump_controller = A320YellowElectricPumpController::new(
                A320Hydraulic::YELLOW_ELEC_PUMP_CONTROL_POWER_BUS,
                A320Hydraulic::YELLOW_ELEC_PUMP_CONTROL_FROM_CARGO_DOOR_OPERATION_POWER_BUS,
            );
            yellow_epump_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentGndFltService,
                false,
            ));

            overhead_panel.yellow_epump_push_button.push_auto();
            assert!(!yellow_epump_controller.should_pressurise());

            let aft_door = non_moving_door(2);
            let fwd_door = moving_door(1);
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, true);

            // Need to run again the receive power state as now cargo door is operated
            yellow_epump_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentGndFltService,
                true,
            ));
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, true);

            assert!(yellow_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_engine_driven_pump1_overhead_button_logic_with_eng_on() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let fire_overhead_panel = EngineFireOverheadPanel::new();
            overhead_panel.edp1_push_button.push_auto();

            let mut edp1_controller = A320EngineDrivenPumpController::new(
                1,
                vec![A320Hydraulic::GREEN_EDP_CONTROL_POWER_BUS1],
            );
            edp1_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                true,
            ));

            edp1_controller.engine_master_on = true;

            edp1_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(30.),
                true,
            );
            assert!(edp1_controller.should_pressurise());

            overhead_panel.edp1_push_button.push_off();
            edp1_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(30.),
                true,
            );
            assert!(!edp1_controller.should_pressurise());

            overhead_panel.edp1_push_button.push_auto();
            edp1_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(30.),
                true,
            );
            assert!(edp1_controller.should_pressurise());
        }

        #[test]
        fn controller_engine_driven_pump1_fire_overhead_released_stops_pump() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let mut fire_overhead_panel = EngineFireOverheadPanel::new();
            overhead_panel.edp1_push_button.push_auto();

            let mut edp1_controller = A320EngineDrivenPumpController::new(
                1,
                vec![A320Hydraulic::GREEN_EDP_CONTROL_POWER_BUS1],
            );
            edp1_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                true,
            ));

            edp1_controller.engine_master_on = true;

            edp1_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(30.),
                true,
            );
            assert!(edp1_controller.should_pressurise());

            let mut test_bed = SimulationTestBed::new();
            test_bed.write_bool("FIRE_BUTTON_ENG1", true);
            test_bed.run(&mut fire_overhead_panel, |_, _| {});

            edp1_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(10.),
                true,
            );
            assert!(!edp1_controller.should_pressurise());
        }

        #[test]
        fn controller_engine_driven_pump2_overhead_button_logic_with_eng_on() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let fire_overhead_panel = EngineFireOverheadPanel::new();
            overhead_panel.edp2_push_button.push_auto();

            let mut edp2_controller = A320EngineDrivenPumpController::new(
                2,
                vec![
                    A320Hydraulic::YELLOW_EDP_CONTROL_POWER_BUS1,
                    A320Hydraulic::YELLOW_EDP_CONTROL_POWER_BUS2,
                ],
            );
            edp2_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                true,
            ));

            edp2_controller.engine_master_on = true;

            edp2_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(30.),
                true,
            );
            assert!(edp2_controller.should_pressurise());

            overhead_panel.edp2_push_button.push_off();
            edp2_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(30.),
                true,
            );
            assert!(!edp2_controller.should_pressurise());

            overhead_panel.edp2_push_button.push_auto();
            edp2_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(30.),
                true,
            );
            assert!(edp2_controller.should_pressurise());
        }

        #[test]
        fn controller_engine_driven_pump2_fire_overhead_released_stops_pump() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let mut fire_overhead_panel = EngineFireOverheadPanel::new();
            overhead_panel.edp2_push_button.push_auto();

            let mut edp2_controller = A320EngineDrivenPumpController::new(
                2,
                vec![
                    A320Hydraulic::YELLOW_EDP_CONTROL_POWER_BUS1,
                    A320Hydraulic::YELLOW_EDP_CONTROL_POWER_BUS2,
                ],
            );
            edp2_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentEssential,
                true,
            ));
            edp2_controller.engine_master_on = true;

            edp2_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(30.),
                true,
            );
            assert!(edp2_controller.should_pressurise());

            let mut test_bed = SimulationTestBed::new();
            test_bed.write_bool("FIRE_BUTTON_ENG2", true);
            test_bed.run(&mut fire_overhead_panel, |_, _| {});

            edp2_controller.update(
                &overhead_panel,
                &fire_overhead_panel,
                Ratio::new::<percent>(50.),
                Pressure::new::<psi>(5.),
                true,
            );
            assert!(!edp2_controller.should_pressurise());
        }

        #[test]
        fn controller_ptu_on_off_cargo_door() {
            let tug = PushbackTug::new();
            let context = context(Duration::from_millis(100));

            let mut overhead_panel = A320HydraulicOverheadPanel::new();

            let mut ptu_controller =
                A320PowerTransferUnitController::new(ElectricalBusType::DirectCurrentGndFltService);
            ptu_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentGndFltService,
                true,
            ));
            overhead_panel.ptu_push_button.push_auto();

            ptu_controller.update(
                &context,
                &overhead_panel,
                &non_moving_door(1),
                &non_moving_door(2),
                &tug,
            );
            assert!(ptu_controller.should_enable());

            overhead_panel.ptu_push_button.push_off();

            ptu_controller.update(
                &context,
                &overhead_panel,
                &non_moving_door(1),
                &non_moving_door(2),
                &tug,
            );
            assert!(!ptu_controller.should_enable());

            overhead_panel.ptu_push_button.push_auto();

            ptu_controller.update(
                &context,
                &overhead_panel,
                &moving_door(1),
                &non_moving_door(2),
                &tug,
            );
            assert!(!ptu_controller.should_enable());

            ptu_controller.update(&context.with_delta(Duration::from_secs(1) + A320PowerTransferUnitController::DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION), &overhead_panel, &non_moving_door(1),&non_moving_door(2),&tug);
            assert!(ptu_controller.should_enable());
        }

        #[test]
        fn controller_ptu_tug() {
            let fwd_door = Door::new(1);
            let aft_door = Door::new(2);
            let mut tug = PushbackTug::new();
            let context = context(Duration::from_millis(100));

            let mut overhead_panel = A320HydraulicOverheadPanel::new();

            let mut ptu_controller =
                A320PowerTransferUnitController::new(ElectricalBusType::DirectCurrentGndFltService);
            ptu_controller.receive_power(&test_electricity(
                ElectricalBusType::DirectCurrentGndFltService,
                true,
            ));

            overhead_panel.ptu_push_button.push_auto();

            ptu_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, &tug);
            assert!(ptu_controller.should_enable());

            ptu_controller.weight_on_wheels = true;
            ptu_controller.eng_1_master_on = true;
            ptu_controller.eng_2_master_on = false;
            ptu_controller.parking_brake_lever_pos = false;

            tug = detached_tug();
            ptu_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, &tug);
            assert!(ptu_controller.should_enable());

            tug = attached_tug();
            ptu_controller.update(&context, &overhead_panel, &fwd_door, &aft_door, &tug);
            assert!(!ptu_controller.should_enable());

            tug = detached_tug();
            ptu_controller.update(&context.with_delta(Duration::from_secs(1) + A320PowerTransferUnitController::DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK), &overhead_panel, &fwd_door, &aft_door,&tug);
            assert!(ptu_controller.should_enable());
        }

        #[test]
        fn rat_does_not_deploy_on_ground_at_eng_off() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .on_the_ground()
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(10));

            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.get_rat_position() <= 0.);
            assert!(test_bed.get_rat_rpm() <= 1.);

            test_bed = test_bed
                .ac_bus_1_lost()
                .ac_bus_2_lost()
                .run_waiting_for(Duration::from_secs(2));

            // RAT has not deployed
            assert!(test_bed.get_rat_position() <= 0.);
            assert!(test_bed.get_rat_rpm() <= 1.);
        }

        #[test]
        fn rat_deploys_on_both_ac_lost() {
            let mut test_bed = test_bed_with()
                .set_cold_dark_inputs()
                .in_flight()
                .start_eng1(Ratio::new::<percent>(80.))
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(10));

            assert!(!test_bed.rat_deploy_commanded());

            test_bed = test_bed
                .ac_bus_1_lost()
                .run_waiting_for(Duration::from_secs(2));

            assert!(!test_bed.rat_deploy_commanded());

            // Now all AC off should deploy RAT in flight
            test_bed = test_bed
                .ac_bus_1_lost()
                .ac_bus_2_lost()
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.rat_deploy_commanded());
        }

        #[test]
        fn blue_epump_unavailable_if_unpowered() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(80.))
                .run_waiting_for(Duration::from_secs(10));

            // Blue epump working
            assert!(test_bed.is_blue_pressurised());

            test_bed = test_bed
                .ac_bus_2_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Blue epump still working as it's not plugged on AC2
            assert!(test_bed.is_blue_pressurised());

            test_bed = test_bed
                .ac_bus_1_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Blue epump has stopped
            assert!(!test_bed.is_blue_pressurised());
        }

        #[test]
        fn yellow_epump_unavailable_if_unpowered() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(10));

            // Yellow epump working
            assert!(test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .ac_bus_2_lost()
                .ac_bus_1_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Yellow epump still working as not plugged on AC2 or AC1
            assert!(test_bed.is_yellow_pressurised());

            test_bed = test_bed
                .ac_ground_service_lost()
                .run_waiting_for(Duration::from_secs(25));

            // Yellow epump has stopped
            assert!(!test_bed.is_yellow_pressurised());
        }

        fn context(delta_time: Duration) -> UpdateContext {
            UpdateContext::new(
                delta_time,
                Velocity::new::<knot>(250.),
                Length::new::<foot>(5000.),
                ThermodynamicTemperature::new::<degree_celsius>(25.0),
                true,
                Acceleration::new::<foot_per_second_squared>(0.),
            )
        }

        fn moving_door(id: usize) -> Door {
            let mut door = Door::new(id);
            door.position += 0.01;
            door
        }

        fn non_moving_door(id: usize) -> Door {
            let mut door = Door::new(id);
            door.previous_position = door.position;
            door
        }

        fn attached_tug() -> PushbackTug {
            let mut tug = PushbackTug::new();
            tug.angle = tug.previous_angle + 0.1;
            tug.state = 0.;
            tug.update();
            tug
        }

        fn detached_tug() -> PushbackTug {
            let mut tug = PushbackTug::new();
            tug.angle = tug.previous_angle;
            tug.state = 3.;
            tug.update();
            tug
        }

        fn test_electricity(bus_id: ElectricalBusType, is_powered: bool) -> Electricity {
            let mut electricity = Electricity::new();
            let mut source = TestElectricitySource::unpowered(
                PotentialOrigin::EngineGenerator(1),
                &mut electricity,
            );

            if is_powered {
                source.power();
            }

            let bus = ElectricalBus::new(bus_id, &mut electricity);

            electricity.supplied_by(&source);
            electricity.flow(&source, &bus);

            electricity
        }
    }
}
