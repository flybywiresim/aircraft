use uom::si::{
    acceleration::meter_per_second_squared,
    angular_acceleration::radian_per_second_squared,
    f64::*,
    force::newton,
    length::meter,
    mass::kilogram,
    ratio::{percent, ratio},
    torque::kilogram_force_meter,
    velocity::{foot_per_second, meter_per_second},
};

use crate::{
    shared::{
        interpolation, EngineCorrectedN1, EngineCorrectedN2, EngineUncorrectedN2, ReverserPosition,
    },
    simulation::{Read, SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext, Write},
};

use crate::simulation::{InitContext, VariableIdentifier};

#[derive(Copy, Clone)]
struct ReverserThrust {
    current_thrust: Force,
}
impl ReverserThrust {
    const MIN_REVERSER_POS: f64 = 0.5;

    fn new() -> Self {
        Self {
            current_thrust: Force::default(),
        }
    }
    fn update(
        &mut self,
        engine_n1: &impl EngineCorrectedN1,
        reverser_position: &impl ReverserPosition,
    ) {
        self.current_thrust = if reverser_position.reverser_position().get::<ratio>()
            > Self::MIN_REVERSER_POS
        {
            Self::max_theoretical_thrust_from_n1(engine_n1) * reverser_position.reverser_position()
        } else {
            Force::default()
        };
    }

    fn current_thrust(&self) -> Force {
        self.current_thrust
    }

    fn max_theoretical_thrust_from_n1(engine_n1: &impl EngineCorrectedN1) -> Force {
        let n1_breakpoints = [0., 15., 20., 50., 55.];
        let reverse_thrust = [0., 0., 80000., 200000., 210000.];

        Force::new::<newton>(interpolation(
            &n1_breakpoints,
            &reverse_thrust,
            engine_n1.corrected_n1().get::<percent>(),
        ))
    }
}

pub struct ReverserForce {
    reverser_delta_speed_id: VariableIdentifier,
    reverser_angular_accel_id: VariableIdentifier,

    reversers: [ReverserThrust; 2],

    plane_delta_speed_due_to_reverse_thrust: Velocity,

    dissimetry_acceleration: AngularAcceleration,
}
impl ReverserForce {
    const DISTANCE_FROM_CG_TO_ENGINE_METER: f64 = 8.;

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            reverser_delta_speed_id: context.get_identifier("REVERSER_DELTA_SPEED".to_owned()),
            reverser_angular_accel_id: context
                .get_identifier("REVERSER_ANGULAR_ACCELERATION".to_owned()),

            reversers: [ReverserThrust::new(); 2],
            plane_delta_speed_due_to_reverse_thrust: Velocity::default(),
            dissimetry_acceleration: AngularAcceleration::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine_n1: [&impl EngineCorrectedN1; 2],
        reverser_position: &[impl ReverserPosition],
    ) {
        for (engine_index, reverser) in self.reversers.iter_mut().enumerate() {
            reverser.update(engine_n1[engine_index], &reverser_position[engine_index]);
        }

        let total_force = self.reversers[0].current_thrust() + self.reversers[1].current_thrust();

        let acceleration = if context.total_weight().get::<kilogram>() > 0. {
            -total_force / context.total_weight()
        } else {
            Acceleration::default()
        };

        self.plane_delta_speed_due_to_reverse_thrust = Velocity::new::<meter_per_second>(
            acceleration.get::<meter_per_second_squared>() * context.delta_as_secs_f64(),
        );

        println!("REVERSER OBJECT: Pos {:.1}/{:.1} totalForceN{:.0} Weight{:.2} totalAccel{:.5} deltaVel (fps) {:.5}",
        reverser_position[0].reverser_position().get::<ratio>(),
        reverser_position[1].reverser_position().get::<ratio>(),
        total_force.get::<newton>(),
        context.total_weight().get::<kilogram>(),
        acceleration.get::<meter_per_second_squared>(),
        self.plane_delta_speed_due_to_reverse_thrust.get::<foot_per_second>()
        );

        let total_dissimetry =
            self.reversers[1].current_thrust() - self.reversers[0].current_thrust();

        let dissimetry_torque = Torque::new::<kilogram_force_meter>(
            total_dissimetry.get::<newton>() * Self::DISTANCE_FROM_CG_TO_ENGINE_METER,
        );

        self.dissimetry_acceleration = if context.total_yaw_inertia_kg_m2().abs() > 0. {
            AngularAcceleration::new::<radian_per_second_squared>(
                dissimetry_torque.get::<kilogram_force_meter>() / context.total_yaw_inertia_kg_m2(),
            )
        } else {
            AngularAcceleration::default()
        };

        println!(
            "DISSIMETRY THRUST:  {:.1}N TORQUE{:.1}Mkg INERTIA kgm²{:.2} ACCEL r/s {:.5}",
            total_dissimetry.get::<newton>(),
            dissimetry_torque.get::<kilogram_force_meter>(),
            context.total_yaw_inertia_kg_m2(),
            self.dissimetry_acceleration
                .get::<radian_per_second_squared>(),
        );
    }
}
impl SimulationElement for ReverserForce {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.reverser_delta_speed_id,
            self.plane_delta_speed_due_to_reverse_thrust
                .get::<foot_per_second>(),
        );

        writer.write(
            &self.reverser_angular_accel_id,
            self.dissimetry_acceleration
                .get::<radian_per_second_squared>(),
        );
    }
}
