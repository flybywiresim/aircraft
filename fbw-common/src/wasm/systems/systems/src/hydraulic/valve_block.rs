use std::time::Duration;

use crate::{
    hydraulic::flap_slat::{SolenoidStatus, ValveBlockController},
    shared::{low_pass_filter::LowPassFilter, SectionPressure},
    simulation::UpdateContext,
};

use uom::si::{angular_velocity::radian_per_second, f64::*, pressure::psi, ratio::ratio};
use uom::typenum::P2;
use uom::ConstZero;

pub struct ValveBlock {
    current_max_speed: LowPassFilter<AngularVelocity>,
    full_pressure_max_speed: AngularVelocity,
    circuit_target_pressure: Pressure,
    minimum_pressure: Pressure,

    speed: AngularVelocity,
}
impl ValveBlock {
    // NOTE: This time constant is random.
    const LOW_PASS_FILTER_SPEED_TIME_CONSTANT: Duration = Duration::from_millis(100);
    const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI: f64 = 500.;

    // Deceleration factor calculated to ensure accuracy of 0.18 deg(FPPU).
    // This is a simplified open loop motor control where the only commands are Extract|Retract.
    // The real SFCC controls the motors through the combination of three valves in the PCU.
    const DECEL_FACTOR_WHEN_APROACHING_POSITION: f64 = 0.976;

    pub fn new(
        full_pressure_max_speed: AngularVelocity,
        circuit_target_pressure: Pressure,
    ) -> Self {
        ValveBlock {
            current_max_speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_FILTER_SPEED_TIME_CONSTANT,
            ),
            full_pressure_max_speed,
            circuit_target_pressure,
            minimum_pressure: Pressure::new::<psi>(Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI),
            speed: AngularVelocity::ZERO,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        sfcc: &impl ValveBlockController,
        pressure: &impl SectionPressure,
    ) {
        self.update_current_max_speed(context, sfcc, pressure.pressure_downstream_priority_valve());

        self.update_speed(sfcc);
    }

    pub fn get_speed(&self) -> AngularVelocity {
        self.speed
    }

    fn update_speed(&mut self, sfcc: &impl ValveBlockController) {
        let max_speed = self.current_max_speed.output();

        let sfcc_pob = sfcc.get_pob_status();
        let sfcc_retract = sfcc.get_retract_status();
        let sfcc_extend = sfcc.get_extend_status();

        // NOTE: opposite commands between SFCCs are not modelled yet. Opposite requests aren't expected
        // in the current code.
        let extend_request = sfcc_extend == SolenoidStatus::Energised;

        let retract_request = sfcc_retract == SolenoidStatus::Energised;

        self.speed = if extend_request {
            max_speed
        } else if retract_request {
            -max_speed
        } else {
            // The positioning precision is 0.18 deg. It's important that the motors slow
            // down enough that there is a movement of less than 0.18 deg between frames
            // otherwise the flaps/slats will start oscillating.
            let minimum_speed = max_speed * 0.18; // Low speed drive is 18% of high speed drive.
            let new_speed = self.speed * Self::DECEL_FACTOR_WHEN_APROACHING_POSITION;
            let pob_de_energised = sfcc_pob == SolenoidStatus::DeEnergised;

            if pob_de_energised {
                AngularVelocity::ZERO
            } else if new_speed.abs() < minimum_speed {
                self.speed
            } else {
                new_speed
            }
        };
    }

    fn update_current_max_speed(
        &mut self,
        context: &UpdateContext,
        sfcc: &impl ValveBlockController,
        pressure: Pressure,
    ) {
        let sfcc_active = sfcc.get_pob_status() == SolenoidStatus::Energised;

        // Final pressures are the current pressure or 0 if corresponding sfcc is offline
        // This simulates a motor not responding to a failed or offline sfcc
        let final_pressure = if !sfcc_active {
            Pressure::ZERO
        } else {
            pressure
        };

        let theoretical_max_speed = AngularVelocity::new::<radian_per_second>(
            self.full_pressure_max_speed.get::<radian_per_second>()
                * self.max_speed_factor_from_pressure(final_pressure),
        );

        // Final max speed filtered to simulate smooth movements
        if !context.aircraft_preset_quick_mode() {
            self.current_max_speed
                .update(context.delta(), theoretical_max_speed);
        } else {
            // This is for the Aircraft Presets to expedite the setting of a preset.
            self.current_max_speed
                .update(Duration::from_secs(2), theoretical_max_speed);
        }
    }

    fn max_speed_factor_from_pressure(&self, current_pressure: Pressure) -> f64 {
        // max(Pressure.ZERO) is needed to clamp the minimum correction factor to 0 when the pressure
        // is less than the minimum threshold.
        let press_corrected = (current_pressure - self.minimum_pressure).max(Pressure::ZERO);
        let target_excess_pressure = self.circuit_target_pressure - self.minimum_pressure;
        (press_corrected.powi(P2::new()) / target_excess_pressure.powi(P2::new())).get::<ratio>()
    }

    #[cfg(test)]
    pub fn get_full_pressure_max_speed(&self) -> AngularVelocity {
        self.full_pressure_max_speed
    }
}

#[cfg(test)]
mod valve_block_tests {
    use uom::si::{angular_velocity::revolution_per_minute, pressure::bar};

    use crate::{
        assert_gt_lt,
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, SimulationElementVisitor,
        },
    };

    use super::*;

    const MAX_SPEED_RPM: f64 = 391.1 / 2.0;
    const TARGET_PRESSURE_BAR: f64 = 206.0;

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
    }
    impl TestSfcc {
        pub fn new() -> Self {
            TestSfcc {
                pob_solenoid: SolenoidStatus::DeEnergised,
                retract_solenoid: SolenoidStatus::DeEnergised,
                extend_solenoid: SolenoidStatus::DeEnergised,
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

    struct TestAircraft {
        hydraulic_circuit: TestHydraulicSection,
        sfcc: TestSfcc,
        valve_block: ValveBlock,
    }
    impl TestAircraft {
        fn new() -> Self {
            let max_speed = AngularVelocity::new::<revolution_per_minute>(MAX_SPEED_RPM);
            let target_hydraulic_pressure = Pressure::new::<bar>(TARGET_PRESSURE_BAR);
            Self {
                hydraulic_circuit: TestHydraulicSection::default(),
                sfcc: TestSfcc::new(),
                valve_block: ValveBlock::new(max_speed, target_hydraulic_pressure),
            }
        }

        fn set_pob_solenoid(&mut self, solenoid_status: SolenoidStatus) {
            self.sfcc.pob_solenoid = solenoid_status;
        }

        fn set_retract_solenoid(&mut self, solenoid_status: SolenoidStatus) {
            self.sfcc.retract_solenoid = solenoid_status;
        }

        fn set_extend_solenoid(&mut self, solenoid_status: SolenoidStatus) {
            self.sfcc.extend_solenoid = solenoid_status;
        }

        fn set_current_pressure(&mut self, pressure: Pressure) {
            self.hydraulic_circuit.set_pressure(pressure);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.valve_block
                .update(context, &self.sfcc, &self.hydraulic_circuit);
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            visitor.visit(self);
        }
    }

    struct ValveBlockTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl ValveBlockTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|_| TestAircraft::new()),
            }
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.test_bed.run_multiple_frames(delta);
            self
        }

        fn max_speed_factor_from_pressure(&self, pressure: Pressure) -> f64 {
            self.query(|a| a.valve_block.max_speed_factor_from_pressure(pressure))
        }

        fn get_minimum_pressure(&self) -> Pressure {
            self.query(|a| a.valve_block.minimum_pressure)
        }

        fn get_speed(&self) -> AngularVelocity {
            self.query(|a| a.valve_block.get_speed())
        }

        fn set_pob_solenoid(mut self, solenoid_status: SolenoidStatus) -> Self {
            self.command(|a| a.set_pob_solenoid(solenoid_status));
            self
        }

        fn set_extend_solenoid(mut self, solenoid_status: SolenoidStatus) -> Self {
            self.command(|a| a.set_extend_solenoid(solenoid_status));
            self
        }

        fn set_retract_solenoid(mut self, solenoid_status: SolenoidStatus) -> Self {
            self.command(|a| a.set_retract_solenoid(solenoid_status));
            self
        }

        fn set_hyd_pressure(mut self, pressure: Pressure) -> Self {
            self.command(|a| a.set_current_pressure(pressure));
            self
        }
    }
    impl TestBed for ValveBlockTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> ValveBlockTestBed {
        ValveBlockTestBed::new()
    }

    #[test]
    fn test_speed_factor() {
        let valve_block = test_bed();

        let current_pressure = Pressure::ZERO;
        let speed_factor = valve_block.max_speed_factor_from_pressure(current_pressure);
        assert_eq!(speed_factor, 0.0);

        let current_pressure = valve_block.get_minimum_pressure();
        let speed_factor = valve_block.max_speed_factor_from_pressure(current_pressure);
        assert_eq!(speed_factor, 0.0);

        let current_pressure = Pressure::new::<bar>(TARGET_PRESSURE_BAR / 2.0);
        let speed_factor = valve_block.max_speed_factor_from_pressure(current_pressure);
        assert!(speed_factor > 0.0);
        assert!(speed_factor < 1.0);

        let current_pressure = Pressure::new::<bar>(TARGET_PRESSURE_BAR);
        let speed_factor = valve_block.max_speed_factor_from_pressure(current_pressure);
        assert_eq!(speed_factor, 1.0);

        let current_pressure = Pressure::new::<bar>(209.0);
        let speed_factor = valve_block.max_speed_factor_from_pressure(current_pressure);
        assert!(speed_factor > 1.0);
    }

    #[test]
    fn test_pob_solenoid() {
        let test_bed = test_bed();

        let test_bed = test_bed
            .set_hyd_pressure(Pressure::ZERO)
            .run_waiting_for(Duration::from_millis(2000));
        assert_eq!(test_bed.get_speed(), AngularVelocity::ZERO);

        let test_bed = test_bed
            .set_hyd_pressure(Pressure::new::<bar>(TARGET_PRESSURE_BAR))
            .run_waiting_for(Duration::from_millis(2000));
        assert_eq!(test_bed.get_speed(), AngularVelocity::ZERO);

        let test_bed = test_bed
            .set_hyd_pressure(Pressure::new::<bar>(TARGET_PRESSURE_BAR))
            .set_pob_solenoid(SolenoidStatus::DeEnergised)
            .set_extend_solenoid(SolenoidStatus::Energised)
            .set_retract_solenoid(SolenoidStatus::DeEnergised)
            .run_waiting_for(Duration::from_millis(2000));
        assert_eq!(test_bed.get_speed(), AngularVelocity::ZERO);

        let test_bed = test_bed
            .set_hyd_pressure(Pressure::new::<bar>(TARGET_PRESSURE_BAR))
            .set_pob_solenoid(SolenoidStatus::DeEnergised)
            .set_extend_solenoid(SolenoidStatus::DeEnergised)
            .set_retract_solenoid(SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert_eq!(test_bed.get_speed(), AngularVelocity::ZERO);
    }

    #[test]
    fn test_minimum_pressure() {
        let test_bed = test_bed();

        let minimum_pressure = test_bed.get_minimum_pressure();

        let test_bed = test_bed
            .set_hyd_pressure(minimum_pressure)
            .set_pob_solenoid(SolenoidStatus::Energised)
            .set_extend_solenoid(SolenoidStatus::Energised)
            .set_retract_solenoid(SolenoidStatus::DeEnergised)
            .run_waiting_for(Duration::from_millis(2000));
        assert_eq!(test_bed.get_speed(), AngularVelocity::ZERO);

        let test_bed = test_bed
            .set_hyd_pressure(minimum_pressure)
            .set_pob_solenoid(SolenoidStatus::Energised)
            .set_extend_solenoid(SolenoidStatus::DeEnergised)
            .set_retract_solenoid(SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert_eq!(test_bed.get_speed(), AngularVelocity::ZERO);
    }

    #[test]
    fn test_max_speed() {
        let max_speed = AngularVelocity::new::<revolution_per_minute>(MAX_SPEED_RPM);
        let test_bed = test_bed();

        let test_bed = test_bed
            .set_hyd_pressure(Pressure::new::<bar>(TARGET_PRESSURE_BAR))
            .set_pob_solenoid(SolenoidStatus::Energised)
            .set_extend_solenoid(SolenoidStatus::Energised)
            .set_retract_solenoid(SolenoidStatus::DeEnergised)
            .run_waiting_for(Duration::from_millis(2000));
        assert_gt_lt!(
            test_bed.get_speed(),
            max_speed,
            AngularVelocity::new::<radian_per_second>(0.01)
        );

        let test_bed = test_bed
            .set_hyd_pressure(Pressure::new::<bar>(TARGET_PRESSURE_BAR))
            .set_pob_solenoid(SolenoidStatus::Energised)
            .set_extend_solenoid(SolenoidStatus::DeEnergised)
            .set_retract_solenoid(SolenoidStatus::Energised)
            .run_waiting_for(Duration::from_millis(2000));
        assert_gt_lt!(
            test_bed.get_speed(),
            -max_speed,
            AngularVelocity::new::<radian_per_second>(0.01)
        );
    }
}
