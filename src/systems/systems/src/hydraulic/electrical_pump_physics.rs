use uom::si::{
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{radian_per_second, revolution_per_minute},
    electric_current::ampere,
    electric_potential::volt,
    f64::*,
    power::watt,
    pressure::psi,
    torque::{newton_meter, pound_force_inch},
    volume::cubic_inch,
};

use crate::shared::{pid::PidController, ConsumePower, ElectricalBusType, ElectricalBuses};
use crate::simulation::{SimulationElement, SimulatorWriter, UpdateContext, Write};

pub struct ElectricalPumpPhysics {
    active_id: String,
    rpm_id: String,
    powered_by: ElectricalBusType,
    is_powered: bool,
    available_potential: ElectricPotential,
    consumed_power: Power,

    acceleration: AngularAcceleration,
    speed: AngularVelocity,
    inertia: f64,
    is_active: bool,

    output_current: ElectricCurrent,

    generated_torque: Torque,
    resistant_torque: Torque,

    current_controller: PidController,
}
impl ElectricalPumpPhysics {
    const DEFAULT_INERTIA: f64 = 0.007;
    const DEFAULT_DYNAMIC_FRICTION_CONSTANT: f64 = 0.00004;
    const DEFAULT_RESISTANT_TORQUE_WHEN_OFF_NEWTON_METER: f64 = 2.8;

    // Efficiency gives generated mechanical torque ratio vs electrical power used.
    // 0.95 will convert 95% of electrical consumption in mechanical torque
    const ELECTRICAL_EFFICIENCY: f64 = 0.95;

    const DEFAULT_P_GAIN: f64 = 0.05;
    const DEFAULT_I_GAIN: f64 = 0.5;

    pub fn new(
        id: &str,
        bus_type: ElectricalBusType,
        max_current: ElectricCurrent,
        regulated_speed: AngularVelocity,
    ) -> Self {
        Self {
            active_id: format!("HYD_{}_EPUMP_ACTIVE", id),
            rpm_id: format!("HYD_{}_EPUMP_RPM", id),
            powered_by: bus_type,
            is_powered: false,
            available_potential: ElectricPotential::new::<volt>(0.),
            consumed_power: Power::new::<watt>(0.),

            acceleration: AngularAcceleration::new::<radian_per_second_squared>(0.),
            speed: AngularVelocity::new::<radian_per_second>(0.),
            inertia: Self::DEFAULT_INERTIA,
            is_active: false,
            output_current: ElectricCurrent::new::<ampere>(0.),
            generated_torque: Torque::new::<newton_meter>(0.),
            resistant_torque: Torque::new::<newton_meter>(0.),
            current_controller: PidController::new(
                Self::DEFAULT_P_GAIN,
                Self::DEFAULT_I_GAIN,
                0.,
                0.,
                max_current.get::<ampere>(),
                regulated_speed.get::<revolution_per_minute>(),
            ),
        }
    }

    pub fn update(
        &mut self,
        current_pressure: Pressure,
        current_displacement: Volume,
        context: &UpdateContext,
    ) {
        self.update_pump_resistant_torque(current_pressure, current_displacement);
        self.update_pump_generated_torque(context);
        self.update_pump_speed(context);
    }

    fn update_pump_speed(&mut self, context: &UpdateContext) {
        let final_torque = self.generated_torque - self.resistant_torque;

        self.acceleration = AngularAcceleration::new::<radian_per_second_squared>(
            final_torque.get::<newton_meter>() / self.inertia,
        );
        self.speed += AngularVelocity::new::<radian_per_second>(
            self.acceleration.get::<radian_per_second_squared>() * context.delta_as_secs_f64(),
        );
        self.speed = self
            .speed
            .max(AngularVelocity::new::<radian_per_second>(0.));
    }

    fn update_pump_resistant_torque(
        &mut self,
        current_pressure: Pressure,
        current_displacement: Volume,
    ) {
        let dynamic_friction_torque = Torque::new::<newton_meter>(
            Self::DEFAULT_DYNAMIC_FRICTION_CONSTANT * self.speed.get::<revolution_per_minute>(),
        );

        let pumping_torque = if self.is_active && self.is_powered {
            Torque::new::<pound_force_inch>(
                current_pressure.get::<psi>() * current_displacement.get::<cubic_inch>()
                    / (2. * std::f64::consts::PI),
            )
        } else {
            Torque::new::<newton_meter>(Self::DEFAULT_RESISTANT_TORQUE_WHEN_OFF_NEWTON_METER)
        };

        self.resistant_torque = pumping_torque + dynamic_friction_torque;
    }

    fn update_current_control(&mut self, context: &UpdateContext) {
        self.output_current = if self.pump_should_run() {
            ElectricCurrent::new::<ampere>(self.current_controller.next_control_output(
                self.speed.get::<revolution_per_minute>(),
                Some(context.delta()),
            ))
        } else {
            self.current_controller.reset();
            ElectricCurrent::new::<ampere>(0.)
        }
    }

    fn update_electrical_power_consumption(&mut self) {
        self.consumed_power = if self.pump_should_run() {
            Power::new::<watt>(
                self.available_potential.get::<volt>()
                    * self.output_current.get::<ampere>()
                    * (3_f64).sqrt(),
            )
        } else {
            Power::new::<watt>(0.)
        };
    }

    fn update_pump_generated_torque(&mut self, context: &UpdateContext) {
        self.update_current_control(context);

        self.update_electrical_power_consumption();

        if self.pump_should_run() {
            if self.speed.get::<revolution_per_minute>() < 5.
                && self.output_current.get::<ampere>() > 0.
            {
                self.generated_torque =
                    Torque::new::<newton_meter>(0.5 * self.output_current.get::<ampere>());
            } else {
                self.generated_torque = Torque::new::<newton_meter>(
                    Self::ELECTRICAL_EFFICIENCY * self.consumed_power.get::<watt>()
                        / self.speed.get::<radian_per_second>(),
                );
            }
        } else {
            self.generated_torque = Torque::new::<newton_meter>(0.);
        }
    }

    fn pump_should_run(&self) -> bool {
        self.is_active && self.is_powered
    }

    pub fn set_active(&mut self, is_active: bool) {
        self.is_active = is_active;
    }

    pub fn speed(&self) -> AngularVelocity {
        self.speed
    }
}
impl SimulationElement for ElectricalPumpPhysics {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.active_id, self.is_active);
        writer.write(&self.rpm_id, self.speed().get::<revolution_per_minute>());
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
        self.available_potential = buses.potential_of(self.powered_by).raw();
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        consumption.consume_from_bus(self.powered_by, self.consumed_power);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

    use crate::hydraulic::update_iterator::FixedStepLoop;
    use crate::shared::PotentialOrigin;
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext};

    use crate::simulation::test::{SimulationTestBed, TestBed};
    use std::time::Duration;
    use uom::si::{pressure::psi, volume::gallon};

    struct TestAircraft {
        core_hydraulic_updater: FixedStepLoop,

        pump: ElectricalPumpPhysics,
        current_pressure: Pressure,
        current_displacement: Volume,

        powered_source_ac: TestElectricitySource,
        ac_1_bus: ElectricalBus,
        is_ac_1_powered: bool,
    }
    impl TestAircraft {
        fn new(electricity: &mut Electricity) -> Self {
            Self {
                core_hydraulic_updater: FixedStepLoop::new(Duration::from_millis(50)),
                pump: physical_pump(),
                current_pressure: Pressure::new::<psi>(0.),
                current_displacement: Volume::new::<gallon>(0.),
                powered_source_ac: TestElectricitySource::powered(
                    PotentialOrigin::EngineGenerator(1),
                    electricity,
                ),
                ac_1_bus: ElectricalBus::new(ElectricalBusType::AlternatingCurrent(1), electricity),
                is_ac_1_powered: false,
            }
        }

        fn set_current_pressure(&mut self, current_pressure: Pressure) {
            self.current_pressure = current_pressure;
        }

        fn set_current_displacement(&mut self, current_displacement: Volume) {
            self.current_displacement = current_displacement;
        }

        fn set_ac_1_power(&mut self, is_powered: bool) {
            self.is_ac_1_powered = is_powered;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
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
            self.core_hydraulic_updater.update(context);

            for cur_time_step in &mut self.core_hydraulic_updater {
                self.pump.update(
                    self.current_pressure,
                    self.current_displacement,
                    &context.with_delta(cur_time_step),
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.pump.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn pump_inactive_at_init() {
        let test_bed = SimulationTestBed::new(|electricity| TestAircraft::new(electricity));

        assert_eq!(
            test_bed.query(|a| a.pump.speed()),
            AngularVelocity::new::<revolution_per_minute>(0.)
        );

        assert!(!test_bed.query(|a| a.pump.is_active));
    }

    #[test]
    fn pump_spools_up_less_than_half_second_at_half_displacement() {
        let mut test_bed = SimulationTestBed::new(|electricity| TestAircraft::new(electricity));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.command(|a| a.pump.set_active(true));
        test_bed.command(|a| a.set_current_displacement(Volume::new::<cubic_inch>(0.131)));
        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        assert!(
            test_bed.query(|a| a.pump.speed())
                >= AngularVelocity::new::<revolution_per_minute>(7300.)
        );
    }

    #[test]
    fn pump_regulates_on_displacement_gradient() {
        let mut test_bed = SimulationTestBed::new(|electricity| TestAircraft::new(electricity));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.command(|a| a.pump.set_active(true));
        test_bed.command(|a| a.set_current_displacement(Volume::new::<cubic_inch>(0.263 / 4.)));
        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.pump.speed())
                >= AngularVelocity::new::<revolution_per_minute>(7500.)
        );

        // Instant demand at full displacement
        test_bed.command(|a| a.set_current_displacement(Volume::new::<cubic_inch>(0.263)));

        test_bed.run_with_delta(Duration::from_secs_f64(0.5));
        assert!(
            test_bed.query(|a| a.pump.speed())
                < AngularVelocity::new::<revolution_per_minute>(7000.)
        );

        // Back to 1/4 displacement
        test_bed.command(|a| a.set_current_displacement(Volume::new::<cubic_inch>(0.263 / 4.)));

        test_bed.run_with_delta(Duration::from_secs_f64(0.5));
        assert!(
            test_bed.query(|a| a.pump.speed())
                >= AngularVelocity::new::<revolution_per_minute>(7500.)
        );

        // Checking we don't overshoot the 7600rpm target by more than 100rpm
        assert!(
            test_bed.query(|a| a.pump.speed())
                < AngularVelocity::new::<revolution_per_minute>(7700.)
        );
    }

    #[test]
    fn pump_spools_down_less_than_two_second_when_unpowered_with_no_displacement() {
        let mut test_bed = SimulationTestBed::new(|electricity| TestAircraft::new(electricity));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.command(|a| a.pump.set_active(true));
        test_bed.command(|a| a.set_current_displacement(Volume::new::<cubic_inch>(0.)));
        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.pump.speed())
                >= AngularVelocity::new::<revolution_per_minute>(7550.)
        );

        test_bed.command(|a| a.set_ac_1_power(false));
        test_bed.run_with_delta(Duration::from_secs_f64(2.));

        assert!(
            test_bed.query(|a| a.pump.speed()) < AngularVelocity::new::<revolution_per_minute>(10.)
        );
    }

    fn physical_pump() -> ElectricalPumpPhysics {
        ElectricalPumpPhysics::new(
            "YELLOW",
            ElectricalBusType::AlternatingCurrent(1),
            ElectricCurrent::new::<ampere>(45.),
            AngularVelocity::new::<revolution_per_minute>(7600.),
        )
    }
}
