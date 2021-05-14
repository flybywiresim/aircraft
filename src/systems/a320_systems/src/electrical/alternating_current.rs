use super::{
    A320ElectricalOverheadPanel, A320ElectricalUpdateArguments,
    A320EmergencyElectricalOverheadPanel, AlternatingCurrentState, DirectCurrentState,
};
use std::time::Duration;
use systems::{
    electrical::{
        consumption::SuppliedPower, AlternatingCurrentBusesState, Contactor, ElectricalBus,
        ElectricalBusType, EmergencyGenerator, EngineGenerator, ExternalPowerSource, Potential,
        PotentialOrigin, PotentialSource, PotentialTarget, TransformerRectifier,
    },
    shared::DelayedTrueLogicGate,
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};
use uom::si::{f64::*, velocity::knot};

pub(super) struct A320AlternatingCurrentElectrical {
    main_power_sources: A320MainPowerSources,
    ac_ess_feed_contactors: A320AcEssFeedContactors,
    ac_bus_1: ElectricalBus,
    ac_bus_2: ElectricalBus,
    ac_ess_bus: ElectricalBus,
    ac_ess_shed_bus: ElectricalBus,
    ac_ess_shed_contactor: Contactor,
    tr_1: TransformerRectifier,
    tr_2: TransformerRectifier,
    ac_bus_2_to_tr_2_contactor: Contactor,
    tr_ess: TransformerRectifier,
    ac_ess_to_tr_ess_contactor: Contactor,
    emergency_gen_contactor: Contactor,
    static_inv_to_ac_ess_bus_contactor: Contactor,
    ac_stat_inv_bus: ElectricalBus,
    ac_gnd_flt_service_bus: ElectricalBus,
    ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor: Contactor,
}
impl A320AlternatingCurrentElectrical {
    pub fn new() -> Self {
        A320AlternatingCurrentElectrical {
            main_power_sources: A320MainPowerSources::new(),
            ac_ess_feed_contactors: A320AcEssFeedContactors::new(),
            ac_bus_1: ElectricalBus::new(ElectricalBusType::AlternatingCurrent(1)),
            ac_bus_2: ElectricalBus::new(ElectricalBusType::AlternatingCurrent(2)),
            ac_ess_bus: ElectricalBus::new(ElectricalBusType::AlternatingCurrentEssential),
            ac_ess_shed_bus: ElectricalBus::new(ElectricalBusType::AlternatingCurrentEssentialShed),
            ac_ess_shed_contactor: Contactor::new("8XH"),
            tr_1: TransformerRectifier::new(1),
            tr_2: TransformerRectifier::new(2),
            ac_bus_2_to_tr_2_contactor: Contactor::new("14PU"),
            tr_ess: TransformerRectifier::new(3),
            ac_ess_to_tr_ess_contactor: Contactor::new("15XE1"),
            emergency_gen_contactor: Contactor::new("2XE"),
            static_inv_to_ac_ess_bus_contactor: Contactor::new("15XE2"),
            ac_stat_inv_bus: ElectricalBus::new(
                ElectricalBusType::AlternatingCurrentStaticInverter,
            ),
            ac_gnd_flt_service_bus: ElectricalBus::new(
                ElectricalBusType::AlternatingCurrentGndFltService,
            ),
            ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor: Contactor::new("12XN"),
        }
    }

    pub fn update_main_power_sources<'a>(
        &mut self,
        context: &UpdateContext,
        ext_pwr: &ExternalPowerSource,
        overhead: &A320ElectricalOverheadPanel,
        emergency_overhead: &A320EmergencyElectricalOverheadPanel,
        arguments: &mut A320ElectricalUpdateArguments<'a>,
    ) {
        self.main_power_sources
            .update(context, ext_pwr, overhead, emergency_overhead, arguments);

        self.ac_bus_1
            .powered_by(&self.main_power_sources.ac_bus_1_electric_sources());
        self.ac_bus_2
            .powered_by(&self.main_power_sources.ac_bus_2_electric_sources());
    }

    pub fn update<'a>(
        &mut self,
        context: &UpdateContext,
        ext_pwr: &ExternalPowerSource,
        overhead: &A320ElectricalOverheadPanel,
        emergency_generator: &EmergencyGenerator,
    ) {
        self.ac_bus_2_to_tr_2_contactor.powered_by(&self.ac_bus_2);
        self.ac_bus_2_to_tr_2_contactor
            .close_when(self.ac_bus_2.is_powered() && !self.tr_2.failed());

        self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor
            .powered_by(ext_pwr);

        // On the real aircraft there is a button inside the galley which is taken into
        // account when determining whether to close this contactor or not.
        // As we're not building a galley simulator, for now we assume the button is ON.
        self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor
            .close_when(!self.ac_bus_2.is_powered() && !self.tr_2.failed() && ext_pwr.is_powered());

        self.ac_gnd_flt_service_bus
            .powered_by(&self.ac_bus_2_to_tr_2_contactor);
        self.ac_gnd_flt_service_bus
            .or_powered_by(&self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor);

        self.tr_1.powered_by(&self.ac_bus_1);
        self.tr_2.powered_by(&self.ac_bus_2_to_tr_2_contactor);
        self.tr_2
            .or_powered_by(&self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor);

        self.ac_ess_feed_contactors
            .update(context, &self.ac_bus_1, &self.ac_bus_2, overhead);

        self.ac_ess_bus
            .powered_by(&self.ac_ess_feed_contactors.electric_sources());

        self.emergency_gen_contactor.close_when(
            self.ac_bus_1_and_2_unpowered()
                && emergency_generator.output_within_normal_parameters(),
        );
        self.emergency_gen_contactor.powered_by(emergency_generator);

        self.ac_ess_to_tr_ess_contactor.powered_by(&self.ac_ess_bus);
        self.ac_ess_to_tr_ess_contactor
            .or_powered_by(&self.emergency_gen_contactor);

        self.ac_ess_to_tr_ess_contactor.close_when(
            (!self.tr_1_and_2_available() && self.ac_ess_feed_contactors.provides_power())
                || self.emergency_gen_contactor.is_powered(),
        );

        self.ac_ess_bus
            .or_powered_by(&self.ac_ess_to_tr_ess_contactor);

        self.ac_ess_shed_contactor.powered_by(&self.ac_ess_bus);

        self.tr_ess.powered_by(&self.ac_ess_to_tr_ess_contactor);
        self.tr_ess.or_powered_by(&self.emergency_gen_contactor);

        self.update_shedding(emergency_generator);
    }

    pub fn update_after_direct_current<T: DirectCurrentState>(
        &mut self,
        context: &UpdateContext,
        emergency_generator: &EmergencyGenerator,
        dc_state: &T,
    ) {
        self.ac_stat_inv_bus.powered_by(dc_state.static_inverter());
        self.static_inv_to_ac_ess_bus_contactor
            .close_when(self.should_close_15xe2_contactor(context, emergency_generator));
        self.static_inv_to_ac_ess_bus_contactor
            .powered_by(dc_state.static_inverter());
        self.ac_ess_bus
            .or_powered_by(&self.static_inv_to_ac_ess_bus_contactor);
    }

    fn update_shedding(&mut self, emergency_generator: &EmergencyGenerator) {
        let ac_bus_or_emergency_gen_provides_power = self.ac_bus_1.is_powered()
            || self.ac_bus_2.is_powered()
            || emergency_generator.is_powered();
        self.ac_ess_shed_contactor
            .close_when(ac_bus_or_emergency_gen_provides_power);

        self.ac_ess_shed_bus.powered_by(&self.ac_ess_shed_contactor);
    }

    /// Whether or not AC BUS 1 and AC BUS 2 are powered by a single engine
    /// generator exclusively. Also returns true when one of the buses is
    /// unpowered and the other bus is powered by an engine generator.
    pub fn main_ac_buses_powered_by_single_engine_generator_only(&self) -> bool {
        (self.ac_bus_1.is_unpowered() && self.ac_bus_2.output().is_single_engine_generator())
            || (self.ac_bus_1.output().is_single_engine_generator() && self.ac_bus_2.is_unpowered())
            || (self
                .ac_bus_1
                .output()
                .is_single(PotentialOrigin::EngineGenerator(1))
                && self
                    .ac_bus_2
                    .output()
                    .is_single(PotentialOrigin::EngineGenerator(1)))
            || (self
                .ac_bus_1
                .output()
                .is_single(PotentialOrigin::EngineGenerator(2))
                && self
                    .ac_bus_2
                    .output()
                    .is_single(PotentialOrigin::EngineGenerator(2)))
    }

    /// Whether or not AC BUS 1 and AC BUS 2 are powered by the APU generator
    /// exclusively. Also returns true when one of the buses is unpowered and
    /// the other bus is powered by the APU generator.
    pub fn main_ac_buses_powered_by_apu_generator_only(&self) -> bool {
        (self.ac_bus_1.is_unpowered()
            && self
                .ac_bus_2
                .output()
                .is_single(PotentialOrigin::ApuGenerator(1)))
            || (self
                .ac_bus_1
                .output()
                .is_single(PotentialOrigin::ApuGenerator(1))
                && self.ac_bus_2.is_unpowered())
            || (self
                .ac_bus_1
                .output()
                .is_single(PotentialOrigin::ApuGenerator(1))
                && self
                    .ac_bus_2
                    .output()
                    .is_single(PotentialOrigin::ApuGenerator(1)))
    }

    /// Determines if 15XE2 should be closed. 15XE2 is the contactor which connects
    /// the static inverter to the AC ESS BUS.
    fn should_close_15xe2_contactor(
        &self,
        context: &UpdateContext,
        emergency_generator: &EmergencyGenerator,
    ) -> bool {
        self.ac_bus_1_and_2_unpowered()
            && emergency_generator.is_unpowered()
            && context.indicated_airspeed() >= Velocity::new::<knot>(50.)
    }

    pub fn debug_assert_invariants(&self) {
        debug_assert!(self.static_inverter_or_emergency_gen_powers_ac_ess_bus());
    }

    fn static_inverter_or_emergency_gen_powers_ac_ess_bus(&self) -> bool {
        !(self.static_inv_to_ac_ess_bus_contactor.is_closed()
            && self.ac_ess_to_tr_ess_contactor.is_closed())
    }

    #[cfg(test)]
    pub fn fail_tr_1(&mut self) {
        self.tr_1.fail();
    }

    #[cfg(test)]
    pub fn fail_tr_2(&mut self) {
        self.tr_2.fail();
    }

    pub fn gen_1_contactor_open(&self) -> bool {
        self.main_power_sources.gen_1_contactor_open()
    }

    pub fn gen_2_contactor_open(&self) -> bool {
        self.main_power_sources.gen_2_contactor_open()
    }

    pub fn emergency_generator_contactor_is_closed(&self) -> bool {
        self.emergency_gen_contactor.is_closed()
    }

    pub fn ac_ess_bus_is_powered(&self) -> bool {
        self.ac_ess_bus.is_powered()
    }

    pub fn add_supplied_power(&self, state: &mut SuppliedPower) {
        state.add_bus(&self.ac_bus_1);
        state.add_bus(&self.ac_bus_2);
        state.add_bus(&self.ac_ess_bus);
        state.add_bus(&self.ac_ess_shed_bus);
        state.add_bus(&self.ac_stat_inv_bus);
        state.add_bus(&self.ac_gnd_flt_service_bus);
    }
}
impl AlternatingCurrentState for A320AlternatingCurrentElectrical {
    fn ac_bus_1_and_2_unpowered(&self) -> bool {
        self.ac_bus_1.is_unpowered() && self.ac_bus_2.is_unpowered()
    }

    fn ac_bus_2_powered(&self) -> bool {
        self.ac_bus_2.is_powered()
    }

    fn tr_1_and_2_available(&self) -> bool {
        self.tr_1.is_powered() && self.tr_2.is_powered()
    }

    fn tr_1(&self) -> &TransformerRectifier {
        &self.tr_1
    }

    fn tr_2(&self) -> &TransformerRectifier {
        &self.tr_2
    }

    fn tr_ess(&self) -> &TransformerRectifier {
        &self.tr_ess
    }
}
impl AlternatingCurrentBusesState for A320AlternatingCurrentElectrical {
    fn ac_buses_unpowered(&self) -> bool {
        self.ac_bus_1_and_2_unpowered()
    }
}
impl SimulationElement for A320AlternatingCurrentElectrical {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.main_power_sources.accept(visitor);
        self.ac_ess_feed_contactors.accept(visitor);
        self.tr_1.accept(visitor);
        self.tr_2.accept(visitor);
        self.ac_bus_2_to_tr_2_contactor.accept(visitor);
        self.tr_ess.accept(visitor);

        self.ac_ess_shed_contactor.accept(visitor);
        self.ac_ess_to_tr_ess_contactor.accept(visitor);
        self.emergency_gen_contactor.accept(visitor);
        self.static_inv_to_ac_ess_bus_contactor.accept(visitor);

        self.ac_bus_1.accept(visitor);
        self.ac_bus_2.accept(visitor);
        self.ac_ess_bus.accept(visitor);
        self.ac_ess_shed_bus.accept(visitor);
        self.ac_stat_inv_bus.accept(visitor);

        self.ac_gnd_flt_service_bus.accept(visitor);
        self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor
            .accept(visitor);

        visitor.visit(self);
    }
}

struct A320MainPowerSources {
    engine_1_gen: EngineGenerator,
    engine_1_gen_contactor: Contactor,
    engine_2_gen: EngineGenerator,
    engine_2_gen_contactor: Contactor,
    bus_tie_1_contactor: Contactor,
    bus_tie_2_contactor: Contactor,
    apu_gen_contactor: Contactor,
    ext_pwr_contactor: Contactor,
}
impl A320MainPowerSources {
    fn new() -> Self {
        A320MainPowerSources {
            engine_1_gen: EngineGenerator::new(1),
            engine_1_gen_contactor: Contactor::new("9XU1"),
            engine_2_gen: EngineGenerator::new(2),
            engine_2_gen_contactor: Contactor::new("9XU2"),
            bus_tie_1_contactor: Contactor::new("11XU1"),
            bus_tie_2_contactor: Contactor::new("11XU2"),
            apu_gen_contactor: Contactor::new("3XS"),
            ext_pwr_contactor: Contactor::new("3XG"),
        }
    }

    fn update<'a>(
        &mut self,
        context: &UpdateContext,
        ext_pwr: &ExternalPowerSource,
        overhead: &A320ElectricalOverheadPanel,
        emergency_overhead: &A320EmergencyElectricalOverheadPanel,
        arguments: &mut A320ElectricalUpdateArguments<'a>,
    ) {
        self.engine_1_gen.update(context, arguments);
        self.engine_2_gen.update(context, arguments);

        let gen_1_provides_power = overhead.generator_1_is_on()
            && emergency_overhead.generator_1_line_is_on()
            && self.engine_1_gen.output_within_normal_parameters();
        let gen_2_provides_power =
            overhead.generator_2_is_on() && self.engine_2_gen.output_within_normal_parameters();
        let only_one_engine_gen_is_powered = gen_1_provides_power ^ gen_2_provides_power;
        let both_engine_gens_provide_power = gen_1_provides_power && gen_2_provides_power;
        let ext_pwr_provides_power = overhead.external_power_is_on()
            && ext_pwr.output_within_normal_parameters()
            && !both_engine_gens_provide_power;
        let apu_gen_provides_power = overhead.apu_generator_is_on()
            && arguments.apu().output_within_normal_parameters()
            && !ext_pwr_provides_power
            && !both_engine_gens_provide_power;

        self.engine_1_gen_contactor.close_when(gen_1_provides_power);
        self.engine_2_gen_contactor.close_when(gen_2_provides_power);
        self.apu_gen_contactor.close_when(apu_gen_provides_power);
        self.ext_pwr_contactor.close_when(ext_pwr_provides_power);

        let apu_or_ext_pwr_provides_power = ext_pwr_provides_power || apu_gen_provides_power;
        self.bus_tie_1_contactor.close_when(
            overhead.bus_tie_is_auto()
                && ((only_one_engine_gen_is_powered && !apu_or_ext_pwr_provides_power)
                    || (apu_or_ext_pwr_provides_power && !gen_1_provides_power)),
        );
        self.bus_tie_2_contactor.close_when(
            overhead.bus_tie_is_auto()
                && ((only_one_engine_gen_is_powered && !apu_or_ext_pwr_provides_power)
                    || (apu_or_ext_pwr_provides_power && !gen_2_provides_power)),
        );

        self.apu_gen_contactor.powered_by(arguments.apu());
        self.ext_pwr_contactor.powered_by(ext_pwr);

        self.engine_1_gen_contactor.powered_by(&self.engine_1_gen);
        self.bus_tie_1_contactor
            .powered_by(&self.engine_1_gen_contactor);
        self.bus_tie_1_contactor
            .or_powered_by(&self.apu_gen_contactor);
        self.bus_tie_1_contactor
            .or_powered_by(&self.ext_pwr_contactor);

        self.engine_2_gen_contactor.powered_by(&self.engine_2_gen);
        self.bus_tie_2_contactor
            .powered_by(&self.engine_2_gen_contactor);
        self.bus_tie_2_contactor
            .or_powered_by(&self.apu_gen_contactor);
        self.bus_tie_2_contactor
            .or_powered_by(&self.ext_pwr_contactor);

        self.bus_tie_1_contactor
            .or_powered_by(&self.bus_tie_2_contactor);
        self.bus_tie_2_contactor
            .or_powered_by(&self.bus_tie_1_contactor);
    }

    fn ac_bus_1_electric_sources(&self) -> Potential {
        self.engine_1_gen_contactor
            .output()
            .merge(&self.bus_tie_1_contactor.output())
    }

    fn ac_bus_2_electric_sources(&self) -> Potential {
        self.engine_2_gen_contactor
            .output()
            .merge(&self.bus_tie_2_contactor.output())
    }

    pub fn gen_1_contactor_open(&self) -> bool {
        self.engine_1_gen_contactor.is_open()
    }

    pub fn gen_2_contactor_open(&self) -> bool {
        self.engine_2_gen_contactor.is_open()
    }
}
impl SimulationElement for A320MainPowerSources {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.engine_1_gen.accept(visitor);
        self.engine_2_gen.accept(visitor);

        self.engine_1_gen_contactor.accept(visitor);
        self.engine_2_gen_contactor.accept(visitor);
        self.bus_tie_1_contactor.accept(visitor);
        self.bus_tie_2_contactor.accept(visitor);
        self.apu_gen_contactor.accept(visitor);
        self.ext_pwr_contactor.accept(visitor);

        visitor.visit(self);
    }
}

pub(super) struct A320AcEssFeedContactors {
    ac_ess_feed_contactor_1: Contactor,
    ac_ess_feed_contactor_2: Contactor,
    ac_ess_feed_contactor_delay_logic_gate: DelayedTrueLogicGate,
}
impl A320AcEssFeedContactors {
    pub const AC_ESS_FEED_TO_AC_BUS_2_DELAY_IN_SECONDS: Duration = Duration::from_secs(3);

    fn new() -> Self {
        A320AcEssFeedContactors {
            ac_ess_feed_contactor_1: Contactor::new("3XC1"),
            ac_ess_feed_contactor_2: Contactor::new("3XC2"),
            ac_ess_feed_contactor_delay_logic_gate: DelayedTrueLogicGate::new(
                A320AcEssFeedContactors::AC_ESS_FEED_TO_AC_BUS_2_DELAY_IN_SECONDS,
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        ac_bus_1: &ElectricalBus,
        ac_bus_2: &ElectricalBus,
        overhead: &A320ElectricalOverheadPanel,
    ) {
        self.ac_ess_feed_contactor_delay_logic_gate
            .update(context, ac_bus_1.is_unpowered());

        self.ac_ess_feed_contactor_1.close_when(
            ac_bus_1.is_powered()
                && (!self.ac_ess_feed_contactor_delay_logic_gate.output()
                    && overhead.ac_ess_feed_is_normal()),
        );
        self.ac_ess_feed_contactor_2.close_when(
            ac_bus_2.is_powered()
                && (self.ac_ess_feed_contactor_delay_logic_gate.output()
                    || overhead.ac_ess_feed_is_altn()),
        );

        self.ac_ess_feed_contactor_1.powered_by(ac_bus_1);
        self.ac_ess_feed_contactor_2.powered_by(ac_bus_2);
    }

    fn electric_sources(&self) -> Potential {
        self.ac_ess_feed_contactor_1
            .output()
            .merge(&self.ac_ess_feed_contactor_2.output())
    }

    fn provides_power(&self) -> bool {
        self.electric_sources().output().is_powered()
    }
}
impl SimulationElement for A320AcEssFeedContactors {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ac_ess_feed_contactor_1.accept(visitor);
        self.ac_ess_feed_contactor_2.accept(visitor);

        visitor.visit(self);
    }
}
