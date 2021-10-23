/* eslint-disable max-len */
import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight } from '@tabler/icons';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
    ChartProvider,
    editPinnedChart,
    editTabProperty,
    NavigationTab,
    PinnedChart, removedPinnedChart,
    setBoundingBox,
    setProvider,
    setSelectedNavigationTabIndex,
} from '../../Store/features/navigationPage';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { pathify } from '../../Utils/routing';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

const getTagColor = (tagName?: string) => {
    switch (tagName) {
    case 'STAR': return 'text-utility-green';
    case 'APP': return 'text-utility-orange';
    case 'TAXI': return 'text-[#5280EA]';
    case 'SID': return 'text-utility-pink';
    case 'REF': return 'text-utility-purple';
    default: return 'text-theme-text';
    }
};

interface PinnedChartCardProps {
    pinnedChart: PinnedChart;
    className: string;
}

export const PinnedChartCard = ({ pinnedChart, className } : PinnedChartCardProps) => {
    const dispatch = useAppDispatch();

    const {
        provider,
        chartName,
        chartId,
        title,
        tabIndex,
        pagesViewable,
        boundingBox,
        tag,
        subTitle,
        pageIndex,
    } = pinnedChart;

    const tab = NavigationTab[provider];

    return (
        <Link
            to={`/navigation/${pathify(provider)}`}
            className={`relative flex flex-col flex-wrap px-2 pt-3 pb-2 bg-theme-accent rounded-md overflow-hidden ${className}`}
            onClick={() => {
                dispatch(editTabProperty({ tab, chartDimensions: { width: undefined, height: undefined } }));
                dispatch(editTabProperty({ tab, chartLinks: { light: '', dark: '' } }));
                dispatch(editTabProperty({ tab, chartName }));
                dispatch(editTabProperty({ tab, chartId }));
                dispatch(editTabProperty({ tab, searchQuery: title }));
                dispatch(editTabProperty({ tab, selectedTabIndex: tabIndex }));
                dispatch(editTabProperty({ tab, chartRotation: 0 }));
                dispatch(editTabProperty({ tab, currentPage: 1 }));
                dispatch(setBoundingBox(undefined));
                dispatch(editPinnedChart({
                    chartId,
                    timeAccessed: Date.now(),
                }));
                dispatch(editTabProperty({ tab, pagesViewable }));
                dispatch(setBoundingBox(boundingBox));
                dispatch(setSelectedNavigationTabIndex(pageIndex));
                dispatch(setProvider(provider));
            }}
        >
            <div className={`${getTagColor(tag)} bg-current h-1.5 w-full inset-x-0 absolute top-0`} />
            <h2 className="font-bold break-all">
                {title}
                {' '}
                <div className="inline-block text-theme-unselected">{tag}</div>
            </h2>
            <p className="mt-2 font-inter">{subTitle}</p>
            <IconArrowRight className={`mt-auto ml-auto ${getTagColor(tag)}`} />
        </Link>
    );
};

export enum PinSort {
    NONE,
    LAST_ACCESSED,
    FIRST_ACCESSED,
    ALPHABETICAL_FIRST_LAST,
    ALPHABETICAL_LAST_FIRST
}

export const PinnedChartUI = () => {
    const dispatch = useAppDispatch();

    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);
    const { searchQuery, chartTypeIndex, selectedProviderIndex, sortTypeIndex, editMode } = useAppSelector((state) => state.navigationTab[NavigationTab.PINNED_CHARTS]);

    const providerTabs: {name: string, provider: ChartProvider | 'ALL'}[] = [
        { name: 'All', provider: 'ALL' },
        { name: 'Local Files', provider: ChartProvider.LOCAL_FILES },
        { name: 'Navigraph', provider: ChartProvider.NAVIGRAPH },
    ];

    const filterTabs = {
        0: ['IMAGE', 'PDF', 'BOTH'],
        1: ['STAR', 'APP', 'TAXI', 'SID', 'REF', 'ALL'],
    }[selectedProviderIndex] ?? [];

    const providerCharts = pinnedCharts.filter((pinnedChart) => {
        const selectedProvider = providerTabs[selectedProviderIndex].provider;

        if (selectedProvider === 'ALL') {
            return true;
        }

        return pinnedChart.provider === selectedProvider;
    });

    const filteredCharts = providerCharts.filter((pinnedChart) => {
        const filterItem = filterTabs[chartTypeIndex];

        const selectedProvider = providerTabs[selectedProviderIndex].provider;

        if (selectedProvider === ChartProvider.LOCAL_FILES) {
            if (filterItem === 'BOTH') {
                return true;
            }

            return pinnedChart.tag === filterItem;
        }

        if (selectedProvider === ChartProvider.NAVIGRAPH) {
            if (filterItem === 'ALL') {
                return true;
            }

            return pinnedChart.tag === filterItem;
        }

        // ALL
        return true;
    });

    const searchedCharts = filteredCharts.filter((pinnedChart) => {
        const { title, subTitle } = pinnedChart;

        return title.toUpperCase().includes(searchQuery) || subTitle.toUpperCase().includes(searchQuery);
    });

    const sortedCharts = searchedCharts.sort((a, b) => {
        switch (sortTypeIndex) {
        case PinSort.NONE:
            return 0;
        case PinSort.FIRST_ACCESSED:
            return a.timeAccessed - b.timeAccessed;
        case PinSort.LAST_ACCESSED:
            return b.timeAccessed - a.timeAccessed;
        case PinSort.ALPHABETICAL_FIRST_LAST:
            return (a.title + a.subTitle).localeCompare(b.title + b.subTitle);
        case PinSort.ALPHABETICAL_LAST_FIRST:
            return (b.title + b.subTitle).localeCompare(a.title + a.subTitle);
        default: return 0;
        }
    });

    return (
        <div className="p-4 space-y-4 h-content-section-reduced rounded-lg border-2 border-theme-accent">
            <div className="space-y-4">
                {/* FIXME: The spacex4 is causing the keyboard to be shifted as well */}
                <div className="flex flex-row items-center space-x-4">
                    <SimpleInput
                        placeholder="SEARCH"
                        className="flex-grow uppercase"
                        value={searchQuery}
                        onChange={(value) => dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, searchQuery: value.toUpperCase() }))}
                    />

                    <TooltipWrapper text="Change Chart Provider">
                        <SelectInput
                            className="w-48"
                            options={providerTabs.map(({ name }, index) => ({ displayValue: name, value: index }))}
                            value={selectedProviderIndex}
                            onChange={(value) => dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, selectedProviderIndex: value as number }))}
                        />
                    </TooltipWrapper>

                    <SelectGroup>
                        <SelectItem
                            selected={!editMode}
                            onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, editMode: false }))}
                        >
                            View
                        </SelectItem>
                        <SelectItem
                            selected={editMode}
                            onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, editMode: true }))}
                        >
                            Edit
                        </SelectItem>
                    </SelectGroup>
                </div>

                <div className="flex flex-row space-x-4 w-full">
                    {filterTabs.length ? (
                        <SelectGroup className="flex-grow">
                            {filterTabs.map((tabName, index) => (
                                <SelectItem
                                    className="w-full"
                                    selected={chartTypeIndex === index}
                                    onSelect={() => {
                                        dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, chartTypeIndex: index }));
                                    }}
                                >
                                    {tabName}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    ) : (
                        <div className="flex flex-grow justify-center items-center py-2 px-6 rounded-md border border-theme-accent">
                            Showing Charts from All Providers
                        </div>
                    )}

                    <TooltipWrapper text="Change Chart Sort Method">
                        <SelectInput
                            className="w-64"
                            options={[
                                { displayValue: 'None', value: PinSort.NONE },
                                { displayValue: 'First Accessed', value: PinSort.FIRST_ACCESSED },
                                { displayValue: 'Last Accessed', value: PinSort.LAST_ACCESSED },
                                { displayValue: 'Alphabetical - A -> Z', value: PinSort.ALPHABETICAL_FIRST_LAST },
                                { displayValue: 'Alphabetical - Z -> A', value: PinSort.ALPHABETICAL_LAST_FIRST },
                            ]}
                            value={sortTypeIndex}
                            onChange={(value) => dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, sortTypeIndex: value as PinSort }))}
                        />
                    </TooltipWrapper>

                </div>
            </div>

            {searchedCharts.length > 0 ? (
                <ScrollableContainer height={44}>
                    <div className="grid grid-cols-4 auto-rows-auto">
                        {sortedCharts.map((pinnedChart, index) => (
                            <div className={`${index && index % 4 !== 0 && 'ml-4'} ${index >= 4 && 'mt-4'} flex flex-col`}>
                                {editMode && (
                                    <div
                                        className="py-3 w-full font-bold text-center text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body rounded-t-md border-2 border-utility-red transition duration-100"
                                        onClick={() => {
                                            dispatch(removedPinnedChart({ chartId: pinnedChart.chartId }));
                                        }}
                                    >
                                        DELETE
                                    </div>
                                )}
                                <PinnedChartCard
                                    pinnedChart={pinnedChart}
                                    className={`${editMode && 'rounded-t-none'} h-full`}
                                />
                            </div>
                        ))}
                    </div>
                </ScrollableContainer>
            ) : (
                <div className="flex justify-center items-center rounded-lg border-2 border-theme-accent" style={{ height: '44rem' }}>
                    No Items Found
                </div>
            )}
        </div>
    );
};
