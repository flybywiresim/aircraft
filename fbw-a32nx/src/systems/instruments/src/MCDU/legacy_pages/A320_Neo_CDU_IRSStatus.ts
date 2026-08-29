// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { Arinc429Register, coordinateToString, RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { SimVarValueType } from '@microsoft/msfs-sdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { FmsFormatters } from '../legacy/FmsFormatters';

export class CDUIRSStatus {
  private static frozen = false;

  private static readonly ir1LatitudeVar = RegisteredSimVar.create('L:A32NX_ADIRS_IR_1_LATITUDE', SimVarValueType.Enum);
  private static readonly ir1LongitudeVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_1_LONGITUDE',
    SimVarValueType.Enum,
  );
  private static readonly ir2LatitudeVar = RegisteredSimVar.create('L:A32NX_ADIRS_IR_2_LATITUDE', SimVarValueType.Enum);

  private static readonly ir2LongitudeVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_2_LONGITUDE',
    SimVarValueType.Enum,
  );

  private static readonly ir3LatitudeVar = RegisteredSimVar.create('L:A32NX_ADIRS_IR_3_LATITUDE', SimVarValueType.Enum);

  private static readonly ir3LongitudeVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_3_LONGITUDE',
    SimVarValueType.Enum,
  );

  private static readonly ir1TrueTrackVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_1_TRUE_TRACK',
    SimVarValueType.Enum,
  );

  private static readonly ir2TrueTrackVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_2_TRUE_TRACK',
    SimVarValueType.Enum,
  );

  private static readonly ir3TrueTrackVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_3_TRUE_TRACK',
    SimVarValueType.Enum,
  );

  private static ir1TrueHeadingVar = RegisteredSimVar.create('L:A32NX_ADIRS_IR_1_TRUE_HEADING', SimVarValueType.Enum);

  private static ir2TrueHeadingVar = RegisteredSimVar.create('L:A32NX_ADIRS_IR_2_TRUE_HEADING', SimVarValueType.Enum);

  private static ir3TrueHeadingVar = RegisteredSimVar.create('L:A32NX_ADIRS_IR_3_TRUE_HEADING', SimVarValueType.Enum);

  private static readonly ir1WindDirectionVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_1_WIND_DIRECTION',
    SimVarValueType.Enum,
  );

  private static readonly ir2WindDirectionVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_2_WIND_DIRECTION',
    SimVarValueType.Enum,
  );

  private static readonly ir3WindDirectionVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_3_WIND_DIRECTION',
    SimVarValueType.Enum,
  );

  private static readonly ir1WindSpeedVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_1_WIND_SPEED',
    SimVarValueType.Enum,
  );

  private static readonly ir2WindSpeedVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_2_WIND_SPEED',
    SimVarValueType.Enum,
  );

  private static readonly ir3WindSpeedVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_3_WIND_SPEED',
    SimVarValueType.Enum,
  );

  private static readonly ir1GroundSpeedVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_1_GROUND_SPEED',
    SimVarValueType.Enum,
  );

  private static readonly ir2GroundSpeedVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_2_GROUND_SPEED',
    SimVarValueType.Enum,
  );

  private static readonly ir3GroundSpeedVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_3_GROUND_SPEED',
    SimVarValueType.Enum,
  );

  private static readonly ir1MagneticHeadingVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_1_HEADING',
    SimVarValueType.Enum,
  );

  private static readonly ir2MagneticHeadingVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_2_HEADING',
    SimVarValueType.Enum,
  );

  private static readonly ir3MagneticHeadingVar = RegisteredSimVar.create(
    'L:A32NX_ADIRS_IR_3_HEADING',
    SimVarValueType.Enum,
  );

  private static readonly irLatitude = Arinc429Register.empty();
  private static readonly irLongitude = Arinc429Register.empty();
  private static readonly irCoordinates: Coordinates = { lat: 0, long: 0 };
  private static readonly irTrueTrack = Arinc429Register.empty();
  private static readonly irTrueHeading = Arinc429Register.empty();
  private static readonly irMagneticHeading = Arinc429Register.empty();
  private static readonly irGroundSpeed = Arinc429Register.empty();
  private static readonly irWindDirection = Arinc429Register.empty();
  private static readonly irWindSpeed = Arinc429Register.empty();
  private static readonly gpirsCoordinates: Coordinates = { lat: 0, long: 0 };

  static ShowPage(mcdu: LegacyFmsPageInterface, index: 1 | 2 | 3, frozenTime?: string): void {
    if (!this.frozen) {
      mcdu.clearDisplay();
      this.populateIrData(index);
      // TODO hookup GPIRS to calculated position from FM when implemented
      this.gpirsCoordinates.lat = SimVar.GetSimVarValue('GPS POSITION LAT', 'degree latitude');
      this.gpirsCoordinates.long = SimVar.GetSimVarValue('GPS POSITION LON', 'degree longitude');
      this.frozen = frozenTime !== undefined;
      mcdu.setTemplate([
        [`IRS${index} ${this.frozen ? `FROZEN {small}AT{end} ${frozenTime}` : ''}`],
        ['POSITION'],
        [
          this.irLatitude.isInvalid() || this.irLongitude.isInvalid()
            ? '--°--.--/---°--.--[color]white'
            : `${coordinateToString(this.irCoordinates, false)}[color]green`,
        ],
        ['TTRK', 'GS'],
        [
          this.irTrueTrack.isInvalid()
            ? '---.-[color]white'
            : `${Math.round(this.irTrueTrack.value).toFixed(1)}[color]green`,
          this.irGroundSpeed.isInvalid()
            ? '---[color]white'
            : `${Math.round(this.irGroundSpeed.value).toFixed(0)}[color]green`,
        ],
        [`THDG`, 'MHDG'],
        [
          this.irTrueHeading.isInvalid()
            ? '---.-[color]white'
            : `${Math.round(this.irTrueHeading.value).toFixed(1)}[color]green`,
          this.irMagneticHeading.isInvalid()
            ? '---.-[color]white'
            : `${Math.round(this.irMagneticHeading.value).toFixed(1)}[color]green`,
        ],
        ['WIND', 'GPIRS ACCUR'],
        [
          this.irWindDirection.isInvalid() || this.irWindSpeed.isInvalid()
            ? '---°/--[color]white'
            : `${Math.round(this.irWindDirection.value)}°/${Math.round(this.irWindSpeed.value)}[color]green`,
          '200FT[color]green',
        ],
        ['GPIRS POSITION'],
        [`${coordinateToString(this.gpirsCoordinates, false)}[color]green`],
        ['', ''],
        [this.frozen ? '{UNFREEZE[color]cyan' : '{FREEZE[color]cyan', 'NEXT IRS>'],
      ]);
    }
    mcdu.page.Current = mcdu.page.IRSStatus;

    mcdu.onLeftInput[5] = () => {
      if (this.frozen) {
        this.frozen = false;
        CDUIRSStatus.ShowPage(mcdu, index);
      } else {
        CDUIRSStatus.ShowPage(
          mcdu,
          index,
          FmsFormatters.secondsTohhmm(Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'))),
        );
      }
    };

    mcdu.rightInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };

    mcdu.onRightInput[5] = () => {
      if (index === 3) {
        this.ShowPage(mcdu, 1);
      } else {
        this.ShowPage(mcdu, (index + 1) as 1 | 2 | 3);
      }
    };

    mcdu.onUnload = () => {
      this.frozen = false;
    };

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.IRSStatus) {
        if (!this.frozen) {
          this.ShowPage(mcdu, index);
        }
      }
    }, mcdu.PageTimeout.Default);
  }

  static populateIrData(index: 1 | 2 | 3) {
    switch (index) {
      case 1:
        this.irLatitude.set(this.ir1LatitudeVar.get());
        this.irLongitude.set(this.ir1LongitudeVar.get());
        this.irCoordinates.lat = this.irLatitude.valueOr(0);
        this.irCoordinates.long = this.irLongitude.valueOr(0);
        this.irTrueTrack.set(this.ir1TrueTrackVar.get());
        this.irTrueHeading.set(this.ir1TrueHeadingVar.get());
        this.irMagneticHeading.set(this.ir1MagneticHeadingVar.get());
        this.irGroundSpeed.set(this.ir1GroundSpeedVar.get());
        this.irWindDirection.set(this.ir1WindDirectionVar.get());
        this.irWindSpeed.set(this.ir1WindSpeedVar.get());
        break;
      case 2:
        this.irLatitude.set(this.ir2LatitudeVar.get());
        this.irLongitude.set(this.ir2LongitudeVar.get());
        this.irCoordinates.lat = this.irLatitude.valueOr(0);
        this.irCoordinates.long = this.irLongitude.valueOr(0);
        this.irTrueTrack.set(this.ir2TrueTrackVar.get());
        this.irTrueHeading.set(this.ir2TrueHeadingVar.get());
        this.irMagneticHeading.set(this.ir2MagneticHeadingVar.get());
        this.irGroundSpeed.set(this.ir2GroundSpeedVar.get());
        this.irWindDirection.set(this.ir2WindDirectionVar.get());
        this.irWindSpeed.set(this.ir2WindSpeedVar.get());
        break;
      case 3:
        this.irLatitude.set(this.ir3LatitudeVar.get());
        this.irLongitude.set(this.ir3LongitudeVar.get());
        this.irCoordinates.lat = this.irLatitude.valueOr(0);
        this.irCoordinates.long = this.irLongitude.valueOr(0);
        this.irTrueTrack.set(this.ir3TrueTrackVar.get());
        this.irTrueHeading.set(this.ir3TrueHeadingVar.get());
        this.irMagneticHeading.set(this.ir3MagneticHeadingVar.get());
        this.irGroundSpeed.set(this.ir3GroundSpeedVar.get());
        this.irWindDirection.set(this.ir3WindDirectionVar.get());
        this.irWindSpeed.set(this.ir3WindSpeedVar.get());
        break;
    }
  }
}
