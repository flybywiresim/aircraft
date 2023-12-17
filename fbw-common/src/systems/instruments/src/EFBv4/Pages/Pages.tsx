import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { PageEnum } from '../shared/common';
import { Dashboard } from './Dashboard/Dashboard';
import { Dispatch } from './Dispatch/Dispatch';
import { Ground } from './Ground/Ground';
import { Performance } from './Performance/Performance';
import { Navigation } from './Navigation/Navigation';
import { ATC } from './ATC/ATC';
import { Failures } from './Failures/Failures';
import { Checklists } from './Checklists/Checklists';
import { Presets } from './Presets/Presets';
import { Settings } from './Settings/Settings';

// Page should be an enum
export type Pages = [page: number, component: DisplayComponent<any>][]

interface MainPageProps extends ComponentProps {
    activePage: Subject<number>;

    pongText: Subscribable<string>;
}

export class MainPage extends DisplayComponent<MainPageProps> {
    private readonly pages: [page: number, component: DisplayComponent<any>][] = [
        [PageEnum.MainPage.Dashboard, <Dashboard pongText={this.props.pongText} />],
        [PageEnum.MainPage.Dispatch, <Dispatch />],
        [PageEnum.MainPage.Ground, <Ground />],
        [PageEnum.MainPage.Performance, <Performance />],
        [PageEnum.MainPage.Navigation, <Navigation />],
        [PageEnum.MainPage.ATC, <ATC />],
        [PageEnum.MainPage.Failures, <Failures />],
        [PageEnum.MainPage.Checklists, <Checklists />],
        [PageEnum.MainPage.Presets, <Presets />],
        [PageEnum.MainPage.Settings, <Settings />],
    ]

    render(): VNode {
        return (
            <Pager pages={this.pages} activePage={this.props.activePage} class="mt-10  pr-6 pt-4" />
        );
    }
}

interface PagerProps extends ComponentProps {
    activePage: Subscribable<number>;
    pages: Pages;
    class?: string;
}

export class Pager extends DisplayComponent<PagerProps> {
    private readonly pageVisibility = (page: number) => this.props.activePage.map((value) => value === page);

    render(): VNode {
        return (
            <div class={`h-full w-full ${this.props.class}`}>
                {
                    this.props.pages.map(([page, component]) => (
                        <PageWrapper isVisible={this.pageVisibility(page)}>
                            {component}
                        </PageWrapper>
                    ))
                }
            </div>
        );
    }
}

interface PageWrapperProps extends ComponentProps {
    isVisible: Subscribable<Boolean>;
}

export class PageWrapper extends DisplayComponent<PageWrapperProps> {
    render(): VNode {
        return (
            <div style={{
                display: this.props.isVisible.map((value) => (value ? 'block' : 'none')),
                width: '100%',
                height: '100%',
            }}
            >
                {this.props.children}
            </div>
        );
    }
}
