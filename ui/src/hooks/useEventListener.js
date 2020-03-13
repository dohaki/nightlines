import { useState, useRef } from 'react';

const useEventListener = (initialEventName, initialElement = global) => {
  const [eventName] = useState(initialEventName);
  const [element] = useState(initialElement);

  const savedEventListenerRemover = useRef();

  function addListener(handler) {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = handler;
    element.addEventListener(eventName, eventListener);
    
    savedEventListenerRemover.current = () => {
      element.removeEventListener(eventName, eventListener);
    };
  }

  return {
    destroyListener: savedEventListenerRemover.current,
    addListener
  }
};

export default useEventListener;
