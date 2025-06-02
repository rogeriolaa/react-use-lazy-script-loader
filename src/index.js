import { useState, useEffect } from 'react';

export const _scriptStates = new Map(); // Export for testing

function useLazyScriptLoader(scriptUrl) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!scriptUrl) {
      setIsLoading(false);
      setError(new Error('scriptUrl cannot be empty'));
      setIsLoaded(false);
      return;
    }

    const subscriber = (statusUpdate) => {
      if (statusUpdate.loaded) {
        setIsLoading(false);
        setIsLoaded(true);
        setError(null);
      } else if (statusUpdate.errorObj) {
        setIsLoading(false);
        setIsLoaded(false);
        setError(statusUpdate.errorObj);
      } else { // Still loading
        setIsLoading(true);
        setIsLoaded(false);
        setError(null);
      }
    };

    let record = _scriptStates.get(scriptUrl);

    if (record) {
      switch (record.status) {
        case 'loaded':
          setIsLoading(false);
          setIsLoaded(true);
          setError(null);
          break;
        case 'error':
          setIsLoading(false);
          setIsLoaded(false);
          setError(record.error);
          break;
        case 'loading':
          setIsLoading(true);
          setIsLoaded(false);
          setError(null);
          record.subscribers.add(subscriber);
          break;
        default:
          // Should not happen
          break;
      }
    } else {
      // New script
      setIsLoading(true);
      setIsLoaded(false);
      setError(null);

      const scriptElement = document.createElement('script');
      scriptElement.src = scriptUrl;
      scriptElement.async = true;

      const newRecord = {
        status: 'loading',
        scriptElement,
        subscribers: new Set([subscriber]),
        error: null,
      };
      _scriptStates.set(scriptUrl, newRecord);

      const handleLoad = () => {
        newRecord.status = 'loaded';
        newRecord.subscribers.forEach(sub => sub({ loaded: true, errorObj: null }));
      };

      const handleError = (event) => {
        // For more detailed error, you might need to check event.error or construct a new Error
        const errorObj = new Error(`Failed to load script: ${scriptUrl}`); 
        newRecord.status = 'error';
        newRecord.error = errorObj;
        newRecord.subscribers.forEach(sub => sub({ loaded: false, errorObj }));
      };

      scriptElement.addEventListener('load', handleLoad);
      scriptElement.addEventListener('error', handleError);

      document.head.appendChild(scriptElement);
    }

    return () => {
      // Cleanup
      const currentRecord = _scriptStates.get(scriptUrl);
      if (currentRecord) {
        currentRecord.subscribers.delete(subscriber);
        if (currentRecord.subscribers.size === 0 && currentRecord.status !== 'loading') { // also check status to prevent premature removal if script is still loading but component unmounted
          if (currentRecord.scriptElement && currentRecord.scriptElement.parentElement) {
            document.head.removeChild(currentRecord.scriptElement);
          }
          _scriptStates.delete(scriptUrl);
        }
      }
    };
  }, [scriptUrl]);

  return { isLoading, error, isLoaded };
}

export default useLazyScriptLoader;
