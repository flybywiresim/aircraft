use super::*;
use systems::flight_warning::parameters::{SignStatusMatrix, Value};
use systems::flight_warning::utils::FwcSsm;

pub(in crate::flight_warning::runtime) trait AdrSwitching {
    fn capt_on_adr_3(&self) -> bool;
    fn fo_on_adr_3(&self) -> bool;
    fn adr_3_used(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AdrSwitchingActivation {
    capt_on_adr_3: bool,
    fo_on_adr_3: bool,
    adr_3_used: bool,
}

impl AdrSwitchingActivation {
    pub fn update(&mut self, signals: &impl AdcTransferCoding) {
        self.capt_on_adr_3 = signals.adc_transfer_coding(1, 13).value()
            && signals.adc_transfer_coding(1, 14).value();
        self.fo_on_adr_3 = signals.adc_transfer_coding(2, 13).value()
            && signals.adc_transfer_coding(2, 14).value();

        self.adr_3_used = self.capt_on_adr_3 || self.fo_on_adr_3;
    }
}

impl AdrSwitching for AdrSwitchingActivation {
    fn capt_on_adr_3(&self) -> bool {
        self.capt_on_adr_3
    }

    fn fo_on_adr_3(&self) -> bool {
        self.fo_on_adr_3
    }

    fn adr_3_used(&self) -> bool {
        self.adr_3_used
    }
}

pub(in crate::flight_warning::runtime) trait DmcAltitudeSetting {
    fn dmc_l_qnh(&self) -> bool;
    fn dmc_l_qfe(&self) -> bool;
    fn dmc_l_std(&self) -> bool;
    fn dmc_r_qnh(&self) -> bool;
    fn dmc_r_qfe(&self) -> bool;
    fn dmc_r_std(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct DmcAltitudeSettingActivation {
    dmc_l_raw_std: bool,
    dmc_l_raw_qnh: bool,
    dmc_l_qnh: bool,
    dmc_l_qfe: bool,
    dmc_l_std: bool,
    dmc_r_raw_std: bool,
    dmc_r_raw_qnh: bool,
    dmc_r_qnh: bool,
    dmc_r_qfe: bool,
    dmc_r_std: bool,
}

impl DmcAltitudeSettingActivation {
    pub fn update(&mut self, signals: &impl BaroRefCoding) {
        let fcu1_healthy = true;
        let fcu2_healthy = true;

        self.dmc_l_raw_std = fcu1_healthy
            && signals.baro_ref_coding(1, 11).is_no()
            && signals.baro_ref_coding(1, 11).value();
        self.dmc_l_raw_qnh = fcu1_healthy
            && signals.baro_ref_coding(1, 12).is_no()
            && signals.baro_ref_coding(1, 12).value();
        self.dmc_l_std = self.dmc_l_raw_std && !self.dmc_l_raw_qnh;
        self.dmc_l_qnh = self.dmc_l_raw_qnh && !self.dmc_l_raw_std;
        self.dmc_l_qfe = fcu1_healthy
            && signals.baro_ref_coding(1, 12).is_no()
            && !self.dmc_l_raw_std
            && !self.dmc_l_raw_qnh;

        self.dmc_r_raw_std = fcu2_healthy
            && signals.baro_ref_coding(2, 11).is_no()
            && signals.baro_ref_coding(2, 11).value();
        self.dmc_r_raw_qnh = fcu2_healthy
            && signals.baro_ref_coding(2, 12).is_no()
            && signals.baro_ref_coding(2, 12).value();
        self.dmc_r_std = self.dmc_r_raw_std && !self.dmc_r_raw_qnh;
        self.dmc_r_qnh = self.dmc_r_raw_qnh && !self.dmc_r_raw_std;
        self.dmc_r_qfe = fcu2_healthy
            && signals.baro_ref_coding(2, 12).is_no()
            && !self.dmc_r_raw_std
            && !self.dmc_r_raw_qnh;
    }
}

impl DmcAltitudeSetting for DmcAltitudeSettingActivation {
    fn dmc_l_qnh(&self) -> bool {
        self.dmc_l_qnh
    }

    fn dmc_l_qfe(&self) -> bool {
        self.dmc_l_qfe
    }

    fn dmc_l_std(&self) -> bool {
        self.dmc_l_std
    }

    fn dmc_r_qnh(&self) -> bool {
        self.dmc_r_qnh
    }

    fn dmc_r_qfe(&self) -> bool {
        self.dmc_r_qfe
    }

    fn dmc_r_std(&self) -> bool {
        self.dmc_r_std
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeBasic {
    /// This signal contains the (standard) barometric altitude that is picked from the first
    /// available ADR. It may be nonsensical if all three ADRs are unavailable.
    fn alti_basic(&self) -> Length;

    fn alti_invalid(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AltitudeBasicActivation {
    alti_basic: Length,
    alti_invalid: bool,
}

impl AltitudeBasicActivation {
    pub fn update(&mut self, signals: &impl AltitudeParameter) {
        let alti1 = signals.altitude(1);
        let alti2 = signals.altitude(2);
        let alti3 = signals.altitude(3);

        let bad_alti1 = alti1.is_ncd() || alti1.is_inv();
        let bad_alti2 = alti2.is_ncd() || alti2.is_inv();
        let bad_alti3 = alti3.is_ncd() || alti3.is_inv();

        let two_over_one = bad_alti1;
        let three_over_one_and_two = bad_alti1 && bad_alti2;

        self.alti_basic = if three_over_one_and_two {
            alti3.value()
        } else if two_over_one {
            alti2.value()
        } else {
            alti1.value()
        };

        let buss_installed = false; // TODO
        let gps_alt_used_and_invalid = false; // TODO
        self.alti_invalid =
            (bad_alti1 && bad_alti2 && bad_alti3 && !buss_installed) || gps_alt_used_and_invalid;
    }
}

impl AltitudeBasic for AltitudeBasicActivation {
    fn alti_basic(&self) -> Length {
        self.alti_basic
    }

    fn alti_invalid(&self) -> bool {
        self.alti_invalid
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeCaptCorrected {
    fn capt_baro_alti(&self) -> Length;

    fn capt_baro_invalid(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AltitudeCaptCorrectedActivation {
    capt_baro_alti: Length,
    capt_baro_invalid: bool,
}

impl AltitudeCaptCorrectedActivation {
    pub fn update(
        &mut self,
        signals: &impl CaptCorrectedAltitudeParameter,
        switching_sheet: &impl AdrSwitching,
    ) {
        let alti1 = signals.capt_corrected_altitude(1);
        let alti2 = signals.capt_corrected_altitude(2);
        let alti3 = signals.capt_corrected_altitude(3);

        let bad_alti1 = alti1.is_ncd() || alti1.is_inv();
        let bad_alti2 = alti2.is_ncd() || alti2.is_inv();
        let bad_alti3 = alti3.is_ncd() || alti3.is_inv();

        let two_over_one = bad_alti1;
        let three_over_one_and_two = switching_sheet.capt_on_adr_3() || (bad_alti1 && bad_alti2);

        self.capt_baro_alti = if three_over_one_and_two {
            alti3.value()
        } else if two_over_one {
            alti2.value()
        } else {
            alti1.value()
        };

        self.capt_baro_invalid = bad_alti1 && bad_alti2 && bad_alti3;
    }
}

impl AltitudeCaptCorrected for AltitudeCaptCorrectedActivation {
    fn capt_baro_alti(&self) -> Length {
        self.capt_baro_alti
    }

    fn capt_baro_invalid(&self) -> bool {
        self.capt_baro_invalid
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeFoCorrected {
    fn fo_baro_alti(&self) -> Length;

    fn fo_baro_invalid(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AltitudeFoCorrectedActivation {
    fo_baro_alti: Length,
    fo_baro_invalid: bool,
}

impl AltitudeFoCorrectedActivation {
    pub fn update(
        &mut self,
        signals: &impl FoCorrectedAltitudeParameter,
        switching_sheet: &impl AdrSwitching,
    ) {
        let alti1 = signals.fo_corrected_altitude(1);
        let alti2 = signals.fo_corrected_altitude(2);
        let alti3 = signals.fo_corrected_altitude(3);

        let bad_alti1 = alti1.is_ncd() || alti1.is_inv();
        let bad_alti2 = alti2.is_ncd() || alti2.is_inv();
        let bad_alti3 = alti3.is_ncd() || alti3.is_inv();

        let two_over_one = bad_alti1;
        let three_over_one_and_two = switching_sheet.fo_on_adr_3() || (bad_alti1 && bad_alti2);

        self.fo_baro_alti = if three_over_one_and_two {
            alti3.value()
        } else if two_over_one {
            alti2.value()
        } else {
            alti1.value()
        };

        self.fo_baro_invalid = bad_alti1 && bad_alti2 && bad_alti3;
    }
}

impl AltitudeFoCorrected for AltitudeFoCorrectedActivation {
    fn fo_baro_alti(&self) -> Length {
        self.fo_baro_alti
    }

    fn fo_baro_invalid(&self) -> bool {
        self.fo_baro_invalid
    }
}
