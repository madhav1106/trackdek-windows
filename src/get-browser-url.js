'use strict';
const browsers = require("electron-browser-history/browsers.js");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { tmpdir, type } = require("os");
const uuidV4 = require("uuid").v4;

class BrowserHistory {
    constructor() { }

    /**
     * 
     * @param {String} browserName - browser name to get the path for
     */
    getBrowserPath = (browserName) => {
        try {
            const browserMappings = {
                [browsers.FIREFOX]: browsers.defaultPaths.firefox,
                [browsers.CHROME]: browsers.defaultPaths.chrome,
                [browsers.SEAMONKEY]: browsers.defaultPaths.seamonkey,
                [browsers.TORCH]: browsers.defaultPaths.torch,
                [browsers.OPERA]: browsers.defaultPaths.opera,
                [browsers.BRAVE]: browsers.defaultPaths.brave,
                [browsers.VIVALDI]: browsers.defaultPaths.vivaldi,
                [browsers.MAXTHON]: browsers.defaultPaths.maxthon,
                [browsers.EDGE]: browsers.defaultPaths.edge,
                [browsers.AVAST]: browsers.defaultPaths.avast,
            };

            const defaultPath = browserMappings[browserName];
            if (!defaultPath) {
                throw new Error(`Browser ${browserName} is not supported.`);
            }
            return browsers.findPaths(defaultPath, browserName);
        } catch (error) {
            console.error("Error in getBrowserPath:", error);
        }
    };

    /**
     * 
     * @param {String} browserName - Provide browser name
     * @param {String} title - Provide title of the browser
     * @returns {Promise<Array>} - Array of history records matching the title.
     */
    getMozillaBasedBrowserHistory = async (browserName, title) => {
        try {
            const cleanedTitle = this.getCleanedTitle(title, browserName);
            const browserPaths = this.getBrowserPath(browserName);
            if (!browserPaths || browserPaths.length === 0) {
                return [];
            }

            const dbPaths = [];
            let historyData = [];
            for (const browserPath of browserPaths) {
                const tempDir = this.getTempDir();
                const tempDbPath = path.join(tempDir, `${uuidV4()}.sqlite`);
                await fs.copyFileSync(browserPath, tempDbPath);
                dbPaths.push(tempDbPath);
                let db;
                if (type() == "Linux") {
                    db = new Database(tempDbPath);
                } else {
                    db = new Database(browserPath);
                }

                const sql = `
                    SELECT DISTINCT 
                        URL, 
                        datetime(last_visit_date / 1000000, 'unixepoch') AS last_visit_time, 
                        url 
                    FROM moz_places 
                    WHERE title LIKE '%${cleanedTitle}%'
                `;

                const rows = db.prepare(sql).all();
                if (rows.length > 0) {
                    historyData = historyData.concat(rows);
                }
                db.close();
            }

            // Clean up temporary files
            this.deleteTempFiles(dbPaths);

            return historyData;
        } catch (error) {
            console.error("Error in getMozillaBasedBrowserHistory:", error);
            return [];
        }
    };

    /**
     * Retrieves browser history for Chrome-based browsers.
     * 
     * @param {string} browserName - Name of the browser to fetch history from.
     * @param {string} title - Title to filter the history.
     * @returns {Promise<Array>} - Array of history records matching the title.
     */
    getChromeBasedBrowserHistory = async (browserName, title) => {
        try {
            const cleanedTitle = this.getCleanedTitle(title, browserName);
            const browserPaths = this.getBrowserPath(browserName);
            if (!browserPaths || browserPaths.length === 0) {
                return [];
            }            

            const tempDir = this.getTempDir();
            const dbPaths = [];
            let historyData = [];

            for (const browserPath of browserPaths) {
                const tempDbPath = path.join(tempDir, `${uuidV4()}.sqlite`);
                dbPaths.push(tempDbPath);
                fs.copyFileSync(browserPath, tempDbPath);
                const db = new Database(tempDbPath);

                const sql = `
                SELECT 
                    title, 
                    url,
                    last_visit_time
                FROM urls 
                WHERE title LIKE '%${cleanedTitle}%' 
                GROUP BY title 
                ORDER BY last_visit_time DESC
                LIMIT 1 OFFSET 0;
            `;

                const rows = db.prepare(sql).all();
                if (rows.length > 0) {
                    historyData = historyData.concat(rows);
                }

                db.close();
            }            

            // Clean up temporary files
            this.deleteTempFiles(dbPaths);


            return historyData;
        } catch (error) {
            console.error("Error in getChromeBasedBrowserHistory:", error);
            return [];
        }
    };

    /**
     * Retrieves browser history for Maxthon-based browsers.
     * 
     * @param {string} browserName - Name of the browser to fetch history from.
     * @param {string} title - Title to filter the history.
     * @returns {Promise<Array>} - Array of history records matching the title.
     */
    getMaxthonBasedBrowserHistory = async (browserName, title) => {
        try {
            const cleanedTitle = this.getCleanedTitle(title, browserName);
            const browserPaths = this.getBrowserPath(browserName);

            if (!browserPaths || browserPaths.length === 0) {
                console.warn("No valid browser path found for Maxthon.");
                return [];
            }

            const browserPath = browserPaths[0];            

            const sql = `
            SELECT DISTINCT 
                zurl, 
                ztitle AS title, 
                zurl AS url 
            FROM zmxhistoryentry 
            WHERE ztitle LIKE '%${cleanedTitle}%' 
            GROUP BY ztitle 
            ORDER BY zlastvisittime DESC 
            LIMIT 1 OFFSET 0;
        `;

            return await getDataFromDatabase(browserPath, sql);
        } catch (error) {
            console.error("Error in getMaxthonBasedBrowserHistory:", error);
            return [];
        }
    };

    /**
     * Retrieves browser history based on the browser name.
     * 
     * @param {string} browserName - Name of the browser to fetch history from.
     * @param {string} title - Title to filter the history.
     * @returns {Promise<Array>} - Array of browser history records.
     */
    getBrowserHistoryByName = async (browserName, title) => {
        try {
            if (["Google-chrome", "google-chrome"].some(substring => browserName.includes(substring))) {
                browserName = browsers.CHROME;
            }
            if (["Firefox", "firefox"].some(substring => browserName.includes(substring))) {
                browserName = browsers.FIREFOX;
            }

            switch (browserName) {
                case browsers.FIREFOX:
                case browsers.SEAMONKEY:
                    return await this.getMozillaBasedBrowserHistory(browserName, title);

                case browsers.CHROME:
                case browsers.OPERA:
                case browsers.TORCH:
                case browsers.VIVALDI:
                case browsers.BRAVE:
                case browsers.EDGE:
                case browsers.AVAST:
                    return await this.getChromeBasedBrowserHistory(browserName, title);

                case browsers.MAXTHON:
                    return await this.getMaxthonBasedBrowserHistory(browserName, title);

                default:
                    console.warn(`Unsupported browser: ${browserName}, ${browsers.CHROME}`);
                    return [];
            }
        } catch (error) {
            console.error("Error in getBrowserHistoryByName:", error);
            return [];
        }
    };

    /**
     * Executes a SQL query on a given database file and retrieves the results.
     * 
     * @param {string} browserPath - Path to the browser's history database file.
     * @param {string} sqlQuery - SQL query to execute on the database.
     * @returns {Promise<Array>} - Array of rows returned by the query.
     */
    getDataFromDatabase = async (browserPath, sqlQuery) => {
        let db;

        try {
            db = new Database(browserPath);
            db.pragma('journal_mode = WAL');

            const rows = db.prepare(sqlQuery).all();
            return rows;
        } catch (error) {
            console.error("Error executing query on database:", error);
            return [];
        } finally {
            if (db) {
                try {
                    db.close();
                } catch (closeError) {
                    console.error("Error closing database connection:", closeError);
                }
            }
        }
    };

    /**
     * Deletes temporary files and their associated WAL files.
     * 
     * @param {string[]} paths - Array of file paths to be deleted.
     */
    deleteTempFiles = (paths) => {
        paths.forEach(filePath => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.warn(`Failed to delete: ${filePath} or ${filePath}-wal`, error.message);
            }
        });
    };

    getTempDir = () => {
        return process.env.TMP || process.env.TMPDIR || tmpdir();
    }

    /**
     * Cleans the given title by removing browser names, special characters, and excessive text.
     * 
     * @param {string} title - The original title to clean.
     * @param {string} browserName - The name of the browser to exclude from the title.
     * @returns {string} - The cleaned and processed title.
     */
    getCleanedTitle = (title, browserName) => {
        if (!title || !browserName) {
            console.warn("Invalid title or browser name provided.");
            return "";
        }

        let cleanedTitle = title;
        cleanedTitle = cleanedTitle.replace("​ ", " ");
        // Step 1: Remove the browser name
        const browserNamePattern = `- ${browserName.replace("-", " ")}`;
        const browserNamePatternTwo = `— ${browserName.replace("-", " ")}`;
        cleanedTitle = cleanedTitle.replace(browserNamePattern, "").replace(browserNamePatternTwo, "").trim();

        // Step 2: Handle special character "ΓÇö"
        const specialChar = "ΓÇö";
        const specialCharIndex = cleanedTitle.indexOf(specialChar);
        if (specialCharIndex !== -1) {
            cleanedTitle = cleanedTitle.substring(0, specialCharIndex).trim();
        }

        // Step 3: Process delimiters and sanitize input

        if (cleanedTitle.includes(specialChar)) {
            cleanedTitle = cleanedTitle.replace(specialChar, "-").split("-")[0] // Replace "ΓÇö" with "-"
        }

        cleanedTitle = cleanedTitle // Take part before first "-"
            .split("|")[0] // Take part before "|"
            .split(":")[0] // Take part before ":"
            .replace(/'/g, "'") // Escape single quotes
            .trim();

        // Step 4: Limit title to the first 7 words
        cleanedTitle = this.getFirst5WordsIfLong(cleanedTitle);

        // Step 5: Decode URI-encoded components
        try {
            cleanedTitle = decodeURIComponent(cleanedTitle.trim());
        } catch (error) {
            console.warn("Failed to decode URI component:", error.message);
        }

        // Step 6: Remove double quotes
        if (cleanedTitle.includes('"')) {
            cleanedTitle = cleanedTitle.replace(/"/g, "");
        }

        // Step 7: Handle specific encoding "\342\200\231"
        const encodedChar = "\\342\\200\\231";
        if (cleanedTitle.includes(encodedChar)) {
            cleanedTitle = cleanedTitle.substring(0, cleanedTitle.indexOf(encodedChar)).trim();
        }

        if (cleanedTitle.includes("'")) {
            cleanedTitle = cleanedTitle.substring(0, cleanedTitle.indexOf("'")).trim();
        }

        if (browserName == browsers.EDGE) {
            cleanedTitle = this.gettingFilterTitleForEdgeOnly(cleanedTitle);            
        }

        // Final clean-up to ensure no residual browser name or excess whitespace
        return cleanedTitle.replace(browserNamePattern, "").replace(browserNamePatternTwo, "").trim();
    };

    getFirst5WordsIfLong(str) {
        const words = str.trim().split(/\s+/).filter(Boolean);
        if (words.length > 10) {
            // Get the first 7 words and join them into a string
            return words.slice(0, 5).join(' '); // Adding ellipsis for truncation
        } else {
            // If the string has 10 or fewer words, return the original string
            return str;
        }
    }

    gettingFilterTitleForEdgeOnly(title) {
        // Remove "and X more pages"
        let result = title.replace(/ and \d+ more pages/, '');

        // Extract the part before the '-'
        let beforeDash = result.split(' - ')[0];
        return beforeDash;
    }

    getDomainFromTitle(title) {
        const domainRegex = /\b([a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|ai|co|info|biz|me|tv|us|uk|ca|au|de|jp|fr|cn|ru|in|es|it|nl|se|no|fi|pl|ch|be|mx|br|ar|za|nz|sg|hk|tr|sa|ae))\b/;
        const match = title.match(domainRegex);

        if (match !== null && match.length) {
            return match[0];
        }
    }

}

module.exports = BrowserHistory;
