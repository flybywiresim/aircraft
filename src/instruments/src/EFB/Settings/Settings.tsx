import React, { FC, useEffect, useRef, useState } from 'react';

import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';

import { ArrowLeft, ChevronRight } from 'react-bootstrap-icons';
import { AircraftOptionsPinProgramsPage } from './Pages/AircraftOptionsPinProgramsPage';
import { SimOptionsPage } from './Pages/SimOptionsPage';
import { AtsuAocPage } from './Pages/AtsuAocPage';
import { AudioPage } from './Pages/AudioPage';
import { FlyPadPage } from './Pages/FlyPadPage';

export type ButtonType = {
    name: string,
    setting: string,
}

interface PageLink {
    name: string,
    component: JSX.Element,
}

type SelectionTabsProps = {
    tabs: PageLink[],
}

export const SelectionTabs = ({ tabs }: SelectionTabsProps) => (
    <div className="space-y-6">
        {
            tabs.map((tab) => (
                <Link
                    to={`settings/${tab.name.toLowerCase().replace(/\s/g, '-')}`}
                    className="flex justify-between items-center p-6 rounded-md hover:shadow-lg transition duration-100 bg-theme-secondary"
                >
                    <p className="text-2xl">{tab.name}</p>
                    <ChevronRight size={30} />
                </Link>
            ))
        }
    </div>
);

export const Settings = () => {
    const tabs: PageLink[] = [
        { name: 'Aircraft Options / Pin Programs', component: <AircraftOptionsPinProgramsPage /> },
        { name: 'Sim Options', component: <SimOptionsPage /> },
        { name: 'ATSU / AOC', component: <AtsuAocPage /> },
        { name: 'Audio', component: <AudioPage /> },
        { name: 'flyPad', component: <FlyPadPage /> },
    ];

    return (
        <div className="w-full h-efb">
            <Switch>
                <Route exact path="/settings">
                    <h1 className="mb-4 font-bold">Settings</h1>
                    <SelectionTabs tabs={tabs} />
                </Route>
                {tabs.map((tab) => (
                    <Route path={`/settings/${tab.name.toLowerCase().replace(/\s/g, '-')}`}>
                        {tab.component}
                    </Route>
                ))}
            </Switch>
        </div>
    );
};

type SettingsPageProps = {
    name: string,
}

export const SettingsPage: FC<SettingsPageProps> = ({ name, children }) => {
    const [contentOverflows, setContentOverflows] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const position = useRef({ top: 0, y: 0 });

    useEffect(() => {
        if (contentRef.current) {
            if (contentRef.current.clientHeight > 53 * parseFloat(getComputedStyle(document.documentElement).fontSize)) {
                setContentOverflows(true);
            }
        }
    }, []);

    const handleMouseDown = (event: React.MouseEvent) => {
        position.current.top = containerRef.current ? containerRef.current.scrollTop : 0;
        position.current.y = event.clientY;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (event: MouseEvent) => {
        const dy = event.clientY - position.current.y;
        if (containerRef.current) {
            containerRef.current.scrollTop = position.current.top - dy;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    return (
        <div>
            <Link to="/settings" className="inline-block mb-4">
                <div className="flex flex-row items-center space-x-3 transition duration-100 hover:text-theme-highlight">
                    <ArrowLeft size={30} />
                    <h1 className="font-bold text-current">
                        Settings -
                        {name}
                    </h1>
                </div>
            </Link>
            <div className="py-2 px-6 w-full rounded-lg border-2 shadow-md h-efb border-theme-accent">
                {/* TODO: replace with JIT value */}
                <div
                    className={`w-full ${contentOverflows && 'overflow-y-scroll'} scrollbar`}
                    style={{ height: '53rem' }}
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                >
                    <div className={`divide-y-2 divide-theme-accent ${contentOverflows && 'mr-6'}`} ref={contentRef}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

type SettingItemProps = {
    name: string,
    unrealistic?: boolean,
    disabled?: boolean
}

export const SettingItem: FC<SettingItemProps> = ({ name, unrealistic, disabled, children }) => (
    <div className="flex flex-row justify-between items-center py-4">
        <p>
            {name}
            {unrealistic && <span className="ml-2 text-theme-highlight"> (Unrealistic)</span>}
        </p>

        <div className={`${disabled && 'pointer-events-none filter grayscale'}`}>
            {children}
        </div>
    </div>
);
