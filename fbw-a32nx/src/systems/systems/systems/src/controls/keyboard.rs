use crate::{
    controls::{
        keyboard_and_cursor_control_unit::Button,
        power_supply_relay::PowerSupplyRelay,
    },
    simulation::{InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader, VariableIdentifier},
    shared::{
        ElectricalBusType,
    },
};

pub struct Keyboard {
    power_supply: PowerSupplyRelay,
    key_esc: Button,
    key_clr_info: Button,
    key_dir: Button,
    key_perf: Button,
    key_init: Button,
    key_nav_aid: Button,
    key_mailbox: Button,
    key_fpln: Button,
    key_dest: Button,
    key_sec_index: Button,
    key_surv: Button,
    key_atccom: Button,
    key_up: Button,
    key_down: Button,
    key_left: Button,
    key_right: Button,
    key_q: Button,
    key_w: Button,
    key_e: Button,
    key_r: Button,
    key_t: Button,
    key_y: Button,
    key_u: Button,
    key_i: Button,
    key_o: Button,
    key_p: Button,
    key_backspace: Button,
    key_a: Button,
    key_s: Button,
    key_d: Button,
    key_f: Button,
    key_g: Button,
    key_h: Button,
    key_j: Button,
    key_k: Button,
    key_l: Button,
    key_slash: Button,
    key_z: Button,
    key_x: Button,
    key_c: Button,
    key_v: Button,
    key_b: Button,
    key_n: Button,
    key_m: Button,
    key_space: Button,
    key_enter: Button,
    key_1: Button,
    key_2: Button,
    key_3: Button,
    key_4: Button,
    key_5: Button,
    key_6: Button,
    key_7: Button,
    key_8: Button,
    key_9: Button,
    key_dot: Button,
    key_0: Button,
    key_plus_minus: Button,
    switch_kbd_id: VariableIdentifier,
    switch_kbd_value: f64,
}

impl Keyboard {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        primary_power_supply: ElectricalBusType,
        fallback_power_supply: ElectricalBusType,
    ) -> Self {
        Keyboard {
            power_supply: PowerSupplyRelay::new(primary_power_supply, fallback_power_supply),
            key_esc: Button::new(context, side, "ESC"),
            key_clr_info: Button::new(context, side, "CLRINFO"),
            key_dir: Button::new(context, side, "DIR"),
            key_perf: Button::new(context, side, "PERF"),
            key_init: Button::new(context, side, "INIT"),
            key_nav_aid: Button::new(context, side, "NAVAID"),
            key_mailbox: Button::new(context, side, "MAILBOX"),
            key_fpln: Button::new(context, side, "FPLN"),
            key_dest: Button::new(context, side, "DEST"),
            key_sec_index: Button::new(context, side, "SECINDEX"),
            key_surv: Button::new(context, side, "SURV"),
            key_atccom: Button::new(context, side, "ATCCOM"),
            key_up: Button::new(context, side, "UP"),
            key_down: Button::new(context, side, "DOWN"),
            key_left: Button::new(context, side, "LEFT"),
            key_right: Button::new(context, side, "RIGHT"),
            key_q: Button::new(context, side, "Q"),
            key_w: Button::new(context, side, "W"),
            key_e: Button::new(context, side, "E"),
            key_r: Button::new(context, side, "R"),
            key_t: Button::new(context, side, "T"),
            key_y: Button::new(context, side, "Y"),
            key_u: Button::new(context, side, "U"),
            key_i: Button::new(context, side, "I"),
            key_o: Button::new(context, side, "O"),
            key_p: Button::new(context, side, "P"),
            key_backspace: Button::new(context, side, "BACKSPACE"),
            key_a: Button::new(context, side, "A"),
            key_s: Button::new(context, side, "S"),
            key_d: Button::new(context, side, "D"),
            key_f: Button::new(context, side, "F"),
            key_g: Button::new(context, side, "G"),
            key_h: Button::new(context, side, "H"),
            key_j: Button::new(context, side, "J"),
            key_k: Button::new(context, side, "K"),
            key_l: Button::new(context, side, "L"),
            key_slash: Button::new(context, side, "SLASH"),
            key_z: Button::new(context, side, "Z"),
            key_x: Button::new(context, side, "X"),
            key_c: Button::new(context, side, "C"),
            key_v: Button::new(context, side, "V"),
            key_b: Button::new(context, side, "B"),
            key_n: Button::new(context, side, "N"),
            key_m: Button::new(context, side, "M"),
            key_space: Button::new(context, side, "SP"),
            key_enter: Button::new(context, side, "ENT"),
            key_1: Button::new(context, side, "1"),
            key_2: Button::new(context, side, "2"),
            key_3: Button::new(context, side, "3"),
            key_4: Button::new(context, side, "4"),
            key_5: Button::new(context, side, "5"),
            key_6: Button::new(context, side, "6"),
            key_7: Button::new(context, side, "7"),
            key_8: Button::new(context, side, "8"),
            key_9: Button::new(context, side, "9"),
            key_dot: Button::new(context, side, "DOT"),
            key_0: Button::new(context, side, "0"),
            key_plus_minus: Button::new(context, side, "PLUSMINUS"),
            // TODO use correct identifier
            switch_kbd_id: context.get_identifier(format!("KCCU_")),
            switch_kbd_value: 0.0,
        }
    }
}

impl SimulationElement for Keyboard {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.power_supply.accept(visitor);
        self.key_esc.accept(visitor);
        self.key_clr_info.accept(visitor);
        self.key_dir.accept(visitor);
        self.key_perf.accept(visitor);
        self.key_init.accept(visitor);
        self.key_nav_aid.accept(visitor);
        self.key_mailbox.accept(visitor);
        self.key_fpln.accept(visitor);
        self.key_dest.accept(visitor);
        self.key_sec_index.accept(visitor);
        self.key_surv.accept(visitor);
        self.key_atccom.accept(visitor);
        self.key_up.accept(visitor);
        self.key_down.accept(visitor);
        self.key_left.accept(visitor);
        self.key_right.accept(visitor);
        self.key_q.accept(visitor);
        self.key_w.accept(visitor);
        self.key_e.accept(visitor);
        self.key_r.accept(visitor);
        self.key_t.accept(visitor);
        self.key_y.accept(visitor);
        self.key_u.accept(visitor);
        self.key_i.accept(visitor);
        self.key_o.accept(visitor);
        self.key_p.accept(visitor);
        self.key_backspace.accept(visitor);
        self.key_a.accept(visitor);
        self.key_s.accept(visitor);
        self.key_d.accept(visitor);
        self.key_f.accept(visitor);
        self.key_g.accept(visitor);
        self.key_h.accept(visitor);
        self.key_j.accept(visitor);
        self.key_k.accept(visitor);
        self.key_l.accept(visitor);
        self.key_slash.accept(visitor);
        self.key_z.accept(visitor);
        self.key_x.accept(visitor);
        self.key_c.accept(visitor);
        self.key_v.accept(visitor);
        self.key_b.accept(visitor);
        self.key_n.accept(visitor);
        self.key_m.accept(visitor);
        self.key_space.accept(visitor);
        self.key_enter.accept(visitor);
        self.key_1.accept(visitor);
        self.key_2.accept(visitor);
        self.key_3.accept(visitor);
        self.key_4.accept(visitor);
        self.key_5.accept(visitor);
        self.key_6.accept(visitor);
        self.key_7.accept(visitor);
        self.key_8.accept(visitor);
        self.key_9.accept(visitor);
        self.key_dot.accept(visitor);
        self.key_0.accept(visitor);
        self.key_plus_minus.accept(visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.switch_kbd_value = reader.read(&self.switch_kbd_id);
    }
}
