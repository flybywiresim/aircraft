/// <reference types="msfstypes/JS/common" />

import { EventBus, Publisher } from '../data';
import { NavMath } from '../geo/NavMath';
import { Instrument } from './Backplane';
import { CdiDeviation, Glideslope, Localizer, NavEvents, NavProcSimVarPublisher, NavProcSimVars, NavSourceId, NavSourceType, ObsSetting } from './NavProcessor';

/**
 * Radio data for autopilot navigation.
 */
interface APNavRadioData {
  /** The location of the tuned glideslope. */
  gsLocation: LatLongAlt;

  /** The location of the tuned navaid. */
  navLocation: LatLongAlt;

  /** The radio localizer. */
  localizer: Localizer;

  /** The radio glideslope. */
  glideslope: Glideslope;

  /** The CDI deviation. */
  cdi: CdiDeviation;

  /** The OBS setting. */
  obs: ObsSetting;

  /** The magnetic variation. */
  magVar: number;
}

/**
 * Events related to the active navigation radio.
 */
export interface NavRadioEvents {
  /** The location of the tuned glideslope on the active nav radio. */
  nav_radio_active_gs_location: LatLongAlt;
  /** The location of the tuned station on the active nav radio. */
  nav_radio_active_nav_location: LatLongAlt;
  /** Localizer data for the active nav radio. */
  nav_radio_active_localizer: Localizer;
  /** Glideslope data for the active nav radio. */
  nav_radio_active_glideslope: Glideslope;
  /** The obs setting of the current nav radio. */
  nav_radio_active_obs_setting: ObsSetting;
  /** The CDI deviation of the current nav radio. */
  nav_radio_active_cdi_deviation: CdiDeviation;
  /** The magnetic variation, in degrees, of the tuned station on the active nav radio. */
  nav_radio_active_magvar: number;
  /** The Nav1 Localizer. */
  nav_radio_localizer_1: Localizer;
  /** The Nav2 Localizer. */
  nav_radio_localizer_2: Localizer;
  /** The Nav1 CdiDeviation. */
  nav_radio_cdi_1: CdiDeviation;
  /** The Nav2 CdiDeviation. */
  nav_radio_cdi_2: CdiDeviation;
}

/**
 * An instrument that gathers localizer and glideslope information for use by
 * the AP systems.
 */
export class APRadioNavInstrument implements Instrument {

  private readonly navRadioData: { [index: number]: APNavRadioData } = {
    0: {
      gsLocation: new LatLongAlt(0, 0),
      navLocation: new LatLongAlt(0, 0),
      glideslope: this.createEmptyGlideslope({ index: 1, type: NavSourceType.Nav }),
      localizer: this.createEmptyLocalizer({ index: 1, type: NavSourceType.Nav }),
      cdi: this.createEmptyCdi({ index: 1, type: NavSourceType.Nav }),
      obs: this.createEmptyObs({ index: 1, type: NavSourceType.Nav }),
      magVar: 0
    },
    1: {
      gsLocation: new LatLongAlt(0, 0),
      navLocation: new LatLongAlt(0, 0),
      glideslope: this.createEmptyGlideslope({ index: 1, type: NavSourceType.Nav }),
      localizer: this.createEmptyLocalizer({ index: 1, type: NavSourceType.Nav }),
      cdi: this.createEmptyCdi({ index: 1, type: NavSourceType.Nav }),
      obs: this.createEmptyObs({ index: 1, type: NavSourceType.Nav }),
      magVar: 0
    },
    2: {
      gsLocation: new LatLongAlt(0, 0),
      navLocation: new LatLongAlt(0, 0),
      glideslope: this.createEmptyGlideslope({ index: 2, type: NavSourceType.Nav }),
      localizer: this.createEmptyLocalizer({ index: 2, type: NavSourceType.Nav }),
      cdi: this.createEmptyCdi({ index: 2, type: NavSourceType.Nav }),
      obs: this.createEmptyObs({ index: 2, type: NavSourceType.Nav }),
      magVar: 0
    }
  };

  private readonly navProc: NavProcSimVarPublisher;
  private readonly publisher: Publisher<NavRadioEvents>;
  private currentCdiIndex = 1;

  /**
   * Creates an instance of the APRadioNavInstrument.
   * @param bus The event bus to use with this instance.
   */
  constructor(private readonly bus: EventBus) {
    this.navProc = new NavProcSimVarPublisher(bus);
    this.publisher = bus.getPublisher<NavRadioEvents>();
  }

  /** @inheritdoc */
  public init(): void {
    this.navProc.startPublish();


    const navProcSubscriber = this.bus.getSubscriber<NavProcSimVars>();
    navProcSubscriber.on('nav_glideslope_1').whenChanged().handle(hasGs => this.setGlideslopeValue(1, 'isValid', hasGs));
    navProcSubscriber.on('nav_gs_lla_1').handle(lla => this.setGlideslopePosition(1, lla));
    navProcSubscriber.on('nav_gs_error_1').whenChanged().handle(gsError => this.setGlideslopeValue(1, 'deviation', gsError));
    navProcSubscriber.on('nav_raw_gs_1').whenChanged().handle(rawGs => this.setGlideslopeValue(1, 'gsAngle', rawGs));
    navProcSubscriber.on('nav_localizer_1').whenChanged().handle(hasLoc => this.setLocalizerValue(1, 'isValid', hasLoc));
    navProcSubscriber.on('nav_localizer_crs_1').whenChanged().handle(locCourse => this.setLocalizerValue(1, 'course', locCourse));
    navProcSubscriber.on('nav_cdi_1').whenChanged().handle(deviation => this.setCDIValue(1, 'deviation', deviation));
    navProcSubscriber.on('nav_obs_1').whenChanged().handle(obs => this.setOBSValue(1, 'heading', obs));
    navProcSubscriber.on('nav_glideslope_2').whenChanged().handle(hasGs => this.setGlideslopeValue(2, 'isValid', hasGs));
    navProcSubscriber.on('nav_gs_lla_2').handle(lla => this.setGlideslopePosition(2, lla));
    navProcSubscriber.on('nav_gs_error_2').whenChanged().handle(gsError => this.setGlideslopeValue(2, 'deviation', gsError));
    navProcSubscriber.on('nav_raw_gs_2').whenChanged().handle(rawGs => this.setGlideslopeValue(2, 'gsAngle', rawGs));
    navProcSubscriber.on('nav_localizer_2').whenChanged().handle(hasLoc => this.setLocalizerValue(2, 'isValid', hasLoc));
    navProcSubscriber.on('nav_localizer_crs_2').whenChanged().handle(locCourse => this.setLocalizerValue(2, 'course', locCourse));
    navProcSubscriber.on('nav_cdi_2').whenChanged().handle(deviation => this.setCDIValue(2, 'deviation', deviation));
    navProcSubscriber.on('nav_obs_2').whenChanged().handle(obs => this.setOBSValue(2, 'heading', obs));
    navProcSubscriber.on('nav_lla_1').handle(lla => this.setNavPosition(1, lla));
    navProcSubscriber.on('nav_lla_2').handle(lla => this.setNavPosition(2, lla));
    navProcSubscriber.on('nav_magvar_1').whenChanged().handle(magVar => this.setMagVar(1, magVar));
    navProcSubscriber.on('nav_magvar_2').whenChanged().handle(magVar => this.setMagVar(2, magVar));

    const navEvents = this.bus.getSubscriber<NavEvents>();
    navEvents.on('cdi_select').handle(source => {
      const oldIndex = this.currentCdiIndex;
      this.currentCdiIndex = source.type === NavSourceType.Nav ? source.index : 0;

      if (oldIndex !== this.currentCdiIndex) {
        const data = this.navRadioData[this.currentCdiIndex];

        this.publisher.pub('nav_radio_active_gs_location', data.gsLocation);
        this.publisher.pub('nav_radio_active_nav_location', data.navLocation);
        this.publisher.pub('nav_radio_active_glideslope', data.glideslope);
        this.publisher.pub('nav_radio_active_localizer', data.localizer);
        this.publisher.pub('nav_radio_active_cdi_deviation', data.cdi);
        this.publisher.pub('nav_radio_active_obs_setting', data.obs);
        this.publisher.pub('nav_radio_active_magvar', data.magVar);
      }
    });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.navProc.onUpdate();
  }

  /**
   * Sets a value in a nav radio glideslope.
   * @param index The index of the nav radio.
   * @param field The field to set.
   * @param value The value to set the field to.
   */
  private setGlideslopeValue<T extends keyof Glideslope>(index: number, field: T, value: Glideslope[T]): void {
    this.navRadioData[index].glideslope[field] = value;

    if (this.currentCdiIndex === index) {
      this.publisher.pub('nav_radio_active_glideslope', this.navRadioData[index].glideslope);
    }
  }

  /**
   * Sends the current glideslope's LLA position.
   * @param index The index of the nav radio.
   * @param lla The LLA to send.
   */
  private setGlideslopePosition(index: number, lla: LatLongAlt): void {
    this.navRadioData[index].gsLocation = lla;

    if (this.currentCdiIndex === index) {
      this.publisher.pub('nav_radio_active_gs_location', lla);
    }
  }

  /**
   * Sends the current nav's LLA position.
   * @param index The index of the nav radio.
   * @param lla The LLA to send.
   */
  private setNavPosition(index: number, lla: LatLongAlt): void {
    this.navRadioData[index].navLocation = lla;

    if (this.currentCdiIndex === index) {
      this.publisher.pub('nav_radio_active_nav_location', lla);
    }
  }

  /**
   * Sets a value in a nav radio localizer.
   * @param index The index of the nav radio.
   * @param field The field to set.
   * @param value The value to set the field to.
   */
  private setLocalizerValue<T extends keyof Localizer>(index: number, field: T, value: Localizer[T]): void {
    this.navRadioData[index].localizer[field] = value;

    if (this.currentCdiIndex === index) {
      this.publisher.pub('nav_radio_active_localizer', this.navRadioData[index].localizer);
    }

    switch (index) {
      case 1:
        this.publisher.pub('nav_radio_localizer_1', this.navRadioData[index].localizer);
        break;
      case 2:
        this.publisher.pub('nav_radio_localizer_2', this.navRadioData[index].localizer);
        break;
    }
  }

  /**
   * Sets a value in a nav radio localizer.
   * @param index The index of the nav radio.
   * @param field The field to set.
   * @param value The value to set the field to.
   */
  private setCDIValue<T extends keyof CdiDeviation>(index: number, field: T, value: CdiDeviation[T]): void {
    this.navRadioData[index].cdi[field] = value;

    if (this.currentCdiIndex === index) {
      this.publisher.pub('nav_radio_active_cdi_deviation', this.navRadioData[index].cdi);
    }

    switch (index) {
      case 1:
        this.publisher.pub('nav_radio_cdi_1', this.navRadioData[index].cdi);
        break;
      case 2:
        this.publisher.pub('nav_radio_cdi_2', this.navRadioData[index].cdi);
        break;
    }
  }

  /**
   * Sets a value in a nav radio localizer.
   * @param index The index of the nav radio.
   * @param field The field to set.
   * @param value The value to set the field to.
   */
  private setOBSValue<T extends keyof ObsSetting>(index: number, field: T, value: ObsSetting[T]): void {
    this.navRadioData[index].obs[field] = value;

    if (this.currentCdiIndex === index) {
      this.publisher.pub('nav_radio_active_obs_setting', this.navRadioData[index].obs);
    }
  }

  /**
   * Sets the magnetic variation of a nav radio signal source.
   * @param index The index of the nav radio.
   * @param magVar The magvar to set.
   */
  private setMagVar(index: number, magVar: number): void {
    magVar = NavMath.normalizeHeading(-magVar + 180) % 360 - 180;

    this.navRadioData[index].magVar = magVar;
    if (this.currentCdiIndex === index) {
      this.publisher.pub('nav_radio_active_magvar', magVar);
    }
  }

  /**
   * Creates an empty localizer data.
   * @param id The nav source ID.
   * @returns New empty localizer data.
   */
  private createEmptyLocalizer(id: NavSourceId): Localizer {
    return {
      isValid: false,
      course: 0,
      source: id
    };
  }

  /**
   * Creates an empty glideslope data.
   * @param id The nav source ID.
   * @returns New empty glideslope data.
   */
  private createEmptyGlideslope(id: NavSourceId): Glideslope {
    return {
      isValid: false,
      gsAngle: 0,
      deviation: 0,
      source: id
    };
  }

  /**
   * Creates an empty CDI data.
   * @param id The nav source ID.
   * @returns New empty CDI data.
   */
  private createEmptyCdi(id: NavSourceId): CdiDeviation {
    return {
      deviation: 0,
      source: id
    };
  }

  /**
   * Creates an empty OBS data.
   * @param id The nav source ID.
   * @returns New empty OBS data.
   */
  private createEmptyObs(id: NavSourceId): ObsSetting {
    return {
      heading: 0,
      source: id
    };
  }
}