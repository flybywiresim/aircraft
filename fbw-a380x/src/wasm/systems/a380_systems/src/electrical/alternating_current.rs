use super::{
    A380AlternatingCurrentElectricalSystem, A380DirectCurrentElectricalSystem,
    A380ElectricalOverheadPanel,
};
use systems::accept_iterable;
use systems::shared::AdirsDiscreteOutputs;
use systems::{
    apu::ApuGenerator,
    electrical::{
        AlternatingCurrentElectricalSystem, Contactor, ElectricalBus, ElectricalElement,
        Electricity, EmergencyGenerator, ExternalPowerSource, TransformerRectifier,
        VariableFrequencyGenerator,
    },
    engine::Engine,
    shared::{AuxiliaryPowerUnitElectrical, ElectricalBusType, EngineFirePushButtons},
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};
use uom::si::{f64::Power, power::kilowatt};

pub(super) struct A380AlternatingCurrentElectrical {
    main_power_sources: A380MainPowerSources,
    ac_ess_feed_contactors: A380AcEssFeedContactors,
    ac_buses: [ElectricalBus; 4],
    ac_ess_bus: ElectricalBus,
    ac_emer_bus: ElectricalBus,
    ac_eha_bus: ElectricalBus,
    ac_gnd_flt_service_bus: ElectricalBus,
    // This is actually a 2-way switch but we simulate this with 2 contactors
    ac_emer_contactor: [Contactor; 2],
    eha_contactors: [Contactor; 2],
    tr_apu: TransformerRectifier,
    emergency_gen_contactor: Contactor,
    ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor: Contactor,
    ac_bus_3_to_tr_2_contactor: Contactor,
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
            ac_gnd_flt_service_bus: ElectricalBus::new(
                context,
                ElectricalBusType::AlternatingCurrentGndFltService,
            ),
            ac_emer_contactor: [1, 2].map(|i| Contactor::new(context, &format!("3XB.{i}"))),
            eha_contactors: ["911XN", "911XH"].map(|id| Contactor::new(context, id)),
            tr_apu: TransformerRectifier::new(context, 4),
            emergency_gen_contactor: Contactor::new(context, "5XE"),
            ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor: Contactor::new(context, "991PU6"),
            ac_bus_3_to_tr_2_contactor: Contactor::new(context, "991PU2"),
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
        engines: [&impl Engine; 4],
        adirs: &impl AdirsDiscreteOutputs,
    ) {
        self.main_power_sources.update(
            context,
            electricity,
            ext_pwrs,
            overhead,
            apu,
            engine_fire_push_buttons,
            engines,
            adirs,
        );

        self.main_power_sources
            .power_ac_buses(electricity, &self.ac_buses);
    }

    pub fn update(
        &mut self,
        electricity: &mut Electricity,
        overhead: &A380ElectricalOverheadPanel,
        ext_pwr: &ExternalPowerSource,
        emergency_generator: &EmergencyGenerator,
    ) {
        self.ac_ess_feed_contactors.update(
            electricity,
            &self.ac_buses[0],
            &self.ac_buses[3],
            overhead,
        );

        self.ac_ess_feed_contactors
            .power_400xp(electricity, &self.ac_ess_bus);

        electricity.flow(&self.ac_buses[3], &self.tr_apu);
        electricity.transform_in(&self.tr_apu);

        let emergency_configuration = !self.any_non_essential_bus_powered(electricity)
            && emergency_generator.output_within_normal_parameters();

        self.emergency_gen_contactor
            .close_when(emergency_configuration);
        electricity.supplied_by(emergency_generator);
        electricity.flow(emergency_generator, &self.emergency_gen_contactor);
        electricity.flow(&self.emergency_gen_contactor, &self.ac_ess_bus);
        electricity.flow(&self.ac_ess_bus, &self.ac_emer_contactor[0]);

        self.eha_contactors[0].close_when(self.ac_bus_powered(electricity, 3));
        electricity.flow(&self.ac_buses[2], &self.eha_contactors[0]);

        // TODO: Check behavior and architecture of ground service bus
        // On the real aircraft there is a button inside the galley which is taken into
        // account when determining whether to close this contactor or not.
        // As we're not building a galley simulator, for now we assume the button is ON.
        self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor
            .close_when(
                !self.ac_buses.iter().any(|b| electricity.is_powered(b))
                    && electricity.is_powered(ext_pwr),
            );
        self.ac_bus_3_to_tr_2_contactor
            .close_when(electricity.is_powered(&self.ac_buses[2]));

        electricity.flow(
            ext_pwr,
            &self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor,
        );
        electricity.flow(&self.ac_bus_3_to_tr_2_contactor, &self.ac_buses[2]);
        electricity.flow(
            &self.ac_bus_3_to_tr_2_contactor,
            &self.ac_gnd_flt_service_bus,
        );
        electricity.flow(
            &self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor,
            &self.ac_gnd_flt_service_bus,
        );

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

    pub fn gen_drive_connected(&self, number: usize) -> bool {
        self.main_power_sources.gen_drive_connected(number)
    }

    pub fn emergency_generator_contactor_is_closed(&self) -> bool {
        self.emergency_gen_contactor.is_closed()
    }

    pub fn ac_emer_bus_is_powered(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.ac_emer_bus)
    }
}
impl A380AlternatingCurrentElectricalSystem for A380AlternatingCurrentElectrical {
    fn ac_bus_powered(&self, electricity: &Electricity, number: usize) -> bool {
        electricity.is_powered(&self.ac_buses[number - 1])
    }

    fn ac_ess_bus_powered(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.ac_ess_bus)
    }

    fn tr_apu(&self) -> &TransformerRectifier {
        &self.tr_apu
    }

    fn ground_servicing_active(&self) -> bool {
        self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor
            .is_closed()
    }

    fn power_tr_1(&self, electricity: &mut Electricity, tr: &impl ElectricalElement) {
        electricity.flow(&self.ac_buses[1], tr);
    }

    fn power_tr_2(&self, electricity: &mut Electricity, tr: &impl ElectricalElement) {
        electricity.flow(&self.ac_bus_3_to_tr_2_contactor, tr);
        electricity.flow(
            &self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor,
            tr,
        );
    }

    fn power_tr_ess(&self, electricity: &mut Electricity, tr: &impl ElectricalElement) {
        electricity.flow(&self.ac_ess_bus, tr);
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
        self.tr_apu.accept(visitor);

        accept_iterable!(self.ac_emer_contactor, visitor);
        accept_iterable!(self.eha_contactors, visitor);
        self.emergency_gen_contactor.accept(visitor);

        accept_iterable!(self.ac_buses, visitor);
        self.ac_ess_bus.accept(visitor);
        self.ac_emer_bus.accept(visitor);
        self.ac_eha_bus.accept(visitor);

        self.ac_bus_3_to_tr_2_contactor.accept(visitor);
        self.ext_pwr_to_ac_gnd_flt_service_bus_and_tr_2_contactor
            .accept(visitor);
        self.ac_gnd_flt_service_bus.accept(visitor);

        visitor.visit(self);
    }
}

struct A380MainPowerSources {
    engine_gens: [VariableFrequencyGenerator; 4],
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
            engine_gens: [1, 2, 3, 4].map(|i| {
                VariableFrequencyGenerator::new(
                    context,
                    i,
                    Power::new::<kilowatt>(150.),
                    360.0..=800.0,
                )
            }),
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
        engines: [&impl Engine; 4],
        adirs: &impl AdirsDiscreteOutputs,
    ) {
        for (gen, engine) in self.engine_gens.iter_mut().zip(engines) {
            gen.update(context, engine, overhead, engine_fire_push_buttons);
            electricity.supplied_by(gen);
        }

        for i in 1..=2 {
            electricity.supplied_by(apu.generator(i));
        }

        for ext_pwr in ext_pwrs {
            electricity.supplied_by(ext_pwr);
        }

        let powered_by = self.calc_ac_sources(ext_pwrs, overhead, apu, adirs);

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
            electricity.flow(apu.generator(apu_gen), contactor);
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
        adirs: &impl AdirsDiscreteOutputs,
    ) -> [Option<ACBusPowerSource>; 4] {
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

        let apu_gen_available = [1, 2].map(|id| {
            overhead.apu_generator_is_on(id) && apu.generator(id).output_within_normal_parameters()
        });

        let in_flight = adirs.low_speed_warning_1(1) || adirs.low_speed_warning_1(3);
        let apu_gen_available = if !in_flight {
            apu_gen_available
        } else {
            let left_gens = gen_available[0] as u32 + gen_available[1] as u32;
            let right_gens = gen_available[2] as u32 + gen_available[3] as u32;
            [
                apu_gen_available[0] && (left_gens <= right_gens || !apu_gen_available[1]),
                apu_gen_available[1] && (left_gens > right_gens || !apu_gen_available[0]),
            ]
        };

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

    fn gen_drive_connected(&self, number: usize) -> bool {
        self.engine_gens[number - 1].is_drive_connected()
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
}
impl A380AcEssFeedContactors {
    fn new(context: &mut InitContext) -> Self {
        A380AcEssFeedContactors {
            ac_ess_feed_contactor_1: Contactor::new(context, "3XC1"),
            ac_ess_feed_contactor_2: Contactor::new(context, "3XC2"),
        }
    }

    fn update(
        &mut self,
        electricity: &mut Electricity,
        ac_bus_1: &ElectricalBus,
        ac_bus_4: &ElectricalBus,
        overhead: &A380ElectricalOverheadPanel,
    ) {
        let ac_bus_1_powered = electricity.is_powered(ac_bus_1);

        self.ac_ess_feed_contactor_1.close_when(
            electricity.is_powered(ac_bus_1)
                && (ac_bus_1_powered && overhead.ac_ess_feed_is_normal()),
        );
        self.ac_ess_feed_contactor_2.close_when(
            electricity.is_powered(ac_bus_4)
                && (!ac_bus_1_powered || overhead.ac_ess_feed_is_altn()),
        );

        electricity.flow(ac_bus_1, &self.ac_ess_feed_contactor_1);
        electricity.flow(ac_bus_4, &self.ac_ess_feed_contactor_2);
    }

    fn power_400xp(&self, electricity: &mut Electricity, bus_400xp: &ElectricalBus) {
        electricity.flow(&self.ac_ess_feed_contactor_1, bus_400xp);
        electricity.flow(&self.ac_ess_feed_contactor_2, bus_400xp);
    }
}
impl SimulationElement for A380AcEssFeedContactors {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ac_ess_feed_contactor_1.accept(visitor);
        self.ac_ess_feed_contactor_2.accept(visitor);

        visitor.visit(self);
    }
}
