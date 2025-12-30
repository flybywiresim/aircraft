import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomDAtis.scss';
import { AtccomMfdPageProps } from 'instruments/src/MFD/MFD';
import { DAtisBlock } from 'instruments/src/MFD/pages/ATCCOM/DAtisBlock';

import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AtccomFooter } from './MfdAtccomFooter';

interface MfdAtccomDAtisProps extends AtccomMfdPageProps {}

export class MfdAtccomDAtis extends DisplayComponent<MfdAtccomDAtisProps> {
  protected onNewData() {}

  private datalink = this.props.atcService;

  private airports = this.datalink.getAtisAirports();

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }
  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('D-ATIS/LIST')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container">
          <DAtisBlock
            bus={this.props.bus}
            mfd={this.props.mfd}
            atcService={this.props.atcService}
            index={0}
            data={this.airports[0]}
          />
          <DAtisBlock
            bus={this.props.bus}
            mfd={this.props.mfd}
            atcService={this.props.atcService}
            index={1}
            data={this.airports[1]}
          />
          <DAtisBlock
            bus={this.props.bus}
            mfd={this.props.mfd}
            atcService={this.props.atcService}
            index={2}
            data={this.airports[2]}
          />
          <div class="mfd-atccom-datis-footer">
            <Button
              label="PRINT<br/>ALL"
              disabled={Subject.create(true)}
              onClick={() => {}}
              buttonStyle="width: 190px;"
              containerStyle="position:absolute; top: 3px; right:190px"
            />
            <Button
              label="UPDATE<br/>ALL"
              disabled={Subject.create(false)}
              onClick={() => {
                this.datalink.updateAllAtis();
              }}
              buttonStyle="width: 190px;"
              containerStyle="position:absolute; top: 3px; right:0px"
            />
          </div>
        </div>
        <AtccomFooter bus={this.props.bus} mfd={this.props.mfd} atcService={this.props.atcService} />
      </>
    );
  }
}
