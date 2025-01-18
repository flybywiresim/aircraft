import { DisplayComponent, FSComponent, SubscribableUtils, Subscription, VNode } from '@microsoft/msfs-sdk';
import { PageSelectorDropdownMenu } from 'instruments/src/MFD/pages/common/PageSelectorDropdownMenu';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { OIT } from 'instruments/src/OIT/OIT';
import { OitUiService } from 'instruments/src/OIT/OitUiService';

interface OitHeaderHeaderProps {
  uiService: OitUiService;
  oit: OIT;
}

/*
 * Complete header for the ATCCOM system
 */
export abstract class OitHeader extends DisplayComponent<OitHeaderHeaderProps> {
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
        <PageSelectorDropdownMenu
          isActive={SubscribableUtils.toSubscribable(false, true)}
          label="MENU"
          menuItems={[
            { label: 'FLT OPS MENU', action: () => this.props.uiService.navigateTo('flt-ops') },
            { label: 'FLT FOLDER', action: () => this.props.uiService.navigateTo('flt-ops/flt-folder') },
            { label: 'TERML CHART', action: () => this.props.uiService.navigateTo('flt-ops/terml-chart') },
            { label: 'OPS LIBRARY', action: () => this.props.uiService.navigateTo('flt-ops/ops-library') },
            { label: 'T.O PERF', action: () => this.props.uiService.navigateTo('flt-ops/to-perf') },
            { label: 'LOADSHEET', action: () => this.props.uiService.navigateTo('flt-ops/loadsheet') },
            { label: 'LDG PERF', action: () => this.props.uiService.navigateTo('flt-ops/ldg-perf') },
            { label: 'IN-FLT PERF', action: () => this.props.uiService.navigateTo('flt-ops/in-flt-perf') },
            { label: 'FLT OPS STS', action: () => this.props.uiService.navigateTo('flt-ops/sts') },
            { label: 'LOAD BOX', action: () => this.props.uiService.navigateTo('flt-ops/load-box') },
            { label: 'EXPORT BOX', action: () => this.props.uiService.navigateTo('flt-ops/export-box') },
            { label: 'EXIT SESSION', action: () => this.props.uiService.navigateTo('flt-ops/exit-session') },
          ]}
          idPrefix={`${this.props.uiService.captOrFo}_OIT_menu_menu`}
          labelStyle="font-family: OIT; font-size: 28px; margin: 7px 0px 7px 0px;"
          containerStyle="height: 60px;"
        />
        <div class="oit-heading">{this.props.uiService.activeUri.map((uri) => heading[uri.uri] ?? 'FIXME')}</div>
        <div style="flex-grow: 1" />
        <PageSelectorDropdownMenu
          isActive={SubscribableUtils.toSubscribable(false, true)}
          label="FUNCTIONS"
          menuItems={[
            { label: 'BLANK', action: () => this.props.uiService.navigateTo('flt-ops') },
            { label: 'BLANK', action: () => this.props.uiService.navigateTo('flt-ops') },
          ]}
          idPrefix={`${this.props.uiService.captOrFo}_OIT_menu_functions`}
          labelStyle="font-family: OIT; font-size: 28px; margin: 7px 0px 7px 0px;"
          containerStyle="height: 60px"
        />
        <div class="oit-msg-header">0 MSG</div>
        <div class="oit-msg-box"></div>
        <IconButton icon={'single-down'} containerStyle="width: 60px; height: 60px;" />
        <Button label={'CLEAR'} onClick={() => {}} buttonStyle="font-family: OIT; font-size: 28px; height: 60px;" />
      </div>
    );
  }
}

const heading: Record<string, string> = {
  'flt-ops': 'FLT OPS MENU',
  'flt-ops/sts': 'STATUS PAGE',
  'flt-ops/load-box': 'LOAD BOX',
  'flt-ops/export-box': 'EXPORT BOX',
};
