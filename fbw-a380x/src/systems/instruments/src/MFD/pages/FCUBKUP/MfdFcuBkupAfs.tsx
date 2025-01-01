import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFcuBkupAfs.scss';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import {
  AltitudeOrFlightLevelFormat,
  SpeedKnotsFormat,
  WindDirectionFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

interface MfdFcuBkupAfsProps extends AbstractMfdPageProps {}

export class MfdFcuBkupAfs extends FmsPage<MfdFcuBkupAfsProps> {
  protected onNewData(): void {}

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('AFS CONTROL PANEL')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        <div class="mfd-page-container">
          <div class="mfd-fcubkup-first-line">
            <Button onClick={() => {}} disabled={Subject.create(true)} label="TOGGLE" buttonStyle="padding: 3px" />
          </div>
          <div class="mfd-fcubkup-second-line">AFS CP BACKUP</div>
          <div class="mfd-fcubkup-box-one">
            <div class="mfd-fcubkup-box-one-first-line">
              <Button
                label="SPD - MACH"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 5px;"
              />
              <Button
                label="MAG - TRUE"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-left: 10px;"
              />
              <Button
                label="HDG -V/S  -  TRK-FPA"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-left: 35px;"
              />
            </div>
            <div class="mfd-fcubkup-box-one-second-line">
              <span class="mfd-fcubkup-box-one-lines" style="margin-left: 85px; margin-right: 170px"></span>
              <span class="mfd-fcubkup-box-one-lines" style="margin-right: 100px"></span>
              <span class="mfd-fcubkup-box-one-shortlines" style="margin-top: 30px"></span>
              <span class="mfd-fcubkup-box-one-levelline" style="margin-top: 30px"></span>
              <span class="mfd-fcubkup-box-one-shortlines" style="margin-right: 55px"></span>
              <Button
                label="METER"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 50px; margin-top: 20px"
              />
              <span class="mfd-fcubkup-box-one-lines"></span>
            </div>
            <div class="mfd-fcubkup-box-one-label-line">
              <span class="spd">SPD</span>
              <span class="mag">MAG</span>
              <span class="hdg">HDG</span>
              <span class="alt">ALT</span>
              <span class="vs">V/S</span>
            </div>
            <div class="mfd-fcubkup-box-one-fourth-line">
              <InputField<number>
                dataEntryFormat={new SpeedKnotsFormat()}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
                value={Subject.create(0)}
                containerStyle="width: 180px; margin-right: 10px; magin"
              />
              <InputField<number>
                dataEntryFormat={new WindDirectionFormat()}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
                value={Subject.create(0)}
                containerStyle="width: 180px; margin-right: 10px;"
              />
              <InputField<number>
                dataEntryFormat={new AltitudeOrFlightLevelFormat()}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
                value={Subject.create(0)}
                containerStyle="width: 180px; margin-right: 10px;"
              />
              <InputField<number>
                dataEntryFormat={new AltitudeOrFlightLevelFormat()}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
                value={Subject.create(0)}
                containerStyle="width: 180px; margin-right: 10px;"
              />
            </div>
            <div class="mfd-fcubkup-box-one-fifth-line">
              <Button
                label="SELECTED"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 15px; width 300px; padding-right: 30px; padding-left: 30px"
              />
              <Button
                label="SELECTED"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 15px; padding-right: 30px; padding-left: 30px"
              />
              <Button
                label="OPEN"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 15px; padding-right: 58px; padding-left: 58px"
              />
              <Button
                label="SELECTED"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 15px; padding-right: 30px; padding-left: 30px"
              />
            </div>
            <div class="mfd-fcubkup-box-one-sixth-line">
              <Button
                label="MANAGED"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 15px; padding-right: 37px; padding-left: 37px"
              />
              <Button
                label="MANAGED"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 15px; padding-right: 37px; padding-left: 37px"
              />
              <Button
                label="MANAGED"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="margin-right: 15px; padding-right: 37px; padding-left: 37px"
              />
            </div>
            <div class="mfd-fcubkup-box-one-ils">
              <Button
                label="LOC"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="padding-top: 35px; padding-left: 10px; padding-right: 10px"
              />
              <Button
                label="ALT"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="padding-top: 35px; padding-left: 10px; padding-right: 10px"
              />
              <Button
                label="APPR"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="padding-top: 35px; "
              />
            </div>
          </div>
          <div class="mfd-fcubkup-ap-box">
            <div class="mfd-fcubkup-ap-box-first-line">
              <Button
                label="FD"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="padding-top: 40px; padding-left: 30px; padding-right: 30px"
              />
            </div>
            <div class="mfd-fcubkup-ap-box-second-line">
              <Button
                label="AP1"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="padding-top: 40px; padding-left: 15px; padding-right: 15px"
              />
              <Button
                label="AP2"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="padding-top: 40px; padding-left: 15px; padding-right: 15px"
              />
            </div>
            <div class="mfd-fcubkup-ap-box-third-line">
              <Button
                label="A/THR"
                onClick={() => {}}
                disabled={Subject.create(true)}
                buttonStyle="padding-top: 40px"
              />
            </div>
          </div>
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
