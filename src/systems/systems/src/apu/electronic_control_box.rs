use super::{
    AirIntakeFlap, AirIntakeFlapController, AuxiliaryPowerUnitFireOverheadPanel,
    AuxiliaryPowerUnitOverheadPanel, FuelPressureSwitch, Turbine, TurbineController, TurbineState,
};
use crate::{
    electrical::PotentialSource,
    pneumatic::{BleedAirValveController, Valve},
    shared::{ApuMaster, ApuStart, ApuStartContactorsController},
    simulation::UpdateContext,
};
use std::time::Duration;
use uom::si::{f64::*, length::foot, ratio::percent, thermodynamic_temperature::degree_celsius};

/// Powered by the DC BAT BUS (801PP).
/// Not yet implemented. Will power this up when implementing the electrical system.
/// It is powered when MASTER SW is ON.
pub struct ElectronicControlBox {
    turbine_state: TurbineState,
    master_is_on: bool,
    start_is_on: bool,
    start_motor_is_powered: bool,
    n: Ratio,
    bleed_is_on: bool,
    bleed_air_valve_last_open_time_ago: Duration,
    fault: Option<ApuFault>,
    air_intake_flap_fully_open: bool,
    egt: ThermodynamicTemperature,
    egt_warning_temperature: ThermodynamicTemperature,
    n_above_95_duration: Duration,
    fire_button_is_released: bool,
}
impl ElectronicControlBox {
    const RUNNING_WARNING_EGT: f64 = 682.;
    pub const BLEED_AIR_COOLDOWN_DURATION_MILLIS: u64 = 120000;

    pub fn new() -> Self {
        ElectronicControlBox {
            turbine_state: TurbineState::Shutdown,
            master_is_on: false,
            start_is_on: false,
            start_motor_is_powered: false,
            n: Ratio::new::<percent>(0.),
            bleed_is_on: false,
            bleed_air_valve_last_open_time_ago: Duration::from_secs(1000),
            fault: None,
            air_intake_flap_fully_open: false,
            egt: ThermodynamicTemperature::new::<degree_celsius>(0.),
            egt_warning_temperature: ThermodynamicTemperature::new::<degree_celsius>(
                ElectronicControlBox::RUNNING_WARNING_EGT,
            ),
            n_above_95_duration: Duration::from_secs(0),
            fire_button_is_released: false,
        }
    }

    pub fn update_overhead_panel_state(
        &mut self,
        overhead: &AuxiliaryPowerUnitOverheadPanel,
        fire_overhead: &AuxiliaryPowerUnitFireOverheadPanel,
        apu_bleed_is_on: bool,
    ) {
        self.master_is_on = overhead.master_sw_is_on();
        self.start_is_on = overhead.start_is_on();
        self.bleed_is_on = apu_bleed_is_on;
        self.fire_button_is_released = fire_overhead.fire_button_is_released();
        if fire_overhead.fire_button_is_released() {
            self.fault = Some(ApuFault::ApuFire);
        }
    }

    pub fn update_air_intake_flap_state(&mut self, air_intake_flap: &AirIntakeFlap) {
        self.air_intake_flap_fully_open = air_intake_flap.is_fully_open();
    }

    pub fn update_start_motor_state(&mut self, start_motor: &impl PotentialSource) {
        self.start_motor_is_powered = start_motor.is_powered();

        if self.should_close_start_contactors() && !self.start_motor_is_powered {
            self.fault = Some(ApuFault::DcPowerLoss);
        }
    }

    pub fn update(&mut self, context: &UpdateContext, turbine: &mut dyn Turbine) {
        self.n = turbine.n();
        self.egt = turbine.egt();
        self.turbine_state = turbine.state();
        self.egt_warning_temperature =
            ElectronicControlBox::calculate_egt_warning_temperature(context, &self.turbine_state);

        if self.n.get::<percent>() > 95. {
            self.n_above_95_duration += context.delta();
        } else {
            self.n_above_95_duration = Duration::from_secs(0);
        }

        if !self.master_is_on && self.n.get::<percent>() == 0. {
            // We reset the fault when master is not on and the APU is not running.
            // Once electrical is implemented, the ECB will be unpowered that will reset the fault.
            self.fault = None;
        }
    }

    pub fn update_bleed_air_valve_state(
        &mut self,
        context: &UpdateContext,
        bleed_air_valve: &impl Valve,
    ) {
        if bleed_air_valve.is_open() {
            self.bleed_air_valve_last_open_time_ago = Duration::from_secs(0);
        } else {
            self.bleed_air_valve_last_open_time_ago += context.delta();
        }
    }

    pub fn update_fuel_pressure_switch_state(&mut self, fuel_pressure_switch: &FuelPressureSwitch) {
        if self.fault == None
            && 3. <= self.n.get::<percent>()
            && !fuel_pressure_switch.has_pressure()
        {
            self.fault = Some(ApuFault::FuelLowPressure);
        }
    }

    fn calculate_egt_warning_temperature(
        context: &UpdateContext,
        turbine_state: &TurbineState,
    ) -> ThermodynamicTemperature {
        let running_warning_temperature = ThermodynamicTemperature::new::<degree_celsius>(
            ElectronicControlBox::RUNNING_WARNING_EGT,
        );
        match turbine_state {
            TurbineState::Shutdown => running_warning_temperature,
            TurbineState::Starting => {
                const STARTING_WARNING_EGT_BELOW_25000_FEET: f64 = 900.;
                const STARTING_WARNING_EGT_AT_OR_ABOVE_25000_FEET: f64 = 982.;
                if context.indicated_altitude().get::<foot>() < 25_000. {
                    ThermodynamicTemperature::new::<degree_celsius>(
                        STARTING_WARNING_EGT_BELOW_25000_FEET,
                    )
                } else {
                    ThermodynamicTemperature::new::<degree_celsius>(
                        STARTING_WARNING_EGT_AT_OR_ABOVE_25000_FEET,
                    )
                }
            }
            TurbineState::Running => running_warning_temperature,
            TurbineState::Stopping => running_warning_temperature,
        }
    }

    /// Indicates if a fault has occurred which would cause the
    /// MASTER SW fault light to turn on.
    pub fn has_fault(&self) -> bool {
        self.fault.is_some()
    }

    pub fn is_auto_shutdown(&self) -> bool {
        !self.is_emergency_shutdown() && self.has_fault()
    }

    pub fn is_emergency_shutdown(&self) -> bool {
        self.fault == Some(ApuFault::ApuFire)
    }

    pub fn is_inoperable(&self) -> bool {
        self.has_fault() || self.fire_button_is_released
    }

    pub fn has_fuel_low_pressure_fault(&self) -> bool {
        if let Some(fault) = self.fault {
            fault == ApuFault::FuelLowPressure
        } else {
            false
        }
    }

    pub fn bleed_air_valve_was_open_in_last(&self, duration: Duration) -> bool {
        self.bleed_air_valve_last_open_time_ago <= duration
    }

    pub fn is_available(&self) -> bool {
        !self.has_fault()
            && ((self.turbine_state == TurbineState::Starting
                && (Duration::from_secs(2) <= self.n_above_95_duration
                    || self.n.get::<percent>() > 99.5))
                || (self.turbine_state != TurbineState::Starting && self.n.get::<percent>() > 95.))
    }

    pub fn egt_warning_temperature(&self) -> ThermodynamicTemperature {
        self.egt_warning_temperature
    }

    pub fn egt_caution_temperature(&self) -> ThermodynamicTemperature {
        const WARNING_TO_CAUTION_DIFFERENCE: f64 = 33.;
        ThermodynamicTemperature::new::<degree_celsius>(
            self.egt_warning_temperature.get::<degree_celsius>() - WARNING_TO_CAUTION_DIFFERENCE,
        )
    }

    pub fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    pub fn n(&self) -> Ratio {
        self.n
    }

    pub fn is_starting(&self) -> bool {
        self.turbine_state == TurbineState::Starting
    }
}
impl ApuStartContactorsController for ElectronicControlBox {
    /// Indicates if the APU start contactor should be closed.
    fn should_close_start_contactors(&self) -> bool {
        if self.is_inoperable() {
            false
        } else {
            match self.turbine_state {
                TurbineState::Shutdown => {
                    self.master_is_on && self.start_is_on && self.air_intake_flap_fully_open
                }
                TurbineState::Starting => {
                    const START_MOTOR_POWERED_UNTIL_N: f64 = 55.;
                    self.turbine_state == TurbineState::Starting
                        && self.n.get::<percent>() < START_MOTOR_POWERED_UNTIL_N
                }
                _ => false,
            }
        }
    }
}
impl AirIntakeFlapController for ElectronicControlBox {
    /// Indicates if the air intake flap should be opened.
    fn should_open_air_intake_flap(&self) -> bool {
        match self.turbine_state {
            TurbineState::Shutdown => self.master_is_on,
            TurbineState::Starting => true,
            // While running, the air intake flap remains open.
            TurbineState::Running => true,
            // Manual shutdown sequence: the air intake flap closes at N = 7%.
            TurbineState::Stopping => self.master_is_on || 7. <= self.n.get::<percent>(),
        }
    }
}
impl TurbineController for ElectronicControlBox {
    /// Indicates if the start sequence should be started.
    fn should_start(&self) -> bool {
        self.start_motor_is_powered
    }

    fn should_stop(&self) -> bool {
        self.is_auto_shutdown()
            || self.is_emergency_shutdown()
            || (!self.master_is_on
                && self.turbine_state != TurbineState::Starting
                && !self.bleed_air_valve_was_open_in_last(Duration::from_millis(
                    ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS,
                )))
    }
}
impl BleedAirValveController for ElectronicControlBox {
    fn should_open_bleed_air_valve(&self) -> bool {
        self.fault != Some(ApuFault::ApuFire)
            && self.master_is_on
            && self.n.get::<percent>() > 95.
            && self.bleed_is_on
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum ApuFault {
    ApuFire,
    FuelLowPressure,
    DcPowerLoss,
}
