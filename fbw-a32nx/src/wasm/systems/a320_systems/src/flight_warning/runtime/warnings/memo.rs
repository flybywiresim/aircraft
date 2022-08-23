use std::time::Duration;

use super::*;
use systems::flight_warning::logic::*;
use systems::flight_warning::parameters::{SignStatusMatrix, Value};
use systems::flight_warning::utils::FwcSsm;
use systems::warning_code;
use uom::si::length::foot;

pub(in crate::flight_warning::runtime) trait ToMemo {
    fn to_memo_computed(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct ToMemoActivation {
    conf: ConfirmationNode,
    mem: MemoryNode,
    to_memo_computed: bool,
}

impl Default for ToMemoActivation {
    fn default() -> Self {
        Self {
            conf: ConfirmationNode::new(true, Duration::from_secs(120)),
            mem: MemoryNode::new(false),
            to_memo_computed: false,
        }
    }
}

impl ToMemoActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &impl ToConfigTest,
        engine_not_running_sheet: &impl EngineNotRunningCfm,
        flight_phases_gnd_sheet: &impl FlightPhasesGround,
        flight_phases_air_sheet: &impl FlightPhasesAir,
    ) {
        let phase2 = flight_phases_gnd_sheet.phase_2();
        let set_mem =
            (phase2 || flight_phases_gnd_sheet.phase_9()) && signals.to_config_test().value();
        let reset_mem = flight_phases_gnd_sheet.phase_1()
            || flight_phases_gnd_sheet.phase_3()
            || flight_phases_air_sheet.phase_6()
            || flight_phases_gnd_sheet.phase_10();
        let mem_out = self.mem.update(set_mem, reset_mem);

        let both_eng_running = !engine_not_running_sheet.eng_1_not_running()
            && !engine_not_running_sheet.eng_2_not_running();
        let conf_out = self.conf.update(both_eng_running, delta);

        self.to_memo_computed = mem_out || (phase2 && conf_out);
    }
}

impl ToMemo for ToMemoActivation {
    fn to_memo_computed(&self) -> bool {
        self.to_memo_computed
    }
}

impl WarningConfiguration for ToMemoActivation {
    fn warning_type(&self) -> WarningType {
        WarningType::Memo
    }

    fn warning_code(&self) -> WarningCode {
        warning_code!("00", "00", "010")
    }

    fn flight_phases(&self) -> FlightPhases {
        FlightPhases::all()
    }
}

impl WarningActivation for ToMemoActivation {
    fn warning(&self) -> bool {
        self.to_memo_computed
    }
}

pub(in crate::flight_warning::runtime) trait LdgMemo {
    fn ldg_memo(&self) -> bool;
    fn config_memo_computed(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct LdgMemoActivation {
    conf1: ConfirmationNode,
    conf2: ConfirmationNode,
    mem_abv_2200: MemoryNode,
    mem_blw_2000: MemoryNode,
    ldg_memo: bool,
    config_memo_computed: bool,
}

impl Default for LdgMemoActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new_leading(Duration::from_secs(1)),
            conf2: ConfirmationNode::new_leading(Duration::from_secs(10)),
            mem_blw_2000: MemoryNode::new(true),
            mem_abv_2200: MemoryNode::new(false),
            ldg_memo: false,
            config_memo_computed: false,
        }
    }
}

impl LdgMemoActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &impl RadioHeight,
        flight_phases_gnd_sheet: &impl FlightPhasesGround,
        flight_phases_air_sheet: &impl FlightPhasesAir,
        lg_downlocked_sheet: &impl LgDownlocked,
        to_memo_sheet: &impl ToMemo,
    ) {
        let rh1 = signals.radio_height(1);
        let rh1_inv = rh1.is_inv();
        let rh1_inv_or_ncd = rh1_inv || rh1.is_ncd();
        let rh1_abv_2200 = rh1.value() > Length::new::<foot>(2200.0);
        let rh1_blw_2000 = rh1.value() < Length::new::<foot>(2000.0);

        let rh2 = signals.radio_height(2);
        let rh2_inv = rh2.is_inv();
        let rh2_inv_or_ncd = rh2_inv || rh2.is_ncd();
        let rh2_abv_2200 = rh2.value() > Length::new::<foot>(2200.0);
        let rh2_blw_2000 = rh2.value() < Length::new::<foot>(2000.0);

        let dual_ra_inv_or_ncd = rh1_inv_or_ncd && rh2_inv_or_ncd;
        let dual_ra_abv_2200_or_inv_or_ncd =
            (rh1_abv_2200 || rh1_inv_or_ncd) && (rh2_abv_2200 || rh2_inv_or_ncd);
        let any_ra_below_2000 =
            (!rh1_inv_or_ncd && rh1_blw_2000) || (!rh2_inv_or_ncd && rh2_blw_2000);

        let phase6 = flight_phases_air_sheet.phase_6();
        let phase7 = flight_phases_air_sheet.phase_7();
        let phase8 = flight_phases_gnd_sheet.phase_8();

        let set_mem_abv_2200 = self
            .conf1
            .update(!dual_ra_inv_or_ncd && dual_ra_abv_2200_or_inv_or_ncd, delta);
        let abv_2200 = self
            .mem_abv_2200
            .update(set_mem_abv_2200, !(phase6 || phase7 || phase8));

        let blw_2000 = self
            .mem_blw_2000
            .update(any_ra_below_2000, dual_ra_abv_2200_or_inv_or_ncd);

        let lg_down_flight = false;
        let dual_ra_inv_lg_downlocked = self.conf2.update(
            rh1_inv && rh2_inv && lg_downlocked_sheet.lg_downlocked() && !lg_down_flight && phase6,
            delta,
        );

        self.ldg_memo =
            (abv_2200 && blw_2000 && phase6) || phase7 || phase8 || dual_ra_inv_lg_downlocked;

        self.config_memo_computed = to_memo_sheet.to_memo_computed() || self.ldg_memo;
    }
}

impl LdgMemo for LdgMemoActivation {
    fn ldg_memo(&self) -> bool {
        self.ldg_memo
    }

    fn config_memo_computed(&self) -> bool {
        self.config_memo_computed
    }
}

impl WarningConfiguration for LdgMemoActivation {
    fn warning_type(&self) -> WarningType {
        WarningType::Memo
    }

    fn warning_code(&self) -> WarningCode {
        warning_code!("00", "00", "020")
    }

    fn flight_phases(&self) -> FlightPhases {
        FlightPhases::all()
    }
}

impl WarningActivation for LdgMemoActivation {
    fn warning(&self) -> bool {
        self.ldg_memo
    }
}

pub(in crate::flight_warning::runtime) trait MemoFlightPhaseInhibOvrd {
    fn flight_phase_inhib_ovrd(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct MemoFlightPhaseInhibOvrdActivation {
    pulse1: PulseNode,
    pulse2: PulseNode,
    pulse3: PulseNode,
    pulse4: PulseNode,
    pulse5: PulseNode,
    pulse6: PulseNode,
    pulse7: PulseNode,
    pulse8: PulseNode,
    pulse9: PulseNode,
    pulse10: PulseNode,
    memo: MemoryNode,
    flight_phase_inhib_ovrd: bool,
}

impl Default for MemoFlightPhaseInhibOvrdActivation {
    fn default() -> Self {
        Self {
            pulse1: PulseNode::new_falling(),
            pulse2: PulseNode::new_falling(),
            pulse3: PulseNode::new_falling(),
            pulse4: PulseNode::new_falling(),
            pulse5: PulseNode::new_falling(),
            pulse6: PulseNode::new_falling(),
            pulse7: PulseNode::new_falling(),
            pulse8: PulseNode::new_falling(),
            pulse9: PulseNode::new_falling(),
            pulse10: PulseNode::new_falling(),
            memo: MemoryNode::new(false),
            flight_phase_inhib_ovrd: false,
        }
    }
}

impl MemoFlightPhaseInhibOvrdActivation {
    pub fn update(
        &mut self,
        general_recall: &impl GeneralRecall,
        flight_phases_gnd_sheet: &impl FlightPhasesGround,
        flight_phases_air_sheet: &impl FlightPhasesAir,
    ) {
        // detect the end of any individual flight phase
        let pulse1_out = self.pulse1.update(flight_phases_gnd_sheet.phase_1());
        let pulse2_out = self.pulse2.update(flight_phases_gnd_sheet.phase_2());
        let pulse3_out = self.pulse3.update(flight_phases_gnd_sheet.phase_3());
        let pulse4_out = self.pulse4.update(flight_phases_gnd_sheet.phase_4());
        let pulse5_out = self.pulse5.update(flight_phases_air_sheet.phase_5());
        let pulse6_out = self.pulse6.update(flight_phases_air_sheet.phase_6());
        let pulse7_out = self.pulse7.update(flight_phases_air_sheet.phase_7());
        let pulse8_out = self.pulse8.update(flight_phases_gnd_sheet.phase_8());
        let pulse9_out = self.pulse9.update(flight_phases_gnd_sheet.phase_9());
        let pulse10_out = self.pulse10.update(flight_phases_gnd_sheet.phase_10());

        let set = general_recall.rcl_pulse_up();
        let reset = pulse1_out
            || pulse2_out
            || pulse3_out
            || pulse4_out
            || pulse5_out
            || pulse6_out
            || pulse7_out
            || pulse8_out
            || pulse9_out
            || pulse10_out;

        self.flight_phase_inhib_ovrd = self.memo.update(set, reset);
    }
}

impl MemoFlightPhaseInhibOvrd for MemoFlightPhaseInhibOvrdActivation {
    fn flight_phase_inhib_ovrd(&self) -> bool {
        self.flight_phase_inhib_ovrd
    }
}

pub(in crate::flight_warning::runtime) struct ToInhibitMemoActivation {
    conf1: ConfirmationNode,
    to_inhibit: bool,
}

impl Default for ToInhibitMemoActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new_leading(Duration::from_secs(3)),
            to_inhibit: false,
        }
    }
}

impl ToInhibitMemoActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        flight_phase_inhib_ovrd: &impl MemoFlightPhaseInhibOvrd,
        flight_phases_gnd_sheet: &impl FlightPhasesGround,
        flight_phases_air_sheet: &impl FlightPhasesAir,
    ) {
        let valid_phase = flight_phases_gnd_sheet.phase_3()
            || flight_phases_gnd_sheet.phase_4()
            || flight_phases_air_sheet.phase_5();
        let inhib_override = flight_phase_inhib_ovrd.flight_phase_inhib_ovrd();
        self.to_inhibit = self.conf1.update(valid_phase && !inhib_override, delta);
    }
}

impl WarningConfiguration for ToInhibitMemoActivation {
    fn warning_type(&self) -> WarningType {
        WarningType::SpecialLine
    }

    fn warning_code(&self) -> WarningCode {
        warning_code!("00", "00", "140")
    }

    fn flight_phases(&self) -> FlightPhases {
        FlightPhases::all()
    }
}

impl WarningActivation for ToInhibitMemoActivation {
    fn warning(&self) -> bool {
        self.to_inhibit
    }
}

pub(in crate::flight_warning::runtime) struct LdgInhibitMemoActivation {
    conf1: ConfirmationNode,
    ldg_inhibit: bool,
}

impl Default for LdgInhibitMemoActivation {
    fn default() -> Self {
        Self {
            conf1: ConfirmationNode::new_leading(Duration::from_secs(3)),
            ldg_inhibit: false,
        }
    }
}

impl LdgInhibitMemoActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        flight_phase_inhib_ovrd: &impl MemoFlightPhaseInhibOvrd,
        flight_phases_gnd_sheet: &impl FlightPhasesGround,
        flight_phases_air_sheet: &impl FlightPhasesAir,
    ) {
        let valid_phase = flight_phases_air_sheet.phase_7() || flight_phases_gnd_sheet.phase_8();
        let inhib_override = flight_phase_inhib_ovrd.flight_phase_inhib_ovrd();
        self.ldg_inhibit = self.conf1.update(valid_phase && !inhib_override, delta);
    }
}

impl WarningConfiguration for LdgInhibitMemoActivation {
    fn warning_type(&self) -> WarningType {
        WarningType::SpecialLine
    }

    fn warning_code(&self) -> WarningCode {
        warning_code!("00", "00", "150")
    }

    fn flight_phases(&self) -> FlightPhases {
        FlightPhases::all()
    }
}

impl WarningActivation for LdgInhibitMemoActivation {
    fn warning(&self) -> bool {
        self.ldg_inhibit
    }
}
