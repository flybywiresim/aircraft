//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, Subscribable, VNode, ConsumerSubject, Subject } from '@microsoft/msfs-sdk';
import { AbstractOitAvncsPageProps } from '../../../OIT';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { OisDebugDataEvents } from 'instruments/src/MsfsAvionicsCommon/providers/OisDebugDataPublisher';

interface OitAvncsFbwSystemsDebugProps extends AbstractOitAvncsPageProps {}

export abstract class OitAvncsFbwSystemsDebug extends DestroyableComponent<OitAvncsFbwSystemsDebugProps> {
  private readonly sci = this.props.container.ansu.sci;

  private readonly sub = this.props.bus.getSubscriber<OisDebugDataEvents>();

  private readonly debugDataTable = ConsumerSubject.create(this.sub.on('ois_generic_debug_data_table'), []);

  private readonly messageContainerRef = FSComponent.createRef<HTMLDivElement>();

  private readonly labelSubjects: Subject<string>[] = [];

  private readonly valueSubjects: Subject<string>[] = [];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.debugDataTable.sub((data) => {
        // Handle the debug data table updates here
        if (this.labelSubjects.length === 0 && data.length > 0) {
          console.log('initial population');
          // Initial population
          for (const row of data) {
            this.labelSubjects.push(Subject.create(row.label));
            this.valueSubjects.push(Subject.create(row.value));

            FSComponent.render(
              <OitAvncsFbwSystemsDebugTableLine
                label={this.labelSubjects[this.labelSubjects.length - 1]}
                value={this.valueSubjects[this.valueSubjects.length - 1]}
              />,
              this.messageContainerRef.instance,
            );
          }
        } else {
          console.log('update existing subjects');
          // Update existing subjects
          for (let i = 0; i < data.length; i++) {
            this.labelSubjects[i].set(data[i].label);
            this.valueSubjects[i].set(data[i].value);
          }
        }
      }, true),
    );
  }

  destroy(): void {
    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <div class="oit-ccom-headline">FBW Systems Debug Data</div>
        <div class="oit-ccom-inbox-msg-table">
          <div class="fr ass">
            <div class="oit-ccom-inbox-msg-table-header oit-table-ib f1">Label</div>
            <div class="oit-ccom-inbox-msg-table-header oit-table-ib f1">Value</div>
          </div>
          <div ref={this.messageContainerRef}></div>
        </div>
        <div style="flex-grow: 1" />
      </>
    );
  }
}

interface OitAvncsFbwSystemsDebugTableLineProps {
  readonly label: Subscribable<string>;
  readonly value: Subscribable<string>;
}

export class OitAvncsFbwSystemsDebugTableLine extends DestroyableComponent<OitAvncsFbwSystemsDebugTableLineProps> {
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <div class="fr ass">
        <div class={{ 'oit-ccom-inbox-msg-table-line': true, tc: true, f1: true }}>{this.props.label}</div>
        <div
          class={{
            'oit-ccom-inbox-msg-table-line': true,
            'oit-green-text': true,
            f1: true,
          }}
        >
          {this.props.value}
        </div>
      </div>
    );
  }
}
