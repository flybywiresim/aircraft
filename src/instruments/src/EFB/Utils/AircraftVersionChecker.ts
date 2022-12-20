// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import Compare from 'semver/functions/compare';
import { CommitInfo, GitVersions, ReleaseInfo } from '@flybywiresim/api-client';
import { PopUp } from '@shared/popup';

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
 *  Provides functions to the check the version of the aircraft against the
 *  published GitHub version
 */
export class AircraftVersionChecker {
    private static releaseInfo: ReleaseInfo[];

    private static newestCommit: CommitInfo;

    private static newestExpCommit: CommitInfo;

    private static buildInfo: BuildInfo;

    /**
     * Checks if the aircraft version is outdated and shows a popup if it is.
     * @returns true if the aircraft version has been checked, false if no check has been commenced.
     */
    public static async checkVersion(): Promise<boolean> {
        console.log('Checking aircraft version');

        await this.initialize();

        // assert all version info is available
        if (!(this.buildInfo && this.releaseInfo && this.newestCommit && this.newestExpCommit)) {
            console.error('Not all version information available. Skipping version check.');
            return false;
        }

        try {
            let outdated = false;
            const versionInfo = this.getVersionInfo(this.buildInfo.version);

            // Set branchName to the long versions of the aircraft edition names
            let branchName = versionInfo.branch;
            switch (versionInfo.branch) {
            case 'rel': branchName = 'Stable'; break;
            case 'dev': branchName = 'Development'; break;
            case 'exp': branchName = 'Experimental'; break;
            default: break;
            }

            // If the users version is older than the latest release show notification
            if (this.versionCompare(versionInfo.version, this.releaseInfo[0].name) < 0) {
                console.log(`New version available: ${versionInfo.version} ==> ${this.releaseInfo[0].name}`);
                this.showVersionPopup('', versionInfo.version, this.releaseInfo[0].name);
                outdated = true;
            } else {
                // If the users version is equal or newer than the latest release then check if
                // the edition is Development or Experimental and if the commit is older than
                // {maxAge} days after the latest release

                const maxAge = 3;
                const timestampAircraft: Date = new Date(this.buildInfo.built);

                if (versionInfo.branch.includes('rel')) {
                    // Stable
                    // console.debug('Stable version detected!');
                } else if ((branchName === 'Development')) {
                    // Development
                    // console.debug(`branch "${branchName}" version detected - checking sha: ${versionInfo.commit} against ${newestCommit.shortSha}`);
                    if (versionInfo.commit !== this.newestCommit.shortSha) {
                        if (this.addDays(this.newestCommit.timestamp, maxAge) < timestampAircraft) {
                            const currentVersionStr = `${versionInfo.version}-${versionInfo.branch}.${versionInfo.commit} (${timestampAircraft.toUTCString()})`;
                            const releaseVersionStr = `${versionInfo.version}-${versionInfo.branch}.${this.newestCommit.shortSha} (${this.newestCommit.timestamp.toUTCString()})`;
                            console.log(`New commit available: ${currentVersionStr} ==> ${releaseVersionStr}`);
                            this.showVersionPopup(branchName, currentVersionStr, releaseVersionStr);
                            outdated = true;
                        }
                    }
                } else if ((branchName === 'Experimental')) {
                    // Experimental
                    // console.debug(`branch "${branchName}" version detected - checking sha: ${versionInfo.commit} against ${newestCommit.shortSha}`);
                    if (versionInfo.commit !== this.newestExpCommit.shortSha) {
                        if (this.addDays(this.newestExpCommit.timestamp, maxAge) < timestampAircraft) {
                            const currentVersionStr = `${versionInfo.version}-${versionInfo.branch}.${versionInfo.commit} (timestamp: ${timestampAircraft.toUTCString()})`;
                            // eslint-disable-next-line max-len
                            const releaseVersionStr = `${versionInfo.version}-${versionInfo.branch}.${this.newestExpCommit.shortSha} (timestamp: ${this.newestExpCommit.timestamp.toUTCString()})`;
                            console.log(`New commit available: ${currentVersionStr} ==> ${releaseVersionStr}`);
                            this.showVersionPopup(branchName, currentVersionStr, releaseVersionStr);
                            outdated = true;
                        }
                    }
                }
            }

            if (outdated) {
                this.setOutdatedVersionFlag(true);
            } else {
                console.log('Aircraft version ok');
            }

            return true;
        } catch (error) {
            console.error('Version comparison failed: ', error);
        }
        return false;
    }

    /**
     * Retrieves the various versions from the current aircraft and GitHub
     *
     * @private
     */
    private static async initialize() {
        this.releaseInfo = await GitVersions.getReleases('flybywiresim', 'a32nx', false, 0, 1);
        this.newestCommit = await GitVersions.getNewestCommit('flybywiresim', 'a32nx', 'master');
        this.newestExpCommit = await GitVersions.getNewestCommit('flybywiresim', 'a32nx', 'experimental');
        this.buildInfo = await AircraftVersionChecker.getBuildInfo();
    }

    /**
    * Reads the a32nx_build_info.json file and returns the data a BuildInfo object.
    */
    public static async getBuildInfo(): Promise<BuildInfo> {
        if (this.buildInfo) {
            return this.buildInfo;
        }
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

    /**
     * Parses the version string and returns the version info as VersionInfoData object.
     * @param versionString as provided by the a32nx_build_info.json file.
     * @throws Error if the version string is not in the correct format.
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
     * Uses semver.compare() to compare the version strings.
     * See https://github.com/npm/node-semver
     *
     * @param v1
     * @param v2
     * @returns v1 is newer: 1, v2 is newer: -1, equal: 0
     * @private
     */
    private static versionCompare(v1: string, v2: string): number {
        return Compare(v1, v2);
    }

    /**
     * Adds a given number of days to a given Date object
     * @param date
     * @param days
     * @private
     */
    private static addDays(date: Date, days): Date {
        const result = new Date(date);
        result.setDate(date.getDate() + days);
        return result;
    }

    /**
     * Show a version info modal if the aircraft version is outdated
     * @param branchName
     * @param currentVersion
     * @param releaseVersion
     * @private
     */
    private static showVersionPopup(branchName, currentVersion, releaseVersion) {
        const popup = new PopUp();
        popup.showInformation(
            'NEW VERSION AVAILABLE',
            `<div style="font-size: 100%; text-align: left;">
                     You are using ${branchName} version:<br/><strong>${currentVersion}</strong><br/><br/> 
                     Latest ${branchName} version is:<br /><strong>${releaseVersion}</strong><br/><br/>
                     Please update your aircraft using the FlyByWire Installer.
                     </div>`,
            'normal',
            () => {},
        );
    }

    /**
     *Set the L:A32NX_OUTDATED_VERSION flag to true or false
     * @param b
     * @private
     */
    private static setOutdatedVersionFlag(b: boolean) {
        SimVar.SetSimVarValue('L:A32NX_OUTDATED_VERSION', 'Bool', b ? 1 : 0);
    }
}
