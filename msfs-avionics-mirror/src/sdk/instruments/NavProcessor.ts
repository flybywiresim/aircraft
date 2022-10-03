/// <reference types="msfstypes/JS/simvar" />

import { ControlEvents } from '../data/ControlPublisher';
import { EventBus, IndexedEventType } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { EventSubscriber } from '../data/EventSubscriber';
import { HEvent } from '../data/HEventPublisher';
import { SimVarDefinition, SimVarValueType } from '../data/SimVars';
import { RadioUtils } from '../utils/radio';
import { BasePublisher, SimVarPublisher } from './BasePublishers';
import { FrequencyBank, RadioEvents, RadioType } from './RadioCommon';

/** Simvars used by a NavProcessor */
export interface NavProcSimVars {
  /** the selected OBS heading for Nav */
  [nav_obs: IndexedEventType<'nav_obs'>]: number,
  /** the course deviation for Nav */
  [nav_cdi: IndexedEventType<'nav_cdi'>]: number,
  /** the distance to Nav */
  [nav_dme: IndexedEventType<'nav_dme'>]: number,
  /** does the nav have DME */
  [nav_has_dme: IndexedEventType<'nav_has_dme'>]: boolean,
  /** does the nav have nav */
  [nav_has_nav: IndexedEventType<'nav_has_nav'>]: boolean,
  /** the radial for Nav */
  [nav_radial: IndexedEventType<'nav_radial'>]: number,
  /** signal strength for Nav */
  [nav_signal: IndexedEventType<'nav_signal'>]: number,
  /** the ident for Nav */
  [nav_ident: IndexedEventType<'nav_ident'>]: string,
  /** Nav tofrom flag */
  [nav_to_from: IndexedEventType<'nav_to_from'>]: VorToFrom,
  /** Nav localizer flag */
  [nav_localizer: IndexedEventType<'nav_localizer'>]: boolean,
  /** Nav localizer course */
  [nav_localizer_crs: IndexedEventType<'nav_localizer_crs'>]: number,
  /** Nav glideslope flag */
  [nav_glideslope: IndexedEventType<'nav_glideslope'>]: boolean,
  /** Nav glideslope error */
  [nav_gs_error: IndexedEventType<'nav_gs_error'>]: number,
  /** Nav raw glideslope angle */
  [nav_raw_gs: IndexedEventType<'nav_raw_gs'>]: number,
  /** Nav glideslope end position. */
  [nav_gs_lla: IndexedEventType<'nav_gs_lla'>]: LatLongAlt,
  /** Nav magvar correction */
  [nav_magvar: IndexedEventType<'nav_magvar'>]: number,
  /** DTK to the next GPS waypoint */
  gps_dtk: number,
  /** XTK error for the next GPS waypoint */
  gps_xtk: number,
  /** next GPS waypoint */
  gps_wp: string,
  /** next GPS waypoint bearing */
  gps_wp_bearing: number,
  /** next GPS waypoint distance */
  gps_wp_distance: number
  /** ADF signal strength */
  [adf_signal: IndexedEventType<'adf_signal'>]: number,
  /** ADF bearing */
  [adf_bearing: IndexedEventType<'adf_bearing'>]: number,
  /** Marker Beacon State */
  mkr_bcn_state_simvar: MarkerBeaconState,
  /** Nav Tuned LLA */
  [nav_lla: IndexedEventType<'nav_lla'>]: LatLongAlt,
  /** GPS Obs Active */
  gps_obs_active_simvar: boolean,
  /** GPS Obs Value Setting */
  gps_obs_value_simvar: number,
}


/** Publish simvars for ourselves */
export class NavProcSimVarPublisher extends SimVarPublisher<NavProcSimVars> {
  private static simvars = new Map<keyof NavProcSimVars, SimVarDefinition>([
    ['nav_obs_1', { name: 'NAV OBS:1', type: SimVarValueType.Degree }],
    ['nav_cdi_1', { name: 'NAV CDI:1', type: SimVarValueType.Number }],
    ['nav_dme_1', { name: 'NAV DME:1', type: SimVarValueType.NM }],
    ['nav_has_dme_1', { name: 'NAV HAS DME:1', type: SimVarValueType.Bool }],
    ['nav_has_nav_1', { name: 'NAV HAS NAV:1', type: SimVarValueType.Bool }],
    ['nav_radial_1', { name: 'NAV RADIAL:1', type: SimVarValueType.Radians }],
    ['nav_signal_1', { name: 'NAV SIGNAL:1', type: SimVarValueType.Number }],
    ['nav_ident_1', { name: 'NAV IDENT:1', type: SimVarValueType.String }],
    ['nav_to_from_1', { name: 'NAV TOFROM:1', type: SimVarValueType.Enum }],
    ['nav_localizer_1', { name: 'NAV HAS LOCALIZER:1', type: SimVarValueType.Bool }],
    ['nav_localizer_crs_1', { name: 'NAV LOCALIZER:1', type: SimVarValueType.Number }],
    ['nav_glideslope_1', { name: 'NAV HAS GLIDE SLOPE:1', type: SimVarValueType.Bool }],
    ['nav_gs_error_1', { name: 'NAV GLIDE SLOPE ERROR:1', type: SimVarValueType.Degree }],
    ['nav_raw_gs_1', { name: 'NAV RAW GLIDE SLOPE:1', type: SimVarValueType.Degree }],
    ['nav_gs_lla_1', { name: 'NAV GS LATLONALT:1', type: SimVarValueType.LLA }],
    ['nav_lla_1', { name: 'NAV VOR LATLONALT:1', type: SimVarValueType.LLA }],
    ['nav_magvar_1', { name: 'NAV MAGVAR:1', type: SimVarValueType.Degree }],
    ['nav_obs_2', { name: 'NAV OBS:2', type: SimVarValueType.Degree }],
    ['nav_cdi_2', { name: 'NAV CDI:2', type: SimVarValueType.Number }],
    ['nav_dme_2', { name: 'NAV DME:2', type: SimVarValueType.NM }],
    ['nav_has_dme_2', { name: 'NAV HAS DME:2', type: SimVarValueType.Bool }],
    ['nav_has_nav_2', { name: 'NAV HAS NAV:2', type: SimVarValueType.Bool }],
    ['nav_radial_2', { name: 'NAV RADIAL:2', type: SimVarValueType.Radians }],
    ['nav_signal_2', { name: 'NAV SIGNAL:2', type: SimVarValueType.Number }],
    ['nav_ident_2', { name: 'NAV IDENT:2', type: SimVarValueType.String }],
    ['nav_to_from_2', { name: 'NAV TOFROM:2', type: SimVarValueType.Enum }],
    ['nav_localizer_2', { name: 'NAV HAS LOCALIZER:2', type: SimVarValueType.Bool }],
    ['nav_localizer_crs_2', { name: 'NAV LOCALIZER:2', type: SimVarValueType.Number }],
    ['nav_glideslope_2', { name: 'NAV HAS GLIDE SLOPE:2', type: SimVarValueType.Bool }],
    ['nav_gs_error_2', { name: 'NAV GLIDE SLOPE ERROR:2', type: SimVarValueType.Degree }],
    ['nav_raw_gs_2', { name: 'NAV RAW GLIDE SLOPE:2', type: SimVarValueType.Degree }],
    ['nav_gs_lla_2', { name: 'NAV GS LATLONALT:2', type: SimVarValueType.LLA }],
    ['nav_lla_2', { name: 'NAV VOR LATLONALT:2', type: SimVarValueType.LLA }],
    ['nav_magvar_2', { name: 'NAV MAGVAR:2', type: SimVarValueType.Degree }],
    ['gps_dtk', { name: 'GPS WP DESIRED TRACK', type: SimVarValueType.Degree }],
    ['gps_xtk', { name: 'GPS WP CROSS TRK', type: SimVarValueType.NM }],
    ['gps_wp', { name: 'GPS WP NEXT ID', type: SimVarValueType.NM }],
    ['gps_wp_bearing', { name: 'GPS WP BEARING', type: SimVarValueType.String }],
    ['gps_wp_distance', { name: 'GPS WP DISTANCE', type: SimVarValueType.NM }],
    ['adf_bearing_1', { name: 'ADF RADIAL:1', type: SimVarValueType.Radians }],
    ['adf_signal_1', { name: 'ADF SIGNAL:1', type: SimVarValueType.Number }],
    ['mkr_bcn_state_simvar', { name: 'MARKER BEACON STATE', type: SimVarValueType.Number }],
    ['gps_obs_active_simvar', { name: 'GPS OBS ACTIVE', type: SimVarValueType.Bool }],
    ['gps_obs_value_simvar', { name: 'GPS OBS VALUE', type: SimVarValueType.Degree }]
  ]);

  /**
   * Create a NavProcSimVarPublisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the pace of publishing
   */
  public constructor(bus: EventBus, pacer: PublishPacer<NavProcSimVars> | undefined = undefined) {
    super(NavProcSimVarPublisher.simvars, bus, pacer);
  }
}

//
// Navigation event configurations
//

export enum NavSourceType {
  Nav,
  Gps,
  Adf
}

//* ENUM for VOR To/From Flag */
export enum VorToFrom {
  OFF = 0,
  TO = 1,
  FROM = 2
}

/** Specified for a particular navigation source */
export type NavSourceId = {
  /** The type of source it is. */
  type: NavSourceType | null,
  /** The index of this in the given source type. */
  index: number
}

/** The OBS setting for a nav source. */
export type ObsSetting = {
  /** the nav source */
  source: NavSourceId,
  /** the setting in degrees */
  heading: number | null
}

/** the deviation setting for a nav source */
export type CdiDeviation = {
  /** the nav source */
  source: NavSourceId,
  /** the setting in degrees */
  deviation: number | null
}

/** The to/from value for a vor radio. */
export type VorToFromSetting = {
  /** the to/from setting for the VOR */
  toFrom: VorToFrom,
  /** the nav source id */
  source: NavSourceId
}

/** The dme state for a nav radio. */
export type DmeState = {
  /** whether the radio has DME */
  hasDme: boolean,
  /** this distance to the DME station */
  dmeDistance: number | null,
  /** the nav source id */
  source: NavSourceId
}

/** whether a nav source has a localizer signal. */
export type Localizer = {
  /** whether there is a localizer signal */
  isValid: boolean,
  /** the localizer course */
  course: number,
  /** the nav source id */
  source: NavSourceId
}

/** whether a nav source is tuned to a localizer frequency. */
export type LocalizerFrequency = {
  /** if the freq is a loc */
  isLocalizer: boolean,
  /** the nav source id */
  source: NavSourceId
}

/** whether a nav source has a glideslope signal. */
export type Glideslope = {
  /** whether there is a gs signal */
  isValid: boolean,
  /** the gs deviation value */
  deviation: number,
  /** the angle of the gs */
  gsAngle: number,
  /** the nav source id */
  source: NavSourceId
}

/** The magnetic variation for a tuned nav station. */
export type NavMagneticVariation = {
  /** the magnetic variation value */
  variation: number,
  /** the nav source id */
  source: NavSourceId
}


/** The validity for a bearing source. */
export type BearingValidity = {
  /** the index number of the reference being changed */
  index: number,
  /** the new validity */
  valid: boolean
}

/** The ident for a bearing source. */
export type BearingIdent = {
  /** the index number of the reference being changed */
  index: number,
  /** the new ident */
  ident: string | null,
  /** is this station a loc */
  isLoc: boolean | null
}

/** An indexed source setting */
export type BearingSource = {
  /** the index number of the reference being changed */
  index: number,
  /** the new source instrument */
  source: NavSourceId | null
}

/** An indexed source setting */
export type BearingDirection = {
  /** the index number of the reference being changed */
  index: number,
  /** the new source instrument */
  direction: number | null
}

/** An indexed source setting */
export type BearingDistance = {
  /** the index number of the reference being changed */
  index: number,
  /** the new source instrument */
  distance: number | null
}

/** If the bearing source is a localizer. */
export type BearingIsLoc = {
  /** the index number of the reference being changed */
  index: number,
  /** if the source is a loc */
  isLoc: boolean | null
}

/** Marker beacon signal state. */
export enum MarkerBeaconState {
  Inactive,
  Outer,
  Middle,
  Inner
}

/** navprocessor events */
export interface NavEvents {
  /** an OBS heading in degrees*/
  obs_set: ObsSetting;
  /** a CDI selection event */
  cdi_select: NavSourceId;
  /** actual deviation in points */
  cdi_deviation: CdiDeviation;
  /** dme distance in nm */
  dme_distance: number,
  /** dme speed in kt */
  dme_speed: number,
  /** vor distance in m */
  // TODO: make all distances be in m or nm
  vor_distance: number,
  /** nav to/from value */
  vor_to_from: VorToFromSetting,
  /** nav radio selected */
  nav_select: number,
  /** the validity of a bearing source */
  brg_validity: BearingValidity,
  /** the ident for a bearing needle */
  brg_ident: BearingIdent,
  // /** whether a bearing source is a localizer */
  // brg_is_loc: BearingIsLoc,
  /** changed source of a bearing needle */
  brg_source: BearingSource,
  /** changed distance of a bearing needle */
  brg_distance: BearingDistance,
  /** changed heading to a bearing source */
  brg_direction: BearingDirection,
  /** changed magnetic variation for a tune nav station */
  mag_variation: NavMagneticVariation,
  /** whether a localizer exists and its course */
  localizer: Localizer,
  /** whether a glideslope exists and its deviation */
  glideslope: Glideslope,
  /** whether a nav source frequency is a localizer frequency */
  is_localizer_frequency: LocalizerFrequency,
  /** Marker Beacon State */
  mkr_bcn_state: MarkerBeaconState,
  /** DME State */
  dme_state: DmeState,
  /** GPS Obs Active */
  gps_obs_active: boolean,
  /** GPS Obs Value Setting */
  gps_obs_value: number
}

/** The interface to a nav source. */
export interface NavSource {
  /** The ID of the source. */
  srcId: NavSourceId;
  /** The nav signal strength. */
  signal: number | null;
  /** Whether the source info is valed. */
  valid: boolean;
  /** Whether this is an active bearing source. */
  activeBrg: boolean;
  /** Whether this is an active CDI source. */
  activeCdi: boolean;
  /** Whether this source provides course deviation information. */
  hasCdi: boolean;
  /** Whether the source provides DME info. */
  hasDme: boolean;
  /** Whether the source has glideslope info. */
  hasGlideslope: boolean;
  /** Whether the source has localizer info. */
  hasLocalizer: boolean;
  /** Whether the source is a localizer frequency. */
  isLocalizerFrequency: boolean | null;
  /** A handler to call when source validity changes. */
  validHandler?: ((valid: boolean, source: NavSourceId) => void);
  /** A handler to call when the source ident changes. */
  identHandler?: ((ident: string | null, source: NavSourceId) => void);
  /** A handler to call when the bearing to the source changes. */
  brgHandler?: ((bearing: number | null, source: NavSourceId) => void);
  /** A handler to call when the distance to the source changes. */
  distHandler?: ((distance: number | null, source: NavSourceId) => void);
  /** A handler to call when the OBS setting for the source changes. */
  obsHandler?: ((heading: number | null, source: NavSourceId) => void);
  /** A handler to call when the lateral deviation from the source changes. */
  deviationHandler?: ((deviation: number | null, source: NavSourceId) => void);
  /** A handler to call when the to/from state of the source changes. */
  toFromHandler?: ((toFrom: VorToFrom, source: NavSourceId) => void);
  /** A handler to call when the vertical deviation from the source changes. */
  glideslopeDeviationHandler?: ((deviation: number | null, source: NavSourceId) => void);
  /** A handler to call when the angle on the glide slope changes. */
  glideslopeAngleHandler?: ((angle: number | null, source: NavSourceId) => void);
  /** A handler to call when the magvar of the source changes. */
  magvarHandler?: ((magvar: number | null, source: NavSourceId) => void);
  /** A handler to call when wtf.  */
  isLocalizerFrequencyHandler?: ((isLocalizer: boolean | null, source: NavSourceId) => void);
  /** The ident for this source. */
  ident: string | null;
  /** The bearing to this source. */
  bearing: number | null;
  /** Distance to the source. */
  distance: number | null;
  /** OBS bearing in degrees. */
  obs?: number;
  /** Deviation in points. */
  deviation?: number | null;
  /** The to/from state of the source. */
  toFrom?: VorToFrom;
  /** The localizer course. */
  localizerCourse?: number | null;
  /** The glideslope deviation. */
  glideslopeDeviation?: number | null;
  /** The glideslope angle. */
  glideslopeAngle?: number | null;
  /** The magnetic variation at the source. */
  magneticVariation?: number | null;
}

/**
 * Encapsulation of the logic for a generic nav source.
 */
class NavSourceBase implements NavSource {
  public srcId: NavSourceId;
  private _ident: string | null = null;
  private _bearing: number | null = null;
  private _distance: number | null = null;
  private _obs = 0;
  private _deviation: number | null = null;
  private _toFrom: VorToFrom = VorToFrom.OFF;
  private _glideslopeDeviation: number | null = null;
  private _glideslopeAngle: number | null = null;
  private _localizerCourse: number | null = null;
  private _magneticVariation: number | null = null;
  private _isLocalizerFrequency: boolean | null = null;
  public validHandler: ((valid: boolean, source: NavSourceId) => void) | undefined = undefined;
  public identHandler: ((ident: string | null, source: NavSourceId) => void) | undefined = undefined;
  public brgHandler: ((bearing: number | null, source: NavSourceId) => void) | undefined = undefined;
  public distHandler: ((distance: number | null, source: NavSourceId) => void) | undefined = undefined;
  public obsHandler: ((obs: number | null, source: NavSourceId) => void) | undefined = undefined;
  public deviationHandler: ((deviation: number | null, source: NavSourceId) => void) | undefined = undefined;
  public toFromHandler: ((toFrom: VorToFrom, source: NavSourceId) => void) | undefined = undefined;
  public glideslopeDeviationHandler: ((deviation: number | null, source: NavSourceId) => void) | undefined = undefined;
  public glideslopeAngleHandler: ((angle: number | null, source: NavSourceId) => void) | undefined = undefined;
  public localizerCourseHandler: ((course: number | null, source: NavSourceId) => void) | undefined = undefined;
  public magvarHandler: ((magvar: number | null, source: NavSourceId) => void) | undefined = undefined;
  public isLocalizerFrequencyHandler: ((isLocFreq: boolean | null, sournce: NavSourceId) => void) | undefined = undefined;

  private _valid = false;
  private _activeBrg = false;
  private _activeCdi = false;
  private _hasCdi = false;
  private _hasDme = false;
  private _hasLocalizer = false;
  private _hasGlideslope = false;
  private _signal = 0;
  private _activeForCount = 0;


  /**
   * Create a bearing pointer
   * @param id The navsourceid.
   */
  public constructor(id: NavSourceId) {
    if (id.type !== null && id.type in [NavSourceType.Nav, NavSourceType.Gps]) {
      this._hasCdi = true;
    }
    this.valid = false;
    this.srcId = id;
  }

  /**
   * Do we support CDI?
   * @returns A boolean with our CDI support state.
   */
  public get hasCdi(): boolean {
    return this._hasCdi;
  }

  /**
   * Set a new ident.
   * @param ident The new ident string.
   */
  public set ident(ident: string | null) {
    this._ident = ident;
    if (this.valid && this.activeBrg && this.identHandler !== undefined) {
      this.identHandler(ident, this.srcId);
    }
  }

  /**
   * Get an ident.
   * @returns A string identifying the nav source.
   */
  public get ident(): string | null {
    if (this._signal > 0) {
      return this._ident;
    } else {
      return null;
    }
  }

  /**
   * Set a new bearing.
   * @param bearing The new bearing in degrees.
   */
  public set bearing(bearing: number | null) {
    if (bearing !== null) {
      bearing *= 57.2958;
      bearing = (bearing + 180) % 360;
    }
    this._bearing = bearing;
    if (this.valid && this.activeBrg && this.brgHandler !== undefined) {
      this.brgHandler(bearing, this.srcId);
    }
  }

  /**
   * Get abearing.
   * @returns Bearing to the source in degrees.
   */
  public get bearing(): number | null {
    return this._bearing;
  }

  /**
   * Set a new distance
   * @param distance The distance in NM.
   */
  public set distance(distance: number | null) {
    this._distance = distance;
    if (this.valid && this.activeBrg && this.distHandler !== undefined) {
      this.distHandler(this.distance, this.srcId);
    }
  }

  /**
   * Get the distance to a source..
   * @returns Distance to the source in degrees.
   */
  public get distance(): number | null {
    if (this.hasDme) {
      return this._distance;
    } else {
      return null;
    }
  }

  /**
   * Set a new OBS
   * @param obs the new bearing in degrees
   */
  public set obs(obs: number) {
    this._obs = obs;
    if (this.activeCdi && this.obsHandler !== undefined) {
      this.obsHandler(obs, this.srcId);
    }
  }

  /**
   * Get the OBS setting.
   * @returns OBS in degrees.
   */
  public get obs(): number {
    return this._obs;
  }

  /**
   * Set a new deviation
   * @param deviation The new deviation in points.
   */
  public set deviation(deviation: number | null) {
    this._deviation = deviation;
    if (this.activeCdi && this.deviationHandler !== undefined) {
      this.deviationHandler(deviation, this.srcId);
    }
  }

  /**
   * Get the deviation.
   * @returns The deviation in points.
   */
  public get deviation(): number | null {
    return this._deviation;
  }


  /**
   * Set a new VOR to/from value
   * @param toFrom The to/from value.
   */
  public set toFrom(toFrom: VorToFrom) {
    if (this.activeCdi && this.toFromHandler !== undefined) {
      this.toFromHandler(toFrom, this.srcId);
    }
    this._toFrom = toFrom;
  }

  /**
   * Get the VOR to/from value.
   * @returns The VOR to/from value.
   */
  public get toFrom(): VorToFrom {
    return this._toFrom;
  }

  /**
   * Set whether the nav radio has a loc signal
   * @param valid If the loc exists.
   */
  public set hasLocalizer(valid: boolean) {
    this._hasLocalizer = valid;
    if (!this._hasLocalizer) {
      this.localizerCourse = -1;
    } else if (this._hasLocalizer && this.localizerCourseHandler && this.localizerCourseHandler !== null
      && this._localizerCourse !== null && this._localizerCourse >= 0) {
      this.localizerCourseHandler(this._localizerCourse, this.srcId);
    }
  }

  /**
   * Get if the radio has a loc.
   * @returns The loc bool.
   */
  public get hasLocalizer(): boolean {
    return this._hasLocalizer;
  }

  /**
   * Set a new localizerCourse
   * @param course The new localizer course.
   */
  public set localizerCourse(course: number | null) {
    this._localizerCourse = course !== null ? course * (180 / Math.PI) : -1;
    if (this._localizerCourse !== -1 && this.localizerCourseHandler !== undefined) {
      this.localizerCourseHandler(this._localizerCourse, this.srcId);
    }
  }

  /**
   * Get the localizerCourse.
   * @returns The glideslopeDeviation in degrees.
   */
  public get localizerCourse(): number | null {
    return this._localizerCourse;
  }

  /**
   * Set whether the nav radio has a GS signal
   * @param valid If the GS exists.
   */
  public set hasGlideslope(valid: boolean) {
    this._hasGlideslope = valid;
    if (this.glideslopeDeviationHandler !== undefined) {
      this.glideslopeDeviationHandler(this.glideslopeDeviation, this.srcId);
    }
  }

  /**
   * Get if the radio has a glideslope.
   * @returns The glideslope bool.
   */
  public get hasGlideslope(): boolean {
    return this._hasGlideslope;
  }

  /**
   * Set a new _glideslopeDeviation
   * @param deviation The new deviation in points.
   */
  public set glideslopeDeviation(deviation: number | null) {
    this._glideslopeDeviation = deviation;
    if (this.valid && this.activeCdi && this.hasGlideslope && this.glideslopeDeviationHandler !== undefined) {
      this.glideslopeDeviationHandler(deviation, this.srcId);
    }
  }

  /**
   * Get the glideslopeDeviation.
   * @returns The glideslopeDeviation in degrees.
   */
  public get glideslopeDeviation(): number | null {
    return this._glideslopeDeviation;
  }

  /**
   * Set a new _glideslopeAngle
   * @param angle The new angle in degrees.
   */
  public set glideslopeAngle(angle: number | null) {
    this._glideslopeAngle = angle;
    if (this.valid && this.activeCdi && this.hasGlideslope && this.glideslopeAngleHandler !== undefined) {
      this.glideslopeAngleHandler(angle, this.srcId);
    }
  }

  /**
   * Get the glideslopeAngle.
   * @returns The glideslopeAngle in degrees.
   */
  public get glideslopeAngle(): number | null {
    return this._glideslopeAngle;
  }

  /**
   * Set whether there's a valid DME signal.
   * @param hasDme Whether a nav signal is present or not.
   */
  public set hasDme(hasDme: boolean) {
    this._hasDme = hasDme;
    if (this.distHandler !== undefined) {
      // If hasDme state is changing, we need to publish a new distance event.
      // The getter for this.distance handles whether there's a DME signal or not.
      this.distHandler(this.distance, this.srcId);
    }
  }

  /**
   * Get whether there's a valid DME signal.
   * @returns A boolean indicatind presence of DME.
   */
  public get hasDme(): boolean {
    return this._hasDme;
  }

  /**
   * Get the nav radio magvar.
   * @returns The magvar value.
   */
  public get magneticVariation(): number | null {
    return this._magneticVariation;
  }

  /**
   * Set a new nav radio magvar
   * @param magvar The new nav radio magvar.
   */
  public set magneticVariation(magvar: number | null) {
    this._magneticVariation = magvar;
    if (this.valid && this.activeCdi && this.magvarHandler !== undefined) {
      this.magvarHandler(magvar, this.srcId);
    }
  }

  /**
   * Get if the frequency is for a localizer.
   * @returns a bool of whether the freq is for a localizer.
   */
  public get isLocalizerFrequency(): boolean | null {
    return this._isLocalizerFrequency;
  }

  /**
   * Sets if a frequency is for a localizer
   * @param isLocFreq whether the freq is a localizer freq.
   */
  public set isLocalizerFrequency(isLocFreq: boolean | null) {
    if (this.isLocalizerFrequencyHandler !== undefined) {
      this.isLocalizerFrequencyHandler(isLocFreq, this.srcId);
    }
    this._isLocalizerFrequency = isLocFreq;
  }


  /**
   * Set the nav signal strength.
   * @param signal The signal strength as a number.
   */
  public set signal(signal: number) {
    if ((this._signal == 0) != (signal == 0)) {
      // if we gain or lose signal, we need to update our ident.
      this._signal = signal;
      if (this.identHandler !== undefined) {
        // The getter for ident will handle whether we have signal or not.
        this.identHandler(this.ident, this.srcId);
      }
    } else {
      // repaet this from above to avoid a needless temporary assigment.
      this._signal = signal;
    }
  }

  /**
   * Set validity.
   * @param valid Whether we are valid or not.
   */
  public set valid(valid: boolean) {
    // TODO Make sure this matches up with new activeBrg logic
    this._valid = valid;

    this.validHandler && this.validHandler(valid, this.srcId);

    if (valid && this.activeBrg) {
      if (this.identHandler !== undefined) {
        this.identHandler(this._ident, this.srcId);
      }
      if (this.brgHandler !== undefined) {
        this.brgHandler(this._bearing, this.srcId);
      }
      if (this.distHandler !== undefined) {
        this.distHandler(this._distance, this.srcId);
      }
      if (this.toFromHandler !== undefined) {
        this.toFromHandler(this._toFrom, this.srcId);
      }
      if (this.localizerCourseHandler !== undefined) {
        this.localizerCourseHandler(this._localizerCourse, this.srcId);
      }
      if (this.glideslopeDeviationHandler !== undefined) {
        this.glideslopeDeviationHandler(this._glideslopeDeviation, this.srcId);
      }
      if (this.magvarHandler !== undefined) {
        this.magvarHandler(this._magneticVariation, this.srcId);
      }
      if (this.isLocalizerFrequencyHandler !== undefined) {
        this.isLocalizerFrequencyHandler(this._isLocalizerFrequency, this.srcId);
      }
      if (this.obsHandler !== undefined) {
        this.obsHandler(this._obs, this.srcId);
      }
    } else if (this.activeBrg) {
      if (this.identHandler !== undefined) {
        this.identHandler(null, this.srcId);
      }
      if (this.brgHandler !== undefined) {
        this.brgHandler(null, this.srcId);
      }
      if (this.distHandler !== undefined) {
        this.distHandler(null, this.srcId);
      }
      if (this.toFromHandler !== undefined) {
        this.toFromHandler(this._toFrom, this.srcId);
      }
      if (this.localizerCourseHandler !== undefined) {
        this.localizerCourseHandler(null, this.srcId);
      }
      if (this.glideslopeDeviationHandler !== undefined) {
        this.glideslopeDeviationHandler(null, this.srcId);
      }
      if (this.magvarHandler !== undefined) {
        this.magvarHandler(null, this.srcId);
      }
      if (this.isLocalizerFrequencyHandler !== undefined) {
        this.isLocalizerFrequencyHandler(this._isLocalizerFrequency, this.srcId);
      }
      if (this.obsHandler !== undefined) {
        this.obsHandler(this._obs, this.srcId);
      }
    }
  }


  /**
   * Get validity
   * @returns A boolean indicating whether this is valid
   */
  public get valid(): boolean {
    return this._valid;
  }

  /**
   * Set as active for bearing information
   * @param active Whether we are active for bearing info.
   */
  public set activeBrg(active: boolean) {
    if (active) {
      this._activeForCount++;
    } else if (this._activeForCount > 0) {
      this._activeForCount--;
    }

    this.validHandler && this.validHandler(this.valid, this.srcId);

    if (!this.activeBrg || !this.valid) {
      if (this.identHandler !== undefined) {
        this.identHandler(null, this.srcId);
      }
      if (this.brgHandler !== undefined) {
        this.brgHandler(null, this.srcId);
      }
      if (this.distHandler !== undefined) {
        this.distHandler(null, this.srcId);
      }
      if (this.toFromHandler !== undefined) {
        this.toFromHandler(this._toFrom, this.srcId);
      }
      if (this.isLocalizerFrequencyHandler !== undefined) {
        this.isLocalizerFrequencyHandler(this._isLocalizerFrequency, this.srcId);
      }
    } else {
      if (this.identHandler !== undefined) {
        this.identHandler(this.ident, this.srcId);
      }
      if (this.brgHandler !== undefined) {
        this.brgHandler(this.bearing, this.srcId);
      }
      if (this.distHandler !== undefined) {
        this.distHandler(this.distance, this.srcId);
      }
      if (this.toFromHandler !== undefined) {
        this.toFromHandler(this._toFrom, this.srcId);
      }
      if (this.isLocalizerFrequencyHandler !== undefined) {
        this.isLocalizerFrequencyHandler(this._isLocalizerFrequency, this.srcId);
      }
    }
  }

  /**
   * Are we active for bearing information?
   * @returns Our active state
   */
  public get activeBrg(): boolean {
    return this._activeForCount > 0;
  }

  /**
   * Set this at the active deviation source or not
   * @param active Whether we are active for publishing deviation info.
   */
  public set activeCdi(active: boolean) {
    this._activeCdi = active;
    if (active && this.deviationHandler !== undefined) {
      this.deviationHandler(this._deviation, this.srcId);
    }
  }

  /**
   * Are we active for CDI data?
   * @returns Boolean of our CDI active state
   */
  public get activeCdi(): boolean {
    return this._activeCdi;
  }
}

/**
 * A convenience class for creating a navproc configuration set.
 *
 * Implementers should instantiate this and then populate the sets with the
 * HEvents that their radio sends for various actions.
 */
export class NavProcessorConfig {
  public numNav = 2;
  public numGps = 1;
  public numAdf = 1;
  public courseIncEvents = new Set<string>();
  public courseDecEvents = new Set<string>();
  public courseSyncEvents = new Set<string>();
  public simVarPublisher?: NavProcSimVarPublisher;
  public additionalSources = new Array<NavSource>();
}

/**
 * A publisher for navigation processor events.
 */
class NavProcPublisher extends BasePublisher<NavEvents> {
  /**
   * Creates a NavProcPublisher
   * @param bus The event bus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<NavEvents>) {
    super(bus, pacer);
  }

  /**
   * Publish a new CDI source selection.
   * @param source The selected NavSource.
   */
  public publishCdiSelect(source: NavSourceId): void {
    this.publish('cdi_select', source, true);
  }

  /**
   * Publish a new CDI deviation
   * @param deviation The deviation
   * @param source the source for thes deviation
   */
  public publishDeviation(deviation: number | null, source: NavSourceId): void {
    this.publish('cdi_deviation', { source: source, deviation: deviation });
  }

  /**
   * Publish a new OBS heading
   * @param heading The heading
   * @param source The source for this heading.
   */
  public publishObsHeading(heading: number | null, source: NavSourceId): void {
    this.publish('obs_set', { source: source, heading: heading });
  }

  /**
   * Publish new validity information.
   * @param index The bearing index number to update.
   * @param valid The validity state of that berign source.
   */
  public publishBrgValidity(index: number, valid: boolean): void {
    this.publish('brg_validity', { index: index, valid: valid }, true);
  }

  /**
   * Publish a new bearing source
   * @param index The source number.
   * @param source The source name.
   */
  public publishBrgSrc(index: number, source: NavSourceId | null): void {
    this.publish('brg_source', { index: index, source: source });
  }

  /**
   * Publish heading of a bearing source.
   * @param index The index number to update.
   * @param direction The direction.
   */
  public publishBrgDir(index: number, direction: number | null): void {
    this.publish('brg_direction', { index: index, direction: direction });
  }

  /**
   * Publish distance to a bearing source.
   * @param index The source number.
   * @param distance The distance in NMs.
   */
  public publishBrgDist(index: number, distance: number | null): void {
    this.publish('brg_distance', { index: index, distance: distance });
  }

  /**
   * Publish distance to a bearing source.
   * @param index The source number.
   * @param ident The ident as a string.
   * @param isLoc is this source a loc.
   */
  public publishBrgIdent(index: number, ident: string | null, isLoc: boolean | null): void {
    this.publish('brg_ident', { index: index, ident: ident, isLoc: isLoc });
  }

  // /**
  //  * Publish distance to a bearing source.
  //  * @param index The source number.
  //  * @param isLoc The ident as a string.
  //  */
  // public publishBrgIsLoc(index: number, isLoc: boolean | null): void {
  //     this.publish('brg_is_loc', { index: index, isLoc: isLoc });
  // }

  /**
   * Publish to/from value for a nav source.
   * @param toFrom The to/from enum value.
   * @param source The nav radio source.
   */
  public publishToFrom(toFrom: VorToFrom, source: NavSourceId): void {
    this.publish('vor_to_from', { toFrom: toFrom, source: source });
  }

  /**
   * Publish localizer value for a nav source.
   * @param localizer is the localizer data
   * @param source The nav radio source.
   */
  public publishLocalizer(localizer: Localizer, source: NavSourceId): void {
    this.publish('localizer', { isValid: localizer.isValid, course: localizer.course, source: source });
  }

  /**
   * Publish if the nav source is tuned to a localizer frequency.
   * @param isLoc is a bool whether or not the nav source is a loc frequency
   * @param source The nav radio source.
   */
  public publishIsLocalizerFrequency(isLoc: LocalizerFrequency, source: NavSourceId): void {
    this.publish('is_localizer_frequency', { isLocalizer: isLoc.isLocalizer, source: source });
  }

  /**
   * Publish gliseslope value for a nav source.
   * @param glideslope is the localizer data
   * @param source The nav radio source.
   */
  public publishGlideslope(glideslope: Glideslope, source: NavSourceId): void {
    this.publish('glideslope', { isValid: glideslope.isValid, deviation: glideslope.deviation, gsAngle: glideslope.gsAngle, source: source });
  }

  /**
   * Publish magvar value for a nav source.
   * @param variation is the magnetic variation
   * @param source The nav radio source.
   */
  public publishMagvar(variation: number | null, source: NavSourceId): void {
    if (variation !== null) {
      this.publish('mag_variation', { variation: variation, source: source });
    }
  }

  /**
   * Publish marker beacon state value.
   * @param state is the marker beacon state value
   */
  public publishMarkerBeacon(state: number): void {
    this.publish('mkr_bcn_state', state);
  }

  /**
   * Publish DME state.
   * @param state is the has_dme state value
   * @param distance is the dme distance value.
   * @param source The nav radio source.
   */
  public publishDmeState(state: boolean, distance: number | null, source: NavSourceId): void {
    this.publish('dme_state', { hasDme: state, dmeDistance: distance, source: source });
  }

  /**
   * Publish GPS OBS State.
   * @param state is the GPS OBS Active State
   */
  public publishGpsObsState(state: boolean): void {
    this.publish('gps_obs_active', state, true);
  }

  /**
   * Publish GPS OBS Value.
   * @param value is the GPS OBS heading value
   */
  public publishGpsObsValue(value: number): void {
    this.publish('gps_obs_value', value, true);
  }
}

/**
 * The core of tne nav processor
 */
export class NavProcessor {
  private bus: EventBus;
  private config: NavProcessorConfig;
  private cdiSourceIdx: number;
  private bearingSourceIdxs: Array<number>;
  private hEvents: EventSubscriber<HEvent>;
  private navComSubscriber: EventSubscriber<RadioEvents>;
  private publisher: NavProcPublisher;
  private simVarPublisher: NavProcSimVarPublisher;
  private controlSubscriber: EventSubscriber<ControlEvents>;
  private simVarSubscriber: EventSubscriber<NavProcSimVars>;
  private navSources: Array<NavSource>;
  private readonly brgSrcAsoboMap = [-1, 0, 1, 3, 2];


  /**
   * Create a NavProcessor.
   * @param bus The event bus to publish to.
   * @param config A config object defining our radio options.
   */
  public constructor(bus: EventBus, config: NavProcessorConfig) {
    this.bus = bus;
    this.config = config;
    this.publisher = new NavProcPublisher(bus);
    this.simVarPublisher = config.simVarPublisher ? config.simVarPublisher : new NavProcSimVarPublisher(this.bus);
    this.hEvents = bus.getSubscriber<HEvent>();
    this.controlSubscriber = bus.getSubscriber<ControlEvents>();
    this.simVarSubscriber = new EventSubscriber<NavProcSimVars>(bus);
    this.navComSubscriber = bus.getSubscriber<RadioEvents>();
    this.navSources = new Array<NavSource>();
    this.bearingSourceIdxs = [-1, -1];
    this.cdiSourceIdx = 0;
  }

  /**
   * Initialize a nav processor
   */
  public init(): void {
    this.publisher.startPublish();
    this.simVarPublisher.startPublish();

    this.hEvents.on('hEvent').handle(this.eventHandler);

    this.controlSubscriber.on('cdi_src_switch').handle(() => {
      this.switchCdiSrc();
    });
    this.controlSubscriber.on('cdi_src_set').handle((src) => {
      if (src.type === NavSourceType.Gps) {
        this.switchCdiSrc(3);
      } else if (src.type === NavSourceType.Nav) {
        this.switchCdiSrc(src.index - 1);
      }
    });
    this.controlSubscriber.on('cdi_src_gps_toggle').handle(this.onCdiGpsToggle);
    this.controlSubscriber.on('init_cdi').handle(this.initCdi.bind(this));
    this.controlSubscriber.on('brg_src_switch').handle(this.cycleBrgSrc.bind(this));

    // TODO Determine why this throttle doesn't work but does on the client end.
    this.simVarSubscriber.on('mkr_bcn_state_simvar').whenChanged().handle((state) => {
      this.publisher.publishMarkerBeacon(state);
    });
    this.simVarSubscriber.on('gps_obs_active_simvar').whenChanged().handle((state) => {
      this.publisher.publishGpsObsState(state);
    });
    this.simVarSubscriber.on('gps_obs_value_simvar').whenChangedBy(1).handle((value) => {
      this.publisher.publishGpsObsValue(value);
    });

    for (let i = 1; i <= this.config.numNav; i++) {
      const src = new NavSourceBase({ type: NavSourceType.Nav, index: i });
      src.deviationHandler = this.publisher.publishDeviation.bind(this.publisher);
      src.obsHandler = this.publisher.publishObsHeading.bind(this.publisher);
      src.distHandler = this.onBrgDistance.bind(this);
      src.brgHandler = this.onBrgDirection.bind(this);
      src.identHandler = this.onBrgIdent.bind(this);
      src.toFromHandler = this.publisher.publishToFrom.bind(this.publisher);
      src.localizerCourseHandler = this.onLocalizerCourse.bind(this);
      src.glideslopeDeviationHandler = this.onGlideslopeDeviation.bind(this);
      src.magvarHandler = this.publisher.publishMagvar.bind(this.publisher);
      src.isLocalizerFrequencyHandler = this.onIsLocalizerFrequency.bind(this);
      src.glideslopeAngleHandler = this.onGlideslopeAngle.bind(this);
      src.validHandler = this.onBrgValidity.bind(this);

      this.simVarSubscriber.on(`nav_cdi_${i}`).whenChangedBy(1).handle((deviation) => {
        src.deviation = deviation;
      });
      this.simVarSubscriber.on(`nav_obs_${i}`).whenChangedBy(1).handle((obs) => {
        src.obs = obs;
      });
      this.simVarSubscriber.on(`nav_dme_${i}`).whenChangedBy(0.1).handle((distance) => {
        src.distance = distance;
        // TODO Fold DME logic into the distance handler.
        this.onDme(src.hasDme, src.distance, src.srcId);
      });
      this.simVarSubscriber.on(`nav_radial_${i}`).handle((bearing) => {
        src.bearing = bearing;
      });
      this.simVarSubscriber.on(`nav_ident_${i}`).whenChanged().handle((ident) => {
        src.ident = ident;
      });
      this.simVarSubscriber.on(`nav_signal_${i}`).withPrecision(0).handle((signal) => {
        src.signal = signal;
      });
      this.simVarSubscriber.on(`nav_has_nav_${i}`).whenChanged().handle((valid) => {
        src.valid = !!valid;
      });
      this.simVarSubscriber.on(`nav_has_dme_${i}`).whenChanged().handle((dme) => {
        src.hasDme = !!dme;
        // TODO Fold DME logic into the distance handler.
        this.onDme(src.hasDme, src.distance, src.srcId);
      });
      this.simVarSubscriber.on(`nav_to_from_${i}`).whenChanged().handle((value) => {
        src.toFrom = value;
      });
      this.simVarSubscriber.on(`nav_localizer_${i}`).whenChanged().handle((localizer) => {
        src.hasLocalizer = localizer;
      });
      this.simVarSubscriber.on(`nav_localizer_crs_${i}`).whenChanged().handle((locCourse) => {
        src.localizerCourse = locCourse;
      });
      this.simVarSubscriber.on(`nav_glideslope_${i}`).whenChanged().handle((gs) => {
        src.hasGlideslope = gs;
      });
      this.simVarSubscriber.on(`nav_gs_error_${i}`).whenChanged().handle((gsDev) => {
        src.glideslopeDeviation = gsDev;
      });
      this.simVarSubscriber.on(`nav_raw_gs_${i}`).whenChanged().handle((rawGs) => {
        src.glideslopeAngle = rawGs;
      });
      this.simVarSubscriber.on(`nav_magvar_${i}`).whenChanged().handle((magvar) => {
        src.magneticVariation = magvar;
      });
      this.navComSubscriber.on('set_radio_state').handle((radioState) => {
        if (radioState.radioType === RadioType.Nav && radioState.index == i && radioState.activeFrequency) {
          src.isLocalizerFrequency = this.frequencyIsLocalizer(radioState.activeFrequency) as boolean;
        }
      });
      this.navComSubscriber.on('set_frequency').handle((setFrequency) => {
        if (setFrequency.radio.radioType === RadioType.Nav && setFrequency.radio.index == i
          && setFrequency.bank == FrequencyBank.Active) {
          src.isLocalizerFrequency = this.frequencyIsLocalizer(setFrequency.frequency) as boolean;
          for (let j = 0; j < this.bearingSourceIdxs.length; j++) {
            if (this.navSources[this.bearingSourceIdxs[j]] !== undefined) {
              const source = this.navSources[this.bearingSourceIdxs[j]].srcId;
              if (source.type === NavSourceType.Nav && source.index === i) {
                this.setBrgSrc(j, this.bearingSourceIdxs[j]);
              }
            }
          }
        }
      });
      this.navSources.push(src);
    }

    // TODO Add support for multiple GPSes
    if (this.config.numGps > 0) {
      // Set the CDI source to the first GPS (which, since we're zero-indexed, is the
      // same as the number of nav radios.
      this.cdiSourceIdx = this.config.numNav;
      const src = new NavSourceBase({ type: NavSourceType.Gps, index: 1 });
      src.valid = true;
      src.deviationHandler = this.publisher.publishDeviation.bind(this.publisher);
      src.obsHandler = this.publisher.publishObsHeading.bind(this.publisher);
      src.distHandler = this.onBrgDistance.bind(this);
      src.brgHandler = this.onBrgDirection.bind(this);
      src.identHandler = this.onBrgIdent.bind(this);
      this.simVarSubscriber.on('gps_xtk').whenChangedBy(1).handle((deviation) => {
        src.deviation = deviation as number;
      });
      this.simVarSubscriber.on('gps_dtk').whenChangedBy(1).handle((obs) => {
        src.obs = obs as number;
      });
      this.simVarSubscriber.on('gps_wp_bearing').withPrecision(2).handle((brg) => {
        // The nav source bearing expects to be a radial, not the bearing to the
        // waypoint.  When we get the bearing from the GPS, we need to invert it
        // so the NavSource knows how to handle it correctly.
        // TODO Make bearing handling in NavSourceBase more consistent.
        brg = (brg + Math.PI) % (2 * Math.PI);
        src.bearing = brg;
      });
      this.navSources.push(src);
    }

    if (this.config.numAdf > 0) {
      const src = new NavSourceBase({ type: NavSourceType.Adf, index: 1 });
      src.valid = false;
      src.signal = 0;
      src.brgHandler = this.onBrgDirection.bind(this);
      src.identHandler = this.onBrgIdent.bind(this);
      src.validHandler = this.onBrgValidity.bind(this);
      this.simVarSubscriber.on('adf_signal_1').withPrecision(0).handle((signal) => {
        src.signal = signal;
        if (signal > 0) {
          if (!src.valid) {
            src.valid = true;
          }
        } else {
          if (src.valid) {
            src.valid = false;
          }
        }
      });
      this.navComSubscriber.on('adf_active_frequency_1').handle((freq) => {
        if (src.ident !== freq.toFixed(1)) {
          src.ident = freq.toFixed(1);
        }
      });
      this.simVarSubscriber.on('adf_bearing_1').withPrecision(2).handle((brg) => {
        brg = (brg + Math.PI) % (2 * Math.PI);
        src.bearing = brg;
      });
      this.navSources.push(src);
    }

    for (const source of this.config.additionalSources) {
      this.addNavSource(source);
    }

    // HINT: Initialize cdi source based on FLT
    const initGpsDrivesNav1 = SimVar.GetSimVarValue('GPS DRIVES NAV1', SimVarValueType.Bool);
    this.cdiSourceIdx = initGpsDrivesNav1 ? this.getFirstNavSourceIndexByType(NavSourceType.Gps) : this.getFirstNavSourceIndexByType(NavSourceType.Nav);

    // HINT: Initialize bearing sources based on FLT (compatability with current missions)
    for (let i = 0; i < 2; i++) {
      const fltBrgSrc = SimVar.GetSimVarValue(`L:PFD_BRG${i + 1}_Source`, SimVarValueType.Number);
      this.setBrgSrc(i, this.brgSrcAsoboMap[fltBrgSrc]);
    }
  }

  /**
   * Add a custom nav source to the processor.
   * @param source The implementation of NavSourceBase to add.
   */
  public addNavSource(source: NavSource): void {
    // TODO Add remaining handlers here for other custom nav sources.
    if (source.validHandler) {
      source.validHandler = this.onBrgValidity.bind(this);
    }

    if (source.brgHandler) {
      source.brgHandler = this.onBrgDirection.bind(this);
    }

    if (source.distHandler) {
      source.distHandler = this.onBrgDistance.bind(this);
    }

    if (source.identHandler) {
      source.identHandler = this.onBrgIdent.bind(this);
    }
    this.navSources.push(source);
  }

  /**
   * Process a CDI source change event.
   * @param index is specified if a specific cdiSourceIdx is requested
   */
  private switchCdiSrc(index?: number): void {
    let src = this.navSources[this.cdiSourceIdx];
    src.activeCdi = false;

    if (index !== undefined && index < this.navSources.length && this.navSources[index].hasCdi) {
      this.cdiSourceIdx = index;
    } else if (index === undefined) {
      do {
        this.cdiSourceIdx = this.cdiSourceIdx < this.navSources.length - 1 ? this.cdiSourceIdx + 1 : 0;
      } while (!this.navSources[this.cdiSourceIdx].hasCdi);
    } else {
      console.warn(`switchCdiSrc: Unable to set CDI Source index ${index}`);
      return;
    }

    src = this.navSources[this.cdiSourceIdx];
    src.activeCdi = true;

    this.publisher.publishCdiSelect(src.srcId);

    if (src.obs) {
      this.publisher.publishObsHeading(src.obs, src.srcId);
    }
    if (src.toFrom) {
      this.publisher.publishToFrom(src.toFrom, src.srcId);
    }
    this.publisher.publishDmeState(src.hasDme, src.distance, src.srcId);

    SimVar.SetSimVarValue('GPS DRIVES NAV1', SimVarValueType.Bool, src.srcId.type === NavSourceType.Gps);
    if (src.srcId.type === NavSourceType.Nav) {
      SimVar.SetSimVarValue('AUTOPILOT NAV SELECTED', SimVarValueType.Number, src.srcId.index);
    }
  }

  /**srcent.
   */
  private initCdi(): void {
    const src = this.navSources[this.cdiSourceIdx];
    src.activeCdi = true;
    this.publisher.publishCdiSelect(src.srcId);
    if (src.obs) {
      this.publisher.publishObsHeading(src.obs, src.srcId);
    }
    if (src.toFrom) {
      this.publisher.publishToFrom(src.toFrom, src.srcId);
    }
    this.publisher.publishDmeState(src.hasDme, src.distance, src.srcId);

    SimVar.SetSimVarValue('GPS DRIVES NAV1', SimVarValueType.Bool, src.srcId.type === NavSourceType.Gps);
  }

  /**
   * Process a bearing source change event.
   * @param index The index of the source to change (1-based).
   */
  private cycleBrgSrc(index: number): void {
    index--;
    let newNavSrcIndex = -1;
    if (this.bearingSourceIdxs[index] < this.navSources.length - 1) {
      newNavSrcIndex = this.bearingSourceIdxs[index] + 1;
    }

    this.setBrgSrc(index, newNavSrcIndex);
  }

  /**
   * Set the bearing source to the specified nav source index.
   * @param bearingSrcIndex The index of the bearing source to change (0-based).
   * @param navSrcIndex The index of the nav source to change to (0-based).
   */
  private setBrgSrc(bearingSrcIndex: number, navSrcIndex: number): void {
    if (bearingSrcIndex > this.bearingSourceIdxs.length - 1
      || navSrcIndex > this.navSources.length - 1) {
      console.warn(`setBrgSrc: Unable to set bearing source index ${bearingSrcIndex} and nav source index ${navSrcIndex}`);
      return;
    }

    const oldSrc = this.navSources[this.bearingSourceIdxs[bearingSrcIndex]];
    if (oldSrc !== undefined) {
      oldSrc.activeBrg = false;
    }

    this.bearingSourceIdxs[bearingSrcIndex] = navSrcIndex;

    const newSrc = this.navSources[this.bearingSourceIdxs[bearingSrcIndex]];
    this.publisher.publishBrgSrc(bearingSrcIndex, newSrc !== undefined ? newSrc.srcId : null);

    // HINT setting brg source LVar for mission compatability
    SimVar.SetSimVarValue(`L:PFD_BRG${bearingSrcIndex + 1}_Source`, SimVarValueType.Number, this.brgSrcAsoboMap.indexOf(navSrcIndex));

    if (newSrc !== undefined) {
      newSrc.activeBrg = true;
    }
    newSrc && this.publisher.publishBrgValidity(bearingSrcIndex, newSrc.valid);
    if (newSrc === undefined) {
      this.publisher.publishBrgIdent(bearingSrcIndex, null, false);
      this.publisher.publishBrgDir(bearingSrcIndex, null);
      this.publisher.publishBrgDist(bearingSrcIndex, null);
      //this.publisher.publishBrgIsLoc(index, false);
    }
  }

  /**
   * Handle HEvents
   * @param event The hEvent name
   */
  private eventHandler = (event: string): void => {
    if (this.config.courseIncEvents.has(event)) {
      this.handleCrsInc();
    } else if (this.config.courseDecEvents.has(event)) {
      this.handleCrsDec();
    } else if (this.config.courseSyncEvents.has(event)) {
      this.handleCrsSync();
    }
  };

  /**
   * Handle a course inc event if we have a nav radio as our active CDI source.
   */
  private handleCrsInc(): void {
    if (this.navSources[this.cdiSourceIdx].srcId.type != NavSourceType.Nav) {
      return;
    }
    switch (this.navSources[this.cdiSourceIdx].srcId.index) {
      case 1:
        SimVar.SetSimVarValue('K:VOR1_OBI_INC', 'number', 0); break;
      case 2:
        SimVar.SetSimVarValue('K:VOR2_OBI_INC', 'number', 0);
    }
  }

  /**
   * Handle a course dec event if we have a nav radio as our active CDI source.
   */
  private handleCrsDec(): void {
    if (this.navSources[this.cdiSourceIdx].srcId.type != NavSourceType.Nav) {
      return;
    }
    switch (this.navSources[this.cdiSourceIdx].srcId.index) {
      case 1:
        SimVar.SetSimVarValue('K:VOR1_OBI_DEC', 'number', 0); break;
      case 2:
        SimVar.SetSimVarValue('K:VOR2_OBI_DEC', 'number', 0); break;
    }
  }

  /**
   * Handle a course sync event if we have a nav radio as our active CDI source.
   */
  private handleCrsSync(): void {
    if (this.navSources[this.cdiSourceIdx].srcId.type != NavSourceType.Nav) {
      return;
    }

    switch (this.navSources[this.cdiSourceIdx].srcId.index) {
      case 1:
        SimVar.SetSimVarValue('K:VOR1_SET', 'number', this.navSources[0].bearing); break;
      case 2:
        SimVar.SetSimVarValue('K:VOR2_SET', 'number', this.navSources[1].bearing); break;
    }
  }

  /**
   * Handle a bearing validity change.
   * @param valid The new bearing validity
   * @param source The source of
   */
  private onBrgValidity(valid: boolean, source: NavSourceId): void {
    if (this.bearingSourceIdxs) {
      for (let i = 0; i < this.bearingSourceIdxs.length; i++) {
        if (this.navSources[this.bearingSourceIdxs[i]] &&
          this.navSources[this.bearingSourceIdxs[i]].srcId == source
        ) {
          this.publisher.publishBrgValidity(i, valid);
        }
      }
    }
  }

  // TODO Unify the next two functions
  /**
   * Handle a bearing distance change.
   * @param distance The distance to the source.
   * @param source The nav source ID.
   */
  private onBrgDistance(distance: number | null, source: NavSourceId): void {
    for (let i = 0; i < this.bearingSourceIdxs.length; i++) {
      if (this.navSources[this.bearingSourceIdxs[i]] &&
        this.navSources[this.bearingSourceIdxs[i]].srcId == source &&
        !this.navSources[this.bearingSourceIdxs[i]].isLocalizerFrequency) {
        this.publisher.publishBrgDist(i, distance);
      }
    }
  }

  /**
   * Handle a bearing direction change.
   * @param direction The distance to the source.
   * @param source The nav source ID.
   */
  private onBrgDirection(direction: number | null, source: NavSourceId): void {
    for (let i = 0; i < this.bearingSourceIdxs.length; i++) {
      if (this.navSources[this.bearingSourceIdxs[i]] &&
        this.navSources[this.bearingSourceIdxs[i]].srcId == source &&
        !this.navSources[this.bearingSourceIdxs[i]].isLocalizerFrequency) {
        this.publisher.publishBrgDir(i, direction);
      }
    }
  }

  /**
   * Handle a bearing ident change.
   * @param ident The ident of the source.
   * @param source The nav source ID.
   */
  private onBrgIdent(ident: string | null, source: NavSourceId): void {
    for (let i = 0; i < this.bearingSourceIdxs.length; i++) {
      if (this.navSources[this.bearingSourceIdxs[i]] &&
        this.navSources[this.bearingSourceIdxs[i]].srcId == source) {
        this.publisher.publishBrgIdent(i, ident, this.navSources[this.bearingSourceIdxs[i]].isLocalizerFrequency);
        //this.publisher.publishBrgIsLoc(i, this.navSources[this.bearingSourceIdxs[i]].isLocalizerFrequency);
        if (this.navSources[this.bearingSourceIdxs[i]].isLocalizerFrequency) {
          this.publisher.publishBrgDir(i, null);
          this.publisher.publishBrgDist(i, null);
        } else {
          this.publisher.publishBrgSrc(i, source);
        }
      }
    }
  }

  /**
   * Handle a localizer course change.
   * @param course The localizer course of the source.
   * @param source The nav source ID.
   */
  private onLocalizerCourse(course: number | null, source: NavSourceId): void {
    for (let i = 0; i < this.navSources.length; i++) {
      if (this.navSources[i] && this.navSources[i].srcId == source && this.navSources[i].hasLocalizer && course !== null) {
        const localizer: Localizer = { isValid: true, course: course, source: source };
        this.publisher.publishLocalizer(localizer, source);
      }
    }
  }

  /**
   * Handle a glideslope deviation change.
   * @param deviation The glideslope deviation of the source.
   * @param source The nav source ID.
   */
  private onGlideslopeDeviation(deviation: number | null, source: NavSourceId): void {
    for (let i = 0; i < this.navSources.length; i++) {
      const navSource = this.navSources[i];
      if (navSource && navSource.srcId == source && deviation !== null && navSource.glideslopeAngle) {
        const glideslope: Glideslope = { isValid: this.navSources[i].hasGlideslope, deviation: deviation, gsAngle: navSource.glideslopeAngle, source: source };
        this.publisher.publishGlideslope(glideslope, source);
      }
    }
  }

  /**
   * Handle a glideslope angle change.
   * @param angle The glideslope angle of the source.
   * @param source The nav source ID.
   */
  private onGlideslopeAngle(angle: number | null, source: NavSourceId): void {
    for (let i = 0; i < this.navSources.length; i++) {
      const navSource = this.navSources[i];
      if (navSource && navSource.srcId == source && navSource.deviation && angle !== null) {
        const glideslope: Glideslope = { isValid: this.navSources[i].hasGlideslope, deviation: navSource.deviation, gsAngle: angle, source: source };
        this.publisher.publishGlideslope(glideslope, source);
      }
    }
  }

  /**
   * Determine whether a set frequency is a localizer frequency.
   * @param frequency The frequency to evaluate.
   * @returns a bool true if the frequency is a loc freq.
   */
  private frequencyIsLocalizer(frequency: number): boolean {
    const roundedFreq = Math.round(frequency * 100) / 100;
    return RadioUtils.isLocalizerFrequency(roundedFreq);
  }

  /**
   * Publishers whether a set frequency is a localizer frequency.
   * @param isLoc whether the freq is a loc.
   * @param source the selected nav source.
   */
  private onIsLocalizerFrequency(isLoc: boolean | null, source: NavSourceId): void {
    if (isLoc !== null) {
      const loc: LocalizerFrequency = { isLocalizer: isLoc, source: source };
      this.publisher.publishIsLocalizerFrequency(loc, source);
    }
  }

  /**
   * Publishers dme distance info.  This should be replaced by a generalization of
   * BearingDistance that provides the distance to any nav source if it has DME.
   * @param hasDme whether the radio has dme.
   * @param distance is the dme distance.
   * @param source the selected nav source.
   */
  private onDme(hasDme: boolean | null, distance: number | null, source: NavSourceId): void {
    this.publisher.publishDmeState(hasDme ? hasDme : false, distance ? distance : -1, source);
  }

  /**
   * Toggles CDI between GPS and NAV1.
   */
  private onCdiGpsToggle = (): void => {
    const src = this.navSources[this.cdiSourceIdx];
    if (src.srcId.type === NavSourceType.Gps) {
      this.switchCdiSrc();
    } else {
      this.switchCdiSrc(3);
    }
  };

  /**
   * Gets the index of the first nav source of the given type.
   * @param type The type of nav source to find.
   * @returns The nav source index.
   */
  private getFirstNavSourceIndexByType(type: NavSourceType): number {
    return this.navSources.findIndex(source => source.srcId.type === type);
  }

  /**
   * Perform events for the update loop.
   */
  public onUpdate(): void {
    this.simVarPublisher.onUpdate();
  }
}