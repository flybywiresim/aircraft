use std::time::Duration;

use uom::{
    si::{
        electric_potential::volt, f64::*, frequency::hertz, power::watt, pressure::psi,
        ratio::percent, temperature_interval, thermodynamic_temperature::degree_celsius,
    },
    ConstZero,
};

use crate::{
    electrical::{
        ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
        ElectricalStateWriter, ElectricitySource, Potential, ProvideFrequency, ProvideLoad,
        ProvidePotential,
    },
    failures::{Failure, FailureType},
    shared::{
        calculate_towards_target_temperature, random_number, ConsumePower, ControllerSignal,
        ElectricalBusType, ElectricalBuses, InternationalStandardAtmosphere, PotentialOrigin,
        PowerConsumptionReport,
    },
    simulation::{InitContext, SimulationElement, SimulatorWriter, UpdateContext},
};

use super::{ApuConstants, ApuGenerator, ApuStartMotor, Turbine, TurbineSignal, TurbineState};

pub struct Pw980Constants;

impl ApuConstants for Pw980Constants {
    const RUNNING_WARNING_EGT: f64 = 900.; // Deg C
    const BLEED_AIR_COOLDOWN_DURATION: Duration = Duration::ZERO;
    const COOLDOWN_DURATION: Duration = Duration::from_secs(60);
    const AIR_INTAKE_FLAP_CLOSURE_PERCENT: f64 = 8.;
    const SHOULD_BE_AVAILABLE_DURING_SHUTDOWN: bool = false;
    const FUEL_LINE_ID: u8 = 141;
}

pub struct ShutdownPw980Turbine {
    egt: ThermodynamicTemperature,
}
impl ShutdownPw980Turbine {
    pub fn new() -> Self {
        ShutdownPw980Turbine {
            egt: ThermodynamicTemperature::new::<degree_celsius>(0.),
        }
    }

    fn new_with_egt(egt: ThermodynamicTemperature) -> Self {
        ShutdownPw980Turbine { egt }
    }
}
impl Turbine for ShutdownPw980Turbine {
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
        Ratio::default()
    }

    fn n2(&self) -> Ratio {
        Ratio::default()
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    fn state(&self) -> TurbineState {
        TurbineState::Shutdown
    }

    fn bleed_air_pressure(&self) -> Pressure {
        Pressure::new::<psi>(14.7)
    }
}

struct Starting {
    since: Duration,
    n: Ratio,
    n2: Ratio,
    egt: ThermodynamicTemperature,
    ignore_calculated_egt: bool,
}
impl Starting {
    fn new(egt: ThermodynamicTemperature) -> Starting {
        Starting {
            since: Duration::from_secs(0),
            n: Ratio::default(),
            n2: Ratio::default(),
            egt,
            ignore_calculated_egt: true,
        }
    }

    fn calculate_egt(&mut self, context: &UpdateContext) -> ThermodynamicTemperature {
        // Refer to PW980.md for details on the values below and source data.
        const APU_N_TEMP_CONST: f64 = -67.85561068313169;
        const APU_N_TEMP_X: f64 = -19.73523738237853;
        const APU_N_TEMP_X2: f64 = 6.783591758864128;
        const APU_N_TEMP_X3: f64 = -1.354053749875857;
        const APU_N_TEMP_X4: f64 = 0.199775433274065;
        const APU_N_TEMP_X5: f64 = -0.016572248620575;
        const APU_N_TEMP_X6: f64 = 0.000825776909269339;
        const APU_N_TEMP_X7: f64 = -0.0000265086884405999;
        const APU_N_TEMP_X8: f64 = 0.00000057022185938753;
        const APU_N_TEMP_X9: f64 = -0.00000000833200627317;
        const APU_N_TEMP_X10: f64 = 0.00000000008183640106;
        const APU_N_TEMP_X11: f64 = -0.00000000000051825045;
        const APU_N_TEMP_X12: f64 = 0.00000000000000191477;
        const APU_N_TEMP_X13: f64 = -0.00000000000000000314;

        // We use N2 for this calculation
        let n = self.n2.get::<percent>();

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
        // N1 is driven by N2. We use N2 as base until N2 = 75%, at which point we use time as base
        // to capture the changes in N1 at the "top of the range" for little N2 change.

        // N2 to N1 constants
        const APU_N_N2_CONST: f64 = -1.980342480028972;
        const APU_N_N2_X: f64 = 3.042566978305871;
        const APU_N_N2_X2: f64 = -1.540881433592518;
        const APU_N_N2_X3: f64 = 0.3718632222716785;
        const APU_N_N2_X4: f64 = -0.05012708901533932;
        const APU_N_N2_X5: f64 = 0.004113538145844002;
        const APU_N_N2_X6: f64 = -0.000217068158239272;
        const APU_N_N2_X7: f64 = 0.0000076482322527515;
        const APU_N_N2_X8: f64 = -0.00000018368358856566;
        const APU_N_N2_X9: f64 = 0.00000000301784702552;
        const APU_N_N2_X10: f64 = -0.00000000003338059452;
        const APU_N_N2_X11: f64 = 0.00000000000023768495;
        const APU_N_N2_X12: f64 = -0.00000000000000098402;
        const APU_N_N2_X13: f64 = 0.00000000000000000180;

        // Time to N1 constants
        const APU_N_CONST: f64 = 20346.47871003967;
        const APU_N_X: f64 = -10589.258178152319;
        const APU_N_X2: f64 = 2431.729387231063;
        const APU_N_X3: f64 = -325.5237277312483;
        const APU_N_X4: f64 = 28.2488372642810;
        const APU_N_X5: f64 = -1.669888674851867;
        const APU_N_X6: f64 = 0.06866582085373031;
        const APU_N_X7: f64 = -0.00196551590823214;
        const APU_N_X8: f64 = 0.000038410143909137;
        const APU_N_X9: f64 = -0.00000048843308292031;
        const APU_N_X10: f64 = 0.00000000364059072727;
        const APU_N_X11: f64 = -0.00000000001206089876;

        // Protect against the formula returning decreasing results after this value.
        const TIME_LIMIT: f64 = 45.;
        let since_secs = self.since.as_secs_f64().min(TIME_LIMIT);

        let n2 = self.n2.get::<percent>();

        let n = if self.n2.get::<percent>() < 75. {
            APU_N_N2_CONST
                + (APU_N_N2_X * n2)
                + (APU_N_N2_X2 * n2.powi(2))
                + (APU_N_N2_X3 * n2.powi(3))
                + (APU_N_N2_X4 * n2.powi(4))
                + (APU_N_N2_X5 * n2.powi(5))
                + (APU_N_N2_X6 * n2.powi(6))
                + (APU_N_N2_X7 * n2.powi(7))
                + (APU_N_N2_X8 * n2.powi(8))
                + (APU_N_N2_X9 * n2.powi(9))
                + (APU_N_N2_X10 * n2.powi(10))
                + (APU_N_N2_X11 * n2.powi(11))
                + (APU_N_N2_X12 * n2.powi(12))
                + (APU_N_N2_X13 * n2.powi(13))
        } else {
            APU_N_CONST
                + (APU_N_X * since_secs)
                + (APU_N_X2 * since_secs.powi(2))
                + (APU_N_X3 * since_secs.powi(3))
                + (APU_N_X4 * since_secs.powi(4))
                + (APU_N_X5 * since_secs.powi(5))
                + (APU_N_X6 * since_secs.powi(6))
                + (APU_N_X7 * since_secs.powi(7))
                + (APU_N_X8 * since_secs.powi(8))
                + (APU_N_X9 * since_secs.powi(9))
                + (APU_N_X10 * since_secs.powi(10))
                + (APU_N_X11 * since_secs.powi(11))
        }
        .clamp(0., 100.);

        if since_secs > 0. {
            Ratio::new::<percent>(n)
        } else {
            Ratio::default()
        }
    }

    fn calculate_n2(&self) -> Ratio {
        /// N2 starts spinning after flap is open, or start button is pressed
        const APU_N2_CONST: f64 = 0.102461912951123;
        const APU_N2_X: f64 = -4.213276063673831;
        const APU_N2_X2: f64 = 4.904714363158679;
        const APU_N2_X3: f64 = -1.580490532662764;
        const APU_N2_X4: f64 = 0.2609079965518872;
        const APU_N2_X5: f64 = -0.0245239023843422;
        const APU_N2_X6: f64 = 0.001333286573520723;
        const APU_N2_X7: f64 = -0.0000368228114602448;
        const APU_N2_X8: f64 = 0.00000000978478072071;
        const APU_N2_X9: f64 = 0.00000003595869237689;
        const APU_N2_X10: f64 = -0.00000000127836115070;
        const APU_N2_X11: f64 = 0.00000000002201303409;
        const APU_N2_X12: f64 = -0.00000000000019674992;
        const APU_N2_X13: f64 = 0.00000000000000073146;

        // Protect against the formula returning decreasing results after this value.
        const TIME_LIMIT: f64 = 45.;
        let since_secs = self.since.as_secs_f64().min(TIME_LIMIT);

        if since_secs > 0. {
            let n2 = (APU_N2_CONST
                + (APU_N2_X * since_secs)
                + (APU_N2_X2 * since_secs.powi(2))
                + (APU_N2_X3 * since_secs.powi(3))
                + (APU_N2_X4 * since_secs.powi(4))
                + (APU_N2_X5 * since_secs.powi(5))
                + (APU_N2_X6 * since_secs.powi(6))
                + (APU_N2_X7 * since_secs.powi(7))
                + (APU_N2_X8 * since_secs.powi(8))
                + (APU_N2_X9 * since_secs.powi(9))
                + (APU_N2_X10 * since_secs.powi(10))
                + (APU_N2_X11 * since_secs.powi(11))
                + (APU_N2_X12 * since_secs.powi(12))
                + (APU_N2_X13 * since_secs.powi(13)))
            .clamp(0., 100.);

            Ratio::new::<percent>(n2)
        } else {
            Ratio::default()
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
        self.n2 = self.calculate_n2();
        if context.aircraft_preset_quick_mode() {
            self.n = Ratio::new::<percent>(100.);
            println!("apu/pw980.rs: Aircraft Preset Quick Mode is active, setting N to 100%");
        } else {
            self.n = self.calculate_n();
        };
        self.egt = self.calculate_egt(context);

        match controller.signal() {
            Some(TurbineSignal::Stop) | None => Box::new(Stopping::new(self.egt, self.n, self.n2)),
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

    fn n2(&self) -> Ratio {
        self.n2
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    fn state(&self) -> TurbineState {
        TurbineState::Starting
    }

    fn bleed_air_pressure(&self) -> Pressure {
        Pressure::new::<psi>(14.7)
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
            max: 45. * randomisation,
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

        self.current = self.current.clamp(self.min, self.max);
    }

    fn egt_delta(&self) -> TemperatureInterval {
        TemperatureInterval::new::<temperature_interval::degree_celsius>(self.current)
    }

    fn delta_per_second(&self) -> f64 {
        // Fixme: This curve has not been changed from APS3200. It can be improved in the future based on references.
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

struct ApuBleedUsageN2Delta {
    time: Duration,
    base_n2_delta_per_second: f64,
}
impl ApuBleedUsageN2Delta {
    // We assume it takes 8 seconds to get to our target.
    const SECONDS_TO_REACH_TARGET: u64 = 8;
    // N2 goes from 85 to 87 when bleed is on
    const N2_CHANGE_WHEN_BLEED_ON: f64 = 2.;

    fn new() -> Self {
        Self {
            time: Duration::from_secs(0),
            base_n2_delta_per_second: ApuBleedUsageN2Delta::N2_CHANGE_WHEN_BLEED_ON
                / ApuBleedUsageN2Delta::SECONDS_TO_REACH_TARGET as f64,
        }
    }

    fn update(&mut self, context: &UpdateContext, apu_bleed_is_used: bool) {
        self.time = if apu_bleed_is_used {
            (self.time + context.delta()).min(Duration::from_secs(
                ApuBleedUsageN2Delta::SECONDS_TO_REACH_TARGET,
            ))
        } else {
            Duration::from_secs_f64((self.time.as_secs_f64() - context.delta_as_secs_f64()).max(0.))
        };
    }

    fn n2_delta(&self) -> Ratio {
        Ratio::new::<percent>(self.time.as_secs_f64() * self.base_n2_delta_per_second)
    }
}

struct Running {
    egt: ThermodynamicTemperature,
    base_egt: ThermodynamicTemperature,
    base_egt_deviation: TemperatureInterval,
    bleed_air_usage: BleedAirUsageEgtDelta,
    apu_gen_usage: ApuGenUsageEgtDelta,
    n2: Ratio,
    bleed_air_n2_delta: ApuBleedUsageN2Delta,
}
impl Running {
    fn new(egt: ThermodynamicTemperature) -> Running {
        let base_egt = 480. + ((random_number() % 11) as f64);
        Running {
            egt,
            base_egt: ThermodynamicTemperature::new::<degree_celsius>(base_egt),
            // This contains the deviation from the base EGT at the moment of entering the running state.
            base_egt_deviation: TemperatureInterval::new::<temperature_interval::degree_celsius>(
                egt.get::<degree_celsius>() - base_egt,
            ),
            bleed_air_usage: BleedAirUsageEgtDelta::new(),
            apu_gen_usage: ApuGenUsageEgtDelta::new(),
            n2: Ratio::default(),
            bleed_air_n2_delta: ApuBleedUsageN2Delta::new(),
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

    fn calculate_n2(&mut self, context: &UpdateContext, apu_bleed_is_used: bool) -> Ratio {
        // Base N2 is 85%
        let mut target = Ratio::new::<percent>(85.);

        self.bleed_air_n2_delta.update(context, apu_bleed_is_used);
        target += self.bleed_air_n2_delta.n2_delta();

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
        self.n2 = self.calculate_n2(context, apu_bleed_is_used);

        match controller.signal() {
            Some(TurbineSignal::StartOrContinue) => self,
            Some(TurbineSignal::Stop) | None => Box::new(Stopping::new(
                self.egt,
                Ratio::new::<percent>(100.),
                self.n2(),
            )),
        }
    }

    fn n(&self) -> Ratio {
        Ratio::new::<percent>(100.)
    }

    fn n2(&self) -> Ratio {
        self.n2
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    fn state(&self) -> TurbineState {
        TurbineState::Running
    }

    fn bleed_air_pressure(&self) -> Pressure {
        // Value from refs, we add standard pressure at sea level as state of unpressurized system
        Pressure::new::<psi>(22.)
            + InternationalStandardAtmosphere::pressure_at_altitude(Length::ZERO)
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
    n2_factor: f64,
    // When the APU start is unsuccessful the stopping state
    // is entered with N < 100%. As EGT in this state is a function of N,
    // we need to adapt the EGT calculation to this. This ensures EGT
    // doesn't just suddenly drop by e.g. 80 degrees due to the low N.
    egt_delta_at_entry: TemperatureInterval,
    n: Ratio,
    n2: Ratio,
    egt: ThermodynamicTemperature,
}
impl Stopping {
    fn new(egt: ThermodynamicTemperature, n: Ratio, n2: Ratio) -> Stopping {
        Stopping {
            since: Duration::from_secs(0),
            base_temperature: egt,
            n_factor: n.get::<percent>() / 100.,
            n2_factor: n2.get::<percent>() / 85.,
            egt_delta_at_entry: Stopping::calculate_egt_delta(n2),
            n,
            n2,
            egt,
        }
    }

    fn calculate_egt_delta(n2: Ratio) -> TemperatureInterval {
        // Refer to PW980.md for details on the values below and source data.
        const APU_N_TEMP_DELTA_CONST: f64 = -317.3365888515821;
        const APU_N_TEMP_DELTA_X: f64 = 1.577233364899279;
        const APU_N_TEMP_DELTA_X2: f64 = 1.307370019793173;
        const APU_N_TEMP_DELTA_X3: f64 = -0.2172559274800074;
        const APU_N_TEMP_DELTA_X4: f64 = 0.01856814711790658;
        const APU_N_TEMP_DELTA_X5: f64 = -0.000892142622903575;
        const APU_N_TEMP_DELTA_X6: f64 = 0.0000248975205311778;
        const APU_N_TEMP_DELTA_X7: f64 = -0.00000037194070258243;
        const APU_N_TEMP_DELTA_X8: f64 = 0.00000000135120627984;
        const APU_N_TEMP_DELTA_X9: f64 = 0.00000000004879602478;
        const APU_N_TEMP_DELTA_X10: f64 = -0.00000000000087688843;
        const APU_N_TEMP_DELTA_X11: f64 = 0.00000000000000611631;
        const APU_N_TEMP_DELTA_X12: f64 = -0.00000000000000001623;

        // Note this uses N2 for the calculation
        let n = n2.get::<percent>();
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

    fn calculate_n1(since: Duration) -> Ratio {
        // Refer to PW980.md for details on the values below and source data.
        const APU_N_CONST: f64 = 101.2793953502211;
        const APU_N_X: f64 = -7.046603616716463;
        const APU_N_X2: f64 = 2.720645871014408;
        const APU_N_X3: f64 = -0.5598348705144645;
        const APU_N_X4: f64 = 0.05333946247710394;
        const APU_N_X5: f64 = -0.002912738145135647;
        const APU_N_X6: f64 = 0.0001009025994427405;
        const APU_N_X7: f64 = -0.00000232434829734961;
        const APU_N_X8: f64 = 0.00000003616620771100;
        const APU_N_X9: f64 = -0.00000000037630807292;
        const APU_N_X10: f64 = 0.00000000000251143967;
        const APU_N_X11: f64 = -0.00000000000000972688;
        const APU_N_X12: f64 = 0.00000000000000001663;

        // Protect against the formula returning increasing results after this value.
        const TIME_LIMIT: f64 = 86.1;
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
            + (APU_N_X11 * since.powi(11))
            + (APU_N_X12 * since.powi(12)))
        .clamp(0., 100.);

        Ratio::new::<percent>(n)
    }

    fn calculate_n2(since: Duration) -> Ratio {
        // Refer to PW980.md for details on the values below and source data.
        // Protect against the formula returning increasing results after this value.
        const TIME_LIMIT: f64 = 86.1;
        let since = since.as_secs_f64().min(TIME_LIMIT);

        let apu_n2_const: f64;
        let apu_n2_x: f64;
        let apu_n2_x2: f64;
        let apu_n2_x3: f64;
        let apu_n2_x4: f64;
        let apu_n2_x5: f64;
        let apu_n2_x6: f64;
        let apu_n2_x7: f64;
        let apu_n2_x8: f64;
        let apu_n2_x9: f64;
        let apu_n2_x10: f64;
        let apu_n2_x11: f64;
        let apu_n2_x12: f64;

        // To avoid N2 oscilating
        if since < 8. {
            apu_n2_const = 84.98989898989898;
            apu_n2_x = -1.026936026936026;
            apu_n2_x2 = 0.03282828282828282;
            apu_n2_x3 = -0.005892255892255892;
            apu_n2_x4 = 0.;
            apu_n2_x5 = 0.;
            apu_n2_x6 = 0.;
            apu_n2_x7 = 0.;
            apu_n2_x8 = 0.;
            apu_n2_x9 = 0.;
            apu_n2_x10 = 0.;
            apu_n2_x11 = 0.;
            apu_n2_x12 = 0.;
        } else {
            apu_n2_const = 86.64042983954318;
            apu_n2_x = -8.396890071756419;
            apu_n2_x2 = 4.265566873959583;
            apu_n2_x3 = -0.8713377975625458;
            apu_n2_x4 = 0.08440922199990456;
            apu_n2_x5 = -0.004751685242570211;
            apu_n2_x6 = 0.0001707504726515346;
            apu_n2_x7 = -0.00000409191213933807;
            apu_n2_x8 = 0.00000006632366421256;
            apu_n2_x9 = -0.00000000071927363877;
            apu_n2_x10 = 0.00000000000500426125;
            apu_n2_x11 = -0.00000000000002020512;
            apu_n2_x12 = 0.00000000000000003601;
        }

        let n = (apu_n2_const
            + (apu_n2_x * since)
            + (apu_n2_x2 * since.powi(2))
            + (apu_n2_x3 * since.powi(3))
            + (apu_n2_x4 * since.powi(4))
            + (apu_n2_x5 * since.powi(5))
            + (apu_n2_x6 * since.powi(6))
            + (apu_n2_x7 * since.powi(7))
            + (apu_n2_x8 * since.powi(8))
            + (apu_n2_x9 * since.powi(9))
            + (apu_n2_x10 * since.powi(10))
            + (apu_n2_x11 * since.powi(11))
            + (apu_n2_x12 * since.powi(12)))
        .clamp(0., 85.);

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
        if context.aircraft_preset_quick_mode() {
            self.n = Ratio::new::<percent>(0.);
            println!("apu/pw980.rs: Aircraft Preset Quick Mode is active, setting N to 0%.");
        } else {
            self.n = Stopping::calculate_n1(self.since) * self.n_factor
        };
        self.n2 = Stopping::calculate_n2(self.since) * self.n2_factor;
        self.egt = self.base_temperature + Stopping::calculate_egt_delta(self.n2)
            - self.egt_delta_at_entry;

        if self.n.get::<percent>() < 0.5 {
            Box::new(ShutdownPw980Turbine::new_with_egt(self.egt))
        } else {
            self
        }
    }

    fn n(&self) -> Ratio {
        self.n
    }

    fn n2(&self) -> Ratio {
        self.n2
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.egt
    }

    fn state(&self) -> TurbineState {
        TurbineState::Stopping
    }

    fn bleed_air_pressure(&self) -> Pressure {
        Pressure::new::<psi>(14.7)
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

/// PW980 APU Generator
pub struct Pw980ApuGenerator {
    number: usize,
    identifier: ElectricalElementIdentifier,
    n: Ratio,
    writer: ElectricalStateWriter,
    output_frequency: Frequency,
    output_potential: ElectricPotential,
    load: Ratio,
    is_emergency_shutdown: bool,
    failure: Failure,
}
impl Pw980ApuGenerator {
    pub(super) const APU_GEN_POWERED_N: f64 = 77.;

    pub fn new(context: &mut InitContext, number: usize) -> Pw980ApuGenerator {
        Pw980ApuGenerator {
            number,
            identifier: context.next_electrical_identifier(),
            n: Ratio::default(),
            writer: ElectricalStateWriter::new(context, &format!("APU_GEN_{}", number)),
            output_potential: ElectricPotential::default(),
            output_frequency: Frequency::default(),
            load: Ratio::default(),
            is_emergency_shutdown: false,
            failure: Failure::new(FailureType::ApuGenerator(number)),
        }
    }

    fn calculate_potential(&self, n: Ratio) -> ElectricPotential {
        let n = n.get::<percent>();

        // The voltage "switches on" after 78% N1 at 115V and stays there throughout
        if n < Pw980ApuGenerator::APU_GEN_POWERED_N {
            panic!("Should not be invoked for APU N below {}", n);
        } else {
            ElectricPotential::new::<volt>(115.)
        }
    }

    fn calculate_frequency(&self, n: Ratio) -> Frequency {
        let n = n.get::<percent>();

        // Refer to PW980.md for details on the values below and source data.
        if n < Pw980ApuGenerator::APU_GEN_POWERED_N {
            panic!("Should not be invoked for APU N below {}", n);
        } else if n < 100. {
            const APU_FREQ_CONST: f64 = -7946988.668472081;
            const APU_FREQ_X: f64 = 536340.196388485;
            const APU_FREQ_X2: f64 = -15054.60305885912;
            const APU_FREQ_X3: f64 = 224.9581339994097;
            const APU_FREQ_X4: f64 = -1.887344238031437;
            const APU_FREQ_X5: f64 = 0.008429263577308244;
            const APU_FREQ_X6: f64 = -0.00001565694620869725;

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
        !self.failure.is_active()
            && !self.is_emergency_shutdown
            && self.n.get::<percent>() >= Pw980ApuGenerator::APU_GEN_POWERED_N
    }
}
impl ApuGenerator for Pw980ApuGenerator {
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
provide_potential!(Pw980ApuGenerator, (110.0..=120.0));
provide_frequency!(Pw980ApuGenerator, (390.0..=410.0));
provide_load!(Pw980ApuGenerator);
impl ElectricalElement for Pw980ApuGenerator {
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
impl ElectricitySource for Pw980ApuGenerator {
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
impl SimulationElement for Pw980ApuGenerator {
    fn accept<T: crate::simulation::SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);
        visitor.visit(self);
    }

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
            ElectricPotential::default()
        };

        self.output_frequency = if self.should_provide_output() {
            self.calculate_frequency(self.n)
        } else {
            Frequency::default()
        };

        let power_consumption = report
            .total_consumption_of(PotentialOrigin::ApuGenerator(self.number))
            .get::<watt>();
        let power_factor_correction = 0.8;
        let maximum_load = 120000.;
        self.load = Ratio::new::<percent>(
            (power_consumption * power_factor_correction / maximum_load) * 100.,
        );
    }
}

pub struct Pw980StartMotor {
    /// On the A380, the start motor is powered through the DC APU STARTING BUS.
    /// There are however additional contactors which open and close based on
    /// overhead panel push button positions. Therefore we cannot simply look
    /// at whether or not DC APU STARTING BUS is powered, but must instead handle
    /// potential coming in via those contactors.
    powered_by: ElectricalBusType,
    is_powered: bool,
    powered_since: Duration,
}
impl Pw980StartMotor {
    pub fn new(powered_by: ElectricalBusType) -> Self {
        Pw980StartMotor {
            powered_by,
            is_powered: false,
            powered_since: Duration::ZERO,
        }
    }
}
impl ApuStartMotor for Pw980StartMotor {
    fn is_powered(&self) -> bool {
        self.is_powered
    }
}
impl SimulationElement for Pw980StartMotor {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, context: &UpdateContext, consumption: &mut T) {
        if !self.is_powered {
            self.powered_since = Duration::ZERO;
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

    use crate::simulation::InitContext;
    use crate::{
        apu::tests::test_bed_pw980 as test_bed_with,
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
        let mut test_bed = test_bed_with().run(Duration::from_secs(1_000));

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
        let mut test_bed = test_bed_with().run(Duration::from_secs(1_000));

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
        let mut test_bed = test_bed_with().run(Duration::from_secs(1_000));

        assert_eq!(test_bed.load(), Ratio::default());
    }

    #[test]
    fn when_running_but_potential_unused_has_no_load() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .power_demand(Power::default())
            .run(Duration::from_secs(1_000));

        assert_eq!(test_bed.load(), Ratio::default());
    }

    #[test]
    fn when_running_and_potential_used_has_load() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .power_demand(Power::new::<watt>(50000.))
            .run(Duration::from_secs(1_000));

        assert!(test_bed.load() > Ratio::default());
    }

    #[test]
    fn when_load_below_maximum_it_is_normal() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .power_demand(Power::new::<watt>(120000. / 0.8))
            .run(Duration::from_secs(1_000));

        assert!(test_bed.load_within_normal_range());
    }

    #[test]
    fn when_load_exceeds_maximum_not_normal() {
        let mut test_bed = test_bed_with()
            .running_apu()
            .power_demand(Power::new::<watt>((120000. / 0.8) + 1.))
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

        assert!(test_bed.contains_variable_with_name("ELEC_APU_GEN_1_POTENTIAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_APU_GEN_1_POTENTIAL_NORMAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_APU_GEN_1_FREQUENCY"));
        assert!(test_bed.contains_variable_with_name("ELEC_APU_GEN_1_FREQUENCY_NORMAL"));
        assert!(test_bed.contains_variable_with_name("ELEC_APU_GEN_1_LOAD"));
        assert!(test_bed.contains_variable_with_name("ELEC_APU_GEN_1_LOAD_NORMAL"));
    }

    fn apu_generator(context: &mut InitContext) -> Pw980ApuGenerator {
        Pw980ApuGenerator::new(context, 1)
    }

    fn update_above_threshold(test_bed: &mut SimulationTestBed<TestAircraft<Pw980ApuGenerator>>) {
        test_bed.set_update_before_power_distribution(|generator, _, electricity| {
            generator.update(Ratio::new::<percent>(100.), false);
            electricity.supplied_by(generator);
        });
        test_bed.run();
    }

    fn update_below_threshold(test_bed: &mut SimulationTestBed<TestAircraft<Pw980ApuGenerator>>) {
        test_bed.set_update_before_power_distribution(|generator, _, electricity| {
            generator.update(Ratio::default(), false);
            electricity.supplied_by(generator);
        });
        test_bed.run();
    }
}
