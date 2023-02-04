use std::time::Duration;
use uom::si::{f64::*, pressure::psi, ratio::ratio};

use crate::{
    shared::{low_pass_filter::LowPassFilter, ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use super::{PressureSwitch, PressureSwitchState, PressureSwitchType};

struct ReverserActuator {
    position: Ratio,
    current_speed: LowPassFilter<Ratio>,

    nominal_pressure: Pressure,
}
impl ReverserActuator {
    const NOMINAL_SPEED_RATIO_PER_S: f64 = 0.7;
    const SPEED_TIME_CONSTANT: Duration = Duration::from_millis(250);

    fn new(nominal_pressure: Pressure) -> Self {
        Self {
            position: Ratio::default(),
            current_speed: LowPassFilter::new(Self::SPEED_TIME_CONSTANT),
            nominal_pressure,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        is_mechanically_locked: bool,
    ) {
        self.update_current_speed(context, pressure, is_mechanically_locked);

        self.position += context.delta_as_secs_f64() * self.current_speed.output();

        self.position = self
            .position
            .max(Ratio::default())
            .min(Ratio::new::<ratio>(1.));
    }

    fn update_current_speed(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        is_mechanically_locked: bool,
    ) {
        if is_mechanically_locked {
            self.current_speed.reset(Ratio::default());
        } else {
            self.current_speed
                .update(context.delta(), self.max_speed_from_pressure(pressure));
        }
    }

    fn max_speed_from_pressure(&self, pressure: Pressure) -> Ratio {
        let pressure_ratio: Ratio = pressure / self.nominal_pressure;

        pressure_ratio * Self::NOMINAL_SPEED_RATIO_PER_S
    }

    fn position(&self) -> Ratio {
        self.position
    }
}

struct ElectricalLock {
    is_locked: bool,
    is_powered: bool,
    powered_by: ElectricalBusType,
}
impl ElectricalLock {
    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            is_locked: true,
            is_powered: false,
            powered_by,
        }
    }

    fn update(&mut self, controller: &impl ReverserInterface, actuator_position: Ratio) {
        let is_locking = !controller.should_unlock() || !self.is_powered;

        self.is_locked = is_locking && actuator_position.get::<ratio>() < 0.01;
    }

    fn is_locked(&self) -> bool {
        self.is_locked
    }
}
impl SimulationElement for ElectricalLock {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}

//TODO remove valve duplication from gear system

#[derive(PartialEq, Clone, Copy)]
enum HydraulicValveType {
    ClosedWhenOff,
    _OpenedWhenOff,
    Mechanical,
}

struct HydraulicValve {
    position: LowPassFilter<Ratio>,
    is_powered: bool,
    powered_by: ElectricalBusType,
    valve_type: HydraulicValveType,

    pressure_input: Pressure,
    pressure_output: Pressure,
}
impl HydraulicValve {
    const POSITION_RESPONSE_TIME_CONSTANT: Duration = Duration::from_millis(150);
    const MIN_POSITION_FOR_ZERO_PRESSURE_RATIO: f64 = 0.02;

    fn new(valve_type: HydraulicValveType, powered_by: ElectricalBusType) -> Self {
        Self {
            position: LowPassFilter::<Ratio>::new(Self::POSITION_RESPONSE_TIME_CONSTANT),
            is_powered: false, // TODO set to false and add SimulationElement powering
            powered_by,
            valve_type,
            pressure_input: Pressure::default(),
            pressure_output: Pressure::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        commanded_open: bool,
        current_pressure_input: Pressure,
    ) {
        let commanded_position = self.actual_target_position_from_valve_type(commanded_open);

        self.position.update(context.delta(), commanded_position);

        self.pressure_input = current_pressure_input;
        self.update_output_pressure();
    }

    fn actual_target_position_from_valve_type(&self, commanded_open: bool) -> Ratio {
        match self.valve_type {
            HydraulicValveType::_OpenedWhenOff => {
                if !commanded_open && self.is_powered {
                    Ratio::new::<ratio>(0.)
                } else {
                    Ratio::new::<ratio>(1.)
                }
            }
            HydraulicValveType::ClosedWhenOff => {
                if commanded_open && self.is_powered {
                    Ratio::new::<ratio>(1.)
                } else {
                    Ratio::new::<ratio>(0.)
                }
            }
            HydraulicValveType::Mechanical => {
                if commanded_open {
                    Ratio::new::<ratio>(1.)
                } else {
                    Ratio::new::<ratio>(0.)
                }
            }
        }
    }

    fn update_output_pressure(&mut self) {
        self.pressure_output =
            if self.position.output().get::<ratio>() > Self::MIN_POSITION_FOR_ZERO_PRESSURE_RATIO {
                self.pressure_input
                    * (self.position.output().sqrt() * 1.4)
                        .min(Ratio::new::<ratio>(1.).max(Ratio::new::<ratio>(0.)))
            } else {
                Pressure::default()
            }
    }

    fn pressure_output(&self) -> Pressure {
        self.pressure_output
    }
}
impl SimulationElement for HydraulicValve {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}

struct DirectionalValve {
    position: LowPassFilter<Ratio>,
    is_powered: bool,
    powered_by: ElectricalBusType,

    pressure_output: Pressure,
}
impl DirectionalValve {
    const POSITION_RESPONSE_TIME_CONSTANT: Duration = Duration::from_millis(150);

    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            position: LowPassFilter::<Ratio>::new(Self::POSITION_RESPONSE_TIME_CONSTANT),
            is_powered: true, // TODO set to false and add SimulationElement powering
            powered_by,
            pressure_output: Pressure::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        commanded_retraction: bool,
        current_pressure_input: Pressure,
    ) {
        let commanded_position = if commanded_retraction || !self.is_powered {
            Ratio::new::<ratio>(-1.)
        } else {
            Ratio::new::<ratio>(1.)
        };

        self.position.update(context.delta(), commanded_position);

        self.pressure_output = current_pressure_input * self.position.output();
    }

    fn pressure_output(&self) -> Pressure {
        self.pressure_output
    }
}
impl SimulationElement for DirectionalValve {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}

trait ReverserInterface {
    fn should_unlock(&self) -> bool;
    fn should_isolate_hydraulics(&self) -> bool;
    fn should_deploy_reverser(&self) -> bool;
}

struct ReverserHydraulicManifold {
    isolation_valve: HydraulicValve,
    directional_valve: DirectionalValve,

    pressure_switch: PressureSwitch,
}
impl ReverserHydraulicManifold {
    fn new(
        powered_by: ElectricalBusType,
        switch_high_pressure: Pressure,
        switch_low_pressure: Pressure,
    ) -> Self {
        Self {
            isolation_valve: HydraulicValve::new(HydraulicValveType::ClosedWhenOff, powered_by),
            directional_valve: DirectionalValve::new(powered_by),
            pressure_switch: PressureSwitch::new(
                switch_high_pressure,
                switch_low_pressure,
                PressureSwitchType::Absolute,
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        controller: &impl ReverserInterface,
    ) {
        self.isolation_valve
            .update(context, !controller.should_isolate_hydraulics(), pressure);

        self.pressure_switch
            .update(context, self.isolation_valve.pressure_output());

        self.directional_valve.update(
            context,
            !controller.should_deploy_reverser(),
            self.isolation_valve.pressure_output(),
        )
    }

    fn pressure_output(&self) -> Pressure {
        self.directional_valve.pressure_output()
    }

    fn pressure_switch_pressurised(&self) -> bool {
        self.pressure_switch.state() == PressureSwitchState::Pressurised
    }
}

struct ReverserAssembly {
    electrical_lock: ElectricalLock,
    hydraulic_manifold: ReverserHydraulicManifold,
    actuator: ReverserActuator,
}
impl ReverserAssembly {
    fn new(
        nominal_hydraulic_pressure: Pressure,
        switch_high_threshold_pressure: Pressure,
        switch_low_threshold_pressure: Pressure,
        electrical_lock_powered_by: ElectricalBusType,
        hyd_valves_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            electrical_lock: ElectricalLock::new(electrical_lock_powered_by),
            hydraulic_manifold: ReverserHydraulicManifold::new(
                hyd_valves_powered_by,
                switch_high_threshold_pressure,
                switch_low_threshold_pressure,
            ),
            actuator: ReverserActuator::new(nominal_hydraulic_pressure),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        controller: &impl ReverserInterface,
        pressure: Pressure,
    ) {
        self.electrical_lock
            .update(controller, self.reverser_position());

        self.hydraulic_manifold
            .update(context, pressure, controller);

        self.actuator.update(
            context,
            self.hydraulic_manifold.pressure_output(),
            self.electrical_lock.is_locked(),
        );
    }

    fn reverser_position(&self) -> Ratio {
        self.actuator.position()
    }
}
