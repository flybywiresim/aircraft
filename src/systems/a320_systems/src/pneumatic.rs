use crate::UpdateContext;
use systems::shared::{
    ControllerSignal, EngineCorrectedN1, MachNumber, PneumaticValve, PneumaticValveSignal,
};
use systems::simulation::{Read, Simulation};
use systems::{
    engine::Engine,
    hydraulic::Fluid,
    overhead::OnOffFaultPushButton,
    pneumatic::{DefaultPipe, DefaultValve, PneumaticContainer},
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
    fn new() -> Self {
        Self {
            bmcs: [
                BleedMonitoringComputer::new(1),
                BleedMonitoringComputer::new(2),
            ],
            engine_systems: [EngineBleedSystem::new(1), EngineBleedSystem::new(2)],
        }
    }

    fn update(&mut self, context: &UpdateContext, engines: [&impl EngineCorrectedN1; 2]) {
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
            engine_system.update(context, bmc, engines[engine_system.number - 1]);
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
    }
}

struct IPCompressionChamber {
    pipe: DefaultPipe,
    mach: MachNumber,
}
impl PneumaticContainer for IPCompressionChamber {
    fn pressure(&self) -> Pressure {
        self.pipe.pressure()
    }

    fn volume(&self) -> Volume {
        self.pipe.volume()
    }

    fn change_volume(&mut self, volume: Volume) {
        self.pipe.change_volume(volume);
    }
}
impl IPCompressionChamber {
    const N1_CONTRIBUTION_FACTOR: f64 = 0.5;
    const COMPRESSION_FACTOR: f64 = 5.;
    const GAMMA: f64 = 1.4; // Adiabatic index of dry air

    fn new() -> Self {
        Self {
            pipe: DefaultPipe::new(
                Volume::new::<cubic_meter>(1.),
                // TODO: This should really be more global
                Fluid::new(Pressure::new::<pascal>(142000.)),
                Pressure::new::<psi>(0.),
            ),
            mach: MachNumber::default(),
        }
    }

    fn update(&mut self, context: &UpdateContext, engine: &EngineCorrectedN1) {
        // Idea: Calculate what pressure would be realistic for this airspeed and altitude
        // I have done quite a bit of researching on what it would take to do a full gas turbine simulation, but it's just not feasable, so
        // we settle on this instead.
        let target_pressure =
            self.get_target_pressure(context.ambient_pressure(), self.mach, engine.corrected_n1());
        let delta_vol = self.vol_to_target(target_pressure);

        self.change_volume(delta_vol);
    }

    fn vol_to_target(&self, target_press: Pressure) -> Volume {
        (target_press - self.pressure()) * self.volume() / self.pipe.fluid().bulk_mod()
    }

    fn get_target_pressure(
        &self,
        ambient_pressure: Pressure,
        mach: MachNumber,
        n1: Ratio,
    ) -> Pressure {
        // TODO: Tune
        let n1_ratio = n1.get::<ratio>();

        // TODO: I know I'm probably shooting myself in the foot by actively avoiding using units, but I couldn't find another way
        let corrected_mach = mach.0
            + Self::N1_CONTRIBUTION_FACTOR * n1_ratio
                / (1. + mach.0 * Self::N1_CONTRIBUTION_FACTOR * n1_ratio);
        let total_pressure: Pressure = (Self::GAMMA + 1.) / 2. * ambient_pressure * corrected_mach;

        Self::COMPRESSION_FACTOR * total_pressure
    }
}
impl SimulationElement for IPCompressionChamber {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut systems::simulation::SimulatorReader) {
        self.mach = reader.read("AIRSPEED MACH");
    }
}

struct HPCompressionChamber {
    pipe: DefaultPipe,
    mach: MachNumber,
}
impl PneumaticContainer for HPCompressionChamber {
    fn pressure(&self) -> Pressure {
        self.pipe.pressure()
    }

    fn volume(&self) -> Volume {
        self.pipe.volume()
    }

    fn change_volume(&mut self, volume: Volume) {
        self.pipe.change_volume(volume);
    }
}

impl HPCompressionChamber {
    const N1_CONTRIBUTION_FACTOR: f64 = 0.5;
    const COMPRESSION_FACTOR: f64 = 10.;
    const GAMMA: f64 = 1.4; // Adiabatic index of dry air

    fn new() -> Self {
        Self {
            pipe: DefaultPipe::new(
                Volume::new::<cubic_meter>(1.),
                // TODO: This should really be more global
                Fluid::new(Pressure::new::<pascal>(142000.)),
                Pressure::new::<psi>(0.),
            ),
            mach: MachNumber::default(),
        }
    }

    fn update(&mut self, context: &UpdateContext, engine: &EngineCorrectedN1) {
        // Idea: Calculate what pressure would be realistic for this airspeed and altitude
        // I have done quite a bit of researching on what it would take to do a full gas turbine simulation, but it's just not feasable, so
        // we settle on this instead.
        let target_pressure =
            self.get_target_pressure(context.ambient_pressure(), self.mach, engine.corrected_n1());
        let delta_vol = self.vol_to_target(target_pressure);

        self.change_volume(delta_vol);
    }

    fn vol_to_target(&self, target_press: Pressure) -> Volume {
        (target_press - self.pressure()) * self.volume() / self.pipe.fluid().bulk_mod()
    }

    fn get_target_pressure(
        &self,
        ambient_pressure: Pressure,
        mach: MachNumber,
        n1: Ratio,
    ) -> Pressure {
        // TODO: Tune
        let n1_ratio = n1.get::<ratio>();

        // TODO: I know I'm probably shooting myself in the foot by actively avoiding using units, but I couldn't find another way
        let corrected_mach = mach.0
            + Self::N1_CONTRIBUTION_FACTOR * n1_ratio
                / (1. + mach.0 * Self::N1_CONTRIBUTION_FACTOR * n1_ratio);
        let total_pressure: Pressure = (Self::GAMMA + 1.) / 2. * ambient_pressure * corrected_mach;

        Self::COMPRESSION_FACTOR * total_pressure
    }
}
impl SimulationElement for HPCompressionChamber {
    fn read(&mut self, reader: &mut systems::simulation::SimulatorReader) {
        self.mach = reader.read("AIRSPEED MACH");
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
            Some(PneumaticValveSignal::close())
        } else {
            Some(PneumaticValveSignal::open())
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

    fn update(&mut self, context: &UpdateContext, bmc: &BleedMonitoringComputer) {
        self.upstream_pressure = bmc.ip_pressure();
    }
}

struct HPValveController {
    // Engine number
    number: usize,
    upstream_pressure: Pressure,
}
impl ControllerSignal<PneumaticValveSignal> for HPValveController {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        if self.upstream_pressure < Pressure::new::<psi>(Self::OPENING_PRESSURE_PSI) {
            Some(PneumaticValveSignal::close())
        } else {
            Some(PneumaticValveSignal::open())
        }
    }
}
impl HPValveController {
    // https://discord.com/channels/738864299392630914/755137986508882021/867145227042029578
    const OPENING_PRESSURE_PSI: f64 = 18.;

    fn new(number: usize) -> Self {
        Self {
            number,
            upstream_pressure: Pressure::new::<psi>(0.),
        }
    }

    fn update(&mut self, context: &UpdateContext, bmc: &BleedMonitoringComputer) {
        self.upstream_pressure = bmc.hp_pressure();
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

    fn update(&mut self, context: &UpdateContext, bmc: &BleedMonitoringComputer) {
        self.transfer_pressure = bmc.transfer_pressure(self.number);
        self.regulated_pressure = bmc.regulated_pressure(self.number);
    }
}

struct EngineBleedSystemData {
    // Engine number
    number: usize,
    // Pressure between IP/HP valves and the PRV
    transfer_pressure: Pressure,
    // Pressure after PRV
    regulated_pressure: Pressure,
}
impl EngineBleedSystemData {
    fn new(number: usize) -> Self {
        Self {
            number,
            transfer_pressure: Pressure::new::<psi>(0.),
            regulated_pressure: Pressure::new::<psi>(0.),
        }
    }
}

struct BleedMonitoringComputer {
    number: usize,
    engine_bleed_system_datas: [EngineBleedSystemData; 2],
}
impl BleedMonitoringComputer {
    fn new(number: usize) -> Self {
        Self {
            number,
            engine_bleed_system_datas: [
                EngineBleedSystemData::new(1),
                EngineBleedSystemData::new(2),
            ],
        }
    }

    fn hp_pressure(&self) -> Pressure {
        // TODO: use engine parameters
        Pressure::new::<psi>(40.)
    }

    fn ip_pressure(&self) -> Pressure {
        // TODO: use engine parameters
        Pressure::new::<psi>(20.)
    }

    fn transfer_pressure(&self, number: usize) -> Pressure {
        self.engine_bleed_system_datas[number - 1].transfer_pressure
    }

    fn regulated_pressure(&self, number: usize) -> Pressure {
        self.engine_bleed_system_datas[number - 1].regulated_pressure
    }

    fn update(&mut self, context: &UpdateContext, engines: &[EngineBleedSystem; 2]) {
        for engine in engines.iter() {
            self.update_engine_data(engine);
        }
    }

    fn update_engine_data(&mut self, engine: &EngineBleedSystem) {
        self.engine_bleed_system_datas[engine.number - 1].transfer_pressure =
            engine.transfer_pressure_pipe.pressure();
        self.engine_bleed_system_datas[engine.number - 1].regulated_pressure =
            engine.regulated_pressure_pipe.pressure();
    }
}

// TODO: Would it make sense to use the generics for traits here? e.g T: PneumaticCompressionChamber, U: PneumaticValve, etc.
struct EngineBleedSystem {
    number: usize,
    ip_compression_chamber: IPCompressionChamber,
    hp_compression_chamber: HPCompressionChamber,
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
            ip_compression_chamber: IPCompressionChamber::new(),
            hp_compression_chamber: HPCompressionChamber::new(),
            ip_valve: DefaultValve::new(Ratio::new::<percent>(0.)),
            hp_valve: DefaultValve::new(Ratio::new::<percent>(0.)),
            pr_valve: DefaultValve::new(Ratio::new::<percent>(0.)),
            ip_valve_controller: IPValveController::new(number),
            hp_valve_controller: HPValveController::new(number),
            pr_valve_controller: PRValveController::new(number),
            transfer_pressure_pipe: DefaultPipe::new(
                Volume::new::<cubic_meter>(1.), // TODO: Figure out volume to use
                Fluid::new(Pressure::new::<pascal>(142000.)), // https://en.wikipedia.org/wiki/Bulk_modulus#Selected_values
                Pressure::new::<psi>(0.),
            ),
            regulated_pressure_pipe: DefaultPipe::new(
                Volume::new::<cubic_meter>(1.), // TODO: Figure out volume to use
                Fluid::new(Pressure::new::<pascal>(142000.)), // https://en.wikipedia.org/wiki/Bulk_modulus#Selected_values
                Pressure::new::<psi>(0.),
            ),
        }
    }

    fn update<T: EngineCorrectedN1>(
        &mut self,
        context: &UpdateContext,
        bmc: &BleedMonitoringComputer,
        engine: &T,
    ) {
        // Update engines
        self.ip_compression_chamber.update(context, engine);
        self.hp_compression_chamber.update(context, engine);

        // Update controllers
        self.ip_valve_controller.update(context, bmc);
        self.hp_valve_controller.update(context, bmc);
        self.pr_valve_controller.update(context, bmc);

        // Update valves (open amount)
        self.ip_valve
            .update_open_amount(context, &self.ip_valve_controller);
        self.hp_valve
            .update_open_amount(context, &self.hp_valve_controller);
        self.pr_valve
            .update_open_amount(context, &self.pr_valve_controller);

        // Update valves (fluid movement)
        self.ip_valve.update_move_fluid(
            &mut self.ip_compression_chamber,
            &mut self.transfer_pressure_pipe,
        );
        self.hp_valve.update_move_fluid(
            &mut self.hp_compression_chamber,
            &mut self.transfer_pressure_pipe,
        );
        self.pr_valve.update_move_fluid(
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
        self.hp_compression_chamber.accept(visitor);
        self.ip_compression_chamber.accept(visitor);

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
        hydraulic::Fluid,
        pneumatic::{DefaultPipe, DefaultValve, PneumaticContainer},
        shared::MachNumber,
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, Write,
        },
    };

    use std::time::Duration;

    use uom::si::{
        length::foot, pressure::pascal, ratio::percent, velocity::knot, volume::cubic_meter,
    };

    struct TestEngine {
        corrected_n1: Ratio,
    }
    impl TestEngine {
        fn new(engine_corrected_n1: Ratio) -> Self {
            Self {
                corrected_n1: engine_corrected_n1,
            }
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.corrected_n1
        }
    }

    struct PneumaticTestAircraft {
        pneumatic: A320Pneumatic,
        engine_1: TestEngine,
        engine_2: TestEngine,
    }
    impl PneumaticTestAircraft {
        fn new() -> Self {
            Self {
                pneumatic: A320Pneumatic::new(),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
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

        fn set_mach_number(&mut self, mach: MachNumber) {
            self.write("AIRSPEED MACH", mach);
        }

        fn is_hp_valve_open(&self) -> bool {
            self.query(|a| a.pneumatic.engine_systems[0].hp_valve.is_open())
        }

        fn for_both_engine_systems<T: Fn(&EngineBleedSystem, &mut U) -> (), U>(
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

    #[test]
    fn exampe_test_hp_valve_open() {
        let test_bed = PneumaticTestBed::new();

        assert_eq!(test_bed.is_hp_valve_open(), false);
    }

    #[test]
    fn ip_pressure_stabilises() {
        let mut test_bed = PneumaticTestBed::new();

        test_bed.set_indicated_altitude(Length::new::<foot>(36000.));
        test_bed.set_mach_number(MachNumber(0.78));

        let mut pressures: [Pressure; 2] = [Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)];

        test_bed.run();
        test_bed.for_both_engine_systems(
            |sys, pressures| {
                pressures[sys.number - 1] = sys.ip_compression_chamber.pressure();
            },
            &mut pressures,
        );
        test_bed.run();
        test_bed.for_both_engine_systems(
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
        let mut test_bed = PneumaticTestBed::new();

        test_bed.set_indicated_altitude(Length::new::<foot>(36000.));
        test_bed.set_mach_number(MachNumber(0.78));

        let mut pressures: [Pressure; 2] = [Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)];

        // Set pressure according to conditions
        test_bed.run();

        // Save current pressure
        test_bed.for_both_engine_systems(
            |sys, pressures| {
                pressures[sys.number - 1] = sys.hp_compression_chamber.pressure();
            },
            &mut pressures,
        );

        test_bed.run();
        // Expect pressures not to have changed after update
        test_bed.for_both_engine_systems(
            |sys, pressures| {
                assert_eq!(
                    sys.hp_compression_chamber.pressure(),
                    pressures[sys.number - 1]
                )
            },
            &mut pressures,
        );
    }
}
