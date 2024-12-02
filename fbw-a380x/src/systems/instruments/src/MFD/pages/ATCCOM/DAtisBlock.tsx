import { ArraySubject, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';

import { AirportFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { NewAtisIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/NewAtisIcon';
import { AutoUpdateIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/AutoUpdateIcon';
import { AutoPrintIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/AutoPrintIcon';

interface DAtisBlockProps extends AbstractMfdPageProps {}
export class DAtisBlock extends DisplayComponent<DAtisBlockProps> {
  private atisICAO = Subject.create<string | null>(null);
  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private selectedAtisTypeIndex = Subject.create<number | null>(null);

  private isAtisNew = true;
  private isAutoUpdateEnabled = true;
  private isAutoPrintEnabled = true;

  private AtisMessage =
    'LFBO DEP ATIS K 1005Z RWY 32L ILS RWY 32L RWY 32R CLOSED TRANS LVL 5000FT TWY N1 N2 N6 M2 CLSD EXPECT TKOF FROM M4 2700M AVLB IF UNABLE ADV PREFLIGHT WIND 34009KT VIS 10 KM CLOUD FEW011 BKN041 OVC054 TEMP ......';

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.atisICAO.set('LFBO');
    this.selectedAtisTypeIndex.set(0);
  }

  render(): VNode {
    return (
      <div class="mfd-atccom-datis-block">
        <div class="mfd-atccom-datis-block-header-row">
          <InputField<String>
            dataEntryFormat={new AirportFormat()}
            mandatory={Subject.create(false)}
            value={this.atisICAO}
            containerStyle="width: 106px; margin-left: 5px; position: absolute; top: 13px;"
            alignText="center"
            errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
          />
          <DropdownMenu
            ref={this.dropdownMenuRef}
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_atisTypeList`}
            selectedIndex={this.selectedAtisTypeIndex}
            values={ArraySubject.create<string>(['ARR', 'DEP'])}
            freeTextAllowed={false}
            containerStyle="width: 106px; top: 5px; left: 115px;"
            alignLabels="flex-start"
            numberOfDigitsForInputField={3}
            tmpyActive={Subject.create(false)}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
          />
          <div class="mfd-label atis-version">
            <span>K</span>
          </div>
          <div class="mfd-label atis-time">
            <span>1005Z</span>
          </div>
          <NewAtisIcon visible={this.isAtisNew} />
          <AutoUpdateIcon visible={this.isAutoUpdateEnabled} />
          <AutoPrintIcon visible={this.isAutoPrintEnabled} />
          <Button
            label="GND SYS<br/>MSG >>>"
            disabled={Subject.create(false)}
            onClick={() => {}}
            buttonStyle="width: 131px; padding-top: 3px; padding-bottom: 3px;"
            containerStyle="position: absolute; left: 469px; top: 7px;"
          />
          <Button
            label="UPDATE<br/>OR PRINT"
            disabled={Subject.create(false)}
            onClick={() => {}}
            buttonStyle="width: 159px; padding-left: 5px; padding-top: 3px; padding-bottom: 3px;"
            containerStyle="position: absolute; left: 600px; top: 7px;"
            menuItems={Subject.create<ButtonMenuItem[]>([
              { label: 'UPDATE', action: () => {} },
              { label: 'PRINT', action: () => {} },
            ])}
          />
        </div>
        <div class="mfd-atccom-datis-block-msgarea">{this.AtisMessage}</div>
        <Button
          label=">>>"
          disabled={Subject.create(false)}
          onClick={() => this.props.mfd.uiService.navigateTo('atccom/d-atis-received')}
          buttonStyle="width: 61px; height:33px; padding-left: 16px; position: absolute; right: 55px; top: 213px;"
          containerStyle="position: absolute; top: 0px; width: 100%;"
        />
      </div>
    );
  }
}
