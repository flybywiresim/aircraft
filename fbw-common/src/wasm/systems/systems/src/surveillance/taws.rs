use crate::shared::arinc429::Arinc429Word;

#[derive(Default)]
pub struct TerrainAwarenessWarningSystemDiscreteInputs {
    pub glideslope_inhibit: bool,
    pub gpws_inhibit: bool,
    pub momentary_audio_suppression: bool,
    pub self_test: bool,
    pub landing_gear_downlocked: bool,
    pub landing_flaps: bool,
    pub gs_cancel: bool,
    pub wx_radar_1_off: bool,
    pub terrain_awareness_inhibit: bool,
    pub wx_radar_2_off: bool,
    pub terrain_display_select_1: bool,
    pub terrain_display_select_2: bool,
    pub steep_approach_mode: bool,
    pub audio_inhibit: bool,
    pub sim_reposition_active: bool,
}

#[derive(Default)]
pub struct TerrainAwarenessWarningSystemBusOutputs {
    // Label 270
    pub alert_discrete_1: Arinc429Word<u32>,
    // Label 274
    pub alert_discrete_2: Arinc429Word<u32>,
    // Label
}

pub trait TerrainAwarenessWarningSystemBusOutput {
    fn bus_outputs(&self) -> &TerrainAwarenessWarningSystemBusOutputs;
}

#[derive(Default, Debug)]
pub struct TerrainAwarenessWarningSystemDiscreteOutputs {
    pub warning_lamp: bool,
    pub alert_lamp: bool,
    pub audio_on: bool,
    pub gpws_inop: bool,
    pub terrain_inop: bool,
    pub terrain_not_available: bool,
    pub raas_inop: bool,
    pub capt_terrain_display_active: bool,
    pub fo_terrain_display_active: bool,
}

pub trait TerrainAwarenessWarningSystemDiscreteOutput {
    fn discrete_outputs(&self) -> &TerrainAwarenessWarningSystemDiscreteOutputs;
}
