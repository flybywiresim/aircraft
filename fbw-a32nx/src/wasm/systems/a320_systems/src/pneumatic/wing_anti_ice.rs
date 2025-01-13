use std::time::Duration;

use crate::UpdateContext;

use uom::si::{
    f64::*,
    pressure::{bar, psi},
    ratio::{percent, ratio},
    temperature_interval,
    thermodynamic_temperature::degree_celsius,
    volume::cubic_meter,
};

use systems::{
    accept_iterable,
    pneumatic::{
        valve::DefaultValve, valve::PneumaticExhaust, ControllablePneumaticValve,
        PneumaticContainer, PneumaticPipe, PneumaticValveSignal, WingAntiIcePushButtonMode,
        WingAntiIceSelected,
    },
    shared::{
        pid::PidController, random_from_normal_distribution, ControllerSignal, ElectricalBusType,
        ElectricalBuses, LgciuWeightOnWheels, PneumaticValve,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter,
        VariableIdentifier, Write,
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
impl WingAntiIceValveSignal {
    pub fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

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
    system_test_timer: Duration, // Timer to count up to 30 seconds
    system_test_done: bool,      // Timer reached 30 seconds while on the ground
    signal_on: bool,             // Status of the ON light. If button is pushed and
    // the test is finished, the ON light should turn off.
    powered_by: ElectricalBusType,
    is_powered: bool,
    ground_timer_id: VariableIdentifier,
    system_on_id: VariableIdentifier,
}
impl WingAntiIceRelay {
    const WAI_TEST_TIME: Duration = Duration::from_secs(30);
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            system_test_timer: Duration::from_secs(0),
            system_test_done: false,
            signal_on: false,
            powered_by: ElectricalBusType::DirectCurrentEssentialShed,
            is_powered: false,
            ground_timer_id: context.get_identifier("PNEU_WING_ANTI_ICE_GROUND_TIMER".to_owned()),
            system_on_id: context.get_identifier("PNEU_WING_ANTI_ICE_SYSTEM_ON".to_owned()),
        }
    }

    pub fn signals_on(&self) -> bool {
        self.signal_on
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        wing_anti_ice_button_pos: WingAntiIcePushButtonMode,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        // Even if the button is pushed, we need to check if either
        // the plane is airborne or it is within the 30 second timeframe.
        // Also, we need to check if the supplier is pressurized
        // since the valve is pneumatically operated.
        let is_on_ground =
            !(lgciu[0].left_gear_extended(false) || lgciu[1].right_gear_extended(false));

        if !self.is_powered {
            self.signal_on = false;
        } else if wing_anti_ice_button_pos == WingAntiIcePushButtonMode::On {
            if is_on_ground && !self.system_test_done {
                self.system_test_timer += context.delta();
                self.system_test_timer = self.system_test_timer.min(Self::WAI_TEST_TIME);
                if self.system_test_timer == Self::WAI_TEST_TIME {
                    self.system_test_done = true;
                    self.signal_on = false;
                } else {
                    self.signal_on = true;
                }
            } else if !is_on_ground {
                self.signal_on = true;
            }
        } else {
            self.signal_on = false;
        }

        // If the plane has taken off, we reset the timer
        // and set test_done to false in order for the
        // mechanism to work when landing.
        if !is_on_ground && self.system_test_timer > Duration::from_secs(0) {
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
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        if self.is_powered != buses.is_powered(self.powered_by) {
            self.relay_reset();
        }
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.ground_timer_id, self.get_timer().as_secs());
        writer.write(&self.system_on_id, self.signals_on());
    }

    // WAI doesn't have any indicated power consumption
}

// FWC FAILURES TO IMPLEMENT
// WING A.ICE SYS FAULT
// WING A.ICE L(R) VALVE OPEN
// WING A.ICE OPEN ON GND
// WING A.ICE L(R) HI PR
pub struct WingAntiIceSystem {
    wai_exhaust: PneumaticExhaust,
    wai_valve: DefaultValve,
    wai_consumer: WingAntiIceConsumer,
    wai_valve_controller: WingAntiIceValveController,
    wai_has_fault: bool,
    wai_high_pressure: bool,
    wai_low_pressure: bool,
    wai_bleed_pressurised: bool,

    wai_pressure_id: VariableIdentifier,
    wai_temperature_id: VariableIdentifier,
    wai_valve_closed_id: VariableIdentifier,

    wai_high_pressure_id: VariableIdentifier,
    wai_low_pressure_id: VariableIdentifier,
}
impl WingAntiIceSystem {
    const WAI_MIN_PRESSURE: f64 = 1.; //BAR
    const WAI_MAX_PRESSURE: f64 = 2.1; //BAR
    const WAI_EXHAUST_SPEED: f64 = 0.129; // Regulate wing_anti_ice_tweak_exhaust
    const WAI_VALVE_TRANSFER_SPEED: f64 = 1.2; // Regulate wing_anti_ice_tweak_time_to_open

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

    pub fn new(context: &mut InitContext, number: usize) -> Self {
        let wai_pipe_volume: Volume = Volume::new::<cubic_meter>(Self::WAI_PIPE_VOLUME);

        Self {
            // At 22000ft, flow rate is given at 0.327kg/s
            // Leaking failure not simulated
            wai_exhaust: PneumaticExhaust::new(
                Self::WAI_EXHAUST_SPEED,
                Self::WAI_EXHAUST_SPEED,
                Pressure::new::<psi>(0.),
            ),
            // If the pressure increases to 2.1 bar (30.4579 psi)
            // the switch gives a 'high pressure' signal. If the pressure decreases
            // to 1.0 bar (14.5038 psi) the related switch gives a 'low pressure' signal.
            wai_valve: DefaultValve::new_closed(),
            wai_consumer: WingAntiIceConsumer::new(wai_pipe_volume),
            wai_valve_controller: WingAntiIceValveController::new(),

            wai_has_fault: false,
            wai_high_pressure: false,
            wai_low_pressure: false,
            wai_bleed_pressurised: false,

            wai_valve_closed_id: context
                .get_identifier(format!("PNEU_WING_ANTI_ICE_{}_VALVE_CLOSED", number)),
            wai_high_pressure_id: context
                .get_identifier(format!("PNEU_WING_ANTI_ICE_{}_HIGH_PRESSURE", number)),
            wai_low_pressure_id: context
                .get_identifier(format!("PNEU_WING_ANTI_ICE_{}_LOW_PRESSURE", number)),

            wai_pressure_id: context
                .get_identifier(format!("PNEU_WING_ANTI_ICE_{}_CONSUMER_PRESSURE", number)),
            wai_temperature_id: context.get_identifier(format!(
                "PNEU_WING_ANTI_ICE_{}_CONSUMER_TEMPERATURE",
                number
            )),
        }
    }

    fn update_pressure_above_minimum(
        &mut self,
        context: &UpdateContext,
        precooler_pressure: Pressure,
    ) {
        // The WAI valves open at min 10psi of pressure (difference)
        self.wai_bleed_pressurised =
            precooler_pressure > context.ambient_pressure() + Pressure::new::<psi>(10.);
    }

    fn update_valve_controller(&mut self, context: &UpdateContext, wai_relay: &WingAntiIceRelay) {
        self.wai_valve_controller.valve_pid.next_control_output(
            self.wai_consumer_pressure().get::<psi>(),
            Some(context.delta()),
        );

        self.wai_valve_controller.update(
            context,
            wai_relay.signals_on(),
            self.wai_bleed_pressurised,
        );

        self.wai_valve
            .update_open_amount(&self.wai_valve_controller);

        // If valve doesn't follow controller, there is a fault
        self.wai_has_fault =
            self.wai_valve_controller.controller_signals_on() == self.is_wai_valve_closed();
    }

    pub fn is_wai_valve_closed(&self) -> bool {
        !self.wai_valve.is_open()
    }

    pub fn wai_consumer_pressure(&self) -> Pressure {
        self.wai_consumer.pressure()
    }

    pub fn wai_has_fault(&self) -> bool {
        self.wai_has_fault
    }

    pub fn wai_consumer_temperature(&self) -> ThermodynamicTemperature {
        self.wai_consumer.temperature()
    }

    pub fn wai_valve_high_pressure(&self) -> bool {
        self.wai_high_pressure
    }

    pub fn wai_valve_low_pressure(&self) -> bool {
        self.wai_low_pressure
    }

    #[cfg(test)]
    pub fn wai_valve_controller_on(&self) -> bool {
        self.wai_valve_controller.controller_signals_on()
    }

    #[cfg(test)]
    pub fn is_precoooler_pressurised(&self) -> bool {
        self.wai_bleed_pressurised
    }

    #[cfg(test)]
    pub fn wai_mass_flow(&self) -> MassRate {
        self.wai_exhaust.fluid_flow()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine_system: &mut impl PneumaticContainer,
        wai_relay: &WingAntiIceRelay,
    ) {
        self.update_pressure_above_minimum(context, engine_system.pressure());

        // First, we see if the valve's open amount changes this update,
        // as a result of a change in the ovhd panel push button.
        self.update_valve_controller(context, wai_relay);

        // An exhaust tick always happens, no matter what
        // the valve's state is
        self.wai_exhaust
            .update_move_fluid(context, &mut self.wai_consumer);

        // The heated slats radiate energy to the ambient atmosphere.
        self.wai_consumer.radiate_heat_to_ambient(context);

        // This only changes the volume if open_amount is not zero.
        self.wai_valve.update_move_fluid_with_transfer_speed(
            context,
            engine_system,
            &mut self.wai_consumer,
            Self::WAI_VALVE_TRANSFER_SPEED,
        );

        // Check if HIGH or LOW pressure
        if self.wai_consumer_pressure()
            // FIXME use ADR static pressure
            <= Pressure::new::<bar>(Self::WAI_MIN_PRESSURE) + context.ambient_pressure()
            && !self.is_wai_valve_closed()
        {
            self.wai_high_pressure = false;
            self.wai_low_pressure = true;
            self.wai_has_fault = true;
        } else if self.wai_consumer_pressure()
            // FIXME use ADR static pressure
            >= Pressure::new::<bar>(Self::WAI_MAX_PRESSURE) + context.ambient_pressure()
            && !self.is_wai_valve_closed()
        {
            self.wai_high_pressure = true;
            self.wai_low_pressure = false;
            // High pressure doesn't turn the FAULT light ON
        } else {
            self.wai_high_pressure = false;
            self.wai_low_pressure = false;
        }
    }
}
impl SimulationElement for WingAntiIceSystem {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.wai_pressure_id, self.wai_consumer_pressure());
        writer.write(&self.wai_temperature_id, self.wai_consumer_temperature());
        writer.write(&self.wai_valve_closed_id, self.is_wai_valve_closed());
        writer.write(&self.wai_high_pressure_id, self.wai_valve_high_pressure());
        writer.write(&self.wai_low_pressure_id, self.wai_valve_low_pressure());
    }
}

// The complex includes both WingAntiIceSystem parts.
// Each WingAntiIceSystem contains a consumer, a valve,
// an exhaust and a valve controller.
// There is one (shared) ground sense relay.
pub struct WingAntiIceComplex {
    // Left and Right wing
    wai_systems: [WingAntiIceSystem; 2],
    wai_relay: WingAntiIceRelay,
    wai_system_has_fault: bool,
    wai_selected: bool,

    wai_selected_id: VariableIdentifier,
    wai_fault_id: VariableIdentifier,
}
impl WingAntiIceComplex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            wai_systems: [
                WingAntiIceSystem::new(context, 1),
                WingAntiIceSystem::new(context, 2),
            ],
            wai_relay: WingAntiIceRelay::new(context),
            wai_system_has_fault: false,
            wai_selected: false,

            wai_selected_id: context
                .get_identifier("PNEU_WING_ANTI_ICE_SYSTEM_SELECTED".to_owned()),
            wai_fault_id: context.get_identifier("PNEU_WING_ANTI_ICE_HAS_FAULT".to_owned()),
        }
    }

    #[cfg(test)]
    pub fn is_wai_valve_closed(&self, number: usize) -> bool {
        self.wai_systems[number].is_wai_valve_closed()
    }

    #[cfg(test)]
    pub fn wai_consumer_pressure(&self, number: usize) -> Pressure {
        self.wai_systems[number].wai_consumer_pressure()
    }

    #[cfg(test)]
    pub fn wai_timer(&self) -> Duration {
        self.wai_relay.get_timer()
    }

    #[cfg(test)]
    pub fn wai_consumer_temperature(&self, number: usize) -> ThermodynamicTemperature {
        self.wai_systems[number].wai_consumer_temperature()
    }

    #[cfg(test)]
    pub fn wai_valve_controller_on(&self, number: usize) -> bool {
        self.wai_systems[number].wai_valve_controller_on()
    }

    #[cfg(test)]
    pub fn is_precoooler_pressurised(&self, number: usize) -> bool {
        self.wai_systems[number].is_precoooler_pressurised()
    }

    #[cfg(test)]
    pub fn wai_mass_flow(&self, number: usize) -> MassRate {
        self.wai_systems[number].wai_mass_flow()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine_systems: &mut [impl PneumaticContainer; 2],
        wai_mode: WingAntiIcePushButtonMode,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        // Reset the fault variable, then iterates through to check if there is a fault
        self.wai_system_has_fault = false;

        self.wai_relay.update(context, wai_mode, lgciu);

        for (wai_system, engine_system) in self.wai_systems.iter_mut().zip(engine_systems) {
            wai_system.update(context, engine_system, &self.wai_relay);
            self.wai_system_has_fault = self.wai_system_has_fault || wai_system.wai_has_fault();
        }

        self.wai_selected = wai_mode == WingAntiIcePushButtonMode::On;
    }
}
impl WingAntiIceSelected for WingAntiIceComplex {
    fn is_wai_selected(&self) -> bool {
        self.wai_selected
    }
}
impl SimulationElement for WingAntiIceComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.wai_systems, visitor);
        self.wai_relay.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.wai_selected_id, self.wai_selected);
        writer.write(&self.wai_fault_id, self.wai_system_has_fault);
    }
}
