import React, { useEffect, useState } from 'react';
import { useInterval } from '@flybywiresim/react-components';
import { toast } from 'react-toastify';
import NavigraphClient, { useNavigraph } from '../../../ChartsApi/Navigraph';
import { NavigraphAuthUI } from './NavigraphAuthUI';
import { NavigraphChartUI } from './NavigraphChartUI';

export const NavigraphPage = () => {
    const [tokenAvail, setTokenAvail] = useState(false);
    const navigraph = useNavigraph();

    useInterval(async () => {
        try {
            await navigraph.getToken();
        } catch (e) {
            toast.error(`Navigraph Authentication Error: ${e.message}`, { autoClose: 10_000 });
        }
    }, (navigraph.tokenRefreshInterval * 1000));

    useEffect(() => {
        if (!navigraph.hasToken) {
            navigraph.authenticate();
        }
    }, []);

    useInterval(() => {
        setTokenAvail(navigraph.hasToken);
    }, 1000, { runOnStart: true });

    return (
        <>
            {NavigraphClient.hasSufficientEnv
                ? (
                    <>
                        {tokenAvail
                            ? (
                                <NavigraphChartUI />
                            )
                            : <NavigraphAuthUI />}
                    </>
                )
                : (
                    <div className="flex overflow-x-hidden justify-center items-center mr-4 w-full rounded-lg h-content-section-reduced bg-theme-secondary">
                        <p className="pt-6 mb-6 text-3xl">Insufficient .env file</p>
                    </div>
                )}
        </>
    );
};
