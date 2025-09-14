// Copyright (c) 2021-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { EventBus, MappedSubject, Subscription } from '@microsoft/msfs-sdk';
import { DmcLogicEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { FcdcSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/FcdcPublisher';

export class FcdcValueProvider {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.bus.getSubscriber<FcdcSimvars & DmcLogicEvents>();

  private readonly fcdc1DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_1'));
  private readonly fcdc2DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_2'));
  private readonly fcdcToUse = MappedSubject.create(
    ([fcdc1Dw1, fcdc2Dw1]) => {
      if (this.displayIndex === 1) {
        if (fcdc1Dw1.isFailureWarning() && !fcdc2Dw1.isFailureWarning()) {
          return 2;
        }
        return 1;
      }
      if (!(!fcdc1Dw1.isFailureWarning() && fcdc2Dw1.isFailureWarning())) {
        return 2;
      }
      return 1;
    },
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  public readonly fcdcDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_discrete_word_1_${this.displayIndex}`),
  );
  public readonly fcdcDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_discrete_word_2_${this.displayIndex}`),
  );
  public readonly fcdcDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_discrete_word_3_${this.displayIndex}`),
  );
  public readonly fcdcDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_discrete_word_4_${this.displayIndex}`),
  );
  public readonly fcdcDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_discrete_word_5_${this.displayIndex}`),
  );

  public readonly fcdcFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_fg_discrete_word_4_${this.displayIndex}`),
  );
  public readonly fcdcFgDiscreteWord8 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on(`fcdc_fg_discrete_word_8_${this.displayIndex}`),
  );

  public readonly land2Capacity = this.fcdcFgDiscreteWord4.map((word) => word.bitValueOr(23, false));
  public readonly land3FailPassiveCapacity = this.fcdcFgDiscreteWord4.map((word) => word.bitValueOr(24, false));
  public readonly land3FailOperationalCapacity = this.fcdcFgDiscreteWord4.map((word) => word.bitValueOr(25, false));

  public readonly autolandCapacity = MappedSubject.create(
    ([land2, land3S, land3D]) => land2 || land3S || land3D,
    this.land2Capacity,
    this.land3FailPassiveCapacity,
    this.land3FailOperationalCapacity,
  );

  constructor(
    private readonly bus: EventBus,
    private readonly displayIndex: number,
  ) {
    this.subscriptions.push(
      this.fcdc1DiscreteWord1,
      this.fcdc2DiscreteWord1,
      this.fcdcToUse,
      this.fcdcDiscreteWord1,
      this.fcdcDiscreteWord2,
      this.fcdcDiscreteWord3,
      this.fcdcDiscreteWord4,
      this.fcdcDiscreteWord5,
      this.fcdcFgDiscreteWord4,
      this.fcdcFgDiscreteWord8,
      this.land2Capacity,
      this.land3FailPassiveCapacity,
      this.land3FailOperationalCapacity,
      this.autolandCapacity,
    );

    this.subscriptions.push(
      this.fcdcToUse.sub((n) => {
        this.fcdcDiscreteWord1.setConsumer(this.sub.on(`fcdc_discrete_word_1_${n}`));
        this.fcdcDiscreteWord2.setConsumer(this.sub.on(`fcdc_discrete_word_2_${n}`));
        this.fcdcDiscreteWord3.setConsumer(this.sub.on(`fcdc_discrete_word_3_${n}`));
        this.fcdcDiscreteWord4.setConsumer(this.sub.on(`fcdc_discrete_word_4_${n}`));
        this.fcdcDiscreteWord5.setConsumer(this.sub.on(`fcdc_discrete_word_5_${n}`));
        this.fcdcFgDiscreteWord4.setConsumer(this.sub.on(`fcdc_fg_discrete_word_4_${n}`));
        this.fcdcFgDiscreteWord8.setConsumer(this.sub.on(`fcdc_fg_discrete_word_8_${n}`));
      }, true),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }
  }
}
