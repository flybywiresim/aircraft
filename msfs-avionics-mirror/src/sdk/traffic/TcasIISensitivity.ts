import { MathUtils } from '../math/MathUtils';
import { NumberUnitInterface, UnitFamily, UnitType } from '../math/NumberUnit';
import { TcasAdvisoryParameters, TcasSensitivity, TcasSensitivityParameters, TcasTcaParameters } from './Tcas';

/**
 * Standard TCAS-II sensitivity parameters.
 */
export class TcasIISensitivityParameters {
  private static readonly PA = {
    protectedRadius: UnitType.NMILE.createNumber(6),
    protectedHeight: UnitType.FOOT.createNumber(1200)
  };

  private static readonly TA_LEVELS = [
    {
      lookaheadTime: UnitType.SECOND.createNumber(20),
      protectedRadius: UnitType.NMILE.createNumber(0.3),
      protectedHeight: UnitType.FOOT.createNumber(850)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(25),
      protectedRadius: UnitType.NMILE.createNumber(0.33),
      protectedHeight: UnitType.FOOT.createNumber(850)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(30),
      protectedRadius: UnitType.NMILE.createNumber(0.48),
      protectedHeight: UnitType.FOOT.createNumber(850)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(40),
      protectedRadius: UnitType.NMILE.createNumber(0.75),
      protectedHeight: UnitType.FOOT.createNumber(850)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(45),
      protectedRadius: UnitType.NMILE.createNumber(1),
      protectedHeight: UnitType.FOOT.createNumber(850)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(48),
      protectedRadius: UnitType.NMILE.createNumber(1.3),
      protectedHeight: UnitType.FOOT.createNumber(850)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(48),
      protectedRadius: UnitType.NMILE.createNumber(1.3),
      protectedHeight: UnitType.FOOT.createNumber(1200)
    }
  ];

  private static readonly RA_LEVELS = [
    {
      lookaheadTime: UnitType.SECOND.createNumber(15),
      protectedRadius: UnitType.NMILE.createNumber(0.2),
      protectedHeight: UnitType.FOOT.createNumber(600),
      alim: UnitType.FOOT.createNumber(300)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(15),
      protectedRadius: UnitType.NMILE.createNumber(0.2),
      protectedHeight: UnitType.FOOT.createNumber(600),
      alim: UnitType.FOOT.createNumber(300)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(20),
      protectedRadius: UnitType.NMILE.createNumber(0.35),
      protectedHeight: UnitType.FOOT.createNumber(600),
      alim: UnitType.FOOT.createNumber(300)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(25),
      protectedRadius: UnitType.NMILE.createNumber(0.55),
      protectedHeight: UnitType.FOOT.createNumber(600),
      alim: UnitType.FOOT.createNumber(350)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(30),
      protectedRadius: UnitType.NMILE.createNumber(0.8),
      protectedHeight: UnitType.FOOT.createNumber(600),
      alim: UnitType.FOOT.createNumber(400)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(35),
      protectedRadius: UnitType.NMILE.createNumber(1.1),
      protectedHeight: UnitType.FOOT.createNumber(700),
      alim: UnitType.FOOT.createNumber(600)
    },
    {
      lookaheadTime: UnitType.SECOND.createNumber(35),
      protectedRadius: UnitType.NMILE.createNumber(1.1),
      protectedHeight: UnitType.FOOT.createNumber(800),
      alim: UnitType.FOOT.createNumber(700)
    }
  ];

  /**
   * Selects a sensitivity level for a specified environment.
   * @param altitude The indicated altitude of the own airplane.
   * @param radarAltitude The radar altitude of the own airplane.
   * @returns The sensitivity level for the specified environment.
   */
  public selectLevel(
    altitude: NumberUnitInterface<UnitFamily.Distance>,
    radarAltitude: NumberUnitInterface<UnitFamily.Distance>
  ): number {
    const altFeet = altitude.asUnit(UnitType.FOOT);
    const radarAltFeet = radarAltitude.asUnit(UnitType.FOOT);

    let level: number;
    if (radarAltFeet > 2350) {
      if (altFeet > 42000) {
        level = 6;
      } else if (altFeet > 20000) {
        level = 5;
      } else if (altFeet > 10000) {
        level = 4;
      } else if (altFeet > 5000) {
        level = 3;
      } else {
        level = 2;
      }
    } else if (radarAltFeet > 1000) {
      level = 1;
    } else {
      level = 0;
    }

    return level;
  }

  /**
   * Selects Proximity Advisory sensitivity parameters.
   * @param altitude The indicated altitude of the own airplane.
   * @param radarAltitude The radar altitude of the own airplane.
   * @returns Proximity Advisory sensitivity parameters.
   */
  public selectPA(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    altitude: NumberUnitInterface<UnitFamily.Distance>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    radarAltitude: NumberUnitInterface<UnitFamily.Distance>
  ): TcasAdvisoryParameters {
    return TcasIISensitivityParameters.PA;
  }

  /**
   * Selects Traffic Advisory sensitivity parameters for a specified environment.
   * @param altitude The indicated altitude of the own airplane.
   * @param radarAltitude The radar altitude of the own airplane.
   * @returns Traffic Advisory sensitivity parameters for the specified environment.
   */
  public selectTA(
    altitude: NumberUnitInterface<UnitFamily.Distance>,
    radarAltitude: NumberUnitInterface<UnitFamily.Distance>
  ): TcasTcaParameters {
    return TcasIISensitivityParameters.TA_LEVELS[this.selectLevel(altitude, radarAltitude)];
  }

  /**
   * Selects Resolution Advisory sensitivity parameters for a specified environment.
   * @param altitude The indicated altitude of the own airplane.
   * @param radarAltitude The radar altitude of the own airplane.
   * @returns Resolution Advisory sensitivity parameters for the specified environment.
   */
  public selectRA(
    altitude: NumberUnitInterface<UnitFamily.Distance>,
    radarAltitude: NumberUnitInterface<UnitFamily.Distance>
  ): TcasTcaParameters {
    return TcasIISensitivityParameters.RA_LEVELS[this.selectLevel(altitude, radarAltitude)];
  }

  /**
   * Selects a Resolution Advisory ALIM for a specified environment.
   * @param altitude The indicated altitude of the own airplane.
   * @param radarAltitude The radar altitude of the own airplane.
   * @returns A Resolution Advisory ALIM for the specified environment.
   */
  public selectRAAlim(
    altitude: NumberUnitInterface<UnitFamily.Distance>,
    radarAltitude: NumberUnitInterface<UnitFamily.Distance>
  ): NumberUnitInterface<UnitFamily.Distance> {
    return TcasIISensitivityParameters.RA_LEVELS[this.selectLevel(altitude, radarAltitude)].alim;
  }

  /**
   * Gets Proximity Advisory sensitivity parameters for a given sensitivity level.
   * @param level A sensitivity level.
   * @returns Proximity Advisory sensitivity parameters for the given sensitivity level.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getPA(level: number): TcasAdvisoryParameters {
    return TcasIISensitivityParameters.PA;
  }

  /**
   * Gets Traffic Advisory sensitivity parameters for a given sensitivity level.
   * @param level A sensitivity level.
   * @returns Traffic Advisory sensitivity parameters for the given sensitivity level.
   */
  public getTA(level: number): TcasTcaParameters {
    return TcasIISensitivityParameters.TA_LEVELS[MathUtils.clamp(level, 0, TcasIISensitivityParameters.TA_LEVELS.length - 1)];
  }

  /**
   * Gets Resolution Advisory sensitivity parameters for a given sensitivity level.
   * @param level A sensitivity level.
   * @returns Resolution Advisory sensitivity parameters for the given sensitivity level.
   */
  public getRA(level: number): TcasTcaParameters {
    return TcasIISensitivityParameters.RA_LEVELS[MathUtils.clamp(level, 0, TcasIISensitivityParameters.RA_LEVELS.length - 1)];
  }

  /**
   * Gets a Resolution Advisory ALIM for a given sensitivity level.
   * @param level A sensitivity level.
   * @returns A Resolution Advisory ALIM for the given sensitivity level.
   */
  public getRAAlim(level: number): NumberUnitInterface<UnitFamily.Distance> {
    return TcasIISensitivityParameters.RA_LEVELS[MathUtils.clamp(level, 0, TcasIISensitivityParameters.RA_LEVELS.length - 1)].alim;
  }
}

/**
 * An implementation of {@link TCASSensitivity} which provides sensitivity parameters as defined in the official
 * TCAS II specification.
 */
export class TcasIISensitivity implements TcasSensitivity {
  private readonly sensitivity = new TcasIISensitivityParameters();

  private level = 0;
  private readonly params = {
    parametersPA: this.sensitivity.getPA(0),

    parametersTA: this.sensitivity.getTA(0),

    parametersRA: this.sensitivity.getRA(0)
  };

  /** @inheritdoc */
  public selectParameters(): TcasSensitivityParameters {
    return this.params;
  }

  /** @inheritdoc */
  public selectRAAlim(): NumberUnitInterface<UnitFamily.Distance> {
    return this.sensitivity.getRAAlim(this.level);
  }

  /**
   * Updates sensitivity level based on the current environment.
   * @param altitude The indicated altitude of the own airplane.
   * @param radarAltitude The radar altitude of the own airplane.
   */
  public updateLevel(altitude: NumberUnitInterface<UnitFamily.Distance>, radarAltitude: NumberUnitInterface<UnitFamily.Distance>): void {
    this.level = this.sensitivity.selectLevel(altitude, radarAltitude);

    this.params.parametersPA = this.sensitivity.getPA(this.level);
    this.params.parametersTA = this.sensitivity.getTA(this.level);
    this.params.parametersRA = this.sensitivity.getRA(this.level);
  }
}