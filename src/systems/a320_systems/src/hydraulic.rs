use std::time::{Duration, Instant};
use uom::si::{
    acceleration::foot_per_second_squared, area::square_meter, f64::*, force::newton, length::foot,
    length::meter, mass_density::kilogram_per_cubic_meter, pressure::atmosphere, pressure::pascal,
    pressure::psi, ratio::percent, thermodynamic_temperature::degree_celsius, time::second,
    velocity::knot, volume::cubic_inch, volume::gallon, volume::liter,
    volume_rate::cubic_meter_per_second, volume_rate::gallon_per_second,
};

//use crate::{ hydraulic::{ElectricPump, EngineDrivenPump, HydFluid, HydLoop, LoopColor, PressureSource, Ptu, Pump, RatPump}, overhead::{OnOffFaultPushButton}, shared::DelayedTrueLogicGate};
use systems::engine::Engine;
use systems::hydraulic::brakecircuit::BrakeCircuit;
use systems::hydraulic::{
    ElectricPump, EngineDrivenPump, HydFluid, HydLoop, LoopColor, PressureSource, Ptu,
    RatPropeller, RatPump,
};
use systems::overhead::{AutoOffFaultPushButton, FirePushButton, OnOffFaultPushButton};
use systems::{
    hydraulic::brakecircuit::AutoBrakeController,
    simulation::{
        SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
        UpdateContext,
    },
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
    //autobrake_controller : AutoBrakeController,
    braking_circuit_altn: BrakeCircuit,
    total_sim_time_elapsed: Duration,
    lag_time_accumulator: Duration,
    debug_refresh_duration: Duration,
}

impl A320Hydraulic {
    const MIN_PRESS_PRESSURISED: f64 = 150.0;
    const HYDRAULIC_SIM_TIME_STEP: u64 = 100; //refresh rate of hydraulic simulation in ms
    const ACTUATORS_SIM_TIME_STEP_MULT: u32 = 2; //refresh rate of actuators as multiplier of hydraulics. 2 means double frequency update

    pub fn new() -> A320Hydraulic {
        A320Hydraulic {
            hyd_logic_inputs: A320HydraulicLogic::new(),
            hyd_brake_logic: A320HydraulicBrakingLogic::new(),

            blue_loop: HydLoop::new(
                LoopColor::Blue,
                false,
                false,
                Volume::new::<gallon>(15.8),
                Volume::new::<gallon>(15.85),
                Volume::new::<gallon>(8.0),
                Volume::new::<gallon>(1.56),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
            ),
            green_loop: HydLoop::new(
                LoopColor::Green,
                true,
                false,
                Volume::new::<gallon>(26.38),
                Volume::new::<gallon>(26.41),
                Volume::new::<gallon>(15.),
                Volume::new::<gallon>(3.6),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
            ),
            yellow_loop: HydLoop::new(
                LoopColor::Yellow,
                false,
                true,
                Volume::new::<gallon>(19.75),
                Volume::new::<gallon>(19.81),
                Volume::new::<gallon>(10.0),
                Volume::new::<gallon>(3.15),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
            ),
            engine_driven_pump_1: EngineDrivenPump::new(),
            engine_driven_pump_2: EngineDrivenPump::new(),
            blue_electric_pump: ElectricPump::new(),
            yellow_electric_pump: ElectricPump::new(),
            rat: RatPump::new(),
            ptu: Ptu::new(),

            braking_circuit_norm: BrakeCircuit::new(
                Volume::new::<gallon>(0.),
                Volume::new::<gallon>(0.),
                Volume::new::<gallon>(0.08),
            ),

            //autobrake_controller : AutoBrakeController::new(vec![Acceleration::new::<foot_per_second_squared>(-5.),Acceleration::new::<foot_per_second_squared>(-10.),Acceleration::new::<foot_per_second_squared>(-20.)]),
            braking_circuit_altn: BrakeCircuit::new(
                Volume::new::<gallon>(1.5),
                Volume::new::<gallon>(0.0),
                Volume::new::<gallon>(0.08),
            ),

            total_sim_time_elapsed: Duration::new(0, 0),
            lag_time_accumulator: Duration::new(0, 0),
            debug_refresh_duration: Duration::new(0, 0),
        }
    }

    pub fn is_blue_pressurised(&self) -> bool {
        self.blue_loop.get_pressure().get::<psi>() >= A320Hydraulic::MIN_PRESS_PRESSURISED
    }

    pub fn is_green_pressurised(&self) -> bool {
        self.green_loop.get_pressure().get::<psi>() >= A320Hydraulic::MIN_PRESS_PRESSURISED
    }

    pub fn is_yellow_pressurised(&self) -> bool {
        self.yellow_loop.get_pressure().get::<psi>() >= A320Hydraulic::MIN_PRESS_PRESSURISED
    }

    pub fn update(
        &mut self,
        ct: &UpdateContext,
        engine1: &Engine,
        engine2: &Engine,
        overhead_panel: &A320HydraulicOverheadPanel,
    ) {
        let min_hyd_loop_timestep = Duration::from_millis(A320Hydraulic::HYDRAULIC_SIM_TIME_STEP); //Hyd Sim rate = 10 Hz

        self.total_sim_time_elapsed += ct.delta;

        //time to catch up in our simulation = new delta + time not updated last iteration
        let time_to_catch = ct.delta + self.lag_time_accumulator;

        //Number of time steps to do according to required time step
        let number_of_steps_f64 = time_to_catch.as_secs_f64() / min_hyd_loop_timestep.as_secs_f64();

        self.debug_refresh_duration += ct.delta;
        if self.debug_refresh_duration > Duration::from_secs_f64(0.3) {
            println!(
                "---HYDRAULIC UPDATE : t={}",
                self.total_sim_time_elapsed.as_secs_f64()
            );
            println!(
                "---G: {:.0} B: {:.0} Y: {:.0}",
                self.green_loop.get_pressure().get::<psi>(),
                self.blue_loop.get_pressure().get::<psi>(),
                self.yellow_loop.get_pressure().get::<psi>()
            );
            println!(
                "---RAT stow {:.0} Rat rpm: {:.0}",
                self.rat.get_stow_position(),
                self.rat.prop.get_rpm(),
            );
            // println!("---BRAKELOGIC : Ldmn={} Rdmn={} PbrakInd={} Askid={}",self.hyd_brake_logic.left_brake_command,self.hyd_brake_logic.right_brake_command,self.hyd_brake_logic.parking_brake_demand,self.hyd_brake_logic.anti_skid_activated);
            // println!("---BRAKEDMNDS : LG={} RG={} LY={} RY={}",self.hyd_brake_logic.left_brake_green_command,self.hyd_brake_logic.right_brake_green_command,self.hyd_brake_logic.left_brake_yellow_command,self.hyd_brake_logic.right_brake_yellow_command);
            //println!("---L={:.0} C={:.0} R={:.0}",ct.wheel_left_rpm,ct.wheel_center_rpm,ct.wheel_right_rpm);

            // let leftLock = ct.wheel_center_rpm / ct.wheel_left_rpm.max(1.);
            // let rightLock = ct.wheel_center_rpm / ct.wheel_right_rpm.max(1.);
            // println!("---LS={:.0} RS={:.0}",leftLock,rightLock);
            // println!("---EDP1 n2={} EDP2 n2={}", engine1.n2.get::<percent>(), engine2.n2.get::<percent>());
            // println!("---EDP1 flowMax={:.1}gpm EDP2 flowMax={:.1}gpm", (self.engine_driven_pump_1.get_delta_vol_max().get::<gallon>() / min_hyd_loop_timestep.as_secs_f64() )* 60.0, (self.engine_driven_pump_2.get_delta_vol_max().get::<gallon>()/min_hyd_loop_timestep.as_secs_f64())*60.0);
            //println!("---AutoBrakes={:.0} command={:0.2} accel={:0.2} accerror={:0.2}",self.hyd_brake_logic.autobrakes_setting,self.autobrake_controller.get_brake_command(),self.autobrake_controller.current_filtered_accel.get::<foot_per_second_squared>(),self.autobrake_controller.current_accel_error.get::<foot_per_second_squared>());
            // println!("---steps required: {:.2}", number_of_steps_f64);
            self.debug_refresh_duration = Duration::from_secs_f64(0.0);
        }

        //updating rat stowed pos on all frames in case it's used for graphics
        self.rat.update_stow_pos(&ct.delta);

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
                self.update_hyd_logic_inputs(&min_hyd_loop_timestep, &overhead_panel, &ct);

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
                    &ct,
                    &self.green_loop,
                    &engine1,
                );
                self.engine_driven_pump_2.update(
                    &min_hyd_loop_timestep,
                    &ct,
                    &self.yellow_loop,
                    &engine2,
                );
                self.yellow_electric_pump
                    .update(&min_hyd_loop_timestep, &ct, &self.yellow_loop);
                self.blue_electric_pump
                    .update(&min_hyd_loop_timestep, &ct, &self.blue_loop);

                self.rat
                    .update(&min_hyd_loop_timestep, &ct, &self.blue_loop);
                self.green_loop.update(
                    &min_hyd_loop_timestep,
                    &ct,
                    Vec::new(),
                    vec![&self.engine_driven_pump_1],
                    Vec::new(),
                    vec![&self.ptu],
                );
                self.yellow_loop.update(
                    &min_hyd_loop_timestep,
                    &ct,
                    vec![&self.yellow_electric_pump],
                    vec![&self.engine_driven_pump_2],
                    Vec::new(),
                    vec![&self.ptu],
                );
                self.blue_loop.update(
                    &min_hyd_loop_timestep,
                    &ct,
                    vec![&self.blue_electric_pump],
                    Vec::new(),
                    vec![&self.rat],
                    Vec::new(),
                );

                //self.autobrake_controller.update(&ct.delta, &ct);
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
                    .update_physics(&delta_time_physics, &ct.indicated_airspeed);
            }
        }
    }

    pub fn update_hyd_logic_inputs(
        &mut self,
        delta_time_update: &Duration,
        overhead_panel: &A320HydraulicOverheadPanel,
        ct: &UpdateContext,
    ) {
        let mut cargo_operated_ptu = false;
        let mut cargo_operated_ypump = false;
        let mut nsw_pin_inserted = false;

        //Only evaluate ground conditions if on ground, if superman needs to operate cargo door in flight feel free to update
        if self.hyd_logic_inputs.weight_on_wheels {
            cargo_operated_ptu = self
                .hyd_logic_inputs
                .is_cargo_operation_ptu_flag(&delta_time_update);
            cargo_operated_ypump = self
                .hyd_logic_inputs
                .is_cargo_operation_flag(&delta_time_update);
            nsw_pin_inserted = self
                .hyd_logic_inputs
                .is_nsw_pin_inserted_flag(&delta_time_update);
        }

        //Basic faults of pumps
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

        //RAT Deployment //Todo check all other needed conditions
        if !self.hyd_logic_inputs.eng_1_master_on
            && !self.hyd_logic_inputs.eng_2_master_on
            && ct.indicated_airspeed > Velocity::new::<knot>(100.)
        //Todo get speed from ADIRS
        {
            self.rat.set_active();
        }

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

        if overhead_panel.yellow_epump_push_button.is_off() || cargo_operated_ypump {
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

        let ptu_inhibit = cargo_operated_ptu && overhead_panel.yellow_epump_push_button.is_auto(); //TODO is auto will change once auto/on button is created in overhead library
        if overhead_panel.ptu_push_button.is_auto()
            && (!self.hyd_logic_inputs.weight_on_wheels
                || self.hyd_logic_inputs.eng_1_master_on && self.hyd_logic_inputs.eng_2_master_on
                || !self.hyd_logic_inputs.eng_1_master_on && !self.hyd_logic_inputs.eng_2_master_on
                || (!self.hyd_logic_inputs.parking_brake_applied && !nsw_pin_inserted))
            && !ptu_inhibit
        {
            self.ptu.enabling(true);
        } else {
            self.ptu.enabling(false);
        }
    }
}

impl SimulationElement for A320Hydraulic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(&mut self.hyd_logic_inputs);
        visitor.visit(&mut self.hyd_brake_logic);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_f64(
            "HYD_GREEN_PRESSURE",
            self.green_loop.get_pressure().get::<psi>(),
        );
        writer.write_f64(
            "HYD_GREEN_RESERVOIR",
            self.green_loop.get_reservoir_volume().get::<gallon>(),
        );
        writer.write_bool(
            "HYD_GREEN_EDPUMP_ACTIVE",
            self.engine_driven_pump_1.is_active(),
        );
        writer.write_bool(
            "HYD_GREEN_EDPUMP_LOW_PRESS",
            self.hyd_logic_inputs.green_edp_has_fault,
        );
        writer.write_bool(
            "HYD_GREEN_FIRE_VALVE_OPENED",
            self.green_loop.get_fire_shutoff_valve_state(),
        );

        writer.write_f64(
            "HYD_BLUE_PRESSURE",
            self.blue_loop.get_pressure().get::<psi>(),
        );
        writer.write_f64(
            "HYD_BLUE_RESERVOIR",
            self.blue_loop.get_reservoir_volume().get::<gallon>(),
        );
        writer.write_bool("HYD_BLUE_EPUMP_ACTIVE", self.blue_electric_pump.is_active());
        writer.write_bool(
            "HYD_BLUE_EPUMP_LOW_PRESS",
            self.hyd_logic_inputs.blue_epump_has_fault,
        );

        writer.write_f64(
            "HYD_YELLOW_PRESSURE",
            self.yellow_loop.get_pressure().get::<psi>(),
        );
        writer.write_f64(
            "HYD_YELLOW_RESERVOIR",
            self.yellow_loop.get_reservoir_volume().get::<gallon>(),
        );
        writer.write_bool(
            "HYD_YELLOW_EDPUMP_ACTIVE",
            self.engine_driven_pump_2.is_active(),
        );
        writer.write_bool(
            "HYD_YELLOW_EDPUMP_LOW_PRESS",
            self.hyd_logic_inputs.yellow_edp_has_fault,
        );
        writer.write_bool(
            "HYD_YELLOW_FIRE_VALVE_OPENED",
            self.yellow_loop.get_fire_shutoff_valve_state(),
        );
        writer.write_bool(
            "HYD_YELLOW_EPUMP_ACTIVE",
            self.yellow_electric_pump.is_active(),
        );
        writer.write_bool(
            "HYD_YELLOW_EPUMP_LOW_PRESS",
            self.hyd_logic_inputs.yellow_epump_has_fault,
        );

        writer.write_bool("HYD_PTU_VALVE_OPENED", self.ptu.is_enabled());
        writer.write_bool("HYD_PTU_ACTIVE_Y2G", self.ptu.get_is_active_right_to_left());
        writer.write_bool("HYD_PTU_ACTIVE_G2Y", self.ptu.get_is_active_left_to_right());
        writer.write_f64(
            "HYD_PTU_MOTOR_FLOW",
            self.ptu.get_flow().get::<gallon_per_second>(),
        );

        writer.write_f64("HYD_RAT_STOW_POSITION", self.rat.get_stow_position());

        writer.write_f64("HYD_RAT_RPM", self.rat.prop.get_rpm());

        //BRAKES
        writer.write_f64(
            "HYD_BRAKE_NORM_LEFT_PRESS",
            self.braking_circuit_norm
                .get_brake_pressure_left()
                .get::<psi>(),
        );
        writer.write_f64(
            "HYD_BRAKE_NORM_RIGHT_PRESS",
            self.braking_circuit_norm
                .get_brake_pressure_right()
                .get::<psi>(),
        );
        writer.write_f64(
            "HYD_BRAKE_ALTN_LEFT_PRESS",
            self.braking_circuit_altn
                .get_brake_pressure_left()
                .get::<psi>(),
        );
        writer.write_f64(
            "HYD_BRAKE_ALTN_RIGHT_PRESS",
            self.braking_circuit_altn
                .get_brake_pressure_right()
                .get::<psi>(),
        );
        writer.write_f64(
            "HYD_BRAKE_ALTN_ACC_PRESS",
            self.braking_circuit_altn.get_acc_pressure().get::<psi>(),
        );

        //Send overhead fault info
        writer.write_bool(
            "OVHD_HYD_ENG_1_PUMP_PB_HAS_FAULT",
            self.hyd_logic_inputs.green_edp_has_fault,
        );
        writer.write_bool(
            "OVHD_HYD_ENG_2_PUMP_PB_HAS_FAULT",
            self.hyd_logic_inputs.yellow_edp_has_fault,
        );
        writer.write_bool(
            "OVHD_HYD_EPUMPB_PB_HAS_FAULT",
            self.hyd_logic_inputs.blue_epump_has_fault,
        );
        writer.write_bool(
            "OVHD_HYD_EPUMPY_PB_HAS_FAULT",
            self.hyd_logic_inputs.yellow_epump_has_fault,
        );

        //TODO Write here brake position based on applied pressure?
        //TODO Decide here to set parking brake position to true if it's actually the case in hydraulic?
        // let mut max_left_press= self.braking_circuit_norm.get_brake_pressure_left().get::<psi>().max(self.braking_circuit_altn.get_brake_pressure_left().get::<psi>());
        // max_left_press = max_left_press / 3000.0;
        // max_left_press = max_left_press.min(1.0).max(0.0);

        // let mut max_right_press= self.braking_circuit_norm.get_brake_pressure_right().get::<psi>().max(self.braking_circuit_altn.get_brake_pressure_right().get::<psi>());
        // max_right_press = max_right_press / 3000.0;
        // max_right_press = max_right_press.min(1.0).max(0.0);

        // writer.write_f64("BRAKE LEFT DMND", max_left_press);
        // writer.write_f64("BRAKE RIGHT DMND", max_right_press);
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
    const MIN_PRESSURE_BRAKE_ALTN:f64 = 1500.; //Minimum pressure until main switched on ALTN brakes

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
            } else {
                //Else we just use parking brake
                self.left_brake_yellow_command += dynamic_increment;
                self.right_brake_yellow_command += dynamic_increment;
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
        self.parking_brake_demand = state.read_bool("PARK_BRAKE_DMND"); //TODO see if A32nx var exists
        self.weight_on_wheels = state.read_bool("SIM ON GROUND");
        self.anti_skid_activated = state.read_bool("ANTISKID ACTIVE");
        self.left_brake_command = state.read_f64("BRAKE LEFT DMND") / 100.0;
        self.right_brake_command = state.read_f64("BRAKE RIGHT DMND") / 100.0;
        self.autobrakes_setting = state.read_f64("AUTOBRAKES SETTING").floor() as u8;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        //TODO Decide here to set parking brake position to true if it's actually the case in hydraulic?
    }
}

pub struct A320HydraulicLogic {
    parking_brake_applied: bool,
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
}

//Implements low level logic for all hydraulics commands
impl A320HydraulicLogic {
    const CARGO_OPERATED_TIMEOUT_YPUMP: f64 = 20.0; //Timeout to shut off yellow epump after cargo operation
    const CARGO_OPERATED_TIMEOUT_PTU: f64 = 40.0; //Timeout to keep ptu inhibited after cargo operation
    const NWS_PIN_REMOVE_TIMEOUT: f64 = 15.0; //Time for ground crew to remove pin after tow

    pub fn new() -> A320HydraulicLogic {
        A320HydraulicLogic {
            parking_brake_applied: true,
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
        }
    }

    //TODO, code duplication to handle timeouts: generic function to do
    pub fn is_cargo_operation_flag(&mut self, delta_time_update: &Duration) -> bool {
        let cargo_door_moved = self.cargo_door_back_pos != self.cargo_door_back_pos_prev
            || self.cargo_door_front_pos != self.cargo_door_front_pos_prev;

        if cargo_door_moved {
            self.cargo_door_timer =
                Duration::from_secs_f64(A320HydraulicLogic::CARGO_OPERATED_TIMEOUT_YPUMP);
        } else {
            if self.cargo_door_timer > *delta_time_update {
                self.cargo_door_timer -= *delta_time_update;
            } else {
                self.cargo_door_timer = Duration::from_secs(0);
            }
        }

        self.cargo_door_timer > Duration::from_secs_f64(0.0)
    }

    pub fn is_cargo_operation_ptu_flag(&mut self, delta_time_update: &Duration) -> bool {
        let cargo_door_moved = self.cargo_door_back_pos != self.cargo_door_back_pos_prev
            || self.cargo_door_front_pos != self.cargo_door_front_pos_prev;

        if cargo_door_moved {
            self.cargo_door_timer_ptu =
                Duration::from_secs_f64(A320HydraulicLogic::CARGO_OPERATED_TIMEOUT_PTU);
        } else {
            if self.cargo_door_timer_ptu > *delta_time_update {
                self.cargo_door_timer_ptu -= *delta_time_update;
            } else {
                self.cargo_door_timer_ptu = Duration::from_secs(0);
            }
        }

        self.cargo_door_timer_ptu > Duration::from_secs_f64(0.0)
    }

    pub fn is_nsw_pin_inserted_flag(&mut self, delta_time_update: &Duration) -> bool {
        let pushback_in_progress =
            (self.pushback_angle != self.pushback_angle_prev) && self.pushback_state != 3.0;

        if pushback_in_progress {
            self.nws_tow_engaged_timer =
                Duration::from_secs_f64(A320HydraulicLogic::NWS_PIN_REMOVE_TIMEOUT);
        } else {
            if self.nws_tow_engaged_timer > *delta_time_update {
                self.nws_tow_engaged_timer -= *delta_time_update; //TODO CHECK if rollover issue to expect if not limiting to 0
            } else {
                self.nws_tow_engaged_timer = Duration::from_secs(0);
            }
        }

        self.nws_tow_engaged_timer > Duration::from_secs(0)
    }
}

impl SimulationElement for A320HydraulicLogic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, state: &mut SimulatorReader) {
        self.parking_brake_applied = state.read_bool("PARK_BRAKE_ON");
        self.eng_1_master_on = state.read_bool("ENG MASTER 1");
        self.eng_2_master_on = state.read_bool("ENG MASTER 2");
        self.weight_on_wheels = state.read_bool("SIM ON GROUND");

        //Handling here of the previous values of cargo doors
        self.cargo_door_front_pos_prev = self.cargo_door_front_pos;
        self.cargo_door_front_pos = state.read_f64("CARGO FRONT POS");
        self.cargo_door_back_pos_prev = self.cargo_door_back_pos;
        self.cargo_door_back_pos = state.read_f64("CARGO BACK POS");

        //Handling here of the previous values of pushback angle. Angle keeps moving while towed. Feel free to find better hack
        self.pushback_angle_prev = self.pushback_angle;
        self.pushback_angle = state.read_f64("PUSHBACK ANGLE");
        self.pushback_state = state.read_f64("PUSHBACK STATE");
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

    pub fn update_pb_faults(&mut self, hyd : &A320Hydraulic  ) {
        self.edp1_push_button.set_fault(hyd.hyd_logic_inputs.green_edp_has_fault);
        self.edp2_push_button.set_fault(hyd.hyd_logic_inputs.yellow_edp_has_fault);
        self.blue_epump_push_button.set_fault(hyd.hyd_logic_inputs.blue_epump_has_fault);
        self.yellow_epump_push_button.set_fault(hyd.hyd_logic_inputs.yellow_epump_has_fault);
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

#[cfg(test)]
pub mod tests {
    use std::time::Duration;

    use uom::si::{
        acceleration::{foot_per_second_squared, Acceleration},
        f64::*,
        length::foot,
        thermodynamic_temperature::degree_celsius,
        velocity::knot,
    };

    use super::A320HydraulicLogic;
    use super::A320HydraulicOverheadPanel;
    use crate::UpdateContext;

    fn overhead() -> A320HydraulicOverheadPanel {
        A320HydraulicOverheadPanel::new()
    }

    fn hyd_logic() -> A320HydraulicLogic {
        A320HydraulicLogic::new()
    }

    fn context(delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(0.),
            Length::new::<foot>(2000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
            0.0,
            0.0,
            0.0,
        )
    }

    #[test]
    fn is_nws_pin_engaged_test() {
        let mut overhead = overhead();
        let mut logic = hyd_logic();

        let update_delta = Duration::from_secs_f64(0.08);
        assert!(!logic.is_nsw_pin_inserted_flag(&update_delta));

        logic.pushback_angle = 1.001;
        logic.pushback_state = 2.0;
        assert!(logic.is_nsw_pin_inserted_flag(&update_delta));
    }
}
