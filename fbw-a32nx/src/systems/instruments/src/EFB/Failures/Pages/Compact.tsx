import { AtaChapterNumber, AtaChaptersTitle } from '@shared/ata';
import React, { useMemo } from 'react';
import { Failure } from '@failures';
import { allGeneratorFailures, failureGeneratorCommonFunction, failureGeneratorsSettings } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { t } from '../../translation';
import { FailureButton } from '../FailureButton';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { useAppSelector } from '../../Store/store';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

interface FailureGroupProps {
    title: string;
    failures: Failure[];
}

const FailureGroup = ({ title, failures }: FailureGroupProps) => {
    const { activeFailures, changingFailures, activate, deactivate } = useFailuresOrchestrator();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);
    const settingsFailureGen = failureGeneratorsSettings();
    const activeGens = useMemo(() => {
        const temp : string[] = [];
        settingsFailureGen.allGenSettings.forEach((genSetting) => {
            for (let i = 0; i < genSetting.settings.length / genSetting.numberOfSettingsPerGenerator; i++) {
                temp.push(genSetting.uniqueGenPrefix + i.toString());
            }
        });
        return temp;
    }, [settingsFailureGen.allGenSettings]);
    const { allFailures } = failureGeneratorCommonFunction();
    const { generatorFailuresGetters } = allGeneratorFailures(allFailures);

    const getHighlightedTerm = (failureName: string) => {
        const searchQueryIdx = failureName.toUpperCase().indexOf(searchQuery);

        if (searchQuery === '' || searchQueryIdx === -1) return undefined;

        return failureName.substring(searchQueryIdx, searchQueryIdx + searchQuery.length);
    };

    const handleFailureButtonClick = (failureIdentifier: number) => {
        if (!activeFailures.has(failureIdentifier)) {
            activate(failureIdentifier);
        } else {
            deactivate(failureIdentifier);
        }
    };

    return (
        <div className="space-y-2">
            <h2>{title}</h2>

            <div className="grid grid-cols-4 auto-rows-auto">
                {failures.map((failure, index) => (
                    <div className={`flex flex-col items-stretch justify-self-stretch ${index && index % 4 !== 0 && 'ml-4'} ${index >= 4 && 'mt-4'}`}>
                        <FailureButton
                            key={failure.identifier}
                            name={failure.name}
                            isActive={activeFailures.has(failure.identifier)}
                            isChanging={changingFailures.has(failure.identifier)}
                            highlightedTerm={getHighlightedTerm(failure.name)}
                            onClick={() => handleFailureButtonClick(failure.identifier)}
                            className="h-36 grow"
                        />
                        <div className={`grid grid-cols-${Math.min(4, activeGens.length)} auto-rows-auto h-${8 * Math.ceil((activeGens.length + 1) / 4)} ${index >= 4 && 'mt-4'}`}>
                            {
                                activeGens.map((genID) => (
                                    <button
                                        type="button"
                                        className={
                                            `flex px-2 h-8 pt-3 pb-2 text-center rounded-b-md ${generatorFailuresGetters.get(failure.identifier).includes(genID)
                                                ? 'bg-theme-highlight'
                                                : 'bg-theme-accent'}`
                                        }
                                    >
                                        {genID}
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface CompactUIProps {
    chapters: AtaChapterNumber[];
    failures: Failure[];
}

export const CompactUI = ({ chapters, failures }: CompactUIProps) => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    return (
        <ScrollableContainer height={48}>
            <div className="space-y-8">
                {searchQuery.length === 0 && activeFailures.size !== 0 && (
                    <FailureGroup title="Active Failures" failures={allFailures.filter((failure) => activeFailures.has(failure.identifier))} />
                )}
                {chapters.map((chapter) => (
                    <FailureGroup
                        key={chapter}
                        title={AtaChaptersTitle[chapter]}
                        failures={failures.filter((failure) => failure.ata === chapter)}
                    />
                ))}
                {failures.length === 0 && (
                    <div className="flex justify-center items-center rounded-md border-2 border-theme-accent" style={{ height: '48rem' }}>
                        <p>{t('Failures.NoItemsFound')}</p>
                    </div>
                )}
            </div>
        </ScrollableContainer>
    );
};
