use super::{ApuGenerator, ApuStartMotor, Turbine, TurbineSignal, TurbineState};
use crate::{
    electrical::{
        ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
        ElectricalStateWriter, ElectricitySource, Potential, ProvideFrequency, ProvideLoad,
        ProvidePotential,
    },
    shared::{
        calculate_towards_target_temperature, random_number, ConsumePower, ControllerSignal,
        ElectricalBusType, ElectricalBuses, PotentialOrigin, PowerConsumptionReport,
    },
    simulation::{SimulationElement, SimulatorWriter, UpdateContext},
};
use std::time::Duration;
use uom::si::{
    electric_potential::volt, f64::*, frequency::hertz, power::watt, pressure::psi, ratio::percent,
    temperature_interval, thermodynamic_temperature::degree_celsius,
};

pub struct ShutdownAps3200Turbine {
    egt: ThermodynamicTemperature,
}
impl ShutdownAps3200Turbine {
    pub fn new() -> Self {
        ShutdownAps3200Turbine {
            egt: ThermodynamicTemperature::new::<degree_celsius>(0.),
        }
    }

    fn new_with_egt(egt: ThermodynamicTemperature) -> Self {
        ShutdownAps3200Turbine { egt }
    }
}
impl Turbine for ShutdownAps3200Turbine {
    fn update(
        mut self: Box<Self>,
        context: &UpdateContext,
        _: bool,
        _: bool,
        controller: &dyn ControllerSignal<TurbineSignal>,
    ) -> Box<dyn Turbine> {
        self.egt = calculate_towards_ambient_egt(self.egt, context);

        match controller.signal() {
            Some(TurbineSignal::StartOrContinue) => Box::new(Starting::new(self.egt)),
            Some(TurbineSignal::Stop) | None => self,
        }
    }

    fn n(&self) -> Ratio {
        Ratio::new::<percent>(0.)
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    fn state(&self) -> TurbineState {
        TurbineState::Shutdown
    }

    fn bleed_air_pressure(&self) -> Pressure {
        Pressure::new::<psi>(0.)
    }
}

struct Starting {
    since: Duration,
    n: Ratio,
    egt: ThermodynamicTemperature,
    ignore_calculated_egt: bool,
}
impl Starting {
    fn new(egt: ThermodynamicTemperature) -> Starting {
        Starting {
            since: Duration::from_secs(0),
            n: Ratio::new::<percent>(0.),
            egt,
            ignore_calculated_egt: true,
        }
    }

    fn calculate_egt(&mut self, context: &UpdateContext) -> ThermodynamicTemperature {
        // Refer to APS3200.md for details on the values below and source data.
        const APU_N_TEMP_CONST: f64 = -92.3417137705543;
        const APU_N_TEMP_X: f64 = -14.36417426895237;
        const APU_N_TEMP_X2: f64 = 12.210567963472547;
        const APU_N_TEMP_X3: f64 = -3.005504263233662;
        const APU_N_TEMP_X4: f64 = 0.3808066398934025;
        const APU_N_TEMP_X5: f64 = -0.02679731462093699;
        const APU_N_TEMP_X6: f64 = 0.001163901295794232;
        const APU_N_TEMP_X7: f64 = -0.0000332668380497951;
        const APU_N_TEMP_X8: f64 = 0.00000064601180727581;
        const APU_N_TEMP_X9: f64 = -0.00000000859285727074;
        const APU_N_TEMP_X10: f64 = 0.00000000007717119413;
        const APU_N_TEMP_X11: f64 = -0.00000000000044761099;
        const APU_N_TEMP_X12: f64 = 0.00000000000000151429;
        const APU_N_TEMP_X13: f64 = -0.00000000000000000227;

        let n = self.n.get::<percent>();

        let temperature = ThermodynamicTemperature::new::<degree_celsius>(
            APU_N_TEMP_CONST
                + (APU_N_TEMP_X * n)
                + (APU_N_TEMP_X2 * n.powi(2))
                + (APU_N_TEMP_X3 * n.powi(3))
                + (APU_N_TEMP_X4 * n.powi(4))
                + (APU_N_TEMP_X5 * n.powi(5))
                + (APU_N_TEMP_X6 * n.powi(6))
                + (APU_N_TEMP_X7 * n.powi(7))
                + (APU_N_TEMP_X8 * n.powi(8))
                + (APU_N_TEMP_X9 * n.powi(9))
                + (APU_N_TEMP_X10 * n.powi(10))
                + (APU_N_TEMP_X11 * n.powi(11))
                + (APU_N_TEMP_X12 * n.powi(12))
                + (APU_N_TEMP_X13 * n.powi(13)),
        );

        // The above calculated EGT can be lower than the ambient temperature,
        // or the current APU EGT (when cooling down). To prevent sudden changes
        // in temperature, we ignore the calculated EGT until it exceeds the current
        // EGT.
        let towards_ambient_egt = calculate_towards_ambient_egt(self.egt, context);
        if temperature > towards_ambient_egt {
            self.ignore_calculated_egt = false;
        }

        if self.ignore_calculated_egt {
            towards_ambient_egt
        } else {
            temperature
        }
    }

    fn calculate_n(&self) -> Ratio {
        const APU_N_CONST: f64 = -0.08013606018640967;
        const APU_N_X: f64 = 2.129832736394534;
        const APU_N_X2: f64 = 3.928273438786404;
        const APU_N_X3: f64 = -1.88613299921213;
        const APU_N_X4: f64 = 0.42749452749180916;
        const APU_N_X5: f64 = -0.05757707967690426;
        const APU_N_X6: f64 = 0.005022142795451004;
        const APU_N_X7: f64 = -0.00029612873626050866;
        const APU_N_X8: f64 = 0.00001204152497871946;
        const APU_N_X9: f64 = -0.00000033829604438116;
        const APU_N_X10: f64 = 0.00000000645140818528;
        const APU_N_X11: f64 = -0.00000000007974743535;
        const APU_N_X12: f64 = 0.00000000000057654695;
        const APU_N_X13: f64 = -0.00000000000000185126;

        // Protect against the formula returning decreasing results after this value.
        const TIME_LIMIT: f64 = 45.12;
        const START_IGNITION_AFTER_SECONDS: f64 = 1.5;
        let ignition_turned_on_secs =
            (self.since.as_secs_f64() - START_IGNITION_AFTER_SECONDS).min(TIME_LIMIT);

        if ignition_turned_on_secs > 0. {
            let n = (APU_N_CONST
                + (APU_N_X * ignition_turned_on_secs)
                + (APU_N_X2 * ignition_turned_on_secs.powi(2))
                + (APU_N_X3 * ignition_turned_on_secs.powi(3))
                + (APU_N_X4 * ignition_turned_on_secs.powi(4))
                + (APU_N_X5 * ignition_turned_on_secs.powi(5))
                + (APU_N_X6 * ignition_turned_on_secs.powi(6))
                + (APU_N_X7 * ignition_turned_on_secs.powi(7))
                + (APU_N_X8 * ignition_turned_on_secs.powi(8))
                + (APU_N_X9 * ignition_turned_on_secs.powi(9))
                + (APU_N_X10 * ignition_turned_on_secs.powi(10))
                + (APU_N_X11 * ignition_turned_on_secs.powi(11))
                + (APU_N_X12 * ignition_turned_on_secs.powi(12))
                + (APU_N_X13 * ignition_turned_on_secs.powi(13)))
            .min(100.)
            .max(0.);

            Ratio::new::<percent>(n)
        } else {
            Ratio::new::<percent>(0.)
        }
    }
}
impl Turbine for Starting {
    fn update(
        mut self: Box<Self>,
        context: &UpdateContext,
        _: bool,
        _: bool,
        controller: &dyn ControllerSignal<TurbineSignal>,
    ) -> Box<dyn Turbine> {
        self.since += context.delta();
        self.n = self.calculate_n();
        self.egt = self.calculate_egt(context);

        match controller.signal() {
            Some(TurbineSignal::Stop) | None => Box::new(Stopping::new(self.egt, self.n)),
            Some(TurbineSignal::StartOrContinue)
                if { (self.n.get::<percent>() - 100.).abs() < f64::EPSILON } =>
            {
                Box::new(Running::new(self.egt))
            }
            Some(TurbineSignal::StartOrContinue) => self,
        }
    }

    fn n(&self) -> Ratio {
        self.n
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    fn state(&self) -> TurbineState {
        TurbineState::Starting
    }

    fn bleed_air_pressure(&self) -> Pressure {
        Pressure::new::<psi>(0.)
    }
}

struct BleedAirUsageEgtDelta {
    current: f64,
    target: f64,
    max: f64,
    min: f64,
}
impl BleedAirUsageEgtDelta {
    fn new() -> Self {
        let randomisation = 0.95 + ((random_number() % 101) as f64 / 1000.);

        Self {
            current: 0.,
            target: 0.,
            max: 90. * randomisation,
            min: 0.,
        }
    }

    fn update(&mut self, context: &UpdateContext, apu_bleed_is_used: bool) {
        self.target = if apu_bleed_is_used {
            self.max
        } else {
            self.min
        };

        if (self.current - self.target).abs() > f64::EPSILON {
            if self.current > self.target {
                self.current -= self.delta_per_second() * context.delta_as_secs_f64();
            } else {
                self.current += self.delta_per_second() * context.delta_as_secs_f64();
            }
        }

        self.current = self.current.max(self.min).min(self.max);
    }

    fn egt_delta(&self) -> TemperatureInterval {
        TemperatureInterval::new::<temperature_interval::degree_celsius>(self.current)
    }

    fn delta_per_second(&self) -> f64 {
        // Loosely based on bleed on data provided in a video by Komp.
        // The very much relates to pneumatics and thus could be improved further
        // once we built that.
        const BLEED_AIR_DELTA_TEMP_CONST: f64 = 0.46763348242588143;
        const BLEED_AIR_DELTA_TEMP_X: f64 = 0.43114440400626697;
        const BLEED_AIR_DELTA_TEMP_X2: f64 = -0.11064487957454393;
        const BLEED_AIR_DELTA_TEMP_X3: f64 = 0.010414691679270397;
        const BLEED_AIR_DELTA_TEMP_X4: f64 = -0.00045307219981909655;
        const BLEED_AIR_DELTA_TEMP_X5: f64 = 0.00001063664878607912;
        const BLEED_AIR_DELTA_TEMP_X6: f64 = -0.00000013763963889674;
        const BLEED_AIR_DELTA_TEMP_X7: f64 = 0.00000000091837058563;
        const BLEED_AIR_DELTA_TEMP_X8: f64 = -0.00000000000246054885;

        let difference = if self.current > self.target {
            self.current - self.target
        } else {
            self.target - self.current
        };

        BLEED_AIR_DELTA_TEMP_CONST
            + (BLEED_AIR_DELTA_TEMP_X * difference)
            + (BLEED_AIR_DELTA_TEMP_X2 * difference.powi(2))
            + (BLEED_AIR_DELTA_TEMP_X3 * difference.powi(3))
            + (BLEED_AIR_DELTA_TEMP_X4 * difference.powi(4))
            + (BLEED_AIR_DELTA_TEMP_X5 * difference.powi(5))
            + (BLEED_AIR_DELTA_TEMP_X6 * difference.powi(6))
            + (BLEED_AIR_DELTA_TEMP_X7 * difference.powi(7))
            + (BLEED_AIR_DELTA_TEMP_X8 * difference.powi(8))
    }
}

struct ApuGenUsageEgtDelta {
    time: Duration,
    base_egt_delta_per_second: f64,
}
impl ApuGenUsageEgtDelta {
    // We just assume it takes 10 seconds to get to our target.
    const SECONDS_TO_REACH_TARGET: u64 = 10;
    fn new() -> Self {
        Self {
            time: Duration::from_secs(0),
            base_egt_delta_per_second: (10. + ((random_number() % 6) as f64))
                / ApuGenUsageEgtDelta::SECONDS_TO_REACH_TARGET as f64,
        }
    }

    fn update(&mut self, context: &UpdateContext, apu_gen_is_used: bool) {
        self.time = if apu_gen_is_used {
            (self.time + context.delta()).min(Duration::from_secs(
                ApuGenUsageEgtDelta::SECONDS_TO_REACH_TARGET,
            ))
        } else {
            Duration::from_secs_f64((self.time.as_secs_f64() - context.delta_as_secs_f64()).max(0.))
        };
    }

    fn egt_delta(&self) -> TemperatureInterval {
        TemperatureInterval::new::<temperature_interval::degree_celsius>(
            self.time.as_secs_f64() * self.base_egt_delta_per_second,
        )
    }
}

struct Running {
    egt: ThermodynamicTemperature,
    base_egt: ThermodynamicTemperature,
    base_egt_deviation: TemperatureInterval,
    bleed_air_usage: BleedAirUsageEgtDelta,
    apu_gen_usage: ApuGenUsageEgtDelta,
}
impl Running {
    fn new(egt: ThermodynamicTemperature) -> Running {
        let base_egt = 340. + ((random_number() % 11) as f64);
        Running {
            egt,
            base_egt: ThermodynamicTemperature::new::<degree_celsius>(base_egt),
            // This contains the deviation from the base EGT at the moment of entering the running state.
            // This code assumes the base EGT is lower than the EGT at this point in time, which is always the case.
            // Should this change in the future, then changes have to be made here.
            base_egt_deviation: TemperatureInterval::new::<temperature_interval::degree_celsius>(
                egt.get::<degree_celsius>() - base_egt,
            ),
            bleed_air_usage: BleedAirUsageEgtDelta::new(),
            apu_gen_usage: ApuGenUsageEgtDelta::new(),
        }
    }

    fn calculate_egt(
        &mut self,
        context: &UpdateContext,
        apu_gen_is_used: bool,
        apu_bleed_is_used: bool,
    ) -> ThermodynamicTemperature {
        // Reduce the deviation by 1 per second to slowly creep back to normal temperatures
        self.base_egt_deviation -= TemperatureInterval::new::<temperature_interval::degree_celsius>(
            (context.delta_as_secs_f64() * 1.).min(
                self.base_egt_deviation
                    .get::<temperature_interval::degree_celsius>(),
            ),
        );

        let mut target = self.base_egt + self.base_egt_deviation;
        self.apu_gen_usage.update(context, apu_gen_is_used);
        target += self.apu_gen_usage.egt_delta();

        self.bleed_air_usage.update(context, apu_bleed_is_used);
        target += self.bleed_air_usage.egt_delta();

        target
    }
}
impl Turbine for Running {
    fn update(
        mut self: Box<Self>,
        context: &UpdateContext,
        apu_bleed_is_used: bool,
        apu_gen_is_used: bool,
        controller: &dyn ControllerSignal<TurbineSignal>,
    ) -> Box<dyn Turbine> {
        self.egt = self.calculate_egt(context, apu_gen_is_used, apu_bleed_is_used);

        match controller.signal() {
            Some(TurbineSignal::StartOrContinue) => self,
            Some(TurbineSignal::Stop) | None => {
                Box::new(Stopping::new(self.egt, Ratio::new::<percent>(100.)))
            }
        }
    }

    fn n(&self) -> Ratio {
        Ratio::new::<percent>(100.)
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    fn state(&self) -> TurbineState {
        TurbineState::Running
    }

    fn bleed_air_pressure(&self) -> Pressure {
        Pressure::new::<psi>(42.)
    }
}

struct Stopping {
    since: Duration,
    base_temperature: ThermodynamicTemperature,
    // When the APU start is unsuccessful the stopping state
    // is entered with N < 100%. This factor ensures that we damped
    // the resulting N calculated by this state, to ensure N doesn't
    // suddenly go from 30 to 100.
    n_factor: f64,
    // When the APU start is unsuccessful the stopping state
    // is entered with N < 100%. As EGT in this state is a function of N,
    // we need to adapt the EGT calculation to this. This ensures EGT
    // doesn't just suddenly drop by e.g. 80 degrees due to the low N.
    egt_delta_at_entry: TemperatureInterval,
    n: Ratio,
    egt: ThermodynamicTemperature,
}
impl Stopping {
    fn new(egt: ThermodynamicTemperature, n: Ratio) -> Stopping {
        Stopping {
            since: Duration::from_secs(0),
            base_temperature: egt,
            n_factor: n.get::<percent>() / 100.,
            egt_delta_at_entry: Stopping::calculate_egt_delta(n),
            n,
            egt,
        }
    }

    fn calculate_egt_delta(n: Ratio) -> TemperatureInterval {
        // Refer to APS3200.md for details on the values below and source data.
        const APU_N_TEMP_DELTA_CONST: f64 = -125.73137672208446;
        const APU_N_TEMP_DELTA_X: f64 = 2.7141683591219037;
        const APU_N_TEMP_DELTA_X2: f64 = -0.8102923071483102;
        const APU_N_TEMP_DELTA_X3: f64 = 0.08890509495240731;
        const APU_N_TEMP_DELTA_X4: f64 = -0.003509532681984154;
        const APU_N_TEMP_DELTA_X5: f64 = -0.00002709133732344767;
        const APU_N_TEMP_DELTA_X6: f64 = 0.00000749250123766767;
        const APU_N_TEMP_DELTA_X7: f64 = -0.00000030306978045244;
        const APU_N_TEMP_DELTA_X8: f64 = 0.00000000641099706269;
        const APU_N_TEMP_DELTA_X9: f64 = -0.00000000008068326110;
        const APU_N_TEMP_DELTA_X10: f64 = 0.00000000000060754088;
        const APU_N_TEMP_DELTA_X11: f64 = -0.00000000000000253354;
        const APU_N_TEMP_DELTA_X12: f64 = 0.00000000000000000451;

        let n = n.get::<percent>();
        TemperatureInterval::new::<temperature_interval::degree_celsius>(
            APU_N_TEMP_DELTA_CONST
                + (APU_N_TEMP_DELTA_X * n)
                + (APU_N_TEMP_DELTA_X2 * n.powi(2))
                + (APU_N_TEMP_DELTA_X3 * n.powi(3))
                + (APU_N_TEMP_DELTA_X4 * n.powi(4))
                + (APU_N_TEMP_DELTA_X5 * n.powi(5))
                + (APU_N_TEMP_DELTA_X6 * n.powi(6))
                + (APU_N_TEMP_DELTA_X7 * n.powi(7))
                + (APU_N_TEMP_DELTA_X8 * n.powi(8))
                + (APU_N_TEMP_DELTA_X9 * n.powi(9))
                + (APU_N_TEMP_DELTA_X10 * n.powi(10))
                + (APU_N_TEMP_DELTA_X11 * n.powi(11))
                + (APU_N_TEMP_DELTA_X12 * n.powi(12)),
        )
    }

    fn calculate_n(since: Duration) -> Ratio {
        // Refer to APS3200.md for details on the values below and source data.
        const APU_N_CONST: f64 = 100.22975364965701;
        const APU_N_X: f64 = -24.692008355859773;
        const APU_N_X2: f64 = 2.6116524551318787;
        const APU_N_X3: f64 = 0.006812541903222142;
        const APU_N_X4: f64 = -0.03134644787752123;
        const APU_N_X5: f64 = 0.0036345606954833213;
        const APU_N_X6: f64 = -0.00021794252200618456;
        const APU_N_X7: f64 = 0.00000798097055109138;
        const APU_N_X8: f64 = -0.00000018481154462604;
        const APU_N_X9: f64 = 0.00000000264691628669;
        const APU_N_X10: f64 = -0.00000000002143677577;
        const APU_N_X11: f64 = 0.00000000000007515448;

        // Protect against the formula returning increasing results after this value.
        const TIME_LIMIT: f64 = 49.411;
        let since = since.as_secs_f64().min(TIME_LIMIT);

        let n = (APU_N_CONST
            + (APU_N_X * since)
            + (APU_N_X2 * since.powi(2))
            + (APU_N_X3 * since.powi(3))
            + (APU_N_X4 * since.powi(4))
            + (APU_N_X5 * since.powi(5))
            + (APU_N_X6 * since.powi(6))
            + (APU_N_X7 * since.powi(7))
            + (APU_N_X8 * since.powi(8))
            + (APU_N_X9 * since.powi(9))
            + (APU_N_X10 * since.powi(10))
            + (APU_N_X11 * since.powi(11)))
        .min(100.)
        .max(0.);

        Ratio::new::<percent>(n)
    }
}
impl Turbine for Stopping {
    fn update(
        mut self: Box<Self>,
        context: &UpdateContext,
        _: bool,
        _: bool,
        _: &dyn ControllerSignal<TurbineSignal>,
    ) -> Box<dyn Turbine> {
        self.since += context.delta();
        self.n = Stopping::calculate_n(self.since) * self.n_factor;
        self.egt =
            self.base_temperature + Stopping::calculate_egt_delta(self.n) - self.egt_delta_at_entry;

        if self.n.get::<percent>() == 0. {
            Box::new(ShutdownAps3200Turbine::new_with_egt(self.egt))
        } else {
            self
        }
    }

    fn n(&self) -> Ratio {
        self.n
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    fn state(&self) -> TurbineState {
        TurbineState::Stopping
    }

    fn bleed_air_pressure(&self) -> Pressure {
        Pressure::new::<psi>(0.)
    }
}

fn calculate_towards_ambient_egt(
    current_egt: ThermodynamicTemperature,
    context: &UpdateContext,
) -> ThermodynamicTemperature {
    const APU_AMBIENT_COEFFICIENT: f64 = 1.;
    calculate_towards_target_temperature(
        current_egt,
        context.ambient_temperature(),
        APU_AMBIENT_COEFFICIENT,
        context.delta(),
    )
}

/// APS3200 APU Generator
pub struct Aps3200ApuGenerator {
    number: usize,
    identifier: ElectricalElementIdentifier,
    n: Ratio,
    writer: ElectricalStateWriter,
    output_frequency: Frequency,
    output_potential: ElectricPotential,
    load: Ratio,
    is_emergency_shutdown: bool,
}
impl Aps3200ApuGenerator {
    pub(super) const APU_GEN_POWERED_N: f64 = 84.;

    pub fn new(
        number: usize,
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> Aps3200ApuGenerator {
        Aps3200ApuGenerator {
            number,
            identifier: identifier_provider.next(),
            n: Ratio::new::<percent>(0.),
            writer: ElectricalStateWriter::new(&format!("APU_GEN_{}", number)),
            output_potential: ElectricPotential::new::<volt>(0.),
            output_frequency: Frequency::new::<hertz>(0.),
            load: Ratio::new::<percent>(0.),
            is_emergency_shutdown: false,
        }
    }

    fn calculate_potential(&self, n: Ratio) -> ElectricPotential {
        let n = n.get::<percent>();

        if n < Aps3200ApuGenerator::APU_GEN_POWERED_N {
            panic!("Should not be invoked for APU N below {}", n);
        } else if n < 85. {
            ElectricPotential::new::<volt>(105.)
        } else {
            ElectricPotential::new::<volt>(115.)
        }
    }

    fn calculate_frequency(&self, n: Ratio) -> Frequency {
        let n = n.get::<percent>();

        // Refer to APS3200.md for details on the values below and source data.
        if n < Aps3200ApuGenerator::APU_GEN_POWERED_N {
            panic!("Should not be invoked for APU N below {}", n);
        } else if n < 100. {
            const APU_FREQ_CONST: f64 = -6798871.803967841;
            const APU_FREQ_X: f64 = 461789.45241984475;
            const APU_FREQ_X2: f64 = -13021.412660356296;
            const APU_FREQ_X3: f64 = 195.15835365339123;
            const APU_FREQ_X4: f64 = -1.639931967033938;
            const APU_FREQ_X5: f64 = 0.007326808864133604;
            const APU_FREQ_X6: f64 = -0.00001359879185066017;

            Frequency::new::<hertz>(
                APU_FREQ_CONST
                    + (APU_FREQ_X * n)
                    + (APU_FREQ_X2 * n.powi(2))
                    + (APU_FREQ_X3 * n.powi(3))
                    + (APU_FREQ_X4 * n.powi(4))
                    + (APU_FREQ_X5 * n.powi(5))
                    + (APU_FREQ_X6 * n.powi(6)),
            )
        } else {
            Frequency::new::<hertz>(400.)
        }
    }

    fn should_provide_output(&self) -> bool {
        !self.is_emergency_shutdown
            && self.n.get::<percent>() >= Aps3200ApuGenerator::APU_GEN_POWERED_N
    }
}
impl ApuGenerator for Aps3200ApuGenerator {
    fn update(&mut self, n: Ratio, is_emergency_shutdown: bool) {
        self.n = n;
        self.is_emergency_shutdown = is_emergency_shutdown;
    }

    /// Indicates if the provided electricity's potential and frequency
    /// are within normal parameters. Use this to decide if the
    /// generator contactor should close.
    /// Load shouldn't be taken into account, as overloading causes an
    /// overtemperature which over time will trigger a mechanical
    /// disconnect of the generator.
    fn output_within_normal_parameters(&self) -> bool {
        self.should_provide_output() && self.potential_normal() && self.frequency_normal()
    }
}
provide_potential!(Aps3200ApuGenerator, (110.0..=120.0));
provide_frequency!(Aps3200ApuGenerator, (390.0..=410.0));
provide_load!(Aps3200ApuGenerator);
impl ElectricalElement for Aps3200ApuGenerator {
    fn input_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn output_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn is_conductive(&self) -> bool {
        true
    }
}
impl ElectricitySource for Aps3200ApuGenerator {
    fn output_potential(&self) -> Potential {
        if self.should_provide_output() {
            Potential::new(
                PotentialOrigin::ApuGenerator(self.number),
                self.output_potential,
            )
        } else {
            Potential::none()
        }
    }
}
impl SimulationElement for Aps3200ApuGenerator {
    fn write(&self, writer: &mut SimulatorWriter) {
        self.writer.write_alternating_with_load(self, writer);
    }

    fn process_power_consumption_report<T: PowerConsumptionReport>(
        &mut self,
        _: &UpdateContext,
        report: &T,
    ) {
        self.output_potential = if self.should_provide_output() {
            self.calculate_potential(self.n)
        } else {
            ElectricPotential::new::<volt>(0.)
        };

        self.output_frequency = if self.should_provide_output() {
            self.calculate_frequency(self.n)
        } else {
            Frequency::new::<hertz>(0.)
        };

        let power_consumption = report
            .total_consumption_of(PotentialOrigin::ApuGenerator(self.number))
            .get::<watt>();
        let power_factor_correction = 0.8;
        let maximum_load = 90000.;
        self.load = Ratio::new::<percent>(
            (power_consumption * power_factor_correction / maximum_load) * 100.,
        );
    }
}

pub struct Aps3200StartMotor {
    /// On the A320, the start motor is powered through the DC BAT BUS.
    /// There are however additional contactors which open and close based on
    /// overhead panel push button positions. Therefore we cannot simply look
    /// at whether or not DC BAT BUS is powered, but must instead handle
    /// potential coming in via those contactors.
    powered_by: ElectricalBusType,
    is_powered: bool,
    powered_since: Duration,
}
impl Aps3200StartMotor {
    pub fn new(powered_by: ElectricalBusType) -> Self {
        Aps3200StartMotor {
            powered_by,
            is_powered: false,
            powered_since: Duration::from_secs(0),
        }
    }
}
impl ApuStartMotor for Aps3200StartMotor {
    fn is_powered(&self) -> bool {
        self.is_powered
    }
}
impl SimulationElement for Aps3200StartMotor {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, context: &UpdateContext, consumption: &mut T) {
        if !self.is_powered {
            self.powered_since = Duration::from_secs(0);
        } else {
            self.powered_since += context.delta();

            const APU_W_CONST: f64 = 9933.453168671222;
            const APU_W_X: f64 = -1319.1431831932327;
            const APU_W_X2: f64 = 236.32171392861937;
            const APU_W_X3: f64 = -34.01201082369166;
            const APU_W_X4: f64 = 3.168505536233231;
            const APU_W_X5: f64 = -0.17850758460976182;
            const APU_W_X6: f64 = 0.005403593330801297;
            const APU_W_X7: f64 = -0.0000663926018728314;

            let since = self.powered_since.as_secs_f64();

            let w = (APU_W_CONST
                + (APU_W_X * since)
                + (APU_W_X2 * since.powi(2))
                + (APU_W_X3 * since.powi(3))
                + (APU_W_X4 * since.powi(4))
                + (APU_W_X5 * since.powi(5))
                + (APU_W_X6 * since.powi(6))
                + (APU_W_X7 * since.powi(7)))
            .max(0.);

            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(w));
        }
    }
}

#[cfg(test)]
mod apu_generator_tests {
    use ntest::assert_about_eq;
    use uom::si::frequency::hertz;

    use crate::{
        apu::tests::{test_bed, test_bed_with},
        shared,
        simulation::test::{ElementCtorFn, SimulationTestBed, TestAircraft, TestBed},
    };

    use super::*;

    #[test]
    fn starts_without_output() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(apu_generator));

        assert!(!test_bed
            .query_element_elec(|e, elec| { shared::PowerConsumptionReport::is_powered(elec, e) }));
    }

    #[test]
    fn when_apu_running_provides_output() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(apu_generator));

        update_below_threshold(&mut test_bed);
        update_above_threshold(&mut test_bed);

        assert!(test_bed
            .query_element_elec(|e, elec| { shared::PowerConsumptionReport::is_powered(elec, e) }));
    }

    #[test]
    fn when_apu_shutdown_provides_no_output() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(apu_generator));

        update_above_threshold(&mut test_bed);
        update_below_threshold(&mut test_bed);

        assert!(!test_bed
            .query_element_elec(|e, elec| { shared::PowerConsumptionReport::is_powered(elec, e) }));
    }

    #[test]
    fn from_n_84_provides_voltage() {
        let mut test_bed = test_bed_with().starting_apu();

        loop {
            test_bed = test_bed.run(Duration::from_millis(50));

            let n = test_bed.n().normal_value().unwrap().get::<percent>();
            if n > 84. {
                assert!(test_bed.potential().get::<volt>() > 0.);
            }

            if (n - 100.).abs() < f64::EPSILON {
                break;
            }
        }
    }

    #[test]
    fn from_n_84_has_frequency() {
        let mut test_bed = test_bed_with().starting_apu();

        loop {
            test_bed = test_bed.run(Duration::from_millis(50));

            let n = test_bed.n().normal_value().unwrap().get::<percent>();
            if n > 84. {
                assert!(test_bed.frequency().get::<hertz>() > 0.);
            }

            if (n - 100.).abs() < f64::EPSILON {
                break;
            }
        }
    }

    #[test]
    fn in_normal_conditions_when_n_100_voltage_114_or_115() {
        let mut test_bed = test_bed_with().running_apu();

        for _ in 0..100 {
            test_bed = test_bed.run(Duration::from_millis(50));

            let voltage = test_bed.potential().get::<volt>();
            assert!((114.0..=115.0).contains(&voltage))
        }
    }

    #[test]
    fn in_normal_conditions_when_n_100_frequency_400() {
        let mut test_bed = test_bed_with().running_apu();

        for _ in 0..100 {
            test_bed = test_bed.run(Duration::from_millis(50));

            let frequency = test_bed.frequency().get::<hertz>();
            assert_about_eq!(frequency, 400.);
        }
    }

    #[test]
    fn when_shutdown_frequency_not_normal() {
        let mut test_bed = test_bed().run(Duration::from_secs(1_000));

        assert!(!test_bed.frequency_within_normal_range());
    }

    #[test]
    fn when_running_frequency_normal() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .run(Duration::from_secs(1_000));

        assert!(test_bed.frequency_within_normal_range());
    }

    #[test]
    fn when_shutdown_potential_not_normal() {
        let mut test_bed = test_bed().run(Duration::from_secs(1_000));

        assert!(!test_bed.potential_within_normal_range());
    }

    #[test]
    fn when_running_potential_normal() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .run(Duration::from_secs(1_000));

        assert!(test_bed.potential_within_normal_range());
    }

    #[test]
    fn when_shutdown_has_no_load() {
        let mut test_bed = test_bed().run(Duration::from_secs(1_000));

        assert_eq!(test_bed.load(), Ratio::new::<percent>(0.));
    }

    #[test]
    fn when_running_but_potential_unused_has_no_load() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .power_demand(Power::new::<watt>(0.))
            .run(Duration::from_secs(1_000));

        assert_eq!(test_bed.load(), Ratio::new::<percent>(0.));
    }

    #[test]
    fn when_running_and_potential_used_has_load() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .power_demand(Power::new::<watt>(50000.))
            .run(Duration::from_secs(1_000));

        assert!(test_bed.load() > Ratio::new::<percent>(0.));
    }

    #[test]
    fn when_load_below_maximum_it_is_normal() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .power_demand(Power::new::<watt>(90000. / 0.8))
            .run(Duration::from_secs(1_000));

        assert!(test_bed.load_within_normal_range());
    }

    #[test]
    fn when_load_exceeds_maximum_not_normal() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .power_demand(Power::new::<watt>((90000. / 0.8) + 1.))
            .run(Duration::from_secs(1_000));

        assert!(!test_bed.load_within_normal_range());
    }

    #[test]
    fn when_apu_emergency_shutdown_provides_no_output() {
        let test_bed = test_bed_with()
            .running_apu()
            .and()
            .released_apu_fire_pb()
            .run(Duration::from_secs(1));

        assert!(test_bed.generator_is_unpowered());
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(apu_generator));

        test_bed.run();

        assert!(test_bed.contains_key("ELEC_APU_GEN_1_POTENTIAL"));
        assert!(test_bed.contains_key("ELEC_APU_GEN_1_POTENTIAL_NORMAL"));
        assert!(test_bed.contains_key("ELEC_APU_GEN_1_FREQUENCY"));
        assert!(test_bed.contains_key("ELEC_APU_GEN_1_FREQUENCY_NORMAL"));
        assert!(test_bed.contains_key("ELEC_APU_GEN_1_LOAD"));
        assert!(test_bed.contains_key("ELEC_APU_GEN_1_LOAD_NORMAL"));
    }

    fn apu_generator(
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> Aps3200ApuGenerator {
        Aps3200ApuGenerator::new(1, identifier_provider)
    }

    fn update_above_threshold(test_bed: &mut SimulationTestBed<TestAircraft<Aps3200ApuGenerator>>) {
        test_bed.set_update_before_power_distribution(|generator, _, electricity| {
            generator.update(Ratio::new::<percent>(100.), false);
            electricity.supplied_by(generator);
        });
        test_bed.run();
    }

    fn update_below_threshold(test_bed: &mut SimulationTestBed<TestAircraft<Aps3200ApuGenerator>>) {
        test_bed.set_update_before_power_distribution(|generator, _, electricity| {
            generator.update(Ratio::new::<percent>(0.), false);
            electricity.supplied_by(generator);
        });
        test_bed.run();
    }
}
