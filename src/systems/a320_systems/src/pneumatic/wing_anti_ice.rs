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
        pid::PidController, random_from_normal_distribution, ControllerSignal, PneumaticValve,
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

    pub fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
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
    wing_anti_ice_button_pos: WingAntiIcePushButtonMode, // The position of the button
    valve_pid: PidController, // PID controller for the valve - to regulate pressure
    system_test_timer: Duration, // Timer to count up to 30 seconds
    system_test_done: bool,   // Timer reached 30 seconds while on the ground
    controller_signals_on: bool, // Status of the ON light. If button is pushed and
    // the test is finished, the ON light should turn off.
    supplier_pressurized: bool,

    is_on_ground_id: VariableIdentifier,
    is_on_ground: bool, //Needed for the 30 seconds test logic
}
impl WingAntiIceValveController {
    const WAI_TEST_TIME: Duration = Duration::from_secs(30);
    const WAI_VALVE_MEAN_SETPOINT: f64 = 22.5;
    const WAI_VALVE_STD_DEV_SETPOINT: f64 = 2.5;
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            wing_anti_ice_button_pos: WingAntiIcePushButtonMode::Off,
            // Setpoint is 22.5 +/- 2.5 (psi)
            valve_pid: PidController::new(
                0.05,
                0.01,
                0.,
                0.,
                1.,
                Self::choose_valve_setpoint(),
                1.,
            ),
            system_test_timer: Duration::from_secs(0),
            system_test_done: false,
            controller_signals_on: false,
            supplier_pressurized: false,

            is_on_ground_id: context.get_identifier("SIM ON GROUND".to_owned()),
            is_on_ground: Default::default(),
        }
    }

    fn choose_valve_setpoint() -> f64 {
        if cfg!(test) {
            return Self::WAI_VALVE_MEAN_SETPOINT;
        } else {
            return random_from_normal_distribution(
                Self::WAI_VALVE_MEAN_SETPOINT,
                Self::WAI_VALVE_STD_DEV_SETPOINT,
            );
        }
    }

    pub fn controller_signals_on(&self) -> bool {
        self.controller_signals_on
    }

    pub fn controller_valve_pid_output(&self) -> f64 {
        self.valve_pid.output()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        wing_anti_ice_button_pos: WingAntiIcePushButtonMode,
        supplier_pressurized: bool,
    ) {
        self.wing_anti_ice_button_pos = wing_anti_ice_button_pos;
        self.supplier_pressurized = supplier_pressurized;

        if self.wing_anti_ice_button_pos == WingAntiIcePushButtonMode::On {
            if self.is_on_ground && !self.system_test_done {
                if self.supplier_pressurized {
                    self.system_test_timer += context.delta();
                }
                self.system_test_timer = self.system_test_timer.min(Self::WAI_TEST_TIME);
                if self.system_test_timer == Self::WAI_TEST_TIME {
                    self.system_test_done = true;
                    self.controller_signals_on = false;
                } else {
                    self.controller_signals_on = true;
                }
            } else if !self.is_on_ground {
                self.controller_signals_on = true;
            }
        } else {
            self.controller_signals_on = false;
        }

        // If the plane has took off, we reset the timer
        // and set test_done to false in order for the
        // mechanism to work when landing.
        if !self.is_on_ground && self.system_test_timer > Duration::from_secs(0) {
            self.system_test_timer = Duration::from_secs(0);
            self.system_test_done = false;
        }
    }

    pub fn get_timer(&self) -> Duration {
        self.system_test_timer
    }
}
impl SimulationElement for WingAntiIceValveController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_on_ground = reader.read(&self.is_on_ground_id);
    }
}

// This is the part that interacts with the valve, via DefaultValve.update_open_amount.
// That method has if let Some(signal) = controller.signal(). The right hand side
// is what is returned from this implementation.
impl ControllerSignal<WingAntiIceValveSignal> for WingAntiIceValveController {
    fn signal(&self) -> Option<WingAntiIceValveSignal> {
        match self.wing_anti_ice_button_pos {
            WingAntiIcePushButtonMode::Off => Some(WingAntiIceValveSignal::new_closed()),
            WingAntiIcePushButtonMode::On => {
                // Even if the button is pushed, we need to check if either
                // the plane is airborne or it is within the 30 second timeframe.
                // Also, we need to check if the supplier is pressurized
                // since the valve is pneumatically operated.
                if self.supplier_pressurized
                    && (!self.is_on_ground || (self.is_on_ground && !self.system_test_done))
                {
                    Some(WingAntiIceValveSignal::new(Ratio::new::<ratio>(
                        self.valve_pid.output(),
                    )))
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

// FWC FAILURES TO IMPLEMENT
// WING A.ICE SYS FAULT
// WING A.ICE L(R) VALVE OPEN
// WING A.ICE OPEN ON GND
// WING A.ICE L(R) HI PR

// The entire WAI system could have been hard coded
// into A320Pneumatic, however I think this is cleaner.
// The complex includes both WAI parts. Each part contains
// a consumer, a valve and an exhaust.
//
// There are two valve controllers, one for each.
// Still need to figure out whether this is how it works.

// const not inside WingAntiIceComplex to link
// it with the size of the arrays in the struct
const NUM_OF_WAI: usize = 2;
pub struct WingAntiIceComplex {
    wai_exhaust: [PneumaticExhaust; NUM_OF_WAI],
    wai_valve: [DefaultValve; NUM_OF_WAI],
    wai_consumer: [WingAntiIceConsumer; NUM_OF_WAI],
    valve_controller: [WingAntiIceValveController; NUM_OF_WAI],
    wai_system_has_fault: bool,
    wai_system_on: bool,
    wai_shed: bool,
    wai_high_pressure: [bool; NUM_OF_WAI],
    wai_low_pressure: [bool; NUM_OF_WAI],
    wai_bleed_pressurised: [bool; NUM_OF_WAI],

    wai_on_id: VariableIdentifier,
    wai_fault_id: VariableIdentifier,
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
    const WAI_NOMINAL_EXHAUST_SPEED: f64 = 0.524;
    const WAI_LEAKING_EXHAUST_SPEED: f64 = 3.;
    const WAI_VALVE_TRANSFER_SPEED: f64 = 0.035;
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
                PneumaticExhaust::new(
                    Self::WAI_NOMINAL_EXHAUST_SPEED,
                    Self::WAI_LEAKING_EXHAUST_SPEED,
                    Pressure::new::<psi>(0.),
                ),
                PneumaticExhaust::new(
                    Self::WAI_NOMINAL_EXHAUST_SPEED,
                    Self::WAI_LEAKING_EXHAUST_SPEED,
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
            valve_controller: [
                WingAntiIceValveController::new(context),
                WingAntiIceValveController::new(context),
            ],

            wai_system_has_fault: false,
            wai_system_on: false,
            wai_shed: false,
            wai_high_pressure: [false, false],
            wai_low_pressure: [false, false],
            wai_bleed_pressurised: [false, false],

            // When switch is ON, but command is to turn WAI OFF (i.e. ground), hide EngineBleed from the BLEED page.
            // Implement relay 5DL
            wai_on_id: context.get_identifier("PNEU_WING_ANTI_ICE_SYSTEM_ON".to_owned()),
            wai_fault_id: context.get_identifier("PNEU_WING_ANTI_ICE_HAS_FAULT".to_owned()),

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

            // REMOVE!
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
        // The WAI valves open at min 10psi of pressure
        self.wai_bleed_pressurised[number] =
            precooler_pressure > context.ambient_pressure() + Pressure::new::<psi>(10.);
    }

    fn update_valve_controller(
        &mut self,
        context: &UpdateContext,
        wai_mode: WingAntiIcePushButtonMode,
        number: usize,
    ) {
        self.valve_controller[number].update(context, wai_mode, self.wai_bleed_pressurised[number]);
    }

    pub fn is_wai_valve_closed(&self, number: usize) -> bool {
        !self.wai_valve[number].is_open()
    }

    pub fn is_precoooler_pressurised(&self, number: usize) -> bool {
        self.wai_bleed_pressurised[number]
    }

    pub fn wai_consumer_pressure(&self, number: usize) -> Pressure {
        self.wai_consumer[number].pressure()
    }

    pub fn wai_consumer_temperature(&self, number: usize) -> ThermodynamicTemperature {
        self.wai_consumer[number].temperature()
    }

    // This is where the action happens
    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine_systems: &mut [EngineBleedAirSystem; 2],
        wai_mode: WingAntiIcePushButtonMode,
    ) {
        let mut has_fault: bool = false; // Tracks if the system has a fault
        let mut num_of_on: usize = 0; // Number of controllers that signal `on`

        for n in 0..NUM_OF_WAI {
            self.update_pressure_above_minimum(
                context,
                engine_systems[n].precooler_outlet_pressure(),
                n,
            );

            self.valve_controller[n].valve_pid.next_control_output(
                self.wai_consumer_pressure(n).get::<psi>(),
                Some(context.delta()),
            );

            // First, we see if the valve's open amount changes this update,
            // as a result of a change in the ovhd panel push button.
            // If the precooler is not pressurized, a FAULT should light.
            self.update_valve_controller(context, wai_mode, n);
            self.wai_valve[n].update_open_amount(&self.valve_controller[n]);

            // We need both controllers to signal `on` for the
            // system to be considered on without a fault.
            if self.valve_controller[n].controller_signals_on() {
                num_of_on += 1;
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
            // self.wai_valve[n].update_move_fluid(
            //     context,
            //     &mut engine_systems[n].precooler_outlet_pipe,
            //     &mut self.wai_consumer[n],
            // );
            self.wai_valve[n].update_move_fluid_with_transfer_speed(
                context,
                &mut engine_systems[n].precooler_outlet_pipe,
                &mut self.wai_consumer[n],
                Self::WAI_VALVE_TRANSFER_SPEED,
            );

            if self.wai_consumer_pressure(n).get::<bar>() <= Self::WAI_MIN_PRESSURE
                && !self.is_wai_valve_closed(n)
            {
                self.wai_high_pressure[n] = false;
                self.wai_low_pressure[n] = true;
                has_fault = true;
            } else if self.wai_consumer_pressure(n).get::<bar>() >= Self::WAI_MAX_PRESSURE
                && !self.is_wai_valve_closed(n)
            {
                self.wai_high_pressure[n] = true;
                self.wai_low_pressure[n] = false;
                has_fault = true;
            } else {
                self.wai_high_pressure[n] = false;
                self.wai_low_pressure[n] = false;
            }
        }

        self.wai_system_has_fault = has_fault;
        self.wai_system_on = wai_mode == WingAntiIcePushButtonMode::On;
    }
}

impl SimulationElement for WingAntiIceComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        for n in 0..NUM_OF_WAI {
            self.valve_controller[n].accept(visitor);
        }
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.wai_on_id, self.is_wai_system_on());
        writer.write(&self.wai_fault_id, self.wai_system_has_fault);
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use systems::{
        air_conditioning::{
            acs_controller::{Pack, PackFlowController},
            AirConditioningSystem, PackFlowControllers, ZoneType,
        },
        engine::leap_engine::LeapEngine,
        pneumatic::{EngineState, TargetPressureTemperatureSignal},
        shared::{ApuBleedAirValveSignal, EngineFirePushButtons, InternationalStandardAtmosphere},
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement,
        },
    };

    use std::time::Duration;

    use uom::si::{
        length::foot, mass_rate::kilogram_per_second, thermodynamic_temperature::degree_celsius,
    };

    use crate::{
        hydraulic::A320Hydraulic,
        systems::simulation::test::{ReadByName, WriteByName},
        A320Pneumatic, A320PneumaticOverheadPanel,
    };

    struct TestApu {
        bleed_air_valve_signal: ApuBleedAirValveSignal,
        bleed_air_pressure: Pressure,
        bleed_air_temperature: ThermodynamicTemperature,
    }
    impl TestApu {
        fn new() -> Self {
            Self {
                bleed_air_valve_signal: ApuBleedAirValveSignal::new_closed(),
                bleed_air_pressure: Pressure::new::<psi>(14.7),
                bleed_air_temperature: ThermodynamicTemperature::new::<degree_celsius>(15.),
            }
        }

        fn update(&self, bleed_valve: &mut impl ControllablePneumaticValve) {
            bleed_valve.update_open_amount::<ApuBleedAirValveSignal, Self>(self);
        }

        fn set_bleed_air_pressure(&mut self, pressure: Pressure) {
            self.bleed_air_pressure = pressure;
        }

        fn set_bleed_air_temperature(&mut self, temperature: ThermodynamicTemperature) {
            self.bleed_air_temperature = temperature;
        }

        fn set_bleed_air_valve_signal(&mut self, signal: ApuBleedAirValveSignal) {
            self.bleed_air_valve_signal = signal;
        }
    }
    impl ControllerSignal<ApuBleedAirValveSignal> for TestApu {
        fn signal(&self) -> Option<ApuBleedAirValveSignal> {
            Some(self.bleed_air_valve_signal)
        }
    }
    impl ControllerSignal<TargetPressureTemperatureSignal> for TestApu {
        fn signal(&self) -> Option<TargetPressureTemperatureSignal> {
            Some(TargetPressureTemperatureSignal::new(
                self.bleed_air_pressure,
                self.bleed_air_temperature,
            ))
        }
    }

    struct TestAirConditioning {
        a320_air_conditioning_system: AirConditioningSystem<3>,
    }
    impl TestAirConditioning {
        fn new(context: &mut InitContext) -> Self {
            let cabin_zones: [ZoneType; 3] =
                [ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)];

            Self {
                a320_air_conditioning_system: AirConditioningSystem::new(context, cabin_zones),
            }
        }
    }
    impl PackFlowControllers<3> for TestAirConditioning {
        fn pack_flow_controller(&self, pack_id: Pack) -> PackFlowController<3> {
            self.a320_air_conditioning_system
                .pack_flow_controller(pack_id)
        }
    }
    impl SimulationElement for TestAirConditioning {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.a320_air_conditioning_system.accept(visitor);

            visitor.visit(self);
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
        air_conditioning: TestAirConditioning,
        apu: TestApu,
        engine_1: LeapEngine,
        engine_2: LeapEngine,
        overhead_panel: A320PneumaticOverheadPanel,
        fire_pushbuttons: TestEngineFirePushButtons,
        hydraulic: A320Hydraulic,
    }
    impl PneumaticTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                pneumatic: A320Pneumatic::new(context),
                air_conditioning: TestAirConditioning::new(context),
                apu: TestApu::new(),
                engine_1: LeapEngine::new(context, 1),
                engine_2: LeapEngine::new(context, 2),
                overhead_panel: A320PneumaticOverheadPanel::new(context),
                fire_pushbuttons: TestEngineFirePushButtons::new(),
                hydraulic: A320Hydraulic::new(context),
            }
        }
    }
    impl Aircraft for PneumaticTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.apu.update(self.pneumatic.apu_bleed_air_valve());
            self.pneumatic.update(
                context,
                [&self.engine_1, &self.engine_2],
                &self.overhead_panel,
                &self.fire_pushbuttons,
                &self.apu,
                &self.air_conditioning,
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
            let mut test_bed = Self {
                test_bed: SimulationTestBed::<PneumaticTestAircraft>::new(|context| {
                    PneumaticTestAircraft::new(context)
                }),
            };
            test_bed.command_pack_flow_selector_position(1);

            test_bed
        }

        fn and_run(mut self) -> Self {
            self.run();

            self
        }

        fn and_stabilize(mut self) -> Self {
            for _ in 1..1000 {
                self.run_with_delta(Duration::from_millis(16));
            }

            self
        }

        fn and_stabilize_steps(mut self, n: usize) -> Self {
            for _ in 1..n {
                for _ in 1..1000 {
                    self.run_with_delta(Duration::from_millis(16));
                }
            }
            self
        }

        fn in_isa_atmosphere(mut self, altitude: Length) -> Self {
            self.set_ambient_pressure(InternationalStandardAtmosphere::pressure_at_altitude(
                altitude,
            ));
            self.set_ambient_temperature(InternationalStandardAtmosphere::temperature_at_altitude(
                altitude,
            ));

            self
        }

        fn stop_eng1(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", false);
            self.write_by_name("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(0.));
            self.write_by_name("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(0.));

            self
        }
        fn stop_eng2(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", false);
            self.write_by_name("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.));
            self.write_by_name("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.));

            self
        }

        fn idle_eng1(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
            self.write_by_name("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(0.55));
            self.write_by_name("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(0.2));
            self.write_by_name("ENGINE_STATE:1", EngineState::On);

            self
        }

        fn idle_eng2(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
            self.write_by_name("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.55));
            self.write_by_name("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.2));
            self.write_by_name("ENGINE_STATE:2", EngineState::On);

            self
        }

        fn power_eng1(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
            self.write_by_name("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(1.));
            self.write_by_name("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(1.));
            self.write_by_name("ENGINE_STATE:1", EngineState::On);

            self
        }

        fn power_eng2(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
            self.write_by_name("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(1.));
            self.write_by_name("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(1.));
            self.write_by_name("ENGINE_STATE:2", EngineState::On);

            self
        }

        fn wing_anti_ice_push_button(mut self, mode: WingAntiIcePushButtonMode) -> Self {
            match mode {
                WingAntiIcePushButtonMode::On => {
                    self.write_by_name("BUTTON_OVHD_ANTI_ICE_WING_Position", true)
                }
                _ => self.write_by_name("BUTTON_OVHD_ANTI_ICE_WING_Position", false),
            };

            self
        }

        fn command_pack_flow_selector_position(&mut self, value: u8) {
            self.write_by_name("KNOB_OVHD_AIRCOND_PACKFLOW_Position", value);
        }

        fn wing_anti_ice_system_on(&mut self) -> bool {
            self.read_by_name("PNEU_WING_ANTI_ICE_SYSTEM_ON")
        }

        fn is_sim_on_ground(&mut self) -> bool {
            self.read_by_name("SIM ON GROUND")
        }

        fn wing_anti_ice_has_fault(&mut self) -> bool {
            self.read_by_name("PNEU_WING_ANTI_ICE_HAS_FAULT")
        }

        //Utility functions to get info from the test bed
        fn left_precooler_pressurised(&self) -> bool {
            self.query(|a| a.pneumatic.wing_anti_ice.is_precoooler_pressurised(0))
        }

        fn right_precooler_pressurised(&self) -> bool {
            self.query(|a| a.pneumatic.wing_anti_ice.is_precoooler_pressurised(1))
        }

        fn left_wai_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.wing_anti_ice.wai_consumer_pressure(0))
        }
        fn right_wai_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.wing_anti_ice.wai_consumer_pressure(1))
        }

        fn left_wai_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.wing_anti_ice.wai_consumer_temperature(0))
        }

        fn right_wai_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.wing_anti_ice.wai_consumer_temperature(1))
        }

        fn left_precooler_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.engine_systems[0].precooler_outlet_pressure())
        }

        fn right_precooler_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.engine_systems[1].precooler_outlet_pressure())
        }

        fn left_precooler_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.engine_systems[0].precooler_outlet_temperature())
        }

        fn right_precooler_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.engine_systems[1].precooler_outlet_temperature())
        }

        fn left_valve_open_amount(&self) -> f64 {
            self.query(|a| {
                a.pneumatic.wing_anti_ice.wai_valve[0]
                    .open_amount()
                    .get::<ratio>()
            })
        }

        fn right_valve_open_amount(&self) -> f64 {
            self.query(|a| {
                a.pneumatic.wing_anti_ice.wai_valve[1]
                    .open_amount()
                    .get::<ratio>()
            })
        }

        fn left_valve_controller_timer(&self) -> Duration {
            self.query(|a| a.pneumatic.wing_anti_ice.valve_controller[0].get_timer())
        }

        fn right_valve_controller_timer(&self) -> Duration {
            self.query(|a| a.pneumatic.wing_anti_ice.valve_controller[1].get_timer())
        }

        fn left_valve_pid_output(&self) -> f64 {
            self.query(|a| {
                a.pneumatic.wing_anti_ice.valve_controller[0].controller_valve_pid_output()
            })
        }

        fn right_valve_pid_output(&self) -> f64 {
            self.query(|a| {
                a.pneumatic.wing_anti_ice.valve_controller[1].controller_valve_pid_output()
            })
        }

        fn left_valve_controller_on(&self) -> bool {
            self.query(|a| a.pneumatic.wing_anti_ice.valve_controller[0].controller_signals_on())
        }

        fn right_valve_controller_on(&self) -> bool {
            self.query(|a| a.pneumatic.wing_anti_ice.valve_controller[1].controller_signals_on())
        }

        fn left_valve_closed(&self) -> bool {
            self.query(|a| a.pneumatic.wing_anti_ice.is_wai_valve_closed(0))
        }

        fn right_valve_closed(&self) -> bool {
            self.query(|a| a.pneumatic.wing_anti_ice.is_wai_valve_closed(1))
        }

        fn left_valve_open(&self) -> bool {
            !self.left_valve_closed()
        }

        fn right_valve_open(&self) -> bool {
            !self.right_valve_closed()
        }

        fn left_exhaust_flow(&self) -> MassRate {
            self.query(|a| a.pneumatic.wing_anti_ice.wai_exhaust[0].fluid_flow())
        }

        fn right_exhaust_flow(&self) -> MassRate {
            self.query(|a| a.pneumatic.wing_anti_ice.wai_exhaust[1].fluid_flow())
        }
    }

    fn test_bed() -> PneumaticTestBed {
        PneumaticTestBed::new()
    }

    #[test]
    fn wing_anti_ice_simvars() {
        let test_bed = test_bed();

        assert!(test_bed.contains_variable_with_name("PNEU_WING_ANTI_ICE_SYSTEM_ON"));
        assert!(test_bed.contains_variable_with_name("PNEU_WING_ANTI_ICE_HAS_FAULT"));
        assert!(test_bed.contains_variable_with_name("PNEU_1_WING_ANTI_ICE_CONSUMER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_2_WING_ANTI_ICE_CONSUMER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_1_WING_ANTI_ICE_CONSUMER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_2_WING_ANTI_ICE_CONSUMER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_1_WING_ANTI_ICE_VALVE_CLOSED"));
        assert!(test_bed.contains_variable_with_name("PNEU_2_WING_ANTI_ICE_VALVE_CLOSED"));
        assert!(test_bed.contains_variable_with_name("BUTTON_OVHD_ANTI_ICE_WING_Position"));

        assert!(test_bed.contains_variable_with_name("PNEU_1_WING_ANTI_ICE_HIGH_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_2_WING_ANTI_ICE_HIGH_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_1_WING_ANTI_ICE_LOW_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_2_WING_ANTI_ICE_LOW_PRESSURE"));
    }

    #[test]
    fn wing_anti_ice_cold_and_dark() {
        let altitude = Length::new::<foot>(500.);
        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);
        let ambient_temperature =
            InternationalStandardAtmosphere::temperature_at_altitude(altitude);

        let temperature_epsilon = ThermodynamicTemperature::new::<degree_celsius>(0.05);
        let pressure_epsilon = Pressure::new::<psi>(0.01);

        let mut test_bed = test_bed()
            .stop_eng1()
            .stop_eng2()
            .in_isa_atmosphere(altitude);
        test_bed.set_on_ground(true);
        test_bed = test_bed.and_stabilize_steps(7);

        println!("left press = {}", test_bed.left_wai_pressure().get::<psi>());
        println!(
            "right press = {}",
            test_bed.right_wai_pressure().get::<psi>()
        );
        println!("ambient press = {}", ambient_pressure.get::<psi>());
        println!(
            "left temp = {}",
            test_bed.left_wai_temperature().get::<degree_celsius>()
        );
        println!(
            "right temp = {}",
            test_bed.right_wai_temperature().get::<degree_celsius>()
        );
        println!(
            "ambient temp = {}",
            ambient_temperature.get::<degree_celsius>()
        );

        assert!((test_bed.left_wai_pressure() - ambient_pressure).abs() < pressure_epsilon);
        assert!((test_bed.right_wai_pressure() - ambient_pressure).abs() < pressure_epsilon);
        assert!(
            (test_bed.left_wai_temperature().get::<degree_celsius>()
                - ambient_temperature.get::<degree_celsius>())
            .abs()
                < temperature_epsilon.get::<degree_celsius>()
        );
        assert!(
            (test_bed.right_wai_temperature().get::<degree_celsius>()
                - ambient_temperature.get::<degree_celsius>())
            .abs()
                < temperature_epsilon.get::<degree_celsius>()
        );
        assert!(!test_bed.left_valve_open());
        assert!(!test_bed.right_valve_open());
        assert!(!test_bed.wing_anti_ice_system_on());
        assert!(!test_bed.wing_anti_ice_has_fault());
    }

    #[test]
    fn wing_anti_ice_on_and_off() {
        let altitude = Length::new::<foot>(20000.);
        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);
        let ambient_temperature =
            InternationalStandardAtmosphere::temperature_at_altitude(altitude);

        let temperature_epsilon = ThermodynamicTemperature::new::<degree_celsius>(0.05);
        let pressure_epsilon = Pressure::new::<psi>(0.01);

        let mut test_bed = test_bed()
            .power_eng1()
            .power_eng2()
            .in_isa_atmosphere(altitude);
        test_bed.set_on_ground(false);
        test_bed = test_bed.and_stabilize_steps(7);

        test_bed = test_bed
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::Off)
            .and_stabilize();

        println!(
            "right press = {}",
            test_bed.right_wai_pressure().get::<psi>()
        );
        println!("ambient press = {}", ambient_pressure.get::<psi>());

        assert!((test_bed.left_wai_pressure() - ambient_pressure).abs() < pressure_epsilon);
        assert!((test_bed.right_wai_pressure() - ambient_pressure).abs() < pressure_epsilon);
        assert!(
            (test_bed.left_wai_temperature().get::<degree_celsius>()
                - ambient_temperature.get::<degree_celsius>())
            .abs()
                < temperature_epsilon.get::<degree_celsius>()
        );
        assert!(
            (test_bed.right_wai_temperature().get::<degree_celsius>()
                - ambient_temperature.get::<degree_celsius>())
            .abs()
                < temperature_epsilon.get::<degree_celsius>()
        );
        assert!(!test_bed.left_valve_open());
        assert!(!test_bed.right_valve_open());
        assert!(!test_bed.wing_anti_ice_system_on());
        assert!(!test_bed.wing_anti_ice_has_fault());

        test_bed = test_bed
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::On)
            .and_stabilize();

        println!(
            "right press = {}",
            test_bed.right_wai_pressure().get::<psi>()
        );

        println!(
            "right precooler press = {}",
            test_bed.right_precooler_pressure().get::<psi>()
        );

        // assert!(
        //     (test_bed.left_wai_pressure() - test_bed.precooler_pressure(0)).abs()
        //         < pressure_epsilon
        // );
        // assert!(
        //     (test_bed.right_wai_pressure() - test_bed.precooler_pressure(1)).abs()
        //         < pressure_epsilon
        // );

        assert!(test_bed.left_valve_open());
        assert!(test_bed.right_valve_open());
        assert!(test_bed.wing_anti_ice_system_on());
        assert!(!test_bed.wing_anti_ice_has_fault());
    }

    #[test]
    fn wing_anti_ice_has_fault_when_precooler_not_pressurized() {
        let altitude = Length::new::<foot>(500.);

        let mut test_bed = test_bed()
            .stop_eng1()
            .stop_eng2()
            .in_isa_atmosphere(altitude);
        test_bed.set_on_ground(true);
        test_bed = test_bed.and_stabilize();

        test_bed = test_bed
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::On)
            .and_stabilize();

        println!("left open amount = {}", test_bed.left_valve_open_amount());
        println!("right open amount = {}", test_bed.right_valve_open_amount());

        println!(
            "left precooler press = {}",
            test_bed.left_precooler_pressure().get::<psi>()
        );
        println!(
            "right precooler press = {}",
            test_bed.right_precooler_pressure().get::<psi>()
        );
        assert!(test_bed.wing_anti_ice_has_fault());
    }

    #[test]
    fn wing_anti_ice_no_fault_after_starting_engine() {
        let altitude = Length::new::<foot>(500.);
        let _wai_pressure: Pressure = Pressure::new::<psi>(22.5);
        let _pressure_epsilon: Pressure = Pressure::new::<psi>(0.1);

        let mut test_bed = test_bed()
            .stop_eng1()
            .stop_eng2()
            .in_isa_atmosphere(altitude);
        test_bed.set_on_ground(true);
        test_bed = test_bed.and_stabilize();

        test_bed = test_bed
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::On)
            .and_stabilize();
        assert!(test_bed.wing_anti_ice_has_fault());

        test_bed = test_bed.idle_eng1().idle_eng2().and_stabilize();
        println!("left press = {}", test_bed.left_wai_pressure().get::<psi>());
        println!(
            "right press = {}",
            test_bed.right_wai_pressure().get::<psi>()
        );
        println!(
            "left precooler pressurised = {}",
            test_bed.left_precooler_pressurised()
        );
        println!(
            "right precooler pressurised = {}",
            test_bed.right_precooler_pressurised()
        );
        println!(
            "left controller_signals_on = {}",
            test_bed.left_valve_controller_on()
        );
        println!(
            "right controller_signals_on = {}",
            test_bed.right_valve_controller_on()
        );
        println!("left open amount = {}", test_bed.left_valve_open_amount());
        println!("right open amount = {}", test_bed.right_valve_open_amount());
        println!(
            "left valve_pid_output = {}",
            test_bed.left_valve_pid_output()
        );
        println!(
            "right valve_pid_output = {}",
            test_bed.right_valve_pid_output()
        );
        assert!(!test_bed.wing_anti_ice_has_fault());
        assert!(test_bed.wing_anti_ice_system_on());
    }

    #[test]
    fn wing_anti_ice_timer_doesnt_start_if_precooler_not_pressurized() {
        let altitude = Length::new::<foot>(500.);

        let mut test_bed = test_bed()
            .stop_eng1()
            .stop_eng2()
            .in_isa_atmosphere(altitude);
        test_bed.set_on_ground(true);
        test_bed = test_bed.and_stabilize();

        test_bed = test_bed
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::On)
            .and_stabilize();
        assert!(test_bed.wing_anti_ice_has_fault());
        assert!(test_bed.left_valve_controller_timer() == Duration::from_secs(0));
        assert!(test_bed.right_valve_controller_timer() == Duration::from_secs(0));
    }

    #[test]
    fn wing_anti_ice_tweak_pid() {
        let altitude = Length::new::<foot>(10.);
        let _wai_pressure: Pressure = Pressure::new::<psi>(22.5);
        let _pressure_epsilon: Pressure = Pressure::new::<psi>(0.1);
        let mut test_bed = test_bed()
            .in_isa_atmosphere(altitude)
            .idle_eng1()
            .idle_eng2()
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::On);
        test_bed.set_on_ground(false);
        test_bed = test_bed.and_stabilize();

        assert!(test_bed.left_valve_controller_on());

        for _ in 0..50 {
            println!(
                "left pressure = {}",
                test_bed.left_wai_pressure().get::<psi>()
            );
            println!("left open amount = {}", test_bed.left_valve_open_amount());
            assert!(test_bed.left_valve_open_amount() != 0.);
            test_bed.run_with_delta(Duration::from_millis(16));
        }

        assert!(test_bed.left_valve_open());
    }

    #[test]
    fn wing_anti_ice_time_to_open() {
        let altitude = Length::new::<foot>(20000.);
        let wai_pressure: Pressure = Pressure::new::<psi>(22.5);
        let pressure_epsilon: Pressure = Pressure::new::<psi>(0.1);
        let mut test_bed = test_bed()
            .in_isa_atmosphere(altitude)
            .power_eng1()
            .power_eng2();
        test_bed.set_on_ground(false);
        test_bed = test_bed.and_stabilize();
        test_bed = test_bed.wing_anti_ice_push_button(WingAntiIcePushButtonMode::On);
        test_bed.run_with_delta(Duration::from_millis(16));

        let mut time_to_open_valve = Duration::from_millis(0);
        for _ in 0..1000 {
            println!(
                "left pressure = {}",
                test_bed.left_wai_pressure().get::<psi>()
            );
            // test_bed.left_wai_pressure().get::<psi>() < 22.;
            let wai_has_fault = test_bed.wing_anti_ice_has_fault();
            if wai_has_fault {
                time_to_open_valve += Duration::from_millis(16);
            } else {
                break;
            }
            test_bed.run_with_delta(Duration::from_millis(16));
        }
        println!(
            "Time to open left valve = {}",
            time_to_open_valve.as_secs_f32()
        );
        //assert!(test_bed.left_wai_pressure().get::<psi>() >= 22.);
        assert!(time_to_open_valve.as_secs_f32() >= 2.);
        assert!(time_to_open_valve.as_secs_f32() <= 3.);
        assert!(test_bed.left_valve_open());
    }

    #[test]
    fn wing_anti_ice_tweak_exhaust() {
        let altitude = Length::new::<foot>(22000.);
        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);
        let ambient_temperature =
            InternationalStandardAtmosphere::temperature_at_altitude(altitude);

        let _wai_pressure: Pressure = Pressure::new::<psi>(22.5);
        let _pressure_epsilon: Pressure = Pressure::new::<psi>(0.1);
        let test_bed = test_bed()
            .in_isa_atmosphere(altitude)
            .power_eng1()
            .power_eng2()
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::On)
            .and_stabilize_steps(7);

        assert!(test_bed.left_valve_controller_on());
        assert!(test_bed.left_valve_open());

        let left_flow_rate = test_bed.left_exhaust_flow().get::<kilogram_per_second>();
        let right_flow_rate = test_bed.right_exhaust_flow().get::<kilogram_per_second>();

        println!("left press = {}", test_bed.left_wai_pressure().get::<psi>());
        println!(
            "right press = {}",
            test_bed.right_wai_pressure().get::<psi>()
        );
        println!("ambient press = {}", ambient_pressure.get::<psi>());
        println!(
            "left temp = {}",
            test_bed.left_wai_temperature().get::<degree_celsius>()
        );
        println!(
            "right temp = {}",
            test_bed.right_wai_temperature().get::<degree_celsius>()
        );
        println!(
            "ambient temp = {}",
            ambient_temperature.get::<degree_celsius>()
        );
        println!("left exhaust flow = {}", left_flow_rate);
        println!("right exhaust flow = {}", right_flow_rate);

        // At 22000ft, flow rate is given at 0.327kg/s
        assert!(((left_flow_rate * 1000.0).round() - 327.0).abs() < 1.);
        assert!(((right_flow_rate * 1000.0).round() - 327.0).abs() < 1.);
    }

    #[test]
    fn wing_anti_ice_pressure_regulated() {
        let altitude = Length::new::<foot>(0.);
        let wai_pressure: Pressure = Pressure::new::<psi>(22.5);
        let pressure_epsilon: Pressure = Pressure::new::<psi>(0.1);

        let test_bed = test_bed()
            .in_isa_atmosphere(altitude)
            .idle_eng1()
            .idle_eng2()
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::On)
            .and_stabilize_steps(10);

        println!(
            "left pressure = {}",
            test_bed.left_wai_pressure().get::<psi>()
        );
        println!(
            "right pressure = {}",
            test_bed.right_wai_pressure().get::<psi>()
        );

        assert!((test_bed.left_wai_pressure() - wai_pressure).abs() < pressure_epsilon);
        assert!((test_bed.right_wai_pressure() - wai_pressure).abs() < pressure_epsilon);
    }

    #[test]
    fn wing_anti_ice_valve_close_after_30_seconds_on_ground() {
        let mut test_bed = test_bed()
            .idle_eng1()
            .idle_eng2()
            .in_isa_atmosphere(Length::new::<foot>(0.))
            .and_stabilize();
        test_bed.set_on_ground(true);

        assert!(test_bed.left_valve_controller_timer() == Duration::from_secs(0));
        assert!(test_bed.right_valve_controller_timer() == Duration::from_secs(0));

        test_bed = test_bed.wing_anti_ice_push_button(WingAntiIcePushButtonMode::On);
        test_bed.run_with_delta(Duration::from_millis(16));
        assert!(test_bed.wing_anti_ice_system_on());
        test_bed.run_with_delta(Duration::from_secs(1));

        assert!(test_bed.left_valve_open_amount() > 0.);
        assert!(test_bed.left_valve_controller_timer() < Duration::from_secs(2));
        assert!(test_bed.right_valve_open_amount() > 0.);
        assert!(test_bed.right_valve_controller_timer() < Duration::from_secs(2));

        test_bed.run_with_delta(Duration::from_secs(30));
        assert!(test_bed.left_valve_controller_timer() == Duration::from_secs(30));
        assert!(test_bed.left_valve_open_amount() == 0.);
        assert!(test_bed.right_valve_controller_timer() == Duration::from_secs(30));
        assert!(test_bed.right_valve_open_amount() == 0.);
        assert!(test_bed.wing_anti_ice_system_on());
    }

    #[test]
    fn wing_anti_ice_valve_open_after_leaving_ground_after_test() {
        let _altitude = Length::new::<foot>(500.);
        let mut test_bed = test_bed()
            .idle_eng1()
            .idle_eng2()
            .in_isa_atmosphere(Length::new::<foot>(0.))
            .and_stabilize();
        test_bed.set_on_ground(true);

        test_bed = test_bed.wing_anti_ice_push_button(WingAntiIcePushButtonMode::On);
        test_bed.run_with_delta(Duration::from_secs(31));

        assert!(test_bed.wing_anti_ice_system_on());
        assert!(test_bed.left_valve_open_amount() == 0.);
        assert!(test_bed.right_valve_open_amount() == 0.);

        test_bed.set_on_ground(false);
        test_bed.run_with_delta(Duration::from_secs(1));

        println!("left press = {}", test_bed.left_wai_pressure().get::<psi>());
        println!(
            "right press = {}",
            test_bed.right_wai_pressure().get::<psi>()
        );
        println!(
            "left precooler pressurised = {}",
            test_bed.left_precooler_pressurised()
        );
        println!(
            "right precooler pressurised = {}",
            test_bed.right_precooler_pressurised()
        );
        println!(
            "left controller_signals_on = {}",
            test_bed.left_valve_controller_on()
        );
        println!(
            "right controller_signals_on = {}",
            test_bed.right_valve_controller_on()
        );
        println!("left open amount = {}", test_bed.left_valve_open_amount());
        println!("right open amount = {}", test_bed.right_valve_open_amount());
        println!(
            "left valve_pid_output = {}",
            test_bed.left_valve_pid_output()
        );
        println!(
            "right valve_pid_output = {}",
            test_bed.right_valve_pid_output()
        );

        assert!(test_bed.wing_anti_ice_system_on());
        assert!(test_bed.left_valve_open_amount() > 0.);
        assert!(test_bed.right_valve_open_amount() > 0.);
        assert!(test_bed.left_valve_controller_timer() == Duration::from_secs(0));
        assert!(test_bed.right_valve_controller_timer() == Duration::from_secs(0));
    }

    #[test]
    fn wing_anti_ice_valve_controller_timer_starts_after_landing() {
        let altitude = Length::new::<foot>(500.);
        let mut test_bed = test_bed()
            .idle_eng1()
            .idle_eng2()
            .in_isa_atmosphere(altitude)
            .wing_anti_ice_push_button(WingAntiIcePushButtonMode::On)
            .and_stabilize();

        test_bed.set_on_ground(true);
        test_bed.run_with_delta(Duration::from_secs(30));
        assert!(!test_bed.left_valve_open());
        assert!(!test_bed.right_valve_open());

        test_bed.set_on_ground(false);
        test_bed.run_with_delta(Duration::from_millis(16));

        assert!(test_bed.left_valve_open_amount() > 0.);
        assert!(test_bed.right_valve_open_amount() > 0.);
        assert!(test_bed.left_valve_controller_timer() == Duration::from_secs(0));
        assert!(test_bed.right_valve_controller_timer() == Duration::from_secs(0));

        test_bed.set_on_ground(true);
        test_bed.run_with_delta(Duration::from_millis(500));

        assert!(test_bed.left_valve_open_amount() > 0.);
        assert!(test_bed.right_valve_open_amount() > 0.);
        assert!(test_bed.left_valve_controller_timer() > Duration::from_secs(0));
        assert!(test_bed.right_valve_controller_timer() > Duration::from_secs(0));

        test_bed.run_with_delta(Duration::from_secs(30));
        assert!(test_bed.left_valve_open_amount() == 0.);
        assert!(test_bed.right_valve_open_amount() == 0.);
    }
}
