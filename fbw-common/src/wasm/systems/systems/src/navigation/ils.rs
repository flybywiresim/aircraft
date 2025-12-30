use crate::{
    shared::arinc429::{Arinc429Word, SignStatus},
    simulation::{Read, SimulationElement, VariableIdentifier},
};
use uom::si::{
    angle::degree,
    f64::{Angle, Frequency, Ratio},
};

pub trait InstrumentLandingSystemBus {
    /// Label 017
    fn runway_heading(&self) -> Arinc429Word<Angle>;
    /// Label 033
    fn ils_frequency(&self) -> Arinc429Word<Frequency>;
    /// Label 173, in DDM (difference in depth of modulation).
    /// 0.155DDM is full scale deflection (two dots) => one dot = 0.0775DDM
    /// One dot = 0.8° on the localizer scale according to FCOM, but the exact conversion depends on runway length.
    fn localizer_deviation(&self) -> Arinc429Word<Ratio>;
    /// Label 174, in DDM (difference in depth of modulation).
    /// 0.175DDM is full scale deflection (two dots) => one dot = 0.0875DDM
    /// One dot = 0.4° on the glideslope scale according to FCOM
    fn glideslope_deviation(&self) -> Arinc429Word<Ratio>;
    /// Label 263
    fn ground_station_ident_1(&self) -> Arinc429Word<u32>;
    /// Label 264
    fn ground_station_ident_2(&self) -> Arinc429Word<u32>;
}

/// This represents an interface to an MMR, which is implemented outside of the rust systems.
/// Currently, this implementation is done by MSFS.
pub struct MultiModeReceiverShim {
    frequency: Frequency,
    nav_valid: bool,
    loc_valid: bool,
    localizer_course: Angle,
    localizer_deviation: Angle,
    glideslope_valid: bool,
    glideslope_deviation: Angle,

    frequency_id: VariableIdentifier,
    nav_valid_id: VariableIdentifier,
    loc_valid_id: VariableIdentifier,
    localizer_course_id: VariableIdentifier,
    localizer_deviation_id: VariableIdentifier,
    glideslope_valid_id: VariableIdentifier,
    glideslope_deviation_id: VariableIdentifier,
}
impl MultiModeReceiverShim {
    pub fn new(context: &mut crate::simulation::InitContext) -> Self {
        Self {
            frequency: Frequency::default(),
            nav_valid: false,
            loc_valid: false,
            localizer_course: Angle::default(),
            localizer_deviation: Angle::default(),
            glideslope_valid: false,
            glideslope_deviation: Angle::default(),

            frequency_id: context.get_identifier("NAV FREQUENCY:3".to_owned()),
            nav_valid_id: context.get_identifier("NAV HAS NAV:3".to_owned()),
            loc_valid_id: context.get_identifier("NAV HAS LOC:3".to_owned()),
            localizer_course_id: context.get_identifier("FM_LS_COURSE".to_owned()),
            localizer_deviation_id: context.get_identifier("NAV RADIAL ERROR:3".to_owned()),
            glideslope_valid_id: context.get_identifier("NAV HAS GLIDE SLOPE:3".to_owned()),
            glideslope_deviation_id: context.get_identifier("NAV GLIDE SLOPE ERROR:3".to_owned()),
        }
    }
}
impl MultiModeReceiverShim {
    /// Corrects an MSFS localiser radial error to give the correct deviations on the back beam.
    fn get_corrected_localizer_deviation(&self) -> Angle {
        let normalized_error = Self::normalize_180(self.localizer_deviation);

        if normalized_error < Angle::new::<degree>(-90.0) {
            Angle::new::<degree>(-180.0) - normalized_error
        } else if normalized_error > Angle::new::<degree>(90.0) {
            Angle::new::<degree>(180.0) - normalized_error
        } else {
            normalized_error
        }
    }

    fn normalize_180(angle: Angle) -> Angle {
        let normalized_360 = Self::normalize_360(angle);

        if normalized_360 >= Angle::new::<degree>(180.0) {
            normalized_360 - Angle::new::<degree>(360.0)
        } else {
            normalized_360
        }
    }

    fn normalize_360(angle: Angle) -> Angle {
        let angle = angle % Angle::new::<degree>(360.0);

        (angle + Angle::new::<degree>(360.0)) % Angle::new::<degree>(360.0)
    }
}
impl InstrumentLandingSystemBus for MultiModeReceiverShim {
    fn runway_heading(&self) -> Arinc429Word<Angle> {
        Arinc429Word::new(
            self.localizer_course,
            if self.loc_valid {
                SignStatus::NormalOperation
            } else {
                SignStatus::NoComputedData
            },
        )
    }
    fn ils_frequency(&self) -> Arinc429Word<Frequency> {
        Arinc429Word::new(
            self.frequency,
            if self.nav_valid {
                SignStatus::NormalOperation
            } else {
                SignStatus::NoComputedData
            },
        )
    }
    fn localizer_deviation(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(
            self.get_corrected_localizer_deviation() / Angle::new::<degree>(0.8) * 0.0775,
            if self.loc_valid {
                SignStatus::NormalOperation
            } else {
                SignStatus::NoComputedData
            },
        )
    }
    fn glideslope_deviation(&self) -> Arinc429Word<Ratio> {
        Arinc429Word::new(
            self.glideslope_deviation / Angle::new::<degree>(0.4) * 0.0875,
            if self.glideslope_valid {
                SignStatus::NormalOperation
            } else {
                SignStatus::NoComputedData
            },
        )
    }
    fn ground_station_ident_1(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0, SignStatus::NoComputedData) // Placeholder implementation
    }
    fn ground_station_ident_2(&self) -> Arinc429Word<u32> {
        Arinc429Word::new(0, SignStatus::NoComputedData) // Placeholder implementation
    }
}
impl SimulationElement for MultiModeReceiverShim {
    fn read(&mut self, reader: &mut crate::simulation::SimulatorReader) {
        self.frequency = reader.read(&self.frequency_id);
        self.nav_valid = reader.read(&self.nav_valid_id);
        self.loc_valid = reader.read(&self.loc_valid_id);
        self.localizer_course = reader.read(&self.localizer_course_id);
        self.localizer_deviation = reader.read(&self.localizer_deviation_id);
        self.glideslope_valid = reader.read(&self.glideslope_valid_id);
        self.glideslope_deviation = reader.read(&self.glideslope_deviation_id);
    }
}
