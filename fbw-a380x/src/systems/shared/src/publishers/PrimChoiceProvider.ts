// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, EventBus, MappedSubject } from '@microsoft/msfs-sdk';
import { PrimFeBusBaseEvents, PrimFeBusEvents } from '@shared/publishers/PrimFePublisher';
import { PrimFctlBusEvents } from '@shared/publishers/PrimFctlPublisher';
import { PrimFgBusEvents, PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';

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

const primFgSubjectsByKey = {
  prim_pfd_speed_target: ConsumerSubject.create(null, 0),
  prim_pfd_short_term_managed_speed: ConsumerSubject.create(null, 0),
  prim_presel_mach: ConsumerSubject.create(null, 0),
  prim_presel_speed: ConsumerSubject.create(null, 0),
  prim_selected_speed: ConsumerSubject.create(null, 0),
  prim_selected_mach: ConsumerSubject.create(null, 0),
  prim_selected_heading: ConsumerSubject.create(null, 0),
  prim_selected_track: ConsumerSubject.create(null, 0),
  prim_selected_altitude: ConsumerSubject.create(null, 0),
  prim_selected_vertical_speed: ConsumerSubject.create(null, 0),
  prim_selected_flight_path_angle: ConsumerSubject.create(null, 0),
  prim_runway_hdg_memo: ConsumerSubject.create(null, 0),
  prim_roll_fd_command_1: ConsumerSubject.create(null, 0),
  prim_pitch_fd_command_1: ConsumerSubject.create(null, 0),
  prim_yaw_fd_command_1: ConsumerSubject.create(null, 0),
  prim_roll_fd_command_2: ConsumerSubject.create(null, 0),
  prim_pitch_fd_command_2: ConsumerSubject.create(null, 0),
  prim_yaw_fd_command_2: ConsumerSubject.create(null, 0),
  prim_fm_alt_constraint: ConsumerSubject.create(null, 0),
  prim_speed_margin_high: ConsumerSubject.create(null, 0),
  prim_speed_margin_low: ConsumerSubject.create(null, 0),
  prim_fg_discrete_word_1: ConsumerSubject.create(null, 0),
  prim_fg_discrete_word_2: ConsumerSubject.create(null, 0),
  prim_fg_discrete_word_3: ConsumerSubject.create(null, 0),
  prim_fg_discrete_word_4: ConsumerSubject.create(null, 0),
  prim_fg_discrete_word_5: ConsumerSubject.create(null, 0),
  prim_fg_discrete_word_6: ConsumerSubject.create(null, 0),
  prim_fg_ats_discrete_word: ConsumerSubject.create(null, 0),
  prim_fg_ats_fma_discrete_word: ConsumerSubject.create(null, 0),
} satisfies Record<keyof PrimFgBusBaseEvents, ConsumerSubject<number>>;

export class PrimChoiceProvider {
  private readonly sub = this.bus.getSubscriber<PrimFeBusEvents & PrimFctlBusEvents & PrimFgBusEvents>();

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

  private readonly primFgSubjects = new Map(
    Object.entries(primFgSubjectsByKey) as [keyof PrimFgBusBaseEvents, ConsumerSubject<number>][],
  );

  constructor(private readonly bus: EventBus) {}

  public init(): void {
    const publisher = this.bus.getPublisher<PrimFeBusBaseEvents & PrimFgBusBaseEvents>();

    this.selectedMasterPrim.sub((masterPrim) => {
      for (const [key, value] of this.primFeSubjects) {
        // The FE data over AFDX seems to update only at around 10Hz (see for example Vmax when moving)
        value.setConsumer(this.sub.on(`${key}_${masterPrim}`).atFrequency(10));
      }

      for (const [key, value] of this.primFgSubjects) {
        // TODO check frequency
        value.setConsumer(this.sub.on(`${key}_${masterPrim}`).atFrequency(10));
      }
    }, true);

    for (const [key, value] of this.primFeSubjects) {
      value.sub((word) => {
        publisher.pub(key, word);
      }, true);
    }

    for (const [key, value] of this.primFgSubjects) {
      value.sub((word) => {
        publisher.pub(key, word);
      }, true);
    }
  }
}
