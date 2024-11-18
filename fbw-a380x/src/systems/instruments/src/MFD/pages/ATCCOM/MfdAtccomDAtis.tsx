import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomDAtis.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { DAtisBlock } from 'instruments/src/MFD/pages/ATCCOM/DAtisBlock';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';

interface MfdAtccomDAtisProps extends AbstractMfdPageProps {}

export class MfdAtccomDAtis extends DisplayComponent<MfdAtccomDAtisProps> {
  protected onNewData() {}

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('D-ATIS')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container">
          <DAtisBlock bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
          <DAtisBlock bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
          <DAtisBlock bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
          <div class="mfd-atccom-datis-footer">
            <Button
              label="PRINT<br/>ALL"
              disabled={Subject.create(false)}
              onClick={() => {}}
              buttonStyle="width: 190px;"
            />
            <Button
              label="UPDATE<br/>ALL"
              disabled={Subject.create(false)}
              onClick={() => {}}
              buttonStyle="width: 190px;"
            />
          </div>
        </div>
        {/* <div
          id="atccom-inop"
          style="
    position: absolute;
    top: 132px;
    width: 768px;
    height: 818px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 35px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #e68000"
        >
          <span>NOT YET IMPLEMENTED</span>
        </div> */}
        <div style="position: absolute; top: 36px; opacity: 0.3; visibility: hidden;">
          <img src="/Images/fbw-a380x/d-atis-list.png" alt="" />
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
