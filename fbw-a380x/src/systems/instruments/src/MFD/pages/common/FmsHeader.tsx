import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractHeader } from 'instruments/src/MFD/pages/common/AbstractHeader';
import { PageSelectorDropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/PageSelectorDropdownMenu';

/*
 * Complete header for the FMS system
 */
export class FmsHeader extends AbstractHeader {
  private readonly activeIsSelected = Subject.create(false);

  private readonly positionIsSelected = Subject.create(false);

  private readonly secIndexIsSelected = Subject.create(false);

  private readonly dataIsSelected = Subject.create(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.uiService.activeUri.sub((val) => {
        this.activeIsSelected.set(val.category === 'active');
        this.positionIsSelected.set(val.category === 'position');
        this.secIndexIsSelected.set(
          val.category === 'sec' || val.category === 'sec1' || val.category === 'sec2' || val.category === 'sec3',
        );
        this.dataIsSelected.set(val.category === 'data');
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        <div class="mfd-header-page-select-row">
          <PageSelectorDropdownMenu
            isActive={this.activeIsSelected}
            label="ACTIVE"
            menuItems={[
              { label: 'F-PLN', action: () => this.props.uiService.navigateTo('fms/active/f-pln') },
              { label: 'PERF', action: () => this.props.uiService.navigateTo('fms/active/perf') },
              { label: 'FUEL&LOAD', action: () => this.props.uiService.navigateTo('fms/active/fuel-load') },
              { label: 'WIND', action: () => this.props.uiService.navigateTo('fms/active/wind'), disabled: true },
              { label: 'INIT', action: () => this.props.uiService.navigateTo('fms/active/init') },
            ]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorActive`}
            containerStyle="flex: 1"
          />
          <PageSelectorDropdownMenu
            isActive={this.positionIsSelected}
            label="POSITION"
            menuItems={[
              {
                label: 'MONITOR',
                action: () => this.props.uiService.navigateTo('fms/position/monitor'),
                disabled: true,
              },
              { label: 'REPORT', action: () => this.props.uiService.navigateTo('fms/position/report'), disabled: true },
              { label: 'NAVAIDS', action: () => this.props.uiService.navigateTo('fms/position/navaids') },
              { label: 'IRS', action: () => this.props.uiService.navigateTo('fms/position/irs') },
              { label: 'GPS', action: () => this.props.uiService.navigateTo('fms/position/gps'), disabled: true },
            ]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorPosition`}
            containerStyle="flex: 1"
          />
          <PageSelectorDropdownMenu
            isActive={this.secIndexIsSelected}
            label="SEC INDEX"
            menuItems={[
              { label: 'SEC 1', action: () => this.props.uiService.navigateTo('fms/sec1/init'), disabled: true },
              { label: 'SEC 2', action: () => this.props.uiService.navigateTo('fms/sec2/init'), disabled: true },
              { label: 'SEC 3', action: () => this.props.uiService.navigateTo('fms/sec3/init'), disabled: true },
            ]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorSsecIndex`}
            containerStyle="flex: 1"
          />
          <PageSelectorDropdownMenu
            isActive={this.dataIsSelected}
            label="DATA"
            menuItems={[
              { label: 'STATUS', action: () => this.props.uiService.navigateTo('fms/data/status') },
              { label: 'DEBUG', action: () => this.props.uiService.navigateTo('fms/data/debug') },
              { label: 'WAYPOINT', action: () => this.props.uiService.navigateTo('fms/data/waypoint') },
              { label: 'NAVAID', action: () => this.props.uiService.navigateTo('fms/data/navaid'), disabled: true },
              { label: 'ROUTE', action: () => this.props.uiService.navigateTo('fms/data/route'), disabled: true },
              { label: 'AIRPORT', action: () => this.props.uiService.navigateTo('fms/data/airport') },
              { label: 'PRINTER', action: () => this.props.uiService.navigateTo('fms/data/printer'), disabled: true },
            ]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorData`}
            containerStyle="flex: 1"
          />
        </div>
      </>
    );
  }
}
