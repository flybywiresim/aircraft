use crate::simulation::{InitContext, VariableIdentifier, SimulatorWriter, Writer};
use rand::distributions::{Distribution, WeightedIndex};
use rand::prelude::{thread_rng, ThreadRng};
use crate::air_conditioning::ZoneType;

#[derive(Debug)]
pub struct AirConditioningSelector;

impl AirConditioningSelector {
    pub fn new<U>(context: &mut InitContext, writer: &mut SimulatorWriter,
    ) where U: FnOnce(&mut InitContext) -> U {
        // Set the position of the A/C knobs on aircraft load

        let ckpt_start_position: f64 = random_start_position();
        let cabin_start_position: f64 = random_start_position();
        
        let knob_start_positions: [f64; 3] = [
            ckpt_start_position,
            cabin_start_position,
            cabin_start_position
        ];

        let mut knob_ids: Vec<VariableIdentifier> = Vec::new();

        let cabin_zones: [ZoneType; 3] =
            [ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)];

        for zone in cabin_zones {
            knob_ids.push(
                context.get_identifier(
                    format!("OVHD_COND_{}_SELECTOR_KNOB", zone)
                )
            );
        }

        for (i, knob_id) in knob_ids.iter().enumerate() {
            write(
                writer,
                &knob_id,
                knob_start_positions[i]
            );
        }
    }
}

fn write(
    writer: &mut SimulatorWriter,
    knob_id: &VariableIdentifier,
    knob_start_position: f64,
) {
    writer.write_f64(knob_id, knob_start_position);
}

fn random_start_position() -> f64 {
    // Sum of all occurrences is currently 1000 so the probability of a value to be chosen can be
    // calculated by taking the weight and dividing it by 1000
    const POSITION_OCCURRENCES: [i32; 13] = [10, 1, 2, 30, 93, 139, 614, 104, 2, 1, 1, 1, 1];
    // Accounts for the 0 position
    const POSITION_COUNT: usize = (POSITION_OCCURRENCES.len() - 1) as usize;
    const SELECTOR_KNOB_MAX: usize = 300;
    // Randomly selects one of the 13 possible starting positions based on predefined weights
    //
    // The 13 possible starting positions are the knob values for
    // the whole number temperatures between 18C and 30C inclusive
    // starting at 0 and ending at 300
    //
    // TODO: Increase possible starting positions

    let mut knob_start_positions: Vec<(usize, i32)> = Vec::new();
    let knob_position_multiplier: usize = SELECTOR_KNOB_MAX / POSITION_COUNT;
    let mut rng: ThreadRng = thread_rng();

    for (_0, _1) in POSITION_OCCURRENCES.iter().enumerate() {
        knob_start_positions.push(((_0 * knob_position_multiplier) as usize, *_1));
    }

    let weighted_knob_start_positions: WeightedIndex<i32> = WeightedIndex::new(
        knob_start_positions.iter().map(|pos| pos.1)
    ).unwrap();

    knob_start_positions[weighted_knob_start_positions.sample(&mut rng)].0 as f64
}


#[cfg(test)]
mod selector_position_tests {
    use super::*;
    use crate::{
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };
}
