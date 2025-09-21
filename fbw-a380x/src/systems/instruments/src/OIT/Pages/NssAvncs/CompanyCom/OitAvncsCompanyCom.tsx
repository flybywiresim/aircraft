//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { AbstractOitAvncsPageProps } from '../../../OIT';
import { OitAvncsSubHeader } from '../OitAvncsSubHeader';
import { OitAvncsCompanyComMenu } from './OitAvncsCompanyComMenu';
import { OitUriInformation } from '../../../OitUiService';
import { avncsCompanyComPageForUrl } from '../../../OitPageDirectory';

interface OitAvncsCompanyComPageProps extends AbstractOitAvncsPageProps {}

export class OitAvncsCompanyCom extends DestroyableComponent<OitAvncsCompanyComPageProps> {
  // Make sure to collect all subscriptions in this.subscriptions, otherwise page navigation doesn't work.

  private readonly activePageRef = FSComponent.createRef<HTMLDivElement>();

  private activePage: VNode = (<></>) as VNode;

  private activeUriChanged(uri: OitUriInformation) {
    if (!uri.uri.match(/nss-avncs\/company-com\/\S*/gm)) {
      // Navigate somewhere else outside of the company com section
      return;
    }

    // Remove and destroy old OIT page
    if (this.activePageRef.getOrDefault()) {
      while (this.activePageRef.instance.firstChild) {
        this.activePageRef.instance.removeChild(this.activePageRef.instance.firstChild);
      }
    }
    if (this.activePage && this.activePage.instance instanceof DisplayComponent) {
      this.activePage.instance.destroy();
    }

    // Mapping from URL to page component
    if (uri.page && uri.extra) {
      this.activePage = avncsCompanyComPageForUrl(
        `${uri.sys}/${uri.page}/${uri.extra}`,
        this.props.bus,
        this.props.uiService,
        this.props.container,
      );
    } else if (uri.page) {
      this.activePage = avncsCompanyComPageForUrl(
        `${uri.sys}/${uri.page}`,
        this.props.bus,
        this.props.uiService,
        this.props.container,
      );
    } else {
      this.activePage = avncsCompanyComPageForUrl(
        `${uri.sys}`,
        this.props.bus,
        this.props.uiService,
        this.props.container,
      );
    }

    FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.props.uiService.activeUri.sub((uri) => {
        this.activeUriChanged(uri);
      }),
    );
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <OitAvncsSubHeader title={'COMPANY COM'} uiService={this.props.uiService} />
        <div class="oit-page-container">
          <div class="oit-avncs-navigator-container">
            <div class="oit-avncs-navigator-left">
              <OitAvncsCompanyComMenu bus={this.props.bus} uiService={this.props.uiService} />
            </div>
            <div class="oit-avncs-navigator-right oit-centered" ref={this.activePageRef} />
          </div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
