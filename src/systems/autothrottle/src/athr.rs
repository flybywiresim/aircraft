#[derive(Debug, PartialEq, Clone, Copy)]
pub enum Mode {
    Init,
    Speed,
    ThrustClimb,
    ThrustDescent,
    AlphaFloor,
    ThrustLock,
}

impl Mode {
    /// override modes sustain command of the thrust by
    /// themselves, even if athr would nomally deactivate.
    fn is_override(&self) -> bool {
        match self {
            Mode::AlphaFloor => true,
            Mode::ThrustLock => true,
            _ => false,
        }
    }
}

fn mapf(n: f64, in_min: f64, in_max: f64, out_min: f64, out_max: f64) -> f64 {
    (n - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
}

// DEG     POS        FEEDBACK
// ----    --------   --------
// -20° -> MAX REV    STOP
//  -6° -> REV IDLE   DETENT
//   0° -> IDLE       STOP
//  +6° -> IDLE
// +25° -> CL         DETENT
// +35° -> FLEX/MCT   DETENT
// +45° -> TOGA       STOP
//
// A "DETENT" is roughly 1.7°.
#[derive(Debug, PartialEq, Clone, Copy)]
pub enum TLA {
    MaxReverse,
    IdleReverse,
    Idle,
    MaxClimb,
    FlexMCT,
    TOGA,
    Manual(f64),
}

impl TLA {
    #[allow(illegal_floating_point_literal_pattern)]
    #[allow(clippy::manual_range_contains)]
    pub fn get(t: f64) -> TLA {
        const DETENT: f64 = 1.7;

        // branches ordered from low to high
        match t {
            -20.0 => TLA::MaxReverse,
            t if t < -6.0 - DETENT => TLA::Manual(mapf(t, -6.0 - DETENT, -20.0, 0.0, -20.0)),
            t if t >= -6.0 - DETENT && t <= -6.0 => TLA::IdleReverse,
            t if t > -6.0 && t < 0.0 => TLA::Manual(0.0),
            0.0 => TLA::Idle,
            t if t > 0.0 && t <= 6.0 => TLA::Manual(0.0),
            t if t > 6.0 && t < 25.0 - DETENT => {
                TLA::Manual(mapf(t, 6.0, 25.0 - DETENT, 0.0, 25.0))
            }
            t if t >= 25.0 - DETENT && t <= 25.0 + DETENT => TLA::MaxClimb,
            t if t >= 35.0 - DETENT && t <= 35.0 + DETENT => TLA::FlexMCT,
            t if t >= 45.0 - DETENT => TLA::TOGA,
            t => TLA::Manual(t),
        }
    }

    fn angle(&self) -> f64 {
        match self {
            Self::MaxReverse => -20.0,
            Self::IdleReverse => -6.0,
            Self::Idle => 0.0,
            Self::MaxClimb => 25.0,
            Self::FlexMCT => 35.0,
            Self::TOGA => 45.0,
            Self::Manual(n) => *n,
        }
    }

    fn n1(&self) -> f64 {
        let t = match self {
            Self::MaxReverse => -20.0,
            Self::IdleReverse => -6.0,
            Self::Idle => 0.0,
            Self::MaxClimb => 56.0,
            Self::FlexMCT => 78.0,
            Self::TOGA => 100.0,
            Self::Manual(n) => {
                if *n < 0.0 {
                    *n
                } else {
                    (*n / 45.0) * 100.0
                }
            }
        };
        if t <= 0.0 {
            t
        } else if t <= 56.0 {
            mapf(t, 0.0, 56.0, 0.0, 86.0)
        } else {
            mapf(t, 56.0, 100.0, 86.5, 100.0)
        }
    }
}

impl PartialOrd for TLA {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.angle().partial_cmp(&other.angle())
    }
}

#[derive(Debug)]
pub struct AutoThrottleInput {
    pub mode: Mode,
    pub throttles: [TLA; 2],
    pub airspeed: f64,
    pub airspeed_target: f64,
    pub vls: f64,
    pub alpha_floor: bool,
    pub radio_height: f64,
    pub pushbutton: bool,
    pub instinctive_disconnect: bool,
}

impl AutoThrottleInput {
    fn target_airspeed(&self) -> f64 {
        self.airspeed_target.max(self.vls)
    }
}

#[derive(Debug)]
pub struct AutoThrottleOutput {
    pub mode: Mode,
    pub armed: bool,
    pub active: bool,
    pub commanded: [f64; 2],
}

#[derive(Debug, PartialEq)]
enum Instinctive {
    Released,
    Pushed(f64),
    Lockout,
}

#[derive(Debug)]
pub struct AutoThrottle {
    speed_mode_pid: crate::pid::PID,
    thrust_rate_limiter: crate::rl::RateLimiter,
    lag_filter: crate::lf::LagFilter,
    instinctive: Instinctive,
    thrust_lock_throttles: [TLA; 2],
    commanded: f64,
    input: AutoThrottleInput,
    output: AutoThrottleOutput,
}

impl AutoThrottle {
    pub fn new() -> Self {
        AutoThrottle {
            speed_mode_pid: crate::pid::PID::new(10.0, 1.0, 0.3, 10.0, 0.0, 100.0),
            thrust_rate_limiter: crate::rl::RateLimiter::new(),
            lag_filter: crate::lf::LagFilter::new(),
            instinctive: Instinctive::Released,
            thrust_lock_throttles: [TLA::Idle, TLA::Idle],
            commanded: 0.0,
            input: AutoThrottleInput {
                mode: Mode::Init,
                throttles: [TLA::Idle, TLA::Idle],
                airspeed: 0.0,
                airspeed_target: 0.0,
                vls: 0.0,
                alpha_floor: false,
                radio_height: 0.0,
                pushbutton: false,
                instinctive_disconnect: false,
            },
            output: AutoThrottleOutput {
                mode: Mode::Init,
                armed: false,
                active: false,
                commanded: [0.0, 0.0],
            },
        }
    }

    pub fn update(&mut self, dt: std::time::Duration) {
        self.engage_logic(dt);

        if self.output.active {
            self.active_logic(dt);

            let m = |i: usize| {
                if self.output.mode.is_override() {
                    self.commanded
                } else {
                    self.input.throttles[i].n1().min(self.commanded)
                }
            };

            self.output.commanded = [m(0), m(1)];
        } else {
            self.commanded = 100.0;
            self.output.commanded = [self.input.throttles[0].n1(), self.input.throttles[1].n1()];
        }
    }

    // FIGURE 22-31-00-13000-A SHEET 1
    // A/THR Engage Logic
    fn engage_logic(&mut self, dt: std::time::Duration) {
        // - two ADIRS must be valid
        // - one LGCIU must be healthy
        // - guidance portion healthy
        // - management portion healthy
        let ap_fd_athr_common_cond = true;

        // - the two ECUs/EECs must be healthy
        // - the FCU must be healthy
        // - no discrepancy between the N1/EPR target computed in the FMGC and the N1/EPR feedback from each ECU/EEC
        // - VLS, VMAX, etc. must be healthy
        // - instinctive disconnect not held for 15s
        let athr_specific_cond = match self.instinctive {
            Instinctive::Released => {
                if self.input.instinctive_disconnect {
                    self.instinctive = Instinctive::Pushed(0.0);
                }
                true
            }
            Instinctive::Pushed(t) => {
                if self.input.instinctive_disconnect {
                    let nt = t + dt.as_secs_f64();
                    if nt >= 15.0 {
                        self.instinctive = Instinctive::Lockout;
                        false
                    } else {
                        self.instinctive = Instinctive::Pushed(nt);
                        true
                    }
                } else {
                    self.instinctive = Instinctive::Released;
                    true
                }
            }
            Instinctive::Lockout => false,
        };

        let one_engine_cond = false;

        let athr_common_or_specific = ap_fd_athr_common_cond || athr_specific_cond;
        let s = athr_common_or_specific
            && (
                // Action on A/THR pushbutton switch
                self.input.pushbutton
                // TOGA condition
                || self.input.throttles.iter().all(|t| *t == TLA::FlexMCT || *t == TLA::TOGA)
                || self.input.alpha_floor
            );

        let r = !athr_common_or_specific
            // if the A/THR function on the opposite FMGC is disengaged and on condition that this FMGC has priority.
            || false
            // Action on the A/THR pushbutton switch, with the A/THR function already armed.
            || (self.input.pushbutton && self.output.armed)
            // Action on one of the A/THR instinctive disconnect pushbuton switches.
            || self.input.instinctive_disconnect
            // ECU/EEC autothrust control feedback i.e. the A/THR being active at level of the
            // FMGCs, one of the two ECUs/EECs indicates that it is not in autothrust control mode.
            || false
            // AP/FD loss condition i.e. total loss of AP/FD below 100ft with the RETARD mode not engaged.
            || false
            // One engine start on the ground
            || false
            // Go around condition i.e. one throttle control lever is placed in the non active
            // area (> MCT) below 100ft without engagement of the GO AROUND mode on the AP/FD.
            || (false && (self.input.radio_height < 100.0 && self.input.throttles.iter().any(|t| *t > TLA::FlexMCT)))
            // Both throttle control levers placed in the IDLE position.
            // Both throttle control levers placed in the REVERSE position.
            || (!self.output.mode.is_override() && !self.input.alpha_floor && self.input.throttles.iter().all(|t| *t <= TLA::Idle));

        // SR flip-flop
        self.output.armed = if s {
            !r
        } else if r {
            false
        } else {
            self.output.armed
        };

        // After engagement, A/THR is active if:
        self.output.active = self.output.armed
            && (
                // the Alpha floor protection is active whatever the position of the throttle control levers.
                self.input.alpha_floor
                || self.output.mode.is_override()
                // one throttle control lever is between IDLE and CL (including CL), and the other
                // is between IDLE and MCT (including MCT) with FLEX TO limit mode not selected.
                || (one_engine_cond && false)
                // The two throttle control levers are between IDLE and CL (CL included).
                || self.input.throttles.iter().all(|t| *t > TLA::Idle && *t <= TLA::MaxClimb)
            );
    }

    fn active_logic(&mut self, dt: std::time::Duration) {
        let dt = dt.as_secs_f64();

        self.output.mode = if self.input.alpha_floor {
            Mode::AlphaFloor
        } else {
            let new_mode = match self.output.mode {
                Mode::Init => Mode::Speed,
                Mode::AlphaFloor => Mode::ThrustLock,
                Mode::ThrustLock => {
                    if self.thrust_lock_throttles == self.input.throttles {
                        Mode::ThrustLock
                    } else {
                        self.input.mode
                    }
                }
                _ => self.input.mode,
            };

            if new_mode != self.output.mode {
                match new_mode {
                    Mode::Speed => {
                        self.speed_mode_pid.reset(
                            self.input.target_airspeed(),
                            self.input.airspeed,
                            dt,
                            self.commanded,
                        );
                        self.thrust_rate_limiter.reset(self.commanded);
                    }
                    Mode::ThrustLock => {
                        self.thrust_lock_throttles = self.input.throttles;
                    }
                    _ => {}
                }
            }

            new_mode
        };

        self.commanded = match self.output.mode {
            Mode::Init => unreachable!(),
            Mode::Speed => self.lag_filter.iterate(
                self.thrust_rate_limiter.iterate(
                    self.speed_mode_pid.update(
                        self.input.target_airspeed(),
                        self.input.airspeed,
                        dt,
                    ),
                    10.0,
                    dt,
                ),
                dt,
            ),
            Mode::ThrustClimb | Mode::ThrustDescent => self.thrust_rate_limiter.iterate(
                if self.output.mode == Mode::ThrustClimb {
                    80.0
                } else {
                    0.0
                },
                1.5,
                dt,
            ),
            Mode::AlphaFloor => 100.0,
            Mode::ThrustLock => self.commanded,
        }
    }

    pub fn input(&mut self) -> &mut AutoThrottleInput {
        &mut self.input
    }

    pub fn output(&self) -> &AutoThrottleOutput {
        &self.output
    }
}
