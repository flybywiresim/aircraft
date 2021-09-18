export class SimBriefApi {
    static url: any;

    static getSimBriefOfp(userId: string) {
        if (userId) {
            return fetch(`${SimBriefApi.url}&userid=${userId}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(response.status.toString());
                    }

                    return response.json();
                });
        }
        throw new Error('No SimBrief pilot ID provided');
    }

    static getSimBriefUser(value: string) {
        if (!value) {
            throw new Error('No SimBrief username/pilot ID provided');
        }

        // The SimBrief API will try both username and pilot ID if either one
        // isn't valid, so request both if the input is plausibly a pilot ID.
        let apiUrl = `${SimBriefApi.url}&username=${value}`;
        if (/^\d{1,8}$/.test(value)) {
            apiUrl += `&userid=${value}`;
        }

        return fetch(apiUrl)
            .then((response) => {
                // 400 status means request was invalid, probably invalid username so preserve to display error properly
                if (!response.ok && response.status !== 400) {
                    throw new Error(response.status.toString());
                }

                return response.json();
            });
    }
}

SimBriefApi.url = 'http://www.simbrief.com/api/xml.fetcher.php?json=1';
