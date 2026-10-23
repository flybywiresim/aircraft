import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, EventBus, Instrument, MappedSubject } from '@microsoft/msfs-sdk';
import { PrimFeBusBaseEvents, PrimFeBusEvents } from '@shared/publishers/PrimFePublisher';
import { PrimFctlBusEvents } from '@shared/publishers/PrimFctlPublisher';

const primFeSubjectsByKey = {
  prim_gamma_a: ConsumerSubject.create(null, 0),
  prim_gamma_t: ConsumerSubject.create(null, 0),
  prim_v_alpha_lim: ConsumerSubject.create(null, 0),
  prim_v_alpha_prot: ConsumerSubject.create(null, 0),
  prim_v_alpha_stall_warn: ConsumerSubject.create(null, 0),
  prim_v_ls: ConsumerSubject.create(null, 0),
  prim_v_stall: ConsumerSubject.create(null, 0),
  prim_speed_trend: ConsumerSubject.create(null, 0),
  prim_v_3: ConsumerSubject.create(null, 0),
  prim_v_4: ConsumerSubject.create(null, 0),
  prim_v_man: ConsumerSubject.create(null, 0),
  prim_v_max: ConsumerSubject.create(null, 0),
  prim_v_fe_next: ConsumerSubject.create(null, 0),
} satisfies Record<keyof PrimFeBusBaseEvents, ConsumerSubject<number>>;

export class PrimChoiceProvider implements Instrument {
  private readonly sub = this.bus.getSubscriber<PrimFeBusEvents & PrimFctlBusEvents>();

  private readonly prim1FctlLawStatusWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('prim_fctl_law_status_word_1'),
  );

  private readonly prim2FctlLawStatusWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('prim_fctl_law_status_word_2'),
  );

  private readonly prim3FctlLawStatusWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('prim_fctl_law_status_word_3'),
  );

  private readonly selectedMasterPrim = MappedSubject.create(
    ([prim1FctlLawWord, prim2FctlLawWord, prim3FctlLawWord]) => {
      if (prim1FctlLawWord.bitValueOr(21, false)) {
        return 1;
      } else if (prim2FctlLawWord.bitValueOr(21, false)) {
        return 2;
      } else if (prim3FctlLawWord.bitValueOr(21, false)) {
        return 3;
      } else {
        // No PRIM is selected as master PRIM (all PRIMs invalid). Default to PRIM 1
        return 1;
      }
    },
    this.prim1FctlLawStatusWord,
    this.prim2FctlLawStatusWord,
    this.prim3FctlLawStatusWord,
  );

  private readonly primFeSubjects = new Map(
    Object.entries(primFeSubjectsByKey) as [keyof PrimFeBusBaseEvents, ConsumerSubject<number>][],
  );

  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<PrimFeBusBaseEvents>();

    this.selectedMasterPrim.sub((masterPrim) => {
      for (const [key, value] of this.primFeSubjects) {
        // The FE data over AFDX seems to update only at around 10Hz (see for example Vmax when moving)
        value.setConsumer(this.sub.on(`${key}_${masterPrim}`).atFrequency(10));
      }
    }, true);

    for (const [key, value] of this.primFeSubjects) {
      value.sub((word) => {
        publisher.pub(key, word);
      }, true);
    }
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
