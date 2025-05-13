//! Provides things one needs for the electrical system of an aircraft.

mod battery;
mod battery_charge_limiter;
mod battery_charge_rectifier_unit;
pub mod consumption;
mod emergency_generator;
mod engine_generator;
mod external_power_source;
mod ram_air_turbine;
mod static_inverter;
mod transformer_rectifier;

use std::{
    cell::{Ref, RefCell},
    rc::Rc,
    time::Duration,
};

use crate::{
    failures::{Failure, FailureType},
    simulation::{InitContext, VariableIdentifier},
};
use crate::{
    shared::{
        ConsumePower, ElectricalBusType, ElectricalBuses, EmergencyElectricalState,
        PotentialOrigin, PowerConsumptionReport,
    },
    simulation::{
        SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
    },
};
pub use battery::Battery;
pub use battery_charge_limiter::BatteryChargeLimiter;
pub use battery_charge_rectifier_unit::BatteryChargeRectifierUnit;
pub use emergency_generator::EmergencyGenerator;
pub use engine_generator::{
    EngineGenerator, IntegratedDriveGenerator, VariableFrequencyGenerator,
    INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME,
};
pub use external_power_source::ExternalPowerSource;
use fxhash::{FxHashMap, FxHashSet};
pub use static_inverter::StaticInverter;
pub use transformer_rectifier::TransformerRectifier;
use uom::si::{electric_potential::volt, f64::*, power::watt, velocity::knot};

pub use ram_air_turbine::{GeneratorControlUnit, RamAirTurbine};

pub mod test;

pub trait AlternatingCurrentElectricalSystem {
    fn any_non_essential_bus_powered(&self, electricity: &Electricity) -> bool;
}

pub trait EngineGeneratorPushButtons {
    fn engine_gen_push_button_is_on(&self, number: usize) -> bool;
    fn idg_push_button_is_released(&self, number: usize) -> bool;
}

pub trait BatteryPushButtons {
    fn bat_is_auto(&self, number: usize) -> bool;
}

/// Represents a contactor in an electrical power circuit.
/// When closed a contactor conducts the potential towards other targets.
#[derive(Debug)]
pub struct Contactor {
    identifier: ElectricalElementIdentifier,
    closed_id: VariableIdentifier,
    closed: bool,
}
impl Contactor {
    pub fn new(context: &mut InitContext, id: &str) -> Contactor {
        Contactor {
            identifier: context.next_electrical_identifier(),
            closed_id: context.get_identifier(format!("ELEC_CONTACTOR_{}_IS_CLOSED", id)),
            closed: false,
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
impl ElectricalElement for Contactor {
    fn input_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn output_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn is_conductive(&self) -> bool {
        self.closed
    }
}
impl SimulationElement for Contactor {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.closed_id, self.is_closed());
    }
}

pub struct ElectricalBus {
    identifier: ElectricalElementIdentifier,
    bus_powered_id: VariableIdentifier,
    bus_potential_normal_id: VariableIdentifier,
    potential: ElectricPotential,
    bus_type: ElectricalBusType,
    failure: Failure,
}
impl ElectricalBus {
    pub fn new(context: &mut InitContext, bus_type: ElectricalBusType) -> ElectricalBus {
        ElectricalBus {
            identifier: context.next_electrical_identifier_for_bus(bus_type),
            bus_powered_id: context.get_identifier(format!("ELEC_{}_BUS_IS_POWERED", bus_type)),
            bus_potential_normal_id: context
                .get_identifier(format!("ELEC_{}_BUS_POTENTIAL_NORMAL", bus_type)),
            potential: ElectricPotential::new::<volt>(0.),
            bus_type,
            failure: Failure::new(FailureType::ElectricalBus(bus_type)),
        }
    }

    fn potential_normal(&self) -> bool {
        self.potential > ElectricPotential::new::<volt>(25.0)
    }
}
impl ElectricalElement for ElectricalBus {
    fn input_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn output_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn is_conductive(&self) -> bool {
        !self.failure.is_active()
    }
}
impl SimulationElement for ElectricalBus {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if let ElectricalBusType::Sub(_) = self.bus_type {
            // Sub buses are not written towards the simulator. See the
            // description on the sub bus type for details.
            return;
        }

        writer.write(
            &self.bus_powered_id,
            self.potential > ElectricPotential::new::<volt>(0.),
        );
        if self.bus_type == ElectricalBusType::DirectCurrentBattery {
            // It's good to note that in the real aircraft, the battery charge limiters (BCLs) are
            // responsible for supplying this information to the SDAC. When the battery push
            // button is off the associated BCL is unpowered and thus not sending a signal to the SDAC.
            // If neither BCL sends signals to the SDAC this is translated into the amber XX you see
            // on the ECAM screen. For now we just always emit this information here and within
            // the ECAM code check the BAT push button position to see if XX should be presented or not.
            // Once the SDAC is implemented it can be moved there and read this value from the BCLs.
            writer.write(&self.bus_potential_normal_id, self.potential_normal())
        }
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.potential = buses.potential_of(self.bus_type).raw();
    }
}

pub struct ElectricalStateWriter {
    current_id: VariableIdentifier,
    current_normal_id: VariableIdentifier,
    potential_id: VariableIdentifier,
    potential_normal_id: VariableIdentifier,
    frequency_id: VariableIdentifier,
    frequency_normal_id: VariableIdentifier,
    load_id: VariableIdentifier,
    load_normal_id: VariableIdentifier,
}
impl ElectricalStateWriter {
    pub fn new(context: &mut InitContext, element_id: &str) -> Self {
        Self {
            current_id: context.get_identifier(format!("ELEC_{}_CURRENT", element_id)),
            current_normal_id: context
                .get_identifier(format!("ELEC_{}_CURRENT_NORMAL", element_id)),
            potential_id: context.get_identifier(format!("ELEC_{}_POTENTIAL", element_id)),
            potential_normal_id: context
                .get_identifier(format!("ELEC_{}_POTENTIAL_NORMAL", element_id)),
            frequency_id: context.get_identifier(format!("ELEC_{}_FREQUENCY", element_id)),
            frequency_normal_id: context
                .get_identifier(format!("ELEC_{}_FREQUENCY_NORMAL", element_id)),
            load_id: context.get_identifier(format!("ELEC_{}_LOAD", element_id)),
            load_normal_id: context.get_identifier(format!("ELEC_{}_LOAD_NORMAL", element_id)),
        }
    }

    pub fn write_direct(
        &self,
        source: &(impl ProvideCurrent + ProvidePotential),
        writer: &mut SimulatorWriter,
    ) {
        self.write_current(source, writer);
        self.write_potential(source, writer);
    }

    pub fn write_alternating(
        &self,
        source: &(impl ProvidePotential + ProvideFrequency),
        writer: &mut SimulatorWriter,
    ) {
        self.write_potential(source, writer);
        self.write_frequency(source, writer);
    }

    pub fn write_alternating_with_load(
        &self,
        source: &(impl ProvidePotential + ProvideFrequency + ProvideLoad),
        writer: &mut SimulatorWriter,
    ) {
        self.write_alternating(source, writer);
        self.write_load(source, writer);
    }

    fn write_current(&self, source: &impl ProvideCurrent, writer: &mut SimulatorWriter) {
        writer.write(&self.current_id, source.current());
        writer.write(&self.current_normal_id, source.current_normal());
    }

    fn write_potential(&self, source: &impl ProvidePotential, writer: &mut SimulatorWriter) {
        writer.write(&self.potential_id, source.potential());
        writer.write(&self.potential_normal_id, source.potential_normal());
    }

    fn write_frequency(&self, source: &impl ProvideFrequency, writer: &mut SimulatorWriter) {
        writer.write(&self.frequency_id, source.frequency());
        writer.write(&self.frequency_normal_id, source.frequency_normal());
    }

    fn write_load(&self, source: &impl ProvideLoad, writer: &mut SimulatorWriter) {
        writer.write(&self.load_id, source.load());
        writer.write(&self.load_normal_id, source.load_normal());
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

/// Determines if and for how long the aircraft is in an emergency electrical situation.
pub struct EmergencyElectrical {
    is_active_for_duration: Duration,
}
impl EmergencyElectrical {
    pub fn new() -> Self {
        Self {
            is_active_for_duration: Duration::from_secs(0),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &Electricity,
        ac_electrical_system: &impl AlternatingCurrentElectricalSystem,
    ) {
        // TODO A380 has also total flame out condition: all engines N3 under 50% throws emergency elec
        if !ac_electrical_system.any_non_essential_bus_powered(electricity)
            && context.indicated_airspeed() > Velocity::new::<knot>(100.)
        {
            self.is_active_for_duration += context.delta();
        } else {
            self.is_active_for_duration = Duration::from_secs(0)
        }
    }

    pub fn is_active(&self) -> bool {
        self.is_active_for_duration > Duration::from_secs(0)
    }

    fn active_duration(&self) -> Duration {
        self.is_active_for_duration
    }
}
impl Default for EmergencyElectrical {
    fn default() -> Self {
        Self::new()
    }
}
impl EmergencyElectricalState for EmergencyElectrical {
    fn is_in_emergency_elec(&self) -> bool {
        self.is_active()
    }
}

pub trait ElectricalElement {
    fn input_identifier(&self) -> ElectricalElementIdentifier;
    fn output_identifier(&self) -> ElectricalElementIdentifier;

    /// Returns whether the element is currently capable of conducting electricity.
    fn is_conductive(&self) -> bool;
}

pub trait ElectricitySource: ElectricalElement {
    fn output_potential(&self) -> Potential;
}

pub trait ElectricityTransformer: ElectricalElement {
    fn transform(&self, input: Ref<Potential>) -> Potential;
}

#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq)]
pub struct ElectricalElementIdentifier(u32);
impl ElectricalElementIdentifier {
    fn first() -> Self {
        Self(1)
    }

    fn next(&self) -> Self {
        Self(self.0 + 1)
    }
}

pub trait ElectricalElementIdentifierProvider {
    fn next_electrical_identifier(&mut self) -> ElectricalElementIdentifier;
    fn next_electrical_identifier_for_bus(
        &mut self,
        bus_type: ElectricalBusType,
    ) -> ElectricalElementIdentifier;
}

#[derive(Debug)]
pub struct Electricity {
    next_identifier: ElectricalElementIdentifier,
    buses: FxHashMap<ElectricalBusType, ElectricalElementIdentifier>,
    potential: PotentialCollection,
    none_potential: RefCell<Potential>,
}
impl Electricity {
    pub fn new() -> Self {
        Self {
            next_identifier: ElectricalElementIdentifier::first(),
            buses: Default::default(),
            potential: PotentialCollection::new(),
            none_potential: RefCell::new(Potential::none()),
        }
    }

    pub(super) fn pre_tick(&mut self) {
        self.potential.clear();
    }

    /// Flows electricity from the given output element to the given input element as long
    /// as both elements are conductive.
    ///
    /// For the vast majority of elements, the order of arguments is irrelevant, as their
    /// input and output shares the same identifier. However, transformers are split in two:
    /// the [TransformerRectifiers](TransformerRectifier) have AC input and DC output, and the [StaticInverter] has DC
    /// input and AC output. Thus for these specific element types, one has to make sure the
    /// argument order is correct.
    /// ```rust
    /// # use systems::{shared::ElectricalBusType, electrical::{Contactor, ElectricalBus, Electricity},
    /// # simulation::{InitContext, VariableRegistry, VariableIdentifier}};
    /// # struct SomeVariableRegistry {}
    /// # impl VariableRegistry for SomeVariableRegistry {
    /// #     fn get(&mut self, name: String) -> VariableIdentifier {
    /// #         VariableIdentifier::default()
    /// #     }
    /// # }
    /// # let mut registry = SomeVariableRegistry {};
    /// # let mut electricity = Electricity::new();
    /// # let mut context = InitContext::new(Default::default(), &mut electricity, &mut registry);
    /// let contactor = Contactor::new(&mut context, "TEST");
    /// let bus = ElectricalBus::new(&mut context, ElectricalBusType::DirectCurrentBattery);
    ///
    /// electricity.flow(&contactor, &bus);
    /// ```
    pub fn flow(
        &mut self,
        from_output: &impl ElectricalElement,
        to_input: &impl ElectricalElement,
    ) {
        if from_output.is_conductive() && to_input.is_conductive() {
            self.potential
                .flow(from_output.output_identifier(), to_input.input_identifier());
        }
    }

    /// Takes the output supplied by the given source of electricity, such that
    /// it can then [flow](`Self::flow()`) through the electrical system.
    /// ```rust
    /// # use systems::{shared::ElectricalBusType, electrical::{Contactor, ElectricalBus, Electricity, IntegratedDriveGenerator},
    /// # simulation::{InitContext, VariableRegistry, VariableIdentifier}};
    /// # use uom::si::{f64::Power, power::kilowatt};
    /// # struct SomeVariableRegistry {}
    /// # impl VariableRegistry for SomeVariableRegistry {
    /// #     fn get(&mut self, name: String) -> VariableIdentifier {
    /// #         VariableIdentifier::default()
    /// #     }
    /// # }
    /// # let mut registry = SomeVariableRegistry {};
    /// # let mut electricity = Electricity::new();
    /// # let mut context = InitContext::new(Default::default(), &mut electricity, &mut registry);
    /// let generator = IntegratedDriveGenerator::new(&mut context, 1, Power::new::<kilowatt>(90.), 390.0..=410.0);
    /// let contactor = Contactor::new(&mut context, "TEST");
    ///
    /// electricity.supplied_by(&generator);
    /// electricity.flow(&generator, &contactor);
    /// ```
    pub fn supplied_by(&mut self, source: &impl ElectricitySource) {
        let output_identifier = source.output_identifier();
        self.potential.supplied_by(
            output_identifier,
            source.output_potential().include(output_identifier),
        )
    }

    /// Transforms electricity within the given transformer.
    /// ```rust
    /// # use systems::{shared::ElectricalBusType, electrical::{Contactor, ElectricalBus, Electricity},
    /// # simulation::{InitContext, VariableRegistry, VariableIdentifier}};
    /// # use systems::electrical::TransformerRectifier;
    /// # struct SomeVariableRegistry {}
    /// # impl VariableRegistry for SomeVariableRegistry {
    /// #     fn get(&mut self, name: String) -> VariableIdentifier {
    /// #         VariableIdentifier::default()
    /// #     }
    /// # }
    /// # let mut registry = SomeVariableRegistry {};
    /// # let mut electricity = Electricity::new();
    /// # let mut context = InitContext::new(Default::default(), &mut electricity, &mut registry);
    /// let ac_bus = ElectricalBus::new(&mut context, ElectricalBusType::AlternatingCurrent(1));
    /// let tr = TransformerRectifier::new(&mut context, 1);
    /// let dc_bus = ElectricalBus::new(&mut context, ElectricalBusType::DirectCurrent(1));
    ///
    /// electricity.flow(&ac_bus, &tr);
    /// electricity.transform_in(&tr);
    /// electricity.flow(&tr, &dc_bus);
    /// ```
    pub fn transform_in(&mut self, transformer: &impl ElectricityTransformer) {
        let output_identifier = transformer.output_identifier();
        let transformed_potential = match self.potential.get(transformer.input_identifier()) {
            Some(input_potential) => transformer
                .transform(input_potential)
                .include(output_identifier),
            None => Potential::none(),
        };

        self.potential
            .supplied_by(output_identifier, transformed_potential);
    }

    /// Returns if the given element is powered or not.
    pub fn is_powered(&self, element: &impl ElectricalElement) -> bool {
        self.potential.is_powered(element.output_identifier())
    }

    /// Returns if the given electrical bus type is powered or not.
    fn bus_is_powered(&self, bus_type: ElectricalBusType) -> bool {
        if let Some(identifier) = self.buses.get(&bus_type) {
            self.potential.is_powered(*identifier)
        } else {
            false
        }
    }

    pub fn output_of(&self, element: &impl ElectricalElement) -> Ref<Potential> {
        self.potential
            .get(element.output_identifier())
            .unwrap_or_else(|| self.none_potential.borrow())
    }

    pub fn input_of(&self, element: &impl ElectricalElement) -> Ref<Potential> {
        self.potential
            .get(element.input_identifier())
            .unwrap_or_else(|| self.none_potential.borrow())
    }

    pub fn distribute_to(&self, element: &mut impl SimulationElement, _: &UpdateContext) {
        let mut visitor = ReceivePowerVisitor::new(self);
        element.accept(&mut visitor);
    }

    pub fn consume_in(&mut self, context: &UpdateContext, element: &mut impl SimulationElement) {
        let mut visitor = ConsumePowerVisitor::new(context, self);
        element.accept(&mut visitor);

        let mut visitor = ConsumePowerInConvertersVisitor::new(context, self);
        element.accept(&mut visitor);
    }

    pub fn report_consumption_to(
        &self,
        context: &UpdateContext,
        element: &mut impl SimulationElement,
    ) {
        let mut visitor = ProcessPowerConsumptionReportVisitor::new(context, self);
        element.accept(&mut visitor);
    }

    #[cfg(test)]
    fn identifier_for(&self, bus_type: ElectricalBusType) -> Option<&ElectricalElementIdentifier> {
        self.buses.get(&bus_type)
    }
}
impl ElectricalElementIdentifierProvider for Electricity {
    fn next_electrical_identifier(&mut self) -> ElectricalElementIdentifier {
        let identifier = self.next_identifier;
        self.next_identifier = identifier.next();

        identifier
    }

    fn next_electrical_identifier_for_bus(
        &mut self,
        bus_type: ElectricalBusType,
    ) -> ElectricalElementIdentifier {
        let identifier = self.next_electrical_identifier();
        self.buses.insert(bus_type, identifier);

        identifier
    }
}
impl ElectricalBuses for Electricity {
    fn potential_of(&self, bus_type: ElectricalBusType) -> Ref<Potential> {
        if let Some(identifier) = self.buses.get(&bus_type) {
            self.potential
                .get(*identifier)
                .unwrap_or_else(|| self.none_potential.borrow())
        } else {
            self.none_potential.borrow()
        }
    }

    fn is_powered(&self, bus_type: ElectricalBusType) -> bool {
        self.bus_is_powered(bus_type)
    }

    fn any_is_powered(&self, bus_types: &[ElectricalBusType]) -> bool {
        bus_types
            .iter()
            .any(|&bus_type| self.bus_is_powered(bus_type))
    }
}
impl ConsumePower for Electricity {
    fn input_of(&self, element: &impl ElectricalElement) -> Ref<Potential> {
        self.input_of(element)
    }

    fn consume_from_input(&mut self, element: &impl ElectricalElement, power: Power) {
        self.potential
            .consume_from(element.input_identifier(), power);
    }

    fn consume_from_bus(&mut self, bus_type: ElectricalBusType, power: Power) {
        if let Some(identifier) = self.buses.get(&bus_type) {
            self.potential.consume_from(*identifier, power);
        }
    }
}
impl PowerConsumptionReport for Electricity {
    fn total_consumption_of(&self, origin: PotentialOrigin) -> Power {
        self.potential.total_consumption_of(origin)
    }

    fn is_powered(&self, element: &impl ElectricalElement) -> bool {
        self.is_powered(element)
    }
}
impl Default for Electricity {
    fn default() -> Self {
        Self::new()
    }
}

struct ReceivePowerVisitor<'a> {
    electricity: &'a Electricity,
}
impl<'a> ReceivePowerVisitor<'a> {
    pub fn new(electricity: &'a Electricity) -> Self {
        ReceivePowerVisitor { electricity }
    }
}
impl SimulationElementVisitor for ReceivePowerVisitor<'_> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.receive_power(self.electricity);
    }
}

struct ConsumePowerVisitor<'a> {
    context: &'a UpdateContext,
    electricity: &'a mut Electricity,
}
impl<'a> ConsumePowerVisitor<'a> {
    pub fn new(context: &'a UpdateContext, electricity: &'a mut Electricity) -> Self {
        ConsumePowerVisitor {
            context,
            electricity,
        }
    }
}
impl SimulationElementVisitor for ConsumePowerVisitor<'_> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.consume_power(self.context, self.electricity);
    }
}
struct ConsumePowerInConvertersVisitor<'a> {
    context: &'a UpdateContext,
    electricity: &'a mut Electricity,
}
impl<'a> ConsumePowerInConvertersVisitor<'a> {
    pub fn new(context: &'a UpdateContext, electricity: &'a mut Electricity) -> Self {
        ConsumePowerInConvertersVisitor {
            context,
            electricity,
        }
    }
}
impl SimulationElementVisitor for ConsumePowerInConvertersVisitor<'_> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.consume_power_in_converters(self.context, self.electricity);
    }
}

struct ProcessPowerConsumptionReportVisitor<'a> {
    context: &'a UpdateContext,
    electricity: &'a Electricity,
}
impl<'a> ProcessPowerConsumptionReportVisitor<'a> {
    pub fn new(context: &'a UpdateContext, electricity: &'a Electricity) -> Self {
        ProcessPowerConsumptionReportVisitor {
            context,
            electricity,
        }
    }
}
impl SimulationElementVisitor for ProcessPowerConsumptionReportVisitor<'_> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.process_power_consumption_report(self.context, self.electricity);
    }
}

/// Within an electrical system, electric potential is made available by an origin.
/// These origins are contained in this type. By knowing the origin of potential
/// for all power consumers one can determine the amount of electric current provided
/// by the origin to the whole aircraft.
///
/// Note that this type shouldn't be confused with uom's `ElectricPotential`, which provides
/// the base unit (including volt) for defining the amount of potential.
/// The raw `ElectricPotential` is included in this type.
///
/// The raw `ElectricPotential` is ignored when determining if the potential
/// is powered or not. If we wouldn't ignore it, passing electric potential across the
/// circuit would take multiple simulation ticks, as _V_ for origins (ENG GEN, TR, etc)
/// can only be calculated when electrical consumption is known, which is the case at
/// the end of a simulation tick.
///
/// For the reasons outlined above when creating e.g. an engine generator, ensure you
/// return `Potential::none()` when the generator isn't supplying potential, and
/// `Potential::new(PotentialOrigin::EngineGenerator(1), ElectricPotential::new::<volt>(115.))`
/// when it is.
#[derive(Debug)]
pub struct Potential {
    origins: FxHashSet<PotentialOrigin>,
    elements: FxHashSet<ElectricalElementIdentifier>,
    raw: ElectricPotential,
}
impl Potential {
    pub fn new(origin: PotentialOrigin, raw: ElectricPotential) -> Self {
        let mut origins = FxHashSet::default();
        origins.insert(origin);

        Self {
            origins,
            elements: FxHashSet::default(),
            raw,
        }
    }

    pub fn none() -> Self {
        Self {
            origins: FxHashSet::default(),
            elements: FxHashSet::default(),
            raw: ElectricPotential::new::<volt>(0.),
        }
    }

    pub(super) fn raw(&self) -> ElectricPotential {
        self.raw
    }

    fn include(mut self, identifier: ElectricalElementIdentifier) -> Self {
        self.elements.insert(identifier);
        self
    }

    fn and_include(self, identifier: ElectricalElementIdentifier) -> Self {
        self.include(identifier)
    }

    fn elements(&self) -> impl Iterator<Item = &ElectricalElementIdentifier> + '_ {
        self.elements.iter()
    }

    fn origin_count(&self) -> usize {
        self.origins.len()
    }

    fn origins(&self) -> impl Iterator<Item = &PotentialOrigin> + '_ {
        self.origins.iter()
    }

    fn merge(mut self, mut other: Potential) -> Self {
        // As a given simulation tick is not of infinitely small delta time. We need to give
        // "equality" some slack. This prevents continuously switching between potential
        // sources, such as the battery.
        if (self.raw - other.raw).abs() <= ElectricPotential::new::<volt>(0.001) {
            self.origins.extend(other.origins);
            self.elements.extend(other.elements.iter());

            // Here we take the minimum of the potentials. To understand why consider
            // two batteries providing potential. BAT1 at 27.05V and BAT2 at 27.1V.
            // If we would return the higher potential, BAT1 would start charging itself.
            self.raw = self.raw.min(other.raw);

            self
        } else if self.raw > other.raw {
            self.elements.extend(other.elements.iter());
            self
        } else {
            other.elements.extend(self.elements.iter());
            other
        }
    }

    pub fn is_powered(&self) -> bool {
        !self.origins.is_empty()
    }

    pub fn is_unpowered(&self) -> bool {
        self.origins.is_empty()
    }

    pub fn is_only_powered_by_single_engine_generator(&self) -> bool {
        self.origins.len() == 1
            && matches!(
                self.origins.iter().next(),
                Some(PotentialOrigin::EngineGenerator(_))
            )
    }

    pub fn is_powered_by_same_single_source(&self, other: Ref<Potential>) -> bool {
        self.origins.len() == 1
            && other.origins.len() == 1
            && self.origins.iter().next() == other.origins.iter().next()
    }

    pub fn is_only_powered_by_apu(&self) -> bool {
        self.origins.len() == 1
            && matches!(
                self.origins.iter().next(),
                Some(PotentialOrigin::ApuGenerator(_))
            )
    }

    pub fn is_single(&self, origin: PotentialOrigin) -> bool {
        self.origins.len() == 1 && self.origins.contains(&origin)
    }

    pub fn is_pair(&self, x: PotentialOrigin, y: PotentialOrigin) -> bool {
        let mut set = FxHashSet::default();
        set.insert(x);
        set.insert(y);

        self.origins.symmetric_difference(&set).count() == 0
    }
}
impl Default for Potential {
    fn default() -> Self {
        Self::none()
    }
}

/// Maintains the many to one relationship from electrical elements to their electric potential.
#[derive(Debug)]
struct PotentialCollection {
    items: FxHashMap<ElectricalElementIdentifier, Rc<RefCell<Potential>>>,
    consumption_per_origin: FxHashMap<PotentialOrigin, Power>,
}
impl PotentialCollection {
    fn new() -> Self {
        Self {
            items: Default::default(),
            consumption_per_origin: Default::default(),
        }
    }

    fn clear(&mut self) {
        self.items.clear();
        self.consumption_per_origin.clear();
    }

    fn flow(
        &mut self,
        left_element: ElectricalElementIdentifier,
        right_element: ElectricalElementIdentifier,
    ) {
        match (
            self.items.remove(&left_element),
            self.items.remove(&right_element),
        ) {
            (None, None) => {
                // Neither element has potential, point them both to an object without potential.
                let potential = Rc::new(RefCell::new(
                    Potential::none()
                        .include(left_element)
                        .and_include(right_element),
                ));
                self.items.insert(left_element, Rc::clone(&potential));
                self.items.insert(right_element, potential);
            }
            (Some(left_potential), None) => {
                // The right element doesn't yet have potential, point it to the left element's potential.
                left_potential.replace(left_potential.take().include(right_element));
                self.items.insert(right_element, Rc::clone(&left_potential));
                self.items.insert(left_element, left_potential);
            }
            (None, Some(right_potential)) => {
                // The left element doesn't yet have potential, point it to the right element's potential.
                right_potential.replace(right_potential.take().include(left_element));
                self.items.insert(left_element, Rc::clone(&right_potential));
                self.items.insert(right_element, right_potential);
            }
            (Some(left_potential), Some(right_potential)) => {
                // The right element's potential will merge into the left element's potential.
                left_potential.replace(left_potential.take().merge(right_potential.take()));
                for element in left_potential.as_ref().borrow().elements() {
                    self.items.insert(*element, Rc::clone(&left_potential));
                }
            }
        };
    }

    fn supplied_by(
        &mut self,
        identifier: ElectricalElementIdentifier,
        supplied_potential: Potential,
    ) {
        if let Some(potential) = self.items.get(&identifier) {
            potential.replace(potential.take().merge(supplied_potential));
        } else {
            self.items
                .insert(identifier, Rc::new(RefCell::new(supplied_potential)));
        }
    }

    fn is_powered(&self, identifier: ElectricalElementIdentifier) -> bool {
        match self.items.get(&identifier) {
            Some(potential) => potential.as_ref().borrow().is_powered(),
            None => false,
        }
    }

    fn get(&self, identifier: ElectricalElementIdentifier) -> Option<Ref<Potential>> {
        self.items
            .get(&identifier)
            .map(|potential| potential.as_ref().borrow())
    }

    fn consume_from(&mut self, identifier: ElectricalElementIdentifier, power: Power) {
        if let Some(potential) = self.items.get_mut(&identifier) {
            let potential = potential.as_ref().borrow();
            for origin in potential.origins() {
                let y = self.consumption_per_origin.entry(*origin).or_default();
                *y += power / potential.origin_count() as f64;
            }
        }
    }

    fn total_consumption_of(&self, origin: PotentialOrigin) -> Power {
        match self.consumption_per_origin.get(&origin) {
            Some(power) => *power,
            None => Power::new::<watt>(0.),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uom::si::{electric_current::ampere, frequency::hertz, ratio::percent};

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
    mod electrical_bus_tests {
        use super::*;
        use crate::simulation::test::ReadByName;
        use crate::simulation::{
            test::{ElementCtorFn, SimulationTestBed, TestAircraft, TestBed},
            Aircraft, InitContext,
        };

        #[test]
        fn writes_its_state() {
            let mut test_bed = SimulationTestBed::from(ElementCtorFn(electrical_bus));
            test_bed.run();

            assert!(test_bed.contains_variable_with_name("ELEC_AC_2_BUS_IS_POWERED"));
        }

        #[test]
        fn sub_bus_does_not_write_its_state() {
            let mut test_bed = SimulationTestBed::new(|context| {
                ElectricalBusTestAircraft::new(ElectricalBusType::Sub("202PP"), context)
            });
            test_bed.run();

            assert!(!test_bed.contains_variable_with_name("ELEC_SUB_202PP_BUS_IS_POWERED"));
        }

        struct BatteryStub {
            identifier: ElectricalElementIdentifier,
            potential: ElectricPotential,
        }
        impl BatteryStub {
            fn new(context: &mut InitContext) -> BatteryStub {
                BatteryStub {
                    identifier: context.next_electrical_identifier(),
                    potential: ElectricPotential::new::<volt>(0.),
                }
            }

            fn set_potential(&mut self, potential: ElectricPotential) {
                self.potential = potential;
            }
        }
        impl ElectricalElement for BatteryStub {
            fn input_identifier(&self) -> ElectricalElementIdentifier {
                self.identifier
            }

            fn output_identifier(&self) -> ElectricalElementIdentifier {
                self.identifier
            }

            fn is_conductive(&self) -> bool {
                true
            }
        }
        impl ElectricitySource for BatteryStub {
            fn output_potential(&self) -> Potential {
                if self.potential > ElectricPotential::new::<volt>(0.) {
                    Potential::new(PotentialOrigin::Battery(1), self.potential)
                } else {
                    Potential::none()
                }
            }
        }

        struct ElectricalBusTestAircraft {
            bus: ElectricalBus,
            battery: BatteryStub,
        }
        impl ElectricalBusTestAircraft {
            fn new(bus_type: ElectricalBusType, context: &mut InitContext) -> Self {
                Self {
                    bus: ElectricalBus::new(context, bus_type),
                    battery: BatteryStub::new(context),
                }
            }

            fn powered_by_battery_at(&mut self, potential: ElectricPotential) {
                self.battery.set_potential(potential);
            }
        }
        impl Aircraft for ElectricalBusTestAircraft {
            fn update_before_power_distribution(
                &mut self,
                _: &UpdateContext,
                electricity: &mut Electricity,
            ) {
                electricity.supplied_by(&self.battery);
                electricity.flow(&self.battery, &self.bus);
            }
        }
        impl SimulationElement for ElectricalBusTestAircraft {
            fn accept<T: crate::simulation::SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.bus.accept(visitor);
                visitor.visit(self);
            }
        }

        #[test]
        fn bat_bus_at_25_volt_is_abnormal() {
            let mut test_bed = SimulationTestBed::new(|context| {
                ElectricalBusTestAircraft::new(ElectricalBusType::DirectCurrentBattery, context)
            });

            test_bed.command(|a| a.powered_by_battery_at(ElectricPotential::new::<volt>(25.)));
            test_bed.run();

            assert!(!ReadByName::<
                SimulationTestBed<ElectricalBusTestAircraft>,
                bool,
            >::read_by_name(
                &mut test_bed, "ELEC_DC_BAT_BUS_POTENTIAL_NORMAL"
            ));
        }

        #[test]
        fn bat_bus_above_25_volt_is_abnormal() {
            let mut test_bed = SimulationTestBed::new(|context| {
                ElectricalBusTestAircraft::new(ElectricalBusType::DirectCurrentBattery, context)
            });

            test_bed.command(|a| a.powered_by_battery_at(ElectricPotential::new::<volt>(25.01)));
            test_bed.run();

            assert!(ReadByName::<
                SimulationTestBed<ElectricalBusTestAircraft>,
                bool,
            >::read_by_name(
                &mut test_bed, "ELEC_DC_BAT_BUS_POTENTIAL_NORMAL"
            ));
        }

        #[test]
        fn writes_potential_normal_when_bat_bus() {
            let mut test_bed = SimulationTestBed::new(|context| {
                TestAircraft::new(ElectricalBus::new(
                    context,
                    ElectricalBusType::DirectCurrentBattery,
                ))
            });
            test_bed.run();

            assert!(test_bed.contains_variable_with_name("ELEC_DC_BAT_BUS_POTENTIAL_NORMAL"));
        }

        #[test]
        fn does_not_write_potential_normal_when_not_bat_bus() {
            let mut test_bed = SimulationTestBed::new(|context| {
                TestAircraft::new(ElectricalBus::new(
                    context,
                    ElectricalBusType::AlternatingCurrentEssential,
                ))
            });
            test_bed.run();

            assert!(!test_bed.contains_variable_with_name("ELEC_DC_BAT_BUS_POTENTIAL_NORMAL"));
        }

        fn electrical_bus(context: &mut InitContext) -> ElectricalBus {
            ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2))
        }
    }

    #[cfg(test)]
    mod contactor_tests {
        use super::*;
        use crate::simulation::{Aircraft, InitContext};
        use crate::{
            electrical::test::TestElectricitySource,
            simulation::test::{SimulationTestBed, TestBed},
        };

        struct ContactorTestAircraft {
            contactor: Contactor,
            power_source: TestElectricitySource,
        }
        impl ContactorTestAircraft {
            fn new_closed(context: &mut InitContext) -> Self {
                Self::new(context, true)
            }

            fn new_open(context: &mut InitContext) -> Self {
                Self::new(context, false)
            }

            fn new(context: &mut InitContext, closed: bool) -> Self {
                let mut contactor = Contactor::new(context, "TEST");
                contactor.closed = closed;
                Self {
                    contactor,
                    power_source: TestElectricitySource::unpowered(
                        context,
                        PotentialOrigin::External,
                    ),
                }
            }

            fn open_contactor(&mut self) {
                self.contactor.close_when(false);
            }

            fn close_contactor(&mut self) {
                self.contactor.close_when(true);
            }

            fn contactor_is_open(&self) -> bool {
                self.contactor.is_open()
            }

            fn contactor_is_closed(&self) -> bool {
                self.contactor.is_closed()
            }

            fn contactor_is_powered(&self, electricity: &Electricity) -> bool {
                electricity.is_powered(&self.contactor)
            }

            fn provide_power(&mut self) {
                self.power_source.power();
            }
        }
        impl Aircraft for ContactorTestAircraft {
            fn update_before_power_distribution(
                &mut self,
                _: &UpdateContext,
                electricity: &mut Electricity,
            ) {
                electricity.supplied_by(&self.power_source);
                electricity.flow(&self.power_source, &self.contactor);
            }
        }
        impl SimulationElement for ContactorTestAircraft {
            fn accept<T: crate::simulation::SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.contactor.accept(visitor);
                visitor.visit(self);
            }
        }

        #[test]
        fn open_contactor_when_toggled_open_stays_open() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_open);
            test_bed.command(|a| a.open_contactor());
            test_bed.run();

            assert!(test_bed.query(|a| a.contactor_is_open()));
        }

        #[test]
        fn open_contactor_when_toggled_closed_closes() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_open);
            test_bed.command(|a| a.close_contactor());

            assert!(test_bed.query(|a| a.contactor_is_closed()));
        }

        #[test]
        fn closed_contactor_when_toggled_open_opens() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_closed);
            test_bed.command(|a| a.open_contactor());
            test_bed.run();

            assert!(test_bed.query(|a| a.contactor_is_open()));
        }

        #[test]
        fn closed_contactor_when_toggled_closed_stays_closed() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_closed);
            test_bed.command(|a| a.close_contactor());
            test_bed.run();

            assert!(test_bed.query(|a| a.contactor_is_closed()));
        }

        #[test]
        fn open_contactor_has_no_output_when_powered_by_nothing_which_is_powered() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_open);
            test_bed.run();

            assert!(test_bed.query_elec(|a, elec| !a.contactor_is_powered(elec)));
        }

        #[test]
        fn closed_contactor_has_no_output_when_powered_by_nothing_which_is_powered() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_closed);
            test_bed.run();

            assert!(test_bed.query_elec(|a, elec| !a.contactor_is_powered(elec)));
        }

        #[test]
        fn open_contactor_has_no_output_when_powered_by_something() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_open);
            test_bed.command(|a| a.provide_power());
            test_bed.run();

            assert!(test_bed.query_elec(|a, elec| !a.contactor_is_powered(elec)));
        }

        #[test]
        fn closed_contactor_has_output_when_powered_by_something_which_is_powered() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_closed);
            test_bed.command(|a| a.provide_power());
            test_bed.run();

            assert!(test_bed.query_elec(|a, elec| a.contactor_is_powered(elec)));
        }

        #[test]
        fn writes_its_state() {
            let mut test_bed = SimulationTestBed::new(ContactorTestAircraft::new_open);
            test_bed.run();

            assert!(test_bed.contains_variable_with_name("ELEC_CONTACTOR_TEST_IS_CLOSED"));
        }
    }

    #[cfg(test)]
    mod current_state_writer_tests {
        use super::*;
        use crate::simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft,
        };

        enum WriteType {
            DirectCurrent,
            AlternatingCurrent,
            AlternatingCurrentWithLoad,
        }

        struct CurrentStateWriterTestAircraft {
            write_type: WriteType,
            writer: ElectricalStateWriter,
        }
        impl CurrentStateWriterTestAircraft {
            fn new(context: &mut InitContext, write_type: WriteType) -> Self {
                Self {
                    write_type,
                    writer: ElectricalStateWriter::new(context, "TEST"),
                }
            }
        }
        impl Aircraft for CurrentStateWriterTestAircraft {}
        impl SimulationElement for CurrentStateWriterTestAircraft {
            fn write(&self, writer: &mut SimulatorWriter) {
                match self.write_type {
                    WriteType::DirectCurrent => {
                        self.writer.write_direct(&StubElectricSource {}, writer)
                    }
                    WriteType::AlternatingCurrent => self
                        .writer
                        .write_alternating(&StubElectricSource {}, writer),
                    WriteType::AlternatingCurrentWithLoad => self
                        .writer
                        .write_alternating_with_load(&StubElectricSource {}, writer),
                }
            }
        }

        #[test]
        fn writes_direct_current_state() {
            let mut test_bed = SimulationTestBed::new(|context| {
                CurrentStateWriterTestAircraft::new(context, WriteType::DirectCurrent)
            });

            test_bed.run();

            assert!(test_bed.contains_variable_with_name("ELEC_TEST_CURRENT"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_CURRENT_NORMAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_POTENTIAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_POTENTIAL_NORMAL"));
        }

        #[test]
        fn writes_alternating_current_state() {
            let mut test_bed = SimulationTestBed::new(|context| {
                CurrentStateWriterTestAircraft::new(context, WriteType::AlternatingCurrent)
            });

            test_bed.run();

            assert!(test_bed.contains_variable_with_name("ELEC_TEST_POTENTIAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_POTENTIAL_NORMAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_FREQUENCY"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_FREQUENCY_NORMAL"));
        }

        #[test]
        fn writes_alternating_current_with_load_state() {
            let mut test_bed = SimulationTestBed::new(|context| {
                CurrentStateWriterTestAircraft::new(context, WriteType::AlternatingCurrentWithLoad)
            });

            test_bed.run();

            assert!(test_bed.contains_variable_with_name("ELEC_TEST_POTENTIAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_POTENTIAL_NORMAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_FREQUENCY"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_FREQUENCY_NORMAL"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_LOAD"));
            assert!(test_bed.contains_variable_with_name("ELEC_TEST_LOAD_NORMAL"));
        }
    }

    #[cfg(test)]
    mod new_potential_tests {
        use super::*;

        #[test]
        fn some_potential_is_powered() {
            assert!(some_potential().is_powered());
        }

        #[test]
        fn some_potential_is_not_unpowered() {
            assert!(!some_potential().is_unpowered());
        }

        #[test]
        fn none_potential_is_not_powered() {
            assert!(!none_potential().is_powered());
        }

        #[test]
        fn none_potential_is_unpowered() {
            assert!(none_potential().is_unpowered());
        }

        #[test]
        fn merge_ignores_none() {
            let potential = Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            )
            .merge(Potential::none());

            assert!(potential.is_only_powered_by_apu());
            assert_eq!(potential.raw, ElectricPotential::new::<volt>(115.));
        }

        #[test]
        fn merge_returns_the_callee_when_its_potential_is_greater_than_that_of_the_argument() {
            let potential = Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            )
            .merge(Potential::new(
                PotentialOrigin::EngineGenerator(1),
                ElectricPotential::new::<volt>(40.),
            ));

            assert!(potential.is_only_powered_by_apu());
            assert_eq!(potential.raw, ElectricPotential::new::<volt>(115.));
        }

        #[test]
        fn merge_returns_the_argument_when_its_potential_is_greater_than_that_of_the_callee() {
            let potential = Potential::new(
                PotentialOrigin::EngineGenerator(1),
                ElectricPotential::new::<volt>(40.),
            )
            .merge(Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            ));

            assert!(potential.is_only_powered_by_apu());
            assert_eq!(potential.raw, ElectricPotential::new::<volt>(115.));
        }

        #[test]
        fn merge_returns_a_merged_result_when_both_callee_and_argument_have_equal_potential() {
            let potential = Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            )
            .merge(Potential::new(
                PotentialOrigin::EngineGenerator(1),
                ElectricPotential::new::<volt>(115.),
            ));

            let mut set = FxHashSet::default();
            set.insert(PotentialOrigin::ApuGenerator(1));
            set.insert(PotentialOrigin::EngineGenerator(1));

            assert_eq!(potential.origins.symmetric_difference(&set).count(), 0);
            assert_eq!(potential.raw, ElectricPotential::new::<volt>(115.));
        }

        #[test]
        fn merge_combines_equal_origins() {
            let potential = Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            )
            .merge(Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            ));

            assert!(potential.is_only_powered_by_apu());
            assert_eq!(potential.raw, ElectricPotential::new::<volt>(115.));
        }

        #[test]
        fn merge_considers_miniscule_potential_differences_equal() {
            let potential = Potential::new(
                PotentialOrigin::EngineGenerator(1),
                ElectricPotential::new::<volt>(115.0011),
            )
            .merge(Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.002),
            ));

            let mut set = FxHashSet::default();
            set.insert(PotentialOrigin::ApuGenerator(1));
            set.insert(PotentialOrigin::EngineGenerator(1));

            assert_eq!(potential.origins.symmetric_difference(&set).count(), 0);
        }

        #[test]
        fn merge_considers_larger_potential_differences_inequal() {
            let potential = Potential::new(
                PotentialOrigin::EngineGenerator(1),
                ElectricPotential::new::<volt>(115.001),
            )
            .merge(Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.0021),
            ));

            assert_eq!(potential.origins.len(), 1);
            assert_eq!(
                potential.origins.iter().next(),
                Some(&PotentialOrigin::ApuGenerator(1))
            );
        }

        #[test]
        fn merge_takes_the_lowest_raw_potential_from_two_potentials_it_considers_equal() {
            let potential = Potential::new(
                PotentialOrigin::EngineGenerator(1),
                ElectricPotential::new::<volt>(115.0011),
            )
            .merge(Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.002),
            ));

            assert_eq!(potential.raw, ElectricPotential::new::<volt>(115.0011));
        }

        #[test]
        fn origin_count_returns_0_when_none() {
            assert_eq!(Potential::none().origin_count(), 0);
        }

        #[test]
        fn origin_count_returns_the_number_of_origins() {
            let potential = Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            )
            .merge(Potential::new(
                PotentialOrigin::EngineGenerator(1),
                ElectricPotential::new::<volt>(115.),
            ));

            assert_eq!(potential.origin_count(), 2);
        }

        #[test]
        fn is_only_powered_by_single_engine_generator_returns_false_when_none() {
            assert!(!Potential::none().is_only_powered_by_single_engine_generator());
        }

        #[test]
        fn is_only_powered_by_single_engine_generator_returns_false_when_different_origin() {
            assert!(!Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.)
            )
            .is_only_powered_by_single_engine_generator());
        }

        #[test]
        fn is_only_powered_by_single_engine_generator_returns_true_when_engine_generator() {
            assert!(Potential::new(
                PotentialOrigin::EngineGenerator(2),
                ElectricPotential::new::<volt>(115.)
            )
            .is_only_powered_by_single_engine_generator());
        }

        #[test]
        fn is_only_powered_by_single_engine_generator_returns_false_when_pair_of_engine_generators()
        {
            assert!(!Potential::new(
                PotentialOrigin::EngineGenerator(1),
                ElectricPotential::new::<volt>(115.)
            )
            .merge(Potential::new(
                PotentialOrigin::EngineGenerator(2),
                ElectricPotential::new::<volt>(115.)
            ))
            .is_only_powered_by_single_engine_generator());
        }

        fn some_potential() -> Potential {
            Potential::new(
                PotentialOrigin::ApuGenerator(1),
                ElectricPotential::new::<volt>(115.),
            )
        }

        fn none_potential() -> Potential {
            Potential::none()
        }
    }

    #[cfg(test)]
    mod electricity_tests {
        use super::*;

        struct TestElectricalElement {
            number: usize,
            identifier: ElectricalElementIdentifier,
            is_powered: bool,
            is_conductive: bool,
        }
        impl TestElectricalElement {
            fn new(identifier_provider: &mut impl ElectricalElementIdentifierProvider) -> Self {
                Self {
                    number: 1,
                    identifier: identifier_provider.next_electrical_identifier(),
                    is_powered: false,
                    is_conductive: true,
                }
            }

            fn unregistered() -> Self {
                Self {
                    number: 1,
                    identifier: ElectricalElementIdentifier::first(),
                    is_powered: false,
                    is_conductive: true,
                }
            }

            fn power(mut self) -> Self {
                self.is_powered = true;
                self
            }

            fn non_conductive(mut self) -> Self {
                self.is_conductive = false;
                self
            }

            fn with_number(mut self, number: usize) -> Self {
                self.number = number;
                self
            }
        }
        impl ElectricalElement for TestElectricalElement {
            fn input_identifier(&self) -> ElectricalElementIdentifier {
                self.identifier
            }

            fn output_identifier(&self) -> ElectricalElementIdentifier {
                self.identifier
            }

            fn is_conductive(&self) -> bool {
                self.is_conductive
            }
        }
        impl ElectricitySource for TestElectricalElement {
            fn output_potential(&self) -> Potential {
                if self.is_powered {
                    Potential::new(
                        PotentialOrigin::EngineGenerator(self.number),
                        ElectricPotential::new::<volt>(115.),
                    )
                } else {
                    Potential::none()
                }
            }
        }

        struct TestBus {
            identifier: ElectricalElementIdentifier,
        }
        impl TestBus {
            fn new(
                identifier_provider: &mut impl ElectricalElementIdentifierProvider,
                bus_type: ElectricalBusType,
            ) -> Self {
                Self {
                    identifier: identifier_provider.next_electrical_identifier_for_bus(bus_type),
                }
            }
        }
        impl ElectricalElement for TestBus {
            fn input_identifier(&self) -> ElectricalElementIdentifier {
                self.identifier
            }

            fn output_identifier(&self) -> ElectricalElementIdentifier {
                self.identifier
            }

            fn is_conductive(&self) -> bool {
                true
            }
        }

        struct TestTransformer {
            input_identifier: ElectricalElementIdentifier,
            output_identifier: ElectricalElementIdentifier,
        }
        impl TestTransformer {
            fn new(identifier_provider: &mut impl ElectricalElementIdentifierProvider) -> Self {
                Self {
                    input_identifier: identifier_provider.next_electrical_identifier(),
                    output_identifier: identifier_provider.next_electrical_identifier(),
                }
            }
        }
        impl ElectricityTransformer for TestTransformer {
            fn transform(&self, input: Ref<Potential>) -> Potential {
                if input.is_powered() {
                    Potential::new(
                        PotentialOrigin::TransformerRectifier(1),
                        ElectricPotential::new::<volt>(28.),
                    )
                } else {
                    Potential::none()
                }
            }
        }
        impl ElectricalElement for TestTransformer {
            fn input_identifier(&self) -> ElectricalElementIdentifier {
                self.input_identifier
            }

            fn output_identifier(&self) -> ElectricalElementIdentifier {
                self.output_identifier
            }

            fn is_conductive(&self) -> bool {
                true
            }
        }

        #[test]
        fn next_provides_increasing_identifiers() {
            let mut electricity = Electricity::new();
            let mut identifier = electricity.next_electrical_identifier();
            for _ in 1..=10 {
                let next_identifier = electricity.next_electrical_identifier();
                assert!(identifier.0 < next_identifier.0);
                identifier = next_identifier;
            }
        }

        #[test]
        fn next_for_bus_provides_increasing_identifiers() {
            let mut electricity = Electricity::new();
            let mut identifier = electricity.next_electrical_identifier();
            for _ in 1..=10 {
                let next_identifier = electricity
                    .next_electrical_identifier_for_bus(ElectricalBusType::DirectCurrentBattery);
                assert!(identifier.0 < next_identifier.0);
                identifier = next_identifier;
            }
        }

        #[test]
        fn next_and_next_for_bus_together_provide_increasing_identifiers() {
            let mut electricity = Electricity::new();
            let mut identifier = electricity.next_electrical_identifier();
            for n in 1..=10 {
                let next_identifier = if n % 2 == 0 {
                    electricity.next_electrical_identifier()
                } else {
                    electricity
                        .next_electrical_identifier_for_bus(ElectricalBusType::DirectCurrentBattery)
                };
                assert!(identifier.0 < next_identifier.0);
                identifier = next_identifier;
            }
        }

        #[test]
        fn next_for_bus_identifier_matches_looked_up_identifier() {
            let mut electricity = Electricity::new();

            electricity.next_electrical_identifier_for_bus(ElectricalBusType::DirectCurrentBattery);
            let identifier = electricity
                .next_electrical_identifier_for_bus(ElectricalBusType::DirectCurrentEssential);

            assert!(
                electricity.identifier_for(ElectricalBusType::DirectCurrentEssential)
                    == Some(&identifier)
            );
        }

        #[test]
        fn an_unknown_element_isnt_powered() {
            let electricity = Electricity::new();
            let element = TestElectricalElement::unregistered();

            assert!(!electricity.is_powered(&element));
        }

        #[test]
        fn a_known_but_unpowered_element_isnt_powered() {
            let mut electricity = Electricity::new();
            let element = TestElectricalElement::new(&mut electricity);

            assert!(!electricity.is_powered(&element));
        }

        #[test]
        fn a_known_and_powered_element_is_powered() {
            let mut electricity = Electricity::new();
            let element = TestElectricalElement::new(&mut electricity).power();
            electricity.supplied_by(&element);

            assert!(electricity.is_powered(&element));
        }

        #[test]
        fn power_doesnt_flow_from_an_unpowered_element_to_another_unpowered_element() {
            let mut electricity = Electricity::new();
            let from_element = TestElectricalElement::new(&mut electricity);
            let to_element = TestElectricalElement::new(&mut electricity);
            electricity.supplied_by(&from_element);
            electricity.flow(&from_element, &to_element);

            assert!(!electricity.is_powered(&to_element));
        }

        #[test]
        fn power_flows_from_a_powered_to_an_unpowered_element() {
            let mut electricity = Electricity::new();
            let from_element = TestElectricalElement::new(&mut electricity).power();
            let to_element = TestElectricalElement::new(&mut electricity);
            electricity.supplied_by(&from_element);
            electricity.flow(&from_element, &to_element);

            assert!(electricity.is_powered(&to_element));
        }

        #[test]
        fn power_doesnt_flow_from_a_non_conductive_to_a_conductive_element() {
            let mut electricity = Electricity::new();
            let from_element = TestElectricalElement::new(&mut electricity)
                .power()
                .non_conductive();
            let to_element = TestElectricalElement::new(&mut electricity);
            electricity.supplied_by(&from_element);
            electricity.flow(&from_element, &to_element);

            assert!(!electricity.is_powered(&to_element));
        }

        #[test]
        fn power_doesnt_flow_from_a_conductive_to_a_non_conductive_element() {
            let mut electricity = Electricity::new();
            let from_element = TestElectricalElement::new(&mut electricity).power();
            let to_element = TestElectricalElement::new(&mut electricity).non_conductive();
            electricity.supplied_by(&from_element);
            electricity.flow(&from_element, &to_element);

            assert!(!electricity.is_powered(&to_element));
        }

        #[test]
        fn an_unknown_bus_isnt_powered() {
            let electricity = Electricity::new();

            assert!(!electricity.bus_is_powered(ElectricalBusType::DirectCurrentBattery));
        }

        #[test]
        fn a_known_but_unpowered_bus_isnt_powered() {
            let mut electricity = Electricity::new();
            // Request an identifier, such that the bus type is registered.
            TestBus::new(&mut electricity, ElectricalBusType::DirectCurrentBattery);

            assert!(!electricity.bus_is_powered(ElectricalBusType::DirectCurrentBattery));
        }

        #[test]
        fn a_known_and_powered_bus_is_powered() {
            let mut electricity = Electricity::new();
            let element = TestElectricalElement::new(&mut electricity).power();
            electricity.supplied_by(&element);

            let bus = TestBus::new(&mut electricity, ElectricalBusType::DirectCurrentBattery);
            electricity.flow(&element, &bus);

            assert!(electricity.bus_is_powered(ElectricalBusType::DirectCurrentBattery));
        }

        #[test]
        fn an_unpowered_transformer_does_not_transform_electricity() {
            let mut electricity = Electricity::new();
            let transformer = TestTransformer::new(&mut electricity);
            electricity.transform_in(&transformer);

            assert!(!electricity.is_powered(&transformer));
        }

        #[test]
        fn a_powered_transformer_transforms_electricity() {
            let mut electricity = Electricity::new();
            let source = TestElectricalElement::new(&mut electricity).power();
            let transformer = TestTransformer::new(&mut electricity);

            electricity.supplied_by(&source);
            electricity.flow(&source, &transformer);
            electricity.transform_in(&transformer);

            assert!(electricity.is_powered(&transformer));
        }

        #[test]
        fn transformed_electricity_isnt_the_same_potential() {
            let mut electricity = Electricity::new();
            let source = TestElectricalElement::new(&mut electricity).power();
            let transformer = TestTransformer::new(&mut electricity);

            electricity.supplied_by(&source);
            electricity.flow(&source, &transformer);
            electricity.transform_in(&transformer);

            assert!(electricity
                .output_of(&source)
                .origins
                .contains(&PotentialOrigin::EngineGenerator(1)));
            assert!(electricity
                .output_of(&transformer)
                .origins
                .contains(&PotentialOrigin::TransformerRectifier(1)))
        }

        #[test]
        fn electricity_flows_back_through_the_circuit() {
            let mut electricity = Electricity::new();
            let first = TestElectricalElement::new(&mut electricity);
            let second = TestElectricalElement::new(&mut electricity);
            let third = TestElectricalElement::new(&mut electricity).power();

            electricity.flow(&first, &second);
            electricity.flow(&second, &third);
            electricity.supplied_by(&third);

            assert!(electricity.is_powered(&first));
        }

        #[test]
        fn electricity_from_multiple_sources_combines() {
            let mut electricity = Electricity::new();
            let first = TestElectricalElement::new(&mut electricity).power();
            let second = TestElectricalElement::new(&mut electricity)
                .with_number(2)
                .power();

            electricity.supplied_by(&first);
            electricity.supplied_by(&second);
            electricity.flow(&first, &second);

            assert_eq!(electricity.output_of(&first).origin_count(), 2);
        }

        #[test]
        fn flow_right_argument_doesnt_dangle() {
            let mut electricity = Electricity::new();
            let first = TestElectricalElement::new(&mut electricity);
            let second = TestElectricalElement::new(&mut electricity);
            let third = TestElectricalElement::new(&mut electricity);
            let fourth = TestElectricalElement::new(&mut electricity);
            electricity.flow(&first, &second);

            // If the code doesn't add the third element to the potential object during this call...
            electricity.flow(&second, &third);

            let powered = TestElectricalElement::new(&mut electricity).power();
            electricity.supplied_by(&powered);
            electricity.flow(&fourth, &powered);

            // ...then during this call the third element would get lost, as the potential doesn't contain
            // a reference to the element, and thus there is no way to include that element in the new merged potential.
            electricity.flow(&fourth, &first);

            assert!(electricity.is_powered(&third));
        }

        #[test]
        fn flow_left_argument_doesnt_dangle() {
            let mut electricity = Electricity::new();
            let first = TestElectricalElement::new(&mut electricity);
            let second = TestElectricalElement::new(&mut electricity);
            let third = TestElectricalElement::new(&mut electricity);
            let fourth = TestElectricalElement::new(&mut electricity);
            electricity.flow(&first, &second);

            // If the code doesn't add the third element to the potential object during this call...
            electricity.flow(&third, &second);

            let powered = TestElectricalElement::new(&mut electricity).power();
            electricity.supplied_by(&powered);
            electricity.flow(&fourth, &powered);

            // ...then during this call the third element would get lost, as the potential doesn't contain
            // a reference to the element, and thus there is no way to include that element in the new merged potential.
            electricity.flow(&fourth, &first);

            assert!(electricity.is_powered(&third));
        }

        #[test]
        fn any_is_powered_returns_true_when_any_of_the_arguments_is_powered() {
            let mut electricity = Electricity::new();
            let element = TestElectricalElement::new(&mut electricity).power();
            electricity.supplied_by(&element);

            let ac_bus = TestBus::new(&mut electricity, ElectricalBusType::AlternatingCurrent(1));
            TestBus::new(&mut electricity, ElectricalBusType::DirectCurrent(1));

            electricity.flow(&element, &ac_bus);
            // Don't flow to DC BUS on purpose.

            assert!(electricity.any_is_powered(&[
                ElectricalBusType::AlternatingCurrent(1),
                ElectricalBusType::DirectCurrent(1),
            ]));
        }

        #[test]
        fn any_is_powered_returns_false_when_none_of_the_arguments_is_powered() {
            let mut electricity = Electricity::new();
            TestBus::new(&mut electricity, ElectricalBusType::AlternatingCurrent(1));
            TestBus::new(&mut electricity, ElectricalBusType::DirectCurrent(1));

            assert!(!electricity.any_is_powered(&[
                ElectricalBusType::AlternatingCurrent(1),
                ElectricalBusType::DirectCurrent(1),
            ]));
        }

        #[test]
        fn potential_of_returns_a_potential_which_isnt_powered_when_bus_is_unpowered() {
            let mut electricity = Electricity::new();
            TestBus::new(&mut electricity, ElectricalBusType::AlternatingCurrent(1));
            let potential = electricity.potential_of(ElectricalBusType::AlternatingCurrent(1));

            assert!(potential.is_unpowered());
        }

        #[test]
        fn potential_of_returns_a_potential_with_origin_when_bus_is_powered() {
            let mut electricity = Electricity::new();
            let element = TestElectricalElement::new(&mut electricity).power();
            electricity.supplied_by(&element);

            let bus = TestBus::new(&mut electricity, ElectricalBusType::AlternatingCurrent(1));
            electricity.flow(&element, &bus);

            let potential = electricity.potential_of(ElectricalBusType::AlternatingCurrent(1));

            assert!(potential.is_only_powered_by_single_engine_generator());
        }

        #[test]
        fn power_consumed_from_a_powered_bus_is_included_in_the_power_usage() {
            let mut electricity = Electricity::new();
            let generator = TestElectricalElement::new(&mut electricity).power();
            electricity.supplied_by(&generator);

            let bus = TestBus::new(&mut electricity, ElectricalBusType::AlternatingCurrent(1));
            electricity.flow(&generator, &bus);

            electricity.consume_from_bus(
                ElectricalBusType::AlternatingCurrent(1),
                Power::new::<watt>(400.),
            );
            electricity.consume_from_bus(
                ElectricalBusType::AlternatingCurrent(1),
                Power::new::<watt>(300.),
            );

            assert_eq!(
                electricity.total_consumption_of(PotentialOrigin::EngineGenerator(1)),
                Power::new::<watt>(700.)
            );
        }

        #[test]
        fn power_consumed_from_an_unpowered_bus_is_not_included_in_the_power_usage() {
            let mut electricity = Electricity::new();
            TestBus::new(&mut electricity, ElectricalBusType::AlternatingCurrent(1));

            electricity.consume_from_bus(
                ElectricalBusType::AlternatingCurrent(1),
                Power::new::<watt>(400.),
            );

            assert_eq!(
                electricity.total_consumption_of(PotentialOrigin::EngineGenerator(1)),
                Power::new::<watt>(0.)
            );
        }

        #[test]
        fn consumption_is_equally_divided_between_all_potential_origins() {
            let mut electricity = Electricity::new();
            let generator_1 = TestElectricalElement::new(&mut electricity).power();
            let generator_2 = TestElectricalElement::new(&mut electricity)
                .with_number(2)
                .power();
            electricity.supplied_by(&generator_1);
            electricity.supplied_by(&generator_2);

            let bus = TestBus::new(&mut electricity, ElectricalBusType::AlternatingCurrent(1));
            electricity.flow(&generator_1, &bus);
            electricity.flow(&generator_2, &bus);

            electricity.consume_from_bus(
                ElectricalBusType::AlternatingCurrent(1),
                Power::new::<watt>(400.),
            );

            assert_eq!(
                electricity.total_consumption_of(PotentialOrigin::EngineGenerator(1)),
                Power::new::<watt>(200.)
            );
            assert_eq!(
                electricity.total_consumption_of(PotentialOrigin::EngineGenerator(2)),
                Power::new::<watt>(200.)
            );
        }
    }
}
