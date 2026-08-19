import { FmgcBusEvents } from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, MappedSubject } from '@microsoft/msfs-sdk';

import { FmsModule } from './FmsModule';
import { FmgcEvents } from '../events/FmgcEvents';

export class FmgcMonitor extends FmsModule {
  private readonly sub = this.bus.getSubscriber<FmgcBusEvents>();
  private readonly publisher = this.bus.getPublisher<FmgcEvents>();

  private readonly fmgc1Healthy = ConsumerSubject.create(this.sub.on('fmgc_healthy_1'), false);
  private readonly fmgc2Healthy = ConsumerSubject.create(this.sub.on('fmgc_healthy_2'), false);

  private readonly fmgc1AthrEngaged = ConsumerSubject.create(this.sub.on('fmgc_athr_engaged_1'), false);
  private readonly fmgc2AthrEngaged = ConsumerSubject.create(this.sub.on('fmgc_athr_engaged_2'), false);

  private readonly fmgc1ApEngaged = ConsumerSubject.create(this.sub.on('fmgc_ap_engaged_1'), false);
  private readonly fmgc2ApEngaged = ConsumerSubject.create(this.sub.on('fmgc_ap_engaged_2'), false);

  private readonly fmgc1FdEngaged = ConsumerSubject.create(this.sub.on('fmgc_fd_engaged_1'), false);
  private readonly fmgc2FdEngaged = ConsumerSubject.create(this.sub.on('fmgc_fd_engaged_2'), false);

  private readonly fmgc1Priority = MappedSubject.create(
    ([fmgc1Healthy, ap1Engaged, ap2Engaged, fd1Engaged, fd2Engaged, athr1Engaged, athr2Engaged]) =>
      ap1Engaged ||
      (!ap2Engaged && fd1Engaged) ||
      (!ap2Engaged && !fd2Engaged && athr1Engaged) ||
      (!ap2Engaged && !fd2Engaged && !athr2Engaged && fmgc1Healthy),
    this.fmgc1Healthy,
    this.fmgc1ApEngaged,
    this.fmgc2ApEngaged,
    this.fmgc1FdEngaged,
    this.fmgc2FdEngaged,
    this.fmgc1AthrEngaged,
    this.fmgc2AthrEngaged,
  );

  /** @inheritdoc */
  public init(): void {
    this.fmgc1Priority.sub((v) => this.publisher.pub('fmgc_1_priority', v, false, false));
  }

  public onUpdate(): void {}
}
