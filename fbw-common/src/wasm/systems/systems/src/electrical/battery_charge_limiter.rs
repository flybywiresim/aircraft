use super::{
    AlternatingCurrentElectricalSystem, BatteryPushButtons, ElectricalElement, Electricity,
    ElectricitySource, EmergencyElectrical, ProvideCurrent, ProvidePotential,
};
use crate::shared::AdirsDiscreteOutputs;
use crate::simulation::{InitContext, VariableIdentifier};
use crate::{
    shared::{ApuAvailable, ApuMaster, ApuStart, DelayedTrueLogicGate, LgciuWeightOnWheels},
    simulation::{SimulationElement, SimulatorWriter, UpdateContext, Write},
};
use std::time::Duration;
use uom::si::{electric_current::ampere, electric_potential::volt, f64::*};

enum State {
    Off(Off),
    Open(Open),
    Closed(Closed),
}
impl State {
    fn new() -> Self {
        // We start in an open state, because electrical tests assume this to be the starting state.
        // This state might not be correct for all starting situations (*.flt files) in the simulator.
        // When an initialisation phase is added to the system code we can overwrite this starting state
        // with the appropriate one for the given starting situation.
        State::Open(Open::for_initial_bcl_state())
    }

    fn update(
        self,
        context: &UpdateContext,
        electricity: &Electricity,
        battery_number: usize,
        emergency_elec: &EmergencyElectrical,
        emergency_generator: &impl ElectricitySource,
        battery: &(impl ProvidePotential + ProvideCurrent),
        battery_bus: &impl ElectricalElement,
        lgciu1: &impl LgciuWeightOnWheels,
        battery_push_buttons: &impl BatteryPushButtons,
        apu: &impl ApuAvailable,
        apu_overhead: &(impl ApuMaster + ApuStart),
        ac_electrical_system: &impl AlternatingCurrentElectricalSystem,
        adirs: &impl AdirsDiscreteOutputs,
    ) -> State {
        match self {
            State::Off(observer) => observer.update(context, battery_number, battery_push_buttons),
            State::Open(observer) => observer.update(
                context,
                electricity,
                battery_number,
                emergency_elec,
                emergency_generator,
                battery,
                battery_bus,
                lgciu1,
                battery_push_buttons,
                apu,
                apu_overhead,
                ac_electrical_system,
                adirs,
            ),
            State::Closed(observer) => observer.update(
                context,
                electricity,
                battery_number,
                emergency_elec,
                battery,
                lgciu1,
                battery_push_buttons,
                apu,
                apu_overhead,
                ac_electrical_system,
                adirs,
            ),
        }
    }

    fn should_close_contactor(&self) -> bool {
        matches!(self, State::Closed(_))
    }
}

pub struct BatteryChargeLimiter {
    number: usize,
    should_show_arrow_when_contactor_closed_id: VariableIdentifier,
    arrow: ArrowBetweenBatteryAndBatBus,
    observer: Option<State>,
}
impl BatteryChargeLimiter {
    pub fn new(context: &mut InitContext, number: usize, contactor_id: &str) -> Self {
        Self {
            number,
            should_show_arrow_when_contactor_closed_id: context.get_identifier(format!(
                "ELEC_CONTACTOR_{}_SHOW_ARROW_WHEN_CLOSED",
                contactor_id
            )),
            arrow: ArrowBetweenBatteryAndBatBus::new(),
            observer: Some(State::new()),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &Electricity,
        emergency_elec: &EmergencyElectrical,
        emergency_generator: &impl ElectricitySource,
        battery: &(impl ProvidePotential + ProvideCurrent),
        battery_bus: &impl ElectricalElement,
        lgciu1: &impl LgciuWeightOnWheels,
        battery_push_buttons: &impl BatteryPushButtons,
        apu: &impl ApuAvailable,
        apu_overhead: &(impl ApuMaster + ApuStart),
        ac_electrical_system: &impl AlternatingCurrentElectricalSystem,
        adirs: &impl AdirsDiscreteOutputs,
    ) {
        self.arrow.update(context, battery);

        if let Some(observer) = self.observer.take() {
            self.observer = Some(observer.update(
                context,
                electricity,
                self.number,
                emergency_elec,
                emergency_generator,
                battery,
                battery_bus,
                lgciu1,
                battery_push_buttons,
                apu,
                apu_overhead,
                ac_electrical_system,
                adirs,
            ));
        }
    }

    pub fn should_close_contactor(&self) -> bool {
        self.observer.as_ref().unwrap().should_close_contactor()
    }
}
impl SimulationElement for BatteryChargeLimiter {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.should_show_arrow_when_contactor_closed_id,
            self.arrow.should_show_when_contactor_closed(),
        );
    }
}

/// The BCL is not powered when the BAT push button is in the OFF
/// position. This observer simply watches for the BAT push button to
/// move to the AUTO position.
struct Off {
    bcl_startup_delay: DelayedTrueLogicGate,
}
impl Off {
    const STARTUP_DELAY_IN_SECONDS: u64 = 1;

    fn new() -> Self {
        Self {
            bcl_startup_delay: DelayedTrueLogicGate::new(Duration::from_secs(
                Self::STARTUP_DELAY_IN_SECONDS,
            )),
        }
    }

    fn update(
        mut self,
        context: &UpdateContext,
        battery_number: usize,
        battery_push_buttons: &impl BatteryPushButtons,
    ) -> State {
        self.bcl_startup_delay
            .update(context, battery_push_buttons.bat_is_auto(battery_number));

        if self.bcl_startup_delay.output() {
            State::Closed(Closed::from_off())
        } else {
            State::Off(self)
        }
    }
}

/// Observes the open battery contactor and related systems
/// to determine if the battery contactor should be closed.
struct Open {
    begin_charging_cycle_delay: DelayedTrueLogicGate,
    open_due_to_discharge_protection: bool,
    open_due_to_exceeding_emergency_elec_closing_time_allowance: bool,
}
impl Open {
    const CHARGE_BATTERY_BELOW_VOLTAGE: f64 = 26.5;
    const BATTERY_BUS_BELOW_CHARGING_VOLTAGE: f64 = 27.;
    const BATTERY_CHARGING_CLOSE_DELAY_MILLISECONDS: u64 = 225;
    const APU_START_INHIBIT_DELAY_SECONDS: u64 = 45;

    fn new(
        open_due_to_discharge_protection: bool,
        open_due_to_exceeding_emergency_elec_closing_time_allowance: bool,
    ) -> Self {
        Self {
            begin_charging_cycle_delay: DelayedTrueLogicGate::new(Duration::from_millis(
                Open::BATTERY_CHARGING_CLOSE_DELAY_MILLISECONDS,
            )),
            open_due_to_discharge_protection,
            open_due_to_exceeding_emergency_elec_closing_time_allowance,
        }
    }

    fn for_initial_bcl_state() -> Self {
        Self::new(false, false)
    }

    fn from_closed() -> Self {
        Self::new(false, false)
    }

    fn due_to_discharge_protection() -> Self {
        Self::new(true, false)
    }

    fn due_to_exceeding_emergency_elec_closing_time_allowance() -> Self {
        Self::new(false, true)
    }

    fn update_state(
        &mut self,
        context: &UpdateContext,
        electricity: &Electricity,
        battery: &impl ProvidePotential,
        battery_bus: &impl ElectricalElement,
        apu_overhead: &impl ApuMaster,
    ) {
        self.update_begin_charging_cycle_delay(context, electricity, battery, battery_bus);

        if self.open_due_to_exceeding_emergency_elec_closing_time_allowance
            && !apu_overhead.master_sw_is_on()
        {
            self.open_due_to_exceeding_emergency_elec_closing_time_allowance = false;
        }
    }

    fn should_close(
        &self,
        electricity: &Electricity,
        emergency_elec: &EmergencyElectrical,
        emergency_generator: &impl ElectricitySource,
        lgciu1: &impl LgciuWeightOnWheels,
        apu: &impl ApuAvailable,
        apu_overhead: &impl ApuMaster,
        ac_electrical_system: &impl AlternatingCurrentElectricalSystem,
        adirs: &impl AdirsDiscreteOutputs,
    ) -> bool {
        !self.open_due_to_exceeding_emergency_elec_closing_time_allowance
            && !self.emergency_elec_inhibited(
                electricity,
                emergency_elec,
                emergency_generator,
                lgciu1,
            )
            && !self.open_due_to_discharge_protection
            && (self.should_get_ready_for_apu_start(apu, apu_overhead)
                || on_ground_at_low_speed_with_unpowered_ac_buses(
                    electricity,
                    ac_electrical_system,
                    lgciu1,
                    adirs,
                )
                || self.should_charge_battery())
    }

    fn should_get_ready_for_apu_start(
        &self,
        apu: &impl ApuAvailable,
        apu_overhead: &impl ApuMaster,
    ) -> bool {
        apu_overhead.master_sw_is_on() && !apu.is_available()
    }

    fn should_charge_battery(&self) -> bool {
        self.begin_charging_cycle_delay.output()
    }

    fn emergency_elec_inhibited(
        &self,
        electricity: &Electricity,
        emergency_elec: &EmergencyElectrical,
        emergency_generator: &impl ElectricitySource,
        lgciu1: &impl LgciuWeightOnWheels,
    ) -> bool {
        emergency_elec.is_active()
            && (lgciu1.left_and_right_gear_compressed(false)
                || (!electricity.is_powered(emergency_generator)
                    && emergency_elec.active_duration()
                        < Duration::from_secs(Self::APU_START_INHIBIT_DELAY_SECONDS)))
    }

    fn update_begin_charging_cycle_delay(
        &mut self,
        context: &UpdateContext,
        electricity: &Electricity,
        battery: &impl ProvidePotential,
        battery_bus: &impl ElectricalElement,
    ) {
        self.begin_charging_cycle_delay.update(
            context,
            battery.potential()
                < ElectricPotential::new::<volt>(Open::CHARGE_BATTERY_BELOW_VOLTAGE)
                && electricity.output_of(battery_bus).raw()
                    > ElectricPotential::new::<volt>(Open::BATTERY_BUS_BELOW_CHARGING_VOLTAGE),
        );
    }

    fn update(
        mut self,
        context: &UpdateContext,
        electricity: &Electricity,
        battery_number: usize,
        emergency_elec: &EmergencyElectrical,
        emergency_generator: &impl ElectricitySource,
        battery: &impl ProvidePotential,
        battery_bus: &impl ElectricalElement,
        lgciu1: &impl LgciuWeightOnWheels,
        battery_push_buttons: &impl BatteryPushButtons,
        apu: &impl ApuAvailable,
        apu_overhead: &impl ApuMaster,
        ac_electrical_system: &impl AlternatingCurrentElectricalSystem,
        adirs: &impl AdirsDiscreteOutputs,
    ) -> State {
        self.update_state(context, electricity, battery, battery_bus, apu_overhead);

        if !battery_push_buttons.bat_is_auto(battery_number) {
            State::Off(Off::new())
        } else if self.should_close(
            electricity,
            emergency_elec,
            emergency_generator,
            lgciu1,
            apu,
            apu_overhead,
            ac_electrical_system,
            adirs,
        ) {
            State::Closed(Closed::from_open(emergency_elec.is_active()))
        } else {
            State::Open(self)
        }
    }
}

/// Observes the closed battery contactor and related systems
/// to determine if the battery contactor should be opened.
struct Closed {
    below_4_ampere_charging_duration: Duration,
    below_23_volt_duration: Duration,
    apu_master_sw_pb_on_duration: Duration,
    had_apu_start: bool,
    entered_in_emergency_elec: bool,
}
impl Closed {
    const BATTERY_CHARGING_OPEN_DELAY_ON_GROUND_SECONDS: u64 = 10;
    const BATTERY_CHARGING_OPEN_DELAY_100_KNOTS_OR_AFTER_APU_START_SECONDS: u64 = 1800;
    const BATTERY_DISCHARGE_PROTECTION_DELAY_SECONDS: u64 = 15;
    const EMER_ELEC_APU_MASTER_MAXIMUM_CLOSED_SECONDS: u64 = 180;

    fn new(entered_in_emergency_elec: bool) -> Self {
        Self {
            below_4_ampere_charging_duration: Duration::from_secs(0),
            below_23_volt_duration: Duration::from_secs(0),
            apu_master_sw_pb_on_duration: Duration::from_secs(0),
            entered_in_emergency_elec,
            had_apu_start: false,
        }
    }

    fn from_open(entered_in_emergency_elec: bool) -> Self {
        Self::new(entered_in_emergency_elec)
    }

    fn from_off() -> Self {
        Self::new(false)
    }

    fn update_state(
        &mut self,
        context: &UpdateContext,
        battery: &(impl ProvidePotential + ProvideCurrent),
        apu_overhead: &(impl ApuMaster + ApuStart),
    ) {
        if apu_overhead.start_is_on() {
            self.had_apu_start = true;
        }

        if battery.current() < ElectricCurrent::new::<ampere>(4.) {
            self.below_4_ampere_charging_duration += context.delta();
        } else {
            self.below_4_ampere_charging_duration = Duration::from_secs(0);
        }

        if battery.potential() < ElectricPotential::new::<volt>(23.) {
            self.below_23_volt_duration += context.delta();
        } else {
            self.below_23_volt_duration = Duration::from_secs(0);
        }

        if apu_overhead.master_sw_is_on() {
            self.apu_master_sw_pb_on_duration += context.delta();
        } else {
            self.apu_master_sw_pb_on_duration = Duration::from_secs(0);
        }
    }

    fn should_open_due_to_discharge_protection(&self, lgciu1: &impl LgciuWeightOnWheels) -> bool {
        lgciu1.left_and_right_gear_compressed(false)
            && self.below_23_volt_duration
                >= Duration::from_secs(Closed::BATTERY_DISCHARGE_PROTECTION_DELAY_SECONDS)
    }

    fn should_open_due_to_exceeding_emergency_elec_closed_time_allowance(
        &self,
        emergency_elec: &EmergencyElectrical,
    ) -> bool {
        emergency_elec.is_active() && self.beyond_emergency_elec_closed_time_allowance()
    }

    fn should_open(
        &self,
        electricity: &Electricity,
        emergency_elec: &EmergencyElectrical,
        lgciu1: &impl LgciuWeightOnWheels,
        apu: &impl ApuAvailable,
        apu_overhead: &impl ApuMaster,
        ac_electrical_system: &impl AlternatingCurrentElectricalSystem,
        adirs: &impl AdirsDiscreteOutputs,
    ) -> bool {
        if emergency_elec.is_active() {
            !apu_overhead.master_sw_is_on() || self.emergency_elec_inhibited(lgciu1)
        } else {
            !self.awaiting_apu_start(apu, apu_overhead)
                && !on_ground_at_low_speed_with_unpowered_ac_buses(
                    electricity,
                    ac_electrical_system,
                    lgciu1,
                    adirs,
                )
                && (self.beyond_charge_duration_on_ground_without_apu_start(lgciu1)
                    || self
                        .beyond_charge_duration_above_100_knots_or_after_apu_start_attempt(adirs))
        }
    }

    fn emergency_elec_inhibited(&self, lgciu1: &impl LgciuWeightOnWheels) -> bool {
        !self.entered_in_emergency_elec || lgciu1.left_and_right_gear_compressed(false)
    }

    fn beyond_emergency_elec_closed_time_allowance(&self) -> bool {
        self.apu_master_sw_pb_on_duration
            >= Duration::from_secs(Closed::EMER_ELEC_APU_MASTER_MAXIMUM_CLOSED_SECONDS)
    }

    fn awaiting_apu_start(&self, apu: &impl ApuAvailable, apu_overhead: &impl ApuMaster) -> bool {
        apu_overhead.master_sw_is_on() && !apu.is_available()
    }

    fn beyond_charge_duration_on_ground_without_apu_start(
        &self,
        lgciu1: &impl LgciuWeightOnWheels,
    ) -> bool {
        (!self.had_apu_start && lgciu1.left_and_right_gear_compressed(false))
            && self.below_4_ampere_charging_duration
                >= Duration::from_secs(Closed::BATTERY_CHARGING_OPEN_DELAY_ON_GROUND_SECONDS)
    }

    fn beyond_charge_duration_above_100_knots_or_after_apu_start_attempt(
        &self,
        adirs: &impl AdirsDiscreteOutputs,
    ) -> bool {
        (adirs.low_speed_warning_1(1) || self.had_apu_start)
            && self.below_4_ampere_charging_duration
                >= Duration::from_secs(
                    Closed::BATTERY_CHARGING_OPEN_DELAY_100_KNOTS_OR_AFTER_APU_START_SECONDS,
                )
    }

    fn update(
        mut self,
        context: &UpdateContext,
        electricity: &Electricity,
        battery_number: usize,
        emergency_elec: &EmergencyElectrical,
        battery: &(impl ProvidePotential + ProvideCurrent),
        lgciu1: &impl LgciuWeightOnWheels,
        battery_push_buttons: &impl BatteryPushButtons,
        apu: &impl ApuAvailable,
        apu_overhead: &(impl ApuMaster + ApuStart),
        ac_electrical_system: &impl AlternatingCurrentElectricalSystem,
        adirs: &impl AdirsDiscreteOutputs,
    ) -> State {
        self.update_state(context, battery, apu_overhead);

        if !battery_push_buttons.bat_is_auto(battery_number) {
            State::Off(Off::new())
        } else if self.should_open_due_to_discharge_protection(lgciu1) {
            State::Open(Open::due_to_discharge_protection())
        } else if self
            .should_open_due_to_exceeding_emergency_elec_closed_time_allowance(emergency_elec)
        {
            State::Open(Open::due_to_exceeding_emergency_elec_closing_time_allowance())
        } else if self.should_open(
            electricity,
            emergency_elec,
            lgciu1,
            apu,
            apu_overhead,
            ac_electrical_system,
            adirs,
        ) {
            State::Open(Open::from_closed())
        } else {
            State::Closed(self)
        }
    }
}

fn on_ground_at_low_speed_with_unpowered_ac_buses(
    electricity: &Electricity,
    ac_electrical_system: &impl AlternatingCurrentElectricalSystem,
    lgciu1: &impl LgciuWeightOnWheels,
    adirs: &impl AdirsDiscreteOutputs,
) -> bool {
    !ac_electrical_system.any_non_essential_bus_powered(electricity)
        && lgciu1.left_and_right_gear_compressed(false)
        && !adirs.low_speed_warning_1(1)
}

struct ArrowBetweenBatteryAndBatBus {
    discharging_above_1_ampere_beyond_time: DelayedTrueLogicGate,
    charging_above_1_ampere_beyond_time: DelayedTrueLogicGate,
}
impl ArrowBetweenBatteryAndBatBus {
    const CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS: u64 = 15;

    fn new() -> Self {
        Self {
            discharging_above_1_ampere_beyond_time: DelayedTrueLogicGate::new(Duration::from_secs(
                Self::CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS,
            )),
            charging_above_1_ampere_beyond_time: DelayedTrueLogicGate::new(Duration::from_secs(
                Self::CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS,
            )),
        }
    }

    fn update(&mut self, context: &UpdateContext, battery: &impl ProvideCurrent) {
        self.discharging_above_1_ampere_beyond_time.update(
            context,
            battery.current() < ElectricCurrent::new::<ampere>(-1.),
        );
        self.charging_above_1_ampere_beyond_time.update(
            context,
            battery.current() > ElectricCurrent::new::<ampere>(1.),
        );
    }

    fn should_show_when_contactor_closed(&self) -> bool {
        self.discharging_above_1_ampere_beyond_time.output()
            || self.charging_above_1_ampere_beyond_time.output()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(test)]
    mod battery_charge_limiter_tests {
        use std::time::Duration;

        use uom::si::{power::watt, velocity::knot};

        use crate::{
            electrical::{
                battery::Battery, consumption::PowerConsumer, test::TestElectricitySource,
                Contactor, ElectricalBus, ElectricalBusType, ElectricalElement,
                ElectricalElementIdentifier, ElectricalElementIdentifierProvider, Electricity,
                Potential, PotentialOrigin,
            },
            simulation::{
                test::{ReadByName, SimulationTestBed, TestBed},
                Aircraft, InitContext, SimulationElementVisitor,
            },
        };

        use super::*;

        struct BatteryChargeLimiterTestBed {
            test_bed: SimulationTestBed<TestAircraft>,
        }
        impl BatteryChargeLimiterTestBed {
            fn new() -> Self {
                Self {
                    test_bed: SimulationTestBed::new(|context| {
                        let battery = Battery::half(context, 1);
                        TestAircraft::new(context, battery)
                    }),
                }
            }

            fn on_the_ground(mut self) -> Self {
                self.set_on_ground(true);
                self.set_pressure_altitude(Length::default());
                self.gear_down()
            }

            fn indicated_airspeed_of(mut self, indicated_airspeed: Velocity) -> Self {
                self.set_indicated_airspeed(indicated_airspeed);
                self
            }

            fn run(mut self, delta: Duration) -> Self {
                // The battery's current is updated after the BCL, thus we need two ticks.
                self.run_with_delta(Duration::from_secs(0));
                self.run_with_delta(delta);

                // Run once more to detect programming errors where the state goes from
                // open to closed (or vice versa) and then back to the other state within
                // the next tick while this shouldn't happen.
                self.run_with_delta(Duration::from_secs(0));

                self
            }

            fn wait_for_closed_contactor(mut self, assert_is_closed: bool) -> Self {
                self.command(|a| a.set_battery_bus_at_minimum_charging_voltage());
                self = self.run(Duration::from_millis(
                    Open::BATTERY_CHARGING_CLOSE_DELAY_MILLISECONDS,
                ));

                if assert_is_closed {
                    assert!(
                        self.query(|a| a.battery_contactor_is_closed()),
                        "Battery contactor didn't close within the expected time frame.
                            Is the battery bus at a high enough voltage and the battery not full?"
                    );
                }

                self
            }

            fn wait_for_bcl_startup(self) -> Self {
                self.run(Duration::from_secs(1))
            }

            fn wait_for_emergency_elec_apu_no_longer_inhibited(mut self) -> Self {
                self = self
                    .emergency_elec()
                    .run(Duration::from_secs(Open::APU_START_INHIBIT_DELAY_SECONDS));

                self
            }

            fn pre_discharge_protection_state(mut self) -> Self {
                self = self
                    .indicated_airspeed_of(Velocity::new::<knot>(0.))
                    .and()
                    .on_the_ground()
                    .wait_for_closed_contactor(true)
                    .then_continue_with()
                    .nearly_empty_battery_charge()
                    .and()
                    .no_power_outside_of_battery();

                self
            }

            fn ground_bat_only_state(mut self, ias: Velocity) -> Self {
                self = self
                    .full_battery_charge()
                    .on_the_ground()
                    .indicated_airspeed_of(ias)
                    .and()
                    .no_power_outside_of_battery()
                    .run(Duration::from_millis(1));

                self
            }

            fn cycle_battery_push_button(mut self) -> Self {
                self = self.battery_push_button_off();
                self = self.battery_push_button_auto();

                self
            }

            fn battery_push_button_off(mut self) -> Self {
                self.command(|a| a.set_battery_push_button_off());
                self = self.run(Duration::from_secs(0));

                self
            }

            fn battery_push_button_auto(mut self) -> Self {
                self.command(|a| a.set_battery_push_button_auto());
                self = self.run(Duration::from_secs(0));

                self
            }

            fn available_emergency_generator(mut self) -> Self {
                self.command(|a| a.set_emergency_generator_available());
                self
            }

            fn started_apu(mut self) -> Self {
                self.command(|a| a.set_apu_master_sw_pb_on());
                self.command(|a| a.set_apu_start_pb_on());

                self = self.run(Duration::from_secs(0));

                self.command(|a| a.set_apu_available());
                self.command(|a| a.set_apu_start_pb_off());

                self
            }

            fn stopped_apu(mut self) -> Self {
                self.command(|a| a.set_apu_master_sw_pb_off());
                self = self.run(Duration::from_secs(0));

                self.command(|a| a.set_apu_unavailable());

                self
            }

            fn then_continue_with(self) -> Self {
                self
            }

            fn and(self) -> Self {
                self
            }

            fn full_battery_charge(mut self) -> Self {
                self.command(|a| a.set_full_battery_charge());
                self
            }

            fn nearly_empty_battery_charge(mut self) -> Self {
                self.command(|a| a.set_nearly_empty_battery_charge());
                self
            }

            fn no_power_outside_of_battery(mut self) -> Self {
                self.command(|a| a.set_battery_bus_unpowered());
                self.command(|a| a.set_both_ac_buses_unpowered());
                self
            }

            fn power_demand_of(mut self, power: Power) -> Self {
                self.command(|a| a.set_power_demand(power));
                self
            }

            fn battery_bus_at_minimum_charging_voltage(mut self) -> Self {
                self.command(|a| a.set_battery_bus_at_minimum_charging_voltage());
                self
            }

            fn battery_bus_below_minimum_charging_voltage(mut self) -> Self {
                self.command(|a| a.set_battery_bus_below_minimum_charging_voltage());
                self
            }

            fn current(&mut self) -> ElectricCurrent {
                self.read_by_name(&format!("ELEC_BAT_{}_CURRENT", 1))
            }

            fn battery_contactor_is_closed(&self) -> bool {
                self.query(|a| a.battery_contactor_is_closed())
            }

            fn apu_master_sw_pb_on(mut self) -> Self {
                self.command(|a| a.set_apu_master_sw_pb_on());
                self
            }

            fn apu_master_sw_pb_off(mut self) -> Self {
                self.command(|a| a.set_apu_master_sw_pb_off());
                self
            }

            fn should_show_arrow_when_contactor_closed(&mut self) -> bool {
                self.read_by_name("ELEC_CONTACTOR_TEST_SHOW_ARROW_WHEN_CLOSED")
            }

            fn emergency_elec(mut self) -> Self {
                self = self.no_power_outside_of_battery();
                self.set_indicated_airspeed(Velocity::new::<knot>(101.));

                self
            }

            fn gear_down(mut self) -> Self {
                self.command(|a| a.set_gear_down());

                self
            }
        }
        impl TestBed for BatteryChargeLimiterTestBed {
            type Aircraft = TestAircraft;

            fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
                &self.test_bed
            }

            fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
                &mut self.test_bed
            }
        }

        struct TestAlternatingCurrentElectricalSystem {
            any_non_essential_bus_powered: bool,
        }
        impl TestAlternatingCurrentElectricalSystem {
            fn new(any_non_essential_bus_powered: bool) -> Self {
                Self {
                    any_non_essential_bus_powered,
                }
            }
        }
        impl AlternatingCurrentElectricalSystem for TestAlternatingCurrentElectricalSystem {
            fn any_non_essential_bus_powered(&self, _: &Electricity) -> bool {
                self.any_non_essential_bus_powered
            }
        }

        struct TestLandingGear {
            is_down: bool,
        }
        impl TestLandingGear {
            fn new(is_down: bool) -> Self {
                Self { is_down }
            }
        }
        impl LgciuWeightOnWheels for TestLandingGear {
            fn right_gear_compressed(&self, _: bool) -> bool {
                self.is_down
            }

            fn right_gear_extended(&self, _: bool) -> bool {
                !self.is_down
            }

            fn left_gear_compressed(&self, _: bool) -> bool {
                self.is_down
            }

            fn left_gear_extended(&self, _: bool) -> bool {
                !self.is_down
            }

            fn left_and_right_gear_compressed(&self, _: bool) -> bool {
                self.is_down
            }

            fn left_and_right_gear_extended(&self, _: bool) -> bool {
                !self.is_down
            }

            fn nose_gear_compressed(&self, _: bool) -> bool {
                self.is_down
            }

            fn nose_gear_extended(&self, _: bool) -> bool {
                !self.is_down
            }
        }

        struct TestEmergencyGenerator {
            identifier: ElectricalElementIdentifier,
            is_available: bool,
        }
        impl TestEmergencyGenerator {
            fn new(context: &mut InitContext) -> Self {
                Self {
                    identifier: context.next_electrical_identifier(),
                    is_available: false,
                }
            }

            fn set_available(&mut self) {
                self.is_available = true;
            }
        }
        impl ElectricalElement for TestEmergencyGenerator {
            fn input_identifier(&self) -> crate::electrical::ElectricalElementIdentifier {
                self.identifier
            }

            fn output_identifier(&self) -> crate::electrical::ElectricalElementIdentifier {
                self.identifier
            }

            fn is_conductive(&self) -> bool {
                true
            }
        }
        impl ElectricitySource for TestEmergencyGenerator {
            fn output_potential(&self) -> Potential {
                if self.is_available {
                    Potential::new(
                        PotentialOrigin::EmergencyGenerator,
                        ElectricPotential::new::<volt>(115.),
                    )
                } else {
                    Potential::none()
                }
            }
        }

        struct TestElectricalOverheadPanel {
            bat_is_auto: bool,
        }
        impl TestElectricalOverheadPanel {
            fn new(bat_is_auto: bool) -> Self {
                Self { bat_is_auto }
            }
        }
        impl BatteryPushButtons for TestElectricalOverheadPanel {
            fn bat_is_auto(&self, _: usize) -> bool {
                self.bat_is_auto
            }
        }

        struct TestApu {
            is_available: bool,
        }
        impl TestApu {
            fn new(is_available: bool) -> Self {
                Self { is_available }
            }
        }
        impl ApuAvailable for TestApu {
            fn is_available(&self) -> bool {
                self.is_available
            }
        }

        struct TestApuOverheadPanel {
            master_sw_is_on: bool,
            start_is_on: bool,
        }
        impl TestApuOverheadPanel {
            fn new(master_sw_is_on: bool, start_is_on: bool) -> Self {
                Self {
                    master_sw_is_on,
                    start_is_on,
                }
            }
        }
        impl ApuMaster for TestApuOverheadPanel {
            fn master_sw_is_on(&self) -> bool {
                self.master_sw_is_on
            }
        }
        impl ApuStart for TestApuOverheadPanel {
            fn start_is_on(&self) -> bool {
                self.start_is_on
            }
        }

        struct TestAdirs {
            indicated_airspeed: Velocity,
        }
        impl TestAdirs {
            fn new(context: &UpdateContext) -> Self {
                Self {
                    indicated_airspeed: context.indicated_airspeed(),
                }
            }
        }
        impl AdirsDiscreteOutputs for TestAdirs {
            fn low_speed_warning_1(&self, adiru_number: usize) -> bool {
                assert_eq!(adiru_number, 1);
                self.indicated_airspeed.get::<knot>() >= 100.
            }

            fn low_speed_warning_2(&self, adiru_number: usize) -> bool {
                assert_eq!(adiru_number, 1);
                todo!()
            }

            fn low_speed_warning_3(&self, adiru_number: usize) -> bool {
                assert_eq!(adiru_number, 1);
                todo!()
            }

            fn low_speed_warning_4(&self, adiru_number: usize) -> bool {
                assert_eq!(adiru_number, 1);
                todo!()
            }
        }

        struct TestAircraft {
            battery_bus_electricity_source: TestElectricitySource,
            battery: Battery,
            battery_charge_limiter: BatteryChargeLimiter,
            battery_bus: ElectricalBus,
            battery_contactor: Contactor,
            emergency_generator: TestEmergencyGenerator,
            consumer: PowerConsumer,
            apu_master_sw_pb_on: bool,
            apu_start_pb_on: bool,
            apu_available: bool,
            battery_push_button_auto: bool,
            landing_gear_is_down: bool,
            emergency_elec: EmergencyElectrical,
            any_non_essential_bus_powered: bool,
        }
        impl TestAircraft {
            fn new(context: &mut InitContext, battery: Battery) -> Self {
                Self {
                    battery_bus_electricity_source: TestElectricitySource::powered(
                        context,
                        PotentialOrigin::TransformerRectifier(1),
                    ),
                    battery,
                    battery_charge_limiter: BatteryChargeLimiter::new(context, 1, "TEST"),
                    battery_bus: ElectricalBus::new(
                        context,
                        ElectricalBusType::DirectCurrentBattery,
                    ),
                    battery_contactor: Contactor::new(context, "TEST"),
                    emergency_generator: TestEmergencyGenerator::new(context),
                    consumer: PowerConsumer::from(ElectricalBusType::DirectCurrentBattery),
                    apu_master_sw_pb_on: false,
                    apu_start_pb_on: false,
                    apu_available: false,
                    battery_push_button_auto: true,
                    landing_gear_is_down: false,
                    emergency_elec: EmergencyElectrical::new(),
                    any_non_essential_bus_powered: true,
                }
            }

            fn set_full_battery_charge(&mut self) {
                self.battery.set_full_charge()
            }

            fn set_nearly_empty_battery_charge(&mut self) {
                self.battery.set_nearly_empty_battery_charge();
            }

            fn set_battery_bus_at_minimum_charging_voltage(&mut self) {
                self.battery_bus_electricity_source
                    .set_potential(ElectricPotential::new::<volt>(
                        Open::BATTERY_BUS_BELOW_CHARGING_VOLTAGE + 0.000001,
                    ));
            }

            fn set_battery_bus_below_minimum_charging_voltage(&mut self) {
                self.battery_bus_electricity_source
                    .set_potential(ElectricPotential::new::<volt>(
                        Open::BATTERY_BUS_BELOW_CHARGING_VOLTAGE,
                    ));
            }

            fn set_battery_bus_unpowered(&mut self) {
                self.battery_bus_electricity_source.unpower();
            }

            fn set_both_ac_buses_unpowered(&mut self) {
                self.any_non_essential_bus_powered = false;
            }

            fn set_apu_master_sw_pb_on(&mut self) {
                self.apu_master_sw_pb_on = true;
            }

            fn set_apu_master_sw_pb_off(&mut self) {
                self.apu_master_sw_pb_on = false;
            }

            fn set_apu_start_pb_on(&mut self) {
                self.apu_start_pb_on = true;
            }

            fn set_apu_start_pb_off(&mut self) {
                self.apu_start_pb_on = false;
            }

            fn set_apu_available(&mut self) {
                self.apu_available = true;
            }

            fn set_apu_unavailable(&mut self) {
                self.apu_available = false;
            }

            fn set_power_demand(&mut self, power: Power) {
                self.consumer.demand(power);
            }

            fn battery_contactor_is_closed(&self) -> bool {
                self.battery_contactor.is_closed()
            }

            fn set_battery_push_button_auto(&mut self) {
                self.battery_push_button_auto = true;
            }

            fn set_battery_push_button_off(&mut self) {
                self.battery_push_button_auto = false;
            }

            fn set_gear_down(&mut self) {
                self.landing_gear_is_down = true;
            }

            fn set_emergency_generator_available(&mut self) {
                self.emergency_generator.set_available()
            }
        }
        impl Aircraft for TestAircraft {
            fn update_before_power_distribution(
                &mut self,
                context: &UpdateContext,
                electricity: &mut Electricity,
            ) {
                self.emergency_elec.update(
                    context,
                    electricity,
                    &TestAlternatingCurrentElectricalSystem::new(
                        self.any_non_essential_bus_powered,
                    ),
                );

                electricity.supplied_by(&self.battery);
                electricity.supplied_by(&self.emergency_generator);
                electricity.supplied_by(&self.battery_bus_electricity_source);
                electricity.flow(&self.battery_bus_electricity_source, &self.battery_bus);

                self.battery_charge_limiter.update(
                    context,
                    electricity,
                    &self.emergency_elec,
                    &self.emergency_generator,
                    &self.battery,
                    &self.battery_bus,
                    &TestLandingGear::new(self.landing_gear_is_down),
                    &TestElectricalOverheadPanel::new(self.battery_push_button_auto),
                    &TestApu::new(self.apu_available),
                    &TestApuOverheadPanel::new(self.apu_master_sw_pb_on, self.apu_start_pb_on),
                    &TestAlternatingCurrentElectricalSystem::new(
                        self.any_non_essential_bus_powered,
                    ),
                    &TestAdirs::new(context),
                );

                self.battery_contactor
                    .close_when(self.battery_charge_limiter.should_close_contactor());

                electricity.flow(&self.battery_bus, &self.battery_contactor);
                electricity.flow(&self.battery_contactor, &self.battery);
            }
        }
        impl SimulationElement for TestAircraft {
            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.battery.accept(visitor);
                self.battery_bus.accept(visitor);
                self.battery_contactor.accept(visitor);
                self.battery_charge_limiter.accept(visitor);
                self.consumer.accept(visitor);

                visitor.visit(self);
            }
        }

        fn test_bed() -> BatteryChargeLimiterTestBed {
            BatteryChargeLimiterTestBed::new()
        }

        fn test_bed_with() -> BatteryChargeLimiterTestBed {
            test_bed()
        }

        #[test]
        fn should_show_arrow_when_contactor_closed_while_15_seconds_have_passed_charging_above_1_a()
        {
            let mut test_bed = test_bed()
                .wait_for_closed_contactor(true)
                .run(Duration::from_secs(
                    ArrowBetweenBatteryAndBatBus::CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS,
                ));

            assert!(test_bed.should_show_arrow_when_contactor_closed())
        }

        #[test]
        fn should_not_show_arrow_when_contactor_closed_while_almost_15_seconds_have_passed_charging_above_1_a(
        ) {
            let mut test_bed = test_bed().wait_for_closed_contactor(true).run(
                Duration::from_secs(
                    ArrowBetweenBatteryAndBatBus::CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS,
                ) - Duration::from_millis(1),
            );

            assert!(!test_bed.should_show_arrow_when_contactor_closed())
        }

        #[test]
        fn should_not_show_arrow_when_contactor_closed_while_charging_below_1_a() {
            let mut test_bed = test_bed()
                .wait_for_closed_contactor(true)
                .then_continue_with()
                .full_battery_charge()
                .run(Duration::from_secs(
                    ArrowBetweenBatteryAndBatBus::CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS,
                ));

            assert!(!test_bed.should_show_arrow_when_contactor_closed())
        }

        #[test]
        fn should_show_arrow_when_contactor_closed_while_15_seconds_have_passed_discharging_above_1_a(
        ) {
            let mut test_bed = test_bed()
                .wait_for_emergency_elec_apu_no_longer_inhibited()
                .then_continue_with()
                .power_demand_of(Power::new::<watt>(50.))
                .and()
                .apu_master_sw_pb_on()
                .run(Duration::from_secs(
                    ArrowBetweenBatteryAndBatBus::CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS,
                ));

            assert!(test_bed.should_show_arrow_when_contactor_closed())
        }

        #[test]
        fn should_not_show_arrow_when_contactor_closed_while_almost_15_seconds_have_passed_discharging_above_1_a(
        ) {
            let mut test_bed = test_bed()
                .wait_for_closed_contactor(true)
                .then_continue_with()
                .no_power_outside_of_battery()
                .and()
                .power_demand_of(Power::new::<watt>(30.))
                .run(
                    Duration::from_secs(
                        ArrowBetweenBatteryAndBatBus::CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS,
                    ) - Duration::from_millis(1),
                );

            assert!(!test_bed.should_show_arrow_when_contactor_closed())
        }

        #[test]
        fn should_not_show_arrow_when_contactor_closed_while_discharging_below_1_a() {
            let mut test_bed = test_bed()
                .wait_for_closed_contactor(true)
                .then_continue_with()
                .no_power_outside_of_battery()
                .and()
                .power_demand_of(Power::new::<watt>(1.))
                .run(Duration::from_secs(
                    ArrowBetweenBatteryAndBatBus::CHARGE_DISCHARGE_ARROW_DISPLAYED_AFTER_SECONDS,
                ));

            assert!(!test_bed.should_show_arrow_when_contactor_closed())
        }

        #[test]
        fn contactor_closed_when_battery_voltage_below_charge_threshold_and_battery_bus_above_threshold_for_greater_than_225ms(
        ) {
            let test_bed = test_bed_with()
                .battery_bus_at_minimum_charging_voltage()
                .run(Duration::from_millis(
                    Open::BATTERY_CHARGING_CLOSE_DELAY_MILLISECONDS,
                ));

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_not_closed_when_battery_voltage_below_charge_threshold_and_battery_bus_above_threshold_for_greater_than_225ms_with_push_button_off(
        ) {
            let test_bed = test_bed_with()
                .battery_bus_at_minimum_charging_voltage()
                .and()
                .battery_push_button_off()
                .run(Duration::from_millis(
                    Open::BATTERY_CHARGING_CLOSE_DELAY_MILLISECONDS,
                ));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_not_closed_when_battery_voltage_below_charge_threshold_and_battery_bus_above_threshold_for_less_than_225ms(
        ) {
            let test_bed = test_bed_with()
                .battery_bus_at_minimum_charging_voltage()
                .run(
                    Duration::from_millis(Open::BATTERY_CHARGING_CLOSE_DELAY_MILLISECONDS)
                        - Duration::from_millis(1),
                );

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_not_closed_when_battery_voltage_above_charge_threshold() {
            let test_bed = test_bed_with()
                .full_battery_charge()
                .and()
                .battery_bus_at_minimum_charging_voltage()
                .run(Duration::from_secs(10));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_not_closed_when_battery_bus_voltage_below_threshold() {
            let test_bed = test_bed_with()
                .battery_bus_below_minimum_charging_voltage()
                .run(Duration::from_secs(10));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn when_bcl_is_turned_on_contactor_closed_after_startup_delay_has_passed() {
            let mut test_bed = test_bed_with()
                .ground_bat_only_state(Velocity::new::<knot>(99.9))
                .battery_push_button_off();

            assert!(
                !test_bed.battery_contactor_is_closed(),
                "A precondition is that the battery contactor isn't closed at this point."
            );

            test_bed = test_bed
                .battery_push_button_auto()
                .run(Duration::from_secs(Off::STARTUP_DELAY_IN_SECONDS))
                .run(Duration::from_secs(0));

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn when_bcl_is_turned_on_contactor_not_closed_before_startup_delay_has_passed() {
            let mut test_bed = test_bed_with()
                .ground_bat_only_state(Velocity::new::<knot>(99.9))
                .and()
                .battery_push_button_off();

            assert!(
                !test_bed.battery_contactor_is_closed(),
                "A precondition is that the battery contactor isn't closed at this point."
            );

            test_bed = test_bed
                .then_continue_with()
                .battery_push_button_auto()
                .run(Duration::from_secs_f64(
                    Off::STARTUP_DELAY_IN_SECONDS as f64 - 0.0001,
                ))
                .run(Duration::from_secs(0));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_closed_when_bat_only_on_ground_at_or_below_100_knots() {
            let test_bed = test_bed_with().ground_bat_only_state(Velocity::new::<knot>(99.9));

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_open_when_bat_only_on_ground_at_or_above_100_knots() {
            let test_bed = test_bed_with().ground_bat_only_state(Velocity::new::<knot>(100.));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_open_when_not_bat_only_on_ground_below_100_knots() {
            let test_bed = test_bed_with()
                .battery_bus_at_minimum_charging_voltage()
                .indicated_airspeed_of(Velocity::new::<knot>(99.9))
                .and()
                .on_the_ground()
                .run(Duration::from_millis(1));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_closed_when_apu_master_sw_pb_is_turned_on() {
            let test_bed = test_bed_with()
                .full_battery_charge()
                .and()
                .apu_master_sw_pb_on()
                .run(Duration::from_millis(1));

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn charging_cycle_on_ground_ends_10_seconds_after_current_less_than_4_ampere() {
            let mut test_bed = test_bed_with()
                .indicated_airspeed_of(Velocity::new::<knot>(0.))
                .and()
                .on_the_ground()
                .wait_for_closed_contactor(true);

            assert!(test_bed.current() >= ElectricCurrent::new::<ampere>(4.), "The test assumes that charging current is equal to or greater than 4 at this point.");

            test_bed =
                test_bed
                    .then_continue_with()
                    .full_battery_charge()
                    .run(Duration::from_secs(
                        Closed::BATTERY_CHARGING_OPEN_DELAY_ON_GROUND_SECONDS,
                    ));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn charging_cycle_on_ground_does_not_end_within_10_seconds_after_current_less_than_4_ampere(
        ) {
            let mut test_bed = test_bed_with()
                .indicated_airspeed_of(Velocity::new::<knot>(0.))
                .and()
                .on_the_ground()
                .wait_for_closed_contactor(true);

            assert!(test_bed.current() >= ElectricCurrent::new::<ampere>(4.), "The test assumes that charging current is equal to or greater than 4 at this point.");

            test_bed = test_bed.then_continue_with().full_battery_charge().run(
                Duration::from_secs(Closed::BATTERY_CHARGING_OPEN_DELAY_ON_GROUND_SECONDS)
                    - Duration::from_millis(1),
            );

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn charging_cycle_does_not_end_when_bat_only_below_100_knots() {
            let mut test_bed = test_bed_with()
                .indicated_airspeed_of(Velocity::new::<knot>(0.))
                .and()
                .on_the_ground()
                .wait_for_closed_contactor(true);

            assert!(test_bed.current() >= ElectricCurrent::new::<ampere>(4.), "The test assumes that charging current is equal to or greater than 4 at this point.");

            test_bed = test_bed
                .then_continue_with()
                .no_power_outside_of_battery()
                .run(Duration::from_secs(
                    Closed::BATTERY_CHARGING_OPEN_DELAY_ON_GROUND_SECONDS,
                ));

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn when_above_100_knots_the_charging_cycle_ends_after_30_minutes_below_4_ampere() {
            let mut test_bed = test_bed().wait_for_closed_contactor(true);

            assert!(test_bed.current() >= ElectricCurrent::new::<ampere>(4.), "The test assumes that charging current is equal to or greater than 4 at this point.");

            test_bed =
                test_bed
                    .then_continue_with()
                    .full_battery_charge()
                    .run(Duration::from_secs(
                        Closed::BATTERY_CHARGING_OPEN_DELAY_100_KNOTS_OR_AFTER_APU_START_SECONDS,
                    ));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn when_above_100_knots_the_charging_cycle_does_not_end_within_30_minutes_before_below_4_ampere(
        ) {
            let mut test_bed = test_bed().wait_for_closed_contactor(true);

            assert!(test_bed.current() >= ElectricCurrent::new::<ampere>(4.), "The test assumes that charging current is equal to or greater than 4 at this point.");

            test_bed = test_bed.then_continue_with().full_battery_charge().run(
                Duration::from_secs(
                    Closed::BATTERY_CHARGING_OPEN_DELAY_100_KNOTS_OR_AFTER_APU_START_SECONDS,
                ) - Duration::from_millis(1),
            );

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn when_apu_started_the_charging_cycle_ends_30_minutes_after_below_4_ampere() {
            let test_bed = test_bed_with()
                .full_battery_charge()
                .on_the_ground()
                .indicated_airspeed_of(Velocity::new::<knot>(0.))
                .and()
                .started_apu()
                .then_continue_with()
                .stopped_apu()
                .run(Duration::from_secs(
                    Closed::BATTERY_CHARGING_OPEN_DELAY_100_KNOTS_OR_AFTER_APU_START_SECONDS,
                ));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn when_apu_started_the_charging_cycle_does_not_end_within_30_minutes_before_below_4_ampere(
        ) {
            let test_bed = test_bed_with()
                .full_battery_charge()
                .on_the_ground()
                .indicated_airspeed_of(Velocity::new::<knot>(0.))
                .and()
                .started_apu()
                .then_continue_with()
                .stopped_apu()
                .run(
                    Duration::from_secs(
                        Closed::BATTERY_CHARGING_OPEN_DELAY_100_KNOTS_OR_AFTER_APU_START_SECONDS,
                    ) - Duration::from_millis(1),
                );

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn when_apu_started_the_charging_cycle_ends_30_minutes_after_below_4_ampere_even_when_apu_still_available(
        ) {
            let test_bed = test_bed_with()
                .full_battery_charge()
                .and()
                .started_apu()
                .run(Duration::from_secs(
                    Closed::BATTERY_CHARGING_OPEN_DELAY_100_KNOTS_OR_AFTER_APU_START_SECONDS,
                ));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn when_apu_is_available_the_contactor_does_not_close_for_apu_start_despite_master_sw_pb_being_on(
        ) {
            let test_bed = test_bed_with()
                .full_battery_charge()
                .and()
                .started_apu()
                .run(Duration::from_secs(
                    Closed::BATTERY_CHARGING_OPEN_DELAY_100_KNOTS_OR_AFTER_APU_START_SECONDS,
                ))
                .then_continue_with()
                .apu_master_sw_pb_on()
                .run(Duration::from_secs(1));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn complete_discharge_protection_ensures_the_battery_doesnt_fully_discharge_on_the_ground()
        {
            let test_bed =
                test_bed_with()
                    .pre_discharge_protection_state()
                    .run(Duration::from_secs(
                        Closed::BATTERY_DISCHARGE_PROTECTION_DELAY_SECONDS,
                    ));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn complete_discharge_protection_is_reset_by_cycling_the_battery_push_button() {
            let mut test_bed =
                test_bed_with()
                    .pre_discharge_protection_state()
                    .run(Duration::from_secs(
                        Closed::BATTERY_DISCHARGE_PROTECTION_DELAY_SECONDS,
                    ));

            assert!(
                !test_bed.battery_contactor_is_closed(),
                "The test assumes discharge protection has kicked in at this point in the test."
            );

            test_bed = test_bed
                .then_continue_with()
                .cycle_battery_push_button()
                .and()
                .wait_for_bcl_startup()
                .wait_for_closed_contactor(false);

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn complete_discharge_protection_doesnt_trigger_too_early() {
            let test_bed = test_bed_with().pre_discharge_protection_state().run(
                Duration::from_secs(Closed::BATTERY_DISCHARGE_PROTECTION_DELAY_SECONDS)
                    - Duration::from_millis(1),
            );

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn complete_discharge_protection_does_not_activate_in_flight() {
            let test_bed = test_bed()
                .wait_for_closed_contactor(true)
                .then_continue_with()
                .nearly_empty_battery_charge()
                .run(Duration::from_secs(
                    Closed::BATTERY_DISCHARGE_PROTECTION_DELAY_SECONDS,
                ));

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn bat_only_on_ground_doesnt_close_when_discharge_protection_triggered() {
            let mut test_bed =
                test_bed_with()
                    .pre_discharge_protection_state()
                    .run(Duration::from_secs(
                        Closed::BATTERY_DISCHARGE_PROTECTION_DELAY_SECONDS,
                    ));

            assert!(
                !test_bed.battery_contactor_is_closed(),
                "The test assumes discharge protection has kicked in at this point in the test."
            );

            test_bed = test_bed
                .then_continue_with()
                .wait_for_closed_contactor(false);

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn turning_off_the_battery_while_the_contactor_is_closed_opens_the_contactor() {
            let test_bed = test_bed()
                .wait_for_closed_contactor(true)
                .then_continue_with()
                .battery_push_button_off();

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_doesnt_close_while_the_battery_is_off() {
            let test_bed = test_bed_with()
                .battery_push_button_off()
                .wait_for_closed_contactor(false);

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_doesnt_close_for_apu_start_in_emergency_configuration_with_landing_gear_down()
        {
            let test_bed = test_bed_with()
                .emergency_elec()
                .gear_down()
                .and()
                .apu_master_sw_pb_on()
                .run(Duration::from_millis(1));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_opens_when_gear_goes_down_during_apu_start_in_emergency_configuration() {
            let mut test_bed = test_bed_with()
                .apu_master_sw_pb_on()
                .run(Duration::from_millis(1));

            assert!(
                test_bed.battery_contactor_is_closed(),
                "The test assumes the contactor closed
                at this point due to the APU master kicking in."
            );

            test_bed = test_bed
                .emergency_elec()
                .gear_down()
                .run(Duration::from_millis(1));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_does_close_for_apu_start_outside_of_emergency_configuration_with_landing_gear_down(
        ) {
            let test_bed = test_bed_with()
                .gear_down()
                .and()
                .apu_master_sw_pb_on()
                .run(Duration::from_millis(1));

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_does_close_for_apu_start_within_first_45_seconds_of_emergency_elec_when_emergency_generator_available(
        ) {
            let test_bed = test_bed_with()
                .emergency_elec()
                .available_emergency_generator()
                .and()
                .apu_master_sw_pb_on()
                .run(
                    Duration::from_secs(Open::APU_START_INHIBIT_DELAY_SECONDS)
                        - Duration::from_millis(1),
                );

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_does_close_for_apu_start_after_45_seconds_of_emergency_elec_when_emergency_generator_unavailable(
        ) {
            let test_bed = test_bed_with()
                .emergency_elec()
                .and()
                .apu_master_sw_pb_on()
                .run(Duration::from_secs(Open::APU_START_INHIBIT_DELAY_SECONDS));

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_does_not_close_for_apu_start_within_first_45_seconds_of_emergency_elec_when_emergency_generator_unavailable(
        ) {
            let test_bed = test_bed_with()
                .emergency_elec()
                .and()
                .apu_master_sw_pb_on()
                .run(
                    Duration::from_secs(Open::APU_START_INHIBIT_DELAY_SECONDS)
                        - Duration::from_millis(1),
                );

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_opens_when_aircraft_enters_emer_elec() {
            let mut test_bed = test_bed_with()
                .apu_master_sw_pb_on()
                .run(Duration::from_millis(1));

            assert!(
                test_bed.battery_contactor_is_closed(),
                "The test assumes the contactor closed
                at this point due to the APU master kicking in."
            );

            test_bed = test_bed.emergency_elec().run(Duration::from_millis(1));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_closes_for_a_maximum_of_three_minutes_for_apu_start_in_emergency_elec() {
            let test_bed = test_bed_with()
                .emergency_elec()
                .available_emergency_generator()
                .and()
                .apu_master_sw_pb_on()
                .run(
                    Duration::from_secs(Closed::EMER_ELEC_APU_MASTER_MAXIMUM_CLOSED_SECONDS)
                        - Duration::from_millis(1),
                );

            assert!(test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_opens_after_three_minutes_of_being_closed_for_apu_start_in_emergency_elec() {
            let test_bed = test_bed_with()
                .emergency_elec()
                .available_emergency_generator()
                .and()
                .apu_master_sw_pb_on()
                .run(Duration::from_secs(
                    Closed::EMER_ELEC_APU_MASTER_MAXIMUM_CLOSED_SECONDS,
                ));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn contactor_opens_immediately_when_apu_master_sw_pb_pushed_off_in_emergency_elec() {
            let mut test_bed = test_bed_with()
                .emergency_elec()
                .available_emergency_generator()
                .and()
                .apu_master_sw_pb_on()
                .run(Duration::from_secs(1));

            assert!(
                test_bed.battery_contactor_is_closed(),
                "A precondition of this test is that the contactor is closed at this point."
            );

            test_bed = test_bed
                .then_continue_with()
                .apu_master_sw_pb_off()
                .run(Duration::from_secs(0));

            assert!(!test_bed.battery_contactor_is_closed());
        }

        #[test]
        fn emergency_elec_apu_start_inhibit_delay_shouldnt_repeat_when_transitioning_states() {
            let mut test_bed = test_bed_with()
                .emergency_elec()
                .and()
                .apu_master_sw_pb_on()
                .run(Duration::from_secs(Open::APU_START_INHIBIT_DELAY_SECONDS));

            assert!(
                test_bed.battery_contactor_is_closed(),
                "A precondition of this test is that the contactor is closed at this point."
            );

            test_bed = test_bed
                .then_continue_with()
                .apu_master_sw_pb_off()
                .run(Duration::from_secs(0));

            assert!(
                !test_bed.battery_contactor_is_closed(),
                "A precondition of this test is that the contactor is closed at this point."
            );

            test_bed = test_bed
                .then_continue_with()
                .apu_master_sw_pb_on()
                .run(Duration::from_secs(0));

            assert!(test_bed.battery_contactor_is_closed(),);
        }
    }
}
