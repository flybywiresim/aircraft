use super::{
    discrete_words::{pack_fuel_pump_words, pack_fuel_valve_words},
    FuelLevel, FuelPumpStatus, FuelValveStatus,
};
use crate::fuel::{
    A380FuelTankType, ArincFuelPumpStatusProvider, ArincFuelQuantityProvider,
    ArincFuelValveStatusProvider,
};
use enum_map::Enum;
use systems::{
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        ElectricalBusType, ElectricalBuses,
    },
    simulation::{InitContext, SimulationElement, SimulatorWriter, VariableIdentifier, Write},
};
use uom::{
    si::{f64::*, mass::kilogram},
    ConstZero,
};

pub(super) struct FuelQuantityDataConcentrator {
    powered_by: ElectricalBusType,
    is_powered: bool,

    tank_quantity_identifiers: [VariableIdentifier; A380FuelTankType::LENGTH],
    tank_quantities: [Arinc429Word<Mass>; A380FuelTankType::LENGTH],

    left_fuel_pump_running: Arinc429Word<u32>,
    right_fuel_pump_running: Arinc429Word<u32>,

    fuel_valve_open_words: [Arinc429Word<u32>; 3],
    fuel_valve_closed_words: [Arinc429Word<u32>; 3],
}
impl FuelQuantityDataConcentrator {
    pub(super) fn new(context: &mut InitContext, id: usize, powered_by: ElectricalBusType) -> Self {
        Self {
            powered_by,
            is_powered: false,

            // Fuel quantities as "calculated" by the AGP and published on an arinc 429 bus
            // These values are also used the FQMS because in the sim there only exists this value
            tank_quantity_identifiers: A380FuelTankType::iterator()
                .map(|tank_type| context.get_identifier(format!("FQDC_{id}_{tank_type}_QUANTITY")))
                .collect::<Vec<_>>()
                .try_into()
                .expect("Failed to create fuel quantity identifiers array"),
            tank_quantities: [Arinc429Word::new(Mass::ZERO, SignStatus::FailureWarning);
                A380FuelTankType::LENGTH],

            left_fuel_pump_running: Arinc429Word::new(0, SignStatus::FailureWarning),
            right_fuel_pump_running: Arinc429Word::new(0, SignStatus::FailureWarning),

            fuel_valve_open_words: [Arinc429Word::new(0, SignStatus::FailureWarning); 3],
            fuel_valve_closed_words: [Arinc429Word::new(0, SignStatus::FailureWarning); 3],
        }
    }

    pub(super) fn update(
        &mut self,
        fuel_status: &(impl FuelLevel + FuelPumpStatus + FuelValveStatus),
    ) {
        if !self.is_powered {
            self.tank_quantities = Default::default();
            self.left_fuel_pump_running = Arinc429Word::default();
            self.right_fuel_pump_running = Arinc429Word::default();
            self.fuel_valve_open_words = Default::default();
            self.fuel_valve_closed_words = Default::default();
            return;
        }

        let ssm = SignStatus::NormalOperation;

        self.tank_quantities[A380FuelTankType::LeftOuter.into_usize()] =
            Arinc429Word::new(fuel_status.left_outer_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::LeftMid.into_usize()] =
            Arinc429Word::new(fuel_status.left_mid_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::LeftInner.into_usize()] =
            Arinc429Word::new(fuel_status.left_inner_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::FeedOne.into_usize()] =
            Arinc429Word::new(fuel_status.feed_one_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::FeedTwo.into_usize()] =
            Arinc429Word::new(fuel_status.feed_two_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::FeedThree.into_usize()] =
            Arinc429Word::new(fuel_status.feed_three_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::FeedFour.into_usize()] =
            Arinc429Word::new(fuel_status.feed_four_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::RightInner.into_usize()] =
            Arinc429Word::new(fuel_status.right_inner_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::RightMid.into_usize()] =
            Arinc429Word::new(fuel_status.right_mid_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::RightOuter.into_usize()] =
            Arinc429Word::new(fuel_status.right_outer_tank_quantity(), ssm);
        self.tank_quantities[A380FuelTankType::Trim.into_usize()] =
            Arinc429Word::new(fuel_status.trim_tank_quantity(), ssm);

        let [left_fuel_pump_running, right_fuel_pump_running] =
            pack_fuel_pump_words(ssm, |pump| fuel_status.is_fuel_pump_running(pump));
        self.left_fuel_pump_running = left_fuel_pump_running;
        self.right_fuel_pump_running = right_fuel_pump_running;

        self.fuel_valve_open_words =
            pack_fuel_valve_words(ssm, |valve| fuel_status.is_fuel_valve_open(valve));
        self.fuel_valve_closed_words =
            pack_fuel_valve_words(ssm, |valve| fuel_status.is_fuel_valve_closed(valve));
    }

    pub(super) fn is_healthy(&self) -> bool {
        self.is_powered
    }
}
impl ArincFuelQuantityProvider for FuelQuantityDataConcentrator {
    fn get_tank_quantity(&self, tank: A380FuelTankType) -> Arinc429Word<Mass> {
        self.tank_quantities[tank.into_usize()]
    }
}
impl ArincFuelPumpStatusProvider for FuelQuantityDataConcentrator {
    fn get_left_fuel_pump_running_word(&self) -> Arinc429Word<u32> {
        self.left_fuel_pump_running
    }

    fn get_right_fuel_pump_running_word(&self) -> Arinc429Word<u32> {
        self.right_fuel_pump_running
    }
}
impl ArincFuelValveStatusProvider for FuelQuantityDataConcentrator {
    fn get_fuel_valve_open_words(&self) -> [Arinc429Word<u32>; 3] {
        self.fuel_valve_open_words
    }

    fn get_fuel_valve_closed_words(&self) -> [Arinc429Word<u32>; 3] {
        self.fuel_valve_closed_words
    }
}
impl SimulationElement for FuelQuantityDataConcentrator {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        for (identifier, quantity) in self
            .tank_quantity_identifiers
            .iter()
            .zip(self.tank_quantities)
        {
            writer.write_arinc429(
                identifier,
                quantity.value().get::<kilogram>(),
                quantity.ssm(),
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fuel::{A380FuelPump, A380FuelValve};
    use enum_map::Enum;
    use rstest::{fixture, rstest};
    use systems::simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, SimulationElementVisitor,
    };

    #[rstest]
    fn fuel_quantity_data_concentrator_writes_simvars(test_bed: FQDCTestBed) {
        for var_name in [
            "FQDC_0_FEED_1_TANK_QUANTITY",
            "FQDC_0_FEED_2_TANK_QUANTITY",
            "FQDC_0_FEED_3_TANK_QUANTITY",
            "FQDC_0_FEED_4_TANK_QUANTITY",
            "FQDC_0_LEFT_OUTER_TANK_QUANTITY",
            "FQDC_0_RIGHT_OUTER_TANK_QUANTITY",
            "FQDC_0_LEFT_MID_TANK_QUANTITY",
            "FQDC_0_RIGHT_MID_TANK_QUANTITY",
            "FQDC_0_LEFT_INNER_TANK_QUANTITY",
            "FQDC_0_RIGHT_INNER_TANK_QUANTITY",
            "FQDC_0_TRIM_TANK_QUANTITY",
        ] {
            assert!(
                test_bed.contains_variable_with_name(var_name),
                "Expected variable {var_name} to be present in the test bed",
            );
        }
    }

    #[rstest]
    fn fuel_quantity_data_concentrator_packs_fuel_valve_status_words(mut test_bed: FQDCTestBed) {
        let mut fuel = TestFuelStatus::default();
        fuel.set_valve_open(A380FuelValve::Engine1LowPressureValve);
        fuel.set_valve_open(A380FuelValve::LeftInnerAftTransferValve);
        fuel.set_valve_open(A380FuelValve::LeftMidAftTransferValve);
        fuel.set_valve_open(A380FuelValve::LeftJettisonNozzleValve);
        fuel.set_valve_open(A380FuelValve::TrimTankInletValve2);
        fuel.set_valve_closed(A380FuelValve::Engine2LowPressureValve);
        fuel.set_valve_closed(A380FuelValve::RightOuterAftTransferValve);

        test_bed.set_fqdc_powered(true);
        test_bed.update_fqdc(&fuel);

        let open_words = test_bed.fuel_valve_open_words();
        let closed_words = test_bed.fuel_valve_closed_words();

        assert!(open_words.iter().all(Arinc429Word::is_normal_operation));
        assert!(closed_words.iter().all(Arinc429Word::is_normal_operation));

        assert!(open_words[0].get_bit(11));
        assert!(open_words[0].get_bit(29));
        assert!(open_words[1].get_bit(11));
        assert!(open_words[1].get_bit(17));
        assert!(open_words[2].get_bit(12));

        assert!(closed_words[0].get_bit(12));
        assert!(closed_words[1].get_bit(15));

        assert!(!open_words[1].get_bit(19));
        assert!(!open_words[2].get_bit(11));
        assert!(!open_words[2].get_bit(13));
        assert!(!closed_words[1].get_bit(19));
    }

    #[rstest]
    fn unpowered_fuel_quantity_data_concentrator_resets_fuel_valve_status_words(
        mut test_bed: FQDCTestBed,
    ) {
        let mut fuel = TestFuelStatus::default();
        fuel.set_valve_open(A380FuelValve::Engine1LowPressureValve);
        fuel.set_valve_closed(A380FuelValve::Engine2LowPressureValve);

        test_bed.set_fqdc_powered(false);
        test_bed.update_fqdc(&fuel);

        for word in test_bed
            .fuel_valve_open_words()
            .into_iter()
            .chain(test_bed.fuel_valve_closed_words())
        {
            assert_eq!(word.value(), 0);
            assert!(word.is_failure_warning());
        }
    }

    #[fixture]
    fn test_bed() -> FQDCTestBed {
        FQDCTestBed(SimulationTestBed::new(TestAircraft::new))
    }

    struct FQDCTestBed(SimulationTestBed<TestAircraft>);
    impl FQDCTestBed {
        fn set_fqdc_powered(&mut self, is_powered: bool) {
            self.command(|aircraft| aircraft.fqdc.is_powered = is_powered);
        }

        fn update_fqdc(&mut self, fuel: &TestFuelStatus) {
            self.command(|aircraft| aircraft.fqdc.update(fuel));
        }

        fn fuel_valve_open_words(&self) -> [Arinc429Word<u32>; 3] {
            self.query(|aircraft| aircraft.fqdc.get_fuel_valve_open_words())
        }

        fn fuel_valve_closed_words(&self) -> [Arinc429Word<u32>; 3] {
            self.query(|aircraft| aircraft.fqdc.get_fuel_valve_closed_words())
        }
    }
    impl TestBed for FQDCTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<Self::Aircraft> {
            &self.0
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<Self::Aircraft> {
            &mut self.0
        }
    }

    struct TestFuelStatus {
        fuel_valve_open: [bool; A380FuelValve::LENGTH],
        fuel_valve_closed: [bool; A380FuelValve::LENGTH],
    }
    impl Default for TestFuelStatus {
        fn default() -> Self {
            Self {
                fuel_valve_open: [false; A380FuelValve::LENGTH],
                fuel_valve_closed: [false; A380FuelValve::LENGTH],
            }
        }
    }
    impl TestFuelStatus {
        fn set_valve_open(&mut self, valve: A380FuelValve) {
            self.fuel_valve_open[valve.into_usize()] = true;
        }

        fn set_valve_closed(&mut self, valve: A380FuelValve) {
            self.fuel_valve_closed[valve.into_usize()] = true;
        }
    }
    impl FuelLevel for TestFuelStatus {
        fn left_outer_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn feed_one_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn left_mid_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn left_inner_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn feed_two_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn feed_three_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn right_inner_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn right_mid_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn feed_four_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn right_outer_tank_quantity(&self) -> Mass {
            Mass::default()
        }

        fn trim_tank_quantity(&self) -> Mass {
            Mass::default()
        }
    }
    impl FuelPumpStatus for TestFuelStatus {
        fn is_fuel_pump_running(&self, _: A380FuelPump) -> bool {
            false
        }
    }
    impl FuelValveStatus for TestFuelStatus {
        fn is_fuel_valve_open(&self, valve: A380FuelValve) -> bool {
            self.fuel_valve_open[valve.into_usize()]
        }

        fn is_fuel_valve_closed(&self, valve: A380FuelValve) -> bool {
            self.fuel_valve_closed[valve.into_usize()]
        }
    }

    struct TestAircraft {
        fqdc: FuelQuantityDataConcentrator,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            let fqdc = FuelQuantityDataConcentrator::new(
                context,
                0,
                ElectricalBusType::DirectCurrentEssential,
            );
            Self { fqdc }
        }
    }
    impl Aircraft for TestAircraft {}
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.fqdc.accept(visitor);
        }
    }
}
