//! Provides things one needs for the electrical system of an aircraft.

mod battery;
mod emergency_generator;
mod engine_generator;
mod external_power_source;
mod static_inverter;
mod transformer_rectifier;
use std::fmt::Display;

pub use battery::Battery;
pub use emergency_generator::EmergencyGenerator;
pub use engine_generator::EngineGenerator;
pub use external_power_source::ExternalPowerSource;
pub use static_inverter::StaticInverter;
pub use transformer_rectifier::TransformerRectifier;

use crate::simulation::{SimulationElement, SimulatorWriter};
use uom::si::{
    electric_current::ampere, electric_potential::volt, f64::*, frequency::hertz, ratio::percent,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
/// Within an electrical system, electric potential is made available by an origin.
/// These origins are listed as part of this type. By knowing the origin of potential
/// for all power consumers one can determine the amount of electric current provided
/// by the origin to the whole aircraft.
///
/// Note that this type shouldn't be confused with uom's `ElectricPotential`, which provides
/// the base unit (including volt) for defining the amount of potential.
///
/// # TODO
///
/// Another PR should add the actual potential (volt) into this enum, as we will
/// need it for functionality such as: ECAM should indicate DC BAT BUS in amber when V < 25.
/// However, as currently there is no requirement for now this only indicates the origin
/// of the potential, not the actual potential.
pub enum Potential {
    None,
    EngineGenerator(usize),
    ApuGenerator(usize),
    External,
    EmergencyGenerator,
    Battery(usize),
    Batteries,
    TransformerRectifier(usize),
    StaticInverter,
}
impl Potential {
    /// Indicates if the instance provides electric potential.
    pub fn is_powered(&self) -> bool {
        *self != Potential::None
    }

    /// Indicates if the instance does not provide electric potential.
    pub fn is_unpowered(&self) -> bool {
        *self == Potential::None
    }
}

/// A source of electric potential. A source is not necessarily the
/// origin of the potential. It can also be a conductor.
pub trait PotentialSource {
    fn output_potential(&self) -> Potential;

    /// Indicates if the instance provides electric potential.
    fn is_powered(&self) -> bool {
        self.output_potential().is_powered()
    }

    /// Indicates if the instance does not provide electric potential.
    fn is_unpowered(&self) -> bool {
        self.output_potential().is_unpowered()
    }
}

/// A target for electric potential.
///
/// # Examples
///
/// To implement this trait, use the `potential_target!` macro when working within
/// the systems crate. When adding a new type outside of the crate, use the example
/// below:
/// ```rust
/// # use systems::electrical::{Potential, PotentialSource, PotentialTarget};
/// # struct MyType {
/// #     input: Potential,
/// # }
/// impl PotentialTarget for MyType {
///     fn powered_by<T: PotentialSource + ?Sized>(&mut self, source: &T) {
///         self.input = source.output_potential();
///     }
///
///     fn or_powered_by<T: PotentialSource + ?Sized>(&mut self, source: &T) {
///         if self.input.is_unpowered() {
///             self.powered_by(source);
///         }
///     }
/// }
/// ```
pub trait PotentialTarget {
    /// Powers the instance with the given source's potential. When the given source is unpowered
    /// the instance also becomes unpowered.
    fn powered_by<T: PotentialSource + ?Sized>(&mut self, source: &T);

    /// Powers the instance with the given source's potential. When the given source is unpowered
    /// the instance keeps its existing potential if powered.
    fn or_powered_by<T: PotentialSource + ?Sized>(&mut self, source: &T);
}

/// Represents a contactor in an electrical power circuit.
/// When closed a contactor conducts the potential towards other targets.
#[derive(Debug)]
pub struct Contactor {
    closed_id: String,
    closed: bool,
    input: Potential,
}
impl Contactor {
    pub fn new(id: &str) -> Contactor {
        Contactor {
            closed_id: format!("ELEC_CONTACTOR_{}_IS_CLOSED", id),
            closed: false,
            input: Potential::None,
        }
    }

    pub fn close_when(&mut self, should_be_closed: bool) {
        self.closed = should_be_closed;
    }

    pub fn is_open(&self) -> bool {
        !self.closed
    }

    pub fn is_closed(&self) -> bool {
        self.closed
    }
}
potential_target!(Contactor);
impl PotentialSource for Contactor {
    fn output_potential(&self) -> Potential {
        if self.closed {
            self.input
        } else {
            Potential::None
        }
    }
}
impl SimulationElement for Contactor {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_bool(&self.closed_id, self.is_closed());
    }
}

/// Combines multiple sources of potential, such that they can be passed
/// to a target of potential as a single unit.
///
/// # Examples
///
/// This function is most useful when combining sources that are in one
/// struct for use in another struct.
/// ```rust
/// # use systems::electrical::{Contactor, combine_potential_sources, ElectricalBus,
/// #     ElectricalBusType, PotentialTarget, CombinedPotentialSource};
/// struct MainPowerSources {
///     engine_1_gen_contactor: Contactor,
///     bus_tie_1_contactor: Contactor,
/// }
/// impl MainPowerSources {
///     fn new() -> Self {
///         Self {
///             engine_1_gen_contactor: Contactor::new("9XU1"),
///             bus_tie_1_contactor: Contactor::new("11XU1"),
///         }
///     }
///
///     fn ac_bus_1_electric_sources(&self) -> CombinedPotentialSource {
///         combine_potential_sources(vec![
///             &self.engine_1_gen_contactor,
///             &self.bus_tie_1_contactor,
///         ])
///     }
/// }
///
/// let mut ac_bus_1 = ElectricalBus::new(ElectricalBusType::AlternatingCurrent(1));
/// let main_power_sources = MainPowerSources::new();
///
/// ac_bus_1.powered_by(&main_power_sources.ac_bus_1_electric_sources());
/// ```
/// When a potential target can be powered by multiple sources in the same struct, prefer using
/// the `powered_by` and `or_powered_by` functions as follows:
/// ```rust
/// # use systems::electrical::{Contactor, ElectricalBus,
/// #     ElectricalBusType, PotentialTarget};
/// let mut ac_bus_1 = ElectricalBus::new(ElectricalBusType::AlternatingCurrent(1));
/// let engine_1_gen_contactor = Contactor::new("9XU1");
/// let bus_tie_1_contactor = Contactor::new("11XU1");
///
/// ac_bus_1.powered_by(&engine_1_gen_contactor);
/// ac_bus_1.or_powered_by(&bus_tie_1_contactor);
/// ```
pub fn combine_potential_sources<T: PotentialSource>(sources: Vec<&T>) -> CombinedPotentialSource {
    CombinedPotentialSource::new(sources)
}

/// Refer to [`combine_potential_sources`] for details.
///
/// [`combine_potential_sources`]: fn.combine_potential_sources.html
pub struct CombinedPotentialSource {
    potential: Potential,
}
impl CombinedPotentialSource {
    fn new<T: PotentialSource>(sources: Vec<&T>) -> Self {
        let x = sources
            .iter()
            .map(|x| x.output_potential())
            .find(|x| x.is_powered());
        CombinedPotentialSource {
            potential: match x {
                Some(potential) => potential,
                None => Potential::None,
            },
        }
    }
}
impl PotentialSource for CombinedPotentialSource {
    fn output_potential(&self) -> Potential {
        self.potential
    }
}

/// The common types of electrical buses within Airbus aircraft.
/// These include types such as AC, DC, AC ESS, etc.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
pub enum ElectricalBusType {
    AlternatingCurrent(u8),
    AlternatingCurrentEssential,
    AlternatingCurrentEssentialShed,
    AlternatingCurrentStaticInverter,
    DirectCurrent(u8),
    DirectCurrentEssential,
    DirectCurrentEssentialShed,
    DirectCurrentBattery,
    DirectCurrentHot(u8),
}
impl Display for ElectricalBusType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ElectricalBusType::AlternatingCurrent(number) => write!(f, "AC_{}", number),
            ElectricalBusType::AlternatingCurrentEssential => write!(f, "AC_ESS"),
            ElectricalBusType::AlternatingCurrentEssentialShed => write!(f, "AC_ESS_SHED"),
            ElectricalBusType::AlternatingCurrentStaticInverter => write!(f, "AC_STAT_INV"),
            ElectricalBusType::DirectCurrent(number) => write!(f, "DC_{}", number),
            ElectricalBusType::DirectCurrentEssential => write!(f, "DC_ESS"),
            ElectricalBusType::DirectCurrentEssentialShed => write!(f, "DC_ESS_SHED"),
            ElectricalBusType::DirectCurrentBattery => write!(f, "DC_BAT"),
            ElectricalBusType::DirectCurrentHot(number) => write!(f, "DC_HOT_{}", number),
        }
    }
}

pub struct ElectricalBus {
    bus_powered_id: String,
    input: Potential,
}
impl ElectricalBus {
    pub fn new(bus_type: ElectricalBusType) -> ElectricalBus {
        ElectricalBus {
            bus_powered_id: format!("ELEC_{}_BUS_IS_POWERED", bus_type.to_string()),
            input: Potential::None,
        }
    }

    #[cfg(test)]
    fn input_potential(&self) -> Potential {
        self.input
    }

    pub fn or_powered_by_both_batteries(
        &mut self,
        battery_1_contactor: &Contactor,
        battery_2_contactor: &Contactor,
    ) {
        if self.input.is_unpowered() {
            let is_battery_1_powered = battery_1_contactor.is_powered();
            let is_battery_2_powered = battery_2_contactor.is_powered();

            self.input = if is_battery_1_powered && is_battery_2_powered {
                Potential::Batteries
            } else if is_battery_1_powered {
                Potential::Battery(10)
            } else if is_battery_2_powered {
                Potential::Battery(11)
            } else {
                Potential::None
            };
        }
    }
}
potential_target!(ElectricalBus);
impl PotentialSource for ElectricalBus {
    fn output_potential(&self) -> Potential {
        self.input
    }
}
impl SimulationElement for ElectricalBus {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_bool(&self.bus_powered_id, self.is_powered());
    }
}

pub struct ElectricalStateWriter {
    current_id: String,
    current_normal_id: String,
    potential_id: String,
    potential_normal_id: String,
    frequency_id: String,
    frequency_normal_id: String,
    load_id: String,
    load_normal_id: String,
}
impl ElectricalStateWriter {
    pub fn new(element_id: &str) -> Self {
        Self {
            current_id: format!("ELEC_{}_CURRENT", element_id),
            current_normal_id: format!("ELEC_{}_CURRENT_NORMAL", element_id),
            potential_id: format!("ELEC_{}_POTENTIAL", element_id),
            potential_normal_id: format!("ELEC_{}_POTENTIAL_NORMAL", element_id),
            frequency_id: format!("ELEC_{}_FREQUENCY", element_id),
            frequency_normal_id: format!("ELEC_{}_FREQUENCY_NORMAL", element_id),
            load_id: format!("ELEC_{}_LOAD", element_id),
            load_normal_id: format!("ELEC_{}_LOAD_NORMAL", element_id),
        }
    }

    pub fn write_direct<T: ProvideCurrent + ProvidePotential>(
        &self,
        source: &T,
        state: &mut SimulatorWriter,
    ) {
        self.write_current(source, state);
        self.write_potential(source, state);
    }

    pub fn write_alternating<T: ProvidePotential + ProvideFrequency>(
        &self,
        source: &T,
        state: &mut SimulatorWriter,
    ) {
        self.write_potential(source, state);
        self.write_frequency(source, state);
    }

    pub fn write_alternating_with_load<T: ProvidePotential + ProvideFrequency + ProvideLoad>(
        &self,
        source: &T,
        state: &mut SimulatorWriter,
    ) {
        self.write_alternating(source, state);
        self.write_load(source, state);
    }

    fn write_current<T: ProvideCurrent>(&self, source: &T, state: &mut SimulatorWriter) {
        state.write_f64(&self.current_id, source.current().get::<ampere>());
        state.write_bool(&self.current_normal_id, source.current_normal());
    }

    fn write_potential<T: ProvidePotential>(&self, source: &T, state: &mut SimulatorWriter) {
        state.write_f64(&self.potential_id, source.potential().get::<volt>());
        state.write_bool(&self.potential_normal_id, source.potential_normal());
    }

    fn write_frequency<T: ProvideFrequency>(&self, source: &T, state: &mut SimulatorWriter) {
        state.write_f64(&self.frequency_id, source.frequency().get::<hertz>());
        state.write_bool(&self.frequency_normal_id, source.frequency_normal());
    }

    fn write_load<T: ProvideLoad>(&self, source: &T, state: &mut SimulatorWriter) {
        state.write_f64(&self.load_id, source.load().get::<percent>());
        state.write_bool(&self.load_normal_id, source.load_normal());
    }
}

pub trait ProvideCurrent {
    fn current(&self) -> ElectricCurrent;
    fn current_normal(&self) -> bool;
}

pub trait ProvidePotential {
    fn potential(&self) -> ElectricPotential;
    fn potential_normal(&self) -> bool;
}

pub trait ProvideFrequency {
    fn frequency(&self) -> Frequency;
    fn frequency_normal(&self) -> bool;
}

pub trait ProvideLoad {
    fn load(&self) -> Ratio;
    fn load_normal(&self) -> bool;
}

#[cfg(test)]
mod tests {
    use uom::si::frequency::hertz;

    use super::*;
    struct Powerless {}
    impl PotentialSource for Powerless {
        fn output_potential(&self) -> Potential {
            Potential::None
        }
    }

    struct StubApuGenerator {}
    impl PotentialSource for StubApuGenerator {
        fn output_potential(&self) -> Potential {
            Potential::ApuGenerator(1)
        }
    }

    struct StubElectricSource {}
    impl ProvideCurrent for StubElectricSource {
        fn current(&self) -> ElectricCurrent {
            ElectricCurrent::new::<ampere>(150.)
        }

        fn current_normal(&self) -> bool {
            true
        }
    }
    impl ProvidePotential for StubElectricSource {
        fn potential(&self) -> ElectricPotential {
            ElectricPotential::new::<volt>(28.)
        }

        fn potential_normal(&self) -> bool {
            true
        }
    }
    impl ProvideFrequency for StubElectricSource {
        fn frequency(&self) -> Frequency {
            Frequency::new::<hertz>(400.)
        }

        fn frequency_normal(&self) -> bool {
            true
        }
    }
    impl ProvideLoad for StubElectricSource {
        fn load(&self) -> Ratio {
            Ratio::new::<percent>(50.)
        }

        fn load_normal(&self) -> bool {
            true
        }
    }

    #[cfg(test)]
    mod potential_tests {
        use super::*;

        #[test]
        fn some_potential_is_powered() {
            assert_eq!(some_potential().is_powered(), true);
        }

        #[test]
        fn some_potential_is_not_unpowered() {
            assert_eq!(some_potential().is_unpowered(), false);
        }

        #[test]
        fn none_potential_is_not_powered() {
            assert_eq!(none_potential().is_powered(), false);
        }

        #[test]
        fn none_potential_is_unpowered() {
            assert_eq!(none_potential().is_unpowered(), true);
        }

        fn some_potential() -> Potential {
            Potential::ApuGenerator(1)
        }

        fn none_potential() -> Potential {
            Potential::None
        }
    }

    #[cfg(test)]
    mod electrical_bus_type_tests {
        use crate::electrical::ElectricalBusType;

        #[test]
        fn get_name_returns_name() {
            assert_eq!(ElectricalBusType::AlternatingCurrent(2).to_string(), "AC_2");
            assert_eq!(
                ElectricalBusType::AlternatingCurrentEssential.to_string(),
                "AC_ESS"
            );
            assert_eq!(
                ElectricalBusType::AlternatingCurrentEssentialShed.to_string(),
                "AC_ESS_SHED"
            );
            assert_eq!(
                ElectricalBusType::AlternatingCurrentStaticInverter.to_string(),
                "AC_STAT_INV"
            );
            assert_eq!(ElectricalBusType::DirectCurrent(2).to_string(), "DC_2");
            assert_eq!(
                ElectricalBusType::DirectCurrentEssential.to_string(),
                "DC_ESS"
            );
            assert_eq!(
                ElectricalBusType::DirectCurrentEssentialShed.to_string(),
                "DC_ESS_SHED"
            );
            assert_eq!(
                ElectricalBusType::DirectCurrentBattery.to_string(),
                "DC_BAT"
            );
            assert_eq!(
                ElectricalBusType::DirectCurrentHot(2).to_string(),
                "DC_HOT_2"
            );
        }
    }

    #[cfg(test)]
    mod electrical_bus_tests {
        use crate::simulation::test::TestReaderWriter;

        use super::*;

        #[test]
        fn writes_its_state() {
            let bus = electrical_bus();
            let mut test_writer = TestReaderWriter::new();
            let mut writer = SimulatorWriter::new(&mut test_writer);

            bus.write(&mut writer);

            assert!(test_writer.len_is(1));
            assert!(test_writer.contains_bool("ELEC_AC_2_BUS_IS_POWERED", false));
        }

        struct BatteryStub {
            potential: Potential,
        }

        impl BatteryStub {
            fn new(potential: Potential) -> BatteryStub {
                BatteryStub { potential }
            }
        }

        impl PotentialSource for BatteryStub {
            fn output_potential(&self) -> Potential {
                self.potential
            }
        }

        #[test]
        fn or_powered_by_both_batteries_results_in_both_when_both_connected() {
            let bat_1 = BatteryStub::new(Potential::Battery(10));
            let bat_2 = BatteryStub::new(Potential::Battery(11));

            let expected = Potential::Batteries;

            let mut bus = electrical_bus();

            let mut contactor_1 = Contactor::new("BAT1");
            contactor_1.powered_by(&bat_1);
            contactor_1.close_when(true);

            let mut contactor_2 = Contactor::new("BAT2");
            contactor_2.powered_by(&bat_2);
            contactor_2.close_when(true);

            bus.or_powered_by_both_batteries(&contactor_1, &contactor_2);

            assert_eq!(bus.input_potential(), expected);
        }

        #[test]
        fn or_powered_by_battery_1_results_in_bat_1_output() {
            let expected = Potential::Battery(10);

            let bat_1 = BatteryStub::new(expected);
            let bat_2 = BatteryStub::new(Potential::None);

            or_powered_by_battery_results_in_expected_output(bat_1, bat_2, expected);
        }

        #[test]
        fn or_powered_by_battery_2_results_in_bat_2_output() {
            let expected = Potential::Battery(11);

            let bat_1 = BatteryStub::new(Potential::None);
            let bat_2 = BatteryStub::new(expected);

            or_powered_by_battery_results_in_expected_output(bat_1, bat_2, expected);
        }

        fn or_powered_by_battery_results_in_expected_output(
            bat_1: BatteryStub,
            bat_2: BatteryStub,
            expected: Potential,
        ) {
            let mut bus = electrical_bus();

            let mut contactor_1 = Contactor::new("BAT1");
            contactor_1.powered_by(&bat_1);
            contactor_1.close_when(true);

            let mut contactor_2 = Contactor::new("BAT2");
            contactor_2.powered_by(&bat_2);
            contactor_2.close_when(true);

            bus.or_powered_by_both_batteries(&contactor_1, &contactor_2);

            assert_eq!(bus.input_potential(), expected);
        }

        fn electrical_bus() -> ElectricalBus {
            ElectricalBus::new(ElectricalBusType::AlternatingCurrent(2))
        }
    }

    #[cfg(test)]
    mod contactor_tests {
        use crate::simulation::test::TestReaderWriter;

        use super::*;

        #[test]
        fn contactor_starts_open() {
            assert!(contactor().is_open());
        }

        #[test]
        fn open_contactor_when_toggled_open_stays_open() {
            let mut contactor = open_contactor();
            contactor.close_when(false);

            assert!(contactor.is_open());
        }

        #[test]
        fn open_contactor_when_toggled_closed_closes() {
            let mut contactor = open_contactor();
            contactor.close_when(true);

            assert!(contactor.is_closed());
        }

        #[test]
        fn closed_contactor_when_toggled_open_opens() {
            let mut contactor = closed_contactor();
            contactor.close_when(false);

            assert!(contactor.is_open());
        }

        #[test]
        fn closed_contactor_when_toggled_closed_stays_closed() {
            let mut contactor = closed_contactor();
            contactor.close_when(true);

            assert!(contactor.is_closed());
        }

        #[test]
        fn open_contactor_has_no_output_when_powered_by_nothing() {
            contactor_has_no_output_when_powered_by_nothing(open_contactor());
        }

        #[test]
        fn closed_contactor_has_no_output_when_powered_by_nothing() {
            contactor_has_no_output_when_powered_by_nothing(closed_contactor());
        }

        fn contactor_has_no_output_when_powered_by_nothing(contactor: Contactor) {
            assert!(contactor.is_unpowered());
        }

        #[test]
        fn open_contactor_has_no_output_when_powered_by_nothing_which_is_powered() {
            contactor_has_no_output_when_powered_by_nothing_which_is_powered(open_contactor());
        }

        #[test]
        fn closed_contactor_has_no_output_when_powered_by_nothing_which_is_powered() {
            contactor_has_no_output_when_powered_by_nothing_which_is_powered(closed_contactor());
        }

        fn contactor_has_no_output_when_powered_by_nothing_which_is_powered(
            mut contactor: Contactor,
        ) {
            contactor.powered_by(&Powerless {});

            assert!(contactor.is_unpowered());
        }

        #[test]
        fn open_contactor_has_no_output_when_powered_by_something() {
            let mut contactor = open_contactor();
            contactor.powered_by(&Powerless {});
            contactor.or_powered_by(&StubApuGenerator {});

            assert!(contactor.is_unpowered());
        }

        #[test]
        fn closed_contactor_has_output_when_powered_by_something_which_is_powered() {
            let mut contactor = closed_contactor();
            contactor.powered_by(&Powerless {});
            contactor.or_powered_by(&StubApuGenerator {});

            assert!(contactor.is_powered());
        }

        #[test]
        fn writes_its_state() {
            let contactor = contactor();
            let mut test_writer = TestReaderWriter::new();
            let mut writer = SimulatorWriter::new(&mut test_writer);

            contactor.write(&mut writer);

            assert!(test_writer.len_is(1));
            assert!(test_writer.contains_bool("ELEC_CONTACTOR_TEST_IS_CLOSED", false));
        }

        fn contactor() -> Contactor {
            Contactor::new("TEST")
        }

        fn open_contactor() -> Contactor {
            let mut contactor = contactor();
            contactor.closed = false;

            contactor
        }

        fn closed_contactor() -> Contactor {
            let mut contactor = contactor();
            contactor.closed = true;

            contactor
        }
    }

    #[cfg(test)]
    mod current_state_writer_tests {
        use crate::simulation::test::TestReaderWriter;

        use super::*;

        #[test]
        fn writes_direct_current_state() {
            let writer = ElectricalStateWriter::new("BAT_2");
            let mut test_writer = TestReaderWriter::new();
            let mut element_writer = SimulatorWriter::new(&mut test_writer);

            writer.write_direct(&StubElectricSource {}, &mut element_writer);

            assert!(test_writer.len_is(4));
            assert!(test_writer.contains_f64("ELEC_BAT_2_CURRENT", 150.));
            assert!(test_writer.contains_bool("ELEC_BAT_2_CURRENT_NORMAL", true));
            assert!(test_writer.contains_f64("ELEC_BAT_2_POTENTIAL", 28.));
            assert!(test_writer.contains_bool("ELEC_BAT_2_POTENTIAL_NORMAL", true));
        }

        #[test]
        fn writes_alternating_current_state() {
            let writer = ElectricalStateWriter::new("APU_GEN");
            let mut test_writer = TestReaderWriter::new();
            let mut element_writer = SimulatorWriter::new(&mut test_writer);

            writer.write_alternating(&StubElectricSource {}, &mut element_writer);

            assert!(test_writer.len_is(4));
            assert!(test_writer.contains_f64("ELEC_APU_GEN_POTENTIAL", 28.));
            assert!(test_writer.contains_bool("ELEC_APU_GEN_POTENTIAL_NORMAL", true));
            assert!(test_writer.contains_f64("ELEC_APU_GEN_FREQUENCY", 400.));
            assert!(test_writer.contains_bool("ELEC_APU_GEN_FREQUENCY_NORMAL", true));
        }

        #[test]
        fn writes_alternating_current_with_load_state() {
            let writer = ElectricalStateWriter::new("APU_GEN");
            let mut test_writer = TestReaderWriter::new();
            let mut element_writer = SimulatorWriter::new(&mut test_writer);

            writer.write_alternating_with_load(&StubElectricSource {}, &mut element_writer);

            assert!(test_writer.len_is(6));
            assert!(test_writer.contains_f64("ELEC_APU_GEN_POTENTIAL", 28.));
            assert!(test_writer.contains_bool("ELEC_APU_GEN_POTENTIAL_NORMAL", true));
            assert!(test_writer.contains_f64("ELEC_APU_GEN_FREQUENCY", 400.));
            assert!(test_writer.contains_bool("ELEC_APU_GEN_FREQUENCY_NORMAL", true));
            assert!(test_writer.contains_f64("ELEC_APU_GEN_LOAD", 50.));
            assert!(test_writer.contains_bool("ELEC_APU_GEN_LOAD_NORMAL", true));
        }
    }
}
