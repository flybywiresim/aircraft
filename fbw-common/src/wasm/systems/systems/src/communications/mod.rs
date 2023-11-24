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

    previous_side_controlling: SideControlling,

    sel_light: bool,
}

impl Communications {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            amu: AudioManagementUnit::new(context),

            rmp_cpt: Some(RadioManagementPanel::new_cpt(context)),
            rmp_fo: Some(RadioManagementPanel::new_fo(context)),

            sel_light_id: context.get_identifier("RMP_SEL_LIGHT_ON".to_owned()),

            previous_side_controlling: SideControlling::CAPTAIN,

            sel_light: false,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.amu.update(context);

        self.sel_light = (self.rmp_cpt.as_ref().unwrap().is_powered()
            && self.rmp_fo.as_ref().unwrap().is_powered())
            && (self.rmp_cpt.as_ref().unwrap().is_abnormal_mode()
                || self.rmp_cpt.as_ref().unwrap().is_abnormal_mode());

        self.previous_side_controlling = context.side_controlling();
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
    }
}

#[cfg(test)]
mod communications_tests {
    use super::*;
    use crate::simulation::{
        test::{SimulationTestBed, TestBed, WriteByName},
        Aircraft,
    };

    pub struct TestCommunications {
        communications: Communications,
    }
    impl TestCommunications {
        fn new(context: &mut InitContext) -> Self {
            Self {
                communications: Communications::new(context),
            }
        }
    }

    fn test_bed() -> CommunicationsTestBed {
        CommunicationsTestBed::new()
    }

    impl SimulationElement for TestCommunications {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.communications.accept(visitor);
            visitor.visit(self);
        }
    }

    impl Aircraft for TestCommunications {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.communications.update(context);
        }
    }

    struct CommunicationsTestBed {
        test_bed: SimulationTestBed<TestCommunications>,
    }
    impl CommunicationsTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(TestCommunications::new),
            }
        }
    }
    impl TestBed for CommunicationsTestBed {
        type Aircraft = TestCommunications;

        fn test_bed(&self) -> &SimulationTestBed<TestCommunications> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestCommunications> {
            &mut self.test_bed
        }
    }

    impl SimulationElement for CommunicationsTestBed {}

    #[test]
    fn test_unpack() {
        let mut test_bed = test_bed();
        //13831281
        //883636401
        test_bed.write_by_name("ADF1_IDENT_PACKED", 883636401);
        test_bed.write_by_name("ACP1_ADF1_KNOB_VOLUME_DOWN", 1);
        test_bed.write_by_name("ACP1_VHF1_VOLUME", 50);
        test_bed.write_by_name("AUDIOSWITCHING_KNOB", 1);
        test_bed.write_by_name("SIDE_CONTROLLING", 0);

        test_bed.run();

        //let value: f64 = test_bed.read_by_name("COM VOLUME:1");
        //assert!(value == 50);
    }
}
