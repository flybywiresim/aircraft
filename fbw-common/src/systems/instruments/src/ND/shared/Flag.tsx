import { DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';

export interface FlagProps {
  x: Subscribable<number> | number;
  y: Subscribable<number> | number;
  class: string;
  visible: Subscribable<boolean>;
}

export class Flag extends DisplayComponent<FlagProps> {
  private readonly flagRef = FSComponent.createRef<SVGTextElement>();

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.props.visible.sub((visible) => {
      this.flagRef.instance.style.visibility = visible ? 'inherit' : 'hidden';
    }, true);
  }

  render(): VNode | null {
    return (
      <text x={this.props.x} y={this.props.y} ref={this.flagRef} class={`${this.props.class} MiddleAlign shadow`}>
        {this.props.children}
      </text>
    );
  }
}
