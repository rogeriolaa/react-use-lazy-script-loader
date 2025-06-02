# @n0n3br/react-use-lazy-script-loader

A React hook for easily loading external JavaScript files asynchronously and managing their loading state.

## Installation

You can install the package using npm or yarn:

**npm:**
```bash
npm install @n0n3br/react-use-lazy-script-loader
```

**yarn:**
```bash
yarn add @n0n3br/react-use-lazy-script-loader
```

## Usage Example

Here's how to import and use the `useLazyScriptLoader` hook in your React component:

```javascript
import React from 'react';
import useLazyScriptLoader from '@n0n3br/react-use-lazy-script-loader';

function MyComponent() {
  // Replace with the actual script URL you want to load
  const SCRIPT_URL = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap';
  
  const { isLoading, isLoaded, error } = useLazyScriptLoader(SCRIPT_URL);

  if (isLoading) {
    return <p>Loading script...</p>;
  }

  if (error) {
    return <p>Error loading script: {error.message}</p>;
  }

  if (isLoaded) {
    // Example: Check if a global object (e.g., 'google') is available
    // This depends on what the loaded script exposes.
    if (window.google && window.google.maps) {
       // Initialize map or other script-dependent logic here
       // For example, if your script defines a function like initMap on window:
       // if (typeof window.initMap === 'function') {
       //   window.initMap();
       // }
       return <p>Google Maps script loaded successfully! You can now use `window.google.maps`.</p>;
    } else {
       return <p>Script loaded, but the expected global object (e.g., `window.google`) was not found. Please check the script URL and its behavior.</p>;
    }
  }

  return null; // Or some default/fallback UI
}

export default MyComponent;
```

**Note on Callbacks (e.g., Google Maps `callback=initMap`):**
This hook focuses on loading the script file itself. If the script requires a global callback function to be defined *before* it executes (common with APIs like Google Maps), you'll need to ensure that callback function is defined on the `window` object *before* the `useLazyScriptLoader` hook successfully loads the script. The hook doesn't manage the creation of such callback functions.

## API

### `useLazyScriptLoader(scriptUrl)`

-   **`scriptUrl`** (string, required): The full URL of the external JavaScript file to load.
    -   If an empty string or falsy value is passed, the hook will set `isLoading` to `false` and `error` to an `Error` object.

### Returns `object`

An object containing the following properties:

-   **`isLoading`** (boolean):
    -   `true` if the script is currently being fetched.
    -   `false` otherwise (i.e., if the script has loaded, failed, or if `scriptUrl` was invalid).
-   **`isLoaded`** (boolean):
    -   `true` if the script has successfully loaded.
    -   `false` otherwise.
-   **`error`** (Error | null):
    -   An `Error` object if script loading failed (e.g., network error, 404). The `error.message` will provide more details.
    -   `null` if the script loaded successfully or is still loading.

## Features

-   **Asynchronous Loading:** Loads scripts without blocking the main thread.
-   **Duplicate Prevention:** The same script URL is only fetched and added to the DOM once, even if multiple components use the hook with the same URL. The loading state is shared.
-   **Error Handling:** Provides an `error` state to inform your component if the script fails to load.
-   **Automatic Cleanup:** Script tags are automatically removed from the DOM when all components using that specific script URL have unmounted.
-   **Server-Side Rendering (SSR) Compatibility:** Gracefully handles being run in non-browser environments (though script loading will only occur client-side).
-   **Re-renders & URL Changes:** Handles re-renders and changes to the `scriptUrl` prop correctly, loading new scripts and cleaning up old ones as needed.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
```
