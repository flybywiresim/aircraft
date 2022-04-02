import React, { useRef, useState } from 'react';
import { Route, Redirect, useHistory } from 'react-router-dom';

export interface PageLink {
    name: string;
    alias?: string;
    component: JSX.Element;
}

interface PageRouteProps {
    basePath: string;
    tabs: PageLink[];
}

export const pathify = (alias: string): string => alias.toLowerCase().replace(/[^a-z0-9]/gi, '-');

export const TabRoutes = ({ basePath, tabs }: PageRouteProps) => {
    const [routes] = useState(() => tabs.map((tab) => (
        <Route path={`${basePath}/${pathify(tab.name)}`} component={() => tab.component} />
    )));

    return (
        <>
            { routes }
        </>
    );
};

type HistoryEntry = {pathname: string, search: string, hash: string, state: any, key: string};

export const findLatestSeenPathname = (history: any, basePath: string): string | undefined => {
    // @ts-ignore
    const historyEntries: HistoryEntry[] = history.entries;

    const lastSeenPathname = [...historyEntries].reverse().find(({ pathname }) => pathname.includes(`${basePath}/`))?.pathname;

    return lastSeenPathname;
};

export const PageRedirect = ({ basePath, tabs }: PageRouteProps) => {
    const history = useHistory();
    const redirectPathname = useRef((() => findLatestSeenPathname(history, basePath) ?? `${basePath}/${pathify(tabs[0].name)}`)());

    return (
        <Route exact path={basePath}>
            <Redirect to={redirectPathname.current} />
        </Route>
    );
};
