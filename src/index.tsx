import { useState, useEffect } from 'react';

// Define types/interfaces
// Export for use in tests
export interface UseLazyScriptLoaderReturn {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
}

type ScriptStatus = 'loading' | 'loaded' | 'error';

// This interface defines what subscribers will receive.
// It mirrors UseLazyScriptLoaderReturn for simplicity.
interface ScriptStateUpdate {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
}

interface ScriptState {
  status: ScriptStatus;
  error?: Error | null;
  scriptElement?: HTMLScriptElement;
  subscribers: Set<(state: ScriptStateUpdate) => void>;
}

// Module-scoped map to track script states
// Exported for testing purposes ONLY. Do not use directly in production.
export const _scriptStates = new Map<string, ScriptState>();

function useLazyScriptLoader(scriptUrl: string | null): UseLazyScriptLoaderReturn {
  // Initial isLoading state: true if scriptUrl is provided, false otherwise.
  // This assumes that if a URL is given, loading will be attempted immediately.
  const [isLoading, setIsLoading] = useState<boolean>(!!scriptUrl);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!scriptUrl) {
      setIsLoading(false);
      setIsLoaded(false);
      setError(null); // Clear any previous error if URL becomes null
      return;
    }

    // Define the subscriber function for this hook instance.
    // This function will be called when the shared script state updates.
    const setStateForThisInstance = (newState: ScriptStateUpdate) => {
      setIsLoading(newState.isLoading);
      setIsLoaded(newState.isLoaded);
      setError(newState.error);
    };

    let scriptStateRecord = _scriptStates.get(scriptUrl);

    if (scriptStateRecord) {
      // Script is already known (either loading, loaded, or errored)
      // Update this hook instance's state to match the shared state.
      setStateForThisInstance({
        isLoading: scriptStateRecord.status === 'loading',
        isLoaded: scriptStateRecord.status === 'loaded',
        error: scriptStateRecord.error || null,
      });
      // Add this instance's subscriber to the set.
      scriptStateRecord.subscribers.add(setStateForThisInstance);
    } else {
      // New script to load.
      // Set initial state for this hook instance.
      setIsLoading(true);
      setIsLoaded(false);
      setError(null);

      // Create a new record for this script.
      const newSubscribers = new Set<(state: ScriptStateUpdate) => void>();
      newSubscribers.add(setStateForThisInstance);
      
      scriptStateRecord = {
        status: 'loading',
        subscribers: newSubscribers,
        error: null, // Initialize error as null
      };
      _scriptStates.set(scriptUrl, scriptStateRecord);

      // Create and configure the script element.
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      scriptStateRecord.scriptElement = script; // Store for potential removal.

      script.onload = () => {
        // Important: re-fetch the record in case it was modified (e.g. removed by cleanup)
        const currentScriptState = _scriptStates.get(scriptUrl);
        if (currentScriptState) { 
          currentScriptState.status = 'loaded';
          currentScriptState.error = null;
          // Notify all subscribers for this scriptUrl.
          currentScriptState.subscribers.forEach(sub => sub({ isLoading: false, isLoaded: true, error: null }));
        }
      };

      script.onerror = (event: Event | string) => {
        const currentScriptState = _scriptStates.get(scriptUrl);
        if (currentScriptState) {
          const err = new Error(typeof event === 'string' ? event : `Error loading script: ${scriptUrl}`);
          currentScriptState.status = 'error';
          currentScriptState.error = err;
          // Notify all subscribers for this scriptUrl.
          currentScriptState.subscribers.forEach(sub => sub({ isLoading: false, isLoaded: false, error: err }));
        }
      };

      document.head.appendChild(script);
    }

    // Cleanup function for the useEffect hook.
    return () => {
      if (scriptUrl) { // Only proceed if scriptUrl was valid for this effect run
        const currentScriptState = _scriptStates.get(scriptUrl);
        if (currentScriptState) {
          currentScriptState.subscribers.delete(setStateForThisInstance);

          // If no more subscribers and script is not 'loading' (i.e., it's 'loaded' or 'error')
          if (currentScriptState.subscribers.size === 0 && currentScriptState.status !== 'loading') {
            if (currentScriptState.scriptElement && currentScriptState.scriptElement.parentNode) {
              currentScriptState.scriptElement.parentNode.removeChild(currentScriptState.scriptElement);
            }
            _scriptStates.delete(scriptUrl); // Remove the script record entirely.
          }
        }
      }
    };
  }, [scriptUrl]); // Re-run effect if scriptUrl changes.

  return { isLoading, isLoaded, error };
}

export default useLazyScriptLoader;
