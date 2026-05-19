use crate::navigation::adirs::{
    air_data_sensors::integrated_probes::{
        IntegratedStaticProbe, IntegratedStaticProbeBusOutput,
        IntegratedStaticProbeInstallationPosition, MultifunctionProbe, MultifunctionProbeBusOutput,
        SideslipAngleProbe, SideslipAngleProbeBusOutput,
    },
    AdrAnalogInput, AdrAnalogInputs,
};
use crate::simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext};

pub trait IntegratedProbesPowerProvider {
    fn isp_dc_powered(&self, num: usize) -> bool;
    fn isp_ac_powered(&self, num: usize) -> bool;
    fn mfp_powered(&self, num: usize) -> bool;
    fn ssp_powered(&self, num: usize) -> bool;
}

pub struct IntegratedAirDataSensorsComplex {
    num: usize,

    mfp: MultifunctionProbe,

    left_isp: IntegratedStaticProbe,
    right_isp: IntegratedStaticProbe,

    sideslip_probe: SideslipAngleProbe,

    analog_input_data: AdrAnalogInputs,
}
impl IntegratedAirDataSensorsComplex {
    pub fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            num,

            mfp: MultifunctionProbe::new(context, num),

            left_isp: IntegratedStaticProbe::new(
                context,
                num,
                IntegratedStaticProbeInstallationPosition::Left,
            ),
            right_isp: IntegratedStaticProbe::new(
                context,
                num,
                IntegratedStaticProbeInstallationPosition::Right,
            ),

            sideslip_probe: SideslipAngleProbe::new(context, num),

            analog_input_data: AdrAnalogInputs::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs_harness: &impl IntegratedProbesPowerProvider,
    ) {
        self.mfp.set_powered(adirs_harness.mfp_powered(self.num));
        self.left_isp.set_powered(
            adirs_harness.isp_dc_powered(self.num),
            adirs_harness.isp_ac_powered(self.num),
        );
        self.right_isp.set_powered(
            adirs_harness.isp_dc_powered(self.num),
            adirs_harness.isp_ac_powered(self.num),
        );
        self.sideslip_probe
            .set_powered(adirs_harness.ssp_powered(self.num));

        self.mfp.update(context);
        self.left_isp.update(context);
        self.right_isp.update(context);
        self.sideslip_probe.update(context);
    }

    pub fn left_isp_bus_output(&self) -> &impl IntegratedStaticProbeBusOutput {
        &self.left_isp
    }

    pub fn right_isp_bus_output(&self) -> &impl IntegratedStaticProbeBusOutput {
        &self.right_isp
    }

    pub fn mfp_bus_output(&self) -> &impl MultifunctionProbeBusOutput {
        &self.mfp
    }

    pub fn ssp_bus_output(&self) -> &impl SideslipAngleProbeBusOutput {
        &self.sideslip_probe
    }

    pub fn adr_analog_inputs(&self) -> &AdrAnalogInputs {
        &self.analog_input_data
    }
}
impl AdrAnalogInput for IntegratedAirDataSensorsComplex {
    fn analog_input(&self) -> &AdrAnalogInputs {
        &self.analog_input_data
    }
}
impl SimulationElement for IntegratedAirDataSensorsComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mfp.accept(visitor);
        self.left_isp.accept(visitor);
        self.right_isp.accept(visitor);
        self.sideslip_probe.accept(visitor);

        visitor.visit(self);
    }
}
