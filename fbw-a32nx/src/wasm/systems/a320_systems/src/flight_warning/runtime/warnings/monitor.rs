use super::*;
use systems::flight_warning::logic::*;
use systems::flight_warning::parameters::Value;
use systems::flight_warning::utils::FwcSsm;

pub(in crate::flight_warning::runtime) trait GeneralCancel {
    fn mw_cancel_pulse_up(&self) -> bool;
    fn mc_cancel_pulse_up(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct GeneralCancelActivation {
    capt_mw_pulse: PulseNode,
    fo_mw_pulse: PulseNode,
    capt_mc_pulse: PulseNode,
    fo_mc_pulse: PulseNode,
    mw_cancel_pulse_up: bool,
    mc_cancel_pulse_up: bool,
}

impl Default for GeneralCancelActivation {
    fn default() -> Self {
        Self {
            capt_mw_pulse: PulseNode::new(true),
            fo_mw_pulse: PulseNode::new(true),
            capt_mc_pulse: PulseNode::new(true),
            fo_mc_pulse: PulseNode::new(true),
            mw_cancel_pulse_up: false,
            mc_cancel_pulse_up: false,
        }
    }
}

impl GeneralCancelActivation {
    pub fn update(
        &mut self,
        signals: &(impl CaptMwCancelOn + FoMwCancelOn + CaptMcCancelOn + FoMcCancelOn),
    ) {
        self.mw_cancel_pulse_up = self
            .capt_mw_pulse
            .update(signals.capt_mw_cancel_on().value())
            || self.fo_mw_pulse.update(signals.fo_mw_cancel_on().value());
        self.mc_cancel_pulse_up = self
            .capt_mc_pulse
            .update(signals.capt_mc_cancel_on().value())
            || self.fo_mc_pulse.update(signals.fo_mc_cancel_on().value());
    }
}

impl GeneralCancel for GeneralCancelActivation {
    fn mw_cancel_pulse_up(&self) -> bool {
        self.mw_cancel_pulse_up
    }

    fn mc_cancel_pulse_up(&self) -> bool {
        self.mc_cancel_pulse_up
    }
}

pub(in crate::flight_warning::runtime) trait GeneralRecall {
    fn rcl_pulse_up(&self) -> bool;
    fn rcl_pulse_dn(&self) -> bool;
    fn rcl_lvl(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct GeneralRecallActivation {
    pulse1: PulseNode,
    pulse2: PulseNode,
    pulse3: PulseNode,
    pulse4: PulseNode,
    mtrig1: MonostableTriggerNode,
    mtrig2: MonostableTriggerNode,
    rcl_pulse_up: bool,
    rcl_pulse_dn: bool,
    rcl_level: bool,
}

impl Default for GeneralRecallActivation {
    fn default() -> Self {
        Self {
            pulse1: PulseNode::new_leading(),
            pulse2: PulseNode::new_leading(),
            pulse3: PulseNode::new_falling(),
            pulse4: PulseNode::new_falling(),
            mtrig1: MonostableTriggerNode::new_leading(Duration::from_secs_f64(0.5)),
            mtrig2: MonostableTriggerNode::new_leading(Duration::from_secs_f64(0.5)),
            rcl_pulse_up: false,
            rcl_pulse_dn: false,
            rcl_level: false,
        }
    }
}

impl GeneralRecallActivation {
    pub fn update(&mut self, delta: Duration, signals: &(impl Rcl + EcpRecall)) {
        let rcl1 = signals.rcl();
        let rcl2 = signals.ecp_recall();

        let rcl1_up = self.pulse1.update(rcl1.value());
        let rcl2_up = self.pulse2.update(rcl2.value());
        let rcl1_dn = self.pulse3.update(rcl1.value());
        let rcl2_dn = self.pulse4.update(rcl2.value());

        let any_dn = self.mtrig2.update(rcl1_dn || rcl2_dn, delta);
        let dual_inv = rcl1.is_inv(); // todo rcl2.is_inv()

        self.rcl_pulse_up = self.mtrig1.update(rcl1_up || rcl2_up, delta);
        self.rcl_pulse_dn = any_dn && !dual_inv;
        self.rcl_level = rcl1.value() || rcl2.value();
    }
}

impl GeneralRecall for GeneralRecallActivation {
    fn rcl_pulse_up(&self) -> bool {
        self.rcl_pulse_up
    }

    fn rcl_pulse_dn(&self) -> bool {
        self.rcl_pulse_dn
    }

    fn rcl_lvl(&self) -> bool {
        self.rcl_level
    }
}

pub(in crate::flight_warning::runtime) trait AudioAttenuation {
    fn audio_attenuation(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AudioAttenuationActivation {
    audio_attenuation: bool,
}

impl AudioAttenuationActivation {
    pub fn update(
        &mut self,
        ground_sheet: &impl GroundDetection,
        engine_not_running_sheet: &impl EngineNotRunningCfm,
    ) {
        self.audio_attenuation = ground_sheet.ground()
            && engine_not_running_sheet.eng_1_not_running()
            && engine_not_running_sheet.eng_2_not_running();
    }
}

impl AudioAttenuation for AudioAttenuationActivation {
    fn audio_attenuation(&self) -> bool {
        self.audio_attenuation
    }
}
