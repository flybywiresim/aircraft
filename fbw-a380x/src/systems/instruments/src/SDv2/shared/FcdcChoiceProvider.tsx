import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, EventBus, Instrument, MappedSubject } from '@microsoft/msfs-sdk';
import { FcdcBusBaseEvents, FcdcBusEvents } from '@shared/publishers/FcdcPublisher';

const fcdcSubjectsByKey = {
  fcdc_discrete_word_1: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_2: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_3: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_4: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_5: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_6: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_7: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_8: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_9: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_10: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_11: ConsumerSubject.create(null, 0),
  fcdc_discrete_word_12: ConsumerSubject.create(null, 0),
  fcdc_capt_roll_command_deg: ConsumerSubject.create(null, 0),
  fcdc_fo_roll_command_deg: ConsumerSubject.create(null, 0),
  fcdc_capt_pitch_command_deg: ConsumerSubject.create(null, 0),
  fcdc_fo_pitch_command_deg: ConsumerSubject.create(null, 0),
  fcdc_rudder_pedal_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_inner_aileron_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_middle_aileron_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_outer_aileron_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_inner_aileron_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_middle_aileron_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_outer_aileron_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_inner_elevator_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_outer_elevator_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_inner_elevator_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_outer_elevator_position_deg: ConsumerSubject.create(null, 0),
  fcdc_ths_position_deg: ConsumerSubject.create(null, 0),
  fcdc_upper_rudder_position_deg: ConsumerSubject.create(null, 0),
  fcdc_lower_rudder_position_deg: ConsumerSubject.create(null, 0),
  fcdc_rudder_trim_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_spoiler_1_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_spoiler_2_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_spoiler_3_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_spoiler_4_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_spoiler_5_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_spoiler_6_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_spoiler_7_position_deg: ConsumerSubject.create(null, 0),
  fcdc_left_spoiler_8_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_spoiler_1_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_spoiler_2_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_spoiler_3_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_spoiler_4_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_spoiler_5_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_spoiler_6_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_spoiler_7_position_deg: ConsumerSubject.create(null, 0),
  fcdc_right_spoiler_8_position_deg: ConsumerSubject.create(null, 0),
  fcdc_fg_discrete_word_1: ConsumerSubject.create(null, 0),
  fcdc_fg_discrete_word_2: ConsumerSubject.create(null, 0),
  fcdc_fg_discrete_word_3: ConsumerSubject.create(null, 0),
  fcdc_landing_fct_discrete_word: ConsumerSubject.create(null, 0),
} satisfies Record<keyof FcdcBusBaseEvents, ConsumerSubject<number>>;

export class FcdcChoiceProvider implements Instrument {
  private readonly sub = this.bus.getSubscriber<FcdcBusEvents>();

  private readonly fcdc1StatusWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_1'));

  private readonly fcdc2StatusWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_2'));

  private readonly useFcdc2 = MappedSubject.create(
    ([fcdc1StatusWord1, fcdc2StatusWord1]) => {
      const fcdc1Fault = fcdc1StatusWord1.isFailureWarning();
      const fcdc2Fault = fcdc2StatusWord1.isFailureWarning();

      return fcdc1Fault && !fcdc2Fault;
    },
    this.fcdc1StatusWord1,
    this.fcdc2StatusWord1,
  );

  private readonly fcdcSubjects = new Map(
    Object.entries(fcdcSubjectsByKey) as [keyof FcdcBusBaseEvents, ConsumerSubject<number>][],
  );

  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<FcdcBusBaseEvents>();

    this.useFcdc2.sub((useFcdc2) => {
      for (const [key, value] of this.fcdcSubjects) {
        const selectedFcdc = useFcdc2 ? 2 : 1;

        value.setConsumer(this.sub.on(`${key}_${selectedFcdc}`).atFrequency(10));
      }
    }, true);

    for (const [key, value] of this.fcdcSubjects) {
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
