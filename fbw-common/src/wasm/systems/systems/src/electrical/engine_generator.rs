use super::{
    ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
    ElectricalStateWriter, ElectricitySource, EngineGeneratorPushButtons, Potential,
    PotentialOrigin, ProvideFrequency, ProvideLoad, ProvidePotential,
};
use crate::{
    engine::Engine,
    failures::{Failure, FailureType},
    shared::{calculate_towards_target_temperature, EngineFirePushButtons, PowerConsumptionReport},
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};
use std::{ops::RangeInclusive, time::Duration};
use uom::si::{
    angular_velocity::revolution_per_minute,
    electric_potential::volt,
    f64::*,
    frequency::hertz,
    ratio::{percent, ratio},
    thermodynamic_temperature::degree_celsius,
};

pub const INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME: Duration = Duration::from_millis(500);

pub type IntegratedDriveGenerator = EngineGenerator<ConstantSpeedDrive>;
pub type VariableFrequencyGenerator = EngineGenerator<DirectDrive>;

pub trait EngineGeneratorDrive: SimulationElement {
    fn new_drive(context: &mut InitContext, number: usize) -> Self;
    fn update_drive(&mut self, context: &UpdateContext, engine: &impl Engine);
    fn output_speed(&self) -> AngularVelocity;
    fn disconnect(&mut self);
    fn is_connected(&self) -> bool;
}

pub struct EngineGenerator<Drive: EngineGeneratorDrive> {
    writer: ElectricalStateWriter,
    number: usize,
    max_true_power: Power,
    identifier: ElectricalElementIdentifier,
    drive: Drive,
    activated: bool,
    output_frequency: Frequency,
    normal_frequency: RangeInclusive<f64>,
    output_potential: ElectricPotential,
    load: Ratio,
    time_above_threshold: Duration,
    failure: Failure,
}
impl<Drive: EngineGeneratorDrive> EngineGenerator<Drive> {
    pub fn new(
        context: &mut InitContext,
        number: usize,
        max_true_power: Power,
        normal_frequency: RangeInclusive<f64>,
    ) -> Self {
        EngineGenerator {
            writer: ElectricalStateWriter::new(context, &format!("ENG_GEN_{}", number)),
            number,
            max_true_power,
            identifier: context.next_electrical_identifier(),
            drive: Drive::new_drive(context, number),
            activated: true,
            output_frequency: Frequency::new::<hertz>(0.),
            normal_frequency,
            output_potential: ElectricPotential::new::<volt>(0.),
            load: Ratio::new::<percent>(0.),
            time_above_threshold: INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME,
            failure: Failure::new(FailureType::Generator(number)),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine: &impl Engine,
        generator_buttons: &impl EngineGeneratorPushButtons,
        fire_buttons: &impl EngineFirePushButtons,
    ) {
        if generator_buttons.idg_push_button_is_released(self.number) {
            // The drive cannot be reconnected.
            self.drive.disconnect();
        }
        self.activated = generator_buttons.engine_gen_push_button_is_on(self.number)
            && !fire_buttons.is_released(self.number);
        self.drive.update_drive(context, engine);
        self.output_frequency = if self.activated {
            Frequency::new::<hertz>(
                self.drive.output_speed().get::<revolution_per_minute>() * 4. / 120.,
            )
        } else {
            Frequency::default()
        };
        self.update_stable_time(context);
    }

    // TODO: move to GCU when implemented
    fn update_stable_time(&mut self, context: &UpdateContext) {
        if !self.activated {
            self.time_above_threshold = Duration::ZERO;
            return;
        }

        let new_time = if self.frequency_normal() {
            self.time_above_threshold + context.delta()
        } else {
            Duration::ZERO
        };

        self.time_above_threshold = new_time.clamp(
            Duration::ZERO,
            INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME,
        );
    }

    fn provides_stable_power_output(&self) -> bool {
        self.time_above_threshold == INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME
    }

    /// Indicates if the provided electricity's potential and frequency
    /// are within normal parameters. Use this to decide if the
    /// generator contactor should close.
    /// Load shouldn't be taken into account, as overloading causes an
    /// overtemperature which over time will trigger a mechanical
    /// disconnect of the generator.
    pub fn output_within_normal_parameters(&self) -> bool {
        self.should_provide_output() && self.potential_normal()
    }

    fn should_provide_output(&self) -> bool {
        self.provides_stable_power_output()
            && self.activated
            && self.frequency_normal()
            && !self.failure.is_active()
    }

    pub fn is_drive_connected(&self) -> bool {
        self.drive.is_connected()
    }
}
impl<Drive: EngineGeneratorDrive> ElectricitySource for EngineGenerator<Drive> {
    fn output_potential(&self) -> Potential {
        if self.should_provide_output() {
            Potential::new(
                PotentialOrigin::EngineGenerator(self.number),
                self.output_potential,
            )
        } else {
            Potential::none()
        }
    }
}
// TODO: Move to GCU
impl<Drive: EngineGeneratorDrive> ProvidePotential for EngineGenerator<Drive> {
    fn potential(&self) -> ElectricPotential {
        self.output_potential
    }
    fn potential_normal(&self) -> bool {
        let volts = self.output_potential.get::<volt>();
        (110.0..=120.0).contains(&volts)
    }
}
// TODO: Move to GCU
impl<Drive: EngineGeneratorDrive> ProvideFrequency for EngineGenerator<Drive> {
    fn frequency(&self) -> Frequency {
        self.output_frequency
    }
    fn frequency_normal(&self) -> bool {
        let hz = self.output_frequency.get::<hertz>();
        self.normal_frequency.contains(&hz)
    }
}
// TODO: Move to GCU
impl<Drive: EngineGeneratorDrive> ProvideLoad for EngineGenerator<Drive> {
    fn load(&self) -> Ratio {
        self.load
    }
    fn load_normal(&self) -> bool {
        self.load <= Ratio::new::<percent>(100.)
    }
}
impl<Drive: EngineGeneratorDrive> ElectricalElement for EngineGenerator<Drive> {
    fn input_identifier(&self) -> super::ElectricalElementIdentifier {
        self.identifier
    }

    fn output_identifier(&self) -> super::ElectricalElementIdentifier {
        self.identifier
    }

    fn is_conductive(&self) -> bool {
        true
    }
}
impl<Drive: EngineGeneratorDrive> SimulationElement for EngineGenerator<Drive> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.drive.accept(visitor);
        self.failure.accept(visitor);

        visitor.visit(self);
    }

    fn process_power_consumption_report<T: PowerConsumptionReport>(
        &mut self,
        _: &UpdateContext,
        report: &T,
    ) {
        const POWERFACTOR: f64 = 0.8;

        self.output_potential = if self.should_provide_output() {
            ElectricPotential::new::<volt>(115.)
        } else {
            ElectricPotential::new::<volt>(0.)
        };

        let power_consumption =
            report.total_consumption_of(PotentialOrigin::EngineGenerator(self.number));
        let power_factor_correction = Ratio::new::<ratio>(POWERFACTOR);
        self.load = power_consumption * power_factor_correction / self.max_true_power;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating_with_load(self, writer);
    }
}

pub struct ConstantSpeedDrive {
    oil_outlet_temperature_id: VariableIdentifier,
    oil_outlet_temperature: ThermodynamicTemperature,
    is_connected_id: VariableIdentifier,
    connected: bool,
    output_speed: AngularVelocity,
}
impl ConstantSpeedDrive {
    // Threshold to reach target output speed = 58% of 16645 RPM
    pub const ENGINE_GEARBOX_POWER_UP_OUTPUT_THRESHOLD: f64 = 0.58 * 16645.;
    const OUTPUT_SPEED_RPM: f64 = 12000.;

    const M: f64 = Self::OUTPUT_SPEED_RPM / Self::ENGINE_GEARBOX_POWER_UP_OUTPUT_THRESHOLD;

    fn new(context: &mut InitContext, number: usize) -> ConstantSpeedDrive {
        ConstantSpeedDrive {
            oil_outlet_temperature_id: context.get_identifier(format!(
                "ELEC_ENG_GEN_{}_IDG_OIL_OUTLET_TEMPERATURE",
                number
            )),
            oil_outlet_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
            is_connected_id: context
                .get_identifier(format!("ELEC_ENG_GEN_{}_IDG_IS_CONNECTED", number)),
            connected: true,
            output_speed: AngularVelocity::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, engine: &impl Engine) {
        self.output_speed = if self.connected {
            (Self::M * engine.gearbox_speed()).min(AngularVelocity::new::<revolution_per_minute>(
                Self::OUTPUT_SPEED_RPM,
            ))
        } else {
            AngularVelocity::default()
        };
        self.update_temperature(
            context,
            self.get_target_temperature(context, engine.corrected_n2()),
        );
    }

    fn update_temperature(&mut self, context: &UpdateContext, target: ThermodynamicTemperature) {
        const IDG_HEATING_COEFFICIENT: f64 = 1.4;
        const IDG_COOLING_COEFFICIENT: f64 = 0.4;

        self.oil_outlet_temperature = calculate_towards_target_temperature(
            self.oil_outlet_temperature,
            target,
            if self.oil_outlet_temperature < target {
                IDG_HEATING_COEFFICIENT
            } else {
                IDG_COOLING_COEFFICIENT
            },
            context.delta(),
        );
    }

    fn get_target_temperature(
        &self,
        context: &UpdateContext,
        corrected_n2: Ratio,
    ) -> ThermodynamicTemperature {
        const TEMPERATURE_TO_RPM_FACTOR: f64 = 1.8;

        if !self.connected {
            return context.ambient_temperature();
        }

        let ambient_temperature = context.ambient_temperature().get::<degree_celsius>();
        let target_idg =
            corrected_n2.get::<percent>() * TEMPERATURE_TO_RPM_FACTOR + ambient_temperature;

        // TODO improve this function with feedback @komp provides.

        ThermodynamicTemperature::new::<degree_celsius>(target_idg)
    }
}
impl EngineGeneratorDrive for ConstantSpeedDrive {
    fn new_drive(context: &mut InitContext, number: usize) -> Self {
        Self::new(context, number)
    }

    fn update_drive(&mut self, context: &UpdateContext, engine: &impl Engine) {
        self.update(context, engine);
    }

    fn output_speed(&self) -> AngularVelocity {
        self.output_speed
    }

    fn disconnect(&mut self) {
        self.connected = false;
    }

    fn is_connected(&self) -> bool {
        self.connected
    }
}
impl SimulationElement for ConstantSpeedDrive {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.oil_outlet_temperature_id, self.oil_outlet_temperature);
        writer.write(&self.is_connected_id, self.connected);
    }
}

pub struct DirectDrive {
    oil_outlet_temperature_id: VariableIdentifier,
    oil_outlet_temperature: ThermodynamicTemperature,
    is_connected_id: VariableIdentifier,
    connected: bool,
    output_speed: AngularVelocity,
}
impl DirectDrive {
    const TRANSMISSION_RATIO: f64 = 1.95;

    fn new(context: &mut InitContext, number: usize) -> Self {
        Self {
            oil_outlet_temperature_id: context.get_identifier(format!(
                "ELEC_ENG_GEN_{}_IDG_OIL_OUTLET_TEMPERATURE",
                number
            )),
            oil_outlet_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
            is_connected_id: context
                .get_identifier(format!("ELEC_ENG_GEN_{}_IDG_IS_CONNECTED", number)),
            connected: true,
            output_speed: AngularVelocity::default(),
        }
    }

    fn update_temperature(&mut self, context: &UpdateContext, target: ThermodynamicTemperature) {
        const IDG_HEATING_COEFFICIENT: f64 = 1.4;
        const IDG_COOLING_COEFFICIENT: f64 = 0.4;

        self.oil_outlet_temperature = calculate_towards_target_temperature(
            self.oil_outlet_temperature,
            target,
            if self.oil_outlet_temperature < target {
                IDG_HEATING_COEFFICIENT
            } else {
                IDG_COOLING_COEFFICIENT
            },
            context.delta(),
        );
    }

    fn get_target_temperature(
        &self,
        context: &UpdateContext,
        corrected_n2: Ratio,
    ) -> ThermodynamicTemperature {
        const TEMPERATURE_TO_RPM_FACTOR: f64 = 1.8;

        if !self.connected {
            return context.ambient_temperature();
        }

        let ambient_temperature = context.ambient_temperature().get::<degree_celsius>();
        let target_idg =
            corrected_n2.get::<percent>() * TEMPERATURE_TO_RPM_FACTOR + ambient_temperature;

        // TODO improve this function with feedback @komp provides.

        ThermodynamicTemperature::new::<degree_celsius>(target_idg)
    }
}
impl EngineGeneratorDrive for DirectDrive {
    fn new_drive(context: &mut InitContext, number: usize) -> Self {
        Self::new(context, number)
    }

    fn update_drive(&mut self, context: &UpdateContext, engine: &impl Engine) {
        self.output_speed = if self.connected {
            engine.gearbox_speed() * Self::TRANSMISSION_RATIO
        } else {
            AngularVelocity::default()
        };

        self.update_temperature(
            context,
            self.get_target_temperature(context, engine.corrected_n2()),
        )
    }

    fn output_speed(&self) -> AngularVelocity {
        self.output_speed
    }

    fn disconnect(&mut self) {
        self.connected = false;
    }

    fn is_connected(&self) -> bool {
        self.connected
    }
}
impl SimulationElement for DirectDrive {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.oil_outlet_temperature_id, self.oil_outlet_temperature);
        writer.write(&self.is_connected_id, self.connected);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shared::{EngineCorrectedN1, EngineCorrectedN2, EngineUncorrectedN2};

    struct TestEngine {
        corrected_n2: Ratio,
    }
    impl TestEngine {
        fn new(engine_corrected_n2: Ratio) -> Self {
            Self {
                corrected_n2: engine_corrected_n2,
            }
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            unimplemented!()
        }
    }
    impl EngineCorrectedN2 for TestEngine {
        fn corrected_n2(&self) -> Ratio {
            self.corrected_n2
        }
    }
    impl EngineUncorrectedN2 for TestEngine {
        fn uncorrected_n2(&self) -> Ratio {
            unimplemented!()
        }
    }
    impl Engine for TestEngine {
        fn hydraulic_pump_output_speed(&self) -> AngularVelocity {
            unimplemented!()
        }

        fn oil_pressure_is_low(&self) -> bool {
            unimplemented!()
        }

        fn is_above_minimum_idle(&self) -> bool {
            unimplemented!()
        }

        fn net_thrust(&self) -> Mass {
            unimplemented!()
        }

        fn gearbox_speed(&self) -> AngularVelocity {
            AngularVelocity::new::<revolution_per_minute>(self.corrected_n2.get::<ratio>() * 16000.)
        }
    }

    struct TestOverhead {
        engine_gen_push_button_is_on: bool,
        idg_push_button_is_released: bool,
    }
    impl TestOverhead {
        fn new(engine_gen_push_button_is_on: bool, idg_push_button_is_released: bool) -> Self {
            Self {
                engine_gen_push_button_is_on,
                idg_push_button_is_released,
            }
        }
    }
    impl EngineGeneratorPushButtons for TestOverhead {
        fn engine_gen_push_button_is_on(&self, _: usize) -> bool {
            self.engine_gen_push_button_is_on
        }

        fn idg_push_button_is_released(&self, _: usize) -> bool {
            self.idg_push_button_is_released
        }
    }

    struct TestFireOverhead {
        engine_fire_push_button_is_released: bool,
    }
    impl TestFireOverhead {
        fn new(engine_fire_push_button_is_released: bool) -> Self {
            Self {
                engine_fire_push_button_is_released,
            }
        }
    }
    impl EngineFirePushButtons for TestFireOverhead {
        fn is_released(&self, _: usize) -> bool {
            self.engine_fire_push_button_is_released
        }
    }

    #[cfg(test)]
    mod engine_generator_tests {
        use super::*;
        use crate::{
            electrical::{
                consumption::PowerConsumer, ElectricalBus, ElectricalBusType, Electricity,
            },
            simulation::{
                test::{ReadByName, SimulationTestBed, TestBed},
                Aircraft, InitContext,
            },
        };
        use uom::si::power::{kilowatt, watt};

        struct EngineGeneratorTestBed {
            test_bed: SimulationTestBed<TestAircraft>,
        }
        impl EngineGeneratorTestBed {
            fn with_running_engine() -> Self {
                Self {
                    test_bed: SimulationTestBed::new(TestAircraft::with_running_engine),
                }
            }

            fn with_shutdown_engine() -> Self {
                Self {
                    test_bed: SimulationTestBed::new(TestAircraft::with_shutdown_engine),
                }
            }

            fn frequency_is_normal(&mut self) -> bool {
                self.read_by_name("ELEC_ENG_GEN_1_FREQUENCY_NORMAL")
            }

            fn potential_is_normal(&mut self) -> bool {
                self.read_by_name("ELEC_ENG_GEN_1_POTENTIAL_NORMAL")
            }

            fn load_is_normal(&mut self) -> bool {
                self.read_by_name("ELEC_ENG_GEN_1_LOAD_NORMAL")
            }

            fn load(&mut self) -> Ratio {
                self.read_by_name("ELEC_ENG_GEN_1_LOAD")
            }

            fn generator_is_powered(&mut self) -> bool {
                self.query_elec(|a, elec| a.generator_is_powered(elec))
            }

            fn generator_provides_stable_power_output(&self) -> bool {
                self.query(|a| a.generator_output_within_normal_parameters())
            }
        }
        impl TestBed for EngineGeneratorTestBed {
            type Aircraft = TestAircraft;

            fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
                &self.test_bed
            }

            fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
                &mut self.test_bed
            }
        }

        struct TestAircraft {
            engine_gen: IntegratedDriveGenerator,
            bus: ElectricalBus,
            running: bool,
            gen_push_button_on: bool,
            idg_push_button_released: bool,
            fire_push_button_released: bool,
            consumer: PowerConsumer,
            generator_output_within_normal_parameters_before_processing_power_consumption_report:
                bool,
        }
        impl TestAircraft {
            fn new(running: bool, context: &mut InitContext) -> Self {
                Self {
                    engine_gen: IntegratedDriveGenerator::new(context, 1, Power::new::<kilowatt>(90.), 390.0..=410.0),
                    bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                    running,
                    gen_push_button_on: true,
                    idg_push_button_released: false,
                    fire_push_button_released: false,
                    consumer: PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1)),
                    generator_output_within_normal_parameters_before_processing_power_consumption_report: false
                }
            }

            fn with_shutdown_engine(context: &mut InitContext) -> Self {
                TestAircraft::new(false, context)
            }

            fn with_running_engine(context: &mut InitContext) -> Self {
                TestAircraft::new(true, context)
            }

            fn disconnect_idg(&mut self) {
                self.idg_push_button_released = true;
            }

            fn gen_push_button_off(&mut self) {
                self.gen_push_button_on = false;
            }

            fn release_fire_push_button(&mut self) {
                self.fire_push_button_released = true;
            }

            fn generator_is_powered(&self, electricity: &Electricity) -> bool {
                electricity.is_powered(&self.engine_gen)
            }

            fn power_demand(&mut self, power: Power) {
                self.consumer.demand(power);
            }

            fn generator_output_within_normal_parameters_after_processing_power_consumption_report(
                &self,
            ) -> bool {
                self.generator_output_within_normal_parameters()
            }

            fn shutdown_engine(&mut self) {
                self.running = false;
            }

            fn start_engine(&mut self) {
                self.running = true;
            }

            fn generator_output_within_normal_parameters_before_processing_power_consumption_report(
                &self,
            ) -> bool {
                self.generator_output_within_normal_parameters_before_processing_power_consumption_report
            }

            fn generator_output_within_normal_parameters(&self) -> bool {
                self.engine_gen.output_within_normal_parameters()
            }
        }
        impl Aircraft for TestAircraft {
            fn update_before_power_distribution(
                &mut self,
                context: &UpdateContext,
                electricity: &mut Electricity,
            ) {
                self.engine_gen.update(
                    context,
                    &TestEngine::new(Ratio::new::<percent>(if self.running { 80. } else { 0. })),
                    &TestOverhead::new(self.gen_push_button_on, self.idg_push_button_released),
                    &TestFireOverhead::new(self.fire_push_button_released),
                );
                electricity.supplied_by(&self.engine_gen);
                electricity.flow(&self.engine_gen, &self.bus);

                self.generator_output_within_normal_parameters_before_processing_power_consumption_report = self.engine_gen.output_within_normal_parameters();
            }
        }
        impl SimulationElement for TestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.engine_gen.accept(visitor);
                self.consumer.accept(visitor);

                visitor.visit(self);
            }
        }

        #[test]
        fn starts_unstable_with_engines_off() {
            let mut test_bed = EngineGeneratorTestBed::with_shutdown_engine();
            test_bed.run_without_delta();

            assert!(!test_bed.generator_provides_stable_power_output());
        }

        #[test]
        fn starts_stable_with_engines_on() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();
            test_bed.run_without_delta();

            assert!(test_bed.generator_provides_stable_power_output());
        }

        #[test]
        fn becomes_stable_once_engine_above_threshold_for_500_milliseconds() {
            // First enforcing engine in off state
            let mut test_bed = EngineGeneratorTestBed::with_shutdown_engine();
            test_bed.run_without_delta();

            test_bed.command(|a| a.start_engine());
            test_bed.run_with_delta(Duration::from_millis(500));

            assert!(test_bed.generator_provides_stable_power_output());
        }

        #[test]
        fn does_not_become_stable_before_engine_above_threshold_for_500_milliseconds() {
            // First enforcing engine in off state
            let mut test_bed = EngineGeneratorTestBed::with_shutdown_engine();
            test_bed.run_without_delta();

            test_bed.command(|a| a.start_engine());
            test_bed.run_with_delta(Duration::from_millis(499));

            assert!(!test_bed.generator_provides_stable_power_output());
        }

        #[test]
        fn when_engine_running_provides_output() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();
            test_bed.run();

            assert!(test_bed.generator_is_powered());
        }

        #[test]
        fn when_engine_shutdown_provides_no_output() {
            let mut test_bed = EngineGeneratorTestBed::with_shutdown_engine();
            test_bed.run();

            assert!(!test_bed.generator_is_powered());
        }

        #[test]
        fn when_engine_running_but_idg_disconnected_provides_no_output() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.disconnect_idg());
            test_bed.run();

            assert!(!test_bed.generator_is_powered());
        }

        #[test]
        fn when_engine_running_but_generator_off_provides_no_output() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.gen_push_button_off());
            test_bed.run();

            assert!(!test_bed.generator_is_powered());
        }

        #[test]
        fn when_engine_running_but_fire_push_button_released_provides_no_output() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.release_fire_push_button());
            test_bed.run();

            assert!(!test_bed.generator_is_powered());
        }

        #[test]
        fn when_engine_shutdown_frequency_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_shutdown_engine();
            test_bed.run();

            assert!(!test_bed.frequency_is_normal());
        }

        #[test]
        fn when_engine_running_but_idg_disconnected_frequency_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.disconnect_idg());
            test_bed.run();

            assert!(!test_bed.frequency_is_normal());
        }

        #[test]
        fn when_engine_running_but_generator_off_frequency_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.gen_push_button_off());
            test_bed.run();

            assert!(!test_bed.frequency_is_normal());
        }

        #[test]
        fn when_engine_running_but_fire_push_button_released_frequency_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.release_fire_push_button());
            test_bed.run();

            assert!(!test_bed.frequency_is_normal());
        }

        #[test]
        fn when_engine_running_frequency_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();
            test_bed.run();

            assert!(test_bed.frequency_is_normal());
        }

        #[test]
        fn when_engine_shutdown_potential_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_shutdown_engine();
            test_bed.run();

            assert!(!test_bed.potential_is_normal());
        }

        #[test]
        fn when_engine_running_but_idg_disconnected_potential_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.disconnect_idg());
            test_bed.run();

            assert!(!test_bed.potential_is_normal());
        }

        #[test]
        fn when_engine_running_but_generator_off_provides_potential_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.gen_push_button_off());
            test_bed.run();

            assert!(!test_bed.potential_is_normal());
        }

        #[test]
        fn when_engine_running_but_fire_push_button_released_potential_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.release_fire_push_button());
            test_bed.run();

            assert!(!test_bed.potential_is_normal());
        }

        #[test]
        fn when_engine_running_potential_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();
            test_bed.run();

            assert!(test_bed.potential_is_normal());
        }

        #[test]
        fn when_engine_shutdown_has_no_load() {
            let mut test_bed = EngineGeneratorTestBed::with_shutdown_engine();
            test_bed.run();

            assert_eq!(test_bed.load(), Ratio::new::<percent>(0.));
        }

        #[test]
        fn when_engine_running_but_idg_disconnected_has_no_load() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.disconnect_idg());
            test_bed.run();

            assert_eq!(test_bed.load(), Ratio::new::<percent>(0.));
        }

        #[test]
        fn when_engine_running_but_generator_off_has_no_load() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.gen_push_button_off());
            test_bed.run();

            assert_eq!(test_bed.load(), Ratio::new::<percent>(0.));
        }

        #[test]
        fn when_engine_running_but_fire_push_button_released_has_no_load() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.release_fire_push_button());
            test_bed.run();

            assert_eq!(test_bed.load(), Ratio::new::<percent>(0.));
        }

        #[test]
        fn when_engine_running_but_potential_unused_has_no_load() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();
            test_bed.run();

            assert_eq!(test_bed.load(), Ratio::new::<percent>(0.));
        }

        #[test]
        fn when_engine_running_and_potential_used_has_load() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.power_demand(Power::new::<watt>(50000.)));
            test_bed.run();

            assert!(test_bed.load() > Ratio::new::<percent>(0.));
        }

        #[test]
        fn when_load_below_maximum_it_is_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.power_demand(Power::new::<watt>(90000. / 0.8)));
            test_bed.run();

            assert!(test_bed.load_is_normal());
        }

        #[test]
        fn when_load_exceeds_maximum_not_normal() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.power_demand(Power::new::<watt>((90000. / 0.8) + 1.)));
            test_bed.run();

            assert!(!test_bed.load_is_normal());
        }

        #[test]
        fn output_within_normal_parameters_when_load_exceeds_maximum() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();

            test_bed.command(|a| a.power_demand(Power::new::<watt>((90000. / 0.8) + 1.)));

            test_bed.run();

            assert!(test_bed.query(|a| a.generator_output_within_normal_parameters_after_processing_power_consumption_report()));
        }

        #[test]
        fn output_not_within_normal_parameters_when_engine_not_running() {
            let mut test_bed = EngineGeneratorTestBed::with_shutdown_engine();
            test_bed.run();

            assert!(!test_bed.query(|a| a.generator_output_within_normal_parameters_after_processing_power_consumption_report()));
        }

        #[test]
        fn output_within_normal_parameters_when_engine_running() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();
            test_bed.run();

            assert!(test_bed.query(|a| a.generator_output_within_normal_parameters_after_processing_power_consumption_report()));
        }

        #[test]
        fn output_within_normal_parameters_adapts_to_shutting_down_idg_instantaneously() {
            // The frequency and potential of the generator are only known at the end of a tick,
            // due to them being directly related to the power consumption (large changes can cause
            // spikes and dips). However, the decision if a generator can supply power is made much
            // earlier in the tick. This is especially of great consequence when the IDG no longer
            // supplies potential but the previous tick's frequency and potential are still normal.
            // With this test we ensure that an IDG which is no longer supplying power is
            // immediately noticed and doesn't require another tick.
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();
            test_bed.run();

            test_bed.command(|a| a.shutdown_engine());

            test_bed.run();

            assert!(!test_bed.query(|a| a.generator_output_within_normal_parameters_before_processing_power_consumption_report()));
        }

        #[test]
        fn writes_its_state() {
            let mut test_bed = EngineGeneratorTestBed::with_running_engine();
            test_bed.run();

            assert!(test_bed.contains_variable_with_name("ELEC_ENG_GEN_1_POTENTIAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_ENG_GEN_1_POTENTIAL_NORMAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_ENG_GEN_1_FREQUENCY"));
            assert!(test_bed.contains_variable_with_name("ELEC_ENG_GEN_1_FREQUENCY_NORMAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_ENG_GEN_1_LOAD"));
            assert!(test_bed.contains_variable_with_name("ELEC_ENG_GEN_1_LOAD_NORMAL"));
        }
    }

    #[cfg(test)]
    mod engine_generator_drive_tests {
        use super::*;
        use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};
        use rstest::rstest;
        use std::time::Duration;

        trait OilOutletTemperature {
            fn get_oil_outlet_temperature(&self) -> ThermodynamicTemperature;
        }
        impl OilOutletTemperature for ConstantSpeedDrive {
            fn get_oil_outlet_temperature(&self) -> ThermodynamicTemperature {
                self.oil_outlet_temperature
            }
        }
        impl OilOutletTemperature for DirectDrive {
            fn get_oil_outlet_temperature(&self) -> ThermodynamicTemperature {
                self.oil_outlet_temperature
            }
        }

        fn idg(context: &mut InitContext) -> ConstantSpeedDrive {
            ConstantSpeedDrive::new(context, 1)
        }

        fn vfg(context: &mut InitContext) -> DirectDrive {
            DirectDrive::new(context, 1)
        }

        #[rstest]
        #[case(idg)]
        #[case(vfg)]
        fn writes_its_state<T: SimulationElement>(#[case] drive: fn(&mut InitContext) -> T) {
            let mut test_bed = SimulationTestBed::from(ElementCtorFn(drive));
            test_bed.run();

            assert!(
                test_bed.contains_variable_with_name("ELEC_ENG_GEN_1_IDG_OIL_OUTLET_TEMPERATURE")
            );
            assert!(test_bed.contains_variable_with_name("ELEC_ENG_GEN_1_IDG_IS_CONNECTED"));
        }

        #[rstest]
        #[case(idg)]
        #[case(vfg)]
        fn running_engine_warms_up_drive<
            T: SimulationElement + EngineGeneratorDrive + OilOutletTemperature + 'static,
        >(
            #[case] drive: fn(&mut InitContext) -> T,
        ) {
            let mut test_bed = SimulationTestBed::from(ElementCtorFn(drive))
                .with_update_after_power_distribution(engine_running_above_threshold(false));

            let starting_temperature = test_bed.query_element(|e| e.get_oil_outlet_temperature());

            test_bed.run_with_delta(Duration::from_secs(10));

            assert!(
                test_bed.query_element(|e| e.get_oil_outlet_temperature()) > starting_temperature
            );
        }

        #[rstest]
        #[case(idg)]
        #[case(vfg)]
        fn running_engine_does_not_warm_up_drive_when_disconnected<
            T: SimulationElement + EngineGeneratorDrive + OilOutletTemperature + 'static,
        >(
            #[case] drive: fn(&mut InitContext) -> T,
        ) {
            let mut test_bed = SimulationTestBed::from(ElementCtorFn(drive))
                .with_update_after_power_distribution(engine_running_above_threshold(true));

            let starting_temperature = test_bed.query_element(|e| e.get_oil_outlet_temperature());

            test_bed.run_with_delta(Duration::from_secs(10));

            assert_eq!(
                test_bed.query_element(|e| e.get_oil_outlet_temperature()),
                starting_temperature
            );
        }

        #[rstest]
        #[case(idg)]
        #[case(vfg)]
        fn shutdown_engine_cools_down_drive<
            T: SimulationElement + EngineGeneratorDrive + OilOutletTemperature + 'static,
        >(
            #[case] drive: fn(&mut InitContext) -> T,
        ) {
            let mut test_bed = SimulationTestBed::from(ElementCtorFn(drive))
                .with_update_after_power_distribution(engine_running_above_threshold(false));
            test_bed.run_with_delta(Duration::from_secs(10));

            let starting_temperature = test_bed.query_element(|e| e.get_oil_outlet_temperature());

            test_bed.set_update_after_power_distribution(engine_not_running);
            test_bed.run_with_delta(Duration::from_secs(10));

            assert!(
                test_bed.query_element(|e| e.get_oil_outlet_temperature()) < starting_temperature
            );
        }

        #[rstest]
        #[case(idg)]
        #[case(vfg)]
        fn cannot_reconnect_once_disconnected<
            T: SimulationElement + EngineGeneratorDrive + 'static,
        >(
            #[case] drive: fn(&mut InitContext) -> T,
        ) {
            let mut test_bed = SimulationTestBed::from(ElementCtorFn(drive))
                .with_update_after_power_distribution(engine_running_above_threshold(true));
            test_bed.run_with_delta(Duration::from_millis(500));

            test_bed.set_update_after_power_distribution(engine_running_above_threshold(false));
            test_bed.run_with_delta(Duration::from_millis(500));

            assert!(!test_bed.query_element(|e| e.is_connected()));
        }

        fn engine_not_running(drive: &mut impl EngineGeneratorDrive, context: &UpdateContext) {
            drive.update_drive(context, &TestEngine::new(Ratio::new::<percent>(0.)))
        }

        fn engine_running_above_threshold<T: EngineGeneratorDrive>(
            idg_push_button_is_released: bool,
        ) -> impl Fn(&mut T, &UpdateContext) {
            move |drive: &mut T, context: &UpdateContext| {
                if idg_push_button_is_released {
                    drive.disconnect()
                }
                drive.update_drive(context, &TestEngine::new(Ratio::new::<percent>(80.)))
            }
        }
    }
}
