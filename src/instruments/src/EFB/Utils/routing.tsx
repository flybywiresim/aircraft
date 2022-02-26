import React, { useRef, useState } from 'react';
import { Route, Redirect, useHistory } from 'react-router-dom';

export interface PageLink {
    name: string;
    component: JSX.Element;
}

interface PageRouteProps {
    basePath: string;
    tabs: PageLink[];
}

export const pathify = (alias: string): string => alias.toLowerCase().replace(/\s/g, '-');

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

export const PageRedirect = ({ basePath, tabs }: PageRouteProps) => {
    const history = useHistory();
    const redirectPathname = useRef((() => {
        // @ts-ignore
        const historyEntries: {pathname: string, search: string, hash: string, state: any, key: string}[] = history.entries;

        const lastSeenPathname = [...historyEntries].reverse().find(({ pathname }) => pathname.includes(`${basePath}/`))?.pathname;

        return lastSeenPathname ?? `${basePath}/${pathify(tabs[0].name)}`;
    })());

    return (
        <Route exact path={basePath}>
            <Redirect to={redirectPathname.current} />
        </Route>
    );
};
