use crate::flight_warning::ecam_control::A320EcamControlPanel;
use crate::flight_warning::A320FlightWarningComputer;
use crate::{A320Hydraulic, A320RadioAltimeters};
use std::time::Duration;
use systems::engine::leap_engine::LeapEngine;
use systems::engine::{Engine, EngineFireOverheadPanel};
use systems::flight_warning::acquisition::{AsGroundPotential, POTENTIAL_OPEN_CIRCUIT_VOLTS};
use systems::flight_warning::logic::ConfirmationNode;
use systems::flight_warning::parameters::Value;
use systems::landing_gear::LandingGearControlInterfaceUnitSet;
use systems::navigation::adirs::AirDataInertialReferenceSystem;
use systems::navigation::radio_altimeter::RadioAltimeter;
use systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::shared::{EngineFirePushButtons, HydraulicSysLowPressure, LgciuWeightOnWheels};
use systems::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader, UpdateContext,
    VariableIdentifier,
};
use uom::si::angle::degree;
use uom::si::electric_potential::volt;
use uom::si::f64::{Angle, ElectricPotential, Length, Ratio, Velocity};
use uom::si::length::foot;
use uom::si::ratio::ratio;
use uom::ConstZero;

pub(super) struct A320FwcInputs {
    number: usize,

    ess_lh_lg_compressed: ElectricPotential,
    norm_lh_lg_compressed: ElectricPotential,
    blue_sys_lo_pr: ElectricPotential,
    yellow_sys_lo_pr: ElectricPotential,
    green_sys_lo_pr: ElectricPotential,

    ap1_engd_com: ElectricPotential,
    ap1_engd_mon: ElectricPotential,
    ap2_engd_com: ElectricPotential,
    ap2_engd_mon: ElectricPotential,
    mw_cancel_on_capt: ElectricPotential,
    mw_cancel_on_fo: ElectricPotential,
    mc_cancel_on_capt: ElectricPotential,
    mc_cancel_on_fo: ElectricPotential,
    ecp_clear: ElectricPotential,
    ecp_emer_cancel_on: ElectricPotential,
    ecp_recall: ElectricPotential,
    ecp_status: ElectricPotential,
    eng1_fire_pb_out: ElectricPotential,
    eng2_fire_pb_out: ElectricPotential,
    gpws_modes_on: ElectricPotential,
    gs_visual_alert_on: ElectricPotential,
    tcas_aural_advisory_output: ElectricPotential,

    lgciu_1_discrete_word_1: Arinc429Word<u32>,
    lgciu_2_discrete_word_1: Arinc429Word<u32>,
    lgciu_1_discrete_word_2: Arinc429Word<u32>,
    lgciu_2_discrete_word_2: Arinc429Word<u32>,
    ecp_warning_switches_word: Arinc429Word<u32>,
    radio_height_1: Arinc429Word<Length>,
    radio_height_2: Arinc429Word<Length>,
    computed_speed_1: Arinc429Word<Velocity>,
    computed_speed_2: Arinc429Word<Velocity>,
    computed_speed_3: Arinc429Word<Velocity>,
    altitude_1: Arinc429Word<Length>,
    altitude_2: Arinc429Word<Length>,
    altitude_3: Arinc429Word<Length>,
    mmr_1_glide_slope_deviation: Arinc429Word<Ratio>,
    mmr_2_glide_slope_deviation: Arinc429Word<Ratio>,
    eiu_1_word_031: Arinc429Word<u32>,
    eiu_2_word_031: Arinc429Word<u32>,
    tla1: Angle,
    tla2: Angle,
    ecu_1a_tla: Arinc429Word<Angle>,
    ecu_1b_tla: Arinc429Word<Angle>,
    ecu_2a_tla: Arinc429Word<Angle>,
    ecu_2b_tla: Arinc429Word<Angle>,
    ecu_1a_status_word_1: Arinc429Word<u32>,
    ecu_1b_status_word_1: Arinc429Word<u32>,
    ecu_2a_status_word_1: Arinc429Word<u32>,
    ecu_2b_status_word_1: Arinc429Word<u32>,
    ecu_1a_status_word_3: Arinc429Word<u32>,
    ecu_1b_status_word_3: Arinc429Word<u32>,
    ecu_2a_status_word_3: Arinc429Word<u32>,
    ecu_2b_status_word_3: Arinc429Word<u32>,
    flex_temp_set: bool,
    ecu_1a_word_272: Arinc429Word<u32>,
    ecu_1b_word_272: Arinc429Word<u32>,
    ecu_2a_word_272: Arinc429Word<u32>,
    ecu_2b_word_272: Arinc429Word<u32>,
    fcu_ats_discrete_word: Arinc429Word<u32>,
    fcu_ap_tcas_word: Arinc429Word<u32>,
    fcu_selected_altitude_word: Arinc429Word<Length>,
    fcu_last_altitude: Length,
    fcu_alt_changed: Duration,
    fcu_discrete_word_1: Arinc429Word<u32>,
    fmgc_1_discrete_word_1: Arinc429Word<u32>,
    fmgc_2_discrete_word_1: Arinc429Word<u32>,
    fmgc_1_discrete_word_4: Arinc429Word<u32>,
    fmgc_2_discrete_word_4: Arinc429Word<u32>,
    dmc_1_decision_height_word: Arinc429Word<Length>,
    dmc_2_decision_height_word: Arinc429Word<Length>,
    dmc_mda: i32,
    dmc_1_mda_plus_hundred_conf: ConfirmationNode,
    dmc_2_mda_plus_hundred_conf: ConfirmationNode,
    dmc_1_mda_inf_conf: ConfirmationNode,
    dmc_2_mda_inf_conf: ConfirmationNode,
    dmc_1_discrete_status_word: Arinc429Word<u32>,
    dmc_2_discrete_status_word: Arinc429Word<u32>,
    audio_synchronization_in: ElectricPotential,
    synthetic_voice_synchronization_in: ElectricPotential,

    ap1_active_id: VariableIdentifier,
    ap2_active_id: VariableIdentifier,
    mw_cancel_on_capt_id: VariableIdentifier,
    mw_cancel_on_fo_id: VariableIdentifier,
    mc_cancel_on_capt_id: VariableIdentifier,
    mc_cancel_on_fo_id: VariableIdentifier,
    eng1_master_lever_id: VariableIdentifier,
    eng2_master_lever_id: VariableIdentifier,
    eng1_tla_id: VariableIdentifier,
    eng2_tla_id: VariableIdentifier,
    flex_temp_id: VariableIdentifier,
    autothrust_status_id: VariableIdentifier,
    ap_altitude_lock_id: VariableIdentifier,
    fma_vertical_mode_id: VariableIdentifier,
    fma_lateral_mode_id: VariableIdentifier,
    gpws_modes_on_id: VariableIdentifier,
    gs_visual_alert_on_id: VariableIdentifier,
    tcas_aural_advisory_output_id: VariableIdentifier,
    decision_height_id: VariableIdentifier,
    minimum_descent_altitude_id: VariableIdentifier,
    has_gs_id: VariableIdentifier,
    gs_deviation_id: VariableIdentifier,
    fmgc_flight_phase_id: VariableIdentifier,
}

impl A320FwcInputs {
    pub fn new(context: &mut InitContext, number: usize) -> Self {
        let open_circuit = ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS);
        Self {
            number,
            ess_lh_lg_compressed: open_circuit,
            norm_lh_lg_compressed: open_circuit,
            blue_sys_lo_pr: open_circuit,
            yellow_sys_lo_pr: open_circuit,
            green_sys_lo_pr: open_circuit,
            ap1_engd_com: open_circuit,
            ap1_engd_mon: open_circuit,
            ap2_engd_com: open_circuit,
            ap2_engd_mon: open_circuit,
            mw_cancel_on_capt: open_circuit,
            mw_cancel_on_fo: open_circuit,
            mc_cancel_on_capt: open_circuit,
            mc_cancel_on_fo: open_circuit,
            ecp_clear: open_circuit,
            ecp_emer_cancel_on: open_circuit,
            ecp_recall: open_circuit,
            ecp_status: open_circuit,
            eng1_fire_pb_out: open_circuit,
            eng2_fire_pb_out: open_circuit,
            gpws_modes_on: open_circuit,
            gs_visual_alert_on: open_circuit,
            tcas_aural_advisory_output: open_circuit,
            lgciu_1_discrete_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            lgciu_2_discrete_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            lgciu_1_discrete_word_2: Arinc429Word::new(0, SignStatus::FailureWarning),
            lgciu_2_discrete_word_2: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecp_warning_switches_word: Arinc429Word::new(0, SignStatus::FailureWarning),
            radio_height_1: Arinc429Word::new(Length::ZERO, SignStatus::FailureWarning),
            radio_height_2: Arinc429Word::new(Length::ZERO, SignStatus::FailureWarning),
            computed_speed_1: Arinc429Word::new(Velocity::ZERO, SignStatus::FailureWarning),
            computed_speed_2: Arinc429Word::new(Velocity::ZERO, SignStatus::FailureWarning),
            computed_speed_3: Arinc429Word::new(Velocity::ZERO, SignStatus::FailureWarning),
            altitude_1: Arinc429Word::new(Length::ZERO, SignStatus::FailureWarning),
            altitude_2: Arinc429Word::new(Length::ZERO, SignStatus::FailureWarning),
            altitude_3: Arinc429Word::new(Length::ZERO, SignStatus::FailureWarning),
            mmr_1_glide_slope_deviation: Arinc429Word::new(Ratio::ZERO, SignStatus::FailureWarning),
            mmr_2_glide_slope_deviation: Arinc429Word::new(Ratio::ZERO, SignStatus::FailureWarning),
            eiu_1_word_031: Arinc429Word::new(0, SignStatus::FailureWarning),
            eiu_2_word_031: Arinc429Word::new(0, SignStatus::FailureWarning),
            tla1: Angle::ZERO,
            tla2: Angle::ZERO,
            ecu_1a_tla: Arinc429Word::new(Angle::ZERO, SignStatus::FailureWarning),
            ecu_1b_tla: Arinc429Word::new(Angle::ZERO, SignStatus::FailureWarning),
            ecu_2a_tla: Arinc429Word::new(Angle::ZERO, SignStatus::FailureWarning),
            ecu_2b_tla: Arinc429Word::new(Angle::ZERO, SignStatus::FailureWarning),
            ecu_1a_status_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_1b_status_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_2a_status_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_2b_status_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_1a_status_word_3: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_1b_status_word_3: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_2a_status_word_3: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_2b_status_word_3: Arinc429Word::new(0, SignStatus::FailureWarning),
            flex_temp_set: false,
            ecu_1a_word_272: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_1b_word_272: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_2a_word_272: Arinc429Word::new(0, SignStatus::FailureWarning),
            ecu_2b_word_272: Arinc429Word::new(0, SignStatus::FailureWarning),
            fcu_ats_discrete_word: Arinc429Word::new(0, SignStatus::FailureWarning),
            fcu_ap_tcas_word: Arinc429Word::new(0, SignStatus::FailureWarning),
            fcu_selected_altitude_word: Arinc429Word::new(Length::ZERO, SignStatus::FailureWarning),
            fcu_last_altitude: Length::ZERO,
            fcu_alt_changed: Duration::ZERO,
            fcu_discrete_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            fmgc_1_discrete_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            fmgc_2_discrete_word_1: Arinc429Word::new(0, SignStatus::FailureWarning),
            fmgc_1_discrete_word_4: Arinc429Word::new(0, SignStatus::FailureWarning),
            fmgc_2_discrete_word_4: Arinc429Word::new(0, SignStatus::FailureWarning),
            dmc_1_decision_height_word: Arinc429Word::new(Length::ZERO, SignStatus::FailureWarning),
            dmc_2_decision_height_word: Arinc429Word::new(Length::ZERO, SignStatus::FailureWarning),
            dmc_mda: 0,
            dmc_1_mda_plus_hundred_conf: ConfirmationNode::new(true, Duration::from_secs_f64(0.5)),
            dmc_2_mda_plus_hundred_conf: ConfirmationNode::new(true, Duration::from_secs_f64(0.5)),
            dmc_1_mda_inf_conf: ConfirmationNode::new(true, Duration::from_secs_f64(0.5)),
            dmc_2_mda_inf_conf: ConfirmationNode::new(true, Duration::from_secs_f64(0.5)),
            dmc_1_discrete_status_word: Arinc429Word::new(0, SignStatus::FailureWarning),
            dmc_2_discrete_status_word: Arinc429Word::new(0, SignStatus::FailureWarning),
            audio_synchronization_in: open_circuit,
            synthetic_voice_synchronization_in: open_circuit,
            ap1_active_id: context.get_identifier("AUTOPILOT_1_ACTIVE".to_owned()),
            ap2_active_id: context.get_identifier("AUTOPILOT_2_ACTIVE".to_owned()),
            mw_cancel_on_capt_id: context.get_identifier("FWS_MW_CANCEL_ON_CAPT".to_owned()),
            mw_cancel_on_fo_id: context.get_identifier("FWS_MW_CANCEL_ON_FO".to_owned()),
            mc_cancel_on_capt_id: context.get_identifier("FWS_MC_CANCEL_ON_CAPT".to_owned()),
            mc_cancel_on_fo_id: context.get_identifier("FWS_MC_CANCEL_ON_FO".to_owned()),
            eng1_master_lever_id: context.get_identifier("TURB ENG IGNITION SWITCH:1".to_owned()),
            eng2_master_lever_id: context.get_identifier("TURB ENG IGNITION SWITCH:2".to_owned()),
            eng1_tla_id: context.get_identifier("AUTOTHRUST_TLA:1".to_owned()),
            eng2_tla_id: context.get_identifier("AUTOTHRUST_TLA:2".to_owned()),
            flex_temp_id: context.get_identifier("TO_FLEX_TEMP".to_owned()),
            autothrust_status_id: context.get_identifier("AUTOTHRUST_STATUS".to_owned()),
            ap_altitude_lock_id: context.get_identifier("AUTOPILOT ALTITUDE LOCK VAR:3".to_owned()),
            fma_vertical_mode_id: context.get_identifier("FMA_VERTICAL_MODE".to_owned()),
            fma_lateral_mode_id: context.get_identifier("FMA_LATERAL_MODE".to_owned()),
            gpws_modes_on_id: context.get_identifier("GPWS_Warning_Active".to_owned()),
            gs_visual_alert_on_id: context.get_identifier("GPWS_GS_Warning_Active".to_owned()),
            tcas_aural_advisory_output_id: context
                .get_identifier("TCAS_AURAL_ADVISORY_OUTPUT".to_owned()),
            decision_height_id: context.get_identifier("DECISION_HEIGHT".to_owned()),
            minimum_descent_altitude_id: context
                .get_identifier("MINIMUM_DESCENT_ALTITUDE".to_owned()),
            has_gs_id: context.get_identifier("RADIO_RECEIVER_GS_IS_VALID".to_owned()),
            gs_deviation_id: context.get_identifier("RADIO_RECEIVER_GS_DEVIATION".to_owned()),
            fmgc_flight_phase_id: context.get_identifier("FMGC_FLIGHT_PHASE".to_owned()),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        lgcius: &LandingGearControlInterfaceUnitSet,
        adirs: &AirDataInertialReferenceSystem,
        radio_altimeters: &A320RadioAltimeters,
        engine1: &LeapEngine,
        engine2: &LeapEngine,
        engine_fire_overhead: &EngineFireOverheadPanel<2>,
        hydraulic: &A320Hydraulic,
        ecp: &A320EcamControlPanel,
        opposite_fwc: &A320FlightWarningComputer,
    ) {
        self.audio_synchronization_in = opposite_fwc
            .audio_synchronization_out()
            .value()
            .as_ground_potential();

        self.synthetic_voice_synchronization_in = opposite_fwc
            .synthetic_voice_synchronization_out()
            .value()
            .as_ground_potential();

        self.ecp_warning_switches_word = ecp.warning_switches_word();
        self.ecp_clear = ecp.clear_pressed().as_ground_potential();
        self.ecp_emer_cancel_on = ecp.emergency_cancel_pressed().as_ground_potential();
        self.ecp_recall = ecp.recall_pressed().as_ground_potential();
        self.ecp_status = ecp.status_pressed().as_ground_potential();

        // LGCIU
        let lgciu1 = lgcius.lgciu1();
        let lgciu2 = lgcius.lgciu2();

        self.ess_lh_lg_compressed = lgciu1.left_gear_compressed(false).as_ground_potential();
        self.norm_lh_lg_compressed = lgciu2.left_gear_compressed(false).as_ground_potential();

        self.eng1_fire_pb_out = engine_fire_overhead.is_released(1).as_ground_potential();
        self.eng2_fire_pb_out = engine_fire_overhead.is_released(2).as_ground_potential();

        self.lgciu_1_discrete_word_1 = lgciu1.discrete_word_1();
        self.lgciu_2_discrete_word_1 = lgciu2.discrete_word_1();
        self.lgciu_1_discrete_word_2 = lgciu1.discrete_word_2();
        self.lgciu_2_discrete_word_2 = lgciu2.discrete_word_2();

        // HYD

        self.blue_sys_lo_pr = hydraulic.is_blue_sys_lo_pr().as_ground_potential();
        self.yellow_sys_lo_pr = hydraulic.is_yellow_sys_lo_pr().as_ground_potential();
        self.green_sys_lo_pr = hydraulic.is_green_sys_lo_pr().as_ground_potential();

        // RAs

        self.radio_height_1 = radio_altimeters.radio_altimeter_1().radio_altitude();
        self.radio_height_2 = radio_altimeters.radio_altimeter_2().radio_altitude();

        // ADIRS

        self.altitude_1 = adirs.altitude(1);
        self.altitude_2 = adirs.altitude(2);
        self.altitude_3 = adirs.altitude(3);

        self.computed_speed_1 = adirs.computed_speed(1);
        self.computed_speed_2 = adirs.computed_speed(2);
        self.computed_speed_3 = adirs.computed_speed(3);

        // FCU

        if self.fcu_alt_changed > Duration::ZERO {
            self.fcu_alt_changed = self
                .fcu_alt_changed
                .checked_sub(context.delta())
                .unwrap_or(Duration::ZERO);
        }
        if self.fcu_selected_altitude_word.value() != self.fcu_last_altitude {
            self.fcu_alt_changed = Duration::from_millis(60 * 8);
        }
        self.fcu_last_altitude = self.fcu_selected_altitude_word.value();
        let mut fcu_word_1 = Arinc429Word::new(0, SignStatus::NormalOperation);
        fcu_word_1.set_bit(13, self.fcu_alt_changed > Duration::ZERO);
        self.fcu_discrete_word_1 = fcu_word_1;

        // Engines

        // Force Channel A in control for now
        let mut ecu_1_word_1 = Arinc429Word::new(0, SignStatus::NormalOperation);
        ecu_1_word_1.set_bit(24, true);
        self.ecu_1a_status_word_1 = ecu_1_word_1;
        self.ecu_1b_status_word_1 = Arinc429Word::new(0, SignStatus::NormalOperation);

        let mut ecu_2_word_1 = Arinc429Word::new(0, SignStatus::NormalOperation);
        ecu_2_word_1.set_bit(24, true);
        self.ecu_2a_status_word_1 = ecu_2_word_1;
        self.ecu_2b_status_word_1 = Arinc429Word::new(0, SignStatus::NormalOperation);

        let mut ecu_1_word_3 = Arinc429Word::new(0, SignStatus::NormalOperation);
        ecu_1_word_3.set_bit(18, engine1.is_above_minimum_idle());
        self.ecu_1a_status_word_3 = ecu_1_word_3;
        self.ecu_1b_status_word_3 = ecu_1_word_3;

        let mut ecu_2_word_3 = Arinc429Word::new(0, SignStatus::NormalOperation);
        ecu_2_word_3.set_bit(18, engine2.is_above_minimum_idle());
        self.ecu_2a_status_word_3 = ecu_2_word_3;
        self.ecu_2b_status_word_3 = ecu_2_word_3;

        let flex_temp_set = self.flex_temp_set;
        let ecu1_gnd = lgciu1.left_gear_compressed(false) || lgciu1.right_gear_compressed(false);
        let mut ecu_1_word_272 = Arinc429Word::new(0, SignStatus::NormalOperation);
        ecu_1_word_272.set_bit(
            16,
            flex_temp_set
                && (ecu1_gnd || self.tla1 >= Angle::new::<degree>(27.1))
                && self.tla1 >= Angle::new::<degree>(-4.3)
                && (!engine1.is_above_minimum_idle() || self.tla1 < Angle::new::<degree>(43.3)),
        );
        self.ecu_1a_word_272 = ecu_1_word_272;
        self.ecu_1b_word_272 = ecu_1_word_272;

        let ecu2_gnd = lgciu2.left_gear_compressed(false) || lgciu2.right_gear_compressed(false);
        let mut ecu_2_word_272 = Arinc429Word::new(0, SignStatus::NormalOperation);
        ecu_2_word_272.set_bit(
            16,
            flex_temp_set
                && (ecu2_gnd || self.tla2 >= Angle::new::<degree>(27.1))
                && self.tla2 >= Angle::new::<degree>(-4.3)
                && (!engine2.is_above_minimum_idle() || self.tla2 < Angle::new::<degree>(43.3)),
        );
        self.ecu_1a_word_272 = ecu_2_word_272;
        self.ecu_1b_word_272 = ecu_2_word_272;

        // DMCs
        let mut dmc_1_discrete_status_word = Arinc429Word::new(0, SignStatus::NormalOperation);
        let mut dmc_2_discrete_status_word = Arinc429Word::new(0, SignStatus::NormalOperation);
        if self.dmc_mda > 0 {
            let mda = Length::new::<foot>(f64::from(self.dmc_mda));
            dmc_1_discrete_status_word.set_bit(
                20,
                self.dmc_1_mda_plus_hundred_conf.update(
                    self.altitude_1.is_normal_operation()
                        && self.altitude_1.value() <= mda + Length::new::<foot>(100.0),
                    context.delta(),
                ),
            );
            dmc_2_discrete_status_word.set_bit(
                20,
                self.dmc_2_mda_plus_hundred_conf.update(
                    self.altitude_2.is_normal_operation()
                        && self.altitude_2.value() <= mda + Length::new::<foot>(100.0),
                    context.delta(),
                ),
            );
            dmc_1_discrete_status_word.set_bit(
                21,
                self.dmc_1_mda_inf_conf.update(
                    self.altitude_1.is_normal_operation()
                        && self.altitude_1.value() <= mda
                        && mda < Length::new::<foot>(20_000.),
                    context.delta(),
                ),
            );
            dmc_2_discrete_status_word.set_bit(
                21,
                self.dmc_2_mda_inf_conf.update(
                    self.altitude_2.is_normal_operation()
                        && self.altitude_2.value() <= mda
                        && mda < Length::new::<foot>(20_000.),
                    context.delta(),
                ),
            );
        }
        self.dmc_1_discrete_status_word = dmc_1_discrete_status_word;
        self.dmc_2_discrete_status_word = dmc_2_discrete_status_word;
    }

    pub fn fwc_ident_side1(&self) -> ElectricPotential {
        (self.number == 1).as_ground_potential()
    }

    pub fn fwc_ident_side2(&self) -> ElectricPotential {
        (self.number == 2).as_ground_potential()
    }

    pub fn ess_lh_lg_compressed(&self) -> ElectricPotential {
        self.ess_lh_lg_compressed
    }

    pub fn norm_lh_lg_compressed(&self) -> ElectricPotential {
        self.norm_lh_lg_compressed
    }

    pub fn blue_sys_lo_pr(&self) -> ElectricPotential {
        self.blue_sys_lo_pr
    }

    pub fn yellow_sys_lo_pr(&self) -> ElectricPotential {
        self.yellow_sys_lo_pr
    }

    pub fn green_sys_lo_pr(&self) -> ElectricPotential {
        self.green_sys_lo_pr
    }

    pub fn ap1_engd_com(&self) -> ElectricPotential {
        self.ap1_engd_com
    }

    pub fn ap1_engd_mon(&self) -> ElectricPotential {
        self.ap1_engd_mon
    }

    pub fn ap2_engd_com(&self) -> ElectricPotential {
        self.ap2_engd_com
    }

    pub fn ap2_engd_mon(&self) -> ElectricPotential {
        self.ap2_engd_mon
    }

    pub fn mw_cancel_on_capt(&self) -> ElectricPotential {
        self.mw_cancel_on_capt
    }

    pub fn mw_cancel_on_fo(&self) -> ElectricPotential {
        self.mw_cancel_on_fo
    }

    pub fn mc_cancel_on_capt(&self) -> ElectricPotential {
        self.mc_cancel_on_capt
    }

    pub fn mc_cancel_on_fo(&self) -> ElectricPotential {
        self.mc_cancel_on_fo
    }

    pub fn ecp_clear(&self) -> ElectricPotential {
        self.ecp_clear
    }

    pub fn ecp_emer_cancel_on(&self) -> ElectricPotential {
        self.ecp_emer_cancel_on
    }

    pub fn ecp_recall(&self) -> ElectricPotential {
        self.ecp_recall
    }

    pub fn ecp_status(&self) -> ElectricPotential {
        self.ecp_status
    }

    pub fn eng1_fire_pb_out(&self) -> ElectricPotential {
        self.eng1_fire_pb_out
    }

    pub fn eng2_fire_pb_out(&self) -> ElectricPotential {
        self.eng2_fire_pb_out
    }

    pub fn gpws_modes_on(&self) -> ElectricPotential {
        self.gpws_modes_on
    }

    pub fn gs_visual_alert_on(&self) -> ElectricPotential {
        self.gs_visual_alert_on
    }

    pub fn tcas_aural_advisory_output(&self) -> ElectricPotential {
        self.tcas_aural_advisory_output
    }

    pub fn ecp_warning_switches_word(&self) -> Arinc429Word<u32> {
        self.ecp_warning_switches_word
    }

    pub fn lgciu_1_discrete_word_1(&self) -> Arinc429Word<u32> {
        self.lgciu_1_discrete_word_1
    }

    pub fn lgciu_2_discrete_word_1(&self) -> Arinc429Word<u32> {
        self.lgciu_2_discrete_word_1
    }

    pub fn lgciu_1_discrete_word_2(&self) -> Arinc429Word<u32> {
        self.lgciu_1_discrete_word_2
    }

    pub fn lgciu_2_discrete_word_2(&self) -> Arinc429Word<u32> {
        self.lgciu_2_discrete_word_2
    }

    pub fn radio_height_1(&self) -> Arinc429Word<Length> {
        self.radio_height_1
    }

    pub fn radio_height_2(&self) -> Arinc429Word<Length> {
        self.radio_height_2
    }

    pub fn computed_speed_1(&self) -> Arinc429Word<Velocity> {
        self.computed_speed_1
    }

    pub fn computed_speed_2(&self) -> Arinc429Word<Velocity> {
        self.computed_speed_2
    }

    pub fn computed_speed_3(&self) -> Arinc429Word<Velocity> {
        self.computed_speed_3
    }

    pub fn altitude_1(&self) -> Arinc429Word<Length> {
        self.altitude_1
    }

    pub fn altitude_2(&self) -> Arinc429Word<Length> {
        self.altitude_2
    }

    pub fn altitude_3(&self) -> Arinc429Word<Length> {
        self.altitude_3
    }

    pub fn mmr_1_glide_slope_deviation(&self) -> Arinc429Word<Ratio> {
        self.mmr_1_glide_slope_deviation
    }

    pub fn mmr_2_glide_slope_deviation(&self) -> Arinc429Word<Ratio> {
        self.mmr_2_glide_slope_deviation
    }

    pub fn eiu_1_word_031(&self) -> Arinc429Word<u32> {
        self.eiu_1_word_031
    }

    pub fn eiu_2_word_031(&self) -> Arinc429Word<u32> {
        self.eiu_2_word_031
    }

    pub fn ecu_1a_tla(&self) -> Arinc429Word<Angle> {
        self.ecu_1a_tla
    }

    pub fn ecu_1b_tla(&self) -> Arinc429Word<Angle> {
        self.ecu_1b_tla
    }

    pub fn ecu_2a_tla(&self) -> Arinc429Word<Angle> {
        self.ecu_2a_tla
    }

    pub fn ecu_2b_tla(&self) -> Arinc429Word<Angle> {
        self.ecu_2b_tla
    }

    pub fn ecu_1a_status_word_1(&self) -> Arinc429Word<u32> {
        self.ecu_1a_status_word_1
    }

    pub fn ecu_1b_status_word_1(&self) -> Arinc429Word<u32> {
        self.ecu_1b_status_word_1
    }

    pub fn ecu_2a_status_word_1(&self) -> Arinc429Word<u32> {
        self.ecu_2a_status_word_1
    }

    pub fn ecu_2b_status_word_1(&self) -> Arinc429Word<u32> {
        self.ecu_2b_status_word_1
    }

    pub fn ecu_1a_status_word_3(&self) -> Arinc429Word<u32> {
        self.ecu_1a_status_word_3
    }

    pub fn ecu_1b_status_word_3(&self) -> Arinc429Word<u32> {
        self.ecu_1b_status_word_3
    }

    pub fn ecu_2a_status_word_3(&self) -> Arinc429Word<u32> {
        self.ecu_2a_status_word_3
    }

    pub fn ecu_2b_status_word_3(&self) -> Arinc429Word<u32> {
        self.ecu_2b_status_word_3
    }

    pub fn ecu_1a_word_272(&self) -> Arinc429Word<u32> {
        self.ecu_1a_word_272
    }

    pub fn ecu_1b_word_272(&self) -> Arinc429Word<u32> {
        self.ecu_1b_word_272
    }

    pub fn ecu_2a_word_272(&self) -> Arinc429Word<u32> {
        self.ecu_2a_word_272
    }

    pub fn ecu_2b_word_272(&self) -> Arinc429Word<u32> {
        self.ecu_2b_word_272
    }

    pub fn fcu_ats_discrete_word(&self) -> Arinc429Word<u32> {
        self.fcu_ats_discrete_word
    }

    pub fn fcu_ap_tcas_word(&self) -> Arinc429Word<u32> {
        self.fcu_ap_tcas_word
    }

    pub fn fcu_selected_altitude_word(&self) -> Arinc429Word<Length> {
        self.fcu_selected_altitude_word
    }

    pub fn fcu_discrete_word_1(&self) -> Arinc429Word<u32> {
        self.fcu_discrete_word_1
    }

    pub fn fmgc_1_discrete_word_1(&self) -> Arinc429Word<u32> {
        self.fmgc_1_discrete_word_1
    }

    pub fn fmgc_2_discrete_word_1(&self) -> Arinc429Word<u32> {
        self.fmgc_2_discrete_word_1
    }

    pub fn fmgc_1_discrete_word_4(&self) -> Arinc429Word<u32> {
        self.fmgc_1_discrete_word_4
    }

    pub fn fmgc_2_discrete_word_4(&self) -> Arinc429Word<u32> {
        self.fmgc_2_discrete_word_4
    }

    pub fn dmc_1_decision_height_word(&self) -> Arinc429Word<Length> {
        self.dmc_1_decision_height_word
    }

    pub fn dmc_2_decision_height_word(&self) -> Arinc429Word<Length> {
        self.dmc_2_decision_height_word
    }

    pub fn dmc_1_discrete_status_word(&self) -> Arinc429Word<u32> {
        self.dmc_1_discrete_status_word
    }

    pub fn dmc_2_discrete_status_word(&self) -> Arinc429Word<u32> {
        self.dmc_2_discrete_status_word
    }

    pub fn audio_synchronization_in(&self) -> ElectricPotential {
        self.audio_synchronization_in
    }

    pub fn synthetic_voice_synchronization_in(&self) -> ElectricPotential {
        self.synthetic_voice_synchronization_in
    }
}

impl SimulationElement for A320FwcInputs {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.mw_cancel_on_capt =
            <SimulatorReader as Read<bool>>::read(reader, &self.mw_cancel_on_capt_id)
                .as_ground_potential();
        self.mw_cancel_on_fo =
            <SimulatorReader as Read<bool>>::read(reader, &self.mw_cancel_on_fo_id)
                .as_ground_potential();
        self.mc_cancel_on_capt =
            <SimulatorReader as Read<bool>>::read(reader, &self.mc_cancel_on_capt_id)
                .as_ground_potential();
        self.mc_cancel_on_fo =
            <SimulatorReader as Read<bool>>::read(reader, &self.mc_cancel_on_fo_id)
                .as_ground_potential();

        // MMR
        let has_glide_slope: bool = reader.read(&self.has_gs_id);
        let glide_slope_ssm = if has_glide_slope {
            SignStatus::NormalOperation
        } else {
            SignStatus::NoComputedData
        };
        let glide_slope_error = Ratio::new::<ratio>(reader.read(&self.gs_deviation_id));
        self.mmr_1_glide_slope_deviation = Arinc429Word::new(glide_slope_error, glide_slope_ssm);
        self.mmr_2_glide_slope_deviation = Arinc429Word::new(glide_slope_error, glide_slope_ssm);

        // EIU
        let eng_1_master_lever: u8 = reader.read(&self.eng1_master_lever_id);
        let mut eiu_1_word = Arinc429Word::new(0, SignStatus::NormalOperation);
        eiu_1_word.set_bit(14, eng_1_master_lever > 0);
        eiu_1_word.set_bit(15, eng_1_master_lever < 1);
        self.eiu_1_word_031 = eiu_1_word;

        let eng_2_master_lever: u8 = reader.read(&self.eng2_master_lever_id);
        let mut eiu_2_word = Arinc429Word::new(0, SignStatus::NormalOperation);
        eiu_2_word.set_bit(14, eng_2_master_lever > 0);
        eiu_2_word.set_bit(15, eng_2_master_lever < 1);
        self.eiu_2_word_031 = eiu_2_word;

        // ECU
        let tla1 = Angle::new::<degree>(reader.read(&self.eng1_tla_id));
        self.tla1 = tla1;
        self.ecu_1a_tla = Arinc429Word::new(tla1, SignStatus::NormalOperation);
        self.ecu_1b_tla = Arinc429Word::new(tla1, SignStatus::NormalOperation);

        let tla2 = Angle::new::<degree>(reader.read(&self.eng2_tla_id));
        self.tla2 = tla2;
        self.ecu_2a_tla = Arinc429Word::new(tla2, SignStatus::NormalOperation);
        self.ecu_2b_tla = Arinc429Word::new(tla2, SignStatus::NormalOperation);

        let flex_temp: u32 = reader.read(&self.flex_temp_id);
        self.flex_temp_set = flex_temp != 0;

        // FMGC
        let ap1_active: bool = reader.read(&self.ap1_active_id);
        self.ap1_engd_com = ap1_active.as_ground_potential();
        self.ap1_engd_mon = ap1_active.as_ground_potential();

        let ap2_active: bool = reader.read(&self.ap2_active_id);
        self.ap2_engd_com = ap2_active.as_ground_potential();
        self.ap2_engd_mon = ap2_active.as_ground_potential();

        let active_vertical_mode: u8 = reader.read(&self.fma_vertical_mode_id);
        let mut fmgc_word_1 = Arinc429Word::new(0, SignStatus::NormalOperation);
        fmgc_word_1.set_bit(15, active_vertical_mode == 40); // PITCH T/O
        fmgc_word_1.set_bit(16, active_vertical_mode == 41); // PITCH G/A
        fmgc_word_1.set_bit(17, active_vertical_mode == 14); // V/S
        fmgc_word_1.set_bit(18, active_vertical_mode == 15); // FPA
        fmgc_word_1.set_bit(19, active_vertical_mode == 15); // ALT
        fmgc_word_1.set_bit(
            20,
            active_vertical_mode == 10 || active_vertical_mode == 20 || active_vertical_mode == 31,
        ); // TRK (aka non-*)
        fmgc_word_1.set_bit(
            21,
            active_vertical_mode == 11 || active_vertical_mode == 21 || active_vertical_mode == 30,
        ); // CAPT (aka *)
        fmgc_word_1.set_bit(22, active_vertical_mode == 30 || active_vertical_mode == 31); // G/S
        fmgc_word_1.set_bit(23, active_vertical_mode == 24); // FINAL
        fmgc_word_1.set_bit(25, active_vertical_mode == 33); // FLARE
        self.fmgc_1_discrete_word_1 = fmgc_word_1;
        self.fmgc_2_discrete_word_1 = fmgc_word_1;

        let active_vertical_mode: u8 = reader.read(&self.fma_vertical_mode_id);
        let mut fmgc_word_1 = Arinc429Word::new(0, SignStatus::NormalOperation);
        fmgc_word_1.set_bit(15, active_vertical_mode == 40); // PITCH T/O
        fmgc_word_1.set_bit(16, active_vertical_mode == 41); // PITCH G/A
        fmgc_word_1.set_bit(17, active_vertical_mode == 14); // V/S
        fmgc_word_1.set_bit(18, active_vertical_mode == 15); // FPA
        fmgc_word_1.set_bit(19, active_vertical_mode == 15); // ALT
        fmgc_word_1.set_bit(
            20,
            active_vertical_mode == 10 || active_vertical_mode == 20 || active_vertical_mode == 31,
        ); // TRK (aka non-*)
        fmgc_word_1.set_bit(
            21,
            active_vertical_mode == 11 || active_vertical_mode == 21 || active_vertical_mode == 30,
        ); // CAPT (aka *)
        fmgc_word_1.set_bit(22, active_vertical_mode == 30 || active_vertical_mode == 31); // G/S
        fmgc_word_1.set_bit(23, active_vertical_mode == 24); // FINAL
        fmgc_word_1.set_bit(25, active_vertical_mode == 33); // FLARE
        self.fmgc_1_discrete_word_1 = fmgc_word_1;
        self.fmgc_2_discrete_word_1 = fmgc_word_1;

        let active_lateral_mode: u8 = reader.read(&self.fma_lateral_mode_id);
        let mut fmgc_word_4 = Arinc429Word::new(0, SignStatus::NormalOperation);
        fmgc_word_4.set_bit(14, (32..=34).contains(&active_lateral_mode)); // LAND TRK
        self.fmgc_1_discrete_word_4 = fmgc_word_4;
        self.fmgc_2_discrete_word_4 = fmgc_word_4;

        // FCU
        let athr_status: u8 = reader.read(&self.autothrust_status_id);
        let mut fcu_ats_word = Arinc429Word::new(0, SignStatus::NormalOperation);
        fcu_ats_word.set_bit(13, athr_status > 0);
        fcu_ats_word.set_bit(14, athr_status == 2);
        self.fcu_ats_discrete_word = fcu_ats_word;

        self.fcu_selected_altitude_word = Arinc429Word::new(
            Length::new::<foot>(reader.read(&self.ap_altitude_lock_id)),
            SignStatus::NormalOperation,
        );

        let mut fcu_ap_tcas_word = Arinc429Word::new(0, SignStatus::NormalOperation);
        fcu_ap_tcas_word.set_bit(11, true); // AP TCAS installed
        fcu_ap_tcas_word.set_bit(13, active_vertical_mode == 50); // TCAS engaged
        self.fcu_ap_tcas_word = fcu_ap_tcas_word;

        // GPWS

        self.gpws_modes_on = <SimulatorReader as Read<bool>>::read(reader, &self.gpws_modes_on_id)
            .as_ground_potential();
        self.gs_visual_alert_on =
            <SimulatorReader as Read<bool>>::read(reader, &self.gs_visual_alert_on_id)
                .as_ground_potential();

        // TCAS

        self.tcas_aural_advisory_output =
            <SimulatorReader as Read<bool>>::read(reader, &self.tcas_aural_advisory_output_id)
                .as_ground_potential();

        // DMC

        let dh: i32 = reader.read(&self.decision_height_id);
        let dmc_decision_height_word = if dh >= 0 {
            Arinc429Word::new(
                Length::new::<foot>(f64::from(dh)),
                SignStatus::NormalOperation,
            )
        } else {
            Arinc429Word::new(Length::ZERO, SignStatus::NoComputedData)
        };
        self.dmc_1_decision_height_word = dmc_decision_height_word;
        self.dmc_2_decision_height_word = dmc_decision_height_word;

        let fmgc_phase: u8 = reader.read(&self.fmgc_flight_phase_id);

        // The FMGC should only send the flight phase when we're in CRZ or greater, and within 200NM
        // of the destination. This is to prevent minimum callouts during preflight/takeoff (and the
        // MDA/MDH shouldn't appear on the FMA). For now, we'll check for CRZ flight phase or
        // greater.
        self.dmc_mda = if fmgc_phase >= 3 {
            reader.read(&self.minimum_descent_altitude_id)
        } else {
            0
        };
    }
}
