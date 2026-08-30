use crate::{
    hydraulic::flap_slat::{SecondarySurfaceSide, SecondarySurfaceType, WingTipBrakeController},
    shared::SectionPressure,
    simulation::{InitContext, SimulationElement, SimulatorWriter, VariableIdentifier, Write},
};
use uom::si::f64::*;
use uom::si::pressure::bar;

pub struct WingTipBrake {
    wtb_id: VariableIdentifier,

    side: SecondarySurfaceSide,
    is_active: bool,
}
impl WingTipBrake {
    const MIN_PRESSURE_TO_CLAMP_BAR: f64 = 130.;

    pub fn new(
        context: &mut InitContext,
        id: SecondarySurfaceType,
        side: SecondarySurfaceSide,
    ) -> Self {
        Self {
            wtb_id: context.get_identifier(format!("{side}_{id}_WTB_ACTIVE",)),
            side,
            is_active: false,
        }
    }

    pub fn update(
        &mut self,
        sfcc_1: &impl WingTipBrakeController,
        sfcc_2: &impl WingTipBrakeController,
        pressure_1: &impl SectionPressure,
        pressure_2: &impl SectionPressure,
    ) {
        let minimum_hydraulic_pressure = Pressure::new::<bar>(Self::MIN_PRESSURE_TO_CLAMP_BAR);
        let piston_1_clamping = sfcc_1.get_wtb_status(self.side).is_energised()
            && pressure_1.pressure_downstream_leak_valve() >= minimum_hydraulic_pressure;
        let piston_2_clamping = sfcc_2.get_wtb_status(self.side).is_energised()
            && pressure_2.pressure_downstream_leak_valve() >= minimum_hydraulic_pressure;
        self.is_active = piston_1_clamping || piston_2_clamping
    }
    pub fn is_active(&self) -> bool {
        self.is_active
    }
}
impl SimulationElement for WingTipBrake {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.wtb_id, self.is_active());
    }
}

#[cfg(test)]
mod wing_tip_brake_tests {
    use std::time::Duration;

    use uom::{si::pressure::psi, ConstZero};

    use crate::{
        hydraulic::flap_slat::{
            SecondarySurfaceSide, SolenoidStatus, ValveBlockController, WingTipBrakeController,
        },
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };

    use super::*;

    #[derive(Default)]
    struct TestHydraulicSection {
        pressure: Pressure,
    }
    impl TestHydraulicSection {
        fn set_pressure(&mut self, pressure: Pressure) {
            self.pressure = pressure;
        }
    }
    impl SectionPressure for TestHydraulicSection {
        fn pressure(&self) -> Pressure {
            self.pressure
        }

        fn pressure_downstream_leak_valve(&self) -> Pressure {
            self.pressure
        }

        fn pressure_downstream_priority_valve(&self) -> Pressure {
            self.pressure
        }

        fn is_pressure_switch_pressurised(&self) -> bool {
            self.pressure.get::<psi>() > 1700.
        }
    }

    struct TestSfcc {
        pob_solenoid: SolenoidStatus,
        retract_solenoid: SolenoidStatus,
        extend_solenoid: SolenoidStatus,
        wtb_solenoid: SolenoidStatus,
    }
    impl TestSfcc {
        pub fn new() -> Self {
            TestSfcc {
                pob_solenoid: SolenoidStatus::DeEnergised,
                retract_solenoid: SolenoidStatus::DeEnergised,
                extend_solenoid: SolenoidStatus::DeEnergised,
                wtb_solenoid: SolenoidStatus::DeEnergised,
            }
        }
    }
    impl ValveBlockController for TestSfcc {
        fn get_pob_status(&self) -> SolenoidStatus {
            self.pob_solenoid
        }

        fn get_retract_status(&self) -> SolenoidStatus {
            self.retract_solenoid
        }

        fn get_extend_status(&self) -> SolenoidStatus {
            self.extend_solenoid
        }
    }
    impl WingTipBrakeController for TestSfcc {
        fn get_wtb_status(&self, _side: SecondarySurfaceSide) -> SolenoidStatus {
            self.wtb_solenoid
        }
    }

    struct TestAircraft {
        hydraulic_circuit: [TestHydraulicSection; 2],
        sfcc: [TestSfcc; 2],
        wtb: WingTipBrake,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                hydraulic_circuit: [
                    TestHydraulicSection::default(),
                    TestHydraulicSection::default(),
                ],
                sfcc: [TestSfcc::new(), TestSfcc::new()],
                wtb: WingTipBrake::new(
                    context,
                    SecondarySurfaceType::Flaps,
                    SecondarySurfaceSide::Left,
                ),
            }
        }

        fn set_wtb_solenoid(&mut self, id: usize, solenoid_status: SolenoidStatus) {
            self.sfcc[id].wtb_solenoid = solenoid_status;
        }

        fn set_current_pressure(&mut self, id: usize, pressure: Pressure) {
            self.hydraulic_circuit[id].set_pressure(pressure);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, _context: &UpdateContext) {
            self.wtb.update(
                &self.sfcc[0],
                &self.sfcc[1],
                &self.hydraulic_circuit[0],
                &self.hydraulic_circuit[1],
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            visitor.visit(self);
        }
    }

    struct WingTipBrakeTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl WingTipBrakeTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(TestAircraft::new),
            }
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.test_bed.run_multiple_frames(delta);
            self
        }

        fn get_wtb_active(&self) -> bool {
            self.query(|a| a.wtb.is_active())
        }

        fn set_wtb_solenoid(mut self, id: usize, solenoid_status: SolenoidStatus) -> Self {
            self.command(|a| a.set_wtb_solenoid(id, solenoid_status));
            self
        }

        fn set_hyd_pressure(mut self, id: usize, pressure: Pressure) -> Self {
            self.command(|a| a.set_current_pressure(id, pressure));
            self
        }
    }
    impl TestBed for WingTipBrakeTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> WingTipBrakeTestBed {
        WingTipBrakeTestBed::new()
    }

    #[test]
    fn wtb_no_pressure() {
        let wtb = test_bed().run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());

        let wtb = test_bed()
            .set_wtb_solenoid(0, SolenoidStatus::DeEnergised)
            .set_wtb_solenoid(1, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());

        let wtb = test_bed()
            .set_wtb_solenoid(0, SolenoidStatus::Energised)
            .set_wtb_solenoid(1, SolenoidStatus::DeEnergised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());

        let wtb = test_bed()
            .set_wtb_solenoid(0, SolenoidStatus::Energised)
            .set_wtb_solenoid(1, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());
    }

    #[test]
    fn wtb_with_pressure() {
        let target_pressure = Pressure::new::<bar>(206.0);
        let wtb = test_bed()
            .set_hyd_pressure(0, target_pressure)
            .set_hyd_pressure(1, Pressure::ZERO)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());

        let wtb = test_bed()
            .set_hyd_pressure(0, Pressure::ZERO)
            .set_hyd_pressure(1, target_pressure)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());

        let wtb = test_bed()
            .set_hyd_pressure(0, target_pressure)
            .set_hyd_pressure(1, target_pressure)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());
    }

    #[test]
    fn wtb_normal_ops() {
        let target_pressure = Pressure::new::<bar>(206.0);
        let wtb = test_bed()
            .set_hyd_pressure(0, target_pressure)
            .set_wtb_solenoid(0, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(wtb.get_wtb_active());

        let wtb = test_bed()
            .set_hyd_pressure(0, target_pressure)
            .set_wtb_solenoid(1, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());

        let wtb = test_bed()
            .set_hyd_pressure(1, target_pressure)
            .set_wtb_solenoid(1, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(wtb.get_wtb_active());

        let wtb = test_bed()
            .set_hyd_pressure(1, target_pressure)
            .set_wtb_solenoid(0, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());

        let wtb = test_bed()
            .set_hyd_pressure(0, target_pressure)
            .set_hyd_pressure(1, target_pressure)
            .set_wtb_solenoid(0, SolenoidStatus::Energised)
            .set_wtb_solenoid(1, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(wtb.get_wtb_active());
    }

    #[test]
    fn wtb_minimum_pressure() {
        let minimum_pressure = Pressure::new::<bar>(130.0);

        let wtb = test_bed()
            .set_hyd_pressure(0, minimum_pressure)
            .set_hyd_pressure(1, minimum_pressure)
            .set_wtb_solenoid(0, SolenoidStatus::Energised)
            .set_wtb_solenoid(1, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(wtb.get_wtb_active());

        let wtb = test_bed()
            .set_hyd_pressure(0, minimum_pressure * 0.99)
            .set_hyd_pressure(1, minimum_pressure * 0.99)
            .set_wtb_solenoid(0, SolenoidStatus::Energised)
            .set_wtb_solenoid(1, SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert!(!wtb.get_wtb_active());
    }
}
