import BrowserHistory from "./get-browser-url.js";

class GetTrackdekWindowWithActiveWin extends BrowserHistory {
    constructor() {
        super();
    }

    /**
     * Retrieves the active window's URL if it matches any browser in the list.
     * @param {Object} currentApplication - The current application object obtained from get-windows library.
     * @param {Array} browserLists - A list of browsers from the JSON file.
     * @returns {Object} - The updated current application object with a URL if it's a browser.
     */
    async activeWindow(currentApplication, browserLists) {
        try {
            if (!currentApplication.owner) {
                return [];
            }

            if (currentApplication && currentApplication.url) {
                currentApplication.isBrowser = true;
                return currentApplication;
            }

            const applicationName = currentApplication.owner.name.toLowerCase();
            const browser = browserLists?.find(browser => browser.title.toLowerCase().includes(applicationName) || applicationName.toLowerCase().includes(browser.title.toLowerCase()));

            if (!browser) {
                currentApplication.isBrowser = false;
                return currentApplication;
            }

            // If a matching browser is found
            currentApplication.isBrowser = true;
            const applicationTitle = currentApplication.title;
            const currentBrowserTabUrl = await this.getBrowserUrl(browser.title, applicationTitle);

            if (currentBrowserTabUrl) {
                const url = new URL(currentBrowserTabUrl);
                let browserOrigin = "";
                if (url.origin == null || url.origin == "null" || !url.origin) {
                    browserOrigin = url.href;
                } else {
                    browserOrigin = url.origin;
                } // Use origin if available, otherwise full URL
                currentApplication.url = browserOrigin;
            } else {
                if (this.getDomainFromTitle(currentApplication.title)) {
                    currentApplication.title = this.getDomainFromTitle(currentApplication.title);
                }
                currentApplication.url = "";
            }

            return currentApplication;
        } catch (error) {
            console.error("Error retrieving the trackdek window:", error);
            throw new Error("Failed to retrieve trackdek window.");
        }
    }

    /**
     * Retrieves the browser's URL based on its name and the application title.
     * @param {String} currentBrowserName - The name of the current matched browser.
     * @param {String} applicationTitle - The title of the current browser application.
     * @returns {String} - The URL of the current browser tab.
     */
    async getBrowserUrl(currentBrowserName, applicationTitle) {
        try {
            // Fetch browser history by name and application title
            const history = await this.getBrowserHistoryByName(currentBrowserName, applicationTitle);

            // Helper function to extract the URL from the history
            const extractUrlFromHistory = (history) => {
                const browserUrl = history[0]?.url;
                return browserUrl;
            };

            // Return URL immediately if history is available
            if (history.length > 0) {
                return extractUrlFromHistory(history);
            }

            // Retry mechanism to get the URL from history
            let intervalIteration = 0;
            while (intervalIteration < 5) {
                const historyInRecursion = await this.getBrowserHistoryByName(currentBrowserName, applicationTitle);
                if (historyInRecursion.length > 0) {
                    return extractUrlFromHistory(historyInRecursion);
                }
                intervalIteration++;
            }

            // Return empty string if no URL is found
            return "";
        } catch (error) {
            console.error("Error retrieving browser history:", error);
            return "";
        }
    }

}

export default GetTrackdekWindowWithActiveWin;
