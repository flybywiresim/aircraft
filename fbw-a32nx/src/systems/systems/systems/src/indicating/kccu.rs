use crate::{
    simulation::{InitContext, Read, SimulationElement, SimulatorReader, SimulationWriter, VariableIdentifier},
    shared::arinc429::{Arinc429Word, SignStatus},
};

struct KCCU {
    // function keys
    key_esc_top_left_id: VariableIdentifier,
    key_esc_bottom_left_id: VariableIdentifier,
    key_clr_info_id: VariableIdentifier,
    key_dir_id: VariableIdentifier,
    key_perf_id: VariableIdentifier,
    key_init_id: VariableIdentifier,
    key_nav_aid_id: VariableIdentifier,
    key_mailbox_id: VariableIdentifier,
    key_fpln_id: VariableIdentifier,
    key_dest_id: VariableIdentifier,
    key_sec_index_id: VariableIdentifier,
    key_surv_id: VariableIdentifier,
    key_atccom_id: VariableIdentifier,
    key_kbd_id: VariableIdentifier,
    key_navigation_left_id: VariableIdentifier,
    key_navigation_right_id: VariableIdentifier,

    // direction keys
    key_up_id: VariableIdentifier,
    key_down_id: VariableIdentifier,
    key_left_id: VariableIdentifier,
    key_right_id: VariableIdentifier,

    // alphabetic keys
    key_q_id: VariableIdentifier,
    key_w_id: VariableIdentifier,
    key_e_id: VariableIdentifier,
    key_r_id: VariableIdentifier,
    key_t_id: VariableIdentifier,
    key_y_id: VariableIdentifier,
    key_u_id: VariableIdentifier,
    key_i_id: VariableIdentifier,
    key_o_id: VariableIdentifier,
    key_p_id: VariableIdentifier,
    key_backspace_id: VariableIdentifier,
    key_a_id: VariableIdentifier,
    key_s_id: VariableIdentifier,
    key_d_id: VariableIdentifier,
    key_f_id: VariableIdentifier,
    key_g_id: VariableIdentifier,
    key_h_id: VariableIdentifier,
    key_j_id: VariableIdentifier,
    key_k_id: VariableIdentifier,
    key_l_id: VariableIdentifier,
    key_slash_id: VariableIdentifier,
    key_z_id: VariableIdentifier,
    key_x_id: VariableIdentifier,
    key_c_id: VariableIdentifier,
    key_v_id: VariableIdentifier,
    key_b_id: VariableIdentifier,
    key_n_id: VariableIdentifier,
    key_m_id: VariableIdentifier,
    key_space_id: VariableIdentifier,
    key_enter_id: VariableIdentifier,

    // numpad keys
    key_1_id: VariableIdentifier,
    key_2_id: VariableIdentifier,
    key_3_id: VariableIdentifier,
    key_4_id: VariableIdentifier,
    key_5_id: VariableIdentifier,
    key_6_id: VariableIdentifier,
    key_7_id: VariableIdentifier,
    key_8_id: VariableIdentifier,
    key_9_id: VariableIdentifier,
    key_dot_id: VariableIdentifier,
    key_0_id: VariableIdentifier,
    key_plus_minus_id: VariableIdentifier,

    // switches
    switch_ccd_id: VariableIdentifier,
    switch_kbd_id: VariableIdentifier,
}

impl KCCU {
    pub new fn(context: &mut InitContext, side: &str) -> Self {
        KCCU {

        }
    }
}

impl SimulationElement for KCCU {
    fn read(&mut self, reader: &mut SimulatorReader) {

    }

    fn write(&mut self, writer: &mut SimulationWriter) {

    }
}
