use std::{fmt::Debug, fmt::Display, time::Duration};

use systems::{
    accept_iterable,
    apu::{
        AuxiliaryPowerUnit, AuxiliaryPowerUnitFactory, AuxiliaryPowerUnitFireOverheadPanel,
        AuxiliaryPowerUnitOverheadPanel, Pw980ApuGenerator, Pw980Constants, Pw980StartMotor,
    },
    electrical::{Electricity, ElectricitySource, ExternalPowerSource},
    engine::{
        reverser::{A380ReverserAssembly, ElecReverserInterface, ReverserFeedback},
        trent_engine::TrentEngine,
        Engine, EngineFireOverheadPanel,
    },
    enhanced_gpwc::EnhancedGroundProximityWarningComputer,
    landing_gear::{LandingGear, LandingGearControlInterfaceUnitSet},
    navigation::adirs::{
        AirDataInertialReferenceSystem, AirDataInertialReferenceSystemOverheadPanel,
    },
    shared::{DelayedFalseLogicGate, ElectricalBusType, LgciuWeightOnWheels, ReverserPosition},
    simulation::{
        Aircraft, InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use uom::si::{
    acceleration::meter_per_second_squared,
    angle::degree,
    angular_velocity::{radian_per_second, revolution_per_minute},
    electric_current::ampere,
    f64::*,
    length::meter,
    mass::kilogram,
    pressure::psi,
    ratio::{percent, ratio},
    velocity::knot,
    volume::{cubic_inch, gallon, liter},
    volume_rate::gallon_per_second,
};

#[derive(Clone, Copy, Debug, PartialEq)]
enum ReverserControlState {
    StowedOff,
    StowedOn,
    TransitOpening,
    TransitClosing,
    FullyOpened,
}

pub struct A380ReverserController {
    throttle_lever_angle_id: VariableIdentifier,

    throttle_lever_angle: Angle,

    state: ReverserControlState,

    primary_lock_from_prim_should_unlock: bool,
    secondary_lock_from_prim_should_unlock: bool,
    tertiary_lock_from_prim_should_unlock: bool,
}
impl A380ReverserController {
    pub fn new(context: &mut InitContext, engine_number: usize) -> Self {
        Self {
            throttle_lever_angle_id: context
                .get_identifier(format!("AUTOTHRUST_TLA:{}", engine_number)),

            throttle_lever_angle: Angle::default(),
            state: ReverserControlState::StowedOff,

            primary_lock_from_prim_should_unlock: false,
            secondary_lock_from_prim_should_unlock: false,
            tertiary_lock_from_prim_should_unlock: false,
        }
    }

    fn first_line_of_defense_condition_should_unlock(
        &self,
        lgciu: &impl LgciuWeightOnWheels,
    ) -> bool {
        self.throttle_lever_angle.get::<degree>() <= -3.
            && lgciu.left_and_right_gear_compressed(false)
    }

    fn second_line_of_defense_condition_should_unlock(
        &self,
        lgciu: &impl LgciuWeightOnWheels,
    ) -> bool {
        // TODO Should be a switch info from throttle assembly, using a -3.5 value as placeholder
        self.throttle_lever_angle.get::<degree>() <= -3.5
            && lgciu.left_and_right_gear_compressed(false)
    }

    fn third_line_of_defense_condition_should_unlock(&self) -> bool {
        // TODO This should come from PRIM independant data
        self.throttle_lever_angle.get::<degree>() <= -4.
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine: &impl Engine,
        lgciu: &impl LgciuWeightOnWheels,
        reverser_feedback: &impl ReverserFeedback,
    ) {
        let is_confirmed_stowed_available_for_deploy =
            reverser_feedback.position_sensor().get::<ratio>() <= 0.1
                && reverser_feedback.proximity_sensor_all_stowed();

        let deploy_authorized = engine.corrected_n2().get::<percent>() > 50.
            && lgciu.left_and_right_gear_compressed(false);

        let command_opening = self.throttle_lever_angle.get::<degree>() <= -4.3;

        self.primary_lock_from_prim_should_unlock =
            self.first_line_of_defense_condition_should_unlock(lgciu);
        self.secondary_lock_from_prim_should_unlock =
            self.second_line_of_defense_condition_should_unlock(lgciu);
        self.tertiary_lock_from_prim_should_unlock =
            self.third_line_of_defense_condition_should_unlock();

        self.state = match self.state {
            ReverserControlState::StowedOff => {
                if deploy_authorized && is_confirmed_stowed_available_for_deploy {
                    ReverserControlState::StowedOn
                } else {
                    self.state
                }
            }
            ReverserControlState::StowedOn => {
                if command_opening {
                    ReverserControlState::TransitOpening
                } else {
                    self.state
                }
            }
            ReverserControlState::TransitOpening => {
                if reverser_feedback.proximity_sensor_all_deployed() {
                    ReverserControlState::FullyOpened
                } else if !deploy_authorized || !command_opening {
                    ReverserControlState::TransitClosing
                } else {
                    self.state
                }
            }
            ReverserControlState::TransitClosing => {
                if reverser_feedback.proximity_sensor_all_stowed() {
                    ReverserControlState::StowedOff
                } else if command_opening && deploy_authorized {
                    ReverserControlState::TransitOpening
                } else {
                    self.state
                }
            }
            ReverserControlState::FullyOpened => {
                if !deploy_authorized || !command_opening {
                    ReverserControlState::TransitClosing
                } else {
                    self.state
                }
            }
        };
    }
}
impl SimulationElement for A380ReverserController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.throttle_lever_angle = reader.read(&self.throttle_lever_angle_id);
    }
}
impl ElecReverserInterface for A380ReverserController {
    fn should_unlock_first(&self) -> bool {
        self.primary_lock_from_prim_should_unlock
    }

    fn should_unlock_second(&self) -> bool {
        self.secondary_lock_from_prim_should_unlock
    }

    fn should_unlock_third(&self) -> bool {
        self.tertiary_lock_from_prim_should_unlock
    }

    fn should_deploy_reverser(&self) -> bool {
        self.state == ReverserControlState::TransitOpening
            || self.state == ReverserControlState::FullyOpened
    }
}
impl Debug for A380ReverserController {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nREV Controller => STATE: {:?}/ should_unlock {:?}/{:?}/{:?} / should_deploy_reverser{:?}",
                self.state, self.should_unlock_first(),self.should_unlock_second(),self.should_unlock_third(),
                self.should_deploy_reverser(),
        )
    }
}

pub struct A380Reversers {
    reverser_2_position_id: VariableIdentifier,
    reverser_3_position_id: VariableIdentifier,

    reverser_2_in_transition_id: VariableIdentifier,
    reverser_3_in_transition_id: VariableIdentifier,

    reverser_2_deployed_id: VariableIdentifier,
    reverser_3_deployed_id: VariableIdentifier,

    reversers: [A380ReverserAssembly; 2],

    reversers_in_transition: [bool; 2],
    reversers_deployed: [bool; 2],
}
impl A380Reversers {
    const REVERSER_2_ETRAC_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrent(1);
    const REVERSER_3_ETRAC_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrent(2);

    const REVERSER_2_TERTIARY_LOCK_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrent(2);
    const REVERSER_3_TERTIARY_LOCK_SUPPLY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrent(4);

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            reverser_2_position_id: context.get_identifier("REVERSER_2_POSITION".to_owned()),
            reverser_3_position_id: context.get_identifier("REVERSER_3_POSITION".to_owned()),

            reverser_2_in_transition_id: context.get_identifier("REVERSER_2_DEPLOYING".to_owned()),
            reverser_3_in_transition_id: context.get_identifier("REVERSER_3_DEPLOYING".to_owned()),

            reverser_2_deployed_id: context.get_identifier("REVERSER_2_DEPLOYED".to_owned()),
            reverser_3_deployed_id: context.get_identifier("REVERSER_3_DEPLOYED".to_owned()),

            reversers: [
                A380ReverserAssembly::new(
                    Self::REVERSER_2_ETRAC_SUPPLY_POWER_BUS,
                    Self::REVERSER_2_TERTIARY_LOCK_SUPPLY_POWER_BUS,
                ),
                A380ReverserAssembly::new(
                    Self::REVERSER_3_ETRAC_SUPPLY_POWER_BUS,
                    Self::REVERSER_3_TERTIARY_LOCK_SUPPLY_POWER_BUS,
                ),
            ],
            reversers_in_transition: [false, false],
            reversers_deployed: [false, false],
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        reverser_controllers: &[impl ElecReverserInterface; 2],
    ) {
        self.reversers[0].update(context, &reverser_controllers[0]);

        self.reversers[1].update(context, &reverser_controllers[1]);

        self.update_sensors_state();
    }

    fn update_sensors_state(&mut self) {
        for (idx, reverser) in self.reversers.iter().enumerate() {
            self.reversers_deployed[idx] = reverser.proximity_sensor_all_deployed();

            self.reversers_in_transition[idx] = !reverser.proximity_sensor_all_deployed()
                && !reverser.proximity_sensor_all_stowed();
        }
    }

    pub fn reverser_feedback(&self, reverser_index: usize) -> &impl ReverserFeedback {
        &self.reversers[reverser_index]
    }

    pub fn reversers_position(&self) -> &[impl ReverserPosition] {
        &self.reversers[..]
    }
}
impl SimulationElement for A380Reversers {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.reversers, visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.reverser_2_position_id,
            self.reversers[0].reverser_position().get::<ratio>(),
        );
        writer.write(
            &self.reverser_3_position_id,
            self.reversers[1].reverser_position().get::<ratio>(),
        );

        writer.write(
            &self.reverser_2_in_transition_id,
            self.reversers_in_transition[0],
        );
        writer.write(
            &self.reverser_3_in_transition_id,
            self.reversers_in_transition[1],
        );

        writer.write(&self.reverser_2_deployed_id, self.reversers_deployed[0]);
        writer.write(&self.reverser_3_deployed_id, self.reversers_deployed[1]);
    }
}
