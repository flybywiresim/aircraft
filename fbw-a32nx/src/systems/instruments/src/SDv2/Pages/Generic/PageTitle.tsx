import { DisplayComponent, FSComponent, Subscribable } from '@microsoft/msfs-sdk';

export interface PageTitleProps {
  readonly x: number;
  readonly y: number;
}

export class PageTitle extends DisplayComponent<PageTitleProps> {
  render() {
    return (
      <text x={this.props.x} y={this.props.y} class="F36 White TextUnderline">
        {this.props.children}
      </text>
    );
  }
}

export interface MoreLabelProps {
  readonly x: number;
  readonly y: number;
  readonly moreActive: Subscribable<boolean>;
}

export class MoreLabel extends DisplayComponent<MoreLabelProps> {
  render() {
    return (
      <>
        <text
          x={this.props.x - 27}
          y={this.props.y}
          class={{ F24: true, White: true, 'LS-8': true, Hide: this.props.moreActive }}
        >
          ...
        </text>
        <text
          x={this.props.x - (this.props.moreActive ? 15 : 0)}
          y={this.props.y}
          class={{ F26: true, White: true, TextUnderline: this.props.moreActive }}
        >
          MORE
        </text>
      </>
    );
  }
}
