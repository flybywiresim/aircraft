use crate::shared::low_pass_filter::LowPassFilter;
use crate::simulation::UpdateContext;

use super::linear_actuator::{
    HydraulicAssemblyController, HydraulicLinearActuatorAssembly,
    LinearActuatedRigidBodyOnHingeAxis, LinearActuator, LinearActuatorMode,
};

use uom::si::{f64::*, pressure::psi, ratio::ratio};

use std::time::Duration;

struct GearHydraulicSupply {
    safety_valve: HydraulicValve,
    cutoff_valve: HydraulicValve,
}
impl GearHydraulicValves {
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
}

trait GearComponentController {
    fn should_hydraulic_unlock(&self) -> bool;
    fn should_manual_unlock(&self) -> bool;
    fn should_open(&self) -> bool;
}

struct GearDoorAssembly {
    hydraulic_controller: GearDoorHydraulicController,
    hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
    fully_opened_proximity_detectors: [ProximityDetector; 2],
    uplock_proximity_detectors: [ProximityDetector; 2],
    hydraulic_uplock: HydraulicLock,
}
impl GearDoorAssembly {
    const OPENED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO: f64 = 1.;
    const OPENED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO: f64 = 0.05;

    const UPLOCKED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO: f64 = 0.;
    const UPLOCKED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO: f64 = 0.01;

    fn new(door_hydraulic_assembly: HydraulicLinearActuatorAssembly<1>) -> Self {
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
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        door_controller: &impl GearComponentController,
        current_pressure: Pressure,
    ) {
        self.update_proximity_detectors();

        self.update_hydraulic_control(door_controller, current_pressure);

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

    fn update_hydraulic_control(
        &mut self,
        door_controller: &impl GearComponentController,
        current_pressure: Pressure,
    ) {
        self.hydraulic_uplock
            .update(door_controller, current_pressure);

        self.hydraulic_controller
            .update(door_controller, &self.hydraulic_uplock);
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
}
impl GearDoorHydraulicController {
    fn new() -> Self {
        Self {
            requested_position: Ratio::new::<ratio>(0.),
            should_lock: true,
        }
    }

    fn update(
        &mut self,
        door_controller: &impl GearComponentController,
        hydraulic_uplock: &HydraulicLock,
    ) {
        self.requested_position = if door_controller.should_open() {
            Ratio::new::<ratio>(1.)
        } else {
            Ratio::new::<ratio>(-0.1)
        };

        self.should_lock = !hydraulic_uplock.is_unlocked;
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
        Ratio::new::<ratio>(0.)
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
        component_controller: &impl GearComponentController,
        current_pressure: Pressure,
    ) {
        self.is_unlocked = component_controller.should_hydraulic_unlock()
            && current_pressure.get::<psi>() > Self::UNLOCK_MIN_PRESS_PSI
            || component_controller.should_manual_unlock()
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

    use crate::hydraulic::linear_actuator::BoundedLinearLength;
    use crate::shared::update_iterator::MaxStepLoop;

    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, UpdateContext};

    impl SimulationElement for ProximityDetector {}

    #[derive(Default)]
    struct TestGearComponentController {
        open_request: bool,
        unlock_manual_request: bool,
        unlock_hyd_request: bool,
    }
    impl TestGearComponentController {
        fn set_unlock_hydraulic(&mut self, unlock: bool) {
            self.unlock_hyd_request = unlock;
        }

        fn set_unlock_manual(&mut self, unlock: bool) {
            self.unlock_manual_request = unlock;
        }

        fn set_open(&mut self, open: bool) {
            self.open_request = open;
        }
    }
    impl GearComponentController for TestGearComponentController {
        fn should_hydraulic_unlock(&self) -> bool {
            self.unlock_hyd_request
        }

        fn should_manual_unlock(&self) -> bool {
            self.unlock_manual_request
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

                door_assembly: GearDoorAssembly::new(hydraulic_assembly),

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
                .update(context, &self.component_controller, self.pressure);

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
