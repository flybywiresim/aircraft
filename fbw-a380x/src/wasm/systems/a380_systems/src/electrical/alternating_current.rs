use super::{
    A380AlternatingCurrentElectricalSystem, A380DirectCurrentElectricalSystem,
    A380ElectricalOverheadPanel,
};
use std::time::Duration;
use systems::accept_iterable;
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

pub(super) struct A380AlternatingCurrentElectrical {
    main_power_sources: A380MainPowerSources,
    ac_ess_feed_contactors: A380AcEssFeedContactors,
    ac_buses: [ElectricalBus; 4],
    ac_ess_bus: ElectricalBus,
    ac_emer_bus: ElectricalBus,
    ac_eha_bus: ElectricalBus,
    // This is actually a 2-way switch but we simulate this with 2 contactors
    ac_emer_contactor: [Contactor; 2],
    eha_contactors: [Contactor; 2],
    tr_1: TransformerRectifier,
    tr_2: TransformerRectifier,
    tr_ess: TransformerRectifier,
    tr_apu: TransformerRectifier,
    emergency_gen_contactor: Contactor,
}
impl A380AlternatingCurrentElectrical {
    pub fn new(context: &mut InitContext) -> Self {
        A380AlternatingCurrentElectrical {
            main_power_sources: A380MainPowerSources::new(context),
            ac_ess_feed_contactors: A380AcEssFeedContactors::new(context),
            ac_buses: [1, 2, 3, 4]
                .map(|i| ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(i))),
            // TODO: 400XP is actually AC ESS but for now we misuse AC ESS SCHED for it
            ac_ess_bus: ElectricalBus::new(
                context,
                ElectricalBusType::AlternatingCurrentEssentialShed,
            ),
            // TODO: 491XP is actually AC EMER/AC ESS
            ac_emer_bus: ElectricalBus::new(
                context,
                ElectricalBusType::AlternatingCurrentEssential,
            ),
            ac_eha_bus: ElectricalBus::new(
                context,
                ElectricalBusType::AlternatingCurrentNamed("247XP"),
            ),
            ac_emer_contactor: [1, 2].map(|i| Contactor::new(context, &format!("3XB.{i}"))),
            eha_contactors: ["911XN", "911XH"].map(|id| Contactor::new(context, id)),
            tr_1: TransformerRectifier::new(context, 1),
            tr_2: TransformerRectifier::new(context, 2),
            tr_ess: TransformerRectifier::new(context, 3),
            tr_apu: TransformerRectifier::new(context, 4),
            emergency_gen_contactor: Contactor::new(context, "5XE"),
        }
    }

    pub fn update_main_power_sources(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ext_pwrs: &[ExternalPowerSource; 4],
        overhead: &A380ElectricalOverheadPanel,
        apu: &impl AuxiliaryPowerUnitElectrical,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        engines: [&impl EngineCorrectedN2; 4],
    ) {
        self.main_power_sources.update(
            context,
            electricity,
            ext_pwrs,
            overhead,
            apu,
            engine_fire_push_buttons,
            engines,
        );

        self.main_power_sources
            .power_ac_buses(electricity, &self.ac_buses);
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        overhead: &A380ElectricalOverheadPanel,
        emergency_generator: &EmergencyGenerator,
    ) {
        self.ac_ess_feed_contactors.update(
            context,
            electricity,
            &self.ac_buses[0],
            &self.ac_buses[3],
            overhead,
        );

        self.ac_ess_feed_contactors
            .power_400xp(electricity, &self.ac_ess_bus);

        electricity.flow(&self.ac_buses[1], &self.tr_1);
        electricity.flow(&self.ac_buses[2], &self.tr_2);
        electricity.flow(&self.ac_buses[3], &self.tr_apu);
        electricity.transform_in(&self.tr_1);
        electricity.transform_in(&self.tr_2);
        electricity.transform_in(&self.tr_apu);

        let emergency_configuration = !self.any_non_essential_bus_powered(electricity)
            && emergency_generator.output_within_normal_parameters();

        self.emergency_gen_contactor
            .close_when(emergency_configuration);
        electricity.supplied_by(emergency_generator);
        electricity.flow(emergency_generator, &self.emergency_gen_contactor);
        electricity.flow(&self.emergency_gen_contactor, &self.ac_ess_bus);

        electricity.flow(&self.ac_ess_bus, &self.tr_ess);
        electricity.flow(&self.ac_ess_bus, &self.ac_emer_contactor[0]);

        electricity.transform_in(&self.tr_ess);

        self.eha_contactors[0].close_when(self.ac_bus_powered(electricity, 3));
        electricity.flow(&self.ac_buses[2], &self.eha_contactors[0]);

        self.update_shedding(emergency_generator, electricity);
    }

    pub fn update_after_direct_current(
        &mut self,
        electricity: &mut Electricity,
        dc_state: &impl A380DirectCurrentElectricalSystem,
        tefo_condition: bool,
    ) {
        electricity.flow(dc_state.static_inverter(), &self.ac_emer_contactor[1]);
        electricity.flow(&self.ac_emer_contactor[1], &self.ac_emer_bus);

        // TODO: check what engine burst reconfiguration (relay 34CD) means -> only then it should close when AC 3 is lost
        self.eha_contactors[1].close_when(
            dc_state.dc_ess_powered(electricity)
                && (tefo_condition || !self.ac_bus_powered(electricity, 3)),
        );
        electricity.flow(&self.ac_ess_bus, &self.eha_contactors[1]);
        for contactor in &self.eha_contactors {
            electricity.flow(contactor, &self.ac_eha_bus);
        }
    }

    fn update_shedding(
        &mut self,
        emergency_generator: &EmergencyGenerator,
        electricity: &mut Electricity,
    ) {
        let ac_bus_or_emergency_gen_provides_power = self
            .ac_buses
            .iter()
            .map(|bus| electricity.is_powered(bus))
            .any(|v| v)
            || electricity.is_powered(emergency_generator);
        self.ac_emer_contactor[0].close_when(ac_bus_or_emergency_gen_provides_power);
        self.ac_emer_contactor[1].close_when(!ac_bus_or_emergency_gen_provides_power);

        electricity.flow(&self.ac_emer_contactor[0], &self.ac_emer_bus);
    }

    pub fn main_ac_buses_powered_by_two_generators_only(&self, electricity: &Electricity) -> bool {
        (0..4)
            .map(|i| {
                let ac_output = electricity.output_of(&self.ac_buses[i]);
                let bus_not_powered_by_own_gen =
                    self.ac_buses.iter().enumerate().any(|(j, bus)| {
                        j != i
                            && ac_output
                                .is_powered_by_same_single_source(electricity.output_of(bus))
                    });
                bus_not_powered_by_own_gen as u32
            })
            .sum::<u32>()
            <= 2
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
impl A380AlternatingCurrentElectricalSystem for A380AlternatingCurrentElectrical {
    fn ac_bus_powered(&self, electricity: &Electricity, number: usize) -> bool {
        electricity.is_powered(&self.ac_buses[number - 1])
    }

    fn ac_ess_bus_powered(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.ac_ess_bus)
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

    fn tr_apu(&self) -> &TransformerRectifier {
        &self.tr_apu
    }
}
impl AlternatingCurrentElectricalSystem for A380AlternatingCurrentElectrical {
    fn any_non_essential_bus_powered(&self, electricity: &Electricity) -> bool {
        self.ac_buses
            .iter()
            .map(|bus| electricity.is_powered(bus))
            .any(|v| v)
    }
}
impl SimulationElement for A380AlternatingCurrentElectrical {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.main_power_sources.accept(visitor);
        self.ac_ess_feed_contactors.accept(visitor);
        self.tr_1.accept(visitor);
        self.tr_2.accept(visitor);
        self.tr_ess.accept(visitor);
        self.tr_apu.accept(visitor);

        accept_iterable!(self.ac_emer_contactor, visitor);
        accept_iterable!(self.eha_contactors, visitor);
        self.emergency_gen_contactor.accept(visitor);

        accept_iterable!(self.ac_buses, visitor);
        self.ac_ess_bus.accept(visitor);
        self.ac_emer_bus.accept(visitor);
        self.ac_eha_bus.accept(visitor);

        visitor.visit(self);
    }
}

struct A380MainPowerSources {
    engine_gens: [EngineGenerator; 4],
    engine_generator_contactors: [Contactor; 4],
    bus_tie_contactors: [Contactor; 6],
    // FCOM: BTC7
    system_isolation_contactor: Contactor,
    apu_gen_contactors: [Contactor; 2],
    ext_pwr_contactors: [Contactor; 4],
}
impl A380MainPowerSources {
    // AC power priorities:
    // 1. Engine generator of same bus
    // 2. External power of same bus
    // 3. APU gen on same side
    // 4. APU gen on other side
    // 5. Engine generator of other engine on same side
    // 6. External power of other bus on same side
    // 7. Engine generator of opposite side
    // 8. External power of opposite side
    const POWER_SOURCE_PRIORITIES: [[Option<ACBusPowerSource>; 4]; 8] = [
        [Some(ACBusPowerSource::Generator); 4],
        [Some(ACBusPowerSource::ExternalPower); 4],
        [
            Some(ACBusPowerSource::APUGenerator(1)),
            Some(ACBusPowerSource::APUGenerator(1)),
            Some(ACBusPowerSource::APUGenerator(2)),
            Some(ACBusPowerSource::APUGenerator(2)),
        ],
        [
            Some(ACBusPowerSource::APUGenerator(2)),
            Some(ACBusPowerSource::APUGenerator(2)),
            Some(ACBusPowerSource::APUGenerator(1)),
            Some(ACBusPowerSource::APUGenerator(1)),
        ],
        [
            Some(ACBusPowerSource::ACBus(2)),
            Some(ACBusPowerSource::ACBus(1)),
            Some(ACBusPowerSource::ACBus(4)),
            Some(ACBusPowerSource::ACBus(3)),
        ],
        [
            Some(ACBusPowerSource::ACBus(2)),
            Some(ACBusPowerSource::ACBus(1)),
            Some(ACBusPowerSource::ACBus(4)),
            Some(ACBusPowerSource::ACBus(3)),
        ],
        [
            Some(ACBusPowerSource::ACBus(4)),
            Some(ACBusPowerSource::ACBus(3)),
            Some(ACBusPowerSource::ACBus(2)),
            Some(ACBusPowerSource::ACBus(1)),
        ],
        [
            Some(ACBusPowerSource::ACBus(4)),
            Some(ACBusPowerSource::ACBus(3)),
            Some(ACBusPowerSource::ACBus(2)),
            Some(ACBusPowerSource::ACBus(1)),
        ],
    ];
    const SPECIAL_POWER_SOURCE_PRIORITIES: [[Option<ACBusPowerSource>; 4]; 8] = [
        [Some(ACBusPowerSource::Generator); 4],
        [Some(ACBusPowerSource::ExternalPower); 4],
        [
            Some(ACBusPowerSource::APUGenerator(1)),
            Some(ACBusPowerSource::ACBus(1)),
            Some(ACBusPowerSource::ACBus(4)),
            Some(ACBusPowerSource::APUGenerator(2)),
        ],
        [
            Some(ACBusPowerSource::ACBus(2)),
            Some(ACBusPowerSource::ACBus(1)),
            Some(ACBusPowerSource::ACBus(4)),
            Some(ACBusPowerSource::ACBus(3)),
        ],
        [
            Some(ACBusPowerSource::ACBus(2)),
            Some(ACBusPowerSource::APUGenerator(1)),
            Some(ACBusPowerSource::APUGenerator(2)),
            Some(ACBusPowerSource::ACBus(3)),
        ],
        [
            Some(ACBusPowerSource::APUGenerator(2)),
            Some(ACBusPowerSource::ACBus(3)),
            Some(ACBusPowerSource::ACBus(2)),
            Some(ACBusPowerSource::APUGenerator(1)),
        ],
        [
            None,
            Some(ACBusPowerSource::ACBus(3)),
            Some(ACBusPowerSource::ACBus(2)),
            None,
        ],
        [
            None,
            Some(ACBusPowerSource::APUGenerator(2)),
            Some(ACBusPowerSource::APUGenerator(1)),
            None,
        ],
    ];

    fn new(context: &mut InitContext) -> Self {
        A380MainPowerSources {
            engine_gens: [1, 2, 3, 4].map(|i| EngineGenerator::new(context, i)),
            engine_generator_contactors: [1, 2, 3, 4]
                .map(|id| Contactor::new(context, &format!("990XU{id}"))),
            bus_tie_contactors: [1, 2, 3, 4, 5, 6]
                .map(|id| Contactor::new(context, &format!("980XU{id}"))),
            system_isolation_contactor: Contactor::new(context, "900XU"),
            apu_gen_contactors: [1, 2].map(|id| Contactor::new(context, &format!("990XS{id}"))),
            ext_pwr_contactors: [1, 2, 3, 4]
                .map(|id| Contactor::new(context, &format!("990XG{id}"))),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ext_pwrs: &[ExternalPowerSource; 4],
        overhead: &A380ElectricalOverheadPanel,
        apu: &impl AuxiliaryPowerUnitElectrical,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        engines: [&impl EngineCorrectedN2; 4],
    ) {
        for (gen, engine) in self.engine_gens.iter_mut().zip(engines) {
            gen.update(context, engine, overhead, engine_fire_push_buttons);
            electricity.supplied_by(gen);
        }

        electricity.supplied_by(apu);
        for ext_pwr in ext_pwrs {
            electricity.supplied_by(ext_pwr);
        }

        let powered_by = self.calc_ac_sources(ext_pwrs, overhead, apu);

        // Configure contactors
        for (i, (&power_source, (gen_contactor, ext_pwr_contactor))) in powered_by
            .iter()
            .zip(
                self.engine_generator_contactors
                    .iter_mut()
                    .zip(&mut self.ext_pwr_contactors),
            )
            .enumerate()
        {
            let bus_number = i + 1;
            gen_contactor.close_when(matches!(power_source, Some(ACBusPowerSource::Generator)));
            ext_pwr_contactor.close_when(matches!(
                power_source,
                Some(ACBusPowerSource::ExternalPower)
            ));
            let bus_not_self_powered = !matches!(
                power_source,
                Some(ACBusPowerSource::Generator) | Some(ACBusPowerSource::ExternalPower) | None
            );

            if bus_number == 1 || bus_number == 4 {
                let other_bus_is_powered_by_bus = powered_by
                    .iter()
                    .enumerate()
                    .filter(|(pi, _)| *pi != i)
                    .any(|(_, pb)| matches!(*pb, Some(ACBusPowerSource::ACBus(n)) if n == bus_number));

                self.bus_tie_contactors[i]
                    .close_when(bus_not_self_powered || other_bus_is_powered_by_bus);
            } else {
                let opposite_bus_number = i % 2 + 2;
                let powered_by_opposite_bus = matches!(
                    power_source,
                    Some(ACBusPowerSource::ACBus(n)) if n == opposite_bus_number
                );
                let other_bus_is_powered_by_bus = [powered_by[0], powered_by[3]]
                    .iter()
                    .any(|pb| matches!(*pb, Some(ACBusPowerSource::ACBus(n)) if n == bus_number));
                let opposite_bus_powered_by_bus = matches!(
                    powered_by[opposite_bus_number - 1],
                    Some(ACBusPowerSource::ACBus(n))if n ==  bus_number
                );

                self.bus_tie_contactors[i].close_when(
                    bus_not_self_powered && !powered_by_opposite_bus || other_bus_is_powered_by_bus,
                );
                self.bus_tie_contactors[i + 3].close_when(
                    overhead.bus_tie_is_auto()
                        && (bus_not_self_powered && powered_by_opposite_bus
                            || opposite_bus_powered_by_bus),
                );
            }
        }

        for (i, contactor) in self.apu_gen_contactors.iter_mut().enumerate() {
            let apu_gen = i + 1;
            contactor.close_when(
                powered_by.iter().any(
                    |pb| matches!(*pb, Some(ACBusPowerSource::APUGenerator(n)) if n == apu_gen),
                ),
            );
        }
        let close_isolation_contactor = overhead.bus_tie_is_auto()
            && (powered_by[..2]
                .iter()
                .any(|pb| matches!(*pb, Some(ACBusPowerSource::APUGenerator(2))))
                || powered_by[2..]
                    .iter()
                    .any(|pb| matches!(*pb, Some(ACBusPowerSource::APUGenerator(1))))
                || matches!(powered_by[0], Some(ACBusPowerSource::ACBus(4)))
                || matches!(powered_by[3], Some(ACBusPowerSource::ACBus(1))));
        self.system_isolation_contactor
            .close_when(close_isolation_contactor);

        for contactor in &self.apu_gen_contactors {
            electricity.flow(apu, contactor);
        }
        for (contactor, ext_pwr) in self.ext_pwr_contactors.iter().zip(ext_pwrs) {
            electricity.flow(ext_pwr, contactor);
        }

        for (gen, contactor) in self
            .engine_gens
            .iter()
            .zip(&self.engine_generator_contactors)
        {
            electricity.flow(gen, contactor);
        }

        for (apu_contactor, contactors) in self
            .apu_gen_contactors
            .iter()
            .zip(self.bus_tie_contactors.chunks_exact(2))
        {
            electricity.flow(apu_contactor, &self.system_isolation_contactor);
            electricity.flow(&contactors[0], &contactors[1]);
            for contactor in contactors {
                electricity.flow(apu_contactor, contactor);
                electricity.flow(&self.system_isolation_contactor, contactor);
            }
        }

        electricity.flow(&self.bus_tie_contactors[4], &self.bus_tie_contactors[5]);
    }

    fn power_ac_buses(&self, electricity: &mut Electricity, buses: &[ElectricalBus; 4]) {
        // First "power" contactors
        for (i, (bus_tie, bus)) in self.bus_tie_contactors.iter().zip(buses).enumerate() {
            electricity.flow(&self.engine_generator_contactors[i], bus);
            electricity.flow(&self.ext_pwr_contactors[i], bus);
            electricity.flow(bus_tie, bus);
        }
        electricity.flow(&self.bus_tie_contactors[4], &buses[1]);
        electricity.flow(&self.bus_tie_contactors[5], &buses[2]);
    }

    fn calc_ac_sources(
        &self,
        ext_pwrs: &[ExternalPowerSource; 4],
        overhead: &A380ElectricalOverheadPanel,
        apu: &impl AuxiliaryPowerUnitElectrical,
    ) -> [Option<ACBusPowerSource>; 4] {
        let apu_gen_available = [1, 2]
            .map(|id| overhead.apu_generator_is_on(id) && apu.output_within_normal_parameters());

        let gen_available: Vec<_> = self
            .engine_gens
            .iter()
            .map(|gen| gen.output_within_normal_parameters())
            .collect();
        let ext_pwr_available: Vec<_> = ext_pwrs
            .iter()
            .enumerate()
            .map(|(i, ext_pwr)| {
                overhead.external_power_is_on(i + 1) && ext_pwr.output_within_normal_parameters()
            })
            .collect();

        let priority_table = if ext_pwr_available.iter().all(|v| !v)
            && gen_available.iter().filter(|&a| *a).count() == 1
            && apu_gen_available.iter().filter(|&a| *a).count() == 1
            && !(gen_available[0] && apu_gen_available[0]
                || gen_available[3] && apu_gen_available[1])
        {
            &Self::SPECIAL_POWER_SOURCE_PRIORITIES
        } else {
            &Self::POWER_SOURCE_PRIORITIES
        };

        let mut powered_by = [None; 4];
        let mut can_power_other_bus = [false; 4];
        let mut apu_gen_supplying_count = [0; 2];
        for row in priority_table {
            let mut new_apu_gen_supplying_count = apu_gen_supplying_count;
            for (i, &source) in row.iter().enumerate() {
                if powered_by[i].is_none() {
                    let power_valid = match source {
                        Some(ACBusPowerSource::Generator) => gen_available[i],
                        Some(ACBusPowerSource::ExternalPower) => ext_pwr_available[i],
                        Some(ACBusPowerSource::APUGenerator(i)) => {
                            apu_gen_available[i - 1] && apu_gen_supplying_count[i - 1] < 2
                        }
                        Some(ACBusPowerSource::ACBus(i)) => can_power_other_bus[i - 1],
                        None => false,
                    };
                    if power_valid {
                        powered_by[i] = source;
                        can_power_other_bus[i] = matches!(
                            source,
                            Some(ACBusPowerSource::Generator)
                                | Some(ACBusPowerSource::ExternalPower)
                        );
                        if let Some(ACBusPowerSource::ACBus(i)) = source {
                            can_power_other_bus[i - 1] = false;
                        }
                        if let Some(ACBusPowerSource::APUGenerator(i)) = source {
                            new_apu_gen_supplying_count[i - 1] += 1;
                        }
                    }
                }
            }
            if powered_by.iter().all(|p| p.is_some()) {
                break;
            }
            apu_gen_supplying_count = new_apu_gen_supplying_count;
        }
        powered_by
    }

    pub fn gen_contactor_open(&self, number: usize) -> bool {
        self.engine_generator_contactors[number - 1].is_open()
    }
}
impl SimulationElement for A380MainPowerSources {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.engine_gens, visitor);
        accept_iterable!(self.engine_generator_contactors, visitor);
        accept_iterable!(self.bus_tie_contactors, visitor);
        accept_iterable!(self.apu_gen_contactors, visitor);
        accept_iterable!(self.ext_pwr_contactors, visitor);
        self.system_isolation_contactor.accept(visitor);

        visitor.visit(self);
    }
}

#[derive(Clone, Copy)]
enum ACBusPowerSource {
    Generator,
    ExternalPower,
    APUGenerator(usize),
    ACBus(usize),
}

pub(super) struct A380AcEssFeedContactors {
    ac_ess_feed_contactor_1: Contactor,
    ac_ess_feed_contactor_2: Contactor,
    ac_ess_feed_contactor_delay_logic_gate: DelayedTrueLogicGate,
}
impl A380AcEssFeedContactors {
    pub const AC_ESS_FEED_TO_AC_BUS_4_DELAY_IN_SECONDS: Duration = Duration::from_secs(3);

    fn new(context: &mut InitContext) -> Self {
        A380AcEssFeedContactors {
            ac_ess_feed_contactor_1: Contactor::new(context, "3XC1"),
            ac_ess_feed_contactor_2: Contactor::new(context, "3XC2"),
            ac_ess_feed_contactor_delay_logic_gate: DelayedTrueLogicGate::new(
                A380AcEssFeedContactors::AC_ESS_FEED_TO_AC_BUS_4_DELAY_IN_SECONDS,
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ac_bus_1: &ElectricalBus,
        ac_bus_4: &ElectricalBus,
        overhead: &A380ElectricalOverheadPanel,
    ) {
        self.ac_ess_feed_contactor_delay_logic_gate
            .update(context, !electricity.is_powered(ac_bus_1));

        self.ac_ess_feed_contactor_1.close_when(
            electricity.is_powered(ac_bus_1)
                && (!self.ac_ess_feed_contactor_delay_logic_gate.output()
                    && overhead.ac_ess_feed_is_normal()),
        );
        self.ac_ess_feed_contactor_2.close_when(
            electricity.is_powered(ac_bus_4)
                && (self.ac_ess_feed_contactor_delay_logic_gate.output()
                    || overhead.ac_ess_feed_is_altn()),
        );

        electricity.flow(ac_bus_1, &self.ac_ess_feed_contactor_1);
        electricity.flow(ac_bus_4, &self.ac_ess_feed_contactor_2);
    }

    fn power_400xp(&self, electricity: &mut Electricity, bus_400xp: &ElectricalBus) {
        electricity.flow(&self.ac_ess_feed_contactor_1, bus_400xp);
        electricity.flow(&self.ac_ess_feed_contactor_2, bus_400xp);
    }

    fn provides_power(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.ac_ess_feed_contactor_1)
            || electricity.is_powered(&self.ac_ess_feed_contactor_2)
    }
}
impl SimulationElement for A380AcEssFeedContactors {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ac_ess_feed_contactor_1.accept(visitor);
        self.ac_ess_feed_contactor_2.accept(visitor);

        visitor.visit(self);
    }
}
