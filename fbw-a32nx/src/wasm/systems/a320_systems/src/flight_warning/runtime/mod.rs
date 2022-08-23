use crate::flight_warning::input::A320FwcInputs;
use crate::flight_warning::runtime::audio::Volume;
use acquisition::A320FwcAcquisition;
use audio::{A320FwcAudio, A320FwcAudioBoundReadyness};
use monitor::A320FwcMonitor;
use parameters::A320FwcParameterTable;
use std::time::Duration;
use systems::shared::random_from_range;
use warnings::*;

mod acquisition;
pub mod audio;
mod monitor;
pub mod parameters;
mod test;
mod warnings;

/// This struct represents a simulation of the software runtime that is executed on an A320
/// Flight Warning Computer. It's task is to acquire data, run warning logic and generate
/// appropriate warnings.
pub(super) struct A320FwcRuntime {
    remaining_self_test: Duration,
    computation_cycle_interval: Duration,
    elapsed: Duration,
    acquisition: A320FwcAcquisition,
    warnings: A320FwcWarnings,
    monitor: A320FwcMonitor,
    audio: A320FwcAudio,
}

impl A320FwcRuntime {
    /// This is the FWCs main computation cycle interval. It must be larger than the signal interval
    /// of the radio altimeter to prevent no-op derivatives between subsequent cycles, but also
    /// small enough that even an unreasonably high decent rate triggers some altitude callouts.
    /// A clue to this can also be seen when the two FWCs illuminate the Master Warning/
    /// Master Caution buttons at slightly different times.
    const BASE_COMPUTATION_CYCLE_INTERVAL: Duration = Duration::from_millis(240);

    pub(super) fn new(self_test_time: Duration) -> Self {
        Self {
            remaining_self_test: self_test_time,
            // Subtract a tiny duration from the cycle interval (in microseconds) so that multiple
            // runtimes drift a tiny bit from each other over long periods of time.
            computation_cycle_interval: Self::BASE_COMPUTATION_CYCLE_INTERVAL
                - Duration::from_micros(random_from_range(0., 500.) as u64),
            // Elapse one computation cycle to force an immediate refresh
            elapsed: Self::BASE_COMPUTATION_CYCLE_INTERVAL,
            acquisition: Default::default(),
            warnings: Default::default(),
            monitor: Default::default(),
            audio: Default::default(),
        }
    }

    pub(super) fn new_running() -> Self {
        Self {
            remaining_self_test: Duration::ZERO,
            // Subtract a tiny duration from the cycle interval (in microseconds) so that multiple
            // runtimes drift a tiny bit from each other over long periods of time.
            computation_cycle_interval: Self::BASE_COMPUTATION_CYCLE_INTERVAL
                - Duration::from_micros(random_from_range(0., 500.) as u64),
            // Elapse at least one computation cycle to force an immediate refresh, but leave a
            // remainder so that the next refresh comes sooner. This should cause multiple runtimes
            // to usually update slightly out of sync, as would be expected from independent
            // systems.
            elapsed: Duration::from_secs(300)
                + Duration::from_secs_f64(random_from_range(
                    Self::BASE_COMPUTATION_CYCLE_INTERVAL.as_secs_f64(),
                    2. * Self::BASE_COMPUTATION_CYCLE_INTERVAL.as_secs_f64(),
                )),
            acquisition: Default::default(),
            warnings: Default::default(),
            monitor: Default::default(),
            audio: Default::default(),
        }
    }

    pub(super) fn update(&mut self, delta: Duration, inputs: &A320FwcInputs) {
        // Always acquire inputs, even during the self test time
        self.acquisition.update(delta, inputs);

        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed.
        if let Some(new_remaining) = self.remaining_self_test.checked_sub(delta) {
            self.remaining_self_test = new_remaining;
        } else {
            self.remaining_self_test = Duration::ZERO;
        }

        // If there's any startup time remaining, do nothing
        if self.remaining_self_test > Duration::ZERO {
            return;
        }

        // As the monitor needs to know whether the audio subsystem is ready to play sounds, but we
        // don't want to .update he audio subsystem prematurely, we need to look ahead the single
        // delta tick whether the audio subsystem will be ready for new sounds by the time it's
        // .update is called. For encapsulation we have a separate struct to encode this.
        let audio_readyness = self.audio.bind_ready(delta);

        self.elapsed += delta;

        // Updates to Warning Computation and Monitoring happen only once per FWC cycle
        if self.elapsed >= self.computation_cycle_interval {
            let parameters = self.acquisition.acquire();
            self.update_warnings(self.elapsed, &parameters, &audio_readyness);
            self.update_monitor(self.elapsed, &parameters, &audio_readyness);

            // Instead of setting the elapsed time to Duration::ZERO, calculate the remainder to
            // ensure that we average out the correct information rate over multiple refreshes.
            // This means the next update might come a little sooner. Normally this is a single
            // subtraction, but we use remainder so that we don't fall behind if the frame rate
            // spikes very high and we get an enormous delta (we passed the full elapsed value into
            // the submodules).
            self.elapsed = Duration::from_nanos(
                u64::try_from(self.elapsed.as_nanos() % self.computation_cycle_interval.as_nanos())
                    .unwrap_or(0),
            );
        }

        // The audio subsystem needs to be constantly updated
        self.update_audio(delta, inputs);
    }

    pub(super) fn ready(&self) -> bool {
        self.remaining_self_test <= Duration::ZERO
    }

    fn update_warnings(
        &mut self,
        delta: Duration,
        parameters: &A320FwcParameterTable,
        audio: &A320FwcAudioBoundReadyness,
    ) {
        self.warnings.update(
            delta,
            parameters,
            &self.monitor.get_feedback(audio.synthetic_voice_ready()),
        );
    }

    fn update_monitor(
        &mut self,
        delta: Duration,
        _parameters: &A320FwcParameterTable,
        audio: &A320FwcAudioBoundReadyness,
    ) {
        self.monitor
            .update(delta, &self.warnings, audio.synthetic_voice_ready());
    }

    fn update_audio(&mut self, delta: Duration, inputs: &A320FwcInputs) {
        self.audio.update(
            delta,
            inputs,
            self.monitor.sound_file(),
            self.monitor.take_synthetic_voice(),
            self.warnings.audio_attenuation(),
        );
    }

    /// This method queries the corresponding activations to find the first phase that is currently
    /// active.
    pub(super) fn flight_phase(&self) -> Option<u8> {
        self.warnings.flight_phase()
    }

    pub(super) fn show_to_memo(&self) -> bool {
        self.monitor.show_to_memo()
    }

    pub(super) fn show_ldg_memo(&self) -> bool {
        self.monitor.show_ldg_memo()
    }

    pub(super) fn show_to_inhibit_memo(&self) -> bool {
        self.monitor.show_to_inhibit_memo()
    }

    pub(super) fn show_ldg_inhibit_memo(&self) -> bool {
        self.monitor.show_ldg_inhibit_memo()
    }

    pub(super) fn flight_phase_inhibit_override(&self) -> bool {
        self.monitor.flight_phase_inhibit_override()
    }

    pub(super) fn alt_alert_light_on(&self) -> bool {
        self.warnings.alt_alert_light_on()
    }

    pub(super) fn alt_alert_flashing_light(&self) -> bool {
        self.warnings.alt_alert_flashing_light()
    }

    pub(super) fn audio_code(&self) -> Option<u8> {
        self.audio.audio_code()
    }

    pub(super) fn audio_volume(&self) -> Volume {
        self.audio.audio_volume()
    }

    pub(super) fn synthetic_voice_code(&self) -> Option<u8> {
        self.audio.synthetic_voice_code()
    }

    pub(super) fn synthetic_voice_volume(&self) -> Volume {
        self.audio.synthetic_voice_volume()
    }

    pub(super) fn audio_synchronization(&self) -> bool {
        self.audio.audio_synchronisation_out()
    }

    pub(super) fn synthetic_voice_synchronization(&self) -> bool {
        self.audio.synthetic_voice_synchronisation_out()
    }
}
