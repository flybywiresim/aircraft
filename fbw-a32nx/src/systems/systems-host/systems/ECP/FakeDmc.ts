// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Arinc429LocalVarConsumerSubject, Arinc429OutputWord, Arinc429SignStatusMatrix } from '@flybywiresim/fbw-sdk';
import { EventBus, Instrument, SimVarValueType } from '@microsoft/msfs-sdk';
import { A32NXEcpBusEvents } from '@shared/publishers/A32NXEcpBusPublisher';

export interface FakeDmcEvents {
  fake_dmc_light_status_275: number;
}

export enum DmcEcpLightStatus {
  MonoDisplay = 0b00,
  EngineWarning = 0b01,
  ManualStatusSystemsAdvisory = 0b10,
  AutomaticStatusSystems = 0b11,
}

/** Values for `L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX`. */
enum SdPages {
  None = -1,
  Eng = 0,
  Bleed = 1,
  Press = 2,
  Elec = 3,
  Hyd = 4,
  Fuel = 5,
  Apu = 6,
  Cond = 7,
  Door = 8,
  Wheel = 9,
  Fctl = 10,
  Crz = 11,
  Status = 12,
}

/**
 * A fake DMC to supply the ARINC words required by the ECP.
 * To be replaced by a proper DMC simulation later.
 */
export class FakeDmc implements Instrument {
  private readonly sub = this.bus.getSubscriber<A32NXEcpBusEvents>();
  private readonly publisher = this.bus.getPublisher<FakeDmcEvents>();

  private readonly outputWord = new Arinc429OutputWord();

  private sdPage = SdPages.None;
  private readonly ecpSystemButtons = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_ecp_system_switch_word'),
  );

  constructor(private readonly bus: EventBus) {}

  public init(): void {
    this.buttonMapperFactory(SdPages.Eng, 11);
    this.buttonMapperFactory(SdPages.Bleed, 12);
    this.buttonMapperFactory(SdPages.Apu, 13);
    this.buttonMapperFactory(SdPages.Hyd, 14);
    this.buttonMapperFactory(SdPages.Elec, 15);
    this.buttonMapperFactory(SdPages.Cond, 17);
    this.buttonMapperFactory(SdPages.Press, 18);
    this.buttonMapperFactory(SdPages.Fuel, 19);
    this.buttonMapperFactory(SdPages.Fctl, 20);
    this.buttonMapperFactory(SdPages.Door, 21);
    this.buttonMapperFactory(SdPages.Wheel, 22);
  }

  private buttonMapperFactory(sdPage: SdPages, bit: number) {
    return this.ecpSystemButtons
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

    this.outputWord.setBitValue(12, this.sdPage === SdPages.Eng);
    this.outputWord.setBitValue(13, this.sdPage === SdPages.Bleed);
    this.outputWord.setBitValue(14, this.sdPage === SdPages.Press);
    this.outputWord.setBitValue(15, this.sdPage === SdPages.Hyd);
    this.outputWord.setBitValue(16, this.sdPage === SdPages.Elec);
    this.outputWord.setBitValue(17, this.sdPage === SdPages.Fuel);
    this.outputWord.setBitValue(18, this.sdPage === SdPages.Apu);
    this.outputWord.setBitValue(19, this.sdPage === SdPages.Cond);
    this.outputWord.setBitValue(20, this.sdPage === SdPages.Door);
    this.outputWord.setBitValue(21, this.sdPage === SdPages.Fctl);
    this.outputWord.setBitValue(22, this.sdPage === SdPages.Wheel);
    this.outputWord.setBitValue(26, this.sdPage === SdPages.Status);
    this.outputWord.setBitValue(27, ecamSFail >= 0); // CLR
    this.outputWord.setBitValue(28, this.sdPage === SdPages.None); // DmcEcpLightStatus.AutomaticStatusSystems
    this.outputWord.setBitValue(29, true); // DmcEcpLightStatus.ManualStatusSystemsAdvisory || DmcEcpLightStatus.AutomaticStatusSystems

    this.outputWord.setSsm(Arinc429SignStatusMatrix.NormalOperation);

    this.outputWord.performActionIfDirty(this.publishToBus);
  }
}
