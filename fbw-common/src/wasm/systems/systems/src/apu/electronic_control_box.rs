use std::marker::PhantomData;
use std::time::Duration;

use uom::si::{
    f64::*, mass_concentration::kilogram_per_liter, power::watt, pressure::bar, pressure::psi,
    ratio::percent, thermodynamic_temperature::degree_celsius, volume_rate::gallon_per_minute,
};

use crate::shared::{EngineCorrectedN1, LgciuWeightOnWheels};
use crate::simulation::{InitContext, SimulatorReader, VariableIdentifier};
use crate::{
    pneumatic::PneumaticValveSignal,
    shared::{
        arinc429::SignStatus, ApuBleedAirValveSignal, ApuMaster, ApuStart, ConsumePower,
        ContactorSignal, ControllerSignal, ElectricalBusType, ElectricalBuses, PneumaticValve,
    },
    simulation::{Read, SimulationElement, SimulatorWriter, UpdateContext, Write},
};

use super::ApuConstants;
use super::{
    air_intake_flap::AirIntakeFlapSignal, AirIntakeFlap, ApuStartMotor,
    AuxiliaryPowerUnitFireOverheadPanel, AuxiliaryPowerUnitOverheadPanel, FuelPressureSwitch,
    Turbine, TurbineSignal, TurbineState,
};

pub(super) struct ElectronicControlBox<C: ApuConstants> {
    apu_n_raw_id: VariableIdentifier,
    apu_n_id: VariableIdentifier,
    apu_n2_id: VariableIdentifier,
    apu_egt_id: VariableIdentifier,
    apu_egt_caution_id: VariableIdentifier,
    apu_egt_warning_id: VariableIdentifier,
    apu_low_fuel_pressure_fault_id: VariableIdentifier,
    apu_flap_fully_open_id: VariableIdentifier,
    apu_fuel_used_id: VariableIdentifier,
    ecam_inop_sys_apu_id: VariableIdentifier,
    apu_is_auto_shutdown_id: VariableIdentifier,
    apu_is_emergency_shutdown_id: VariableIdentifier,
    apu_bleed_air_pressure_id: VariableIdentifier,
    apu_fuel_line_flow_id: VariableIdentifier,

    powered_by: ElectricalBusType,
    is_powered: bool,
    turbine_state: TurbineState,
    master_is_on: bool,
    master_off_for: Duration,
    start_is_on: bool,
    start_motor_is_powered: bool,
    n: Ratio,
    n2: Ratio,
    bleed_is_on: bool,
    bleed_air_valve_last_open_time_ago: Duration,
    bleed_air_pressure: Pressure,
    fault: Option<ApuFault>,
    fuel_flow: VolumeRate,
    fuel_used: Mass,
    air_intake_flap_open_amount: Ratio,
    egt: ThermodynamicTemperature,
    egt_warning_temperature: ThermodynamicTemperature,
    n_above_95_duration: Duration,
    fire_button_is_released: bool,
    engines_on: bool,
    on_ground: bool,
    /** Absolute air pressure sensor in the air intake assembly. */
    inlet_pressure: Pressure,
    /// This is set by the Aircraft Presets to facilitate quick startup or shutdown
    /// of the aircraft.
    /// In the context of the ecb this means that the APU cooldown is skipped.
    aircraft_preset_quick_mode: bool,

    constants: PhantomData<C>,
}
impl<C: ApuConstants> ElectronicControlBox<C> {
    const START_MOTOR_POWERED_UNTIL_N: f64 = 55.;
    const JET_A_1_DENSITY: f64 = 0.804; // Kilograms per Liter

    pub fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        ElectronicControlBox {
            apu_n_raw_id: context.get_identifier("APU_N_RAW".to_owned()),
            apu_n_id: context.get_identifier("APU_N".to_owned()),
            apu_n2_id: context.get_identifier("APU_N2".to_owned()),
            apu_egt_id: context.get_identifier("APU_EGT".to_owned()),
            apu_egt_caution_id: context.get_identifier("APU_EGT_CAUTION".to_owned()),
            apu_egt_warning_id: context.get_identifier("APU_EGT_WARNING".to_owned()),
            apu_low_fuel_pressure_fault_id: context
                .get_identifier("APU_LOW_FUEL_PRESSURE_FAULT".to_owned()),
            apu_flap_fully_open_id: context.get_identifier("APU_FLAP_FULLY_OPEN".to_owned()),
            apu_fuel_used_id: context.get_identifier("APU_FUEL_USED".to_owned()),
            ecam_inop_sys_apu_id: context.get_identifier("ECAM_INOP_SYS_APU".to_owned()),
            apu_is_auto_shutdown_id: context.get_identifier("APU_IS_AUTO_SHUTDOWN".to_owned()),
            apu_is_emergency_shutdown_id: context
                .get_identifier("APU_IS_EMERGENCY_SHUTDOWN".to_owned()),
            apu_bleed_air_pressure_id: context.get_identifier("APU_BLEED_AIR_PRESSURE".to_owned()),
            apu_fuel_line_flow_id: context
                .get_identifier(format!("FUELSYSTEM LINE FUEL FLOW:{}", C::FUEL_LINE_ID)),

            powered_by,
            is_powered: false,
            turbine_state: TurbineState::Shutdown,
            master_is_on: false,
            master_off_for: Duration::ZERO,
            start_is_on: false,
            start_motor_is_powered: false,
            n: Ratio::new::<percent>(0.),
            n2: Ratio::default(),
            bleed_is_on: false,
            bleed_air_valve_last_open_time_ago: Duration::from_secs(1000),
            bleed_air_pressure: Pressure::new::<psi>(0.),
            fault: None,
            fuel_flow: VolumeRate::default(),
            fuel_used: Mass::default(),
            air_intake_flap_open_amount: Ratio::new::<percent>(0.),
            egt: ThermodynamicTemperature::new::<degree_celsius>(0.),
            egt_warning_temperature: ThermodynamicTemperature::new::<degree_celsius>(
                C::RUNNING_WARNING_EGT,
            ),
            n_above_95_duration: Duration::from_secs(0),
            fire_button_is_released: false,
            engines_on: false,
            on_ground: false,
            inlet_pressure: Pressure::new::<bar>(0.94),
            aircraft_preset_quick_mode: false,

            constants: PhantomData,
        }
    }

    pub fn is_on(&self) -> bool {
        self.is_powered
            && (self.master_is_on
                || (self.air_intake_flap_open_amount.get::<percent>() - 0.).abs() > f64::EPSILON
                || self.turbine_state != TurbineState::Shutdown)
    }

    fn is_powered_by_apu_itself(&self) -> bool {
        self.n().get::<percent>() > 70.
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

    pub fn update_apu_fire(&mut self, should_emergency_shut_down: bool) {
        if should_emergency_shut_down {
            self.fault = Some(ApuFault::ApuFire)
        }
    }

    pub fn update_air_intake_flap_state(&mut self, air_intake_flap: &AirIntakeFlap) {
        self.air_intake_flap_open_amount = air_intake_flap.open_amount();
    }

    pub fn update_air_intake_state(&mut self, context: &UpdateContext) {
        // FIXME simulate sensor failure (with fallback value logic)
        self.inlet_pressure = context.ambient_pressure();
    }

    pub fn update_start_motor_state(&mut self, start_motor: &impl ApuStartMotor) {
        self.start_motor_is_powered = start_motor.is_powered();

        if matches!(
            <ElectronicControlBox<C> as ControllerSignal<ContactorSignal>>::signal(self),
            Some(ContactorSignal::Close)
        ) && !self.start_motor_is_powered
        {
            self.fault = Some(ApuFault::DcPowerLoss);
        }
    }

    pub fn update(&mut self, context: &UpdateContext, turbine: &dyn Turbine) {
        self.aircraft_preset_quick_mode = context.aircraft_preset_quick_mode();

        self.update_air_intake_state(context);
        self.update_fuel_used(context);

        self.n2 = turbine.n2();
        self.n = turbine.n();
        self.egt = turbine.egt();
        self.turbine_state = turbine.state();
        self.bleed_air_pressure = turbine.bleed_air_pressure();

        self.egt_warning_temperature = self.calculate_egt_warning_temperature(&self.turbine_state);
        if self.n.get::<percent>() > 95. {
            self.n_above_95_duration += context.delta();
        } else {
            self.n_above_95_duration = Duration::from_secs(0);
        }

        if !self.is_on() {
            self.fault = None;
        }

        if !self.master_is_on {
            self.master_off_for += context.delta()
        } else {
            self.master_off_for = Duration::ZERO
        }
    }

    pub fn update_bleed_air_valve_state(
        &mut self,
        context: &UpdateContext,
        bleed_air_valve: &impl PneumaticValve,
    ) {
        if bleed_air_valve.is_open() {
            self.bleed_air_valve_last_open_time_ago = Duration::from_secs(0);
        } else {
            self.bleed_air_valve_last_open_time_ago += context.delta();
        }
    }

    pub fn update_fuel_pressure_switch_state(&mut self, fuel_pressure_switch: &FuelPressureSwitch) {
        if self.fault.is_none()
            && 0. < self.n.get::<percent>()
            && !fuel_pressure_switch.has_pressure()
        {
            self.fault = Some(ApuFault::FuelLowPressure);
        }
    }

    fn update_fuel_used(&mut self, context: &UpdateContext) {
        self.fuel_used += self.fuel_flow
            * MassConcentration::new::<kilogram_per_liter>(Self::JET_A_1_DENSITY)
            * context.delta_as_time();
    }

    pub(super) fn update_fuel_used_reset(
        &mut self,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        let should_reset_fuel_used = (self.on_ground
            && self.is_available()
            && (self.engines_on
                != engines
                    .iter()
                    .any(|&x| x.corrected_n1() > Ratio::new::<percent>(10.))))
            || (!self.on_ground && lgciu.iter().all(|a| a.left_and_right_gear_compressed(true)))
            // The fuel used resets in flight during APU start up. Here we reset it when n is between 94% and 96%
            || (!self.on_ground
                && (self.turbine_state == TurbineState::Starting
                    && (94.0..=96.0).contains(&self.n.get::<percent>())));

        self.on_ground = lgciu.iter().any(|a| a.left_and_right_gear_compressed(true));
        self.engines_on = engines
            .iter()
            .any(|&x| x.corrected_n1() > Ratio::new::<percent>(10.));

        if should_reset_fuel_used {
            self.fuel_used = Mass::default();
        }
    }

    fn calculate_egt_warning_temperature(
        &self,
        turbine_state: &TurbineState,
    ) -> ThermodynamicTemperature {
        let running_warning_temperature =
            ThermodynamicTemperature::new::<degree_celsius>(C::RUNNING_WARNING_EGT);
        match turbine_state {
            TurbineState::Shutdown => running_warning_temperature,
            TurbineState::Starting => {
                const STARTING_WARNING_EGT_BELOW_25000_FEET: f64 = 900.;
                const STARTING_WARNING_EGT_AT_OR_ABOVE_25000_FEET: f64 = 982.;
                let fl250_isa_pressure = Pressure::new::<psi>(5.45);

                if self.inlet_pressure > fl250_isa_pressure {
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

    fn is_cooldown_period(&self) -> bool {
        !self.master_is_on && (self.master_off_for <= C::COOLDOWN_DURATION)
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
            && !self.is_cooldown_period()
            && (!(self.turbine_state == TurbineState::Stopping)
                || C::SHOULD_BE_AVAILABLE_DURING_SHUTDOWN)
    }

    pub fn egt_caution_temperature(&self) -> ThermodynamicTemperature {
        const WARNING_TO_CAUTION_DIFFERENCE: f64 = 33.;
        ThermodynamicTemperature::new::<degree_celsius>(
            self.egt_warning_temperature.get::<degree_celsius>() - WARNING_TO_CAUTION_DIFFERENCE,
        )
    }

    pub fn n(&self) -> Ratio {
        self.n
    }

    fn n2(&self) -> Ratio {
        self.n2
    }

    pub fn is_starting(&self) -> bool {
        self.turbine_state == TurbineState::Starting
    }

    fn air_intake_flap_is_fully_open(&self) -> bool {
        (self.air_intake_flap_open_amount.get::<percent>() - 100.).abs() < f64::EPSILON
    }

    fn fuel_used(&self) -> Mass {
        self.fuel_used
    }

    /// Determines if a cooldown is required for the APU.
    ///
    /// This method checks if the APU is in quick mode (for Aircraft Presets) or not.
    /// If it is in quick mode, cooldown is not required and the method returns false.
    /// If the APU is not in quick mode, the method checks if the bleed air valve was open
    /// in the last cooldown duration or if the APU is in a cooldown period.
    /// If either of these conditions is true, the method returns true indicating that
    /// a cooldown is required.
    /// Otherwise, it returns false.
    ///
    /// # Returns
    ///
    /// * `bool` - True if a cooldown is required, false otherwise.
    fn is_cooldown_required(&self) -> bool {
        let cool_down_required: bool;
        // this allows the Aircraft Presets to immediately power off the aircraft
        // without waiting for the APU to cool down
        if self.aircraft_preset_quick_mode {
            cool_down_required = false;
            println!("apu/electronic_control_box.rs: Aircraft Preset Quick Mode is active. APU cooldown is skipped.");
        } else {
            cool_down_required = self
                .bleed_air_valve_was_open_in_last(C::BLEED_AIR_COOLDOWN_DURATION)
                || self.is_cooldown_period();
        };
        cool_down_required
    }
}
/// APU start Motor contactors controller
impl<C: ApuConstants> ControllerSignal<ContactorSignal> for ElectronicControlBox<C> {
    fn signal(&self) -> Option<ContactorSignal> {
        if !self.is_on() {
            return None;
        }

        if self.is_inoperable() {
            return Some(ContactorSignal::Open);
        }

        match self.turbine_state {
            TurbineState::Shutdown
                if {
                    self.master_is_on && self.start_is_on && self.air_intake_flap_is_fully_open()
                } =>
            {
                Some(ContactorSignal::Close)
            }
            TurbineState::Starting
                if {
                    self.turbine_state == TurbineState::Starting
                        && self.n.get::<percent>() < Self::START_MOTOR_POWERED_UNTIL_N
                } =>
            {
                Some(ContactorSignal::Close)
            }
            _ => Some(ContactorSignal::Open),
        }
    }
}
impl<C: ApuConstants> ControllerSignal<AirIntakeFlapSignal> for ElectronicControlBox<C> {
    fn signal(&self) -> Option<AirIntakeFlapSignal> {
        if !self.is_on() {
            None
        } else if match self.turbine_state {
            TurbineState::Shutdown => self.master_is_on,
            TurbineState::Starting => true,
            // While running, the air intake flap remains open.
            TurbineState::Running => true,
            // Manual shutdown sequence: the air intake flap closes at N = 7% (APS3200) / 8% (PW980).
            TurbineState::Stopping => {
                self.master_is_on || C::AIR_INTAKE_FLAP_CLOSURE_PERCENT <= self.n.get::<percent>()
            }
        } {
            Some(AirIntakeFlapSignal::Open)
        } else {
            Some(AirIntakeFlapSignal::Close)
        }
    }
}
impl<C: ApuConstants> ControllerSignal<TurbineSignal> for ElectronicControlBox<C> {
    fn signal(&self) -> Option<TurbineSignal> {
        if !self.is_on() {
            return None;
        }

        if self.is_auto_shutdown()
            || self.is_emergency_shutdown()
            || (!self.master_is_on
                && self.turbine_state != TurbineState::Starting
                && !self.is_cooldown_required())
        {
            Some(TurbineSignal::Stop)
        } else if self.start_motor_is_powered
            || self.n.get::<percent>() >= Self::START_MOTOR_POWERED_UNTIL_N
        {
            Some(TurbineSignal::StartOrContinue)
        } else {
            None
        }
    }
}

/// Bleed air valve controller
impl<C: ApuConstants> ControllerSignal<ApuBleedAirValveSignal> for ElectronicControlBox<C> {
    fn signal(&self) -> Option<ApuBleedAirValveSignal> {
        if !self.is_on() {
            None
        } else if self.fault != Some(ApuFault::ApuFire)
            && self.master_is_on
            && self.n.get::<percent>() > 95.
            && self.bleed_is_on
        {
            Some(ApuBleedAirValveSignal::new_open())
        } else {
            Some(ApuBleedAirValveSignal::new_closed())
        }
    }
}
impl<C: ApuConstants> SimulationElement for ElectronicControlBox<C> {
    fn write(&self, writer: &mut SimulatorWriter) {
        let ssm = if self.is_on() {
            SignStatus::NormalOperation
        } else {
            SignStatus::FailureWarning
        };

        // For sound and effects.
        writer.write(&self.apu_n_raw_id, self.n());

        writer.write_arinc429(&self.apu_n_id, self.n(), ssm);
        writer.write_arinc429(&self.apu_n2_id, self.n2(), ssm);
        writer.write_arinc429(&self.apu_egt_id, self.egt, ssm);
        writer.write_arinc429(
            &self.apu_egt_caution_id,
            self.egt_caution_temperature(),
            ssm,
        );
        writer.write_arinc429(&self.apu_egt_warning_id, self.egt_warning_temperature, ssm);
        writer.write_arinc429(
            &self.apu_low_fuel_pressure_fault_id,
            self.has_fuel_low_pressure_fault(),
            ssm,
        );
        writer.write_arinc429(
            &self.apu_flap_fully_open_id,
            self.air_intake_flap_is_fully_open(),
            ssm,
        );
        writer.write_arinc429(&self.apu_fuel_used_id, self.fuel_used(), ssm);
        writer.write_arinc429(
            &self.apu_bleed_air_pressure_id,
            self.bleed_air_pressure,
            ssm,
        );

        // Flight Warning Computer related information.
        writer.write(&self.ecam_inop_sys_apu_id, self.is_inoperable());
        writer.write(&self.apu_is_auto_shutdown_id, self.is_auto_shutdown());
        writer.write(
            &self.apu_is_emergency_shutdown_id,
            self.is_emergency_shutdown(),
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let fuel_flow_gallon_per_hour: f64 = reader.read(&self.apu_fuel_line_flow_id);
        self.fuel_flow = VolumeRate::new::<gallon_per_minute>(fuel_flow_gallon_per_hour / 60.);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = self.is_powered_by_apu_itself() || buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        if !self.is_powered_by_apu_itself() && self.is_on() {
            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(105.))
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum ApuFault {
    ApuFire,
    FuelLowPressure,
    DcPowerLoss,
}
