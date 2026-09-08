use crate::{
    airframe::A380Airframe,
    avionics_data_communication_network::A380AvionicsDataCommunicationNetwork,
    fuel::{A380Fuel, A380FuelPump, A380FuelTankType, A380FuelValve},
};
use enum_map::Enum;
use std::{collections::HashMap, time::Duration};
use systems::{
    electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
    fuel::{FuelPayload, RefuelRate, FUEL_GALLONS_TO_KG},
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        ElectricalBusType, LgciuWeightOnWheels, PotentialOrigin,
    },
    simulation::{
        test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
    },
};
use uom::si::{
    f64::{Mass, Ratio},
    mass::{kilogram, pound},
    ratio::percent,
};

struct TestLgciu {
    compressed: bool,
}
impl TestLgciu {
    fn new(compressed: bool) -> Self {
        Self { compressed }
    }
}
impl LgciuWeightOnWheels for TestLgciu {
    fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
        self.compressed
    }
    fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
        !self.compressed
    }

    fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
        self.compressed
    }
    fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
        !self.compressed
    }

    fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
        self.compressed
    }
    fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
        !self.compressed
    }

    fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
        self.compressed
    }
    fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
        !self.compressed
    }
}

pub(super) struct FuelTestAircraft {
    acdn: A380AvionicsDataCommunicationNetwork,
    fuel: A380Fuel,
    fuel_electrical_power_source: TestElectricitySource,
    fuel_electrical_buses: [ElectricalBus; 18],
    fqms_powered: bool,
    lgcius: [TestLgciu; 2],
}

impl FuelTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            acdn: A380AvionicsDataCommunicationNetwork::new(context),
            fuel: A380Fuel::new(context),
            fuel_electrical_power_source: TestElectricitySource::powered(
                context,
                PotentialOrigin::External,
            ),
            fuel_electrical_buses: [
                ElectricalBusType::AlternatingCurrent(1),
                ElectricalBusType::AlternatingCurrent(2),
                ElectricalBusType::AlternatingCurrent(3),
                ElectricalBusType::AlternatingCurrent(4),
                ElectricalBusType::AlternatingCurrentEssential,
                ElectricalBusType::DirectCurrent(1),
                ElectricalBusType::DirectCurrent(2),
                ElectricalBusType::DirectCurrentEssential,
                ElectricalBusType::DirectCurrentNamed("108PH"),
                ElectricalBusType::DirectCurrentNamed("309PP"),
                ElectricalBusType::DirectCurrentNamed("501PP"),
                ElectricalBusType::DirectCurrentNamed("502PP"),
                ElectricalBusType::DirectCurrentNamed("503PP"),
                ElectricalBusType::Sub("501PP"),
                ElectricalBusType::Sub("502PP"),
                ElectricalBusType::Sub("503PP"),
                ElectricalBusType::DirectCurrentHot(1),
                ElectricalBusType::DirectCurrentHot(2),
            ]
            .map(|bus_type| ElectricalBus::new(context, bus_type)),
            fqms_powered: false,
            lgcius: [TestLgciu::new(false), TestLgciu::new(false)],
        }
    }

    fn set_on_ground(&mut self, on_ground: bool) {
        self.lgcius = [TestLgciu::new(on_ground), TestLgciu::new(on_ground)];
    }

    fn set_fqms_powered(&mut self, powered: bool) {
        self.fqms_powered = powered;
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.fuel.fore_aft_center_of_gravity()
    }

    fn tank_mass(&self, tank: usize) -> Mass {
        self.fuel.tank_mass(tank)
    }
}

impl Aircraft for FuelTestAircraft {
    fn update_before_power_distribution(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
    ) {
        if self.fqms_powered {
            electricity.supplied_by(&self.fuel_electrical_power_source);
            for bus in &self.fuel_electrical_buses {
                electricity.flow(&self.fuel_electrical_power_source, bus);
            }
        }

        self.acdn.update();
        self.fuel.update(
            context,
            &self.acdn,
            A380Airframe::get_loadsheet(),
            [&self.lgcius[0], &self.lgcius[1]],
        );
    }
}

impl SimulationElement for FuelTestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for bus in &mut self.fuel_electrical_buses {
            bus.accept(visitor);
        }
        self.acdn.accept(visitor);
        self.fuel.accept(visitor);

        visitor.visit(self);
    }
}

pub(super) struct FuelTestBed {
    test_bed: SimulationTestBed<FuelTestAircraft>,
}

impl FuelTestBed {
    fn new() -> Self {
        Self {
            test_bed: SimulationTestBed::new(FuelTestAircraft::new),
        }
    }

    pub(super) fn and_run(mut self) -> Self {
        self.run();
        self
    }

    pub(super) fn and_stabilize(mut self) -> Self {
        self.test_bed.run_multiple_frames(Duration::from_mins(5));
        self
    }

    pub(super) fn run_multiple_frames(mut self, duration: Duration) -> Self {
        self.test_bed.run_multiple_frames(duration);
        self
    }

    pub(super) fn with_fqms_powered(mut self) -> Self {
        self.command(|aircraft| aircraft.set_fqms_powered(true));
        self
    }

    pub(super) fn with_on_ground(mut self, on_ground: bool) -> Self {
        self.command(|aircraft| aircraft.set_on_ground(on_ground));
        self
    }

    pub(super) fn and_run_past_fqms_self_test(mut self) -> Self {
        self.run_with_delta(Duration::from_secs(1));
        self.run_with_delta(Duration::from_secs(31));
        self
    }

    pub(super) fn fuel_low(mut self) -> Self {
        for tank in A380FuelTankType::iterator() {
            self.set_tank_quantity_kg(tank, 300.);
        }
        self
    }

    pub(super) fn fuel_high(mut self) -> Self {
        for (tank, quantity_kg) in [
            (A380FuelTankType::LeftOuter, 1500.),
            (A380FuelTankType::FeedOne, 1500.),
            (A380FuelTankType::LeftMid, 1500.),
            (A380FuelTankType::LeftInner, 10000.),
            (A380FuelTankType::FeedTwo, 1500.),
            (A380FuelTankType::FeedThree, 1500.),
            (A380FuelTankType::RightInner, 10000.),
            (A380FuelTankType::RightMid, 1500.),
            (A380FuelTankType::FeedFour, 1500.),
            (A380FuelTankType::RightOuter, 1500.),
            (A380FuelTankType::Trim, 1500.),
        ] {
            self.set_tank_quantity_kg(tank, quantity_kg);
        }
        self
    }

    pub(super) fn desired_fuel_min(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 0.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    pub(super) fn desired_fuel_50000(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 50000.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    pub(super) fn desired_fuel_100000(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 100000.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    pub(super) fn desired_fuel_200000(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 200000.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    pub(super) fn desired_fuel_250000(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 250000.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    pub(super) fn desired_fuel_max(mut self) -> Self {
        self.write_by_name("FUEL_DESIRED", 259755.);
        self.write_by_name("AIRFRAME_ZFW_DESIRED", 300000.);
        self.write_by_name("AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED", 36.5);
        self
    }

    pub(super) fn trigger_instant_refuel(mut self) -> Self {
        self.write_by_name("EFB_REFUEL_RATE_SETTING", RefuelRate::Instant);
        self.write_by_name("REFUEL_STARTED_BY_USR", true);
        self
    }

    pub(super) fn trigger_fast_refuel(mut self) -> Self {
        self.write_by_name("EFB_REFUEL_RATE_SETTING", RefuelRate::Fast);
        self.write_by_name("REFUEL_STARTED_BY_USR", true);
        self
    }

    pub(super) fn trigger_real_refuel(mut self) -> Self {
        self.write_by_name("EFB_REFUEL_RATE_SETTING", RefuelRate::Real);
        self.write_by_name("REFUEL_STARTED_BY_USR", true);
        self
    }

    pub(super) fn refuel_status(&mut self) -> bool {
        self.read_by_name("REFUEL_STARTED_BY_USR")
    }

    pub(super) fn fore_aft_center_of_gravity(&self) -> f64 {
        self.query(|a: &FuelTestAircraft| a.fore_aft_center_of_gravity())
    }

    pub(super) fn tank_mass(&self, tank: usize) -> Mass {
        self.query(|a: &FuelTestAircraft| a.tank_mass(tank))
    }

    pub(super) fn with_all_tank_quantities_pounds(mut self, quantity_lb: f64) -> Self {
        for tank in A380FuelTankType::iterator() {
            self.set_tank_quantity_pounds(tank, quantity_lb);
        }
        self
    }

    pub(super) fn with_tank_quantity_pounds(
        mut self,
        tank: A380FuelTankType,
        quantity_lb: f64,
    ) -> Self {
        self.set_tank_quantity_pounds(tank, quantity_lb);
        self
    }

    pub(super) fn with_tank_quantity(mut self, tank: A380FuelTankType, quantity: Mass) -> Self {
        self.set_tank_quantity_pounds(tank, quantity.get::<pound>());
        self
    }

    pub(super) fn with_remaining_flight_time(mut self, remaining_time: Duration) -> Self {
        for fm in [1, 2] {
            self.write_arinc429_by_name(
                &format!("FM{fm}_REMAINING_FLIGHT_TIME"),
                remaining_time,
                SignStatus::NormalOperation,
            );
        }
        self
    }

    pub(super) fn with_fms_zero_fuel_weight_and_cg(
        mut self,
        zero_fuel_weight_kg: f64,
        zero_fuel_weight_cg_percent: f64,
    ) -> Self {
        for fm in [1, 2] {
            self.write_arinc429_by_name(
                &format!("FM{fm}_ZERO_FUEL_WEIGHT"),
                zero_fuel_weight_kg,
                SignStatus::NormalOperation,
            );
            self.write_arinc429_by_name(
                &format!("FM{fm}_ZERO_FUEL_WEIGHT_CG"),
                Ratio::new::<percent>(zero_fuel_weight_cg_percent),
                SignStatus::NormalOperation,
            );
        }
        self
    }

    pub(super) fn assert_fqms_pump_targeted(&mut self, pump: A380FuelPump) {
        let (word_name, bit) = pump_target_word_and_bit(pump);
        let command_name = pump_command_name(pump);
        let word: Arinc429Word<u32> = self.read_arinc429_by_name(word_name);
        assert!(
            word.is_normal_operation(),
            "{word_name} should be normal operation"
        );
        assert!(
            word.get_bit(bit),
            "expected fuel pump target bit {bit} in {word_name}"
        );
        let commanded: bool = self.read_by_name(&command_name);
        assert!(commanded, "{command_name} should be true");
    }

    pub(super) fn assert_fqms_pump_not_targeted(&mut self, pump: A380FuelPump) {
        let (word_name, bit) = pump_target_word_and_bit(pump);
        let command_name = pump_command_name(pump);
        let word: Arinc429Word<u32> = self.read_arinc429_by_name(word_name);
        assert!(
            !word.get_bit(bit),
            "expected fuel pump target bit {bit} to be false in {word_name}"
        );
        let commanded: bool = self.read_by_name(&command_name);
        assert!(!commanded, "{command_name} should be false");
    }

    pub(super) fn assert_fqms_valve_targeted(&mut self, valve: A380FuelValve) {
        let (word_name, bit) = valve_target_word_and_bit(valve);
        let command_name = valve_command_name(valve);
        let word: Arinc429Word<u32> = self.read_arinc429_by_name(&word_name);
        assert!(
            word.is_normal_operation(),
            "{word_name} should be normal operation"
        );
        assert!(
            word.get_bit(bit),
            "expected fuel valve target bit {bit} in {word_name}"
        );
        let commanded: bool = self.read_by_name(&command_name);
        assert!(commanded, "{command_name} should be true");
    }

    pub(super) fn assert_fqms_valve_not_targeted(&mut self, valve: A380FuelValve) {
        let (word_name, bit) = valve_target_word_and_bit(valve);
        let command_name = valve_command_name(valve);
        let word: Arinc429Word<u32> = self.read_arinc429_by_name(&word_name);
        assert!(
            !word.get_bit(bit),
            "expected fuel valve target bit {bit} to be false in {word_name}"
        );
        let commanded: bool = self.read_by_name(&command_name);
        assert!(!commanded, "{command_name} should be false");
    }

    fn set_tank_quantity_kg(&mut self, tank: A380FuelTankType, quantity_kg: f64) {
        self.write_by_name(
            &format!("FUEL_TANK_QUANTITY_{}", tank.into_usize() + 1),
            quantity_kg / FUEL_GALLONS_TO_KG,
        );
    }

    fn set_tank_quantity_pounds(&mut self, tank: A380FuelTankType, quantity_lb: f64) {
        self.set_tank_quantity_kg(tank, Mass::new::<pound>(quantity_lb).get::<kilogram>());
    }
}

impl TestBed for FuelTestBed {
    type Aircraft = FuelTestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<FuelTestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<FuelTestAircraft> {
        &mut self.test_bed
    }
}

pub(super) fn test_bed() -> FuelTestBed {
    FuelTestBed::new()
}

pub(super) fn test_bed_with() -> FuelTestBed {
    test_bed()
}

pub(super) fn assert_fuel_quantity(
    test_bed: &FuelTestBed,
    expected_quantities: HashMap<A380FuelTankType, Mass>,
) {
    for tank in A380FuelTankType::iterator() {
        assert_eq!(
            test_bed.tank_mass(tank as usize).get::<kilogram>().round(),
            (*expected_quantities.get(&tank).unwrap_or(&Mass::default()))
                .get::<kilogram>()
                .round(),
            "Actual Mass of {:?} was {:?}",
            tank,
            test_bed.tank_mass(tank as usize).get::<kilogram>(),
        )
    }
}

pub(super) fn assert_fuel_quantity_0(test_bed: &FuelTestBed) {
    let expected_quantities = HashMap::new();
    assert_fuel_quantity(test_bed, expected_quantities);
}

pub(super) fn assert_fuel_quantity_50000(test_bed: &FuelTestBed) {
    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::Trim, Mass::new::<kilogram>(3000.));
    expected_quantities.insert(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::RightOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::LeftInner, Mass::new::<kilogram>(5500.));
    expected_quantities.insert(A380FuelTankType::RightInner, Mass::new::<kilogram>(5500.));
    expected_quantities.insert(A380FuelTankType::FeedOne, Mass::new::<kilogram>(7000.));
    expected_quantities.insert(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(7000.));
    expected_quantities.insert(A380FuelTankType::FeedThree, Mass::new::<kilogram>(7000.));
    expected_quantities.insert(A380FuelTankType::FeedFour, Mass::new::<kilogram>(7000.));
    assert_fuel_quantity(test_bed, expected_quantities);
}

pub(super) fn assert_fuel_quantity_100000(test_bed: &FuelTestBed) {
    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::Trim, Mass::new::<kilogram>(8500.));
    expected_quantities.insert(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::RightOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::LeftInner, Mass::new::<kilogram>(5500.));
    expected_quantities.insert(A380FuelTankType::RightInner, Mass::new::<kilogram>(5500.));
    expected_quantities.insert(
        A380FuelTankType::FeedOne,
        Mass::new::<kilogram>(7000. + 44500. * 20558. / 84788.),
    );
    expected_quantities.insert(
        A380FuelTankType::FeedTwo,
        Mass::new::<kilogram>(7000. + 44500. * 21836. / 84788.),
    );
    expected_quantities.insert(
        A380FuelTankType::FeedThree,
        Mass::new::<kilogram>(7000. + 44500. * 21836. / 84788.),
    );
    expected_quantities.insert(
        A380FuelTankType::FeedFour,
        Mass::new::<kilogram>(7000. + 44500. * 20558. / 84788.),
    );

    assert_fuel_quantity(test_bed, expected_quantities);
}

pub(super) fn assert_fuel_quantity_200000(test_bed: &FuelTestBed) {
    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::Trim, Mass::new::<kilogram>(13500.));
    expected_quantities.insert(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::RightOuter, Mass::new::<kilogram>(4000.));
    expected_quantities.insert(A380FuelTankType::LeftMid, Mass::new::<kilogram>(27127.));
    expected_quantities.insert(A380FuelTankType::RightMid, Mass::new::<kilogram>(27127.));
    expected_quantities.insert(A380FuelTankType::LeftInner, Mass::new::<kilogram>(19729.));
    expected_quantities.insert(A380FuelTankType::RightInner, Mass::new::<kilogram>(19729.));
    expected_quantities.insert(A380FuelTankType::FeedOne, Mass::new::<kilogram>(20558.));
    expected_quantities.insert(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(21836.));
    expected_quantities.insert(A380FuelTankType::FeedThree, Mass::new::<kilogram>(21836.));
    expected_quantities.insert(A380FuelTankType::FeedFour, Mass::new::<kilogram>(20558.));

    assert_fuel_quantity(test_bed, expected_quantities);
}

pub(super) fn assert_fuel_quantity_250000(test_bed: &FuelTestBed) {
    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::Trim, Mass::new::<kilogram>(14500.));
    expected_quantities.insert(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(8121.0));
    expected_quantities.insert(A380FuelTankType::RightOuter, Mass::new::<kilogram>(8121.0));
    expected_quantities.insert(A380FuelTankType::LeftMid, Mass::new::<kilogram>(28636.3));
    expected_quantities.insert(A380FuelTankType::RightMid, Mass::new::<kilogram>(28636.3));
    expected_quantities.insert(A380FuelTankType::LeftInner, Mass::new::<kilogram>(36240.0));
    expected_quantities.insert(A380FuelTankType::RightInner, Mass::new::<kilogram>(36240.0));
    expected_quantities.insert(A380FuelTankType::FeedOne, Mass::new::<kilogram>(21701.8));
    expected_quantities.insert(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(23050.9));
    expected_quantities.insert(A380FuelTankType::FeedThree, Mass::new::<kilogram>(23050.9));
    expected_quantities.insert(A380FuelTankType::FeedFour, Mass::new::<kilogram>(21701.8));

    assert_fuel_quantity(test_bed, expected_quantities);
}

pub(super) fn assert_fuel_quantity_max(test_bed: &FuelTestBed) {
    let mut expected_quantities = HashMap::new();
    expected_quantities.insert(A380FuelTankType::Trim, Mass::new::<kilogram>(19000.));
    expected_quantities.insert(A380FuelTankType::LeftOuter, Mass::new::<kilogram>(8302.2));
    expected_quantities.insert(A380FuelTankType::RightOuter, Mass::new::<kilogram>(8302.2));
    expected_quantities.insert(A380FuelTankType::LeftMid, Mass::new::<kilogram>(29275.3));
    expected_quantities.insert(A380FuelTankType::RightMid, Mass::new::<kilogram>(29275.3));
    expected_quantities.insert(A380FuelTankType::LeftInner, Mass::new::<kilogram>(37048.7));
    expected_quantities.insert(A380FuelTankType::RightInner, Mass::new::<kilogram>(37048.7));
    expected_quantities.insert(A380FuelTankType::FeedOne, Mass::new::<kilogram>(22186.1));
    expected_quantities.insert(A380FuelTankType::FeedTwo, Mass::new::<kilogram>(23565.2));
    expected_quantities.insert(A380FuelTankType::FeedThree, Mass::new::<kilogram>(23565.2));
    expected_quantities.insert(A380FuelTankType::FeedFour, Mass::new::<kilogram>(22186.1));

    assert_fuel_quantity(test_bed, expected_quantities);
}

fn pump_target_word_and_bit(pump: A380FuelPump) -> (&'static str, u8) {
    match pump {
        A380FuelPump::Feed1Main => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 11),
        A380FuelPump::Feed1Stby => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 12),
        A380FuelPump::Feed2Main => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 13),
        A380FuelPump::Feed2Stby => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 14),
        A380FuelPump::LeftOuter => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 15),
        A380FuelPump::LeftMidFwd => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 16),
        A380FuelPump::LeftMidAft => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 17),
        A380FuelPump::LeftInnerFwd => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 18),
        A380FuelPump::LeftInnerAft => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 19),
        A380FuelPump::TrimLeft => ("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD", 20),
        A380FuelPump::Feed3Main => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 11),
        A380FuelPump::Feed3Stby => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 12),
        A380FuelPump::Feed4Main => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 13),
        A380FuelPump::Feed4Stby => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 14),
        A380FuelPump::RightOuter => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 15),
        A380FuelPump::RightMidFwd => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 16),
        A380FuelPump::RightMidAft => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 17),
        A380FuelPump::RightInnerFwd => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 18),
        A380FuelPump::RightInnerAft => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 19),
        A380FuelPump::TrimRight => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 20),
        A380FuelPump::Apu => ("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD", 21),
    }
}

fn pump_command_name(pump: A380FuelPump) -> String {
    let id = match pump {
        A380FuelPump::Feed1Main => 1,
        A380FuelPump::Feed1Stby => 2,
        A380FuelPump::Feed2Main => 3,
        A380FuelPump::Feed2Stby => 4,
        A380FuelPump::Feed3Main => 5,
        A380FuelPump::Feed3Stby => 6,
        A380FuelPump::Feed4Main => 7,
        A380FuelPump::Feed4Stby => 8,
        A380FuelPump::LeftOuter => 9,
        A380FuelPump::LeftMidFwd => 10,
        A380FuelPump::LeftMidAft => 11,
        A380FuelPump::LeftInnerFwd => 12,
        A380FuelPump::RightInnerFwd => 13,
        A380FuelPump::RightOuter => 14,
        A380FuelPump::RightMidFwd => 15,
        A380FuelPump::RightMidAft => 16,
        A380FuelPump::LeftInnerAft => 17,
        A380FuelPump::RightInnerAft => 18,
        A380FuelPump::TrimLeft => 19,
        A380FuelPump::TrimRight => 20,
        A380FuelPump::Apu => 21,
    };
    format!("FUEL_PUMP_{id}_ACTIVE_COMMAND")
}

fn valve_target_word_and_bit(valve: A380FuelValve) -> (String, u8) {
    let index = valve.into_usize();
    (
        format!("FQMS_VALVE_TARGET_STATE_WORD_{}", index / 19 + 1),
        11 + (index % 19) as u8,
    )
}

fn valve_command_name(valve: A380FuelValve) -> String {
    format!("FUEL_VALVE_{}_OPEN_COMMAND", valve.into_usize() + 1)
}
