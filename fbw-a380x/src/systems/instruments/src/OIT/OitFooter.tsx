import { DisplayComponent, FSComponent, Subscription, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { OIT } from './OIT';
import { OitUiService } from './OitUiService';

interface OiFooterHeaderProps {
  uiService: OitUiService;
  oit: OIT;
}

/*
 * Complete header for the ATCCOM system
 */
export abstract class OitFooter extends DisplayComponent<OiFooterHeaderProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const s of this.subs) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="oit-header-row">
        <IconButton icon={'single-left'} containerStyle="width: 60px; height: 50px;" />
        <Button
          label={'FLT OPS STS'}
          onClick={() => this.props.oit.uiService.navigateTo('flt-ops/sts')}
          buttonStyle="width: 225px; font-size: 28px; height: 50px;"
        />
        <Button
          label={'CHARTS'}
          onClick={() => this.props.oit.uiService.navigateTo('flt-ops/charts')}
          buttonStyle="width: 225px; font-size: 28px; height: 50px;"
        />
        <Button
          label={'FLT FOLDER'}
          onClick={() => this.props.oit.uiService.navigateTo('flt-ops/flt-folder')}
          buttonStyle="width: 225px; font-size: 28px; height: 50px;"
        />
        <div style="flex-grow: 1" />
        <IconButton icon={'single-right'} containerStyle="width: 60px; height: 50px;" />
      </div>
    );
  }
}
