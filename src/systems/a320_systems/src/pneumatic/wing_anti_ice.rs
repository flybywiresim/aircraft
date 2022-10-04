use std::time::Duration;

use crate::{pneumatic::EngineBleedAirSystem, UpdateContext};

use uom::si::{
    f64::*,
    pressure::{bar, psi},
    ratio::{percent, ratio},
    temperature_interval,
    thermodynamic_temperature::degree_celsius,
    volume::cubic_meter,
};

use systems::{
    pneumatic::{
        valve::DefaultValve, valve::PneumaticExhaust, ControllablePneumaticValve,
        PneumaticContainer, PneumaticPipe, PneumaticValveSignal, WingAntiIcePushButtonMode,
    },
    shared::{
        pid::PidController, random_from_normal_distribution, ControllerSignal, ElectricalBusType,
        ElectricalBuses, PneumaticValve,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, VariableIdentifier, Write,
    },
};

// The valve itself is a DefaultValve. The only thing
// we need to re-implement is the controller, that sets
// whether or not the valve should be open.
//
// The controller works using signals. A signal basically
// tells the controlloer what fraction of the valve should
// be open. Each valve has an `update_open_amount` method,
// that accepts a controller that implements the
// `ControllerSignal` trait. This trait has a single method,
// which returns an option for the signal type (e.g. wing anti ice signal)
// depending on the button/selector position.

// A WAI valve signal, just indicates what fraction
// of the valve should be open
struct WingAntiIceValveSignal {
    target_open_amount: Ratio,
}
// We can create a signal to be 100% open,
// totally closed, or potentially something in between
impl WingAntiIceValveSignal {
    pub fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    // pub fn new_open() -> Self {
    //     Self::new(Ratio::new::<percent>(100.))
    // }

    pub fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }
}
// A controlled valve signal. This just lets us access the target amount
impl PneumaticValveSignal for WingAntiIceValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

// This is the actual controller. It holds the push button status.
// - After 30 seconds, the ON light would turn off.
// - After takeoff, it should be turned on again.
pub struct WingAntiIceValveController {
    valve_pid: PidController, // PID controller for the valve - to regulate pressure
    valve_setpoint: f64,
    controller_signals_on: bool, // Status of the ON light. If button is pushed and
    // the test is finished, the ON light should turn off.
    supplier_pressurized: bool,
}
impl WingAntiIceValveController {
    const WAI_VALVE_MEAN_SETPOINT: f64 = 22.5;
    const WAI_VALVE_STD_DEV_SETPOINT: f64 = 2.5;
    pub fn new() -> Self {
        let random_setpoint = Self::choose_valve_setpoint();
        Self {
            valve_setpoint: random_setpoint,
            // Setpoint is 22.5 +/- 2.5 (psi)
            valve_pid: PidController::new(0.05, 0.01, 0., 0., 1., random_setpoint, 1.),
            controller_signals_on: false,
            supplier_pressurized: false,
        }
    }

    fn choose_valve_setpoint() -> f64 {
        if cfg!(test) {
            Self::WAI_VALVE_MEAN_SETPOINT
        } else {
            random_from_normal_distribution(
                Self::WAI_VALVE_MEAN_SETPOINT,
                Self::WAI_VALVE_STD_DEV_SETPOINT,
            )
        }
    }

    fn update_setpoint(&mut self, context: &UpdateContext) {
        self.valve_pid
            .change_setpoint(context.ambient_pressure().get::<psi>() + self.valve_setpoint);
    }

    pub fn controller_signals_on(&self) -> bool {
        self.controller_signals_on
    }

    // pub fn controller_valve_pid_output(&self) -> f64 {
    //     self.valve_pid.output()
    // }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        relay_signal: bool,
        supplier_pressurized: bool,
    ) {
        self.update_setpoint(context);

        self.controller_signals_on = relay_signal;
        self.supplier_pressurized = supplier_pressurized;
    }
}

// This is the part that interacts with the valve, via DefaultValve.update_open_amount.
// That method has if let Some(signal) = controller.signal(). The right hand side
// is what is returned from this implementation.
impl ControllerSignal<WingAntiIceValveSignal> for WingAntiIceValveController {
    fn signal(&self) -> Option<WingAntiIceValveSignal> {
        match self.controller_signals_on {
            false => Some(WingAntiIceValveSignal::new_closed()),
            true => {
                if self.supplier_pressurized {
                    let valve_ratio: Ratio = Ratio::new::<ratio>(self.valve_pid.output());
                    Some(WingAntiIceValveSignal::new(valve_ratio))
                } else {
                    Some(WingAntiIceValveSignal::new_closed())
                }
            }
        }
    }
}

// The wing anti ice is a consumer,
// meaning it is a simple container that consumes
// air from the bleed system, and exhausts it to the
// ambient atmosphere. This is just the implementation
// of a regular container
pub struct WingAntiIceConsumer {
    pipe: PneumaticPipe,
}

impl PneumaticContainer for WingAntiIceConsumer {
    fn pressure(&self) -> Pressure {
        self.pipe.pressure()
    }

    fn volume(&self) -> Volume {
        self.pipe.volume()
    }

    fn temperature(&self) -> ThermodynamicTemperature {
        self.pipe.temperature()
    }

    fn mass(&self) -> Mass {
        self.pipe.mass()
    }

    fn change_fluid_amount(
        &mut self,
        fluid_amount: Mass,
        fluid_temperature: ThermodynamicTemperature,
        fluid_pressure: Pressure,
    ) {
        self.pipe
            .change_fluid_amount(fluid_amount, fluid_temperature, fluid_pressure);
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        self.pipe.update_temperature(temperature_change);
    }
}

impl WingAntiIceConsumer {
    const CONDUCTION_RATE: f64 = 0.1;
    pub fn new(volume: Volume) -> Self {
        Self {
            pipe: PneumaticPipe::new(
                volume,
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
        }
    }

    // Radiate heat to the ambient atmosphere
    // according to Newton's law of cooling
    // dT/dt = -(T-T_atmo) / tau
    pub fn radiate_heat_to_ambient(&mut self, context: &UpdateContext) {
        let delta_t: TemperatureInterval =
            TemperatureInterval::new::<temperature_interval::degree_celsius>(
                self.temperature().get::<degree_celsius>()
                    - context.ambient_temperature().get::<degree_celsius>(),
            );

        self.update_temperature(-delta_t * context.delta_as_secs_f64() * Self::CONDUCTION_RATE);
    }
}

pub struct WingAntiIceRelay {
    wing_anti_ice_button_pos: WingAntiIcePushButtonMode, // The position of the button
    system_test_timer: Duration,                         // Timer to count up to 30 seconds
    system_test_done: bool, // Timer reached 30 seconds while on the ground
    signal_on: bool,        // Status of the ON light. If button is pushed and
    // the test is finished, the ON light should turn off.
    left_gear_compressed_id: VariableIdentifier,
    right_gear_compressed_id: VariableIdentifier,
    is_on_ground: bool, //Needed for the 30 seconds test logic
    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl WingAntiIceRelay {
    const WAI_TEST_TIME: Duration = Duration::from_secs(30);
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            wing_anti_ice_button_pos: WingAntiIcePushButtonMode::Off,
            system_test_timer: Duration::from_secs(0),
            system_test_done: false,
            signal_on: false,
            left_gear_compressed_id: context
                .get_identifier("LGCIU_1_LEFT_GEAR_COMPRESSED".to_owned()),
            right_gear_compressed_id: context
                .get_identifier("LGCIU_2_RIGHT_GEAR_COMPRESSED".to_owned()),
            is_on_ground: Default::default(),
            powered_by: ElectricalBusType::DirectCurrentEssentialShed,
            is_powered: false,
        }
    }

    pub fn signals_on(&self) -> bool {
        self.signal_on
    }

    // pub fn controller_valve_pid_output(&self) -> f64 {
    //     self.valve_pid.output()
    // }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        wing_anti_ice_button_pos: WingAntiIcePushButtonMode,
    ) {
        // Even if the button is pushed, we need to check if either
        // the plane is airborne or it is within the 30 second timeframe.
        // Also, we need to check if the supplier is pressurized
        // since the valve is pneumatically operated.
        self.wing_anti_ice_button_pos = wing_anti_ice_button_pos;
        if !self.is_powered {
            self.signal_on = false;
        } else if self.wing_anti_ice_button_pos == WingAntiIcePushButtonMode::On {
            if self.is_on_ground && !self.system_test_done {
                self.system_test_timer += context.delta();
                self.system_test_timer = self.system_test_timer.min(Self::WAI_TEST_TIME);
                if self.system_test_timer == Self::WAI_TEST_TIME {
                    self.system_test_done = true;
                    self.signal_on = false;
                } else {
                    self.signal_on = true;
                }
            } else if !self.is_on_ground {
                self.signal_on = true;
            }
        } else {
            self.signal_on = false;
        }

        // If the plane has taken off, we reset the timer
        // and set test_done to false in order for the
        // mechanism to work when landing.
        if !self.is_on_ground && self.system_test_timer > Duration::from_secs(0) {
            self.relay_reset();
        }
    }

    pub fn get_timer(&self) -> Duration {
        self.system_test_timer
    }

    fn relay_reset(&mut self) {
        self.system_test_timer = Duration::from_secs(0);
        self.system_test_done = false;
    }
}
impl SimulationElement for WingAntiIceRelay {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_on_ground = reader.read(&self.left_gear_compressed_id)
            || reader.read(&self.right_gear_compressed_id);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        if self.is_powered != buses.is_powered(self.powered_by) {
            self.relay_reset();
        }
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

// FWC FAILURES TO IMPLEMENT
// WING A.ICE SYS FAULT
// WING A.ICE L(R) VALVE OPEN
// WING A.ICE OPEN ON GND
// WING A.ICE L(R) HI PR

// The complex includes both WAI parts. Each part contains
// a consumer, a valve and an exhaust.
// There are two valve controllers, one for each.

// const not inside WingAntiIceComplex to link
// it with the size of the arrays in the struct
const NUM_OF_WAI: usize = 2;
pub struct WingAntiIceComplex {
    wai_exhaust: [PneumaticExhaust; NUM_OF_WAI],
    wai_valve: [DefaultValve; NUM_OF_WAI],
    wai_consumer: [WingAntiIceConsumer; NUM_OF_WAI],
    wai_valve_controller: [WingAntiIceValveController; NUM_OF_WAI],
    wai_relay: WingAntiIceRelay,
    wai_system_has_fault: bool,
    wai_system_on: bool,
    wai_selected: bool,
    wai_high_pressure: [bool; NUM_OF_WAI],
    wai_low_pressure: [bool; NUM_OF_WAI],
    wai_bleed_pressurised: [bool; NUM_OF_WAI],

    wai_on_id: VariableIdentifier,
    wai_selected_id: VariableIdentifier,
    wai_fault_id: VariableIdentifier,
    wai_ground_timer_id: VariableIdentifier,
    wai_left_pressure_id: VariableIdentifier,
    wai_right_pressure_id: VariableIdentifier,
    wai_left_temperature_id: VariableIdentifier,
    wai_right_temperature_id: VariableIdentifier,
    wai_left_valve_closed_id: VariableIdentifier,
    wai_right_valve_closed_id: VariableIdentifier,

    wai_left_high_pressure_id: VariableIdentifier,
    wai_right_high_pressure_id: VariableIdentifier,
    wai_left_low_pressure_id: VariableIdentifier,
    wai_right_low_pressure_id: VariableIdentifier,
}
impl WingAntiIceComplex {
    const WAI_MIN_PRESSURE: f64 = 1.; //BAR
    const WAI_MAX_PRESSURE: f64 = 2.1; //BAR
    const WAI_EXHAUST_SPEED: f64 = 0.1175; // Regulate wing_anti_ice_tweak_exhaust
    const WAI_VALVE_TRANSFER_SPEED: f64 = 1.3; // Regulate wing_anti_ice_tweak_time_to_open

    // Each WAI duct is made of
    // Flow Trimming Restrictor 47mm diameter
    // Lagged Supply Duct 50mm diameter
    // Telescopic Duct 73.66mm to 57.15mm diameter
    // Piccolo Ducts 63.5mm to 44mm diameter
    // Flexible Ducts
    // Slat 2 --> 3.335m
    // Slat 3 --> 2.8m
    // Slat 4 --> 2.736m
    // Slat 5 --> 2.593m
    // Total length 11.464m
    // 3.335m * 0.050m diameter
    // 2.8m   * 0.0635m diameter
    // 2.736m * 0.055m diameter
    // 2.593m * 0.044m diameter
    // 0.458m * 0.05715mm diameter
    // Total volume of ducts is around 2m^3. Assuming telescopic duct retracted
    const WAI_PIPE_VOLUME: f64 = 2.;

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            // At 22000ft, flow rate is given at 0.327kg/s
            wai_exhaust: [
                // Leaking failure not simulated
                PneumaticExhaust::new(
                    Self::WAI_EXHAUST_SPEED,
                    Self::WAI_EXHAUST_SPEED,
                    Pressure::new::<psi>(0.),
                ),
                PneumaticExhaust::new(
                    Self::WAI_EXHAUST_SPEED,
                    Self::WAI_EXHAUST_SPEED,
                    Pressure::new::<psi>(0.),
                ),
            ],
            // If the pressure increases to 2.1 bar (30.4579 psi)
            // the switch gives a 'high pressure' signal. If the pressure decreases
            // to 1.0 bar (14.5038 psi) the related switch gives a 'low pressure' signal.
            wai_valve: [DefaultValve::new_closed(), DefaultValve::new_closed()],
            wai_consumer: [
                WingAntiIceConsumer::new(Volume::new::<cubic_meter>(Self::WAI_PIPE_VOLUME)),
                WingAntiIceConsumer::new(Volume::new::<cubic_meter>(Self::WAI_PIPE_VOLUME)),
            ],
            wai_valve_controller: [
                WingAntiIceValveController::new(),
                WingAntiIceValveController::new(),
            ],

            wai_relay: WingAntiIceRelay::new(context),
            wai_system_has_fault: false,
            wai_system_on: false,
            wai_selected: false,
            wai_high_pressure: [false, false],
            wai_low_pressure: [false, false],
            wai_bleed_pressurised: [false, false],

            wai_on_id: context.get_identifier("PNEU_WING_ANTI_ICE_SYSTEM_ON".to_owned()),
            wai_selected_id: context
                .get_identifier("PNEU_WING_ANTI_ICE_SYSTEM_SELECTED".to_owned()),
            wai_fault_id: context.get_identifier("PNEU_WING_ANTI_ICE_HAS_FAULT".to_owned()),
            wai_ground_timer_id: context
                .get_identifier("PNEU_WING_ANTI_ICE_GROUND_TIMER".to_owned()),

            wai_left_valve_closed_id: context
                .get_identifier("PNEU_1_WING_ANTI_ICE_VALVE_CLOSED".to_owned()),
            wai_right_valve_closed_id: context
                .get_identifier("PNEU_2_WING_ANTI_ICE_VALVE_CLOSED".to_owned()),
            wai_left_high_pressure_id: context
                .get_identifier("PNEU_1_WING_ANTI_ICE_HIGH_PRESSURE".to_owned()),
            wai_right_high_pressure_id: context
                .get_identifier("PNEU_2_WING_ANTI_ICE_HIGH_PRESSURE".to_owned()),
            wai_left_low_pressure_id: context
                .get_identifier("PNEU_1_WING_ANTI_ICE_LOW_PRESSURE".to_owned()),
            wai_right_low_pressure_id: context
                .get_identifier("PNEU_2_WING_ANTI_ICE_LOW_PRESSURE".to_owned()),

            wai_left_pressure_id: context
                .get_identifier("PNEU_1_WING_ANTI_ICE_CONSUMER_PRESSURE".to_owned()),
            wai_right_pressure_id: context
                .get_identifier("PNEU_2_WING_ANTI_ICE_CONSUMER_PRESSURE".to_owned()),
            wai_left_temperature_id: context
                .get_identifier("PNEU_1_WING_ANTI_ICE_CONSUMER_TEMPERATURE".to_owned()),
            wai_right_temperature_id: context
                .get_identifier("PNEU_2_WING_ANTI_ICE_CONSUMER_TEMPERATURE".to_owned()),
        }
    }

    fn is_wai_system_on(&self) -> bool {
        self.wai_system_on
    }

    fn update_pressure_above_minimum(
        &mut self,
        context: &UpdateContext,
        precooler_pressure: Pressure,
        number: usize,
    ) {
        // The WAI valves open at min 10psi of pressure (difference)
        self.wai_bleed_pressurised[number] =
            precooler_pressure > context.ambient_pressure() + Pressure::new::<psi>(10.);
    }

    fn update_valve_controller(&mut self, context: &UpdateContext, number: usize) {
        self.wai_valve_controller[number]
            .valve_pid
            .next_control_output(
                self.wai_consumer_pressure(number).get::<psi>(),
                Some(context.delta()),
            );

        self.wai_valve_controller[number].update(
            context,
            self.wai_relay.signals_on(),
            self.wai_bleed_pressurised[number],
        );
    }

    pub fn is_wai_valve_closed(&self, number: usize) -> bool {
        !self.wai_valve[number].is_open()
    }

    pub fn wai_consumer_pressure(&self, number: usize) -> Pressure {
        self.wai_consumer[number].pressure()
    }

    pub fn wai_timer(&self) -> Duration {
        self.wai_relay.get_timer()
    }

    #[cfg(test)]
    pub fn wai_valve_controller_on(&self, number: usize) -> bool {
        self.wai_valve_controller[number].controller_signals_on()
    }

    #[cfg(test)]
    pub fn is_precoooler_pressurised(&self, number: usize) -> bool {
        self.wai_bleed_pressurised[number]
    }

    #[cfg(test)]
    pub fn wai_consumer_temperature(&self, number: usize) -> ThermodynamicTemperature {
        self.wai_consumer[number].temperature()
    }

    #[cfg(test)]
    pub fn wai_mass_flow(&self, number: usize) -> MassRate {
        self.wai_exhaust[number].fluid_flow()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine_systems: &mut [EngineBleedAirSystem; 2],
        wai_mode: WingAntiIcePushButtonMode,
    ) {
        // Tracks if the system has a fault
        let mut has_fault: bool = false;

        self.wai_relay.update(context, wai_mode);

        for n in 0..NUM_OF_WAI {
            self.update_pressure_above_minimum(
                context,
                engine_systems[n].precooler_outlet_pressure(),
                n,
            );

            // First, we see if the valve's open amount changes this update,
            // as a result of a change in the ovhd panel push button.
            // If the precooler is not pressurized, a FAULT should light.
            self.update_valve_controller(context, n);
            self.wai_valve[n].update_open_amount(&self.wai_valve_controller[n]);

            // We need both controllers to signal `on` for the
            // system to be considered on without a fault.
            if self.wai_valve_controller[n].controller_signals_on() {
                // If a controller signals `on` while its corresponding valve is closed
                // this means the system has a fault.
                if self.is_wai_valve_closed(n) {
                    has_fault = true;
                }
            }

            // An exhaust tick always happens, no matter what
            // the valve's state is
            self.wai_exhaust[n].update_move_fluid(context, &mut self.wai_consumer[n]);

            // The heated slats radiate energy to the ambient atmosphere.
            self.wai_consumer[n].radiate_heat_to_ambient(context);

            // This only changes the volume if open_amount is not zero.
            self.wai_valve[n].update_move_fluid_with_transfer_speed(
                context,
                &mut engine_systems[n].precooler_outlet_pipe,
                &mut self.wai_consumer[n],
                Self::WAI_VALVE_TRANSFER_SPEED,
            );

            if self.wai_consumer_pressure(n)
                <= Pressure::new::<bar>(Self::WAI_MIN_PRESSURE) + context.ambient_pressure()
                && !self.is_wai_valve_closed(n)
            {
                self.wai_high_pressure[n] = false;
                self.wai_low_pressure[n] = true;
                has_fault = true;
            } else if self.wai_consumer_pressure(n)
                >= Pressure::new::<bar>(Self::WAI_MAX_PRESSURE) + context.ambient_pressure()
                && !self.is_wai_valve_closed(n)
            {
                self.wai_high_pressure[n] = true;
                self.wai_low_pressure[n] = false;
                // High pressure doesn't turn the FAULT light ON
            } else {
                self.wai_high_pressure[n] = false;
                self.wai_low_pressure[n] = false;
            }
        }

        self.wai_system_has_fault = has_fault;
        self.wai_system_on = self.wai_relay.signals_on();
        self.wai_selected = wai_mode == WingAntiIcePushButtonMode::On;
    }
}

impl SimulationElement for WingAntiIceComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        self.wai_relay.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.wai_on_id, self.is_wai_system_on());
        writer.write(&self.wai_selected_id, self.wai_selected);
        writer.write(&self.wai_fault_id, self.wai_system_has_fault);
        writer.write(&self.wai_ground_timer_id, self.wai_timer().as_secs());
        writer.write(&self.wai_left_pressure_id, self.wai_consumer_pressure(0));
        writer.write(&self.wai_right_pressure_id, self.wai_consumer_pressure(1));
        writer.write(
            &self.wai_left_temperature_id,
            self.wai_consumer[0].temperature(),
        );
        writer.write(
            &self.wai_right_temperature_id,
            self.wai_consumer[1].temperature(),
        );
        writer.write(&self.wai_left_valve_closed_id, self.is_wai_valve_closed(0));
        writer.write(&self.wai_right_valve_closed_id, self.is_wai_valve_closed(1));
        writer.write(&self.wai_left_high_pressure_id, self.wai_high_pressure[0]);
        writer.write(&self.wai_right_high_pressure_id, self.wai_high_pressure[1]);
        writer.write(&self.wai_left_low_pressure_id, self.wai_low_pressure[0]);
        writer.write(&self.wai_right_low_pressure_id, self.wai_low_pressure[1]);
    }

    // WAI doesn't have any indicated power consumption
}
