import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { settings, llmConfig } from './state/settings';
import { dayLogs } from './state/log';
import { unboundActivities, unboundMeals } from './state/library';

async function start() {
  await Promise.all([settings.ready, llmConfig.ready, dayLogs.ready, unboundActivities.ready, unboundMeals.ready]);
  mount(App, { target: document.getElementById('app')! });
}

void start();
