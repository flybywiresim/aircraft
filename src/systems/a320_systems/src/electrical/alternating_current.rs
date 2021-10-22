use super::{
    A320AlternatingCurrentElectricalSystem, A320DirectCurrentElectricalSystem,
    A320ElectricalOverheadPanel, A320EmergencyElectricalOverheadPanel,
};
use std::time::Duration;
use systems::simulation::InitContext;
use systems::{
    electrical::{
        AlternatingCurrentElectricalSystem, Contactor, ElectricalBus, Electricity,
        EmergencyGenerator, EngineGenerator, ExternalPowerSource, TransformerRectifier,
    },
    shared::{
        AuxiliaryPowerUnitElectrical, DelayedTrueLogicGate, ElectricalBusType, EngineCorrectedN2,
        EngineFirePushButtons,
    },
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
    pub fn new(context: &mut InitContext) -> Self {
        A320AlternatingCurrentElectrical {
            main_power_sources: A320MainPowerSources::new(context),
            ac_ess_feed_contactors: A320AcEssFeedContactors::new(context),
            ac_bus_1: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
            ac_bus_2: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
            ac_ess_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrentEssential),
            ac_ess_shed_bus: ElectricalBus::new(
                context,
                ElectricalBusType::AlternatingCurrentEssentialShed,
            ),
            ac_ess_shed_contactor: Contactor::new(context, "8XH"),
            tr_1: TransformerRectifier::new(context, 1),
            tr_2: TransformerRectifier::new(context, 2),
            ac_bus_2_to_tr_2_contactor: Contactor::new(context, "14PU"),
            tr_ess: TransformerRectifier::new(context, 3),
            ac_ess_to_tr_ess_contactor: Contactor::new(context, "15XE1"),
            emergency_gen_contactor: Contactor::new(context, "2XE"),
            static_inv_to_ac_ess_bus_contactor: Contactor::new(context, "15XE2"),
            ac_stat_inv_bus: ElectricalBus::new(
                context,
                ElectricalBusType::AlternatingCurrentStaticInverter,
            ),
            ac_gnd_flt_service_bus: ElectricalBus::new(
                context,
                ElectricalBusType::AlternatingCurrentGndFltService,
            ),
            ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor: Contactor::new(context, "12XN"),
        }
    }

    pub fn update_main_power_sources(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ext_pwr: &ExternalPowerSource,
        overhead: &A320ElectricalOverheadPanel,
        emergency_overhead: &A320EmergencyElectricalOverheadPanel,
        apu: &impl AuxiliaryPowerUnitElectrical,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        engines: [&impl EngineCorrectedN2; 2],
    ) {
        self.main_power_sources.update(
            context,
            electricity,
            ext_pwr,
            overhead,
            emergency_overhead,
            apu,
            engine_fire_push_buttons,
            engines,
        );

        self.main_power_sources
            .power_ac_bus_1(electricity, &self.ac_bus_1);
        self.main_power_sources
            .power_ac_bus_2(electricity, &self.ac_bus_2);
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ext_pwr: &ExternalPowerSource,
        overhead: &A320ElectricalOverheadPanel,
        emergency_generator: &EmergencyGenerator,
    ) {
        self.ac_bus_2_to_tr_2_contactor
            .close_when(electricity.is_powered(&self.ac_bus_2) && !self.tr_2.has_failed());
        electricity.flow(&self.ac_bus_2, &self.ac_bus_2_to_tr_2_contactor);

        // On the real aircraft there is a button inside the galley which is taken into
        // account when determining whether to close this contactor or not.
        // As we're not building a galley simulator, for now we assume the button is ON.
        self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor
            .close_when(
                !electricity.is_powered(&self.ac_bus_2)
                    && !self.tr_2.has_failed()
                    && electricity.is_powered(ext_pwr),
            );
        electricity.flow(
            ext_pwr,
            &self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor,
        );

        electricity.flow(
            &self.ac_bus_2_to_tr_2_contactor,
            &self.ac_gnd_flt_service_bus,
        );
        electricity.flow(
            &self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor,
            &self.ac_gnd_flt_service_bus,
        );

        electricity.flow(&self.ac_bus_1, &self.tr_1);
        electricity.transform_in(&self.tr_1);

        electricity.flow(&self.ac_bus_2_to_tr_2_contactor, &self.tr_2);
        electricity.flow(
            &self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor,
            &self.tr_2,
        );
        electricity.transform_in(&self.tr_2);

        self.ac_ess_feed_contactors.update(
            context,
            electricity,
            &self.ac_bus_1,
            &self.ac_bus_2,
            overhead,
        );

        self.ac_ess_feed_contactors
            .power_ac_ess_bus(electricity, &self.ac_ess_bus);

        self.emergency_gen_contactor.close_when(
            !self.any_non_essential_bus_powered(electricity)
                && emergency_generator.output_within_normal_parameters(),
        );
        electricity.supplied_by(emergency_generator);
        electricity.flow(emergency_generator, &self.emergency_gen_contactor);

        self.ac_ess_to_tr_ess_contactor.close_when(
            (!self.tr_1_and_2_available(electricity)
                && self.ac_ess_feed_contactors.provides_power(electricity))
                || electricity.is_powered(&self.emergency_gen_contactor),
        );
        electricity.flow(&self.ac_ess_bus, &self.ac_ess_to_tr_ess_contactor);
        electricity.flow(
            &self.emergency_gen_contactor,
            &self.ac_ess_to_tr_ess_contactor,
        );

        electricity.flow(&self.ac_ess_to_tr_ess_contactor, &self.ac_ess_bus);

        electricity.flow(&self.ac_ess_bus, &self.ac_ess_shed_contactor);

        electricity.flow(&self.ac_ess_to_tr_ess_contactor, &self.tr_ess);
        electricity.flow(&self.emergency_gen_contactor, &self.tr_ess);
        electricity.transform_in(&self.tr_ess);

        self.update_shedding(emergency_generator, electricity);
    }

    pub fn update_after_direct_current(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        emergency_generator: &EmergencyGenerator,
        dc_state: &impl A320DirectCurrentElectricalSystem,
    ) {
        electricity.flow(dc_state.static_inverter(), &self.ac_stat_inv_bus);

        self.static_inv_to_ac_ess_bus_contactor
            .close_when(self.should_close_15xe2_contactor(
                context,
                electricity,
                emergency_generator,
            ));
        electricity.flow(
            dc_state.static_inverter(),
            &self.static_inv_to_ac_ess_bus_contactor,
        );
        electricity.flow(&self.static_inv_to_ac_ess_bus_contactor, &self.ac_ess_bus);
    }

    fn update_shedding(
        &mut self,
        emergency_generator: &EmergencyGenerator,
        electricity: &mut Electricity,
    ) {
        let ac_bus_or_emergency_gen_provides_power = electricity.is_powered(&self.ac_bus_1)
            || electricity.is_powered(&self.ac_bus_2)
            || electricity.is_powered(emergency_generator);
        self.ac_ess_shed_contactor
            .close_when(ac_bus_or_emergency_gen_provides_power);

        electricity.flow(&self.ac_ess_shed_contactor, &self.ac_ess_shed_bus);
    }

    /// Whether or not AC BUS 1 and AC BUS 2 are powered by a single engine
    /// generator exclusively. Also returns true when one of the buses is
    /// unpowered and the other bus is powered by an engine generator.
    pub fn main_ac_buses_powered_by_single_engine_generator_only(
        &self,
        electricity: &Electricity,
    ) -> bool {
        let ac_bus_1_potential = electricity.output_of(&self.ac_bus_1);
        let ac_bus_2_potential = electricity.output_of(&self.ac_bus_2);

        (ac_bus_1_potential.is_unpowered()
            && ac_bus_2_potential.is_only_powered_by_single_engine_generator())
            || (ac_bus_2_potential.is_unpowered()
                && ac_bus_1_potential.is_only_powered_by_single_engine_generator())
            || (ac_bus_1_potential.is_only_powered_by_single_engine_generator()
                && ac_bus_1_potential.is_powered_by_same_single_source(ac_bus_2_potential))
    }

    /// Whether or not AC BUS 1 and AC BUS 2 are powered by the APU generator
    /// exclusively. Also returns true when one of the buses is unpowered and
    /// the other bus is powered by the APU generator.
    pub fn main_ac_buses_powered_by_apu_generator_only(&self, electricity: &Electricity) -> bool {
        let ac_bus_1_potential = electricity.output_of(&self.ac_bus_1);
        let ac_bus_2_potential = electricity.output_of(&self.ac_bus_2);

        (ac_bus_1_potential.is_unpowered() && ac_bus_2_potential.is_only_powered_by_apu())
            || (ac_bus_2_potential.is_unpowered() && ac_bus_1_potential.is_only_powered_by_apu())
            || (ac_bus_1_potential.is_only_powered_by_apu()
                && ac_bus_2_potential.is_only_powered_by_apu())
    }

    /// Determines if 15XE2 should be closed. 15XE2 is the contactor which connects
    /// the static inverter to the AC ESS BUS.
    fn should_close_15xe2_contactor(
        &self,
        context: &UpdateContext,
        electricity: &Electricity,
        emergency_generator: &EmergencyGenerator,
    ) -> bool {
        !self.any_non_essential_bus_powered(electricity)
            && !electricity.is_powered(emergency_generator)
            && context.indicated_airspeed() >= Velocity::new::<knot>(50.)
    }

    pub fn debug_assert_invariants(&self) {
        debug_assert!(self.static_inverter_or_emergency_gen_powers_ac_ess_bus());
    }

    fn static_inverter_or_emergency_gen_powers_ac_ess_bus(&self) -> bool {
        !(self.static_inv_to_ac_ess_bus_contactor.is_closed()
            && self.ac_ess_to_tr_ess_contactor.is_closed())
    }

    pub fn gen_contactor_open(&self, number: usize) -> bool {
        self.main_power_sources.gen_contactor_open(number)
    }

    pub fn emergency_generator_contactor_is_closed(&self) -> bool {
        self.emergency_gen_contactor.is_closed()
    }

    pub fn ac_ess_bus_is_powered(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.ac_ess_bus)
    }
}
impl A320AlternatingCurrentElectricalSystem for A320AlternatingCurrentElectrical {
    fn ac_bus_2_powered(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.ac_bus_2)
    }

    fn tr_1_and_2_available(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.tr_1) && electricity.is_powered(&self.tr_2)
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
impl AlternatingCurrentElectricalSystem for A320AlternatingCurrentElectrical {
    fn any_non_essential_bus_powered(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.ac_bus_1) || electricity.is_powered(&self.ac_bus_2)
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
    engine_2_gen: EngineGenerator,
    engine_generator_contactors: [Contactor; 2],
    bus_tie_1_contactor: Contactor,
    bus_tie_2_contactor: Contactor,
    apu_gen_contactor: Contactor,
    ext_pwr_contactor: Contactor,
}
impl A320MainPowerSources {
    fn new(context: &mut InitContext) -> Self {
        A320MainPowerSources {
            engine_1_gen: EngineGenerator::new(context, 1),
            engine_2_gen: EngineGenerator::new(context, 2),
            engine_generator_contactors: [
                Contactor::new(context, "9XU1"),
                Contactor::new(context, "9XU2"),
            ],
            bus_tie_1_contactor: Contactor::new(context, "11XU1"),
            bus_tie_2_contactor: Contactor::new(context, "11XU2"),
            apu_gen_contactor: Contactor::new(context, "3XS"),
            ext_pwr_contactor: Contactor::new(context, "3XG"),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ext_pwr: &ExternalPowerSource,
        overhead: &A320ElectricalOverheadPanel,
        emergency_overhead: &A320EmergencyElectricalOverheadPanel,
        apu: &impl AuxiliaryPowerUnitElectrical,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        engines: [&impl EngineCorrectedN2; 2],
    ) {
        self.engine_1_gen
            .update(context, engines[0], overhead, engine_fire_push_buttons);
        electricity.supplied_by(&self.engine_1_gen);

        self.engine_2_gen
            .update(context, engines[1], overhead, engine_fire_push_buttons);
        electricity.supplied_by(&self.engine_2_gen);

        electricity.supplied_by(apu);
        electricity.supplied_by(ext_pwr);

        let gen_1_provides_power = overhead.generator_is_on(1)
            && emergency_overhead.generator_1_line_is_on()
            && !engine_fire_push_buttons.is_released(1)
            && self.engine_1_gen.output_within_normal_parameters();
        let gen_2_provides_power = overhead.generator_is_on(2)
            && !engine_fire_push_buttons.is_released(2)
            && self.engine_2_gen.output_within_normal_parameters();
        let only_one_engine_gen_is_powered = gen_1_provides_power ^ gen_2_provides_power;
        let both_engine_gens_provide_power = gen_1_provides_power && gen_2_provides_power;
        let ext_pwr_provides_power = overhead.external_power_is_on()
            && ext_pwr.output_within_normal_parameters()
            && !both_engine_gens_provide_power;
        let apu_gen_provides_power = overhead.apu_generator_is_on()
            && apu.output_within_normal_parameters()
            && !ext_pwr_provides_power
            && !both_engine_gens_provide_power;

        self.engine_generator_contactors[0].close_when(gen_1_provides_power);
        self.engine_generator_contactors[1].close_when(gen_2_provides_power);
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

        electricity.flow(apu, &self.apu_gen_contactor);
        electricity.flow(ext_pwr, &self.ext_pwr_contactor);

        electricity.flow(&self.engine_1_gen, &self.engine_generator_contactors[0]);
        electricity.flow(
            &self.engine_generator_contactors[0],
            &self.bus_tie_1_contactor,
        );
        electricity.flow(&self.apu_gen_contactor, &self.bus_tie_1_contactor);
        electricity.flow(&self.ext_pwr_contactor, &self.bus_tie_1_contactor);

        electricity.flow(&self.engine_2_gen, &self.engine_generator_contactors[1]);
        electricity.flow(
            &self.engine_generator_contactors[1],
            &self.bus_tie_2_contactor,
        );
        electricity.flow(&self.apu_gen_contactor, &self.bus_tie_2_contactor);
        electricity.flow(&self.ext_pwr_contactor, &self.bus_tie_2_contactor);

        electricity.flow(&self.bus_tie_1_contactor, &self.bus_tie_2_contactor);
    }

    fn power_ac_bus_1(&self, electricity: &mut Electricity, bus: &ElectricalBus) {
        electricity.flow(&self.engine_generator_contactors[0], bus);
        electricity.flow(&self.bus_tie_1_contactor, bus);
    }

    fn power_ac_bus_2(&self, electricity: &mut Electricity, bus: &ElectricalBus) {
        electricity.flow(&self.engine_generator_contactors[1], bus);
        electricity.flow(&self.bus_tie_2_contactor, bus);
    }

    pub fn gen_contactor_open(&self, number: usize) -> bool {
        self.engine_generator_contactors[number - 1].is_open()
    }
}
impl SimulationElement for A320MainPowerSources {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.engine_1_gen.accept(visitor);
        self.engine_2_gen.accept(visitor);
        self.engine_generator_contactors
            .iter_mut()
            .for_each(|contactor| {
                contactor.accept(visitor);
            });
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

    fn new(context: &mut InitContext) -> Self {
        A320AcEssFeedContactors {
            ac_ess_feed_contactor_1: Contactor::new(context, "3XC1"),
            ac_ess_feed_contactor_2: Contactor::new(context, "3XC2"),
            ac_ess_feed_contactor_delay_logic_gate: DelayedTrueLogicGate::new(
                A320AcEssFeedContactors::AC_ESS_FEED_TO_AC_BUS_2_DELAY_IN_SECONDS,
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ac_bus_1: &ElectricalBus,
        ac_bus_2: &ElectricalBus,
        overhead: &A320ElectricalOverheadPanel,
    ) {
        self.ac_ess_feed_contactor_delay_logic_gate
            .update(context, !electricity.is_powered(ac_bus_1));

        self.ac_ess_feed_contactor_1.close_when(
            electricity.is_powered(ac_bus_1)
                && (!self.ac_ess_feed_contactor_delay_logic_gate.output()
                    && overhead.ac_ess_feed_is_normal()),
        );
        self.ac_ess_feed_contactor_2.close_when(
            electricity.is_powered(ac_bus_2)
                && (self.ac_ess_feed_contactor_delay_logic_gate.output()
                    || overhead.ac_ess_feed_is_altn()),
        );

        electricity.flow(ac_bus_1, &self.ac_ess_feed_contactor_1);
        electricity.flow(ac_bus_2, &self.ac_ess_feed_contactor_2);
    }

    fn power_ac_ess_bus(&self, electricity: &mut Electricity, ac_ess_bus: &ElectricalBus) {
        electricity.flow(&self.ac_ess_feed_contactor_1, ac_ess_bus);
        electricity.flow(&self.ac_ess_feed_contactor_2, ac_ess_bus);
    }

    fn provides_power(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.ac_ess_feed_contactor_1)
            || electricity.is_powered(&self.ac_ess_feed_contactor_2)
    }
}
impl SimulationElement for A320AcEssFeedContactors {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ac_ess_feed_contactor_1.accept(visitor);
        self.ac_ess_feed_contactor_2.accept(visitor);

        visitor.visit(self);
    }
}
