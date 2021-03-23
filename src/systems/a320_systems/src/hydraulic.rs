use std::time::Duration;
use uom::si::{f64::*, pressure::pascal, pressure::psi, velocity::knot, volume::gallon};

use systems::engine::Engine;
use systems::hydraulic::brakecircuit::BrakeCircuit;
use systems::hydraulic::{ElectricPump, EngineDrivenPump, HydFluid, HydLoop, Ptu, RatPump};
use systems::overhead::{AutoOffFaultPushButton, FirePushButton, OnOffFaultPushButton};
use systems::simulation::{
    SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter, UpdateContext,
};

pub struct A320Hydraulic {
    hyd_logic_inputs: A320HydraulicLogic,
    hyd_brake_logic: A320HydraulicBrakingLogic,
    blue_loop: HydLoop,
    green_loop: HydLoop,
    yellow_loop: HydLoop,
    engine_driven_pump_1: EngineDrivenPump,
    engine_driven_pump_2: EngineDrivenPump,
    blue_electric_pump: ElectricPump,
    yellow_electric_pump: ElectricPump,
    rat: RatPump,
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
            hyd_logic_inputs: A320HydraulicLogic::new(),
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
            rat: RatPump::new(""),
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

    //Updates pressure available state based on pressure switches
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
        ct: &UpdateContext,
        engine1: &Engine,
        engine2: &Engine,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        let min_hyd_loop_timestep = Duration::from_millis(A320Hydraulic::HYDRAULIC_SIM_TIME_STEP); //Hyd Sim rate = 10 Hz

        self.total_sim_time_elapsed += ct.delta();

        //time to catch up in our simulation = new delta + time not updated last iteration
        let time_to_catch = ct.delta() + self.lag_time_accumulator;

        //Number of time steps to do according to required time step
        let number_of_steps_f64 = time_to_catch.as_secs_f64() / min_hyd_loop_timestep.as_secs_f64();

        //updating rat stowed pos on all frames in case it's used for graphics
        self.rat.update_stow_pos(&ct.delta());

        if number_of_steps_f64 < 1.0 {
            //Can't do a full time step
            //we can either do an update with smaller step or wait next iteration

            self.lag_time_accumulator =
                Duration::from_secs_f64(number_of_steps_f64 * min_hyd_loop_timestep.as_secs_f64());
        //Time lag is float part of num of steps * fixed time step to get a result in time
        } else {
            let num_of_update_loops = number_of_steps_f64.floor() as u32; //Int part is the actual number of loops to do
                                                                          //Rest of floating part goes into accumulator
            self.lag_time_accumulator = Duration::from_secs_f64(
                (number_of_steps_f64 - (num_of_update_loops as f64))
                    * min_hyd_loop_timestep.as_secs_f64(),
            ); //Keep track of time left after all fixed loop are done

            //UPDATING HYDRAULICS AT FIXED STEP
            for _cur_loop in 0..num_of_update_loops {
                //Base logic update based on overhead Could be done only once (before that loop) but if so delta time should be set accordingly
                self.update_logic(&min_hyd_loop_timestep, overhead_panel, ct);

                //Process brake logic (which circuit brakes) and send brake demands (how much)
                self.hyd_brake_logic
                    .update_brake_demands(&min_hyd_loop_timestep, &self.green_loop);
                self.hyd_brake_logic.send_brake_demands(
                    &mut self.braking_circuit_norm,
                    &mut self.braking_circuit_altn,
                );

                //UPDATE HYDRAULICS FIXED TIME STEP
                self.ptu.update(&self.green_loop, &self.yellow_loop);
                self.engine_driven_pump_1.update(
                    &min_hyd_loop_timestep,
                    &self.green_loop,
                    &engine1,
                );
                self.engine_driven_pump_2.update(
                    &min_hyd_loop_timestep,
                    &self.yellow_loop,
                    &engine2,
                );
                self.yellow_electric_pump
                    .update(&min_hyd_loop_timestep, &self.yellow_loop);
                self.blue_electric_pump
                    .update(&min_hyd_loop_timestep, &self.blue_loop);

                self.rat.update(&min_hyd_loop_timestep, &self.blue_loop);
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
                    vec![&self.rat],
                    Vec::new(),
                );

                self.braking_circuit_norm
                    .update(&min_hyd_loop_timestep, &self.green_loop);
                self.braking_circuit_altn
                    .update(&min_hyd_loop_timestep, &self.yellow_loop);
                self.braking_circuit_norm.reset_accumulators();
                self.braking_circuit_altn.reset_accumulators();
            }

            //UPDATING ACTUATOR PHYSICS AT "FIXED STEP / ACTUATORS_SIM_TIME_STEP_MULT"
            //Here put everything that needs higher simulation rates
            let num_of_actuators_update_loops =
                num_of_update_loops * A320Hydraulic::ACTUATORS_SIM_TIME_STEP_MULT;
            let delta_time_physics =
                min_hyd_loop_timestep / A320Hydraulic::ACTUATORS_SIM_TIME_STEP_MULT; //If X times faster we divide step by X
            for _cur_loop in 0..num_of_actuators_update_loops {
                self.rat
                    .update_physics(&delta_time_physics, &ct.indicated_airspeed());
            }
        }
    }

    fn update_logic(
        &mut self,
        delta_time_update: &Duration,
        overhead_panel: &A320HydraulicOverheadPanel,
        ct: &UpdateContext,
    ) {
        self.update_external_cond(&delta_time_update);

        self.update_hyd_avail_states();

        self.update_pump_faults();

        self.update_rat_deploy(ct);

        self.update_ed_pump_states(overhead_panel);

        self.update_e_pump_states(overhead_panel);

        self.update_ptu_logic(overhead_panel);
    }

    fn update_ptu_logic(&mut self, overhead_panel: &A320HydraulicOverheadPanel) {
        let ptu_inhibit = self.hyd_logic_inputs.cargo_operated_ptu_cond
            && overhead_panel.yellow_epump_push_button.is_auto(); //TODO is auto will change once auto/on button is created in overhead library
        if overhead_panel.ptu_push_button.is_auto()
            && (!self.hyd_logic_inputs.weight_on_wheels
                || self.hyd_logic_inputs.eng_1_master_on && self.hyd_logic_inputs.eng_2_master_on
                || !self.hyd_logic_inputs.eng_1_master_on && !self.hyd_logic_inputs.eng_2_master_on
                || (!self.hyd_logic_inputs.parking_brake_lever_pos
                    && !self.hyd_logic_inputs.nsw_pin_inserted_cond))
            && !ptu_inhibit
        {
            self.ptu.enabling(true);
        } else {
            self.ptu.enabling(false);
        }
    }

    fn update_rat_deploy(&mut self, ct: &UpdateContext) {
        //RAT Deployment //Todo check all other needed conditions
        if !self.hyd_logic_inputs.eng_1_master_on
            && !self.hyd_logic_inputs.eng_2_master_on
            && ct.indicated_airspeed() > Velocity::new::<knot>(100.)
        //Todo get speed from ADIRS
        {
            self.rat.set_active();
        }
    }

    fn update_external_cond(&mut self, delta_time_update: &Duration) {
        //Only evaluate ground conditions if on ground, if superman needs to operate cargo door in flight feel free to update
        if self.hyd_logic_inputs.weight_on_wheels {
            self.hyd_logic_inputs.cargo_operated_ptu_cond = self
                .hyd_logic_inputs
                .is_cargo_operation_ptu_flag(&delta_time_update);
            self.hyd_logic_inputs.cargo_operated_ypump_cond = self
                .hyd_logic_inputs
                .is_cargo_operation_flag(&delta_time_update);
            self.hyd_logic_inputs.nsw_pin_inserted_cond = self
                .hyd_logic_inputs
                .is_nsw_pin_inserted_flag(&delta_time_update);
        }
    }

    fn update_pump_faults(&mut self) {
        //Basic faults of pumps //TODO wrong logic: can fake it using pump flow == 0 until we implement check valve sections in each hyd loop
        //At current state, PTU activation is able to clear a pump fault by rising pressure, which is wrong
        if self.yellow_electric_pump.is_active() && !self.is_yellow_pressurised() {
            self.hyd_logic_inputs.yellow_epump_has_fault = true;
        } else {
            self.hyd_logic_inputs.yellow_epump_has_fault = false;
        }
        if self.engine_driven_pump_1.is_active() && !self.is_green_pressurised() {
            self.hyd_logic_inputs.green_edp_has_fault = true;
        } else {
            self.hyd_logic_inputs.green_edp_has_fault = false;
        }
        if self.engine_driven_pump_2.is_active() && !self.is_yellow_pressurised() {
            self.hyd_logic_inputs.yellow_edp_has_fault = true;
        } else {
            self.hyd_logic_inputs.yellow_edp_has_fault = false;
        }
        if self.blue_electric_pump.is_active() && !self.is_blue_pressurised() {
            self.hyd_logic_inputs.blue_epump_has_fault = true;
        } else {
            self.hyd_logic_inputs.blue_epump_has_fault = false;
        }
    }

    fn update_ed_pump_states(&mut self, overhead_panel: &A320HydraulicOverheadPanel) {
        if overhead_panel.edp1_push_button.is_auto()
            && self.hyd_logic_inputs.eng_1_master_on
            && !overhead_panel.eng1_fire_pb.is_released()
        {
            self.engine_driven_pump_1.start();
        } else if overhead_panel.edp1_push_button.is_off() {
            self.engine_driven_pump_1.stop();
        }

        //FIRE valves logic for EDP1
        if overhead_panel.eng1_fire_pb.is_released() {
            self.engine_driven_pump_1.stop();
            self.green_loop.set_fire_shutoff_valve_state(false);
        } else {
            self.green_loop.set_fire_shutoff_valve_state(true);
        }

        if overhead_panel.edp2_push_button.is_auto()
            && self.hyd_logic_inputs.eng_2_master_on
            && !overhead_panel.eng2_fire_pb.is_released()
        {
            self.engine_driven_pump_2.start();
        } else if overhead_panel.edp2_push_button.is_off() {
            self.engine_driven_pump_2.stop();
        }

        //FIRE valves logic for EDP2
        if overhead_panel.eng2_fire_pb.is_released() {
            self.engine_driven_pump_2.stop();
            self.yellow_loop.set_fire_shutoff_valve_state(false);
        } else {
            self.yellow_loop.set_fire_shutoff_valve_state(true);
        }
    }

    fn update_e_pump_states(&mut self, overhead_panel: &A320HydraulicOverheadPanel) {
        if overhead_panel.yellow_epump_push_button.is_off()
            || self.hyd_logic_inputs.cargo_operated_ypump_cond
        {
            self.yellow_electric_pump.start();
        } else if overhead_panel.yellow_epump_push_button.is_auto() {
            self.yellow_electric_pump.stop();
        }
        if overhead_panel.blue_epump_push_button.is_auto() {
            if self.hyd_logic_inputs.eng_1_master_on
                || self.hyd_logic_inputs.eng_2_master_on
                || overhead_panel.blue_epump_override_push_button.is_on()
            {
                self.blue_electric_pump.start();
            } else {
                self.blue_electric_pump.stop();
            }
        } else if overhead_panel.blue_epump_push_button.is_off() {
            self.blue_electric_pump.stop();
        }
    }
}

impl SimulationElement for A320Hydraulic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.yellow_electric_pump.accept(visitor);
        self.blue_electric_pump.accept(visitor);
        self.engine_driven_pump_1.accept(visitor);
        self.engine_driven_pump_2.accept(visitor);
        self.rat.accept(visitor);

        self.ptu.accept(visitor);

        self.blue_loop.accept(visitor);
        self.green_loop.accept(visitor);
        self.yellow_loop.accept(visitor);

        self.hyd_logic_inputs.accept(visitor);
        self.hyd_brake_logic.accept(visitor);

        self.braking_circuit_norm.accept(visitor);
        self.braking_circuit_altn.accept(visitor);

        visitor.visit(self);
    }
}

pub struct A320HydraulicBrakingLogic {
    parking_brake_demand: bool,
    weight_on_wheels: bool,
    left_brake_command: f64,
    right_brake_command: f64,
    left_brake_green_command: f64, //Actual command sent to left green circuit
    left_brake_yellow_command: f64, //Actual command sent to left yellow circuit
    right_brake_green_command: f64, //Actual command sent to right green circuit
    right_brake_yellow_command: f64, //Actual command sent to right yellow circuit
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
            left_brake_command: 1.0,         //Command read from pedals
            right_brake_command: 1.0,        //Command read from pedals
            left_brake_green_command: 0.0,   //Actual command sent to left green circuit
            left_brake_yellow_command: 1.0,  //Actual command sent to left yellow circuit
            right_brake_green_command: 0.0,  //Actual command sent to right green circuit
            right_brake_yellow_command: 1.0, //Actual command sent to right yellow circuit
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
            self.left_brake_green_command = A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND
                * self.left_brake_command
                + (1.0 - A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND)
                    * self.left_brake_green_command;
            self.right_brake_green_command =
                A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND * self.right_brake_command
                    + (1.0 - A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND)
                        * self.right_brake_green_command;

            self.left_brake_yellow_command -= dynamic_increment;
            self.right_brake_yellow_command -= dynamic_increment;
        } else {
            if !self.parking_brake_demand {
                //Normal braking but using alternate circuit
                self.left_brake_yellow_command =
                    A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND
                        * self.left_brake_command
                        + (1.0 - A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND)
                            * self.left_brake_yellow_command;
                self.right_brake_yellow_command =
                    A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND
                        * self.right_brake_command
                        + (1.0 - A320HydraulicBrakingLogic::LOW_PASS_FILTER_BRAKE_COMMAND)
                            * self.right_brake_yellow_command;
                if !self.anti_skid_activated {
                    self.left_brake_yellow_command = self.left_brake_yellow_command.min(0.5); //0.5 is temporary implementation of pressure limitation around 1000psi
                    self.right_brake_yellow_command = self.right_brake_yellow_command.min(0.5);
                    //0.5 is temporary implementation of pressure limitation around 1000psi
                }
            } else {
                //Else we just use parking brake
                self.left_brake_yellow_command += dynamic_increment;
                self.left_brake_yellow_command = self.left_brake_yellow_command.min(0.7); //0.7 is temporary implementation of pressure limitation around 2000psi for parking brakes
                self.right_brake_yellow_command += dynamic_increment;
                self.right_brake_yellow_command = self.right_brake_yellow_command.min(0.7);
                //0.7 is temporary implementation of pressure limitation around 2000psi for parking brakes
            }
            self.left_brake_green_command -= dynamic_increment;
            self.right_brake_green_command -= dynamic_increment;
        }

        //limiting final values
        self.left_brake_yellow_command = self.left_brake_yellow_command.min(1.).max(0.);
        self.right_brake_yellow_command = self.right_brake_yellow_command.min(1.).max(0.);
        self.left_brake_green_command = self.left_brake_green_command.min(1.).max(0.);
        self.right_brake_green_command = self.right_brake_green_command.min(1.).max(0.);
    }

    pub fn send_brake_demands(&mut self, norm: &mut BrakeCircuit, altn: &mut BrakeCircuit) {
        norm.set_brake_demand_left(self.left_brake_green_command);
        norm.set_brake_demand_right(self.right_brake_green_command);
        altn.set_brake_demand_left(self.left_brake_yellow_command);
        altn.set_brake_demand_right(self.right_brake_yellow_command);
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
        self.left_brake_command = state.read_f64("BRAKE LEFT POSITION") / 100.0;
        self.right_brake_command = state.read_f64("BRAKE RIGHT POSITION") / 100.0;
        self.autobrakes_setting = state.read_f64("AUTOBRAKES SETTING").floor() as u8;
    }
}

pub struct A320HydraulicLogic {
    parking_brake_lever_pos: bool,
    weight_on_wheels: bool,
    eng_1_master_on: bool,
    eng_2_master_on: bool,
    nws_tow_engaged_timer: Duration,
    cargo_door_front_pos: f64,
    cargo_door_back_pos: f64,
    cargo_door_front_pos_prev: f64,
    cargo_door_back_pos_prev: f64,
    cargo_door_timer: Duration,
    cargo_door_timer_ptu: Duration,
    pushback_angle: f64,
    pushback_angle_prev: f64,
    pushback_state: f64,
    yellow_epump_has_fault: bool,
    blue_epump_has_fault: bool,
    green_edp_has_fault: bool,
    yellow_edp_has_fault: bool,

    cargo_operated_ptu_cond: bool,
    cargo_operated_ypump_cond: bool,
    nsw_pin_inserted_cond: bool,
}

//Implements low level logic for all hydraulics commands
impl A320HydraulicLogic {
    const CARGO_OPERATED_TIMEOUT_YPUMP: f64 = 20.0; //Timeout to shut off yellow epump after cargo operation
    const CARGO_OPERATED_TIMEOUT_PTU: f64 = 40.0; //Timeout to keep ptu inhibited after cargo operation
    const NWS_PIN_REMOVE_TIMEOUT: f64 = 15.0; //Time for ground crew to remove pin after tow

    pub fn new() -> A320HydraulicLogic {
        A320HydraulicLogic {
            parking_brake_lever_pos: true,
            weight_on_wheels: true,
            eng_1_master_on: false,
            eng_2_master_on: false,
            nws_tow_engaged_timer: Duration::from_secs_f64(0.0),
            cargo_door_front_pos: 0.0,
            cargo_door_back_pos: 0.0,
            cargo_door_front_pos_prev: 0.0,
            cargo_door_back_pos_prev: 0.0,
            cargo_door_timer: Duration::from_secs_f64(0.0),
            cargo_door_timer_ptu: Duration::from_secs_f64(0.0),
            pushback_angle: 0.0,
            pushback_angle_prev: 0.0,
            pushback_state: 0.0,
            yellow_epump_has_fault: false,
            blue_epump_has_fault: false,
            green_edp_has_fault: false,
            yellow_edp_has_fault: false,

            cargo_operated_ptu_cond: false,
            cargo_operated_ypump_cond: false,
            nsw_pin_inserted_cond: false,
        }
    }

    //TODO, code duplication to handle timeouts: generic function to do
    pub fn is_cargo_operation_flag(&mut self, delta_time_update: &Duration) -> bool {
        let cargo_door_moved = (self.cargo_door_back_pos - self.cargo_door_back_pos_prev).abs()
            > f64::EPSILON
            || (self.cargo_door_front_pos - self.cargo_door_front_pos_prev).abs() > f64::EPSILON;

        if cargo_door_moved {
            self.cargo_door_timer =
                Duration::from_secs_f64(A320HydraulicLogic::CARGO_OPERATED_TIMEOUT_YPUMP);
        } else if self.cargo_door_timer > *delta_time_update {
            self.cargo_door_timer -= *delta_time_update;
        } else {
            self.cargo_door_timer = Duration::from_secs(0);
        }

        self.cargo_door_timer > Duration::from_secs_f64(0.0)
    }

    pub fn is_cargo_operation_ptu_flag(&mut self, delta_time_update: &Duration) -> bool {
        let cargo_door_moved = (self.cargo_door_back_pos - self.cargo_door_back_pos_prev).abs()
            > f64::EPSILON
            || (self.cargo_door_front_pos - self.cargo_door_front_pos_prev).abs() > f64::EPSILON;

        if cargo_door_moved {
            self.cargo_door_timer_ptu =
                Duration::from_secs_f64(A320HydraulicLogic::CARGO_OPERATED_TIMEOUT_PTU);
        } else if self.cargo_door_timer_ptu > *delta_time_update {
            self.cargo_door_timer_ptu -= *delta_time_update;
        } else {
            self.cargo_door_timer_ptu = Duration::from_secs(0);
        }

        self.cargo_door_timer_ptu > Duration::from_secs_f64(0.0)
    }

    pub fn is_nsw_pin_inserted_flag(&mut self, delta_time_update: &Duration) -> bool {
        let pushback_in_progress = (self.pushback_angle - self.pushback_angle_prev).abs()
            > f64::EPSILON
            && (self.pushback_state - 3.0).abs() > f64::EPSILON;

        if pushback_in_progress {
            self.nws_tow_engaged_timer =
                Duration::from_secs_f64(A320HydraulicLogic::NWS_PIN_REMOVE_TIMEOUT);
        } else if self.nws_tow_engaged_timer > *delta_time_update {
            self.nws_tow_engaged_timer -= *delta_time_update; //TODO CHECK if rollover issue to expect if not limiting to 0
        } else {
            self.nws_tow_engaged_timer = Duration::from_secs(0);
        }

        self.nws_tow_engaged_timer > Duration::from_secs(0)
    }
}

impl SimulationElement for A320HydraulicLogic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, state: &mut SimulatorReader) {
        self.parking_brake_lever_pos = state.read_bool("BRAKE PARKING INDICATOR");
        self.eng_1_master_on = state.read_bool("GENERAL ENG1 STARTER ACTIVE");
        self.eng_2_master_on = state.read_bool("GENERAL ENG2 STARTER ACTIVE");
        self.weight_on_wheels = state.read_bool("SIM ON GROUND");

        //Handling here of the previous values of cargo doors
        self.cargo_door_front_pos_prev = self.cargo_door_front_pos;
        self.cargo_door_front_pos = state.read_f64("EXIT OPEN 5");
        self.cargo_door_back_pos_prev = self.cargo_door_back_pos;
        self.cargo_door_back_pos = state.read_f64("EXIT OPEN 3");

        //Handling here of the previous values of pushback angle. Angle keeps moving while towed. Feel free to find better hack
        self.pushback_angle_prev = self.pushback_angle;
        self.pushback_angle = state.read_f64("PUSHBACK ANGLE");
        self.pushback_state = state.read_f64("PUSHBACK STATE");
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_bool("HYD_GREEN_EDPUMP_LOW_PRESS", self.green_edp_has_fault);

        writer.write_bool("HYD_BLUE_EPUMP_LOW_PRESS", self.blue_epump_has_fault);

        writer.write_bool("HYD_YELLOW_EDPUMP_LOW_PRESS", self.yellow_edp_has_fault);

        writer.write_bool("HYD_YELLOW_EPUMP_LOW_PRESS", self.yellow_epump_has_fault);

        writer.write_bool("OVHD_HYD_ENG_1_PUMP_PB_HAS_FAULT", self.green_edp_has_fault);
        writer.write_bool(
            "OVHD_HYD_ENG_2_PUMP_PB_HAS_FAULT",
            self.yellow_edp_has_fault,
        );
        writer.write_bool("OVHD_HYD_EPUMPB_PB_HAS_FAULT", self.blue_epump_has_fault);
        writer.write_bool("OVHD_HYD_EPUMPY_PB_HAS_FAULT", self.yellow_epump_has_fault);
    }
}

pub struct A320HydraulicOverheadPanel {
    pub edp1_push_button: AutoOffFaultPushButton,
    pub edp2_push_button: AutoOffFaultPushButton,
    pub blue_epump_push_button: AutoOffFaultPushButton,
    pub ptu_push_button: AutoOffFaultPushButton,
    pub rat_push_button: AutoOffFaultPushButton,
    pub yellow_epump_push_button: AutoOffFaultPushButton,
    pub blue_epump_override_push_button: OnOffFaultPushButton,
    pub eng1_fire_pb: FirePushButton,
    pub eng2_fire_pb: FirePushButton,
}

impl A320HydraulicOverheadPanel {
    pub fn new() -> A320HydraulicOverheadPanel {
        A320HydraulicOverheadPanel {
            edp1_push_button: AutoOffFaultPushButton::new_auto("HYD_ENG_1_PUMP"),
            edp2_push_button: AutoOffFaultPushButton::new_auto("HYD_ENG_2_PUMP"),
            blue_epump_push_button: AutoOffFaultPushButton::new_auto("HYD_EPUMPB"),
            ptu_push_button: AutoOffFaultPushButton::new_auto("HYD_PTU"),
            rat_push_button: AutoOffFaultPushButton::new_off("HYD_RAT"),
            yellow_epump_push_button: AutoOffFaultPushButton::new_off("HYD_EPUMPY"),
            blue_epump_override_push_button: OnOffFaultPushButton::new_off("HYD_EPUMPY_OVRD"),
            eng1_fire_pb: FirePushButton::new("ENG1"),
            eng2_fire_pb: FirePushButton::new("ENG2"),
        }
    }

    pub fn update_pb_faults(&mut self, hyd: &A320Hydraulic) {
        self.edp1_push_button
            .set_fault(hyd.hyd_logic_inputs.green_edp_has_fault);
        self.edp2_push_button
            .set_fault(hyd.hyd_logic_inputs.yellow_edp_has_fault);
        self.blue_epump_push_button
            .set_fault(hyd.hyd_logic_inputs.blue_epump_has_fault);
        self.yellow_epump_push_button
            .set_fault(hyd.hyd_logic_inputs.yellow_epump_has_fault);
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
        self.eng1_fire_pb.accept(visitor);
        self.eng2_fire_pb.accept(visitor);

        visitor.visit(self);
    }
}

// #[cfg(test)]
// pub mod tests {
//     use super::A320HydraulicLogic;
//     use std::time::Duration;

//     fn hyd_logic() -> A320HydraulicLogic {
//         A320HydraulicLogic::new()
//     }

//     #[test]
//     fn is_nws_pin_engaged_test() {
//         let mut logic = hyd_logic();

//         let update_delta = Duration::from_secs_f64(0.08);
//         assert!(!logic.is_nsw_pin_inserted_flag(&update_delta));

//         logic.pushback_angle = 1.001;
//         logic.pushback_state = 2.0;
//         assert!(logic.is_nsw_pin_inserted_flag(&update_delta));
//     }
// }

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
        assert!(test_bed.contains_key("OVHD_HYD_ENG_1_PUMP_PB_HAS_FAULT"));
        assert!(test_bed.contains_key("OVHD_HYD_ENG_2_PUMP_PB_HAS_FAULT"));
        assert!(test_bed.contains_key("OVHD_HYD_EPUMPB_PB_HAS_FAULT"));
        assert!(test_bed.contains_key("OVHD_HYD_EPUMPY_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    mod a320_hydraulics {
        use super::*;
        use systems::simulation::{test::SimulationTestBed, Aircraft};
        use uom::si::{length::foot, ratio::percent, velocity::knot};

        struct A320HydraulicsTestAircraft {
            engine_1: Engine,
            engine_2: Engine,
            hydraulics: A320Hydraulic,
            overhead: A320HydraulicOverheadPanel,
        }
        impl A320HydraulicsTestAircraft {
            fn new() -> Self {
                Self {
                    engine_1: Engine::new(1),
                    engine_2: Engine::new(2),
                    hydraulics: A320Hydraulic::new(),
                    overhead: A320HydraulicOverheadPanel::new(),
                }
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
                self.hydraulics
                    .update(context, &self.engine_1, &self.engine_2, &self.overhead);

                self.overhead.update_pb_faults(&self.hydraulics);
            }
        }
        impl SimulationElement for A320HydraulicsTestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.hydraulics.accept(visitor);
                self.overhead.accept(visitor);

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

            fn set_cargo_door_state(mut self, position: f64) -> Self {
                self.simulation_test_bed.write_f64("EXIT OPEN 5", position);
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
                    .set_blue_e_pump(true)
                    .set_yellow_e_pump(true)
                    .set_green_ed_pump(true)
                    .set_yellow_ed_pump(true)
                    .set_ptu_state(true)
                    .set_park_brake(true)
                    .set_anti_skid(true)
                    .set_cargo_door_state(0.)
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
            test_bed = test_bed.run_waiting_for(Duration::from_secs_f64(
                A320HydraulicLogic::CARGO_OPERATED_TIMEOUT_PTU,
            )); //Should re enabled after 40s
            assert!(test_bed.is_ptu_enabled());
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

            //No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

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

            //No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

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
        fn yellow_edp_buildup_test() {
            let mut test_bed = test_bed_with()
                .engines_off()
                .on_the_ground()
                .set_cold_dark_inputs()
                .run_one_tick();

            //No pressure
            assert!(!test_bed.is_green_pressurised());
            assert!(test_bed.green_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_blue_pressurised());
            assert!(test_bed.blue_pressure() < Pressure::new::<psi>(50.));
            assert!(!test_bed.is_yellow_pressurised());
            assert!(test_bed.yellow_pressure() < Pressure::new::<psi>(50.));

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
            assert!(test_bed.yellow_pressure() > Pressure::new::<psi>(2900.));

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
    }
}
