import { mount } from 'svelte';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import './app.css';
import App from './App.svelte';
import { createStorage } from './adapters/storage';
import { settings } from './state/settings';
import { dayLogs } from './state/log';
import { unboundActivities, unboundMeals } from './state/library';
import { back } from './state/app';

// estimates used to run on a user-supplied OpenRouter key; drop any still on disk
// rather than leave a credential behind for a service the app no longer calls
void createStorage().remove('calcifer.llm');

async function start() {
  await Promise.all([settings.ready, dayLogs.ready, unboundActivities.ready, unboundMeals.ready]);
  mount(App, { target: document.getElementById('app')! });
}

if (Capacitor.isNativePlatform()) {
  CapacitorApp.addListener('backButton', () => {
    if (!back()) CapacitorApp.exitApp();
  });
}

void start();
