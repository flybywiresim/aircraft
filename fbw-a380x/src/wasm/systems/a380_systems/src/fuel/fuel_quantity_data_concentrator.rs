use super::{A380FuelPump, FuelLevel, FuelPumpStatus};
use systems::{
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        ElectricalBusType, ElectricalBuses,
    },
    simulation::{InitContext, SimulationElement, SimulatorWriter, VariableIdentifier, Write},
};
use uom::si::f64::*;

pub(super) struct FuelQuantityDataConcentrator {
    powered_by: ElectricalBusType,
    is_powered: bool,

    left_outer_tank_quantity_identifier: VariableIdentifier,
    left_mid_tank_quantity_identifier: VariableIdentifier,
    left_inner_tank_quantity_identifier: VariableIdentifier,
    feed_one_tank_quantity_identifier: VariableIdentifier,
    feed_two_tank_quantity_identifier: VariableIdentifier,
    feed_three_tank_quantity_identifier: VariableIdentifier,
    feed_four_tank_quantity_identifier: VariableIdentifier,
    right_inner_tank_quantity_identifier: VariableIdentifier,
    right_mid_tank_quantity_identifier: VariableIdentifier,
    right_outer_tank_quantity_identifier: VariableIdentifier,
    trim_tank_quantity_identifier: VariableIdentifier,

    left_outer_tank_quantity: Arinc429Word<Mass>,
    left_mid_tank_quantity: Arinc429Word<Mass>,
    left_inner_tank_quantity: Arinc429Word<Mass>,
    feed_one_tank_quantity: Arinc429Word<Mass>,
    feed_two_tank_quantity: Arinc429Word<Mass>,
    feed_three_tank_quantity: Arinc429Word<Mass>,
    feed_four_tank_quantity: Arinc429Word<Mass>,
    right_inner_tank_quantity: Arinc429Word<Mass>,
    right_mid_tank_quantity: Arinc429Word<Mass>,
    right_outer_tank_quantity: Arinc429Word<Mass>,
    trim_tank_quantity: Arinc429Word<Mass>,

    left_fuel_pump_running: Arinc429Word<u32>,
    right_fuel_pump_running: Arinc429Word<u32>,
}
impl FuelQuantityDataConcentrator {
    const LEFT_FUEL_PUMPS: [A380FuelPump; 10] = [
        A380FuelPump::Feed1Main,
        A380FuelPump::Feed1Stby,
        A380FuelPump::Feed2Main,
        A380FuelPump::Feed2Stby,
        A380FuelPump::LeftOuter,
        A380FuelPump::LeftMidFwd,
        A380FuelPump::LeftMidAft,
        A380FuelPump::LeftInnerFwd,
        A380FuelPump::LeftInnerAft,
        A380FuelPump::TrimLeft,
    ];
    const RIGHT_FUEL_PUMPS: [A380FuelPump; 10] = [
        A380FuelPump::Feed3Main,
        A380FuelPump::Feed3Stby,
        A380FuelPump::Feed4Main,
        A380FuelPump::Feed4Stby,
        A380FuelPump::RightOuter,
        A380FuelPump::RightMidFwd,
        A380FuelPump::RightMidAft,
        A380FuelPump::RightInnerFwd,
        A380FuelPump::RightInnerAft,
        A380FuelPump::TrimRight,
    ];
    pub(super) fn new(context: &mut InitContext, id: usize, powered_by: ElectricalBusType) -> Self {
        let arinc_word = Arinc429Word::new(Mass::default(), SignStatus::FailureWarning);
        Self {
            powered_by,
            is_powered: false,

            // Fuel quantities as "calculated" by the AGP and published on an arinc 429 bus
            // These values are also used the FQMS because in the sim there only exists this value
            left_outer_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_LEFT_OUTER_TANK_QUANTITY")),
            left_mid_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_LEFT_MID_TANK_QUANTITY")),
            left_inner_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_LEFT_INNER_TANK_QUANTITY")),
            feed_one_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_FEED_ONE_TANK_QUANTITY")),
            feed_two_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_FEED_TWO_TANK_QUANTITY")),
            feed_three_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_FEED_THREE_TANK_QUANTITY")),
            feed_four_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_FEED_FOUR_TANK_QUANTITY")),
            right_inner_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_RIGHT_INNER_TANK_QUANTITY")),
            right_mid_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_RIGHT_MID_TANK_QUANTITY")),
            right_outer_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_RIGHT_OUTER_TANK_QUANTITY")),
            trim_tank_quantity_identifier: context
                .get_identifier(format!("FQDC_{id}_TRIM_TANK_QUANTITY")),

            left_outer_tank_quantity: arinc_word,
            left_mid_tank_quantity: arinc_word,
            left_inner_tank_quantity: arinc_word,
            feed_one_tank_quantity: arinc_word,
            feed_two_tank_quantity: arinc_word,
            feed_three_tank_quantity: arinc_word,
            feed_four_tank_quantity: arinc_word,
            right_inner_tank_quantity: arinc_word,
            right_mid_tank_quantity: arinc_word,
            right_outer_tank_quantity: arinc_word,
            trim_tank_quantity: arinc_word,

            left_fuel_pump_running: Arinc429Word::new(0, SignStatus::FailureWarning),
            right_fuel_pump_running: Arinc429Word::new(0, SignStatus::FailureWarning),
        }
    }

    pub(super) fn update(&mut self, fuel_levels: &(impl FuelLevel + FuelPumpStatus)) {
        let ssm = if self.is_powered {
            SignStatus::NormalOperation
        } else {
            SignStatus::FailureWarning
        };

        self.left_outer_tank_quantity =
            Arinc429Word::new(fuel_levels.left_outer_tank_quantity(), ssm);
        self.left_mid_tank_quantity = Arinc429Word::new(fuel_levels.left_mid_tank_quantity(), ssm);
        self.left_inner_tank_quantity =
            Arinc429Word::new(fuel_levels.left_inner_tank_quantity(), ssm);
        self.feed_one_tank_quantity = Arinc429Word::new(fuel_levels.feed_one_tank_quantity(), ssm);
        self.feed_two_tank_quantity = Arinc429Word::new(fuel_levels.feed_two_tank_quantity(), ssm);
        self.feed_three_tank_quantity =
            Arinc429Word::new(fuel_levels.feed_three_tank_quantity(), ssm);
        self.feed_four_tank_quantity =
            Arinc429Word::new(fuel_levels.feed_four_tank_quantity(), ssm);
        self.right_inner_tank_quantity =
            Arinc429Word::new(fuel_levels.right_inner_tank_quantity(), ssm);
        self.right_mid_tank_quantity =
            Arinc429Word::new(fuel_levels.right_mid_tank_quantity(), ssm);
        self.right_outer_tank_quantity =
            Arinc429Word::new(fuel_levels.right_outer_tank_quantity(), ssm);
        self.trim_tank_quantity = Arinc429Word::new(fuel_levels.trim_tank_quantity(), ssm);

        self.left_fuel_pump_running =
            Self::update_fuel_pump_state(fuel_levels, ssm, Self::LEFT_FUEL_PUMPS);
        self.right_fuel_pump_running =
            Self::update_fuel_pump_state(fuel_levels, ssm, Self::RIGHT_FUEL_PUMPS);
    }

    pub(super) fn left_outer_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.left_outer_tank_quantity
    }

    pub(super) fn left_mid_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.left_mid_tank_quantity
    }

    pub(super) fn left_inner_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.left_inner_tank_quantity
    }

    pub(super) fn feed_one_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.feed_one_tank_quantity
    }

    pub(super) fn feed_two_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.feed_two_tank_quantity
    }

    pub(super) fn feed_three_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.feed_three_tank_quantity
    }

    pub(super) fn feed_four_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.feed_four_tank_quantity
    }

    pub(super) fn right_inner_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.right_inner_tank_quantity
    }

    pub(super) fn right_mid_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.right_mid_tank_quantity
    }

    pub(super) fn right_outer_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.right_outer_tank_quantity
    }

    pub(super) fn trim_tank_quantity(&self) -> Arinc429Word<Mass> {
        self.trim_tank_quantity
    }

    fn update_fuel_pump_state(
        pump_status: &impl FuelPumpStatus,
        ssm: SignStatus,
        fuel_pumps: impl IntoIterator<Item = A380FuelPump>,
    ) -> Arinc429Word<u32> {
        let mut fuel_pump_running = Arinc429Word::new(0, ssm);

        for (i, pump) in (11..=29).zip(fuel_pumps) {
            fuel_pump_running.set_bit(i, pump_status.is_fuel_pump_running(pump));
        }

        fuel_pump_running
    }
}
impl SimulationElement for FuelQuantityDataConcentrator {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.left_outer_tank_quantity_identifier,
            self.left_outer_tank_quantity,
        );
        writer.write(
            &self.left_mid_tank_quantity_identifier,
            self.left_mid_tank_quantity,
        );
        writer.write(
            &self.left_inner_tank_quantity_identifier,
            self.left_inner_tank_quantity,
        );
        writer.write(
            &self.feed_one_tank_quantity_identifier,
            self.feed_one_tank_quantity,
        );
        writer.write(
            &self.feed_two_tank_quantity_identifier,
            self.feed_two_tank_quantity,
        );
        writer.write(
            &self.feed_three_tank_quantity_identifier,
            self.feed_three_tank_quantity,
        );
        writer.write(
            &self.feed_four_tank_quantity_identifier,
            self.feed_four_tank_quantity,
        );
        writer.write(
            &self.right_inner_tank_quantity_identifier,
            self.right_inner_tank_quantity,
        );
        writer.write(
            &self.right_mid_tank_quantity_identifier,
            self.right_mid_tank_quantity,
        );
        writer.write(
            &self.right_outer_tank_quantity_identifier,
            self.right_outer_tank_quantity,
        );
        writer.write(&self.trim_tank_quantity_identifier, self.trim_tank_quantity);
    }
}
