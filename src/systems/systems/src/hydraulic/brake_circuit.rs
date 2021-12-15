use crate::{
    overhead::PressSingleSignalButton,
    shared::low_pass_filter::LowPassFilter,
    shared::pid::PidController,
    simulation::{
        SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
    },
};

use std::time::Duration;

use uom::si::{
    acceleration::meter_per_second_squared, f64::*, pressure::psi, ratio::ratio, volume::gallon,
};

use super::linear_actuator::Actuator;
use super::Accumulator;
use super::SectionPressure;
use crate::simulation::{InitContext, VariableIdentifier};

struct BrakeActuator {
    total_displacement: Volume,
    base_speed: f64,

    current_position: f64,

    required_position: f64,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,
}
impl BrakeActuator {
    const ACTUATOR_BASE_SPEED: f64 = 1.5; // movement in percent/100 per second. 1 means 0 to 1 in 1s
    const MIN_PRESSURE_ALLOWED_TO_MOVE_ACTUATOR_PSI: f64 = 50.;
    const PRESSURE_FOR_MAX_BRAKE_DEFLECTION_PSI: f64 = 3100.;

    fn new(total_displacement: Volume) -> Self {
        Self {
            total_displacement,
            base_speed: BrakeActuator::ACTUATOR_BASE_SPEED,
            current_position: 0.,
            required_position: 0.,
            volume_to_actuator_accumulator: Volume::new::<gallon>(0.),
            volume_to_res_accumulator: Volume::new::<gallon>(0.),
        }
    }

    fn set_position_demand(&mut self, required_position: f64) {
        self.required_position = required_position;
    }

    fn get_max_position_reachable(&self, received_pressure: Pressure) -> f64 {
        if received_pressure.get::<psi>() > Self::MIN_PRESSURE_ALLOWED_TO_MOVE_ACTUATOR_PSI {
            (received_pressure.get::<psi>() / Self::PRESSURE_FOR_MAX_BRAKE_DEFLECTION_PSI)
                .min(1.)
                .max(0.)
        } else {
            0.
        }
    }

    fn get_applied_brake_pressure(&self) -> Pressure {
        Pressure::new::<psi>(Self::PRESSURE_FOR_MAX_BRAKE_DEFLECTION_PSI) * self.current_position
    }

    fn update(&mut self, context: &UpdateContext, received_pressure: Pressure) {
        let final_delta_position = self.update_position(context, received_pressure);

        if final_delta_position > 0. {
            self.volume_to_actuator_accumulator += final_delta_position * self.total_displacement;
        } else {
            self.volume_to_res_accumulator += -final_delta_position * self.total_displacement;
        }
    }

    fn update_position(&mut self, context: &UpdateContext, loop_pressure: Pressure) -> f64 {
        // Final required position for actuator is the required one unless we can't reach it due to pressure
        let final_required_position = self
            .required_position
            .min(self.get_max_position_reachable(loop_pressure));
        let delta_position_required = final_required_position - self.current_position;

        let mut new_position = self.current_position;
        if delta_position_required > 0.001 {
            new_position = self.current_position + context.delta_as_secs_f64() * self.base_speed;
            new_position = new_position.min(self.current_position + delta_position_required);
        } else if delta_position_required < -0.001 {
            new_position = self.current_position - context.delta_as_secs_f64() * self.base_speed;
            new_position = new_position.max(self.current_position + delta_position_required);
        }
        new_position = new_position.min(1.).max(0.);
        let final_delta_position = new_position - self.current_position;
        self.current_position = new_position;

        final_delta_position
    }
}
impl Actuator for BrakeActuator {
    fn used_volume(&self) -> Volume {
        self.volume_to_actuator_accumulator
    }

    fn reservoir_return(&self) -> Volume {
        self.volume_to_res_accumulator
    }

    fn reset_volumes(&mut self) {
        self.volume_to_res_accumulator = Volume::new::<gallon>(0.);
        self.volume_to_actuator_accumulator = Volume::new::<gallon>(0.);
    }
}

/// Brakes implementation. This tries to do a simple model with a possibility to have an accumulator (or not)
/// Brake model is simplified as we just move brake actuator position from 0 to 1 and take corresponding fluid volume (vol = max_displacement * brake_position).
/// So it's fairly simplified as we just end up with brake pressure = PRESSURE_FOR_MAX_BRAKE_DEFLECTION_PSI * current_position
pub struct BrakeCircuit {
    left_press_id: VariableIdentifier,
    right_press_id: VariableIdentifier,
    acc_press_id: VariableIdentifier,

    left_brake_actuator: BrakeActuator,
    right_brake_actuator: BrakeActuator,

    demanded_brake_position_left: Ratio,
    pressure_applied_left: Pressure,
    demanded_brake_position_right: Ratio,
    pressure_applied_right: Pressure,

    pressure_limitation: Pressure,

    /// Brake accumulator variables. Accumulator can have 0 volume if no accumulator
    has_accumulator: bool,
    accumulator: Accumulator,

    /// Common vars to all actuators: will be used by the calling loop to know what is used
    /// and what comes back to  reservoir at each iteration
    total_volume_to_actuator: Volume,
    total_volume_to_reservoir: Volume,

    /// Fluid pressure in brake circuit filtered for cockpit gauges
    accumulator_fluid_pressure_sensor_filter: LowPassFilter<Pressure>,
}
impl BrakeCircuit {
    const ACCUMULATOR_GAS_PRE_CHARGE: f64 = 1000.0; // Nitrogen PSI

    // Filtered using time constant low pass: new_val = old_val + (new_val - old_val)* (1 - e^(-dt/TCONST))
    // Time constant of the filter used to measure brake circuit pressure
    const ACC_PRESSURE_SENSOR_FILTER_TIMECONST: Duration = Duration::from_millis(100);

    pub fn new(
        context: &mut InitContext,
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
            left_press_id: context.get_identifier(format!("HYD_BRAKE_{}_LEFT_PRESS", id)),
            right_press_id: context.get_identifier(format!("HYD_BRAKE_{}_RIGHT_PRESS", id)),
            acc_press_id: context.get_identifier(format!("HYD_BRAKE_{}_ACC_PRESS", id)),

            // We assume displacement is just split on left and right
            left_brake_actuator: BrakeActuator::new(total_displacement / 2.),
            right_brake_actuator: BrakeActuator::new(total_displacement / 2.),

            demanded_brake_position_left: Ratio::new::<ratio>(0.0),
            pressure_applied_left: Pressure::new::<psi>(0.0),
            demanded_brake_position_right: Ratio::new::<ratio>(0.0),
            pressure_applied_right: Pressure::new::<psi>(0.0),
            pressure_limitation: Pressure::new::<psi>(5000.0),
            has_accumulator: has_accu,
            accumulator: Accumulator::new(
                Pressure::new::<psi>(Self::ACCUMULATOR_GAS_PRE_CHARGE),
                accumulator_volume,
                accumulator_fluid_volume_at_init,
                true,
            ),
            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_to_reservoir: Volume::new::<gallon>(0.),

            // Pressure measured after accumulator in brake circuit
            accumulator_fluid_pressure_sensor_filter: LowPassFilter::<Pressure>::new(
                Self::ACC_PRESSURE_SENSOR_FILTER_TIMECONST,
            ),
        }
    }

    pub fn set_brake_press_limit(&mut self, pressure_limit: Pressure) {
        self.pressure_limitation = pressure_limit;
    }

    fn update_brake_actuators(&mut self, context: &UpdateContext, hyd_pressure: Pressure) {
        self.left_brake_actuator
            .set_position_demand(self.demanded_brake_position_left.get::<ratio>());
        self.right_brake_actuator
            .set_position_demand(self.demanded_brake_position_right.get::<ratio>());

        let actual_max_allowed_pressure = hyd_pressure.min(self.pressure_limitation);

        self.left_brake_actuator
            .update(context, actual_max_allowed_pressure);
        self.right_brake_actuator
            .update(context, actual_max_allowed_pressure);
    }

    pub fn update(&mut self, context: &UpdateContext, section: &impl SectionPressure) {
        // The pressure available in brakes is the one of accumulator only if accumulator has fluid
        let actual_pressure_available: Pressure;
        if self.accumulator.fluid_volume() > Volume::new::<gallon>(0.) {
            actual_pressure_available = self.accumulator.raw_gas_press();
        } else {
            actual_pressure_available = section.pressure();
        }

        self.update_brake_actuators(context, actual_pressure_available);

        let delta_vol =
            self.left_brake_actuator.used_volume() + self.right_brake_actuator.used_volume();

        if self.has_accumulator {
            let mut volume_into_accumulator = Volume::new::<gallon>(0.);
            self.accumulator.update(
                context,
                &mut volume_into_accumulator,
                section.pressure(),
                Volume::new::<gallon>(1.),
            );

            // Volume that just came into accumulator is taken from hydraulic loop through volume_to_actuator interface
            self.total_volume_to_actuator += volume_into_accumulator.abs();

            if delta_vol > Volume::new::<gallon>(0.) {
                let volume_from_acc = self.accumulator.get_delta_vol(delta_vol);
                let remaining_vol_after_accumulator_empty = delta_vol - volume_from_acc;
                self.total_volume_to_actuator += remaining_vol_after_accumulator_empty;
            }
        } else {
            // Else case if no accumulator: we just take deltavol needed or return it back to res
            self.total_volume_to_actuator += delta_vol;
        }

        self.total_volume_to_reservoir += self.left_brake_actuator.reservoir_return();
        self.total_volume_to_reservoir += self.right_brake_actuator.reservoir_return();

        self.left_brake_actuator.reset_volumes();
        self.right_brake_actuator.reset_volumes();

        self.pressure_applied_left = self.left_brake_actuator.get_applied_brake_pressure();
        self.pressure_applied_right = self.right_brake_actuator.get_applied_brake_pressure();

        self.accumulator_fluid_pressure_sensor_filter
            .update(context.delta(), actual_pressure_available);
    }

    pub fn set_brake_demand_left(&mut self, brake_ratio: Ratio) {
        self.demanded_brake_position_left = brake_ratio
            .min(Ratio::new::<ratio>(1.0))
            .max(Ratio::new::<ratio>(0.0));
    }

    pub fn set_brake_demand_right(&mut self, brake_ratio: Ratio) {
        self.demanded_brake_position_right = brake_ratio
            .min(Ratio::new::<ratio>(1.0))
            .max(Ratio::new::<ratio>(0.0));
    }

    pub fn left_brake_pressure(&self) -> Pressure {
        self.pressure_applied_left
    }

    pub fn right_brake_pressure(&self) -> Pressure {
        self.pressure_applied_right
    }

    fn accumulator_pressure(&self) -> Pressure {
        self.accumulator_fluid_pressure_sensor_filter.output()
    }

    pub fn accumulator_fluid_volume(&self) -> Volume {
        self.accumulator.fluid_volume()
    }
}
impl Actuator for BrakeCircuit {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }

    fn reservoir_return(&self) -> Volume {
        self.total_volume_to_reservoir
    }

    fn reset_volumes(&mut self) {
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
        self.total_volume_to_reservoir = Volume::new::<gallon>(0.);
    }
}
impl SimulationElement for BrakeCircuit {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.left_press_id, self.left_brake_pressure());
        writer.write(&self.right_press_id, self.right_brake_pressure());
        if self.has_accumulator {
            writer.write(&self.acc_press_id, self.accumulator_pressure());
        }
    }
}

#[derive(PartialEq, Clone, Copy)]
pub enum AutobrakeMode {
    NONE = 0,
    LOW = 1,
    MED = 2,
    MAX = 3,
    HIGH = 4,
    RTO = 5,
    BTV = 6,
}
impl From<f64> for AutobrakeMode {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => AutobrakeMode::NONE,
            1 => AutobrakeMode::LOW,
            2 => AutobrakeMode::MED,
            3 => AutobrakeMode::MAX,
            4 => AutobrakeMode::HIGH,
            5 => AutobrakeMode::RTO,
            6 => AutobrakeMode::BTV,
            _ => AutobrakeMode::NONE,
        }
    }
}

pub struct AutobrakePanel {
    lo_button: PressSingleSignalButton,
    med_button: PressSingleSignalButton,
    max_button: PressSingleSignalButton,
}
impl AutobrakePanel {
    pub fn new(context: &mut InitContext) -> AutobrakePanel {
        AutobrakePanel {
            lo_button: PressSingleSignalButton::new(context, "AUTOBRK_LOW_ON"),
            med_button: PressSingleSignalButton::new(context, "AUTOBRK_MED_ON"),
            max_button: PressSingleSignalButton::new(context, "AUTOBRK_MAX_ON"),
        }
    }

    fn low_pressed(&self) -> bool {
        self.lo_button.is_pressed()
    }

    fn med_pressed(&self) -> bool {
        self.med_button.is_pressed()
    }

    fn max_pressed(&self) -> bool {
        self.max_button.is_pressed()
    }

    pub fn pressed_mode(&self) -> Option<AutobrakeMode> {
        if self.low_pressed() {
            Some(AutobrakeMode::LOW)
        } else if self.med_pressed() {
            Some(AutobrakeMode::MED)
        } else if self.max_pressed() {
            Some(AutobrakeMode::MAX)
        } else {
            None
        }
    }
}
impl SimulationElement for AutobrakePanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.lo_button.accept(visitor);
        self.med_button.accept(visitor);
        self.max_button.accept(visitor);

        visitor.visit(self);
    }
}

/// Deceleration governor is the PI controller computing the expected brake force to reach the target
/// it's been given by update caller
pub struct AutobrakeDecelerationGovernor {
    pid_controller: PidController,

    current_output: f64,
    acceleration_filter: LowPassFilter<Acceleration>,

    is_engaged: bool,
    time_engaged: Duration,
}
impl AutobrakeDecelerationGovernor {
    // Low pass filter for controller acceleration input, time constant in second
    const ACCELERATION_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(100);

    pub fn new() -> AutobrakeDecelerationGovernor {
        Self {
            pid_controller: PidController::new(0.3, 0.25, 0., -1., 0., 0.),

            current_output: 0.,
            acceleration_filter: LowPassFilter::<Acceleration>::new(
                Self::ACCELERATION_FILTER_TIME_CONSTANT,
            ),
            is_engaged: false,
            time_engaged: Duration::from_secs(0),
        }
    }

    pub fn engage_when(&mut self, engage_condition: bool) {
        if engage_condition {
            self.is_engaged = true;
        } else {
            self.disengage();
        }
    }

    pub fn is_engaged(&self) -> bool {
        self.is_engaged
    }

    fn disengage(&mut self) {
        self.is_engaged = false;
        self.time_engaged = Duration::from_secs(0);
        self.pid_controller.reset();
    }

    pub fn time_engaged(&self) -> Duration {
        self.time_engaged
    }

    pub fn is_on_target(&self, percent_margin_to_target: Ratio) -> bool {
        self.is_engaged
            && self.acceleration_filter.output()
                < Acceleration::new::<meter_per_second_squared>(self.pid_controller.setpoint())
                    * percent_margin_to_target.get::<ratio>()
    }

    pub fn update(&mut self, context: &UpdateContext, target: Acceleration) {
        self.pid_controller
            .change_setpoint(target.get::<meter_per_second_squared>());

        self.acceleration_filter
            .update(context.delta(), context.long_accel());

        if self.is_engaged {
            self.time_engaged += context.delta();

            self.current_output = -self.pid_controller.next_control_output(
                self.acceleration_filter
                    .output()
                    .get::<meter_per_second_squared>(),
                Some(context.delta()),
            );
        } else {
            self.current_output = 0.;
            self.pid_controller.reset();
        }
    }

    pub fn output(&self) -> f64 {
        self.current_output
    }

    pub fn decelerating_at_or_above_rate(&self, target_threshold: Acceleration) -> bool {
        self.acceleration_filter.output() < target_threshold
    }
}
impl Default for AutobrakeDecelerationGovernor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::electrical::Electricity;
    use crate::shared::MachNumber;
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestVariableRegistry};
    use crate::simulation::UpdateContext;
    use std::time::Duration;
    use uom::si::{
        acceleration::foot_per_second_squared, angle::radian, length::foot, pressure::psi,
        thermodynamic_temperature::degree_celsius, velocity::knot, volume::gallon,
    };

    struct TestHydraulicSection {
        current_pressure: Pressure,
    }
    impl TestHydraulicSection {
        fn new(pressure: Pressure) -> Self {
            Self {
                current_pressure: pressure,
            }
        }
    }
    impl SectionPressure for TestHydraulicSection {
        fn pressure(&self) -> Pressure {
            self.current_pressure
        }

        fn is_pressure_switch_pressurised(&self) -> bool {
            self.current_pressure.get::<psi>() > 2000.
        }
    }

    #[test]
    fn brake_actuator_movement() {
        let mut electricity = Electricity::new();
        let mut registry: TestVariableRegistry = Default::default();
        let mut init_context = InitContext::new(&mut electricity, &mut registry);

        let mut brake_actuator = BrakeActuator::new(Volume::new::<gallon>(0.04));

        assert!(brake_actuator.current_position == 0.);
        assert!(brake_actuator.required_position == 0.);

        brake_actuator.set_position_demand(1.2);

        for _loop_idx in 0..15 {
            brake_actuator.update(
                &context(&mut init_context, Duration::from_secs_f64(0.1)),
                Pressure::new::<psi>(BrakeActuator::PRESSURE_FOR_MAX_BRAKE_DEFLECTION_PSI),
            );
        }

        assert!(brake_actuator.current_position >= 0.99);
        assert!(
            brake_actuator.volume_to_actuator_accumulator >= Volume::new::<gallon>(0.04 - 0.0001)
        );
        assert!(
            brake_actuator.volume_to_actuator_accumulator <= Volume::new::<gallon>(0.04 + 0.0001)
        );
        assert!(brake_actuator.volume_to_res_accumulator <= Volume::new::<gallon>(0.0001));

        brake_actuator.reset_volumes();

        brake_actuator.set_position_demand(-2.);
        for _ in 0..15 {
            brake_actuator.update(
                &context(&mut init_context, Duration::from_secs_f64(0.1)),
                Pressure::new::<psi>(3000.),
            );
        }

        assert!(brake_actuator.current_position <= 0.01);
        assert!(brake_actuator.current_position >= 0.);

        assert!(brake_actuator.volume_to_res_accumulator >= Volume::new::<gallon>(0.04 - 0.0001));
        assert!(brake_actuator.volume_to_res_accumulator <= Volume::new::<gallon>(0.04 + 0.0001));
        assert!(brake_actuator.volume_to_actuator_accumulator <= Volume::new::<gallon>(0.0001));

        // Now same brake increase but with ultra low pressure
        brake_actuator.reset_volumes();
        brake_actuator.set_position_demand(1.2);

        for _ in 0..15 {
            brake_actuator.update(
                &context(&mut init_context, Duration::from_secs_f64(0.1)),
                Pressure::new::<psi>(20.),
            );
        }

        // We should not be able to move actuator
        assert!(brake_actuator.current_position <= 0.1);
        assert!(brake_actuator.volume_to_actuator_accumulator >= Volume::new::<gallon>(-0.0001));
        assert!(brake_actuator.volume_to_actuator_accumulator <= Volume::new::<gallon>(0.0001));
        assert!(brake_actuator.volume_to_res_accumulator <= Volume::new::<gallon>(0.0001));
    }

    #[test]
    fn brake_actuator_movement_medium_pressure() {
        let mut electricity = Electricity::new();
        let mut registry: TestVariableRegistry = Default::default();
        let mut init_context = InitContext::new(&mut electricity, &mut registry);

        let mut brake_actuator = BrakeActuator::new(Volume::new::<gallon>(0.04));

        brake_actuator.set_position_demand(1.2);

        let medium_pressure = Pressure::new::<psi>(1500.);
        // Update position with 1500psi only: should not reach max displacement.
        for loop_idx in 0..15 {
            brake_actuator.update(
                &context(&mut init_context, Duration::from_secs_f64(0.1)),
                medium_pressure,
            );
            println!(
                "Loop {}, position: {}",
                loop_idx, brake_actuator.current_position
            );
        }

        assert!(
            brake_actuator.current_position
                <= brake_actuator.get_max_position_reachable(medium_pressure)
        );

        // Now same max demand but pressure so low so actuator should get back to 0
        brake_actuator.reset_volumes();
        brake_actuator.set_position_demand(1.2);

        for _loop_idx in 0..15 {
            brake_actuator.update(
                &context(&mut init_context, Duration::from_secs_f64(0.1)),
                Pressure::new::<psi>(20.),
            );
            println!(
                "Loop {}, Low pressure: position: {}",
                _loop_idx, brake_actuator.current_position
            );
        }

        // We should have actuator back to 0
        assert!(brake_actuator.current_position <= 0.1);
    }

    #[test]
    fn unprimed_brake_circuit_state_at_init() {
        let init_max_vol = Volume::new::<gallon>(1.5);
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            BrakeCircuit::new(
                context,
                "altn",
                init_max_vol,
                Volume::new::<gallon>(0.0),
                Volume::new::<gallon>(0.1),
            )
        }));

        assert!(test_bed.query_element(
            |e| e.left_brake_pressure() + e.right_brake_pressure() < Pressure::new::<psi>(10.0)
        ));

        assert!(test_bed.query_element(|e| e.accumulator.total_volume == init_max_vol));
        assert!(
            test_bed.query_element(|e| e.accumulator.fluid_volume() == Volume::new::<gallon>(0.0))
        );
        assert!(test_bed.query_element(|e| e.accumulator.gas_volume == init_max_vol));
    }

    #[test]
    fn primed_brake_circuit_state_at_init() {
        let init_max_vol = Volume::new::<gallon>(1.5);
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            BrakeCircuit::new(
                context,
                "altn",
                init_max_vol,
                init_max_vol / 2.0,
                Volume::new::<gallon>(0.1),
            )
        }));

        assert!(test_bed.query_element(
            |e| e.left_brake_pressure() + e.right_brake_pressure() < Pressure::new::<psi>(10.0)
        ));
        assert!(test_bed.query_element(|e| e.accumulator.total_volume == init_max_vol));
        assert!(test_bed.query_element(|e| e.accumulator.fluid_volume() == init_max_vol / 2.0));
        assert!(test_bed.query_element(|e| e.accumulator.gas_volume < init_max_vol));
    }

    #[test]
    fn primed_circuit_brake_pressure_rise() {
        let mut electricity = Electricity::new();
        let mut registry: TestVariableRegistry = Default::default();
        let mut init_context = InitContext::new(&mut electricity, &mut registry);

        let init_max_vol = Volume::new::<gallon>(1.5);
        let hyd_circuit = TestHydraulicSection::new(Pressure::new::<psi>(2500.0));

        let mut brake_circuit = BrakeCircuit::new(
            &mut init_context,
            "Altn",
            init_max_vol,
            init_max_vol / 2.0,
            Volume::new::<gallon>(0.1),
        );

        assert!(
            brake_circuit.left_brake_pressure() + brake_circuit.right_brake_pressure()
                < Pressure::new::<psi>(10.0)
        );

        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(0.1)),
            &hyd_circuit,
        );

        assert!(
            brake_circuit.left_brake_pressure() + brake_circuit.right_brake_pressure()
                < Pressure::new::<psi>(10.0)
        );

        brake_circuit.set_brake_demand_left(Ratio::new::<ratio>(1.0));
        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(1.)),
            &hyd_circuit,
        );

        assert!(brake_circuit.left_brake_pressure() >= Pressure::new::<psi>(1000.));
        assert!(brake_circuit.right_brake_pressure() <= Pressure::new::<psi>(50.));
        assert!(brake_circuit.accumulator.fluid_volume() >= Volume::new::<gallon>(0.1));

        brake_circuit.set_brake_demand_left(Ratio::new::<ratio>(0.0));
        brake_circuit.set_brake_demand_right(Ratio::new::<ratio>(1.0));
        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(1.)),
            &hyd_circuit,
        );
        assert!(brake_circuit.right_brake_pressure() >= Pressure::new::<psi>(1000.));
        assert!(brake_circuit.left_brake_pressure() <= Pressure::new::<psi>(50.));
        assert!(brake_circuit.accumulator.fluid_volume() >= Volume::new::<gallon>(0.1));
    }

    #[test]
    fn primed_circuit_brake_pressure_rise_no_accumulator() {
        let mut electricity = Electricity::new();
        let mut registry: TestVariableRegistry = Default::default();
        let mut init_context = InitContext::new(&mut electricity, &mut registry);

        let init_max_vol = Volume::new::<gallon>(0.0);
        let hyd_circuit = TestHydraulicSection::new(Pressure::new::<psi>(2500.0));

        let mut brake_circuit = BrakeCircuit::new(
            &mut init_context,
            "norm",
            init_max_vol,
            init_max_vol / 2.0,
            Volume::new::<gallon>(0.1),
        );

        assert!(
            brake_circuit.left_brake_pressure() + brake_circuit.right_brake_pressure()
                < Pressure::new::<psi>(10.0)
        );

        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(0.1)),
            &hyd_circuit,
        );

        assert!(
            brake_circuit.left_brake_pressure() + brake_circuit.right_brake_pressure()
                < Pressure::new::<psi>(10.0)
        );

        brake_circuit.set_brake_demand_left(Ratio::new::<ratio>(1.0));
        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(1.5)),
            &hyd_circuit,
        );

        assert!(brake_circuit.left_brake_pressure() >= Pressure::new::<psi>(2500.));
        assert!(brake_circuit.right_brake_pressure() <= Pressure::new::<psi>(50.));

        brake_circuit.set_brake_demand_left(Ratio::new::<ratio>(0.0));
        brake_circuit.set_brake_demand_right(Ratio::new::<ratio>(1.0));
        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(1.5)),
            &hyd_circuit,
        );
        assert!(brake_circuit.right_brake_pressure() >= Pressure::new::<psi>(2500.));
        assert!(brake_circuit.left_brake_pressure() <= Pressure::new::<psi>(50.));
        assert!(brake_circuit.accumulator.fluid_volume() == Volume::new::<gallon>(0.0));
    }

    #[test]
    fn brake_pressure_limitation() {
        let mut electricity = Electricity::new();
        let mut registry: TestVariableRegistry = Default::default();
        let mut init_context = InitContext::new(&mut electricity, &mut registry);

        let init_max_vol = Volume::new::<gallon>(0.0);
        let hyd_circuit = TestHydraulicSection::new(Pressure::new::<psi>(3100.0));

        let mut brake_circuit = BrakeCircuit::new(
            &mut init_context,
            "norm",
            init_max_vol,
            init_max_vol / 2.0,
            Volume::new::<gallon>(0.1),
        );

        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(5.)),
            &hyd_circuit,
        );

        assert!(
            brake_circuit.left_brake_pressure() + brake_circuit.right_brake_pressure()
                < Pressure::new::<psi>(1.0)
        );

        brake_circuit.set_brake_demand_left(Ratio::new::<ratio>(1.0));
        brake_circuit.set_brake_demand_right(Ratio::new::<ratio>(1.0));
        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(1.5)),
            &hyd_circuit,
        );

        assert!(brake_circuit.left_brake_pressure() >= Pressure::new::<psi>(2900.));
        assert!(brake_circuit.right_brake_pressure() >= Pressure::new::<psi>(2900.));

        let pressure_limit = Pressure::new::<psi>(1200.);
        brake_circuit.set_brake_press_limit(pressure_limit);
        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(0.1)),
            &hyd_circuit,
        );

        // Now we limit to 1200 but pressure shouldn't drop instantly
        assert!(brake_circuit.left_brake_pressure() >= Pressure::new::<psi>(2500.));
        assert!(brake_circuit.right_brake_pressure() >= Pressure::new::<psi>(2500.));

        brake_circuit.update(
            &context(&mut init_context, Duration::from_secs_f64(1.)),
            &hyd_circuit,
        );

        // After one second it should have reached the lower limit
        assert!(brake_circuit.left_brake_pressure() <= pressure_limit);
        assert!(brake_circuit.right_brake_pressure() <= pressure_limit);
    }

    fn context(context: &mut InitContext, delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
            context,
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
            MachNumber(0.),
        )
    }
}
