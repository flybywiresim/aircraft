use uom::si::{
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{radian_per_second, revolution_per_minute},
    electric_current::ampere,
    f64::*,
    pressure::psi,
    torque::{newton_meter, pound_force_inch},
    volume::cubic_inch,
};

use crate::shared::{ElectricalBusType, ElectricalBuses};
use crate::simulation::{SimulationElement, SimulatorWriter, UpdateContext, Write};

pub struct ElectricalPumpPhysics {
    active_id: String,
    rpm_id: String,
    bus_type: ElectricalBusType,
    is_powered: bool,

    acceleration: AngularAcceleration,
    speed: AngularVelocity,
    inertia: f64,
    is_active: bool,

    max_displacement: Volume,
    max_current: ElectricCurrent,
    output_current: ElectricCurrent,

    regulated_speed: AngularVelocity,
    last_speed_error_rpm: f64,

    generated_torque: Torque,
    pumping_torque: Torque,

    i_term: f64,
}
impl ElectricalPumpPhysics {
    const DEFAULT_INERTIA: f64 = 0.007;
    const DEFAULT_DYNAMIC_FRICTION_CONSTANT: f64 = 0.00004;
    const DEFAULT_P_GAIN: f64 = 0.05;
    const DEFAULT_I_GAIN: f64 = 0.05;

    pub fn new(
        id: &str,
        bus_type: ElectricalBusType,
        max_current: ElectricCurrent,
        regulated_speed: AngularVelocity,
        max_displacement: Volume,
    ) -> Self {
        Self {
            active_id: format!("HYD_{}_EPUMP_ACTIVE", id),
            rpm_id: format!("HYD_{}_EPUMP_RPM", id),
            bus_type,
            is_powered: false,
            acceleration: AngularAcceleration::new::<radian_per_second_squared>(0.),
            speed: AngularVelocity::new::<radian_per_second>(0.),
            inertia: Self::DEFAULT_INERTIA,
            is_active: false,
            max_displacement,
            max_current,
            output_current: ElectricCurrent::new::<ampere>(0.),
            regulated_speed,
            last_speed_error_rpm: 0.,
            generated_torque: Torque::new::<newton_meter>(0.),
            pumping_torque: Torque::new::<newton_meter>(0.),
            i_term: 0.,
        }
    }

    pub fn update(
        &mut self,
        current_pressure: Pressure,
        current_displacement: Volume,
        context: &UpdateContext,
    ) {
        self.update_pump_resistant_torque(current_pressure, current_displacement);
        self.update_pump_generated_torque(current_displacement, context);
        self.update_pump_speed(context);
    }

    fn update_pump_speed(&mut self, context: &UpdateContext) {
        let final_torque = self.generated_torque - self.pumping_torque;

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
        let friction_torque = Torque::new::<newton_meter>(
            Self::DEFAULT_DYNAMIC_FRICTION_CONSTANT * self.speed.get::<revolution_per_minute>(),
        );

        let torque = Torque::new::<pound_force_inch>(
            current_pressure.get::<psi>() * current_displacement.get::<cubic_inch>()
                / (2. * std::f64::consts::PI),
        );

        self.pumping_torque = torque + friction_torque;
    }

    fn update_pump_generated_torque(
        &mut self,
        current_displacement: Volume,
        context: &UpdateContext,
    ) {
        if self.is_active && self.is_powered {
            // Computing simple control feedforward with current being function of displacement ratio.
            // Max displacement requires max current
            let feedforward_current = self.max_current.get::<ampere>()
                * current_displacement.get::<cubic_inch>()
                / self.max_displacement.get::<cubic_inch>();

            let speed_error_rpm =
                (self.regulated_speed - self.speed).get::<revolution_per_minute>();

            let p_term = Self::DEFAULT_P_GAIN * speed_error_rpm;
            self.i_term += Self::DEFAULT_I_GAIN * speed_error_rpm * context.delta_as_secs_f64();

            self.output_current =
                ElectricCurrent::new::<ampere>(feedforward_current + p_term + self.i_term);

            if self.output_current >= self.max_current {
                self.i_term = 0.;
            }

            self.output_current = self
                .output_current
                .max(ElectricCurrent::new::<ampere>(0.))
                .min(self.max_current);

            self.last_speed_error_rpm = speed_error_rpm;

            let output_power = 115. * self.output_current.get::<ampere>() * (3_f64).sqrt();

            if self.speed.get::<revolution_per_minute>() < 5.
                && self.output_current.get::<ampere>() > 0.
            {
                self.generated_torque =
                    Torque::new::<newton_meter>(0.5 * self.output_current.get::<ampere>());
            } else {
                self.generated_torque = Torque::new::<newton_meter>(
                    0.95 * output_power / self.speed.get::<radian_per_second>(),
                );
            }
        } else {
            self.generated_torque = Torque::new::<newton_meter>(0.);
            self.output_current = ElectricCurrent::new::<ampere>(0.);
            self.i_term = 0.;
        }
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
        self.is_powered = buses.is_powered(self.bus_type);
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
                Volume::new::<cubic_inch>(0.263) / 2.,
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
    fn pump_spools_down_less_than_two_second_when_unpowered() {
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
                Volume::new::<cubic_inch>(0.263) / 2.,
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
                "t= {:.1} RPM {:.0}",
                time.as_secs_f64(),
                pump.speed.get::<revolution_per_minute>()
            );
        }
    }

    fn physical_pump() -> ElectricalPumpPhysics {
        ElectricalPumpPhysics::new(
            "YELLOW",
            ElectricalBusType::AlternatingCurrentGndFltService,
            ElectricCurrent::new::<ampere>(45.),
            AngularVelocity::new::<revolution_per_minute>(7600.),
            Volume::new::<cubic_inch>(0.263),
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
            source.power();
        }

        let bus = ElectricalBus::new(bus_id, &mut electricity);

        electricity.supplied_by(&source);
        electricity.flow(&source, &bus);

        electricity
    }
}
