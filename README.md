# Active Window with Browser URL

This package provides functionality to detect the currently active window on your system and retrieve the URL of a browser tab if the active window is a browser that matches the list of browsers provided by the user. It stores the browser list data and fetches the URL when a browser window is matched.

## Features

- **Active Window Detection**: Detects the active window on the system.
- **Browser List Matching**: Allows users to specify a list of browsers. If the active window is a browser from this list, it retrieves the URL of the browser's active tab.
- **Data Storage**: Saves the browser list in a JSON file, allowing persistent data between sessions.
- **URL Retrieval**: Retrieves the current URL of the active browser tab if the window belongs to a listed browser.

## Installation

To install this package, clone or install it in your project using npm:

```bash
npm install <path-to-package>
```

# Usage
1. Setting the Browser List
You need to provide a list of browsers that the package will check against the active window. Use the saveBrowserList function to save this list to a JSON file.

```
const FileOperation = require("./src/file-operation");

const fileOperation = new FileOperation();
const browserList = [
  { title: "Google Chrome" },
  { title: "Mozilla Firefox" },
  // Add more browsers as needed
];

fileOperation.saveBrowserList(browserList);
```

2. Getting the Active Window with URL
Once the browser list is saved, use the getActiveWindowWithUrl function to retrieve information about the active window, including the browser name and its URL.

```
const GetActiveWindow = require("./src/get-active-window");
const FileOperation = require("./src/file-operation");
const GetTrackdekWindowWithActiveWin = require("./src/get-trackdek-windows");

const getTrackdekWindow = new GetTrackdekWindowWithActiveWin();
const fileOperation = new FileOperation();

const browserList = fileOperation.readBrowserList(); // Retrieve the saved browser list
getTrackdekWindow.getActiveWindowWithUrl(browserList).then((activeWindow) => {
  console.log(activeWindow);
}).catch((error) => {
  console.error("Error retrieving active window:", error);
});
```

3. Example Output
When the active window is a browser from the provided list, the package returns an object containing the active window's details, including the browser's name, window position, and memory usage, along with the current URL.

Here is an example of the object returned:

```
{
  "platform": "windows",
  "id": 2032686,
  "title": "Hello World - Google Chrome",
  "owner": {
    "processId": 14400,
    "path": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "name": "Google Chrome"
  },
  "bounds": {
    "x": 762,
    "y": 0,
    "width": 781,
    "height": 822
  },
  "memoryUsage": 348274688,
  "isBrowser": true,
  "url": "https://www.google.com"
}
```

4. Fields in the Returned Object:
- platform: The operating system platform (e.g., windows).
- id: The unique identifier for the active window.
- title: The title of the active window.
- owner: An object containing details about the browser process.
- processId: The process ID of the browser.
- path: The path to the browser executable.
- name: The name of the browser (e.g., Google Chrome).
- bounds: The position and size of the window on the screen.
- x: The X-coordinate of the window.
- y: The Y-coordinate of the window.
- width: The width of the window.
- height: The height of the window.
- memoryUsage: The memory usage of the active window in bytes.
- isBrowser: A boolean indicating whether the active window belongs to a browser.
- url: The current URL of the browser tab, if available.

## Error Handling
- File Read/Write Errors: If there is an issue reading or writing the browser list file, an error will be thrown with a detailed message.
- Active Window Errors: If the active window cannot be detected or no matching browser is found, the package logs the error and handles it appropriately.


### Key Points:
- **Setting the Browser List**: Users can specify a list of browsers they want the package to monitor.
- **Getting Active Window with URL**: The package checks the active window and matches it with the provided browsers list, then retrieves the current URL if the window belongs to a browser.
- **Returned Object Format**: The package provides detailed information about the active window and the current URL if it's a browser.

This `README.md` file contains everything your users will need to understand, install, and use your package.
