//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, VNode, Subscribable, Subject } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';

interface OitNavigatorItemProps {
  readonly name: Subscribable<string>;
  readonly hidden?: Subscribable<boolean>;
  readonly style?: 'menu' | 'company-com';
}

interface OitFolderProps extends OitNavigatorItemProps {
  readonly initExpanded?: boolean;
}

export class OitFolder extends DestroyableComponent<OitFolderProps> {
  private readonly containerRef = FSComponent.createRef<HTMLDivElement>();

  private readonly expanded = Subject.create(this.props.initExpanded ?? false);

  private readonly hideChildren = this.expanded.map((expanded) => !expanded);

  private readonly folderHidden = this.props.hidden ?? Subject.create(false);

  private readonly folderIconText = this.expanded.map((expanded) => (expanded ? '-' : '+'));

  private onClick(event?: MouseEvent): void {
    this.expanded.set(!this.expanded.get());
    event?.stopPropagation();
  }
  private onClickHandler = this.onClick.bind(this);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.hideChildren, this.folderIconText);

    this.containerRef.instance.addEventListener('click', this.onClickHandler);
  }

  render(): VNode {
    return (
      <div ref={this.containerRef} class={{ 'oit-avncs-navigator-folder-container': true, hidden: this.folderHidden }}>
        <div style="display: flex; flex-direction: row; align-items: center;">
          <span class="oit-avncs-icon-folder">{this.folderIconText}</span>
          <span class={{ 'oit-avncs-navigator-folder': true, expanded: this.expanded }}>{this.props.name}</span>
        </div>

        <div class={{ 'oit-avncs-navigator-folder-children': true, hidden: this.hideChildren }}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

interface OitFileProps extends OitNavigatorItemProps {}

export class OitFile extends DestroyableComponent<OitFileProps> {
  private readonly fileRef = FSComponent.createRef<HTMLSpanElement>();

  private onClick(event?: MouseEvent): void {
    console.log('file.selected', this.props.name);
    event?.stopPropagation();
  }
  private onClickHandler = this.onClick.bind(this);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.fileRef.instance.addEventListener('click', this.onClickHandler);
  }

  render(): VNode {
    return (
      <span ref={this.fileRef} class={{ 'oit-avncs-navigator-file': true }}>
        {this.props.name}
      </span>
    );
  }
}
