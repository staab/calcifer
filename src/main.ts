import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { settings, llmConfig } from './state/settings';
import { dayLogs } from './state/log';

async function start() {
  await Promise.all([settings.ready, llmConfig.ready, dayLogs.ready]);
  mount(App, { target: document.getElementById('app')! });
}

void start();
