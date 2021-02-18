use super::{
    ElectricalStateWriter, Potential, PotentialSource, ProvideFrequency, ProvideLoad,
    ProvidePotential,
};
use crate::{
    engine::Engine,
    overhead::FaultReleasePushButton,
    shared::calculate_towards_target_temperature,
    simulation::{SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext},
};
use std::cmp::min;
use uom::si::{
    electric_potential::volt, f64::*, frequency::hertz, ratio::percent,
    thermodynamic_temperature::degree_celsius,
};

pub struct EngineGenerator {
    writer: ElectricalStateWriter,
    number: usize,
    idg: IntegratedDriveGenerator,
}
impl EngineGenerator {
    pub fn new(number: usize) -> EngineGenerator {
        EngineGenerator {
            writer: ElectricalStateWriter::new(&format!("ENG_GEN_{}", number)),
            number,
            idg: IntegratedDriveGenerator::new(number),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine: &Engine,
        idg_push_button: &FaultReleasePushButton,
    ) {
        self.idg.update(context, engine, idg_push_button);
    }
}
impl PotentialSource for EngineGenerator {
    fn output_potential(&self) -> Potential {
        if self.idg.provides_stable_power_output() {
            Potential::EngineGenerator(self.number)
        } else {
            Potential::None
        }
    }
}
impl ProvidePotential for EngineGenerator {
    fn potential(&self) -> ElectricPotential {
        // TODO: Replace with actual values once calculated.
        if self.output_potential().is_powered() {
            ElectricPotential::new::<volt>(115.)
        } else {
            ElectricPotential::new::<volt>(0.)
        }
    }

    fn potential_normal(&self) -> bool {
        // TODO: Replace with actual values once calculated.
        self.output_potential().is_powered()
    }
}
impl ProvideFrequency for EngineGenerator {
    fn frequency(&self) -> Frequency {
        // TODO: Replace with actual values once calculated.
        if self.output_potential().is_powered() {
            Frequency::new::<hertz>(400.)
        } else {
            Frequency::new::<hertz>(0.)
        }
    }

    fn frequency_normal(&self) -> bool {
        // TODO: Replace with actual values once calculated.
        self.output_potential().is_powered()
    }
}
impl ProvideLoad for EngineGenerator {
    fn load(&self) -> Ratio {
        // TODO: Replace with actual values once calculated.
        Ratio::new::<percent>(0.)
    }

    fn load_normal(&self) -> bool {
        // TODO: Replace with actual values once calculated.
        true
    }
}
impl SimulationElement for EngineGenerator {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.idg.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating_with_load(self, writer);
    }
}

pub struct IntegratedDriveGenerator {
    oil_outlet_temperature_id: String,
    oil_outlet_temperature: ThermodynamicTemperature,
    is_connected_id: String,
    connected: bool,

    time_above_threshold_in_milliseconds: u64,
}
impl IntegratedDriveGenerator {
    pub const ENGINE_N2_POWER_UP_OUTPUT_THRESHOLD: f64 = 58.;
    pub const ENGINE_N2_POWER_DOWN_OUTPUT_THRESHOLD: f64 = 56.;
    const STABILIZATION_TIME_IN_MILLISECONDS: u64 = 500;

    fn new(number: usize) -> IntegratedDriveGenerator {
        IntegratedDriveGenerator {
            oil_outlet_temperature_id: format!(
                "ELEC_ENG_GEN_{}_IDG_OIL_OUTLET_TEMPERATURE",
                number
            ),
            oil_outlet_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
            is_connected_id: format!("ELEC_ENG_GEN_{}_IDG_IS_CONNECTED", number),
            connected: true,

            time_above_threshold_in_milliseconds: 0,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engine: &Engine,
        idg_push_button: &FaultReleasePushButton,
    ) {
        if idg_push_button.is_released() {
            // The IDG cannot be reconnected.
            self.connected = false;
        }

        self.update_stable_time(context, engine);
        self.update_temperature(context, self.get_target_temperature(context, engine));
    }

    fn provides_stable_power_output(&self) -> bool {
        self.time_above_threshold_in_milliseconds
            == IntegratedDriveGenerator::STABILIZATION_TIME_IN_MILLISECONDS
    }

    fn update_stable_time(&mut self, context: &UpdateContext, engine: &Engine) {
        if !self.connected {
            self.time_above_threshold_in_milliseconds = 0;
            return;
        }

        let mut new_time = self.time_above_threshold_in_milliseconds;
        if engine.corrected_n2()
            >= Ratio::new::<percent>(IntegratedDriveGenerator::ENGINE_N2_POWER_UP_OUTPUT_THRESHOLD)
            && self.time_above_threshold_in_milliseconds
                < IntegratedDriveGenerator::STABILIZATION_TIME_IN_MILLISECONDS
        {
            new_time = self.time_above_threshold_in_milliseconds + context.delta.as_millis() as u64;
        } else if engine.corrected_n2()
            <= Ratio::new::<percent>(
                IntegratedDriveGenerator::ENGINE_N2_POWER_DOWN_OUTPUT_THRESHOLD,
            )
            && self.time_above_threshold_in_milliseconds > 0
        {
            new_time = self.time_above_threshold_in_milliseconds
                - min(
                    context.delta.as_millis() as u64,
                    self.time_above_threshold_in_milliseconds,
                );
        }

        self.time_above_threshold_in_milliseconds = clamp(
            new_time,
            0,
            IntegratedDriveGenerator::STABILIZATION_TIME_IN_MILLISECONDS,
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
            context.delta,
        );
    }

    fn get_target_temperature(
        &self,
        context: &UpdateContext,
        engine: &Engine,
    ) -> ThermodynamicTemperature {
        if !self.connected {
            return context.ambient_temperature;
        }

        let mut target_idg = engine.corrected_n2().get::<percent>() * 1.8;
        let ambient_temperature = context.ambient_temperature.get::<degree_celsius>();
        target_idg += ambient_temperature;

        // TODO improve this function with feedback @komp provides.

        ThermodynamicTemperature::new::<degree_celsius>(target_idg)
    }
}
impl SimulationElement for IntegratedDriveGenerator {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_f64(
            &self.oil_outlet_temperature_id,
            self.oil_outlet_temperature.get::<degree_celsius>(),
        );
        writer.write_bool(&self.is_connected_id, self.connected);
    }
}

/// Experimental feature copied from Rust stb lib.
fn clamp<T: PartialOrd>(value: T, min: T, max: T) -> T {
    assert!(min <= max);
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        engine::Engine,
        simulation::{test::TestReaderWriter, SimulatorReader, SimulatorReaderWriter},
    };

    fn engine_above_threshold() -> Engine {
        engine(Ratio::new::<percent>(
            IntegratedDriveGenerator::ENGINE_N2_POWER_UP_OUTPUT_THRESHOLD + 1.,
        ))
    }

    fn engine_below_threshold() -> Engine {
        engine(Ratio::new::<percent>(
            IntegratedDriveGenerator::ENGINE_N2_POWER_DOWN_OUTPUT_THRESHOLD - 1.,
        ))
    }

    fn engine(n2: Ratio) -> Engine {
        let mut engine = Engine::new(1);
        let mut test_reader_writer = TestReaderWriter::new();
        test_reader_writer.write("TURB ENG CORRECTED N2:1", n2.get::<percent>());
        engine.read(&mut SimulatorReader::new(&mut test_reader_writer));
        engine.set_corrected_n2(n2);

        engine
    }

    #[cfg(test)]
    mod engine_generator_tests {
        use super::*;
        use crate::simulation::{context_with, test::TestReaderWriter};
        use std::time::Duration;

        #[test]
        fn starts_without_output() {
            assert!(engine_generator().is_unpowered());
        }

        #[test]
        fn when_engine_n2_above_threshold_provides_output() {
            let mut generator = engine_generator();
            update_below_threshold(&mut generator);
            update_above_threshold(&mut generator);

            assert!(generator.is_powered());
        }

        #[test]
        fn when_engine_n2_below_threshold_provides_no_output() {
            let mut generator = engine_generator();
            update_above_threshold(&mut generator);
            update_below_threshold(&mut generator);

            assert!(generator.is_unpowered());
        }

        #[test]
        fn when_idg_disconnected_provides_no_output() {
            let mut generator = engine_generator();
            generator.update(
                &context_with().delta(Duration::from_secs(0)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_released("TEST"),
            );

            assert!(generator.is_unpowered());
        }

        #[test]
        fn writes_its_state() {
            let engine_gen = engine_generator();
            let mut test_writer = TestReaderWriter::new();
            let mut writer = SimulatorWriter::new(&mut test_writer);

            engine_gen.write(&mut writer);

            assert!(test_writer.len_is(6));
            assert!(test_writer.contains_f64("ELEC_ENG_GEN_1_POTENTIAL", 0.));
            assert!(test_writer.contains_bool("ELEC_ENG_GEN_1_POTENTIAL_NORMAL", false));
            assert!(test_writer.contains_f64("ELEC_ENG_GEN_1_FREQUENCY", 0.));
            assert!(test_writer.contains_bool("ELEC_ENG_GEN_1_FREQUENCY_NORMAL", false));
            assert!(test_writer.contains_f64("ELEC_ENG_GEN_1_LOAD", 0.));
            assert!(test_writer.contains_bool("ELEC_ENG_GEN_1_LOAD_NORMAL", true));
        }

        fn engine_generator() -> EngineGenerator {
            EngineGenerator::new(1)
        }

        fn update_above_threshold(generator: &mut EngineGenerator) {
            generator.update(
                &context_with().delta(Duration::from_secs(1)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_in("TEST"),
            );
        }

        fn update_below_threshold(generator: &mut EngineGenerator) {
            generator.update(
                &context_with().delta(Duration::from_secs(1)).build(),
                &engine_below_threshold(),
                &FaultReleasePushButton::new_in("TEST"),
            );
        }
    }

    #[cfg(test)]
    mod integrated_drive_generator_tests {
        use crate::simulation::{context_with, test::TestReaderWriter};

        use super::*;
        use std::time::Duration;

        fn idg() -> IntegratedDriveGenerator {
            IntegratedDriveGenerator::new(1)
        }

        #[test]
        fn writes_its_state() {
            let idg = idg();
            let mut test_writer = TestReaderWriter::new();
            let mut writer = SimulatorWriter::new(&mut test_writer);

            idg.write(&mut writer);

            assert!(test_writer.len_is(2));
            assert!(test_writer.contains_f64("ELEC_ENG_GEN_1_IDG_OIL_OUTLET_TEMPERATURE", 0.));
            assert!(test_writer.contains_bool("ELEC_ENG_GEN_1_IDG_IS_CONNECTED", true));
        }

        #[test]
        fn starts_unstable() {
            assert_eq!(idg().provides_stable_power_output(), false);
        }

        #[test]
        fn becomes_stable_once_engine_above_threshold_for_500_milliseconds() {
            let mut idg = idg();
            idg.update(
                &context_with().delta(Duration::from_millis(500)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_in("TEST"),
            );

            assert_eq!(idg.provides_stable_power_output(), true);
        }

        #[test]
        fn does_not_become_stable_before_engine_above_threshold_for_500_milliseconds() {
            let mut idg = idg();
            idg.update(
                &context_with().delta(Duration::from_millis(499)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_in("TEST"),
            );

            assert_eq!(idg.provides_stable_power_output(), false);
        }

        #[test]
        fn cannot_reconnect_once_disconnected() {
            let mut idg = idg();
            idg.update(
                &context_with().delta(Duration::from_millis(500)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_released("TEST"),
            );

            idg.update(
                &context_with().delta(Duration::from_millis(500)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_in("TEST"),
            );

            assert_eq!(idg.provides_stable_power_output(), false);
        }

        #[test]
        fn running_engine_warms_up_idg() {
            let mut idg = idg();
            let starting_temperature = idg.oil_outlet_temperature;
            idg.update(
                &context_with().delta(Duration::from_secs(10)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_in("TEST"),
            );

            assert!(idg.oil_outlet_temperature > starting_temperature);
        }

        #[test]
        fn running_engine_does_not_warm_up_idg_when_disconnected() {
            let mut idg = idg();
            let starting_temperature = idg.oil_outlet_temperature;

            idg.update(
                &context_with().delta(Duration::from_secs(10)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_released("TEST"),
            );

            assert_eq!(idg.oil_outlet_temperature, starting_temperature);
        }

        #[test]
        fn shutdown_engine_cools_down_idg() {
            let mut idg = idg();
            idg.update(
                &context_with().delta(Duration::from_secs(10)).build(),
                &engine_above_threshold(),
                &FaultReleasePushButton::new_in("TEST"),
            );
            let starting_temperature = idg.oil_outlet_temperature;

            idg.update(
                &context_with().delta(Duration::from_secs(10)).build(),
                &Engine::new(1),
                &FaultReleasePushButton::new_in("TEST"),
            );

            assert!(idg.oil_outlet_temperature < starting_temperature);
        }
    }
}
