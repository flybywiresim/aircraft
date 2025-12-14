use crate::{
    shared::LgciuGearExtension,
    simulation::{InitContext, Read, SimulationElement, SimulatorReader, VariableIdentifier},
    surveillance::{
        egpws::runtime::EnhancedGroundProximityWarningComputerPinProgramming,
        taws::TerrainAwarenessWarningSystemDiscreteInputs,
    },
};

pub struct EgpwsElectricalHarness {
    discrete_inputs: TerrainAwarenessWarningSystemDiscreteInputs,
    pin_programs: EnhancedGroundProximityWarningComputerPinProgramming,

    flaps_mode_off: bool,
    landing_flaps_3: bool,

    terr_off_id: VariableIdentifier,
    sys_off_id: VariableIdentifier,
    gs_mode_off_id: VariableIdentifier,
    flap_mode_off_id: VariableIdentifier,
    landing_flap_3_on_id: VariableIdentifier,
    gs_cancel_self_test_id: VariableIdentifier,

    sfcc_fap_1_id: VariableIdentifier,
    sfcc_fap_5_id: VariableIdentifier,

    ecam_cp_emer_canc_id: VariableIdentifier,

    slew_active_id: VariableIdentifier,
}

impl EgpwsElectricalHarness {
    pub(super) const GPWS_TERR_OFF_KEY: &str = "GPWS_TERR_OFF";
    pub(super) const GPWS_SYS_OFF_KEY: &str = "GPWS_SYS_OFF";
    pub(super) const GPWS_GS_OFF_KEY: &str = "GPWS_GS_OFF";
    pub(super) const GPWS_FLAP_OFF_KEY: &str = "GPWS_FLAP_OFF";
    pub(super) const GPWS_FLAPS3_KEY: &str = "GPWS_FLAPS3";
    pub(super) const GPWS_TEST_KEY: &str = "GPWS_TEST";
    pub(super) const SFCC_1_FAP_1_KEY: &str = "SFCC_1_FAP_1";
    pub(super) const SFCC_1_FAP_5_KEY: &str = "SFCC_1_FAP_5";
    pub(super) const ECP_DISCRETE_OUT_EMER_CANC_KEY: &str = "ECP_DISCRETE_OUT_EMER_CANC";
    pub(super) const IS_SLEW_ACTIVE_KEY: &str = "IS SLEW ACTIVE";

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            discrete_inputs: TerrainAwarenessWarningSystemDiscreteInputs::default(),
            pin_programs: EnhancedGroundProximityWarningComputerPinProgramming::default(),

            flaps_mode_off: false,
            landing_flaps_3: false,

            terr_off_id: context.get_identifier(Self::GPWS_TERR_OFF_KEY.to_owned()),
            sys_off_id: context.get_identifier(Self::GPWS_SYS_OFF_KEY.to_owned()),
            gs_mode_off_id: context.get_identifier(Self::GPWS_GS_OFF_KEY.to_owned()),
            flap_mode_off_id: context.get_identifier(Self::GPWS_FLAP_OFF_KEY.to_owned()),
            landing_flap_3_on_id: context.get_identifier(Self::GPWS_FLAPS3_KEY.to_owned()),
            gs_cancel_self_test_id: context.get_identifier(Self::GPWS_TEST_KEY.to_owned()),

            sfcc_fap_1_id: context.get_identifier(Self::SFCC_1_FAP_1_KEY.to_owned()),
            sfcc_fap_5_id: context.get_identifier(Self::SFCC_1_FAP_5_KEY.to_owned()),

            ecam_cp_emer_canc_id: context
                .get_identifier(Self::ECP_DISCRETE_OUT_EMER_CANC_KEY.to_owned()),

            slew_active_id: context.get_identifier(Self::IS_SLEW_ACTIVE_KEY.to_owned()),
        }
    }

    pub fn update(&mut self, lgciu: &impl LgciuGearExtension) {
        self.discrete_inputs.landing_gear_downlocked = lgciu.left_down_and_locked();
        self.discrete_inputs.wx_radar_1_off = false; // TODO
        self.discrete_inputs.wx_radar_2_off = false; // TODO
        self.discrete_inputs.terrain_display_select_1 = false; // TODO
        self.discrete_inputs.terrain_display_select_2 = false; // TODO
        self.discrete_inputs.steep_approach_mode = false; // TODO
        self.discrete_inputs.audio_inhibit = false; // TODO: Comes from FWC during e.g. STALL STALL
    }

    pub fn discrete_inputs(&self) -> &TerrainAwarenessWarningSystemDiscreteInputs {
        &self.discrete_inputs
    }

    pub fn pin_programs(&self) -> &EnhancedGroundProximityWarningComputerPinProgramming {
        &self.pin_programs
    }
}

impl SimulationElement for EgpwsElectricalHarness {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.flaps_mode_off = reader.read(&self.flap_mode_off_id);
        self.landing_flaps_3 = reader.read(&self.landing_flap_3_on_id);

        self.discrete_inputs.glideslope_inhibit = reader.read(&self.gs_mode_off_id);
        self.discrete_inputs.gpws_inhibit = reader.read(&self.sys_off_id);
        self.discrete_inputs.momentary_audio_suppression = reader.read(&self.ecam_cp_emer_canc_id);
        self.discrete_inputs.self_test = reader.read(&self.gs_cancel_self_test_id);
        self.discrete_inputs.landing_flaps = if self.flaps_mode_off {
            true
        } else if self.landing_flaps_3 {
            // TODO the SFCC discrete outputs are not exposed directly, and I can't be bothered to implement this right now
            reader.read(&self.sfcc_fap_5_id)
        } else {
            reader.read(&self.sfcc_fap_1_id)
        };
        self.discrete_inputs.gs_cancel = reader.read(&self.gs_cancel_self_test_id);
        self.discrete_inputs.terrain_awareness_inhibit = reader.read(&self.terr_off_id);
        self.discrete_inputs.sim_reposition_active = reader.read(&self.slew_active_id);
    }
}
