import React from 'react';
import { useHistory } from 'react-router-dom';

import { Navbar } from '../Components/Navbar';
import TODCalculator from '../TODCalculator/TODCalculator';
import LandingWidget from './Widgets/LandingWidget';
import { TabRoutes, PageLink, pathify, PageRedirect } from '../Utils/routing';

const tabs: PageLink[] = [
    { name: 'Top of Descent', component: <TODCalculator /> },
    { name: 'Landing', component: <LandingWidget /> },
];

export const Performance = () => {
    const history = useHistory();

    return (
        <div className="w-full">
            <div className="relative">
                <h1 className="font-bold ">Performance</h1>
                <Navbar
                    className="absolute top-0 right-0"
                    tabs={tabs.map((tab) => tab.name)}
                    onSelected={(index) => {
                        history.push(`/performance/${pathify(tabs[index].name)}`);
                    }}
                />
            </div>
            <div className="mt-6">
                <PageRedirect basePath="/performance" tabs={tabs} />
                <TabRoutes basePath="/performance" tabs={tabs} />
            </div>
        </div>
    );
};
