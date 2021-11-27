use super::{Air, DuctTemperature};
use crate::{
    shared::CabinAltitude,
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};
use uom::si::{
    f64::*,
    length::meter,
    mass_density::kilogram_per_cubic_meter,
    mass_rate::kilogram_per_second,
    power::{kilowatt, watt},
    pressure::pascal,
    ratio::percent,
    thermodynamic_temperature::kelvin,
    velocity::meter_per_second,
    volume::cubic_meter,
};

pub struct CabinZone {
    zone_identifier: VariableIdentifier,
    true_airspeed_id: VariableIdentifier,
    fwd_door_id: VariableIdentifier,
    rear_door_id: VariableIdentifier,

    zone_id: String,
    zone_air: ZoneAir,
    zone_volume: Volume,
    passengers: usize,
    true_airspeed: Velocity,
    fwd_door_is_open: bool,
    rear_door_is_open: bool,
}

impl CabinZone {
    const TRUE_AIRSPEED: &'static str = "AIRSPEED TRUE";
    const FWD_DOOR: &'static str = "INTERACTIVE POINT OPEN:0";
    const READ_DOOR: &'static str = "INTERACTIVE POINT OPEN:3";

    const FIBER_GLASS_BLANKET_THERMAL_CONDUCTIVITY: f64 = 35.; // m*W/m*C
    const FIBER_GLASS_BLANKET_THICKNESS: f64 = 0.06; //m
    const ALUMINIUM_ALLOY_THERMAL_CONDUCTIVITY: f64 = 177.; // m*W/m*C
    const ALUMINIUM_ALLOW_THICKNESS: f64 = 0.005;

    pub fn new(
        context: &mut InitContext,
        zone_id: &str,
        zone_volume: Volume,
        passengers: usize,
    ) -> Self {
        Self {
            zone_identifier: context.get_identifier(format!("COND_{}_TEMP", zone_id)),
            true_airspeed_id: context.get_identifier(Self::TRUE_AIRSPEED.to_owned()),
            fwd_door_id: context.get_identifier(Self::FWD_DOOR.to_owned()),
            rear_door_id: context.get_identifier(Self::READ_DOOR.to_owned()),

            zone_id: zone_id.to_owned(),
            zone_air: ZoneAir::new(),
            zone_volume,
            passengers,
            true_airspeed: Velocity::new::<meter_per_second>(0.),
            fwd_door_is_open: false,
            rear_door_is_open: false,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        duct_temperature: &impl DuctTemperature,
        pack_flow_per_cubic_meter: MassRate,
        pressurization: &impl CabinAltitude,
    ) {
        let mut flow_in = Air::new();
        flow_in.set_temperature(duct_temperature.duct_demand_temperature()[&self.zone_id as &str]);
        flow_in.set_flow_rate(pack_flow_per_cubic_meter * self.zone_volume.get::<cubic_meter>());

        self.zone_air.update(
            context,
            &flow_in,
            self.true_airspeed,
            self.zone_volume,
            self.passengers,
            self.fwd_door_is_open,
            self.rear_door_is_open,
            pressurization,
        );
    }

    pub fn update_number_of_passengers(&mut self, passengers: usize) {
        self.passengers = passengers;
    }

    pub fn zone_id(&self) -> &str {
        self.zone_id.as_ref()
    }
}

impl SimulationElement for CabinZone {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.true_airspeed = reader.read(&self.true_airspeed_id);
        let rear_door_read: Ratio = reader.read(&self.rear_door_id);
        self.rear_door_is_open = rear_door_read > Ratio::new::<percent>(0.);
        let fwd_door_read: Ratio = reader.read(&self.fwd_door_id);
        self.fwd_door_is_open = fwd_door_read > Ratio::new::<percent>(0.);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.zone_identifier, self.zone_air.zone_air_temperature());
    }
}

struct ZoneAir {
    flow_out: Air,
    internal_air: Air,
    is_initialised: bool,
}

impl ZoneAir {
    const PASSENGER_HEAT_RELEASE: f64 = 0.1; // kW - from Thermodynamics: An Engineering Approach (Cengel and Boles)
    const A320_CABIN_DIAMETER: f64 = 4.14; // m
    const FLOW_RATE_THROUGH_OPEN_DOOR: f64 = 0.6; // kg/s
    const CONVECTION_COEFFICIENT_CONSTANT_FOR_NATURAL_CONVECTION: f64 = 1.32;

    fn new() -> Self {
        Self {
            flow_out: Air::new(),
            internal_air: Air::new(),
            is_initialised: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        flow_in: &Air,
        true_airspeed: Velocity,
        zone_volume: Volume,
        zone_passengers: usize,
        fwd_door_is_open: bool,
        rear_door_is_open: bool,
        pressurization: &impl CabinAltitude,
    ) {
        if !self.is_initialised {
            self.internal_air
                .set_temperature(context.ambient_temperature());
            self.flow_out.set_temperature(context.ambient_temperature());
            self.is_initialised = true;
        }
        self.internal_air
            .set_pressure(pressurization.cabin_pressure());
        let number_of_open_doors: usize = fwd_door_is_open as usize + rear_door_is_open as usize;
        let new_equilibrium_temperature = self.equilibrium_temperature_calculation(
            context,
            number_of_open_doors,
            flow_in,
            true_airspeed,
            zone_volume,
            zone_passengers,
        );
        self.internal_air
            .set_temperature(new_equilibrium_temperature);
        self.flow_out.set_temperature(new_equilibrium_temperature);
        self.flow_out.set_flow_rate(flow_in.flow_rate());
    }

    fn equilibrium_temperature_calculation(
        &self,
        context: &UpdateContext,
        number_of_open_doors: usize,
        flow_in: &Air,
        true_airspeed: Velocity,
        zone_volume: Volume,
        zone_passengers: usize,
    ) -> ThermodynamicTemperature {
        // Energy balance calculation to determine equilibrium temperature in the cabin
        let inlet_air_energy = flow_in.flow_rate().get::<kilogram_per_second>()
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * flow_in.temperature().get::<kelvin>();
        let mut inlet_door_air_energy = number_of_open_doors as f64
            * (Self::FLOW_RATE_THROUGH_OPEN_DOOR)
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * context.ambient_temperature().get::<kelvin>();
        let outlet_air_energy = self.flow_out.flow_rate().get::<kilogram_per_second>()
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * self.flow_out.temperature().get::<kelvin>();
        let mut outlet_door_air_energy = number_of_open_doors as f64
            * (Self::FLOW_RATE_THROUGH_OPEN_DOOR)
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * self.internal_air.temperature().get::<kelvin>();
        let passenger_heat_energy = Self::PASSENGER_HEAT_RELEASE * (zone_passengers as f64);
        let wall_transfer_heat_energy = self
            .heat_transfer_through_wall_calculation(context, true_airspeed, zone_volume)
            .get::<kilowatt>();
        // For the cocklpit we reduce the effect of opening doors
        if zone_volume < Volume::new::<cubic_meter>(100.) {
            inlet_door_air_energy = inlet_door_air_energy * 0.2;
            outlet_door_air_energy = outlet_door_air_energy * 0.2;
        }

        let internal_mass = self.internal_air.pressure().get::<pascal>()
            * zone_volume.get::<cubic_meter>()
            / (Air::R * self.internal_air.temperature().get::<kelvin>());
        let internal_energy = internal_mass
            * Air::SPECIFIC_HEAT_CAPACITY_VOLUME
            * self.internal_air.temperature().get::<kelvin>();

        let equilibrium_temperature =
            ((passenger_heat_energy + inlet_air_energy + inlet_door_air_energy
                - outlet_air_energy
                - outlet_door_air_energy
                - wall_transfer_heat_energy)
                * context.delta_as_secs_f64()
                + internal_energy)
                / (internal_mass * Air::SPECIFIC_HEAT_CAPACITY_VOLUME);
        ThermodynamicTemperature::new::<kelvin>(equilibrium_temperature)
    }

    fn heat_transfer_through_wall_calculation(
        &self,
        context: &UpdateContext,
        true_airspeed: Velocity,
        zone_volume: Volume,
    ) -> Power {
        let external_convection_coefficient: f64 =
            if true_airspeed < Velocity::new::<meter_per_second>(15.) {
                self.natural_convection_coefficient_calculation(context)
            } else {
                self.forced_convection_coefficient_calculation(context, true_airspeed, zone_volume)
            };
        let internal_convection_coefficient: f64 =
            self.natural_convection_coefficient_calculation(context);
        let wall_specific_heat_transfer: f64 = (self.internal_air.temperature().get::<kelvin>()
            - context.ambient_temperature().get::<kelvin>())
            / (1. / internal_convection_coefficient
                + CabinZone::FIBER_GLASS_BLANKET_THICKNESS
                    / CabinZone::FIBER_GLASS_BLANKET_THERMAL_CONDUCTIVITY
                + CabinZone::ALUMINIUM_ALLOW_THICKNESS
                    / CabinZone::ALUMINIUM_ALLOY_THERMAL_CONDUCTIVITY
                + 1. / external_convection_coefficient);
        let zone_surface_area: f64 = 2.
            * std::f64::consts::PI
            * self
                .characteristic_length_calculation(zone_volume)
                .get::<meter>();
        Power::new::<watt>(wall_specific_heat_transfer * zone_surface_area)
    }

    fn natural_convection_coefficient_calculation(&self, context: &UpdateContext) -> f64 {
        // Temperature differential should be based on the wall temperature instead of the inside vs outside. This is a simplification
        let temperature_differential: f64 = self.internal_air.temperature().get::<kelvin>()
            - context.ambient_temperature().get::<kelvin>(); // Kelvin

        // Convection coefficient for horizontal cylinder in air
        let convection_coefficient: f64 =
            Self::CONVECTION_COEFFICIENT_CONSTANT_FOR_NATURAL_CONVECTION
                * (temperature_differential.abs() / Self::A320_CABIN_DIAMETER).powf(1. / 4.);
        convection_coefficient
    }

    fn forced_convection_coefficient_calculation(
        &self,
        context: &UpdateContext,
        true_airspeed: Velocity,
        zone_volume: Volume,
    ) -> f64 {
        let characteristic_length = self
            .characteristic_length_calculation(zone_volume)
            .get::<meter>();
        let reynolds_number = self.reynolds_number_calculation(context, true_airspeed, zone_volume);
        // Nusselt calculation for turbulent flow
        let nusselt_number: f64 =
            Air::PRANDT_NUMBER.powf(1. / 3.) * (0.037 * reynolds_number.powf(0.8) - 850.);

        let convection_coefficient: f64 = nusselt_number * Air::K / characteristic_length;
        convection_coefficient
    }

    fn reynolds_number_calculation(
        &self,
        context: &UpdateContext,
        true_airspeed: Velocity,
        zone_volume: Volume,
    ) -> f64 {
        let characteristic_length = self
            .characteristic_length_calculation(zone_volume)
            .get::<meter>();
        let reynolds_number: f64 = (self
            .external_density_calculation(context)
            .get::<kilogram_per_cubic_meter>()
            * true_airspeed.get::<meter_per_second>()
            * characteristic_length)
            / Air::MU;
        reynolds_number
    }

    fn external_density_calculation(&self, context: &UpdateContext) -> MassDensity {
        // Ideal gas law
        let rho = context.ambient_pressure().get::<pascal>()
            / (Air::R * context.ambient_temperature().get::<kelvin>());
        MassDensity::new::<kilogram_per_cubic_meter>(rho)
    }

    fn characteristic_length_calculation(&self, zone_volume: Volume) -> Length {
        let characteristic_length: f64 = zone_volume.get::<cubic_meter>()
            / (std::f64::consts::PI * (Self::A320_CABIN_DIAMETER / 2.).powf(2.));
        Length::new::<meter>(characteristic_length)
    }

    fn zone_air_temperature(&self) -> ThermodynamicTemperature {
        self.internal_air.temperature()
    }
}

#[cfg(test)]
mod cabin_air_tests {
    use super::*;
    use crate::{
        air_conditioning::PackFlow,
        simulation::{
            test::{SimulationTestBed, TestBed, WriteByName},
            Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };
    use std::{collections::HashMap, time::Duration};
    use uom::si::{length::foot, thermodynamic_temperature::degree_celsius};

    struct TestAirConditioningSystem {
        duct_demand_temperature: ThermodynamicTemperature,
        pack_flow: MassRate,
    }

    impl TestAirConditioningSystem {
        fn new() -> Self {
            Self {
                duct_demand_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
                pack_flow: MassRate::new::<kilogram_per_second>(0.),
            }
        }

        fn set_duct_demand_temperature(&mut self, temperature: ThermodynamicTemperature) {
            self.duct_demand_temperature = temperature;
        }

        fn set_pack_flow(&mut self, flow: MassRate) {
            self.pack_flow = flow;
        }
    }

    impl DuctTemperature for TestAirConditioningSystem {
        fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
            let mut duct_temperature: HashMap<&str, ThermodynamicTemperature> = HashMap::new();
            duct_temperature.insert("FWD", self.duct_demand_temperature);
            duct_temperature
        }
    }

    impl PackFlow for TestAirConditioningSystem {
        fn pack_flow(&self) -> MassRate {
            self.pack_flow
        }
    }

    struct TestPressurization {
        cabin_pressure: Pressure,
    }

    impl TestPressurization {
        fn new() -> Self {
            Self {
                cabin_pressure: Pressure::new::<pascal>(101315.),
            }
        }
    }

    impl CabinAltitude for TestPressurization {
        fn cabin_altitude(&self) -> Length {
            Length::new::<foot>(0.)
        }

        fn cabin_pressure(&self) -> Pressure {
            self.cabin_pressure
        }
    }

    struct TestAircraft {
        cabin_zone: CabinZone,
        air_conditioning_system: TestAirConditioningSystem,
        pressurization: TestPressurization,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                cabin_zone: CabinZone::new(
                    context,
                    "FWD",
                    Volume::new::<cubic_meter>(400. / 2.),
                    174 / 2,
                ),
                air_conditioning_system: TestAirConditioningSystem::new(),
                pressurization: TestPressurization::new(),
            }
        }

        fn set_flow_in_temperature(&mut self, temperature: ThermodynamicTemperature) {
            self.air_conditioning_system
                .set_duct_demand_temperature(temperature);
        }

        fn set_flow_in_flow_rate(&mut self, flow_rate: MassRate) {
            self.air_conditioning_system.set_pack_flow(flow_rate);
        }

        fn set_passengers(&mut self, passengers: usize) {
            self.cabin_zone.update_number_of_passengers(passengers);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            let flow_rate_per_cubic_meter: MassRate = MassRate::new::<kilogram_per_second>(
                self.air_conditioning_system
                    .pack_flow()
                    .get::<kilogram_per_second>()
                    / (460.),
            );
            self.cabin_zone.update(
                context,
                &self.air_conditioning_system,
                flow_rate_per_cubic_meter,
                &self.pressurization,
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.cabin_zone.accept(visitor);

            visitor.visit(self);
        }
    }

    struct CabinZoneTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl CabinZoneTestBed {
        fn new() -> Self {
            let mut test_bed = CabinZoneTestBed {
                test_bed: SimulationTestBed::new(TestAircraft::new),
            };
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
            test_bed.set_true_airspeed(Velocity::new::<meter_per_second>(0.));

            test_bed
        }

        fn with_flow(mut self) -> Self {
            self.command(|a| a.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(1.3)));
            self
        }

        fn set_flow_in_temperature(&mut self, temperature: ThermodynamicTemperature) {
            self.command(|a| a.set_flow_in_temperature(temperature));
        }

        fn set_flow_in_flow_rate(&mut self, flow_rate: MassRate) {
            self.command(|a| a.set_flow_in_flow_rate(flow_rate));
        }

        fn set_passengers(&mut self, passengers: usize) {
            self.command(|a| a.set_passengers(passengers));
        }

        fn set_true_airspeed(&mut self, speed: Velocity) {
            self.write_by_name("AIRSPEED TRUE", speed);
        }

        fn command_open_door(&mut self) {
            self.write_by_name("INTERACTIVE POINT OPEN:0", Ratio::new::<percent>(100.));
        }

        fn cabin_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| a.cabin_zone.zone_air.zone_air_temperature())
        }

        fn iterate(mut self, iterations: usize) -> Self {
            for _ in 0..iterations {
                self.run();
            }
            self
        }

        fn iterate_with_delta(mut self, iterations: usize, delta: Duration) -> Self {
            for _ in 0..iterations {
                self.run_with_delta(delta);
            }
            self
        }
    }
    impl TestBed for CabinZoneTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> CabinZoneTestBed {
        CabinZoneTestBed::new()
    }

    #[test]
    fn cabin_air_starts_at_exterior_temperature() {
        let mut test_bed = test_bed();
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(10.));
        test_bed.run();
        assert!((test_bed.cabin_temperature().get::<degree_celsius>() - 10.) < 1.);
    }

    #[test]
    fn cabin_air_warms_up_with_pax_and_no_ac() {
        let mut test_bed = test_bed();

        let initial_temp = test_bed.cabin_temperature();
        test_bed = test_bed.iterate(20);

        assert!(initial_temp < test_bed.cabin_temperature());
    }

    #[test]
    fn cabin_air_cools_with_ac_low() {
        let mut test_bed = test_bed().with_flow();

        let initial_temp = test_bed.cabin_temperature();
        test_bed.set_flow_in_temperature(ThermodynamicTemperature::new::<degree_celsius>(4.));
        test_bed = test_bed.iterate(80);

        assert!(initial_temp > test_bed.cabin_temperature());
    }

    #[test]
    fn cabin_air_reaches_equilibrium_temperature() {
        let mut test_bed = test_bed().with_flow();

        let mut previous_temp = test_bed.cabin_temperature();
        test_bed.run();
        let initial_temp_diff = test_bed.cabin_temperature().get::<degree_celsius>()
            - previous_temp.get::<degree_celsius>();
        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
        previous_temp = test_bed.cabin_temperature();
        test_bed.run();
        let final_temp_diff = test_bed.cabin_temperature().get::<degree_celsius>()
            - previous_temp.get::<degree_celsius>();

        assert!(initial_temp_diff > final_temp_diff);
    }

    #[test]
    fn reducing_passengers_reduces_cabin_temperature() {
        let mut test_bed = test_bed().with_flow();

        test_bed.set_flow_in_temperature(ThermodynamicTemperature::new::<degree_celsius>(8.));
        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
        let initial_temp = test_bed.cabin_temperature();

        test_bed.set_passengers(10);
        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

        assert!(initial_temp > test_bed.cabin_temperature());
    }

    #[test]
    fn temperature_stays_stable_with_no_flow_and_no_passengers() {
        let mut test_bed = test_bed();
        test_bed.set_passengers(0);
        test_bed.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(0.));

        let initial_temp = test_bed.cabin_temperature();

        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

        assert!(
            (initial_temp.get::<degree_celsius>()
                - test_bed.cabin_temperature().get::<degree_celsius>())
            .abs()
                < 1.
        );
    }

    #[test]
    fn reducing_ambient_temperature_reduces_cabin_temperature() {
        let mut test_bed = test_bed();
        test_bed.set_passengers(0);
        test_bed.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(0.));
        let initial_temp = test_bed.cabin_temperature();

        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

        assert!(initial_temp > test_bed.cabin_temperature());
    }

    #[test]
    fn increasing_ambient_temperature_increases_cabin_temperature() {
        let mut test_bed = test_bed();
        test_bed.set_passengers(0);
        test_bed.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(0.));

        let initial_temp = test_bed.cabin_temperature();

        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(45.));
        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

        assert!(initial_temp < test_bed.cabin_temperature());
    }

    #[test]
    fn more_heat_is_dissipated_in_flight() {
        let mut test_bed = test_bed();
        test_bed.set_passengers(0);
        test_bed.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(0.));
        test_bed.run();
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        let initial_temp = test_bed.cabin_temperature();
        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
        let first_temperature_differential = initial_temp.get::<degree_celsius>()
            - test_bed.cabin_temperature().get::<degree_celsius>();

        let mut test_bed2 = CabinZoneTestBed::new();
        test_bed2.set_passengers(0);
        test_bed2.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(0.));
        test_bed2.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed2.set_true_airspeed(Velocity::new::<meter_per_second>(130.));
        let initial_temp2 = test_bed2.cabin_temperature();
        test_bed2 = test_bed2.iterate_with_delta(100, Duration::from_secs(10));
        let second_temperature_differential = initial_temp2.get::<degree_celsius>()
            - test_bed2.cabin_temperature().get::<degree_celsius>();

        assert!(first_temperature_differential < second_temperature_differential);
    }

    #[test]
    fn increasing_altitude_reduces_heat_transfer() {
        let mut test_bed = test_bed();
        test_bed.set_passengers(0);
        test_bed.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(0.));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
        test_bed.run();
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed.set_true_airspeed(Velocity::new::<meter_per_second>(130.));
        let initial_temp = test_bed.cabin_temperature();
        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
        let first_temperature_differential = initial_temp.get::<degree_celsius>()
            - test_bed.cabin_temperature().get::<degree_celsius>();

        let mut test_bed2 = CabinZoneTestBed::new();
        test_bed2.set_passengers(0);
        test_bed2.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(0.));
        test_bed2.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
        test_bed2.run();
        test_bed2.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed2.set_true_airspeed(Velocity::new::<meter_per_second>(130.));
        test_bed2.set_ambient_pressure(Pressure::new::<pascal>(45000.));
        let initial_temp2 = test_bed2.cabin_temperature();
        test_bed2 = test_bed2.iterate_with_delta(100, Duration::from_secs(10));
        let second_temperature_differential = initial_temp2.get::<degree_celsius>()
            - test_bed2.cabin_temperature().get::<degree_celsius>();

        assert!(first_temperature_differential > second_temperature_differential);
    }

    #[test]
    fn opening_doors_affects_cabin_temp() {
        let mut test_bed = test_bed();
        test_bed.set_passengers(0);
        test_bed.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(0.));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));

        test_bed.run();
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed.command_open_door();
        test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

        assert!(
            (test_bed.cabin_temperature().get::<degree_celsius>()
                - test_bed.ambient_temperature().get::<degree_celsius>())
            .abs()
                < 1.
        );
    }
}
