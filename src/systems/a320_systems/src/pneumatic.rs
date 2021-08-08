use crate::UpdateContext;

use uom::si::{
    f64::*,
    pressure::{pascal, psi},
    ratio::{percent, ratio},
    volume::cubic_meter,
    volume_rate::cubic_meter_per_second,
};

use systems::{
    hydraulic::Fluid,
    overhead::{AutoOffFaultPushButton, OnOffFaultPushButton},
    pneumatic::{
        BleedAirValveState, CompressionChamber, ConstantConsumerController,
        CrossBleedValveSelectorKnob, CrossBleedValveSelectorMode, DefaultConsumer, DefaultPipe,
        DefaultValve, EngineCompressionChamberController, PneumaticContainer,
    },
    shared::{
        ControllerSignal, EngineCorrectedN1, EngineCorrectedN2, EngineFirePushButtons,
        PneumaticValve, PneumaticValveSignal,
    },
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter, Write,
    },
};

use pid::Pid;

pub struct A320Pneumatic {
    bmcs: [BleedMonitoringComputer; 2],
    engine_systems: [EngineBleedSystem; 2],
    cross_bleed_valve_controller: CrossBleedValveController,
    cross_bleed_valve: DefaultValve,
}
impl A320Pneumatic {
    pub fn new() -> Self {
        Self {
            bmcs: [
                BleedMonitoringComputer::new(1),
                BleedMonitoringComputer::new(2),
            ],
            engine_systems: [EngineBleedSystem::new(1), EngineBleedSystem::new(2)],
            cross_bleed_valve: DefaultValve::new_closed(),
            cross_bleed_valve_controller: CrossBleedValveController::new(),
        }
    }

    // TODO: Extract T to it's own type since it's used a lot.
    pub fn update<T: EngineCorrectedN1 + EngineCorrectedN2>(
        &mut self,
        context: &UpdateContext,
        engines: [&T; 2],
        apu_bleed_valve_is_open: bool,
        overhead_panel: &A320PneumaticOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
    ) {
        // TODO: Handling of the engine fire and engine bleed pushbuttons is too convoluted. I just need to get both signals to the respective controllers. Not sure if they should really be passed through the BMC.

        // Update BMC
        for bmc in self.bmcs.iter_mut() {
            bmc.update(
                context,
                &self.engine_systems,
                apu_bleed_valve_is_open,
                overhead_panel,
                engine_fire_push_buttons,
            );
        }

        // Choose appropriate BMC
        // TODO: Use some logic handling failures
        let bmc = &self.bmcs[0];

        // Update engine systems
        for engine_system in self.engine_systems.iter_mut() {
            engine_system.update(
                context,
                bmc.engine_data(engine_system.number),
                // TODO: This index shift is not the prettiest
                engines[engine_system.number - 1],
            );
        }

        // Update cross bleed
        self.cross_bleed_valve_controller
            .update(bmc, overhead_panel);
        self.cross_bleed_valve
            .update_open_amount(context, &self.cross_bleed_valve_controller);

        // TODO: I'm sure there's a better way to do this
        let (left, right) = self.engine_systems.split_at_mut(1);
        self.cross_bleed_valve
            .update_move_fluid(context, &mut left[0], &mut right[0])

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

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("PNEU_XBLEED_VALVE_OPEN", self.cross_bleed_valve.is_open());
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
        if (self.downstream_pressure - self.upstream_pressure)
            > Pressure::new::<pascal>(Self::REVERSE_PRESSURE_THRESHOLD_PASCAL)
        {
            Some(PneumaticValveSignal::close())
        } else {
            Some(PneumaticValveSignal::open())
        }
    }
}
impl IPValveController {
    const REVERSE_PRESSURE_THRESHOLD_PASCAL: f64 = 100.;

    fn new(number: usize) -> Self {
        Self {
            number,
            downstream_pressure: Pressure::new::<psi>(0.),
            upstream_pressure: Pressure::new::<psi>(0.),
        }
    }

    fn update(&mut self, context: &UpdateContext, engine_data: &impl EngineBleedDataProvider) {
        self.upstream_pressure = engine_data.ip_pressure();
        self.downstream_pressure = engine_data.transfer_pressure();
    }
}

struct HPValveController {
    // Engine number
    number: usize,
    upstream_pressure: Pressure,
    target_open_amount: Ratio,
    pid: Pid<f64>,
}
impl ControllerSignal<PneumaticValveSignal> for HPValveController {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        // Mechanically closed
        if self.upstream_pressure < Pressure::new::<psi>(Self::OPENING_PRESSURE_PSI) {
            return Some(PneumaticValveSignal::close());
        }

        Some(PneumaticValveSignal::new(self.target_open_amount))
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
            pid: Pid::new(0.05, 0., 0., 1., 1., 1., 1., 65.),
            target_open_amount: Ratio::new::<ratio>(0.),
        }
    }

    fn calculate_open_amount_from_pressure_change(
        &mut self,
        downstream_pressure: Pressure,
    ) -> Ratio {
        // TODO: Tune this
        let output = self
            .pid
            .next_control_output(downstream_pressure.get::<psi>());

        Ratio::new::<ratio>(output.output.min(1.).max(0.))
    }

    fn update(&mut self, context: &UpdateContext, engine_data: &impl EngineBleedDataProvider) {
        self.upstream_pressure = engine_data.hp_pressure();
        self.target_open_amount =
            self.calculate_open_amount_from_pressure_change(engine_data.transfer_pressure());
    }
}

struct PRValveController {
    // Engine number
    number: usize,
    transfer_pressure: Pressure,
    regulated_pressure: Pressure,
    target_open_amount: Ratio,
    should_close_on_pilot_command: bool,
    pid: Pid<f64>,
}
impl ControllerSignal<PneumaticValveSignal> for PRValveController {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        if self.should_close_on_pilot_command
            || self.transfer_pressure < Pressure::new::<psi>(Self::OPENING_PRESSURE_PSI)
        {
            return Some(PneumaticValveSignal::close());
        }

        Some(PneumaticValveSignal::new(self.target_open_amount))
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
            should_close_on_pilot_command: false,
            pid: Pid::new(0., 0.01, 0., 1., 1., 1., 1., Self::TARGET_PRESSURE_PSI),
            target_open_amount: Ratio::new::<ratio>(0.),
        }
    }

    fn update(&mut self, context: &UpdateContext, engine_data: &impl EngineBleedDataProvider) {
        self.transfer_pressure = engine_data.transfer_pressure();
        self.regulated_pressure = engine_data.regulated_pressure();

        self.should_close_on_pilot_command = engine_data.is_engine_fire_pushbutton_released()
            || !engine_data.is_engine_bleed_pushbutton_auto();

        let output = self
            .pid
            .next_control_output(self.regulated_pressure.get::<psi>());

        self.target_open_amount = Ratio::new::<ratio>(output.output.min(1.).max(0.));
    }
}

struct EngineStarterValveController {
    // Engine number
    number: usize,
    // True only if the switch was turned on this update
    engine_master_switched_on: bool,
    // True only if the switch was turned on this update
    engine_master_switched_off: bool,
    engine_n2_reached_50_percent: bool,
    engine_master_switch_on_id: String,
    engine_n2_id: String,
}
impl ControllerSignal<PneumaticValveSignal> for EngineStarterValveController {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        if self.engine_master_switched_off || self.engine_n2_reached_50_percent {
            Some(PneumaticValveSignal::close())
        } else if self.engine_master_switched_on {
            Some(PneumaticValveSignal::open())
        } else {
            None
        }
    }
}
impl SimulationElement for EngineStarterValveController {
    fn read(&mut self, reader: &mut systems::simulation::SimulatorReader) {
        let new_engine_master_on = reader.read(&self.engine_master_switch_on_id);
        let new_engine_n2: Ratio = reader.read(&self.engine_n2_id);

        self.engine_master_switched_on = !self.engine_master_switched_on && new_engine_master_on;
        self.engine_master_switched_off = self.engine_master_switched_off && !new_engine_master_on;

        self.engine_n2_reached_50_percent =
            !self.engine_n2_reached_50_percent && (new_engine_n2 > Ratio::new::<percent>(50.));
    }
}
impl EngineStarterValveController {
    fn new(number: usize) -> Self {
        Self {
            number,
            engine_master_switched_on: false,
            engine_master_switched_off: false,
            engine_n2_reached_50_percent: false,
            engine_master_switch_on_id: format!("GENERAL ENG STARTER ACTIVE:{}", number),
            engine_n2_id: format!("TURB ENG CORRECTED N2:{}", number),
        }
    }
}

struct CrossBleedValveController {
    bmc_signal: Option<PneumaticValveSignal>,
    cross_bleed_valve_mode: CrossBleedValveSelectorMode,
}
impl ControllerSignal<PneumaticValveSignal> for CrossBleedValveController {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        match self.cross_bleed_valve_mode {
            CrossBleedValveSelectorMode::Shut => Some(PneumaticValveSignal::close()),
            CrossBleedValveSelectorMode::Auto => self.bmc_signal,
            CrossBleedValveSelectorMode::Open => Some(PneumaticValveSignal::open()),
        }
    }
}
impl CrossBleedValveController {
    fn new() -> Self {
        Self {
            bmc_signal: None,
            cross_bleed_valve_mode: CrossBleedValveSelectorMode::Auto,
        }
    }

    fn update(
        &mut self,
        bmc: &BleedMonitoringComputer,
        overhead_panel: &A320PneumaticOverheadPanel,
    ) {
        self.bmc_signal = bmc.cross_bleed_valve_signal();
        self.cross_bleed_valve_mode = overhead_panel.cross_bleed_mode();
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

    is_engine_bleed_pushbutton_auto: bool,
    is_engine_fire_pushbutton_released: bool,
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
            is_engine_bleed_pushbutton_auto: true,
            is_engine_fire_pushbutton_released: false,
        }
    }

    fn update(
        &mut self,
        bleed_system: &EngineBleedSystem,
        is_engine_bleed_pushbutton_auto: bool,
        is_engine_fire_pushbutton_released: bool,
    ) {
        self.ip_compressor_pressure = bleed_system.ip_compression_chamber.pressure();
        self.hp_compressor_pressure = bleed_system.hp_compression_chamber.pressure();

        self.transfer_pressure = bleed_system.transfer_pressure_pipe.pressure();
        self.regulated_pressure = bleed_system.regulated_pressure_pipe.pressure();

        self.is_prv_open = bleed_system.pr_valve.is_open();
        self.hpv_open_amount = bleed_system.hp_valve.open_amount();

        self.is_engine_bleed_pushbutton_auto = is_engine_bleed_pushbutton_auto;
        self.is_engine_fire_pushbutton_released = is_engine_fire_pushbutton_released;
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

    fn is_engine_bleed_pushbutton_auto(&self) -> bool {
        self.is_engine_bleed_pushbutton_auto
    }

    fn is_engine_fire_pushbutton_released(&self) -> bool {
        self.is_engine_fire_pushbutton_released
    }
}
trait EngineBleedDataProvider {
    fn transfer_pressure(&self) -> Pressure;
    fn regulated_pressure(&self) -> Pressure;
    fn is_prv_open(&self) -> bool;
    fn hpv_open_amount(&self) -> Ratio;
    fn ip_pressure(&self) -> Pressure;
    fn hp_pressure(&self) -> Pressure;
    fn is_engine_bleed_pushbutton_auto(&self) -> bool;
    fn is_engine_fire_pushbutton_released(&self) -> bool;
}

struct BleedMonitoringComputer {
    number: usize,
    engine_bleed_systems_data: [EngineBleedSystemData; 2],
    apu_bleed_valve_is_open: bool,
    cross_bleed_selector_mode: CrossBleedValveSelectorMode,
}
impl BleedMonitoringComputer {
    fn new(number: usize) -> Self {
        Self {
            number,
            engine_bleed_systems_data: [
                EngineBleedSystemData::new(1),
                EngineBleedSystemData::new(2),
            ],
            apu_bleed_valve_is_open: false,
            cross_bleed_selector_mode: CrossBleedValveSelectorMode::Auto,
        }
    }

    fn engine_data(&self, number: usize) -> &impl EngineBleedDataProvider {
        &self.engine_bleed_systems_data[number - 1]
    }

    fn cross_bleed_valve_signal(&self) -> Option<PneumaticValveSignal> {
        match self.cross_bleed_selector_mode {
            CrossBleedValveSelectorMode::Auto => {
                if self.apu_bleed_valve_is_open {
                    Some(PneumaticValveSignal::open())
                } else {
                    Some(PneumaticValveSignal::close())
                }
            }
            _ => None,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engine_bleed_systems: &[EngineBleedSystem; 2],
        apu_bleed_valve_is_open: bool,
        overhead_panel: &A320PneumaticOverheadPanel,
        engine_fire_pushbuttons: &impl EngineFirePushButtons,
    ) {
        for engine_bleed_system in engine_bleed_systems.iter() {
            self.engine_bleed_systems_data[engine_bleed_system.number - 1].update(
                engine_bleed_system,
                match engine_bleed_system.number {
                    1 => overhead_panel.engine_1_bleed_is_auto(),
                    _ => overhead_panel.engine_2_bleed_is_auto(),
                },
                engine_fire_pushbuttons.is_released(engine_bleed_system.number),
            );
        }

        self.apu_bleed_valve_is_open = apu_bleed_valve_is_open;
        self.cross_bleed_selector_mode = overhead_panel.cross_bleed_mode();
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
    engine_starter_consumer: DefaultConsumer,
    // TODO: Use more sophisticated controller
    engine_starter_consumer_controller: ConstantConsumerController,
    engine_starter_valve_controller: EngineStarterValveController,
    engine_starter_valve: DefaultValve,
}
impl EngineBleedSystem {
    fn new(number: usize) -> Self {
        Self {
            number,
            ip_compression_chamber_controller: EngineCompressionChamberController::new(3., 0., 2.),
            hp_compression_chamber_controller: EngineCompressionChamberController::new(
                1.5, 2.5, 4.,
            ),
            ip_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(1.)),
            hp_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(1.)),
            ip_valve: DefaultValve::new(Ratio::new::<percent>(100.)),
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
            engine_starter_consumer: DefaultConsumer::new(Volume::new::<cubic_meter>(1.)),
            engine_starter_consumer_controller: ConstantConsumerController::new(VolumeRate::new::<
                cubic_meter_per_second,
            >(0.1)),
            engine_starter_valve_controller: EngineStarterValveController::new(number),
            engine_starter_valve: DefaultValve::new(Ratio::new::<ratio>(0.)),
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
        self.engine_starter_consumer_controller.update(context);

        // Update consumers
        self.engine_starter_consumer
            .update(&self.engine_starter_consumer_controller);

        // Update valves (open amount)
        // This is more like inject_signal()
        self.ip_valve
            .update_open_amount(context, &self.ip_valve_controller);
        self.hp_valve
            .update_open_amount(context, &self.hp_valve_controller);
        self.pr_valve
            .update_open_amount(context, &self.pr_valve_controller);
        self.engine_starter_valve
            .update_open_amount(context, &self.engine_starter_valve_controller);

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
        self.engine_starter_valve.update_move_fluid(
            context,
            &mut self.regulated_pressure_pipe,
            &mut self.engine_starter_consumer,
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
        self.engine_starter_valve_controller.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &format!("PNEU_ENG_{}_IP_PRESSURE", self.number),
            self.ip_compression_chamber.pressure(),
        );

        writer.write(
            &format!("PNEU_ENG_{}_HP_PRESSURE", self.number),
            self.hp_compression_chamber.pressure(),
        );

        writer.write(
            &format!("PNEU_ENG_{}_PRECOOLER_INLET_PRESSURE", self.number),
            self.regulated_pressure_pipe.pressure(),
        );

        writer.write(
            &format!("PNEU_ENG_{}_IP_VALVE_OPEN", self.number),
            self.ip_valve.is_open(),
        );

        writer.write(
            &format!("PNEU_ENG_{}_HP_VALVE_OPEN", self.number),
            self.hp_valve.is_open(),
        );

        writer.write(
            &format!("PNEU_ENG_{}_PR_VALVE_OPEN", self.number),
            self.pr_valve.is_open(),
        );
    }
}
impl PneumaticContainer for EngineBleedSystem {
    // This implementation is to connect the two engine systems via the cross bleed valve

    fn pressure(&self) -> Pressure {
        self.regulated_pressure_pipe.pressure()
    }

    fn volume(&self) -> Volume {
        self.regulated_pressure_pipe.volume()
    }

    fn change_volume(&mut self, volume: Volume) {
        self.regulated_pressure_pipe.change_volume(volume)
    }
}

pub struct A320PneumaticOverheadPanel {
    apu_bleed: OnOffFaultPushButton,
    cross_bleed: CrossBleedValveSelectorKnob,
    engine_1_bleed: AutoOffFaultPushButton,
    engine_2_bleed: AutoOffFaultPushButton,
}
impl A320PneumaticOverheadPanel {
    pub fn new() -> Self {
        A320PneumaticOverheadPanel {
            apu_bleed: OnOffFaultPushButton::new_on("PNEU_APU_BLEED"),
            cross_bleed: CrossBleedValveSelectorKnob::new_auto(),
            engine_1_bleed: AutoOffFaultPushButton::new_auto("PNEU_ENG_1_BLEED"),
            engine_2_bleed: AutoOffFaultPushButton::new_auto("PNEU_ENG_2_BLEED"),
        }
    }

    pub fn apu_bleed_is_on(&self) -> bool {
        self.apu_bleed.is_on()
    }

    pub fn cross_bleed_mode(&self) -> CrossBleedValveSelectorMode {
        self.cross_bleed.mode()
    }

    pub fn engine_1_bleed_is_auto(&self) -> bool {
        self.engine_1_bleed.is_auto()
    }

    pub fn engine_2_bleed_is_auto(&self) -> bool {
        self.engine_2_bleed.is_auto()
    }

    pub fn engine_1_bleed_has_fault(&self) -> bool {
        self.engine_1_bleed.has_fault()
    }

    pub fn engine_2_bleed_has_fault(&self) -> bool {
        self.engine_2_bleed.has_fault()
    }
}
impl SimulationElement for A320PneumaticOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu_bleed.accept(visitor);
        self.cross_bleed.accept(visitor);
        self.engine_1_bleed.accept(visitor);
        self.engine_2_bleed.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use systems::{
        engine::leap_engine::LeapEngine,
        hydraulic::Fluid,
        pneumatic::{
            ConstantConsumerController, ConstantPressureController, DefaultConsumer, DefaultPipe,
            DefaultValve, PneumaticContainer,
        },
        shared::{MachNumber, ISA},
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, Reader, SimulationElement, Write,
        },
    };

    use std::{fs::File, io::prelude::*, task::Context, time::Duration};

    use uom::si::{
        acceleration::foot_per_second_squared, length::foot, pressure::pascal, ratio::percent,
        thermodynamic_temperature::degree_celsius, velocity::knot, volume::cubic_meter,
        volume_rate::cubic_meter_per_second,
    };

    struct TestApu {
        bleed_air_valve_is_open: bool,
    }
    impl TestApu {
        fn new() -> Self {
            Self {
                bleed_air_valve_is_open: false,
            }
        }
    }
    impl BleedAirValveState for TestApu {
        fn bleed_air_valve_is_open(&self) -> bool {
            self.bleed_air_valve_is_open
        }
    }

    struct TestEngineFirePushButtons {
        is_released: [bool; 2],
    }
    impl TestEngineFirePushButtons {
        fn new() -> Self {
            Self {
                is_released: [false, false],
            }
        }

        fn release(&mut self, engine_number: usize) {
            self.is_released[engine_number - 1] = true;
        }
    }
    impl EngineFirePushButtons for TestEngineFirePushButtons {
        fn is_released(&self, engine_number: usize) -> bool {
            self.is_released[engine_number - 1]
        }
    }

    struct PneumaticTestAircraft {
        pneumatic: A320Pneumatic,
        apu: TestApu,
        engine_1: LeapEngine,
        engine_2: LeapEngine,
        overhead_panel: A320PneumaticOverheadPanel,
        fire_pushbuttons: TestEngineFirePushButtons,
    }
    impl PneumaticTestAircraft {
        fn new() -> Self {
            Self {
                pneumatic: A320Pneumatic::new(),
                apu: TestApu::new(),
                engine_1: LeapEngine::new(1),
                engine_2: LeapEngine::new(2),
                overhead_panel: A320PneumaticOverheadPanel::new(),
                fire_pushbuttons: TestEngineFirePushButtons::new(),
            }
        }
    }
    impl Aircraft for PneumaticTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pneumatic.update(
                context,
                [&self.engine_1, &self.engine_2],
                self.apu.bleed_air_valve_is_open(),
                &self.overhead_panel,
                &self.fire_pushbuttons,
            );
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
            self.overhead_panel.accept(visitor);

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
            self.write("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(0.55));
            self.write("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(0.2));

            self
        }

        fn idle_eng2(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:2", true);
            self.write("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.55));
            self.write("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.2));

            self
        }

        fn stop_eng1(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:1", false);
            self.write("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(0.));
            self.write("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(0.));

            self
        }

        fn stop_eng2(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:2", false);
            self.write("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.));
            self.write("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.));

            self
        }

        fn start_eng1(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:1", true);

            self
        }

        fn start_eng2(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:2", true);

            self
        }

        fn corrected_n1(mut self, corrected_n1: Ratio) -> Self {
            self.write("TURB ENG CORRECTED N1:1", corrected_n1);
            self.write("TURB ENG CORRECTED N1:2", corrected_n1);

            self
        }

        fn corrected_n2(mut self, corrected_n2: Ratio) -> Self {
            self.write("TURB ENG CORRECTED N2:1", corrected_n2);
            self.write("TURB ENG CORRECTED N2:2", corrected_n2);

            self
        }

        fn cross_bleed_valve_selector_knob(mut self, mode: CrossBleedValveSelectorMode) -> Self {
            self.write("KNOB_OVHD_AIRCOND_XBLEED_Position", mode);

            self
        }

        fn for_both_engine_systems<T: Fn(&EngineBleedSystem) -> ()>(&self, func: T) {
            self.query(|a| a.pneumatic.engine_systems.iter().for_each(|sys| func(sys)));
        }

        fn for_engine<T: Fn(&EngineBleedSystem) -> ()>(&self, number: usize, func: T) {
            self.query(|a| func(&a.pneumatic.engine_systems[number - 1]))
        }

        fn set_engine_bleed_push_button_off(mut self, number: usize) -> Self {
            self.write(&format!("OVHD_PNEU_ENG_{}_BLEED_PB_IS_AUTO", number), false);

            self
        }

        fn set_engine_bleed_push_button_has_fault(
            mut self,
            number: usize,
            has_fault: bool,
        ) -> Self {
            self.write(
                &format!("OVHD_PNEU_ENG_{}_BLEED_PB_HAS_FAULT", number),
                has_fault,
            );

            self
        }

        fn set_apu_bleed_valve(mut self, is_open: bool) -> Self {
            self.command(|a| a.apu.bleed_air_valve_is_open = is_open);

            self
        }

        fn release_fire_pushbutton(mut self, number: usize) -> Self {
            self.command(|a| a.fire_pushbuttons.release(number));

            self
        }

        fn is_fire_pushbutton_released(&self, number: usize) -> bool {
            self.query(|a| a.fire_pushbuttons.is_released(number))
        }

        fn for_both_engine_systems_with_capture<T: Fn(&EngineBleedSystem, &mut U) -> (), U>(
            &self,
            func: T,
            captured_variables: &mut U,
        ) {
            self.query(|a| {
                a.pneumatic
                    .engine_systems
                    .iter()
                    .for_each(|sys| func(sys, captured_variables))
            });
        }

        fn cross_bleed_valve_is_open(&self) -> bool {
            self.query(|a| a.pneumatic.cross_bleed_valve.is_open())
        }

        fn cross_bleed_valve_selector(&self) -> CrossBleedValveSelectorMode {
            self.query(|a| a.overhead_panel.cross_bleed_mode())
        }

        fn engine_bleed_push_button_is_auto(&self, number: usize) -> bool {
            match number {
                1 => self.query(|a| a.overhead_panel.engine_1_bleed_is_auto()),
                2 => self.query(|a| a.overhead_panel.engine_2_bleed_is_auto()),
                _ => false,
            }
        }

        fn engine_bleed_push_button_has_fault(&self, number: usize) -> bool {
            match number {
                1 => self.query(|a| a.overhead_panel.engine_1_bleed_has_fault()),
                2 => self.query(|a| a.overhead_panel.engine_2_bleed_has_fault()),
                _ => false,
            }
        }
    }

    fn test_bed() -> PneumaticTestBed {
        PneumaticTestBed::new()
    }

    fn test_bed_with() -> PneumaticTestBed {
        test_bed()
    }

    fn context(delta_time: Duration, altitude: Length) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(0.),
            altitude,
            ISA::temperature_at_altitude(altitude),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
        )
    }

    fn pressure_tolerance() -> Pressure {
        Pressure::new::<pascal>(100.)
    }

    // Just a way for me to plot some graphs
    #[test]
    fn test() {
        let alt = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .mach_number(MachNumber(0.0))
            .in_isa_atmosphere(alt)
            .idle_eng1()
            .idle_eng2();

        let mut ts = Vec::new();
        let mut hps = Vec::new();
        let mut ips = Vec::new();
        let mut c2s = Vec::new();
        let mut c1s = Vec::new();
        let mut hpv_open = Vec::new();
        let mut prv_open = Vec::new();
        let mut ipv_open = Vec::new();
        let mut esv_open = Vec::new();

        for i in 1..10 {
            ts.push(i as f64 * 5000.);

            // if i > 100 {
            //     let new_n1 = 0.2 + ((i as f64) - 100.) / 120.;
            //     let new_n2 = 0.5 + ((i as f64) - 100.) / 200.;

            //     println!("n1: {}", new_n1);
            //     println!("n2: {}", new_n2);

            //     test_bed = test_bed
            //         .corrected_n1(Ratio::new::<ratio>(new_n1))
            //         .corrected_n2(Ratio::new::<ratio>(new_n2));
            // }

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
                    * 10.
            }));

            prv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .pr_valve
                    .open_amount()
                    .get::<ratio>()
                    * 10.
            }));

            ipv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .ip_valve
                    .open_amount()
                    .get::<ratio>()
                    * 10.
            }));

            esv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .engine_starter_valve
                    .open_amount()
                    .get::<ratio>()
                    * 10.
            }));

            test_bed.run_with_delta(Duration::from_millis(5000));
        }

        // If anyone is wondering, I am using python to plot pressure curves. This will be removed once the model is complete.
        let data = vec![
            ts, hps, ips, c2s, c1s, hpv_open, prv_open, ipv_open, esv_open,
        ];
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

        println!("{:?}", pressures);

        test_bed.run_with_delta(Duration::from_secs(50));
        test_bed.run();

        test_bed.for_both_engine_systems_with_capture(
            |sys, pressures| {
                println!("{:?}", sys.ip_compression_chamber.pressure());

                assert!(
                    (sys.ip_compression_chamber.pressure() - pressures[sys.number - 1]).abs()
                        < pressure_tolerance()
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

        test_bed.run_with_delta(Duration::from_secs(50));
        // Expect pressures not to have changed after update
        test_bed.for_both_engine_systems_with_capture(
            |sys, pressures| {
                assert!(
                    (sys.hp_compression_chamber.pressure() - pressures[sys.number - 1]).abs()
                        < pressure_tolerance()
                )
            },
            &mut pressures,
        );
    }

    #[test]
    fn cold_dark_valves_closed() {
        let altitude = Length::new::<foot>(0.);
        let mut test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.));

        test_bed.run();
        let ambient_pressure = ISA::pressure_at_altitude(altitude);

        test_bed.for_both_engine_systems(|sys| {
            assert!(
                (sys.ip_compression_chamber.pressure() - ambient_pressure).abs()
                    < pressure_tolerance()
            )
        });
        test_bed.for_both_engine_systems(|sys| {
            assert!(
                (sys.hp_compression_chamber.pressure() - ambient_pressure).abs()
                    < pressure_tolerance()
            )
        });
        test_bed.for_both_engine_systems(|sys| {
            assert!(
                (sys.transfer_pressure_pipe.pressure() - ambient_pressure).abs()
                    < pressure_tolerance()
            )
        });
        test_bed.for_both_engine_systems(|sys| {
            assert!(
                (sys.regulated_pressure_pipe.pressure() - ambient_pressure).abs()
                    < pressure_tolerance()
            )
        });

        test_bed.for_both_engine_systems(|sys| assert!(sys.ip_valve.is_open()));
        test_bed.for_both_engine_systems(|sys| assert!(sys.ip_valve.is_open()));

        test_bed.for_both_engine_systems(|sys| assert!(!sys.hp_valve.is_open()));
        test_bed.for_both_engine_systems(|sys| assert!(!sys.hp_valve.is_open()));

        test_bed.for_both_engine_systems(|sys| assert!(!sys.pr_valve.is_open()));
        test_bed.for_both_engine_systems(|sys| assert!(!sys.pr_valve.is_open()));

        assert!(!test_bed.cross_bleed_valve_is_open())
    }

    #[test]
    fn single_engine_idle() {
        let altitude = Length::new::<foot>(0.);
        let mut test_bed = test_bed_with()
            .idle_eng1()
            .stop_eng2()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.));

        let ambient_pressure = ISA::pressure_at_altitude(altitude);

        // Three updates for now until propagation logic is fixed
        test_bed.run_with_delta(Duration::from_secs(5));
        test_bed.run_with_delta(Duration::from_secs(5));
        test_bed.run_with_delta(Duration::from_secs(5));

        test_bed.for_engine(1, |sys| {
            assert!(sys.ip_compression_chamber.pressure() - ambient_pressure > pressure_tolerance())
        });
        test_bed.for_engine(2, |sys| {
            assert!(
                (sys.ip_compression_chamber.pressure() - ambient_pressure).abs()
                    < pressure_tolerance()
            )
        });

        test_bed.for_engine(1, |sys| {
            assert!(sys.hp_compression_chamber.pressure() - ambient_pressure > pressure_tolerance())
        });
        test_bed.for_engine(2, |sys| {
            assert!(
                (sys.hp_compression_chamber.pressure() - ambient_pressure).abs()
                    < pressure_tolerance()
            )
        });

        test_bed.for_engine(1, |sys| {
            assert!(sys.transfer_pressure_pipe.pressure() - ambient_pressure > pressure_tolerance())
        });
        test_bed.for_engine(2, |sys| {
            assert!(
                (sys.transfer_pressure_pipe.pressure() - ambient_pressure).abs()
                    < pressure_tolerance()
            )
        });

        test_bed.for_engine(1, |sys| {
            assert!(
                sys.regulated_pressure_pipe.pressure() - ambient_pressure > pressure_tolerance()
            )
        });
        test_bed.for_engine(2, |sys| {
            assert!(
                (sys.regulated_pressure_pipe.pressure() - ambient_pressure).abs()
                    < pressure_tolerance()
            )
        });

        test_bed.for_engine(1, |sys| assert!(!sys.ip_valve.is_open()));
        test_bed.for_engine(2, |sys| assert!(sys.ip_valve.is_open()));

        test_bed.for_engine(1, |sys| assert!(sys.hp_valve.is_open()));
        test_bed.for_engine(2, |sys| assert!(!sys.hp_valve.is_open()));

        test_bed.for_engine(1, |sys| assert!(sys.pr_valve.is_open()));
        test_bed.for_engine(2, |sys| assert!(!sys.pr_valve.is_open()));

        test_bed.for_both_engine_systems(|sys| assert!(!sys.engine_starter_valve.is_open()));
        assert!(!test_bed.cross_bleed_valve_is_open());
    }

    #[test]
    fn n1_affects_compression_chamber() {
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
    fn n1_affects_compression_chamber_pressure() {
        let altitude = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .mach_number(MachNumber(0.))
            .idle_eng1()
            .idle_eng2()
            .corrected_n1(Ratio::new::<ratio>(0.2))
            .in_isa_atmosphere(altitude);

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(50));

        test_bed.for_both_engine_systems(|sys| {
            println!("ip pressure: {:?}", sys.ip_compression_chamber.pressure());

            assert!(sys.ip_compression_chamber.pressure() > ISA::pressure_at_altitude(altitude));
            assert!(sys.hp_compression_chamber.pressure() > ISA::pressure_at_altitude(altitude));
            assert!(sys.hp_compression_chamber.pressure() > sys.ip_compression_chamber.pressure())
        });
    }

    #[test]
    fn starter_valve_opens_on_engine_start() {
        // Set takeoff thrust
        let mut test_bed = test_bed_with().stop_eng1().stop_eng2();

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(50));

        test_bed.for_both_engine_systems(|sys| {
            assert!(!sys.engine_starter_valve.is_open());
        });

        test_bed = test_bed.start_eng1().start_eng2();
        test_bed.run();

        test_bed.for_both_engine_systems(|sys| {
            assert!(sys.engine_starter_valve.is_open());
        });
    }

    #[test]
    fn starter_valve_closes_on_n2_50_percent() {
        // Set takeoff thrust
        let mut test_bed = test_bed_with().stop_eng1().stop_eng2();

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(50));

        test_bed.for_both_engine_systems(|sys| {
            assert!(!sys.engine_starter_valve.is_open());
        });

        test_bed = test_bed.start_eng1().start_eng2();
        test_bed.run();

        test_bed.for_both_engine_systems(|sys| {
            assert!(sys.engine_starter_valve.is_open());
        });

        test_bed = test_bed.corrected_n2(Ratio::new::<ratio>(0.6));
        test_bed.run();

        test_bed.for_both_engine_systems(|sys| {
            assert!(!sys.engine_starter_valve.is_open());
        });
    }

    #[test]
    fn cross_bleed_valve_opens_when_apu_bleed_valve_opens() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .set_apu_bleed_valve(true);

        test_bed.run();

        assert!(test_bed.cross_bleed_valve_is_open())
    }

    #[test]
    fn cross_bleed_valve_closes_when_apu_bleed_valve_closes() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .set_apu_bleed_valve(false);

        test_bed.run();

        assert!(!test_bed.cross_bleed_valve_is_open());
    }

    #[test]
    fn cross_bleed_valve_manual_overrides_everything() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
            .set_apu_bleed_valve(true);

        test_bed.run();

        assert!(test_bed.cross_bleed_valve_is_open());

        test_bed = test_bed
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
            .set_apu_bleed_valve(false);

        test_bed.run();

        assert!(!test_bed.cross_bleed_valve_is_open());
    }

    #[test]
    fn simvars_initialized_properly() {
        let mut test_bed = test_bed_with().in_isa_atmosphere(Length::new::<foot>(0.));
        test_bed.run();

        assert!(test_bed.contains_key("PNEU_ENG_1_IP_PRESSURE"));
        assert!(test_bed.contains_key("PNEU_ENG_2_IP_PRESSURE"));

        assert!(test_bed.contains_key("PNEU_ENG_1_HP_PRESSURE"));
        assert!(test_bed.contains_key("PNEU_ENG_2_HP_PRESSURE"));

        assert!(test_bed.contains_key("PNEU_ENG_1_PRECOOLER_INLET_PRESSURE"));
        assert!(test_bed.contains_key("PNEU_ENG_2_PRECOOLER_INLET_PRESSURE"));

        assert!(test_bed.contains_key("PNEU_ENG_1_IP_PRESSURE"));
        assert!(test_bed.contains_key("PNEU_ENG_2_IP_PRESSURE"));

        assert!(test_bed.contains_key("PNEU_ENG_1_IP_VALVE_OPEN"));
        assert!(test_bed.contains_key("PNEU_ENG_2_IP_VALVE_OPEN"));

        assert!(test_bed.contains_key("PNEU_ENG_1_HP_VALVE_OPEN"));
        assert!(test_bed.contains_key("PNEU_ENG_2_HP_VALVE_OPEN"));

        assert!(test_bed.contains_key("PNEU_ENG_1_PR_VALVE_OPEN"));
        assert!(test_bed.contains_key("PNEU_ENG_2_PR_VALVE_OPEN"));

        assert!(test_bed.contains_key("OVHD_PNEU_ENG_1_BLEED_PB_HAS_FAULT"));
        assert!(test_bed.contains_key("OVHD_PNEU_ENG_2_BLEED_PB_HAS_FAULT"));

        assert!(test_bed.contains_key("OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO"));
        assert!(test_bed.contains_key("OVHD_PNEU_ENG_2_BLEED_PB_IS_AUTO"));

        assert!(test_bed.contains_key("PNEU_XBLEED_VALVE_OPEN"));
    }

    #[test]
    fn ovhd_engine_bleed_push_buttons() {
        let mut test_bed = test_bed();

        test_bed.run();

        assert!(test_bed.engine_bleed_push_button_is_auto(1));
        assert!(test_bed.engine_bleed_push_button_is_auto(2));

        test_bed = test_bed
            .set_engine_bleed_push_button_off(1)
            .set_engine_bleed_push_button_off(2);

        test_bed.run();

        assert!(!test_bed.engine_bleed_push_button_is_auto(1));
        assert!(!test_bed.engine_bleed_push_button_is_auto(2));
    }

    #[test]
    fn ovhd_engine_bleed_push_buttons_fault_lights() {
        let mut test_bed = test_bed();

        test_bed.run();

        assert!(!test_bed.engine_bleed_push_button_has_fault(1));
        assert!(!test_bed.engine_bleed_push_button_has_fault(2));

        test_bed = test_bed
            .set_engine_bleed_push_button_has_fault(1, true)
            .set_engine_bleed_push_button_has_fault(2, true);

        test_bed.run();

        assert!(test_bed.engine_bleed_push_button_has_fault(1));
        assert!(test_bed.engine_bleed_push_button_has_fault(2));
    }

    #[test]
    fn ovhd_cross_bleed_valve_mode_selector() {
        let mut test_bed = test_bed();

        test_bed.run();

        assert_eq!(
            test_bed.cross_bleed_valve_selector(),
            CrossBleedValveSelectorMode::Auto
        );

        test_bed = test_bed.cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open);
        test_bed.run();

        assert_eq!(
            test_bed.cross_bleed_valve_selector(),
            CrossBleedValveSelectorMode::Open
        );

        test_bed = test_bed.cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut);
        test_bed.run();

        assert_eq!(
            test_bed.cross_bleed_valve_selector(),
            CrossBleedValveSelectorMode::Shut
        );
    }

    #[test]
    fn prv_closes_with_ovhd_engine_bleed_off() {
        let mut test_bed = test_bed()
            .idle_eng1()
            .idle_eng2()
            .in_isa_atmosphere(Length::new::<foot>(0.));

        // TODO: I shouldn't have to run this twice, but it just takes two updates for the pressure to propagate through the system.
        test_bed.run_with_delta(Duration::from_secs(5));
        test_bed.run_with_delta(Duration::from_secs(5));

        test_bed.for_both_engine_systems(|a| assert!(a.pr_valve.is_open()));

        test_bed = test_bed.set_engine_bleed_push_button_off(1);
        // .set_engine_bleed_push_button_off(2);
        test_bed.run();

        test_bed.for_both_engine_systems(|a| assert!(!a.pr_valve.is_open()));
    }

    #[test]
    fn prv_closes_with_ovhd_engine_fire_pushbutton_released() {
        let mut test_bed = test_bed()
            .idle_eng1()
            .idle_eng2()
            .in_isa_atmosphere(Length::new::<foot>(0.));

        // TODO: I shouldn't have to run this twice, but it just takes two updates for the pressure to propagate through the system.
        test_bed.run_with_delta(Duration::from_secs(5));
        test_bed.run_with_delta(Duration::from_secs(5));

        test_bed.for_both_engine_systems(|a| assert!(a.pr_valve.is_open()));

        test_bed = test_bed
            .release_fire_pushbutton(1)
            .release_fire_pushbutton(2);
        test_bed.run();

        assert!(test_bed.is_fire_pushbutton_released(1));
        assert!(test_bed.is_fire_pushbutton_released(2));

        test_bed.for_both_engine_systems(|a| assert!(!a.pr_valve.is_open()));
    }
}
