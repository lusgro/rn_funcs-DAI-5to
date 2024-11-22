import { EventEmitter } from 'events';

const backgroundEventEmitter = new EventEmitter();

export const refreshBackground = () => {
  backgroundEventEmitter.emit('refreshBackground');
};

export const subscribeToBackgroundRefresh = (callback: () => void) => {
  backgroundEventEmitter.addListener('refreshBackground', callback);
  return () => {
    backgroundEventEmitter.removeListener('refreshBackground', callback);
  };
};