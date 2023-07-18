use crate::{
    failures::{Failure, FailureType},
    shared::{random_from_range, GearActuatorId, LgciuGearControl, LgciuId, ProximityDetectorId},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        UpdateContext, VariableIdentifier,
    },
};

use super::{
    aerodynamic_model::AerodynamicModel,
    linear_actuator::{
        Actuator, ElectroHydrostaticPowered, HydraulicAssemblyController,
        HydraulicLinearActuatorAssembly, HydraulicLocking, LinearActuatorMode,
    },
};

use uom::si::{f64::*, pressure::psi, ratio::ratio};

pub trait GearSystemController {
    fn safety_valve_should_open(&self) -> bool;
    fn shut_off_valve_should_open(&self) -> bool;
    fn vent_valves_should_open(&self) -> bool;
    fn doors_uplocks_should_mechanically_unlock(&self) -> bool;
    fn gears_uplocks_should_mechanically_unlock(&self) -> bool;
}

pub struct GearSystemShockAbsorber {
    shock_absorber_position_id: VariableIdentifier,
    shock_absorber_position: Ratio,
}
impl GearSystemShockAbsorber {
    const COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO: f64 = 0.02;

    pub fn new(context: &mut InitContext, id: GearActuatorId) -> Self {
        let contact_point_id = match id {
            GearActuatorId::GearNose => 0,
            GearActuatorId::GearLeft => 1,
            GearActuatorId::GearRight => 2,
            GearActuatorId::GearDoorLeft
            | GearActuatorId::GearDoorRight
            | GearActuatorId::GearDoorNose => panic!("Gear doors don't have shock absorbers"),
        };

        Self {
            shock_absorber_position_id: context
                .get_identifier(format!("CONTACT POINT COMPRESSION:{}", contact_point_id)),
            shock_absorber_position: Ratio::default(),
        }
    }

    pub fn is_shock_absorber_fully_extended(&self, _lgciu_id: LgciuId) -> bool {
        self.shock_absorber_position
            < Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO)
    }
}
impl SimulationElement for GearSystemShockAbsorber {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.shock_absorber_position = reader.read(&self.shock_absorber_position_id);
    }
}

pub trait GearSystemComponentController {
    fn should_open(&self) -> bool;
    fn should_close(&self) -> bool;
}

enum GearSysComponentId {
    Door,
    Gear,
}
impl From<GearActuatorId> for GearSysComponentId {
    fn from(id: GearActuatorId) -> Self {
        match id {
            GearActuatorId::GearDoorLeft
            | GearActuatorId::GearDoorRight
            | GearActuatorId::GearDoorNose => GearSysComponentId::Door,
            GearActuatorId::GearLeft | GearActuatorId::GearRight | GearActuatorId::GearNose => {
                GearSysComponentId::Gear
            }
        }
    }
}

pub struct GearSystemComponentAssembly {
    component_id: GearSysComponentId,
    is_inverted_control: bool,
    hydraulic_controller: GearSystemComponentHydraulicController,
    hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
    fully_opened_proximity_detectors: [ProximityDetector; 2],
    uplock_proximity_detectors: [ProximityDetector; 2],
    hydraulic_uplock: HydraulicLock,
    hydraulic_downlock: Option<HydraulicLock>,

    aerodynamic_model: AerodynamicModel,
}
impl GearSystemComponentAssembly {
    const OPENED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO: f64 = 1.;
    const OPENED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO: f64 = 0.03;

    const UPLOCKED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO: f64 = 0.;
    const UPLOCKED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO: f64 = 0.01;

    pub fn new(
        id: GearActuatorId,
        is_inverted_control: bool,
        hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
        has_hydraulic_downlock: bool,
        uplock_id: [ProximityDetectorId; 2],
        downlock_id: [ProximityDetectorId; 2],
        aerodynamic_model: AerodynamicModel,
    ) -> Self {
        let mut obj = Self {
            component_id: id.into(),
            is_inverted_control,
            hydraulic_controller: GearSystemComponentHydraulicController::new(
                id,
                is_inverted_control,
                !has_hydraulic_downlock,
            ),
            hydraulic_assembly,
            fully_opened_proximity_detectors: [
                ProximityDetector::new(
                    downlock_id[0],
                    Ratio::new::<ratio>(Self::OPENED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO),
                    Ratio::new::<ratio>(Self::OPENED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO),
                ),
                ProximityDetector::new(
                    downlock_id[1],
                    Ratio::new::<ratio>(Self::OPENED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO),
                    Ratio::new::<ratio>(Self::OPENED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO),
                ),
            ],
            uplock_proximity_detectors: [
                ProximityDetector::new(
                    uplock_id[0],
                    Ratio::new::<ratio>(Self::UPLOCKED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO),
                    Ratio::new::<ratio>(Self::UPLOCKED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO),
                ),
                ProximityDetector::new(
                    uplock_id[1],
                    Ratio::new::<ratio>(Self::UPLOCKED_PROXIMITY_DETECTOR_MOUNTING_POSITION_RATIO),
                    Ratio::new::<ratio>(Self::UPLOCKED_PROXIMITY_DETECTOR_TRIG_DISTANCE_RATIO),
                ),
            ],
            hydraulic_uplock: HydraulicLock::new(),
            hydraulic_downlock: if has_hydraulic_downlock {
                Some(HydraulicLock::new())
            } else {
                None
            },
            aerodynamic_model,
        };

        obj.update_proximity_detectors();

        obj
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        gear_system_controller: &impl LgciuGearControl,
        valves_controller: &impl GearSystemController,
        current_pressure: Pressure,
    ) {
        self.update_proximity_detectors();

        self.update_hydraulic_control(gear_system_controller, valves_controller, current_pressure);

        self.aerodynamic_model
            .update_body(context, self.hydraulic_assembly.body());

        self.hydraulic_assembly.update(
            context,
            std::slice::from_ref(&self.hydraulic_controller),
            [current_pressure],
        );
    }

    fn update_proximity_detectors(&mut self) {
        let position_normalized = self.position_normalized();

        for sensor in &mut self.fully_opened_proximity_detectors {
            sensor.update(position_normalized);
        }
        for sensor in &mut self.uplock_proximity_detectors {
            sensor.update(position_normalized);
        }
    }

    fn update_hydraulic_control(
        &mut self,
        gear_system_controller: &impl LgciuGearControl,
        valves_controller: &impl GearSystemController,
        current_pressure: Pressure,
    ) {
        let should_hydraulically_open = match self.component_id {
            GearSysComponentId::Door => gear_system_controller.should_open_doors(),
            GearSysComponentId::Gear => gear_system_controller.should_extend_gears(),
        };
        let should_mechanically_open = match self.component_id {
            GearSysComponentId::Door => {
                valves_controller.doors_uplocks_should_mechanically_unlock()
            }
            GearSysComponentId::Gear => {
                valves_controller.gears_uplocks_should_mechanically_unlock()
            }
        };

        self.hydraulic_uplock.update(
            should_hydraulically_open,
            should_mechanically_open,
            current_pressure,
        );

        let mut should_lock_down = false;

        if let Some(hyd_lock) = &mut self.hydraulic_downlock {
            hyd_lock.update(!should_hydraulically_open, false, current_pressure);
            should_lock_down = hyd_lock.is_locked_or_ready_to_latch();
        }

        self.hydraulic_controller.update(
            should_mechanically_open || should_hydraulically_open,
            self.hydraulic_uplock.is_locked_or_ready_to_latch(),
            should_lock_down,
            self.position_normalized(),
        );
    }

    pub fn position_normalized(&self) -> Ratio {
        if !self.is_inverted_control {
            self.hydraulic_assembly.position_normalized()
        } else {
            Ratio::new::<ratio>(1.) - self.hydraulic_assembly.position_normalized()
        }
    }

    pub fn actuator(&mut self) -> &mut impl Actuator {
        self.hydraulic_assembly.actuator(0)
    }

    pub fn is_sensor_uplock(&self, lgciu_id: LgciuId) -> bool {
        self.uplock_proximity_detectors[lgciu_id as usize].proximity_detected()
    }

    pub fn is_sensor_fully_opened(&self, lgciu_id: LgciuId) -> bool {
        self.fully_opened_proximity_detectors[lgciu_id as usize].proximity_detected()
    }

    #[cfg(test)]
    fn _actuator_flow(&self) -> VolumeRate {
        self.hydraulic_assembly.actuator_flow(0)
    }

    #[cfg(test)]
    fn is_locked(&self) -> bool {
        self.hydraulic_assembly.is_locked()
    }
}
impl SimulationElement for GearSystemComponentAssembly {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.uplock_proximity_detectors, visitor);
        accept_iterable!(self.fully_opened_proximity_detectors, visitor);
        self.hydraulic_controller.accept(visitor);

        visitor.visit(self);
    }
}

struct GearSystemComponentHydraulicController {
    is_inverted_control: bool,
    is_soft_downlock: bool,
    requested_position: Ratio,
    should_lock: bool,
    lock_position: Ratio,

    actual_position: Ratio,

    jammed_actuator_failure: Failure,
    jamming_position: Ratio,
    jamming_is_effective: bool,

    soft_downlock_is_active: bool,
}
impl GearSystemComponentHydraulicController {
    fn new(id: GearActuatorId, is_inverted_control: bool, is_soft_downlock: bool) -> Self {
        Self {
            is_inverted_control,
            is_soft_downlock,
            requested_position: Ratio::new::<ratio>(0.),
            should_lock: true,
            lock_position: Ratio::new::<ratio>(0.),
            actual_position: Ratio::new::<ratio>(0.5),
            jammed_actuator_failure: Failure::new(FailureType::GearActuatorJammed(id)),
            jamming_position: Ratio::new::<ratio>(random_from_range(0., 1.)),
            jamming_is_effective: false,
            soft_downlock_is_active: false,
        }
    }

    // Here actual position shall be in convention 1 extended 0 retracted
    fn update(
        &mut self,
        should_open: bool,
        should_uplock: bool,
        should_downlock: bool,
        actual_position: Ratio,
    ) {
        self.actual_position = actual_position;

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

        self.update_soft_downlock();

        self.update_jamming();
    }

    fn update_jamming(&mut self) {
        // If jamming and actuator reaches jammed position, we activate the jamming
        if self.jammed_actuator_failure.is_active()
            && (self.jamming_position - self.actual_position)
                .abs()
                .get::<ratio>()
                < 0.2
        {
            self.jamming_is_effective = true;
        };

        if !self.jammed_actuator_failure.is_active() {
            self.jamming_is_effective = false;
            // Taking a new random jamming position when failure is switched off for more new fun later
            self.jamming_position = Ratio::new::<ratio>(random_from_range(0., 1.));
        }
    }

    fn update_soft_downlock(&mut self) {
        if self.is_soft_downlock {
            if (!self.is_inverted_control
                && self.requested_position.get::<ratio>() >= 1.
                && self.actual_position.get::<ratio>() >= 0.98)
                || (self.is_inverted_control
                    && self.requested_position.get::<ratio>() <= 0.
                    && self.actual_position.get::<ratio>() <= 0.02)
            {
                self.soft_downlock_is_active = true;
            }

            // We disable soft locking only if position demand is far away from current position
            if self.soft_downlock_is_active
                && (self.requested_position - self.actual_position)
                    .abs()
                    .get::<ratio>()
                    > 0.5
            {
                self.soft_downlock_is_active = false;
            }
        }
    }
}
impl HydraulicAssemblyController for GearSystemComponentHydraulicController {
    fn requested_mode(&self) -> LinearActuatorMode {
        if self.jamming_is_effective {
            return LinearActuatorMode::ClosedValves;
        }

        if self.soft_downlock_is_active {
            LinearActuatorMode::ClosedValves
        } else {
            LinearActuatorMode::PositionControl
        }
    }

    fn requested_position(&self) -> Ratio {
        if self.is_inverted_control {
            Ratio::new::<ratio>(1.) - self.requested_position
        } else {
            self.requested_position
        }
    }

    fn should_lock(&self) -> bool {
        self.should_lock
    }

    fn requested_lock_position(&self) -> Ratio {
        if self.is_inverted_control {
            Ratio::new::<ratio>(1.) - self.lock_position
        } else {
            self.lock_position
        }
    }
}
impl HydraulicLocking for GearSystemComponentHydraulicController {}
impl ElectroHydrostaticPowered for GearSystemComponentHydraulicController {}
impl SimulationElement for GearSystemComponentHydraulicController {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.jammed_actuator_failure.accept(visitor);

        visitor.visit(self);
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

struct ProximityDetector {
    is_active: bool,

    installation_position_normalized: Ratio,
    trigger_distance: Ratio,

    damage_failure: Failure,
}
impl ProximityDetector {
    fn new(
        id: ProximityDetectorId,
        installation_position_normalized: Ratio,
        trigger_distance: Ratio,
    ) -> Self {
        Self {
            is_active: false,

            installation_position_normalized,
            trigger_distance,

            damage_failure: Failure::new(FailureType::GearProxSensorDamage(id)),
        }
    }

    fn update(&mut self, position: Ratio) {
        self.is_active =
            (self.installation_position_normalized - position).abs() < self.trigger_distance;
    }

    fn proximity_detected(&self) -> bool {
        if self.damage_failure.is_active() {
            false
        } else {
            self.is_active
        }
    }
}
impl SimulationElement for ProximityDetector {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.damage_failure.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;

    use nalgebra::Vector3;

    use std::time::Duration;
    use uom::si::{angle::degree, length::meter, mass::kilogram, volume_rate::gallon_per_second};

    use crate::hydraulic::linear_actuator::{
        BoundedLinearLength, LinearActuatedRigidBodyOnHingeAxis, LinearActuator,
    };
    use crate::shared::update_iterator::MaxStepLoop;

    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, UpdateContext};

    #[derive(Default)]
    struct TestGearValvesController {
        safety_valve_should_open: bool,
        shut_off_valve_should_open: bool,
    }
    impl TestGearValvesController {
        pub fn with_safety_and_shutoff_opened() -> Self {
            Self {
                safety_valve_should_open: true,
                shut_off_valve_should_open: true,
            }
        }
    }
    impl GearSystemController for TestGearValvesController {
        fn safety_valve_should_open(&self) -> bool {
            self.safety_valve_should_open
        }

        fn shut_off_valve_should_open(&self) -> bool {
            self.shut_off_valve_should_open
        }

        fn vent_valves_should_open(&self) -> bool {
            false
        }

        fn doors_uplocks_should_mechanically_unlock(&self) -> bool {
            false
        }

        fn gears_uplocks_should_mechanically_unlock(&self) -> bool {
            false
        }
    }

    struct TestGearSystemController {
        open_door_request: bool,
        extend_gear_request: bool,
        control_active: bool,
    }
    impl TestGearSystemController {
        pub fn new() -> Self {
            Self {
                open_door_request: false,
                extend_gear_request: true,
                control_active: true,
            }
        }

        fn set_doors_opening(&mut self, open: bool) {
            self.open_door_request = open;
        }

        fn set_gears_extending(&mut self, close: bool) {
            self.extend_gear_request = close;
        }
    }
    impl LgciuGearControl for TestGearSystemController {
        fn should_open_doors(&self) -> bool {
            self.open_door_request
        }

        fn should_extend_gears(&self) -> bool {
            self.extend_gear_request
        }

        fn control_active(&self) -> bool {
            self.control_active
        }
    }

    struct TestSingleGearAircraft {
        loop_updater: MaxStepLoop,

        door_assembly: GearSystemComponentAssembly,
        gear_assembly: GearSystemComponentAssembly,

        component_controller: TestGearSystemController,

        pressure: Pressure,
    }
    impl TestSingleGearAircraft {
        fn new(
            time_step: Duration,
            door_hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
            gear_hydraulic_assembly: HydraulicLinearActuatorAssembly<1>,
        ) -> Self {
            Self {
                loop_updater: MaxStepLoop::new(time_step),

                door_assembly: GearSystemComponentAssembly::new(
                    GearActuatorId::GearDoorNose,
                    false,
                    door_hydraulic_assembly,
                    false,
                    [
                        ProximityDetectorId::UplockDoorRight1,
                        ProximityDetectorId::UplockDoorRight2,
                    ],
                    [
                        ProximityDetectorId::DownlockDoorRight1,
                        ProximityDetectorId::DownlockDoorRight2,
                    ],
                    gear_door_aero(),
                ),
                gear_assembly: GearSystemComponentAssembly::new(
                    GearActuatorId::GearNose,
                    true,
                    gear_hydraulic_assembly,
                    true,
                    [
                        ProximityDetectorId::UplockGearRight1,
                        ProximityDetectorId::UplockGearRight2,
                    ],
                    [
                        ProximityDetectorId::DownlockGearRight1,
                        ProximityDetectorId::DownlockGearRight2,
                    ],
                    gear_aero(),
                ),

                component_controller: TestGearSystemController::new(),

                pressure: Pressure::new::<psi>(3000.),
            }
        }

        fn set_pressure(&mut self, pressure: Pressure) {
            self.pressure = pressure;
        }

        fn command_doors_opening(&mut self) {
            self.component_controller.set_doors_opening(true);
        }

        fn command_doors_closing(&mut self) {
            self.component_controller.set_doors_opening(false);
        }

        fn command_gears_extending(&mut self) {
            self.component_controller.set_gears_extending(true);
        }

        fn command_gears_retracting(&mut self) {
            self.component_controller.set_gears_extending(false);
        }

        fn update(&mut self, context: &UpdateContext) {
            self.door_assembly.update(
                context,
                &self.component_controller,
                &TestGearValvesController::with_safety_and_shutoff_opened(),
                self.pressure,
            );

            self.gear_assembly.update(
                context,
                &self.component_controller,
                &TestGearValvesController::with_safety_and_shutoff_opened(),
                self.pressure,
            );

            println!(
                "Door Body position {:.2} , Hyd control {:#?},Gear Body position {:.2} , Gear Hyd control {:#?}",
                self.door_assembly.position_normalized().get::<ratio>(),
                self.door_assembly.hydraulic_controller.requested_mode(),
                self.gear_assembly.position_normalized().get::<ratio>(),
                self.gear_assembly.hydraulic_controller.requested_mode(),
            );
        }

        fn is_door_sensor_uplock(&self, lgciu_id: LgciuId) -> bool {
            self.door_assembly.is_sensor_uplock(lgciu_id)
        }

        fn is_door_sensor_fully_opened(&self, lgciu_id: LgciuId) -> bool {
            self.door_assembly.is_sensor_fully_opened(lgciu_id)
        }

        fn is_gear_sensor_uplock(&self, lgciu_id: LgciuId) -> bool {
            self.gear_assembly.is_sensor_uplock(lgciu_id)
        }

        fn is_gear_sensor_fully_opened(&self, lgciu_id: LgciuId) -> bool {
            self.gear_assembly.is_sensor_fully_opened(lgciu_id)
        }

        fn is_gear_physically_locked(&self) -> bool {
            self.gear_assembly.is_locked()
        }

        fn is_door_physically_locked(&self) -> bool {
            self.door_assembly.is_locked()
        }
    }
    impl Aircraft for TestSingleGearAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.loop_updater.update(context);

            for cur_time_step in self.loop_updater {
                self.update(&context.with_delta(cur_time_step));
            }
        }
    }
    impl SimulationElement for TestSingleGearAircraft {}

    #[test]
    fn proximity_detector_active_when_at_position() {
        let mut test_bed = SimulationTestBed::from(ProximityDetector::new(
            ProximityDetectorId::UplockGearRight1,
            Ratio::new::<ratio>(0.5),
            Ratio::new::<ratio>(0.1),
        ));
        test_bed.command_element(|e| e.update(Ratio::new::<ratio>(0.5)));
        assert!(test_bed.query_element(|e| e.proximity_detected()));
    }

    #[test]
    fn proximity_detector_failed_when_at_position_shows_not_active() {
        let mut test_bed = SimulationTestBed::from(ProximityDetector::new(
            ProximityDetectorId::UplockGearRight1,
            Ratio::new::<ratio>(0.5),
            Ratio::new::<ratio>(0.1),
        ));
        test_bed.fail(FailureType::GearProxSensorDamage(
            ProximityDetectorId::UplockGearRight1,
        ));
        test_bed.command_element(|e| e.update(Ratio::new::<ratio>(0.5)));
        assert!(!test_bed.query_element(|e| e.proximity_detected()));
    }

    #[test]
    fn proximity_detector_active_only_when_in_range() {
        let mut test_bed = SimulationTestBed::from(ProximityDetector::new(
            ProximityDetectorId::UplockGearRight1,
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
        let mut test_bed = SimulationTestBed::new(|context| {
            let gear_door = main_gear_door_right_assembly(context);

            TestSingleGearAircraft::new(
                Duration::from_millis(10),
                gear_door,
                main_gear_right_assembly(context, true),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(10));

        assert!(test_bed.query(|a| a.door_assembly.is_locked()));
        assert!(
            test_bed.query(|a| a.door_assembly.position_normalized()) == Ratio::new::<ratio>(0.)
        );
    }

    #[test]
    fn door_uplocked_gives_correct_proximity_sensor_state() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let gear_door = main_gear_door_right_assembly(context);

            TestSingleGearAircraft::new(
                Duration::from_millis(10),
                gear_door,
                main_gear_right_assembly(context, true),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(10));

        assert!(
            test_bed.query(|a| a.door_assembly.position_normalized()) == Ratio::new::<ratio>(0.)
        );

        assert!(test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu2)));

        assert!(!test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu2)));
    }

    #[test]
    fn door_opens_gear_stays_down_and_locked() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let gear_door = main_gear_door_right_assembly(context);

            TestSingleGearAircraft::new(
                Duration::from_millis(10),
                gear_door,
                main_gear_right_assembly(context, true),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(10));
        assert!(test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu2)));

        assert!(test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu2)));
    }

    #[test]
    fn no_unlocking_from_door_uplock_without_pressure() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let gear_door = main_gear_door_right_assembly(context);

            TestSingleGearAircraft::new(
                Duration::from_millis(10),
                gear_door,
                main_gear_right_assembly(context, true),
            )
        });
        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(10.)));

        test_bed.command(|a| a.command_doors_opening());
        test_bed.run_with_delta(Duration::from_millis(4000));

        assert!(test_bed.query(|a| a.is_gear_physically_locked()));
        assert!(test_bed.query(|a| a.is_door_physically_locked()));
    }

    #[test]
    fn full_retract_extend_cycle() {
        let mut test_bed = SimulationTestBed::new(|context| {
            let gear_door = main_gear_door_right_assembly(context);

            TestSingleGearAircraft::new(
                Duration::from_millis(10),
                gear_door,
                main_gear_right_assembly(context, true),
            )
        });
        test_bed.run_with_delta(Duration::from_millis(10));

        println!("RETRACT -- > DOOR OPENING");
        test_bed.command(|a| a.command_doors_opening());
        test_bed.run_with_delta(Duration::from_millis(4000));

        assert!(test_bed.query(|a| a.is_gear_physically_locked()));
        assert!(!test_bed.query(|a| a.is_door_physically_locked()));

        assert!(test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu2)));

        assert!(test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(!test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu2)));

        println!("RETRACT -- > GEAR RETRACTING");
        test_bed.command(|a| a.command_gears_retracting());
        test_bed.run_with_delta(Duration::from_millis(10000));

        assert!(test_bed.query(|a| a.is_gear_physically_locked()));
        assert!(!test_bed.query(|a| a.is_door_physically_locked()));

        assert!(!test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu2)));

        assert!(test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(!test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu2)));

        println!("RETRACT -- > DOOR CLOSING");
        test_bed.command(|a| a.command_doors_closing());
        test_bed.run_with_delta(Duration::from_millis(6000));

        assert!(test_bed.query(|a| a.is_gear_physically_locked()));
        assert!(test_bed.query(|a| a.is_door_physically_locked()));

        assert!(!test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu2)));

        assert!(!test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu2)));

        println!("EXTEND -- > DOOR OPENING");
        test_bed.command(|a| a.command_doors_opening());
        test_bed.run_with_delta(Duration::from_millis(5000));

        assert!(test_bed.query(|a| a.is_gear_physically_locked()));
        assert!(!test_bed.query(|a| a.is_door_physically_locked()));

        assert!(!test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu2)));

        assert!(test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(!test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu2)));

        println!("EXTEND -- > GEAR EXTENDING");
        test_bed.command(|a| a.command_gears_extending());
        test_bed.run_with_delta(Duration::from_millis(12000));

        assert!(test_bed.query(|a| a.is_gear_physically_locked()));
        assert!(!test_bed.query(|a| a.is_door_physically_locked()));

        assert!(test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu2)));

        assert!(test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(!test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu2)));

        println!("EXTEND -- > DOOR CLOSING");
        test_bed.command(|a| a.command_doors_closing());
        test_bed.run_with_delta(Duration::from_millis(6000));

        assert!(test_bed.query(|a| a.is_gear_physically_locked()));
        assert!(test_bed.query(|a| a.is_door_physically_locked()));

        assert!(test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_gear_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_gear_sensor_uplock(LgciuId::Lgciu2)));

        assert!(!test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu1)));
        assert!(!test_bed.query(|a| a.is_door_sensor_fully_opened(LgciuId::Lgciu2)));
        assert!(test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu1)));
        assert!(test_bed.query(|a| a.is_door_sensor_uplock(LgciuId::Lgciu2)));
    }

    fn main_gear_door_right_assembly(
        context: &mut InitContext,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = main_gear_door_right_body(true);
        let actuator = main_gear_door_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn main_gear_door_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 0.05;
        const DEFAULT_FORCE_GAIN: f64 = 200000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.055),
            Length::new::<meter>(0.03),
            VolumeRate::new::<gallon_per_second>(0.09),
            20000.,
            5000.,
            2000.,
            9000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.15, 0.16, 0.84, 0.85, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
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

    fn main_gear_right_assembly(
        context: &mut InitContext,
        is_locked: bool,
    ) -> HydraulicLinearActuatorAssembly<1> {
        let rigid_body = main_gear_right_body(is_locked);
        let actuator = main_gear_actuator(context, &rigid_body);

        HydraulicLinearActuatorAssembly::new([actuator], rigid_body)
    }

    fn gear_door_aero() -> AerodynamicModel {
        AerodynamicModel::new(
            &main_gear_door_right_body(true),
            Some(Vector3::new(-1., 0., 0.)),
            None,
            None,
            Ratio::new::<ratio>(1.0),
        )
    }

    fn gear_aero() -> AerodynamicModel {
        AerodynamicModel::new(
            &main_gear_right_body(true),
            Some(Vector3::new(-1., 0., 0.)),
            None,
            None,
            Ratio::new::<ratio>(1.0),
        )
    }

    fn main_gear_actuator(
        context: &mut InitContext,
        bounded_linear_length: &impl BoundedLinearLength,
    ) -> LinearActuator {
        const DEFAULT_I_GAIN: f64 = 5.;
        const DEFAULT_P_GAIN: f64 = 0.05;
        const DEFAULT_FORCE_GAIN: f64 = 200000.;

        LinearActuator::new(
            context,
            bounded_linear_length,
            1,
            Length::new::<meter>(0.145),
            Length::new::<meter>(0.105),
            VolumeRate::new::<gallon_per_second>(0.17),
            800000.,
            15000.,
            50000.,
            1200000.,
            Duration::from_millis(100),
            [1., 1., 1., 1., 0.5, 0.5],
            [0.5, 0.5, 1., 1., 1., 1.],
            [0., 0.1, 0.11, 0.89, 0.9, 1.],
            DEFAULT_P_GAIN,
            DEFAULT_I_GAIN,
            DEFAULT_FORCE_GAIN,
            true,
            false,
            None,
            None,
            Pressure::new::<psi>(3000.),
        )
    }

    fn main_gear_right_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(0.3, 3.453, 0.3);
        let cg_offset = Vector3::new(0., -3. / 4. * size[1], 0.);

        let control_arm = Vector3::new(-0.1815, 0.15, 0.);
        let anchor = Vector3::new(-0.26, 0.15, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(700.),
            size,
            cg_offset,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-80.),
            Angle::new::<degree>(80.),
            Angle::new::<degree>(0.),
            150.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }
}
