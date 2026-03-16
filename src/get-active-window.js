import { activeWindow } from 'get-windows';

class GetActiveWindow {
    constructor() { }

    /**
     * Retrieves the currently active window information.
     * @returns {Promise<Object>} A promise resolving to the active window information.
     * @throws {Error} Throws an error if retrieval fails.
     */
    async getActiveWindows() {
        try {
            const result = await activeWindow({ screenRecordingPermission: false });
            return result || {}; // Return an empty object if no result
        } catch (error) {
            console.error("Error retrieving the active window:", error);
            throw new Error("Failed to retrieve active window."); // Keep meaningful error messages
        }
    }
}

module.exports = GetActiveWindow;
