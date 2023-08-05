// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class SimBriefApi {
    static getSimBriefOfp(username, overrideUserID) {
        if (username || overrideUserID) {
            return fetch(overrideUserID ? `${SimBriefApi.url}&userid=${overrideUserID}` : `${SimBriefApi.url}&username=${username}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new HttpError(response.status);
                    }

                    return response.json();
                });
        } else {
            throw new Error("No Navigraph username or override simbrief user id provided");
        }
    }
}

SimBriefApi.url = "https://www.simbrief.com/api/xml.fetcher.php?json=1";
