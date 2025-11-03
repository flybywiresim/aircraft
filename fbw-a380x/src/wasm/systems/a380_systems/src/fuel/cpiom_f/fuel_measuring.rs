use super::FuelQuantityProvider;
use crate::fuel::{
    cpiom_f::{FEED_TANKS, TRIM_TANK, WING_TANKS},
    A380FuelTankType, FuelQuantityDataConcentrator,
};
use enum_map::Enum;
use systems::{
    shared::arinc429::Arinc429Word,
    simulation::{InitContext, Read, SimulatorReader, VariableIdentifier},
};
use uom::si::f64::{Mass, Ratio};

pub(super) struct FuelMeasuringApplication {
    tank_quantity_ids: [VariableIdentifier; A380FuelTankType::LENGTH],
    tank_quantities: [Option<Mass>; A380FuelTankType::LENGTH],

    // Input signals
    zero_fuel_weight_ids: [VariableIdentifier; 2],
    zero_fuel_weight_cg_ids: [VariableIdentifier; 2],

    zero_fuel_weight: Option<Mass>,
    zero_fuel_weight_cg: Option<Ratio>,
    total_fuel_onboard: Option<Mass>,
    total_aircraft_weight: Option<Mass>,
    center_of_gravity: Option<Ratio>,
}
impl FuelMeasuringApplication {
    pub(super) fn new(context: &mut InitContext) -> Self {
        Self {
            tank_quantity_ids: A380FuelTankType::iterator()
                .map(|tank| context.get_identifier(format!("FQMS_{tank}_QUANTITY")))
                .collect::<Vec<_>>()
                .try_into()
                .expect("Expected exactly 11 tank quantity identifiers"),
            tank_quantities: [None; A380FuelTankType::LENGTH],

            zero_fuel_weight_ids: [1, 2]
                .map(|id| context.get_identifier(format!("FM{id}_ZERO_FUEL_WEIGHT"))),
            zero_fuel_weight_cg_ids: [1, 2]
                .map(|id| context.get_identifier(format!("FM{id}_ZERO_FUEL_WEIGHT_CG"))),

            zero_fuel_weight: None,
            zero_fuel_weight_cg: None,
            total_fuel_onboard: None,
            total_aircraft_weight: None,
            center_of_gravity: None,
        }
    }

    pub(super) fn update(&mut self, fqdc: &FuelQuantityDataConcentrator) {
        // Feed tanks
        self.tank_quantities[A380FuelTankType::FeedOne.into_usize()] =
            fqdc.feed_one_tank_quantity().normal_value();
        self.tank_quantities[A380FuelTankType::FeedTwo.into_usize()] =
            fqdc.feed_two_tank_quantity().normal_value();
        self.tank_quantities[A380FuelTankType::FeedThree.into_usize()] =
            fqdc.feed_three_tank_quantity().normal_value();
        self.tank_quantities[A380FuelTankType::FeedFour.into_usize()] =
            fqdc.feed_four_tank_quantity().normal_value();

        // Wing tanks
        (
            self.tank_quantities[A380FuelTankType::LeftOuter.into_usize()],
            self.tank_quantities[A380FuelTankType::RightOuter.into_usize()],
        ) = Self::determine_wing_tank_quantity(
            fqdc.left_outer_tank_quantity(),
            fqdc.right_outer_tank_quantity(),
        );
        (
            self.tank_quantities[A380FuelTankType::LeftMid.into_usize()],
            self.tank_quantities[A380FuelTankType::RightMid.into_usize()],
        ) = Self::determine_wing_tank_quantity(
            fqdc.left_mid_tank_quantity(),
            fqdc.right_mid_tank_quantity(),
        );
        (
            self.tank_quantities[A380FuelTankType::LeftInner.into_usize()],
            self.tank_quantities[A380FuelTankType::RightInner.into_usize()],
        ) = Self::determine_wing_tank_quantity(
            fqdc.left_inner_tank_quantity(),
            fqdc.right_inner_tank_quantity(),
        );

        // In case of FQI failure we consider the trim tank to be empty
        self.tank_quantities[A380FuelTankType::Trim.into_usize()] =
            fqdc.trim_tank_quantity().normal_value();

        self.update_total_fuel_onboard();
    }

    pub(super) fn unavailable_tank_quantity_count(&self) -> usize {
        WING_TANKS
            .iter()
            .chain(&[TRIM_TANK])
            .map(|tank| self.tank_quantities[tank.into_usize()])
            .filter(|q| q.is_none())
            .count()
    }

    pub(super) fn all_feed_tanks_valid(&self) -> bool {
        FEED_TANKS
            .iter()
            .all(|tank| self.tank_quantities[tank.into_usize()].is_some())
    }

    pub(super) fn total_fuel_onboard(&self) -> Option<Mass> {
        self.total_fuel_onboard
    }

    pub(super) fn total_aircraft_weight(&self) -> Option<Mass> {
        // TODO: it normally takes around 5 seconds to calculate
        self.zero_fuel_weight
            .zip(self.total_fuel_onboard)
            .map(|(zfw, fob)| zfw + fob)
    }

    pub(super) fn center_of_gravity(&self) -> Option<Ratio> {
        // TODO: calculate actual CG
        // TODO: it normally takes around 5 seconds to calculate
        self.zero_fuel_weight_cg
    }

    fn update_total_fuel_onboard(&mut self) {
        // TODO: it takes some time for the calculation of the values
        self.total_fuel_onboard = self
            .tank_quantities
            .iter()
            .filter_map(|q| *q)
            .reduce(|a, b| a + b);
    }

    /// Determines the fuel quantity of the wing tanks even in case of a FQI failure.
    /// In case of FQI failure we consider the tank to have the same fuel quantity
    /// as the opposite tank
    fn determine_wing_tank_quantity(
        left_tank: Arinc429Word<Mass>,
        right_tank: Arinc429Word<Mass>,
    ) -> (Option<Mass>, Option<Mass>) {
        (
            left_tank.normal_value().or(right_tank.normal_value()),
            right_tank.normal_value().or(left_tank.normal_value()),
        )
    }

    pub(super) fn read_variables(&mut self, reader: &mut SimulatorReader) {
        self.zero_fuel_weight = self
            .zero_fuel_weight_ids
            .iter()
            .find_map(|id| reader.read_arinc429(id).normal_value());
        self.zero_fuel_weight_cg = self
            .zero_fuel_weight_cg_ids
            .iter()
            .find_map(|id| reader.read_arinc429(id).normal_value());
    }
}
impl FuelQuantityProvider for FuelMeasuringApplication {
    fn get_tank_quantity(&self, tank: A380FuelTankType) -> Mass {
        self.tank_quantities[tank.into_usize()].unwrap_or_default()
    }
}
