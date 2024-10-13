use crate::{
    failures::{Failure, FailureType},
    landing_gear::GearSystemSensors,
    shared::{
        random_from_range, ElectricalBusType, GearActuatorId, GearWheel, LgciuGearControl, LgciuId,
        ProximityDetectorId, SectionPressure,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use super::{
    aerodynamic_model::AerodynamicModel,
    linear_actuator::{
        Actuator, ElectroHydrostaticPowered, HydraulicAssemblyController,
        HydraulicLinearActuatorAssembly, HydraulicLocking, LinearActuatorMode,
    },
    HydraulicValve, HydraulicValveType,
};

use uom::si::{f64::*, pressure::psi, ratio::ratio};

pub trait GearGravityExtension {
    fn extension_handle_number_of_turns(&self) -> u8;
}

pub struct HydraulicGearSystem {
    door_center_position_id: VariableIdentifier,
    door_center_gear_slaved_position_id: VariableIdentifier,

    door_left_position_id: VariableIdentifier,
    door_right_position_id: VariableIdentifier,

    gear_center_position_id: VariableIdentifier,
    gear_left_position_id: VariableIdentifier,
    gear_right_position_id: VariableIdentifier,

    hydraulic_supply: GearSystemHydraulicSupply,

    nose_door_assembly: GearSystemComponentAssembly,
    left_door_assembly: GearSystemComponentAssembly,
    right_door_assembly: GearSystemComponentAssembly,

    nose_gear_assembly: GearSystemComponentAssembly,
    left_gear_assembly: GearSystemComponentAssembly,
    right_gear_assembly: GearSystemComponentAssembly,
}
impl HydraulicGearSystem {
    pub fn new(
        context: &mut InitContext,
        nose_door: HydraulicLinearActuatorAssembly<1>,
        left_door: HydraulicLinearActuatorAssembly<1>,
        right_door: HydraulicLinearActuatorAssembly<1>,
        nose_gear: HydraulicLinearActuatorAssembly<1>,
        left_gear: HydraulicLinearActuatorAssembly<1>,
        right_gear: HydraulicLinearActuatorAssembly<1>,
        gear_door_left_aerodynamic: AerodynamicModel,
        gear_door_right_aerodynamic: AerodynamicModel,
        gear_door_nose_aerodynamic: AerodynamicModel,
        gear_left_aerodynamic: AerodynamicModel,
        gear_right_aerodynamic: AerodynamicModel,
        gear_nose_aerodynamic: AerodynamicModel,
    ) -> Self {
        Self {
            door_center_position_id: context.get_identifier("GEAR_DOOR_CENTER_POSITION".to_owned()),
            door_center_gear_slaved_position_id: context
                .get_identifier("GEAR_CENTER_SMALL_POSITION".to_owned()),

            door_left_position_id: context.get_identifier("GEAR_DOOR_LEFT_POSITION".to_owned()),
            door_right_position_id: context.get_identifier("GEAR_DOOR_RIGHT_POSITION".to_owned()),

            gear_center_position_id: context.get_identifier("GEAR_CENTER_POSITION".to_owned()),
            gear_left_position_id: context.get_identifier("GEAR_LEFT_POSITION".to_owned()),
            gear_right_position_id: context.get_identifier("GEAR_RIGHT_POSITION".to_owned()),

            hydraulic_supply: GearSystemHydraulicSupply::new(),

            nose_door_assembly: GearSystemComponentAssembly::new(
                GearActuatorId::GearDoorNose,
                false,
                nose_door,
                false,
                [
                    ProximityDetectorId::UplockDoorNose1,
                    ProximityDetectorId::UplockDoorNose2,
                ],
                [
                    ProximityDetectorId::DownlockDoorNose1,
                    ProximityDetectorId::DownlockDoorNose2,
                ],
                gear_door_nose_aerodynamic,
            ),
            left_door_assembly: GearSystemComponentAssembly::new(
                GearActuatorId::GearDoorLeft,
                false,
                left_door,
                false,
                [
                    ProximityDetectorId::UplockDoorLeft1,
                    ProximityDetectorId::UplockDoorLeft2,
                ],
                [
                    ProximityDetectorId::DownlockDoorLeft1,
                    ProximityDetectorId::DownlockDoorLeft2,
                ],
                gear_door_left_aerodynamic,
            ),
            right_door_assembly: GearSystemComponentAssembly::new(
                GearActuatorId::GearDoorRight,
                false,
                right_door,
                false,
                [
                    ProximityDetectorId::UplockDoorRight1,
                    ProximityDetectorId::UplockDoorRight2,
                ],
                [
                    ProximityDetectorId::DownlockDoorRight1,
                    ProximityDetectorId::DownlockDoorRight2,
                ],
                gear_door_right_aerodynamic,
            ),

            // Nose gear has pull to retract system while main gears have push to retract
            nose_gear_assembly: GearSystemComponentAssembly::new(
                GearActuatorId::GearNose,
                false,
                nose_gear,
                true,
                [
                    ProximityDetectorId::UplockGearNose1,
                    ProximityDetectorId::UplockGearNose2,
                ],
                [
                    ProximityDetectorId::DownlockGearNose1,
                    ProximityDetectorId::DownlockGearNose2,
                ],
                gear_nose_aerodynamic,
            ),
            left_gear_assembly: GearSystemComponentAssembly::new(
                GearActuatorId::GearLeft,
                true,
                left_gear,
                true,
                [
                    ProximityDetectorId::UplockGearLeft1,
                    ProximityDetectorId::UplockGearLeft2,
                ],
                [
                    ProximityDetectorId::DownlockGearLeft1,
                    ProximityDetectorId::DownlockGearLeft2,
                ],
                gear_left_aerodynamic,
            ),
            right_gear_assembly: GearSystemComponentAssembly::new(
                GearActuatorId::GearRight,
                true,
                right_gear,
                true,
                [
                    ProximityDetectorId::UplockGearRight1,
                    ProximityDetectorId::UplockGearRight2,
                ],
                [
                    ProximityDetectorId::DownlockGearRight1,
                    ProximityDetectorId::DownlockGearRight2,
                ],
                gear_right_aerodynamic,
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        valves_controller: &impl GearSystemController,
        lgciu_controller: &impl LgciuGearControl,
        main_hydraulic_circuit: &impl SectionPressure,
    ) {
        self.hydraulic_supply.update(
            context,
            valves_controller,
            lgciu_controller,
            main_hydraulic_circuit.pressure_downstream_priority_valve(),
        );

        let current_pressure = self.hydraulic_supply.gear_system_manifold_pressure();

        self.nose_door_assembly.update(
            context,
            lgciu_controller,
            valves_controller,
            current_pressure,
        );
        self.left_door_assembly.update(
            context,
            lgciu_controller,
            valves_controller,
            current_pressure,
        );
        self.right_door_assembly.update(
            context,
            lgciu_controller,
            valves_controller,
            current_pressure,
        );

        self.nose_gear_assembly.update(
            context,
            lgciu_controller,
            valves_controller,
            current_pressure,
        );
        self.left_gear_assembly.update(
            context,
            lgciu_controller,
            valves_controller,
            current_pressure,
        );
        self.right_gear_assembly.update(
            context,
            lgciu_controller,
            valves_controller,
            current_pressure,
        );
    }

    pub fn gear_hydraulic_manifold_pressure(&self) -> Pressure {
        self.hydraulic_supply.gear_system_manifold_pressure()
    }

    pub fn all_actuators(&mut self) -> [&mut impl Actuator; 6] {
        [
            self.nose_door_assembly.actuator(),
            self.left_door_assembly.actuator(),
            self.right_door_assembly.actuator(),
            self.nose_gear_assembly.actuator(),
            self.left_gear_assembly.actuator(),
            self.right_gear_assembly.actuator(),
        ]
    }
}
impl GearSystemSensors for HydraulicGearSystem {
    fn is_wheel_id_up_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool {
        match wheel_id {
            GearWheel::NOSE => self.nose_gear_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::LEFT => self.left_gear_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::RIGHT => self.right_gear_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::WINGLEFT => self.left_gear_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::WINGRIGHT => self.right_gear_assembly.is_sensor_uplock(lgciu_id),
        }
    }

    fn is_wheel_id_down_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool {
        match wheel_id {
            GearWheel::NOSE => self.nose_gear_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::LEFT => self.left_gear_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::RIGHT => self.right_gear_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::WINGLEFT => self.left_gear_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::WINGRIGHT => self.right_gear_assembly.is_sensor_uplock(lgciu_id),
        }
    }

    fn is_door_id_up_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool {
        match wheel_id {
            GearWheel::NOSE => self.nose_door_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::LEFT => self.left_door_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::RIGHT => self.right_door_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::WINGLEFT => self.left_door_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::WINGRIGHT => self.right_door_assembly.is_sensor_uplock(lgciu_id),
        }
    }

    fn is_door_id_down_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool {
        match wheel_id {
            GearWheel::NOSE => self.nose_door_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::LEFT => self.left_door_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::RIGHT => self.right_door_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::WINGLEFT => self.left_door_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::WINGRIGHT => self.right_door_assembly.is_sensor_fully_opened(lgciu_id),
        }
    }
}
impl SimulationElement for HydraulicGearSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.hydraulic_supply.accept(visitor);
        self.nose_gear_assembly.accept(visitor);
        self.left_gear_assembly.accept(visitor);
        self.right_gear_assembly.accept(visitor);

        self.nose_door_assembly.accept(visitor);
        self.left_door_assembly.accept(visitor);
        self.right_door_assembly.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.door_center_position_id,
            self.nose_door_assembly.position_normalized(),
        );
        writer.write(
            &self.door_center_gear_slaved_position_id,
            self.nose_gear_assembly.position_normalized(),
        );

        writer.write(
            &self.door_left_position_id,
            self.left_door_assembly.position_normalized(),
        );
        writer.write(
            &self.door_right_position_id,
            self.right_door_assembly.position_normalized(),
        );

        writer.write(
            &self.gear_center_position_id,
            self.nose_gear_assembly.position_normalized(),
        );
        writer.write(
            &self.gear_left_position_id,
            self.left_gear_assembly.position_normalized(),
        );
        writer.write(
            &self.gear_right_position_id,
            self.right_gear_assembly.position_normalized(),
        );
    }
}

pub trait GearSystemController {
    fn safety_valve_should_open(&self) -> bool;
    fn shut_off_valve_should_open(&self) -> bool;
    fn vent_valves_should_open(&self) -> bool;
    fn doors_uplocks_should_mechanically_unlock(&self) -> bool;
    fn gears_uplocks_should_mechanically_unlock(&self) -> bool;
}

struct GearSystemHydraulicSupply {
    safety_valve: HydraulicValve,
    cutoff_valve: HydraulicValve,
    gear_and_door_selector_valve: HydraulicValve,
}
impl GearSystemHydraulicSupply {
    fn new() -> Self {
        Self {
            safety_valve: HydraulicValve::new(
                HydraulicValveType::ClosedWhenOff,
                Some(vec![
                    ElectricalBusType::DirectCurrentEssential,
                    ElectricalBusType::DirectCurrentGndFltService,
                ]),
            ),
            cutoff_valve: HydraulicValve::new(HydraulicValveType::Mechanical, None),
            gear_and_door_selector_valve: HydraulicValve::new(
                HydraulicValveType::ClosedWhenOff,
                Some(vec![
                    ElectricalBusType::DirectCurrentEssential,
                    ElectricalBusType::DirectCurrentGndFltService,
                ]),
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        valves_controller: &impl GearSystemController,
        gear_controller: &impl LgciuGearControl,
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
        self.gear_and_door_selector_valve.update(
            context,
            gear_controller.control_active(),
            self.cutoff_valve.pressure_output(),
        );
    }

    fn gear_system_manifold_pressure(&self) -> Pressure {
        self.gear_and_door_selector_valve.pressure_output()
    }
}
impl SimulationElement for GearSystemHydraulicSupply {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.safety_valve.accept(visitor);
        self.gear_and_door_selector_valve.accept(visitor);

        visitor.visit(self);
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

struct GearSystemComponentAssembly {
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

    fn new(
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

    fn update(
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

    fn position_normalized(&self) -> Ratio {
        if !self.is_inverted_control {
            self.hydraulic_assembly.position_normalized()
        } else {
            Ratio::new::<ratio>(1.) - self.hydraulic_assembly.position_normalized()
        }
    }

    fn actuator(&mut self) -> &mut impl Actuator {
        self.hydraulic_assembly.actuator(0)
    }

    fn is_sensor_uplock(&self, lgciu_id: LgciuId) -> bool {
        self.uplock_proximity_detectors[lgciu_id as usize].proximity_detected()
    }

    fn is_sensor_fully_opened(&self, lgciu_id: LgciuId) -> bool {
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
mod tests {
    use super::*;

    use nalgebra::Vector3;

    use std::time::Duration;
    use uom::si::{
        angle::degree, electric_potential::volt, length::meter, mass::kilogram,
        volume_rate::gallon_per_second,
    };

    use crate::hydraulic::linear_actuator::{
        BoundedLinearLength, LinearActuatedRigidBodyOnHingeAxis, LinearActuator,
    };
    use crate::shared::{update_iterator::MaxStepLoop, ElectricalBusType, PotentialOrigin};

    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, UpdateContext};

    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

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
        fn new() -> Self {
            Self {
                open_door_request: false,
                extend_gear_request: true,
                control_active: true,
            }
        }

        fn without_active_control() -> Self {
            Self {
                open_door_request: false,
                extend_gear_request: true,
                control_active: false,
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

    struct TestHydraulicManifoldAircraft {
        hyd_manifold: GearSystemHydraulicSupply,
        main_hydraulic_pressure: Pressure,

        valves_controller: TestGearValvesController,
        gear_controller: TestGearSystemController,

        powered_source_dc: TestElectricitySource,
        dc_ess_bus: ElectricalBus,
        is_dc_ess_powered: bool,
    }
    impl TestHydraulicManifoldAircraft {
        fn new(
            context: &mut InitContext,
            valves_controller: TestGearValvesController,
            gear_controller: TestGearSystemController,
        ) -> Self {
            Self {
                hyd_manifold: GearSystemHydraulicSupply::new(),
                main_hydraulic_pressure: Pressure::default(),
                valves_controller,
                gear_controller,
                powered_source_dc: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                is_dc_ess_powered: true,
            }
        }

        fn set_current_pressure(&mut self, current_pressure: Pressure) {
            self.main_hydraulic_pressure = current_pressure;
        }

        fn set_dc_power(&mut self, is_powered: bool) {
            self.is_dc_ess_powered = is_powered;
        }

        fn gear_system_manifold_pressure(&self) -> Pressure {
            self.hyd_manifold.gear_system_manifold_pressure()
        }
    }
    impl Aircraft for TestHydraulicManifoldAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_dc
                .power_with_potential(ElectricPotential::new::<volt>(28.));
            electricity.supplied_by(&self.powered_source_dc);

            if self.is_dc_ess_powered {
                electricity.flow(&self.powered_source_dc, &self.dc_ess_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.hyd_manifold.update(
                context,
                &self.valves_controller,
                &self.gear_controller,
                self.main_hydraulic_pressure,
            );
        }
    }
    impl SimulationElement for TestHydraulicManifoldAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.hyd_manifold.accept(visitor);

            visitor.visit(self);
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
    fn hydraulic_manifold_receives_pressure_with_all_valves_opened() {
        let mut test_bed = SimulationTestBed::new(|context| {
            TestHydraulicManifoldAircraft::new(
                context,
                TestGearValvesController::with_safety_and_shutoff_opened(),
                TestGearSystemController::new(),
            )
        });

        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(
            test_bed.query(|a| a.gear_system_manifold_pressure()) > Pressure::new::<psi>(2500.)
        );
    }

    #[test]
    fn hydraulic_manifold_output_has_no_pressure_with_power_off() {
        let mut test_bed = SimulationTestBed::new(|context| {
            TestHydraulicManifoldAircraft::new(
                context,
                TestGearValvesController::with_safety_and_shutoff_opened(),
                TestGearSystemController::new(),
            )
        });

        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.set_dc_power(false));

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(test_bed.query(|a| a.gear_system_manifold_pressure()) < Pressure::new::<psi>(200.));
    }

    #[test]
    fn hydraulic_manifold_do_not_receive_pressure_with_shut_off_valve_closed() {
        let mut test_bed = SimulationTestBed::new(|context| {
            TestHydraulicManifoldAircraft::new(
                context,
                TestGearValvesController::with_safety_opened_shut_off_closed(),
                TestGearSystemController::new(),
            )
        });
        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(test_bed.query(|e| e.gear_system_manifold_pressure()) < Pressure::new::<psi>(100.));
    }

    #[test]
    fn hydraulic_manifold_do_not_receive_pressure_with_safety_valve_closed() {
        let mut test_bed = SimulationTestBed::new(|context| {
            TestHydraulicManifoldAircraft::new(
                context,
                TestGearValvesController::with_safety_closed_shut_off_opened(),
                TestGearSystemController::new(),
            )
        });
        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(test_bed.query(|e| e.gear_system_manifold_pressure()) < Pressure::new::<psi>(100.));
    }

    #[test]
    fn hydraulic_manifold_do_not_receive_pressure_with_all_valves_closed() {
        let mut test_bed = SimulationTestBed::new(|context| {
            TestHydraulicManifoldAircraft::new(
                context,
                TestGearValvesController::with_all_valve_closed(),
                TestGearSystemController::new(),
            )
        });
        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(test_bed.query(|e| e.gear_system_manifold_pressure()) < Pressure::new::<psi>(100.));
    }

    #[test]
    fn hydraulic_manifold_do_not_receive_pressure_with_all_valves_opened_but_control_not_active() {
        let mut test_bed = SimulationTestBed::new(|context| {
            TestHydraulicManifoldAircraft::new(
                context,
                TestGearValvesController::with_safety_and_shutoff_opened(),
                TestGearSystemController::without_active_control(),
            )
        });
        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(3000.)));

        test_bed.run_with_delta(Duration::from_millis(100));

        assert!(test_bed.query(|e| e.gear_system_manifold_pressure()) < Pressure::new::<psi>(100.));
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
