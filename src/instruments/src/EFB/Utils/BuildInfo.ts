// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/**
 * Contains the {type}_build_info.json file's information in a structured way.
 */
export interface BuildInfo {
    built: string;
    ref: string;
    sha: string;
    actor: string;
    eventName: string;
    prettyReleaseName: string;
    version: string;
}

/**
 * Structure of the version info.
 */
export interface VersionInfoData {
    version: string
    major: number;
    minor: number;
    patch: number;
    branch: string;
    commit: string;
}

/**
 *  Provides functions to the {type}_build_info.json file and provide version functions.
 */
export class BuildInfo {
    /**
    * Reads the {type}_build_info.json file and returns the data a BuildInfo object.
    */
    public static async getBuildInfo(): Promise<BuildInfo> {
        let buildInfo;
        await fetch('/VFS/a32nx_build_info.json').then((response) => {
            response.json().then((json) => {
                buildInfo = ({
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
        return buildInfo;
    }

    /**
     * Parses the version string and returns the version info as VersionInfoData object.
     * @param versionString as provided by the {type}_build_info.json file.
     */
    public static getVersionInfo(versionString: string): VersionInfoData {
        const matchBuildInfo = versionString.match(/^v?((\d+)\.(\d+)\.(\d+))-(.*)\.(.{7})$/);
        if (matchBuildInfo) {
            const version = matchBuildInfo[1];
            const major = parseInt(matchBuildInfo[2], 10);
            const minor = parseInt(matchBuildInfo[3], 10);
            const patch = parseInt(matchBuildInfo[4], 10);
            const branch = matchBuildInfo[5];
            const commit = matchBuildInfo[6];
            return {
                version,
                major,
                minor,
                patch,
                branch,
                commit,
            };
        }
        throw new Error('Invalid version format');
    }

    /**
     * Compare two version strings. Returns 1 if v1 is newer, -1 if v2 is newer and 0 if they are equal.
     * Throws an error if the version strings are not in the correct format (^v?(\d+)\.(\d+)\.(\d+).*$).
     *
     * TODO: Use semver package. semver package did not work for some reason. This is a temporary solution.
     *
     * @param v1
     * @param v2
     */
    public static versionCompare(v1: string, v2: string): number {
        let major1;
        let minor1;
        let patch1;
        let major2;
        let minor2;
        let patch2;

        const matchBuildInfo = v1.match(/^v?(\d+)\.(\d+)\.(\d+).*$/);
        if (matchBuildInfo) {
            major1 = parseInt(matchBuildInfo[1], 10);
            minor1 = parseInt(matchBuildInfo[2], 10);
            patch1 = parseInt(matchBuildInfo[3], 10);
        } else {
            throw new Error('Invalid version format');
        }
        const matchReleaseInfo = v2.match(/^v?(\d+)\.(\d+)\.(\d+).*$/);
        if (matchReleaseInfo) {
            major2 = parseInt(matchReleaseInfo[1], 10);
            minor2 = parseInt(matchReleaseInfo[2], 10);
            patch2 = parseInt(matchReleaseInfo[3], 10);
        } else {
            throw new Error('Invalid version format');
        }

        if (major1 > major2) {
            return 1;
        }
        if (major1 < major2) {
            return -1;
        }
        if (minor1 > minor2) {
            return 1;
        }
        if (minor1 < minor2) {
            return -1;
        }
        if (patch1 > patch2) {
            return 1;
        }
        if (patch1 < patch2) {
            return -1;
        }
        return 0;
    }
}
