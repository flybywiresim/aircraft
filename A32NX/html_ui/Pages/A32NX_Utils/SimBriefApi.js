class SimBriefApi {
    static getSimBriefOfp(username) {
        if (!username) {
            throw ("No SimBrief username provided");
        }

        return fetch(`${SimBriefApi.url}&username=${username}`)
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json();
            });
    }
}

SimBriefApi.url = "http://www.simbrief.com/api/xml.fetcher.php?json=1";
