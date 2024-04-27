export interface GenericVorEvents {
  nav1Ident: string;
  nav1Frequency: number;
  nav1HasDme: boolean;
  nav1DmeDistance: NauticalMiles;
  nav1RelativeBearing: Degrees;
  nav1Obs: Degrees;
  nav1Localizer: Degrees;
  nav1RadialError: Degrees;
  nav1Available: boolean;
  nav1StationDeclination: Degrees;
  nav1Location: LatLongAlt;

  nav2Ident: string;
  nav2Frequency: number;
  nav2HasDme: boolean;
  nav2DmeDistance: NauticalMiles;
  nav2RelativeBearing: Degrees;
  nav2Obs: Degrees;
  nav2Localizer: Degrees;
  nav2RadialError: Degrees;
  nav2Available: boolean;
  nav2StationDeclination: Degrees;
  nav2Location: LatLongAlt;

  nav3Ident: string;
  nav3Frequency: number;
  nav3HasDme: boolean;
  nav3DmeDistance: NauticalMiles;
  nav3RelativeBearing: Degrees;
  nav3Obs: Degrees;
  nav3Localizer: Degrees;
  nav3RadialError: Degrees;
  nav3Available: boolean;
  nav3StationDeclination: Degrees;
  nav3Location: LatLongAlt;

  nav4Ident: string;
  nav4Frequency: number;
  nav4HasDme: boolean;
  nav4DmeDistance: NauticalMiles;
  nav4RelativeBearing: Degrees;
  nav4Obs: Degrees;
  nav4Localizer: Degrees;
  nav4RadialError: Degrees;
  nav4Available: boolean;
  nav4StationDeclination: Degrees;
  nav4Location: LatLongAlt;

  localizerValid: boolean;
  glideSlopeValid: boolean;
  glideSlopeDeviation: number;

  adf1Ident: string;
  adf1ActiveFrequency: number;
  adf1SignalStrength: number;
  adf1Radial: number;

  adf2Ident: string;
  adf2ActiveFrequency: number;
  adf2SignalStrength: number;
  adf2Radial: number;
}
