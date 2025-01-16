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
            fmcService={this.props.fmcService}
            index={1}
            atisIcao={Subject.create('LFBO')}
            atisType="DEP"
            atisMessage={Subject.create(
              'LFBO DEP ATIS K 1005Z RWY 32L ILS RWY 32L RWY 32R CLOSED TRANS LVL 5000FT TWY N1 N2 N6 M2 CLSD EXPECT TKOF FROM M4 2700M AVLB IF UNABLE ADV PREFLIGHT WIND 34009KT VIS 10 KM CLOUD FEW011 BKN041 OVC054 TEMP ......',
            )}
            atisCode={Subject.create('K')}
            atisTime={Subject.create('1005Z')}
            isAtisNew={Subject.create(true)}
            isAutoUpdateEnabled={Subject.create(true)}
            isAutoPrintEnabled={Subject.create(true)}
            atisStatus="RECEIVED"
          />
          <DAtisBlock
            bus={this.props.bus}
            mfd={this.props.mfd}
            fmcService={this.props.fmcService}
            index={2}
            atisIcao={Subject.create('')}
          />
          <DAtisBlock
            bus={this.props.bus}
            mfd={this.props.mfd}
            fmcService={this.props.fmcService}
            index={3}
            atisIcao={Subject.create('')}
          />
          <div class="mfd-atccom-datis-footer">
            <Button
              label="PRINT<br/>ALL"
              disabled={Subject.create(false)}
              onClick={() => {}}
              buttonStyle="width: 190px;"
              containerStyle="position:absolute; top: 3px; right:190px"
            />
            <Button
              label="UPDATE<br/>ALL"
              disabled={Subject.create(false)}
              onClick={() => {}}
              buttonStyle="width: 190px;"
              containerStyle="position:absolute; top: 3px; right:0px"
            />
          </div>
        </div>
        <div
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
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
