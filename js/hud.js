/* ================= HUD: DOM refs, log, banners, chips ================= */

import { state } from './state.js';
import { cssColor } from './config.js';

const $ = id => document.getElementById(id);

export const ui = {
    scene: $('scene'), menu: $('menu'), tutorial: $('tutorial'), hud: $('hud'),
    timer: $('timer'), bar: $('progress-bar'), role: $('role'),
    instruction: $('instruction'), lock: $('lock'), log: $('log'),
    plays: $('plays'), human: $('human-score'), cpu: $('cpu-score'),
    possession: $('possession'), dive: $('dive'), restart: $('restart')
};

export function addLog(text, color) {
    const li = document.createElement('li');
    li.textContent = `[P${state.play}] ${text}`;
    if (color) li.style.color = color;
    ui.log.prepend(li);
    while (ui.log.children.length > 6) ui.log.lastChild.remove();
}

export function showBanner(text, hex) { state.banner = { text, hex }; state.bannerAge = 0; }

export function updatePossessionChip() {
    ui.possession.textContent = state.possession === 'you' ? 'YOU · BALL' : 'CPU · BALL';
    ui.possession.className = 'chip ' + state.possession;
}

export function setInstruction(text) { ui.instruction.textContent = text; }

export function updateScores() {
    ui.human.textContent = state.score[0];
    ui.cpu.textContent = state.score[1];
}

export { cssColor };
