use crate::{
    navigation::taws::{
        TerrainAwarenessWarningSystemDiscreteInput, TerrainAwarenessWarningSystemDiscreteInputs,
    },
    shared::LgciuGearExtension,
    simulation::{InitContext, Read, SimulationElement, SimulatorReader, VariableIdentifier},
};

pub struct TawsElectricalHarness {
    discrete_inputs: TerrainAwarenessWarningSystemDiscreteInputs,

    flaps_mode_off: bool,
    landing_flaps_3: bool,

    gpws_terr_off_id: VariableIdentifier,
    gpws_terr_fault_id: VariableIdentifier,
    gpws_sys_off_id: VariableIdentifier,
    gpws_sys_fault_id: VariableIdentifier,
    gpws_gs_mode_off_id: VariableIdentifier,
    gpws_flap_mode_off_id: VariableIdentifier,
    gpws_landing_flap_3_on_id: VariableIdentifier,
    gpws_warning_light_on_id: VariableIdentifier,
    gpws_alert_light_on_id: VariableIdentifier,
    gpws_gs_cancel_self_test_id: VariableIdentifier,

    sfcc_fap_1_id: VariableIdentifier,
    sfcc_fap_5_id: VariableIdentifier,

    ecam_cp_emer_canc_id: VariableIdentifier,

    slew_active_id: VariableIdentifier,
}

impl TawsElectricalHarness {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            discrete_inputs: TerrainAwarenessWarningSystemDiscreteInputs::default(),

            flaps_mode_off: false,
            landing_flaps_3: false,

            gpws_terr_off_id: context.get_identifier("GPWS_TERR_OFF".to_owned()),
            gpws_terr_fault_id: context.get_identifier("GPWS_TERR_FAULT".to_owned()),
            gpws_sys_off_id: context.get_identifier("GPWS_SYS_OFF".to_owned()),
            gpws_sys_fault_id: context.get_identifier("GPWS_SYS_FAULT".to_owned()),
            gpws_gs_mode_off_id: context.get_identifier("GPWS_GS_MODE_OFF".to_owned()),
            gpws_flap_mode_off_id: context.get_identifier("GPWS_FLAP_MODE_OFF".to_owned()),
            gpws_landing_flap_3_on_id: context.get_identifier("GPWS_LANDING_FLAP_3_ON".to_owned()),
            gpws_warning_light_on_id: context.get_identifier("GPWS_WARNING_LIGHT_ON".to_owned()),
            gpws_alert_light_on_id: context.get_identifier("GPWS_ALERT_LIGHT_ON".to_owned()),
            gpws_gs_cancel_self_test_id: context
                .get_identifier("GPWS_GS_CANCEL_SELF_TEST".to_owned()),

            sfcc_fap_1_id: context.get_identifier("SFCC_1_FAP_1".to_owned()),
            sfcc_fap_5_id: context.get_identifier("SFCC_1_FAP_5".to_owned()),

            ecam_cp_emer_canc_id: context.get_identifier("ECP_DISCRETE_OUT_EMER_CANC".to_owned()),

            slew_active_id: context.get_identifier("IS SLEW ACTIVE".to_owned()),
        }
    }

    pub fn update<T: LgciuGearExtension>(&mut self, lgciu: &T) {
        self.discrete_inputs.landing_gear_downlocked = lgciu.left_down_and_locked();
        self.discrete_inputs.wx_radar_1_off = false; // TODO
        self.discrete_inputs.wx_radar_2_off = false; // TODO
        self.discrete_inputs.terrain_display_select_1 = false; // TODO
        self.discrete_inputs.terrain_display_select_2 = false; // TODO
        self.discrete_inputs.steep_approach_mode = false; // TODO
        self.discrete_inputs.audio_inhibit = false; // TODO: Comes from FWC during e.g. STALL STALL
    }
}

impl TerrainAwarenessWarningSystemDiscreteInput for TawsElectricalHarness {
    fn discrete_inputs(&self) -> &TerrainAwarenessWarningSystemDiscreteInputs {
        &self.discrete_inputs
    }
}

impl SimulationElement for TawsElectricalHarness {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.flaps_mode_off = reader.read(&self.gpws_flap_mode_off_id);
        self.landing_flaps_3 = reader.read(&self.gpws_landing_flap_3_on_id);

        self.discrete_inputs.glideslop_inhibit = reader.read(&self.gpws_gs_mode_off_id);
        self.discrete_inputs.gpws_inhibit = reader.read(&self.gpws_sys_off_id);
        self.discrete_inputs.momentary_audio_suppression = reader.read(&self.ecam_cp_emer_canc_id);
        self.discrete_inputs.self_test = reader.read(&self.gpws_gs_cancel_self_test_id);
        self.discrete_inputs.landing_flaps = if self.flaps_mode_off {
            true
        } else if self.landing_flaps_3 {
            // TODO the SFCC discrete outputs are not exposed directly, and I can't be bothered to implement this right now
            reader.read(&self.sfcc_fap_5_id)
        } else {
            reader.read(&self.sfcc_fap_1_id)
        };
        self.discrete_inputs.gs_cancel = reader.read(&self.gpws_gs_cancel_self_test_id);
        self.discrete_inputs.terrain_awareness_inhibit = reader.read(&self.gpws_terr_off_id);
        self.discrete_inputs.sim_reposition_active = reader.read(&self.slew_active_id);
    }
}
