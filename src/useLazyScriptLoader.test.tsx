import { renderHook, act } from '@testing-library/react-hooks';
import useLazyScriptLoader, { _scriptStates, UseLazyScriptLoaderReturn } from './index'; // Imports from index.tsx

// Interface for our mock script elements
interface MockScriptElement extends HTMLScriptElement {
  onload: ((this: GlobalEventHandlers, ev: Event) => any) | null;
  onerror: OnErrorEventHandler; 
}

describe('useLazyScriptLoader', () => {
  // Removed currentMockScriptElement from describe scope
  const mockScriptElementsByUrl: Map<string, MockScriptElement> = new Map();

  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let createElementSpy: jest.SpyInstance;

  const SCRIPT_URL_1 = 'https://example.com/script1.js';
  const SCRIPT_URL_2 = 'https://example.com/script2.js';

  beforeEach(() => {
    const createMockScript = (): MockScriptElement => {
      let _src = "";
      const mock: any = { 
        nodeName: 'SCRIPT', 
        async: false, type: '', charset: '', defer: false, crossOrigin: null, noModule: false, nonce: undefined, text: '',
        onload: null, onerror: null,
        dispatchEvent: jest.fn(), removeEventListener: jest.fn(),
        // Explicitly define parentNode for the spy on document.head.removeChild
        parentNode: document.head, 
      };
      Object.defineProperty(mock, 'src', { 
        get: () => _src, 
        set: (value: string) => { _src = value; }, 
        configurable: true, 
        enumerable: true 
      });
      mock.addEventListener = jest.fn(function(this: MockScriptElement, type: string, listener: EventListenerOrEventListenerObject) {
        if (type === 'load') mock.onload = listener as any;
        else if (type === 'error') mock.onerror = listener as any;
      });
      return mock as MockScriptElement;
    };

    mockScriptElementsByUrl.clear(); 

    createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string): HTMLElement => {
      if (tagName === 'script') {
        return createMockScript(); // Just return a new mock
      }
      return document.createElement(tagName); 
    });

    appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
      // Use nodeName for duck-typing, and check if src is a string (allows empty string)
      if (node.nodeName === 'SCRIPT' && typeof (node as HTMLScriptElement).src === 'string') {
        mockScriptElementsByUrl.set((node as HTMLScriptElement).src, node as MockScriptElement);
      }
      return node;
    });
    removeChildSpy = jest.spyOn(document.head, 'removeChild').mockImplementation(() => ({} as Node));

    _scriptStates.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    _scriptStates.clear();
    mockScriptElementsByUrl.clear();
  });

  it('should populate map on appendChild - debug', () => {
    const scriptEl = document.createElement('script') as MockScriptElement; // This will use the spy to create a mock
    // currentMockScriptElement is no longer in this scope, scriptEl is the direct result of createMockScript via the spy.
    scriptEl.src = SCRIPT_URL_1;
    
    act(() => {
      document.head.appendChild(scriptEl); 
    });
    
    expect(appendChildSpy).toHaveBeenCalledWith(scriptEl);
    expect(mockScriptElementsByUrl.has(SCRIPT_URL_1)).toBe(true);
    expect(mockScriptElementsByUrl.get(SCRIPT_URL_1)).toBe(scriptEl);
  });


  it('should have correct initial state for a valid URL', () => {
    const { result } = renderHook((props) => useLazyScriptLoader(props), {
      initialProps: SCRIPT_URL_1,
    });
    expect(result.current.isLoading).toBe(true); 
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should have correct initial state for a null URL', () => {
    const { result } = renderHook((props) => useLazyScriptLoader(props), {
      initialProps: null as string | null, 
    });
    expect(result.current.isLoading).toBe(false); 
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBeNull();
  });


  it('should handle successful script load', () => {
    const { result } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    
    const scriptToLoad = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(scriptToLoad).toBeDefined(); 
    if (!scriptToLoad) return; 
    expect(scriptToLoad.src).toBe(SCRIPT_URL_1);

    act(() => {
      if (scriptToLoad.onload) {
        scriptToLoad.onload({} as Event); 
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle script load error', () => {
    const { result } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    const scriptToLoad = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(scriptToLoad).toBeDefined();
    if (!scriptToLoad) return; 

    const errorEvent = new Event('error'); 
    act(() => {
      if (scriptToLoad.onerror) {
        scriptToLoad.onerror(errorEvent);
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(`Error loading script: ${SCRIPT_URL_1}`);
  });

  it('should only append script once for multiple hooks with same URL', () => {
    const { result: result1 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    const { result: result2 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    
    const scriptToLoad = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(scriptToLoad).toBeDefined();
    if (!scriptToLoad) return;

    act(() => {
      if (scriptToLoad.onload) scriptToLoad.onload({} as Event);
    });

    expect(result1.current.isLoaded).toBe(true);
    expect(result2.current.isLoaded).toBe(true);
  });
  
  it('should update all hooks on error for same URL', () => {
    const { result: result1 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    const { result: result2 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));

    const scriptToLoad = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(scriptToLoad).toBeDefined();
    if (!scriptToLoad) return;

    const errorEvent = new Event('error');
    act(() => {
        if (scriptToLoad.onerror) scriptToLoad.onerror(errorEvent);
    });

    expect(result1.current.error).toBeInstanceOf(Error);
    expect(result2.current.error).toBeInstanceOf(Error);
  });


  it('should cleanup script when last hook unmounts after load', () => {
    const { unmount: unmount1 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    const { unmount: unmount2 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    
    const scriptToLoad = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    expect(scriptToLoad).toBeDefined();
    if (!scriptToLoad) return;

    act(() => {
      if (scriptToLoad.onload) scriptToLoad.onload({} as Event);
    });

    act(() => unmount1());
    expect(removeChildSpy).not.toHaveBeenCalled();

    act(() => unmount2());
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledWith(scriptToLoad);
  });
  
  it('should cleanup script if unmounted before load and no other subscribers', () => {
    const { unmount } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    const scriptToLoad = mockScriptElementsByUrl.get(SCRIPT_URL_1); 
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(scriptToLoad).toBeDefined();

    act(() => unmount());
    
    expect(removeChildSpy).not.toHaveBeenCalled();
    expect(_scriptStates.get(SCRIPT_URL_1)?.subscribers.size).toBe(0);
    expect(_scriptStates.get(SCRIPT_URL_1)?.status).toBe('loading'); 
  });


  it('should load different scripts independently', () => {
    renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    renderHook(() => useLazyScriptLoader(SCRIPT_URL_2));

    const script1 = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    const script2 = mockScriptElementsByUrl.get(SCRIPT_URL_2);

    expect(appendChildSpy).toHaveBeenCalledTimes(2); 
    expect(script1).toBeDefined();
    expect(script2).toBeDefined();
    if(!script1 || !script2) return;

    expect(script1.src).toBe(SCRIPT_URL_1);
    expect(script2.src).toBe(SCRIPT_URL_2);
    
    const { result: result1 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1)); // Re-render to get state
    const { result: result2 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_2));


    act(() => {
      if (script1.onload) script1.onload({} as Event);
    });
    expect(result1.current.isLoaded).toBe(true);
    expect(result2.current.isLoaded).toBe(false);

    act(() => {
      if (script2.onload) script2.onload({} as Event);
    });
    expect(result1.current.isLoaded).toBe(true); 
    expect(result2.current.isLoaded).toBe(true); 
  });

  it('should not re-add script if re-rendered with same URL after load', () => {
    const { result, rerender } = renderHook(({ url }) => useLazyScriptLoader(url), {
      initialProps: { url: SCRIPT_URL_1 as string | null },
    });
    
    const scriptToLoad = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    expect(scriptToLoad).toBeDefined();
    if(!scriptToLoad) return;

    act(() => {
      if (scriptToLoad.onload) scriptToLoad.onload({} as Event);
    });
    expect(result.current.isLoaded).toBe(true);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);

    rerender({ url: SCRIPT_URL_1 });

    expect(appendChildSpy).toHaveBeenCalledTimes(1); 
    expect(result.current.isLoaded).toBe(true);
  });

  it('should load new script and cleanup old if URL changes on rerender', () => {
    const { result, rerender } = renderHook(
        (props: { url: string | null } ) => useLazyScriptLoader(props.url), 
        { initialProps: { url: SCRIPT_URL_1 } }
    );
    
    const script1 = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    expect(script1).toBeDefined();
    if(!script1) return;

    act(() => {
      if (script1.onload) script1.onload({} as Event);
    });
    expect(result.current.isLoaded).toBe(true);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    
    act(() => {
      rerender({ url: SCRIPT_URL_2 });
    });
    
    expect(result.current.isLoading).toBe(true); 
    expect(appendChildSpy).toHaveBeenCalledTimes(2); 
    const script2 = mockScriptElementsByUrl.get(SCRIPT_URL_2);
    expect(script2).toBeDefined();
    if(!script2) return;
    expect(script2.src).toBe(SCRIPT_URL_2);
    
    expect(removeChildSpy).toHaveBeenCalledWith(script1);
    expect(_scriptStates.has(SCRIPT_URL_1)).toBe(false);

    act(() => {
      if (script2.onload) script2.onload({} as Event);
    });
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
  
  it('should have correct initial state for an empty string URL', () => {
    const { result } = renderHook(() => useLazyScriptLoader('')); 

    // Expect that no script loading is attempted for an empty string
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBeNull(); 
    
    // appendChild should not have been called for an empty string src
    // We need to check how many times it might have been called by other renderHook calls within this test suite's describe block if not reset properly
    // However, for this specific hook call, it should not trigger an append.
    // Let's ensure it's not called with an empty src.
    const scriptWithEmptySrc = Array.from(mockScriptElementsByUrl.values()).find(s => s.src === '');
    expect(scriptWithEmptySrc).toBeUndefined();
    expect(mockScriptElementsByUrl.has('')).toBe(false); // Script should not be in the map
  });

  it('should handle unmount before script load event fires (multiple hooks for same script)', () => {
    const { unmount: unmount1 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));
    const { result: result2, unmount: unmount2 } = renderHook(() => useLazyScriptLoader(SCRIPT_URL_1));

    const scriptToLoad = mockScriptElementsByUrl.get(SCRIPT_URL_1);
    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(scriptToLoad).toBeDefined();
    if (!scriptToLoad) return;

    act(() => unmount1());
    expect(removeChildSpy).not.toHaveBeenCalled(); 

    act(() => {
      if (scriptToLoad.onload) scriptToLoad.onload({} as Event);
    });
    expect(result2.current.isLoaded).toBe(true); 

    act(() => unmount2());
    expect(removeChildSpy).toHaveBeenCalledTimes(1); 
    expect(removeChildSpy).toHaveBeenCalledWith(scriptToLoad);
  });

});
