import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';
import { AtaChapterNumber, AtaChaptersTitle } from '@shared/ata';
import { Failure } from '@flybywiresim/failures';
import { FailureButton } from './Failure';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';
import { useAppSelector } from '../../Store/store';

interface AtaChapterPageProps {
    chapter: AtaChapterNumber;
    failures: Failure[];
}

export const AtaChapterPage = ({ chapter, failures }: AtaChapterPageProps) => {
    const { activeFailures, changingFailures, activate, deactivate } = useFailuresOrchestrator();
    const { searchQuery } = useAppSelector((state) => state.failuresPage);

    return (
        <div>
            <Link to="/failures/home" className="inline-block">
                <div className="flex flex-row items-center space-x-3 transition duration-100 hover:text-theme-highlight">
                    <ArrowLeft size={30} />
                    <h1 className="font-bold text-current">
                        Failures
                        {' > '}
                        {AtaChaptersTitle[chapter]}
                    </h1>
                </div>
            </Link>
            <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent h-content-section-reduced" style={{ height: '44.5rem' }}>
                <ScrollableContainer height={44}>
                    <div className="grid grid-cols-4 auto-rows-auto">
                        {failures.filter((failure) => failure.ata === chapter).map((failure, index) => (
                            <FailureButton
                                name={failure.name}
                                isActive={activeFailures.has(failure.identifier)}
                                isChanging={changingFailures.has(failure.identifier)}
                                highlightedTerm={(() => {
                                    const searchQueryIdx = failure.name.toUpperCase().indexOf(searchQuery);

                                    if (searchQuery === '' || searchQueryIdx === -1) return undefined;

                                    return failure.name.substring(searchQueryIdx, searchQueryIdx + searchQuery.length);
                                })()}
                                onClick={() => {
                                    if (!activeFailures.has(failure.identifier)) {
                                        activate(failure.identifier);
                                    } else {
                                        deactivate(failure.identifier);
                                    }
                                }}
                                className={`${index && index % 4 !== 0 && 'ml-4'} ${index >= 4 && 'mt-4'} h-36`}
                            />
                        ))}
                    </div>
                </ScrollableContainer>
            </div>
        </div>
    );
};
