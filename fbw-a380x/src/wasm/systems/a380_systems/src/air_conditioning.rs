use systems::{
    accept_iterable,
    air_conditioning::{
        acs_controller::{Pack, PackFlowController},
        cabin_air::CabinZone,
        AirConditioningSystem, DuctTemperature, PackFlow, PackFlowControllers, ZoneType,
    },
    overhead::{AutoManFaultPushButton, NormalOnPushButton, SpringLoadedSwitch, ValueKnob},
    pneumatic::PneumaticContainer,
    pressurization::{
        cabin_pressure_controller::CabinPressureController,
        cabin_pressure_simulation::CabinPressureSimulation,
        pressure_valve::{PressureValve, PressureValveSignal},
    },
    shared::{
        random_number, CabinAir, CabinTemperature, ControllerSignal, ElectricalBusType,
        EngineBleedPushbutton, EngineCorrectedN1, EngineFirePushButtons, EngineStartState,
        GroundSpeed, LgciuWeightOnWheels, PackFlowValveState, PneumaticBleed,
        PressurizationOverheadShared,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use std::time::Duration;
use uom::si::{
    area::square_meter, f64::*, length::foot, mass_rate::kilogram_per_second,
    pressure::hectopascal, ratio::percent, velocity::knot, volume::cubic_meter,
};

pub(super) struct A380AirConditioning {
    a380_cabin: A380Cabin,
    a380_air_conditioning_system: AirConditioningSystem<3, 2>,
    a380_pressurization_system: A380PressurizationSystem,
}

impl A380AirConditioning {
    pub fn new(context: &mut InitContext) -> Self {
        let cabin_zones: [ZoneType; 3] =
            [ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)];

        Self {
            a380_cabin: A380Cabin::new(context),
            a380_air_conditioning_system: AirConditioningSystem::new(
                context,
                cabin_zones,
                vec![
                    ElectricalBusType::DirectCurrent(1),
                    ElectricalBusType::AlternatingCurrent(1),
                ],
                vec![
                    ElectricalBusType::DirectCurrent(2),
                    ElectricalBusType::AlternatingCurrent(2),
                ],
                ElectricalBusType::AlternatingCurrent(1),
            ),
            a380_pressurization_system: A380PressurizationSystem::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl GroundSpeed,
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton,
        pressurization_overhead: &A380PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.a380_air_conditioning_system.update(
            context,
            adirs,
            &self.a380_cabin,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            pneumatic_overhead,
            &self.a380_pressurization_system,
            pressurization_overhead,
            lgciu,
        );
        self.a380_cabin.update(
            context,
            &self.a380_air_conditioning_system,
            &self.a380_air_conditioning_system,
            &self.a380_pressurization_system,
        );
        self.a380_pressurization_system.update(
            context,
            pressurization_overhead,
            engines,
            lgciu,
            &self.a380_air_conditioning_system,
            &self.a380_cabin,
        );
    }

    pub fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
        self.a380_air_conditioning_system
            .mix_packs_air_update(pack_container);
    }
}

impl PackFlowControllers<3> for A380AirConditioning {
    fn pack_flow_controller(&self, pack_id: Pack) -> PackFlowController<3> {
        self.a380_air_conditioning_system
            .pack_flow_controller(pack_id)
    }
}

impl SimulationElement for A380AirConditioning {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.a380_cabin.accept(visitor);
        self.a380_air_conditioning_system.accept(visitor);

        visitor.visit(self);
    }
}

struct A380Cabin {
    cabin_zone: [CabinZone<2>; 3],
}

impl A380Cabin {
    // TODO: Improve volume according to specs
    const A380_CABIN_VOLUME_CUBIC_METER: f64 = 200.; // m3
    const A380_COCKPIT_VOLUME_CUBIC_METER: f64 = 10.; // m3
    const A380_CABIN_LEAKAGE_AREA: f64 = 0.0003; // m2
    const A380_OUTFLOW_VALVE_SIZE: f64 = 0.03; // m2
    const A380_SAFETY_VALVE_SIZE: f64 = 0.02; //m2

    fn new(context: &mut InitContext) -> Self {
        Self {
            cabin_zone: [
                CabinZone::new(
                    context,
                    ZoneType::Cockpit,
                    Volume::new::<cubic_meter>(Self::A380_COCKPIT_VOLUME_CUBIC_METER),
                    2,
                    None,
                ),
                CabinZone::new(
                    context,
                    ZoneType::Cabin(1),
                    Volume::new::<cubic_meter>(Self::A380_CABIN_VOLUME_CUBIC_METER / 2.),
                    0,
                    Some([(1, 6), (7, 13)]),
                ),
                CabinZone::new(
                    context,
                    ZoneType::Cabin(2),
                    Volume::new::<cubic_meter>(Self::A380_CABIN_VOLUME_CUBIC_METER / 2.),
                    0,
                    Some([(14, 21), (22, 29)]),
                ),
            ],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        duct_temperature: &impl DuctTemperature,
        pack_flow: &impl PackFlow,
        pressurization: &impl CabinAir,
    ) {
        let flow_rate_per_cubic_meter: MassRate = MassRate::new::<kilogram_per_second>(
            pack_flow.pack_flow().get::<kilogram_per_second>()
                / (Self::A380_CABIN_VOLUME_CUBIC_METER + Self::A380_COCKPIT_VOLUME_CUBIC_METER),
        );
        for zone in self.cabin_zone.iter_mut() {
            zone.update(
                context,
                duct_temperature,
                flow_rate_per_cubic_meter,
                pressurization,
            );
        }
    }
}

impl CabinTemperature for A380Cabin {
    fn cabin_temperature(&self) -> Vec<ThermodynamicTemperature> {
        let mut cabin_temperature_vector = Vec::new();
        for zone in self.cabin_zone.iter() {
            cabin_temperature_vector.append(&mut zone.cabin_temperature())
        }
        cabin_temperature_vector
    }
}

impl SimulationElement for A380Cabin {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.cabin_zone, visitor);

        visitor.visit(self);
    }
}

struct A380PressurizationSystem {
    active_cpc_sys_id: VariableIdentifier,

    cpc: [CabinPressureController; 2],
    outflow_valve: [PressureValve; 1], // Array to prepare for more than 1 outflow valve in A380
    safety_valve: PressureValve,
    residual_pressure_controller: ResidualPressureController,
    active_system: usize,

    cabin_pressure_simulation: CabinPressureSimulation, // To be merged in air con cabin
}

impl A380PressurizationSystem {
    pub fn new(context: &mut InitContext) -> Self {
        let random = random_number();
        let mut active: usize = 1;
        if random % 2 == 0 {
            active = 2
        }

        Self {
            active_cpc_sys_id: context.get_identifier("PRESS_ACTIVE_CPC_SYS".to_owned()),

            cpc: [
                CabinPressureController::new(context),
                CabinPressureController::new(context),
            ],
            outflow_valve: [PressureValve::new_outflow_valve(); 1],
            safety_valve: PressureValve::new_safety_valve(),
            residual_pressure_controller: ResidualPressureController::new(),
            active_system: active,

            cabin_pressure_simulation: CabinPressureSimulation::new(
                context,
                Volume::new::<cubic_meter>(
                    A380Cabin::A380_CABIN_VOLUME_CUBIC_METER
                        + A380Cabin::A380_COCKPIT_VOLUME_CUBIC_METER,
                ),
                Area::new::<square_meter>(A380Cabin::A380_CABIN_LEAKAGE_AREA),
                Area::new::<square_meter>(A380Cabin::A380_OUTFLOW_VALVE_SIZE),
                Area::new::<square_meter>(A380Cabin::A380_SAFETY_VALVE_SIZE),
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        press_overhead: &A380PressurizationOverheadPanel,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        pack_flow: &impl PackFlow,
        cabin_temperature: &impl CabinTemperature,
    ) {
        let lgciu_gears_compressed = lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true));

        for controller in self.cpc.iter_mut() {
            controller.update(
                context,
                engines,
                lgciu_gears_compressed,
                press_overhead,
                &self.cabin_pressure_simulation, // replace with cabin data
                &self.outflow_valve[0],
                &self.safety_valve,
                cabin_temperature,
            );
        }

        self.residual_pressure_controller.update(
            context,
            engines,
            self.outflow_valve[0].open_amount(),
            press_overhead.is_in_man_mode(),
            lgciu_gears_compressed,
            self.cabin_pressure_simulation.cabin_delta_p(), // replace with cabin data
        );

        self.outflow_valve[0].calculate_outflow_valve_position(
            &self.cpc[self.active_system - 1],
            press_overhead,
            &self.cabin_pressure_simulation,
        );

        if self.residual_pressure_controller.signal().is_some() {
            self.outflow_valve[0].update(context, &self.residual_pressure_controller);
        } else {
            self.outflow_valve[0].update(context, press_overhead);
        }

        self.safety_valve
            .update(context, &self.cpc[self.active_system - 1]);

        self.cabin_pressure_simulation.update(
            context,
            self.outflow_valve[0].open_amount(),
            self.safety_valve.open_amount(),
            pack_flow,
            lgciu_gears_compressed,
            self.cpc[self.active_system - 1].should_open_outflow_valve()
                && !press_overhead.is_in_man_mode(),
            cabin_temperature,
        );

        self.switch_active_system();
    }

    fn switch_active_system(&mut self) {
        if self
            .cpc
            .iter_mut()
            .any(|controller| controller.should_switch_cpc())
        {
            self.active_system = if self.active_system == 1 { 2 } else { 1 };
        }
        self.cpc.iter_mut().for_each(|controller| {
            controller.reset_cpc_switch();
        });
    }
}

impl CabinAir for A380PressurizationSystem {
    fn altitude(&self) -> Length {
        // self.cpc[self.active_system - 1].cabin_altitude()
        Length::new::<foot>(0.)
    }

    fn pressure(&self) -> Pressure {
        // self.cabin_pressure_simulation.cabin_pressure()
        Pressure::new::<hectopascal>(1013.)
    }
}

impl SimulationElement for A380PressurizationSystem {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.active_cpc_sys_id, self.active_system);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.cpc, visitor);
        self.cabin_pressure_simulation.accept(visitor);

        visitor.visit(self);
    }
}

pub struct A380PressurizationOverheadPanel {
    mode_sel: AutoManFaultPushButton,
    man_vs_ctl_switch: SpringLoadedSwitch,
    ldg_elev_knob: ValueKnob,
    ditching: NormalOnPushButton,
}

impl A380PressurizationOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            mode_sel: AutoManFaultPushButton::new_auto(context, "PRESS_MODE_SEL"),
            man_vs_ctl_switch: SpringLoadedSwitch::new(context, "PRESS_MAN_VS_CTL"),
            ldg_elev_knob: ValueKnob::new_with_value(context, "PRESS_LDG_ELEV", -2000.),
            ditching: NormalOnPushButton::new_normal(context, "PRESS_DITCHING"),
        }
    }

    fn man_vs_switch_position(&self) -> usize {
        self.man_vs_ctl_switch.position()
    }
}

impl SimulationElement for A380PressurizationOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mode_sel.accept(visitor);
        self.man_vs_ctl_switch.accept(visitor);
        self.ldg_elev_knob.accept(visitor);
        self.ditching.accept(visitor);

        visitor.visit(self);
    }
}

impl ControllerSignal<PressureValveSignal> for A380PressurizationOverheadPanel {
    fn signal(&self) -> Option<PressureValveSignal> {
        if !self.is_in_man_mode() {
            None
        } else {
            match self.man_vs_switch_position() {
                0 => Some(PressureValveSignal::Open),
                1 => Some(PressureValveSignal::Neutral),
                2 => Some(PressureValveSignal::Close),
                _ => panic!("Could not convert manual vertical speed switch position '{}' to pressure valve signal.", self.man_vs_switch_position()),
            }
        }
    }
}

impl PressurizationOverheadShared for A380PressurizationOverheadPanel {
    fn is_in_man_mode(&self) -> bool {
        !self.mode_sel.is_auto()
    }

    fn ditching_is_on(&self) -> bool {
        self.ditching.is_on()
    }

    fn ldg_elev_is_auto(&self) -> bool {
        let margin = 100.;
        (self.ldg_elev_knob.value() + 2000.).abs() < margin
    }

    fn ldg_elev_knob_value(&self) -> f64 {
        self.ldg_elev_knob.value()
    }
}

struct ResidualPressureController {
    timer: Duration,
}

impl ResidualPressureController {
    fn new() -> Self {
        Self {
            timer: Duration::from_secs(0),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        outflow_valve_open_amount: Ratio,
        is_in_man_mode: bool,
        lgciu_gears_compressed: bool,
        cabin_delta_p: Pressure,
    ) {
        if outflow_valve_open_amount < Ratio::new::<percent>(100.)
            && is_in_man_mode
            && lgciu_gears_compressed
            && (!(engines
                .iter()
                .any(|&x| x.corrected_n1() > Ratio::new::<percent>(15.)))
                || context.indicated_airspeed() < Velocity::new::<knot>(70.))
            && cabin_delta_p > Pressure::new::<hectopascal>(2.5)
        {
            self.timer += context.delta();
        } else {
            self.timer = Duration::from_secs(0);
        }
    }
}

impl ControllerSignal<PressureValveSignal> for ResidualPressureController {
    fn signal(&self) -> Option<PressureValveSignal> {
        if self.timer > Duration::from_secs(15) {
            Some(PressureValveSignal::Open)
        } else {
            None
        }
    }
}
