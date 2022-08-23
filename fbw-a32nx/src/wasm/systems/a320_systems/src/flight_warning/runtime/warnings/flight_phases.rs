use std::time::Duration;

use super::*;
use systems::flight_warning::logic::*;
use systems::flight_warning::parameters::{SignStatusMatrix, Value};
use systems::flight_warning::utils::{count_true, FwcSsm};
use uom::si::angle::degree;
use uom::si::f64::*;
use uom::si::length::foot;
use uom::si::ratio::percent;
use uom::si::velocity::knot;

pub(in crate::flight_warning::runtime) trait NewGround {
    fn new_ground(&self) -> bool;
    fn lgciu_12_inv(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct NewGroundActivation {
    conf1: ConfirmationNode,
    conf2: ConfirmationNode,
    conf3: ConfirmationNode,
    conf4: ConfirmationNode,
    memory1: MemoryNode,
    memory2: MemoryNode,
    new_ground: bool,
    lgciu_12_inv: bool,
}

impl Default for NewGroundActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new_leading(Duration::from_secs_f64(1.0)),
            conf2: ConfirmationNode::new_leading(Duration::from_secs_f64(0.5)),
            conf3: ConfirmationNode::new_leading(Duration::from_secs_f64(1.0)),
            conf4: ConfirmationNode::new_leading(Duration::from_secs_f64(0.5)),
            memory1: MemoryNode::new(true),
            memory2: MemoryNode::new(true),
            new_ground: false,
            lgciu_12_inv: false,
        }
    }
}

impl NewGroundActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl LhLgCompressed + EssLhLgCompressed + NormLhLgCompressed),
    ) {
        let xor1 = signals.lh_lg_compressed(1).value() ^ signals.ess_lh_lg_compressed().value();
        let conf1_out = self.conf1.update(xor1, delta);
        let set_memory1 = signals.lh_lg_compressed(1).is_ncd()
            || signals.lh_lg_compressed(1).is_inv()
            || conf1_out;

        let memory1_out = self
            .memory1
            .update(set_memory1, self.conf2.update(!xor1, delta));

        let xor3 = signals.lh_lg_compressed(2).value() ^ signals.norm_lh_lg_compressed().value();
        let conf3_out = self.conf3.update(xor3, delta);
        let set_memory2 = signals.lh_lg_compressed(2).is_ncd()
            || signals.lh_lg_compressed(2).is_inv()
            || conf3_out;
        let memory2_out = self
            .memory2
            .update(set_memory2, self.conf4.update(!xor3, delta));

        let op1 = signals.lh_lg_compressed(1).value() && signals.ess_lh_lg_compressed().value();
        let op2 = signals.lh_lg_compressed(2).value() && signals.norm_lh_lg_compressed().value();

        self.new_ground = op1 && op2;
        self.lgciu_12_inv = memory1_out || memory2_out;
    }
}

impl NewGround for NewGroundActivation {
    fn new_ground(&self) -> bool {
        self.new_ground
    }
    fn lgciu_12_inv(&self) -> bool {
        self.lgciu_12_inv
    }
}

pub(in crate::flight_warning::runtime) trait GroundDetection {
    fn ground(&self) -> bool;
    fn ground_immediate(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct GroundDetectionActivation {
    memory1: MemoryNode,
    memory2: MemoryNode,
    conf1: ConfirmationNode,
    mrtrig1: MonostableTriggerNode,
    ground_immediate: bool,
    ground: bool,
}

impl Default for GroundDetectionActivation {
    fn default() -> Self {
        Self {
            memory1: MemoryNode::new(true),
            memory2: MemoryNode::new(true),
            conf1: ConfirmationNode::new(true, Duration::from_secs(1)),
            mrtrig1: MonostableTriggerNode::new_retriggerable(true, Duration::from_secs(10)),
            ground_immediate: false,
            ground: false,
        }
    }
}

impl GroundDetectionActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl EssLhLgCompressed + NormLhLgCompressed + RadioHeight),
        lgciu_ground: &impl NewGround,
    ) {
        let radio_1_ncd = signals.radio_height(1).is_ncd();
        let radio_1_inv = signals.radio_height(1).is_inv();
        let radio_2_ncd = signals.radio_height(2).is_ncd();
        let radio_2_inv = signals.radio_height(2).is_inv();

        let reset_memory =
            !signals.ess_lh_lg_compressed().value() || !signals.norm_lh_lg_compressed().value();
        let set_memory_1 = signals.radio_height(1).value() < Length::new::<foot>(5.0);
        let memory1_out = self.memory1.update(set_memory_1, reset_memory);

        let set_memory_2 = signals.radio_height(2).value() < Length::new::<foot>(5.0);
        let memory2_out = self.memory2.update(set_memory_2, reset_memory);

        let radio_1_on_gnd = (memory1_out || set_memory_1) && !radio_1_ncd && !radio_1_inv;
        let radio_2_on_gnd = (memory2_out || set_memory_2) && !radio_2_ncd && !radio_2_inv;

        let ground_signals = [
            signals.ess_lh_lg_compressed().value(),
            signals.norm_lh_lg_compressed().value(),
            radio_1_on_gnd,
            radio_2_on_gnd,
        ];
        let more_than_2 = count_true(ground_signals) > 2;
        let more_than_1 = count_true(ground_signals) > 1;

        let any_radio_inv = radio_1_inv || radio_2_inv;
        let gnd_cond1 = more_than_2 && !any_radio_inv;
        let gnd_cond2 = more_than_1 && any_radio_inv;

        let mrtrig_in = radio_1_ncd && radio_2_ncd && !lgciu_ground.lgciu_12_inv();
        let trig_ground = self.mrtrig1.update(mrtrig_in, delta) && lgciu_ground.new_ground();

        self.ground_immediate = (gnd_cond1 || gnd_cond2) || trig_ground;
        self.ground = self.conf1.update(self.ground_immediate, delta);
    }
}

impl GroundDetection for GroundDetectionActivation {
    fn ground(&self) -> bool {
        self.ground
    }
    fn ground_immediate(&self) -> bool {
        self.ground_immediate
    }
}

pub(in crate::flight_warning::runtime) trait SpeedDetection {
    fn ac_speed_above_80_kt(&self) -> bool;

    fn adc_test_inhib(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct SpeedDetectionActivation {
    conf1: ConfirmationNode,
    conf2: ConfirmationNode,
    conf3: ConfirmationNode,
    memory: MemoryNode,
    mtrig1: MonostableTriggerNode,
    mtrig2: MonostableTriggerNode,
    ac_speed_above_80_kt: bool,
    adc_test_inhib: bool,
}

impl Default for SpeedDetectionActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new(true, Duration::from_secs(1)),
            conf2: ConfirmationNode::new(true, Duration::from_secs(1)),
            conf3: ConfirmationNode::new(true, Duration::from_secs(1)),
            memory: MemoryNode::new(true),
            mtrig1: MonostableTriggerNode::new_falling(Duration::from_secs_f64(0.5)),
            mtrig2: MonostableTriggerNode::new_falling(Duration::from_secs_f64(1.5)),
            ac_speed_above_80_kt: false,
            adc_test_inhib: false,
        }
    }
}

impl SpeedDetectionActivation {
    pub fn update(&mut self, delta: Duration, signals: &impl ComputedSpeed) {
        let adc_1_invalid =
            signals.computed_speed(1).is_inv() || signals.computed_speed(1).is_ncd();
        let adc_2_invalid =
            signals.computed_speed(2).is_inv() || signals.computed_speed(2).is_ncd();
        let adc_3_invalid =
            signals.computed_speed(3).is_inv() || signals.computed_speed(3).is_ncd();
        let any_adc_invalid = adc_1_invalid || adc_2_invalid || adc_3_invalid;

        let conf1_out = self.conf1.update(
            signals.computed_speed(1).value() > Velocity::new::<knot>(50.0) && !adc_1_invalid,
            delta,
        );
        let conf2_out = self.conf2.update(
            signals.computed_speed(2).value() > Velocity::new::<knot>(50.0) && !adc_2_invalid,
            delta,
        );
        let conf3_out = self.conf3.update(
            signals.computed_speed(3).value() > Velocity::new::<knot>(50.0) && !adc_3_invalid,
            delta,
        );

        let adc_1_above_80_kt = conf1_out
            && !adc_1_invalid
            && signals.computed_speed(1).value() > Velocity::new::<knot>(83.);
        let adc_2_above_80_kt = conf2_out
            && !adc_2_invalid
            && signals.computed_speed(2).value() > Velocity::new::<knot>(83.);
        let adc_3_above_80_kt = conf3_out
            && !adc_3_invalid
            && signals.computed_speed(3).value() > Velocity::new::<knot>(83.);
        let any_adc_above_80_kt = adc_1_above_80_kt || adc_2_above_80_kt || adc_3_above_80_kt;

        let sets = [
            adc_1_above_80_kt,
            adc_2_above_80_kt,
            adc_3_above_80_kt,
            any_adc_above_80_kt && any_adc_invalid,
        ];
        let set_memory = count_true(sets) > 1;

        let adc_1_below_77_kt =
            signals.computed_speed(1).value() < Velocity::new::<knot>(77.) && !adc_1_invalid;
        let adc_2_below_77_kt =
            signals.computed_speed(2).value() < Velocity::new::<knot>(77.) && !adc_2_invalid;
        let adc_3_below_77_kt =
            signals.computed_speed(3).value() < Velocity::new::<knot>(77.) && !adc_3_invalid;
        let any_adc_below_77_kt = adc_1_below_77_kt || adc_2_below_77_kt || adc_3_below_77_kt;

        let any_adc_fault = signals.computed_speed(1).is_ft()
            || signals.computed_speed(2).is_ft()
            || signals.computed_speed(3).is_ft();

        let mtrig1_out = self.mtrig1.update(any_adc_fault, delta);
        let resets = [
            adc_1_below_77_kt,
            adc_2_below_77_kt,
            adc_3_below_77_kt,
            any_adc_below_77_kt && any_adc_invalid,
        ];
        let reset_memory = count_true(resets) > 1 || mtrig1_out;

        self.ac_speed_above_80_kt = self.memory.update(set_memory, reset_memory);
        self.adc_test_inhib = self.mtrig2.update(any_adc_fault, delta);
    }
}

impl SpeedDetection for SpeedDetectionActivation {
    fn ac_speed_above_80_kt(&self) -> bool {
        self.ac_speed_above_80_kt
    }
    fn adc_test_inhib(&self) -> bool {
        self.adc_test_inhib
    }
}

pub(in crate::flight_warning::runtime) trait EngineNotRunningCfm {
    fn eng_1_not_running(&self) -> bool;
    fn eng_2_not_running(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct EngineNotRunningCfmActivation {
    trans1: TransientDetectionNode,
    conf1: ConfirmationNode,
    conf2: ConfirmationNode,
    conf3: ConfirmationNode,
    conf4: ConfirmationNode,
    conf5: ConfirmationNode,
    eng_1_not_running: bool,
    eng_2_not_running: bool,
}

impl Default for EngineNotRunningCfmActivation {
    fn default() -> Self {
        Self {
            trans1: TransientDetectionNode::new(true),
            conf1: ConfirmationNode::new_leading(Duration::from_secs(30)),
            conf2: ConfirmationNode::new_leading(Duration::from_secs(30)),
            conf3: ConfirmationNode::new_leading(Duration::from_secs(30)),
            conf4: ConfirmationNode::new_leading(Duration::from_secs(30)),
            conf5: ConfirmationNode::new_falling(Duration::from_secs(31)),
            eng_1_not_running: false,
            eng_2_not_running: false,
        }
    }
}

impl EngineNotRunningCfmActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl Eng1MasterLeverSelect
              + Eng1CoreSpeedAtOrAboveIdle
              + Eng1FirePbOut
              + Eng2CoreSpeedAtOrAboveIdle
              + Eng2MasterLeverSelect),
        ground: &impl GroundDetection,
    ) {
        let eng1_core_speed_at_or_above_idle_a = signals.eng1_core_speed_at_or_above_idle(1);
        let eng1_core_speed_at_or_above_idle_b = signals.eng1_core_speed_at_or_above_idle(2);

        let conf5_out = self.conf5.update(
            self.trans1.update(signals.eng_1_fire_pb_out().value()),
            delta,
        );
        let flying = !ground.ground();

        let conf1_out = self
            .conf1
            .update(eng1_core_speed_at_or_above_idle_a.value(), delta);

        let conf2_out = self
            .conf2
            .update(eng1_core_speed_at_or_above_idle_b.value(), delta);

        let eng_1_core_speed_not_running_conf = !conf1_out && !conf2_out;
        let eng_1_core_speed_inhibit = eng1_core_speed_at_or_above_idle_a.value()
            && eng1_core_speed_at_or_above_idle_b.value()
            && conf5_out
            && flying;

        let eng_1_core_speed_not_running =
            eng_1_core_speed_not_running_conf && !eng_1_core_speed_inhibit;

        let eng_1_master_lever_valid_and_off = signals.eng1_master_lever_select_on().is_val()
            && !signals.eng1_master_lever_select_on().value();

        self.eng_1_not_running = eng_1_master_lever_valid_and_off || eng_1_core_speed_not_running;

        let eng2_core_speed_at_or_above_idle_a = signals.eng2_core_speed_at_or_above_idle(1);
        let eng2_core_speed_at_or_above_idle_b = signals.eng2_core_speed_at_or_above_idle(2);

        let conf3_out = self
            .conf3
            .update(eng2_core_speed_at_or_above_idle_a.value(), delta);

        let conf4_out = self
            .conf4
            .update(eng2_core_speed_at_or_above_idle_b.value(), delta);

        let eng_2_core_speed_inhibit = eng2_core_speed_at_or_above_idle_b.value()
            && eng2_core_speed_at_or_above_idle_a.value()
            && conf5_out
            && flying;

        let eng_2_core_speed_not_running_conf = !conf3_out && !conf4_out;

        let eng_2_core_speed_not_running =
            !eng_2_core_speed_inhibit && eng_2_core_speed_not_running_conf;

        let eng_2_master_lever_valid_and_off = signals.eng2_master_lever_select_on().is_val()
            && !signals.eng2_master_lever_select_on().value();

        self.eng_2_not_running = eng_2_core_speed_not_running || eng_2_master_lever_valid_and_off;
    }
}

impl EngineNotRunningCfm for EngineNotRunningCfmActivation {
    fn eng_1_not_running(&self) -> bool {
        self.eng_1_not_running
    }

    fn eng_2_not_running(&self) -> bool {
        self.eng_2_not_running
    }
}

pub(in crate::flight_warning::runtime) trait EngRunning {
    fn eng_1_and_2_not_running(&self) -> bool;
    fn eng_1_or_2_running(&self) -> bool;
    fn one_eng_running(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct EngRunningActivation {
    conf1: ConfirmationNode,
    eng_1_and_2_not_running: bool,
    eng_1_or_2_running: bool,
    one_eng_running: bool,
}

impl Default for EngRunningActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new(true, Duration::from_secs(30)),
            eng_1_and_2_not_running: false,
            eng_1_or_2_running: false,
            one_eng_running: false,
        }
    }
}

impl EngRunningActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl Eng1CoreSpeedAtOrAboveIdle + Eng2CoreSpeedAtOrAboveIdle),
        engine_not_running: &impl EngineNotRunningCfm,
    ) {
        self.eng_1_and_2_not_running =
            engine_not_running.eng_1_not_running() && engine_not_running.eng_2_not_running();
        let one_eng_running = signals.eng1_core_speed_at_or_above_idle(1).value()
            || signals.eng1_core_speed_at_or_above_idle(2).value()
            || signals.eng2_core_speed_at_or_above_idle(1).value()
            || signals.eng2_core_speed_at_or_above_idle(2).value();

        self.one_eng_running = one_eng_running;
        self.eng_1_or_2_running = self.conf1.update(one_eng_running, delta);
    }
}

impl EngRunning for EngRunningActivation {
    fn eng_1_and_2_not_running(&self) -> bool {
        self.eng_1_and_2_not_running
    }

    fn eng_1_or_2_running(&self) -> bool {
        self.eng_1_or_2_running
    }

    fn one_eng_running(&self) -> bool {
        self.one_eng_running
    }
}

pub(in crate::flight_warning::runtime) trait EngTakeOffCfm {
    fn eng1_to_cfm(&self) -> bool;
    fn eng2_to_cfm(&self) -> bool;
    fn tla1_idle_pwr_cfm(&self) -> bool;
    fn tla2_idle_pwr_cfm(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct EngTakeOffCfmActivation {
    eng1_to_cfm: bool,
    eng2_to_cfm: bool,
    tla1_idle_pwr_cfm: bool,
    tla2_idle_pwr_cfm: bool,
}

impl EngTakeOffCfmActivation {
    pub fn update(
        &mut self,
        signals: &(impl Eng1N1SelectedActual
              + Eng2N1SelectedActual
              + Tla1IdlePwr
              + Tla2IdlePwr
              + Eng1ChannelInControl
              + Eng2ChannelInControl),
    ) {
        let is_cfm = true;

        let eng1_n1_selected_actual_a = signals.eng1_n1_selected_actual(1);
        let eng1_n1_selected_actual_b = signals.eng1_n1_selected_actual(2);

        let eng1_n1_abv_95_a = !(eng1_n1_selected_actual_a.is_inv()
            || eng1_n1_selected_actual_a.is_ncd())
            && eng1_n1_selected_actual_a.value() > Ratio::new::<percent>(95.);
        let eng1_n1_abv_95_b = !(eng1_n1_selected_actual_b.is_inv()
            || eng1_n1_selected_actual_b.is_ncd())
            && eng1_n1_selected_actual_b.value() > Ratio::new::<percent>(95.);

        self.eng1_to_cfm = is_cfm && (eng1_n1_abv_95_a || eng1_n1_abv_95_b);

        let eng2_n1_selected_actual_a = signals.eng2_n1_selected_actual(1);
        let eng2_n1_selected_actual_b = signals.eng2_n1_selected_actual(2);

        let eng2_n1_abv_95_a = !(eng2_n1_selected_actual_a.is_inv()
            || eng2_n1_selected_actual_a.is_ncd())
            && eng2_n1_selected_actual_a.value() > Ratio::new::<percent>(95.);
        let eng2_n1_abv_95_b = !(eng2_n1_selected_actual_b.is_inv()
            || eng2_n1_selected_actual_b.is_ncd())
            && eng2_n1_selected_actual_b.value() > Ratio::new::<percent>(95.);

        self.eng2_to_cfm = is_cfm && (eng2_n1_abv_95_a || eng2_n1_abv_95_b);

        let eng1_channel_a_in_control = signals.eng1_channel_a_in_control().value();
        let eng1_channel_b_in_control = signals.eng1_channel_b_in_control().value();

        self.tla1_idle_pwr_cfm = is_cfm
            && ((eng1_channel_a_in_control && signals.tla1_idle_pwr(1).value())
                || (eng1_channel_b_in_control && signals.tla1_idle_pwr(2).value()));

        let eng2_channel_a_in_control = signals.eng2_channel_a_in_control().value();
        let eng2_channel_b_in_control = signals.eng2_channel_b_in_control().value();

        self.tla2_idle_pwr_cfm = is_cfm
            && ((eng2_channel_a_in_control && signals.tla2_idle_pwr(1).value())
                || (eng2_channel_b_in_control && signals.tla2_idle_pwr(2).value()));
    }
}

impl EngTakeOffCfm for EngTakeOffCfmActivation {
    fn eng1_to_cfm(&self) -> bool {
        self.eng1_to_cfm
    }

    fn eng2_to_cfm(&self) -> bool {
        self.eng2_to_cfm
    }

    fn tla1_idle_pwr_cfm(&self) -> bool {
        self.tla1_idle_pwr_cfm
    }

    fn tla2_idle_pwr_cfm(&self) -> bool {
        self.tla2_idle_pwr_cfm
    }
}

pub(in crate::flight_warning::runtime) trait NeoEcu {
    fn eng_1_auto_toga(&self) -> bool;
    fn eng_1_limit_mode_soft_ga(&self) -> bool;
    fn eng_2_auto_toga(&self) -> bool;
    fn eng_2_limit_mode_soft_ga(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct NeoEcuActivation {
    eng_1_auto_toga: bool,
    eng_1_limit_mode_soft_ga: bool,
    eng_2_auto_toga: bool,
    eng_2_limit_mode_soft_ga: bool,
}

impl NeoEcuActivation {
    pub fn update(
        &mut self,
        signals: &(impl Eng1AutoToga + Eng1LimitModeSoftGa + Eng2AutoToga + Eng2LimitModeSoftGa),
    ) {
        self.eng_1_auto_toga =
            signals.eng_1_auto_toga(1).value() || signals.eng_1_auto_toga(2).value();
        self.eng_1_limit_mode_soft_ga = signals.eng_1_limit_mode_soft_ga(1).value()
            || signals.eng_1_limit_mode_soft_ga(2).value();
        self.eng_2_auto_toga =
            signals.eng_2_auto_toga(1).value() || signals.eng_2_auto_toga(2).value();
        self.eng_2_limit_mode_soft_ga = signals.eng_2_limit_mode_soft_ga(1).value()
            || signals.eng_2_limit_mode_soft_ga(2).value();
    }
}

impl NeoEcu for NeoEcuActivation {
    fn eng_1_auto_toga(&self) -> bool {
        self.eng_1_auto_toga
    }

    fn eng_1_limit_mode_soft_ga(&self) -> bool {
        self.eng_1_limit_mode_soft_ga
    }

    fn eng_2_auto_toga(&self) -> bool {
        self.eng_2_auto_toga
    }

    fn eng_2_limit_mode_soft_ga(&self) -> bool {
        self.eng_2_limit_mode_soft_ga
    }
}

pub(in crate::flight_warning::runtime) trait TlaAtMctOrFlexToCfm {
    fn eng_1_tla_mct_cfm(&self) -> bool;
    fn eng_1_end_mct(&self) -> bool;
    fn eng_1_sup_mct_cfm(&self) -> bool;
    fn eng_2_tla_mct_cfm(&self) -> bool;
    fn eng_2_end_mct(&self) -> bool;
    fn eng_2_sup_mct_cfm(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct TlaAtMctOrFlexToCfmActivation {
    eng_1_tla_mct_cfm: bool,
    eng_1_end_mct: bool,
    eng_1_sup_mct_cfm: bool,
    eng_2_tla_mct_cfm: bool,
    eng_2_end_mct: bool,
    eng_2_sup_mct_cfm: bool,
}

impl TlaAtMctOrFlexToCfmActivation {
    pub fn update(&mut self, signals: &(impl Eng1TlaCfm + Eng2TlaCfm)) {
        let any_cfm = true;

        // Engine 1

        let eng1_a_lt_36 = signals.eng1_tla(1).value() < Angle::new::<degree>(36.7);
        let eng1_a_val = signals.eng1_tla(1).is_val();
        let eng1_a_gt_33 = signals.eng1_tla(1).value() > Angle::new::<degree>(33.3);
        let eng1_a_tla_mct_cfm = eng1_a_lt_36 && eng1_a_val && eng1_a_gt_33;

        let eng1_b_lt_36 = signals.eng1_tla(2).value() < Angle::new::<degree>(36.7);
        let eng1_b_val = signals.eng1_tla(2).is_val();
        let eng1_b_gt_33 = signals.eng1_tla(2).value() > Angle::new::<degree>(33.3);
        let eng1_b_tla_mct_cfm = eng1_b_lt_36 && eng1_b_val && eng1_b_gt_33;

        self.eng_1_tla_mct_cfm = any_cfm && (eng1_a_tla_mct_cfm || eng1_b_tla_mct_cfm);

        let eng1_a_gt_36 = signals.eng1_tla(1).value() > Angle::new::<degree>(36.6);
        let eng1_a_end_mct = eng1_a_lt_36 && eng1_a_val && eng1_a_gt_36;

        let eng1_b_gt_36 = signals.eng1_tla(2).value() > Angle::new::<degree>(36.6);
        let eng1_b_end_mct = eng1_b_lt_36 && eng1_b_val && eng1_b_gt_36;

        self.eng_1_end_mct = eng1_a_end_mct || eng1_b_end_mct;

        let eng1_a_sup_mct_cfm = !eng1_a_lt_36 && eng1_a_val;
        let eng1_b_sup_mct_cfm = !eng1_b_lt_36 && eng1_b_val;

        self.eng_1_sup_mct_cfm = any_cfm && (eng1_a_sup_mct_cfm || eng1_b_sup_mct_cfm);

        // Engine 2

        let eng2_a_lt_36 = signals.eng2_tla(1).value() < Angle::new::<degree>(36.7);
        let eng2_a_val = signals.eng2_tla(1).is_val();
        let eng2_a_gt_33 = signals.eng2_tla(1).value() > Angle::new::<degree>(33.3);
        let eng2_a_tla_mct_cfm = eng2_a_lt_36 && eng2_a_val && eng2_a_gt_33;

        let eng2_b_lt_36 = signals.eng2_tla(2).value() < Angle::new::<degree>(36.7);
        let eng2_b_val = signals.eng2_tla(2).is_val();
        let eng2_b_gt_33 = signals.eng2_tla(2).value() > Angle::new::<degree>(33.3);
        let eng2_b_tla_mct_cfm = eng2_b_lt_36 && eng2_b_val && eng2_b_gt_33;

        self.eng_2_tla_mct_cfm = any_cfm && (eng2_a_tla_mct_cfm || eng2_b_tla_mct_cfm);

        let eng2_a_gt_36 = signals.eng2_tla(1).value() > Angle::new::<degree>(36.6);
        let eng2_a_end_mct = eng2_a_lt_36 && eng2_a_val && eng2_a_gt_36;

        let eng2_b_gt_36 = signals.eng2_tla(2).value() > Angle::new::<degree>(36.6);
        let eng2_b_end_mct = eng2_b_lt_36 && eng2_b_val && eng2_b_gt_36;

        self.eng_2_end_mct = eng2_a_end_mct || eng2_b_end_mct;

        let eng2_a_sup_mct_cfm = !eng2_a_lt_36 && eng2_a_val;
        let eng2_b_sup_mct_cfm = !eng2_b_lt_36 && eng2_b_val;

        self.eng_2_sup_mct_cfm = any_cfm && (eng2_a_sup_mct_cfm || eng2_b_sup_mct_cfm);
    }
}

impl TlaAtMctOrFlexToCfm for TlaAtMctOrFlexToCfmActivation {
    fn eng_1_tla_mct_cfm(&self) -> bool {
        self.eng_1_tla_mct_cfm
    }

    fn eng_1_end_mct(&self) -> bool {
        self.eng_1_end_mct
    }

    fn eng_1_sup_mct_cfm(&self) -> bool {
        self.eng_1_sup_mct_cfm
    }

    fn eng_2_tla_mct_cfm(&self) -> bool {
        self.eng_2_tla_mct_cfm
    }

    fn eng_2_end_mct(&self) -> bool {
        self.eng_2_end_mct
    }

    fn eng_2_sup_mct_cfm(&self) -> bool {
        self.eng_2_sup_mct_cfm
    }
}

pub(in crate::flight_warning::runtime) trait TlaPwrReverse {
    fn eng_1_tla_full_pwr_cfm(&self) -> bool;
    fn eng_1_tla_reverse_cfm(&self) -> bool;
    fn eng_2_tla_full_pwr_cfm(&self) -> bool;
    fn eng_2_tla_reverse_cfm(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct TlaPwrReverseActivation {
    conf1: ConfirmationNode,
    conf2: ConfirmationNode,
    eng_1_tla_full_pwr_cfm: bool,
    eng_1_tla_reverse_cfm: bool,
    eng_2_tla_full_pwr_cfm: bool,
    eng_2_tla_reverse_cfm: bool,
}

impl Default for TlaPwrReverseActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new_falling(Duration::from_secs(10)),
            conf2: ConfirmationNode::new_falling(Duration::from_secs(10)),
            eng_1_tla_full_pwr_cfm: false,
            eng_1_tla_reverse_cfm: false,
            eng_2_tla_full_pwr_cfm: false,
            eng_2_tla_reverse_cfm: false,
        }
    }
}

impl TlaPwrReverseActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl Eng1TlaCfm + Eng2TlaCfm),
        eng_take_off_cfm: &impl EngTakeOffCfm,
    ) {
        let any_cfm = true;

        // Engine 1

        let eng1_a_lt_m4 = signals.eng1_tla(1).value() < Angle::new::<degree>(-4.3);
        let eng1_b_lt_m4 = signals.eng1_tla(2).value() < Angle::new::<degree>(-4.3);

        let eng1_a_inv = signals.eng1_tla(1).is_inv() || signals.eng1_tla(1).is_ncd();
        let eng1_b_inv = signals.eng1_tla(2).is_inv() || signals.eng1_tla(2).is_ncd();

        let eng1_a_tla_reverse = eng1_a_lt_m4 && !eng1_a_inv;
        let eng1_b_tla_reverse = eng1_b_lt_m4 && !eng1_b_inv;
        let eng1_tla_reverse = eng1_a_tla_reverse || eng1_b_tla_reverse;
        self.eng_1_tla_reverse_cfm = any_cfm && eng1_tla_reverse;

        let eng1_a_gt_43 = signals.eng1_tla(1).value() > Angle::new::<degree>(43.3);
        let eng1_b_gt_43 = signals.eng1_tla(2).value() > Angle::new::<degree>(43.3);

        let conf1_in = eng1_tla_reverse;
        let conf1_out = self.conf1.update(conf1_in, delta);
        let eng_1_tla_full_pwr_cond = conf1_in || conf1_out;

        let eng1_to_conf = eng_take_off_cfm.eng1_to_cfm() && !eng_1_tla_full_pwr_cond;

        self.eng_1_tla_full_pwr_cfm = any_cfm && (eng1_a_gt_43 || eng1_to_conf || eng1_b_gt_43);

        // Engine 2

        let eng2_a_lt_m4 = signals.eng2_tla(1).value() < Angle::new::<degree>(-4.3);
        let eng2_b_lt_m4 = signals.eng2_tla(2).value() < Angle::new::<degree>(-4.3);

        let eng2_a_inv = signals.eng2_tla(1).is_inv() || signals.eng2_tla(1).is_ncd();
        let eng2_b_inv = signals.eng2_tla(2).is_inv() || signals.eng2_tla(2).is_ncd();

        let eng2_a_tla_reverse = eng2_a_lt_m4 && !eng2_a_inv;
        let eng2_b_tla_reverse = eng2_b_lt_m4 && !eng2_b_inv;
        let eng2_tla_reverse = eng2_a_tla_reverse || eng2_b_tla_reverse;
        self.eng_2_tla_reverse_cfm = any_cfm && eng2_tla_reverse;

        let eng2_a_gt_43 = signals.eng2_tla(1).value() > Angle::new::<degree>(43.3);
        let eng2_b_gt_43 = signals.eng2_tla(2).value() > Angle::new::<degree>(43.3);

        let conf2_in = eng2_tla_reverse;
        let conf2_out = self.conf2.update(conf1_in, delta);
        let eng_2_tla_full_pwr_cond = conf2_in || conf2_out;

        let eng2_to_conf = eng_take_off_cfm.eng2_to_cfm() && !eng_2_tla_full_pwr_cond;

        self.eng_2_tla_full_pwr_cfm = any_cfm && (eng2_a_gt_43 || eng2_to_conf || eng2_b_gt_43);
    }
}

impl TlaPwrReverse for TlaPwrReverseActivation {
    fn eng_1_tla_full_pwr_cfm(&self) -> bool {
        self.eng_1_tla_full_pwr_cfm
    }

    fn eng_1_tla_reverse_cfm(&self) -> bool {
        self.eng_1_tla_reverse_cfm
    }

    fn eng_2_tla_full_pwr_cfm(&self) -> bool {
        self.eng_2_tla_full_pwr_cfm
    }

    fn eng_2_tla_reverse_cfm(&self) -> bool {
        self.eng_2_tla_reverse_cfm
    }
}

pub(in crate::flight_warning::runtime) trait TlaAtClCfm {
    fn eng_1_tla_cl_cfm(&self) -> bool;
    fn eng_12_mcl_cfm(&self) -> bool;
    fn eng_2_tla_cl_cfm(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct TlaAtClCfmActivation {
    eng_1_tla_cl_cfm: bool,
    eng_12_mcl_cfm: bool,
    eng_2_tla_cl_cfm: bool,
}

impl TlaAtClCfmActivation {
    pub fn update(&mut self, _delta: Duration, signals: &(impl Eng1TlaCfm + Eng2TlaCfm)) {
        let any_cfm = true;

        // Engine 1

        let eng1_a_lt_27 = signals.eng1_tla(1).value() < Angle::new::<degree>(27.1);
        let eng1_a_gt_22 = signals.eng1_tla(1).value() > Angle::new::<degree>(22.9);
        let eng1_a_val = signals.eng1_tla(1).is_val();
        let eng1_a_tla_cl = eng1_a_lt_27 && eng1_a_gt_22 && eng1_a_val;

        let eng1_b_lt_27 = signals.eng1_tla(2).value() < Angle::new::<degree>(27.1);
        let eng1_b_gt_22 = signals.eng1_tla(2).value() > Angle::new::<degree>(22.9);
        let eng1_b_val = signals.eng1_tla(2).is_val();
        let eng1_b_tla_cl = eng1_b_lt_27 && eng1_b_gt_22 && eng1_b_val;

        self.eng_1_tla_cl_cfm = any_cfm && (eng1_a_tla_cl || eng1_b_tla_cl);

        // Engine 2

        let eng2_a_lt_27 = signals.eng2_tla(1).value() < Angle::new::<degree>(27.1);
        let eng2_a_gt_22 = signals.eng2_tla(1).value() > Angle::new::<degree>(22.9);
        let eng2_a_val = signals.eng2_tla(1).is_val();
        let eng2_a_tla_cl = eng2_a_lt_27 && eng2_a_gt_22 && eng2_a_val;

        let eng2_b_lt_27 = signals.eng2_tla(2).value() < Angle::new::<degree>(27.1);
        let eng2_b_gt_22 = signals.eng2_tla(2).value() > Angle::new::<degree>(22.9);
        let eng2_b_val = signals.eng2_tla(2).is_val();
        let eng2_b_tla_cl = eng2_b_lt_27 && eng2_b_gt_22 && eng2_b_val;

        self.eng_2_tla_cl_cfm = any_cfm && (eng2_a_tla_cl || eng2_b_tla_cl);

        // Engine 1 + 2

        let eng1_a_mcl = eng1_a_val && eng1_a_gt_22;
        let eng1_b_mcl = eng1_b_val && eng1_b_gt_22;
        let eng1_mcl = eng1_a_mcl || eng1_b_mcl;

        let eng2_a_mcl = eng2_a_val && eng2_a_gt_22;
        let eng2_b_mcl = eng2_b_val && eng2_b_gt_22;
        let eng2_mcl = eng2_a_mcl || eng2_b_mcl;

        self.eng_12_mcl_cfm = any_cfm && eng1_mcl && eng2_mcl;
    }
}

impl TlaAtClCfm for TlaAtClCfmActivation {
    fn eng_1_tla_cl_cfm(&self) -> bool {
        self.eng_1_tla_cl_cfm
    }

    fn eng_12_mcl_cfm(&self) -> bool {
        self.eng_12_mcl_cfm
    }

    fn eng_2_tla_cl_cfm(&self) -> bool {
        self.eng_2_tla_cl_cfm
    }
}

pub(in crate::flight_warning::runtime) trait CfmFlightPhasesDef {
    fn cfm_flex(&self) -> bool;
    fn eng_1_or_2_to_pwr(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct CfmFlightPhasesDefActivation {
    conf1: ConfirmationNode,
    cfm_flex: bool,
    eng_1_or_2_to_pwr: bool,
}

impl Default for CfmFlightPhasesDefActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new_falling(Duration::from_secs(60)),
            cfm_flex: false,
            eng_1_or_2_to_pwr: false,
        }
    }
}

impl CfmFlightPhasesDefActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl Eng1TlaFto + Eng2TlaFto),
        neo_def: &impl NeoEcu,
        tla_mct_or_flex_to: &impl TlaAtMctOrFlexToCfm,
        tla_pwr_reverse: &impl TlaPwrReverse,
        altitude_def: &impl FlightPhasesAltitudeDef,
        tla_at_cl_cfm: &impl TlaAtClCfm,
    ) {
        let any_cfm = true;

        // CFM Flex

        let eng1_flex = tla_mct_or_flex_to.eng_1_tla_mct_cfm()
            && (neo_def.eng_1_auto_toga()
                || neo_def.eng_1_limit_mode_soft_ga()
                || signals.eng1_tla_fto(1).value()
                || signals.eng1_tla_fto(2).value());

        let eng2_flex = tla_mct_or_flex_to.eng_2_tla_mct_cfm()
            && (neo_def.eng_2_auto_toga()
                || neo_def.eng_2_limit_mode_soft_ga()
                || signals.eng2_tla_fto(1).value()
                || signals.eng2_tla_fto(2).value());

        self.cfm_flex = any_cfm && (eng1_flex || eng2_flex);

        // Engine 1 or 2 Takeoff Power

        let eng1_or_2_to_pwr_cond1 = eng1_flex
            || eng2_flex
            || tla_mct_or_flex_to.eng_1_sup_mct_cfm()
            || tla_mct_or_flex_to.eng_2_sup_mct_cfm()
            || tla_pwr_reverse.eng_1_tla_full_pwr_cfm()
            || tla_pwr_reverse.eng_2_tla_full_pwr_cfm();

        let conf1_in = eng1_or_2_to_pwr_cond1;
        let conf1_out = self.conf1.update(conf1_in, delta);

        let eng1_or_2_to_pwr_cond2 =
            conf1_out && !altitude_def.h_gt_1500ft() && tla_at_cl_cfm.eng_12_mcl_cfm();

        let eng1_or_2_to_pwr_cond = eng1_or_2_to_pwr_cond1 || eng1_or_2_to_pwr_cond2;

        self.eng_1_or_2_to_pwr = any_cfm && (eng1_or_2_to_pwr_cond);
    }
}

impl CfmFlightPhasesDef for CfmFlightPhasesDefActivation {
    fn cfm_flex(&self) -> bool {
        self.cfm_flex
    }

    fn eng_1_or_2_to_pwr(&self) -> bool {
        self.eng_1_or_2_to_pwr
    }
}

pub(in crate::flight_warning::runtime) trait FlightPhasesAltitudeDef {
    fn h_gt_800ft(&self) -> bool;
    fn h_gt_1500ft(&self) -> bool;
    fn h_fail(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct AltitudeDefActivation {
    conf1: ConfirmationNode,
    mem: MemoryNode,
    h_fail: bool,
    h_gt_800ft: bool,
    h_gt_1500ft: bool,
}

impl Default for AltitudeDefActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new_leading(Duration::from_secs(4)),
            mem: MemoryNode::new(false),
            h_fail: false,
            h_gt_800ft: false,
            h_gt_1500ft: false,
        }
    }
}

impl AltitudeDefActivation {
    pub fn update(&mut self, delta: Duration, signals: &impl RadioHeight) {
        let radio1_inv = signals.radio_height(1).is_inv();
        let radio2_inv = signals.radio_height(2).is_inv();
        let radio1_ncd = signals.radio_height(1).is_ncd();
        let radio2_ncd = signals.radio_height(2).is_ncd();

        let dual_radio_inv = radio1_inv && radio2_inv;
        self.h_fail = dual_radio_inv;

        let conf1_conf =
            !dual_radio_inv && (radio1_inv || radio1_ncd) && (radio2_inv || radio2_ncd);
        let conf1_out = self.conf1.update(conf1_conf, delta);

        let radio1_abv_1500ft =
            signals.radio_height(1).value() > Length::new::<foot>(1500.) && !radio1_inv;
        let radio2_abv_1500ft =
            signals.radio_height(2).value() > Length::new::<foot>(1500.) && !radio2_inv;

        let h_gt_1500ft = radio1_abv_1500ft || radio2_abv_1500ft || conf1_out;
        self.h_gt_1500ft = h_gt_1500ft;

        let radio1_blw_800ft = signals.radio_height(1).value() < Length::new::<foot>(800.)
            && !radio1_inv
            && !radio1_ncd;
        let radio2_blw_800ft = signals.radio_height(2).value() < Length::new::<foot>(800.)
            && !radio2_inv
            && !radio2_ncd;

        let memory1_set = h_gt_1500ft;
        let memory1_reset = (radio1_blw_800ft || radio2_blw_800ft) && !conf1_out;

        self.h_gt_800ft = self.mem.update(memory1_set, memory1_reset);
    }
}

impl FlightPhasesAltitudeDef for AltitudeDefActivation {
    fn h_gt_800ft(&self) -> bool {
        self.h_gt_800ft
    }

    fn h_gt_1500ft(&self) -> bool {
        self.h_gt_1500ft
    }

    fn h_fail(&self) -> bool {
        self.h_fail
    }
}

pub(in crate::flight_warning::runtime) trait FlightPhasesGround {
    fn phase_1(&self) -> bool;
    fn phase_2(&self) -> bool;
    fn phase_3(&self) -> bool;
    fn phase_4(&self) -> bool;
    fn phase_8(&self) -> bool;
    fn phase_9(&self) -> bool;
    fn phase_10(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct FlightPhasesGroundActivation {
    trans1: TransientDetectionNode,
    conf1: ConfirmationNode,
    mtrig1: MonostableTriggerNode,
    mtrig2: MonostableTriggerNode,
    mtrig3: MonostableTriggerNode,
    mtrig4: MonostableTriggerNode,
    mtrig5: MonostableTriggerNode,
    mtrig6: MonostableTriggerNode,
    mem_phase10: MemoryNode,
    mem_phase9: MemoryNode,
    prec_phase9: PreceedingValueNode,
    phase1: bool,
    phase2: bool,
    phase3: bool,
    phase4: bool,
    phase8: bool,
    phase9: bool,
    phase10: bool,
}

impl Default for FlightPhasesGroundActivation {
    fn default() -> Self {
        Self {
            trans1: TransientDetectionNode::new(false),
            conf1: ConfirmationNode::new_leading(Duration::from_secs_f64(0.2)),
            mtrig1: MonostableTriggerNode::new_falling(Duration::from_secs(1)),
            mtrig2: MonostableTriggerNode::new_falling(Duration::from_secs(3)),
            mtrig3: MonostableTriggerNode::new_leading(Duration::from_secs(300)),
            mtrig4: MonostableTriggerNode::new_leading(Duration::from_secs(2)),
            mtrig5: MonostableTriggerNode::new_leading(Duration::from_secs(2)),
            mtrig6: MonostableTriggerNode::new_leading(Duration::from_secs(2)),
            mem_phase9: MemoryNode::new(true), // TODO NVM
            mem_phase10: MemoryNode::new(false),
            prec_phase9: PreceedingValueNode::new(),
            phase1: false,
            phase2: false,
            phase3: false,
            phase4: false,
            phase8: false,
            phase9: false,
            phase10: false,
        }
    }
}

impl FlightPhasesGroundActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl Eng1FirePbOut + ToConfigTest),
        ground_sheet: &impl GroundDetection,
        ac_speed_sheet: &impl SpeedDetection,
        eng_running_sheet: &impl EngRunning,
        takeoff_power_sheet: &impl CfmFlightPhasesDef,
    ) {
        let ground = ground_sheet.ground();
        let ground_immediate = ground_sheet.ground_immediate();
        let ac_speed_above_80_kt = ac_speed_sheet.ac_speed_above_80_kt();
        let eng1_or_2_running = eng_running_sheet.eng_1_or_2_running();
        let eng1_or_2_to_pwr = takeoff_power_sheet.eng_1_or_2_to_pwr();

        // phase 1 and 10 preamble
        let trans1 = self.trans1.update(signals.eng_1_fire_pb_out().value());
        let conf1 = self.conf1.update(trans1, delta);
        let mtrig5 = self.mtrig5.update(conf1, delta);
        let reset_mem10 = ground && mtrig5;

        // phases 3 and 4

        let ground_and_to_pwr = ground && eng1_or_2_to_pwr;

        let phase3 = !ac_speed_above_80_kt && eng1_or_2_running && ground_and_to_pwr;
        self.phase3 = phase3;
        self.phase4 = ac_speed_above_80_kt && ground_and_to_pwr;

        // phase 8

        let phase8_cond1 = ground_immediate || self.mtrig6.update(ground_immediate, delta);

        let phase8 = phase8_cond1 & !eng1_or_2_to_pwr && ac_speed_above_80_kt;
        self.phase8 = phase8;

        // phases 2 and 9

        let prec_phase9 = self.prec_phase9.value();
        let mtrig1 = self.mtrig1.update(eng1_or_2_to_pwr, delta);
        let mtrig2 = self.mtrig2.update(prec_phase9, delta);
        let mtrig4 = self.mtrig4.update(!ac_speed_above_80_kt, delta);
        let phase29_cond = ground && !eng1_or_2_to_pwr && !ac_speed_above_80_kt;
        let one_eng_running = eng_running_sheet.one_eng_running();

        let reset_nvm_cond1 = ground && mtrig2;
        let reset_nvm_cond2 = reset_mem10;
        let reset_nvm_cond3 = ground && mtrig1;
        let reset_nvm = reset_nvm_cond1 || reset_nvm_cond2 || reset_nvm_cond3;

        let inhibited_reset_nvm = !mtrig4 && reset_nvm && !prec_phase9;

        let adc_test_inhib = ac_speed_sheet.adc_test_inhib();
        let to_config_test = signals.to_config_test().value();
        let to_config_reset_9 = to_config_test && phase29_cond && one_eng_running;
        let reset_mem9 = inhibited_reset_nvm || adc_test_inhib || to_config_reset_9;

        let phase9_mem = self.mem_phase9.update(phase3 || phase8, reset_mem9);

        self.phase2 = phase29_cond && !phase9_mem && eng1_or_2_running;

        let phase9 = one_eng_running && phase9_mem && phase29_cond;
        self.phase9 = phase9;
        self.prec_phase9.update(phase9);

        // phases 1 and 10

        let set_mem10 = phase9;
        let mem_phase10_out = self.mem_phase10.update(set_mem10, reset_mem10);

        let phase110_cond =
            !set_mem10 && eng_running_sheet.eng_1_and_2_not_running() && ground_immediate;
        let mtrig3 = self.mtrig3.update(mem_phase10_out && phase110_cond, delta);

        self.phase1 = phase110_cond && !mtrig3;
        self.phase10 = phase110_cond && mtrig3;
    }
}

impl FlightPhasesGround for FlightPhasesGroundActivation {
    fn phase_1(&self) -> bool {
        self.phase1
    }

    fn phase_2(&self) -> bool {
        self.phase2
    }

    fn phase_3(&self) -> bool {
        self.phase3
    }

    fn phase_4(&self) -> bool {
        self.phase4
    }

    fn phase_8(&self) -> bool {
        self.phase8
    }

    fn phase_9(&self) -> bool {
        self.phase9
    }

    fn phase_10(&self) -> bool {
        self.phase10
    }
}

pub(in crate::flight_warning::runtime) trait FlightPhasesAir {
    fn phase_5(&self) -> bool;
    fn phase_6(&self) -> bool;
    fn phase_7(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct FlightPhasesAirActivation {
    conf1: ConfirmationNode,
    mtrig1: MonostableTriggerNode,
    mtrig2: MonostableTriggerNode,
    mtrig3: MonostableTriggerNode,
    trans1: TransientDetectionNode,
    pulse1: PulseNode,
    phase5: bool,
    phase6: bool,
    phase7: bool,
}

impl Default for FlightPhasesAirActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new_leading(Duration::from_secs_f64(0.2)),
            mtrig1: MonostableTriggerNode::new_leading(Duration::from_secs(120)),
            mtrig2: MonostableTriggerNode::new_leading(Duration::from_secs(180)),
            mtrig3: MonostableTriggerNode::new_leading(Duration::from_secs(2)),
            trans1: TransientDetectionNode::new(false),
            pulse1: PulseNode::new_leading(),
            phase5: false,
            phase6: false,
            phase7: false,
        }
    }
}

impl FlightPhasesAirActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        ground_sheet: &impl GroundDetection,
        altitude_sheet: &impl FlightPhasesAltitudeDef,
        cfm_flight_phases_sheet: &impl CfmFlightPhasesDef,
        flight_phases_gnd_sheet: &impl FlightPhasesGround,
    ) {
        let mtrig3_in = ground_sheet.ground_immediate();
        let ground_immediate = self.mtrig3.update(mtrig3_in, delta) || mtrig3_in;

        let eng_1_or_2_to_pwr = cfm_flight_phases_sheet.eng_1_or_2_to_pwr();
        let h_fail = altitude_sheet.h_fail();
        let h_gt_1500ft = altitude_sheet.h_gt_1500ft();
        let h_gt_800ft = altitude_sheet.h_gt_800ft();

        let conf1_cond = self.trans1.update(h_gt_800ft);
        let pulse_cond = self.conf1.update(conf1_cond, delta);
        let h_gt_800ft_pulse = self.pulse1.update(pulse_cond);

        let mtrig1_in = !h_gt_1500ft && eng_1_or_2_to_pwr && !h_fail && !ground_immediate;
        let phase5_cond = self.mtrig1.update(mtrig1_in, delta) && mtrig1_in;

        let mtrig2_in = !ground_immediate
            && !h_fail
            && !eng_1_or_2_to_pwr
            && !h_gt_1500ft
            && !h_gt_800ft
            && !h_gt_800ft_pulse;

        let phase7_cond = self.mtrig2.update(mtrig2_in, delta) && mtrig2_in;

        self.phase5 = phase5_cond;
        self.phase6 = !phase5_cond && !ground_immediate && !phase7_cond;
        self.phase7 = phase7_cond && !flight_phases_gnd_sheet.phase_8();
    }
}

impl FlightPhasesAir for FlightPhasesAirActivation {
    fn phase_5(&self) -> bool {
        self.phase5
    }

    fn phase_6(&self) -> bool {
        self.phase6
    }

    fn phase_7(&self) -> bool {
        self.phase7
    }
}

#[cfg(test)]
pub mod tests {
    use crate::flight_warning::runtime::test::*;
    use uom::si::f64::*;
    use uom::si::{length::foot, velocity::knot};

    use super::*;

    mod new_ground_activation_tests {
        use super::*;

        #[test]
        fn when_all_compressed_new_ground_and_not_inv() {
            let mut sheet = NewGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .lh_lg_compressed(1)
                    .ess_lh_lg_compressed()
                    .lh_lg_compressed(2)
                    .norm_lh_lg_compressed()
                    .parameters(),
            );
            assert!(sheet.new_ground());
            assert!(!sheet.lgciu_12_inv());
        }

        #[test]
        fn when_none_compressed_new_ground_and_not_inv() {
            let mut sheet = NewGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .lh_lg_extended(1)
                    .lh_lg_extended(2)
                    .parameters(),
            );
            assert!(!sheet.new_ground());
            assert!(!sheet.lgciu_12_inv());
        }

        #[test]
        fn when_single_lgciu_mismatch_then_lgciu12_inv() {
            let mut sheet = NewGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .lh_lg_compressed(1)
                    .lh_lg_extended(2)
                    .parameters(),
            );
            assert!(!sheet.new_ground());
            assert!(sheet.lgciu_12_inv());
        }
    }

    mod ground_detection_activation_tests {
        use super::*;

        struct TestLgciuGroundDetection {
            new_ground: bool,
            lgciu_12_inv: bool,
        }

        impl TestLgciuGroundDetection {
            fn new(new_ground: bool, lgciu_12_inv: bool) -> Self {
                Self {
                    new_ground,
                    lgciu_12_inv,
                }
            }
        }

        impl NewGround for TestLgciuGroundDetection {
            fn new_ground(&self) -> bool {
                self.new_ground
            }
            fn lgciu_12_inv(&self) -> bool {
                self.lgciu_12_inv
            }
        }

        #[test]
        fn when_on_ground_ground_immediate_and_ground() {
            let mut sheet = GroundDetectionActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .ess_lh_lg_compressed()
                    .norm_lh_lg_compressed()
                    .radio_heights(Length::new::<foot>(0.0), Length::new::<foot>(-1.0))
                    .parameters(),
                &TestLgciuGroundDetection::new(true, false),
            );
            assert!(sheet.ground_immediate());
            assert!(sheet.ground());
        }

        #[test]
        fn when_touching_down_triggers_ground_immediate_first() {
            let mut sheet = GroundDetectionActivation::default();
            sheet.update(
                Duration::from_millis(500),
                test_bed_with()
                    .ess_lh_lg_compressed()
                    .norm_lh_lg_compressed()
                    .radio_heights(Length::new::<foot>(0.0), Length::new::<foot>(-1.0))
                    .parameters(),
                &TestLgciuGroundDetection::new(true, false),
            );
            assert!(sheet.ground_immediate());
            assert!(!sheet.ground());
            sheet.update(
                Duration::from_millis(500),
                test_bed_with()
                    .ess_lh_lg_compressed()
                    .norm_lh_lg_compressed()
                    .radio_heights(Length::new::<foot>(0.0), Length::new::<foot>(-1.0))
                    .parameters(),
                &TestLgciuGroundDetection::new(true, false),
            );
            assert!(sheet.ground_immediate());
            assert!(sheet.ground());
        }

        #[test]
        fn when_dual_ra_failure_on_ground() {
            let mut sheet = GroundDetectionActivation::default();
            sheet.update(
                Duration::from_millis(500),
                test_bed_with()
                    .ess_lh_lg_compressed()
                    .norm_lh_lg_compressed()
                    .parameters(),
                &TestLgciuGroundDetection::new(true, false),
            );
            assert!(sheet.ground_immediate());
            assert!(!sheet.ground());
        }
    }

    mod test_tla_at_mct_or_flex_to_cfm_activation_tests {
        use super::*;

        #[test]
        fn when_at_37_0_degress_above_mct() {
            let mut sheet = TlaAtMctOrFlexToCfmActivation::default();
            sheet.update(
                test_bed_with()
                    .eng1_tla(Angle::new::<degree>(37.0))
                    .parameters(),
            );
            assert!(!sheet.eng_1_tla_mct_cfm());
            assert!(!sheet.eng_1_end_mct());
            assert!(sheet.eng_1_sup_mct_cfm());
        }

        #[test]
        fn when_at_36_55_degress_at_end_mct() {
            let mut sheet = TlaAtMctOrFlexToCfmActivation::default();
            sheet.update(
                test_bed_with()
                    .eng1_tla(Angle::new::<degree>(36.65))
                    .parameters(),
            );
            assert!(sheet.eng_1_tla_mct_cfm());
            assert!(sheet.eng_1_end_mct());
            assert!(!sheet.eng_1_sup_mct_cfm());
        }

        #[test]
        fn when_at_33_degress_not_in_mct() {
            let mut sheet = TlaAtMctOrFlexToCfmActivation::default();
            sheet.update(
                test_bed_with()
                    .eng1_tla(Angle::new::<degree>(33.0))
                    .parameters(),
            );
            assert!(!sheet.eng_1_tla_mct_cfm());
            assert!(!sheet.eng_1_end_mct());
            assert!(!sheet.eng_1_sup_mct_cfm());
        }

        #[test]
        fn when_at_35_degress_in_mct() {
            let mut sheet = TlaAtMctOrFlexToCfmActivation::default();
            sheet.update(
                test_bed_with()
                    .eng1_tla(Angle::new::<degree>(35.0))
                    .parameters(),
            );
            assert!(sheet.eng_1_tla_mct_cfm());
            assert!(!sheet.eng_1_end_mct());
            assert!(!sheet.eng_1_sup_mct_cfm());
        }
    }

    mod speed_detection_activation_tests {
        use super::*;

        #[test]
        fn when_at_0_kt_not_above_80_kt() {
            let mut sheet = SpeedDetectionActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .computed_speeds(
                        Velocity::new::<knot>(0.0),
                        Velocity::new::<knot>(0.0),
                        Velocity::new::<knot>(0.0),
                    )
                    .parameters(),
            );
            assert!(!sheet.ac_speed_above_80_kt());
        }

        #[test]
        fn when_at_250_kt_above_80_kt() {
            let mut sheet = SpeedDetectionActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .computed_speeds(
                        Velocity::new::<knot>(250.0),
                        Velocity::new::<knot>(250.0),
                        Velocity::new::<knot>(250.0),
                    )
                    .parameters(),
            );
            assert!(sheet.ac_speed_above_80_kt());
        }

        #[test]
        fn when_one_adc_at_250_kt_not_above_80_kt() {
            let mut sheet = SpeedDetectionActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .computed_speeds(
                        Velocity::new::<knot>(250.0),
                        Velocity::new::<knot>(0.0),
                        Velocity::new::<knot>(0.0),
                    )
                    .parameters(),
            );
            assert!(!sheet.ac_speed_above_80_kt());
        }

        #[test]
        fn when_two_at_250_kt_and_adc_failure_above_80_kt() {
            let mut sheet = SpeedDetectionActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .computed_speed_1(Velocity::new::<knot>(250.0))
                    .parameters(), // TODO ADC failures
            );
            assert!(sheet.ac_speed_above_80_kt());
        }

        #[test]
        fn when_two_adcs_at_250_kt_above_80_kt() {
            let mut sheet = SpeedDetectionActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .computed_speeds(
                        Velocity::new::<knot>(250.0),
                        Velocity::new::<knot>(0.0),
                        Velocity::new::<knot>(250.0),
                    )
                    .parameters(),
            );
            assert!(sheet.ac_speed_above_80_kt());
        }

        #[test]
        fn when_spikes_below_50_to_above_80_kt_not_above_80_kt() {
            let mut sheet = SpeedDetectionActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .computed_speeds(
                        Velocity::new::<knot>(49.0),
                        Velocity::new::<knot>(49.0),
                        Velocity::new::<knot>(49.0),
                    )
                    .parameters(),
            );
            sheet.update(
                Duration::from_secs_f64(0.5),
                test_bed_with()
                    .computed_speeds(
                        Velocity::new::<knot>(84.0),
                        Velocity::new::<knot>(84.0),
                        Velocity::new::<knot>(84.0),
                    )
                    .parameters(),
            );
            assert!(!sheet.ac_speed_above_80_kt());
        }

        #[test]
        fn when_jumps_below_50_to_above_80_kt_above_80_kt() {
            let mut sheet = SpeedDetectionActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .computed_speeds(
                        Velocity::new::<knot>(49.0),
                        Velocity::new::<knot>(49.0),
                        Velocity::new::<knot>(49.0),
                    )
                    .parameters(),
            );
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .computed_speeds(
                        Velocity::new::<knot>(84.0),
                        Velocity::new::<knot>(84.0),
                        Velocity::new::<knot>(84.0),
                    )
                    .parameters(),
            );
            assert!(sheet.ac_speed_above_80_kt());
        }
    }

    mod engines_not_running_activation_tests {
        use super::*;

        #[test]
        fn when_engines_off() {
            let mut sheet = EngineNotRunningCfmActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
            );
            assert!(sheet.eng_1_not_running());
            assert!(sheet.eng_2_not_running());
        }

        #[test]
        fn when_engine_off_and_master_lever_on_after_30s() {
            let mut sheet = EngineNotRunningCfmActivation::default();
            sheet.update(
                Duration::from_secs_f64(29.9),
                test_bed_with()
                    .eng1_master_lever_select_on()
                    .eng1_at_or_above_idle()
                    .parameters(),
                &TestGroundDetection::new(true),
            );
            assert!(sheet.eng_1_not_running());
            assert!(sheet.eng_2_not_running());
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with()
                    .eng1_master_lever_select_on()
                    .eng1_at_or_above_idle()
                    .parameters(),
                &TestGroundDetection::new(true),
            );
            assert!(!sheet.eng_1_not_running());
            assert!(sheet.eng_2_not_running());
        }

        #[test]
        fn when_engine_on_and_master_lever_off_after_30_secs() {
            let mut sheet = EngineNotRunningCfmActivation::default();
            sheet.update(
                Duration::from_secs(30),
                test_bed_with().eng1_at_or_above_idle().parameters(),
                &TestGroundDetection::new(true),
            );
            assert!(!sheet.eng_1_not_running());
            assert!(sheet.eng_2_not_running());
        }

        // TODO repeat above tests for engine 2 (macro?)

        #[test]
        fn when_engine_1_on_and_master_lever_on_in_flight_with_fire_pb() {
            let mut sheet = EngineNotRunningCfmActivation::default();

            // Engine 1 has been off for 31 secs and then on for less than 30 secs
            sheet.update(
                Duration::from_secs(31),
                test_bed_with().parameters(),
                &TestGroundDetection::new(false),
            );
            sheet.update(
                Duration::from_secs(15),
                test_bed_with()
                    .eng1_master_lever_select_on()
                    .eng1_at_or_above_idle()
                    .parameters(),
                &TestGroundDetection::new(false),
            );
            assert!(sheet.eng_1_not_running());

            // Toggling the eng 1 fire p/b immediately considers the engine running even if 30s
            // haven't passed yet and we're receiving the at_or_above_idle signal
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with()
                    .eng1_master_lever_select_on()
                    .eng1_at_or_above_idle()
                    .eng1_fire_pb_out()
                    .parameters(),
                &TestGroundDetection::new(false),
            );
            assert!(!sheet.eng_1_not_running());

            // After 31s the usual logic kicks in again if the at_or_above_idle signal persists
            sheet.update(
                Duration::from_secs_f64(31.),
                test_bed_with()
                    .eng1_master_lever_select_on()
                    .eng1_at_or_above_idle()
                    .eng1_fire_pb_out()
                    .parameters(),
                &TestGroundDetection::new(false),
            );
            assert!(!sheet.eng_1_not_running());
        }

        // TODO a/b channel discrepancy
    }

    mod altitude_def_activation_tests {
        use super::*;

        #[test]
        fn when_at_cruise() {
            let mut sheet = AltitudeDefActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().radio_heights_at_cruise().parameters(),
            );
            assert!(!sheet.h_fail());
            assert!(sheet.h_gt_800ft);
            assert!(sheet.h_gt_1500ft);
        }

        #[test]
        fn when_above_1500ft() {
            let mut sheet = AltitudeDefActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .radio_heights(Length::new::<foot>(1600.0), Length::new::<foot>(1600.0))
                    .parameters(),
            );
            assert!(!sheet.h_fail());
            assert!(sheet.h_gt_800ft);
            assert!(sheet.h_gt_1500ft);
        }

        #[test]
        fn when_above_800ft_and_below_1500ft() {
            let mut sheet = AltitudeDefActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .radio_heights(Length::new::<foot>(1501.0), Length::new::<foot>(1501.0))
                    .parameters(),
            );
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .radio_heights(Length::new::<foot>(1499.0), Length::new::<foot>(1499.0))
                    .parameters(),
            );
            assert!(!sheet.h_fail());
            assert!(sheet.h_gt_800ft);
            assert!(!sheet.h_gt_1500ft);
        }

        #[test]
        fn when_below_800ft() {
            let mut sheet = AltitudeDefActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .radio_heights(Length::new::<foot>(1501.0), Length::new::<foot>(1501.0))
                    .parameters(),
            );
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .radio_heights(Length::new::<foot>(799.0), Length::new::<foot>(799.0))
                    .parameters(),
            );
            assert!(!sheet.h_fail());
            assert!(!sheet.h_gt_800ft);
            assert!(!sheet.h_gt_1500ft);
        }

        #[test]
        fn when_on_ground() {
            let mut sheet = AltitudeDefActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .radio_heights(Length::new::<foot>(0.0), Length::new::<foot>(0.0))
                    .parameters(),
            );
            assert!(!sheet.h_fail());
            assert!(!sheet.h_gt_800ft);
            assert!(!sheet.h_gt_1500ft);
        }
    }

    mod flight_phases_ground {
        use super::*;

        #[test]
        fn when_cold_and_dark_is_phase_1() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(false, false),
                &TestCfmFlightPhasesDef::new_below_flex(),
            );
            assert!(sheet.phase_1());
        }

        #[test]
        fn when_one_eng_running_is_phase_2() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(true, false),
                &TestCfmFlightPhasesDef::new_below_flex(),
            );
            assert!(sheet.phase_2());
        }

        #[test]
        fn when_at_flex_takeoff_is_phase_3() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_flex(),
            );
            assert!(sheet.phase_3());
        }

        #[test]
        fn when_at_toga_takeoff_is_phase_3() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_toga(),
            );
            assert!(sheet.phase_3());
        }

        #[test]
        fn when_at_toga_above_80_kt_is_phase_4() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(true),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_toga(),
            );
            assert!(sheet.phase_4());
        }

        #[test]
        fn when_engine_failed_above_80_kt_is_phase_4() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(true),
                &TestEngRunning::new(false, true),
                &TestCfmFlightPhasesDef::new_toga(),
            );
            assert!(sheet.phase_4());
        }

        #[test]
        fn when_below_flex_above_80_kt_is_phase_8() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(true),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_below_flex(),
            );
            assert!(sheet.phase_8());
        }

        #[test]
        fn after_rto_below_80_knots_is_phase_9() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_toga(),
            );
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_below_flex(),
            );
            assert!(sheet.phase_9());
        }

        #[test]
        fn after_rto_below_80_knots_and_to_config_is_phase_2() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_toga(),
            );
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_below_flex(),
            );
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().takeoff_config_test_pressed().parameters(),
                &TestGroundDetection::new(true),
                &TestSpeedDetection::new(false),
                &TestEngRunning::new(true, true),
                &TestCfmFlightPhasesDef::new_below_flex(),
            );
            assert!(sheet.phase_2());
        }

        /*#[test]
        fn after_engine_shutdown_reset_to_phase_1() {
            let mut sheet = FlightPhasesGroundActivation::default();
            sheet.update(Duration::from_secs(1), test_bed().signals());
            assert_eq!(sheet.get_phase(), 3);
            sheet.update(Duration::from_secs(30), test_bed().signals());
            sheet.update(Duration::from_secs(60), test_bed().signals());
            assert_eq!(sheet.get_phase(), 9);
            sheet.update(Duration::from_secs(60), test_bed().signals());
            assert_eq!(sheet.get_phase(), 10);
            sheet.update(Duration::from_secs(300), test_bed().signals());
            assert_eq!(sheet.get_phase(), 1);
            sheet.update(Duration::from_secs(1), test_bed().signals());
        }*/
    }

    mod flight_phases_air {
        use super::*;

        #[test]
        fn when_at_toga_below_1500ft_is_phase_5() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_takeoff(Length::new::<foot>(1499.0)),
                &TestCfmFlightPhasesDef::new_toga(),
                &TestFlightPhases::default(),
            );
            assert!(sheet.phase_5());
        }

        #[test]
        fn when_at_flex_below_1500ft_is_phase_5() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_takeoff(Length::new::<foot>(1499.0)),
                &TestCfmFlightPhasesDef::new_flex(),
                &TestFlightPhases::default(),
            );
            assert!(sheet.phase_5());
        }

        #[test]
        fn when_at_takeoff_power_above_1500ft_is_phase_6() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_takeoff(Length::new::<foot>(1500.1)),
                &TestCfmFlightPhasesDef::new_toga(),
                &TestFlightPhases::default(),
            );
            assert!(sheet.phase_6());
        }

        #[test]
        fn when_at_flex_above_1500ft_is_phase_6() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_takeoff(Length::new::<foot>(1500.1)),
                &TestCfmFlightPhasesDef::new_flex(),
                &TestFlightPhases::default(),
            );
            assert!(sheet.phase_6());
        }

        #[test]
        fn when_at_below_flex_below_800ft_is_phase_7() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_landing(Length::new::<foot>(799.9)),
                &TestCfmFlightPhasesDef::new_below_flex(),
                &TestFlightPhases::default(),
            );
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_landing(Length::new::<foot>(799.9)),
                &TestCfmFlightPhasesDef::new_below_flex(),
                &TestFlightPhases::default(),
            );
            assert!(sheet.phase_7());
        }

        #[test]
        fn when_at_flex_below_800ft_is_phase_5() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_landing(Length::new::<foot>(799.9)),
                &TestCfmFlightPhasesDef::new_flex(),
                &TestFlightPhases::default(),
            );
            assert!(sheet.phase_5());
        }

        #[test]
        fn when_at_toga_below_800ft_is_phase_5() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_landing(Length::new::<foot>(799.9)),
                &TestCfmFlightPhasesDef::new_toga(),
                &TestFlightPhases::default(),
            );
            assert!(sheet.phase_5());
        }

        #[test]
        fn when_ra_failed_is_phase_6() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(false),
                &TestAltitudeDef::new_failed(),
                &TestCfmFlightPhasesDef::new_flex(),
                &TestFlightPhases::default(),
            );
            assert!(sheet.phase_6());
        }

        #[test]
        fn when_on_ground_and_ra_failed_is_no_phase() {
            let mut sheet = FlightPhasesAirActivation::default();
            sheet.update(
                Duration::from_secs(1),
                &TestGroundDetection::new(true),
                &TestAltitudeDef::new_failed(),
                &TestCfmFlightPhasesDef::new_below_flex(),
                &TestFlightPhases::default(),
            );
            assert!(!sheet.phase_5());
            assert!(!sheet.phase_6());
            assert!(!sheet.phase_7());
        }
    }

    mod landing_gear_downlock {
        use super::*;

        #[test]
        fn when_all_gears_are_downlocked_is_full_down_lock() {
            let mut sheet = LgDownlockedActivation::default();
            sheet.update(
                test_bed_with()
                    .rh_gear_downlocked(true)
                    .lh_gear_downlocked(true)
                    .nose_gear_downlocked(true)
                    .parameters(),
            );
            assert!(sheet.lg_downlocked());
            assert!(sheet.main_lg_downlocked());
        }

        #[test]
        fn when_main_gears_are_downlocked_is_not_full_down_lock() {
            let mut sheet = LgDownlockedActivation::default();
            sheet.update(
                test_bed_with()
                    .rh_gear_downlocked(true)
                    .lh_gear_downlocked(true)
                    .nose_gear_downlocked(false)
                    .parameters(),
            );
            assert!(sheet.main_lg_downlocked());
            assert!(!sheet.lg_downlocked());
        }

        #[test]
        fn when_no_gear_is_downlocked_is_no_down_lock() {
            let mut sheet = LgDownlockedActivation::default();
            sheet.update(
                test_bed_with()
                    .rh_gear_downlocked(false)
                    .lh_gear_downlocked(false)
                    .nose_gear_downlocked(false)
                    .parameters(),
            );
            assert!(!sheet.main_lg_downlocked());
            assert!(!sheet.lg_downlocked());
        }

        #[test]
        fn when_one_main_gear_is_downlocked_is_no_down_lock() {
            let mut sheet = LgDownlockedActivation::default();
            sheet.update(
                test_bed_with()
                    .rh_gear_downlocked(false)
                    .lh_gear_downlocked(true)
                    .nose_gear_downlocked(false)
                    .parameters(),
            );
            assert!(!sheet.main_lg_downlocked());
            assert!(!sheet.lg_downlocked());
        }
    }

    struct TestGroundDetection {
        ground: bool,
        ground_immediate: bool,
    }

    impl TestGroundDetection {
        fn new(ground: bool) -> Self {
            Self {
                ground,
                ground_immediate: ground,
            }
        }

        fn new_with_immediate(ground: bool, ground_immediate: bool) -> Self {
            Self {
                ground,
                ground_immediate,
            }
        }
    }

    impl GroundDetection for TestGroundDetection {
        fn ground(&self) -> bool {
            self.ground
        }

        fn ground_immediate(&self) -> bool {
            self.ground_immediate
        }
    }

    struct TestSpeedDetection {
        ac_speed_above_80_kt: bool,
        adc_test_inhib: bool,
    }

    impl TestSpeedDetection {
        fn new(ac_speed_above_80_kt: bool) -> Self {
            Self {
                ac_speed_above_80_kt,
                adc_test_inhib: false,
            }
        }

        fn new_adc_test(ac_speed_above_80_kt: bool) -> Self {
            Self {
                ac_speed_above_80_kt,
                adc_test_inhib: true,
            }
        }
    }

    impl SpeedDetection for TestSpeedDetection {
        fn ac_speed_above_80_kt(&self) -> bool {
            self.ac_speed_above_80_kt
        }

        fn adc_test_inhib(&self) -> bool {
            self.adc_test_inhib
        }
    }

    struct TestAltitudeDef {
        h_gt_800ft: bool,
        h_gt_1500ft: bool,
        h_fail: bool,
    }

    impl TestAltitudeDef {
        fn new_takeoff(height: Length) -> Self {
            Self {
                h_gt_800ft: height > Length::new::<foot>(1500.0),
                h_gt_1500ft: height > Length::new::<foot>(1500.0),
                h_fail: false,
            }
        }

        fn new_landing(height: Length) -> Self {
            Self {
                h_gt_800ft: height > Length::new::<foot>(800.0),
                h_gt_1500ft: height > Length::new::<foot>(1500.0),
                h_fail: false,
            }
        }

        fn new_failed() -> Self {
            Self {
                h_gt_800ft: false,
                h_gt_1500ft: false,
                h_fail: true,
            }
        }
    }

    impl FlightPhasesAltitudeDef for TestAltitudeDef {
        fn h_gt_800ft(&self) -> bool {
            self.h_gt_800ft
        }

        fn h_gt_1500ft(&self) -> bool {
            self.h_gt_1500ft
        }

        fn h_fail(&self) -> bool {
            self.h_fail
        }
    }

    struct TestEngRunning {
        eng_1_and_2_not_running: bool,
        eng_1_or_2_running: bool,
        one_eng_running: bool,
    }

    impl TestEngRunning {
        fn new(eng_1_running: bool, eng_2_running: bool) -> Self {
            Self {
                eng_1_and_2_not_running: !eng_1_running && !eng_2_running,
                eng_1_or_2_running: eng_1_running || eng_2_running,
                one_eng_running: eng_1_running || eng_2_running,
            }
        }

        fn new_unconfirmed_eng_running(eng_1_running: bool, eng_2_running: bool) -> Self {
            Self {
                eng_1_and_2_not_running: !eng_1_running && !eng_2_running,
                eng_1_or_2_running: false,
                one_eng_running: eng_1_running || eng_2_running,
            }
        }
    }

    impl EngRunning for TestEngRunning {
        fn eng_1_and_2_not_running(&self) -> bool {
            self.eng_1_and_2_not_running
        }

        fn eng_1_or_2_running(&self) -> bool {
            self.eng_1_or_2_running
        }

        fn one_eng_running(&self) -> bool {
            self.one_eng_running
        }
    }

    pub struct TestCfmFlightPhasesDef {
        cfm_flex: bool,
        eng_1_or_2_to_pwr: bool,
    }

    impl TestCfmFlightPhasesDef {
        pub fn new(cfm_flex: bool, eng_1_or_2_to_pwr: bool) -> Self {
            Self {
                cfm_flex,
                eng_1_or_2_to_pwr,
            }
        }

        pub fn new_below_flex() -> Self {
            Self::new(false, false)
        }

        pub fn new_flex() -> Self {
            Self::new(true, true)
        }

        pub fn new_toga() -> Self {
            Self::new(false, true)
        }
    }

    impl CfmFlightPhasesDef for TestCfmFlightPhasesDef {
        fn cfm_flex(&self) -> bool {
            self.cfm_flex
        }

        fn eng_1_or_2_to_pwr(&self) -> bool {
            self.eng_1_or_2_to_pwr
        }
    }

    pub struct TestFlightPhases {
        phase: usize,
    }

    impl TestFlightPhases {
        pub fn new(phase: usize) -> Self {
            Self { phase }
        }
    }

    impl Default for TestFlightPhases {
        fn default() -> Self {
            Self::new(0)
        }
    }

    impl FlightPhasesGround for TestFlightPhases {
        fn phase_1(&self) -> bool {
            self.phase == 1
        }

        fn phase_2(&self) -> bool {
            self.phase == 2
        }

        fn phase_3(&self) -> bool {
            self.phase == 3
        }

        fn phase_4(&self) -> bool {
            self.phase == 4
        }

        fn phase_8(&self) -> bool {
            self.phase == 8
        }

        fn phase_9(&self) -> bool {
            self.phase == 9
        }

        fn phase_10(&self) -> bool {
            self.phase == 10
        }
    }

    impl FlightPhasesAir for TestFlightPhases {
        fn phase_5(&self) -> bool {
            self.phase == 5
        }

        fn phase_6(&self) -> bool {
            self.phase == 6
        }

        fn phase_7(&self) -> bool {
            self.phase == 7
        }
    }
}
