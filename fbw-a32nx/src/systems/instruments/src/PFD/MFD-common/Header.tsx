import { ArraySubject, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { DropdownMenu } from 'instruments/src/PFD/MFD-common/DropdownMenu';
import { PageSelectorDropdownMenu } from 'instruments/src/PFD/MFD-common/PageSelectorDropdownMenu';

export class Header extends DisplayComponent<MfdComponentProps> {
  private sysSelectorSelectedIndex = Subject.create(0);

  public onAfterRender(node: VNode): void {
      super.onAfterRender(node);

      switch (this.props.active.get().sys) {
      case 'fms':
          this.sysSelectorSelectedIndex.set(0);
          break;
      case 'atccom':
          this.sysSelectorSelectedIndex.set(1);
          break;
      case 'surv':
          this.sysSelectorSelectedIndex.set(2);
          break;
      case 'fcubkup':
          this.sysSelectorSelectedIndex.set(3);
          break;

      default:
          this.sysSelectorSelectedIndex.set(0);
          break;
      }
  }

  render(): VNode {
      return (
          <>
              <div style="display: flex; flex-direction: row;">
                  <DropdownMenu
                      values={ArraySubject.create(['FMS 1', 'ATCCOM', 'SURV', 'FCU BKUP'])}
                      selectedIndex={this.sysSelectorSelectedIndex}
                      idPrefix="sysSelectorDropdown"
                      onChangeCallback={(val) => this.sysSelectorSelectedIndex.set(val)}
                      containerStyle="width: 25%;"
                      alignLabels="left"
                  />
              </div>
              <div style="display: flex; flex-direction: row;">
                  <PageSelectorDropdownMenu
                      isActive={Subject.create(this.props.active.get().category === 'active')}
                      label="ACTIVE"
                      menuItems={[
                          { label: 'F-PLN', action: () => this.props.navigateTo('fms/active/f-pln') },
                          { label: 'PERF', action: () => this.props.navigateTo('fms/active/perf') },
                          { label: 'FUEL&LOAD', action: () => this.props.navigateTo('fms/active/fuel-load') },
                          { label: 'WIND', action: () => this.props.navigateTo('fms/active/wind') },
                          { label: 'INIT', action: () => this.props.navigateTo('fms/active/init') }]}
                      idPrefix="pageSelectorActive"
                      containerStyle="flex: 1"
                  />
                  <PageSelectorDropdownMenu
                      isActive={Subject.create(this.props.active.get().category === 'position')}
                      label="POSITION"
                      menuItems={[
                          { label: 'NAVAIDS', action: () => this.props.navigateTo('fms/position/navaids') }]}
                      idPrefix="pageSelectorPosition"
                      containerStyle="flex: 1"
                  />
                  <PageSelectorDropdownMenu
                      isActive={Subject.create(this.props.active.get().category === 'sec-index')}
                      label="SEC INDEX"
                      menuItems={[
                          { label: 'INIT', action: () => this.props.navigateTo('fms/active/init') }]}
                      idPrefix="pageSelectorSecIndex"
                      containerStyle="flex: 1"
                  />
                  <PageSelectorDropdownMenu
                      isActive={Subject.create(this.props.active.get().category === 'data')}
                      label="DATA"
                      menuItems={[
                          { label: 'INIT', action: () => this.props.navigateTo('fms/active/init') }]}
                      idPrefix="pageSelectorData"
                      containerStyle="flex: 1"
                  />
              </div>
          </>
      );
  }
}
