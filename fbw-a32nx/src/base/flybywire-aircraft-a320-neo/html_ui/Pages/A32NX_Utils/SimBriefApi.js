// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class SimBriefApi {
    static getSimBriefOfp(userId) {
        if (userId) {
            return fetch(`${SimBriefApi.url}&username=${userId}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new HttpError(response.status);
                    }

                    return response.json();
                });
        } else {
            throw new Error("No Navigraph username provided");
        }
    }
}

SimBriefApi.url = "https://www.simbrief.com/api/xml.fetcher.php?json=1";
