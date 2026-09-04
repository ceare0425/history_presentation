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

// ── 정답의 초성만 남긴 힌트 문자열 (예: "함무라비 법전" → "ㅎㅁㄹㅂ ㅂㅈ") ──
export function choseongHint(text) {
  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  let out = "";
  for (const ch of String(text || "")) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      out += CHO[Math.floor((code - 0xac00) / 588)];
    } else {
      out += ch; // 공백·숫자·영문·한자 등은 그대로 둔다 (그 자체로 힌트가 됨)
    }
  }
  return out;
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

// ── "최근 주제 우선" 출제: 주제명 앞 숫자(주제 01 → 1)가 클수록 최근으로 본다 ──
export function unitOrderNum(unit) {
  const m = String(unit || "").match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// unitList: 이번 라운드에 등장하는 주제명 배열. 반환값은 주제명 → 가중치(가장 예전 주제=1, 가장 최근=maxWeight) 함수.
// 숫자가 없는 주제는 가장 예전(=1)으로 취급한다.
export function recencyWeightFn(unitList, maxWeight = 3) {
  const nums = (unitList || []).map(unitOrderNum).filter((n) => n !== null);
  if (nums.length === 0) return () => 1;
  const lo = Math.min(...nums), hi = Math.max(...nums);
  return (unit) => {
    const n = unitOrderNum(unit);
    if (n === null || hi === lo) return 1;
    return 1 + ((n - lo) / (hi - lo)) * (maxWeight - 1);
  };
}

// 가중치에 따라 문제가 여러 번 들어간 큐를 만든다(같은 문제가 바로 붙지 않게 최대한 벌려줌).
export function weightedQueue(entries, weightOf) {
  const bag = [];
  for (const [qid, q] of entries) {
    const w = Math.max(1, Math.round(weightOf(q.unit)));
    for (let i = 0; i < w; i++) bag.push(qid);
  }
  const arr = shuffle(bag);
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === arr[i - 1]) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j] !== arr[i - 1] && (j + 1 >= arr.length || arr[j + 1] !== arr[i])) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          break;
        }
      }
    }
  }
  return arr;
}

// 가중치를 반영해 k개를 비복원 추출 (Efraimidis–Spirakis). 출제 문항 수를 제한할 때 사용.
export function weightedSample(entries, weightOf, k) {
  return entries
    .map(([qid, q]) => [qid, Math.pow(Math.random(), 1 / Math.max(0.01, weightOf(q.unit)))])
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map((x) => x[0]);
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

// 팀전 아이템: '선두권 견제' 공격 아이템이 노릴 상대 팀 하나를 고른다.
// 내 팀을 뺀 팀 중 층수 합이 가장 높은 팀(= 견제 대상). 상대 팀이 없으면 null → 호출부에서 자기 강화로 전환.
export function pickTargetTeam(players, myTeam) {
  const rivals = teamStandings(players).filter((s) => s.team !== myTeam && s.members > 0);
  return rivals.length ? rivals[0].team : null;
}

// 팀전(매운맛): 내 팀이 선두 팀에 뒤처진 정도로 '견제 아이템 가중치' 0~1을 돌려준다.
// 선두 팀이거나 1인당 평균 격차가 4층 이내면 0, 격차가 벌어질수록 1에 근접 → rollItem이 방해 아이템을 더 자주 뽑음.
export function teamAttackBias(players, myTeam) {
  if (!myTeam) return 0;
  const st = teamStandings(players).filter((s) => s.members > 0);
  if (st.length < 2) return 0;
  const avg = (s) => (s.members ? (s.floor || 0) / s.members : 0);
  const lead = st.slice().sort((a, b) => avg(b) - avg(a))[0];
  const mine = st.find((s) => s.team === myTeam);
  if (!mine || mine.team === lead.team) return 0;
  const gap = avg(lead) - avg(mine);       // 1인당 평균 층수 차이
  if (gap <= 4) return 0;
  return Math.min(1, (gap - 4) / 12);      // 4층 차이=0, 16층 차이 이상=1
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

// ── 아이템전 ──────────────────────────────────────
// round.items_mode: 'off' | 'mild'(순한맛) | 'spicy'(매운맛)
//   mild  : 자기 강화 + 전체 이벤트만 (저격 없음)
//   spicy : 위 + '선두권 견제' 방해 아이템 포함
// 아이템은 3연속 정답마다 1개 획득(보유 1개 한도).
// 팀전에서도 동작하며, '선두권 견제' 아이템은 내 팀이 아닌 '선두 상대 팀 전원'에게 적용된다.
export const ITEMS = {
  boost:    { emoji: '⚡',  name: '부스터',    kind: 'self',    desc: '다음 정답 3개 2배' },
  ladder:   { emoji: '🪜',  name: '사다리',    kind: 'self',    desc: '즉시 +2층' },
  rocket:   { emoji: '🚀',  name: '로켓 점프',  kind: 'self',    desc: '즉시 +5층 (다음 정답 1번은 층수 없음)' },
  reroll:   { emoji: '🔁',  name: '리롤',      kind: 'self',    desc: '지금 문제를 다른 문제로 교체' },
  hint:     { emoji: '💡',  name: '힌트',      kind: 'self',    desc: '지금 문제 정답 초성 공개 (이 문제는 +1층)' },
  shield:   { emoji: '🛡️',  name: '콤보 방패',  kind: 'self',    desc: '다음 오답에도 연속이 안 끊김' },
  goldenbell:{ emoji: '🎯', name: '골든벨',     kind: 'self',    desc: '다음 정답은 ×3! 틀리면 연속 끊김 -2층' },
  clover:   { emoji: '🍀',  name: '네잎클로버', kind: 'self',    desc: '30초간 정답마다 50%로 +1층 더' },
  magnet:   { emoji: '🧲',  name: '추격',       kind: 'self',    desc: '바로 위 등수와의 층 차이를 절반으로' },
  roulette: { emoji: '🎰',  name: '행운의 룰렛', kind: 'self',    desc: '즉시 -3 ~ +8층 랜덤!' },
  undo:     { emoji: '🪃',  name: '되돌리기',   kind: 'self',    desc: '방금 틀린 문제를 없던 일로 (오답 -1·연속 복구)' },
  jackpot:  { emoji: '🎲',  name: '인생 한방',  kind: 'self',    desc: '다음 정답 +20층 / 오답 -10층 (개인전·팀전 공통)' },
  snowball: { emoji: '🌀',  name: '눈덩이',    kind: 'self',    desc: '다음 정답에 지금 연속 수만큼 층수 추가' },
  vest:     { emoji: '🛟',  name: '구명조끼',  kind: 'self',    desc: '20초간 틀려도 층수·연속이 안 깎임 (미끄럼틀·강탈도 막음)' },
  randombox:{ emoji: '🎁',  name: '랜덤박스',  kind: 'self',    desc: '즉시 다른 아이템 하나를 뽑아 바로 발동' },
  cure:     { emoji: '🍵',  name: '해독',      kind: 'defense', desc: '나에게 걸린 방해를 즉시 해제' },
  mirror:   { emoji: '🪞',  name: '반사경',     kind: 'defense', desc: '15초간 날아오는 첫 견제를 쏜 사람에게 반사' },
  festival: { emoji: '🌈',  name: '축제',      kind: 'global',  desc: '20초간 모두 2배' },
  anthem:   { emoji: '📣',  name: '팀 응원가',  kind: 'global',  desc: '우리 팀 전원 다음 정답 1개 2배' },
  soloFest: { emoji: '🛋️',  name: '방구석 축제', kind: 'comeback', desc: '30초간 나만 2배' },
  fog:      { emoji: '🌫️',  name: '안개',      kind: 'attack',  desc: '선두권 문제 화면이 8초간 흐려짐' },
  ice:      { emoji: '🧊',  name: '얼음',      kind: 'attack',  desc: '선두권이 5초간 제출 불가' },
  snail:    { emoji: '🐌',  name: '느림보',    kind: 'attack',  desc: '선두권 다음 정답이 +1층만' },
  slide:    { emoji: '⬇️',  name: '미끄럼틀',  kind: 'attack',  desc: '선두권 -3층 (2등 층수 아래로는 안 내려감)' },
  steal:    { emoji: '🥷',  name: '강탈',      kind: 'attack',  desc: '선두권 -4층, 나 +4층 (팀전은 상대 팀 전원 -2)' },
};

// 매운맛(spicy)에서는 방해 효과가 더 오래/세게 간다.
export const ITEM_FX_MS = {
  fog: 8000, ice: 5000, festival: 20000, immunity: 8000,
  fogSpicy: 10000, iceSpicy: 7000, immunitySpicy: 4000,
  soloFest: 30000, clover: 30000, mirror: 15000, vest: 20000,
};

// 이번 판에서 뽑을 수 있는 아이템 key 목록. opts:
//   mode        : 'mild' | 'spicy'
//   canAttack   : 방해(attack) 아이템 후보 포함 (매운맛 + 뽑는 사람이 상위권이 아닐 때)
//   canComeback : '방구석 축제' 포함 (개인전 하위권)
//   teamMode    : 팀전 여부 — '추격'은 개인전만, '팀 응원가'는 팀전만
// 그리고 '반사경'은 견제가 있는 매운맛에서만 나온다.
export function itemPool(opts = {}) {
  const { mode = 'mild', canAttack = false, canComeback = false, teamMode = false } = opts;
  return Object.entries(ITEMS)
    .filter(([k, it]) => {
      if (it.kind === 'attack') return mode === 'spicy' && canAttack;
      if (it.kind === 'comeback') return canComeback;
      if (k === 'mirror') return mode === 'spicy';
      if (k === 'magnet') return !teamMode;
      if (k === 'anthem') return teamMode;
      if (k === 'randombox') return !opts.noRandombox;   // '랜덤박스' 재추첨 땐 제외
      return true;
    })
    .map(([k]) => k);
}

// opts.attackBias(0~1): 클수록 방해(attack) 아이템이 뽑힐 확률이 올라간다. 0이면 균등 추첨.
// opts.jackpotTier(0|1|2): '인생 한방' 가중치 — 1=중하위권(4배), 2=하위권(6배).
// comeback 아이템은 가중치 3배로 잘 뜬다.
export function rollItem(opts = {}) {
  const pool = itemPool(opts);
  if (!pool.length) return null;
  const bias = opts.attackBias || 0;
  const aw = bias > 0 ? 1 + 6 * Math.min(1, bias) : 1;   // 견제 아이템 가중치 최대 7배
  const jw = opts.jackpotTier === 2 ? 6 : opts.jackpotTier === 1 ? 4 : 1;   // '인생 한방'
  const weights = pool.map((k) => {
    const kind = ITEMS[k] && ITEMS[k].kind;
    if (k === 'jackpot') return jw;
    if (kind === 'attack') return aw;
    if (kind === 'comeback') return 3;
    return 1;
  });
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// 상위 그룹 크기: 15명 이하면 3명, 그보다 많으면 인원의 20%(최소 3).
export function topGroupSize(count) {
  return count <= 15 ? 3 : Math.max(3, Math.round(count * 0.2));
}

// players: [{id, name, floor, ...}] (id 포함). id가 상위 그룹 안에 있는지.
export function inTopGroup(players, id) {
  const ranked = rankedPlayers(players);
  const n = topGroupSize(ranked.length);
  return ranked.slice(0, n).some((p) => p.id === id);
}

// 하위권: 참가 6명 이상일 때, 순위 하위 topGroupSize명 중 '중위권보다 2층 이상 뒤처진' 사람.
// '방구석 축제'(혼자 30초 2배) 아이템을 이들에게만 준다 — 등수가 낮아 속상해하는 학생 사기 진작용.
export function inBottomGroup(players, id) {
  const ranked = rankedPlayers(players);
  if (ranked.length < 6) return false;
  const n = topGroupSize(ranked.length);
  const me = ranked.find((p) => p.id === id);
  if (!me) return false;
  if (!ranked.slice(-n).some((p) => p.id === id)) return false;
  const medianFloor = ranked[Math.floor(ranked.length / 2)]?.floor || 0;
  return medianFloor - (me.floor || 0) >= 2;
}

// 중하위권: 참가 4명 이상일 때 현재 층수가 중앙값 이하인 학생(하위 ~50%).
// '인생 한방' 아이템 가중치를 올려 역전 기회를 더 준다.
export function inLowerHalf(players, id) {
  const ranked = rankedPlayers(players);
  if (ranked.length < 4) return false;
  const me = ranked.find((p) => p.id === id);
  if (!me) return false;
  const medianFloor = ranked[Math.floor(ranked.length / 2)]?.floor || 0;
  return (me.floor || 0) <= medianFloor;
}

// 방해 대상 후보: 상위 그룹 중 '중위권보다 일정 층 이상 앞선' 사람(자신 제외). 랭킹 순으로 반환.
// 후보가 없으면 [] → 호출부에서 자기 강화로 전환한다.
// spicy(매운맛): 상위 그룹을 1명 넓히고 필요 격차를 4→2층으로 낮춰 접전에서도 견제가 들어간다.
export function attackCandidates(players, byId, spicy = false) {
  const ranked = rankedPlayers(players);
  if (ranked.length < 2) return [];
  const n = topGroupSize(ranked.length) + (spicy ? 1 : 0);
  const medianFloor = ranked[Math.floor(ranked.length / 2)]?.floor || 0;
  const gap = spicy ? 2 : 4;
  return ranked
    .slice(0, n)
    .map((p, i) => ({ ...p, rank: i + 1 }))
    .filter((p) => p.id !== byId
      && (p.floor || 0) - medianFloor >= gap);
}

// 후보(랭킹 순) 중 하나를 가중치로 고른다. 1·2·3위에 50/30/20, 그 아래는 완만히 감소.
export function pickAttackTarget(candidates) {
  if (!candidates.length) return null;
  const W = [50, 30, 20, 12, 8, 5, 3, 2, 1];
  const weights = candidates.map((_, i) => W[i] ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
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
