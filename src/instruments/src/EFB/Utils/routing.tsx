import React, { useState } from 'react';
import { Route, Redirect } from 'react-router-dom';

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

export const PageRedirect = ({ basePath, tabs }: PageRouteProps) => (
    <Route exact path={basePath}>
        <Redirect to={`${basePath}/${pathify(tabs[0].name)}`} />
    </Route>
);
