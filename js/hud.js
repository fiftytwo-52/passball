/* ================= HUD: DOM refs & tiny helpers ================= */

import { state } from './state.js';

const $ = id => document.getElementById(id);

export const ui = {
    scene: $('scene'), menu: $('menu'), tutorial: $('tutorial'), hud: $('hud'),
    timer: $('timer'), role: $('role'),
    plays: $('plays'), human: $('human-score'), cpu: $('cpu-score'),
    possession: $('possession'), divechip: $('divechip'), restart: $('restart')
};

/* logging removed by design — kept as no-ops so call sites stay harmless */
export function addLog() { }
export function setInstruction() { }

export function showBanner(text, hex) { state.banner = { text, hex }; state.bannerAge = 0; }

export function updatePossessionChip() {
    ui.possession.textContent = state.possession === 'you' ? 'YOU · BALL' : 'CPU · BALL';
    ui.possession.className = 'chip ' + state.possession;
}

const DIVE_LABEL = { '-1': '◀ LEFT', '0': 'STAY', '1': 'RIGHT ▶' };
export function updateDiveChip(choice) {
    ui.divechip.textContent = DIVE_LABEL[choice] ?? 'STAY';
}

export function updateScores() {
    ui.human.textContent = state.score[0];
    ui.cpu.textContent = state.score[1];
}
