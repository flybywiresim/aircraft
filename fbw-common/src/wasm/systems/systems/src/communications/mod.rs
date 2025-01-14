mod audio_control_panel;
mod audio_management_unit;
mod radio_management_panel;
mod receivers;

use crate::simulation::{
    InitContext, SideControlling, SimulationElement, SimulationElementVisitor, SimulatorWriter,
    UpdateContext, VariableIdentifier, Write,
};

use self::audio_management_unit::AudioManagementUnit;
use self::radio_management_panel::RadioManagementPanel;

pub struct Communications {
    amu: AudioManagementUnit,

    rmp_cpt: Option<RadioManagementPanel>,
    rmp_fo: Option<RadioManagementPanel>,

    sel_light_id: VariableIdentifier,
    nav_backup_mode_id: VariableIdentifier,

    sel_light: bool,
    nav_backup_mode: bool,
}

impl Communications {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            amu: AudioManagementUnit::new(context),
            rmp_cpt: Some(RadioManagementPanel::new_cpt(context)),
            rmp_fo: Some(RadioManagementPanel::new_fo(context)),

            sel_light_id: context.get_identifier("RMP_SEL_LIGHT_ON".to_owned()),
            nav_backup_mode_id: context.get_identifier("RMP_NAV_BACKUP_MODE".to_owned()),

            sel_light: false,
            nav_backup_mode: false,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.amu.update(context);

        if self.rmp_cpt.as_ref().unwrap().is_powered() && self.rmp_fo.as_ref().unwrap().is_powered()
        {
            self.sel_light = (self.rmp_cpt.as_ref().unwrap().is_abnormal_mode()
                || self.rmp_fo.as_ref().unwrap().is_abnormal_mode());

            self.nav_backup_mode = self.rmp_cpt.as_ref().unwrap().is_nav_backup_mode()
                && self.rmp_fo.as_ref().unwrap().is_nav_backup_mode()
        } else {
            self.sel_light = false;
            self.nav_backup_mode = false;
        }
    }
}

impl SimulationElement for Communications {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.rmp_cpt.as_mut().unwrap().accept(visitor);
        self.rmp_fo.as_mut().unwrap().accept(visitor);

        self.amu.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.sel_light_id, self.sel_light);
        writer.write(&self.nav_backup_mode_id, self.nav_backup_mode);
    }
}
