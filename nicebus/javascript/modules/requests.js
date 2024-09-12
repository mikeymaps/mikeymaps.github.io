const DOMAIN = "https://www.nicebus.com";
const REFERRERS_BASE = `${DOMAIN}/Tools/Maps-and-Schedules/Line?route=`;
const REALTIME_DATA_BASE = `${DOMAIN}/NICECustomPages/getjsondata.aspx?getData=getrealtime&route_id=`;
const STOPS_DATA_BASE = `${DOMAIN}/NICECustomPages/getjsondata.aspx?getData=getStops&route_id=`;

const DEFAULT_HEADERS = {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "referer": "" // Placeholder for dynamic referer
};

const createHeaders = (referer) => {
    const headers = new Headers(DEFAULT_HEADERS);
    headers.set("referer", referer);
    return headers;
};

// Client class for making API requests
export class Client {
    static async getRoute(route) {
        const referer = `${REFERRERS_BASE}${route}`;
        const url = `${REALTIME_DATA_BASE}${route}`;
        const requestOptions = {
            method: "GET",
            headers: createHeaders(referer),
            redirect: "follow"
        };
        const response = await fetch(url, requestOptions);
        return response.json();
    }

    static async getStops(route) {
        const referer = `${REFERRERS_BASE}${route}`;
        const url = `${STOPS_DATA_BASE}${route}&direction_id=0&service_id=3`;
        const requestOptions = {
            method: "GET",
            headers: createHeaders(referer),
            redirect: "follow"
        };
        const response = await fetch(url, requestOptions);
        return response.json();
    }
}