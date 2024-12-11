import { ArraySubject, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';

import { AirportFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { NewAtisIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/NewAtisIcon';
import { AutoUpdateIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/AutoUpdateIcon';
import { AutoPrintIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/AutoPrintIcon';

interface DAtisBlockProps extends AbstractMfdPageProps {
  readonly index: 1 | 2 | 3;
  atisIcao: Subscribable<string | null>;
  atisMessage?: Subscribable<string | null>;
  atisType?: '' | 'ARR' | 'DEP';
  atisTime?: Subscribable<string | null>;
  atisCode?: Subscribable<string | null>;
  isAtisNew?: Subscribable<boolean>;
  isAutoUpdateEnabled?: Subscribable<boolean>;
  isAutoPrintEnabled?: Subscribable<boolean>;
  atisStatus?: 'RECEIVED' | 'PENDING';
}
export class DAtisBlock extends DisplayComponent<DAtisBlockProps> {
  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private selectedAtisTypeIndex = Subject.create<number | null>(null);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    switch (this.props.atisType) {
      case 'ARR':
        this.selectedAtisTypeIndex.set(0);
        break;
      case 'DEP':
        this.selectedAtisTypeIndex.set(1);
        break;
    }
  }

  render(): VNode {
    return (
      <div class="mfd-atccom-datis-block">
        <div class="mfd-atccom-datis-block-header-row">
          <InputField<String>
            dataEntryFormat={new AirportFormat()}
            mandatory={Subject.create(false)}
            value={this.props.atisIcao}
            containerStyle="width: 106px; margin-left: 5px; position: absolute; top: 12px; height:40px"
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
            <span>{this.props.atisCode}</span>
          </div>
          <div class="mfd-label atis-time">
            <span>{this.props.atisTime}</span>
          </div>
          <NewAtisIcon visible={this.props.isAtisNew} />
          <AutoUpdateIcon visible={this.props.isAutoUpdateEnabled} />
          <AutoPrintIcon visible={this.props.isAutoPrintEnabled} />
          <div style={{ visibility: this.props.atisStatus === 'RECEIVED' ? 'shown' : 'hidden' }}>
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
          <div style={{ visibility: this.props.atisStatus === 'RECEIVED' ? 'hidden' : 'shown' }}>
            <Button
              label="SEND<br/>REQUEST"
              disabled={Subject.create(true)}
              onClick={() => {}}
              buttonStyle="width: 159px; padding-left: 5px; padding-top: 3px; padding-bottom: 3px;"
              containerStyle="position: absolute; left: 600px; top: 7px;"
            />
            <Button
              label="AUTO<br/>UPDATE"
              disabled={Subject.create(true)}
              onClick={() => {}}
              buttonStyle="width: 159px; padding-left: 5px; padding-top: 3px; padding-bottom: 3px;"
              containerStyle="position: absolute; left: 600px; top: 61px;"
            />
          </div>
        </div>
        <div class="mfd-atccom-datis-block-msgarea">{this.props.atisMessage}</div>
        <div style={{ visibility: this.props.atisStatus === 'RECEIVED' ? 'shown' : 'hidden' }}>
          <Button
            label=">>>"
            disabled={Subject.create(false)}
            onClick={() => this.props.mfd.uiService.navigateTo('atccom/d-atis/received')}
            buttonStyle="width: 61px; height:33px; padding-left: 16px; position: absolute; right: 55px; top: 213px;"
            containerStyle="position: absolute; top: 0px; width: 100%;"
          />
        </div>
      </div>
    );
  }
}
