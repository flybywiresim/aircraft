use uom::si::{
    angular_velocity::{radian_per_second, revolution_per_minute},
    electric_current::ampere,
    electric_potential::volt,
    f64::*,
    power::watt,
    pressure::{pascal, psi},
    ratio::ratio,
    volume::{cubic_inch, cubic_meter, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

use crate::shared::{
    low_pass_filter::LowPassFilter, pid::PidController, ConsumePower, ElectricalBusType,
    ElectricalBuses,
};

use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use crate::hydraulic::{Accumulator, Actuator, Fluid};

struct VariableSpeedPump {
    speed: LowPassFilter<AngularVelocity>,

    is_powered: bool,
    powered_by: ElectricalBusType,

    consumed_power: Power,

    circuit_pressure: Pressure,
}
impl VariableSpeedPump {
    const FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM: f64 = 231.;
    const DISPLACEMENT_CU_IN: f64 = 0.214;
    const NOMINAL_MAX_PRESSURE_PSI: f64 = 5000.;

    const LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT: Duration = Duration::from_millis(100);

    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT,
            ),
            is_powered: false,
            powered_by,
            consumed_power: Power::default(),

            circuit_pressure: Pressure::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        actuator_flow: VolumeRate,
        actuator_pressure: Pressure,
    ) {
        self.circuit_pressure = actuator_pressure;

        let new_speed = if self.is_powered {
            AngularVelocity::new::<revolution_per_minute>(
                actuator_flow.get::<gallon_per_minute>()
                    * Self::FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM
                    / Self::DISPLACEMENT_CU_IN,
            )
        } else {
            AngularVelocity::default()
        };

        self.speed.update(context.delta(), new_speed);
    }

    fn speed(&self) -> AngularVelocity {
        self.speed.output()
    }

    fn max_available_pressure(&self, accumulator: &LowPressureAccumulator) -> Pressure {
        if self.is_powered && accumulator.pressure().get::<psi>() > 100. {
            Pressure::new::<psi>(Self::NOMINAL_MAX_PRESSURE_PSI)
        } else {
            Pressure::default()
        }
    }
}
impl SimulationElement for VariableSpeedPump {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        consumption.consume_from_bus(self.powered_by, self.consumed_power);
    }
}

struct LowPressureAccumulator {
    pressure: LowPassFilter<Pressure>,
}
impl LowPressureAccumulator {
    // TODO randomize
    const INIT_ACCUMULATOR_PRESSURE_PSI: f64 = 800.;

    const MAX_ACCUMULATOR_PRESSURE_PSI: f64 = 1300.;

    const PRESSURE_TIME_CONSTANT: Duration = Duration::from_millis(1000);
    fn new() -> Self {
        Self {
            pressure: LowPassFilter::<Pressure>::new_with_init_value(
                Self::PRESSURE_TIME_CONSTANT,
                Pressure::new::<psi>(Self::INIT_ACCUMULATOR_PRESSURE_PSI),
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        input_pressure: Pressure,
        should_open_external_filling: bool,
    ) {
        let mut new_pressure =
            if input_pressure > self.pressure.output() && should_open_external_filling {
                Pressure::new::<psi>(1800.)
            } else {
                self.pressure.output()
            };

        new_pressure = new_pressure
            .min(Pressure::new::<psi>(Self::MAX_ACCUMULATOR_PRESSURE_PSI))
            .max(Pressure::new::<psi>(0.));

        self.pressure.update(context.delta(), new_pressure);
    }

    fn pressure(&self) -> Pressure {
        self.pressure.output()
    }
}

use crate::hydraulic::aerodynamic_model::AerodynamicBody;
use crate::hydraulic::linear_actuator::{
    get_more_restrictive_soft_lock_velocities, BoundedLinearLength, HydraulicAssemblyController,
    HydraulicLocking, LinearActuatedRigidBodyOnHingeAxis, LinearActuator, LinearActuatorMode,
};

use std::time::Duration;

pub enum ElectroHydrostaticActuatorType {
    EHA,
    EBHA,
}

pub struct LinearActuatorElectroHydrostatic {
    accumulator: LowPressureAccumulator,
    pump: VariableSpeedPump,
    actuator: LinearActuator,

    mode: ElectroHydrostaticActuatorType,
}
impl LinearActuatorElectroHydrostatic {
    pub fn new(
        powered_by: ElectricalBusType,
        actuator: LinearActuator,
        mode: ElectroHydrostaticActuatorType,
    ) -> Self {
        Self {
            accumulator: LowPressureAccumulator::new(),
            pump: VariableSpeedPump::new(powered_by),
            actuator,
            mode,
        }
    }

    // TODO next two fn might be some Trait to declare
    fn update_before_rigid_body(
        &mut self,
        context: &UpdateContext,
        connected_body: &mut LinearActuatedRigidBodyOnHingeAxis,
        requested_mode: LinearActuatorMode,
        current_pressure: Pressure,
    ) {
        self.accumulator.update(context, current_pressure, false);
        self.pump.update(
            context,
            self.actuator.signed_flow(),
            self.actuator.pressure(),
        );

        self.actuator.update_before_rigid_body(
            context,
            connected_body,
            requested_mode,
            self.pump.max_available_pressure(&self.accumulator),
        );

        println!(
            "Actuator pos {:.2} Actuator Flow {:.3} Pump speed {:.5} Pump max press {:.0}",
            self.actuator.position_normalized().get::<ratio>(),
            self.actuator.signed_flow().get::<gallon_per_second>(),
            self.pump.speed().get::<revolution_per_minute>(),
            self.pump
                .max_available_pressure(&self.accumulator)
                .get::<psi>()
        );
    }

    fn update_after_rigid_body(
        &mut self,
        context: &UpdateContext,
        connected_body: &LinearActuatedRigidBodyOnHingeAxis,
    ) {
        self.actuator
            .update_after_rigid_body(context, connected_body);
    }

    fn set_position_target(&mut self, target_position: Ratio) {
        self.actuator.set_position_target(target_position);
    }

    fn position_normalized(&self) -> Ratio {
        self.actuator.position_normalized()
    }
}
impl Actuator for LinearActuatorElectroHydrostatic {
    fn used_volume(&self) -> Volume {
        self.actuator.used_volume()
    }

    fn reservoir_return(&self) -> Volume {
        self.actuator.reservoir_return()
    }

    fn reset_volumes(&mut self) {
        self.actuator.reset_volumes()
    }
}
impl HydraulicLocking for LinearActuatorElectroHydrostatic {
    fn should_soft_lock(&self) -> bool {
        self.actuator.should_soft_lock()
    }

    fn soft_lock_velocity(&self) -> (AngularVelocity, AngularVelocity) {
        self.actuator.soft_lock_velocity()
    }
}
impl SimulationElement for LinearActuatorElectroHydrostatic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.pump.accept(visitor);

        visitor.visit(self);
    }
}

pub struct HydraulicLinearElectroHydrostaticActuatorAssembly<const N: usize> {
    linear_actuators: [LinearActuatorElectroHydrostatic; N],
    rigid_body: LinearActuatedRigidBodyOnHingeAxis,
}
impl<const N: usize> HydraulicLinearElectroHydrostaticActuatorAssembly<N> {
    pub fn new(
        linear_actuators: [LinearActuatorElectroHydrostatic; N],
        rigid_body: LinearActuatedRigidBodyOnHingeAxis,
    ) -> Self {
        Self {
            linear_actuators,
            rigid_body,
        }
    }

    pub fn actuator(&mut self, index: usize) -> &mut impl Actuator {
        assert!(index < N);
        &mut self.linear_actuators[index]
    }

    pub fn body(&mut self) -> &mut impl AerodynamicBody {
        &mut self.rigid_body
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        assembly_controllers: &[impl HydraulicAssemblyController + HydraulicLocking],
        current_pressure: [Pressure; N],
    ) {
        for (index, actuator) in self.linear_actuators.iter_mut().enumerate() {
            actuator.set_position_target(
                self.rigid_body
                    .linear_actuator_pos_normalized_from_angular_position_normalized(
                        assembly_controllers[index].requested_position(),
                    ),
            );
        }

        self.update_hard_lock_mechanism(assembly_controllers);

        if !self.rigid_body.is_locked() {
            self.update_soft_lock_mechanism(assembly_controllers);

            for (index, actuator) in self.linear_actuators.iter_mut().enumerate() {
                actuator.update_before_rigid_body(
                    context,
                    &mut self.rigid_body,
                    assembly_controllers[index].requested_mode(),
                    current_pressure[index],
                );
            }

            self.rigid_body.update(context);

            for actuator in &mut self.linear_actuators {
                actuator.update_after_rigid_body(context, &self.rigid_body);
            }
        } else {
            self.rigid_body.update(context);
        }
    }

    fn update_hard_lock_mechanism(
        &mut self,
        assembly_controllers: &[impl HydraulicAssemblyController],
    ) {
        // The first controller requesting a lock locks the body
        let mut no_lock = true;
        for controller in assembly_controllers {
            if controller.should_lock() {
                self.rigid_body
                    .lock_at_position_normalized(controller.requested_lock_position());

                no_lock = false;

                break;
            }
        }

        if no_lock {
            self.rigid_body.unlock();
        }
    }

    fn update_soft_lock_mechanism(&mut self, assembly_controllers: &[impl HydraulicLocking]) {
        let mut no_lock = true;

        let mut min_velocity = AngularVelocity::new::<radian_per_second>(-10000.);
        let mut max_velocity = AngularVelocity::new::<radian_per_second>(10000.);

        // Min velocity will be the max one amongst all the limit velocities requested
        // Max velocity will be the min one amongst all the limit velocities requested
        // This way we use the more restrictive speed limitation over all the controller demands
        for (idx, controller) in assembly_controllers.iter().enumerate() {
            if controller.should_soft_lock() || self.linear_actuators[idx].should_soft_lock() {
                // If actuator itself already is locking we take the more restrictive locking speeds, else we only use external locking speeds
                let (new_min, new_max) = if controller.should_soft_lock()
                    && self.linear_actuators[idx].should_soft_lock()
                {
                    get_more_restrictive_soft_lock_velocities(
                        controller,
                        &self.linear_actuators[idx],
                    )
                } else if controller.should_soft_lock() {
                    controller.soft_lock_velocity()
                } else {
                    self.linear_actuators[idx].soft_lock_velocity()
                };

                max_velocity = max_velocity.min(new_max);
                min_velocity = min_velocity.max(new_min);

                no_lock = false;
            }
        }

        if no_lock {
            self.rigid_body.soft_unlock();
        } else {
            self.rigid_body.soft_lock(min_velocity, max_velocity)
        }
    }

    pub fn is_locked(&self) -> bool {
        self.rigid_body.is_locked()
    }

    pub fn position_normalized(&self) -> Ratio {
        self.rigid_body.position_normalized()
    }

    pub fn actuator_position_normalized(&self, index: usize) -> Ratio {
        self.linear_actuators[index].position_normalized()
    }
}
impl SimulationElement for HydraulicLinearElectroHydrostaticActuatorAssembly<1> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.linear_actuators[0].accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

    use crate::shared::{update_iterator::MaxStepLoop, PotentialOrigin};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext};

    use crate::simulation::test::{SimulationTestBed, TestBed};
    use std::time::Duration;
    use uom::si::{
        angle::degree, force::newton, length::meter, mass::kilogram, pressure::psi, ratio::ratio,
        volume::gallon,
    };

    use nalgebra::Vector3;

    #[derive(PartialEq, Clone, Copy)]
    struct TestHydraulicAssemblyController {
        mode: LinearActuatorMode,
        requested_position: Ratio,
        lock_request: bool,
        lock_position: Ratio,

        soft_lock_request: bool,
        soft_lock_velocity: (AngularVelocity, AngularVelocity),
    }
    impl TestHydraulicAssemblyController {
        fn new() -> Self {
            Self {
                mode: LinearActuatorMode::ClosedValves,

                requested_position: Ratio::new::<ratio>(0.),
                lock_request: false,
                lock_position: Ratio::new::<ratio>(0.),
                soft_lock_request: false,
                soft_lock_velocity: (AngularVelocity::default(), AngularVelocity::default()),
            }
        }

        fn set_mode(&mut self, mode: LinearActuatorMode) {
            self.mode = mode;
        }

        fn set_lock(&mut self, lock_position: Ratio) {
            self.lock_request = true;
            self.lock_position = lock_position;
        }

        fn set_unlock(&mut self) {
            self.lock_request = false;
        }

        fn set_position_target(&mut self, requested_position: Ratio) {
            self.requested_position = requested_position;
        }

        fn set_soft_lock(&mut self, lock_velocity: (AngularVelocity, AngularVelocity)) {
            self.soft_lock_request = true;
            self.soft_lock_velocity = lock_velocity;
        }
    }
    impl HydraulicAssemblyController for TestHydraulicAssemblyController {
        fn requested_mode(&self) -> LinearActuatorMode {
            self.mode
        }

        fn requested_position(&self) -> Ratio {
            self.requested_position
        }

        fn should_lock(&self) -> bool {
            self.lock_request
        }

        fn requested_lock_position(&self) -> Ratio {
            self.lock_position
        }
    }
    impl HydraulicLocking for TestHydraulicAssemblyController {
        fn should_soft_lock(&self) -> bool {
            self.soft_lock_request
        }

        fn soft_lock_velocity(&self) -> (AngularVelocity, AngularVelocity) {
            self.soft_lock_velocity
        }
    }

    struct TestAircraft<const N: usize> {
        loop_updater: MaxStepLoop,

        hydraulic_assembly: HydraulicLinearElectroHydrostaticActuatorAssembly<N>,

        controllers: [TestHydraulicAssemblyController; N],

        pressures: [Pressure; N],

        powered_source_ac: TestElectricitySource,
        ac_1_bus: ElectricalBus,
        is_ac_1_powered: bool,
    }
    impl<const N: usize> TestAircraft<N> {
        fn new(
            context: &mut InitContext,
            time_step: Duration,
            hydraulic_assembly: HydraulicLinearElectroHydrostaticActuatorAssembly<N>,
        ) -> Self {
            Self {
                loop_updater: MaxStepLoop::new(time_step),

                hydraulic_assembly,

                controllers: [TestHydraulicAssemblyController::new(); N],

                pressures: [Pressure::new::<psi>(0.); N],

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                is_ac_1_powered: false,
            }
        }

        fn set_pressures(&mut self, pressures: [Pressure; N]) {
            self.pressures = pressures;
        }

        fn command_active_damping_mode(&mut self, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_mode(LinearActuatorMode::ActiveDamping);
        }

        fn command_closed_circuit_damping_mode(&mut self, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_mode(LinearActuatorMode::ClosedCircuitDamping);
        }

        fn command_closed_valve_mode(&mut self, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_mode(LinearActuatorMode::ClosedValves);
        }

        fn command_position_control(&mut self, position: Ratio, actuator_id: usize) {
            assert!(actuator_id < N);
            self.controllers[actuator_id].set_mode(LinearActuatorMode::PositionControl);
            self.controllers[actuator_id].set_position_target(position);
        }

        fn command_lock(&mut self, lock_position: Ratio) {
            for controller in &mut self.controllers {
                controller.set_lock(lock_position);
            }
        }

        fn command_soft_lock(&mut self, lock_velocity: (AngularVelocity, AngularVelocity)) {
            for controller in &mut self.controllers {
                controller.set_soft_lock(lock_velocity);
            }
        }

        fn command_unlock(&mut self) {
            for controller in &mut self.controllers {
                controller.set_unlock();
            }
        }

        fn body_position(&self) -> Ratio {
            self.hydraulic_assembly.position_normalized()
        }

        fn is_locked(&self) -> bool {
            self.hydraulic_assembly.is_locked()
        }

        fn update_actuator_physics(&mut self, context: &UpdateContext) {
            self.hydraulic_assembly
                .update(context, &self.controllers[..], self.pressures);

            // println!(
            //     "Body Npos {:.3}",
            //     self.hydraulic_assembly.position_normalized().get::<ratio>()
            // );
        }

        fn set_ac_1_power(&mut self, is_powered: bool) {
            self.is_ac_1_powered = is_powered;
        }
    }
    impl Aircraft for TestAircraft<1> {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(115.));
            electricity.supplied_by(&self.powered_source_ac);

            if self.is_ac_1_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.loop_updater.update(context);

            for cur_time_step in self.loop_updater {
                self.update_actuator_physics(&context.with_delta(cur_time_step));
            }
        }
    }
    impl SimulationElement for TestAircraft<1> {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.hydraulic_assembly.accept(visitor);

            visitor.visit(self);
        }
    }

    impl Aircraft for TestAircraft<2> {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.loop_updater.update(context);

            for cur_time_step in self.loop_updater {
                self.update_actuator_physics(&context.with_delta(cur_time_step));
            }
        }
    }
    impl SimulationElement for TestAircraft<2> {}

    fn elevator_body() -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(6., 0.405, 1.125);
        let cg_offset = Vector3::new(0., 0., -0.5 * size[2]);
        let aero_center_offset = Vector3::new(0., 0., -0.3 * size[2]);

        let control_arm = Vector3::new(0., -0.091, 0.);
        let anchor = Vector3::new(0., -0.091, 0.41);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(58.6),
            size,
            cg_offset,
            aero_center_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-17.),
            Angle::new::<degree>(47.),
            Angle::new::<degree>(15.),
            100.,
            false,
            Vector3::new(1., 0., 0.),
        )
    }

    fn elevator_actuator(bounded_linear_length: &impl BoundedLinearLength) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 1.;
        const DEFAULT_FORCE_GAIN: f64 = 450000.;

        LinearActuator::new(
            bounded_linear_length,
            1,
            Length::new::<meter>(0.0407),
            Length::new::<meter>(0.),
            VolumeRate::new::<gallon_per_second>(0.029),
            80000.,
            1500.,
            20000.,
            10000000.,
            Duration::from_millis(300),
            [1., 1., 1., 1., 1., 1.],
            [1., 1., 1., 1., 1., 1.],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            false,
            false,
            None,
        )
    }

    fn elevator_eha(
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuatorElectroHydrostatic {
        LinearActuatorElectroHydrostatic::new(
            ElectricalBusType::AlternatingCurrent(1),
            elevator_actuator(bounded_linear_length),
            ElectroHydrostaticActuatorType::EHA,
        )
    }

    fn elevator_eha_assembly() -> HydraulicLinearElectroHydrostaticActuatorAssembly<1> {
        let rigid_body = elevator_body();
        let actuator = elevator_eha(&rigid_body);

        HydraulicLinearElectroHydrostaticActuatorAssembly::new([actuator], rigid_body)
    }

    #[test]
    fn electro_hydraulic_assembly_with_electrical_power_can_move_to_position() {
        let mut test_bed = SimulationTestBed::new(|context| {
            TestAircraft::new(context, Duration::from_millis(10), elevator_eha_assembly())
        });
        test_bed.command(|a| a.set_ac_1_power(true));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.2), 0));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.body_position().get::<ratio>()) >= 0.18);
        assert!(test_bed.query(|a| a.body_position().get::<ratio>()) <= 0.22);

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.8), 0));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(test_bed.query(|a| a.body_position().get::<ratio>()) >= 0.78);
        assert!(test_bed.query(|a| a.body_position().get::<ratio>()) <= 0.82);
    }

    #[test]
    fn electro_hydraulic_assembly_without_electrical_power_cannot_move_to_position() {
        let mut test_bed = SimulationTestBed::new(|context| {
            TestAircraft::new(context, Duration::from_millis(10), elevator_eha_assembly())
        });
        test_bed.command(|a| a.set_ac_1_power(false));

        test_bed.command(|a| a.command_position_control(Ratio::new::<ratio>(0.2), 0));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.body_position().get::<ratio>()) > 0.25
                || test_bed.query(|a| a.body_position().get::<ratio>()) < 0.15
        );
    }
}
