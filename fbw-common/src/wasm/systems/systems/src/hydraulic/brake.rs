use crate::{
    shared::{ConsumePower, ControllerSignal, ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};
use std::{f64::consts::PI, time::Duration};
use uom::si::{
    angular_velocity::revolution_per_minute,
    area::square_meter,
    energy::joule,
    f64::{
        AngularVelocity, Area, Energy, HeatCapacity, Length, Mass, Power, Pressure,
        SpecificHeatCapacity, TemperatureInterval, ThermodynamicTemperature,
    },
    power::watt,
    specific_heat_capacity::joule_per_kilogram_kelvin,
    temperature_interval::kelvin,
    thermodynamic_temperature::{self, degree_celsius},
    velocity::meter_per_second,
};

pub struct BrakeAssembly<const N: usize> {
    wheel_speed_id: VariableIdentifier,
    wheel_speed: AngularVelocity,
    brakes: [Brake; N],
    brake_probes: [BrakeProbe; N],
    brake_fans: Option<[BrakeFan; N]>,
}
impl<const N: usize> BrakeAssembly<N> {
    /// Creates a new brake assembly
    /// ## Parameters
    /// `wheel_speed_variable_name` - the simvar to be used for the rotational velocity of the tyres
    pub fn new(
        context: &mut InitContext,
        wheel_speed_variable_name: String,
        indices: [usize; N],
        sensors_powered_by: [ElectricalBusType; N],
        brake_fan_bus: Option<ElectricalBusType>,
    ) -> Self {
        let brakes = indices.map(|index| Brake::new(context, index));
        let brake_probes = sensors_powered_by.map(BrakeProbe::new);
        let brake_fans = brake_fan_bus.map(|bus| {
            brakes
                .iter()
                .map(|_| BrakeFan::new(bus))
                .collect::<Vec<_>>()
                .try_into()
                .unwrap()
        });
        Self {
            wheel_speed_id: context.get_identifier(wheel_speed_variable_name),
            wheel_speed: AngularVelocity::default(),
            brakes,
            brake_probes,
            brake_fans,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        brake_properties: &BrakeProperties,
        actuator_pressure: Pressure,
        brake_fan_should_be_on: bool,
        gear_extended_phys: bool,
    ) {
        // For some reason the wheels do rotate a bit even when the plane is not moving.
        let passed_length = if self.wheel_speed.get::<revolution_per_minute>() > 1e-1 {
            brake_properties.get_passed_length(context, self.wheel_speed)
        } else {
            Length::default()
        };

        let brake_fan_are_running = if let Some(brake_fans) = &mut self.brake_fans {
            let mut brake_fan_on = [false; N];
            for (brake_fan, brake_fan_on) in brake_fans.iter_mut().zip(&mut brake_fan_on) {
                brake_fan.update(brake_fan_should_be_on);
                *brake_fan_on = brake_fan.is_running();
            }
            brake_fan_on
        } else {
            [false; N]
        };

        for ((brake, brake_probe), brake_fan_is_running) in self
            .brakes
            .iter_mut()
            .zip(&mut self.brake_probes)
            .zip(brake_fan_are_running)
        {
            brake.update(
                context,
                brake_properties,
                passed_length,
                actuator_pressure,
                brake_fan_is_running,
                gear_extended_phys,
            );
            brake_probe.update(context, brake, brake_fan_is_running)
        }
    }

    pub fn brake_temperature_sensors(
        &self,
    ) -> &[impl ControllerSignal<ThermodynamicTemperature>; N] {
        &self.brake_probes
    }
}
impl<const N: usize> SimulationElement for BrakeAssembly<N> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.brakes, visitor);
        accept_iterable!(self.brake_probes, visitor);
        if let Some(brake_fans) = &mut self.brake_fans {
            accept_iterable!(brake_fans, visitor);
        }

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.wheel_speed = reader.read(&self.wheel_speed_id);
    }
}

pub struct BrakeProperties {
    brake_radius: Length,
    surface_area: Area,
    heat_capacity: HeatCapacity,
}
impl BrakeProperties {
    /// Specific heat capacity of a carbon brake
    const BRAKE_SPECIFIC_HEAT_CAPACITY: f64 = 1420.; // J/kg*K

    pub fn new(brake_radius: Length, brake_width: Length, mass: Mass) -> Self {
        Self {
            brake_radius,
            surface_area: 2. * PI * brake_radius * brake_width,
            heat_capacity: mass
                * SpecificHeatCapacity::new::<joule_per_kilogram_kelvin>(
                    Self::BRAKE_SPECIFIC_HEAT_CAPACITY,
                ),
        }
    }

    fn get_passed_length(&self, context: &UpdateContext, wheel_speed: AngularVelocity) -> Length {
        let brake_speed = wheel_speed * self.brake_radius;
        brake_speed * context.delta_as_time()
    }

    fn surface_area(&self) -> Area {
        self.surface_area
    }

    fn heat_capacity(&self) -> HeatCapacity {
        self.heat_capacity
    }
}

/// Simulates a carbon brake (C/C composite)
struct Brake {
    temperature_id: VariableIdentifier,
    temperature: ThermodynamicTemperature,
    initialized: bool,
}
impl Brake {
    // Sources for values:
    // https://www.researchgate.net/figure/Mechanical-and-thermal-properties-of-different-brake-disc-materials-4_tbl1_337482105
    // https://www.researchgate.net/figure/Properties-of-three-disc-rotor-materials_tbl1_312116210

    const BRAKE_ACTUATOR_AREA: f64 = 0.0056; // m^2
    const HEAT_DISIPATION: f64 = 20.; // W/K
    const BRAKE_FAN_COOLDOWN_FACTOR: f64 = 4.;
    const GEAR_COOLDOWN_FACTOR: f64 = 0.0055;
    const BRAKE_EMISSIVITY: f64 = 0.71;
    const BOLTZMANN_CONSTANT: f64 = 5.670374419e-8; // W*m^−2*K^-4

    fn new(context: &mut InitContext, index: usize) -> Self {
        Self {
            temperature_id: context.get_identifier(format!("BRAKE_TEMPERATURE_{index}")),
            temperature: ThermodynamicTemperature::default(),
            initialized: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        brake_properties: &BrakeProperties,
        passed_length: Length,
        actuator_pressure: Pressure,
        brake_fan_on: bool,
        gear_extended_phys: bool,
    ) {
        if !self.initialized {
            self.temperature = context.ambient_temperature();
            self.initialized = true;
        }

        // Heat up process
        let actuator_area = Area::new::<square_meter>(Self::BRAKE_ACTUATOR_AREA);
        let force = actuator_pressure * actuator_area;
        let energy = force * passed_length;
        let delta = energy / brake_properties.heat_capacity();
        self.temperature += delta;

        // Cool down process
        let radiated_energy =
            Self::calculate_radiated_energy(context.delta(), brake_properties, self.temperature)
                - Self::calculate_radiated_energy(
                    context.delta(),
                    brake_properties,
                    context.ambient_temperature(),
                );
        let brake_fan_factor = if brake_fan_on {
            Self::BRAKE_FAN_COOLDOWN_FACTOR
        } else {
            1.
        };
        let gear_factor = if gear_extended_phys {
            context.indicated_airspeed().get::<meter_per_second>() * Self::GEAR_COOLDOWN_FACTOR
        } else {
            1.
        };
        let delta_ambient = self.temperature.get::<degree_celsius>()
            - context.ambient_temperature().get::<degree_celsius>();
        let energy = radiated_energy
            + Energy::new::<joule>(
                Self::HEAT_DISIPATION
                    * brake_fan_factor
                    * gear_factor
                    * (delta_ambient * context.delta_as_secs_f64()),
            );
        self.temperature -= energy / brake_properties.heat_capacity();
    }

    fn calculate_radiated_energy(
        dt: Duration,
        brake_properties: &BrakeProperties,
        temperature: ThermodynamicTemperature,
    ) -> Energy {
        // We are using the Stefan-Boltzmann law to calculate the energy radiated
        Energy::new::<joule>(
            Self::BRAKE_EMISSIVITY
                * Self::BOLTZMANN_CONSTANT
                * dt.as_secs_f64()
                * brake_properties.surface_area().get::<square_meter>()
                * temperature
                    .get::<thermodynamic_temperature::kelvin>()
                    .powi(4),
        )
    }

    //// Wizardry that computes how much does the air flow cools down the brake.
    ////
    //// * `deltaTemp` - Temperature difference between brake temperature and ambient temperature
    //// * `speed` - Current air speed
    //// * `deltaTempFactor` - Some wizardry
    // fn calculate_delta_cool_down(
    //     delta_temp: TemperatureInterval,
    //     airspeed: Velocity,
    //     delta_temp_factor: f64,
    //     gear_position: Ratio,
    //     brake_fan: &BrakeFan,
    // ) -> TemperatureInterval {
    //     delta_temp
    //         * Self::BASE_COOL_DOWN_FACTOR
    //         * (Self::BASE_SPEED
    //             + if gear_position.get::<ratio>() > 0.25 {
    //                 Self::SPEED_COOLDOWN_FACTOR * airspeed.get::<meter_per_second>()
    //             } else {
    //                 0.
    //             })
    //         * delta_temp_factor
    //         * if brake_fan.is_on() { 4.35 } else { 1. }
    // }
}
impl SimulationElement for Brake {
    fn read(&mut self, reader: &mut crate::simulation::SimulatorReader) {
        // DEBUG
        self.temperature = reader.read(&self.temperature_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.temperature_id, self.temperature);
    }
}

#[derive(Debug)]
struct BrakeFan {
    powered_by: ElectricalBusType,
    is_powered: bool,
    should_run: bool,
}
impl BrakeFan {
    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            powered_by,
            is_powered: false,
            should_run: false,
        }
    }

    fn update(&mut self, should_run: bool) {
        self.should_run = should_run;
    }

    fn is_running(&self) -> bool {
        self.should_run && self.is_powered
    }
}
impl SimulationElement for BrakeFan {
    fn consume_power<T: ConsumePower>(&mut self, _context: &UpdateContext, power: &mut T) {
        // The motor is rated for 200V and 1.7A which results in a power consumption of 589W.
        // With a power factor of 0.85 this gives a 505VA.
        // (we currently don't model power factor therefore we use the normal power rating)
        if self.is_running() {
            power.consume_from_bus(self.powered_by, Power::new::<watt>(589.));
        }
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

struct BrakeProbe {
    temperature: ThermodynamicTemperature,
    initialised: bool,
    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl BrakeProbe {
    const THERMAL_INERTIA: f64 = 0.003;

    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            temperature: ThermodynamicTemperature::default(),
            initialised: false,
            powered_by,
            is_powered: false,
        }
    }

    fn update(&mut self, context: &UpdateContext, brake: &Brake, brake_fan_is_on: bool) {
        if !self.initialised {
            self.temperature = context.ambient_temperature();
            self.initialised = true;
        }

        // TODO: implement a more physical based simulation
        let target_temperature_diff = TemperatureInterval::new::<kelvin>(if brake_fan_is_on {
            (context.ambient_temperature().get::<degree_celsius>()
                + brake.temperature.get::<degree_celsius>())
                / 2.
        } else {
            brake.temperature.get::<degree_celsius>()
                - context.ambient_temperature().get::<degree_celsius>()
        });

        self.temperature += target_temperature_diff * Self::THERMAL_INERTIA;
    }
}
impl ControllerSignal<ThermodynamicTemperature> for BrakeProbe {
    fn signal(&self) -> Option<ThermodynamicTemperature> {
        self.is_powered.then_some(self.temperature)
    }
}
impl SimulationElement for BrakeProbe {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

pub struct BrakeFanPanel {
    brake_fan_pb_identifier: VariableIdentifier,
    running_identifier: VariableIdentifier,
    brakes_hot_identifier: VariableIdentifier,

    brake_fan_pb_pressed: bool,
    brakes_hot: bool,
}
impl BrakeFanPanel {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            brake_fan_pb_identifier: context.get_identifier("BRAKE_FAN_BTN_PRESSED".to_owned()),
            running_identifier: context.get_identifier("BRAKE_FAN".to_owned()),
            brakes_hot_identifier: context.get_identifier("BRAKES_HOT".to_owned()),
            brake_fan_pb_pressed: false,
            brakes_hot: false,
        }
    }

    pub fn update(&mut self, brakes_hot: bool) {
        self.brakes_hot = brakes_hot;
    }

    pub fn brake_fan_pb_is_pressed(&self) -> bool {
        self.brake_fan_pb_pressed
    }
}
impl SimulationElement for BrakeFanPanel {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.brake_fan_pb_pressed = reader.read(&self.brake_fan_pb_identifier);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.brakes_hot_identifier, self.brakes_hot);
        writer.write(&self.running_identifier, self.brake_fan_pb_pressed);
    }
}
