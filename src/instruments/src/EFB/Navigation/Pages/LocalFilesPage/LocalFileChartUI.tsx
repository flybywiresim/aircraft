import React, { useEffect, useState } from 'react';
import { ArrowReturnRight } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { LocalFileChart, LocalFileChartSelector, LocalFileOrganizedCharts } from './LocalFileChartSelector';
import { ScrollableContainer } from '../../../UtilComponents/ScrollableContainer';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectGroup, SelectItem } from '../../../UtilComponents/Form/Select';
import { useAppDispatch, useAppSelector } from '../../../Store/store';
import { isSimbriefDataLoaded } from '../../../Store/features/simBrief';
import { NavigationTab, editTabProperty } from '../../../Store/features/navigationPage';
import { ChartViewer } from '../../Navigation';

interface LocalFileCharts {
    images: LocalFileChart[];
    pdfs: LocalFileChart[];
}

export const LocalFileChartUI = () => {
    const dispatch = useAppDispatch();

    const [statusBarInfo, setStatusBarInfo] = useState('');

    const [icaoAndNameDisagree, setIcaoAndNameDisagree] = useState(false);

    const [charts, setCharts] = useState<LocalFileCharts>({
        images: [],
        pdfs: [],
    });

    const [organizedCharts, setOrganizedCharts] = useState<LocalFileOrganizedCharts[]>([
        { name: 'IMAGE', charts: charts.images },
        { name: 'PDF', charts: charts.pdfs },
        { name: 'BOTH', charts: [...charts.images, ...charts.pdfs] },
    ]);

    const { searchQuery, isFullScreen, chartName, selectedTabIndex } = useAppSelector((state) => state.navigationTab[NavigationTab.LOCAL_FILES]);

    const updateSearchStatus = async () => {
        setIcaoAndNameDisagree(true);

        const searchableCharts: string[] = [];

        if (selectedTabIndex === 0 || selectedTabIndex === 2) {
            searchableCharts.push(...charts.images.map((image) => image.fileName));
        }

        if (selectedTabIndex === 1 || selectedTabIndex === 2) {
            searchableCharts.push(...charts.pdfs.map((pdf) => pdf.fileName));
        }

        const numItemsFound = searchableCharts.filter((chartName) => chartName.toUpperCase().includes(searchQuery)).length;

        setStatusBarInfo(`${numItemsFound} ${numItemsFound === 1 ? 'Item' : 'Items'} Found`);

        setIcaoAndNameDisagree(false);
    };

    const handleIcaoChange = (value: string) => {
        const newValue = value.toUpperCase();

        dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, searchQuery: newValue }));

        getLocalFileChartList(newValue).then((r) => setCharts(r));
    };

    useEffect(() => {
        handleIcaoChange(searchQuery);
    }, [selectedTabIndex]);

    useEffect(() => {
        updateSearchStatus();
    }, [charts]);

    useEffect(() => {
        setOrganizedCharts([
            { name: 'IMAGE', charts: charts.images },
            { name: 'PDF', charts: charts.pdfs },
            { name: 'BOTH', charts: [...charts.pdfs, ...charts.images] },
        ]);
    }, [charts]);

    useEffect(() => {
        dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, chartLinks: { light: chartName.light, dark: chartName.dark } }));
    }, [chartName]);

    const getLocalFileChartList = async (searchQuery: string): Promise<LocalFileCharts> => {
        const pdfs: LocalFileChart[] = [];
        const images: LocalFileChart[] = [];

        try {
            // IMAGE or BOTH
            if (selectedTabIndex === 0 || selectedTabIndex === 2) {
                const resp = await fetch('http://localhost:8380/api/v1/utility/image/list');

                const imageNames: string[] = await resp.json();

                imageNames.forEach((imageName) => {
                    if (imageName.toUpperCase().includes(searchQuery)) {
                        images.push({
                            fileName: imageName,
                            type: 'IMAGE',
                        });
                    }
                });
            }

            // PDF or BOTH
            if (selectedTabIndex === 1 || selectedTabIndex === 2) {
                const resp = await fetch('http://localhost:8380/api/v1/utility/pdf/list');
                const pdfNames: string[] = await resp.json();

                pdfNames.forEach((pdfName) => {
                    if (pdfName.toUpperCase().includes(searchQuery)) {
                        pdfs.push({
                            fileName: pdfName,
                            type: 'PDF',
                        });
                    }
                });
            }
        } catch (err) {
            toast.error('Error encountered while fetching resources.');
        }

        return {
            images,
            pdfs,
        };
    };

    const loading = icaoAndNameDisagree;

    const getStatusBarText = () => {
        if (!searchQuery.length) {
            return 'Showing All Items';
        }

        if (loading) {
            return 'Please Wait';
        }

        return statusBarInfo;
    };

    const { altIcao, departingAirport, arrivingAirport } = useAppSelector((state) => state.simbrief.data);
    const simbriefDataLoaded = isSimbriefDataLoaded();

    return (
        <div className="flex overflow-x-hidden flex-row w-full rounded-lg h-content-section-reduced">
            <>
                {!isFullScreen && (
                    <div className="overflow-hidden flex-shrink-0" style={{ width: '450px' }}>
                        <div className="flex flex-row justify-center items-center">
                            <SimpleInput
                                placeholder="File Name"
                                value={searchQuery}
                                className={`w-full flex-shrink uppercase ${simbriefDataLoaded && 'rounded-r-none'}`}
                                onChange={handleIcaoChange}
                            />

                            {simbriefDataLoaded && (
                                <SelectGroup className="flex-shrink-0 rounded-l-none">
                                    <SelectItem
                                        selected={searchQuery === departingAirport}
                                        onSelect={() => handleIcaoChange(departingAirport)}
                                    >
                                        FROM
                                    </SelectItem>
                                    <SelectItem
                                        selected={searchQuery === arrivingAirport}
                                        onSelect={() => handleIcaoChange(arrivingAirport)}
                                    >
                                        TO
                                    </SelectItem>
                                    {!!altIcao && (
                                        <SelectItem
                                            selected={searchQuery === altIcao}
                                            onSelect={() => handleIcaoChange(altIcao)}
                                        >
                                            ALTN
                                        </SelectItem>
                                    )}
                                </SelectGroup>
                            )}
                        </div>

                        <div className="flex flex-row items-center w-full h-11">
                            <ArrowReturnRight size={30} />
                            <div className="block overflow-hidden px-4 w-full whitespace-nowrap" style={{ textOverflow: 'ellipsis' }}>
                                {getStatusBarText()}
                            </div>
                        </div>

                        <div className="mt-6">
                            <SelectGroup>
                                {organizedCharts.map((organizedChart, index) => (
                                    <SelectItem
                                        selected={index === selectedTabIndex}
                                        onSelect={() => dispatch(editTabProperty({ tab: NavigationTab.LOCAL_FILES, selectedTabIndex: index }))}
                                        key={organizedChart.name}
                                        className="flex justify-center w-full"
                                    >
                                        {organizedChart.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>

                            <ScrollableContainer className="mt-5" height={42.75}>
                                <LocalFileChartSelector
                                    selectedTab={organizedCharts[selectedTabIndex]}
                                    loading={loading}
                                />
                            </ScrollableContainer>
                        </div>
                    </div>
                )}
                <ChartViewer />
            </>
        </div>
    );
};
