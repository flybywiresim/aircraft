import { DisplayComponent, FSComponent } from '@microsoft/msfs-sdk';

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
