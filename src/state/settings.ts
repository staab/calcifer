import { persisted } from './persist';
import { createStorage } from '$src/adapters/storage';
import { DEFAULT_SETTINGS } from '$src/domain/constants';
import type { Settings } from '$src/domain/types';

export const settings = persisted<Settings>(createStorage(), 'calcifer.settings', DEFAULT_SETTINGS);
