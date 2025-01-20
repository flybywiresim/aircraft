import { DisplayComponent, FSComponent, SubscribableUtils, Subscription, VNode } from '@microsoft/msfs-sdk';
import { PageSelectorDropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/PageSelectorDropdownMenu';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
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
            { label: 'FLT OPS MENU', action: () => this.props.uiService.navigateTo('flt-ops'), separatorBelow: true },
            {
              label: 'FLT FOLDER',
              action: () => this.props.uiService.navigateTo('flt-ops/flt-folder'),
            },
            {
              label: 'TERML CHART',
              action: () => this.props.uiService.navigateTo('flt-ops/terml-chart'),
              separatorBelow: true,
            },
            {
              label: 'OPS LIBRARY',
              action: () => this.props.uiService.navigateTo('flt-ops/ops-library'),
              disabled: true,
              separatorBelow: true,
            },
            { label: 'T.O PERF', action: () => this.props.uiService.navigateTo('flt-ops/to-perf') },
            { label: 'LOADSHEET', action: () => this.props.uiService.navigateTo('flt-ops/loadsheet'), disabled: true },
            { label: 'LDG PERF', action: () => this.props.uiService.navigateTo('flt-ops/ldg-perf') },
            {
              label: 'IN-FLT PERF',
              action: () => this.props.uiService.navigateTo('flt-ops/in-flt-perf'),
              disabled: true,
              separatorBelow: true,
            },
            { label: 'FLT OPS STS', action: () => this.props.uiService.navigateTo('flt-ops/sts') },
            { label: 'LOAD BOX', action: () => this.props.uiService.navigateTo('flt-ops/load-box'), disabled: true },
            {
              label: 'EXPORT BOX',
              action: () => this.props.uiService.navigateTo('flt-ops/export-box'),
              disabled: true,
              separatorBelow: true,
            },
            {
              label: 'EXIT SESSION',
              action: () => this.props.uiService.navigateTo('flt-ops/exit-session'),
              disabled: true,
            },
          ]}
          idPrefix={`${this.props.uiService.captOrFo}_OIT_menu_menu`}
          dropdownMenuStyle="width: 300px;"
        />
        <div class="oit-heading">{this.props.uiService.activeUri.map((uri) => heading[uri.uri] ?? 'FIXME')}</div>
        <div style="flex-grow: 1" />
        <PageSelectorDropdownMenu
          isActive={SubscribableUtils.toSubscribable(false, true)}
          label="FUNCTIONS"
          menuItems={[
            { label: 'HOME', action: () => {}, disabled: true },
            { label: 'PREVIOUS', action: () => {}, disabled: true },
            { label: 'NEXT', action: () => {}, disabled: true, separatorBelow: true },
            { label: 'PRINT', action: () => {}, disabled: true },
            { label: 'STORE', action: () => {}, disabled: true },
            { label: 'UPDATE', action: () => {}, disabled: true, separatorBelow: true },
            { label: 'UNDO', action: () => {}, disabled: true },
            { label: 'REDO', action: () => {}, disabled: true, separatorBelow: true },
            { label: 'HELP', action: () => {}, disabled: true, separatorBelow: true },
            { label: 'HIDE SWITCHING BAR', action: () => {}, disabled: true, separatorBelow: true },
            { label: 'CLOSE APPLICATION', action: () => {}, disabled: true, separatorBelow: true },
          ]}
          idPrefix={`${this.props.uiService.captOrFo}_OIT_menu_functions`}
          dropdownMenuStyle="width: 300px;"
        />
        <div class="oit-msg-header">0 MSG</div>
        <div class="oit-msg-box"></div>
        <IconButton icon={'single-down'} containerStyle="width: 60px; height: 60px;" />
        <Button label={'CLEAR'} onClick={() => {}} buttonStyle="font-size: 28px; height: 60px;" />
      </div>
    );
  }
}

const heading: Record<string, string> = {
  'flt-ops': 'FLT OPS MENU',
  'flt-ops/flt-folder': 'FLT FOLDER',
  'flt-ops/charts': 'CHARTS',
  'flt-ops/sts': 'STATUS PAGE',
  'flt-ops/to-perf': 'T.O PERF',
  'flt-ops/ldg-perf': 'LDG PERF',
  'flt-ops/load-box': 'LOAD BOX',
  'flt-ops/export-box': 'EXPORT BOX',
};
