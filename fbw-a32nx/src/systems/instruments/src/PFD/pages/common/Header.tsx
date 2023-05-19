import { ArraySubject, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { MfdComponentProps } from 'instruments/src/PFD/MFD';
import { DropdownMenu } from 'instruments/src/PFD/pages/common/DropdownMenu';
import { PageSelectorDropdownMenu } from 'instruments/src/PFD/pages/common/PageSelectorDropdownMenu';

export class Header extends DisplayComponent<MfdComponentProps> {
  private sysSelectorSelectedIndex = Subject.create(0);

  private activeIsSelected = Subject.create(false);

  private positionIsSelected = Subject.create(false);

  private secIndexIsSelected = Subject.create(false);

  private dataIsSelected = Subject.create(false);

  public changeSystem(selectedSysIndex: number) {
      // ...
      this.sysSelectorSelectedIndex.set(selectedSysIndex);

      switch (selectedSysIndex) {
      case 0: // FMS
          this.props.navigateTo('fms/active/init');
          break;
      case 1: // ATCCOM
          this.props.navigateTo('atccom/');
          break;
      case 2: // SURV
          this.props.navigateTo('surv/controls');
          break;
      case 3: // FCU BKUP
          this.props.navigateTo('fcubkup/');
          break;

      default:
          this.props.navigateTo('fms/active/init');
          break;
      }
  }

  public onAfterRender(node: VNode): void {
      super.onAfterRender(node);

      this.props.activeUri.sub((val) => {
          switch (val.sys) {
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

          this.activeIsSelected.set(val.category === 'active');
          this.positionIsSelected.set(val.category === 'position');
          this.secIndexIsSelected.set(val.category === 'sec-index');
          this.dataIsSelected.set(val.category === 'data');
      }, true);
  }

  render(): VNode {
      return (
          <>
              <div style="display: flex; flex-direction: row;">
                  <DropdownMenu
                      values={ArraySubject.create(['FMS 1', 'ATCCOM', 'SURV', 'FCU BKUP'])}
                      selectedIndex={this.sysSelectorSelectedIndex}
                      idPrefix="sysSelectorDropdown"
                      onChangeCallback={(val) => this.changeSystem(val)}
                      containerStyle="width: 25%;"
                      alignLabels="left"
                  />
              </div>
              <div style="display: flex; flex-direction: row;">
                  <PageSelectorDropdownMenu
                      isActive={this.activeIsSelected}
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
                      isActive={this.positionIsSelected}
                      label="POSITION"
                      menuItems={[
                          { label: 'NAVAIDS', action: () => this.props.navigateTo('fms/position/navaids') }]}
                      idPrefix="pageSelectorPosition"
                      containerStyle="flex: 1"
                  />
                  <PageSelectorDropdownMenu
                      isActive={this.secIndexIsSelected}
                      label="SEC INDEX"
                      menuItems={[
                          { label: 'INIT', action: () => this.props.navigateTo('fms/active/init') }]}
                      idPrefix="pageSelectorSecIndex"
                      containerStyle="flex: 1"
                  />
                  <PageSelectorDropdownMenu
                      isActive={this.dataIsSelected}
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
