//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, VNode, Subscribable, Subject } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { OitUiService } from '../../OitUiService';

interface OitNavigatorItemProps {
  readonly name: string | Subscribable<string>;
  readonly hidden?: Subscribable<boolean>;
  readonly style?: 'menu' | 'company-com';
}

interface OitFolderProps extends OitNavigatorItemProps {
  readonly initExpanded?: boolean;
  readonly hideFolderOpener?: boolean;
  readonly hideFolderIcon?: boolean;
}

export class OitFolder extends DestroyableComponent<OitFolderProps> {
  private readonly containerRef = FSComponent.createRef<HTMLDivElement>();

  private readonly expanded = Subject.create(this.props.initExpanded ?? false);

  private readonly hideChildren = this.expanded.map((expanded) => !expanded);

  private readonly folderHidden = this.props.hidden ?? Subject.create(false);

  private readonly folderOpenerIconText = this.expanded.map((expanded) => (expanded ? '-' : '+'));

  private onClick(event?: MouseEvent): void {
    this.expanded.set(!this.expanded.get());
    event?.stopPropagation();
  }
  private onClickHandler = this.onClick.bind(this);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.hideChildren, this.folderOpenerIconText);

    this.containerRef.instance.addEventListener('click', this.onClickHandler);
  }

  render(): VNode {
    return (
      <div ref={this.containerRef} class={{ 'oit-avncs-navigator-folder-container': true, hidden: this.folderHidden }}>
        <div style="display: flex; flex-direction: row; align-items: center;">
          <span class={{ 'oit-avncs-icon-folder-opener': true, hidden: this.props.hideFolderOpener ?? false }}>
            {this.folderOpenerIconText}
          </span>
          <svg
            width="40"
            viewBox="0 0 60 50"
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            style={`display: ${this.props.hideFolderIcon ? 'none' : 'inline-block'}; margin-right: 10px;`}
          >
            <g>
              <path
                d="m55.76271,48.81356c0,0 2.54237,-1.94915 2.54237,-1.94915c0,0 0,-33.38994 0,-33.47458c0,0.08464 -50.84746,-12.79661 -50.84746,-12.79661c0,0 -4.40678,0.76271 -4.40678,0.76271c0,0 52.71186,47.45763 52.71186,47.45763z"
                stroke="#dbdbdb"
                fill="#a3aeaf"
              />
              <path
                d="m2.88453,1.43962l52.75989,14.37994l0.08475,33.24294l-53.09039,-12.93785l0.23808,-29.5185l0.00768,-5.16653z"
                stroke="#dbdbdb"
                fill="#baf4ff"
              />
              <path
                d="m2.6875,14.6875c0,0 -1.9375,2.125 -1.9375,1.9375c0,-0.1875 0,5.37645 0,5.375c0,0.00145 55.5,13.75 55.5,13.75c0,0 2.375,-1.1875 2.375,-1.1875c0,0 -0.0625,-9.8125 -0.0625,-9.8125c0,0 -2.75,1.5 -2.75,1.5c0,0 -53.0625,-12.375 -53.0625,-12.375c0,0 -0.0625,0.8125 -0.0625,0.8125z"
                stroke="#dbdbdb"
                fill="#afd6e0"
              />
              <ellipse stroke="#333333" ry="4.09375" rx="4.09375" id="svg_4" cy="24.03125" cx="27.21875" fill="none" />
              <line y2="21.56311" x2="27.375" y1="18.375" x1="27.375" stroke="#333333" fill="none" />
            </g>
          </svg>
          <span class={{ 'oit-avncs-navigator-folder': true, expanded: this.expanded }}>{this.props.name}</span>
        </div>

        <div class={{ 'oit-avncs-navigator-folder-children': true, hidden: this.hideChildren }}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

interface OitFileProps extends OitNavigatorItemProps {
  readonly uiService: OitUiService;
  readonly navigationTarget?: string;
  readonly showFileSymbol?: boolean;
  readonly disabled?: boolean;
}

export class OitFile extends DestroyableComponent<OitFileProps> {
  private readonly fileRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly selected = this.props.uiService.activeUri.map((uri) => uri.uri === this.props.navigationTarget);

  private onClick(event?: MouseEvent): void {
    if (this.props.navigationTarget) {
      // Navigate to the target page if specified
      this.props.uiService.navigateTo(this.props.navigationTarget);
    }
    event?.stopPropagation();
  }
  private onClickHandler = this.onClick.bind(this);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.fileRef.instance.addEventListener('click', this.onClickHandler);
    this.subscriptions.push(this.selected);
  }

  render(): VNode {
    return (
      <div ref={this.fileRef} class={{ 'oit-avncs-navigator-file': true }}>
        <svg
          width="18"
          viewBox="0 0 36 50"
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          style={`display: ${this.props.showFileSymbol ?? true ? 'inline-block' : 'none'}; margin-right: 10px;`}
        >
          <g>
            <path
              d="m1.375,49l0,-47.875l26,0l6.3125,15l0.3125,32.5l-32.625,0.375z"
              stroke="#fff"
              stroke-width="2"
              fill="none"
            />
            <path d="m32.4375,10.8125" stroke="#fff" fill="none" stroke-width="2" />
            <path d="m33.75,16.125l-11,-9.625l4.25,-5.125" stroke="#fff" fill="none" stroke-width="2" />
          </g>
        </svg>
        <span
          class={{
            'oit-avncs-navigator-file-name': true,
            selected: this.selected,
            disabled: this.props.disabled ?? false,
          }}
        >
          {this.props.name}
        </span>
      </div>
    );
  }
}
