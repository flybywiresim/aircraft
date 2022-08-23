use crate::flight_warning::input::A320FwcInputs;
use std::fmt::Debug;
use std::ops::Deref;
use std::time::Duration;
use systems::flight_warning::acquisition::{DiscreteAcquisition, DiscreteInputType};
use systems::flight_warning::parameters::Value;
use uom::si::f64::*;
use uom::si::length::foot;

pub(super) struct A320FwcAudioBoundReadyness {
    audio_ready: bool,
    synthetic_voice_ready: bool,
}

impl A320FwcAudioBoundReadyness {
    pub(super) fn audio_ready(&self) -> bool {
        self.audio_ready
    }
    pub(super) fn synthetic_voice_ready(&self) -> bool {
        self.synthetic_voice_ready
    }
}

trait CrossInhibitionOut {
    fn cross_inhibition_out(&self) -> bool;
}

pub enum Volume {
    Normal,
    ReducedBy6Db,
    Off,
}

/// This struct represents the audio subsystem of an A320 Flight Warning Computer. The audio
/// subsystem is responsible for generating synthetic voices and aural warnings.
pub(super) struct A320FwcAudio {
    audio_manager: AudioManager,
    audio_synchronization_in: DiscreteAcquisition,
    synthetic_voice_manager: SyntheticVoiceManager,
    synthetic_voice_synchronization_in: DiscreteAcquisition,
    fwc_ident_side1: DiscreteAcquisition,
    emer_audio_cancel: bool,
    emer_cancel: DiscreteAcquisition,
    audio_attenuation: bool,
}

impl Default for A320FwcAudio {
    fn default() -> Self {
        Self {
            audio_manager: Default::default(),
            audio_synchronization_in: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            synthetic_voice_manager: Default::default(),
            synthetic_voice_synchronization_in: DiscreteAcquisition::new(
                DiscreteInputType::IpMinus,
            ),
            fwc_ident_side1: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            emer_audio_cancel: false,
            emer_cancel: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            audio_attenuation: false,
        }
    }
}

impl A320FwcAudio {
    pub(super) fn update(
        &mut self,
        delta: Duration,
        inputs: &A320FwcInputs,
        sound: Option<SoundFile>,
        voice: Option<Box<dyn SyntheticVoice>>,
        audio_attenuation: bool,
    ) {
        self.audio_synchronization_in
            .measure(inputs.audio_synchronization_in());
        self.synthetic_voice_synchronization_in
            .measure(inputs.synthetic_voice_synchronization_in());
        self.emer_cancel.measure(inputs.ecp_emer_cancel_on());
        self.fwc_ident_side1.measure(inputs.fwc_ident_side1());

        self.emer_audio_cancel = self.emer_cancel.read().value();
        self.audio_attenuation = audio_attenuation;

        self.audio_manager
            .update(sound, delta, self.audio_synchronization_in.read().value());
        self.synthetic_voice_manager.update(
            delta,
            voice,
            self.synthetic_voice_synchronization_in.read().value(),
            self.fwc_ident_side1.read().value(),
        );
    }

    pub(super) fn bind_ready(&self, delta: Duration) -> A320FwcAudioBoundReadyness {
        A320FwcAudioBoundReadyness {
            audio_ready: self.audio_manager.ready_in(delta),
            synthetic_voice_ready: self.synthetic_voice_manager.ready_in(delta),
        }
    }

    pub(super) fn audio_code(&self) -> Option<u8> {
        self.audio_manager.audio_code()
    }

    pub(super) fn audio_volume(&self) -> Volume {
        if self.emer_audio_cancel {
            Volume::Off
        } else if self.audio_attenuation {
            Volume::ReducedBy6Db
        } else {
            Volume::Normal
        }
    }

    pub(super) fn synthetic_voice_code(&self) -> Option<u8> {
        self.synthetic_voice_manager.synthetic_voice_code()
    }

    pub(super) fn synthetic_voice_volume(&self) -> Volume {
        if self.emer_audio_cancel {
            Volume::Off
        } else if self.audio_attenuation {
            Volume::ReducedBy6Db
        } else {
            Volume::Normal
        }
    }

    pub(super) fn audio_synchronisation_out(&self) -> bool {
        self.audio_manager.cross_inhibition_out()
    }

    pub(super) fn synthetic_voice_synchronisation_out(&self) -> bool {
        self.synthetic_voice_manager.cross_inhibition_out()
    }
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub(super) enum SoundFile {
    CChord,
}

impl From<SoundFile> for AudioData {
    fn from(sound: SoundFile) -> Self {
        match sound {
            SoundFile::CChord => AudioData {
                code: 5,
                duration: None,
            },
        }
    }
}

#[derive(Default)]
struct AudioManager {
    inhibited: bool,
    synthesizer: AudioSynthesizer,
}

impl AudioManager {
    fn update(
        &mut self,
        requested_sound: Option<SoundFile>,
        delta: Duration,
        cross_inhibition: bool,
    ) {
        if requested_sound.is_some() {
            self.inhibited = cross_inhibition;
        } else {
            // nothing is playing
            self.inhibited = false;
        }
        self.synthesizer
            .update(delta, requested_sound.map(|s| s.into()));
    }

    fn audio_code(&self) -> Option<u8> {
        if self.inhibited {
            None
        } else {
            self.synthesizer.audio_code()
        }
    }

    fn ready_in(&self, delta: Duration) -> bool {
        self.synthesizer.ready_in(delta)
    }
}

impl CrossInhibitionOut for AudioManager {
    fn cross_inhibition_out(&self) -> bool {
        self.audio_code().is_some()
    }
}

struct PlayingSound {
    audio_data: AudioData,
    elapsed: Duration,
}

impl PlayingSound {
    fn elapse(&mut self, delta: Duration) {
        self.elapsed += delta;
    }

    fn total_duration(&self) -> Option<Duration> {
        self.audio_data.duration
    }

    /// The remaining Duration until this sound completes, or None if the sound has an infite
    /// Duration.
    fn remaining(&self) -> Option<Duration> {
        self.total_duration()
            .map(|t| t.checked_sub(self.elapsed).unwrap_or(Duration::ZERO))
    }

    fn complete(&self) -> bool {
        if let Some(total_duration) = self.total_duration() {
            self.elapsed >= total_duration
        } else {
            // these sounds play forever until interrupted
            false
        }
    }
}

#[derive(Default)]
struct SyntheticVoiceManager {
    sequence: Vec<VoiceFile>,
    next_index: usize,
    synthesizer: AudioSynthesizer,
    inhibited: bool,
}

impl SyntheticVoiceManager {
    /// This method is expected to be called at regular intervals to update the state of the
    /// synthetic voice manager. It accepts an optional next voice file that will be picked up if
    /// no other synthetic voice is playing.
    fn update(
        &mut self,
        delta: Duration,
        possible_next_voice_file: Option<Box<dyn SyntheticVoice>>,
        cross_inhibition: bool,
        break_ties: bool,
    ) {
        let mut requested_sound: Option<VoiceFile> = None;
        let has_next = self.next_index < self.sequence.len();

        if self.synthesizer.ready_in(delta) {
            if has_next {
                // we have parts still to play
                requested_sound = Some(self.sequence[self.next_index]);
                self.next_index += 1;
            } else {
                // we can play something new
                if let Some(voice_ptr) = possible_next_voice_file {
                    let parts = voice_ptr.deref().voice_files();
                    if !parts.is_empty() {
                        self.sequence = parts;
                        requested_sound = Some(self.sequence[0]);
                        self.next_index = 1;
                        self.inhibited = cross_inhibition;
                    }
                } else {
                    // nothing is playing
                    self.inhibited = false;
                }
            }
        } else if cross_inhibition && !break_ties {
            // if the other one is playing, inhibit ourselves
            self.inhibited = true;
        }
        self.synthesizer
            .update(delta, requested_sound.map(|s| s.into()));
    }

    fn ready_in(&self, delta: Duration) -> bool {
        let has_next = self.next_index < self.sequence.len();
        !has_next && self.synthesizer.ready_in(delta)
    }

    fn synthetic_voice_code(&self) -> Option<u8> {
        if self.inhibited {
            None
        } else {
            self.synthesizer.audio_code()
        }
    }
}

impl CrossInhibitionOut for SyntheticVoiceManager {
    fn cross_inhibition_out(&self) -> bool {
        self.synthetic_voice_code().is_some()
    }
}

#[derive(Default)]
struct AudioSynthesizer {
    playing: Option<PlayingSound>,
}

impl AudioSynthesizer {
    pub fn update(&mut self, delta: Duration, new_audio_data: Option<AudioData>) {
        if let Some(audio_data) = new_audio_data {
            // play something new
            self.playing = Some(PlayingSound {
                audio_data,
                elapsed: Duration::ZERO,
            });
        } else if let Some(ref mut playing) = self.playing {
            // continue playing
            playing.elapse(delta);
            if playing.complete() || playing.audio_data.interruptible() {
                self.playing = None;
            }
        }
    }

    fn audio_code(&self) -> Option<u8> {
        self.playing.as_ref().map(|p| p.audio_data.code)
    }

    /// Returns the PlayingSound the synthesizer will play in delta, or none if the synthesizer is
    /// not playing anything or will have finished playing the currently playing sound in delta.
    fn playing_in(&self, delta: Duration) -> Option<&PlayingSound> {
        self.playing.as_ref().filter(|playing| {
            playing
                .remaining()
                .map_or(true, |remaining| remaining > delta)
        })
    }

    /// Returns whether the synthesizer will be ready to play another sound in delta.
    /// This is either because there is currently no sound playing, the currently playing sound will
    /// have ended, or the currently playing sound is interruptible.
    /// This is useful when you want to check whether the synthesizer is ready to play a sound in
    /// the update call before calling update. For example, if a sound just completed playing but is
    /// still marked as playing in the synthesizer, you can check whether the synthesizer will be
    /// ready to accept a new sound by the time you call update (with delta) by passing the same
    /// delta to this function ahead of time.
    fn ready_in(&self, delta: Duration) -> bool {
        self.playing_in(delta)
            .map_or(true, |p| p.audio_data.interruptible())
    }
}

pub(super) trait SyntheticVoice: Debug {
    fn voice_files(&self) -> Vec<VoiceFile>;

    fn is_auto_callout(&self) -> bool {
        false
    }

    fn is_minimum(&self) -> bool {
        false
    }

    fn is_hundred_above(&self) -> bool {
        false
    }

    fn is_priority_left(&self) -> bool {
        false
    }

    fn is_priority_right(&self) -> bool {
        false
    }

    fn is_intermediate_callout(&self) -> bool {
        false
    }
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub(super) enum AutoCallOut {
    DualInput,
    PriorityLeft,
    PriorityRight,
    HundredAbove,
    Minimum,
    TwoThousandFiveHundredFt,
    TwoThousandFiveHundredBFt,
    TwoThousandFt,
    OneThousandFt,
    FiveHundredFt,
    FourHundredFt,
    ThreeHundredFt,
    TwoHundredFt,
    OneHundredFt,
    FiftyFt,
    FortyFt,
    ThirtyFt,
    TwentyFt,
    TenFt,
    FiveFt,
    TenRetard,
    TwentyRetard,
    Retard,
}

impl PartialEq<dyn SyntheticVoice> for AutoCallOut {
    fn eq(&self, other: &dyn SyntheticVoice) -> bool {
        other.is_auto_callout() && other.voice_files() == self.voice_files()
    }
}

impl PartialEq<AutoCallOut> for dyn SyntheticVoice {
    fn eq(&self, other: &AutoCallOut) -> bool {
        other == self
    }
}

impl SyntheticVoice for AutoCallOut {
    fn voice_files(&self) -> Vec<VoiceFile> {
        match self {
            AutoCallOut::HundredAbove => vec![VoiceFile::HundredAbove],
            AutoCallOut::Minimum => vec![VoiceFile::Minimum],
            AutoCallOut::PriorityLeft => vec![VoiceFile::PriorityLeft],
            AutoCallOut::PriorityRight => vec![VoiceFile::PriorityRight],
            AutoCallOut::DualInput => vec![VoiceFile::DualInput],
            AutoCallOut::TwoThousandFiveHundredFt => vec![VoiceFile::TwoThousandFiveHundred],
            AutoCallOut::TwoThousandFiveHundredBFt => vec![VoiceFile::TwentyFiveHundred],
            AutoCallOut::TwoThousandFt => vec![VoiceFile::TwoThousand],
            AutoCallOut::OneThousandFt => vec![VoiceFile::OneThousand],
            AutoCallOut::FiveHundredFt => vec![VoiceFile::FiveHundred],
            AutoCallOut::FourHundredFt => vec![VoiceFile::FourHundred],
            AutoCallOut::ThreeHundredFt => vec![VoiceFile::ThreeHundred],
            AutoCallOut::TwoHundredFt => vec![VoiceFile::TwoHundred],
            AutoCallOut::OneHundredFt => vec![VoiceFile::OneHundred],
            AutoCallOut::FiftyFt => vec![VoiceFile::Fifty],
            AutoCallOut::FortyFt => vec![VoiceFile::Forty],
            AutoCallOut::ThirtyFt => vec![VoiceFile::Thirty],
            AutoCallOut::TwentyFt => vec![VoiceFile::Twenty],
            AutoCallOut::TenFt => vec![VoiceFile::Ten],
            AutoCallOut::FiveFt => vec![VoiceFile::Five],
            AutoCallOut::TenRetard => vec![VoiceFile::Ten, VoiceFile::Retard],
            AutoCallOut::TwentyRetard => vec![VoiceFile::Twenty, VoiceFile::Retard],
            AutoCallOut::Retard => vec![VoiceFile::Retard],
        }
    }

    fn is_auto_callout(&self) -> bool {
        true
    }

    fn is_minimum(&self) -> bool {
        matches!(self, AutoCallOut::Minimum)
    }

    fn is_hundred_above(&self) -> bool {
        matches!(self, AutoCallOut::HundredAbove)
    }

    fn is_priority_left(&self) -> bool {
        matches!(self, AutoCallOut::PriorityLeft)
    }

    fn is_priority_right(&self) -> bool {
        matches!(self, AutoCallOut::PriorityRight)
    }
}

/// Represents a playable sound with a code and an optional Duration. If the duration is None, it
/// is assumed that the audio plays forever.
#[derive(Copy, Clone, Debug, PartialEq)]
pub(super) struct AudioData {
    code: u8,
    duration: Option<Duration>,
}

impl AudioData {
    fn interruptible(&self) -> bool {
        self.duration.is_none()
    }

    #[cfg(test)]
    pub(super) fn duration(&self) -> Option<Duration> {
        self.duration
    }
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub(super) enum VoiceFile {
    Retard,
    Minimum,
    HundredAbove,
    PriorityLeft,
    PriorityRight,
    DualInput,
    One,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Eleven,
    Twelve,
    Thirteen,
    Fourteen,
    Fifteen,
    Sixteen,
    Seventeen,
    Eighteen,
    Nineteen,
    Twenty,
    Thirty,
    Forty,
    Fifty,
    Sixty,
    Seventy,
    Eighty,
    Ninety,
    OneHundred,
    TwoHundred,
    ThreeHundred,
    FourHundred,
    FiveHundred,
    OneThousand,
    TwoThousand,
    TwoThousandFiveHundred,
    TwentyFiveHundred,
    OneC,
    TwoC,
    ThreeC,
    FourC,
    TwentyC,
    ThirtyC,
    FortyC,
    FiftyC,
    SixtyC,
    SeventyC,
    EightyC,
    NinetyC,
    Hundredand,
}

/// ID space:
/// 60: Priority Left, Priority Right, Dual Input
/// 70: Retard
/// 80: HundredAbove, Minimum
/// 100s: 1, 2, ..9
/// 110s: 10, 11, 12, ..19
/// 120s: 20, 30, 40, ..90
/// 130s: 100, 200, 300, 400, 500, 1000, 2000, 2500, 2_500
/// 140s: 1c, 2c, 3c, 4c, 5c
/// 150s: 20c, 30c, ...90c
/// 160: hundredand

impl From<VoiceFile> for AudioData {
    fn from(voice: VoiceFile) -> Self {
        match voice {
            VoiceFile::PriorityLeft => AudioData {
                code: 60,
                duration: Some(Duration::from_millis(1370)),
            },
            VoiceFile::PriorityRight => AudioData {
                code: 61,
                duration: Some(Duration::from_millis(1311)),
            },
            VoiceFile::DualInput => AudioData {
                code: 62,
                duration: Some(Duration::from_millis(857)),
            },
            VoiceFile::Retard => AudioData {
                code: 70,
                duration: Some(Duration::from_millis(716 + 200)),
            },
            VoiceFile::Minimum => AudioData {
                code: 80,
                duration: Some(Duration::from_millis(584)),
            },
            VoiceFile::HundredAbove => AudioData {
                code: 81,
                duration: Some(Duration::from_millis(694)),
            },
            VoiceFile::One => AudioData {
                code: 101,
                duration: Some(Duration::from_millis(339)),
            },
            VoiceFile::Two => AudioData {
                code: 102,
                duration: Some(Duration::from_millis(436)),
            },
            VoiceFile::Three => AudioData {
                code: 103,
                duration: Some(Duration::from_millis(445)),
            },
            VoiceFile::Four => AudioData {
                code: 104,
                duration: Some(Duration::from_millis(370)),
            },
            VoiceFile::Five => AudioData {
                code: 105,
                duration: Some(Duration::from_millis(483)),
            },
            VoiceFile::Six => AudioData {
                code: 106,
                duration: Some(Duration::from_millis(525)),
            },
            VoiceFile::Seven => AudioData {
                code: 107,
                duration: Some(Duration::from_millis(538)),
            },
            VoiceFile::Eight => AudioData {
                code: 108,
                duration: Some(Duration::from_millis(393)),
            },
            VoiceFile::Nine => AudioData {
                code: 109,
                duration: Some(Duration::from_millis(435)),
            },
            VoiceFile::Ten => AudioData {
                code: 110,
                duration: Some(Duration::from_millis(340 + 80)),
            },
            VoiceFile::Eleven => AudioData {
                code: 111,
                duration: Some(Duration::from_millis(656)),
            },
            VoiceFile::Twelve => AudioData {
                code: 112,
                duration: Some(Duration::from_millis(576)),
            },
            VoiceFile::Thirteen => AudioData {
                code: 113,
                duration: Some(Duration::from_millis(728)),
            },
            VoiceFile::Fourteen => AudioData {
                code: 114,
                duration: Some(Duration::from_millis(775)),
            },
            VoiceFile::Fifteen => AudioData {
                code: 115,
                duration: Some(Duration::from_millis(715)),
            },
            VoiceFile::Sixteen => AudioData {
                code: 116,
                duration: Some(Duration::from_millis(766)),
            },
            VoiceFile::Seventeen => AudioData {
                code: 117,
                duration: Some(Duration::from_millis(812)),
            },
            VoiceFile::Eighteen => AudioData {
                code: 118,
                duration: Some(Duration::from_millis(698)),
            },
            VoiceFile::Nineteen => AudioData {
                code: 119,
                duration: Some(Duration::from_millis(830)),
            },
            VoiceFile::Twenty => AudioData {
                code: 122,
                duration: Some(Duration::from_millis(480)),
            },
            VoiceFile::Thirty => AudioData {
                code: 123,
                duration: Some(Duration::from_millis(499)),
            },
            VoiceFile::Forty => AudioData {
                code: 124,
                duration: Some(Duration::from_millis(493)),
            },
            VoiceFile::Fifty => AudioData {
                code: 125,
                duration: Some(Duration::from_millis(496)),
            },
            VoiceFile::Sixty => AudioData {
                code: 126,
                duration: Some(Duration::from_millis(506)),
            },
            VoiceFile::Seventy => AudioData {
                code: 127,
                duration: Some(Duration::from_millis(537)),
            },
            VoiceFile::Eighty => AudioData {
                code: 128,
                duration: Some(Duration::from_millis(394)),
            },
            VoiceFile::Ninety => AudioData {
                code: 129,
                duration: Some(Duration::from_millis(473)),
            },
            VoiceFile::OneHundred => AudioData {
                code: 131,
                duration: Some(Duration::from_millis(652)),
            },
            VoiceFile::TwoHundred => AudioData {
                code: 132,
                duration: Some(Duration::from_millis(685)),
            },
            VoiceFile::ThreeHundred => AudioData {
                code: 133,
                duration: Some(Duration::from_millis(731)),
            },
            VoiceFile::FourHundred => AudioData {
                code: 134,
                duration: Some(Duration::from_millis(753)),
            },
            VoiceFile::FiveHundred => AudioData {
                code: 135,
                duration: Some(Duration::from_millis(739)),
            },
            VoiceFile::OneThousand => AudioData {
                code: 136,
                duration: Some(Duration::from_millis(790)),
            },
            VoiceFile::TwoThousand => AudioData {
                code: 137,
                duration: Some(Duration::from_millis(711)),
            },
            VoiceFile::TwoThousandFiveHundred => AudioData {
                code: 138,
                duration: Some(Duration::from_millis(1_331)),
            },
            VoiceFile::TwentyFiveHundred => AudioData {
                code: 139,
                duration: Some(Duration::from_millis(1_047)),
            },
            VoiceFile::OneC => AudioData {
                code: 141,
                duration: Some(Duration::from_millis(228)),
            },
            VoiceFile::TwoC => AudioData {
                code: 142,
                duration: Some(Duration::from_millis(229)),
            },
            VoiceFile::ThreeC => AudioData {
                code: 143,
                duration: Some(Duration::from_millis(255)),
            },
            VoiceFile::FourC => AudioData {
                code: 144,
                duration: Some(Duration::from_millis(286)),
            },
            VoiceFile::TwentyC => AudioData {
                code: 152,
                duration: Some(Duration::from_millis(299)),
            },
            VoiceFile::ThirtyC => AudioData {
                code: 153,
                duration: Some(Duration::from_millis(389)),
            },
            VoiceFile::FortyC => AudioData {
                code: 154,
                duration: Some(Duration::from_millis(392)),
            },
            VoiceFile::FiftyC => AudioData {
                code: 155,
                duration: Some(Duration::from_millis(314)),
            },
            VoiceFile::SixtyC => AudioData {
                code: 156,
                duration: Some(Duration::from_millis(403)),
            },
            VoiceFile::SeventyC => AudioData {
                code: 157,
                duration: Some(Duration::from_millis(536)),
            },
            VoiceFile::EightyC => AudioData {
                code: 158,
                duration: Some(Duration::from_millis(295)),
            },
            VoiceFile::NinetyC => AudioData {
                code: 159,
                duration: Some(Duration::from_millis(538)),
            },
            VoiceFile::Hundredand => AudioData {
                code: 160,
                duration: Some(Duration::from_millis(442)),
            },
        }
    }
}

#[derive(Clone, Debug)]
pub(super) struct IntermediateCallout {
    parts: Vec<VoiceFile>,
}

impl IntermediateCallout {
    fn from_parts(parts: Vec<VoiceFile>) -> Self {
        Self { parts }
    }

    pub(super) fn from_height(raw_height: Length) -> Option<Self> {
        if raw_height < Length::new::<foot>(1.0) || raw_height >= Length::new::<foot>(400.0) {
            return None;
        }
        let height: i32 = (if raw_height < Length::new::<foot>(100.0) {
            // round to nearest foot
            (raw_height.get::<foot>()).round()
        } else {
            // round to nearest ten feet whilst ignoring fp errors past 3 digits (we can round at 3
            // digits this since the RA resolution is 0.125ft)
            ((raw_height.get::<foot>() * 100.0).round() / 1000.0).round() * 10.0
        }) as i32;
        if height > 400 {
            return None;
        }
        if height < 100 {
            if height < 20 || height % 10 == 0 {
                return match height {
                    1 => Some(Self::from_parts(vec![VoiceFile::One])),
                    2 => Some(Self::from_parts(vec![VoiceFile::Two])),
                    3 => Some(Self::from_parts(vec![VoiceFile::Three])),
                    4 => Some(Self::from_parts(vec![VoiceFile::Four])),
                    5 => Some(Self::from_parts(vec![VoiceFile::Five])),
                    6 => Some(Self::from_parts(vec![VoiceFile::Six])),
                    7 => Some(Self::from_parts(vec![VoiceFile::Seven])),
                    8 => Some(Self::from_parts(vec![VoiceFile::Eight])),
                    9 => Some(Self::from_parts(vec![VoiceFile::Nine])),
                    10 => Some(Self::from_parts(vec![VoiceFile::Ten])),
                    11 => Some(Self::from_parts(vec![VoiceFile::Eleven])),
                    12 => Some(Self::from_parts(vec![VoiceFile::Twelve])),
                    13 => Some(Self::from_parts(vec![VoiceFile::Thirteen])),
                    14 => Some(Self::from_parts(vec![VoiceFile::Fourteen])),
                    15 => Some(Self::from_parts(vec![VoiceFile::Fifteen])),
                    16 => Some(Self::from_parts(vec![VoiceFile::Sixteen])),
                    17 => Some(Self::from_parts(vec![VoiceFile::Seventeen])),
                    18 => Some(Self::from_parts(vec![VoiceFile::Eighteen])),
                    19 => Some(Self::from_parts(vec![VoiceFile::Nineteen])),
                    20 => Some(Self::from_parts(vec![VoiceFile::Twenty])),
                    30 => Some(Self::from_parts(vec![VoiceFile::Thirty])),
                    40 => Some(Self::from_parts(vec![VoiceFile::Forty])),
                    50 => Some(Self::from_parts(vec![VoiceFile::Fifty])),
                    60 => Some(Self::from_parts(vec![VoiceFile::Sixty])),
                    70 => Some(Self::from_parts(vec![VoiceFile::Seventy])),
                    80 => Some(Self::from_parts(vec![VoiceFile::Eighty])),
                    90 => Some(Self::from_parts(vec![VoiceFile::Ninety])),
                    _ => None,
                };
            } else {
                // prefix
                let prefix = match height / 10 {
                    2 => VoiceFile::TwentyC,
                    3 => VoiceFile::ThirtyC,
                    4 => VoiceFile::FortyC,
                    5 => VoiceFile::FiftyC,
                    6 => VoiceFile::SixtyC,
                    7 => VoiceFile::SeventyC,
                    8 => VoiceFile::EightyC,
                    9 => VoiceFile::NinetyC,
                    _ => panic!(),
                };
                let suffix = match height % 10 {
                    1 => VoiceFile::One,
                    2 => VoiceFile::Two,
                    3 => VoiceFile::Three,
                    4 => VoiceFile::Four,
                    5 => VoiceFile::Five,
                    6 => VoiceFile::Six,
                    7 => VoiceFile::Seven,
                    8 => VoiceFile::Eight,
                    9 => VoiceFile::Nine,
                    _ => panic!(),
                };
                return Some(Self::from_parts(vec![prefix, suffix]));
            }
        } else if height >= 100 {
            if height % 100 == 0 {
                return match height / 100 {
                    1 => Some(Self::from_parts(vec![VoiceFile::OneHundred])),
                    2 => Some(Self::from_parts(vec![VoiceFile::TwoHundred])),
                    3 => Some(Self::from_parts(vec![VoiceFile::ThreeHundred])),
                    4 => Some(Self::from_parts(vec![VoiceFile::FourHundred])),
                    _ => None,
                };
            } else {
                let prefix = match height / 100 {
                    1 => VoiceFile::OneC,
                    2 => VoiceFile::TwoC,
                    3 => VoiceFile::ThreeC,
                    4 => VoiceFile::FourC,
                    _ => panic!(),
                };
                let suffix = match (height % 100) / 10 {
                    1 => VoiceFile::Ten,
                    2 => VoiceFile::Twenty,
                    3 => VoiceFile::Thirty,
                    4 => VoiceFile::Forty,
                    5 => VoiceFile::Fifty,
                    6 => VoiceFile::Sixty,
                    7 => VoiceFile::Seventy,
                    8 => VoiceFile::Eighty,
                    9 => VoiceFile::Ninety,
                    _ => panic!(),
                };
                return Some(Self::from_parts(vec![
                    prefix,
                    VoiceFile::Hundredand,
                    suffix,
                ]));
            }
        }
        None
    }
}

impl PartialEq<dyn SyntheticVoice> for IntermediateCallout {
    fn eq(&self, other: &dyn SyntheticVoice) -> bool {
        other.is_intermediate_callout() && self.parts == other.voice_files()
    }
}

impl PartialEq<IntermediateCallout> for dyn SyntheticVoice {
    fn eq(&self, other: &IntermediateCallout) -> bool {
        other == self
    }
}

impl SyntheticVoice for IntermediateCallout {
    fn voice_files(&self) -> Vec<VoiceFile> {
        self.parts.clone()
    }

    fn is_intermediate_callout(&self) -> bool {
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    mod fwc_audio_tests {
        use super::*;

        #[test]
        fn can_be_created() {
            let mut audio = A320FwcAudio::default();
        }
    }

    mod audio_synthesizer_tests {
        use super::*;

        #[test]
        fn upon_creation_is_ready() {
            let synthesizer = AudioSynthesizer::default();
            assert!(synthesizer.audio_code().is_none());
            assert!(synthesizer.ready_in(Duration::from_millis(0)));
        }

        #[test]
        fn with_no_started_sound_is_ready() {
            let mut synthesizer = AudioSynthesizer::default();
            synthesizer.update(Duration::from_millis(1000), None);
            assert!(synthesizer.audio_code().is_none());
            assert!(synthesizer.ready_in(Duration::from_millis(0)));
        }

        #[test]
        fn plays_a_file_triggered_by_a_pulse() {
            let mut synthesizer = AudioSynthesizer::default();
            synthesizer.update(
                Duration::from_millis(1000),
                Some(AudioData {
                    code: 1,
                    duration: Some(Duration::from_millis(1_331)),
                }),
            );
            assert_eq!(synthesizer.audio_code(), Some(1));
            assert!(synthesizer.ready_in(Duration::from_millis(1_331)));
            synthesizer.update(Duration::from_millis(1000), None);
            assert_eq!(synthesizer.audio_code(), Some(1));
            assert!(synthesizer.ready_in(Duration::from_millis(331)));
            synthesizer.update(Duration::from_millis(1000), None);
            assert_eq!(synthesizer.audio_code(), None);
            assert!(synthesizer.ready_in(Duration::from_millis(0)));
        }

        #[test]
        fn keeps_playing_a_sound_with_no_duration() {
            let mut synthesizer = AudioSynthesizer::default();
            let audio = AudioData {
                code: 1,
                duration: None, // inplies interruptible
            };
            synthesizer.update(Duration::from_millis(1000), Some(audio));
            assert_eq!(synthesizer.audio_code(), Some(1));
            assert!(synthesizer.ready_in(Duration::from_millis(1)));
            synthesizer.update(Duration::from_millis(1000), Some(audio));
            assert_eq!(synthesizer.audio_code(), Some(1));
            assert!(synthesizer.ready_in(Duration::from_millis(1)));
        }

        #[test]
        fn interrupts_a_sound_with_no_duration() {
            let mut synthesizer = AudioSynthesizer::default();
            synthesizer.update(
                Duration::from_millis(1000),
                Some(AudioData {
                    code: 1,
                    duration: None, // inplies interruptible
                }),
            );
            assert_eq!(synthesizer.audio_code(), Some(1));
            synthesizer.update(Duration::from_millis(1000), None);
            assert_eq!(synthesizer.audio_code(), None);
        }
    }

    mod intermediate_callout_tests {
        use uom::si::f64::*;
        use uom::si::length::foot;

        use super::*;

        fn assert_callout(height: f64, expected: Vec<VoiceFile>) {
            assert_eq!(
                IntermediateCallout::from_height(Length::new::<foot>(height))
                    .unwrap()
                    .voice_files(),
                expected
            );
        }

        #[test]
        fn when_out_of_range_returns_none() {
            assert!(IntermediateCallout::from_height(Length::new::<foot>(0.)).is_none());
        }

        #[test]
        fn when_below_100ft_rounds_to_nearest_foot() {
            assert_callout(4., vec![VoiceFile::Four]);
            assert_callout(4.3, vec![VoiceFile::Four]);
            assert_callout(4.5, vec![VoiceFile::Five]);
            assert_callout(11., vec![VoiceFile::Eleven]);
            assert_callout(21., vec![VoiceFile::TwentyC, VoiceFile::One]);
            assert_callout(42., vec![VoiceFile::FortyC, VoiceFile::Two]);
            assert_callout(93., vec![VoiceFile::NinetyC, VoiceFile::Three]);
        }

        #[test]
        fn when_above_100ft_rounds_to_nearest_10ft() {
            assert_callout(
                194.,
                vec![VoiceFile::OneC, VoiceFile::Hundredand, VoiceFile::Ninety],
            );
            assert_callout(
                194.9,
                vec![VoiceFile::OneC, VoiceFile::Hundredand, VoiceFile::Ninety],
            );
            assert_callout(195., vec![VoiceFile::TwoHundred]);
            assert_callout(200., vec![VoiceFile::TwoHundred]);
            assert_callout(204., vec![VoiceFile::TwoHundred]);
            assert_callout(
                209.,
                vec![VoiceFile::TwoC, VoiceFile::Hundredand, VoiceFile::Ten],
            );
            assert_callout(
                210.,
                vec![VoiceFile::TwoC, VoiceFile::Hundredand, VoiceFile::Ten],
            );
            assert_callout(
                210.1,
                vec![VoiceFile::TwoC, VoiceFile::Hundredand, VoiceFile::Ten],
            );
        }

        #[test]
        fn resolves_every_height_between_1_and_400() {
            for i in 1..400 {
                assert!(
                    IntermediateCallout::from_height(Length::new::<foot>(i as f64)).is_some(),
                    "{} returned None",
                    i
                );
            }
        }
    }
}
