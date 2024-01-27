use std::{collections::HashMap, time::Duration};

use crate::systems::simulation::SimulationElement;
use nalgebra::Vector3;
use systems::{
    fuel::{self, FuelInfo, FuelSystem, FuelTank, RefuelRate},
    pneumatic::EngineState,
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
        UpdateContext, VariableIdentifier, Write,
    },
};
use uom::si::{
    f64::{Mass, Velocity},
    mass::kilogram,
    velocity::knot,
};

use super::A380FuelTankType;

#[derive(Clone, Copy)]
enum ModeSelect {
    AutoRefuel,
    _Off,
    _ManualRefuel,
    _Defuel,
    _Transfer,
}

pub struct RefuelPanelInput {
    total_desired_fuel_id: VariableIdentifier,
    total_desired_fuel_input: Mass,

    refuel_status_id: VariableIdentifier,
    refuel_status: bool,

    refuel_rate_setting: RefuelRate,
    refuel_rate_setting_id: VariableIdentifier,

    ground_speed_id: VariableIdentifier,
    ground_speed: Velocity,

    is_on_ground_id: VariableIdentifier,
    is_on_ground: bool,

    engine_state_ids: [VariableIdentifier; 4],
    engine_states: [EngineState; 4],
}
impl RefuelPanelInput {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            total_desired_fuel_id: context.get_identifier("FUEL_DESIRED".to_owned()),
            total_desired_fuel_input: Mass::default(),

            refuel_status_id: context.get_identifier("REFUEL_STARTED_BY_USR".to_owned()),
            refuel_status: false,

            refuel_rate_setting_id: context.get_identifier("EFB_REFUEL_RATE_SETTING".to_owned()),
            refuel_rate_setting: RefuelRate::Real,
            ground_speed_id: context.get_identifier("GPS GROUND SPEED".to_owned()),
            ground_speed: Velocity::default(),
            is_on_ground_id: context.get_identifier("SIM ON GROUND".to_owned()),
            is_on_ground: false,

            engine_state_ids: [1, 2, 3, 4]
                .map(|id| context.get_identifier(format!("ENGINE_STATE:{id}"))),
            engine_states: [EngineState::Off; 4],
        }
    }

    fn set_total_desired_fuel_input(&mut self, fuel: Mass) {
        self.total_desired_fuel_input = fuel;
    }

    fn total_desired_fuel_input(&self) -> Mass {
        self.total_desired_fuel_input
    }

    fn refuel_status(&self) -> bool {
        self.refuel_status
    }

    fn set_refuel_status(&mut self, status: bool) {
        self.refuel_status = status;
    }

    fn refuel_rate(&self) -> RefuelRate {
        self.refuel_rate_setting
    }

    fn refuel_is_enabled(&self) -> bool {
        self.refuel_status
            && self
                .engine_states
                .iter()
                .all(|state| *state == EngineState::Off)
            && self.is_on_ground
            && self.ground_speed < Velocity::new::<knot>(0.1)
    }
}
impl SimulationElement for RefuelPanelInput {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.total_desired_fuel_input =
            Mass::new::<kilogram>(reader.read(&self.total_desired_fuel_id));
        self.refuel_status = reader.read(&self.refuel_status_id);
        self.refuel_rate_setting = reader.read(&self.refuel_rate_setting_id);
        self.ground_speed = reader.read(&self.ground_speed_id);
        self.is_on_ground = reader.read(&self.is_on_ground_id);
        for (id, state) in self
            .engine_state_ids
            .iter()
            .zip(self.engine_states.iter_mut())
        {
            *state = reader.read(id);
        }
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.refuel_status_id, self.refuel_status);
        writer.write(
            &self.total_desired_fuel_id,
            self.total_desired_fuel_input.get::<kilogram>(),
        );
    }
}

pub struct IntegratedRefuelPanel {
    powered_by: ElectricalBusType,
    is_powered: bool,
    _mode_select: ModeSelect,
    input: RefuelPanelInput,
}
impl IntegratedRefuelPanel {
    pub fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        Self {
            powered_by,
            is_powered: false,
            _mode_select: ModeSelect::AutoRefuel,
            input: RefuelPanelInput::new(context),
        }
    }

    fn total_desired_fuel(&self) -> Mass {
        self.input.total_desired_fuel_input()
    }

    fn refuel_status(&self) -> bool {
        self.input.refuel_status()
    }

    #[allow(dead_code)]
    fn set_fuel_desired(&mut self, fuel: Mass) {
        self.input.set_total_desired_fuel_input(fuel)
    }

    fn set_refuel_status(&mut self, status: bool) {
        self.input.set_refuel_status(status);
    }

    fn refuel_rate(&self) -> RefuelRate {
        self.input.refuel_rate()
    }

    fn refuel_is_enabled(&self) -> bool {
        self.input.refuel_is_enabled()
    }
}
impl SimulationElement for IntegratedRefuelPanel {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.input.accept(visitor);
        visitor.visit(self);
    }
}

pub struct RefuelApplication {
    refuel_driver: RefuelDriver,
}
impl RefuelApplication {
    pub fn new(_context: &mut InitContext, _powered_by: ElectricalBusType) -> Self {
        Self {
            refuel_driver: RefuelDriver::new(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        fuel_system: &mut FuelSystem<11>,
        refuel_panel_input: &mut IntegratedRefuelPanel,
    ) {
        // Automatic Refueling
        let desired_quantities =
            self.calculate_auto_refuel(refuel_panel_input.total_desired_fuel());

        // TODO: Uncomment when IS_SIM_READY variable is implemented
        // if !context.is_sim_ready() {
        //    refuel_panel_input.set_fuel_desired(fuel_system.total_load());
        //}

        match refuel_panel_input.refuel_rate() {
            RefuelRate::Real => {
                if refuel_panel_input.refuel_is_enabled() {
                    self.refuel_driver.execute_timed_refuel(
                        context.delta(),
                        false,
                        fuel_system,
                        refuel_panel_input,
                        desired_quantities,
                    );
                }
            }
            RefuelRate::Fast => {
                if refuel_panel_input.refuel_is_enabled() {
                    self.refuel_driver.execute_timed_refuel(
                        context.delta(),
                        true,
                        fuel_system,
                        refuel_panel_input,
                        desired_quantities,
                    );
                }
            }
            RefuelRate::Instant => {
                if refuel_panel_input.refuel_status() {
                    self.refuel_driver.execute_instant_refuel(
                        fuel_system,
                        refuel_panel_input,
                        desired_quantities,
                    );
                }
            }
        }
    }

    pub fn calculate_auto_refuel(
        &mut self,
        total_desired_fuel: Mass,
    ) -> HashMap<A380FuelTankType, Mass> {
        let a = Mass::new::<kilogram>(18000.);
        let b = Mass::new::<kilogram>(26000.);
        let c = Mass::new::<kilogram>(36000.);
        let d = Mass::new::<kilogram>(47000.);
        let e = Mass::new::<kilogram>(103788.);
        let f = Mass::new::<kilogram>(158042.);
        let g = Mass::new::<kilogram>(215702.);
        let h = Mass::new::<kilogram>(223028.);

        let trim_1 = Mass::new::<kilogram>(4000.);
        let trim_2 = Mass::new::<kilogram>(8000.);
        let trim_max = Mass::new::<kilogram>(19026.);

        // TODO: Trim tank logic
        let trim_fuel = match total_desired_fuel {
            x if x <= f => Mass::default(),
            x if x < f + trim_1 => total_desired_fuel - f,
            x if x <= f + trim_1 => trim_1,
            x if x <= g => trim_1,
            x if x <= g + trim_2 => trim_1 + total_desired_fuel - g,
            x if x <= h => trim_2,
            x if x <= h + (trim_max - trim_2) => trim_2 + total_desired_fuel - h,
            _ => trim_max,
        };

        let wing_fuel = total_desired_fuel - trim_fuel;

        let feed_a = Mass::new::<kilogram>(4500.);
        let feed_c = Mass::new::<kilogram>(7000.);
        let outer_feed_e = Mass::new::<kilogram>(20558.);
        let inner_feed_e = Mass::new::<kilogram>(21836.);
        let total_feed_e = outer_feed_e * 2. + inner_feed_e * 2.;

        let outer_feed = match wing_fuel {
            x if x <= a => wing_fuel / 4.,
            x if x <= b => feed_a,
            x if x <= c => feed_a + (wing_fuel - b) / 4.,
            x if x <= d => feed_c,
            x if x <= e => feed_c + (wing_fuel - d) * (outer_feed_e / total_feed_e),
            x if x <= h => outer_feed_e,
            _ => outer_feed_e + (wing_fuel - h) / 10.,
        };

        let inner_feed = match wing_fuel {
            x if x <= a => wing_fuel / 4.,
            x if x <= b => feed_a,
            x if x <= c => feed_a + (wing_fuel - b) / 4.,
            x if x <= d => feed_c,
            x if x <= e => feed_c + (wing_fuel - d) * (inner_feed_e / total_feed_e),
            x if x <= h => inner_feed_e,
            _ => inner_feed_e + (wing_fuel - h) / 10.,
        };

        let outer_tank_b = Mass::new::<kilogram>(4000.);
        let outer_tank_h = Mass::new::<kilogram>(7693.);

        let outer_tank = match wing_fuel {
            x if x <= a => Mass::default(),
            x if x <= b => (wing_fuel - a) / 2.,
            x if x <= g => outer_tank_b,
            x if x <= h => outer_tank_b + (wing_fuel - g) / 2.,
            _ => outer_tank_h + (wing_fuel - h) / 10.,
        };

        let inner_tank_d = Mass::new::<kilogram>(5500.);
        let inner_tank_g = Mass::new::<kilogram>(34300.);

        let inner_tank = match wing_fuel {
            x if x <= c => Mass::default(),
            x if x <= d => (wing_fuel - c) / 2.,
            x if x <= f => inner_tank_d,
            x if x <= g => inner_tank_d + (wing_fuel - f) / 2.,
            x if x <= h => inner_tank_g,
            _ => inner_tank_g + (wing_fuel - h) / 10.,
        };

        let mid_tank_f = Mass::new::<kilogram>(27127.);

        let mid_tank = match wing_fuel {
            x if x <= e => Mass::default(),
            x if x <= f => (wing_fuel - e) / 2.,
            x if x <= h => mid_tank_f,
            _ => mid_tank_f + (wing_fuel - h) / 10.,
        };
        // TODO: maximum amount per tick and use efb refueling rate

        [
            (A380FuelTankType::LeftOuter, outer_tank),
            (A380FuelTankType::RightOuter, outer_tank),
            (A380FuelTankType::LeftMid, mid_tank),
            (A380FuelTankType::RightMid, mid_tank),
            (A380FuelTankType::LeftInner, inner_tank),
            (A380FuelTankType::RightInner, inner_tank),
            (A380FuelTankType::FeedOne, outer_feed),
            (A380FuelTankType::FeedFour, outer_feed),
            (A380FuelTankType::FeedTwo, inner_feed),
            (A380FuelTankType::FeedThree, inner_feed),
            (A380FuelTankType::Trim, trim_fuel),
        ]
        .into()
    }
}
impl SimulationElement for RefuelApplication {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.refuel_driver.accept(visitor);
        visitor.visit(self);
    }
}

// TODO: This should be moved to common systems
pub struct RefuelDriver {}
impl RefuelDriver {
    const WING_FUELRATE_GAL_SEC: f64 = 16.;
    const FAST_SPEED_FACTOR: f64 = 5.;

    pub fn new() -> Self {
        Self {}
    }

    fn execute_timed_refuel(
        &mut self,
        delta_time: Duration,
        is_fast: bool,
        fuel_system: &mut FuelSystem<11>,
        refuel_panel_input: &mut IntegratedRefuelPanel,
        desired_quantities: HashMap<A380FuelTankType, Mass>,
    ) {
        let speed_multi = if is_fast { Self::FAST_SPEED_FACTOR } else { 1. };

        let t = delta_time.as_secs_f64();
        let max_tick_delta_fuel: Mass = Mass::new::<kilogram>(
            t * Self::WING_FUELRATE_GAL_SEC * speed_multi * fuel::FUEL_GALLONS_TO_KG,
        );

        // Naive method, move fuel from every tank, limit to max_delta
        let left_channel = [
            A380FuelTankType::FeedOne,
            A380FuelTankType::FeedTwo,
            A380FuelTankType::LeftOuter,
            A380FuelTankType::LeftMid,
            A380FuelTankType::LeftInner,
            A380FuelTankType::Trim,
            A380FuelTankType::FeedFour,
            A380FuelTankType::FeedThree,
            A380FuelTankType::RightOuter,
            A380FuelTankType::RightMid,
            A380FuelTankType::RightInner,
        ];

        let right_channel = [
            A380FuelTankType::FeedFour,
            A380FuelTankType::FeedThree,
            A380FuelTankType::RightOuter,
            A380FuelTankType::RightMid,
            A380FuelTankType::RightInner,
            A380FuelTankType::Trim,
            A380FuelTankType::FeedOne,
            A380FuelTankType::FeedTwo,
            A380FuelTankType::LeftOuter,
            A380FuelTankType::LeftMid,
            A380FuelTankType::LeftInner,
        ];

        let left_resolve = self.resolve_delta_in_channel(
            max_tick_delta_fuel / 2.,
            left_channel,
            &desired_quantities,
            fuel_system,
        );

        let right_resolve = self.resolve_delta_in_channel(
            max_tick_delta_fuel / 2.,
            right_channel,
            &desired_quantities,
            fuel_system,
        );

        if left_resolve && right_resolve {
            refuel_panel_input.set_refuel_status(false);
        }
    }

    fn resolve_delta_in_channel(
        &mut self,
        max_delta: Mass,
        channel: [A380FuelTankType; 11],
        desired_quantities: &HashMap<A380FuelTankType, Mass>,
        fuel_system: &mut FuelSystem<11>,
    ) -> bool {
        if max_delta <= Mass::default() {
            return true;
        }
        let mut remaining_delta = max_delta;
        for tank in channel {
            let desired_quantity: Mass = *desired_quantities.get(&tank).unwrap_or(&Mass::default());
            let current_quantity: Mass = fuel_system.tank_mass(tank as usize);

            let sign = if desired_quantity > current_quantity {
                1.
            } else if desired_quantity < current_quantity {
                -1.
            } else {
                0.
            };

            let delta = (desired_quantity - current_quantity).abs();
            fuel_system.set_tank_quantity(
                tank as usize,
                current_quantity + sign * delta.min(remaining_delta),
            );
            if delta >= remaining_delta {
                return false;
            }
            remaining_delta -= delta;
        }
        true
    }

    fn execute_instant_refuel(
        &mut self,
        fuel_system: &mut FuelSystem<11>,
        refuel_panel_input: &mut IntegratedRefuelPanel,
        desired_quantities: HashMap<A380FuelTankType, Mass>,
    ) {
        for tank_type in A380FuelTankType::iterator() {
            fuel_system.set_tank_quantity(
                tank_type as usize,
                *desired_quantities
                    .get(&tank_type)
                    .unwrap_or(&Mass::default()),
            );
        }

        if (fuel_system.total_load() - refuel_panel_input.total_desired_fuel()).abs()
            < Mass::new::<kilogram>(1.)
        {
            refuel_panel_input.set_refuel_status(false);
        }
    }
}
impl SimulationElement for RefuelDriver {}

pub struct A380FuelQuantityManagementSystem {
    fuel_system: FuelSystem<11>,
    refuel_application: RefuelApplication,
    integrated_refuel_panel: IntegratedRefuelPanel,
}
impl A380FuelQuantityManagementSystem {
    pub fn new(context: &mut InitContext, fuel_tanks_info: [FuelInfo; 11]) -> Self {
        let fuel_tanks = fuel_tanks_info.map(|f| {
            FuelTank::new(
                context,
                f.fuel_tank_id,
                Vector3::new(f.position.0, f.position.1, f.position.2),
                true,
            )
        });
        let fuel_system = FuelSystem::new(context, fuel_tanks);

        Self {
            // TODO: This needs to be refactored when CPIOM implementation is done
            // CPIOM_COM_F1, CPIOM_MON_F3 [FQDC_1] -> 501PP
            // CPIOM_COM_F2, CPIOM_MON_F4 [FQDC_2] -> 109PP 101PP 107PP
            fuel_system,
            refuel_application: RefuelApplication::new(
                context,
                ElectricalBusType::DirectCurrentEssential, // 501PP
            ),
            integrated_refuel_panel: IntegratedRefuelPanel::new(
                context,
                ElectricalBusType::DirectCurrentEssential, // 501PP
            ),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.refuel_application.update(
            context,
            &mut self.fuel_system,
            &mut self.integrated_refuel_panel,
        );
    }

    #[cfg(test)]
    pub fn refuel_application(&mut self) -> &mut RefuelApplication {
        &mut self.refuel_application
    }

    pub fn fuel_system(&self) -> &FuelSystem<11> {
        &self.fuel_system
    }
}
impl SimulationElement for A380FuelQuantityManagementSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel_system.accept(visitor);
        self.refuel_application.accept(visitor);
        self.integrated_refuel_panel.accept(visitor);
        visitor.visit(self);
    }
}
