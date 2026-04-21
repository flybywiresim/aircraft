// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Arinc429LocalVarConsumerSubject, Arinc429OutputWord, Arinc429SignStatusMatrix } from '@flybywiresim/fbw-sdk';
import { EventBus, Instrument, SimVarValueType } from '@microsoft/msfs-sdk';
import { A32NXEcpBusEvents } from '@shared/publishers/A32NXEcpBusPublisher';
import { SdPages } from '@shared/SdPages';

export interface FakeDmcEvents {
  fake_dmc_light_status_275: number;
}

export enum DmcEcpLightStatus {
  MonoDisplay = 0b00,
  EngineWarning = 0b01,
  ManualStatusSystemsAdvisory = 0b10,
  AutomaticStatusSystems = 0b11,
}

/**
 * A fake DMC to supply the ARINC words required by the ECP.
 * To be replaced by a proper DMC simulation later.
 */
export class FakeDmc implements Instrument {
  private readonly sub = this.bus.getSubscriber<A32NXEcpBusEvents>();
  private readonly publisher = this.bus.getPublisher<FakeDmcEvents>();

  private readonly outputWord = new Arinc429OutputWord();

  private sdPage = SdPages.NONE;
  private readonly ecpSystemButtons = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_ecp_system_switch_word'),
  );
  private readonly ecpWarningButtons = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_ecp_warning_switch_word'),
  );

  constructor(private readonly bus: EventBus) {}

  public init(): void {
    // Map buttons to the legacy local var for the react SD
    this.buttonMapperFactory(SdPages.ENG, 11, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.BLEED, 12, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.APU, 13, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.HYD, 14, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.ELEC, 15, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.COND, 17, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.PRESS, 18, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.FUEL, 19, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.FCTL, 20, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.DOOR, 21, this.ecpSystemButtons);
    this.buttonMapperFactory(SdPages.WHEEL, 22, this.ecpSystemButtons);

    this.buttonMapperFactory(SdPages.STS, 13, this.ecpWarningButtons);
  }

  private buttonMapperFactory(sdPage: SdPages, bit: number, word: Arinc429LocalVarConsumerSubject) {
    return word
      .map((w) => w.bitValueOr(bit, false))
      .sub(
        (v) =>
          v &&
          SimVar.SetSimVarValue(
            'L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX',
            SimVarValueType.Enum,
            this.sdPage === sdPage ? -1 : sdPage,
          ),
      );
  }

  private readonly publishToBus = () =>
    this.publisher.pub('fake_dmc_light_status_275', this.outputWord.getRawBusValue());

  public onUpdate(): void {
    this.sdPage = SimVar.GetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', SimVarValueType.Enum);
    const ecamSFail = SimVar.GetSimVarValue('L:A32NX_ECAM_SFAIL', SimVarValueType.Enum);
    const leftFailureDisplayed = SimVar.GetSimVarValue('L:A32NX_EWD_LEFT_FAILURE_ACTIVE', SimVarValueType.Bool);

    this.outputWord.setBitValue(12, this.sdPage === SdPages.ENG);
    this.outputWord.setBitValue(13, this.sdPage === SdPages.BLEED);
    this.outputWord.setBitValue(14, this.sdPage === SdPages.PRESS);
    this.outputWord.setBitValue(15, this.sdPage === SdPages.HYD);
    this.outputWord.setBitValue(16, this.sdPage === SdPages.ELEC);
    this.outputWord.setBitValue(17, this.sdPage === SdPages.FUEL);
    this.outputWord.setBitValue(18, this.sdPage === SdPages.APU);
    this.outputWord.setBitValue(19, this.sdPage === SdPages.COND);
    this.outputWord.setBitValue(20, this.sdPage === SdPages.DOOR);
    this.outputWord.setBitValue(21, this.sdPage === SdPages.FCTL);
    this.outputWord.setBitValue(22, this.sdPage === SdPages.WHEEL);
    this.outputWord.setBitValue(26, this.sdPage === SdPages.STS);
    this.outputWord.setBitValue(27, ecamSFail >= 0 || leftFailureDisplayed); // CLR
    this.outputWord.setBitValue(28, this.sdPage === SdPages.NONE); // DmcEcpLightStatus.AutomaticStatusSystems
    this.outputWord.setBitValue(29, true); // DmcEcpLightStatus.ManualStatusSystemsAdvisory || DmcEcpLightStatus.AutomaticStatusSystems

    this.outputWord.setSsm(Arinc429SignStatusMatrix.NormalOperation);

    this.outputWord.performActionIfDirty(this.publishToBus);
  }
}
