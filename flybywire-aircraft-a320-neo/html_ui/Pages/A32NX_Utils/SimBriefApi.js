class SimBriefApi {
    static getSimBriefOfp(userId) {
        if (userId) {
            return fetch(`${SimBriefApi.url}&userid=${userId}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new HttpError(response.status);
                    }

                    return response.json();
                });
        } else {
            throw new Error("No SimBrief pilot ID provided");
        }
    }
}

SimBriefApi.url = "http://www.simbrief.com/api/xml.fetcher.php?json=1";
