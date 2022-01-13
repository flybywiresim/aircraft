use msfs::sim_connect;
use msfs::{sim_connect::SimConnect, sim_connect::SIMCONNECT_OBJECT_ID_USER};
use std::error::Error;
use systems_wasm::aspects::{
    EventToVariableMapping, ExecuteOn, MsfsAspectBuilder, VariablesToObject,
};
use systems_wasm::{set_data_on_sim_object, Variable};

pub(super) fn flaps(builder: &mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        "FLAPS_INCR",
        EventToVariableMapping::CurrentValueToValue(|current_value| (current_value + 1.).min(4.)),
        Variable::Named("FLAPS_HANDLE_INDEX".into()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "FLAPS_DECR",
        EventToVariableMapping::CurrentValueToValue(|current_value| (current_value - 1.).max(0.)),
        Variable::Named("FLAPS_HANDLE_INDEX".into()),
        |options| options.mask(),
    )?;
    flaps_event_to_value(builder, "FLAPS_UP", 0.)?;
    flaps_event_to_value(builder, "FLAPS_1", 1.)?;
    flaps_event_to_value(builder, "FLAPS_2", 2.)?;
    flaps_event_to_value(builder, "FLAPS_3", 3.)?;
    flaps_event_to_value(builder, "FLAPS_DOWN", 4.)?;
    builder.event_to_variable(
        "FLAPS_SET",
        EventToVariableMapping::EventDataAndCurrentValueToValue(|event_data, current_value| {
            let normalized_input: f64 = (event_data as i32 as f64) / 8192. - 1.;
            get_handle_pos_from_0_1(normalized_input, current_value)
        }),
        Variable::Named("FLAPS_HANDLE_INDEX".into()),
        |options| options.mask(),
    )?;
    builder.event_to_variable(
        "AXIS_FLAPS_SET",
        EventToVariableMapping::EventDataAndCurrentValueToValue(|event_data, current_value| {
            let normalized_input: f64 = (event_data as i32 as f64) / 16384.;
            get_handle_pos_from_0_1(normalized_input, current_value)
        }),
        Variable::Named("FLAPS_HANDLE_INDEX".into()),
        |options| options.mask(),
    )?;

    builder.map(
        ExecuteOn::PreTick,
        Variable::Named("FLAPS_HANDLE_INDEX".into()),
        |value| value / 4.,
        Variable::Named("FLAPS_HANDLE_PERCENT".into()),
    );

    builder.variables_to_object(Box::new(FlapsSurface {
        left_flap: 0.,
        right_flap: 0.,
    }));
    builder.variables_to_object(Box::new(SlatsSurface {
        left_slat: 0.,
        right_slat: 0.,
    }));
    builder.variables_to_object(Box::new(FlapsHandleIndex { index: 0. }));

    Ok(())
}

fn flaps_event_to_value(
    builder: &mut MsfsAspectBuilder,
    event_name: &str,
    value: f64,
) -> Result<(), Box<dyn Error>> {
    builder.event_to_variable(
        event_name,
        EventToVariableMapping::Value(value),
        Variable::Named("FLAPS_HANDLE_INDEX".into()),
        |options| options.mask(),
    )
}

fn get_handle_pos_from_0_1(input: f64, current_value: f64) -> f64 {
    if input < -0.8 {
        0.
    } else if input > -0.7 && input < -0.3 {
        1.
    } else if input > -0.2 && input < 0.2 {
        2.
    } else if input > 0.3 && input < 0.7 {
        3.
    } else if input > 0.8 {
        4.
    } else {
        current_value
    }
}

#[sim_connect::data_definition]
struct FlapsSurface {
    #[name = "TRAILING EDGE FLAPS LEFT PERCENT"]
    #[unit = "Percent"]
    left_flap: f64,

    #[name = "TRAILING EDGE FLAPS RIGHT PERCENT"]
    #[unit = "Percent"]
    right_flap: f64,
}

impl VariablesToObject for FlapsSurface {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::Named("LEFT_FLAPS_POSITION_PERCENT".into()),
            Variable::Named("RIGHT_FLAPS_POSITION_PERCENT".into()),
        ]
    }

    fn write(&mut self, values: Vec<f64>) {
        self.left_flap = values[0];
        self.right_flap = values[1];
    }

    set_data_on_sim_object!();
}

#[sim_connect::data_definition]
struct SlatsSurface {
    #[name = "LEADING EDGE FLAPS LEFT PERCENT"]
    #[unit = "Percent"]
    left_slat: f64,

    #[name = "LEADING EDGE FLAPS RIGHT PERCENT"]
    #[unit = "Percent"]
    right_slat: f64,
}

impl VariablesToObject for SlatsSurface {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::Named("LEFT_SLATS_POSITION_PERCENT".into()),
            Variable::Named("RIGHT_SLATS_POSITION_PERCENT".into()),
        ]
    }

    fn write(&mut self, values: Vec<f64>) {
        self.left_slat = values[0];
        self.right_slat = values[1];
    }

    set_data_on_sim_object!();
}

#[sim_connect::data_definition]
struct FlapsHandleIndex {
    #[name = "FLAPS HANDLE INDEX"]
    #[unit = "Number"]
    index: f64,
}

impl VariablesToObject for FlapsHandleIndex {
    fn variables(&self) -> Vec<Variable> {
        vec![
            Variable::Named("LEFT_FLAPS_POSITION_PERCENT".into()),
            Variable::Named("RIGHT_FLAPS_POSITION_PERCENT".into()),
            Variable::Named("LEFT_SLATS_POSITION_PERCENT".into()),
            Variable::Named("RIGHT_SLATS_POSITION_PERCENT".into()),
        ]
    }

    fn write(&mut self, values: Vec<f64>) {
        self.index = Self::msfs_flap_index_from_surfaces_positions_percent(values);
    }

    set_data_on_sim_object!();
}

impl FlapsHandleIndex {
    /// Tries to take actual surfaces position PERCENTS and convert it into flight model FLAP HANDLE INDEX
    /// This index is used by MSFS to select correct aerodynamic properties
    /// There is no index available for flaps but no slats configurations (possible plane failure case)
    /// The percent thresholds can be tuned to change the timing of aerodynamic impact versus surface actual position
    fn msfs_flap_index_from_surfaces_positions_percent(values: Vec<f64>) -> f64 {
        let left_flaps_position = values[0];
        let right_flaps_position = values[1];
        let left_slats_position = values[2];
        let right_slats_position = values[3];
        let flap_mean_position = (left_flaps_position + right_flaps_position) / 2.;
        let slat_mean_position = (left_slats_position + right_slats_position) / 2.;

        if flap_mean_position < 2. && slat_mean_position < 2. {
            // Clean configuration no flaps no slats
            0.
        } else if flap_mean_position < 12. && slat_mean_position > 15. {
            // Almost no flaps but some slats -> CONF 1
            1.
        } else if flap_mean_position > 80. {
            5.
        } else if flap_mean_position > 49. {
            4.
        } else if flap_mean_position > 30. {
            3.
        } else if flap_mean_position > 12. {
            2.
        } else {
            0.
        }
    }
}
