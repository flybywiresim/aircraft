use crate::navigation::adirs::{
    air_data_sensors::{
        air_data_module::{
            AirDataModule, AirDataModuleBusOutput, AirDataModuleInstallationPosition,
        },
        AngleOfAttackVane, PitotTube, PressureTube, StaticPort, TemperatureProbe,
        TotalAirTemperatureProbe, WindVane,
    },
    AdiruNumber, AdrAnalogInput, AdrAnalogInputs, AirDataModulePowerProvider,
};
use crate::simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext};

use uom::si::{angle::degree, thermodynamic_temperature::degree_celsius};

pub trait AngleOfAttackExcitationPowerProvider {
    fn aoa_excitation_powered(&self) -> bool;
}

pub struct AirDataModuleAirDataSensorsComplex {
    pitot_tube: PitotTube,

    left_static_port: StaticPort,
    right_static_port: StaticPort,

    pressure_tube: Option<PressureTube>,

    aoa_probe: AngleOfAttackVane,

    tat_probe: Option<TotalAirTemperatureProbe>,

    adm_1: AirDataModule,
    adm_2: AirDataModule,
    adm_3: Option<AirDataModule>,

    analog_input_data: AdrAnalogInputs,
}
impl AirDataModuleAirDataSensorsComplex {
    pub fn new(context: &mut InitContext, num: AdiruNumber) -> Self {
        Self {
            pitot_tube: PitotTube::new(context, num),

            left_static_port: StaticPort::new(context, num),
            right_static_port: StaticPort::new(context, num),

            pressure_tube: if num == AdiruNumber::Three {
                Some(PressureTube::new())
            } else {
                None
            },

            aoa_probe: AngleOfAttackVane::new(context, num),

            tat_probe: if num == AdiruNumber::Three {
                None
            } else {
                Some(TotalAirTemperatureProbe::new(context))
            },

            adm_1: AirDataModule::new(context, AirDataModuleInstallationPosition::TotalPressure),
            adm_2: AirDataModule::new(
                context,
                if num == AdiruNumber::Three {
                    AirDataModuleInstallationPosition::AverageStaticPressure
                } else {
                    AirDataModuleInstallationPosition::LeftStaticPressure
                },
            ),
            adm_3: if num == AdiruNumber::Three {
                None
            } else {
                Some(AirDataModule::new(
                    context,
                    AirDataModuleInstallationPosition::RightStaticPressure,
                ))
            },

            analog_input_data: AdrAnalogInputs::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adiru: &impl AirDataModulePowerProvider,
        adiru_harness: &impl AngleOfAttackExcitationPowerProvider,
        tat_probe_1: Option<&TotalAirTemperatureProbe>,
    ) {
        self.adm_1.set_powered(adiru.provides_power());
        self.adm_2.set_powered(adiru.provides_power());
        if let Some(adm_3) = &mut self.adm_3 {
            adm_3.set_powered(adiru.provides_power());
        }

        self.adm_1.update(context, &self.pitot_tube);

        if let Some(pressure_tube) = &mut self.pressure_tube {
            pressure_tube.update(&self.left_static_port, &self.right_static_port);

            self.adm_2.update(context, pressure_tube);
        } else {
            self.adm_2.update(context, &self.left_static_port);
        };

        if let Some(adm_3) = &mut self.adm_3 {
            adm_3.update(context, &self.right_static_port);
        };

        self.analog_input_data.aoa_excitation_voltage_v = if adiru_harness.aoa_excitation_powered()
        {
            26.
        } else {
            0.
        };
        self.analog_input_data.aoa_resolver_angle_deg = self.aoa_probe.get_angle().get::<degree>();
        self.analog_input_data.tat_value_deg_c = if let Some(tat_probe) = &self.tat_probe {
            tat_probe.get_temperature()
        } else {
            tat_probe_1
                .expect("No TAT probe 1 received in ADIRU 3 sensors.")
                .get_temperature()
        }
        .get::<degree_celsius>()
    }

    pub fn adm_1_bus_output(&self) -> &impl AirDataModuleBusOutput {
        &self.adm_1
    }

    pub fn adm_2_bus_output(&self) -> &impl AirDataModuleBusOutput {
        &self.adm_2
    }

    pub fn adm_3_bus_output(&self) -> Option<&impl AirDataModuleBusOutput> {
        self.adm_3.as_ref()
    }

    pub fn adr_analog_inputs(&self) -> &AdrAnalogInputs {
        &self.analog_input_data
    }

    pub fn tat_probe(&self) -> Option<&TotalAirTemperatureProbe> {
        self.tat_probe.as_ref()
    }
}
impl AdrAnalogInput for AirDataModuleAirDataSensorsComplex {
    fn analog_input(&self) -> &AdrAnalogInputs {
        &self.analog_input_data
    }
}
impl SimulationElement for AirDataModuleAirDataSensorsComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.aoa_probe.accept(visitor);
        if let Some(tat_probe) = &mut self.tat_probe {
            tat_probe.accept(visitor);
        }
        self.pitot_tube.accept(visitor);
        self.left_static_port.accept(visitor);
        self.right_static_port.accept(visitor);

        visitor.visit(self);
    }
}
