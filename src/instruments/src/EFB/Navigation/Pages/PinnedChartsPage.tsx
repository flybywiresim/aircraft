/* eslint-disable max-len */
import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight } from '@tabler/icons';
import { useTranslation } from 'react-i18next';
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

    const { t } = useTranslation();

    const { pinnedCharts } = useAppSelector((state) => state.navigationTab);
    const { searchQuery, chartTypeIndex, selectedProvider, sortTypeIndex, editMode } = useAppSelector((state) => state.navigationTab[NavigationTab.PINNED_CHARTS]);

    const providerTabs: Record<ChartProvider | 'ALL', {alias: string, provider: ChartProvider | 'ALL'}> = {
        ALL: { alias: t('NavigationAndCharts.All'), provider: 'ALL' },
        [ChartProvider.LOCAL_FILES]: { alias: t('NavigationAndCharts.LocalFiles.Title'), provider: ChartProvider.LOCAL_FILES },
        [ChartProvider.NAVIGRAPH]: { alias: t('NavigationAndCharts.Navigraph.Title'), provider: ChartProvider.NAVIGRAPH },
    };

    const filterTabs = {
        [ChartProvider.LOCAL_FILES]: [
            { tag: 'IMAGE', alias: t('NavigationAndCharts.LocalFiles.Image') },
            { tag: 'PDF', alias: t('NavigationAndCharts.LocalFiles.Pdf') },
            { tag: 'BOTH', alias: t('NavigationAndCharts.LocalFiles.Both') },
        ],
        [ChartProvider.NAVIGRAPH]: [
            { tag: 'STAR', alias: 'STAR' },
            { tag: 'APP', alias: 'APP' },
            { tag: 'TAXI', alias: 'TAXI' },
            { tag: 'SID', alias: 'SID' },
            { tag: 'REF', alias: 'REF' },
            { tag: 'ALL', alias: 'ALL' },
        ],
    }[selectedProvider] ?? [];

    const providerCharts = pinnedCharts.filter((pinnedChart) => {
        const provider = providerTabs[selectedProvider].provider;

        if (provider === 'ALL') {
            return true;
        }

        return pinnedChart.provider === provider;
    });

    const filteredCharts = providerCharts.filter((pinnedChart) => {
        const filterItem = filterTabs[chartTypeIndex].tag;

        const provider = providerTabs[selectedProvider].provider;

        if (provider === ChartProvider.LOCAL_FILES) {
            if (filterItem === 'BOTH') {
                return true;
            }

            return pinnedChart.tag === filterItem;
        }

        if (provider === ChartProvider.NAVIGRAPH) {
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
        <div className="p-4 space-y-4 rounded-lg border-2 h-content-section-reduced border-theme-accent">
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
                            options={Object.values(providerTabs).map(({ alias, provider }) => ({ displayValue: alias, value: provider }))}
                            value={selectedProvider}
                            onChange={(value) => dispatch(editTabProperty({
                                tab: NavigationTab.PINNED_CHARTS,
                                selectedProvider: value as ChartProvider | 'ALL',
                            }))}
                        />
                    </TooltipWrapper>

                    <SelectGroup>
                        <SelectItem
                            selected={!editMode}
                            onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, editMode: false }))}
                        >
                            {t('NavigationAndCharts.PinnedCharts.View')}
                        </SelectItem>
                        <SelectItem
                            selected={editMode}
                            onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, editMode: true }))}
                        >
                            {t('NavigationAndCharts.PinnedCharts.Edit')}
                        </SelectItem>
                    </SelectGroup>
                </div>

                <div className="flex flex-row space-x-4 w-full">
                    {filterTabs.length ? (
                        <SelectGroup className="flex-grow">
                            {filterTabs.map(({ tag }, index) => (
                                <SelectItem
                                    className="w-full"
                                    selected={chartTypeIndex === index}
                                    onSelect={() => {
                                        dispatch(editTabProperty({ tab: NavigationTab.PINNED_CHARTS, chartTypeIndex: index }));
                                    }}
                                >
                                    {tag}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    ) : (
                        <div className="flex flex-grow justify-center items-center py-2 px-6 rounded-md border border-theme-accent">
                            {t('NavigationAndCharts.PinnedCharts.ShowingChartsFromAllProviders')}
                        </div>
                    )}

                    <TooltipWrapper text="Change Chart Sort Method">
                        <SelectInput
                            className="w-64"
                            options={[
                                { displayValue: t('NavigationAndCharts.PinnedCharts.SortMethods.None'), value: PinSort.NONE },
                                { displayValue: t('NavigationAndCharts.PinnedCharts.SortMethods.FirstAccessed'), value: PinSort.FIRST_ACCESSED },
                                { displayValue: t('NavigationAndCharts.PinnedCharts.SortMethods.LastAccessed'), value: PinSort.LAST_ACCESSED },
                                { displayValue: t('NavigationAndCharts.PinnedCharts.SortMethods.AlphabeticalAZ'), value: PinSort.ALPHABETICAL_FIRST_LAST },
                                { displayValue: t('NavigationAndCharts.PinnedCharts.SortMethods.AlphabeticalZA'), value: PinSort.ALPHABETICAL_LAST_FIRST },
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
                                        className="py-3 w-full font-bold text-center rounded-t-md border-2 transition duration-100 text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red"
                                        onClick={() => {
                                            dispatch(removedPinnedChart({ chartId: pinnedChart.chartId }));
                                        }}
                                    >
                                        {t('NavigationAndCharts.PinnedCharts.Delete')}
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
                    {t('NavigationAndCharts.PinnedCharts.NoItemsFound')}
                </div>
            )}
        </div>
    );
};
