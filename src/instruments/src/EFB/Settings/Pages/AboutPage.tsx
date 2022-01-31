import React, { useEffect, useState } from 'react';
import { SettingsPage } from '../Settings';
import { FbwLogo } from '../../UtilComponents/FbwLogo';

interface BuildInfo {
    built: string;
    ref: string;
    sha: string;
    actor: string;
    eventName: string;
}

interface BuildInfoEntryProps {
    title: string;
    value?: string;
    underline?: number;
}

const SPACE_BETWEEN = 14;

const BuildInfoEntry = ({ title, value, underline = 0 }: BuildInfoEntryProps) => {
    const first = value?.substring(0, underline);
    const last = value?.substring(underline);

    return (
        <div className="flex flex-row mt-2 font-mono">
            <p>{title + '\u00A0'.repeat(SPACE_BETWEEN - title.length)}</p>
            <p className="ml-4">
                <span className="underline text-theme-highlight">{first}</span>
                {last}
            </p>
        </div>
    );
};

export const AboutPage = () => {
    const [buildInfo, setBuildInfo] = useState<BuildInfo | undefined>(undefined);

    useEffect(() => {
        fetch('/VFS/build_info.json').then((response) => response.json()).then((json) => setBuildInfo({
            built: json.built,
            ref: json.ref,
            sha: json.sha,
            actor: json.actor,
            eventName: json.event_name,
        }));
    }, []);

    return (
        <SettingsPage name="About">
            <div className="flex absolute inset-y-0 flex-col justify-center px-16">
                <div className="flex flex-row items-center">

                    <div className="flex flex-col">
                        <div className="flex flex-row items-center">
                            <FbwLogo width={36} height={36} />
                            <h1 className="ml-4 text-4xl font-bold font-manrope">flyPadOS 3</h1>
                        </div>

                        <p className="mt-3 text-2xl">
                            Made with love by contributors in Québec, Germany, the United States, Singapore, Indonesia, New Zealand, Australia, Spain, the United Kingdom, France, the Netherlands, Sweden, and Switzerland!
                        </p>
                    </div>
                </div>
                <div className="flex flex-col justify-center mt-8">
                    <p>&copy; 2020-2022 FlyByWire Simulations and its contributors, all rights reserved.</p>
                    <p>Licensed under the GNU General Public License Version 3</p>
                </div>

                <div className="mt-16">
                    <h1 className="font-bold">Build Info</h1>
                    <div className="mt-4">
                        <BuildInfoEntry title="Built" value={buildInfo?.built} />
                        <BuildInfoEntry title="Ref" value={buildInfo?.ref} />
                        <BuildInfoEntry title="SHA" value={buildInfo?.sha} underline={8} />
                        <BuildInfoEntry title="Event Name" value={buildInfo?.eventName} />
                    </div>
                </div>
            </div>
        </SettingsPage>
    );
};
