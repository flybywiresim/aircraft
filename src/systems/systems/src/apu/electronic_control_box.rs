use super::{
    air_intake_flap::AirIntakeFlapSignal, AirIntakeFlap, ApuStartMotor,
    AuxiliaryPowerUnitFireOverheadPanel, AuxiliaryPowerUnitOverheadPanel, FuelPressureSwitch,
    Turbine, TurbineSignal, TurbineState,
};
use crate::simulation::{InitContext, VariableIdentifier};
use crate::{
    shared::{
        arinc429::SignStatus, ApuMaster, ApuStart, ConsumePower, ContactorSignal, ControllerSignal,
        ElectricalBusType, ElectricalBuses, PneumaticValve, PneumaticValveSignal,
    },
    simulation::{SimulationElement, SimulatorWriter, UpdateContext, Write},
};
use std::time::Duration;
use uom::si::{
    f64::*, length::foot, power::watt, ratio::percent, thermodynamic_temperature::degree_celsius,
};

pub(super) struct ElectronicControlBox {
    apu_n_raw_id: VariableIdentifier,
    apu_n_id: VariableIdentifier,
    apu_egt_id: VariableIdentifier,
    apu_egt_caution_id: VariableIdentifier,
    apu_egt_warning_id: VariableIdentifier,
    apu_low_fuel_pressure_fault_id: VariableIdentifier,
    apu_flap_fully_open_id: VariableIdentifier,
    ecam_inop_sys_apu_id: VariableIdentifier,
    apu_is_auto_shutdown_id: VariableIdentifier,
    apu_is_emergency_shutdown_id: VariableIdentifier,

    powered_by: ElectricalBusType,
    is_powered: bool,
    turbine_state: TurbineState,
    master_is_on: bool,
    start_is_on: bool,
    start_motor_is_powered: bool,
    n: Ratio,
    bleed_is_on: bool,
    bleed_air_valve_last_open_time_ago: Duration,
    fault: Option<ApuFault>,
    air_intake_flap_open_amount: Ratio,
    egt: ThermodynamicTemperature,
    egt_warning_temperature: ThermodynamicTemperature,
    n_above_95_duration: Duration,
    fire_button_is_released: bool,
}
impl ElectronicControlBox {
    const RUNNING_WARNING_EGT: f64 = 682.;
    const START_MOTOR_POWERED_UNTIL_N: f64 = 55.;
    pub const BLEED_AIR_COOLDOWN_DURATION_MILLIS: u64 = 120000;

    pub fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        ElectronicControlBox {
            apu_n_raw_id: context.get_identifier("APU_N_RAW".to_owned()),
            apu_n_id: context.get_identifier("APU_N".to_owned()),
            apu_egt_id: context.get_identifier("APU_EGT".to_owned()),
            apu_egt_caution_id: context.get_identifier("APU_EGT_CAUTION".to_owned()),
            apu_egt_warning_id: context.get_identifier("APU_EGT_WARNING".to_owned()),
            apu_low_fuel_pressure_fault_id: context
                .get_identifier("APU_LOW_FUEL_PRESSURE_FAULT".to_owned()),
            apu_flap_fully_open_id: context.get_identifier("APU_FLAP_FULLY_OPEN".to_owned()),
            ecam_inop_sys_apu_id: context.get_identifier("ECAM_INOP_SYS_APU".to_owned()),
            apu_is_auto_shutdown_id: context.get_identifier("APU_IS_AUTO_SHUTDOWN".to_owned()),
            apu_is_emergency_shutdown_id: context
                .get_identifier("APU_IS_EMERGENCY_SHUTDOWN".to_owned()),

            powered_by,
            is_powered: false,
            turbine_state: TurbineState::Shutdown,
            master_is_on: false,
            start_is_on: false,
            start_motor_is_powered: false,
            n: Ratio::new::<percent>(0.),
            bleed_is_on: false,
            bleed_air_valve_last_open_time_ago: Duration::from_secs(1000),
            fault: None,
            air_intake_flap_open_amount: Ratio::new::<percent>(0.),
            egt: ThermodynamicTemperature::new::<degree_celsius>(0.),
            egt_warning_temperature: ThermodynamicTemperature::new::<degree_celsius>(
                ElectronicControlBox::RUNNING_WARNING_EGT,
            ),
            n_above_95_duration: Duration::from_secs(0),
            fire_button_is_released: false,
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

    pub fn update_air_intake_flap_state(&mut self, air_intake_flap: &AirIntakeFlap) {
        self.air_intake_flap_open_amount = air_intake_flap.open_amount();
    }

    pub fn update_start_motor_state(&mut self, start_motor: &impl ApuStartMotor) {
        self.start_motor_is_powered = start_motor.is_powered();

        if matches!(
            <ElectronicControlBox as ControllerSignal<ContactorSignal>>::signal(&self),
            Some(ContactorSignal::Close)
        ) && !self.start_motor_is_powered
        {
            self.fault = Some(ApuFault::DcPowerLoss);
        }
    }

    pub fn update(&mut self, context: &UpdateContext, turbine: &dyn Turbine) {
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

        if !self.is_on() {
            self.fault = None;
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

    pub fn egt_caution_temperature(&self) -> ThermodynamicTemperature {
        const WARNING_TO_CAUTION_DIFFERENCE: f64 = 33.;
        ThermodynamicTemperature::new::<degree_celsius>(
            self.egt_warning_temperature.get::<degree_celsius>() - WARNING_TO_CAUTION_DIFFERENCE,
        )
    }

    pub fn n(&self) -> Ratio {
        self.n
    }

    pub fn is_starting(&self) -> bool {
        self.turbine_state == TurbineState::Starting
    }

    fn air_intake_flap_is_fully_open(&self) -> bool {
        (self.air_intake_flap_open_amount.get::<percent>() - 100.).abs() < f64::EPSILON
    }
}
/// APU start Motor contactors controller
impl ControllerSignal<ContactorSignal> for ElectronicControlBox {
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
impl ControllerSignal<AirIntakeFlapSignal> for ElectronicControlBox {
    fn signal(&self) -> Option<AirIntakeFlapSignal> {
        if !self.is_on() {
            None
        } else if match self.turbine_state {
            TurbineState::Shutdown => self.master_is_on,
            TurbineState::Starting => true,
            // While running, the air intake flap remains open.
            TurbineState::Running => true,
            // Manual shutdown sequence: the air intake flap closes at N = 7%.
            TurbineState::Stopping => self.master_is_on || 7. <= self.n.get::<percent>(),
        } {
            Some(AirIntakeFlapSignal::Open)
        } else {
            Some(AirIntakeFlapSignal::Close)
        }
    }
}
impl ControllerSignal<TurbineSignal> for ElectronicControlBox {
    fn signal(&self) -> Option<TurbineSignal> {
        if !self.is_on() {
            return None;
        }

        if self.is_auto_shutdown()
            || self.is_emergency_shutdown()
            || (!self.master_is_on
                && self.turbine_state != TurbineState::Starting
                && !self.bleed_air_valve_was_open_in_last(Duration::from_millis(
                    ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS,
                )))
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
impl ControllerSignal<PneumaticValveSignal> for ElectronicControlBox {
    fn signal(&self) -> Option<PneumaticValveSignal> {
        if !self.is_on() {
            None
        } else if self.fault != Some(ApuFault::ApuFire)
            && self.master_is_on
            && self.n.get::<percent>() > 95.
            && self.bleed_is_on
        {
            Some(PneumaticValveSignal::Open)
        } else {
            Some(PneumaticValveSignal::Close)
        }
    }
}
impl SimulationElement for ElectronicControlBox {
    fn write(&self, writer: &mut SimulatorWriter) {
        let ssm = if self.is_on() {
            SignStatus::NormalOperation
        } else {
            SignStatus::FailureWarning
        };

        // For sound and effects.
        writer.write(&self.apu_n_raw_id, self.n());

        writer.write_arinc429(&self.apu_n_id, self.n(), ssm);
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

        // Flight Warning Computer related information.
        writer.write(&self.ecam_inop_sys_apu_id, self.is_inoperable());
        writer.write(&self.apu_is_auto_shutdown_id, self.is_auto_shutdown());
        writer.write(
            &self.apu_is_emergency_shutdown_id,
            self.is_emergency_shutdown(),
        );
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
