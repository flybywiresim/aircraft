// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface BuildInfoData {
    built: string;
    ref: string;
    sha: string;
    actor: string;
    eventName: string;
    prettyReleaseName: string;
    version: string;
}

export class BuildInfo {
    public static buildInfo: BuildInfoData;

    public static async getBuildInfo(): Promise<BuildInfoData> {
        await fetch('/VFS/a32nx_build_info.json').then((response) => {
            response.json().then((json) => {
                this.buildInfo = ({
                    built: json.built,
                    ref: json.ref,
                    sha: json.sha,
                    actor: json.actor,
                    eventName: json.event_name,
                    prettyReleaseName: json.pretty_release_name,
                    version: json.version,
                });
            });
        });
        return this.buildInfo;
    }
}
