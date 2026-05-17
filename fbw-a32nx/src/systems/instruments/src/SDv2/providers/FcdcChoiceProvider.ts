import { Arinc429LocalVarConsumerSubject, Arinc429Register } from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, EventBus, Instrument } from '@microsoft/msfs-sdk';
import { A32NXFcdcBusEvents } from '@shared/publishers/A32NXFcdcBusPublisher';

export interface FcdcChoiceEvents {
  /** FCDC Discrete Word 040 from chosen FCDC. */
  a32nx_fcdc_discrete_word_040: number;
  /** FCDC Discrete Word 041 from chosen FCDC. */
  a32nx_fcdc_discrete_word_041: number;
  /** FCDC Discrete Word 042 from chosen FCDC. */
  a32nx_fcdc_discrete_word_042: number;
  /** FCDC Discrete Word 043 from chosen FCDC. */
  a32nx_fcdc_discrete_word_043: number;
}

export class FcdcChoiceProvider implements Instrument {
  private readonly sub = this.bus.getSubscriber<A32NXFcdcBusEvents>();

  private readonly fcdc_1_discrete_word_041 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_041_1'),
  );

  private readonly fcdc_1_valid = this.fcdc_1_discrete_word_041.map((word) => !word.isFailureWarning());

  private readonly fcdc_discrete_word_040 = ConsumerSubject.create(null, 0);

  private readonly fcdc_discrete_word_041 = ConsumerSubject.create(null, 0);

  private readonly fcdc_discrete_word_042 = ConsumerSubject.create(null, 0);

  private readonly fcdc_discrete_word_043 = ConsumerSubject.create(null, 0);

  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<FcdcChoiceEvents>();

    this.fcdc_1_valid.sub((fcdc1Chosen) => {
      console.log(`switching to FCDC ${fcdc1Chosen ? 1 : 2}`);

      this.fcdc_discrete_word_040.setConsumer(
        this.sub.on(fcdc1Chosen ? 'a32nx_fcdc_discrete_word_040_1' : 'a32nx_fcdc_discrete_word_040_2'),
      );
      this.fcdc_discrete_word_041.setConsumer(
        this.sub.on(fcdc1Chosen ? 'a32nx_fcdc_discrete_word_041_1' : 'a32nx_fcdc_discrete_word_041_2'),
      );
      this.fcdc_discrete_word_042.setConsumer(
        this.sub.on(fcdc1Chosen ? 'a32nx_fcdc_discrete_word_042_1' : 'a32nx_fcdc_discrete_word_042_2'),
      );
      this.fcdc_discrete_word_043.setConsumer(
        this.sub.on(fcdc1Chosen ? 'a32nx_fcdc_discrete_word_043_1' : 'a32nx_fcdc_discrete_word_043_2'),
      );
    }, true);

    this.fcdc_discrete_word_040.sub((word) => {
      const lol = Arinc429Register.empty().set(word);
      console.log(`Setting FCDC word 040 with SSM ${lol.ssm}`);
      publisher.pub('a32nx_fcdc_discrete_word_040', word);
    }, true);

    this.fcdc_discrete_word_041.sub((word) => {
      publisher.pub('a32nx_fcdc_discrete_word_041', word);
    }, true);

    this.fcdc_discrete_word_042.sub((word) => {
      publisher.pub('a32nx_fcdc_discrete_word_042', word);
    }, true);

    this.fcdc_discrete_word_043.sub((word) => {
      publisher.pub('a32nx_fcdc_discrete_word_043', word);
    }, true);
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
