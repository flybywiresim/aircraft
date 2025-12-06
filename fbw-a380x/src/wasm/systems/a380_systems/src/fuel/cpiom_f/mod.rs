mod fuel_measuring;

use super::{A380FuelTankType, SetFuelLevel};
use crate::{
    fuel::{ArincFuelPumpStatusProvider, ArincFuelQuantityProvider},
    systems::simulation::SimulationElement,
};
use bitflags::{bitflags, Flags};
use enum_map::Enum;
use fuel_measuring::FuelMeasuringApplication;
use serde::Deserialize;
use serde_with::{serde_as, DisplayFromStr};
use std::{collections::HashMap, time::Duration};
use systems::{
    fuel::{self, FuelPayload, RefuelRate},
    pneumatic::EngineState,
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        DelayedTrueLogicGate, ElectricalBusType, ElectricalBuses, Resolution,
    },
    simulation::{
        InitContext, Read, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
        UpdateContext, VariableIdentifier, Write, Writer,
    },
};
use uom::si::{
    f64::{Mass, Ratio, Velocity},
    mass::kilogram,
    ratio::percent,
    velocity::knot,
};

const FEED_TANKS: [A380FuelTankType; 4] = [
    A380FuelTankType::FeedOne,
    A380FuelTankType::FeedTwo,
    A380FuelTankType::FeedThree,
    A380FuelTankType::FeedFour,
];

#[derive(Clone, Copy)]
enum ModeSelect {
    AutoRefuel,
    _Off,
    _ManualRefuel,
    _Defuel,
    _Transfer,
}

#[derive(Deserialize)]
struct ZfwParams {
    target_zfw_cg: Vec<u32>,
    target_zfw: Vec<ZfwRange>,
}

#[derive(Deserialize)]
struct ZfwRange {
    start: u32,
    end: u32,
}

#[serde_as]
#[derive(Deserialize)]
struct TrimTankTables {
    #[serde_as(as = "Vec<HashMap<DisplayFromStr, _>>")]
    tables: Vec<HashMap<u32, Vec<u32>>>,
}

#[derive(Deserialize)]
struct TrimTankMapping {
    params: ZfwParams,
    trim_tank_targets: TrimTankTables,
}

pub struct RefuelPanelInput {
    total_desired_fuel_id: VariableIdentifier,
    total_desired_fuel_input: Mass,

    refuel_status_id: VariableIdentifier,
    refuel_status: bool,

    refuel_rate_setting: RefuelRate,
    refuel_rate_setting_id: VariableIdentifier,

    engine_state_ids: [VariableIdentifier; 4],
    engine_states: [EngineState; 4],

    // TODO: Replace when proper implementation is done
    target_zero_fuel_weight: Mass,
    target_zero_fuel_weight_id: VariableIdentifier,

    target_zero_fuel_weight_cg_mac: f64,
    target_zero_fuel_weight_cg_mac_id: VariableIdentifier,
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

            engine_state_ids: [1, 2, 3, 4]
                .map(|id| context.get_identifier(format!("ENGINE_STATE:{id}"))),
            engine_states: [EngineState::Off; 4],

            target_zero_fuel_weight: Mass::new::<kilogram>(300000.),
            target_zero_fuel_weight_id: context.get_identifier("AIRFRAME_ZFW_DESIRED".to_owned()),

            target_zero_fuel_weight_cg_mac: 36.5,
            target_zero_fuel_weight_cg_mac_id: context
                .get_identifier("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED".to_owned()),
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

    fn refuel_is_enabled(&self, context: &UpdateContext) -> bool {
        // TODO: Should this be if two engines are running instead of just one?
        self.refuel_status
            && self
                .engine_states
                .iter()
                .all(|state| *state == EngineState::Off || *state == EngineState::Shutting)
            && context.is_on_ground()
            && context.ground_speed() < Velocity::new::<knot>(0.1)
    }

    fn target_zero_fuel_weight(&self) -> Mass {
        self.target_zero_fuel_weight
    }

    fn target_zero_fuel_weight_cg_mac(&self) -> f64 {
        self.target_zero_fuel_weight_cg_mac
    }
}
impl SimulationElement for RefuelPanelInput {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.total_desired_fuel_input =
            Mass::new::<kilogram>(reader.read(&self.total_desired_fuel_id));
        self.refuel_status = reader.read(&self.refuel_status_id);
        self.refuel_rate_setting = reader.read(&self.refuel_rate_setting_id);

        for (id, state) in self
            .engine_state_ids
            .iter()
            .zip(self.engine_states.iter_mut())
        {
            *state = reader.read(id);
        }
        self.target_zero_fuel_weight =
            Mass::new::<kilogram>(reader.read(&self.target_zero_fuel_weight_id));
        self.target_zero_fuel_weight_cg_mac = reader.read(&self.target_zero_fuel_weight_cg_mac_id);
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

    fn refuel_is_enabled(&self, context: &UpdateContext) -> bool {
        self.input.refuel_is_enabled(context)
    }

    fn target_zero_fuel_weight(&self) -> Mass {
        self.input.target_zero_fuel_weight()
    }

    fn target_zero_fuel_weight_cg_mac(&self) -> f64 {
        self.input.target_zero_fuel_weight_cg_mac()
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

const TRIM_TANK_TOML: &str = include_str!("./trim_tank_targets.toml");
pub struct RefuelApplication {
    refuel_driver: RefuelDriver,
    trim_tank_map: TrimTankMapping,
}
impl RefuelApplication {
    pub fn new(_context: &mut InitContext, _powered_by: ElectricalBusType) -> Self {
        Self {
            refuel_driver: RefuelDriver::new(),
            trim_tank_map: toml::from_str(TRIM_TANK_TOML)
                .expect("Failed to parse trim tank TOML file"),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        fuel_system: &mut (impl SetFuelLevel + FuelPayload),
        refuel_panel_input: &mut IntegratedRefuelPanel,
    ) {
        // Automatic Refueling
        let desired_quantities = self.calculate_auto_refuel(
            refuel_panel_input.total_desired_fuel(),
            // TODO FIXME: Add values from either MFD (or EFB)
            refuel_panel_input.target_zero_fuel_weight(),
            refuel_panel_input.target_zero_fuel_weight_cg_mac(),
        );

        if !context.is_sim_ready() {
            refuel_panel_input.set_fuel_desired(fuel_system.total_load());
        }

        match refuel_panel_input.refuel_rate() {
            RefuelRate::Real => {
                if refuel_panel_input.refuel_is_enabled(context) {
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
                if refuel_panel_input.refuel_is_enabled(context) {
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

    fn lookup_trim_fuel_from_target_fuel_range(
        target_zfw_cg_keys: &[u32],
        target_fuel_range: &[u32],
        zero_fuel_weight_cg_rounded: u32,
    ) -> Mass {
        let cg_index = target_zfw_cg_keys
            .iter()
            .position(|&x| x == zero_fuel_weight_cg_rounded)
            .unwrap_or_default();
        Mass::new::<kilogram>(target_fuel_range[cg_index] as f64)
    }

    fn get_target_fuel_range(
        zfw_category: &HashMap<u32, Vec<u32>>,
        total_desired_fuel_rounded: u32,
    ) -> &Vec<u32> {
        let min_fuel_desired = *zfw_category.keys().min().unwrap();
        let max_fuel_desired = *zfw_category.keys().max().unwrap();

        zfw_category
            .get(&total_desired_fuel_rounded.clamp(min_fuel_desired, max_fuel_desired))
            .unwrap()
    }

    fn calculate_trim_fuel(
        &mut self,
        total_desired_fuel: Mass,
        zero_fuel_weight: Mass,
        zero_fuel_weight_cg_percent_mac: f64,
    ) -> Mass {
        // Init Inputs
        let total_desired_fuel_rounded =
            ((total_desired_fuel.get::<kilogram>() / 1000.0).floor() * 1000.0) as u32;
        let zero_fuel_weight_cg_rounded = (zero_fuel_weight_cg_percent_mac).floor() as u32;
        let target_zfw = &self.trim_tank_map.params.target_zfw;
        let trim_tank_tables = &self.trim_tank_map.trim_tank_targets.tables;

        // Find the correct table to use based on ZFW
        for (range, zfw_category) in target_zfw.iter().zip(trim_tank_tables) {
            if (range.start as f64..=range.end as f64).contains(&zero_fuel_weight.get::<kilogram>())
            {
                // Fetch 1) Possible ZFWCG% column values and 2) The target fuel row values
                let target_zfw_cg_keys = &self.trim_tank_map.params.target_zfw_cg;
                let target_fuel_range =
                    Self::get_target_fuel_range(zfw_category, total_desired_fuel_rounded);

                // Then, given the current target fuel (row). Shift this value depending on ZFWCG% (column) to find trim fuel value.
                return Self::lookup_trim_fuel_from_target_fuel_range(
                    target_zfw_cg_keys,
                    target_fuel_range,
                    zero_fuel_weight_cg_rounded,
                );
            }
        }
        Mass::default()
    }

    pub fn calculate_auto_refuel(
        &mut self,
        total_desired_fuel: Mass,
        zero_fuel_weight: Mass,
        zero_fuel_weight_cg_percent_mac: f64,
    ) -> HashMap<A380FuelTankType, Mass> {
        // Note: Does not account for unusable fuel, or non-fixed H-ARM

        // TODO FIXME: If no input is provided from the MFD, The default values are ZFW = 300 000 kg (661 386 lb), and ZFCG = 36.5 %RC.

        let a = Mass::new::<kilogram>(18000.);
        let b = Mass::new::<kilogram>(26000.);
        let c = Mass::new::<kilogram>(36000.);
        let d = Mass::new::<kilogram>(47000.);
        let e = Mass::new::<kilogram>(103788.);
        let f = Mass::new::<kilogram>(158042.);
        let g = Mass::new::<kilogram>(215702.);
        let h = Mass::new::<kilogram>(223028.);

        let trim_fuel = self.calculate_trim_fuel(
            total_desired_fuel,
            zero_fuel_weight,
            zero_fuel_weight_cg_percent_mac,
        );

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
pub struct RefuelDriver;
impl RefuelDriver {
    const WING_FUELRATE_GAL_SEC: f64 = 16.;
    const FAST_SPEED_FACTOR: f64 = 5.;

    pub fn new() -> Self {
        Self
    }

    fn execute_timed_refuel(
        &mut self,
        delta_time: Duration,
        is_fast: bool,
        fuel_system: &mut (impl SetFuelLevel + FuelPayload),
        refuel_panel_input: &mut IntegratedRefuelPanel,
        desired_quantities: HashMap<A380FuelTankType, Mass>,
    ) {
        // TODO: Proper fuel transfer logic from proper fuel ports into the correct fuel tanks (LMID/LINNER RMID/RINNER). Replace naive method below.
        // TODO: Deprecating this realistically timed refueling function from refuel driver, which will only be used for instant refueling, into a proper FQMS implementation.
        // TODO: Account for AGT (Auto Ground Transfer) logic, disable when 2 engines are running (only when realistic setting is used)

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
        fuel_system: &mut (impl SetFuelLevel + FuelPayload),
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
            fuel_system
                .set_tank_quantity(tank, current_quantity + sign * delta.min(remaining_delta));
            if delta >= remaining_delta {
                return false;
            }
            remaining_delta -= delta;
        }
        true
    }

    fn execute_instant_refuel(
        &mut self,
        fuel_system: &mut (impl SetFuelLevel + FuelPayload),
        refuel_panel_input: &mut IntegratedRefuelPanel,
        desired_quantities: HashMap<A380FuelTankType, Mass>,
    ) {
        // check needs to happen first so function always runs two ticks making sure values are actually written back to the sim
        if (fuel_system.total_load() - refuel_panel_input.total_desired_fuel()).abs()
            < Mass::new::<kilogram>(1.)
        {
            refuel_panel_input.set_refuel_status(false);
        } else {
            for tank_type in A380FuelTankType::iterator() {
                fuel_system.set_tank_quantity(
                    tank_type,
                    *desired_quantities
                        .get(&tank_type)
                        .unwrap_or(&Mass::default()),
                );
            }
        }
    }
}
impl SimulationElement for RefuelDriver {}

bitflags! {
    #[derive(Copy, Clone, Default)]
    struct FQMSDiscreteFlags: u32 {
        const FMS_NO_DATA = 1 << 0;
        const FMS_DATA_DISAGREE = 1 << 1;
    }
}

/// # A380 Fuel Quantity Management System (FQMS)
///
/// Handles fuel quantity measurement, refueling, and pump state reporting.
/// We simulate both FQMS sides together here for simplicity and performance reasons.
// TODO: This is a preliminary implementation and needs to be expanded to cover all FQMS functionalities
// TODO: implement AFDX communication (FMS data, pump states, valve states, etc.)
pub(super) struct A380FuelQuantityManagementSystem {
    self_test_finished: DelayedTrueLogicGate,
    cpioms_available: [bool; 4],
    fuel_measuring_application: FuelMeasuringApplication,
    refuel_application: RefuelApplication,
    integrated_refuel_panel: IntegratedRefuelPanel,

    fuel_pump_running_word_id: [VariableIdentifier; 2],
    fuel_pump_running_words: [Arinc429Word<u32>; 2],

    // TODO: should be transmitted over AFDX
    // fms_weights_ids: [AvionicsDataCommunicationNetworkMessageIdentifier; 2],
    // fms_remaining_time_ids: [AvionicsDataCommunicationNetworkMessageIdentifier; 2],
    fms_zero_fuel_weight_ids: [VariableIdentifier; 2],
    fms_zero_fuel_weights: [Option<Mass>; 2],
    fms_zero_fuel_weight_cg_ids: [VariableIdentifier; 2],
    fms_zero_fuel_weight_cgs: [Option<Ratio>; 2],

    // Output ARINC 429 backup signals (only outputed by CPIOM-F3 and CPIOM-F4)
    // TODO: currently we output the values from all FQMS' as it would be one
    fuel_tank_quantities_id: [VariableIdentifier; A380FuelTankType::LENGTH],
    total_fuel_onboard_id: VariableIdentifier,
    total_aircraft_weight_id: VariableIdentifier,
    center_of_gravity_id: VariableIdentifier,

    fqms_status_word_id: VariableIdentifier,
    fqms_status_word: FQMSDiscreteFlags,
}
impl A380FuelQuantityManagementSystem {
    // Self test time (reference: FFS)
    const SELF_TEST_DURATION: Duration = Duration::from_secs(30);

    pub(super) fn new(context: &mut InitContext) -> Self {
        // TODO: This needs to be refactored when CPIOM implementation is done
        // CPIOM_COM_F1, CPIOM_MON_F3 [FQDC_1] -> 501PP
        // CPIOM_COM_F2, CPIOM_MON_F4 [FQDC_2] -> 109PP 101PP 107PP
        Self {
            self_test_finished: DelayedTrueLogicGate::new(Self::SELF_TEST_DURATION),
            cpioms_available: [false; 4],
            fuel_measuring_application: FuelMeasuringApplication::new(),
            refuel_application: RefuelApplication::new(
                context,
                ElectricalBusType::DirectCurrentEssential, // 501PP
            ),
            integrated_refuel_panel: IntegratedRefuelPanel::new(
                context,
                ElectricalBusType::DirectCurrentEssential, // 501PP
            ),

            fuel_pump_running_word_id: ["LEFT", "RIGHT"]
                .map(|side| context.get_identifier(format!("FQMS_{side}_FUEL_PUMP_RUNNING_WORD"))),
            fuel_pump_running_words: Default::default(),

            // Input from FMS
            // TODO: should be transmitted over AFDX
            fms_zero_fuel_weight_ids: [1, 2]
                .map(|id| context.get_identifier(format!("FM{id}_ZERO_FUEL_WEIGHT"))),
            fms_zero_fuel_weights: Default::default(),
            fms_zero_fuel_weight_cg_ids: [1, 2]
                .map(|id| context.get_identifier(format!("FM{id}_ZERO_FUEL_WEIGHT_CG"))),
            fms_zero_fuel_weight_cgs: Default::default(),

            fuel_tank_quantities_id: A380FuelTankType::iterator()
                .map(|tank| context.get_identifier(format!("FQMS_{tank}_QUANTITY")))
                .collect::<Vec<_>>()
                .try_into()
                .expect("Failed to create fuel tank quantities identifiers"),
            total_fuel_onboard_id: context.get_identifier("FQMS_TOTAL_FUEL_ON_BOARD".to_owned()),
            total_aircraft_weight_id: context.get_identifier("FQMS_GROSS_WEIGHT".to_owned()),
            center_of_gravity_id: context.get_identifier("FQMS_CENTER_OF_GRAVITY_MAC".to_owned()),

            fqms_status_word_id: context.get_identifier("FQMS_STATUS_WORD".to_owned()),
            fqms_status_word: Default::default(),
        }
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        fuel_system: &mut (impl SetFuelLevel + FuelPayload),
        fqdc: &(impl ArincFuelQuantityProvider + ArincFuelPumpStatusProvider),
        cpioms_available: [bool; 4],
    ) {
        // Currently this is excluded from the powered check to support
        // the current "legacy" refuel system implementation.
        // TODO: In the future this should be powered and the refuel panel
        // should be updated only when powered.
        self.refuel_application
            .update(context, fuel_system, &mut self.integrated_refuel_panel);

        self.cpioms_available = cpioms_available;

        self.self_test_finished
            .update(context, cpioms_available.into_iter().any(|a| a));

        if !self.self_test_finished.output() {
            self.reset();
            return;
        }

        self.fuel_pump_running_words = [
            fqdc.get_left_fuel_pump_running_word(),
            fqdc.get_right_fuel_pump_running_word(),
        ];

        let fms_zfw = self.get_fms_data_and_update_status(self.fms_zero_fuel_weights);
        let fms_zfwcg = self.get_fms_data_and_update_status(self.fms_zero_fuel_weight_cgs);

        self.fuel_measuring_application
            .update(fqdc, fms_zfw, fms_zfwcg);
    }

    fn reset(&mut self) {
        self.fuel_measuring_application.reset();
        self.fuel_pump_running_words = Default::default();
        self.fms_zero_fuel_weights = Default::default();
        self.fms_zero_fuel_weight_cgs = Default::default();
        self.fqms_status_word = Default::default();
    }

    #[allow(dead_code)]
    pub(super) fn refuel_application(&mut self) -> &mut RefuelApplication {
        &mut self.refuel_application
    }

    /// Extracts the FMS data by get the first one available.
    /// Simultaniously it is checked that both values agree if multiple values are available.
    fn get_fms_data_and_update_status<T: PartialEq>(
        &mut self,
        fms_values: [Option<T>; 2],
    ) -> Option<T> {
        let mut iter = fms_values.into_iter().flat_map(|x| x.into_iter());

        if let Some(first_value) = iter.next() {
            if let Some(second_value) = iter.next() {
                self.fqms_status_word.set(
                    FQMSDiscreteFlags::FMS_DATA_DISAGREE,
                    first_value != second_value,
                );
            }
            self.fqms_status_word.remove(FQMSDiscreteFlags::FMS_NO_DATA);
            Some(first_value)
        } else {
            self.fqms_status_word.insert(FQMSDiscreteFlags::FMS_NO_DATA);
            None
        }
    }

    fn write_arinc429<T: Default>(
        &self,
        writer: &mut (impl Writer + Write<T>),
        identifier: &VariableIdentifier,
        value: Option<T>,
        is_powered: bool,
    ) {
        let (value, ssm) = if self.self_test_finished.output() && is_powered {
            // If powered, we write the value and normal operation SSM
            value.map_or((Default::default(), SignStatus::NoComputedData), |v| {
                (v, SignStatus::NormalOperation)
            })
        } else {
            (Default::default(), SignStatus::FailureWarning)
        };
        writer.write_arinc429(identifier, value, ssm);
    }

    fn write_arinc429_bitflags(
        &self,
        writer: &mut (impl Writer + Write<u32>),
        identifier: &VariableIdentifier,
        flags: impl Flags<Bits = u32>,
        is_powered: bool,
    ) {
        let value = if self.self_test_finished.output() && is_powered {
            flags.bits() >> 11 // Shift to match ARINC 429 bit positions
        } else {
            0
        };
        writer.write(identifier, value);
    }
}
impl SimulationElement for A380FuelQuantityManagementSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.refuel_application.accept(visitor);
        self.integrated_refuel_panel.accept(visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        for (id, zfw) in self
            .fms_zero_fuel_weight_ids
            .iter()
            .zip(&mut self.fms_zero_fuel_weights)
        {
            *zfw = reader.read_arinc429(id).normal_value();
        }

        for (id, zfwcg) in self
            .fms_zero_fuel_weight_cg_ids
            .iter()
            .zip(&mut self.fms_zero_fuel_weight_cgs)
        {
            *zfwcg = reader.read_arinc429(id).normal_value();
        }
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        // TODO: only CPIOM-F3 and CPIOM-F4 can provide data via ARINC 429
        let is_powered = self.cpioms_available[1..=4].iter().any(|a| *a);
        self.write_arinc429(
            writer,
            &self.total_fuel_onboard_id,
            self.fuel_measuring_application
                .total_fuel_onboard()
                .map(|v| v.get::<kilogram>().resolution(1.)),
            is_powered,
        );
        self.write_arinc429(
            writer,
            &self.total_aircraft_weight_id,
            self.fuel_measuring_application
                .total_aircraft_weight()
                .map(|v| v.get::<kilogram>().resolution(1.)),
            is_powered,
        );
        self.write_arinc429(
            writer,
            &self.center_of_gravity_id,
            self.fuel_measuring_application
                .center_of_gravity()
                .map(|v| v.get::<percent>().resolution(0.1)),
            is_powered,
        );

        // TODO: compare with AGP values
        for fuel_tank in A380FuelTankType::iterator() {
            self.write_arinc429(
                writer,
                &self.fuel_tank_quantities_id[fuel_tank.into_usize()],
                self.fuel_measuring_application
                    .tank_quantity(fuel_tank)
                    .map(|v| v.get::<kilogram>().resolution(1.)),
                is_powered,
            );
        }

        // Forwarded values from FQDC
        for (id, word) in self
            .fuel_pump_running_word_id
            .iter()
            .zip(&self.fuel_pump_running_words)
        {
            self.write_arinc429(writer, id, word.normal_value(), is_powered);
        }

        self.write_arinc429_bitflags(
            writer,
            &self.fqms_status_word_id,
            self.fqms_status_word,
            is_powered,
        );
    }
}
