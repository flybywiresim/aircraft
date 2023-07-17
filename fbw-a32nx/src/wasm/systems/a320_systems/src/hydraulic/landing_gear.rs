use systems::{
    hydraulic::{
        aerodynamic_model::AerodynamicModel,
        landing_gear::{
            GearSystemComponentAssembly, GearSystemController, GearSystemHydraulicSupply,
            GearSystemShockAbsorber,
        },
        linear_actuator::{Actuator, HydraulicLinearActuatorAssembly},
    },
    shared::{
        GearActuatorId, GearWheel, LgciuGearControl, LgciuId, ProximityDetectorId, SectionPressure,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use crate::landing_gear::GearSystemSensors;

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

    nose_gear_shock_absorber: GearSystemShockAbsorber,
    left_gear_shock_absorber: GearSystemShockAbsorber,
    right_gear_shock_absorber: GearSystemShockAbsorber,
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

            nose_gear_shock_absorber: GearSystemShockAbsorber::new(
                context,
                GearActuatorId::GearNose,
            ),
            left_gear_shock_absorber: GearSystemShockAbsorber::new(
                context,
                GearActuatorId::GearLeft,
            ),
            right_gear_shock_absorber: GearSystemShockAbsorber::new(
                context,
                GearActuatorId::GearRight,
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
        }
    }

    fn is_wheel_id_down_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool {
        match wheel_id {
            GearWheel::NOSE => self.nose_gear_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::LEFT => self.left_gear_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::RIGHT => self.right_gear_assembly.is_sensor_fully_opened(lgciu_id),
        }
    }

    fn is_door_id_up_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool {
        match wheel_id {
            GearWheel::NOSE => self.nose_door_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::LEFT => self.left_door_assembly.is_sensor_uplock(lgciu_id),
            GearWheel::RIGHT => self.right_door_assembly.is_sensor_uplock(lgciu_id),
        }
    }

    fn is_door_id_down_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool {
        match wheel_id {
            GearWheel::NOSE => self.nose_door_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::LEFT => self.left_door_assembly.is_sensor_fully_opened(lgciu_id),
            GearWheel::RIGHT => self.right_door_assembly.is_sensor_fully_opened(lgciu_id),
        }
    }

    fn is_gear_id_shock_absorber_fully_extended(
        &self,
        wheel_id: GearWheel,
        lgciu_id: LgciuId,
    ) -> bool {
        match wheel_id {
            GearWheel::NOSE => self
                .nose_gear_shock_absorber
                .is_shock_absorber_fully_extended(lgciu_id),
            GearWheel::LEFT => self
                .left_gear_shock_absorber
                .is_shock_absorber_fully_extended(lgciu_id),
            GearWheel::RIGHT => self
                .right_gear_shock_absorber
                .is_shock_absorber_fully_extended(lgciu_id),
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

        self.nose_gear_shock_absorber.accept(visitor);
        self.left_gear_shock_absorber.accept(visitor);
        self.right_gear_shock_absorber.accept(visitor);

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
