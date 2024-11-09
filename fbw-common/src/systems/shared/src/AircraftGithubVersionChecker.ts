// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
import Compare from 'semver/functions/compare';
import { CommitInfo, GitVersions, ReleaseInfo } from '@flybywiresim/api-client';
import { PopUpDialog } from '@flybywiresim/fbw-sdk';

/**
 * Contains the ${aircraft}_build_info.json file's information in a structured way.
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
  version: string;
  major: number;
  minor: number;
  patch: number;
  branch: string;
  commit: string;
}

export enum KnowBranchNames {
  rel = 'Stable',
  dev = 'Development',
  exp = 'Experimental',
}

/**
 *  Provides functions to the check the version of the aircraft against the
 *  published GitHub version
 */
export class AircraftGithubVersionChecker {
  private static versionChecked = false;

  private static releaseInfo: ReleaseInfo[];

  private static newestCommit: CommitInfo;

  private static newestExpCommit: CommitInfo;

  private static buildInfo: BuildInfo;

  /**
   * Checks if the aircraft version is outdated and shows a popup if it is.
   *
   * @returns true if the aircraft version has been checked, false if no check has been commenced.
   */
  public static async checkVersion(aircraft: string): Promise<boolean> {
    console.log(`Checking aircraft version for A/C project: ${aircraft}`);

    // reset previous check data
    this.versionChecked = false;
    this.setOutdatedVersionFlag(false);

    // Retrieve the version info from ${aircraft}_build_info.json and GitHub
    await this.initialize(aircraft);

    // assert all version info is available
    if (!(this.buildInfo && this.releaseInfo && this.newestCommit && this.newestExpCommit)) {
      console.error('Not all version information available. Skipping version check.');
      return false;
    }

    try {
      const versionInfo = this.getVersionInfo(aircraft, this.buildInfo.version);
      if (this.checkOutdated(versionInfo)) {
        this.setOutdatedVersionFlag(true);
        console.log(`Aircraft ${aircraft} - version outdated`);
      } else {
        console.log(`Aircraft ${aircraft} - version ok`);
      }
      this.versionChecked = true;
    } catch (error) {
      console.error('Version comparison failed: ', error);
    }

    return this.versionChecked;
  }

  /**
   * Reads the ${aircraft}_build_info.json file and returns the data a BuildInfo object.
   * It returns a cached version if it has been read before as the file is not expected to change
   * during the MSFS session.
   *
   * @returns Promise on a BuildInfo object
   */
  public static async getBuildInfo(aircraft: string): Promise<BuildInfo> {
    if (this.buildInfo) {
      return this.buildInfo;
    }
    await fetch(`/VFS/${aircraft}_build_info.json`).then((response) => {
      response
        .json()
        .then((json) => {
          this.buildInfo = {
            built: json.built,
            ref: json.ref,
            sha: json.sha,
            actor: json.actor,
            eventName: json.event_name,
            prettyReleaseName: json.pretty_release_name,
            version: json.version,
          };
        })
        .catch((error) => {
          console.error('Failed to read build info: ', error);
        });
    });
    return this.buildInfo;
  }

  /**
   * Parses the version string and returns the version info as VersionInfoData object.
   * Note: public because of jest test
   *
   * @param versionString as provided by the ${aircraft}_build_info.json file.
   * @throws Error if the version string is not in the correct format.
   */
  public static getVersionInfo(aircraft: string, versionString: string): VersionInfoData {
    const matchBuildInfo = versionString.match(new RegExp(`^${aircraft}-v?((\\d+)\\.(\\d+)\\.(\\d+))-(.*)\\.(.{7})$`));
    if (matchBuildInfo) {
      return {
        version: matchBuildInfo[1],
        major: parseInt(matchBuildInfo[2], 10),
        minor: parseInt(matchBuildInfo[3], 10),
        patch: parseInt(matchBuildInfo[4], 10),
        branch: matchBuildInfo[5],
        commit: matchBuildInfo[6],
      };
    }
    throw new Error('Invalid version format');
  }

  /**
   * Retrieves the various versions from the current aircraft and GitHub and stores them in class variables.
   *
   * @private
   */
  private static async initialize(aircraft: string) {
    this.releaseInfo = await GitVersions.getReleases('flybywiresim', aircraft, false, 0, 1);
    this.newestCommit = await GitVersions.getNewestCommit('flybywiresim', aircraft, 'master');
    this.newestExpCommit = await GitVersions.getNewestCommit('flybywiresim', aircraft, 'experimental');
    this.buildInfo = await AircraftGithubVersionChecker.getBuildInfo(aircraft);
  }

  /**
   * Checks if the given version is outdated and shows a notification if it is.
   *
   * @param versionInfo
   * @returns true if the version is outdated, false otherwise.
   * @private
   */
  private static checkOutdated(versionInfo: VersionInfoData): boolean {
    // Set branchName to the long versions of the aircraft edition names
    const branchName = KnowBranchNames[versionInfo.branch] || versionInfo.branch;

    // Check if main version is outdated
    if (Compare(versionInfo.version, this.releaseInfo[0].name) < 0) {
      console.log(`New version available: ${versionInfo.version} ==> ${this.releaseInfo[0].name}`);
      this.showVersionPopup('', versionInfo.version, this.releaseInfo[0].name);
      return true;
    }

    // If the user's version is equal or newer than the latest release then check if
    // the edition is Development or Experimental and if the commit is older than
    // {maxAge} days after the latest release to show notification

    const maxAge = 3;
    const timestampAircraft: Date = new Date(this.buildInfo.built);

    if (
      branchName === KnowBranchNames.dev &&
      versionInfo.commit !== this.newestCommit.shortSha &&
      this.addDays(timestampAircraft, maxAge) < this.newestCommit.timestamp
    ) {
      this.showNotification(versionInfo, timestampAircraft, branchName, this.newestCommit);
      return true;
    }

    if (
      branchName === KnowBranchNames.exp &&
      versionInfo.commit !== this.newestExpCommit.shortSha &&
      this.addDays(timestampAircraft, maxAge) < this.newestExpCommit.timestamp
    ) {
      this.showNotification(versionInfo, timestampAircraft, branchName, this.newestExpCommit);
      return true;
    }

    return false;
  }

  /**
   * Adds a given number of days to a given Date object
   *
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
   * Displays a popup with the version information.
   *
   * @param versionInfo
   * @param timestampAircraft
   * @param branchName
   * @param commitInfo
   * @private
   */
  private static showNotification(
    versionInfo: VersionInfoData,
    timestampAircraft: Date,
    branchName: string,
    commitInfo: CommitInfo,
  ) {
    const currentVersionStr = `${versionInfo.version}-${versionInfo.branch}.${versionInfo.commit} (${timestampAircraft.toUTCString()})`;
    const releaseVersionStr = `${versionInfo.version}-${versionInfo.branch}.${commitInfo.shortSha} (${commitInfo.timestamp.toUTCString()})`;
    console.log(`New commit available: ${currentVersionStr} ==> ${releaseVersionStr}`);
    this.showVersionPopup(branchName, currentVersionStr, releaseVersionStr);
  }

  /**
   * Show a version info modal if the aircraft version is outdated
   *
   * @param branchName
   * @param currentVersion
   * @param releaseVersion
   * @private
   */
  private static showVersionPopup(branchName, currentVersion, releaseVersion) {
    // TODO: Make translation work - move translation from EFB to shared
    const dialog = new PopUpDialog();
    dialog.showInformation(
      'New Version Available',
      `<div style="font-size: 120%; text-align: left;">
                        You are using the ${branchName} edition with version: <br>
                        <strong>${currentVersion}</strong><br><br>

                        Latest ${branchName} version is <br>
                        <strong>${releaseVersion}</strong><br/><br/>

                        Please update your aircraft using the FlyByWire Installer.
                    </div>`,
      'normal',
      () => {},
    );
  }

  /**
   *Set the L:A32NX_OUTDATED_VERSION flag to true or false
   *
   * @param b
   * @private
   */
  private static setOutdatedVersionFlag(b: boolean) {
    // FIXME allow configuring LVar depending on plane
    SimVar.SetSimVarValue('L:A32NX_OUTDATED_VERSION', 'Bool', b ? 1 : 0);
  }

  /**
   * Returns true if at least one valid version check has been done. This can be called before
   * calling checkVersion to avoid checking multiple times.
   *
   * @returns true if at least one valid version check has been done.
   */
  public static get isVersionChecked(): boolean {
    return this.versionChecked;
  }
}
