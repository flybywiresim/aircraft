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
        ControlledPneumaticValveSignal, CrossBleedValveSelectorKnob, CrossBleedValveSelectorMode,
        DefaultConsumer, DefaultPipe, DefaultValve, EngineCompressionChamberController,
        EngineState, PneumaticContainer,
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

struct IntermediatePressureValveSignal {
    target_open_amount: Ratio,
}

impl IntermediatePressureValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
    }

    fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }
}

impl ControlledPneumaticValveSignal for IntermediatePressureValveSignal {
    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

struct HighPressureValveSignal {
    target_open_amount: Ratio,
}

impl HighPressureValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }

    fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
    }
}
impl ControlledPneumaticValveSignal for HighPressureValveSignal {
    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

struct PressureRegulatingValveSignal {
    target_open_amount: Ratio,
}

impl PressureRegulatingValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }

    fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
    }
}

impl ControlledPneumaticValveSignal for PressureRegulatingValveSignal {
    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

struct EngineStarterValveSignal {
    target_open_amount: Ratio,
}

impl EngineStarterValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }

    fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
    }
}

impl ControlledPneumaticValveSignal for EngineStarterValveSignal {
    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

struct CrossBleedValveSignal {
    target_open_amount: Ratio,
}

impl CrossBleedValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }

    fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
    }
}

impl ControlledPneumaticValveSignal for CrossBleedValveSignal {
    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

pub struct A320Pneumatic {
    bmc1: BleedMonitoringComputer,
    bmc2: BleedMonitoringComputer,
    engine_systems: [EngineBleedAirSystem; 2],

    cross_bleed_valve_controller: CrossBleedValveController,
    cross_bleed_valve: DefaultValve,

    // TODO: Not really sure this should be in the pneumatic system
    fadec: FullAuthorityDigitalEngineControl,
    engine_starter_valve_controllers: [EngineStarterValveController; 2],
}
impl A320Pneumatic {
    pub fn new() -> Self {
        Self {
            bmc1: BleedMonitoringComputer::new(1, 1, 2),
            bmc2: BleedMonitoringComputer::new(2, 2, 1),
            engine_systems: [EngineBleedAirSystem::new(1), EngineBleedAirSystem::new(2)],
            cross_bleed_valve_controller: CrossBleedValveController::new(),
            cross_bleed_valve: DefaultValve::new_closed(),
            fadec: FullAuthorityDigitalEngineControl::new(),
            engine_starter_valve_controllers: [
                EngineStarterValveController::new(1),
                EngineStarterValveController::new(2),
            ],
        }
    }

    // TODO: Extract T to it's own type since it's used a lot.
    pub fn update<T: EngineCorrectedN1 + EngineCorrectedN2>(
        &mut self,
        context: &UpdateContext,
        engines: [&T; 2],
        apu_bleed_valve_state: &impl BleedAirValveState,
        overhead_panel: &A320PneumaticOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
    ) {
        // Update BMC
        self.bmc1.update_main_channel(
            &self.engine_systems[0],
            overhead_panel.engine_1_bleed_is_auto(),
            engine_fire_push_buttons.is_released(1),
            overhead_panel.apu_bleed_is_on(),
            apu_bleed_valve_state,
            overhead_panel.cross_bleed_mode(),
            self.cross_bleed_valve.is_open(),
        );
        self.bmc1.update_backup_channel(
            &self.engine_systems[1],
            overhead_panel.engine_2_bleed_is_auto(),
            engine_fire_push_buttons.is_released(2),
            overhead_panel.apu_bleed_is_on(),
            apu_bleed_valve_state,
            overhead_panel.cross_bleed_mode(),
            self.cross_bleed_valve.is_open(),
        );
        self.bmc2.update_main_channel(
            &self.engine_systems[0],
            overhead_panel.engine_2_bleed_is_auto(),
            engine_fire_push_buttons.is_released(2),
            overhead_panel.apu_bleed_is_on(),
            apu_bleed_valve_state,
            overhead_panel.cross_bleed_mode(),
            self.cross_bleed_valve.is_open(),
        );
        self.bmc2.update_backup_channel(
            &self.engine_systems[1],
            overhead_panel.engine_2_bleed_is_auto(),
            engine_fire_push_buttons.is_released(1),
            overhead_panel.apu_bleed_is_on(),
            apu_bleed_valve_state,
            overhead_panel.cross_bleed_mode(),
            self.cross_bleed_valve.is_open(),
        );

        for esv_controller in self.engine_starter_valve_controllers.iter_mut() {
            esv_controller.update(&self.fadec);
        }

        // Update engine systems
        self.engine_systems[0].update(
            context,
            &self.bmc1.main_channel,
            &self.bmc1.main_channel,
            &self.bmc1.main_channel,
            &self.engine_starter_valve_controllers[0],
            engines[0],
        );
        self.engine_systems[1].update(
            context,
            &self.bmc2.main_channel,
            &self.bmc2.main_channel,
            &self.bmc2.main_channel,
            &self.engine_starter_valve_controllers[1],
            engines[1],
        );

        // Update cross bleed
        self.cross_bleed_valve_controller
            .update(apu_bleed_valve_state, overhead_panel.cross_bleed_mode());
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
        self.fadec.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("PNEU_XBLEED_VALVE_OPEN", self.cross_bleed_valve.is_open());
    }
}

struct EngineStarterValveController {
    number: usize,
    engine_state: EngineState,
}
impl ControllerSignal<EngineStarterValveSignal> for EngineStarterValveController {
    fn signal(&self) -> Option<EngineStarterValveSignal> {
        match self.engine_state {
            EngineState::Starting => Some(EngineStarterValveSignal::new_open()),
            _ => Some(EngineStarterValveSignal::new_closed()),
        }
    }
}
impl EngineStarterValveController {
    fn new(number: usize) -> Self {
        Self {
            number,
            engine_state: EngineState::Off,
        }
    }

    fn update(&mut self, fadec: &FullAuthorityDigitalEngineControl) {
        self.engine_state = fadec.engine_state(self.number);
    }
}

struct CrossBleedValveController {
    is_apu_bleed_valve_open: bool,
    cross_bleed_valve_selector: CrossBleedValveSelectorMode,
}
impl CrossBleedValveController {
    fn new() -> Self {
        Self {
            is_apu_bleed_valve_open: false,
            cross_bleed_valve_selector: CrossBleedValveSelectorMode::Auto,
        }
    }

    fn update(
        &mut self,
        apu: &impl BleedAirValveState,
        cross_bleed_valve_selector: CrossBleedValveSelectorMode,
    ) {
        self.is_apu_bleed_valve_open = apu.bleed_air_valve_is_open();
        self.cross_bleed_valve_selector = cross_bleed_valve_selector;
    }
}
impl ControllerSignal<CrossBleedValveSignal> for CrossBleedValveController {
    fn signal(&self) -> Option<CrossBleedValveSignal> {
        match self.cross_bleed_valve_selector {
            CrossBleedValveSelectorMode::Shut => Some(CrossBleedValveSignal::new_closed()),
            CrossBleedValveSelectorMode::Open => Some(CrossBleedValveSignal::new_open()),
            CrossBleedValveSelectorMode::Auto => {
                if self.is_apu_bleed_valve_open {
                    Some(CrossBleedValveSignal::new_open())
                } else {
                    Some(CrossBleedValveSignal::new_closed())
                }
            }
        }
    }
}

trait EngineBleedDataProvider {
    fn ip_pressure(&self) -> Pressure;
    fn hp_pressure(&self) -> Pressure;
    fn transfer_pressure(&self) -> Pressure;
    fn regulated_pressure(&self) -> Pressure;
    fn prv_open_amount(&self) -> Ratio;
    fn hpv_open_amount(&self) -> Ratio;
    fn esv_is_open(&self) -> bool;
}
impl EngineBleedDataProvider for EngineBleedAirSystem {
    fn ip_pressure(&self) -> Pressure {
        self.ip_compression_chamber.pressure()
    }

    fn hp_pressure(&self) -> Pressure {
        self.hp_compression_chamber.pressure()
    }

    fn transfer_pressure(&self) -> Pressure {
        self.transfer_pressure_pipe.pressure()
    }

    fn regulated_pressure(&self) -> Pressure {
        self.regulated_pressure_pipe.pressure()
    }

    fn prv_open_amount(&self) -> Ratio {
        self.pr_valve.open_amount()
    }

    fn hpv_open_amount(&self) -> Ratio {
        self.hp_valve.open_amount()
    }

    fn esv_is_open(&self) -> bool {
        self.engine_starter_valve.is_open()
    }
}

struct BleedMonitoringComputer {
    number: usize,
    main_channel: BleedMonitoringComputerChannel,
    backup_channel: BleedMonitoringComputerChannel,
}
impl BleedMonitoringComputer {
    fn new(
        number: usize,
        main_channel_engine_number: usize,
        backup_channel_engine_number: usize,
    ) -> Self {
        Self {
            // This is the BMC number, not directly related to any engine number.
            number,
            main_channel: BleedMonitoringComputerChannel::new(main_channel_engine_number),
            backup_channel: BleedMonitoringComputerChannel::new(backup_channel_engine_number),
        }
    }

    fn update_main_channel(
        &mut self,
        sensors: &impl EngineBleedDataProvider,
        is_engine_bleed_pushbutton_auto: bool,
        is_engine_fire_pushbutton_released: bool,
        is_apu_bleed_on: bool,
        apu_bleed_valve_state: &impl BleedAirValveState,
        cross_bleed_valve_selector: CrossBleedValveSelectorMode,
        cross_bleed_valve_is_open: bool,
    ) {
        self.main_channel.update(
            sensors,
            is_engine_bleed_pushbutton_auto,
            is_engine_fire_pushbutton_released,
            is_apu_bleed_on,
            apu_bleed_valve_state,
            cross_bleed_valve_selector,
            cross_bleed_valve_is_open,
        );
    }

    fn update_backup_channel(
        &mut self,
        sensors: &impl EngineBleedDataProvider,
        is_engine_bleed_pushbutton_auto: bool,
        is_engine_fire_pushbutton_released: bool,
        is_apu_bleed_on: bool,
        apu_bleed_valve_state: &impl BleedAirValveState,
        cross_bleed_valve_selector: CrossBleedValveSelectorMode,
        cross_bleed_valve_is_open: bool,
    ) {
        self.backup_channel.update(
            sensors,
            is_engine_bleed_pushbutton_auto,
            is_engine_fire_pushbutton_released,
            is_apu_bleed_on,
            apu_bleed_valve_state,
            cross_bleed_valve_selector,
            cross_bleed_valve_is_open,
        );
    }
}

struct BleedMonitoringComputerChannel {
    engine_number: usize,
    ip_compressor_pressure: Pressure,
    hp_compressor_pressure: Pressure,
    // Pressure between IP/HP valves and the PRV
    transfer_pressure: Pressure,
    // Pressure after PRV
    regulated_pressure: Pressure,
    prv_open_amount: Ratio,
    hpv_open_position: Ratio,
    esv_is_open: bool,
    is_engine_bleed_pushbutton_auto: bool,
    is_engine_fire_pushbutton_released: bool,
    is_apu_bleed_valve_open: bool,
    is_apu_bleed_on: bool,
    hpv_pid: Pid<f64>,
    hpv_output: f64,
    prv_pid: Pid<f64>,
    prv_output: f64,
    cross_bleed_valve_selector: CrossBleedValveSelectorMode,
    cross_bleed_valve_is_open: bool,
}
impl BleedMonitoringComputerChannel {
    fn new(engine_number: usize) -> Self {
        Self {
            engine_number,
            ip_compressor_pressure: Pressure::new::<psi>(0.),
            hp_compressor_pressure: Pressure::new::<psi>(0.),
            transfer_pressure: Pressure::new::<psi>(0.),
            regulated_pressure: Pressure::new::<psi>(0.),
            hpv_open_position: Ratio::new::<percent>(0.),
            prv_open_amount: Ratio::new::<percent>(0.),
            esv_is_open: false,
            is_engine_bleed_pushbutton_auto: true,
            is_engine_fire_pushbutton_released: false,
            is_apu_bleed_valve_open: false,
            is_apu_bleed_on: false,
            hpv_pid: Pid::new(0.05, 0., 0., 1., 1., 1., 1., 65.),
            hpv_output: 0.,
            prv_pid: Pid::new(0., 0.01, 0., 1., 1., 1., 1., 46.),
            prv_output: 0.,
            cross_bleed_valve_selector: CrossBleedValveSelectorMode::Auto,
            cross_bleed_valve_is_open: false,
        }
    }

    fn update(
        &mut self,
        sensors: &impl EngineBleedDataProvider,
        is_engine_bleed_pushbutton_auto: bool,
        is_engine_fire_pushbutton_released: bool,
        is_apu_bleed_on: bool,
        apu_bleed_valve_state: &impl BleedAirValveState,
        cross_bleed_valve_selector: CrossBleedValveSelectorMode,
        cross_bleed_valve_is_open: bool,
    ) {
        self.ip_compressor_pressure = sensors.ip_pressure();
        self.hp_compressor_pressure = sensors.hp_pressure();
        self.transfer_pressure = sensors.transfer_pressure();
        self.regulated_pressure = sensors.regulated_pressure();

        self.hpv_output = self
            .hpv_pid
            .next_control_output(self.transfer_pressure.get::<psi>())
            .output;
        self.prv_output = self
            .prv_pid
            .next_control_output(self.regulated_pressure.get::<psi>())
            .output;

        self.prv_open_amount = sensors.prv_open_amount();
        self.hpv_open_position = sensors.hpv_open_amount();
        self.esv_is_open = sensors.esv_is_open();

        self.is_engine_bleed_pushbutton_auto = is_engine_bleed_pushbutton_auto;
        self.is_engine_fire_pushbutton_released = is_engine_fire_pushbutton_released;

        self.is_apu_bleed_valve_open = apu_bleed_valve_state.bleed_air_valve_is_open();
        self.is_apu_bleed_on = is_apu_bleed_on;

        self.cross_bleed_valve_selector = cross_bleed_valve_selector;
        self.cross_bleed_valve_is_open = cross_bleed_valve_is_open;
    }
}
impl ControllerSignal<IntermediatePressureValveSignal> for BleedMonitoringComputerChannel {
    fn signal(&self) -> Option<IntermediatePressureValveSignal> {
        if self.transfer_pressure - self.ip_compressor_pressure > Pressure::new::<pascal>(100.) {
            Some(IntermediatePressureValveSignal::new_closed())
        } else {
            Some(IntermediatePressureValveSignal::new_open())
        }
    }
}
impl ControllerSignal<HighPressureValveSignal> for BleedMonitoringComputerChannel {
    fn signal(&self) -> Option<HighPressureValveSignal> {
        if self.transfer_pressure < Pressure::new::<psi>(18.) {
            return Some(HighPressureValveSignal::new_closed());
        }

        Some(HighPressureValveSignal::new(Ratio::new::<ratio>(
            self.hpv_output.max(0.).min(1.),
        )))
    }
}
impl ControllerSignal<PressureRegulatingValveSignal> for BleedMonitoringComputerChannel {
    fn signal(&self) -> Option<PressureRegulatingValveSignal> {
        if self.transfer_pressure < Pressure::new::<psi>(15.) {
            return Some(PressureRegulatingValveSignal::new_closed());
        }

        if !self.is_engine_bleed_pushbutton_auto || self.is_engine_fire_pushbutton_released {
            return Some(PressureRegulatingValveSignal::new_closed());
        }

        if self.is_apu_bleed_on
            && self.is_apu_bleed_valve_open
            && (self.engine_number == 1 || self.cross_bleed_valve_is_open)
        {
            return Some(PressureRegulatingValveSignal::new_closed());
        }

        if self.esv_is_open {
            return Some(PressureRegulatingValveSignal::new_closed());
        }

        Some(PressureRegulatingValveSignal::new(Ratio::new::<ratio>(
            self.prv_output.max(0.).min(1.),
        )))
    }
}

// TODO: Would it make sense to use the generics for traits here? e.g T: PneumaticCompressionChamber, U: PneumaticValve, etc.
struct EngineBleedAirSystem {
    number: usize,
    ip_compression_chamber_controller: EngineCompressionChamberController,
    hp_compression_chamber_controller: EngineCompressionChamberController,
    ip_compression_chamber: CompressionChamber,
    hp_compression_chamber: CompressionChamber,
    ip_valve: DefaultValve,
    hp_valve: DefaultValve,
    pr_valve: DefaultValve,
    transfer_pressure_pipe: DefaultPipe,
    regulated_pressure_pipe: DefaultPipe,
    engine_starter_consumer: DefaultConsumer,
    // TODO: Use more sophisticated controller
    engine_starter_consumer_controller: ConstantConsumerController,
    engine_starter_valve: DefaultValve,
}
impl EngineBleedAirSystem {
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
            engine_starter_valve: DefaultValve::new(Ratio::new::<ratio>(0.)),
        }
    }

    fn update<T: EngineCorrectedN1 + EngineCorrectedN2>(
        &mut self,
        context: &UpdateContext,
        ipv_controller: &impl ControllerSignal<IntermediatePressureValveSignal>,
        hpv_controller: &impl ControllerSignal<HighPressureValveSignal>,
        prv_controller: &impl ControllerSignal<PressureRegulatingValveSignal>,
        esv_controller: &impl ControllerSignal<EngineStarterValveSignal>,
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
        self.engine_starter_consumer_controller.update(context);

        // Update consumers
        self.engine_starter_consumer
            .update(&self.engine_starter_consumer_controller);

        // Update valves (open amount)
        self.ip_valve.update_open_amount(context, ipv_controller);
        self.hp_valve.update_open_amount(context, hpv_controller);
        self.pr_valve.update_open_amount(context, prv_controller);
        self.engine_starter_valve
            .update_open_amount(context, esv_controller);

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
impl SimulationElement for EngineBleedAirSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        self.ip_compression_chamber_controller.accept(visitor);
        self.hp_compression_chamber_controller.accept(visitor);

        visitor.visit(self);
    }

    // TODO: Possibly move these to their respective struct (e.g IP_PRESSURE to IPCompressionChamber or its controller)
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

        writer.write(
            &format!("PNEU_ENG_{}_STARTER_VALVE_OPEN", self.number),
            self.engine_starter_valve.is_open(),
        );
    }
}
impl PneumaticContainer for EngineBleedAirSystem {
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

struct FullAuthorityDigitalEngineControl {
    engine_1_state: EngineState,
    engine_2_state: EngineState,
}
impl FullAuthorityDigitalEngineControl {
    fn new() -> Self {
        Self {
            engine_1_state: EngineState::Off,
            engine_2_state: EngineState::Off,
        }
    }

    fn engine_state(&self, number: usize) -> EngineState {
        match number {
            1 => self.engine_1_state,
            2 => self.engine_2_state,
            _ => panic!("Invalid engine number"),
        }
    }
}
impl SimulationElement for FullAuthorityDigitalEngineControl {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.engine_1_state = reader.read("ENGINE_STATE:1");
        self.engine_2_state = reader.read("ENGINE_STATE:2");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use systems::{
        engine::leap_engine::LeapEngine,
        pneumatic::{EngineState, PneumaticContainer},
        shared::{MachNumber, ISA},
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, Write,
        },
    };

    use std::{fs::File, time::Duration};

    use uom::si::{
        acceleration::foot_per_second_squared, length::foot, pressure::pascal, velocity::knot,
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

        fn set_bleed_air_valve(&mut self, is_open: bool) {
            self.bleed_air_valve_is_open = is_open;
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
                &self.apu,
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
            self.write("ENGINE_STATE:1", EngineState::On);

            self
        }

        fn idle_eng2(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:2", true);
            self.write("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.55));
            self.write("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.2));
            self.write("ENGINE_STATE:2", EngineState::On);

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
            self.write("ENGINE_STATE:1", EngineState::Starting);

            self
        }

        fn start_eng2(mut self) -> Self {
            self.write("GENERAL ENG STARTER ACTIVE:2", true);
            self.write("ENGINE_STATE:2", EngineState::Starting);

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

        fn for_both_engine_systems<T: Fn(&EngineBleedAirSystem) -> ()>(&self, func: T) {
            self.query(|a| a.pneumatic.engine_systems.iter().for_each(|sys| func(sys)));
        }

        fn for_engine<T: Fn(&EngineBleedAirSystem) -> ()>(&self, number: usize, func: T) {
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
            self.command(|a| a.apu.set_bleed_air_valve(is_open));

            self
        }

        fn set_bleed_air_pb(mut self, is_on: bool) -> Self {
            self.write("OVHD_APU_BLEED_PB_IS_ON", is_on);

            self
        }

        fn release_fire_pushbutton(mut self, number: usize) -> Self {
            self.command(|a| a.fire_pushbuttons.release(number));

            self
        }

        fn set_engine_state(mut self, number: usize, engine_state: EngineState) -> Self {
            self.write(&format!("ENGINE_STATE:{}", number), engine_state);

            self
        }

        fn engine_state(&self, number: usize) -> EngineState {
            self.query(|a| a.pneumatic.fadec.engine_state(number))
        }

        fn is_fire_pushbutton_released(&self, number: usize) -> bool {
            self.query(|a| a.fire_pushbuttons.is_released(number))
        }

        fn for_both_engine_systems_with_capture<T: Fn(&EngineBleedAirSystem, &mut U) -> (), U>(
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
            .mach_number(MachNumber(0.))
            .in_isa_atmosphere(alt)
            .idle_eng1()
            .stop_eng2();

        let mut ts = Vec::new();
        let mut hps = Vec::new();
        let mut ips = Vec::new();
        let mut c2s = Vec::new();
        let mut c1s = Vec::new();
        let mut hpv_open = Vec::new();
        let mut prv_open = Vec::new();
        let mut ipv_open = Vec::new();
        let mut esv_open = Vec::new();

        for i in 1..100 {
            ts.push(i as f64 * 100.);

            // if i == 3 {
            //     test_bed = test_bed.set_apu_bleed_valve(true).set_bleed_air_pb(false);
            // }

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
                aircraft.pneumatic.engine_systems[1]
                    .hp_compression_chamber
                    .pressure()
                    .get::<psi>()
            }));

            ips.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[1]
                    .ip_compression_chamber
                    .pressure()
                    .get::<psi>()
            }));

            c2s.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[1]
                    .transfer_pressure_pipe
                    .pressure()
                    .get::<psi>()
            }));

            c1s.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[1]
                    .regulated_pressure_pipe
                    .pressure()
                    .get::<psi>()
            }));

            hpv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[1]
                    .hp_valve
                    .open_amount()
                    .get::<ratio>()
                    * 10.
            }));

            prv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[1]
                    .pr_valve
                    .open_amount()
                    .get::<ratio>()
                    * 10.
            }));

            ipv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[1]
                    .ip_valve
                    .open_amount()
                    .get::<ratio>()
                    * 10.
            }));

            esv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[1]
                    .engine_starter_valve
                    .open_amount()
                    .get::<ratio>()
                    * 10.
            }));

            test_bed.run_with_delta(Duration::from_millis(100));
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

        assert!(!test_bed.cross_bleed_valve_is_open());

        test_bed = test_bed
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
            .set_apu_bleed_valve(false);

        test_bed.run();

        assert!(test_bed.cross_bleed_valve_is_open());
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

        assert!(test_bed.contains_key("PNEU_ENG_1_STARTER_VALVE_OPEN"));
        assert!(test_bed.contains_key("PNEU_ENG_2_STARTER_VALVE_OPEN"));

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
        test_bed.run();

        test_bed.for_engine(1, |a| assert!(!a.pr_valve.is_open()));
        test_bed.for_engine(2, |a| assert!(a.pr_valve.is_open()));

        test_bed = test_bed.set_engine_bleed_push_button_off(2);
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

    #[test]
    fn prv_closes_with_apu_bleed_on() {
        let mut test_bed = test_bed_with().idle_eng1().idle_eng2();
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(30));

        test_bed.for_both_engine_systems(|sys| assert!(sys.pr_valve.is_open()));

        test_bed = test_bed.set_apu_bleed_valve(true).set_bleed_air_pb(true);
        test_bed.run();
        test_bed.run();

        test_bed.for_both_engine_systems(|sys| assert!(!sys.pr_valve.is_open()));
    }

    #[test]
    fn fadec_represents_engine_state() {
        let mut test_bed = test_bed_with()
            .set_engine_state(1, EngineState::Off)
            .set_engine_state(2, EngineState::Off);

        assert_eq!(test_bed.engine_state(1), EngineState::Off);
        assert_eq!(test_bed.engine_state(2), EngineState::Off);

        test_bed = test_bed.set_engine_state(1, EngineState::Starting);
        test_bed.run();

        assert_eq!(test_bed.engine_state(1), EngineState::Starting);
        assert_eq!(test_bed.engine_state(2), EngineState::Off);

        test_bed = test_bed.set_engine_state(2, EngineState::Starting);
        test_bed.run();

        assert_eq!(test_bed.engine_state(1), EngineState::Starting);
        assert_eq!(test_bed.engine_state(2), EngineState::Starting);

        test_bed = test_bed.set_engine_state(1, EngineState::On);
        test_bed.run();

        assert_eq!(test_bed.engine_state(1), EngineState::On);
        assert_eq!(test_bed.engine_state(2), EngineState::Starting);

        test_bed = test_bed.set_engine_state(2, EngineState::On);
        test_bed.run();

        assert_eq!(test_bed.engine_state(1), EngineState::On);
        assert_eq!(test_bed.engine_state(2), EngineState::On);

        test_bed = test_bed.set_engine_state(1, EngineState::Shutting);
        test_bed.run();

        assert_eq!(test_bed.engine_state(1), EngineState::Shutting);
        assert_eq!(test_bed.engine_state(2), EngineState::On);

        test_bed = test_bed.set_engine_state(2, EngineState::Shutting);
        test_bed.run();

        assert_eq!(test_bed.engine_state(1), EngineState::Shutting);
        assert_eq!(test_bed.engine_state(2), EngineState::Shutting);
    }
}
