import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface TopTabElementProps extends ComponentProps {
  title: string;
  isSelected: boolean;
  selectedTextColor: string;
  isHighlighted: boolean;
  height: number; // height of tab bar element
  slantedEdgeAngle: number; // in degrees
  onClick: () => void;
}

class TopTabElement extends DisplayComponent<TopTabElementProps> {
  private triangleWidth = this.props.height * Math.tan((this.props.slantedEdgeAngle * Math.PI) / 180);

  private divRef = FSComponent.createRef<HTMLDivElement>();

  private textRef = FSComponent.createRef<HTMLSpanElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.divRef.instance.addEventListener('click', this.props.onClick);

    if (this.props.isHighlighted) {
      this.textRef.instance.style.color = '#00ff00';
    } else if (this.props.isSelected) {
      this.textRef.instance.style.color = this.props.selectedTextColor;
    } else {
      this.textRef.instance.style.color = 'white;';
    }
  }

  destroy(): void {
    this.divRef.instance.removeEventListener('click', this.props.onClick);

    super.destroy();
  }

  render(): VNode {
    return (
      <div ref={this.divRef} class={`mfd-top-tab-navigator-bar-element-outer${this.props.isSelected ? ' active' : ''}`}>
        <svg height={this.props.height} width={this.triangleWidth}>
          <polygon
            points={`0,${this.props.height} ${this.triangleWidth},0 ${this.triangleWidth},${this.props.height}`}
            style={`fill:${this.props.isSelected ? '#000000' : '#3c3c3c'};`}
          />
          <line
            x1="0"
            y1={this.props.height}
            x2={this.triangleWidth}
            y2="0"
            style="stroke: lightgrey; stroke-width:2"
          />
          {!this.props.isSelected && (
            <line
              x1="0"
              y1={this.props.height - 1}
              x2={this.triangleWidth}
              y2={this.props.height - 1}
              style="stroke: lightgrey; stroke-width:2"
            />
          )}
        </svg>
        <span
          ref={this.textRef}
          class={`mfd-top-tab-navigator-bar-element-label${this.props.isSelected ? ' active' : ''}`}
          // eslint-disable-next-line max-len
          style={`font-size: ${Math.floor(this.props.height * 0.55)}px;`}
        >
          {this.props.title}
        </span>
        <svg height={this.props.height} width={this.triangleWidth}>
          <polygon
            points={`0,0 ${this.triangleWidth},${this.props.height} 0,${this.props.height}`}
            style={`fill:${this.props.isSelected ? '#000000' : '#3c3c3c'};`}
          />
          <line
            x1="0"
            y1="0"
            x2={this.triangleWidth}
            y2={this.props.height}
            style="stroke: lightgrey; stroke-width:2"
          />
          {!this.props.isSelected && (
            <line
              x1="0"
              y1={this.props.height - 1}
              x2={this.triangleWidth}
              y2={this.props.height - 1}
              style="stroke: lightgrey; stroke-width:2"
            />
          )}
        </svg>
      </div>
    );
  }
}

interface TopTabNavigatorPageProps {
  isVisible?: Subscribable<boolean>;
  containerStyle?: string;
}

export class TopTabNavigatorPage extends DisplayComponent<TopTabNavigatorPageProps> {
  private topDivRef = FSComponent.createRef<HTMLDivElement>();

  private isVisible = false;

  public getVisibility(): boolean {
    return this.isVisible;
  }

  public setVisibility(value: boolean) {
    this.isVisible = value;

    if (this.topDivRef.instance !== undefined) {
      this.topDivRef.instance.style.display = value ? 'flex' : 'none';
    }
  }

  render(): VNode {
    return (
      <div ref={this.topDivRef} class="mfd-top-tab-navigator-tab-content" style={this.props.containerStyle}>
        {this.props.children}
      </div>
    );
  }
}

interface TopTabNavigatorProps {
  pageTitles: Subscribable<string[]>;
  selectedPageIndex: Subject<number>;
  selectedTabTextColor?: string;
  /** in pixels */
  tabBarHeight?: number;
  /** in degrees, vertical line equals 0° */
  tabBarSlantedEdgeAngle?: number;
  /** in pixels */
  additionalRightSpace?: number;
  /** Index of tab to be highlighted with green text color instead of white (e.g. used for PERF page) */
  highlightedTab?: Subscribable<number>;
  pageChangeCallback?: (index: number) => void;
}

/*
 * Container for multiple tabs, with tab navigation at the top. Pages are instantiated as children of the component, as TopTabElement
 */
export class TopTabNavigator extends DisplayComponent<TopTabNavigatorProps> {
  private navigatorBarRef = FSComponent.createRef<HTMLDivElement>();

  constructor(props: TopTabNavigatorProps) {
    super(props);

    if (this.props.pageTitles.get().length !== this.props.children?.length) {
      console.error('Number of TopTabNavigator children is not equal to number of elements in pageTitles array.');
    }

    // Set visibility for pages and check whether TopTabNavigator only has TopTabNavigatorPage elements as children
    const nodes = FSComponent.createChildNodes(<></>, this.props.children ?? []);
    nodes?.forEach((page, index) => {
      if (page.instance instanceof TopTabNavigatorPage) {
        page.instance.setVisibility(index === this.props.selectedPageIndex.get());
      } else {
        console.error('Discovered child of TopTabNavigator which is not an instance of TopTabNavigatorPage.');
      }
    });
  }

  onPageChange(newIndex: number): void {
    if (this.props.pageChangeCallback) {
      this.props.pageChangeCallback(newIndex);
    } else {
      this.props.selectedPageIndex.set(newIndex);
    }
  }

  populateElements(node: VNode, selectedTab: number): void {
    // Clear children nodes of top navigation bar
    while (this.navigatorBarRef.instance.firstChild) {
      this.navigatorBarRef.instance.removeChild(this.navigatorBarRef.instance.firstChild);
    }

    // Re-set visibility for pages
    const nodes = FSComponent.createChildNodes(node, this.props.children ?? []);
    nodes?.forEach((page, index) => {
      if (page.instance instanceof TopTabNavigatorPage) {
        page.instance.setVisibility(index === selectedTab);
      }
    });

    // Re-populate top navigation bar
    this.props.pageTitles.get().forEach((pageTitle, index) => {
      FSComponent.render(
        <TopTabElement
          title={pageTitle}
          isSelected={selectedTab === index}
          height={this.props.tabBarHeight || 36}
          slantedEdgeAngle={this.props.tabBarSlantedEdgeAngle || 10}
          selectedTextColor={this.props.selectedTabTextColor || 'white'}
          onClick={() => this.onPageChange(index)}
          isHighlighted={this.props.highlightedTab ? this.props.highlightedTab?.get() === index : false}
        />,
        this.navigatorBarRef.instance,
      );
    });

    // Add space at end, if any
    if (this.props.additionalRightSpace && this.props.additionalRightSpace > 0) {
      const div = document.createElement('div');
      div.style.width = `${this.props.additionalRightSpace}px`;
      div.style.borderBottom = '2px solid lightgray';
      this.navigatorBarRef.instance.appendChild(div);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.selectedPageIndex.sub((value) => {
      this.populateElements(node, value);
    }, true);

    if (this.props.highlightedTab) {
      this.props.highlightedTab.sub(() => this.populateElements(node, this.props.selectedPageIndex.get()));
    }
  }

  render(): VNode {
    return (
      <div class="mfd-top-tab-navigator-container">
        <div
          class="mfd-top-tab-navigator-bar"
          ref={this.navigatorBarRef}
          style={`height: ${this.props.tabBarHeight || 36}px`}
        >
          {this.props.pageTitles.get().map((pageTitle, index) => (
            <TopTabElement
              title={pageTitle}
              isSelected={this.props.selectedPageIndex.get() === index}
              height={this.props.tabBarHeight || 36}
              slantedEdgeAngle={this.props.tabBarSlantedEdgeAngle || 10}
              selectedTextColor={this.props.selectedTabTextColor || 'white'}
              onClick={() => this.onPageChange(index)}
              isHighlighted={false}
            />
          ))}
          <div
            style={`width: ${this.props.additionalRightSpace ? this.props.additionalRightSpace : '0'}px; border-bottom: 2px solid lightgray`}
          />
        </div>
        {this.props.children}
      </div>
    );
  }
}
