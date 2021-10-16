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
    use crate::shared::PotentialOrigin;
    use crate::simulation::UpdateContext;
    use std::time::Duration;
    use uom::si::{
        acceleration::foot_per_second_squared, angle::radian, length::foot, pressure::psi,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    #[test]
    fn pump_inactive_at_init() {
        let pump = physical_pump();

        assert!(!pump.is_active);
        assert!(pump.speed == AngularVelocity::new::<revolution_per_minute>(0.))
    }

    #[test]
    fn pump_spools_up_less_than_half_second_at_half_displacement() {
        let mut pump = physical_pump();

        let delta_time = Duration::from_secs_f64(0.05);
        let mut time = Duration::from_secs(0);

        pump.set_active(true);
        for _ in 0..100 {
            pump.receive_power(&test_electricity(
                ElectricalBusType::AlternatingCurrentGndFltService,
                true,
            ));
            pump.update(
                Pressure::new::<psi>(3000.),
                Volume::new::<cubic_inch>(0.263 / 2.),
                &context(delta_time),
            );
            time += delta_time;

            if time > Duration::from_secs_f64(0.5) {
                assert!(pump.speed.get::<revolution_per_minute>() > 7000.);
            }

            println!(
                "t= {:.1} RPM {:.0}",
                time.as_secs_f64(),
                pump.speed.get::<revolution_per_minute>()
            );
        }
    }

    #[test]
    fn pump_regulates_on_displacement_gradient() {
        let mut pump = physical_pump();

        let delta_time = Duration::from_secs_f64(0.05);
        let mut time = Duration::from_secs(0);

        let mut displacement = Volume::new::<cubic_inch>(0.263 / 4.);
        pump.set_active(true);
        for _ in 0..100 {
            pump.receive_power(&test_electricity(
                ElectricalBusType::AlternatingCurrentGndFltService,
                true,
            ));
            pump.update(
                Pressure::new::<psi>(3000.),
                displacement,
                &context(delta_time),
            );
            time += delta_time;

            if time > Duration::from_secs_f64(3.) && time < Duration::from_secs_f64(3.5) {
                displacement = Volume::new::<cubic_inch>(0.263);
            } else {
                displacement = Volume::new::<cubic_inch>(0.263 / 4.);
            }

            // .5s after displacement transient we want to be back at 7500 rpm
            if time > Duration::from_secs_f64(4.) {
                assert!(pump.speed.get::<revolution_per_minute>() > 7400.)
            }

            // Checking we don't overshoot too much
            assert!(pump.speed.get::<revolution_per_minute>() < 8500.);

            println!(
                "t= {:.1} RPM {:.0}",
                time.as_secs_f64(),
                pump.speed.get::<revolution_per_minute>()
            );
        }
    }

    #[test]
    fn pump_spools_down_less_than_two_second_when_unpowered_with_no_displacement() {
        let mut pump = physical_pump();

        let delta_time = Duration::from_secs_f64(0.05);
        let mut time = Duration::from_secs(0);

        pump.set_active(true);
        let mut pump_powered = true;
        for _ in 0..100 {
            pump.receive_power(&test_electricity(
                ElectricalBusType::AlternatingCurrentGndFltService,
                pump_powered,
            ));

            pump.update(
                Pressure::new::<psi>(3000.),
                Volume::new::<cubic_inch>(0.),
                &context(delta_time),
            );
            time += delta_time;

            if time > Duration::from_secs_f64(2.) {
                pump_powered = false;
            }

            if time > Duration::from_secs_f64(4.) {
                assert!(pump.speed.get::<revolution_per_minute>() < 1.);
            }

            println!(
                "t= {:.1} RPM {:.0} Power:{:.0} Voltage: {:.1}",
                time.as_secs_f64(),
                pump.speed.get::<revolution_per_minute>(),
                pump.consumed_power.get::<watt>(),
                pump.available_potential.get::<volt>()
            );
        }
    }

    fn physical_pump() -> ElectricalPumpPhysics {
        ElectricalPumpPhysics::new(
            "YELLOW",
            ElectricalBusType::AlternatingCurrentGndFltService,
            ElectricCurrent::new::<ampere>(45.),
            AngularVelocity::new::<revolution_per_minute>(7600.),
        )
    }

    fn context(delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
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
        )
    }

    fn test_electricity(bus_id: ElectricalBusType, is_powered: bool) -> Electricity {
        let mut electricity = Electricity::new();
        let mut source =
            TestElectricitySource::unpowered(PotentialOrigin::EngineGenerator(1), &mut electricity);

        if is_powered {
            source.power_with_potential(ElectricPotential::new::<volt>(115.));
        }

        let bus = ElectricalBus::new(bus_id, &mut electricity);

        electricity.supplied_by(&source);
        electricity.flow(&source, &bus);

        electricity
    }
}
