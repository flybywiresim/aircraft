use uom::si::{
    f64::{Angle, Pressure, ThermodynamicTemperature},
    pressure::inch_of_mercury,
};

use crate::{
    failures::{Failure, FailureType},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        VariableIdentifier,
    },
};

pub mod air_data_module;
pub mod integrated_probes;

pub trait PressureSource {
    fn get_pressure(&self) -> Pressure;
}

/// A pitot tube that probes the total air pressure at the installation position.
pub struct PitotTube {
    pitot_blockage: Failure,

    dynamic_pressure: Pressure,
    static_pressure: Pressure,

    dynamic_pressure_id: VariableIdentifier,
    static_pressure_id: VariableIdentifier,
}
impl PitotTube {
    const DYNAMIC_PRESSURE_ID: &str = "DYNAMIC PRESSURE";
    const AMBIENT_PRESSURE_ID: &str = "AMBIENT PRESSURE";

    pub fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            pitot_blockage: Failure::new(FailureType::PitotBlockage(num)),

            dynamic_pressure: Pressure::default(),
            static_pressure: Pressure::default(),

            dynamic_pressure_id: context.get_identifier(Self::DYNAMIC_PRESSURE_ID.to_owned()),
            static_pressure_id: context.get_identifier(Self::AMBIENT_PRESSURE_ID.to_owned()),
        }
    }
}
impl PressureSource for PitotTube {
    fn get_pressure(&self) -> Pressure {
        self.dynamic_pressure + self.static_pressure
    }
}
impl SimulationElement for PitotTube {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.pitot_blockage.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        // If it pitot blockage failure is active, no longer update the measured pressure, as it should retain the current value
        if !self.pitot_blockage.is_active() {
            let dynamic_pressure = reader.read(&self.dynamic_pressure_id);
            self.dynamic_pressure = Pressure::new::<inch_of_mercury>(dynamic_pressure);

            let static_pressure = reader.read(&self.static_pressure_id);
            self.static_pressure = Pressure::new::<inch_of_mercury>(static_pressure);
        }
    }
}

/// A static port that probes the static air pressure at the installation position.
pub struct StaticPort {
    static_blockage: Failure,

    static_pressure: Pressure,

    static_pressure_id: VariableIdentifier,
}
impl StaticPort {
    const AMBIENT_PRESSURE_ID: &str = "AMBIENT PRESSURE";

    pub fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            static_blockage: Failure::new(FailureType::StaticBlockage(num)),

            static_pressure: Pressure::default(),
            static_pressure_id: context.get_identifier(Self::AMBIENT_PRESSURE_ID.to_owned()),
        }
    }
}
impl PressureSource for StaticPort {
    fn get_pressure(&self) -> Pressure {
        self.static_pressure
    }
}
impl SimulationElement for StaticPort {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.static_blockage.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        if !self.static_blockage.is_active() {
            let static_pressure = reader.read(&self.static_pressure_id);
            self.static_pressure = Pressure::new::<inch_of_mercury>(static_pressure);
        }
    }
}

/// A pressure tube that carries pressure between two points. Currently represents the connection
/// between left and right static ports 3 and is simulated as a simple averageing operation.
pub struct PressureTube {
    average_static_pressure: Pressure,
}
impl PressureTube {
    pub fn new() -> Self {
        Self {
            average_static_pressure: Pressure::default(),
        }
    }

    pub fn update(&mut self, left_port: &impl PressureSource, right_port: &impl PressureSource) {
        self.average_static_pressure = (left_port.get_pressure() + right_port.get_pressure()) / 2.;
    }
}
impl PressureSource for PressureTube {
    fn get_pressure(&self) -> Pressure {
        self.average_static_pressure
    }
}

pub trait WindVane {
    fn get_angle(&self) -> Angle;
}

/// A wind vane that probes the angle of attack at the installation position.
pub struct AngleOfAttackVane {
    stuck_aoa: Failure,

    angle_of_attack: Angle,

    angle_of_attack_id: VariableIdentifier,
}
impl AngleOfAttackVane {
    const ANGLE_OF_ATTACK_ID: &str = "INCIDENCE ALPHA";

    pub fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            stuck_aoa: Failure::new(FailureType::AoaProbeStuck(num)),

            angle_of_attack: Angle::default(),
            angle_of_attack_id: context.get_identifier(Self::ANGLE_OF_ATTACK_ID.to_owned()),
        }
    }
}
impl WindVane for AngleOfAttackVane {
    fn get_angle(&self) -> Angle {
        self.angle_of_attack
    }
}
impl SimulationElement for AngleOfAttackVane {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.stuck_aoa.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        if !self.stuck_aoa.is_active() {
            self.angle_of_attack = reader.read(&self.angle_of_attack_id);
        }
    }
}

/// A wind vane that probes the sideslip at the installation position.
pub struct SideslipVane {
    sideslip_angle: Angle,

    sideslip_angle_id: VariableIdentifier,
}
impl SideslipVane {
    const SIDESLIP_ANGLE_ID: &str = "INCIDENCE BETA";

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            sideslip_angle: Angle::default(),
            sideslip_angle_id: context.get_identifier(Self::SIDESLIP_ANGLE_ID.to_owned()),
        }
    }
}
impl WindVane for SideslipVane {
    fn get_angle(&self) -> Angle {
        self.sideslip_angle
    }
}
impl SimulationElement for SideslipVane {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.sideslip_angle = reader.read(&self.sideslip_angle_id);
    }
}

pub trait TemperatureProbe {
    fn get_temperature(&self) -> ThermodynamicTemperature;
}

/// A total air temperature probe that probes the total air temperature at the installation position.
pub struct TotalAirTemperatureProbe {
    total_air_temperature: ThermodynamicTemperature,

    total_air_temperature_id: VariableIdentifier,
}
impl TotalAirTemperatureProbe {
    const TOTAL_AIR_TEMPERATURE_ID: &str = "TOTAL AIR TEMPERATURE";

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            total_air_temperature: ThermodynamicTemperature::default(),
            total_air_temperature_id: context
                .get_identifier(Self::TOTAL_AIR_TEMPERATURE_ID.to_owned()),
        }
    }
}
impl TemperatureProbe for TotalAirTemperatureProbe {
    fn get_temperature(&self) -> ThermodynamicTemperature {
        self.total_air_temperature
    }
}
impl SimulationElement for TotalAirTemperatureProbe {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.total_air_temperature = reader.read(&self.total_air_temperature_id);
    }
}
