import React from 'react';
import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';

interface AtaChapterPageProps {
    title: string,
}

export const AtaChapterPage = ({ title }: AtaChapterPageProps) => {
    const { allFailures, activeFailures } = useFailuresOrchestrator();
    return (
        <div>
            <Link to="/failures" className="inline-block mb-4">
                <div className="flex flex-row items-center space-x-3 transition duration-100 hover:text-theme-highlight">
                    <ArrowLeft size={30} />
                    <h1 className="font-bold text-current">
                        Failures
                        {' > '}
                        {title}
                    </h1>
                </div>
            </Link>
            <div className="p-4 mt-4 rounded-lg border-2 border-theme-accent">
                <h1>stuff here</h1>
            </div>
        </div>
    );
};
