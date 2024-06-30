// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

export class RefImages extends DisplayComponent<ComponentProps> {
  private readonly images: { img: string; style: string }[] = [
    {
      img: 'coui://html_ui/Images/rmp-vhf-ref.png',
      style: 'position: absolute; top: -22px; left: -32px; width: 1698px; height: 1050px;',
    },
  ];

  private readonly image = Subject.create('');
  private readonly style = Subject.create('');

  private readonly buttonRef = FSComponent.createRef<HTMLDivElement>();

  onAfterRender(node: VNode): void {
    this.buttonRef.instance.onclick = () => {
      const index = this.images.findIndex((i) => i.img === this.image.get());
      const newImage = this.images[index + 1];
      this.image.set(newImage?.img ?? '');
      this.style.set(newImage?.style ?? '');
    };
  }

  render(): VNode | null {
    return (
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.5;">
        <img style={this.style} src={this.image} class={{ hidden: this.image.map((v) => v.length === 0) }} />
        <div
          style="position: absolute; bottom: 10px; right: 10px; padding: 5px; background: magenta; font-family: Roboto; font-size: 60px;"
          ref={this.buttonRef}
        >
          REF IMG
        </div>
      </div>
    );
  }
}
