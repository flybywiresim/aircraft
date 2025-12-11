//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { AbstractOitAvncsPageProps } from '../../OIT';
import { OitAvncsSubHeader } from './OitAvncsSubHeader';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { OitFile, OitFolder } from './OitAvncsFolderNavigator';

interface OitAvncsMenuPageProps extends AbstractOitAvncsPageProps {}

export class OitAvncsMenu extends DestroyableComponent<OitAvncsMenuPageProps> {
  // Make sure to collect all subscriptions in this.subscriptions, otherwise page navigation doesn't work.

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <OitAvncsSubHeader title={'NSS AVNCS MENU'} uiService={this.props.uiService} />
        <div class="oit-page-container">
          <div class="oit-avncs-navigator-container">
            <div class="oit-avncs-navigator-left">
              <OitFolder name={'OIS MENU'} initExpanded={true} hideFolderIcon>
                <OitFolder name={'NSS AVNCS MENU'} initExpanded={true} hideFolderIcon>
                  <OitFile
                    name={'COMPANY COM'}
                    uiService={this.props.uiService}
                    navigationTarget="nss-avncs/company-com"
                    showFileSymbol={false}
                  />
                  <OitFile
                    name={'REFUEL'}
                    uiService={this.props.uiService}
                    navigationTarget="nss-avncs/refuel"
                    showFileSymbol={false}
                    disabled={true}
                  />
                </OitFolder>
                <OitFolder name={'UTILITIES'} initExpanded={true} hideFolderIcon>
                  <OitFile
                    name={'A380X SYSTEMS'}
                    uiService={this.props.uiService}
                    navigationTarget="nss-avncs/a380x-systems"
                    showFileSymbol={false}
                  />
                </OitFolder>
              </OitFolder>
            </div>
            <div class="it-avncs-navigator-right">
              <div class="oit-avncs-navigator-right-exit-ois">
                <Button
                  label={'EXIT OIS'}
                  onClick={() => {
                    this.props.uiService.navigateTo('nss-avncs');
                    this.props.uiService.nssAvncsLoginScreenVisible.set(true);
                  }}
                  buttonStyle="font-size: 28px; height: 40px;"
                />
              </div>
              <div class="oit-avncs-navigator-right-center-buttons">
                <span style="font-weight: bold;">NSS AVNCS MENU</span>
                <Button
                  label={'COMPANY COM'}
                  onClick={() => this.props.uiService.navigateTo('nss-avncs/company-com')}
                  buttonStyle="font-size: 28px; height: 40px;"
                  containerStyle="margin-top: 25px; margin-bottom: 25px;"
                />
                <Button
                  label={'REFUEL'}
                  disabled={Subject.create(true)}
                  onClick={() => this.props.uiService.navigateTo('nss-avncs/refuel')}
                  buttonStyle="font-size: 28px; height: 40px;"
                />
              </div>
            </div>
          </div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
