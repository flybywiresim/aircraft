import { DisplayComponent, FSComponent, Subscription, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { OIT } from 'instruments/src/OIT/OIT';
import { OitUiService } from 'instruments/src/OIT/OitUiService';

interface OiFooterHeaderProps {
  uiService: OitUiService;
  oit: OIT;
}

/*
 * Complete header for the ATCCOM system
 */
export abstract class OitFooter extends DisplayComponent<OiFooterHeaderProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <div class="oit-header-row">
        <IconButton icon={'single-left'} containerStyle="width: 60px; height: 50px;" />
        {['FLT OPS STS', 'CHARTS', 'OPS LIBRARY'].map((s) => (
          <Button
            label={s}
            onClick={() => {}}
            buttonStyle="font-family: OIT; width: 225px; font-size: 28px; height: 50px;"
          />
        ))}
        <div style="flex-grow: 1" />
        <IconButton icon={'single-right'} containerStyle="width: 60px; height: 50px;" />
      </div>
    );
  }
}
