const fs = require("fs");
const path = require("path");

class FileOperation {
    // Define the folder and ensure it exists
    dataFolder = path.join(__dirname, '../data');

    fileName = "browser-list.json";
    filePath = path.join(this.dataFolder, this.fileName);

    constructor() { }

    saveBrowserList(browsersList) {
        try {
            if (!fs.existsSync(this.dataFolder)) {
                fs.mkdirSync(this.dataFolder, { recursive: true }); // Create the folder if it doesn't exist
            }

            // Validate input
            if (!Array.isArray(browsersList)) {
                throw new Error("Invalid input: browsersList must be an array.");
            }

            // Prepare the data object
            const createObjectBrowserList = { browsersList };

            // Write to file
            fs.writeFileSync(this.filePath, JSON.stringify(createObjectBrowserList, null, 2), 'utf8');

            return {
                status: "success",
                filePath: this.filePath
            }
        } catch (error) {
            console.error('Error saving the browser list:', error.message);
            throw new Error(`Failed to create the file: ${this.filePath}`);
        }
    }

    readBrowserList() {
        try {
            const fileContent = fs.readFileSync(this.filePath, 'utf8');

            if (!fileContent) {
                console.log("No data found. Please save data first using the saveBrowserList function.");
                return []; // Return an empty array as a default value
            }

            const parsedContent = JSON.parse(fileContent);
            return parsedContent.browsersList || []; // Return the browsersList or an empty array
        } catch (error) {
            console.error('Error while reading the file:', error.message);
            throw new Error('Failed to read or parse the file.');
        }
    }


}

module.exports = FileOperation;