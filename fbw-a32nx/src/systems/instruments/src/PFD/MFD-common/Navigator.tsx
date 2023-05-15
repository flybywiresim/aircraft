/* eslint-disable jsx-a11y/label-has-associated-control */
import { DisplayComponent, FSComponent, NodeReference, RenderPosition, Subscribable, VNode } from '@microsoft/msfs-sdk';
import './style.scss';
import { ActiveUriInformation } from 'instruments/src/PFD/MFD';

interface NavigatorPageProps {
    component: VNode;
    uri: string;
}

export class NavigatorPage extends DisplayComponent<NavigatorPageProps> {
    private topDivRef = FSComponent.createRef<HTMLDivElement>();

    private thisNode?: VNode;

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.thisNode = node;
    }

    destroy(): void {
        this.topDivRef.instance.removeChild(this.topDivRef.instance.firstChild);
        if (this.props.component.instance instanceof DisplayComponent) {
            this.props.component.instance.destroy();
        }
        FSComponent.shallowDestroy(this.props.component);
        FSComponent.shallowDestroy(this.thisNode);

        super.destroy();
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
    private refs = [] as NodeReference<NavigatorPage>[];

    private activePage: VNode = null;

    private navigatorRef = FSComponent.createRef<HTMLDivElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        // Render only desired page
        const nodes = FSComponent.createChildNodes(node, this.props.children);
        nodes.forEach((page) => {
            if (page.instance instanceof NavigatorPage && page.instance.props.uri === this.props.active.get().uri) {
                FSComponent.render(page, this.navigatorRef.instance, RenderPosition.In);
                this.activePage = page;
            }
        });

        this.props.active.sub((value) => {
            if (this.activePage.instance instanceof NavigatorPage) {
                this.navigatorRef.instance.removeChild(this.navigatorRef.instance.firstChild);
                this.activePage.instance.destroy();
            }

            // Render only desired page
            const nodes = FSComponent.createChildNodes(node, this.props.children);
            nodes.forEach((page) => {
                if (page.instance instanceof NavigatorPage && page.instance.props.uri === value.uri) {
                    FSComponent.render(page, this.navigatorRef.instance, RenderPosition.In);
                    this.activePage = page;
                }
            });
        });
    }

    render(): VNode {
        return (
            <div ref={this.navigatorRef} class="MFDNavigatorContainer" />
        );
    }
}
