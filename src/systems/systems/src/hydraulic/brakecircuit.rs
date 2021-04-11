use crate::{
    hydraulic::HydraulicLoop,
    simulation::{SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext},
};

use std::f64::consts::E;
use std::string::String;
use std::time::Duration;

use uom::si::{acceleration::foot_per_second_squared, f64::*, pressure::psi, volume::gallon};

use super::HydraulicAccumulator;

pub trait ActuatorHydInterface {
    fn get_used_volume(&self) -> Volume;
    fn get_reservoir_return(&self) -> Volume;
}

//Brakes implementation. This tries to do a simple model with a possibility to have an accumulator (or not)
//Brake model is simplified as we just move brake position from 0 to 1 and take conrresponding fluid volume (vol = max_displacement * brake_position).
// So it's fairly simplified as we just end up with brake pressure = hyd_pressure * current_position
pub struct BrakeCircuit {
    _id: String,
    id_left_press: String,
    id_right_press: String,
    id_acc_press: String,
    //Total volume used when at max braking position.
    //Simple model for now we assume at max braking we have max brake displacement
    total_displacement: Volume,

    //actuator position //TODO make this more dynamic with a per wheel basis instead of left/right?
    current_brake_position_left: f64,
    demanded_brake_position_left: f64,
    pressure_applied_left: Pressure,
    current_brake_position_right: f64,
    demanded_brake_position_right: f64,
    pressure_applied_right: Pressure,

    //Brake accumulator variables. Accumulator can have 0 volume if no accumulator
    has_accumulator: bool,
    accumulator: HydraulicAccumulator,
    // accumulator_total_volume: Volume,
    // accumulator_gas_pressure: Pressure,
    // accumulator_gas_volume: Volume,
    // accumulator_fluid_volume: Volume,
    // accumulator_press_breakpoints: [f64; 9],
    // accumulator_flow_carac: [f64; 9],

    //Common vars to all actuators: will be used by the calling loop to know what is used
    //and what comes back to  reservoir at each iteration
    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,

    accumulator_fluid_pressure_sensor_filtered: Pressure, //Fluid pressure in brake circuit filtered for cockpit gauges
}

impl SimulationElement for BrakeCircuit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_f64(
            &self.id_left_press,
            self.get_brake_pressure_left().get::<psi>(),
        );
        writer.write_f64(
            &self.id_right_press,
            self.get_brake_pressure_right().get::<psi>(),
        );
        if self.has_accumulator {
            writer.write_f64(&self.id_acc_press, self.get_acc_pressure().get::<psi>());
        }
    }
}

impl BrakeCircuit {
    const ACCUMULATOR_GAS_PRE_CHARGE: f64 = 1000.0; // Nitrogen PSI
    const ACCUMULATOR_PRESS_BREAKPTS: [f64; 9] =
        [0.0, 5.0, 10.0, 50.0, 100.0, 200.0, 500.0, 1000.0, 10000.0];
    const ACCUMULATOR_FLOW_CARAC: [f64; 9] = [0.0, 0.01, 0.016, 0.02, 0.04, 0.1, 0.15, 0.35, 0.5];

    //Filtered using time constant low pass: new_val = old_val + (new_val - old_val)* (1 - e^(-dt/TCONST))
    const ACC_PRESSURE_SENSOR_FILTER_TIMECONST: f64 = 0.1; //Time constant of the filter used to measure brake circuit pressure

    pub fn new(
        id: &str,
        accumulator_volume: Volume,
        accumulator_fluid_volume_at_init: Volume,
        total_displacement: Volume,
    ) -> BrakeCircuit {
        let mut has_accu = true;
        if accumulator_volume <= Volume::new::<gallon>(0.) {
            has_accu = false;
        }

        BrakeCircuit {
            _id: String::from(id).to_uppercase(),
            id_left_press: format!("HYD_BRAKE_{}_LEFT_PRESS", id),
            id_right_press: format!("HYD_BRAKE_{}_RIGHT_PRESS", id),
            id_acc_press: format!("HYD_BRAKE_{}_ACC_PRESS", id),

            total_displacement,
            current_brake_position_left: 0.0,
            demanded_brake_position_left: 0.0,
            pressure_applied_left: Pressure::new::<psi>(0.0),
            current_brake_position_right: 0.0,
            demanded_brake_position_right: 0.0,
            pressure_applied_right: Pressure::new::<psi>(0.0),
            has_accumulator: has_accu,
            accumulator: HydraulicAccumulator::new(
                Pressure::new::<psi>(Self::ACCUMULATOR_GAS_PRE_CHARGE),
                accumulator_volume,
                accumulator_fluid_volume_at_init,
                Self::ACCUMULATOR_PRESS_BREAKPTS,
                Self::ACCUMULATOR_FLOW_CARAC,
                true,
            ),
            volume_to_actuator_accumulator: Volume::new::<gallon>(0.),
            volume_to_res_accumulator: Volume::new::<gallon>(0.),
            accumulator_fluid_pressure_sensor_filtered: Pressure::new::<psi>(0.0), //Pressure measured after accumulator in brake circuit
        }
    }

    pub fn update(&mut self, delta_time: &Duration, hyd_loop: &HydraulicLoop) {
        let delta_vol = ((self.demanded_brake_position_left - self.current_brake_position_left)
            + (self.demanded_brake_position_right - self.current_brake_position_right))
            * self.total_displacement;

        if self.has_accumulator {
            self.accumulator.update(
                delta_time,
                &mut self.volume_to_actuator_accumulator,
                hyd_loop.loop_pressure,
            );

            if delta_vol > Volume::new::<gallon>(0.0) {
                let volume_from_acc = self.accumulator.get_delta_vol(delta_vol);
                if volume_from_acc == Volume::new::<gallon>(0.0) {
                    self.demanded_brake_position_left = self.current_brake_position_left;
                    self.demanded_brake_position_right = self.current_brake_position_right;
                }
            } else {
                self.volume_to_res_accumulator +=
                    delta_vol.abs().min(self.accumulator.get_fluid_volume());
            }
        } else {
            //Else case if no accumulator: we just take deltavol needed or return it back to res
            if delta_vol > Volume::new::<gallon>(0.0)
                && hyd_loop.get_pressure() >= Pressure::new::<psi>(100.)
            {
                self.volume_to_actuator_accumulator += delta_vol;
            } else {
                self.volume_to_res_accumulator += delta_vol.abs();
            }
        }

        if self.accumulator.get_fluid_volume() > Volume::new::<gallon>(0.0) {
            self.pressure_applied_left =
                self.accumulator.get_raw_gas_press() * self.demanded_brake_position_left;
            self.pressure_applied_right =
                self.accumulator.get_raw_gas_press() * self.demanded_brake_position_right;

            self.accumulator_fluid_pressure_sensor_filtered = self
                .accumulator_fluid_pressure_sensor_filtered
                + (self.accumulator.get_raw_gas_press()
                    - self.accumulator_fluid_pressure_sensor_filtered)
                    * (1.
                        - E.powf(
                            -delta_time.as_secs_f64()
                                / BrakeCircuit::ACC_PRESSURE_SENSOR_FILTER_TIMECONST,
                        ));
        } else {
            self.pressure_applied_left =
                hyd_loop.get_pressure() * self.demanded_brake_position_left;
            self.pressure_applied_right =
                hyd_loop.get_pressure() * self.demanded_brake_position_right;

            self.accumulator_fluid_pressure_sensor_filtered = self
                .accumulator_fluid_pressure_sensor_filtered
                + (hyd_loop.get_pressure() - self.accumulator_fluid_pressure_sensor_filtered)
                    * (1.
                        - E.powf(
                            -delta_time.as_secs_f64()
                                / BrakeCircuit::ACC_PRESSURE_SENSOR_FILTER_TIMECONST,
                        ));
        }
        self.current_brake_position_left = self.demanded_brake_position_left;
        self.current_brake_position_right = self.demanded_brake_position_right;
    }

    pub fn set_brake_demand_left(&mut self, brake_ratio: f64) {
        self.demanded_brake_position_left = brake_ratio.min(1.0).max(0.0);
    }
    pub fn set_brake_demand_right(&mut self, brake_ratio: f64) {
        self.demanded_brake_position_right = brake_ratio.min(1.0).max(0.0);
    }

    pub fn get_brake_pressure_left(&self) -> Pressure {
        self.pressure_applied_left
    }
    pub fn get_brake_pressure_right(&self) -> Pressure {
        self.pressure_applied_right
    }
    pub fn get_acc_pressure(&self) -> Pressure {
        self.accumulator_fluid_pressure_sensor_filtered
    }

    pub fn reset_accumulators(&mut self) {
        self.volume_to_res_accumulator = Volume::new::<gallon>(0.);
        self.volume_to_actuator_accumulator = Volume::new::<gallon>(0.);
    }
}

impl ActuatorHydInterface for BrakeCircuit {
    fn get_used_volume(&self) -> Volume {
        self.volume_to_actuator_accumulator
    }
    fn get_reservoir_return(&self) -> Volume {
        self.volume_to_res_accumulator
    }
}

pub struct AutoBrakeController {
    accel_targets: Vec<Acceleration>,
    num_of_modes: usize,

    current_selected_mode: usize,

    pub current_filtered_accel: Acceleration,

    pub current_accel_error: Acceleration,
    accel_error_prev: Acceleration,
    current_integral_term: f64,
    current_brake_dmnd: f64, //Controller brake demand to satisfy autobrake mode [0:1]

    is_enabled: bool,
}

impl AutoBrakeController {
    const LONG_ACC_FILTER_TIMECONST: f64 = 0.1;

    const CONTROLLER_P_GAIN: f64 = 0.05;
    const CONTROLLER_I_GAIN: f64 = 0.001;
    const CONTROLLER_D_GAIN: f64 = 0.01;

    pub fn new(accel_targets: Vec<Acceleration>) -> AutoBrakeController {
        let num = accel_targets.len();
        assert!(num > 0);
        AutoBrakeController {
            accel_targets,
            num_of_modes: num,
            current_selected_mode: 0,
            current_filtered_accel: Acceleration::new::<foot_per_second_squared>(0.0),
            current_accel_error: Acceleration::new::<foot_per_second_squared>(0.0),
            accel_error_prev: Acceleration::new::<foot_per_second_squared>(0.0),
            current_integral_term: 0.,
            current_brake_dmnd: 0.,
            is_enabled: false,
        }
    }

    pub fn update(&mut self, delta_time: &Duration, context: &UpdateContext) {
        self.current_filtered_accel = self.current_filtered_accel
            + (context.long_accel() - self.current_filtered_accel)
                * (1.
                    - E.powf(
                        -delta_time.as_secs_f64() / AutoBrakeController::LONG_ACC_FILTER_TIMECONST,
                    ));

        self.current_accel_error =
            self.current_filtered_accel - self.accel_targets[self.current_selected_mode];

        if self.is_enabled && context.is_on_ground() {
            let pterm = self.current_accel_error.get::<foot_per_second_squared>()
                * AutoBrakeController::CONTROLLER_P_GAIN;
            let dterm = (self.current_accel_error - self.accel_error_prev)
                .get::<foot_per_second_squared>()
                * AutoBrakeController::CONTROLLER_D_GAIN;
            self.current_integral_term += self.current_accel_error.get::<foot_per_second_squared>()
                * AutoBrakeController::CONTROLLER_I_GAIN;

            let current_brake_dmnd = pterm + self.current_integral_term + dterm;
            self.current_brake_dmnd = current_brake_dmnd.min(1.).max(0.);
        } else {
            self.current_brake_dmnd = 0.0;
            self.current_integral_term = 0.0;
        }
    }

    pub fn get_brake_command(&self) -> f64 {
        self.current_brake_dmnd
    }

    pub fn set_mode(&mut self, selected_mode: &usize) {
        self.current_selected_mode = *selected_mode.min(&self.num_of_modes);
    }

    pub fn set_enable(&mut self, ena: bool) {
        self.is_enabled = ena;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        hydraulic::{HydFluid, HydraulicLoop},
        simulation::UpdateContext,
    };
    use uom::si::{
        acceleration::foot_per_second_squared,
        length::foot,
        pressure::{pascal, psi},
        thermodynamic_temperature::degree_celsius,
        velocity::knot,
        volume::gallon,
    };

    #[test]
    //Runs engine driven pump, checks pressure OK, shut it down, check drop of pressure after 20s
    fn brake_state_at_init() {
        let init_max_vol = Volume::new::<gallon>(1.5);
        let brake_circuit_unprimed = BrakeCircuit::new(
            "altn",
            init_max_vol,
            Volume::new::<gallon>(0.0),
            Volume::new::<gallon>(0.1),
        );

        assert!(
            brake_circuit_unprimed.get_brake_pressure_left()
                + brake_circuit_unprimed.get_brake_pressure_right()
                < Pressure::new::<psi>(10.0)
        );
        assert!(brake_circuit_unprimed.accumulator.total_volume == init_max_vol);
        assert!(
            brake_circuit_unprimed.accumulator.get_fluid_volume() == Volume::new::<gallon>(0.0)
        );
        assert!(brake_circuit_unprimed.accumulator.gas_volume == init_max_vol);

        let brake_circuit_primed = BrakeCircuit::new(
            "altn",
            init_max_vol,
            init_max_vol / 2.0,
            Volume::new::<gallon>(0.1),
        );

        assert!(
            brake_circuit_unprimed.get_brake_pressure_left()
                + brake_circuit_unprimed.get_brake_pressure_right()
                < Pressure::new::<psi>(10.0)
        );
        assert!(brake_circuit_primed.accumulator.total_volume == init_max_vol);
        assert!(brake_circuit_primed.accumulator.get_fluid_volume() == init_max_vol / 2.0);
        assert!(brake_circuit_primed.accumulator.gas_volume < init_max_vol);
    }

    #[test]
    fn brake_pressure_rise() {
        let init_max_vol = Volume::new::<gallon>(1.5);
        let mut hyd_loop = hydraulic_loop("YELLOW");
        hyd_loop.loop_pressure = Pressure::new::<psi>(2500.0);

        let mut brake_circuit_primed = BrakeCircuit::new(
            "Altn",
            init_max_vol,
            init_max_vol / 2.0,
            Volume::new::<gallon>(0.1),
        );

        assert!(
            brake_circuit_primed.get_brake_pressure_left()
                + brake_circuit_primed.get_brake_pressure_right()
                < Pressure::new::<psi>(10.0)
        );

        brake_circuit_primed.update(&Duration::from_secs_f64(0.1), &hyd_loop);

        assert!(
            brake_circuit_primed.get_brake_pressure_left()
                + brake_circuit_primed.get_brake_pressure_right()
                < Pressure::new::<psi>(10.0)
        );

        brake_circuit_primed.set_brake_demand_left(1.0);
        brake_circuit_primed.update(&Duration::from_secs_f64(0.1), &hyd_loop);

        assert!(brake_circuit_primed.get_brake_pressure_left() >= Pressure::new::<psi>(1000.));
        assert!(brake_circuit_primed.get_brake_pressure_right() <= Pressure::new::<psi>(50.));
        assert!(brake_circuit_primed.accumulator.get_fluid_volume() >= Volume::new::<gallon>(0.1));

        brake_circuit_primed.set_brake_demand_left(0.0);
        brake_circuit_primed.set_brake_demand_right(1.0);
        brake_circuit_primed.update(&Duration::from_secs_f64(0.1), &hyd_loop);
        assert!(brake_circuit_primed.get_brake_pressure_right() >= Pressure::new::<psi>(1000.));
        assert!(brake_circuit_primed.get_brake_pressure_left() <= Pressure::new::<psi>(50.));
        assert!(brake_circuit_primed.accumulator.get_fluid_volume() >= Volume::new::<gallon>(0.1));
    }

    #[test]
    fn brake_pressure_rise_no_accumulator() {
        let init_max_vol = Volume::new::<gallon>(0.0);
        let mut hyd_loop = hydraulic_loop("GREEN");
        hyd_loop.loop_pressure = Pressure::new::<psi>(2500.0);

        let mut brake_circuit_primed = BrakeCircuit::new(
            "norm",
            init_max_vol,
            init_max_vol / 2.0,
            Volume::new::<gallon>(0.1),
        );

        assert!(
            brake_circuit_primed.get_brake_pressure_left()
                + brake_circuit_primed.get_brake_pressure_right()
                < Pressure::new::<psi>(10.0)
        );

        brake_circuit_primed.update(&Duration::from_secs_f64(0.1), &hyd_loop);

        assert!(
            brake_circuit_primed.get_brake_pressure_left()
                + brake_circuit_primed.get_brake_pressure_right()
                < Pressure::new::<psi>(10.0)
        );

        brake_circuit_primed.set_brake_demand_left(1.0);
        brake_circuit_primed.update(&Duration::from_secs_f64(0.1), &hyd_loop);

        assert!(brake_circuit_primed.get_brake_pressure_left() >= Pressure::new::<psi>(2500.));
        assert!(brake_circuit_primed.get_brake_pressure_right() <= Pressure::new::<psi>(50.));

        brake_circuit_primed.set_brake_demand_left(0.0);
        brake_circuit_primed.set_brake_demand_right(1.0);
        brake_circuit_primed.update(&Duration::from_secs_f64(0.1), &hyd_loop);
        assert!(brake_circuit_primed.get_brake_pressure_right() >= Pressure::new::<psi>(2500.));
        assert!(brake_circuit_primed.get_brake_pressure_left() <= Pressure::new::<psi>(50.));
        assert!(brake_circuit_primed.accumulator.get_fluid_volume() == Volume::new::<gallon>(0.0));
    }

    #[test]
    fn auto_brake_controller() {
        let mut controller = AutoBrakeController::new(vec![
            Acceleration::new::<foot_per_second_squared>(-1.5),
            Acceleration::new::<foot_per_second_squared>(-3.),
            Acceleration::new::<foot_per_second_squared>(-15.),
        ]);
        let context = context(Duration::from_secs_f64(0.));

        assert!(controller.get_brake_command() <= 0.0);

        controller.update(&context.delta(), &context);
        assert!(controller.get_brake_command() <= 0.0);

        controller.set_enable(true);
        controller.update(&context.delta(), &context);
        assert!(controller.get_brake_command() >= 0.0);
    }

    fn hydraulic_loop(loop_color: &str) -> HydraulicLoop {
        match loop_color {
            "GREEN" => HydraulicLoop::new(
                loop_color,
                false,
                true,
                Volume::new::<gallon>(26.00),
                Volume::new::<gallon>(26.41),
                Volume::new::<gallon>(10.0),
                Volume::new::<gallon>(3.83),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
                Pressure::new::<psi>(1450.0),
                Pressure::new::<psi>(1750.0),
            ),
            "YELLOW" => HydraulicLoop::new(
                loop_color,
                true,
                false,
                Volume::new::<gallon>(10.2),
                Volume::new::<gallon>(10.2),
                Volume::new::<gallon>(8.0),
                Volume::new::<gallon>(3.3),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
                true,
                Pressure::new::<psi>(1450.0),
                Pressure::new::<psi>(1750.0),
            ),
            _ => HydraulicLoop::new(
                loop_color,
                false,
                false,
                Volume::new::<gallon>(15.85),
                Volume::new::<gallon>(15.85),
                Volume::new::<gallon>(8.0),
                Volume::new::<gallon>(1.5),
                HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
                false,
                Pressure::new::<psi>(1450.0),
                Pressure::new::<psi>(1750.0),
            ),
        }
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
}
