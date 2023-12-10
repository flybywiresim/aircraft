import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { PageNumber } from '../shared/common';
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

export type Pages = [page: PageNumber, component: DisplayComponent<any>][]

interface MainPageProps extends ComponentProps {
    activePage: Subject<PageNumber>;
}

interface PagerProps extends ComponentProps {
    activePage: Subject<PageNumber>;
    pages: Pages;
    class?: string;
}

interface PageWrapperProps extends ComponentProps {
    isVisible: Subscribable<Boolean>;
}

export class MainPage extends DisplayComponent<MainPageProps> {
    private readonly pages: [page: PageNumber, component: DisplayComponent<any>][] = [
        [PageNumber.Dashboard, <Dashboard />],
        [PageNumber.Dispatch, <Dispatch />],
        [PageNumber.Ground, <Ground />],
        [PageNumber.Performance, <Performance />],
        [PageNumber.Navigation, <Navigation />],
        [PageNumber.ATC, <ATC />],
        [PageNumber.Failures, <Failures />],
        [PageNumber.Checklists, <Checklists />],
        [PageNumber.Presets, <Presets />],
        [PageNumber.Settings, <Settings />],
    ]

    render(): VNode {
        return (
            <Pager pages={this.pages} activePage={this.props.activePage} class="mt-10  pr-6 pt-4" />
        );
    }
}

export class Pager extends DisplayComponent<PagerProps> {
    private readonly pageVisibility = (page: PageNumber) => this.props.activePage.map((value) => value === page);

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
