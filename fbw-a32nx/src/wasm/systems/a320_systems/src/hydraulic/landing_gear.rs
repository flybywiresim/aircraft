use systems::{
    hydraulic::{
        aerodynamic_model::AerodynamicModel,
        landing_gear::{
            GearSystemComponentAssembly, GearSystemController, GearSystemShockAbsorber,
        },
        linear_actuator::{Actuator, HydraulicLinearActuatorAssembly},
        HydraulicValve, HydraulicValveType,
    },
    shared::{
        ElectricalBusType, GearActuatorId, GearWheel, LgciuGearControl, LgciuId,
        ProximityDetectorId, SectionPressure,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use crate::landing_gear::GearSystemSensors;

use uom::si::f64::*;

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
impl Default for GearSystemHydraulicSupply {
    fn default() -> Self {
        Self::new()
    }
}
impl SimulationElement for GearSystemHydraulicSupply {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.safety_valve.accept(visitor);
        self.gear_and_door_selector_valve.accept(visitor);

        visitor.visit(self);
    }
}

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

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::{electric_potential::volt, pressure::psi};

    use systems::shared::{ElectricalBusType, PotentialOrigin};

    use systems::simulation::test::{SimulationTestBed, TestBed};
    use systems::simulation::{Aircraft, SimulationElement, UpdateContext};

    use systems::electrical::test::TestElectricitySource;
    use systems::electrical::ElectricalBus;
    use systems::electrical::Electricity;

    #[derive(Default)]
    pub struct TestGearValvesController {
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

    pub struct TestGearSystemController {
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

        fn without_active_control() -> Self {
            Self {
                open_door_request: false,
                extend_gear_request: true,
                control_active: false,
            }
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
}
