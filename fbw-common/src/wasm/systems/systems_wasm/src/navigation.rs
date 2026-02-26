use crate::aspects::{ExecuteOn, MsfsAspectBuilder};
use crate::Variable;
use std::error::Error;
use systems::payload::BoardingRate;
use systems::shared::to_bool;

#[derive(Clone, Copy, PartialEq)]
enum AlignTime {
    Realistic = 0,
    Instant = 1,
    Fast = 2,
}

impl From<f64> for AlignTime {
    fn from(value: f64) -> Self {
        match value as u8 {
            1 => AlignTime::Instant,
            2 => AlignTime::Fast,
            _ => AlignTime::Realistic,
        }
    }
}

pub fn navigation(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.map(
        ExecuteOn::PreTick,
        Variable::named("CONFIG_ADIRS_IR_ALIGN_TIME"),
        |value| (AlignTime::from(value) == AlignTime::Fast).into(),
        Variable::aspect("ADIRS_IR_FAST_ALIGN_MODE"),
    );

    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::named("CONFIG_ADIRS_IR_ALIGN_TIME"),
            Variable::named("CONFIG_ADIRS_IR_INSTANT_ALIGN"),
            Variable::named("AIRCRAFT_PRESET_QUICK_MODE"),
        ],
        |values| {
            (AlignTime::from(values[0]) == AlignTime::Instant
                || to_bool(values[1])
                || to_bool(values[2]))
            .into()
        },
        Variable::aspect("ADIRS_IR_INSTANT_ALIGN"),
    );

    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::named("BOARDING_STARTED_BY_USR"),
            Variable::named("BOARDING_RATE"),
        ],
        |values| {
            let boarding_rate = BoardingRate::from(values[1]);
            let boarding_started_by_user = to_bool(values[0]);

            match boarding_rate {
                BoardingRate::Instant | BoardingRate::Fast => boarding_started_by_user,
                _ => false,
            }
            .into()
        },
        Variable::aspect("ADIRS_IR_EXCESS_MOTION_INHIBIT"),
    );

    Ok(())
}
