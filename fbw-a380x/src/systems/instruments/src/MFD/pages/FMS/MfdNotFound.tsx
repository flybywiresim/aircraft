import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

interface MfdNotFoundProps extends AbstractMfdPageProps {}

export class MfdNotFound extends DisplayComponent<MfdNotFoundProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    new Promise((resolve) => setTimeout(resolve, 500)).then(() => this.props.mfd.uiService.navigateTo('back'));
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('ERROR 404 NOT FOUND')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container" />
        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
