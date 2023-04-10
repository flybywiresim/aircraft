/* eslint-disable jsx-a11y/label-has-associated-control */
import { DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import './common.scss';

interface TopTabElementProps {
    title: string;
    isSelected: boolean;
}

class TopTabElement extends DisplayComponent<TopTabElementProps> {
    render(): VNode {
        return (
            <div class={`MFDTopTabNavigatorBarElementOuter${this.props.isSelected === true ? ' active' : ''}`}>
                <svg height="36" width="6.35">
                    <polygon points="0,36 6.35,0 6.35,36" style={`fill:${this.props.isSelected === true ? '#040405' : '#3c3c3c'};`} />
                    <line x1="0" y1="36" x2="6.35" y2="0" style="stroke: lightgrey; stroke-width:2" />
                    {this.props.isSelected === false && <line x1="0" y1="35" x2="6.35" y2="35" style="stroke: lightgrey; stroke-width:2" />}
                </svg>
                <span class={`MFDTopTabNavigatorBarElementLabel${this.props.isSelected === true ? ' active' : ''}`}>{this.props.title}</span>
                <svg height="36" width="6.35">
                    <polygon points="0,0 6.35,36 0,36" style={`fill:${this.props.isSelected === true ? '#040405' : '#3c3c3c'};`} />
                    <line x1="0" y1="0" x2="6.35" y2="36" style="stroke: lightgrey; stroke-width:2" />
                    {this.props.isSelected === false && <line x1="0" y1="35" x2="6.35" y2="35" style="stroke: lightgrey; stroke-width:2" />}
                </svg>
            </div>
        );
    }
}

interface TopTabNavigatorPageProps {
    isVisible?: Subscribable<boolean>;
}

export class TopTabNavigatorPage extends DisplayComponent<TopTabNavigatorPageProps> {
    private topDivRef = FSComponent.createRef<HTMLDivElement>();

    private isVisible = false;

    public getVisibility() : boolean {
        return this.isVisible;
    }

    public setVisibility(value: boolean) {
        this.isVisible = value;

        if (this.topDivRef.instance !== undefined) {
            this.topDivRef.instance.style.display = value === true ? 'block' : 'none';
        }
    }

    render(): VNode {
        return (
            <div ref={this.topDivRef} class="MFDTopTabNavigatorTabContent">
                {this.props.children}
            </div>
        );
    }
}

interface TopTabNavigatorProps {
    pageTitles: Subscribable<string[]>;
    selectedPageIndex: Subscribable<number>;
}

export class TopTabNavigator extends DisplayComponent<TopTabNavigatorProps> {
    private navigatorBarRef = FSComponent.createRef<HTMLDivElement>();

    constructor(props: TopTabNavigatorProps) {
        super(props);

        if (this.props.pageTitles.get().length !== this.props.children.length) {
            console.error('Number of TopTabNavigator children is not equal to number of elements in pageTitles array.');
        }

        // Set visibility for pages and check whether TopTabNavigator only has TopTabNavigatorPage elements as children
        const nodes = FSComponent.createChildNodes(null, this.props.children);
        nodes.forEach((page, index) => {
            if (page.instance instanceof TopTabNavigatorPage) {
                page.instance.setVisibility(index === this.props.selectedPageIndex.get());
            } else {
                console.error('Discovered one children of TopTabNavigator which is not an instance of TopTabNavigatorPage.');
            }
        });
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.selectedPageIndex.sub((value) => {
            // Clear children nodes of top navigation bar
            while (this.navigatorBarRef.instance.firstChild) {
                this.navigatorBarRef.instance.removeChild(this.navigatorBarRef.instance.firstChild);
            }

            // Re-set visibility for pages
            const nodes = FSComponent.createChildNodes(node, this.props.children);
            nodes.forEach((page, index) => {
                if (page.instance instanceof TopTabNavigatorPage) {
                    page.instance.setVisibility(index === value);
                }
            });

            // Re-populate top navigation bar
            this.props.pageTitles.get().forEach((pageTitle, index) => {
                FSComponent.render(<TopTabElement title={pageTitle} isSelected={(value === index)} />, this.navigatorBarRef.instance);
            });
        });
    }

    render(): VNode {
        return (
            <div class="MFDTopTabNavigatorContainer">
                <div class="MFDTopTabNavigatorBar" ref={this.navigatorBarRef}>
                    {this.props.pageTitles.get().map((pageTitle, index) => <TopTabElement title={pageTitle} isSelected={(this.props.selectedPageIndex.get() === index)} />)}
                </div>
                {this.props.children}
            </div>
        );
    }
}
