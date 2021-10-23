/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { CloudArrowDown } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { LocalFileChartUI } from './LocalFileChartUI';

enum ConnectionState {
    ATTEMPTING,
    FAILED,
    ESTABLISHED,
}

export const getPdfUrl = async (fileName: string, pageNumber: number): Promise<string> => {
    try {
        const resp = await fetch(`http://localhost:8380/api/v1/utility/pdf?filename=${fileName}&pagenumber=${pageNumber}`);

        if (!resp.ok) {
            toast.error('Failed to retrieve requested PDF Document.');
            return Promise.reject();
        }

        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    } catch (_) {
        toast.error('Failed to retrieve requested PDF Document.');
        return Promise.reject();
    }
};

export const LocalFilesPage = () => {
    const [connectionState, setConnectionState] = useState(ConnectionState.ATTEMPTING);

    const setConnectedState = async () => {
        try {
            const healthRes = await fetch('http://localhost:8380/health');
            const healthJson = await healthRes.json();

            if (healthJson.info.api.status === 'up') {
                setConnectionState(ConnectionState.ESTABLISHED);
            } else {
                setConnectionState(ConnectionState.FAILED);
            }
        } catch (_) {
            setConnectionState(ConnectionState.FAILED);
        }
    };

    const handleConnectionRetry = () => {
        setConnectionState(ConnectionState.ATTEMPTING);

        setConnectedState();
    };

    useEffect(() => {
        setConnectedState();
    }, []);

    switch (connectionState) {
    case ConnectionState.ATTEMPTING:
        return (
            <div className="flex flex-col justify-center items-center space-y-8 rounded-lg border-2 border-theme-accent h-content-section-reduced">
                <h1>Establishing Connection</h1>
                <CloudArrowDown size={40} className="animate-bounce" />
            </div>
        );
    case ConnectionState.ESTABLISHED:
        return <LocalFileChartUI />;
    case ConnectionState.FAILED:
        return (
            <div className="flex justify-center items-center rounded-lg border-2 border-theme-accent h-content-section-reduced">
                <div className="space-y-4">
                    <h1>Failed to Establish Connection.</h1>
                    <button
                        type="button"
                        className="flex justify-center items-center py-2 space-x-4 w-full rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                        onClick={handleConnectionRetry}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    default: return <></>;
    }
};
