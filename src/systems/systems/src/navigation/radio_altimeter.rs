use crate::shared::arinc429::Arinc429Word;
use uom::si::f64::{Length, Time};

/// This struct describes the installation of a physical Antenna in relation to an aircraft's
/// center of gravity.
#[derive(Debug, Copy, Clone, PartialEq)]
pub struct AntennaInstallation {
    y: Length, // negative towards top (from CG), positive towards bottom (from CG)
    z: Length, // negative towards front (from CG), positive for aft
    electric_length: Length, // The electric length of the cables and antenna
}

impl AntennaInstallation {
    pub fn new(y: Length, z: Length, electric_length: Length) -> Self {
        Self {
            y,
            z,
            electric_length,
        }
    }

    pub fn y(&self) -> Length {
        self.y
    }

    pub fn z(&self) -> Length {
        self.z
    }

    pub fn electric_length(self) -> Length {
        self.electric_length
    }
}

/// This trait describes a transceiver pair as used in radio altimeters, usually in the C band.
/// It models the physical transmission of the signal between the transceivers and returns the
/// response.
pub trait TransceiverPair {
    fn response(&self) -> Option<TransceiverPairResponse>;
}

/// This struct encodes a response from a pair of transceivers. Currently it only encodes a travel
/// time, which in a modulated continuous wave radar (FMCW) can already be considered the filtered
/// duration between the transmission and the response. In the future it may also return the
/// remaining signal strength, which can be used to model the signal loss over various surfaces, or
/// model an actual frequency response.
#[derive(Debug, Clone, PartialEq)]
pub struct TransceiverPairResponse {
    travel_time: Time,
}

impl TransceiverPairResponse {
    pub fn new(travel_time: Time) -> Self {
        Self { travel_time }
    }

    pub fn travel_time(&self) -> Time {
        self.travel_time
    }
}

pub trait RadioAltimeter {
    fn radio_altitude(&self) -> Arinc429Word<Length>;
}
