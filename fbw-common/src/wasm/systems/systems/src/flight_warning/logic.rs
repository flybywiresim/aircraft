use std::time::Duration;

/// A confirmation circuit, which only passes a signal once it has been stable for a certain amount
/// of time. When it detects either a rising or falling edge (depending on its type) it will wait
/// for a time delay period and emit the incoming signal if it was stable throughout the period.
/// If at any point during the period the signal reverts, the state is fully reset and the original
/// signal will be emitted again.
pub struct ConfirmationNode {
    leading_edge: bool,
    time_delay: Duration,
    condition_since: Duration,
    output: bool,
}

impl ConfirmationNode {
    pub fn new(leading_edge: bool, time_delay: Duration) -> Self {
        Self {
            leading_edge,
            time_delay,
            condition_since: Duration::ZERO,
            output: false,
        }
    }

    pub fn new_leading(time_delay: Duration) -> Self {
        Self::new(true, time_delay)
    }

    pub fn new_falling(time_delay: Duration) -> Self {
        Self::new(false, time_delay)
    }

    pub fn update(&mut self, hi: bool, delta: Duration) -> bool {
        let condition_met = hi == self.leading_edge;
        if condition_met {
            self.condition_since += delta;
            self.output = if self.condition_since >= self.time_delay {
                self.leading_edge
            } else {
                !self.leading_edge
            };
        } else {
            self.condition_since = Duration::ZERO;
            self.output = !self.leading_edge;
        }
        self.output
    }
}

/// A monostable trigger, which outputs lo until it detects a rising or falling edge. At that point
/// it will start outputting hi until the time delay period has elapsed. If the node is
/// retriggerable, a matching edge will reset the timer. Otherwise they are ignored until
/// the period has elapsed and the node outputs lo again.
pub struct MonostableTriggerNode {
    leading_edge: bool,
    time_delay: Duration,
    retriggerable: bool,
    remaining_trigger: Duration,
    last_hi: Option<bool>,
    output: bool,
}

impl MonostableTriggerNode {
    pub fn new(leading_edge: bool, time_delay: Duration) -> Self {
        Self {
            leading_edge,
            time_delay,
            retriggerable: false,
            remaining_trigger: Duration::ZERO,
            last_hi: None,
            output: false,
        }
    }

    pub fn new_retriggerable(leading_edge: bool, time_delay: Duration) -> Self {
        Self {
            leading_edge,
            time_delay,
            retriggerable: true,
            remaining_trigger: Duration::ZERO,
            last_hi: None,
            output: false,
        }
    }

    pub fn new_leading(time_delay: Duration) -> Self {
        Self::new(true, time_delay)
    }

    pub fn new_falling(time_delay: Duration) -> Self {
        Self::new(false, time_delay)
    }

    pub fn update(&mut self, hi: bool, delta: Duration) -> bool {
        self.remaining_trigger = self
            .remaining_trigger
            .checked_sub(delta)
            .unwrap_or_default();
        if self.retriggerable || self.remaining_trigger == Duration::ZERO {
            let condition_met =
                self.last_hi.unwrap_or(!self.leading_edge) != hi && hi == self.leading_edge;
            if condition_met {
                self.remaining_trigger = self.time_delay;
            }
        }
        self.last_hi = Some(hi);
        self.output = self.remaining_trigger > Duration::ZERO;
        self.output
    }
}

/// A node that detects a rising or a falling edge and will trigger exactly once. Similar to a
/// monostable trigger node, except that the signal will immediately return, and T approaches 0.
pub struct PulseNode {
    leading_edge: bool,
    last_hi: Option<bool>,
    output: bool,
}

impl PulseNode {
    pub fn new(leading_edge: bool) -> Self {
        Self {
            leading_edge,
            output: false,
            last_hi: None,
        }
    }

    pub fn new_leading() -> Self {
        Self::new(true)
    }

    pub fn new_falling() -> Self {
        Self::new(false)
    }

    pub fn update(&mut self, hi: bool) -> bool {
        self.output = if self.output {
            false
        } else if self.leading_edge {
            !self.last_hi.unwrap_or_default() && hi
        } else {
            self.last_hi.unwrap_or(true) && !hi
        };
        self.last_hi = Some(hi);
        self.output
    }
}

/// A flip-flop or memory circuit that can be used to store a single bit. It has two inputs: Set and
/// Reset. At first it will always emit a falsy value, until it receives a signal on the set input,
/// at which point it will start emitting a truthy value. This will continue until a signal is
/// received on the reset input, at which point it reverts to the original falsy output. If a signal
/// is received on both set and reset at the same time, the input with a star will have precedence.
pub struct MemoryNode {
    has_set_precedence: bool,
    pub output: bool,
}

impl MemoryNode {
    pub fn new(has_set_precedence: bool) -> Self {
        Self {
            has_set_precedence,
            output: false,
        }
    }

    pub fn update(&mut self, set: bool, reset: bool) -> bool {
        self.output = if set && reset {
            self.has_set_precedence
        } else if set {
            true
        } else if reset {
            false
        } else {
            self.output
        };
        self.output
    }
}

/// A hysteresis circuit, which will switch between a high and a low state based on two different
/// numerical comparisons to prevent rapid output switching due to minor value fluctuations.
/// The circuit will output lo until the up condition is met (value >= up). Then, even if the
/// condition subsequently fails, the circuit will continue outputting hi until the down condition
/// is met (value <= dn).
pub struct HysteresisNode<T> {
    up: T,
    dn: T,
    output: bool,
}

impl<T> HysteresisNode<T>
where
    T: PartialOrd,
{
    pub fn new(dn: T, up: T) -> Self {
        if up <= dn {
            panic!("Up must be strictly greater than Dn");
        }
        Self {
            up,
            dn,
            output: false,
        }
    }

    pub fn update(&mut self, value: T) -> bool {
        self.output = if self.output {
            if value <= self.dn {
                false
            } else {
                self.output
            }
        } else if value >= self.up {
            true
        } else {
            self.output
        };
        self.output
    }
}

/// A node that memorizes the value from the preceding call.
#[derive(Default)]
pub struct PreceedingValueNode {
    predecessor: bool,
}

impl PreceedingValueNode {
    pub fn new() -> Self {
        Self { predecessor: false }
    }

    pub fn value(&self) -> bool {
        self.predecessor
    }

    pub fn update(&mut self, value: bool) {
        self.predecessor = value;
    }
}

/// A node that compares the derivative of a value over time to a threshold and returns true if the
/// derivative is strictly larger. The threshold is interpreted as change per 1 second.
/// The derivative is calculated over two subsequent .update calls.
#[derive(Default)]
pub struct DerivativeThresholdNode {
    predecessor: f64,
    threshold: f64,
}

impl DerivativeThresholdNode {
    pub fn new(threshold: f64) -> Self {
        Self {
            predecessor: 0.,
            threshold,
        }
    }

    pub fn update(&mut self, value: f64, delta: Duration) -> bool {
        let derivative = (value - self.predecessor) / delta.as_secs_f64();
        self.predecessor = value;
        derivative > self.threshold
    }
}

/// A circuit that emits a specific signal when the input changes from hi to lo or from lo to hi.
/// The output can be chosen to be hi or lo, so that either:
/// 1) the stable output signal is lo, and during a change the output change signal is hi
/// 2) the stable output signal is hi, and during a change the output change signal is lo
pub struct TransientDetectionNode {
    change_signal: bool,
    predecessor: bool,
}

impl TransientDetectionNode {
    pub fn new(change_signal: bool) -> Self {
        Self {
            change_signal,
            predecessor: false,
        }
    }

    pub fn update(&mut self, value: bool) -> bool {
        let predecessor = self.predecessor;
        self.predecessor = value;
        if value != predecessor {
            // A change has occurred
            self.change_signal
        } else {
            // No change has occurred
            !self.change_signal
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use uom::si::f64::*;
    use uom::si::length::foot;

    #[cfg(test)]
    mod confirmation_node_tests {
        use super::*;

        #[test]
        fn leading_stays_lo_when_lo() {
            let mut node = ConfirmationNode::new_leading(Duration::from_secs(1));
            assert!(!node.update(false, Duration::from_secs(1)));
        }

        #[test]
        fn falling_stays_hi_when_hi() {
            let mut node = ConfirmationNode::new_falling(Duration::from_secs(1));
            assert!(node.update(true, Duration::from_secs(1)));
        }

        #[test]
        fn leading_initially_stays_lo_when_hi() {
            let mut node = ConfirmationNode::new_leading(Duration::from_secs(1));
            assert!(!node.update(true, Duration::from_secs_f64(0.1)));
        }

        #[test]
        fn falling_initially_stays_hi_when_lo() {
            let mut node = ConfirmationNode::new_falling(Duration::from_secs(1));
            assert!(node.update(false, Duration::from_secs_f64(0.1)));
        }

        #[test]
        fn leading_eventually_becomes_hi_when_hi() {
            let mut node = ConfirmationNode::new_leading(Duration::from_secs(1));
            assert!(node.update(true, Duration::from_secs(1)));
        }

        #[test]
        fn falling_eventually_becomes_lo_when_lo() {
            let mut node = ConfirmationNode::new_falling(Duration::from_secs(1));
            assert!(!node.update(false, Duration::from_secs(1)));
        }

        #[test]
        fn leading_resets_timer_when_lo() {
            let mut node = ConfirmationNode::new_leading(Duration::from_secs(1));
            node.update(true, Duration::from_secs(1));
            node.update(false, Duration::from_secs_f64(0.1));
            assert!(!node.update(true, Duration::from_secs_f64(0.1)));
        }

        #[test]
        fn falling_resets_timer_when_hi() {
            let mut node = ConfirmationNode::new_falling(Duration::from_secs(1));
            node.update(false, Duration::from_secs(1));
            node.update(true, Duration::from_secs_f64(0.1));
            assert!(node.update(false, Duration::from_secs_f64(0.1)));
        }
    }

    #[cfg(test)]
    mod monostable_trigger_node_tests {
        use super::*;

        #[test]
        fn when_created_outputs_lo() {
            let mut node = MonostableTriggerNode::new(true, Duration::from_secs(1));
            assert!(!node.update(false, Duration::from_secs(1)));
        }

        #[test]
        fn when_triggered_outputs_hi() {
            let mut node = MonostableTriggerNode::new(true, Duration::from_secs(1));
            assert!(node.update(true, Duration::from_secs(1)));
        }

        #[test]
        fn when_triggered_and_elapses_outputs_lo() {
            let mut node = MonostableTriggerNode::new(true, Duration::from_secs(1));
            node.update(true, Duration::from_secs(1));
            assert!(!node.update(false, Duration::from_secs(1)));
        }

        #[test]
        fn when_retriggered_and_elapses_outputs_lo() {
            let mut node = MonostableTriggerNode::new(true, Duration::from_secs(1));
            node.update(true, Duration::from_secs(1));
            node.update(false, Duration::from_secs_f64(0.5));
            node.update(true, Duration::from_secs_f64(0.4));
            assert!(!node.update(false, Duration::from_secs_f64(0.1)));
        }

        #[test]
        fn when_retriggerable_retriggered_and_elapses_outputs_lo() {
            let mut node = MonostableTriggerNode::new_retriggerable(true, Duration::from_secs(1));
            node.update(true, Duration::from_secs(1));
            node.update(false, Duration::from_secs_f64(0.5));
            node.update(true, Duration::from_secs_f64(0.4));
            assert!(node.update(false, Duration::from_secs_f64(0.1)));
        }
    }

    #[cfg(test)]
    mod pulse_node_tests {
        use super::*;

        #[test]
        fn when_created_outputs_lo() {
            let mut node = PulseNode::new_leading();
            assert!(!node.update(false));
        }

        #[test]
        fn when_triggered_outputs_hi() {
            let mut node = PulseNode::new_leading();
            assert!(node.update(true));
        }

        #[test]
        fn when_triggered_returns_to_lo() {
            let mut node = PulseNode::new_leading();
            node.update(true);
            assert!(!node.update(false));
        }

        #[test]
        fn when_remains_returns_to_lo() {
            let mut node = PulseNode::new_leading();
            node.update(true);
            assert!(!node.update(true));
        }
    }

    #[cfg(test)]
    mod memory_node_tests {
        use super::*;

        #[test]
        fn when_created_outputs_lo() {
            let mut node = MemoryNode::new(true);
            assert!(!node.update(false, false));
        }

        #[test]
        fn when_set_outputs_lo() {
            let mut node = MemoryNode::new(true);
            assert!(node.update(true, false));
        }

        #[test]
        fn when_set_keeps_lo() {
            let mut node = MemoryNode::new(true);
            node.update(true, false);

            assert!(node.update(false, false));
        }

        #[test]
        fn when_reset_outputs_lo() {
            let mut node = MemoryNode::new(true);
            assert!(!node.update(false, true));

            node.update(true, false);
            assert!(!node.update(false, true));
        }

        #[test]
        fn when_set_precedence_and_both_hi_outputs_hi() {
            let mut node = MemoryNode::new(true);
            assert!(node.update(true, true));
        }

        #[test]
        fn when_no_set_precedence_and_both_hi_outputs_lo() {
            let mut node = MemoryNode::new(false);
            assert!(!node.update(true, true));
        }
    }

    #[cfg(test)]
    mod hystereses_node_tests {
        use super::*;

        #[test]
        fn when_stays_below_up_stays_lo() {
            let mut node =
                HysteresisNode::new(Length::new::<foot>(-10.0), Length::new::<foot>(10.0));
            assert!(!node.update(Length::new::<foot>(9.9)));
        }

        #[test]
        fn when_above_up_becomes_hi() {
            let mut node =
                HysteresisNode::new(Length::new::<foot>(-10.0), Length::new::<foot>(10.0));
            assert!(node.update(Length::new::<foot>(10.0)));
        }

        #[test]
        fn when_exceeds_up_stays_hi() {
            let mut node =
                HysteresisNode::new(Length::new::<foot>(-10.0), Length::new::<foot>(10.0));
            node.update(Length::new::<foot>(10.0));
            assert!(node.update(Length::new::<foot>(9.9)));
        }

        #[test]
        fn when_falls_below_dn_returns_to_lo() {
            let mut node =
                HysteresisNode::new(Length::new::<foot>(-10.0), Length::new::<foot>(10.0));
            node.update(Length::new::<foot>(10.0));
            assert!(!node.update(Length::new::<foot>(-10.0)));
        }
    }

    #[cfg(test)]
    mod preceeding_value_node_tests {
        use super::*;

        #[test]
        fn when_lo_then_lo() {
            let mut node = PreceedingValueNode::new();
            node.update(false);
            assert!(!node.value());
        }

        #[test]
        fn when_hi_then_hi() {
            let mut node = PreceedingValueNode::new();
            node.update(true);
            assert!(node.value());
        }
    }

    mod derivative_threshold_node_tests {
        use super::*;

        #[test]
        fn above_zero_threshold_returns_true() {
            let mut node = DerivativeThresholdNode::new(0.);
            node.update(10., Duration::from_millis(100));
            assert!(node.update(15., Duration::from_millis(100)));
        }

        #[test]
        fn at_zero_threshold_returns_false() {
            let mut node = DerivativeThresholdNode::new(0.);
            node.update(10., Duration::from_millis(100));
            assert!(!node.update(10., Duration::from_millis(100)));
        }

        #[test]
        fn below_zero_threshold_returns_false() {
            let mut node = DerivativeThresholdNode::new(0.);
            node.update(10., Duration::from_millis(100));
            assert!(!node.update(5., Duration::from_millis(100)));
        }

        #[test]
        fn above_1000_threshold_returns_true() {
            let mut node = DerivativeThresholdNode::new(1000.);
            node.update(0., Duration::from_millis(100));
            assert!(node.update(101., Duration::from_millis(100)));
        }

        #[test]
        fn at_1000_threshold_returns_false() {
            let mut node = DerivativeThresholdNode::new(1000.);
            node.update(0., Duration::from_millis(100));
            assert!(!node.update(100., Duration::from_millis(100)));
        }

        #[test]
        fn below_1000_threshold_returns_false() {
            let mut node = DerivativeThresholdNode::new(1000.);
            node.update(0., Duration::from_millis(100));
            assert!(!node.update(99., Duration::from_millis(100)));
        }
    }

    #[cfg(test)]
    mod transient_detection_node_tests {
        use super::*;

        #[test]
        fn when_lo_then_lo_emits_lo() {
            let mut node = TransientDetectionNode::new(true);
            node.update(false);
            assert!(!node.update(false));
        }

        #[test]
        fn when_lo_then_hi_emits_hi() {
            let mut node = TransientDetectionNode::new(true);
            node.update(false);
            assert!(node.update(true));
        }

        #[test]
        fn when_hi_then_hi_emits_lo() {
            let mut node = TransientDetectionNode::new(true);
            node.update(true);
            assert!(!node.update(true));
        }

        #[test]
        fn when_hi_then_lo_emits_hi() {
            let mut node = TransientDetectionNode::new(true);
            node.update(true);
            assert!(node.update(false));
        }
    }
}
