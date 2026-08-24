// 복습 게임(탑 오르기) - Firebase Realtime Database 공용 모듈
// world/, korea/ 두 게임 폴더가 이 파일을 그대로 가져다 씁니다.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getDatabase, ref, onValue, get, set, update, remove, push, child, onDisconnect
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAWsHD8UjeSbG0IvXW9izxbBiGDHpOzytk",
  authDomain: "history-review-game.firebaseapp.com",
  databaseURL: "https://history-review-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "history-review-game",
  storageBucket: "history-review-game.firebasestorage.app",
  messagingSenderId: "663174446158",
  appId: "1:663174446158:web:314c67ed3a3f69c0bed71f"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, onValue, get, set, update, remove, push, child, onDisconnect };

// ── 방(room) 경로 헬퍼 ─────────────────────────────
export function roomPath(roomId, ...parts) {
  return ["rooms", roomId, ...parts].join("/");
}
export function roomRef(roomId, ...parts) {
  return ref(db, roomPath(roomId, ...parts));
}

// ── 서버 시간 동기화 (기기마다 시계가 달라도 타이머가 어긋나지 않도록) ──
let serverOffsetMs = 0;
onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
  serverOffsetMs = snap.val() || 0;
});
export function serverNow() {
  return Date.now() + serverOffsetMs;
}

// ── 정답 채점 (기존 파이썬 서버의 normalize_answer / is_correct 이식) ──
const STRIP_RE = /[\s.,·・()\[\]{}'"‘’“”\-·]/g;

export function normalizeAnswer(text) {
  text = text || "";
  return text.replace(STRIP_RE, "").toLowerCase();
}

export function isCorrect(submitted, answers) {
  const norm = normalizeAnswer(submitted);
  if (!norm) return false;
  return answers.some((a) => normalizeAnswer(a) === norm);
}

// 5초 이내 +3층, 10초 이내 +2층, 그 이후 +1층
export function computeGain(elapsedSec) {
  if (elapsedSec <= 5) return 3;
  if (elapsedSec <= 10) return 2;
  return 1;
}

export function fmtTime(sec) {
  if (sec === null || sec === undefined || sec < 0) return "--:--";
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export function playerAccuracy(p) {
  const total = (p.correct || 0) + (p.wrong || 0);
  return total ? (p.correct || 0) / total : null;
}

export function rankedPlayers(players) {
  return players
    .slice()
    .sort((a, b) => (b.floor || 0) - (a.floor || 0) || (b.correct || 0) - (a.correct || 0));
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 문제 은행 텍스트(주제 | 문제 | 정답) 한 줄 파싱 ──
export function parseQuestionLine(line) {
  line = (line || "").trim();
  if (!line || line.startsWith("#")) return null;
  const parts = line.split("|").map((p) => p.trim());
  if (parts.length !== 3) return null;
  let [unit, question, answerField] = parts;
  if (!unit || !question || !answerField) return null;
  if (!question.includes("____")) question = question + " ____";
  const answers = answerField.split("/").map((a) => a.trim()).filter(Boolean);
  if (!answers.length) return null;
  return { unit, question, answers };
}

// ── 문제 풀 계산 ──
export function unitsFromQuestions(questionsObj) {
  const counts = {};
  Object.values(questionsObj || {}).forEach((q) => {
    counts[q.unit] = (counts[q.unit] || 0) + 1;
  });
  return Object.entries(counts).map(([unit, count]) => ({ unit, count }));
}

export function poolFromQuestions(questionsObj, units) {
  const entries = Object.entries(questionsObj || {});
  if (!units || units.length === 0) return entries;
  const unitSet = new Set(units);
  return entries.filter(([, q]) => unitSet.has(q.unit));
}

// ── 팀전 모드 ──
export const TEAM_OPTIONS = [
  { key: "red", label: "🔴 빨강팀", color: "#e85d75" },
  { key: "blue", label: "🔵 파랑팀", color: "#5aa9e6" },
  { key: "green", label: "🟢 초록팀", color: "#7bd389" },
  { key: "purple", label: "🟣 보라팀", color: "#c792ea" },
];

export function teamInfo(key) {
  return TEAM_OPTIONS.find((t) => t.key === key) || null;
}

export function teamStandings(players) {
  const map = new Map();
  (players || []).forEach((p) => {
    if (!p.team) return;
    const cur = map.get(p.team) || { team: p.team, floor: 0, correct: 0, members: 0 };
    cur.floor += p.floor || 0;
    cur.correct += p.correct || 0;
    cur.members += 1;
    map.set(p.team, cur);
  });
  return Array.from(map.values()).sort((a, b) => b.floor - a.floor || b.correct - a.correct);
}

// ── 역전 이벤트(2배 찬스) ──
// 관리자가 버튼으로 수동 발동만 함 (admin.html의 bonusNowBtn)

// round(status/end_time/duration_sec/bonus)와 현재 시각(serverNow())을 받아
// 지금 보너스 구간이면 {start,end,mult,remaining}, 아니면 null 반환
export function activeBonus(round, nowMs) {
  if (!round || !round.bonus || !round.bonus.length || round.end_time == null || !round.duration_sec) return null;
  const startMs = round.end_time - round.duration_sec * 1000;
  const elapsed = (nowMs - startMs) / 1000;
  const win = round.bonus.find((b) => elapsed >= b.start && elapsed < b.end);
  return win ? { ...win, remaining: Math.max(0, Math.ceil(win.end - elapsed)) } : null;
}

// ── 학생별 랜덤 캐릭터 배정 ──
export const ANIMAL_EMOJIS = [
  "🐰", "🐱", "🐯", "🐻", "🐼", "🐨", "🦁", "🐵", "🐶", "🦊",
  "🐸", "🐷", "🐹", "🐭", "🐮", "🐔", "🦉", "🐢", "🐙", "🦄",
  "🐧", "🐬", "🦋", "🐿️"
];

// 이미 배정된 캐릭터(existingAvatars)와 겹치지 않는 걸 우선 고르고,
// 다 떨어지면(학생 수 > 캐릭터 종류) 아무거나 랜덤으로 고름
export function pickAvatarEmoji(existingAvatars) {
  const taken = new Set(existingAvatars || []);
  const free = ANIMAL_EMOJIS.filter((e) => !taken.has(e));
  const pool = free.length ? free : ANIMAL_EMOJIS;
  return pool[Math.floor(Math.random() * pool.length)];
}
