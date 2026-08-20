import { mount } from 'svelte';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import './app.css';
import App from './App.svelte';
import { settings, llmConfig } from './state/settings';
import { dayLogs } from './state/log';
import { unboundActivities, unboundMeals } from './state/library';
import { back } from './state/app';

async function start() {
  await Promise.all([settings.ready, llmConfig.ready, dayLogs.ready, unboundActivities.ready, unboundMeals.ready]);
  mount(App, { target: document.getElementById('app')! });
}

if (Capacitor.isNativePlatform()) {
  CapacitorApp.addListener('backButton', () => {
    if (!back()) CapacitorApp.exitApp();
  });
}

void start();
