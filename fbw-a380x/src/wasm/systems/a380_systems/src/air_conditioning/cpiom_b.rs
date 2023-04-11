use std::time::Duration;

use systems::{
    air_conditioning::{
        acs_controller::{ACSCActiveComputer, AirConditioningStateManager, Pack, ZoneController},
        trim_air_drive_device::TaddShared,
        AdirsToAirCondInterface, AirConditioningOverheadShared, DuctTemperature,
        OverheadFlowSelector, PackFlow, ZoneType,
    },
    integrated_modular_avionics::core_processing_input_output_module::CoreProcessingInputOutputModule,
    shared::{
        CabinAltitude, CabinSimulation, EngineCorrectedN1, EngineStartState, LgciuWeightOnWheels,
        PackFlowValveState, PneumaticBleed,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use uom::si::{
    f64::*,
    length::foot,
    mass_rate::kilogram_per_second,
    ratio::{percent, ratio},
};

pub(super) struct CoreProcessingInputOutputModuleB {
    cpiom_are_active: [bool; 4],
    ags_app: AirGenerationSystemApplication,
    tcs_app: TemperatureControlSystemApplication,
    // ventilation_control_system_app: VentilationControlSystemApplication,
    // cabin_pressure_control_system_app: CabinPressureControllSystemApplication,
    // avionics_ventilation_system_app: AvionicsVentilationSystemApplication,
}

impl CoreProcessingInputOutputModuleB {
    pub(super) fn new(context: &mut InitContext, cabin_zones: &[ZoneType; 18]) -> Self {
        Self {
            cpiom_are_active: [false; 4],
            ags_app: AirGenerationSystemApplication::new(context),
            tcs_app: TemperatureControlSystemApplication::new(context, cabin_zones),
            // ventilation_control_system_app: VentilationControlSystemApplication::new(),
            // cabin_pressure_control_system_app: CabinPressureControllSystemApplication::new(),
            // avionics_ventilation_system_app: AvionicsVentilationSystemApplication::new(),
        }
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        acs_overhead: &impl AirConditioningOverheadShared,
        cabin_temperature: &impl CabinSimulation,
        cpiom_b: [&CoreProcessingInputOutputModule; 4],
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        number_of_passengers: usize,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pressurization: &impl CabinAltitude,
        trim_air_drive_device: &impl TaddShared,
    ) {
        self.cpiom_are_active = cpiom_b.map(|cpiom| cpiom.is_available());

        // We check if any CPIOM B is available to run the applications
        if self.cpiom_are_active.iter().any(|&cpiom| cpiom) {
            self.ags_app.update(
                context,
                adirs,
                acs_overhead,
                engines,
                lgciu,
                number_of_passengers,
                pneumatic,
                pressurization,
            );
            self.tcs_app.update(
                context,
                acs_overhead,
                cabin_temperature,
                pressurization,
                trim_air_drive_device,
            );
        }
    }

    pub(super) fn should_close_taprv(&self) -> [bool; 2] {
        self.tcs_app.should_close_taprv()
    }
}

impl PackFlow for CoreProcessingInputOutputModuleB {
    fn pack_flow_demand(&self, pack_id: Pack) -> MassRate {
        // CPIOM B1 and B3 calculate the LH AGU Flow Demand
        // CPIOM B2 and B4 calculate the RH AGU Flow Demand
        // If both CPIOMs for the respective AGU are not available, we return 0
        if (matches!(pack_id, Pack(1)) && (self.cpiom_are_active[0] || self.cpiom_are_active[2]))
            || (matches!(pack_id, Pack(2))
                && (self.cpiom_are_active[1] || self.cpiom_are_active[3]))
        {
            self.ags_app.pack_flow_demand(pack_id)
        } else {
            MassRate::default()
        }
    }
}

impl DuctTemperature for CoreProcessingInputOutputModuleB {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.tcs_app.duct_demand_temperature()
    }
}

impl SimulationElement for CoreProcessingInputOutputModuleB {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ags_app.accept(visitor);
        self.tcs_app.accept(visitor);

        visitor.visit(self);
    }
}

/// Determines the pack flow demand and sends it to the FDAC for actuation of the valves
struct AirGenerationSystemApplication {
    pack_flow_id: [VariableIdentifier; 4],

    aircraft_state: AirConditioningStateManager,
    fcv_timer_open: [Duration; 2], // One for each pack
    flow_demand_ratio: [Ratio; 2], // One for each pack
    flow_ratio: [Ratio; 4],        // One for each FCV
    pack_flow_demand: [MassRate; 2],
}

impl AirGenerationSystemApplication {
    const PACK_START_TIME_SECOND: f64 = 30.;
    const PACK_START_FLOW_LIMIT: f64 = 100.;
    const APU_SUPPLY_FLOW_LIMIT: f64 = 120.;
    const ONE_PACK_FLOW_LIMIT: f64 = 120.;
    const FLOW_REDUCTION_LIMIT: f64 = 80.;
    const BACKFLOW_LIMIT: f64 = 80.;

    const FLOW_CONSTANT_C: f64 = 0.5675; // kg/s
    const FLOW_CONSTANT_XCAB: f64 = 0.00001828; // kg(feet*s)
    const A320_T0_A380_FLOW_CONVERSION_FACTOR: f64 = 2.8; // This is an assumed conversion factor for now based on number of pax
    const A380_TOTAL_NUMBER_OF_PASSENGERS: f64 = 517.;

    fn new(context: &mut InitContext) -> Self {
        Self {
            pack_flow_id: Self::pack_flow_id(context),

            aircraft_state: AirConditioningStateManager::new(),
            fcv_timer_open: [Duration::from_secs(0); 2],
            flow_demand_ratio: [Ratio::default(); 2],
            flow_ratio: [Ratio::default(); 4],
            pack_flow_demand: [MassRate::default(); 2],
        }
    }

    fn pack_flow_id(context: &mut InitContext) -> [VariableIdentifier; 4] {
        (1..=4)
            .map(|fcv| context.get_identifier(format!("COND_PACK_FLOW_{}", fcv)))
            .collect::<Vec<_>>()
            .try_into()
            .unwrap_or_else(|v: Vec<_>| {
                panic!("Expected a Vec of length {} but it was {}", 4, v.len())
            })
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        acs_overhead: &impl AirConditioningOverheadShared,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        number_of_passengers: usize,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pressurization: &impl CabinAltitude,
    ) {
        let ground_speed = self.ground_speed(adirs).unwrap_or_default();

        self.aircraft_state = self
            .aircraft_state
            .update(context, ground_speed, engines, lgciu);

        self.flow_demand_ratio = [1, 2].map(|pack_id| {
            self.flow_demand_determination(
                &self.aircraft_state,
                acs_overhead,
                Pack(pack_id),
                pneumatic,
            )
        });

        self.pack_flow_demand = [1, 2].map(|pack_id| {
            self.absolute_flow_calculation(
                acs_overhead,
                number_of_passengers,
                Pack(pack_id),
                pressurization,
            )
        });

        self.update_timer(context, pneumatic);
        self.flow_ratio = self.actual_flow_percentage_calculation(pneumatic, pressurization);
    }

    fn ground_speed(&self, adirs: &impl AdirsToAirCondInterface) -> Option<Velocity> {
        // TODO: Verify ADIRU check order
        [1, 2, 3]
            .iter()
            .find_map(|&adiru_number| adirs.ground_speed(adiru_number).normal_value())
    }

    fn pack_start_condition_determination(
        &self,
        pack: Pack,
        pneumatic: &impl PackFlowValveState,
    ) -> bool {
        // Returns true when one of the packs is in start condition
        pneumatic.pack_flow_valve_is_open(pack.into())
            && self.fcv_timer_open[pack.to_index()]
                <= Duration::from_secs_f64(Self::PACK_START_TIME_SECOND)
    }

    fn flow_demand_determination(
        &self,
        aircraft_state: &AirConditioningStateManager,
        acs_overhead: &impl AirConditioningOverheadShared,
        pack: Pack,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
    ) -> Ratio {
        // TODO: Needs to account for the 4 positions of the A380 Selector
        let mut intermediate_flow: Ratio = acs_overhead.flow_selector_position().into();
        // TODO: Add "insufficient performance" based on Pack Mixer Temperature Demand
        if self.pack_start_condition_determination(pack, pneumatic) {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::PACK_START_FLOW_LIMIT));
        }
        if pneumatic.apu_bleed_is_on() {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::APU_SUPPLY_FLOW_LIMIT));
        }
        // Single pack operation determination
        if pneumatic.pack_flow_valve_is_open(pack.into())
            != pneumatic.pack_flow_valve_is_open(3 - usize::from(pack))
        {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::ONE_PACK_FLOW_LIMIT));
        }
        if matches!(
            aircraft_state,
            AirConditioningStateManager::BeginTakeOff(_)
                | AirConditioningStateManager::EndTakeOff(_)
                | AirConditioningStateManager::BeginLanding(_)
                | AirConditioningStateManager::EndLanding(_)
        ) {
            intermediate_flow =
                intermediate_flow.min(Ratio::new::<percent>(Self::FLOW_REDUCTION_LIMIT));
        }
        // If the flow control valve is closed the indication is in the Lo position
        if !(pneumatic.pack_flow_valve_is_open(pack.into())) {
            OverheadFlowSelector::Lo.into()
        } else {
            intermediate_flow.max(Ratio::new::<percent>(Self::BACKFLOW_LIMIT))
        }
    }

    fn absolute_flow_calculation(
        &self,
        acs_overhead: &impl AirConditioningOverheadShared,
        number_of_passengers: usize,
        pack: Pack,
        pressurization: &impl CabinAltitude,
    ) -> MassRate {
        let passenger_factor: f64 = if matches!(
            acs_overhead.flow_selector_position(),
            OverheadFlowSelector::Norm
        ) {
            number_of_passengers as f64 / Self::A380_TOTAL_NUMBER_OF_PASSENGERS
        } else {
            1.
        };
        MassRate::new::<kilogram_per_second>(
            self.flow_demand_ratio[pack.to_index()].get::<ratio>()
                * (Self::FLOW_CONSTANT_XCAB * pressurization.altitude().get::<foot>()
                    + Self::FLOW_CONSTANT_C)
                * Self::A320_T0_A380_FLOW_CONVERSION_FACTOR
                * passenger_factor,
        )
    }

    fn actual_flow_percentage_calculation(
        &self,
        pneumatic: &impl PackFlowValveState,
        pressurization: &impl CabinAltitude,
    ) -> [Ratio; 4] {
        let baseline_flow = MassRate::new::<kilogram_per_second>(
            (Self::FLOW_CONSTANT_XCAB * pressurization.altitude().get::<foot>()
                + Self::FLOW_CONSTANT_C)
                * Self::A320_T0_A380_FLOW_CONVERSION_FACTOR,
        );

        [1, 2, 3, 4].map(|pfv_id| {
            Ratio::new::<ratio>(
                pneumatic
                    .pack_flow_valve_air_flow(pfv_id)
                    .get::<kilogram_per_second>()
                    / baseline_flow.get::<kilogram_per_second>(),
            )
        })
    }

    fn update_timer(&mut self, context: &UpdateContext, pneumatic: &impl PackFlowValveState) {
        if pneumatic.pack_flow_valve_is_open(1) || pneumatic.pack_flow_valve_is_open(2) {
            self.fcv_timer_open[0] += context.delta();
        } else {
            self.fcv_timer_open[0] = Duration::from_secs(0);
        }
        if pneumatic.pack_flow_valve_is_open(3) || pneumatic.pack_flow_valve_is_open(4) {
            self.fcv_timer_open[1] += context.delta();
        } else {
            self.fcv_timer_open[1] = Duration::from_secs(0);
        }
    }
}

impl PackFlow for AirGenerationSystemApplication {
    fn pack_flow_demand(&self, pack_id: Pack) -> MassRate {
        self.pack_flow_demand[pack_id.to_index()]
    }
}

impl SimulationElement for AirGenerationSystemApplication {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.pack_flow_id
            .iter()
            .zip(self.flow_ratio)
            .for_each(|(id, flow)| writer.write(id, flow));
    }
}

struct TemperatureControlSystemApplication {
    hot_air_is_enabled_id: [VariableIdentifier; 2],
    hot_air_is_open_id: [VariableIdentifier; 2],

    zone_controllers: [ZoneController; 16],
    hot_air_is_enabled: [bool; 2],
    hot_air_is_open: [bool; 2],
}
impl TemperatureControlSystemApplication {
    fn new(context: &mut InitContext, cabin_zones: &[ZoneType; 18]) -> Self {
        let mut zone_controllers_vec: Vec<ZoneController> = Vec::new();
        for zone in cabin_zones {
            if matches!(zone, ZoneType::Cockpit) || matches!(zone, ZoneType::Cabin(_)) {
                zone_controllers_vec.push(ZoneController::new(zone))
            } else {
                continue;
            }
        }
        let zone_controllers =
            zone_controllers_vec
                .try_into()
                .unwrap_or_else(|v: Vec<ZoneController>| {
                    panic!("Expected a Vec of length {} but it was {}", 16, v.len())
                });
        let hot_air_variable_identifiers = Self::hot_air_id_init(context);
        Self {
            hot_air_is_enabled_id: hot_air_variable_identifiers[0],
            hot_air_is_open_id: hot_air_variable_identifiers[1],
            zone_controllers,
            hot_air_is_enabled: [false; 2],
            hot_air_is_open: [false; 2],
        }
    }

    fn hot_air_id_init(context: &mut InitContext) -> Vec<[VariableIdentifier; 2]> {
        let hot_air_ids: Vec<Vec<String>> = vec![
            [1, 2]
                .iter()
                .map(|id| format!("HOT_AIR_VALVE_{}_IS_ENABLED", id))
                .collect(),
            [1, 2]
                .iter()
                .map(|id| format!("HOT_AIR_VALVE_{}_IS_OPEN", id))
                .collect(),
        ];

        hot_air_ids
            .iter()
            .map(|id_vec| {
                id_vec
                    .iter()
                    .map(|st| context.get_identifier(st.clone()))
                    .collect::<Vec<VariableIdentifier>>()
                    .try_into()
                    .unwrap_or_else(|v: Vec<VariableIdentifier>| {
                        panic!("Expected a Vec of length {} but it was {}", 2, v.len())
                    })
            })
            .collect()
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &impl AirConditioningOverheadShared,
        cabin_temperature: &impl CabinSimulation,
        pressurization: &impl CabinAltitude,
        trim_air_drive_device: &impl TaddShared,
    ) {
        // ACSCActive computer is only relevant to the A320 so we set it as Primary here to maintain commonality
        for (index, zone) in self.zone_controllers.iter_mut().enumerate() {
            zone.update(
                context,
                acs_overhead,
                cabin_temperature.cabin_temperature()[index],
                pressurization,
                &ACSCActiveComputer::Primary,
            )
        }

        self.hot_air_is_enabled = [
            trim_air_drive_device.hot_air_is_enabled(1),
            trim_air_drive_device.hot_air_is_enabled(2),
        ];
        self.hot_air_is_open = [
            trim_air_drive_device.trim_air_pressure_regulating_valve_is_open(1),
            trim_air_drive_device.trim_air_pressure_regulating_valve_is_open(2),
        ];
    }

    fn should_close_taprv(&self) -> [bool; 2] {
        // This signal is used when there is an overheat or leak detection
        // At the moment we hard code it to false until failures are implemented
        [false; 2]
    }
}

impl DuctTemperature for TemperatureControlSystemApplication {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
        let mut duct_demand_temperature = Vec::new();
        for controller in self.zone_controllers.iter() {
            duct_demand_temperature.extend(&controller.duct_demand_temperature())
        }
        duct_demand_temperature
    }
}

impl SimulationElement for TemperatureControlSystemApplication {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.hot_air_is_enabled_id
            .iter()
            .zip(self.hot_air_is_enabled)
            .for_each(|(id, is_enabled)| writer.write(id, is_enabled));
        self.hot_air_is_open_id
            .iter()
            .zip(self.hot_air_is_open)
            .for_each(|(id, is_open)| writer.write(id, is_open));
    }
}
