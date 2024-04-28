import { Coordinates } from 'msfs-geo';

export enum CommunicationType {
  Unknown,
  AreaControlCenter,
  AirliftCommandPost,
  AirToAir,
  ApproachControl,
  ArrivalControl,
  /**
   * Automatic Surface Observing System
   */
  Asos,
  /**
   * Automatic Terminal Information Services
   */
  Atis,
  /**
   * Airport Weather Information Broadcast
   */
  Awib,
  /**
   * Automatic Weather Observing Service
   */
  Awos,
  /**
   * Aerodrome Weather Information Service
   */
  Awis,
  ClearanceDelivery,
  ClearancePreTaxi,
  ControlArea,
  Control,
  DepartureControl,
  Director,
  /**
   * EnRoute Flight Advisory Service
   */
  Efas,
  Emergency,
  FlightServiceStation,
  GroundCommOutlet,
  GroundControl,
  GateControl,
  HelicopterFrequency,
  Information,
  MilitaryFrequency,
  Multicom,
  Operations,
  PilotActivatedLighting,
  Radio,
  Radar,
  /**
   * Remote Flight Service Station
   */
  Rfss,
  RampTaxiControl,
  /**
   * Airport Radar Service Area
   */
  Arsa,
  /**
   * Terminal Control Area
   */
  Tca,
  /**
   * Terminal Control Area
   */
  Tma,
  Terminal,
  /**
   * Terminal Radar Service Area
   */
  Trsa,
  /**
   * Transcriber Weather Broadcast
   */
  Tweb,
  Tower,
  UpperAreaControl,
  Unicom,
  Volmet,
}

export enum FrequencyUnits {
  Unknown,
  High,
  VeryHigh,
  UltraHigh,
}

export enum FirUirIndicator {
  Unknown,
  Fir,
  Uir,
  Combined,
}

export interface Communication {
  communicationType: CommunicationType;
  frequency: number; // FIXME either normalise to a common unit or document units and how to decode
  frequencyUnits: FrequencyUnits;
  callsign: string;
  location: Coordinates;
}

export interface AirportCommunication extends Communication {
  icaoCode: string;
  airportIdentifier: string;
}

export interface EnRouteCommunication extends Communication {
  firRdoIdent: string;
  firUirIndicator: FirUirIndicator;
}
