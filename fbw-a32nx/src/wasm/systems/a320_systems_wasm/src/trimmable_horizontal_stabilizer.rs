use std::error::Error;
use std::sync::{LazyLock, Mutex};

use systems::shared::rate_limiter::RateLimiter;
use systems_wasm::aspects::{
    EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, ObjectWrite, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

use systems::shared::to_bool;

use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};

use lookup_tables::{Axis, Binary, Clamp, LookupTable2D};
use ndarray::Array2;
use uom::si::{
    f64::*,
    mass::{pound, ton},
};

static RATE_LIMITER_UPPER: LazyLock<Mutex<RateLimiter<f64>>> =
    LazyLock::new(|| Mutex::new(RateLimiter::new_symmetrical(0.1)));

static RATE_LIMITER_LOWER: LazyLock<Mutex<RateLimiter<f64>>> =
    LazyLock::new(|| Mutex::new(RateLimiter::new_symmetrical(0.1)));

static RATE_LIMITER_IN_FLIGHT: LazyLock<Mutex<RateLimiter<f64>>> =
    LazyLock::new(|| Mutex::new(RateLimiter::new_symmetrical(0.1)));

const IN_FLIGHT_OFFSET: f64 = 4.5;

type AxisType = Axis<f64, Binary, Clamp, Clamp>;
type TableType = LookupTable2D<AxisType, AxisType, f64>;

const LUT_SHAPE: (usize, usize) = (8, 9);

const WEIGHT_BREAKPOINTS: [f64; LUT_SHAPE.0] = [48., 50., 55., 60., 65., 70., 75., 79.];
const CG_BREAKPOINTS: [f64; LUT_SHAPE.1] = [15., 17., 20., 24., 27., 30., 32., 35., 40.];

const UPPER_BOUNDARY_ACTUAL: f64 = 3.8;
const LOWER_BOUNDARY_ACTUAL: f64 = -2.5;

#[rustfmt::skip]
const UPPER_BOUNDARY_1_PLUS_F_DATA: [f64; LUT_SHAPE.0 * LUT_SHAPE.1] = [
    3.7, 3.2, 2.7, 2.0, 1.4, 0.9, 0.4, 0.0, -0.9,
    4.3, 3.7, 3.2, 2.5, 1.8, 1.3, 0.9, 0.4, -0.6,
    4.6, 4.1, 3.4, 2.7, 2.1, 1.4, 1.0, 0.4, -0.6,
    5.3, 4.7, 4.2, 3.3, 2.6, 2.1, 1.6, 0.8, -0.4,
    5.7, 5.3, 4.5, 3.6, 3.1, 2.3, 1.8, 1.1, -0.1,
    5.7, 5.3, 4.5, 3.7, 3.1, 2.3, 1.8, 1.1, 0.2,
    5.8, 5.4, 4.6, 3.8, 3.1, 2.4, 1.9, 1.2, 0.3,
    5.8, 5.5, 4.7, 3.9, 3.2, 2.5, 2.0, 1.3, 0.4,
];

#[rustfmt::skip]
const LOWER_BOUNDARY_1_PLUS_F_DATA: [f64; LUT_SHAPE.0 * LUT_SHAPE.1] = [
    0.0, -0.2, -0.9, -1.3, -1.5, -1.9, -2.0, -2.5, -2.5,
    0.5, 0.3, -0.5, -1.5, -1.9, -1.9, -1.9, -1.9, -2.2,
    0.6, 0.5, -0.2, -1.2, -1.5, -1.7, -1.9, -2.4, -2.5,
    0.5, 0.4, 0.2, -1.1, -1.3, -1.8, -1.9, -2.3, -2.4,
    0.6, 0.5, 0.1, -1.2, -1.2, -1.6, -1.9, -2.5, -2.7,
    0.5, 0.3, -1.0, -1.8, -2.0, -2.4, -2.7, -3.0, -3.4,
    1.0, 0.6, 0.3, -1.2, -1.5, -1.9, -2.2, -2.4, -3.4,
    1.6, 1.6, 1.1, 0.7, 0.4, -0.2, -0.5, -1.9, -2.6,
];

#[rustfmt::skip]
const UPPER_BOUNDARY_2_DATA: [f64; LUT_SHAPE.0 * LUT_SHAPE.1] = [
    1.7, 1.3, 0.8, 0.0, -0.3, -0.8, -1.0, -1.6, -2.6,
    1.5, 1.2, 0.7, 0.0, -0.4, -1.0, -1.1, -1.7, -2.7,
    2.1, 1.8, 0.9, 0.1, -0.4, -0.9, -1.1, -1.7, -2.8,
    2.5, 2.3, 1.7, 1.0, 0.5, -0.2, -0.6, -1.2, -2.2,
    2.7, 2.5, 1.9, 1.2, 0.7, 0.2, -0.4, -1.0, -2.0,
    3.0, 2.8, 2.2, 1.5, 1.0, 0.5, 0.0, -0.6, -1.7,
    3.0, 2.8, 2.2, 1.5, 1.2, 0.8, 0.3, 0.3, -1.3,
    3.5, 3.3, 2.9, 2.2, 1.8, 1.2, 0.7, 0.1, -1.1,
];

#[rustfmt::skip]
const LOWER_BOUNDARY_2_DATA: [f64; LUT_SHAPE.0 * LUT_SHAPE.1] = [
    -0.9, -1.8, -2.8, -3.5, -4.0, -4.0, -4.0, -4.0, -4.0,
    -1.1, -1.3, -2.3, -2.6, -3.8, -4.0, -4.0, -4.0, -4.0,
    -0.8, -0.9, -1.7, -1.8, -2.3, -3.6, -4.0, -4.0, -4.0,
    0.3, 0.2, 0.0, -0.1, -0.8, -1.5, -2.3, -2.8, -3.2,
    0.2, 0.1, 0.0, -0.1, -0.4, -1.1, -1.9, -2.3, -2.6,
    0.6, 0.6, 0.6, 0.5, 0.3, 0.0, -0.3, -1.4, -1.8,
    0.6, 0.6, 0.6, 0.5, 0.2, 0.0, -0.5, -1.9, -2.4,
    0.9, 0.6, 0.6, 0.5, 0.1, -0.3, -0.9, -2.3, -2.8,
];

#[rustfmt::skip]
const UPPER_BOUNDARY_3_DATA: [f64; LUT_SHAPE.0 * LUT_SHAPE.1] = [
    -0.5, -0.7, -1.1, -1.6, -1.9, -2.4, -2.6, -3.0, -3.6,
    -0.1, -0.4, -0.7, -1.3, -1.7, -2.2, -2.4, -2.8, -3.4,
    2.6, 2.4, 1.8, 1.0, 0.3, -0.2, -0.6, -1.3, -2.4,
    2.9, 2.6, 2.0, 1.2, 0.5, 0.0, -0.5, -1.1, -2.1,
    3.5, 3.1, 2.4, 1.6, 0.9, 0.1, -0.4, -1.0, -2.2,
    3.2, 2.7, 2.1, 1.3, 0.6, -0.2, -0.5, -1.0, -2.0,
    3.5, 3.1, 2.5, 1.7, 1.0, 0.3, -0.2, -0.7, -1.8,
    3.5, 3.1, 2.5, 1.7, 1.0, 0.3, -0.2, -0.7, -1.8,
];

#[rustfmt::skip]
const LOWER_BOUNDARY_3_DATA: [f64; LUT_SHAPE.0 * LUT_SHAPE.1] = [
    -2.7, -4.0, -4.0, -4.0, -4.0, -4.0, -4.0, -4.0, -4.0,
    -2.7, -4.0, -4.0, -4.0, -4.0, -4.0, -4.0, -4.0, -4.0,
    -2.5, -3.0, -3.2, -3.5, -4.0, -4.0, -4.0, -4.0, -4.0,
    -2.3, -3.2, -3.4, -3.6, -3.8, -4.0, -4.0, -4.0, -4.0,
    -2.0, -2.8, -3.0, -3.3, -3.6, -4.0, -4.0, -4.0, -4.0,
    -2.1, -3.0, -3.2, -3.3, -4.0, -4.0, -4.0, -4.0, -4.0,
    -2.3, -3.0, -3.0, -3.5, -4.0, -4.0, -4.0, -4.0, -4.0,
    -1.9, -3.0, -3.2, -3.3, -4.0, -4.0, -4.0, -4.0, -4.0,
];

static UPPER_BOUNDARY_TABLE_1_PLUS_F: LazyLock<TableType> = LazyLock::new(|| {
    TableType::new(
        WEIGHT_BREAKPOINTS.to_vec(),
        Binary,
        CG_BREAKPOINTS.to_vec(),
        Binary,
        Array2::from_shape_vec(LUT_SHAPE, UPPER_BOUNDARY_1_PLUS_F_DATA.to_vec())
            .expect("THS Table unwrap failed"),
    )
    .expect("THS Table unwrap failed")
});

static LOWER_BOUNDARY_TABLE_1_PLUS_F: LazyLock<TableType> = LazyLock::new(|| {
    TableType::new(
        WEIGHT_BREAKPOINTS.to_vec(),
        Binary,
        CG_BREAKPOINTS.to_vec(),
        Binary,
        Array2::from_shape_vec(LUT_SHAPE, LOWER_BOUNDARY_1_PLUS_F_DATA.to_vec())
            .expect("THS Table unwrap failed"),
    )
    .expect("THS Table unwrap failed")
});

static UPPER_BOUNDARY_TABLE_2: LazyLock<TableType> = LazyLock::new(|| {
    TableType::new(
        WEIGHT_BREAKPOINTS.to_vec(),
        Binary,
        CG_BREAKPOINTS.to_vec(),
        Binary,
        Array2::from_shape_vec(LUT_SHAPE, UPPER_BOUNDARY_2_DATA.to_vec())
            .expect("THS Table unwrap failed"),
    )
    .expect("THS Table unwrap failed")
});

static LOWER_BOUNDARY_TABLE_2: LazyLock<TableType> = LazyLock::new(|| {
    TableType::new(
        WEIGHT_BREAKPOINTS.to_vec(),
        Binary,
        CG_BREAKPOINTS.to_vec(),
        Binary,
        Array2::from_shape_vec(LUT_SHAPE, LOWER_BOUNDARY_2_DATA.to_vec())
            .expect("THS Table unwrap failed"),
    )
    .expect("THS Table unwrap failed")
});

static UPPER_BOUNDARY_TABLE_3: LazyLock<TableType> = LazyLock::new(|| {
    TableType::new(
        WEIGHT_BREAKPOINTS.to_vec(),
        Binary,
        CG_BREAKPOINTS.to_vec(),
        Binary,
        Array2::from_shape_vec(LUT_SHAPE, UPPER_BOUNDARY_3_DATA.to_vec())
            .expect("THS Table unwrap failed"),
    )
    .expect("THS Table unwrap failed")
});

static LOWER_BOUNDARY_TABLE_3: LazyLock<TableType> = LazyLock::new(|| {
    TableType::new(
        WEIGHT_BREAKPOINTS.to_vec(),
        Binary,
        CG_BREAKPOINTS.to_vec(),
        Binary,
        Array2::from_shape_vec(LUT_SHAPE, LOWER_BOUNDARY_3_DATA.to_vec())
            .expect("THS Table unwrap failed"),
    )
    .expect("THS Table unwrap failed")
});

pub(super) fn trimmable_horizontal_stabilizer(
    builder: &mut MsfsAspectBuilder,
) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "ELEV_TRIM_UP",
        EventToVariableMapping::Value(35.),
        Variable::aspect("THS_MANUAL_CONTROL_SPEED_KEY"),
        |options| options.mask().afterwards_reset_to(0.),
    )?;

    builder.event_to_variable(
        "ELEV_TRIM_DN",
        EventToVariableMapping::Value(-35.),
        Variable::aspect("THS_MANUAL_CONTROL_SPEED_KEY"),
        |options| options.mask().afterwards_reset_to(0.),
    )?;

    builder.event_to_variable(
        "ELEVATOR_TRIM_SET",
        EventToVariableMapping::EventDataToValue(|event_data| (event_data as f64) / 16383.),
        Variable::aspect("THS_MAN_POS_SET_16K"),
        |options| options.mask().afterwards_reset_to(-1.),
    )?;

    builder.event_to_variable(
        "AXIS_ELEV_TRIM_SET",
        EventToVariableMapping::EventData32kPosition,
        Variable::aspect("THS_MAN_POS_SET_32K"),
        |options| options.mask().afterwards_reset_to(-1.),
    )?;

    // Sends a trim speed from position error
    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("THS_MAN_POS_SET_16K"),
            Variable::aspect("THS_MAN_POS_SET_32K"),
            Variable::named("HYD_TRIM_WHEEL_PERCENT"),
        ],
        |values| {
            if values[0] >= 0. {
                pos_error_to_speed(values[0] - values[2] / 100.)
            } else if values[1] >= 0. {
                pos_error_to_speed(values[1] - values[2] / 100.)
            } else {
                0.
            }
        },
        Variable::aspect("THS_MANUAL_CONTROL_SPEED_AXIS"),
    );

    // Selects final speed to use from keys or axis events
    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("THS_MANUAL_CONTROL_SPEED_KEY"),
            Variable::aspect("THS_MANUAL_CONTROL_SPEED_AXIS"),
        ],
        |values| {
            if values[0].abs() > 0. {
                values[0]
            } else {
                values[1]
            }
        },
        Variable::aspect("THS_MANUAL_CONTROL_SPEED"),
    );

    // Sends manual control state when receiveing an event even if position is not moving or when keys event are used
    builder.map_many(
        ExecuteOn::PreTick,
        vec![
            Variable::aspect("THS_MAN_POS_SET_16K"),
            Variable::aspect("THS_MAN_POS_SET_32K"),
            Variable::aspect("THS_MANUAL_CONTROL_SPEED_KEY"),
        ],
        |values| {
            if values[0] >= 0. || values[1] >= 0. || values[2].abs() > 0. {
                1.
            } else {
                0.
            }
        },
        Variable::aspect("THS_MANUAL_CONTROL_ACTIVE"),
    );

    // Send actual THS position to Lvar
    builder.map(
        ExecuteOn::PostTick,
        Variable::aspect("HYD_FINAL_THS_DEFLECTION"),
        |value| value,
        Variable::named("HYD_THS_DEFLECTION"),
    );

    builder.map_many_with_delta(
        ExecuteOn::PostTick,
        vec![
            Variable::named("TOTAL WEIGHT"),
            Variable::named("CG PERCENT"),
            Variable::aspect("HYD_FINAL_THS_DEFLECTION"),
            Variable::named("FLAPS_HANDLE_INDEX"),
            Variable::aircraft("SIM ON GROUND", "BOOL", 0),
            Variable::named("THS_FUDGING_GROUND_TO_FLIGHT_TRANSITION_RATE"),
            Variable::named("THS_FUDGING_FLIGHT_TO_GROUND_TRANSITION_RATE"),
        ],
        |values, delta| {
            let weight_tons = Mass::new::<pound>(values[0]).get::<ton>();
            let cg_percent = values[1];
            let hydraulics_ths_position = values[2];
            let flaps_handle_pos = values[3] as u32;
            let on_ground = to_bool(values[4]);

            let (mut upper_boundary_value, mut lower_boundary_value) = match flaps_handle_pos {
                0 | 1 => (
                    UPPER_BOUNDARY_TABLE_1_PLUS_F.lookup(weight_tons, cg_percent),
                    LOWER_BOUNDARY_TABLE_1_PLUS_F.lookup(weight_tons, cg_percent),
                ),
                2 => (
                    UPPER_BOUNDARY_TABLE_2.lookup(weight_tons, cg_percent),
                    LOWER_BOUNDARY_TABLE_2.lookup(weight_tons, cg_percent),
                ),
                3 | 4..=u32::MAX => (
                    UPPER_BOUNDARY_TABLE_3.lookup(weight_tons, cg_percent),
                    LOWER_BOUNDARY_TABLE_3.lookup(weight_tons, cg_percent),
                ),
            };

            upper_boundary_value = RATE_LIMITER_UPPER
                .lock()
                .unwrap()
                .update(delta, upper_boundary_value);

            lower_boundary_value = RATE_LIMITER_LOWER
                .lock()
                .unwrap()
                .update(delta, lower_boundary_value);

            let mut in_flight_rate_lim = RATE_LIMITER_IN_FLIGHT.lock().unwrap();

            in_flight_rate_lim.set_max_rate(values[5].abs(), -values[6].abs());

            let in_flight_gain = in_flight_rate_lim.update(delta, if on_ground { 0. } else { 1. });

            let normalized_hydraulic_ths_position = (hydraulics_ths_position
                - LOWER_BOUNDARY_ACTUAL)
                / (UPPER_BOUNDARY_ACTUAL - LOWER_BOUNDARY_ACTUAL);

            let on_ground_remapped_ths_position = normalized_hydraulic_ths_position
                * (upper_boundary_value - lower_boundary_value)
                + lower_boundary_value;

            let in_flight_ths_position = hydraulics_ths_position + IN_FLIGHT_OFFSET;

            in_flight_gain * in_flight_ths_position
                + (1. - in_flight_gain) * on_ground_remapped_ths_position
        },
        Variable::named("HYD_REMAPPED_THS_DEFLECTION"),
    );

    builder.variables_to_object(Box::new(PitchTrimSimOutput { elevator_trim: 0. }));

    Ok(())
}

#[sim_connect::data_definition]
struct PitchTrimSimOutput {
    #[name = "ELEVATOR TRIM POSITION"]
    #[unit = "DEGREE"]
    elevator_trim: f64,
}
impl VariablesToObject for PitchTrimSimOutput {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::named("HYD_REMAPPED_THS_DEFLECTION"),
            Variable::named("FLIGHT_CONTROLS_TRACKING_MODE"),
        ]
    }

    fn write(&mut self, values: Vec<f64>) -> ObjectWrite {
        self.elevator_trim = values[0];

        //Not writing control feedback when in tracking mode
        ObjectWrite::on(!to_bool(values[1]))
    }

    set_data_on_sim_object!();
}

fn pos_error_to_speed(error: f64) -> f64 {
    (1000. * error).clamp(-45., 45.)
}
