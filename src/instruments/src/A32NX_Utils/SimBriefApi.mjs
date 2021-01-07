export default class SimBriefApi {
    static getSimBriefOfp(username, userId) {
        let apiUrl;
        if (username) {
            apiUrl = `${SimBriefApi.url}&username=${username}`;
        } else if (userId) {
            apiUrl = `${SimBriefApi.url}&userid=${userId}`;
        } else {
            throw ('No SimBrief username/user ID provided');
        }

        return fetch(apiUrl)
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json();
            });
    }
}

SimBriefApi.url = 'http://www.simbrief.com/api/xml.fetcher.php?json=1';
