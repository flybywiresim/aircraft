use std::error::Error;
use std::sync::LazyLock;

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

    builder.map_many(
        ExecuteOn::PostTick,
        vec![
            Variable::named("TOTAL WEIGHT"),
            Variable::named("CG PERCENT"),
        ],
        |values| {
            let weight_tons = Mass::new::<pound>(values[0]).get::<ton>();
            let cg_percent = values[1];

            println!("weight: {:.3}, CG: {:.3}", weight_tons, cg_percent);

            TABLE.lookup(weight_tons, cg_percent)
        },
        Variable::named("TEST_TABLE_LUT"),
    );

    builder.variables_to_object(Box::new(PitchTrimSimOutput { elevator_trim: 0. }));

    Ok(())
}

type AxisType = Axis<f64, Binary, Clamp, Clamp>;
type TableType = LookupTable2D<AxisType, AxisType, f64>;

const LUT_SHAPE: (usize, usize) = (8, 9);

const WEIGHT_BREAKPOINTS: [f64; LUT_SHAPE.0] = [48., 50., 55., 60., 65., 70., 75., 79.];
const CG_BREAKPOINTS: [f64; LUT_SHAPE.1] = [15., 17., 20., 24., 27., 30., 32., 35., 40.];

const TABLE_DATA: [f64; LUT_SHAPE.0 * LUT_SHAPE.1] = [
    3.7, 3.2, 2.7, 2.0, 1.4, 0.9, 0.4, 0.0, -0.9, 4.3, 3.7, 3.2, 2.5, 1.8, 1.3, 0.9, 0.4, -0.6,
    5.6, 5.1, 4.4, 3.7, 2.9, 2.1, 1.7, 1.1, -0.2, 5.5, 5.0, 4.4, 3.4, 2.9, 2.2, 1.7, 1.1, 0.1, 6.1,
    5.5, 4.9, 3.9, 3.2, 2.4, 1.9, 1.2, 0.0, 6.6, 5.7, 5.1, 4.1, 3.4, 2.5, 2.1, 1.5, 0.3, 6.6, 6.1,
    5.3, 4.3, 3.7, 2.9, 2.5, 1.7, 0.5, 6.6, 6.2, 5.4, 4.4, 3.6, 2.9, 2.5, 1.8, 0.6,
];

const TABLE: LazyLock<TableType> = LazyLock::new(|| {
    TableType::new(
        WEIGHT_BREAKPOINTS.to_vec(),
        Binary::default(),
        CG_BREAKPOINTS.to_vec(),
        Binary::default(),
        Array2::from_shape_vec(LUT_SHAPE, TABLE_DATA.to_vec()).expect("THS Table unwrap failed"),
    )
    .expect("THS Table unwrap failed")
});

#[sim_connect::data_definition]
struct PitchTrimSimOutput {
    #[name = "ELEVATOR TRIM POSITION"]
    #[unit = "DEGREE"]
    elevator_trim: f64,
}
impl VariablesToObject for PitchTrimSimOutput {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::aspect("HYD_FINAL_THS_DEFLECTION"),
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
