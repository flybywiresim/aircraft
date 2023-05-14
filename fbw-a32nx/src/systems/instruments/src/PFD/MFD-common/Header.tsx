import { ArraySubject, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { MFDComponentProps } from 'instruments/src/PFD/MFD';
import { DropdownMenu } from 'instruments/src/PFD/MFD-common/DropdownMenu';
import { PageSelectorDropdownMenu } from 'instruments/src/PFD/MFD-common/PageSelectorDropdownMenu';

export class Header extends DisplayComponent<MFDComponentProps> {
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
                  <PageSelectorDropdownMenu isActive={Subject.create(this.props.active.get().category === 'active')}>
                      ACTIVE
                  </PageSelectorDropdownMenu>
                  <PageSelectorDropdownMenu isActive={Subject.create(this.props.active.get().category === 'position')}>
                      POSITION
                  </PageSelectorDropdownMenu>
                  <PageSelectorDropdownMenu isActive={Subject.create(this.props.active.get().category === 'secindex')}>
                      SEC INDEX
                  </PageSelectorDropdownMenu>
                  <PageSelectorDropdownMenu isActive={Subject.create(this.props.active.get().category === 'data')}>
                      DATA
                  </PageSelectorDropdownMenu>
              </div>
          </>
      );
  }
}
