use uom::si::{
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{radian_per_second, revolution_per_minute},
    electric_current::ampere,
    f64::*,
    pressure::psi,
    torque::{newton_meter, pound_force_inch},
    volume::cubic_inch,
};

use crate::simulation::UpdateContext;
struct ElectricalPumpPhysics {
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

    fn new(
        max_current: ElectricCurrent,
        regulated_speed: AngularVelocity,
        max_displacement: Volume,
    ) -> Self {
        Self {
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

    fn update_pump_physics(
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
        self.speed = self.speed
            + AngularVelocity::new::<radian_per_second>(
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
        if self.is_active {
            let feedforward_current = self.max_current.get::<ampere>()
                * current_displacement.get::<cubic_inch>()
                / self.max_displacement.get::<cubic_inch>();

            let speed_error_rpm =
                (self.regulated_speed - self.speed).get::<revolution_per_minute>();

            let p_term = Self::DEFAULT_P_GAIN * speed_error_rpm;
            self.i_term =
                self.i_term + Self::DEFAULT_I_GAIN * speed_error_rpm * context.delta_as_secs_f64();

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

            let three: f64 = 3.;
            let output_power = 115. * self.output_current.get::<ampere>() * three.sqrt();

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

    fn set_active(&mut self, is_active: bool) {
        self.is_active = is_active;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::UpdateContext;
    use std::time::Duration;
    use uom::si::{
        acceleration::foot_per_second_squared, length::foot, pressure::psi,
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
            pump.update_pump_physics(
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

    fn physical_pump() -> ElectricalPumpPhysics {
        ElectricalPumpPhysics::new(
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
        )
    }
}
