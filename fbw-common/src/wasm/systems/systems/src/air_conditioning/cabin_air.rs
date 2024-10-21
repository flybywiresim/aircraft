use super::{Air, DuctTemperature, OutletAir, PressurizationConstants, VcmShared, ZoneType};
use crate::{
    failures::{Failure, FailureType},
    shared::{AverageExt, CabinSimulation},
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};
use num_traits::Pow;
use uom::si::{
    f64::*,
    length::meter,
    mass_density::kilogram_per_cubic_meter,
    mass_rate::kilogram_per_second,
    power::{kilowatt, watt},
    pressure::{hectopascal, pascal},
    ratio::ratio,
    thermodynamic_temperature::{degree_celsius, kelvin},
    velocity::meter_per_second,
    volume::cubic_meter,
};

use bounded_vec_deque::BoundedVecDeque;

use std::{convert::TryInto, marker::PhantomData};

pub struct CabinAirSimulation<C, const ZONES: usize> {
    is_initialised: bool,
    previous_exterior_pressure: BoundedVecDeque<Pressure>,
    filtered_exterior_pressure: Pressure,
    previous_flow_in: BoundedVecDeque<MassRate>,
    filtered_flow_in: MassRate,

    air_in: Air,
    air_out: Air,
    internal_air: Air,
    cargo_air_in: Air,

    cabin_zones: [CabinZone<C>; ZONES],

    hull_breach: Failure,
    constants: PhantomData<C>,
}

impl<C: PressurizationConstants, const ZONES: usize> CabinAirSimulation<C, ZONES> {
    pub fn new(context: &mut InitContext, cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
        Self {
            is_initialised: false,
            previous_exterior_pressure: BoundedVecDeque::from_iter(
                [Pressure::new::<hectopascal>(1013.25); 20],
                20,
            ),
            filtered_exterior_pressure: Pressure::new::<hectopascal>(1013.25),
            previous_flow_in: BoundedVecDeque::from_iter([MassRate::default(); 200], 200),
            filtered_flow_in: MassRate::default(),

            air_in: Air::new(),
            air_out: Air::new(),
            internal_air: Air::new(),
            cargo_air_in: Air::new(),

            cabin_zones: cabin_zone_ids
                .iter()
                .map(|zone| CabinZone::new(context, zone))
                .collect::<Vec<CabinZone<C>>>()
                .try_into()
                .unwrap_or_else(|v: Vec<CabinZone<C>>| {
                    panic!("Expected a Vec of length {} but it was {}", ZONES, v.len())
                }),

            hull_breach: Failure::new(FailureType::RapidDecompression),
            constants: PhantomData,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        air_conditioning_system: &(impl OutletAir + DuctTemperature + VcmShared),
        outflow_valve_open_amount: Ratio,
        safety_valve_open_amount: Ratio,
        lgciu_gear_compressed: bool,
        passengers: [u8; ZONES],
        number_of_open_doors: u8,
    ) {
        if !self.is_initialised {
            let initial_cabin_pressure =
                self.initialize_cabin_pressure(context, lgciu_gear_compressed);
            self.internal_air.set_pressure(initial_cabin_pressure);
            let initial_cabin_temperature =
                self.initialize_cabin_temperature(context, lgciu_gear_compressed);
            self.internal_air.set_temperature(initial_cabin_temperature);
            self.is_initialised = true;
        }
        self.filtered_flow_in =
            self.flow_in_low_pass_filter(air_conditioning_system.outlet_air().flow_rate());

        // Set flow in properties
        self.air_in
            .set_flow_rate(self.calculate_cabin_flow_in(context, self.filtered_flow_in));
        self.air_in
            .set_pressure(air_conditioning_system.outlet_air().pressure());
        self.air_in
            .set_temperature(air_conditioning_system.outlet_air().temperature());

        // Set flow in properties for cargo bays
        self.cargo_air_in.set_pressure(self.internal_air.pressure());
        self.cargo_air_in
            .set_temperature(self.internal_air.temperature());

        // Calculate zone temperatures
        // let mut flow_rate_per_cubic_meter = self.flow_rate_per_cubic_meter();
        let flow_rate_per_cubic_meter = self.flow_rate_determination(air_conditioning_system);

        for zone in self.cabin_zones.iter_mut() {
            zone.update(
                context,
                air_conditioning_system,
                flow_rate_per_cubic_meter[zone.zone_id().id()],
                self.internal_air.pressure(),
                passengers[zone.zone_id().id()],
                number_of_open_doors,
            );
        }

        let average_temperature: ThermodynamicTemperature = self
            .cabin_zones
            .iter()
            .map(|zone| zone.zone_air_temperature())
            .average();

        // Calculate flow out properties
        self.filtered_exterior_pressure = self.exterior_pressure_low_pass_filter(context);
        self.air_out.set_flow_rate(self.calculate_cabin_flow_out(
            outflow_valve_open_amount,
            safety_valve_open_amount,
            number_of_open_doors,
        ));

        // Calculate internal air properties
        let mass_change = (self.air_in.flow_rate().get::<kilogram_per_second>()
            - self.air_out.flow_rate().get::<kilogram_per_second>())
            * context.delta_as_secs_f64(); // Kg
        let temperature_change =
            average_temperature.get::<kelvin>() - self.internal_air.temperature().get::<kelvin>(); // K
        let pressure_change = self.calculate_pressure_change(mass_change, temperature_change);
        self.internal_air.set_temperature(average_temperature);
        self.internal_air.set_flow_rate(MassRate::default());
        self.internal_air
            .set_pressure(self.internal_air.pressure() + pressure_change);
    }

    fn initialize_cabin_pressure(
        &mut self,
        context: &UpdateContext,
        lgciu_gear_compressed: bool,
    ) -> Pressure {
        if lgciu_gear_compressed {
            context.ambient_pressure()
        } else {
            // Formula to simulate pressure start state if starting in flight
            let ambient_pressure: f64 = context.ambient_pressure().get::<hectopascal>();
            self.previous_exterior_pressure =
                BoundedVecDeque::from_iter(vec![context.ambient_pressure(); 20], 20);
            Pressure::new::<hectopascal>(
                -0.0002 * ambient_pressure.powf(2.) + 0.5463 * ambient_pressure + 658.85,
            )
        }
    }

    fn initialize_cabin_temperature(
        &mut self,
        context: &UpdateContext,
        lgciu_gear_compressed: bool,
    ) -> ThermodynamicTemperature {
        if lgciu_gear_compressed {
            // If the aircraft is on the ground the cabin starts at the same temperature as ambient
            self.command_cabin_temperature(context.ambient_temperature());
            context.ambient_temperature()
        } else {
            // If the aircraft is flying we assume the temperature has been stabilized at 24 degrees
            self.command_cabin_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
            ThermodynamicTemperature::new::<degree_celsius>(24.)
        }
    }

    fn flow_rate_per_cubic_meter(&self) -> MassRate {
        self.air_in.flow_rate()
            / (C::COCKPIT_VOLUME_CUBIC_METER
                + C::CABIN_ZONE_VOLUME_CUBIC_METER
                    * self
                        .cabin_zones
                        .iter()
                        .filter(|zone| matches!(&zone.zone_id(), &ZoneType::Cabin(_)))
                        .count() as f64
                + C::FWD_CARGO_ZONE_VOLUME_CUBIC_METER
                    * self
                        .cabin_zones
                        .iter()
                        .any(|zone| matches!(&zone.zone_id(), &ZoneType::Cargo(1)))
                        as usize as f64)
        // The bulk cargo is fed with air from the cabin
    }

    fn flow_rate_determination(&self, vcm_shared: &impl VcmShared) -> Vec<MassRate> {
        let mut flow_rate_per_cubic_meter = Vec::new();
        for zone in self.cabin_zones.iter() {
            flow_rate_per_cubic_meter.push(
                if matches!(zone.zone_id(), ZoneType::Cargo(1))
                    && !vcm_shared.fwd_extraction_fan_is_on()
                    || matches!(zone.zone_id(), ZoneType::Cargo(2))
                        && !vcm_shared.bulk_extraction_fan_is_on()
                {
                    MassRate::default()
                } else {
                    self.flow_rate_per_cubic_meter()
                },
            )
        }
        flow_rate_per_cubic_meter
    }

    fn calculate_cabin_flow_in(&self, context: &UpdateContext, flow_in: MassRate) -> MassRate {
        // Placeholder until packs are modelled to prevent sudden changes in flow
        const INTERNAL_FLOW_RATE_CHANGE: f64 = 0.1;

        let rate_of_change_for_delta = MassRate::new::<kilogram_per_second>(
            INTERNAL_FLOW_RATE_CHANGE * context.delta_as_secs_f64(),
        );

        if flow_in > self.air_in.flow_rate() {
            self.air_in.flow_rate()
                + rate_of_change_for_delta.min(flow_in - self.air_in.flow_rate())
        } else if flow_in < self.air_in.flow_rate() {
            self.air_in.flow_rate()
                - rate_of_change_for_delta.min(self.air_in.flow_rate() - flow_in)
        } else {
            flow_in
        }
    }

    fn exterior_pressure_low_pass_filter(&mut self, context: &UpdateContext) -> Pressure {
        self.previous_exterior_pressure.pop_front();
        self.previous_exterior_pressure
            .push_back(context.ambient_pressure());

        self.previous_exterior_pressure.iter().average()
    }

    fn flow_in_low_pass_filter(&mut self, unfiltered_flow_in: MassRate) -> MassRate {
        // Too avoid high frequency airflow changes due to pneumatic updating at different rates
        self.previous_flow_in.pop_front();
        self.previous_flow_in.push_back(unfiltered_flow_in);

        self.previous_flow_in.iter().average()
    }

    fn flow_coefficient_calculation(&self, pressure_ratio: f64) -> f64 {
        const STABILITY_COEFFICIENT: f64 = 2.5e5;
        const STABILITY_MARGIN: f64 = 2e-3;

        let flow_direction: f64 = if pressure_ratio > 1. { -1. } else { 1. };

        // To avoid instability close to rp = 1
        if (pressure_ratio - 1.).abs() >= STABILITY_MARGIN {
            flow_direction
        } else {
            flow_direction
                * (STABILITY_COEFFICIENT * pressure_ratio.pow(2.)
                    - 2. * STABILITY_COEFFICIENT * pressure_ratio
                    + STABILITY_COEFFICIENT)
        }
    }

    fn supersonic_flow_out_calculation(&self) -> MassRate {
        const Z_VALUE_FOR_PR_UNDER_053: f64 = 0.256;

        let airflow_per_unit_area = (2.
            * (Air::GAMMA / (Air::GAMMA - 1.))
            * self
                .internal_air
                .density()
                .get::<kilogram_per_cubic_meter>()
            * self.internal_air.pressure().get::<pascal>()
            * Z_VALUE_FOR_PR_UNDER_053)
            .sqrt();
        MassRate::new::<kilogram_per_second>(airflow_per_unit_area)
    }

    fn subsonic_flow_out_calculation(&self) -> MassRate {
        MassRate::new::<kilogram_per_second>(
            self.internal_air
                .density()
                .get::<kilogram_per_cubic_meter>()
                * (2.
                    * (self.internal_air.pressure().get::<pascal>()
                        - self.filtered_exterior_pressure.get::<pascal>())
                    .abs()
                    / self
                        .internal_air
                        .density()
                        .get::<kilogram_per_cubic_meter>())
                .sqrt(),
        )
    }

    fn calculate_cabin_flow_out(
        &self,
        outflow_valve_open_amount: Ratio,
        safety_valve_open_amount: Ratio,
        number_of_open_doors: u8,
    ) -> MassRate {
        const TRANSONIC_PR_VALUE: f64 = 0.53;

        let outflow_valve_area = C::OUTFLOW_VALVE_SIZE * outflow_valve_open_amount.get::<ratio>(); // sq m
        let leakage_area = C::CABIN_LEAKAGE_AREA
            + C::SAFETY_VALVE_SIZE * safety_valve_open_amount.get::<ratio>()
            + number_of_open_doors as f64 * C::DOOR_OPENING_AREA
            + C::HULL_BREACH_AREA * self.hull_breach.is_active() as u32 as f64; // sq m

        let pressure_ratio =
            (self.filtered_exterior_pressure / self.internal_air.pressure()).get::<ratio>();

        let flow_coefficient = self.flow_coefficient_calculation(pressure_ratio);

        if pressure_ratio < TRANSONIC_PR_VALUE {
            flow_coefficient
                * (outflow_valve_area + leakage_area)
                * self.supersonic_flow_out_calculation()
        } else {
            flow_coefficient
                * (outflow_valve_area + leakage_area)
                * self.subsonic_flow_out_calculation()
        }
    }

    /// Mass balance calculation to determine pressure differential
    fn calculate_pressure_change(&self, mass_change: f64, temperature_change: f64) -> Pressure {
        let pressure_change_mass =
            mass_change * self.internal_air.temperature().get::<kelvin>() * Air::R
                / C::PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER;
        let pressure_change_temperature = self
            .internal_air
            .density()
            .get::<kilogram_per_cubic_meter>()
            * Air::R
            * temperature_change;

        Pressure::new::<pascal>(pressure_change_mass + pressure_change_temperature)
    }

    pub fn command_cabin_temperature(&mut self, temperature: ThermodynamicTemperature) {
        self.cabin_zones
            .iter_mut()
            .for_each(|zone| zone.set_zone_air_temperature(temperature));
    }
}

impl<C: PressurizationConstants, const ZONES: usize> CabinSimulation
    for CabinAirSimulation<C, ZONES>
{
    fn cabin_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.cabin_zones
            .iter()
            .flat_map(|zone| zone.cabin_temperature())
            .collect()
    }

    fn exterior_pressure(&self) -> Pressure {
        self.filtered_exterior_pressure
    }
    fn cabin_pressure(&self) -> Pressure {
        self.internal_air.pressure()
    }
}

impl<C: PressurizationConstants, const ZONES: usize> SimulationElement
    for CabinAirSimulation<C, ZONES>
{
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.cabin_zones, visitor);
        self.hull_breach.accept(visitor);

        visitor.visit(self);
    }
}

pub struct CabinZone<C> {
    zone_identifier: VariableIdentifier,

    zone_id: ZoneType,
    zone_air: ZoneAir,
    zone_volume: Volume,
    passengers: u8,

    constants: PhantomData<C>,
}

impl<C: PressurizationConstants> CabinZone<C> {
    pub fn new(context: &mut InitContext, zone_id: &ZoneType) -> Self {
        let (passengers, zone_volume) = match *zone_id {
            ZoneType::Cockpit => (2, Volume::new::<cubic_meter>(C::COCKPIT_VOLUME_CUBIC_METER)),
            ZoneType::Cabin(_) => (
                0,
                Volume::new::<cubic_meter>(C::CABIN_ZONE_VOLUME_CUBIC_METER),
            ),
            ZoneType::Cargo(1) => (
                0,
                Volume::new::<cubic_meter>(C::FWD_CARGO_ZONE_VOLUME_CUBIC_METER),
            ),
            ZoneType::Cargo(2) => (
                0,
                Volume::new::<cubic_meter>(C::BULK_CARGO_ZONE_VOLUME_CUBIC_METER),
            ),
            _ => panic!("Something went wrong with assigning volume to zone"),
        };

        Self {
            zone_identifier: context.get_identifier(format!("COND_{}_TEMP", zone_id)),

            zone_id: *zone_id,
            zone_air: ZoneAir::new(),
            zone_volume,
            passengers,

            constants: PhantomData,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        duct_temperature: &impl DuctTemperature,
        pack_flow_per_cubic_meter: MassRate,
        cabin_pressure: Pressure,
        passengers: u8,
        number_of_open_doors: u8,
    ) {
        let mut air_in = Air::new();
        air_in.set_temperature(duct_temperature.duct_temperature()[self.zone_id.id()]);
        air_in.set_flow_rate(pack_flow_per_cubic_meter * self.zone_volume.get::<cubic_meter>());
        self.passengers = passengers;

        self.zone_air.update(
            context,
            &air_in,
            self.zone_volume,
            self.passengers,
            number_of_open_doors,
            cabin_pressure,
        );
    }

    fn zone_id(&self) -> ZoneType {
        self.zone_id
    }

    fn set_zone_air_temperature(&mut self, temperature: ThermodynamicTemperature) {
        self.zone_air.set_zone_air_temperature(temperature);
    }

    pub fn zone_air_temperature(&self) -> ThermodynamicTemperature {
        self.zone_air.zone_air_temperature()
    }
}

impl<C: PressurizationConstants> CabinSimulation for CabinZone<C> {
    fn cabin_temperature(&self) -> Vec<ThermodynamicTemperature> {
        vec![self.zone_air.zone_air_temperature()]
    }
}

impl<C: PressurizationConstants> SimulationElement for CabinZone<C> {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.zone_identifier, self.zone_air_temperature());
    }
}

struct ZoneAir {
    flow_out: Air,
    internal_air: Air,
}

impl ZoneAir {
    const A320_CABIN_DIAMETER_METER: f64 = 4.14; // m
    const FLOW_RATE_THROUGH_OPEN_DOOR_KG_PER_SECOND: f64 = 0.6; // kg/s
    const CONVECTION_COEFFICIENT_CONSTANT_FOR_NATURAL_CONVECTION: f64 = 1.32;
    const FIBER_GLASS_BLANKET_THERMAL_CONDUCTIVITY: f64 = 25.; // m*W/m*C
    const FIBER_GLASS_BLANKET_THICKNESS_METER: f64 = 0.2; // m
    const ALUMINIUM_ALLOY_THERMAL_CONDUCTIVITY: f64 = 177.; // m*W/m*C
    const ALUMINIUM_ALLOY_THICKNESS_METER: f64 = 0.005; // m
    const CONVECTION_COEFFICIENT_FOR_CLOTHED_BODY: f64 = 3.1; // W/m2*C
    const HUMAN_BODY_RADIATION_COEFFICIENT: f64 = 4.7; // W/m2*c
    const CLOTHED_AREA_OF_AVERAGE_HUMAN_METER: f64 = 1.8; // m2
    const HUMAN_LUNG_TIDAL_VOLUME_PER_SECOND_METER: f64 = 0.0001; // m3/s
    const HUMAN_EXHALE_AIR_TEMPERATURE_CELSIUS: f64 = 35.; // C

    fn new() -> Self {
        Self {
            flow_out: Air::new(),
            internal_air: Air::new(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        air_in: &Air,
        zone_volume: Volume,
        zone_passengers: u8,
        number_of_open_doors: u8,
        cabin_pressure: Pressure,
    ) {
        self.internal_air.set_pressure(cabin_pressure);

        let new_equilibrium_temperature = self.equilibrium_temperature_calculation(
            context,
            number_of_open_doors,
            air_in,
            zone_volume,
            zone_passengers,
        );
        self.internal_air
            .set_temperature(new_equilibrium_temperature);
        self.flow_out.set_temperature(new_equilibrium_temperature);
        self.flow_out.set_flow_rate(air_in.flow_rate());
    }

    /// Energy balance calculation to determine equilibrium temperature in the cabin
    fn equilibrium_temperature_calculation(
        &self,
        context: &UpdateContext,
        number_of_open_doors: u8,
        air_in: &Air,
        zone_volume: Volume,
        zone_passengers: u8,
    ) -> ThermodynamicTemperature {
        let inlet_air_energy = air_in.flow_rate().get::<kilogram_per_second>()
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * air_in.temperature().get::<kelvin>();
        let mut inlet_door_air_energy = number_of_open_doors as f64
            * (Self::FLOW_RATE_THROUGH_OPEN_DOOR_KG_PER_SECOND)
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * context.ambient_temperature().get::<kelvin>();
        let outlet_air_energy = self.flow_out.flow_rate().get::<kilogram_per_second>()
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * self.flow_out.temperature().get::<kelvin>();
        let mut outlet_door_air_energy = number_of_open_doors as f64
            * (Self::FLOW_RATE_THROUGH_OPEN_DOOR_KG_PER_SECOND)
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * self.internal_air.temperature().get::<kelvin>();
        let passenger_heat_energy =
            self.human_body_heat_calculation().get::<kilowatt>() * (zone_passengers as f64);
        let wall_transfer_heat_energy = self
            .heat_transfer_through_wall_calculation(context, zone_volume)
            .get::<kilowatt>();
        // For the cockpit we reduce the effect of opening doors to 20%
        if zone_volume < Volume::new::<cubic_meter>(20.) {
            inlet_door_air_energy *= 0.2;
            outlet_door_air_energy *= 0.2;
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
        zone_volume: Volume,
    ) -> Power {
        let external_convection_coefficient: f64 =
            if context.true_airspeed() < Velocity::new::<meter_per_second>(15.) {
                self.natural_convection_coefficient_calculation(context)
            } else {
                self.forced_convection_coefficient_calculation(context, zone_volume)
            };
        let internal_convection_coefficient: f64 =
            self.natural_convection_coefficient_calculation(context);
        let wall_specific_heat_transfer: f64 = (self.internal_air.temperature().get::<kelvin>()
            - self.film_temperature_calculation(context).get::<kelvin>())
            / (1. / internal_convection_coefficient
                + Self::FIBER_GLASS_BLANKET_THICKNESS_METER
                    / Self::FIBER_GLASS_BLANKET_THERMAL_CONDUCTIVITY
                + Self::ALUMINIUM_ALLOY_THICKNESS_METER
                    / Self::ALUMINIUM_ALLOY_THERMAL_CONDUCTIVITY
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
            - self.film_temperature_calculation(context).get::<kelvin>(); // Kelvin

        // Convection coefficient for horizontal cylinder in air
        let convection_coefficient: f64 =
            Self::CONVECTION_COEFFICIENT_CONSTANT_FOR_NATURAL_CONVECTION
                * (temperature_differential.abs() / Self::A320_CABIN_DIAMETER_METER).powf(1. / 4.);
        convection_coefficient
    }

    fn forced_convection_coefficient_calculation(
        &self,
        context: &UpdateContext,
        zone_volume: Volume,
    ) -> f64 {
        let characteristic_length = self
            .characteristic_length_calculation(zone_volume)
            .get::<meter>();
        let reynolds_number = self.reynolds_number_calculation(context, zone_volume);
        // Nusselt calculation for turbulent flow
        let nusselt_number: f64 =
            Air::PRANDT_NUMBER.powf(1. / 3.) * (0.037 * reynolds_number.powf(0.8) - 850.);

        let convection_coefficient: f64 = nusselt_number * Air::K / characteristic_length;
        convection_coefficient
    }

    fn reynolds_number_calculation(&self, context: &UpdateContext, zone_volume: Volume) -> f64 {
        let characteristic_length = self
            .characteristic_length_calculation(zone_volume)
            .get::<meter>();
        let reynolds_number: f64 = (self
            .external_density_calculation(context)
            .get::<kilogram_per_cubic_meter>()
            * context.true_airspeed().get::<meter_per_second>()
            * characteristic_length)
            / Air::MU;
        reynolds_number
    }

    fn external_density_calculation(&self, context: &UpdateContext) -> MassDensity {
        // Ideal gas law
        let rho = context.ambient_pressure().get::<pascal>()
            / (Air::R * self.film_temperature_calculation(context).get::<kelvin>());
        MassDensity::new::<kilogram_per_cubic_meter>(rho)
    }

    fn characteristic_length_calculation(&self, zone_volume: Volume) -> Length {
        let characteristic_length: f64 = zone_volume.get::<cubic_meter>()
            / (std::f64::consts::PI * (Self::A320_CABIN_DIAMETER_METER / 2.).powf(2.));
        Length::new::<meter>(characteristic_length)
    }

    fn film_temperature_calculation(&self, context: &UpdateContext) -> ThermodynamicTemperature {
        // Boundary layer film temperature - approximation, this should be done with wall temperature
        if context.true_airspeed() < Velocity::new::<meter_per_second>(15.) {
            context.ambient_temperature()
        } else {
            ThermodynamicTemperature::new::<kelvin>(
                (self.internal_air.temperature().get::<kelvin>()
                    + context.ambient_temperature().get::<kelvin>())
                    / 2.,
            )
        }
    }

    fn set_zone_air_temperature(&mut self, temperature: ThermodynamicTemperature) {
        self.internal_air.set_temperature(temperature);
    }

    fn zone_air_temperature(&self) -> ThermodynamicTemperature {
        self.internal_air.temperature()
    }

    fn human_body_heat_calculation(&self) -> Power {
        // Simplified from: https://engineer-educators.com/topic/3-heat-transfer-from-the-human-body/
        // Aproximation of clothes temperature based on external temperature
        let clothes_temperature =
            0.714 * self.internal_air.temperature().get::<degree_celsius>() + 10.;
        let convection_heat_loss_skin: f64 = Self::CONVECTION_COEFFICIENT_FOR_CLOTHED_BODY
            * Self::CLOTHED_AREA_OF_AVERAGE_HUMAN_METER
            * (clothes_temperature - self.internal_air.temperature().get::<degree_celsius>());
        let radiation_heat_loss_skin: f64 = Self::HUMAN_BODY_RADIATION_COEFFICIENT
            * Self::CLOTHED_AREA_OF_AVERAGE_HUMAN_METER
            * (clothes_temperature - self.internal_air.temperature().get::<degree_celsius>()).abs();

        let lung_heat_loss: f64 = Self::HUMAN_LUNG_TIDAL_VOLUME_PER_SECOND_METER
            * Air::SPECIFIC_HEAT_CAPACITY_PRESSURE
            * 1000.
            * (Self::HUMAN_EXHALE_AIR_TEMPERATURE_CELSIUS
                - self.internal_air.temperature().get::<degree_celsius>());

        let human_heat_loss = convection_heat_loss_skin + radiation_heat_loss_skin + lung_heat_loss;
        Power::new::<watt>(human_heat_loss)
    }
}

#[cfg(test)]
mod cabin_air_tests {
    use super::*;
    use crate::{
        air_conditioning::PackFlow,
        shared::InternationalStandardAtmosphere,
        simulation::{
            test::{SimulationTestBed, TestBed, WriteByName},
            Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };
    use std::time::Duration;
    use uom::si::{
        length::foot,
        pressure::{hectopascal, psi},
        thermodynamic_temperature::degree_celsius,
    };

    struct TestAirConditioningSystem {
        duct_demand_temperature: ThermodynamicTemperature,
        pack_flow: MassRate,
    }

    impl TestAirConditioningSystem {
        fn new() -> Self {
            Self {
                duct_demand_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
                pack_flow: MassRate::default(),
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
        fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
            let mut duct_temperature: Vec<ThermodynamicTemperature> = Vec::new();
            // We push a 2 len element to simulate the cockpit so the indices match the final model
            let mut cabin_duct_temperatures = vec![
                ThermodynamicTemperature::new::<degree_celsius>(24.),
                self.duct_demand_temperature,
            ];
            duct_temperature.append(&mut cabin_duct_temperatures);
            duct_temperature
        }
    }

    impl PackFlow for TestAirConditioningSystem {
        fn pack_flow(&self) -> MassRate {
            self.pack_flow
        }
    }

    impl OutletAir for TestAirConditioningSystem {
        fn outlet_air(&self) -> Air {
            let mut outlet_air = Air::new();
            outlet_air.set_flow_rate(self.pack_flow);
            outlet_air.set_pressure(Pressure::new::<psi>(16.));
            outlet_air
        }
    }

    impl VcmShared for TestAirConditioningSystem {}

    struct TestConstants;

    impl PressurizationConstants for TestConstants {
        const CABIN_ZONE_VOLUME_CUBIC_METER: f64 = 139.; // m3
        const COCKPIT_VOLUME_CUBIC_METER: f64 = 9.; // m3
        const FWD_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 89.4; // m3
        const BULK_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 14.3; // m3
        const PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER: f64 = 330.; // m3
        const CABIN_LEAKAGE_AREA: f64 = 0.0003; // m2
        const OUTFLOW_VALVE_SIZE: f64 = 0.05; // m2
        const SAFETY_VALVE_SIZE: f64 = 0.02; //m2
        const DOOR_OPENING_AREA: f64 = 1.5; // m2
        const HULL_BREACH_AREA: f64 = 0.02; // m2

        const MAX_CLIMB_RATE: f64 = 750.; // fpm
        const MAX_CLIMB_RATE_IN_DESCENT: f64 = 500.; // fpm
        const MAX_DESCENT_RATE: f64 = -750.; // fpm
        const MAX_ABORT_DESCENT_RATE: f64 = -500.; //fpm
        const MAX_TAKEOFF_DELTA_P: f64 = 0.1; // PSI
        const MAX_CLIMB_DELTA_P: f64 = 8.06; // PSI
        const MAX_CLIMB_CABIN_ALTITUDE: f64 = 8050.; // feet
        const MAX_SAFETY_DELTA_P: f64 = 8.1; // PSI
        const MIN_SAFETY_DELTA_P: f64 = -0.5; // PSI
        const TAKEOFF_RATE: f64 = -400.;
        const DEPRESS_RATE: f64 = 500.;
        const EXCESSIVE_ALT_WARNING: f64 = 9550.; // feet
        const EXCESSIVE_RESIDUAL_PRESSURE_WARNING: f64 = 0.03; // PSI
        const LOW_DIFFERENTIAL_PRESSURE_WARNING: f64 = 1.45; // PSI
    }

    struct TestAircraft {
        air_conditioning_system: TestAirConditioningSystem,

        number_of_passengers: u8,
        cabin_air_simulation: CabinAirSimulation<TestConstants, 2>,
        lgciu_gears_compressed: bool,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                air_conditioning_system: TestAirConditioningSystem::new(),

                number_of_passengers: 0,
                cabin_air_simulation: CabinAirSimulation::new(
                    context,
                    &[ZoneType::Cockpit, ZoneType::Cabin(1)],
                ),
                lgciu_gears_compressed: true,
            }
        }

        fn set_air_in_temperature(&mut self, temperature: ThermodynamicTemperature) {
            self.air_conditioning_system
                .set_duct_demand_temperature(temperature);
        }

        fn set_air_in_flow_rate(&mut self, flow_rate: MassRate) {
            self.air_conditioning_system.set_pack_flow(flow_rate);
        }

        fn set_passengers(&mut self, passengers: u8) {
            self.number_of_passengers = passengers;
        }

        fn set_in_the_air(&mut self, in_the_air: bool) {
            self.lgciu_gears_compressed = !in_the_air;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.cabin_air_simulation.update(
                context,
                &self.air_conditioning_system,
                Ratio::default(),
                Ratio::default(),
                self.lgciu_gears_compressed,
                [2, self.number_of_passengers],
                0u8,
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.cabin_air_simulation.accept(visitor);

            visitor.visit(self);
        }
    }

    struct CabinZoneTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
        stored_temperature: Option<ThermodynamicTemperature>,
    }
    impl CabinZoneTestBed {
        fn new() -> Self {
            let mut test_bed = CabinZoneTestBed {
                test_bed: SimulationTestBed::new(TestAircraft::new),
                stored_temperature: None,
            };
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
            test_bed = test_bed.true_airspeed_of(Velocity::default());

            test_bed
        }

        fn and(self) -> Self {
            self
        }

        fn then(self) -> Self {
            self
        }

        fn with_flow(mut self) -> Self {
            self.command(|a| a.set_air_in_flow_rate(MassRate::new::<kilogram_per_second>(1.3)));
            self
        }

        fn with_passengers(mut self) -> Self {
            self = self.passengers(174 / 2);
            self
        }

        fn passengers(mut self, pax_quantity: u8) -> Self {
            self.command(|a| a.set_passengers(pax_quantity));
            self
        }

        fn air_in_temperature_of(mut self, temperature: ThermodynamicTemperature) -> Self {
            self.command(|a| a.set_air_in_temperature(temperature));
            self
        }

        fn air_in_flow_rate_of(mut self, flow_rate: MassRate) -> Self {
            self.command(|a| a.set_air_in_flow_rate(flow_rate));
            self
        }

        fn true_airspeed_of(mut self, speed: Velocity) -> Self {
            self.write_by_name("AIRSPEED TRUE", speed);
            self
        }

        fn ambient_temperature_of(mut self, temperature: ThermodynamicTemperature) -> Self {
            self.set_ambient_temperature(temperature);
            self
        }

        fn ambient_pressure_of(mut self, pressure: Pressure) -> Self {
            self.set_ambient_pressure(pressure);
            self
        }

        fn flying(mut self, is_flying: bool) -> Self {
            self.command(|a| a.set_in_the_air(is_flying));
            self
        }

        fn cabin_pressure(&self) -> Pressure {
            self.query(|a| a.cabin_air_simulation.cabin_pressure())
        }

        fn cabin_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| a.cabin_air_simulation.cabin_temperature()[1])
        }

        fn memorize_cabin_temperature(mut self) -> Self {
            self.stored_temperature = Some(self.cabin_temperature());
            self
        }

        fn initial_temperature(&self) -> ThermodynamicTemperature {
            self.stored_temperature.unwrap()
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

    fn test_bed_with() -> CabinZoneTestBed {
        CabinZoneTestBed::new()
    }

    #[test]
    fn cabin_air_starts_at_exterior_temperature() {
        let test_bed = test_bed_with()
            .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(10.))
            .iterate(1);

        assert!((test_bed.cabin_temperature().get::<degree_celsius>() - 10.) < 1.);
    }

    #[test]
    fn cabin_pressure_initialises_correctly() {
        let test_bed = test_bed_with()
            .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(-50.))
            .ambient_pressure_of(InternationalStandardAtmosphere::pressure_at_altitude(
                Length::new::<foot>(39000.),
            ))
            .flying(true)
            .iterate(1);

        assert!(
            (test_bed.cabin_pressure()
                - InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                    8000.
                )))
            .get::<hectopascal>()
            .abs()
                < 50.
        );
    }

    #[test]
    fn cabin_air_warms_up_with_pax_and_no_ac() {
        let test_bed = test_bed_with()
            .passengers(174 / 2)
            .then()
            .memorize_cabin_temperature()
            .iterate(20);

        assert!(test_bed.initial_temperature() < test_bed.cabin_temperature());
    }

    #[test]
    fn cabin_air_cools_with_ac_low() {
        let test_bed = test_bed()
            .with_flow()
            .iterate(10)
            .memorize_cabin_temperature()
            .then()
            .air_in_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(4.))
            .iterate(80);

        assert!(test_bed.initial_temperature() > test_bed.cabin_temperature());
    }

    #[test]
    fn cabin_air_reaches_equilibrium_temperature() {
        let mut test_bed = test_bed()
            .with_flow()
            .and()
            .with_passengers()
            .then()
            .memorize_cabin_temperature()
            .and()
            .iterate(1);

        let initial_temp_diff = test_bed.cabin_temperature().get::<degree_celsius>()
            - test_bed.initial_temperature().get::<degree_celsius>();

        test_bed = test_bed
            .iterate_with_delta(100, Duration::from_secs(10))
            .memorize_cabin_temperature()
            .and()
            .iterate(1);

        let final_temp_diff = test_bed.cabin_temperature().get::<degree_celsius>()
            - test_bed.initial_temperature().get::<degree_celsius>();

        assert!(initial_temp_diff > final_temp_diff);
    }

    #[test]
    fn reducing_passengers_reduces_cabin_temperature() {
        let test_bed = test_bed()
            .with_flow()
            .and()
            .with_passengers()
            .and()
            .air_in_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(8.))
            .iterate(500)
            .memorize_cabin_temperature()
            .then()
            .passengers(10)
            .iterate(100);

        assert!(test_bed.initial_temperature() > test_bed.cabin_temperature());
    }

    #[test]
    fn temperature_stays_stable_with_no_flow_and_no_passengers() {
        let test_bed = test_bed_with()
            .air_in_flow_rate_of(MassRate::default())
            .memorize_cabin_temperature()
            .then()
            .iterate_with_delta(100, Duration::from_secs(10));

        assert!(
            (test_bed.initial_temperature().get::<degree_celsius>()
                - test_bed.cabin_temperature().get::<degree_celsius>())
            .abs()
                < 1.
        );
    }

    #[test]
    fn reducing_ambient_temperature_reduces_cabin_temperature() {
        let test_bed = test_bed_with()
            .air_in_flow_rate_of(MassRate::default())
            .memorize_cabin_temperature()
            .then()
            .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(0.))
            .iterate_with_delta(100, Duration::from_secs(10));

        assert!(test_bed.initial_temperature() > test_bed.cabin_temperature());
    }

    #[test]
    fn increasing_ambient_temperature_increases_cabin_temperature() {
        let test_bed = test_bed_with()
            .air_in_flow_rate_of(MassRate::default())
            .memorize_cabin_temperature()
            .then()
            .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(45.))
            .iterate_with_delta(100, Duration::from_secs(10));

        assert!(test_bed.initial_temperature() < test_bed.cabin_temperature());
    }

    #[test]
    fn more_heat_is_dissipated_in_flight() {
        let test_bed = test_bed_with()
            .air_in_flow_rate_of(MassRate::default())
            .iterate(1)
            .then()
            .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(0.))
            .memorize_cabin_temperature()
            .and()
            .iterate_with_delta(100, Duration::from_secs(10));

        let first_temperature_differential = test_bed.initial_temperature().get::<degree_celsius>()
            - test_bed.cabin_temperature().get::<degree_celsius>();

        let test_bed = test_bed_with()
            .air_in_flow_rate_of(MassRate::default())
            .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(0.))
            .and()
            .true_airspeed_of(Velocity::new::<meter_per_second>(130.))
            .memorize_cabin_temperature()
            .and()
            .iterate_with_delta(100, Duration::from_secs(10));

        let second_temperature_differential =
            test_bed.initial_temperature().get::<degree_celsius>()
                - test_bed.cabin_temperature().get::<degree_celsius>();

        assert!(first_temperature_differential < second_temperature_differential);
    }
}
