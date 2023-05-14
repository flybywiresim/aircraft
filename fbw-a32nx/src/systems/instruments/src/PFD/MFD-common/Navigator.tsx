/* eslint-disable jsx-a11y/label-has-associated-control */
import { DisplayComponent, FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import './style.scss';
import { ActiveUriInformation } from 'instruments/src/PFD/MFD';

interface NavigatorPageProps {
    component: VNode;
    uri: string;
    isVisible?: Subscribable<boolean>;
}

export class NavigatorPage extends DisplayComponent<NavigatorPageProps> {
    private topDivRef = FSComponent.createRef<HTMLDivElement>();

    private isVisible = false;

    public getVisibility() : boolean {
        return this.isVisible;
    }

    public setVisibility(value: boolean) {
        this.isVisible = value;

        if (this.topDivRef.instance !== undefined) {
            this.topDivRef.instance.style.display = value === true ? 'flex' : 'none';
        }
    }

    render(): VNode {
        return (
            <div ref={this.topDivRef} class="MFDNavigatorContent">
                {this.props.component}
            </div>
        );
    }
}

interface NavigatorProps {
    active: Subscribable<ActiveUriInformation>;
    pageChangeCallback?: (index: number) => void;
}

export class Navigator extends DisplayComponent<NavigatorProps> {
    private navigatorBarRef = FSComponent.createRef<HTMLDivElement>();

    constructor(props: NavigatorProps) {
        super(props);

        // Set visibility for pages and check whether TopTabNavigator only has TopTabNavigatorPage elements as children
        const nodes = FSComponent.createChildNodes(null, this.props.children);
        nodes.forEach((page) => {
            if (page.instance instanceof NavigatorPage) {
                page.instance.setVisibility(page.instance.props.uri === this.props.active.get().uri);
            } else {
                console.error('Discovered child of Navigator which is not an instance of NavigatorPage.');
            }
        });
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.active.sub((value) => {
            // Clear children nodes of top navigation bar
            while (this.navigatorBarRef.instance.firstChild) {
                this.navigatorBarRef.instance.removeChild(this.navigatorBarRef.instance.firstChild);
            }

            // Re-set visibility for pages
            const nodes = FSComponent.createChildNodes(node, this.props.children);
            nodes.forEach((page) => {
                if (page.instance instanceof NavigatorPage) {
                    page.instance.setVisibility(page.instance.props.uri === value.uri);
                }
            });
        });
    }

    render(): VNode {
        return (
            <div class="MFDNavigatorContainer">
                {this.props.children}
            </div>
        );
    }
}
