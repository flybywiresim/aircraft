use crate::{
    airframe::A380Airframe,
    avionics_data_communication_network::A380AvionicsDataCommunicationNetwork,
    fuel::{
        discrete_words::{
            bit_from_discrete_words, DISCRETE_BITS_PER_WORD, LEFT_FUEL_PUMPS, RIGHT_FUEL_PUMPS,
        },
        A380Fuel, A380FuelPump, A380FuelTankType, A380FuelValve,
    },
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
    depowered_buses: Vec<ElectricalBusType>,
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
            depowered_buses: Vec::new(),
            fqms_powered: false,
            lgcius: [TestLgciu::new(false), TestLgciu::new(false)],
        }
    }

    fn set_on_ground(&mut self, on_ground: bool) {
        self.lgcius = [TestLgciu::new(on_ground), TestLgciu::new(on_ground)];
    }

    fn set_bus_depowered(&mut self, bus_type: ElectricalBusType, depowered: bool) {
        let is_depowered = self.depowered_buses.contains(&bus_type);
        if depowered && !is_depowered {
            self.depowered_buses.push(bus_type);
        } else if !depowered && is_depowered {
            self.depowered_buses.retain(|bus| *bus != bus_type);
        }
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
                if !self.depowered_buses.contains(&bus.bus_type()) {
                    electricity.flow(&self.fuel_electrical_power_source, bus);
                }
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

    /// Powers or un-powers the FQMS/CPIOM supply. Un-powering it after it has
    /// already passed the self test forces the self test to restart from zero.
    pub(super) fn set_fqms_powered(&mut self, powered: bool) {
        self.command(|aircraft| aircraft.set_fqms_powered(powered));
    }

    pub(super) fn with_bus_depowered(mut self, bus_type: ElectricalBusType) -> Self {
        self.command(|aircraft| aircraft.set_bus_depowered(bus_type, true));
        self
    }

    /// Removes (or restores) power from a single bus while the simulation is
    /// running, so that failovers can be exercised after power-up.
    pub(super) fn set_bus_depowered(&mut self, bus_type: ElectricalBusType) {
        self.command(|aircraft| aircraft.set_bus_depowered(bus_type, true));
    }

    pub(super) fn fqms_status_word(&mut self) -> Arinc429Word<u32> {
        self.read_arinc429_by_name("FQMS_STATUS_WORD")
    }

    pub(super) fn fqms_pump_target_word(&mut self, side: &str) -> Arinc429Word<u32> {
        self.read_arinc429_by_name(&format!("FQMS_{side}_FUEL_PUMP_TARGET_STATE_WORD"))
    }

    pub(super) fn with_on_ground(mut self, on_ground: bool) -> Self {
        self.command(|aircraft| aircraft.set_on_ground(on_ground));
        self
    }

    pub(super) fn and_run_past_fqms_self_test(mut self) -> Self {
        // The FQMS self test needs SELF_TEST_DURATION (30 s) of continuous
        // power before its outputs leave failure warning. Step the simulation
        // in 1 s frames and stop once the status word reports normal operation,
        // instead of crossing the boundary in a single oversized frame and
        // hard-coding the exact duration the (private) self test requires.
        for _ in 0..120 {
            self.run_with_delta(Duration::from_secs(1));
            if self.fqms_status_word().is_normal_operation() {
                break;
            }
        }
        assert!(
            self.fqms_status_word().is_normal_operation(),
            "the FQMS did not finish its self test within 120 s"
        );
        // One extra frame so that the applications run once with the self test
        // finished, reproducing the settled state the previous fixed 32 s run
        // produced for the downstream transfer assertions.
        self.run_with_delta(Duration::from_secs(1));
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

    /// Reads the left and right FQMS fuel pump target-state words.
    fn read_fuel_pump_target_words(&mut self) -> [Arinc429Word<u32>; 2] {
        [
            self.read_arinc429_by_name("FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD"),
            self.read_arinc429_by_name("FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD"),
        ]
    }

    /// Reads the three FQMS fuel valve target-state words.
    fn read_fuel_valve_target_words(&mut self) -> [Arinc429Word<u32>; 3] {
        [1, 2, 3].map(|i| self.read_arinc429_by_name(&format!("FQMS_VALVE_TARGET_STATE_WORD_{i}")))
    }

    pub(super) fn assert_fqms_pump_targeted(&mut self, pump: A380FuelPump) {
        let index = pump_discrete_index(pump);
        let command_name = pump_command_name(pump);
        let words = self.read_fuel_pump_target_words();
        let word_name = pump_target_word_name(index);
        let relevant_word = if index < DISCRETE_BITS_PER_WORD {
            words[0]
        } else {
            words[1]
        };
        assert!(
            relevant_word.is_normal_operation(),
            "{word_name} should be normal operation"
        );
        assert!(
            bit_from_discrete_words(&words.map(|w| w.value()), index),
            "expected fuel pump target at discrete index {index} in {word_name}"
        );
        let commanded: bool = self.read_by_name(&command_name);
        assert!(commanded, "{command_name} should be true");
    }

    pub(super) fn assert_fqms_pump_not_targeted(&mut self, pump: A380FuelPump) {
        let index = pump_discrete_index(pump);
        let command_name = pump_command_name(pump);
        let words = self.read_fuel_pump_target_words().map(|w| w.value());
        assert!(
            !bit_from_discrete_words(&words, index),
            "expected fuel pump target at discrete index {index} to be false"
        );
        let commanded: bool = self.read_by_name(&command_name);
        assert!(!commanded, "{command_name} should be false");
    }

    pub(super) fn assert_fqms_valve_targeted(&mut self, valve: A380FuelValve) {
        let index = valve_discrete_index(valve);
        let command_name = valve_command_name(valve);
        let words = self.read_fuel_valve_target_words();
        let word_name = valve_target_word_name(index);
        assert!(
            words[index / DISCRETE_BITS_PER_WORD].is_normal_operation(),
            "{word_name} should be normal operation"
        );
        assert!(
            bit_from_discrete_words(&words.map(|w| w.value()), index),
            "expected fuel valve target at discrete index {index} in {word_name}"
        );
        let commanded: bool = self.read_by_name(&command_name);
        assert!(commanded, "{command_name} should be true");
    }

    pub(super) fn assert_fqms_valve_not_targeted(&mut self, valve: A380FuelValve) {
        let index = valve_discrete_index(valve);
        let command_name = valve_command_name(valve);
        let words = self.read_fuel_valve_target_words().map(|w| w.value());
        assert!(
            !bit_from_discrete_words(&words, index),
            "expected fuel valve target at discrete index {index} to be false"
        );
        let commanded: bool = self.read_by_name(&command_name);
        assert!(!commanded, "{command_name} should be false");
    }

    /// Reports the electrical power state of a valve as seen by the fuel system.
    /// This is purely electrical and therefore independent from the FQMS self
    /// test, which makes it usable as a positive signal that bus power is back.
    pub(super) fn fqms_valve_powered(&mut self, valve: A380FuelValve) -> bool {
        let name = format!("FUEL_VALVE_{}_IS_POWERED", valve.into_usize() + 1);
        self.read_by_name(&name)
    }

    /// Asserts the electrical power state of a valve as reported by the fuel
    /// system. This is independent from the FQMS target command: the FQMS keeps
    /// commanding a valve open even when the valve itself is unpowered.
    pub(super) fn assert_fqms_valve_powered(&mut self, valve: A380FuelValve, powered: bool) {
        let is_powered = self.fqms_valve_powered(valve);
        assert_eq!(is_powered, powered, "unexpected power state for {valve:?}");
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

/// Flat discrete index of a pump across the two fuel pump target-state words,
/// derived from the production packing layout so it cannot silently drift.
fn pump_discrete_index(pump: A380FuelPump) -> usize {
    if let Some(index) = LEFT_FUEL_PUMPS.iter().position(|&p| p == pump) {
        index
    } else {
        DISCRETE_BITS_PER_WORD
            + RIGHT_FUEL_PUMPS
                .iter()
                .position(|&p| p == pump)
                .expect("fuel pump is not part of the discrete word layout")
    }
}

fn pump_target_word_name(index: usize) -> &'static str {
    if index < DISCRETE_BITS_PER_WORD {
        "FQMS_LEFT_FUEL_PUMP_TARGET_STATE_WORD"
    } else {
        "FQMS_RIGHT_FUEL_PUMP_TARGET_STATE_WORD"
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

/// Flat discrete index of a valve across the three fuel valve target-state
/// words. Valves are packed in declaration order, so the index is the
/// enumeration discriminant.
fn valve_discrete_index(valve: A380FuelValve) -> usize {
    valve.into_usize()
}

fn valve_target_word_name(index: usize) -> String {
    format!(
        "FQMS_VALVE_TARGET_STATE_WORD_{}",
        index / DISCRETE_BITS_PER_WORD + 1
    )
}

fn valve_command_name(valve: A380FuelValve) -> String {
    format!("FUEL_VALVE_{}_OPEN_COMMAND", valve.into_usize() + 1)
}
