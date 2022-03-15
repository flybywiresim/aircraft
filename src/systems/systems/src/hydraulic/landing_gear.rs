use crate::landing_gear::GearSystemSensors;
use crate::shared::low_pass_filter::LowPassFilter;
use crate::shared::{
    GearWheel, LgciuDoorPosition,  LgciuGearControl, LgciuGearExtension,
};

use crate::simulation::UpdateContext;

use super::linear_actuator::{
    HydraulicAssemblyController, HydraulicLinearActuatorAssembly, LinearActuatorMode,
};

use uom::si::{f64::*, pressure::psi, ratio::ratio};

use std::time::Duration;

pub struct HydraulicGearSystem {
    hydraulic_supply: GearSystemHydraulicSupply,

    nose_door_assembly: GearDoorAssembly,
    left_door_assembly: GearDoorAssembly,
    right_door_assembly: GearDoorAssembly,

    nose_gear_assembly: GearDoorAssembly,
    left_gear_assembly: GearDoorAssembly,
    right_gear_assembly: GearDoorAssembly,
}
impl HydraulicGearSystem {
    pub fn new(
        nose_door: HydraulicLinearActuatorAssembly<1>,
        left_door: HydraulicLinearActuatorAssembly<1>,
        right_door: HydraulicLinearActuatorAssembly<1>,
        nose_gear: HydraulicLinearActuatorAssembly<1>,
        left_gear: HydraulicLinearActuatorAssembly<1>,
        right_gear: HydraulicLinearActuatorAssembly<1>,
    ) -> Self {
        Self {
            hydraulic_supply: GearSystemHydraulicSupply::new(),

            nose_door_assembly: GearDoorAssembly::new(nose_door, false),
            left_door_assembly: GearDoorAssembly::new(left_door, false),
            right_door_assembly: GearDoorAssembly::new(right_door, false),

            nose_gear_assembly: GearDoorAssembly::new(nose_gear, true),
            left_gear_assembly: GearDoorAssembly::new(left_gear, true),
            right_gear_assembly: GearDoorAssembly::new(right_gear, true),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        valves_controller: &impl GearValvesController,
        gear_system_controller: &impl LgciuGearControl,
        main_hydraulic_circuit_pressure: Pressure,
    ) {
        self.hydraulic_supply
            .update(context, valves_controller, main_hydraulic_circuit_pressure);

        let current_pressure = self.hydraulic_supply.gear_system_manifold_pressure();

        self.nose_door_assembly.update(
            context,
            gear_system_controller.should_open_doors(),
            current_pressure,
        );
        self.left_door_assembly.update(
            context,
            gear_system_controller.should_open_doors(),
            current_pressure,
        );
        self.right_door_assembly.update(
            context,
            gear_system_controller.should_open_doors(),
            current_pressure,
        );

        self.nose_gear_assembly.update(
            context,
            gear_system_controller.should_extend_gears(),
            current_pressure,
        );
        self.left_gear_assembly.update(
            context,
            gear_system_controller.should_extend_gears(),
            current_pressure,
        );
        self.right_gear_assembly.update(
            context,
            gear_system_controller.should_extend_gears(),
            current_pressure,
        );
    }
}
impl GearSystemSensors for HydraulicGearSystem {
    fn is_wheel_id_up_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool {
        match wheel_id {
            GearWheel::CENTER => self.nose_gear_assembly.is_sensor_uplock(sensor_id),
            GearWheel::LEFT => self.left_gear_assembly.is_sensor_uplock(sensor_id),
            GearWheel::RIGHT => self.right_gear_assembly.is_sensor_uplock(sensor_id),
        }
    }

    fn is_wheel_id_down_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool {
        match wheel_id {
            GearWheel::CENTER => self.nose_gear_assembly.is_sensor_fully_opened(sensor_id),
            GearWheel::LEFT => self.left_gear_assembly.is_sensor_fully_opened(sensor_id),
            GearWheel::RIGHT => self.right_gear_assembly.is_sensor_fully_opened(sensor_id),
        }
    }

    fn is_door_id_up_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool {
        match wheel_id {
            GearWheel::CENTER => self.nose_door_assembly.is_sensor_uplock(sensor_id),
            GearWheel::LEFT => self.left_door_assembly.is_sensor_uplock(sensor_id),
            GearWheel::RIGHT => self.right_door_assembly.is_sensor_uplock(sensor_id),
        }
    }

    fn is_door_id_down_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool {
        match wheel_id {
            GearWheel::CENTER => self.nose_door_assembly.is_sensor_fully_opened(sensor_id),
            GearWheel::LEFT => self.left_door_assembly.is_sensor_fully_opened(sensor_id),
            GearWheel::RIGHT => self.right_door_assembly.is_sensor_fully_opened(sensor_id),
        }
    }
}

#[derive(PartialEq, Clone, Copy, Debug)]
pub enum GearsSystemState {
    AllUpLocked,
    Retracting,
    Extending,
    AllDownLocked,
}

pub struct GearSystemStateMachine {
    gears_state: GearsSystemState,
}
impl GearSystemStateMachine {
    pub fn new() -> Self {
        Self {
            gears_state: GearsSystemState::AllDownLocked,
        }
    }

    fn new_gear_state(
        &self,
        lgciu: &(impl LgciuGearExtension + LgciuDoorPosition),
        gear_handle_position_is_up: bool,
    ) -> GearsSystemState {
        match self.gears_state {
            GearsSystemState::AllUpLocked => {
                if !gear_handle_position_is_up {
                    GearsSystemState::Extending
                } else {
                    self.gears_state
                }
            }
            GearsSystemState::Retracting => {
                if lgciu.all_up_and_locked() && lgciu.all_closed_and_locked() {
                    GearsSystemState::AllUpLocked
                } else if !gear_handle_position_is_up {
                    GearsSystemState::Extending
                } else {
                    self.gears_state
                }
            }
            GearsSystemState::Extending => {
                if lgciu.all_down_and_locked() && lgciu.all_closed_and_locked() {
                    GearsSystemState::AllDownLocked
                } else if gear_handle_position_is_up {
                    GearsSystemState::Retracting
                } else {
                    self.gears_state
                }
            }
            GearsSystemState::AllDownLocked => {
                if gear_handle_position_is_up {
                    GearsSystemState::Retracting
                } else {
                    self.gears_state
                }
            }
        }
    }

    pub fn update(&mut self, lgciu: &(impl LgciuGearExtension + LgciuDoorPosition), gear_handle_position_is_up: bool) {
        self.gears_state = self.new_gear_state(lgciu, gear_handle_position_is_up);
    }

    pub fn state(&self) -> GearsSystemState {
        self.gears_state
    }
}

pub trait GearValvesController {
    fn safety_valve_should_open(&self) -> bool;
    fn shut_off_valve_should_open(&self) -> bool;
}

struct GearSystemHydraulicSupply {
    safety_valve: HydraulicValve,
    cutoff_valve: HydraulicValve,
}
impl GearSystemHydraulicSupply {
    fn new() -> Self {
        Self {
            safety_valve: HydraulicValve::new(HydraulicValveType::ClosedWhenOff),
            cutoff_valve: HydraulicValve::new(HydraulicValveType::Mechanical),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        valves_controller: &impl GearValvesController,
        main_hydraulic_circuit_pressure: Pressure,
    ) {
        self.safety_valve.update(
            context,
            valves_controller.safety_valve_should_open(),
            main_hydraulic_circuit_pressure,
        );
        self.cutoff_valve.update(
            context,
            valves_controller.shut_off_valve_should_open(),
            self.safety_valve.pressure_output(),
        );
    }

    fn gear_system_manifold_pressure(&self) -> Pressure {
        self.cutoff_valve.pressure_output()
    }
}

pub trait GearComponentController {
    fn should_open(&self) -> bool;
    fn should_close(&self) -> bool;
}

struct GearDoorAssembly {
    hydraulic_controller: GearDoorHydraulicController,
    hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
    fully_opened_proximity_detectors: [ProximityDetector; 2],
    uplock_proximity_detectors: [ProximityDetector; 2],
    hydraulic_uplock: HydraulicLock,
    hydraulic_downlock: Option<HydraulicLock>,
}
impl GearDoorAssembly {
    const OPENED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO: f64 = 1.;
    const OPENED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO: f64 = 0.05;

    const UPLOCKED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO: f64 = 0.;
    const UPLOCKED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO: f64 = 0.01;

    fn new(
        door_hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
        has_hydraulic_downlock: bool,
    ) -> Self {
        Self {
            hydraulic_controller: GearDoorHydraulicController::new(),
            hydraulic_assembly: door_hydraulic_assembly,
            fully_opened_proximity_detectors: [ProximityDetector::new(
                Ratio::new::<ratio>(Self::OPENED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO),
                Ratio::new::<ratio>(Self::OPENED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO),
            ); 2],
            uplock_proximity_detectors: [ProximityDetector::new(
                Ratio::new::<ratio>(Self::UPLOCKED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO),
                Ratio::new::<ratio>(Self::UPLOCKED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO),
            ); 2],
            hydraulic_uplock: HydraulicLock::new(),
            hydraulic_downlock: if has_hydraulic_downlock {
                Some(HydraulicLock::new())
            } else {
                None
            },
        }
    }

    fn update(&mut self, context: &UpdateContext, should_open: bool, current_pressure: Pressure) {
        self.update_proximity_detectors();

        self.update_hydraulic_control(should_open, current_pressure);

        self.hydraulic_assembly.update(
            context,
            std::slice::from_ref(&self.hydraulic_controller),
            [current_pressure],
        );
    }

    fn update_proximity_detectors(&mut self) {
        for sensor in &mut self.fully_opened_proximity_detectors {
            sensor.update(self.hydraulic_assembly.position_normalized());
        }
        for sensor in &mut self.uplock_proximity_detectors {
            sensor.update(self.hydraulic_assembly.position_normalized());
        }
    }

    fn update_hydraulic_control(&mut self, should_open: bool, current_pressure: Pressure) {
        self.hydraulic_uplock
            .update(should_open, false, current_pressure);

        let mut should_lock_down = false;

        if let Some(hyd_lock) = &mut self.hydraulic_downlock {
            hyd_lock.update(!should_open, false, current_pressure);
            should_lock_down = hyd_lock.is_locked_or_ready_to_latch();
        }

        self.hydraulic_controller.update(
            should_open,
            self.hydraulic_uplock.is_locked_or_ready_to_latch(),
            should_lock_down,
            self.position_normalized(),
        );
    }

    fn position_normalized(&self) -> Ratio {
        self.hydraulic_assembly.position_normalized()
    }

    fn is_locked(&self) -> bool {
        self.hydraulic_assembly.is_locked()
    }

    fn is_sensor_uplock(&self, sensor_id: usize) -> bool {
        assert!(sensor_id <= 1);
        self.uplock_proximity_detectors[sensor_id].proximity_detected()
    }

    fn is_sensor_fully_opened(&self, sensor_id: usize) -> bool {
        assert!(sensor_id <= 1);
        self.fully_opened_proximity_detectors[sensor_id].proximity_detected()
    }
}

struct GearDoorHydraulicController {
    requested_position: Ratio,
    should_lock: bool,
    lock_position: Ratio,
}
impl GearDoorHydraulicController {
    fn new() -> Self {
        Self {
            requested_position: Ratio::new::<ratio>(0.),
            should_lock: true,
            lock_position: Ratio::new::<ratio>(0.),
        }
    }

    fn update(
        &mut self,
        should_open: bool,
        should_uplock: bool,
        should_downlock: bool,
        actual_position: Ratio,
    ) {
        self.requested_position = if should_open {
            Ratio::new::<ratio>(1.1)
        } else {
            Ratio::new::<ratio>(-0.1)
        };

        self.should_lock = actual_position.get::<ratio>() > 0.5 && should_downlock
            || actual_position.get::<ratio>() < 0.5 && should_uplock;

        self.lock_position = if should_downlock {
            Ratio::new::<ratio>(1.)
        } else {
            Ratio::new::<ratio>(0.)
        };
    }
}
impl HydraulicAssemblyController for GearDoorHydraulicController {
    fn requested_mode(&self) -> LinearActuatorMode {
        // TODO if vent valve opened -> damping else -> valve closed mode
        LinearActuatorMode::PositionControl
    }

    fn requested_position(&self) -> Ratio {
        self.requested_position
    }

    fn should_lock(&self) -> bool {
        self.should_lock
    }

    fn requested_lock_position(&self) -> Ratio {
        self.lock_position
    }
}

struct HydraulicLock {
    is_unlocked: bool,
}
impl HydraulicLock {
    const UNLOCK_MIN_PRESS_PSI: f64 = 1000.;

    fn new() -> Self {
        Self { is_unlocked: false }
    }

    fn update(
        &mut self,
        should_unlock: bool,
        should_manually_unlock: bool,
        current_pressure: Pressure,
    ) {
        self.is_unlocked = should_unlock
            && current_pressure.get::<psi>() > Self::UNLOCK_MIN_PRESS_PSI
            || should_manually_unlock
    }

    fn is_locked_or_ready_to_latch(&self) -> bool {
        !self.is_unlocked
    }
}

#[derive(PartialEq, Clone, Copy)]
enum HydraulicValveType {
    ClosedWhenOff,
    OpenedWhenOff,
    Mechanical,
}

struct HydraulicValve {
    position: LowPassFilter<Ratio>,
    is_powered: bool,
    valve_type: HydraulicValveType,

    pressure_input: Pressure,
    pressure_output: Pressure,
}
impl HydraulicValve {
    const POSITION_RESPONSE_TIME_CONSTANT: Duration = Duration::from_millis(50);

    fn new(valve_type: HydraulicValveType) -> Self {
        Self {
            position: LowPassFilter::<Ratio>::new(Self::POSITION_RESPONSE_TIME_CONSTANT),
            is_powered: true, // TODO set to false and add SimulationElement powering
            valve_type,
            pressure_input: Pressure::default(),
            pressure_output: Pressure::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        commanded_open: bool,
        current_pressure_input: Pressure,
    ) {
        let commanded_position = self.actual_target_position_from_valve_type(commanded_open);

        self.position.update(context.delta(), commanded_position);

        self.pressure_input = current_pressure_input;
        self.update_output_pressure();
    }

    fn actual_target_position_from_valve_type(&self, commanded_open: bool) -> Ratio {
        match self.valve_type {
            HydraulicValveType::OpenedWhenOff => {
                if !commanded_open && self.is_powered {
                    Ratio::new::<ratio>(0.)
                } else {
                    Ratio::new::<ratio>(1.)
                }
            }
            HydraulicValveType::ClosedWhenOff => {
                if commanded_open && self.is_powered {
                    Ratio::new::<ratio>(1.)
                } else {
                    Ratio::new::<ratio>(0.)
                }
            }
            HydraulicValveType::Mechanical => {
                if commanded_open {
                    Ratio::new::<ratio>(1.)
                } else {
                    Ratio::new::<ratio>(0.)
                }
            }
        }
    }

    fn update_output_pressure(&mut self) {
        self.pressure_output =
            self.pressure_input
                * (self.position.output().sqrt() * 1.4)
                    .min(Ratio::new::<ratio>(1.).max(Ratio::new::<ratio>(0.)));
    }

    fn pressure_output(&self) -> Pressure {
        self.pressure_output
    }
}

#[derive(Clone, Copy)]
struct ProximityDetector {
    is_active: bool,

    installation_position_normalized: Ratio,
    trigger_distance: Ratio,
}
impl ProximityDetector {
    fn new(installation_position_normalized: Ratio, trigger_distance: Ratio) -> Self {
        Self {
            is_active: false,

            installation_position_normalized,
            trigger_distance,
        }
    }

    fn update(&mut self, position: Ratio) {
        self.is_active =
            (self.installation_position_normalized - position).abs() < self.trigger_distance;
    }

    fn proximity_detected(&self) -> bool {
        self.is_active
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use nalgebra::Vector3;

    use std::time::Duration;
    use uom::si::{angle::degree, length::meter, mass::kilogram, volume_rate::gallon_per_second};

    use crate::hydraulic::linear_actuator::{
        BoundedLinearLength, LinearActuatedRigidBodyOnHingeAxis, LinearActuator,
    };
    use crate::shared::update_iterator::MaxStepLoop;

    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, UpdateContext};

    impl SimulationElement for ProximityDetector {}

    #[derive(Default)]
    struct TestGearValvesController {
        safety_valve_should_open: bool,
        shut_off_valve_should_open: bool,
    }
    impl TestGearValvesController {
        fn with_safety_and_shutoff_opened() -> Self {
            Self {
                safety_valve_should_open: true,
                shut_off_valve_should_open: true,
            }
        }

        fn with_safety_opened_shut_off_closed() -> Self {
            Self {
                safety_valve_should_open: true,
                shut_off_valve_should_open: false,
            }
        }

        fn with_safety_closed_shut_off_opened() -> Self {
            Self {
                safety_valve_should_open: false,
                shut_off_valve_should_open: true,
            }
        }

        fn with_all_valve_closed() -> Self {
            Self {
                safety_valve_should_open: false,
                shut_off_valve_should_open: false,
            }
        }
    }
    impl GearValvesController for TestGearValvesController {
        fn safety_valve_should_open(&self) -> bool {
            self.safety_valve_should_open
        }

        fn shut_off_valve_should_open(&self) -> bool {
            self.shut_off_valve_should_open
        }
    }

    #[derive(Default)]
    struct TestGearComponentController {
        open_request: bool,
        close_request: bool,
    }
    impl TestGearComponentController {
        fn set_open(&mut self, open: bool) {
            self.open_request = open;
        }

        fn set_close(&mut self, close: bool) {
            self.close_request = close;
        }
    }
    impl GearComponentController for TestGearComponentController {
        fn should_close(&self) -> bool {
            self.open_request
        }

        fn should_open(&self) -> bool {
            self.open_request
        }
    }

    struct TestSingleDoorAircraft {
        loop_updater: MaxStepLoop,

        door_assembly: GearDoorAssembly,

        component_controller: TestGearComponentController,

        pressure: Pressure,
    }
    impl TestSingleDoorAircraft {
        fn new(
            time_step: Duration,
            hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
        ) -> Self {
            Self {
                loop_updater: MaxStepLoop::new(time_step),

                door_assembly: GearDoorAssembly::new(hydraulic_assembly, false),

                component_controller: TestGearComponentController::default(),

                pressure: Pressure::new::<psi>(0.),
            }
        }

        fn set_pressure(&mut self, pressure: Pressure) {
            self.pressure = pressure;
        }

        fn command_opening(&mut self) {
            self.component_controller.set_open(true);
        }

        fn update(&mut self, context: &UpdateContext) {
            self.door_assembly
                .update(context, self.component_controller.should_open(), self.pressure);

            println!(
                "Body position {:.2} , Hyd control {:#?}",
                self.door_assembly.position_normalized().get::<ratio>(),
                self.door_assembly.hydraulic_controller.requested_mode(),
            );
        }

        fn is_sensor_uplock(&self, sensor_id: usize) -> bool {
            self.door_assembly.is_sensor_uplock(sensor_id)
        }

        fn is_sensor_fully_opened(&self, sensor_id: usize) -> bool {
            self.door_assembly.is_sensor_fully_opened(sensor_id)
        }
    }
    impl Aircraft for TestSingleDoorAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.loop_updater.update(context);

            for cur_time_step in self.loop_updater {
                self.update(&context.with_delta(cur_time_step));
            }
        }
    }
    impl SimulationElement for TestSingleDoorAircraft {}

    impl SimulationElement for GearSystemHydraulicSupply {}

    #[test]
    fn proximity_detector_active_when_at_position() {
        let mut test_bed = SimulationTestBed::from(ProximityDetector::new(
            Ratio::new::<ratio>(0.5),
            Ratio::new::<ratio>(0.1),
        ));
        test_bed.command_element(|e| e.update(Ratio::new::<ratio>(0.5)));
        assert!(test_bed.query_element(|e| e.proximity_detected()));
    }

    #[test]
    fn proximity_detector_active_only_when_in_range() {
        let mut test_bed = SimulationTestBed::from(ProximityDetector::new(
            Ratio::new::<ratio>(0.5),
            Ratio::new::<ratio>(0.1),
        ));
        test_bed.command_element(|e| e.update(Ratio::new::<ratio>(0.45)));
        assert!(test_bed.query_element(|e| e.proximity_detected()));

        test_bed.command_element(|e| e.update(Ratio::new::<ratio>(0.55)));
        assert!(test_bed.query_element(|e| e.proximity_detected()));

        test_bed.command_element(|e| e.update(Ratio::new::<ratio>(0.35)));
        assert!(!test_bed.query_element(|e| e.proximity_detected()));

        test_bed.command_element(|e| e.update(Ratio::new::<ratio>(0.65)));
        assert!(!test_bed.query_element(|e| e.proximity_detected()));
    }

    #[test]
    fn hydraulic_manifold_receives_pressure_with_all_valves_opened() {
        let mut test_bed = SimulationTestBed::from(GearSystemHydraulicSupply::new())
            .with_update_after_power_distribution(|el, context| {
                el.update(
                    context,
                    &TestGearValvesController::with_safety_and_shutoff_opened(),
                    Pressure::new::<psi>(3000.),
                )
            });

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(
            test_bed.query_element(|e| e.gear_system_manifold_pressure())
                > Pressure::new::<psi>(2500.)
        );
    }

    #[test]
    fn hydraulic_manifold_do_not_receive_pressure_with_shut_off_valve_closed() {
        let mut test_bed = SimulationTestBed::from(GearSystemHydraulicSupply::new())
            .with_update_after_power_distribution(|el, context| {
                el.update(
                    context,
                    &TestGearValvesController::with_safety_opened_shut_off_closed(),
                    Pressure::new::<psi>(3000.),
                )
            });

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(
            test_bed.query_element(|e| e.gear_system_manifold_pressure())
                < Pressure::new::<psi>(100.)
        );
    }

    #[test]
    fn hydraulic_manifold_do_not_receive_pressure_with_safety_valve_closed() {
        let mut test_bed = SimulationTestBed::from(GearSystemHydraulicSupply::new())
            .with_update_after_power_distribution(|el, context| {
                el.update(
                    context,
                    &TestGearValvesController::with_safety_closed_shut_off_opened(),
                    Pressure::new::<psi>(3000.),
                )
            });

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(
            test_bed.query_element(|e| e.gear_system_manifold_pressure())
                < Pressure::new::<psi>(100.)
        );
    }

    #[test]
    fn hydraulic_manifold_do_not_receive_pressure_with_all_valves_closed() {
        let mut test_bed = SimulationTestBed::from(GearSystemHydraulicSupply::new())
            .with_update_after_power_distribution(|el, context| {
                el.update(
                    context,
                    &TestGearValvesController::with_all_valve_closed(),
                    Pressure::new::<psi>(3000.),
                )
            });

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(
            test_bed.query_element(|e| e.gear_system_manifold_pressure())
                < Pressure::new::<psi>(100.)
        );
    }

    #[test]
    fn door_assembly_init_uplocked() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestSingleDoorAircraft::new(Duration::from_millis(33), main_gear_door_right_assembly())
        });

        test_bed.run_with_delta(Duration::from_millis(33));

        assert!(test_bed.query(|a| a.door_assembly.is_locked()));
        assert!(
            test_bed.query(|a| a.door_assembly.position_normalized()) == Ratio::new::<ratio>(0.)
        );
    }

    #[test]
    fn door_uplocked_gives_correct_proximity_sensor_state() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestSingleDoorAircraft::new(Duration::from_millis(33), main_gear_door_right_assembly())
        });

        test_bed.run_with_delta(Duration::from_millis(33));

        assert!(
            test_bed.query(|a| a.door_assembly.position_normalized()) == Ratio::new::<ratio>(0.)
        );

        assert!(test_bed.query(|a| a.is_sensor_uplock(0)));
        assert!(test_bed.query(|a| a.is_sensor_uplock(1)));

        assert!(!test_bed.query(|a| a.is_sensor_fully_opened(0)));
        assert!(!test_bed.query(|a| a.is_sensor_fully_opened(1)));
    }

    fn main_gear_door_right_assembly() -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = main_gear_door_right_body(true);
        let actuator = main_gear_door_actuator(&rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn main_gear_door_actuator(bounded_linear_length: &impl BoundedLinearLength) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 0.05;
        const DEFAULT_FORCE_GAIN: f64 = 200000.;

        LinearActuator::new(
            bounded_linear_length,
            1,
            Length::new::<meter>(0.055),
            Length::new::<meter>(0.03),
            VolumeRate::new::<gallon_per_second>(0.08),
            20000.,
            5000.,
            2000.,
            28000.,
            Duration::from_millis(100),
            [0.5, 1., 1., 1., 1., 0.5],
            [0., 0.2, 0.21, 0.79, 0.8, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
        )
    }

    fn main_gear_door_right_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(1.73, 0.02, 1.7);
        let cg_offset = Vector3::new(2. / 3. * size[0], 0.1, 0.);

        let control_arm = Vector3::new(0.76, 0., 0.);
        let anchor = Vector3::new(0.19, 0.23, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(50.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-85.),
            Angle::new::<degree>(85.),
            Angle::new::<degree>(0.),
            150.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }
}
