use uom::si::{
    acceleration::meter_per_second_squared,
    f64::*,
    force::newton,
    mass::kilogram,
    ratio::{percent, ratio},
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

pub struct ReverserForce<const N: usize> {
    reverser_delta_speed_id: VariableIdentifier,

    reversers: [ReverserThrust; N],

    plane_delta_speed_due_to_reverse_thrust: Velocity,
}
impl<const N: usize> ReverserForce<N> {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            reverser_delta_speed_id: context.get_identifier("REVERSER_DELTA_SPEED".to_owned()),
            reversers: [ReverserThrust::new(); N],
            plane_delta_speed_due_to_reverse_thrust: Velocity::default(),
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

        let mut total_force = Force::default();

        for reverser in &self.reversers {
            total_force += reverser.current_thrust();
        }

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
    }
}
impl SimulationElement for ReverserForce<2> {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.reverser_delta_speed_id,
            self.plane_delta_speed_due_to_reverse_thrust
                .get::<foot_per_second>(),
        );
    }
}
