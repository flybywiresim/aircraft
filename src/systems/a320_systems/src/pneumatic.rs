use crate::UpdateContext;
use systems::overhead::PressSingleSignalButton;
use systems::shared::{
    ControllerSignal, EngineCorrectedN1, EngineCorrectedN2, MachNumber, PneumaticValve,
    PneumaticValveSignal,
};
use systems::simulation::{Read, Simulation};
use systems::{
    engine::Engine,
    hydraulic::Fluid,
    overhead::OnOffFaultPushButton,
    pneumatic::{
        CompressionChamber, DefaultPipe, DefaultValve, EngineCompressionChamberController,
        PneumaticContainer,
    },
    simulation::{SimulationElement, SimulationElementVisitor},
};
use uom::num_traits::sign;
use uom::si::velocity::meter_per_second;
use uom::si::{
    area::square_meter,
    f64::*,
    pressure::{pascal, psi},
    ratio::{percent, ratio},
    volume::cubic_meter,
};

pub struct A320Pneumatic {
    bmcs: [BleedMonitoringComputer; 2],
    engine_systems: [EngineBleedSystem; 2],
}
impl A320Pneumatic {
    pub fn new() -> Self {
        Self {
            bmcs: [
                BleedMonitoringComputer::new(1),
                BleedMonitoringComputer::new(2),
            ],
            engine_systems: [EngineBleedSystem::new(1), EngineBleedSystem::new(2)],
        }
    }

    // TODO: Extract T to it's own type since it's used a lot.
    pub fn update<T: EngineCorrectedN1 + EngineCorrectedN2>(
        &mut self,
        context: &UpdateContext,
        engines: [&T; 2],
    ) {
        // Update BMC
        for bmc in self.bmcs.iter_mut() {
            bmc.update(context, &self.engine_systems);
        }

        // Choose appropriate BMC
        // TODO: Use some logic handling failures
        let bmc = &self.bmcs[0];

        // Update engine systems
        for engine_system in self.engine_systems.iter_mut() {
            // TODO: This index shift is not the prettiest
            engine_system.update(
                context,
                bmc.engine_data(engine_system.number),
                engines[engine_system.number - 1],
            );
        }

        // Update APU stuff
    }
}
impl SimulationElement for A320Pneumatic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        for engine_system in self.engine_systems.iter_mut() {
            engine_system.accept(visitor);
        }

        visitor.visit(self);
    }
}

struct IPValveController {
    // Engine number
    number: usize,
    upstream_pressure: Pressure,
    downstream_pressure: Pressure,
}
impl ControllerSignal<PneumaticValveSignal> for IPValveController {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        if self.upstream_pressure > self.downstream_pressure {
            Some(PneumaticValveSignal::open())
        } else {
            Some(PneumaticValveSignal::close())
        }
    }
}
impl IPValveController {
    fn new(number: usize) -> Self {
        Self {
            number,
            downstream_pressure: Pressure::new::<psi>(0.),
            upstream_pressure: Pressure::new::<psi>(0.),
        }
    }

    fn update(&mut self, context: &UpdateContext, engine_data: &impl EngineBleedDataProvider) {
        self.upstream_pressure = engine_data.ip_pressure();
    }
}

struct HPValveController {
    // Engine number
    number: usize,
    upstream_pressure: Pressure,
    previous_downstream_pressure: Pressure,
    relative_downstream_pressure_change_rate: Ratio,
    current_open_amount: Ratio,
    is_prv_open: bool,
}
impl ControllerSignal<PneumaticValveSignal> for HPValveController {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        // Mechanically closed
        if self.upstream_pressure < Pressure::new::<psi>(Self::OPENING_PRESSURE_PSI)
            || self.upstream_pressure > Pressure::new::<psi>(Self::CLOSING_PRESSURE_PSI)
            || !self.is_prv_open
        {
            return Some(PneumaticValveSignal::close());
        }

        Some(PneumaticValveSignal::new(
            self.calculate_open_amount_from_pressure_change()
                .max(Ratio::new::<percent>(0.))
                .min(Ratio::new::<percent>(100.)),
        ))
    }
}
impl HPValveController {
    // https://discord.com/channels/738864299392630914/755137986508882021/867145227042029578
    const OPENING_PRESSURE_PSI: f64 = 18.;
    const CLOSING_PRESSURE_PSI: f64 = 65.;

    fn new(number: usize) -> Self {
        Self {
            number,
            upstream_pressure: Pressure::new::<psi>(0.),
            previous_downstream_pressure: Pressure::new::<psi>(0.),
            relative_downstream_pressure_change_rate: Ratio::new::<percent>(0.),
            current_open_amount: Ratio::new::<percent>(0.),
            is_prv_open: false,
        }
    }

    fn calculate_open_amount_from_pressure_change(&self) -> Ratio {
        // TODO: Tune this
        let pressure_change_response: f64 = -0.5;

        self.current_open_amount
            + pressure_change_response * self.relative_downstream_pressure_change_rate
    }

    fn update(&mut self, context: &UpdateContext, engine_data: &impl EngineBleedDataProvider) {
        self.upstream_pressure = engine_data.hp_pressure();
        self.relative_downstream_pressure_change_rate = (engine_data.transfer_pressure()
            - self.previous_downstream_pressure)
            / self.previous_downstream_pressure
            / context.delta_as_secs_f64();
        self.previous_downstream_pressure = engine_data.transfer_pressure();

        self.current_open_amount = engine_data.hpv_open_amount();
        self.is_prv_open = engine_data.is_prv_open();
    }
}

struct PRValveController {
    // Engine number
    number: usize,
    transfer_pressure: Pressure,
    regulated_pressure: Pressure,
}
impl ControllerSignal<PneumaticValveSignal> for PRValveController {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        // TODO: Use some more sophisticated regulation

        if self.transfer_pressure < Pressure::new::<psi>(Self::OPENING_PRESSURE_PSI) {
            Some(PneumaticValveSignal::close())
        } else if self.regulated_pressure > Pressure::new::<psi>(Self::TARGET_PRESSURE_PSI) {
            Some(PneumaticValveSignal::close())
        } else if self.regulated_pressure < Pressure::new::<psi>(Self::TARGET_PRESSURE_PSI) {
            Some(PneumaticValveSignal::open())
        } else {
            Some(PneumaticValveSignal::close())
        }
    }
}
impl PRValveController {
    // https://discord.com/channels/738864299392630914/755137986508882021/867144858992771092
    const OPENING_PRESSURE_PSI: f64 = 15.;

    // https://discord.com/channels/738864299392630914/755137986508882021/867131639461183489
    const TARGET_PRESSURE_PSI: f64 = 46.;

    fn new(number: usize) -> Self {
        Self {
            number,
            transfer_pressure: Pressure::new::<psi>(0.),
            regulated_pressure: Pressure::new::<psi>(0.),
        }
    }

    fn update(&mut self, context: &UpdateContext, engine_data: &impl EngineBleedDataProvider) {
        self.transfer_pressure = engine_data.transfer_pressure();
        self.regulated_pressure = engine_data.regulated_pressure();
    }
}

#[derive(Debug)]
struct EngineBleedSystemData {
    // Engine number
    number: usize,
    // Pressure between IP/HP valves and the PRV
    transfer_pressure: Pressure,
    // Pressure after PRV
    regulated_pressure: Pressure,
    is_prv_open: bool,
    hpv_open_amount: Ratio,
    // IP stage
    ip_compressor_pressure: Pressure,
    // HP stage
    hp_compressor_pressure: Pressure,
}
impl EngineBleedSystemData {
    fn new(number: usize) -> Self {
        Self {
            number,
            transfer_pressure: Pressure::new::<psi>(0.),
            regulated_pressure: Pressure::new::<psi>(0.),
            is_prv_open: false,
            hpv_open_amount: Ratio::new::<percent>(0.),
            ip_compressor_pressure: Pressure::new::<psi>(0.),
            hp_compressor_pressure: Pressure::new::<psi>(0.),
        }
    }

    fn update(&mut self, bleed_system: &EngineBleedSystem) {
        self.ip_compressor_pressure = bleed_system.ip_compression_chamber.pressure();
        self.hp_compressor_pressure = bleed_system.hp_compression_chamber.pressure();

        self.transfer_pressure = bleed_system.transfer_pressure_pipe.pressure();
        self.regulated_pressure = bleed_system.regulated_pressure_pipe.pressure();

        self.is_prv_open = bleed_system.pr_valve.is_open();
        self.hpv_open_amount = bleed_system.hp_valve.open_amount()
    }
}
impl EngineBleedDataProvider for EngineBleedSystemData {
    fn transfer_pressure(&self) -> Pressure {
        self.transfer_pressure
    }

    fn regulated_pressure(&self) -> Pressure {
        self.regulated_pressure
    }

    fn is_prv_open(&self) -> bool {
        self.is_prv_open
    }

    fn hpv_open_amount(&self) -> Ratio {
        self.hpv_open_amount
    }

    fn ip_pressure(&self) -> Pressure {
        self.ip_compressor_pressure
    }

    fn hp_pressure(&self) -> Pressure {
        self.hp_compressor_pressure
    }
}
trait EngineBleedDataProvider {
    fn transfer_pressure(&self) -> Pressure;
    fn regulated_pressure(&self) -> Pressure;
    fn is_prv_open(&self) -> bool;
    fn hpv_open_amount(&self) -> Ratio;
    fn ip_pressure(&self) -> Pressure;
    fn hp_pressure(&self) -> Pressure;
}

struct BleedMonitoringComputer {
    number: usize,
    engine_bleed_systems_data: [EngineBleedSystemData; 2],
}
impl BleedMonitoringComputer {
    fn new(number: usize) -> Self {
        Self {
            number,
            engine_bleed_systems_data: [
                EngineBleedSystemData::new(1),
                EngineBleedSystemData::new(2),
            ],
        }
    }

    fn engine_data(&self, number: usize) -> &impl EngineBleedDataProvider {
        &self.engine_bleed_systems_data[number - 1]
    }

    fn update(&mut self, context: &UpdateContext, engine_bleed_systems: &[EngineBleedSystem; 2]) {
        for engine_bleed_system in engine_bleed_systems.iter() {
            self.engine_bleed_systems_data[engine_bleed_system.number - 1]
                .update(engine_bleed_system);
        }
    }
}

// TODO: Would it make sense to use the generics for traits here? e.g T: PneumaticCompressionChamber, U: PneumaticValve, etc.
struct EngineBleedSystem {
    number: usize,
    ip_compression_chamber_controller: EngineCompressionChamberController,
    hp_compression_chamber_controller: EngineCompressionChamberController,
    ip_compression_chamber: CompressionChamber,
    hp_compression_chamber: CompressionChamber,
    ip_valve: DefaultValve,
    hp_valve: DefaultValve,
    pr_valve: DefaultValve,
    hp_valve_controller: HPValveController,
    ip_valve_controller: IPValveController,
    pr_valve_controller: PRValveController,
    transfer_pressure_pipe: DefaultPipe,
    regulated_pressure_pipe: DefaultPipe,
}
impl EngineBleedSystem {
    fn new(number: usize) -> Self {
        Self {
            number,
            ip_compression_chamber_controller: EngineCompressionChamberController::new(0.5, 0., 2.),
            hp_compression_chamber_controller: EngineCompressionChamberController::new(
                0.5, 0.5, 3.,
            ),
            ip_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(1.)),
            hp_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(1.)),
            ip_valve: DefaultValve::new(Ratio::new::<percent>(0.)),
            hp_valve: DefaultValve::new(Ratio::new::<percent>(0.)),
            pr_valve: DefaultValve::new(Ratio::new::<percent>(0.)),
            ip_valve_controller: IPValveController::new(number),
            hp_valve_controller: HPValveController::new(number),
            pr_valve_controller: PRValveController::new(number),
            transfer_pressure_pipe: DefaultPipe::new(
                Volume::new::<cubic_meter>(1.), // TODO: Figure out volume to use
                Fluid::new(Pressure::new::<pascal>(142000.)), // https://en.wikipedia.org/wiki/Bulk_modulus#Selected_values
                Pressure::new::<psi>(14.7),
            ),
            regulated_pressure_pipe: DefaultPipe::new(
                Volume::new::<cubic_meter>(1.), // TODO: Figure out volume to use
                Fluid::new(Pressure::new::<pascal>(142000.)), // https://en.wikipedia.org/wiki/Bulk_modulus#Selected_values
                Pressure::new::<psi>(14.7),
            ),
        }
    }

    fn update<T: EngineCorrectedN1 + EngineCorrectedN2>(
        &mut self,
        context: &UpdateContext,
        bleed_data: &impl EngineBleedDataProvider,
        engine: &T,
    ) {
        // Update engines
        self.ip_compression_chamber_controller
            .update(context, engine);
        self.hp_compression_chamber_controller
            .update(context, engine);

        self.ip_compression_chamber
            .update(&self.ip_compression_chamber_controller);
        self.hp_compression_chamber
            .update(&self.hp_compression_chamber_controller);

        // Update controllers
        self.ip_valve_controller.update(context, bleed_data);
        self.hp_valve_controller.update(context, bleed_data);
        self.pr_valve_controller.update(context, bleed_data);

        // Update valves (open amount)
        self.ip_valve
            .update_open_amount(context, &self.ip_valve_controller);
        self.hp_valve
            .update_open_amount(context, &self.hp_valve_controller);
        self.pr_valve
            .update_open_amount(context, &self.pr_valve_controller);

        // Update valves (fluid movement)
        self.ip_valve.update_move_fluid(
            context,
            &mut self.ip_compression_chamber,
            &mut self.transfer_pressure_pipe,
        );
        self.hp_valve.update_move_fluid(
            context,
            &mut self.hp_compression_chamber,
            &mut self.transfer_pressure_pipe,
        );
        self.pr_valve.update_move_fluid(
            context,
            &mut self.transfer_pressure_pipe,
            &mut self.regulated_pressure_pipe,
        );
    }
}
impl SimulationElement for EngineBleedSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        self.ip_compression_chamber_controller.accept(visitor);
        self.hp_compression_chamber_controller.accept(visitor);

        visitor.visit(self);
    }
}

pub struct A320PneumaticOverheadPanel {
    apu_bleed: OnOffFaultPushButton,
}
impl A320PneumaticOverheadPanel {
    pub fn new() -> Self {
        A320PneumaticOverheadPanel {
            apu_bleed: OnOffFaultPushButton::new_on("PNEU_APU_BLEED"),
        }
    }

    pub fn apu_bleed_is_on(&self) -> bool {
        self.apu_bleed.is_on()
    }
}
impl SimulationElement for A320PneumaticOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu_bleed.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use systems::{
        engine::leap_engine::LeapEngine,
        hydraulic::Fluid,
        pneumatic::{DefaultPipe, DefaultValve, PneumaticContainer},
        shared::{MachNumber, ISA},
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, Write,
        },
    };

    use std::{fs::File, io::prelude::*, time::Duration};

    use uom::si::{
        acceleration::foot_per_second_squared, length::foot, pressure::pascal, ratio::percent,
        thermodynamic_temperature::degree_celsius, velocity::knot, volume::cubic_meter,
    };

    struct PneumaticTestAircraft {
        pneumatic: A320Pneumatic,
        engine_1: LeapEngine,
        engine_2: LeapEngine,
    }
    impl PneumaticTestAircraft {
        fn new() -> Self {
            Self {
                pneumatic: A320Pneumatic::new(),
                engine_1: LeapEngine::new(1),
                engine_2: LeapEngine::new(2),
            }
        }
    }
    impl Aircraft for PneumaticTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pneumatic
                .update(context, [&self.engine_1, &self.engine_2]);
        }
    }
    impl SimulationElement for PneumaticTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
        where
            Self: Sized,
        {
            self.pneumatic.accept(visitor);
            self.engine_1.accept(visitor);
            self.engine_2.accept(visitor);

            visitor.visit(self);
        }
    }
    struct PneumaticTestBed {
        test_bed: SimulationTestBed<PneumaticTestAircraft>,
    }
    impl TestBed for PneumaticTestBed {
        type Aircraft = PneumaticTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<PneumaticTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<PneumaticTestAircraft> {
            &mut self.test_bed
        }
    }
    impl PneumaticTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::<PneumaticTestAircraft>::new(|_| {
                    PneumaticTestAircraft::new()
                }),
            }
        }

        fn mach_number(mut self, mach: MachNumber) -> Self {
            self.write("AIRSPEED MACH", mach);

            self
        }

        fn in_isa_atmosphere(mut self, altitude: Length) -> Self {
            self.set_ambient_pressure(ISA::pressure_at_altitude(altitude));
            self.set_ambient_temperature(ISA::temperature_at_altitude(altitude));

            self
        }

        fn idle_eng1(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:1", true);
            self.write("ENGINE_N2:1", 55.);

            self
        }

        fn idle_eng2(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:2", true);
            self.write("ENGINE_N2:2", 55.);

            self
        }

        fn stop_eng1(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:1", false);
            self.write("ENGINE_N2:1", 0.);

            self
        }

        fn stop_eng2(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:2", false);
            self.write("ENGINE_N2:2", 0.);

            self
        }

        fn corrected_n1(mut self, corrected_n1: Ratio) -> Self {
            self.write("TURB ENG CORRECTED N1:1", corrected_n1);
            self.write("TURB ENG CORRECTED N1:2", corrected_n1);

            self
        }

        fn for_both_engine_systems<T: Fn(&EngineBleedSystem) -> ()>(&self, func: T) {
            self.query(|a| a.pneumatic.engine_systems.iter().for_each(|sys| func(sys)));
        }

        fn for_both_engine_systems_with_capture<T: Fn(&EngineBleedSystem, &mut U) -> (), U>(
            &self,
            func: T,
            captured_variables: &mut U,
        ) {
            self.test_bed().query(|a| {
                a.pneumatic
                    .engine_systems
                    .iter()
                    .for_each(|sys| func(sys, captured_variables))
            });
        }
    }

    fn test_bed() -> PneumaticTestBed {
        PneumaticTestBed::new()
    }

    fn test_bed_with() -> PneumaticTestBed {
        test_bed()
    }

    // Just a way for me to plot some graphs
    #[test]
    fn test() {
        let mut test_bed = test_bed_with()
            .mach_number(MachNumber(0.))
            .in_isa_atmosphere(Length::new::<foot>(0.))
            .idle_eng1()
            .idle_eng2()
            .corrected_n1(Ratio::new::<percent>(20.));

        let mut hps = Vec::new();
        let mut ips = Vec::new();
        let mut c2s = Vec::new();
        let mut c1s = Vec::new();
        let mut hpv_open = Vec::new();
        let mut prv_open = Vec::new();

        for i in 1..100 {
            test_bed.run_with_delta(Duration::from_millis(100));

            hps.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .hp_compression_chamber
                    .pressure()
                    .get::<psi>()
            }));

            ips.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .ip_compression_chamber
                    .pressure()
                    .get::<psi>()
            }));

            c2s.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .transfer_pressure_pipe
                    .pressure()
                    .get::<psi>()
            }));

            c1s.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .regulated_pressure_pipe
                    .pressure()
                    .get::<psi>()
            }));

            hpv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .hp_valve
                    .open_amount()
                    .get::<ratio>()
                    * 20.
            }));

            prv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .pr_valve
                    .open_amount()
                    .get::<ratio>()
                    * 20.
            }));
        }

        // If anyone is wondering, I am using python to plot pressure curves. This will be removed once the model is complete.
        let data = vec![hps, ips, c2s, c1s, hpv_open, prv_open];
        let mut file = File::create("DO NOT COMMIT.txt").expect("Could not create file");

        use std::io::Write;

        writeln!(file, "{:?}", data).expect("Could not write file");
    }

    #[test]
    fn ip_pressure_stabilises() {
        let mut test_bed = test_bed_with().mach_number(MachNumber(0.78));

        test_bed.set_indicated_altitude(Length::new::<foot>(36000.));
        let mut pressures: [Pressure; 2] = [Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)];

        test_bed.run();
        test_bed.for_both_engine_systems_with_capture(
            |sys, pressures| {
                pressures[sys.number - 1] = sys.ip_compression_chamber.pressure();
            },
            &mut pressures,
        );
        test_bed.run();
        test_bed.for_both_engine_systems_with_capture(
            |sys, pressures| {
                assert_eq!(
                    sys.ip_compression_chamber.pressure(),
                    pressures[sys.number - 1]
                )
            },
            &mut pressures,
        );
    }

    #[test]
    fn hp_pressure_stabilises() {
        let mut test_bed = test_bed_with().mach_number(MachNumber(0.78));

        test_bed.set_indicated_altitude(Length::new::<foot>(36000.));

        let mut pressures: [Pressure; 2] = [Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)];

        // Set pressure according to conditions
        test_bed.run();

        // Save current pressure
        test_bed.for_both_engine_systems_with_capture(
            |sys, pressures| {
                pressures[sys.number - 1] = sys.hp_compression_chamber.pressure();
            },
            &mut pressures,
        );

        println!("{:#?}", pressures);

        test_bed.run_with_delta(Duration::from_secs(10));
        // Expect pressures not to have changed after update
        test_bed.for_both_engine_systems_with_capture(
            |sys, pressures| {
                println!("{:#?}", sys.hp_compression_chamber.pressure());

                assert_eq!(
                    sys.hp_compression_chamber.pressure(),
                    pressures[sys.number - 1]
                )
            },
            &mut pressures,
        );
    }

    #[test]
    fn cold_dark_valves_closed() {
        let mut test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .in_isa_atmosphere(Length::new::<foot>(0.));

        test_bed.for_both_engine_systems(|sys| assert!(!sys.pr_valve.is_open()));
        test_bed.for_both_engine_systems(|sys| assert!(!sys.hp_valve.is_open()));
    }

    #[test]
    fn idle() {
        let altitude = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng1()
            .corrected_n1(Ratio::new::<ratio>(0.2))
            .in_isa_atmosphere(Length::new::<foot>(0.));

        test_bed.run();
        test_bed.run();

        test_bed.for_both_engine_systems(|sys| {
            assert!(sys.regulated_pressure_pipe.pressure() > ISA::pressure_at_altitude(altitude))
        });
        // test_bed.for_both_engine_systems(|sys| assert!(sys.hp_valve.is_open()));
    }

    #[test]
    fn hp_pressure_higher_than_ip_pressure() {
        let altitude = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .mach_number(MachNumber(0.))
            .idle_eng1()
            .idle_eng1()
            .corrected_n1(Ratio::new::<ratio>(0.2))
            .in_isa_atmosphere(altitude);

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(50));

        test_bed.for_both_engine_systems(|sys| {
            assert!(sys.ip_compression_chamber.pressure() > ISA::pressure_at_altitude(altitude));
            assert!(sys.hp_compression_chamber.pressure() > ISA::pressure_at_altitude(altitude));
            assert!(sys.hp_compression_chamber.pressure() > sys.ip_compression_chamber.pressure())
        });
        // test_bed.for_both_engine_systems(|sys| assert!(sys.hp_valve.is_open()));
    }
}
