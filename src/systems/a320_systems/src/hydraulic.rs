use std::time::Duration;
use uom::si::{f64::*, pressure::pascal, pressure::psi, velocity::knot, volume::gallon};

use systems::engine::Engine;
use systems::hydraulic::{ElectricPump, EngineDrivenPump, HydFluid, HydLoop, Ptu, RamAirTurbine};
use systems::overhead::{
    AutoOffFaultPushButton, AutoOnFaultPushButton, FirePushButton, OnOffFaultPushButton,
};
use systems::simulation::{
    SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter, UpdateContext,
};
use systems::{hydraulic::brakecircuit::BrakeCircuit, shared::DelayedFalseLogicGate};

pub struct A320Hydraulic {
    hyd_logic: A320HydraulicLogic,
    hyd_brake_logic: A320HydraulicBrakingLogic,
    blue_loop: HydLoop,
    green_loop: HydLoop,
    yellow_loop: HydLoop,
    engine_driven_pump_1: EngineDrivenPump,
    engine_driven_pump_2: EngineDrivenPump,
    blue_electric_pump: ElectricPump,
    yellow_electric_pump: ElectricPump,
    ram_air_turbine: RamAirTurbine,
    ptu: Ptu,
    braking_circuit_norm: BrakeCircuit,
    braking_circuit_altn: BrakeCircuit,
    total_sim_time_elapsed: Duration,
    lag_time_accumulator: Duration,

    is_green_pressurised: bool,
    is_blue_pressurised: bool,
    is_yellow_pressurised: bool,
}
impl A320Hydraulic {
    const MIN_PRESS_PRESSURISED_LO_HYST: f64 = 1450.0;
    const MIN_PRESS_PRESSURISED_HI_HYST: f64 = 1750.0;

    const HYDRAULIC_SIM_TIME_STEP: u64 = 100; //refresh rate of hydraulic simulation in ms
    const ACTUATORS_SIM_TIME_STEP_MULT: u32 = 2; //refresh rate of actuators as multiplier of hydraulics. 2 means double frequency update

    pub fn new() -> A320Hydraulic {
        A320Hydraulic {
            hyd_logic: A320HydraulicLogic::new(),
            hyd_brake_logic: A320HydraulicBrakingLogic::new(),

            blue_loop: HydLoop::new(
                "BLUE",
                false,
                false,
                Volume::new::<gallon>(15.8),
                Volume::new::<gallon>(15.85),
                Volume::new::<gallon>(8.0),
                Volume::new::<gallon>(1.56),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
                false,
            ),
            green_loop: HydLoop::new(
                "GREEN",
                true,
                false,
                Volume::new::<gallon>(26.38),
                Volume::new::<gallon>(26.41),
                Volume::new::<gallon>(15.),
                Volume::new::<gallon>(3.6),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
            ),
            yellow_loop: HydLoop::new(
                "YELLOW",
                false,
                true,
                Volume::new::<gallon>(19.75),
                Volume::new::<gallon>(19.81),
                Volume::new::<gallon>(10.0),
                Volume::new::<gallon>(3.15),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
            ),
            engine_driven_pump_1: EngineDrivenPump::new("GREEN"),
            engine_driven_pump_2: EngineDrivenPump::new("YELLOW"),
            blue_electric_pump: ElectricPump::new("BLUE"),
            yellow_electric_pump: ElectricPump::new("YELLOW"),
            ram_air_turbine: RamAirTurbine::new(""),
            ptu: Ptu::new(""),

            braking_circuit_norm: BrakeCircuit::new(
                "NORM",
                Volume::new::<gallon>(0.),
                Volume::new::<gallon>(0.),
                Volume::new::<gallon>(0.08),
            ),

            braking_circuit_altn: BrakeCircuit::new(
                "ALTN",
                Volume::new::<gallon>(1.5),
                Volume::new::<gallon>(0.0),
                Volume::new::<gallon>(0.08),
            ),

            total_sim_time_elapsed: Duration::new(0, 0),
            lag_time_accumulator: Duration::new(0, 0),

            is_green_pressurised: false,
            is_blue_pressurised: false,
            is_yellow_pressurised: false,
        }
    }

    pub fn green_edp_has_fault(&self) -> bool {
        self.hyd_logic.green_edp_has_fault()
    }

    pub fn yellow_epump_has_fault(&self) -> bool {
        self.hyd_logic.yellow_epump_has_fault()
    }

    pub fn yellow_edp_has_fault(&self) -> bool {
        self.hyd_logic.yellow_edp_has_fault()
    }

    pub fn blue_epump_has_fault(&self) -> bool {
        self.hyd_logic.blue_epump_has_fault()
    }

    // Updates pressure available state based on pressure switches
    fn update_hyd_avail_states(&mut self) {
        if self.green_loop.get_pressure()
            <= Pressure::new::<psi>(A320Hydraulic::MIN_PRESS_PRESSURISED_LO_HYST)
        {
            self.is_green_pressurised = false;
        } else if self.green_loop.get_pressure()
            >= Pressure::new::<psi>(A320Hydraulic::MIN_PRESS_PRESSURISED_HI_HYST)
        {
            self.is_green_pressurised = true;
        }

        if self.blue_loop.get_pressure()
            <= Pressure::new::<psi>(A320Hydraulic::MIN_PRESS_PRESSURISED_LO_HYST)
        {
            self.is_blue_pressurised = false;
        } else if self.blue_loop.get_pressure()
            >= Pressure::new::<psi>(A320Hydraulic::MIN_PRESS_PRESSURISED_HI_HYST)
        {
            self.is_blue_pressurised = true;
        }

        if self.yellow_loop.get_pressure()
            <= Pressure::new::<psi>(A320Hydraulic::MIN_PRESS_PRESSURISED_LO_HYST)
        {
            self.is_yellow_pressurised = false;
        } else if self.yellow_loop.get_pressure()
            >= Pressure::new::<psi>(A320Hydraulic::MIN_PRESS_PRESSURISED_HI_HYST)
        {
            self.is_yellow_pressurised = true;
        }
    }

    fn set_hydraulics_logic_feedbacks(&mut self) {
        self.hyd_logic
            .set_green_pressurised(self.is_green_pressurised());
        self.hyd_logic
            .set_blue_pressurised(self.is_blue_pressurised());
        self.hyd_logic
            .set_yellow_pressurised(self.is_yellow_pressurised());
    }

    fn update_hydraulics_logic_outputs(&mut self, context: &UpdateContext) {
        self.ptu.enabling(self.hyd_logic.ptu_ena_output());

        if self.hyd_logic.rat_should_be_deployed(context) {
            self.ram_air_turbine.deploy();
        }

        if self.hyd_logic.blue_electric_pump_output() {
            self.blue_electric_pump.start();
        } else {
            self.blue_electric_pump.stop();
        }

        if self.hyd_logic.yellow_electric_pump_output() {
            self.yellow_electric_pump.start();
        } else {
            self.yellow_electric_pump.stop();
        }

        self.yellow_loop
            .set_fire_shutoff_valve_state(self.hyd_logic.yellow_loop_fire_valve_output());
        self.green_loop
            .set_fire_shutoff_valve_state(self.hyd_logic.green_loop_fire_valve_output());

        if self.hyd_logic.engine_driven_pump_1_output() {
            self.engine_driven_pump_1.start();
        } else {
            self.engine_driven_pump_1.stop();
        }
        if self.hyd_logic.engine_driven_pump_2_output() {
            self.engine_driven_pump_2.start();
        } else {
            self.engine_driven_pump_2.stop();
        }
    }

    pub fn is_blue_pressurised(&self) -> bool {
        self.is_blue_pressurised
    }

    pub fn is_green_pressurised(&self) -> bool {
        self.is_green_pressurised
    }

    pub fn is_yellow_pressurised(&self) -> bool {
        self.is_yellow_pressurised
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine1: &Engine,
        engine2: &Engine,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_overhead: &A320EngineFireOverheadPanel,
    ) {
        let min_hyd_loop_timestep = Duration::from_millis(A320Hydraulic::HYDRAULIC_SIM_TIME_STEP); //Hyd Sim rate = 10 Hz

        self.total_sim_time_elapsed += context.delta();

        // Time to catch up in our simulation = new delta + time not updated last iteration
        let time_to_catch = context.delta() + self.lag_time_accumulator;

        // Number of time steps (with floating part) to do according to required time step
        let number_of_steps_floating_point =
            time_to_catch.as_secs_f64() / min_hyd_loop_timestep.as_secs_f64();

        // Updating rat stowed pos on all frames in case it's used for graphics
        self.ram_air_turbine.update_position(&context.delta());

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

            // This is main update loop at base fixed step
            for _ in 0..num_of_update_loops {
                self.update_fixed_step(
                    context,
                    engine1,
                    engine2,
                    overhead_panel,
                    engine_fire_overhead,
                    min_hyd_loop_timestep,
                );
            }

            // This is the "fast" update loop refreshing ACTUATORS_SIM_TIME_STEP_MULT times faster
            // here put everything that needs higher simulation rates like physics solving
            let num_of_actuators_update_loops =
                num_of_update_loops * A320Hydraulic::ACTUATORS_SIM_TIME_STEP_MULT;
            let delta_time_physics =
                min_hyd_loop_timestep / A320Hydraulic::ACTUATORS_SIM_TIME_STEP_MULT; //If X times faster we divide step by X
            for _ in 0..num_of_actuators_update_loops {
                self.update_fast_rate(&context, &delta_time_physics);
            }
        }
    }

    // All the higher frequency updates like physics
    fn update_fast_rate(&mut self, context: &UpdateContext, delta_time_physics: &Duration) {
        self.ram_air_turbine
            .update_physics(&delta_time_physics, &context.indicated_airspeed());
    }

    // All the core hydraulics updates that needs to be done at the slowest fixed step rate
    fn update_fixed_step(
        &mut self,
        context: &UpdateContext,
        engine1: &Engine,
        engine2: &Engine,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_overhead: &A320EngineFireOverheadPanel,
        min_hyd_loop_timestep: Duration,
    ) {
        self.update_hyd_avail_states();
        self.set_hydraulics_logic_feedbacks();

        // Base logic update based on overhead Could be done only once (before that loop) but if so delta time should be set accordingly
        self.hyd_logic.update(
            overhead_panel,
            engine_fire_overhead,
            &context.with_delta(min_hyd_loop_timestep),
        );
        self.update_hydraulics_logic_outputs(&context.with_delta(min_hyd_loop_timestep));

        // Process brake logic (which circuit brakes) and send brake demands (how much)
        self.hyd_brake_logic
            .update_brake_demands(&min_hyd_loop_timestep, &self.green_loop);
        self.hyd_brake_logic.send_brake_demands(
            &mut self.braking_circuit_norm,
            &mut self.braking_circuit_altn,
        );

        self.ptu.update(&self.green_loop, &self.yellow_loop);
        self.engine_driven_pump_1
            .update(&min_hyd_loop_timestep, &self.green_loop, &engine1);
        self.engine_driven_pump_2
            .update(&min_hyd_loop_timestep, &self.yellow_loop, &engine2);
        self.yellow_electric_pump
            .update(&min_hyd_loop_timestep, &self.yellow_loop);
        self.blue_electric_pump
            .update(&min_hyd_loop_timestep, &self.blue_loop);

        self.ram_air_turbine.update(&min_hyd_loop_timestep, &self.blue_loop);
        self.green_loop.update(
            &min_hyd_loop_timestep,
            Vec::new(),
            vec![&self.engine_driven_pump_1],
            Vec::new(),
            vec![&self.ptu],
        );
        self.yellow_loop.update(
            &min_hyd_loop_timestep,
            vec![&self.yellow_electric_pump],
            vec![&self.engine_driven_pump_2],
            Vec::new(),
            vec![&self.ptu],
        );
        self.blue_loop.update(
            &min_hyd_loop_timestep,
            vec![&self.blue_electric_pump],
            Vec::new(),
            vec![&self.ram_air_turbine],
            Vec::new(),
        );

        self.braking_circuit_norm
            .update(&min_hyd_loop_timestep, &self.green_loop);
        self.braking_circuit_altn
            .update(&min_hyd_loop_timestep, &self.yellow_loop);
        self.braking_circuit_norm.reset_accumulators();
        self.braking_circuit_altn.reset_accumulators();
    }
}

impl SimulationElement for A320Hydraulic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.yellow_electric_pump.accept(visitor);
        self.blue_electric_pump.accept(visitor);
        self.engine_driven_pump_1.accept(visitor);
        self.engine_driven_pump_2.accept(visitor);
        self.ram_air_turbine.accept(visitor);

        self.ptu.accept(visitor);

        self.blue_loop.accept(visitor);
        self.green_loop.accept(visitor);
        self.yellow_loop.accept(visitor);

        self.hyd_logic.accept(visitor);
        self.hyd_brake_logic.accept(visitor);

        self.braking_circuit_norm.accept(visitor);
        self.braking_circuit_altn.accept(visitor);

        visitor.visit(self);
    }
}

pub struct A320HydraulicBrakingLogic {
    parking_brake_demand: bool,
    weight_on_wheels: bool,
    left_brake_pilot_input: f64,
    right_brake_pilot_input: f64,
    left_brake_green_output: f64,
    left_brake_yellow_output: f64,
    right_brake_green_output: f64,
    right_brake_yellow_output: f64,
    anti_skid_activated: bool,
    autobrakes_setting: u8,
}

//Implements brakes computers logic
impl A320HydraulicBrakingLogic {
    const PARK_BRAKE_DEMAND_DYNAMIC: f64 = 0.8; //Dynamic of the parking brake application/removal in (percent/100) per s
    const LOW_PASS_FILTER_BRAKE_COMMAND: f64 = 0.85; //Low pass filter on all brake commands
    const MIN_PRESSURE_BRAKE_ALTN: f64 = 1500.; //Minimum pressure until main switched on ALTN brakes

    pub fn new() -> A320HydraulicBrakingLogic {
        A320HydraulicBrakingLogic {
            parking_brake_demand: true, //Position of parking brake lever
            weight_on_wheels: true,
            left_brake_pilot_input: 1.0,    // read from brake pedals
            right_brake_pilot_input: 1.0,   // read from brake pedals
            left_brake_green_output: 0.0,   //Actual command sent to left green circuit
            left_brake_yellow_output: 1.0, //Actual command sent to left yellow circuit. Init 1 as considering park brake on on init
            right_brake_green_output: 0.0, //Actual command sent to right green circuit
            right_brake_yellow_output: 1.0, //Actual command sent to right yellow circuit. Init 1 as considering park brake on on init
            anti_skid_activated: true,
            autobrakes_setting: 0,
        }
    }

    //Updates final brake demands per hydraulic loop based on pilot pedal demands
    //TODO: think about where to build those brake demands from autobrake if not from brake pedals
    pub fn update_brake_demands(&mut self, delta_time_update: &Duration, green_loop: &HydLoop) {
        let green_used_for_brakes = green_loop.get_pressure() //TODO Check this logic
            > Pressure::new::<psi>(A320HydraulicBrakingLogic::MIN_PRESSURE_BRAKE_ALTN )
            && self.anti_skid_activated
            && !self.parking_brake_demand;

        let dynamic_increment =
            A320HydraulicBrakingLogic::PARK_BRAKE_DEMAND_DYNAMIC * delta_time_update.as_secs_f64();

        if green_used_for_brakes {
            self.left_brake_green_output = A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND
                * self.left_brake_pilot_input
                + (1.0 - A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND)
                    * self.left_brake_green_output;
            self.right_brake_green_output = A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND
                * self.right_brake_pilot_input
                + (1.0 - A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND)
                    * self.right_brake_green_output;

            self.left_brake_yellow_output -= dynamic_increment;
            self.right_brake_yellow_output -= dynamic_increment;
        } else {
            if !self.parking_brake_demand {
                //Normal braking but using alternate circuit
                self.left_brake_yellow_output =
                    A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND
                        * self.left_brake_pilot_input
                        + (1.0 - A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND)
                            * self.left_brake_yellow_output;
                self.right_brake_yellow_output =
                    A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND
                        * self.right_brake_pilot_input
                        + (1.0 - A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND)
                            * self.right_brake_yellow_output;
                if !self.anti_skid_activated {
                    self.left_brake_yellow_output = self.left_brake_yellow_output.min(0.5); //0.5 is temporary implementation of pressure limitation around 1000psi
                    self.right_brake_yellow_output = self.right_brake_yellow_output.min(0.5);
                    //0.5 is temporary implementation of pressure limitation around 1000psi
                }
            } else {
                //Else we just use parking brake
                self.left_brake_yellow_output += dynamic_increment;
                self.left_brake_yellow_output = self.left_brake_yellow_output.min(0.7); //0.7 is temporary implementation of pressure limitation around 2000psi for parking brakes
                self.right_brake_yellow_output += dynamic_increment;
                self.right_brake_yellow_output = self.right_brake_yellow_output.min(0.7);
                //0.7 is temporary implementation of pressure limitation around 2000psi for parking brakes
            }
            self.left_brake_green_output -= dynamic_increment;
            self.right_brake_green_output -= dynamic_increment;
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
            exit_id: format!("EXIT OPEN {}", id),
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
    state: f64,
}
impl PushbackTug {
    const STATE_NO_PUSHBACK: f64 = 3.;

    fn new() -> Self {
        Self {
            angle: 0.,
            previous_angle: 0.,
            state: 0.,
        }
    }

    fn is_pushing(&self) -> bool {
        // The angle keeps changing while pushing.
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

pub struct A320HydraulicLogic {
    forward_cargo_door: Door,
    aft_cargo_door: Door,
    pushback_tug: PushbackTug,
    should_activate_yellow_pump_for_cargo_door_operation: DelayedFalseLogicGate,
    should_inhibit_ptu_after_cargo_door_operation: DelayedFalseLogicGate,
    nose_wheel_steering_pin_inserted: DelayedFalseLogicGate,

    parking_brake_lever_pos: bool,
    weight_on_wheels: bool,
    eng_1_master_on: bool,
    eng_2_master_on: bool,

    ptu_ena_output: bool,
    blue_electric_pump_output: bool,
    yellow_electric_pump_output: bool,
    green_loop_fire_valve_output: bool,
    yellow_loop_fire_valve_output: bool,
    engine_driven_pump_2_output: bool,
    engine_driven_pump_1_output: bool,

    green_loop_pressurised_feedback: bool,
    blue_loop_pressurised_feedback: bool,
    yellow_loop_pressurised_feedback: bool,
}

// Implements low level logic for all hydraulics commands
// takes inputs from hydraulics and from plane systems, update outputs for pumps and all other hyd systems
impl A320HydraulicLogic {
    const DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION: Duration =
        Duration::from_secs(20);
    const DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION: Duration = Duration::from_secs(40);
    const DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK: Duration =
        Duration::from_secs(15);

    pub fn new() -> A320HydraulicLogic {
        A320HydraulicLogic {
            forward_cargo_door: Door::new(5),
            aft_cargo_door: Door::new(3),
            pushback_tug: PushbackTug::new(),
            should_activate_yellow_pump_for_cargo_door_operation: DelayedFalseLogicGate::new(
                A320HydraulicLogic::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION,
            ),
            should_inhibit_ptu_after_cargo_door_operation: DelayedFalseLogicGate::new(
                A320HydraulicLogic::DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION,
            ),
            nose_wheel_steering_pin_inserted: DelayedFalseLogicGate::new(
                A320HydraulicLogic::DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK,
            ),

            parking_brake_lever_pos: true,
            weight_on_wheels: true,
            eng_1_master_on: false,
            eng_2_master_on: false,

            ptu_ena_output: false,
            blue_electric_pump_output: false,
            yellow_electric_pump_output: false,
            green_loop_fire_valve_output: false,
            yellow_loop_fire_valve_output: false,
            engine_driven_pump_2_output: true,
            engine_driven_pump_1_output: true,

            green_loop_pressurised_feedback: false,
            blue_loop_pressurised_feedback: false,
            yellow_loop_pressurised_feedback: false,
        }
    }

    fn ptu_ena_output(&self) -> bool {
        self.ptu_ena_output
    }

    fn rat_should_be_deployed(&self, context: &UpdateContext) -> bool {
        // RAT Deployment
        // Todo check all other needed conditions this is faked with engine master while it should check elec buses
        !self.eng_1_master_on
            && !self.eng_2_master_on
            //Todo get speed from ADIRS
            && context.indicated_airspeed() > Velocity::new::<knot>(100.)
    }

    fn blue_electric_pump_output(&self) -> bool {
        self.blue_electric_pump_output
    }

    fn yellow_electric_pump_output(&self) -> bool {
        self.yellow_electric_pump_output
    }

    fn green_loop_fire_valve_output(&self) -> bool {
        self.green_loop_fire_valve_output
    }

    fn yellow_loop_fire_valve_output(&self) -> bool {
        self.yellow_loop_fire_valve_output
    }

    fn engine_driven_pump_2_output(&self) -> bool {
        self.engine_driven_pump_2_output
    }

    fn engine_driven_pump_1_output(&self) -> bool {
        self.engine_driven_pump_1_output
    }

    fn green_edp_has_fault(&self) -> bool {
        // TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        // at current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        self.engine_driven_pump_1_output && !self.green_loop_pressurised_feedback
    }

    fn yellow_edp_has_fault(&self) -> bool {
        // TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        // at current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        self.engine_driven_pump_2_output && !self.yellow_loop_pressurised_feedback
    }

    fn yellow_epump_has_fault(&self) -> bool {
        // TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        // at current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        self.yellow_electric_pump_output && !self.yellow_loop_pressurised_feedback
    }

    fn blue_epump_has_fault(&self) -> bool {
        // TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        // at current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        self.blue_electric_pump_output && !self.blue_loop_pressurised_feedback
    }

    fn set_green_pressurised(&mut self, is_pressurised: bool) {
        self.green_loop_pressurised_feedback = is_pressurised;
    }

    fn set_blue_pressurised(&mut self, is_pressurised: bool) {
        self.blue_loop_pressurised_feedback = is_pressurised;
    }

    fn set_yellow_pressurised(&mut self, is_pressurised: bool) {
        self.yellow_loop_pressurised_feedback = is_pressurised;
    }

    fn should_activate_yellow_pump_for_cargo_door_operation(&self) -> bool {
        self.should_activate_yellow_pump_for_cargo_door_operation
            .output()
    }

    fn should_inhibit_ptu_after_cargo_door_operation(&self) -> bool {
        self.should_inhibit_ptu_after_cargo_door_operation.output()
    }

    fn nose_wheel_steering_pin_is_inserted(&self) -> bool {
        self.nose_wheel_steering_pin_inserted.output()
    }

    fn any_cargo_door_has_moved(&self) -> bool {
        self.forward_cargo_door.has_moved() || self.aft_cargo_door.has_moved()
    }

    fn update(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_overhead: &A320EngineFireOverheadPanel,
        context: &UpdateContext,
    ) {
        self.should_activate_yellow_pump_for_cargo_door_operation
            .update(context, self.any_cargo_door_has_moved());
        self.should_inhibit_ptu_after_cargo_door_operation
            .update(context, self.any_cargo_door_has_moved());
        self.nose_wheel_steering_pin_inserted
            .update(context, self.pushback_tug.is_pushing());

        self.update_ed_pump_states(overhead_panel, engine_fire_overhead);

        self.update_e_pump_states(overhead_panel);

        self.update_ptu_logic(overhead_panel);
    }

    fn update_ptu_logic(&mut self, overhead_panel: &A320HydraulicOverheadPanel) {
        let ptu_inhibit = self.should_inhibit_ptu_after_cargo_door_operation()
            && overhead_panel.yellow_epump_push_button.is_auto();
        if overhead_panel.ptu_push_button.is_auto()
            && (!self.weight_on_wheels
                || self.eng_1_master_on && self.eng_2_master_on
                || !self.eng_1_master_on && !self.eng_2_master_on
                || (!self.parking_brake_lever_pos && !self.nose_wheel_steering_pin_is_inserted()))
            && !ptu_inhibit
        {
            self.ptu_ena_output = true;
        } else {
            self.ptu_ena_output = false;
        }
    }

    fn update_ed_pump_states(
        &mut self,
        overhead_panel: &A320HydraulicOverheadPanel,
        engine_fire_overhead: &A320EngineFireOverheadPanel,
    ) {
        if overhead_panel.edp1_push_button.is_auto()
            && self.eng_1_master_on
            && !engine_fire_overhead.eng1_fire_pb.is_released()
        {
            self.engine_driven_pump_1_output = true;
        } else if overhead_panel.edp1_push_button.is_off() {
            self.engine_driven_pump_1_output = false;
        }

        //FIRE valves logic for EDP1
        if engine_fire_overhead.eng1_fire_pb.is_released() {
            self.engine_driven_pump_1_output = false;
            self.green_loop_fire_valve_output = false;
        } else {
            self.green_loop_fire_valve_output = true;
        }

        if overhead_panel.edp2_push_button.is_auto()
            && self.eng_2_master_on
            && !engine_fire_overhead.eng2_fire_pb.is_released()
        {
            self.engine_driven_pump_2_output = true;
        } else if overhead_panel.edp2_push_button.is_off() {
            self.engine_driven_pump_2_output = false;
        }

        //FIRE valves logic for EDP2
        if engine_fire_overhead.eng2_fire_pb.is_released() {
            self.engine_driven_pump_2_output = false;
            self.yellow_loop_fire_valve_output = false;
        } else {
            self.yellow_loop_fire_valve_output = true;
        }
    }

    fn update_e_pump_states(&mut self, overhead_panel: &A320HydraulicOverheadPanel) {
        if overhead_panel.yellow_epump_push_button.is_on()
            || self.should_activate_yellow_pump_for_cargo_door_operation()
        {
            self.yellow_electric_pump_output = true;
        } else if overhead_panel.yellow_epump_push_button.is_auto() {
            self.yellow_electric_pump_output = false;
        }
        if overhead_panel.blue_epump_push_button.is_auto() {
            if self.eng_1_master_on
                || self.eng_2_master_on
                || overhead_panel.blue_epump_override_push_button.is_on()
            {
                self.blue_electric_pump_output = true;
            } else {
                self.blue_electric_pump_output = false;
            }
        } else if overhead_panel.blue_epump_push_button.is_off() {
            self.blue_electric_pump_output = false;
        }
    }
}

impl SimulationElement for A320HydraulicLogic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.forward_cargo_door.accept(visitor);
        self.aft_cargo_door.accept(visitor);
        self.pushback_tug.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, state: &mut SimulatorReader) {
        self.parking_brake_lever_pos = state.read_bool("BRAKE PARKING INDICATOR");
        self.eng_1_master_on = state.read_bool("GENERAL ENG1 STARTER ACTIVE");
        self.eng_2_master_on = state.read_bool("GENERAL ENG2 STARTER ACTIVE");
        self.weight_on_wheels = state.read_bool("SIM ON GROUND");
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_bool("HYD_GREEN_EDPUMP_LOW_PRESS", self.green_edp_has_fault());
        writer.write_bool("HYD_BLUE_EPUMP_LOW_PRESS", self.blue_epump_has_fault());
        writer.write_bool("HYD_YELLOW_EDPUMP_LOW_PRESS", self.yellow_edp_has_fault());
        writer.write_bool("HYD_YELLOW_EPUMP_LOW_PRESS", self.yellow_epump_has_fault());
    }
}

pub struct A320HydraulicOverheadPanel {
    pub edp1_push_button: AutoOffFaultPushButton,
    pub edp2_push_button: AutoOffFaultPushButton,
    pub blue_epump_push_button: AutoOffFaultPushButton,
    pub ptu_push_button: AutoOffFaultPushButton,
    pub rat_push_button: AutoOffFaultPushButton,
    pub yellow_epump_push_button: AutoOnFaultPushButton,
    pub blue_epump_override_push_button: OnOffFaultPushButton,
}

impl A320HydraulicOverheadPanel {
    pub fn new() -> A320HydraulicOverheadPanel {
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

    pub fn update_pb_faults(&mut self, hyd: &A320Hydraulic) {
        self.edp1_push_button.set_fault(hyd.green_edp_has_fault());
        self.edp2_push_button.set_fault(hyd.yellow_edp_has_fault());
        self.blue_epump_push_button
            .set_fault(hyd.blue_epump_has_fault());
        self.yellow_epump_push_button
            .set_fault(hyd.yellow_epump_has_fault());
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
    pub eng1_fire_pb: FirePushButton,
    pub eng2_fire_pb: FirePushButton,
}

impl A320EngineFireOverheadPanel {
    pub fn new() -> A320EngineFireOverheadPanel {
        A320EngineFireOverheadPanel {
            eng1_fire_pb: FirePushButton::new("ENG1"),
            eng2_fire_pb: FirePushButton::new("ENG2"),
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
mod a320_hydraulic_simvars {
    use super::*;
    use systems::simulation::test::SimulationTestBed;

    #[test]
    fn writes_its_state() {
        let mut hyd_logic = A320HydraulicLogic::new();
        let mut test_bed = SimulationTestBed::new();
        test_bed.run_without_update(&mut hyd_logic);

        assert!(test_bed.contains_key("HYD_GREEN_EDPUMP_LOW_PRESS"));
        assert!(test_bed.contains_key("HYD_BLUE_EPUMP_LOW_PRESS"));
        assert!(test_bed.contains_key("HYD_YELLOW_EDPUMP_LOW_PRESS"));
        assert!(test_bed.contains_key("HYD_YELLOW_EPUMP_LOW_PRESS"));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::Rng;

    mod a320_hydraulics {
        use super::*;
        use systems::simulation::{test::SimulationTestBed, Aircraft};
        use uom::si::{length::foot, ratio::percent, velocity::knot};

        struct A320HydraulicsTestAircraft {
            engine_1: Engine,
            engine_2: Engine,
            hydraulics: A320Hydraulic,
            overhead: A320HydraulicOverheadPanel,
            engine_fire_overhead: A320EngineFireOverheadPanel,
        }
        impl A320HydraulicsTestAircraft {
            fn new() -> Self {
                Self {
                    engine_1: Engine::new(1),
                    engine_2: Engine::new(2),
                    hydraulics: A320Hydraulic::new(),
                    overhead: A320HydraulicOverheadPanel::new(),
                    engine_fire_overhead: A320EngineFireOverheadPanel::new(),
                }
            }

            fn is_nws_pin_inserted(&self) -> bool {
                self.hydraulics
                    .hyd_logic
                    .nose_wheel_steering_pin_is_inserted()
            }

            fn is_cargo_powering_yellow_epump(&self) -> bool {
                self.hydraulics
                    .hyd_logic
                    .should_activate_yellow_pump_for_cargo_door_operation()
            }

            fn is_ptu_ena(&self) -> bool {
                self.hydraulics.ptu.is_enabled()
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
                );

                self.overhead.update_pb_faults(&self.hydraulics);
            }
        }
        impl SimulationElement for A320HydraulicsTestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.hydraulics.accept(visitor);
                self.overhead.accept(visitor);
                self.engine_fire_overhead.accept(visitor);

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
                self.aircraft.is_ptu_ena()
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
                self.simulation_test_bed.write_f64("EXIT OPEN 5", position);
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
                    .write_bool("GENERAL ENG1 STARTER ACTIVE", true);
                self.aircraft.set_engine_1_n2(n2);

                self
            }

            fn start_eng2(mut self, n2: Ratio) -> Self {
                self.simulation_test_bed
                    .write_bool("GENERAL ENG2 STARTER ACTIVE", true);
                self.aircraft.set_engine_2_n2(n2);

                self
            }

            fn stop_eng1(mut self) -> Self {
                self.simulation_test_bed
                    .write_bool("GENERAL ENG1 STARTER ACTIVE", false);
                self.aircraft.set_engine_1_n2(Ratio::new::<percent>(0.));

                self
            }

            fn stop_eng2(mut self) -> Self {
                self.simulation_test_bed
                    .write_bool("GENERAL ENG2 STARTER ACTIVE", false);
                self.aircraft.set_engine_2_n2(Ratio::new::<percent>(0.));

                self
            }

            fn set_park_brake(mut self, is_set: bool) -> Self {
                self.simulation_test_bed
                    .write_bool("BRAKE PARKING INDICATOR", is_set);
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

            //Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            //Ptu push button disables PTU accordingly
            test_bed = test_bed.set_ptu_state(false).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.set_ptu_state(true).run_one_tick();
            assert!(test_bed.is_ptu_enabled());

            //Not all engines on or off should disable ptu if on ground and park brake on
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

            //Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            //Ptu push button disables PTU accordingly
            test_bed = test_bed.set_cargo_door_state(1.).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.run_waiting_for(Duration::from_secs(1));
            assert!(!test_bed.is_ptu_enabled());
            test_bed = test_bed.run_waiting_for(
                A320HydraulicLogic::DURATION_OF_PTU_INHIBIT_AFTER_CARGO_DOOR_OPERATION,
            ); //Should re enabled after 40s
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
                A320HydraulicLogic::DURATION_AFTER_WHICH_NWS_PIN_IS_REMOVED_AFTER_PUSHBACK,
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
                A320HydraulicLogic::DURATION_OF_YELLOW_PUMP_ACTIVATION_AFTER_CARGO_DOOR_OPERATION,
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

            //Enabled on cold start
            assert!(test_bed.is_ptu_enabled());

            //Yellow epump ON / Waiting 10s
            test_bed = test_bed
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(10));

            assert!(test_bed.is_ptu_enabled());

            //Now we should have pressure in yellow and green
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2000.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));

            //Ptu push button disables PTU / green press should fall
            test_bed = test_bed
                .set_ptu_state(false)
                .run_waiting_for(Duration::from_secs(20));
            assert!(!test_bed.is_ptu_enabled());

            //Now we should have pressure in yellow only
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2000.));
        }

        #[test]
        fn green_edp_buildup_test() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            //Starting eng 1
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(50.))
                .run_one_tick();
            //ALMOST No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(500.)); //Blue is auto run
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

            //Waiting for 5s pressure hsould be at 3000 psi
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(50.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

            //Stoping engine, pressure should fall in 20s
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
        fn edp_deactivation_test() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .set_ptu_state(false)
                .run_one_tick();

            //Starting eng 1
            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(50.))
                .start_eng2(Ratio::new::<percent>(50.))
                .run_one_tick();
            //ALMOST No pressure
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));

            //Waiting for 5s pressure should be at 3000 psi
            test_bed = test_bed.run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            //Stoping edp1, pressure should fall in 20s
            test_bed = test_bed
                .set_green_ed_pump(false)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.green_pressure() < Pressure::new::<psi>(500.));
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

            //Stoping edp2, pressure should fall in 20s
            test_bed = test_bed
                .set_yellow_ed_pump(false)
                .run_waiting_for(Duration::from_secs(20));

            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));
        }

        #[test]
        fn yellow_edp_buildup_test() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            //Starting eng 1
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(50.))
                .run_one_tick();
            //ALMOST No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(500.)); //Blue is auto run
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(500.));

            //Waiting for 5s pressure hsould be at 3000 psi
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(50.))
                .run_waiting_for(Duration::from_secs(5));

            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2800.));

            //Stoping engine, pressure should fall in 20s
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
        fn yellow_green_edp_firevalve_test() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            //PTU would mess up the test
            test_bed = test_bed.set_ptu_state(false).run_one_tick();
            assert!(!test_bed.is_ptu_enabled());

            assert!(!test_bed.is_fire_valve_eng1_closed());
            assert!(!test_bed.is_fire_valve_eng2_closed());

            //Starting eng 1
            test_bed = test_bed
                .start_eng2(Ratio::new::<percent>(50.))
                .start_eng1(Ratio::new::<percent>(50.))
                .run_waiting_for(Duration::from_secs(5));

            //Waiting for 5s pressure hsould be at 3000 psi
            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() > Pressure::new::<psi>(2900.));
            assert!(test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() > Pressure::new::<psi>(2500.));
            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2800.));

            assert!(!test_bed.is_fire_valve_eng1_closed());
            assert!(!test_bed.is_fire_valve_eng2_closed());

            //Green shutoff valve
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

            //Yellow shutoff valve
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
        fn yellow_brake_accumulator_test() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            //Accumulator empty on cold start
            assert!(test_bed.get_brake_yellow_accumulator_pressure() < Pressure::new::<psi>(50.));
            //No brakes
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            //No brakes even if we brake
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_yellow_accumulator_pressure() < Pressure::new::<psi>(50.));

            //Park brake off, loading accumulator, we expect no brake pressure but accumulator loaded
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .set_park_brake(false)
                .set_yellow_e_pump(false)
                .run_waiting_for(Duration::from_secs(15));

            assert!(test_bed.is_yellow_pressurised());
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            assert!(test_bed.get_brake_yellow_accumulator_pressure() > Pressure::new::<psi>(2500.));

            //Park brake on, loaded accumulator, we expect brakes on yellow side only
            test_bed = test_bed
                .set_park_brake(true)
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(2000.));

            assert!(test_bed.get_brake_yellow_accumulator_pressure() > Pressure::new::<psi>(2500.));
        }

        #[test]
        fn norm_brake_vs_altn_brake_test() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            //No brakes
            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            test_bed = test_bed
                .start_eng1(Ratio::new::<percent>(100.))
                .start_eng2(Ratio::new::<percent>(100.))
                .set_park_brake(false)
                .run_waiting_for(Duration::from_secs(5));

            assert!(test_bed.is_green_pressurised());
            assert!(test_bed.is_yellow_pressurised());
            //No brakes if we don't brake
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            //Braking cause green braking system to rise
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            //Disabling Askid causes alternate braking to work and release green brakes
            test_bed = test_bed
                .set_anti_skid(false)
                .run_waiting_for(Duration::from_secs(2));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() > Pressure::new::<psi>(950.));
            assert!(test_bed.get_brake_right_yellow_pressure() > Pressure::new::<psi>(950.));
        }

        #[test]
        fn check_brake_inversion_test() {
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
            //Braking left
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(100.))
                .set_right_brake(Ratio::new::<percent>(0.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_right_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            //Braking right
            test_bed = test_bed
                .set_left_brake(Ratio::new::<percent>(0.))
                .set_right_brake(Ratio::new::<percent>(100.))
                .run_waiting_for(Duration::from_secs(1));

            assert!(test_bed.get_brake_left_green_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_green_pressure() > Pressure::new::<psi>(2000.));
            assert!(test_bed.get_brake_left_yellow_pressure() < Pressure::new::<psi>(50.));
            assert!(test_bed.get_brake_right_yellow_pressure() < Pressure::new::<psi>(50.));

            //Disabling Askid causes alternate braking to work and release green brakes
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
    }
}
