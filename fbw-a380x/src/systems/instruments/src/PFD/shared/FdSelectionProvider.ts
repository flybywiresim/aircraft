import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, EventBus, Instrument, MappedSubject, Subject } from '@microsoft/msfs-sdk';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { getDisplayIndex } from '../PFD';

export interface SelectedFdEvents {
  fd_engaged: boolean;
  // The roll FD command for the selected FD, in deg.
  prim_roll_fd_command: number;
  // The pitch FD command for selected FD, in deg.
  prim_pitch_fd_command: number;
  // The yaw FD command for selected FD, in deg.
  prim_yaw_fd_command: number;
}

export class FdSelectionProvider implements Instrument {
  private readonly sub = this.bus.getSubscriber<PrimFgBusBaseEvents>();

  private readonly primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  // We have to initialize this in init, as otherwise the content will not be ready and the getDisplayIndex method will fail
  private isSide2 = Subject.create(false);

  private readonly fd1Selected = MappedSubject.create(
    ([isSide2, primFgDiscreteWord1]) => {
      const fd1Engaged = primFgDiscreteWord1.bitValueOr(13, false);
      const fd2Engaged = primFgDiscreteWord1.bitValueOr(14, false);

      return (!isSide2 && !fd1Engaged && !fd2Engaged) || (!isSide2 && fd1Engaged) || (isSide2 && !fd2Engaged);
    },
    this.isSide2,
    this.primFgDiscreteWord1,
  );

  private readonly fdEngaged = MappedSubject.create(
    ([fd1Selected, primFgDiscreteWord1]) => {
      const fd1Engaged = primFgDiscreteWord1.bitValueOr(13, false);
      const fd2Engaged = primFgDiscreteWord1.bitValueOr(14, false);

      return fd1Selected ? fd1Engaged : fd2Engaged;
    },
    this.fd1Selected,
    this.primFgDiscreteWord1,
  );

  private readonly rollFdCommand = ConsumerSubject.create(null, 0);

  private readonly pitchFdCommand = ConsumerSubject.create(null, 0);

  private readonly yawFdCommand = ConsumerSubject.create(null, 0);

  constructor(private readonly bus: EventBus) {}

  /** @inheritdoc */
  public init(): void {
    const publisher = this.bus.getPublisher<SelectedFdEvents>();

    this.isSide2.set(getDisplayIndex() === 2);

    this.fd1Selected.sub((fd1Selected) => {
      this.rollFdCommand.setConsumer(this.sub.on(`prim_roll_fd_command_${fd1Selected ? 1 : 2}`));
      this.pitchFdCommand.setConsumer(this.sub.on(`prim_pitch_fd_command_${fd1Selected ? 1 : 2}`));
      this.yawFdCommand.setConsumer(this.sub.on(`prim_yaw_fd_command_${fd1Selected ? 1 : 2}`));
    }, true);

    this.rollFdCommand.sub((rollFdCommand) => {
      publisher.pub('prim_roll_fd_command', rollFdCommand);
    }, true);

    this.pitchFdCommand.sub((pitchFdCommand) => {
      publisher.pub('prim_pitch_fd_command', pitchFdCommand);
    }, true);

    this.yawFdCommand.sub((yawFdCommand) => {
      publisher.pub('prim_yaw_fd_command', yawFdCommand);
    }, true);

    this.fdEngaged.sub((fdEngaged) => {
      publisher.pub('fd_engaged', fdEngaged);
    }, true);
  }

  /** @inheritdoc */
  public onUpdate(): void {
    // noop
  }
}
