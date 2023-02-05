use super::parameters::A320FwcParameterTable;
use systems::flight_warning::parameters::*;
use uom::si::angle::degree;
use uom::si::f64::*;
use uom::si::length::foot;

pub struct A320FwcParameterTestBed {
    parameters: A320FwcParameterTable,
}
impl A320FwcParameterTestBed {
    pub fn new() -> Self {
        Self {
            parameters: A320FwcParameterTable::new(),
        }
    }

    pub fn and(self) -> Self {
        self
    }

    pub fn with(self) -> Self {
        self
    }

    pub fn parameters(&self) -> &A320FwcParameterTable {
        &self.parameters
    }

    pub fn takeoff_config_test_pressed(mut self) -> Self {
        self.parameters.to_config_test = Arinc429Parameter::new_no(true);
        self
    }

    pub fn on_ground(self) -> Self {
        self.ess_lh_lg_compressed()
            .norm_lh_lg_compressed()
            .lh_lg_compressed(1)
            .lh_lg_compressed(2)
            .radio_heights(Length::new::<foot>(0.0), Length::new::<foot>(0.0))
    }

    pub fn one_engine_running(self) -> Self {
        self.eng1_master_lever_select_on().eng1_at_or_above_idle()
    }

    pub fn engines_running(self) -> Self {
        self.eng1_master_lever_select_on()
            .eng1_at_or_above_idle()
            .eng2_master_lever_select_on()
            .eng2_at_or_above_idle()
    }

    pub fn engines_at_takeoff_power(self) -> Self {
        self.eng1_tla(Angle::new::<degree>(45.0))
            .eng2_tla(Angle::new::<degree>(45.0))
    }

    pub fn engines_at_idle(self) -> Self {
        self.eng1_tla(Angle::new::<degree>(0.0))
            .eng2_tla(Angle::new::<degree>(0.0))
    }

    pub fn computed_speeds(mut self, speed1: Velocity, speed2: Velocity, speed3: Velocity) -> Self {
        self.parameters.computed_speed_1 = Arinc429Parameter::new_no(speed1);
        self.parameters.computed_speed_2 = Arinc429Parameter::new_no(speed2);
        self.parameters.computed_speed_3 = Arinc429Parameter::new_no(speed3);
        self
    }

    pub fn computed_speed_1(mut self, speed: Velocity) -> Self {
        self.parameters.computed_speed_1 = Arinc429Parameter::new_no(speed);
        self
    }

    pub fn computed_speed_2(mut self, speed: Velocity) -> Self {
        self.parameters.computed_speed_2 = Arinc429Parameter::new_no(speed);
        self
    }

    pub fn computed_speed_3(mut self, speed: Velocity) -> Self {
        self.parameters.computed_speed_3 = Arinc429Parameter::new_no(speed);
        self
    }

    pub fn lh_lg_compressed(mut self, lgciu: usize) -> Self {
        match lgciu {
            1 => self.parameters.lh_lg_compressed_1 = Arinc429Parameter::new_no(true),
            2 => self.parameters.lh_lg_compressed_2 = Arinc429Parameter::new_no(true),
            _ => panic!(),
        }
        self
    }

    pub fn lh_lg_extended(mut self, lgciu: usize) -> Self {
        match lgciu {
            1 => self.parameters.lh_lg_compressed_1 = Arinc429Parameter::new_no(false),
            2 => self.parameters.lh_lg_compressed_2 = Arinc429Parameter::new_no(false),
            _ => panic!(),
        }
        self
    }

    pub fn ess_lh_lg_compressed(mut self) -> Self {
        self.parameters.ess_lh_lg_compressed = DiscreteParameter::new(true);
        self
    }

    pub fn norm_lh_lg_compressed(mut self) -> Self {
        self.parameters.norm_lh_lg_compressed = DiscreteParameter::new(true);
        self
    }

    pub fn lh_gear_downlocked(mut self, downlocked: bool) -> Self {
        self.parameters.lh_gear_down_lock_1 = Arinc429Parameter::new_no(downlocked);
        self.parameters.lh_gear_down_lock_2 = Arinc429Parameter::new_no(downlocked);
        self
    }

    pub fn rh_gear_downlocked(mut self, downlocked: bool) -> Self {
        self.parameters.rh_gear_down_lock_1 = Arinc429Parameter::new_no(downlocked);
        self.parameters.rh_gear_down_lock_2 = Arinc429Parameter::new_no(downlocked);
        self
    }

    pub fn nose_gear_downlocked(mut self, downlocked: bool) -> Self {
        self.parameters.nose_gear_down_lock_1 = Arinc429Parameter::new_no(downlocked);
        self.parameters.nose_gear_down_lock_2 = Arinc429Parameter::new_no(downlocked);
        self
    }

    pub fn radio_heights(mut self, height1: Length, height2: Length) -> Self {
        self.parameters.radio_height_1 = Arinc429Parameter::new_no(height1);
        self.parameters.radio_height_2 = Arinc429Parameter::new_no(height2);
        self
    }

    /// Simulates a flight at cruise, where the radio altimeters will not be able to receive a
    /// valid ground return and mark their data as NCD.
    pub fn radio_heights_at_cruise(mut self) -> Self {
        self.parameters.radio_height_1 = Arinc429Parameter::new_ncd(Length::new::<foot>(10000.0));
        self.parameters.radio_height_2 = Arinc429Parameter::new_ncd(Length::new::<foot>(10000.0));
        self
    }

    pub fn eng1_fire_pb_out(mut self) -> Self {
        self.parameters.eng_1_fire_pb_out = DiscreteParameter::new(true);
        self
    }

    pub fn eng1_master_lever_select_on(mut self) -> Self {
        self.parameters.eng1_master_lever_select_on = Arinc429Parameter::new_no(true);
        self.parameters.eng1_channel_a_in_control = Arinc429Parameter::new_no(true);
        self.parameters.eng1_channel_b_in_control = Arinc429Parameter::new_no(false);
        self
    }

    pub fn eng2_master_lever_select_on(mut self) -> Self {
        self.parameters.eng2_master_lever_select_on = Arinc429Parameter::new_no(true);
        self.parameters.eng2_channel_a_in_control = Arinc429Parameter::new_no(true);
        self.parameters.eng2_channel_b_in_control = Arinc429Parameter::new_no(false);
        self
    }

    pub fn eng1_at_or_above_idle(mut self) -> Self {
        self.parameters.eng1_core_speed_at_or_above_idle_a = Arinc429Parameter::new_no(true);
        self.parameters.eng1_core_speed_at_or_above_idle_b = Arinc429Parameter::new_no(true);
        self
    }

    pub fn eng2_at_or_above_idle(mut self) -> Self {
        self.parameters.eng2_core_speed_at_or_above_idle_a = Arinc429Parameter::new_no(true);
        self.parameters.eng2_core_speed_at_or_above_idle_b = Arinc429Parameter::new_no(true);
        self
    }

    pub fn eng1_tla(mut self, tla: Angle) -> Self {
        self.parameters.eng1_tla_a = Arinc429Parameter::new_no(tla);
        self.parameters.eng1_tla_b = Arinc429Parameter::new_no(tla);
        self
    }

    pub fn eng1_tla_a(mut self, tla: Angle) -> Self {
        self.parameters.eng1_tla_a = Arinc429Parameter::new_no(tla);
        self
    }

    pub fn eng1_tla_b(mut self, tla: Angle) -> Self {
        self.parameters.eng1_tla_b = Arinc429Parameter::new_no(tla);
        self
    }

    pub fn eng2_tla(mut self, tla: Angle) -> Self {
        self.parameters.eng2_tla_a = Arinc429Parameter::new_no(tla);
        self.parameters.eng2_tla_b = Arinc429Parameter::new_no(tla);
        self
    }

    pub fn eng2_tla_a(mut self, tla: Angle) -> Self {
        self.parameters.eng2_tla_a = Arinc429Parameter::new_no(tla);
        self
    }

    pub fn eng2_tla_b(mut self, tla: Angle) -> Self {
        self.parameters.eng2_tla_b = Arinc429Parameter::new_no(tla);
        self
    }

    pub fn ap1_engaged(mut self, engaged: bool) -> Self {
        self.parameters.ap1_engd_com = DiscreteParameter::new(engaged);
        self.parameters.ap1_engd_mon = DiscreteParameter::new(engaged);
        self
    }

    pub fn ap2_engaged(mut self, engaged: bool) -> Self {
        self.parameters.ap2_engd_com = DiscreteParameter::new(engaged);
        self.parameters.ap2_engd_mon = DiscreteParameter::new(engaged);
        self
    }

    pub fn instinc_disconnect_1ap_engd(mut self, engaged: bool) -> Self {
        self.parameters.instinc_discnct_1ap_engd = DiscreteParameter::new(engaged);
        self
    }

    pub fn instinc_disconnect_2ap_engd(mut self, engaged: bool) -> Self {
        self.parameters.instinc_discnct_1ap_engd = DiscreteParameter::new(engaged);
        self
    }

    pub fn athr_engaged(mut self, engaged: bool) -> Self {
        self.parameters.athr_engaged = Arinc429Parameter::new_no(engaged);
        self
    }

    pub fn land_trk_mode_on(mut self, on: bool) -> Self {
        self.parameters.land_trk_mode_on_1 = Arinc429Parameter::new_no(on);
        self.parameters.land_trk_mode_on_2 = Arinc429Parameter::new_no(on);
        self
    }
}

pub fn test_bed() -> A320FwcParameterTestBed {
    A320FwcParameterTestBed::new()
}

pub fn test_bed_with() -> A320FwcParameterTestBed {
    test_bed()
}
