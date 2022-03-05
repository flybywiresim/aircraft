/* eslint-disable max-len */
import React, { useState } from 'react';
import { IconArrowRight } from '@tabler/icons';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
    ChartProvider, editPinnedChart, PinnedChart,
    setBoundingBox, setChartDimensions, setChartId,
    setChartLinks, setChartName, setChartRotation,
    setCurrentPage, setSearchQuery, setPagesViewable,
    setTabIndex, removedPinnedChart,
} from '../../Store/features/navigationPage';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { pathify } from '../../Utils/routing';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';

interface PinnedChartWidgetProps {
    pinnedChart: PinnedChart;
    className: string;
}

const getTagColor = (tagName?: string) => {
    switch (tagName) {
    case 'STAR': return 'text-colors-lime-500';
    case 'APP': return 'text-colors-orange-500';
    case 'TAXI': return 'text-colors-blue-500';
    case 'SID': return 'text-colors-pink-500';
    case 'REF': return 'text-colors-purple-500';
    default: return 'text-theme-text';
    }
};

export const PinnedChartWidget = ({ pinnedChart, className } : PinnedChartWidgetProps) => {
    const dispatch = useAppDispatch();

    const { provider, chartName, chartId, title, tabIndex, pagesViewable, boundingBox, tag, subTitle } = pinnedChart;

    return (
        <Link
            to={`/navigation/${pathify(provider)}`}
            className={`relative flex flex-col flex-wrap px-2 pt-3 pb-2 bg-theme-accent rounded-md overflow-hidden ${className}`}
            onClick={() => {
                dispatch(setChartDimensions({ width: undefined, height: undefined }));
                dispatch(setChartLinks({ light: '', dark: '' }));
                dispatch(setChartName(chartName));
                dispatch(setChartId(chartId));
                dispatch(setSearchQuery(title));
                dispatch(setTabIndex(tabIndex));
                dispatch(setChartRotation(0));
                dispatch(setCurrentPage(1));
                dispatch(setBoundingBox(undefined));
                dispatch(editPinnedChart({
                    chartId,
                    timeAccessed: Date.now(),
                }));
                dispatch(setPagesViewable(pagesViewable));
                dispatch(setBoundingBox(boundingBox));
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

export const PinnedChartUI = () => {
    const dispatch = useAppDispatch();

    const [editMode, setEditMode] = useState(false);
    const [subTabIndex, setSubTabIndex] = useState(0);

    const { pinnedCharts, tabIndex, searchQuery } = useAppSelector((state) => state.navigationTab);

    const providerTabs: {name: string, provider: ChartProvider | 'ALL'}[] = [
        { name: 'Local Files', provider: ChartProvider.LOCAL_FILES },
        { name: 'Navigraph', provider: ChartProvider.NAVIGRAPH },
        { name: 'All', provider: 'ALL' },
    ];

    const filterTabs = {
        0: ['IMAGE', 'PDF', 'BOTH'],
        1: ['STAR', 'APP', 'TAXI', 'SID', 'REF', 'ALL'],
    }[tabIndex] ?? [];

    const providerCharts = pinnedCharts.filter((pinnedChart) => {
        const selectedProvider = providerTabs[tabIndex].provider;

        if (selectedProvider === 'ALL') {
            return true;
        }

        return pinnedChart.provider === selectedProvider;
    });

    const filteredCharts = providerCharts.filter((pinnedChart) => {
        const filterItem = filterTabs[subTabIndex];

        const selectedProvider = providerTabs[tabIndex].provider;

        if (selectedProvider === 'LOCAL_FILES') {
            if (filterItem === 'BOTH') {
                return true;
            }

            return pinnedChart.tag === filterItem;
        }

        if (selectedProvider === 'NAVIGRAPH') {
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

    return (
        <div className="p-4 space-y-4 h-content-section-reduced rounded-lg border-2 border-theme-accent">
            <div className="space-y-4">
                {/* FIXME: The spacex4 is causing the keyboard to be shifted as well */}
                <div className="flex flex-row items-center space-x-4">
                    <SimpleInput
                        placeholder="SEARCH"
                        className="flex-grow"
                        value={searchQuery}
                        onChange={(value) => dispatch(setSearchQuery(value.toUpperCase()))}
                    />

                    <SelectInput
                        className="w-48"
                        options={providerTabs.map(({ name }, index) => ({ displayValue: name, value: index }))}
                        onChange={(value) => dispatch(setTabIndex(value as number))}
                    />

                    <SelectGroup>
                        <SelectItem selected={!editMode} onSelect={() => setEditMode(false)}>
                            View
                        </SelectItem>
                        <SelectItem selected={editMode} onSelect={() => setEditMode(true)}>
                            Edit
                        </SelectItem>
                    </SelectGroup>
                </div>

                <SelectGroup>
                    {filterTabs.map((tabName, index) => (
                        <SelectItem
                            className="w-full"
                            selected={subTabIndex === index}
                            onSelect={() => {
                                setSubTabIndex(index);
                            }}
                        >
                            {tabName}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>
            {searchedCharts.length > 0 ? (
                <ScrollableContainer height={44}>
                    <div className="grid grid-cols-4 auto-rows-auto">
                        {searchedCharts.map((pinnedChart, index) => (
                            <div className={`${index && index % 4 !== 0 && 'ml-4'} ${index >= 4 && 'mt-4'} flex flex-col`}>
                                {editMode && (
                                    <div
                                        className="py-3 w-full text-center text-theme-body hover:text-red-500 bg-red-500 hover:bg-theme-body rounded-t-md border-2 border-red-500 transition duration-100"
                                        onClick={() => {
                                            dispatch(removedPinnedChart({ chartId: pinnedChart.chartId }));
                                        }}
                                    >
                                        Delete
                                    </div>
                                )}
                                <PinnedChartWidget
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
