use super::{Air, DuctTemperature};
use crate::simulation::{SimulationElement, SimulatorWriter, UpdateContext, Write};
use uom::si::{
    f64::*, mass_rate::kilogram_per_second, pressure::pascal, thermodynamic_temperature::kelvin,
    volume::cubic_meter,
};

pub struct CabinZone {
    zone_id: String,
    zone_air: ZoneAir,
    zone_volume: Volume,
    passengers: usize,
}

impl CabinZone {
    pub fn new(zone_id: String, zone_volume: Volume, passengers: usize) -> Self {
        Self {
            zone_id,
            zone_air: ZoneAir::new(),
            zone_volume,
            passengers,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, duct_temperature: &impl DuctTemperature) {
        let mut flow_in = Air::new();
        flow_in.set_temperature(duct_temperature.duct_demand_temperature()[&self.zone_id as &str]);
        flow_in.set_flow_rate(MassRate::new::<kilogram_per_second>(1.)); // TODO Replace with selection

        self.zone_air
            .update(context, &flow_in, self.zone_volume, self.passengers);
    }

    pub fn update_number_of_passengers(&mut self, passengers: usize) {
        self.passengers = passengers;
    }

    pub fn zone_id(&self) -> &str {
        self.zone_id.as_ref()
    }
}

impl SimulationElement for CabinZone {
    fn write(&self, writer: &mut SimulatorWriter) {
        let zone_id = format!("COND_{}_TEMP", &self.zone_id);
        writer.write(&zone_id, self.zone_air.zone_air_temperature());
    }
}

struct ZoneAir {
    flow_out: Air,
    internal_air: Air,
}

impl ZoneAir {
    const PASSENGER_HEAT_RELEASE: f64 = 0.1; // kW - from Thermodynamics: An Engineering Approach (Cengel and Boles)

    fn new() -> Self {
        Self {
            flow_out: Air::new(),
            internal_air: Air::new(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        flow_in: &Air,
        zone_volume: Volume,
        zone_passengers: usize,
    ) {
        let new_equilibrium_temperature =
            self.calculate_equilibrium_temperature(context, flow_in, zone_volume, zone_passengers);
        self.internal_air
            .set_temperature(new_equilibrium_temperature);
        self.flow_out.set_temperature(new_equilibrium_temperature);
        self.flow_out.set_flow_rate(flow_in.flow_rate());
    }

    fn calculate_equilibrium_temperature(
        &self,
        context: &UpdateContext,
        flow_in: &Air,
        zone_volume: Volume,
        zone_passengers: usize,
    ) -> ThermodynamicTemperature {
        let inlet_air_energy = flow_in.flow_rate().get::<kilogram_per_second>()
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * flow_in.temperature().get::<kelvin>();
        let outlet_air_energy = self.flow_out.flow_rate().get::<kilogram_per_second>()
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * self.flow_out.temperature().get::<kelvin>();
        let passenger_heat_energy = Self::PASSENGER_HEAT_RELEASE * (zone_passengers as f64);

        let internal_mass = self.internal_air.pressure().get::<pascal>()
            * zone_volume.get::<cubic_meter>()
            / (Air::R * self.internal_air.temperature().get::<kelvin>());
        let internal_energy = internal_mass
            * Air::SPECIFIC_HEAT_CAPACITY_VOLUME
            * self.internal_air.temperature().get::<kelvin>();

        let eq_temp = ((passenger_heat_energy + inlet_air_energy - outlet_air_energy)
            * context.delta_as_secs_f64()
            + internal_energy)
            / (internal_mass * Air::SPECIFIC_HEAT_CAPACITY_VOLUME);
        ThermodynamicTemperature::new::<kelvin>(eq_temp)
    }

    fn zone_air_temperature(&self) -> ThermodynamicTemperature {
        self.internal_air.temperature()
    }
}

#[cfg(test)]
mod cabin_air_tests {
    use super::*;
    use crate::simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, SimulationElement, UpdateContext,
    };
    use std::{collections::HashMap, time::Duration};
    use uom::si::thermodynamic_temperature::degree_celsius;

    struct TestAirConditioningSystem {
        duct_demand_temperature: ThermodynamicTemperature,
    }

    impl TestAirConditioningSystem {
        fn new() -> Self {
            Self {
                duct_demand_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            }
        }

        fn set_duct_demand_temperature(&mut self, temperature: ThermodynamicTemperature) {
            self.duct_demand_temperature = temperature;
        }
    }

    impl DuctTemperature for TestAirConditioningSystem {
        fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
            let mut duct_temperature: HashMap<&str, ThermodynamicTemperature> = HashMap::new();
            duct_temperature.insert("FWD", self.duct_demand_temperature);
            duct_temperature
        }
    }

    struct TestAircraft {
        cabin_zone: CabinZone,
        flow_in: Air,
        air_conditioning_system: TestAirConditioningSystem,
    }

    impl TestAircraft {
        fn new() -> Self {
            Self {
                cabin_zone: CabinZone::new(
                    "FWD".to_string(),
                    Volume::new::<cubic_meter>(400. / 2.),
                    174 / 2,
                ),
                flow_in: Air::new(),
                air_conditioning_system: TestAirConditioningSystem::new(),
            }
        }

        fn set_flow_in_temperature(&mut self, temperature: ThermodynamicTemperature) {
            self.air_conditioning_system
                .set_duct_demand_temperature(temperature);
        }

        // BROKEN!! Needs to be implemented
        fn set_flow_in_flow_rate(&mut self, flow_rate: MassRate) {
            self.flow_in.set_flow_rate(flow_rate)
        }

        fn set_passengers(&mut self, passengers: usize) {
            self.cabin_zone.update_number_of_passengers(passengers);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.cabin_zone
                .update(context, &self.air_conditioning_system)
        }
    }
    impl SimulationElement for TestAircraft {}

    struct CabinZoneTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl CabinZoneTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|_| TestAircraft::new()),
            }
        }

        fn with_flow(mut self) -> Self {
            self.command(|a| a.set_flow_in_flow_rate(MassRate::new::<kilogram_per_second>(1.)));
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
    fn cabin_air_starts_at_24_degrees() {
        let test_bed = test_bed();

        assert_eq!(
            test_bed.cabin_temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(24.)
        );
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
        test_bed.set_flow_in_temperature(ThermodynamicTemperature::new::<degree_celsius>(8.));
        test_bed = test_bed.iterate(40);

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
}
