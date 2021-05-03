use std::time::Duration;
use uom::si::{f64::*, pressure::pascal, pressure::psi, velocity::knot, volume::gallon};

use systems::hydraulic::{
    ElectricPump, EngineDrivenPump, HydFluid, HydraulicLoop, HydraulicLoopController,
    PowerTransferUnit, PowerTransferUnitController, PumpController, RamAirTurbine,
    RamAirTurbineController,
};
use systems::overhead::{
    AutoOffFaultPushButton, AutoOnFaultPushButton, FirePushButton, OnOffFaultPushButton,
};
use systems::simulation::{
    SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter, UpdateContext,
};
use systems::{engine::Engine, landing_gear::LandingGear};
use systems::{
    hydraulic::brakecircuit::BrakeCircuit, shared::DelayedFalseLogicGate,
    shared::DelayedTrueLogicGate,
};

pub(super) struct A320Hydraulic {
    hyd_brake_logic: A320HydraulicBrakingLogic,
    blue_loop: HydraulicLoop,
    blue_loop_controller: A320HydraulicLoopController,
    green_loop: HydraulicLoop,
    green_loop_controller: A320HydraulicLoopController,
    yellow_loop: HydraulicLoop,
    yellow_loop_controller: A320HydraulicLoopController,

    engine_driven_pump_1: EngineDrivenPump,
    engine_driven_pump_1_controller: A320EngineDrivenPumpController,

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
    total_sim_time_elapsed: Duration,
    lag_time_accumulator: Duration,
}
impl A320Hydraulic {
    const MIN_PRESS_PRESSURISED_LO_HYST: f64 = 1450.0;
    const MIN_PRESS_PRESSURISED_HI_HYST: f64 = 1750.0;

    const HYDRAULIC_SIM_TIME_STEP: u64 = 100; // Refresh rate of hydraulic simulation in ms
    const ACTUATORS_SIM_TIME_STEP_MULT: u32 = 2; // Refresh rate of actuators as multiplier of hydraulics. 2 means double frequency update

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
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
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
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
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
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
                Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_LO_HYST),
                Pressure::new::<psi>(Self::MIN_PRESS_PRESSURISED_HI_HYST),
            ),
            yellow_loop_controller: A320HydraulicLoopController::new(Some(2)),

            engine_driven_pump_1: EngineDrivenPump::new("GREEN"),
            engine_driven_pump_1_controller: A320EngineDrivenPumpController::new(1),

            engine_driven_pump_2: EngineDrivenPump::new("YELLOW"),
            engine_driven_pump_2_controller: A320EngineDrivenPumpController::new(2),

            blue_electric_pump: ElectricPump::new("BLUE"),
            blue_electric_pump_controller: A320BlueElectricPumpController::new(),

            yellow_electric_pump: ElectricPump::new("YELLOW"),
            yellow_electric_pump_controller: A320YellowElectricPumpController::new(),

            forward_cargo_door: Door::new(5),
            aft_cargo_door: Door::new(3),
            pushback_tug: PushbackTug::new(),

            ram_air_turbine: RamAirTurbine::new(),
            ram_air_turbine_controller: A320RamAirTurbineController::new(),

            power_transfer_unit: PowerTransferUnit::new(),
            power_transfer_unit_controller: A320PowerTransferUnitController::new(),

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

            total_sim_time_elapsed: Duration::new(0, 0),
            lag_time_accumulator: Duration::new(0, 0),
        }
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        engine1: &Engine,
        engine2: &Engine,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_overhead: &A320EngineFireOverheadPanel,
        landing_gear: &LandingGear,
    ) {
        let min_hyd_loop_timestep = Duration::from_millis(Self::HYDRAULIC_SIM_TIME_STEP); //Hyd Sim rate = 10 Hz

        self.total_sim_time_elapsed += context.delta();

        // Time to catch up in our simulation = new delta + time not updated last iteration
        let time_to_catch = context.delta() + self.lag_time_accumulator;

        // Number of time steps (with floating part) to do according to required time step
        let number_of_steps_floating_point =
            time_to_catch.as_secs_f64() / min_hyd_loop_timestep.as_secs_f64();

        // Here we update everything requiring same refresh as the sim calls us, more likely visual stuff
        self.update_at_every_frames(&context);

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
                    engine_fire_overhead,
                    landing_gear,
                );
            }

            // This is the "fast" update loop refreshing ACTUATORS_SIM_TIME_STEP_MULT times faster
            // here put everything that needs higher simulation rates like physics solving
            let num_of_actuators_update_loops =
                num_of_update_loops * Self::ACTUATORS_SIM_TIME_STEP_MULT;
            let delta_time_physics = min_hyd_loop_timestep / Self::ACTUATORS_SIM_TIME_STEP_MULT; //If X times faster we divide step by X
            for _ in 0..num_of_actuators_update_loops {
                self.update_fast_rate(&context, &delta_time_physics);
            }
        }
    }

    fn green_edp_has_fault(&self) -> bool {
        // TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        // at current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        self.engine_driven_pump_1_controller.should_pressurise()
            && !self.green_loop.is_pressurised()
    }

    fn yellow_epump_has_fault(&self) -> bool {
        // TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        // at current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        self.yellow_electric_pump_controller.should_pressurise()
            && !self.yellow_loop.is_pressurised()
    }

    fn yellow_edp_has_fault(&self) -> bool {
        // TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        // at current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        self.engine_driven_pump_2_controller.should_pressurise()
            && !self.yellow_loop.is_pressurised()
    }

    fn blue_epump_has_fault(&self) -> bool {
        // TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        // at current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        self.blue_electric_pump_controller.should_pressurise() && !self.blue_loop.is_pressurised()
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

    pub(super) fn is_blue_pressurised(&self) -> bool {
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
    fn update_at_every_frames(&mut self, context: &UpdateContext) {
        // Updating rat stowed pos on all frames in case it's used for graphics
        self.ram_air_turbine.update_position(&context.delta());

        // Tug has its angle changing on each frame and we'd like to detect this
        self.pushback_tug.update();
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
    fn update_fixed_step(
        &mut self,
        context: &UpdateContext,
        engine1: &Engine,
        engine2: &Engine,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_overhead: &A320EngineFireOverheadPanel,
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

        self.engine_driven_pump_1_controller
            .update(overhead_panel, engine_fire_overhead);
        self.engine_driven_pump_1.update(
            context,
            &self.green_loop,
            &engine1,
            &self.engine_driven_pump_1_controller,
        );

        self.engine_driven_pump_2_controller
            .update(overhead_panel, engine_fire_overhead);
        self.engine_driven_pump_2.update(
            context,
            &self.yellow_loop,
            &engine2,
            &self.engine_driven_pump_2_controller,
        );

        self.blue_electric_pump_controller.update(overhead_panel);
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
        );
        self.yellow_electric_pump.update(
            context,
            &self.yellow_loop,
            &self.yellow_electric_pump_controller,
        );

        self.ram_air_turbine_controller.update(context);
        self.ram_air_turbine
            .update(context, &self.blue_loop, &self.ram_air_turbine_controller);

        self.green_loop_controller.update(engine_fire_overhead);
        self.green_loop.update(
            context,
            Vec::new(),
            vec![&self.engine_driven_pump_1],
            Vec::new(),
            vec![&self.power_transfer_unit],
            &self.green_loop_controller,
        );

        self.yellow_loop_controller.update(engine_fire_overhead);
        self.yellow_loop.update(
            context,
            vec![&self.yellow_electric_pump],
            vec![&self.engine_driven_pump_2],
            Vec::new(),
            vec![&self.power_transfer_unit],
            &self.yellow_loop_controller,
        );

        self.blue_loop_controller.update(engine_fire_overhead);
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
impl SimulationElement for A320Hydraulic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.engine_driven_pump_1.accept(visitor);
        self.engine_driven_pump_1_controller.accept(visitor);

        self.engine_driven_pump_2.accept(visitor);
        self.engine_driven_pump_2_controller.accept(visitor);

        self.blue_electric_pump.accept(visitor);
        self.blue_electric_pump_controller.accept(visitor);

        self.yellow_electric_pump.accept(visitor);

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

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_bool("HYD_GREEN_EDPUMP_LOW_PRESS", self.green_edp_has_fault());
        writer.write_bool("HYD_BLUE_EPUMP_LOW_PRESS", self.blue_epump_has_fault());
        writer.write_bool("HYD_YELLOW_EDPUMP_LOW_PRESS", self.yellow_edp_has_fault());
        writer.write_bool("HYD_YELLOW_EPUMP_LOW_PRESS", self.yellow_epump_has_fault());
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

    fn update(&mut self, engine_fire_overhead: &A320EngineFireOverheadPanel) {
        if let Some(eng_number) = self.engine_number {
            self.should_open_fire_shutoff_valve =
                !engine_fire_overhead.fire_push_button_is_released(eng_number);
        }
    }
}
impl HydraulicLoopController for A320HydraulicLoopController {
    fn should_open_fire_shutoff_valve(&self) -> bool {
        self.should_open_fire_shutoff_valve
    }
}

struct A320EngineDrivenPumpController {
    engine_number: usize,
    engine_master_on_id: String,
    engine_master_on: bool,
    should_pressurise: bool,
}
impl A320EngineDrivenPumpController {
    fn new(engine_number: usize) -> Self {
        Self {
            engine_number,
            engine_master_on_id: format!("GENERAL ENG STARTER ACTIVE:{}", engine_number),
            engine_master_on: false,
            should_pressurise: true,
        }
    }

    fn update(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_overhead: &A320EngineFireOverheadPanel,
    ) {
        if overhead_panel.edp_push_button_is_auto(self.engine_number)
            && self.engine_master_on
            && !engine_fire_overhead.fire_push_button_is_released(self.engine_number)
        {
            self.should_pressurise = true;
        } else if overhead_panel.edp_push_button_is_off(self.engine_number)
            || engine_fire_overhead.fire_push_button_is_released(self.engine_number)
        {
            self.should_pressurise = false;
        }
    }
}
impl PumpController for A320EngineDrivenPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}
impl SimulationElement for A320EngineDrivenPumpController {
    fn read(&mut self, state: &mut SimulatorReader) {
        self.engine_master_on = state.read_bool(&self.engine_master_on_id);
    }
}

struct A320BlueElectricPumpController {
    should_pressurise: bool,
    engine_1_master_on: bool,
    engine_2_master_on: bool,
}
impl A320BlueElectricPumpController {
    fn new() -> Self {
        Self {
            should_pressurise: false,
            engine_1_master_on: false,
            engine_2_master_on: false,
        }
    }

    fn update(&mut self, overhead_panel: &A320HydraulicOverheadPanel) {
        if overhead_panel.blue_epump_push_button.is_auto() {
            if self.engine_1_master_on
                || self.engine_2_master_on
                || overhead_panel.blue_epump_override_push_button_is_on()
            {
                self.should_pressurise = true;
            } else {
                self.should_pressurise = false;
            }
        } else if overhead_panel.blue_epump_push_button_is_off() {
            self.should_pressurise = false;
        }
    }
}
impl PumpController for A320BlueElectricPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}
impl SimulationElement for A320BlueElectricPumpController {
    fn read(&mut self, state: &mut SimulatorReader) {
        self.engine_1_master_on = state.read_bool("GENERAL ENG STARTER ACTIVE:1");
        self.engine_2_master_on = state.read_bool("GENERAL ENG STARTER ACTIVE:2");
    }
}
impl Default for A320BlueElectricPumpController {
    fn default() -> Self {
        Self::new()
    }
}

struct A320YellowElectricPumpController {
    should_pressurise: bool,
    should_activate_yellow_pump_for_cargo_door_operation: DelayedFalseLogicGate,
}
impl A320YellowElectricPumpController {
    const DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION: Duration =
        Duration::from_secs(20);

    fn new() -> Self {
        Self {
            should_pressurise: false,
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
    ) {
        self.should_activate_yellow_pump_for_cargo_door_operation
            .update(
                context,
                forward_cargo_door.has_moved() || aft_cargo_door.has_moved(),
            );

        self.should_pressurise = overhead_panel.yellow_epump_push_button.is_on()
            || self
                .should_activate_yellow_pump_for_cargo_door_operation
                .output();
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
impl Default for A320YellowElectricPumpController {
    fn default() -> Self {
        Self::new()
    }
}

struct A320PowerTransferUnitController {
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

    fn new() -> Self {
        Self {
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

        self.should_enable = overhead_panel.ptu_push_button_is_auto()
            && (!self.weight_on_wheels
                || self.eng_1_master_on && self.eng_2_master_on
                || !self.eng_1_master_on && !self.eng_2_master_on
                || (!self.parking_brake_lever_pos
                    && !self.nose_wheel_steering_pin_inserted.output()))
            && !ptu_inhibited;
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
    fn read(&mut self, state: &mut SimulatorReader) {
        self.parking_brake_lever_pos = state.read_bool("BRAKE PARKING INDICATOR");
        self.eng_1_master_on = state.read_bool("GENERAL ENG STARTER ACTIVE:1");
        self.eng_2_master_on = state.read_bool("GENERAL ENG STARTER ACTIVE:2");
        self.weight_on_wheels = state.read_bool("SIM ON GROUND");
    }
}

struct A320RamAirTurbineController {
    should_deploy: bool,
    eng_1_master_on: bool,
    eng_2_master_on: bool,
}
impl A320RamAirTurbineController {
    fn new() -> Self {
        Self {
            should_deploy: false,
            eng_1_master_on: false,
            eng_2_master_on: false,
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        // RAT Deployment
        // Todo check all other needed conditions this is faked with engine master while it should check elec buses
        self.should_deploy = !self.eng_1_master_on
            && !self.eng_2_master_on
            //Todo get speed from ADIRS
            && context.indicated_airspeed() > Velocity::new::<knot>(100.)
    }
}
impl RamAirTurbineController for A320RamAirTurbineController {
    fn should_deploy(&self) -> bool {
        self.should_deploy
    }
}
impl SimulationElement for A320RamAirTurbineController {
    fn read(&mut self, state: &mut SimulatorReader) {
        self.eng_1_master_on = state.read_bool("GENERAL ENG STARTER ACTIVE:1");
        self.eng_2_master_on = state.read_bool("GENERAL ENG STARTER ACTIVE:2");
    }
}

pub struct A320HydraulicBrakingLogic {
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
// Implements brakes computers logic
impl A320HydraulicBrakingLogic {
    // Minimum pressure hysteresis on green until main switched on ALTN brakes
    // Feedback by Cpt. Chaos — 25/04/2021 #pilot-feedback
    const MIN_PRESSURE_BRAKE_ALTN_HYST_LO: f64 = 1305.;
    const MIN_PRESSURE_BRAKE_ALTN_HYST_HI: f64 = 2176.;

    // Min pressure when parking brake enabled. Lower normal braking is allowed to use pilot input as emergency braking
    // Feedback by avteknisyan — 25/04/2021 #pilot-feedback
    const MIN_PRESSURE_PARK_BRAKE_EMERGENCY: f64 = 507.;

    const AUTOBRAKE_GEAR_RETRACTION_DURATION_S: f64 = 3.;

    pub fn new() -> A320HydraulicBrakingLogic {
        A320HydraulicBrakingLogic {
            parking_brake_demand: true, // Position of parking brake lever
            weight_on_wheels: true,
            is_gear_lever_down: true,
            left_brake_pilot_input: 0.0,
            right_brake_pilot_input: 0.0,
            left_brake_green_output: 0.0, // Actual command sent to left green circuit
            left_brake_yellow_output: 1.0, // Actual command sent to left yellow circuit. Init 1 as considering park brake on on init
            right_brake_green_output: 0.0, // Actual command sent to right green circuit
            right_brake_yellow_output: 1.0, // Actual command sent to right yellow circuit. Init 1 as considering park brake on on init
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

    pub fn update_brake_pressure_limitation(
        &mut self,
        norm_brk: &mut BrakeCircuit,
        altn_brk: &mut BrakeCircuit,
    ) {
        let yellow_manual_braking_input = self.left_brake_pilot_input
            > self.left_brake_yellow_output + 0.2
            || self.right_brake_pilot_input > self.right_brake_yellow_output + 0.2;

        // Nominal braking from pedals is limited to 2538psi
        norm_brk.set_brake_limit_ena(true);
        norm_brk.set_brake_press_limit(Pressure::new::<psi>(2538.));

        if self.parking_brake_demand {
            altn_brk.set_brake_limit_ena(true);

            // If no pilot action, standard park brake pressure limit
            if !yellow_manual_braking_input {
                altn_brk.set_brake_press_limit(Pressure::new::<psi>(2103.));
            } else {
                // Else manual action limited to a higher max nominal pressure
                altn_brk.set_brake_press_limit(Pressure::new::<psi>(2538.));
            }
        } else if !self.anti_skid_activated {
            altn_brk.set_brake_press_limit(Pressure::new::<psi>(1160.));
            altn_brk.set_brake_limit_ena(true);
        } else {
            // Else if any manual braking we use standard limit
            altn_brk.set_brake_press_limit(Pressure::new::<psi>(2538.));
            altn_brk.set_brake_limit_ena(true);
        }
    }

    // Updates final brake demands per hydraulic loop based on pilot pedal demands
    pub fn update_brake_demands(
        &mut self,
        context: &UpdateContext,
        green_loop: &HydraulicLoop,
        alternate_circuit: &BrakeCircuit,
        landing_gear: &LandingGear,
    ) {
        self.update_normal_braking_availability(&green_loop.get_pressure());

        let is_in_flight_gear_lever_up = !self.weight_on_wheels && !self.is_gear_lever_down;
        self.should_disable_auto_brake_when_retracting.update(
            context,
            !landing_gear.is_down_and_locked() && !self.is_gear_lever_down,
        );

        if is_in_flight_gear_lever_up {
            if self.should_disable_auto_brake_when_retracting.output() {
                self.left_brake_green_output = 0.;
                self.right_brake_green_output = 0.;
                self.left_brake_yellow_output = 0.;
                self.right_brake_yellow_output = 0.;
            } else {
                self.left_brake_green_output = 0.2; // Slight brake pressure to stop the spinning wheels
                self.right_brake_green_output = 0.2; // Slight brake pressure to stop the spinning wheels
            }
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
                    if alternate_circuit.get_brake_pressure_left().get::<psi>()
                        < Self::MIN_PRESSURE_PARK_BRAKE_EMERGENCY
                        || alternate_circuit.get_brake_pressure_right().get::<psi>()
                            < Self::MIN_PRESSURE_PARK_BRAKE_EMERGENCY
                    {
                        self.left_brake_green_output = self.left_brake_pilot_input;
                        self.right_brake_green_output = self.right_brake_pilot_input;
                    }
                }
            }
        }

        //limiting final values
        self.left_brake_yellow_output = self.left_brake_yellow_output.min(1.).max(0.);
        self.right_brake_yellow_output = self.right_brake_yellow_output.min(1.).max(0.);
        self.left_brake_green_output = self.left_brake_green_output.min(1.).max(0.);
        self.right_brake_green_output = self.right_brake_green_output.min(1.).max(0.);
    }

    pub fn send_brake_demands(&mut self, norm: &mut BrakeCircuit, altn: &mut BrakeCircuit) {
        norm.set_brake_demand_left(self.left_brake_green_output);
        norm.set_brake_demand_right(self.right_brake_green_output);
        altn.set_brake_demand_left(self.left_brake_yellow_output);
        altn.set_brake_demand_right(self.right_brake_yellow_output);
    }
}

impl SimulationElement for A320HydraulicBrakingLogic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, state: &mut SimulatorReader) {
        self.parking_brake_demand = state.read_bool("BRAKE PARKING INDICATOR");
        self.weight_on_wheels = state.read_bool("SIM ON GROUND");
        self.is_gear_lever_down = state.read_bool("GEAR HANDLE POSITION");
        self.anti_skid_activated = state.read_bool("ANTISKID BRAKES ACTIVE");
        self.left_brake_pilot_input = state.read_f64("BRAKE LEFT POSITION") / 100.0;
        self.right_brake_pilot_input = state.read_f64("BRAKE RIGHT POSITION") / 100.0;
        self.autobrakes_setting = state.read_f64("AUTOBRAKES SETTING").floor() as u8;
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
        self.position = state.read_f64(&self.exit_id);
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

    pub fn update(&mut self) {
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
        self.angle = state.read_f64("PUSHBACK ANGLE");
        self.state = state.read_f64("PUSHBACK STATE");
    }
}

pub(super) struct A320HydraulicOverheadPanel {
    edp1_push_button: AutoOffFaultPushButton,
    edp2_push_button: AutoOffFaultPushButton,
    blue_epump_push_button: AutoOffFaultPushButton,
    ptu_push_button: AutoOffFaultPushButton,
    rat_push_button: AutoOffFaultPushButton,
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
            rat_push_button: AutoOffFaultPushButton::new_off("HYD_RAT"),
            yellow_epump_push_button: AutoOnFaultPushButton::new_auto("HYD_EPUMPY"),
            blue_epump_override_push_button: OnOffFaultPushButton::new_off("HYD_EPUMPY_OVRD"),
        }
    }

    pub(super) fn update(&mut self, hyd: &A320Hydraulic) {
        self.edp1_push_button.set_fault(hyd.green_edp_has_fault());
        self.edp2_push_button.set_fault(hyd.yellow_edp_has_fault());
        self.blue_epump_push_button
            .set_fault(hyd.blue_epump_has_fault());
        self.yellow_epump_push_button
            .set_fault(hyd.yellow_epump_has_fault());
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

pub struct A320EngineFireOverheadPanel {
    eng1_fire_pb: FirePushButton,
    eng2_fire_pb: FirePushButton,
}
impl A320EngineFireOverheadPanel {
    pub fn new() -> Self {
        Self {
            eng1_fire_pb: FirePushButton::new("ENG1"),
            eng2_fire_pb: FirePushButton::new("ENG2"),
        }
    }

    fn fire_push_button_is_released(&self, engine_number: usize) -> bool {
        match engine_number {
            1 => self.eng1_fire_pb.is_released(),
            2 => self.eng2_fire_pb.is_released(),
            _ => panic!("The A320 only supports two engines."),
        }
    }
}
impl SimulationElement for A320EngineFireOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.eng1_fire_pb.accept(visitor);
        self.eng2_fire_pb.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::Rng;

    mod a320_hydraulics {
        use super::*;
        use systems::simulation::{test::SimulationTestBed, Aircraft};
        use uom::si::{
            acceleration::foot_per_second_squared, length::foot, ratio::percent,
            thermodynamic_temperature::degree_celsius, velocity::knot,
        };

        struct A320HydraulicsTestAircraft {
            engine_1: Engine,
            engine_2: Engine,
            hydraulics: A320Hydraulic,
            overhead: A320HydraulicOverheadPanel,
            engine_fire_overhead: A320EngineFireOverheadPanel,
            landing_gear: LandingGear,
        }
        impl A320HydraulicsTestAircraft {
            fn new() -> Self {
                Self {
                    engine_1: Engine::new(1),
                    engine_2: Engine::new(2),
                    hydraulics: A320Hydraulic::new(),
                    overhead: A320HydraulicOverheadPanel::new(),
                    engine_fire_overhead: A320EngineFireOverheadPanel::new(),
                    landing_gear: LandingGear::new(),
                }
            }

            fn get_yellow_brake_accumulator_fluid_volume(&self) -> Volume {
                self.hydraulics.braking_circuit_altn.get_acc_fluid_volume()
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

            fn set_engine_1_n2(&mut self, n2: Ratio) {
                self.engine_1.corrected_n2 = n2;
            }
            fn set_engine_2_n2(&mut self, n2: Ratio) {
                self.engine_2.corrected_n2 = n2;
            }
        }

        impl Aircraft for A320HydraulicsTestAircraft {
            fn update_after_power_distribution(&mut self, context: &UpdateContext) {
                self.hydraulics.update(
                    context,
                    &self.engine_1,
                    &self.engine_2,
                    &self.overhead,
                    &self.engine_fire_overhead,
                    &self.landing_gear,
                );

                self.overhead.update(&self.hydraulics);
            }
        }
        impl SimulationElement for A320HydraulicsTestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.hydraulics.accept(visitor);
                self.overhead.accept(visitor);
                self.engine_fire_overhead.accept(visitor);
                self.landing_gear.accept(visitor);

                visitor.visit(self);
            }
        }

        struct A320HydraulicsTestBed {
            aircraft: A320HydraulicsTestAircraft,
            simulation_test_bed: SimulationTestBed,
        }
        impl A320HydraulicsTestBed {
            fn new() -> Self {
                let mut aircraft = A320HydraulicsTestAircraft::new();
                Self {
                    simulation_test_bed: SimulationTestBed::seeded_with(&mut aircraft),
                    aircraft,
                }
            }

            fn run_one_tick(self) -> Self {
                self.run_waiting_for(Duration::from_millis(
                    A320Hydraulic::HYDRAULIC_SIM_TIME_STEP,
                ))
            }

            fn run_waiting_for(mut self, delta: Duration) -> Self {
                self.simulation_test_bed.set_delta(delta);
                self.simulation_test_bed.run_aircraft(&mut self.aircraft);
                self
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
                Pressure::new::<psi>(self.simulation_test_bed.read_f64("HYD_GREEN_PRESSURE"))
            }

            fn blue_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.simulation_test_bed.read_f64("HYD_BLUE_PRESSURE"))
            }

            fn yellow_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(self.simulation_test_bed.read_f64("HYD_YELLOW_PRESSURE"))
            }

            fn get_yellow_reservoir_volume(&mut self) -> Volume {
                Volume::new::<gallon>(self.simulation_test_bed.read_f64("HYD_YELLOW_RESERVOIR"))
            }

            fn get_brake_left_yellow_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(
                    self.simulation_test_bed
                        .read_f64("HYD_BRAKE_ALTN_LEFT_PRESS"),
                )
            }

            fn get_brake_right_yellow_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(
                    self.simulation_test_bed
                        .read_f64("HYD_BRAKE_ALTN_RIGHT_PRESS"),
                )
            }

            fn get_green_reservoir_volume(&mut self) -> Volume {
                Volume::new::<gallon>(self.simulation_test_bed.read_f64("HYD_GREEN_RESERVOIR"))
            }

            fn get_blue_reservoir_volume(&mut self) -> Volume {
                Volume::new::<gallon>(self.simulation_test_bed.read_f64("HYD_BLUE_RESERVOIR"))
            }

            fn get_brake_left_green_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(
                    self.simulation_test_bed
                        .read_f64("HYD_BRAKE_NORM_LEFT_PRESS"),
                )
            }

            fn get_brake_right_green_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(
                    self.simulation_test_bed
                        .read_f64("HYD_BRAKE_NORM_RIGHT_PRESS"),
                )
            }

            fn get_brake_yellow_accumulator_pressure(&mut self) -> Pressure {
                Pressure::new::<psi>(
                    self.simulation_test_bed
                        .read_f64("HYD_BRAKE_ALTN_ACC_PRESS"),
                )
            }

            fn get_brake_yellow_accumulator_fluid_volume(&self) -> Volume {
                self.aircraft.get_yellow_brake_accumulator_fluid_volume()
            }

            fn is_fire_valve_eng1_closed(&mut self) -> bool {
                !self
                    .simulation_test_bed
                    .read_bool("HYD_GREEN_FIRE_VALVE_OPENED")
                    && !self
                        .aircraft
                        .hydraulics
                        .green_loop
                        .is_fire_shutoff_valve_opened()
            }

            fn is_fire_valve_eng2_closed(&mut self) -> bool {
                !self
                    .simulation_test_bed
                    .read_bool("HYD_YELLOW_FIRE_VALVE_OPENED")
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
                self.simulation_test_bed
                    .set_indicated_altitude(Length::new::<foot>(0.));
                self.simulation_test_bed.set_on_ground(true);
                self.simulation_test_bed
                    .set_indicated_airspeed(Velocity::new::<knot>(5.));
                self
            }

            fn in_flight(mut self) -> Self {
                self.simulation_test_bed.set_on_ground(false);
                self.simulation_test_bed
                    .set_indicated_altitude(Length::new::<foot>(2500.));
                self.simulation_test_bed
                    .set_indicated_airspeed(Velocity::new::<knot>(180.));
                self.start_eng1(Ratio::new::<percent>(60.))
                    .start_eng2(Ratio::new::<percent>(60.))
                    .set_gear_up()
                    .set_park_brake(false)
            }

            fn set_gear_compressed_switch(mut self, is_compressed: bool) -> Self {
                self.simulation_test_bed.set_on_ground(is_compressed);
                self
            }

            fn set_eng1_fire_button(mut self, is_active: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("FIRE_BUTTON_ENG1", is_active);
                self
            }

            fn set_eng2_fire_button(mut self, is_active: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("FIRE_BUTTON_ENG2", is_active);
                self
            }

            fn set_cargo_door_state(mut self, position: f64) -> Self {
                self.simulation_test_bed.write_f64("EXIT OPEN:5", position);
                self
            }

            fn set_pushback_state(mut self, is_pushed_back: bool) -> Self {
                if is_pushed_back {
                    let mut rng = rand::thread_rng();

                    self.simulation_test_bed
                        .write_f64("PUSHBACK ANGLE", rng.gen_range(0.0..0.1));
                    self.simulation_test_bed.write_f64("PUSHBACK STATE", 0.);
                } else {
                    self.simulation_test_bed.write_f64("PUSHBACK STATE", 3.);
                }
                self
            }

            fn start_eng1(mut self, n2: Ratio) -> Self {
                self.simulation_test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:1", true);
                self.aircraft.set_engine_1_n2(n2);

                self
            }

            fn start_eng2(mut self, n2: Ratio) -> Self {
                self.simulation_test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:2", true);
                self.aircraft.set_engine_2_n2(n2);

                self
            }

            fn stop_eng1(mut self) -> Self {
                self.simulation_test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:1", false);
                self.aircraft.set_engine_1_n2(Ratio::new::<percent>(0.));

                self
            }

            fn stop_eng2(mut self) -> Self {
                self.simulation_test_bed
                    .write_bool("GENERAL ENG STARTER ACTIVE:2", false);
                self.aircraft.set_engine_2_n2(Ratio::new::<percent>(0.));

                self
            }

            fn set_park_brake(mut self, is_set: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("BRAKE PARKING INDICATOR", is_set);
                self
            }

            fn set_gear_up(mut self) -> Self {
                self.simulation_test_bed
                    .write_f64("GEAR CENTER POSITION", 0.);
                self.simulation_test_bed
                    .write_bool("GEAR HANDLE POSITION", false);

                self
            }

            fn set_gear_down(mut self) -> Self {
                self.simulation_test_bed
                    .write_f64("GEAR CENTER POSITION", 100.);
                self.simulation_test_bed
                    .write_bool("GEAR HANDLE POSITION", true);

                self
            }

            fn set_anti_skid(mut self, is_set: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("ANTISKID BRAKES ACTIVE", is_set);
                self
            }

            fn set_yellow_e_pump(mut self, is_auto: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("OVHD_HYD_EPUMPY_PB_IS_AUTO", is_auto);
                self
            }

            fn set_blue_e_pump(mut self, is_auto: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("OVHD_HYD_EPUMPB_PB_IS_AUTO", is_auto);
                self
            }

            fn set_blue_e_pump_ovrd(mut self, is_on: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("OVHD_HYD_EPUMPY_OVRD_PB_IS_ON", is_on);
                self
            }

            fn set_green_ed_pump(mut self, is_auto: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO", is_auto);
                self
            }

            fn set_yellow_ed_pump(mut self, is_auto: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO", is_auto);
                self
            }

            fn set_ptu_state(mut self, is_auto: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("OVHD_HYD_PTU_PB_IS_AUTO", is_auto);
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

            fn set_left_brake(mut self, position_percent: Ratio) -> Self {
                self.simulation_test_bed
                    .write_f64("BRAKE LEFT POSITION", position_percent.get::<percent>());
                self
            }

            fn set_right_brake(mut self, position_percent: Ratio) -> Self {
                self.simulation_test_bed
                    .write_f64("BRAKE RIGHT POSITION", position_percent.get::<percent>());
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
                .start_eng2(Ratio::new::<percent>(50.))
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
                .start_eng1(Ratio::new::<percent>(50.))
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
                .start_eng1(Ratio::new::<percent>(50.))
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
        fn edp_deactivation() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .run_one_tick();

            // Starting eng 1
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(50.))
                .start_eng2(Ratio::new::<percent>(50.))
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
                .start_eng2(Ratio::new::<percent>(50.))
                .run_one_tick();
            // ALMOST No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());

            //Blue is auto run
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));

            // Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(50.))
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
                    .start_eng2(Ratio::new::<percent>(50.))
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
                .start_eng1(Ratio::new::<percent>(50.))
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
                    .start_eng1(Ratio::new::<percent>(50.))
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
                    .start_eng1(Ratio::new::<percent>(50.))
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
                    .start_eng2(Ratio::new::<percent>(50.))
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
                .start_eng2(Ratio::new::<percent>(50.))
                .start_eng1(Ratio::new::<percent>(50.))
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
        fn controller_blue_epump_split_master_switch() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            overhead_panel.blue_epump_override_push_button.push_off();

            let mut blue_epump_controller = A320BlueElectricPumpController::new();

            blue_epump_controller.update(&overhead_panel);
            assert!(!blue_epump_controller.should_pressurise());

            blue_epump_controller.engine_1_master_on = true;
            blue_epump_controller.engine_2_master_on = false;
            blue_epump_controller.update(&overhead_panel);
            assert!(blue_epump_controller.should_pressurise());

            blue_epump_controller.engine_1_master_on = false;
            blue_epump_controller.engine_2_master_on = true;
            blue_epump_controller.update(&overhead_panel);
            assert!(blue_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_blue_epump_on_off_master_switch() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            overhead_panel.blue_epump_override_push_button.push_off();

            let mut blue_epump_controller = A320BlueElectricPumpController::new();

            blue_epump_controller.engine_1_master_on = true;
            blue_epump_controller.engine_2_master_on = true;
            blue_epump_controller.update(&overhead_panel);
            assert!(blue_epump_controller.should_pressurise());

            blue_epump_controller.engine_1_master_on = false;
            blue_epump_controller.engine_2_master_on = false;
            blue_epump_controller.update(&overhead_panel);
            assert!(!blue_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_blue_epump_override() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let mut blue_epump_controller = A320BlueElectricPumpController::new();

            blue_epump_controller.engine_1_master_on = false;
            blue_epump_controller.engine_2_master_on = false;
            overhead_panel.blue_epump_override_push_button.push_on();
            blue_epump_controller.update(&overhead_panel);
            assert!(blue_epump_controller.should_pressurise());

            blue_epump_controller.engine_1_master_on = false;
            blue_epump_controller.engine_2_master_on = false;
            overhead_panel.blue_epump_override_push_button.push_off();
            blue_epump_controller.update(&overhead_panel);
            assert!(!blue_epump_controller.should_pressurise());
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

        #[test]
        fn controller_yellow_epump() {
            let mut fwd_door = Door::new(1);
            let mut aft_door = Door::new(2);
            let context = context(Duration::from_millis(100));

            let mut overhead_panel = A320HydraulicOverheadPanel::new();

            let mut yellow_epump_controller = A320YellowElectricPumpController::new();

            overhead_panel.yellow_epump_push_button.push_auto();
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door);
            assert!(!yellow_epump_controller.should_pressurise());

            overhead_panel.yellow_epump_push_button.push_on();
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door);
            assert!(yellow_epump_controller.should_pressurise());

            overhead_panel.yellow_epump_push_button.push_auto();
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door);
            assert!(!yellow_epump_controller.should_pressurise());

            fwd_door = moving_door(1);
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door);
            assert!(yellow_epump_controller.should_pressurise());
            fwd_door = non_moving_door(1);

            yellow_epump_controller.update(&context.with_delta(Duration::from_secs(1) + A320YellowElectricPumpController::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION), &overhead_panel,&fwd_door,&aft_door);
            assert!(!yellow_epump_controller.should_pressurise());

            aft_door = moving_door(2);
            yellow_epump_controller.update(&context, &overhead_panel, &fwd_door, &aft_door);
            assert!(yellow_epump_controller.should_pressurise());
            aft_door = non_moving_door(2);

            yellow_epump_controller.update(&context.with_delta(Duration::from_secs(1) + A320YellowElectricPumpController::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION), &overhead_panel,&fwd_door,&aft_door);
            assert!(!yellow_epump_controller.should_pressurise());
        }

        #[test]
        fn controller_engine_driven_pump1() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let mut fire_overhead_panel = A320EngineFireOverheadPanel::new();
            overhead_panel.edp1_push_button.push_auto();
            fire_overhead_panel.eng1_fire_pb.set(false);

            let mut edp1_controller = A320EngineDrivenPumpController::new(1);

            edp1_controller.update(&overhead_panel, &fire_overhead_panel);
            assert!(edp1_controller.should_pressurise());

            overhead_panel.edp1_push_button.push_off();
            edp1_controller.update(&overhead_panel, &fire_overhead_panel);
            assert!(!edp1_controller.should_pressurise());

            overhead_panel.edp1_push_button.push_auto();
            fire_overhead_panel.eng1_fire_pb.set(true);
            edp1_controller.update(&overhead_panel, &fire_overhead_panel);
            assert!(!edp1_controller.should_pressurise());
        }

        #[test]
        fn controller_engine_driven_pump2() {
            let mut overhead_panel = A320HydraulicOverheadPanel::new();
            let mut fire_overhead_panel = A320EngineFireOverheadPanel::new();
            overhead_panel.edp2_push_button.push_auto();
            fire_overhead_panel.eng2_fire_pb.set(false);

            let mut edp2_controller = A320EngineDrivenPumpController::new(1);

            edp2_controller.update(&overhead_panel, &fire_overhead_panel);
            assert!(edp2_controller.should_pressurise());

            overhead_panel.edp1_push_button.push_off();
            edp2_controller.update(&overhead_panel, &fire_overhead_panel);
            assert!(!edp2_controller.should_pressurise());

            overhead_panel.edp1_push_button.push_auto();
            fire_overhead_panel.eng1_fire_pb.set(true);
            edp2_controller.update(&overhead_panel, &fire_overhead_panel);
            assert!(!edp2_controller.should_pressurise());
        }

        #[test]
        fn controller_ptu_on_off_cargo_door() {
            let tug = PushbackTug::new();
            let context = context(Duration::from_millis(100));

            let mut overhead_panel = A320HydraulicOverheadPanel::new();

            let mut ptu_controller = A320PowerTransferUnitController::new();

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

            let mut ptu_controller = A320PowerTransferUnitController::new();
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
        fn writes_its_state() {
            let mut hyd_logic = A320Hydraulic::new();
            let mut test_bed = SimulationTestBed::new();
            test_bed.run_without_update(&mut hyd_logic);

            assert!(test_bed.contains_key("HYD_GREEN_EDPUMP_LOW_PRESS"));
            assert!(test_bed.contains_key("HYD_BLUE_EPUMP_LOW_PRESS"));
            assert!(test_bed.contains_key("HYD_YELLOW_EDPUMP_LOW_PRESS"));
            assert!(test_bed.contains_key("HYD_YELLOW_EPUMP_LOW_PRESS"));
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
    }
}
