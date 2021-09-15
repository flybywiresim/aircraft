use super::brake_circuit::Actuator;
use crate::simulation::UpdateContext;
use uom::si::{
    angle::radian,
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    pressure::psi,
    ratio::ratio,
    volume::{cubic_inch, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

pub struct FlapSlatHydraulicMotor {
    speed: AngularVelocity,
    displacement: Volume,
    current_flow: VolumeRate,

    total_volume_to_actuator: Volume,
    total_volume_returned_to_reservoir: Volume,
}
impl FlapSlatHydraulicMotor {
    fn new(displacement: Volume) -> Self {
        Self {
            speed: AngularVelocity::new::<radian_per_second>(0.),
            displacement,
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_returned_to_reservoir: Volume::new::<gallon>(0.),
        }
    }

    fn update_speed(&mut self, speed: AngularVelocity, context: &UpdateContext) {
        self.speed = speed;
        self.current_flow = VolumeRate::new::<gallon_per_minute>(
            self.speed.get::<revolution_per_minute>() * self.displacement.get::<cubic_inch>()
                / 231.,
        );

        self.total_volume_to_actuator += self.current_flow * context.delta_as_time();
        self.total_volume_returned_to_reservoir += self.current_flow * context.delta_as_time();
    }

    fn torque_nm(&self, pressure: Pressure) -> f64 {
        0.113 * pressure.get::<psi>() * self.displacement.get::<cubic_inch>() / 6.28
    }

    fn _reset_accumulators(&mut self) {
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
        self.total_volume_returned_to_reservoir = Volume::new::<gallon>(0.);
    }

    fn _flow(&self) -> VolumeRate {
        self.current_flow
    }
}
impl Actuator for FlapSlatHydraulicMotor {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }
    fn reservoir_return(&self) -> Volume {
        self.total_volume_returned_to_reservoir
    }
}

pub struct FlapSlatAssembly {
    synchro_gear_position: Angle,

    max_synchro_gear_position: Angle,

    current_speed: AngularVelocity,
    current_max_speed: AngularVelocity,
    full_pressure_max_speed: AngularVelocity,

    gearbox_ratio: Ratio,
    synchro_gear_ratio: Ratio,

    left_motor: FlapSlatHydraulicMotor,
    right_motor: FlapSlatHydraulicMotor,
}
impl FlapSlatAssembly {
    const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT: f64 = 800.;
    const MAX_CIRCUIT_PRESSURE_PSI: f64 = 3000.;

    pub fn new(
        motor_displacement: Volume,
        full_pressure_max_speed: AngularVelocity,
        max_synchro_gear_position: Angle,
        synchro_gear_ratio: Ratio,
        gearbox_ratio: Ratio,
    ) -> Self {
        Self {
            synchro_gear_position: Angle::new::<radian>(0.),
            max_synchro_gear_position,
            current_speed: AngularVelocity::new::<radian_per_second>(0.),
            current_max_speed: AngularVelocity::new::<radian_per_second>(0.),
            full_pressure_max_speed,
            gearbox_ratio,
            synchro_gear_ratio,
            left_motor: FlapSlatHydraulicMotor::new(motor_displacement),
            right_motor: FlapSlatHydraulicMotor::new(motor_displacement),
        }
    }

    pub fn update(
        &mut self,
        synchro_gear_angle_request: Angle,
        left_pressure: Pressure,
        right_pressure: Pressure,
        context: &UpdateContext,
    ) {
        self.update_current_max_speed(left_pressure, right_pressure);

        if synchro_gear_angle_request > self.position_feedback() {
            self.synchro_gear_position += Angle::new::<radian>(
                self.current_max_speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );
            self.current_speed = self.current_max_speed;
        } else if synchro_gear_angle_request < self.position_feedback() {
            self.synchro_gear_position -= Angle::new::<radian>(
                self.current_max_speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );
            self.current_speed = -self.current_max_speed;
        } else {
            self.current_speed = AngularVelocity::new::<radian_per_second>(0.);
        }

        if self.current_speed > AngularVelocity::new::<radian_per_second>(0.)
            && synchro_gear_angle_request < self.position_feedback()
            || self.current_speed < AngularVelocity::new::<radian_per_second>(0.)
                && synchro_gear_angle_request > self.position_feedback()
        {
            self.synchro_gear_position = synchro_gear_angle_request;
        }

        self.synchro_gear_position = self
            .synchro_gear_position
            .max(Angle::new::<radian>(0.))
            .min(self.max_synchro_gear_position);

        self.update_motor_flows(left_pressure, right_pressure, context);
    }

    fn update_current_max_speed(&mut self, left_pressure: Pressure, right_pressure: Pressure) {
        if left_pressure + right_pressure
            > Pressure::new::<psi>(Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT)
        {
            self.current_max_speed = AngularVelocity::new::<radian_per_second>(
                self.full_pressure_max_speed.get::<radian_per_second>()
                    * (left_pressure.get::<psi>() + right_pressure.get::<psi>())
                    / (Self::MAX_CIRCUIT_PRESSURE_PSI * 2.),
            );
        } else {
            self.current_max_speed = AngularVelocity::new::<radian_per_second>(0.);
        }
    }

    fn update_motor_flows(
        &mut self,
        left_pressure: Pressure,
        right_pressure: Pressure,
        context: &UpdateContext,
    ) {
        let torque_shaft_speed = AngularVelocity::new::<radian_per_second>(
            self.current_speed.get::<radian_per_second>() / self.synchro_gear_ratio.get::<ratio>(),
        );

        let left_torque_nm = self.left_motor.torque_nm(left_pressure);
        let right_torque_nm = self.right_motor.torque_nm(right_pressure);

        let total_motor_torque = left_torque_nm + right_torque_nm;

        let left_torque_ratio = left_torque_nm / total_motor_torque;
        let right_torque_ratio = right_torque_nm / total_motor_torque;

        self.left_motor.update_speed(
            AngularVelocity::new::<radian_per_second>(
                torque_shaft_speed.get::<radian_per_second>()
                    * left_torque_ratio
                    * self.gearbox_ratio.get::<ratio>(),
            ),
            context,
        );
        self.right_motor.update_speed(
            AngularVelocity::new::<radian_per_second>(
                torque_shaft_speed.get::<radian_per_second>()
                    * right_torque_ratio
                    * self.gearbox_ratio.get::<ratio>(),
            ),
            context,
        );
    }

    pub fn position_feedback(&self) -> Angle {
        self.synchro_gear_position
    }

    pub fn left_motor(&mut self) -> &FlapSlatHydraulicMotor {
        &self.left_motor
    }

    pub fn right_motor(&mut self) -> &FlapSlatHydraulicMotor {
        &self.right_motor
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::angle::degree;

    use uom::si::{
        acceleration::foot_per_second_squared, length::foot, pressure::psi,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    #[test]
    fn flap_slat_assembly_init() {
        let mut flap_system = FlapSlatAssembly::new(
            Volume::new::<cubic_inch>(0.32),
            AngularVelocity::new::<radian_per_second>(0.4),
            Angle::new::<degree>(231.24),
            Ratio::new::<ratio>(1. / 140.),
            Ratio::new::<ratio>(16.632),
        );

        assert!(flap_system.position_feedback().get::<degree>() == 0.);
        assert!(flap_system.left_motor().current_flow == VolumeRate::new::<gallon_per_minute>(0.));
        assert!(flap_system.right_motor().current_flow == VolumeRate::new::<gallon_per_minute>(0.));

        assert!(
            flap_system.left_motor().speed == AngularVelocity::new::<revolution_per_minute>(0.)
        );
        assert!(
            flap_system.right_motor().speed == AngularVelocity::new::<revolution_per_minute>(0.)
        );
    }

    #[test]
    fn flap_slat_assembly_full_pressure() {
        let mut flap_system = FlapSlatAssembly::new(
            Volume::new::<cubic_inch>(0.32),
            AngularVelocity::new::<radian_per_second>(0.4),
            Angle::new::<degree>(231.24),
            Ratio::new::<ratio>(1. / 140.),
            Ratio::new::<ratio>(16.632),
        );

        assert!(flap_system.position_feedback().get::<degree>() == 0.);
        assert!(flap_system.current_speed.get::<radian_per_second>() == 0.);

        flap_system.update(
            Angle::new::<degree>(150.),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(100)),
        );

        assert!(flap_system.current_speed.get::<radian_per_second>() >= 0.39);
        assert!(flap_system.current_speed.get::<radian_per_second>() <= 0.41);

        assert!(
            flap_system.left_motor().speed >= AngularVelocity::new::<revolution_per_minute>(4000.)
                && flap_system.left_motor().speed
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );
        assert!(
            flap_system.right_motor().speed >= AngularVelocity::new::<revolution_per_minute>(4000.)
                && flap_system.right_motor().speed
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(
            flap_system.left_motor()._flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.left_motor()._flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
        assert!(
            flap_system.right_motor()._flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.right_motor()._flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_half_pressure_left() {
        let mut flap_system = FlapSlatAssembly::new(
            Volume::new::<cubic_inch>(0.32),
            AngularVelocity::new::<radian_per_second>(0.4),
            Angle::new::<degree>(231.24),
            Ratio::new::<ratio>(1. / 140.),
            Ratio::new::<ratio>(16.632),
        );

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            Angle::new::<degree>(150.),
            Pressure::new::<psi>(0.),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(100)),
        );

        assert!(
            flap_system.left_motor().speed == AngularVelocity::new::<revolution_per_minute>(0.)
        );
        assert!(
            flap_system.right_motor().speed >= AngularVelocity::new::<revolution_per_minute>(4000.)
                && flap_system.right_motor().speed
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(flap_system.left_motor()._flow() == VolumeRate::new::<gallon_per_minute>(0.));
        assert!(
            flap_system.right_motor()._flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.right_motor()._flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_half_pressure_right() {
        let mut flap_system = FlapSlatAssembly::new(
            Volume::new::<cubic_inch>(0.32),
            AngularVelocity::new::<radian_per_second>(0.4),
            Angle::new::<degree>(231.24),
            Ratio::new::<ratio>(1. / 140.),
            Ratio::new::<ratio>(16.632),
        );

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            Angle::new::<degree>(150.),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(0.),
            &context(Duration::from_millis(100)),
        );

        assert!(
            flap_system.right_motor().speed == AngularVelocity::new::<revolution_per_minute>(0.)
        );
        assert!(
            flap_system.left_motor().speed >= AngularVelocity::new::<revolution_per_minute>(4000.)
                && flap_system.left_motor().speed
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(flap_system.right_motor()._flow() == VolumeRate::new::<gallon_per_minute>(0.));
        assert!(
            flap_system.left_motor()._flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.left_motor()._flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_goes_to_req_position() {
        let mut flap_system = FlapSlatAssembly::new(
            Volume::new::<cubic_inch>(0.32),
            AngularVelocity::new::<radian_per_second>(0.4),
            Angle::new::<degree>(231.24),
            Ratio::new::<ratio>(1. / 140.),
            Ratio::new::<ratio>(16.632),
        );

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            Angle::new::<degree>(150.),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(100)),
        );

        let mut time = Duration::from_millis(0);
        let mut last_position = flap_system.position_feedback();
        for _ in 0..200 {
            flap_system.update(
                Angle::new::<degree>(150.),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );
            if flap_system.position_feedback() != Angle::new::<degree>(150.) {
                assert!(flap_system.position_feedback() > last_position);
            }
            assert!(flap_system.position_feedback() <= Angle::new::<degree>(150.));

            last_position = flap_system.position_feedback();
            println!(
                "Time: {:.1}s  -> Position {:.1}/150",
                time.as_secs_f64(),
                last_position.get::<degree>()
            );
            time += Duration::from_millis(100);
        }

        assert!(flap_system.position_feedback() == Angle::new::<degree>(150.));
    }

    #[test]
    fn flap_slat_assembly_stops_at_max_position() {
        let mut flap_system = FlapSlatAssembly::new(
            Volume::new::<cubic_inch>(0.32),
            AngularVelocity::new::<radian_per_second>(0.4),
            Angle::new::<degree>(231.24),
            Ratio::new::<ratio>(1. / 140.),
            Ratio::new::<ratio>(16.632),
        );

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            Angle::new::<degree>(800.),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(0.),
            &context(Duration::from_millis(100)),
        );

        let mut time = Duration::from_millis(0);
        let mut last_position = flap_system.position_feedback();
        for _ in 0..300 {
            flap_system.update(
                Angle::new::<degree>(800.),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(0.),
                &context(Duration::from_millis(100)),
            );

            assert!(flap_system.position_feedback() <= Angle::new::<degree>(231.24));

            last_position = flap_system.position_feedback();
            println!(
                "Time: {:.1}s  -> Position {:.1}/150",
                time.as_secs_f64(),
                last_position.get::<degree>()
            );
            time += Duration::from_millis(100);
        }
    }

    #[test]
    fn flap_slat_assembly_goes_back_from_max_position() {
        let mut flap_system = FlapSlatAssembly::new(
            Volume::new::<cubic_inch>(0.32),
            AngularVelocity::new::<radian_per_second>(0.4),
            Angle::new::<degree>(231.24),
            Ratio::new::<ratio>(1. / 140.),
            Ratio::new::<ratio>(16.632),
        );

        let mut time = Duration::from_millis(0);
        let mut last_position = flap_system.position_feedback();
        for _ in 0..300 {
            flap_system.update(
                Angle::new::<degree>(800.),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );

            assert!(flap_system.position_feedback() <= Angle::new::<degree>(231.24));

            last_position = flap_system.position_feedback();
            println!(
                "Time: {:.1}s  -> Position {:.1}/150",
                time.as_secs_f64(),
                last_position.get::<degree>()
            );
            time += Duration::from_millis(100);
        }

        assert!(flap_system.position_feedback() == Angle::new::<degree>(231.24));

        for _ in 0..300 {
            flap_system.update(
                Angle::new::<degree>(-100.),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );

            assert!(flap_system.position_feedback() <= Angle::new::<degree>(231.24));

            last_position = flap_system.position_feedback();
            println!(
                "Time: {:.1}s  -> Position {:.1}/150",
                time.as_secs_f64(),
                last_position.get::<degree>()
            );
            time += Duration::from_millis(100);
        }

        assert!(flap_system.position_feedback() == Angle::new::<degree>(0.));
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
