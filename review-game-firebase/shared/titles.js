// 칭호 수집 — 수업 게임(play.html)·혼자 연습(solo.html)·전광판(board.html) 공용
// lib.js를 직접 import하지 않고 쓰는 쪽에서 db 함수들을 넘겨받는다
// (lib.js는 ?v= 버전별로 다른 모듈이 되므로, 여기서 따로 import하면 Firebase 앱이 두 번 만들어질 수 있음).
//
// 저장 위치: titles/<room>/<학년-반>/<이름>/
//   q/<qid>: {c, w}              칭호 기능 이후 푼 문제별 정답·오답 누적 (수업 게임 + 혼자 연습)
//   hist: {q:{qid:{c,w}}, days}  칭호 기능 전 solo_log·class_log 기록을 처음 한 번 옮겨 담은 것 (histDone: true)
//   days/<yyyymmdd>: true        문제를 푼 날짜 (수업 게임 + 혼자 연습)
//   log/<라운드token>_<종류>: true  수업 게임 명예 기록 — 전광판이 종료 때 남긴다(같은 라운드는 한 번만 셈)
//   hidden/<id>: ts              숨은 칭호 달성
//   seen/<칭호id>: ts            한 번 받은 칭호 (문제가 추가돼 조건이 바뀌어도 받은 칭호는 유지)
//   rep: 칭호id                  대표 칭호 (전광판 이름 위에 표시)

export const RARITY = {
  common: { label:'일반', color:'#6b7483', bg:'#eef0f4', dark:'#d3d9e3' },
  rare:   { label:'희귀', color:'#2563d9', bg:'#e4edff', dark:'#8fbaff' },
  epic:   { label:'영웅', color:'#8a3fd6', bg:'#f1e6ff', dark:'#cfa4ff' },
  legend: { label:'전설', color:'#b07b00', bg:'#fff1c7', dark:'#ffd54a' }
};
const TIER_EMOJI = ['🥉','🥈','🥇'];
const TIER_RARITY = ['common','rare','epic'];
const TIER_LABEL = ['입문','숙련','달인'];

// 주제 번호 → [입문, 숙련, 달인]
const UNIT_TITLES = {
  korea: {
    1:['비밀결사 새내기','독립의군부 대원','대한광복회 총사령'],
    2:['민족 신문 애독자','『개벽』 편집자','분열 통치 간파자'],
    3:['우리말 지킴이','창씨개명 거부자','민족혼 수호자'],
    4:['회사령 연구생','토지 조사 사업 분석가','식민 경제 해부학자'],
    5:['쌀 수탈 추적자','산미 증식 계획 분석가','20년대 경제 박사'],
    6:['공출 고발자','국가 총동원법 분석가','강제 동원 진상 규명관'],
    7:['간도 개척민','연해주 한인촌 주민','재외 동포 역사가'],
    8:['태극기 든 학생','독립 선언서 낭독자','3·1 만세의 주역'],
    9:['연통제 연락원','교통국 요원','임시 의정원 의원'],
    10:['독립군 신병','봉오동의 명사수','청산리 대첩 영웅'],
    11:['물산 장려 소비자','민립 대학 기성회원','브나로드 운동 대원'],
    12:['신간회 회원','근우회 활동가','민족 협동 전선 설계자'],
    13:['경성 산책자','토막민 기록자','식민 도시 탐험가'],
    14:['형평사 동지','암태도 소작 쟁의 농민','원산 총파업 지도자'],
    15:['한글 맞춤법 지킴이','조선어 학회 회원','신채호의 후예'],
    16:['경성 극장 관객','유성기 음반 수집가','〈아리랑〉 영화광'],
    17:['한국 독립군 대원','조선 혁명군 대원','쌍성보·영릉가 영웅'],
    18:['한인 애국단 단원','조선 의용대 대원','한국광복군 총사령'],
    19:['건국 동맹 동지','건국 강령 기초자','광복을 준비한 자']
  },
  world: {
    1:['뗀석기 사냥꾼','간석기 농부','문명의 개척자'],
    2:['쐐기 문자 필경사','파라오의 서기관','함무라비 법전 해석가'],
    3:['모헨조다로 시민','갑골문 점술가','마야 천문학자'],
    4:['만리장성 축성가','군현제 관리','사마천의 제자'],
    5:['대운하 뱃사공','3성 6부 관리','장안성 재상'],
    6:['야마토 조정 사신','견당사','다이카 개신 설계자'],
    7:['불경 필사자','아소카 왕의 칙령 전달자','간다라 조각가'],
    8:['산스크리트 시인','아잔타 석굴 화가','숫자 0의 발견자'],
    9:['왕의 길 파발꾼','파르티아 기병','페르시아 대왕의 눈과 귀'],
    10:['아고라 시민','도편 추방 투표자','알렉산드로스 원정대장'],
    11:['로마 시민','원로원 의원','팍스 로마나 수호자'],
    12:['장원 농노','봉신 기사','콘스탄티노폴리스 황제'],
    13:['사막의 대상','지혜의 집 학자','칼리프의 재상'],
    14:['성지 순례자','십자군 원정 기록자','두 세계의 중재자'],
    16:['거란 기마병','송의 과거 급제자','왕안석의 개혁 참모'],
    17:['역참 파발꾼','천호장','대칸의 책사'],
    18:['흑사병 생존자','길드 장인','자치 도시 시장'],
    19:['피렌체 도제','95개조 반박문 필사자','르네상스 거장'],
    21:['상비군 병사','국채 투자자','재정·군사 국가 설계자'],
    22:['30년 전쟁 용병','베스트팔렌 조약 외교관','세력 균형 조율자']
  }
};

// 단원 전체 칭호: 범위 안의 모든 주제를 🥇달인으로
const GRAND_TITLES = {
  korea: [ { id:'g_all', name:'광복의 증인', min:1, max:99, desc:'모든 주제 🥇달인' } ],
  world: [
    { id:'g_1', name:'고대 문명 순례자', min:1, max:14, desc:'1단원(주제 01~14) 모두 🥇달인' },
    { id:'g_2', name:'근세의 설계자', min:16, max:22, desc:'2단원(주제 16~22) 모두 🥇달인' },
    { id:'g_all', name:'세계사 대가', min:1, max:99, desc:'1·2단원 모두 🥇달인' }
  ]
};

// 수업 게임 명예 칭호: log/<token>_<key> 개수로 단계가 오른다
const HONOR_KINDS = [
  { key:'first',    emoji:'🏆', what:'수업 게임 1등(개인전)', steps:[[1,'탑의 주인','rare'],[3,'탑의 지배자','epic'],[10,'탑의 전설','legend']] },
  { key:'acc',      emoji:'🎯', what:'종료 화면 정확도왕',   steps:[[1,'정확도왕','common'],[3,'백발백중','rare'],[10,'신궁','epic']] },
  { key:'streak',   emoji:'⚡', what:'종료 화면 번개 정답왕', steps:[[1,'번개 정답왕','common'],[3,'질풍노도','rare'],[10,'뇌신','epic']] },
  { key:'study',    emoji:'💪', what:'종료 화면 열공왕',     steps:[[1,'열공왕','common'],[3,'공부 벌레','rare'],[10,'문제 포식자','epic']] },
  { key:'overtake', emoji:'🔥', what:'종료 화면 역전왕',     steps:[[1,'역전왕','common'],[3,'역전의 명수','rare'],[10,'역전 드라마 작가','epic']] },
  { key:'rivalwin', emoji:'⚔️', what:'라이벌전 승리',        steps:[[1,'첫 승리','common'],[5,'맞수','rare'],[20,'천하무적','legend']] }
];
const DAY_STEPS = [[3,'작심삼일 돌파','common'],[7,'개근상','rare'],[20,'역사 덕후','epic']];
const HIDDEN_TITLES = [
  { id:'flawless',    emoji:'💎', name:'무결점',     desc:'한 판에서 한 번도 틀리지 않고 20층 도달' },
  { id:'buzzer',      emoji:'⏱️', name:'극장골',     desc:'수업 게임 종료 10초 전 안에 1등으로 올라서서 우승' },
  { id:'indomitable', emoji:'🦾', name:'불굴의 의지', desc:'수업 게임 한 판에서 방해 아이템을 10번 이상 맞고도 1등' },
  { id:'owl',         emoji:'🦉', name:'올빼미',     desc:'밤 10시가 넘어서 문제 풀기' },
  { id:'marathon',    emoji:'🏃', name:'마라토너',   desc:'혼자 연습 한 판에서 100문제 이상 맞히기' }
];

function topicNum(unit){
  const m = String(unit || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}
export function dayKey(ms = Date.now()){
  const d = new Date(ms);
  return '' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
}

// 받은 칭호·진행 상황 계산 (순수 함수). 반환: { groups, all, byId }
export function buildTitleBook(room, data, questionsObj){
  data = data || {};
  const seen = data.seen || {};
  const all = [], byId = {};
  const add = (t) => { t.earned = !!(t.ok || seen[t.id]); all.push(t); byId[t.id] = t; return t; };

  // 문제별 누적 (옮겨 담은 옛 기록 + 이후 기록)
  const qs = {};
  [data.hist && data.hist.q, data.q].forEach(src => Object.entries(src || {}).forEach(([qid, x]) => {
    const o = qs[qid] || (qs[qid] = { c:0, w:0 });
    o.c += (x && x.c) || 0; o.w += (x && x.w) || 0;
  }));
  const byTopic = {};
  Object.entries(questionsObj || {}).forEach(([qid, q]) => {
    const n = topicNum(q && q.unit);
    if(n === null) return;
    (byTopic[n] = byTopic[n] || { unit: q.unit, qids: [] }).qids.push(qid);
  });

  // 📚 단원 정복
  const table = UNIT_TITLES[room] || {};
  const unitRows = Object.keys(table).map(Number).sort((a,b)=>a-b).map(n => {
    const tp = byTopic[n];
    const total = tp ? tp.qids.length : 0;
    let solved = 0, c = 0, w = 0;
    (tp ? tp.qids : []).forEach(qid => { const x = qs[qid]; if(!x) return; if(x.c > 0) solved++; c += x.c; w += x.w; });
    const acc = (c + w) ? c / (c + w) : 0;
    const need = [Math.max(1, Math.ceil(total * 0.3)), Math.max(1, Math.ceil(total * 0.7)), total];
    const oks = [total > 0 && solved >= need[0], total > 0 && solved >= need[1], total > 0 && solved >= total && acc >= 0.8];
    const descs = [`주제 ${n} 문제 ${need[0]}개 맞히기`, `주제 ${n} 문제 ${need[1]}개 맞히기`, `주제 ${n} 모든 문제(${total}개) 맞히고 정답률 80% 이상`];
    const items = table[n].map((nm, i) => add({
      id:`u${n}_${i+1}`, name:nm, emoji:TIER_EMOJI[i], rarity:TIER_RARITY[i], ok:oks[i], desc:descs[i], tier:TIER_LABEL[i]
    }));
    return { n, unit: tp ? tp.unit : `주제 ${n}`, solved, total, acc, items, hasQ: total > 0 };
  });

  // 👑 단원 전체
  const grand = (GRAND_TITLES[room] || []).map(g => {
    const rows = unitRows.filter(r => r.n >= g.min && r.n <= g.max && r.hasQ);
    return add({ id:g.id, name:g.name, emoji:'👑', rarity:'legend', ok: rows.length > 0 && rows.every(r => r.items[2].earned), desc:g.desc });
  });

  // 🏅 명예 (수업 게임)
  const logKeys = Object.keys(data.log || {});
  const honors = HONOR_KINDS.map(h => {
    const count = logKeys.filter(k => k.endsWith('_' + h.key)).length;
    return { kind:h, count, items: h.steps.map(([need, nm, rar], i) => add({
      id:`h_${h.key}_${i+1}`, name:nm, emoji:h.emoji, rarity:rar, ok: count >= need, desc:`${h.what} ${need}회`
    })) };
  });

  // 📅 꾸준함
  const daySet = new Set([...Object.keys(data.days || {}), ...Object.keys((data.hist && data.hist.days) || {})]);
  const dayItems = DAY_STEPS.map(([need, nm, rar], i) => add({
    id:`d_${i+1}`, name:nm, emoji:'📅', rarity:rar, ok: daySet.size >= need, desc:`문제 푼 날 ${need}일`
  }));

  // ❓ 숨은 칭호
  const hidden = HIDDEN_TITLES.map(h => add({ id:`x_${h.id}`, name:h.name, emoji:h.emoji, rarity:'epic', ok: !!(data.hidden && data.hidden[h.id]), desc:h.desc, secret:true }));

  return { unitRows, grand, honors, dayItems, dayCount: daySet.size, hidden, all, byId };
}

// ── 화면 (도감 창·획득 알림) ─────────────────────────────
let cssAdded = false;
function addCss(){
  if(cssAdded) return;
  cssAdded = true;
  const st = document.createElement('style');
  st.textContent = `
  .tt-open-btn{ margin-top:12px; background:#fff7dc; color:#7a5600; border:2px solid #f0d68a; border-radius:12px; padding:10px 16px; font-weight:800; font-size:1rem; cursor:pointer; }
  .tt-open-btn .tt-rep{ display:block; font-size:.78rem; font-weight:700; opacity:.85; margin-top:2px; }
  .tt-overlay{ position:fixed; inset:0; z-index:9000; background:rgba(15,23,42,.55); display:flex; align-items:center; justify-content:center; padding:16px; }
  .tt-panel{ background:#fff; color:#1f2937; width:min(760px,100%); max-height:92vh; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.35); text-align:left; }
  .tt-head{ display:flex; align-items:flex-start; gap:10px; padding:16px 18px 10px; border-bottom:1px solid #e5e7eb; }
  .tt-head h3{ margin:0; font-size:1.2rem; }
  .tt-head .tt-sub{ font-size:.84rem; color:#6b7280; margin-top:4px; }
  .tt-close{ margin-left:auto; background:#f3f4f6; border:none; border-radius:10px; padding:8px 12px; font-weight:700; cursor:pointer; color:#374151; }
  .tt-body{ overflow-y:auto; padding:10px 18px 18px; }
  .tt-sec h4{ margin:16px 0 4px; font-size:1rem; }
  .tt-note{ font-size:.78rem; color:#6b7280; margin-bottom:8px; }
  .tt-unit{ padding:8px 0; border-bottom:1px dashed #e5e7eb; }
  .tt-unit-name{ font-size:.86rem; font-weight:700; display:flex; gap:8px; align-items:baseline; }
  .tt-unit-name .tt-prog{ font-weight:400; color:#6b7280; font-size:.78rem; margin-left:auto; white-space:nowrap; }
  .tt-chips{ display:flex; flex-wrap:wrap; gap:6px; margin-top:5px; }
  .tt-chip{ display:inline-flex; align-items:center; gap:4px; border-radius:999px; padding:5px 11px; font-size:.84rem; font-weight:700; border:2px solid transparent; background:#f3f4f6; color:#9ca3af; cursor:default; font-family:inherit; }
  .tt-chip:not(.earned){ filter:grayscale(1); opacity:.7; }
  .tt-chip.earned{ cursor:pointer; }
  .tt-chip.rep{ box-shadow:0 0 0 3px #111827 inset; }
  .tt-chip small{ font-weight:600; font-size:.7rem; opacity:.8; }
  .tt-hint{ font-size:.72rem; color:#9ca3af; margin-top:3px; }
  /* 페이지의 전역 button 스타일(가로 100%·큰 글씨·그라데이션 배경)이 도감 안 버튼에 번지지 않게 되돌린다 */
  .tt-overlay .tt-head > div:first-child{ flex:1; min-width:0; }
  .tt-overlay button.tt-close{ width:auto; flex:0 0 auto; padding:8px 12px; font-size:.9rem; color:#374151; background:#f3f4f6; border-radius:10px; }
  .tt-overlay button.tt-chip{ width:auto; flex:0 0 auto; padding:5px 11px; font-size:.84rem; border-radius:999px; background:#f3f4f6; color:#9ca3af; transition:none; }
  .tt-overlay button.tt-chip:disabled{ opacity:1; }
  .tt-toasts{ position:fixed; top:14px; left:50%; transform:translateX(-50%); z-index:9100; display:flex; flex-direction:column; gap:8px; align-items:center; pointer-events:none; }
  .tt-toast{ background:#111827; color:#fff; border-radius:14px; padding:10px 18px; font-weight:800; font-size:1rem; box-shadow:0 10px 30px rgba(0,0,0,.35); animation:ttIn .35s ease; text-align:center; }
  .tt-toast small{ display:block; font-size:.74rem; font-weight:600; opacity:.8; }
  @keyframes ttIn{ from{ transform:translateY(-14px); opacity:0; } to{ transform:none; opacity:1; } }
  `;
  document.head.appendChild(st);
}

function chipStyle(t){
  const r = RARITY[t.rarity] || RARITY.common;
  return t.earned ? `background:${r.bg}; color:${r.color}; border-color:${r.color}55;` : '';
}

export function mountTitles(deps, opts){
  const { db, ref, get, update, onValue, runTransaction, serverNow, escapeHtml } = deps;
  const room = opts.room;
  const getQuestions = opts.getQuestions || (() => ({}));
  let ident = null;           // { cls, name }
  let data = {};
  let loaded = false;
  let unsub = null;
  let mountedAt = 0;
  let lastDay = null;
  let overlay = null;
  let lastRepSig = null;
  let announced = new Set();  // 저장(seen)이 반영되기 전에 같은 칭호 알림이 두 번 뜨지 않게
  addCss();

  const base = () => `titles/${room}/${ident.cls}/${ident.name}`;
  const nowMs = () => (serverNow ? serverNow() : Date.now());

  function toast(text, sub){
    let box = document.querySelector('.tt-toasts');
    if(!box){ box = document.createElement('div'); box.className = 'tt-toasts'; document.body.appendChild(box); }
    const d = document.createElement('div');
    d.className = 'tt-toast';
    d.innerHTML = escapeHtml(text) + (sub ? `<small>${escapeHtml(sub)}</small>` : '');
    box.appendChild(d);
    setTimeout(() => d.remove(), 3800);
  }

  // 칭호 기능 전 기록(solo_log·class_log)을 한 번만 옮겨 담는다. 이번 접속 이후 기록(ts ≥ mountedAt)은
  // q/에 따로 쌓이므로 빼서 두 번 세지 않게 한다.
  async function backfill(){
    const me = ident;
    try{
      const [s, c] = await Promise.all([get(ref(db, `rooms/${room}/solo_log`)), get(ref(db, `rooms/${room}/class_log`))]);
      if(me !== ident) return;
      const q = {}, days = {};
      [s.val() || {}, c.val() || {}].forEach(obj => Object.values(obj).forEach(e => {
        if(!e || !e.ts || e.ts >= mountedAt) return;
        if((e.name || '') !== me.name || String(e.cls ?? '') !== me.cls) return;
        days[dayKey(e.ts)] = true;
        Object.values(e.q_stats || {}).forEach(x => {
          if(!x || !x.qid) return;
          const o = q[x.qid] || (q[x.qid] = { c:0, w:0 });
          o.c += x.c || 0; o.w += x.w || 0;
        });
      }));
      await update(ref(db, base()), { hist: { q, days }, histDone: true });
    }catch(_e){ /* 옛 기록을 못 옮겨도 이후 기록으로 칭호는 계속 쌓인다 */ }
  }

  function evaluate(){
    if(!ident || !loaded) return;
    const qObj = getQuestions() || {};
    if(!Object.keys(qObj).length) return;   // 문제를 받아오기 전엔 단원 칭호를 판단할 수 없다
    const book = buildTitleBook(room, data, qObj);
    const seen = data.seen || {};
    const fresh = book.all.filter(t => t.ok && !seen[t.id] && !announced.has(t.id));
    if(fresh.length){
      fresh.forEach(t => announced.add(t.id));
      const ups = {};
      fresh.forEach(t => { ups['seen/' + t.id] = nowMs(); });
      update(ref(db, base()), ups).catch(()=>{});
      if(fresh.length > 2){
        toast(`🏅 칭호 ${fresh.length}개를 받았어요!`, '🏅 칭호 도감에서 확인하고 대표 칭호를 골라 보세요');
      } else {
        fresh.forEach(t => toast(`🏅 새 칭호! ${t.emoji} ${t.name}`, `${RARITY[t.rarity].label} · ${t.desc}`));
      }
    }
    syncRep();
    if(overlay) renderBook();
    updateButtons();
  }

  function repInfo(){
    if(!ident || !data.rep) return null;
    const book = buildTitleBook(room, data, getQuestions() || {});
    const t = book.byId[data.rep];
    return (t && t.earned) ? { n: t.name, r: t.rarity, e: t.emoji } : null;
  }
  function syncRep(force){
    const info = repInfo();
    const sig = JSON.stringify(info);
    if(!force && sig === lastRepSig) return;
    lastRepSig = sig;
    if(opts.onRep) opts.onRep(info);
  }

  function updateButtons(){
    const info = repInfo();
    document.querySelectorAll('[data-tt-open]').forEach(b => {
      b.innerHTML = '🏅 칭호 도감' + (info ? `<span class="tt-rep">대표: ${escapeHtml(info.e + ' ' + info.n)}</span>` : '');
    });
  }

  function chip(t, repId){
    const label = t.secret && !t.earned ? '❓ ???' : `${t.emoji} ${escapeHtml(t.name)}`;
    const rar = RARITY[t.rarity] || RARITY.common;
    return `<button type="button" class="tt-chip ${t.earned ? 'earned' : ''} ${repId === t.id ? 'rep' : ''}" data-tt-id="${t.id}" style="${chipStyle(t)}" title="${escapeHtml(t.secret && !t.earned ? '조건 비공개' : t.desc)}">${label}${t.earned ? ` <small>${rar.label}</small>` : ''}</button>`;
  }

  function renderBook(){
    if(!overlay) return;
    const body = overlay.querySelector('.tt-body');
    const sub = overlay.querySelector('.tt-sub');
    if(!ident){ body.innerHTML = '<p>학년·반·이름을 먼저 입력해 주세요.</p>'; return; }
    const qObj = getQuestions() || {};
    const book = buildTitleBook(room, data, qObj);
    const repId = (data.rep && book.byId[data.rep] && book.byId[data.rep].earned) ? data.rep : null;
    const got = book.all.filter(t => t.earned).length;
    const info = repId ? book.byId[repId] : null;
    sub.textContent = `${ident.name} · 받은 칭호 ${got} / ${book.all.length}개 · 대표 칭호: ${info ? info.emoji + ' ' + info.name : '없음'} (받은 칭호를 누르면 대표로 설정)`;
    if(!loaded){ body.innerHTML = '<p>불러오는 중…</p>'; return; }
    let h = '';
    h += `<div class="tt-sec"><h4>📚 단원 정복</h4><div class="tt-note">🥉입문: 주제 문제의 30% 맞히기 · 🥈숙련: 70% 맞히기 · 🥇달인: 모든 문제를 맞히고 정답률 80% 이상 (수업 게임 + 혼자 연습 합산)</div>`;
    book.unitRows.forEach(r => {
      if(!r.hasQ && !r.items.some(t => t.earned)) return;
      h += `<div class="tt-unit"><div class="tt-unit-name">${escapeHtml(r.unit)}<span class="tt-prog">${r.solved}/${r.total}문제 · 정답률 ${Math.round(r.acc*100)}%</span></div><div class="tt-chips">${r.items.map(t => chip(t, repId)).join('')}</div></div>`;
    });
    h += `</div>`;
    h += `<div class="tt-sec"><h4>👑 단원 전체</h4><div class="tt-chips">${book.grand.map(t => chip(t, repId)).join('')}</div><div class="tt-hint">${book.grand.map(t => escapeHtml(t.name + ': ' + t.desc)).join(' · ')}</div></div>`;
    h += `<div class="tt-sec"><h4>🏅 명예 (수업 게임)</h4>`;
    book.honors.forEach(g => {
      h += `<div class="tt-unit"><div class="tt-unit-name">${g.kind.emoji} ${escapeHtml(g.kind.what)}<span class="tt-prog">${g.count}회</span></div><div class="tt-chips">${g.items.map(t => chip(t, repId)).join('')}</div><div class="tt-hint">${g.items.map(t => escapeHtml(t.name + ' ' + t.desc.replace(g.kind.what + ' ', ''))).join(' · ')}</div></div>`;
    });
    h += `</div>`;
    h += `<div class="tt-sec"><h4>📅 꾸준함</h4><div class="tt-note">문제를 푼 날: ${book.dayCount}일 (수업 게임 + 혼자 연습)</div><div class="tt-chips">${book.dayItems.map(t => chip(t, repId)).join('')}</div><div class="tt-hint">${book.dayItems.map(t => escapeHtml(t.name + ' ' + t.desc)).join(' · ')}</div></div>`;
    const hiddenGot = book.hidden.filter(t => t.earned).length;
    h += `<div class="tt-sec"><h4>❓ 숨은 칭호</h4><div class="tt-note">조건은 받아야 공개돼요 (${hiddenGot}/${book.hidden.length})</div><div class="tt-chips">${book.hidden.map(t => chip(t, repId)).join('')}</div>${hiddenGot ? `<div class="tt-hint">${book.hidden.filter(t => t.earned).map(t => escapeHtml(t.name + ': ' + t.desc)).join(' · ')}</div>` : ''}</div>`;
    body.innerHTML = h;
  }

  function openBook(){
    if(overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'tt-overlay';
    overlay.innerHTML = `<div class="tt-panel"><div class="tt-head"><div><h3>🏅 칭호 도감</h3><div class="tt-sub"></div></div><button type="button" class="tt-close">닫기 ✕</button></div><div class="tt-body"></div></div>`;
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay || e.target.closest('.tt-close')){ closeBook(); return; }
      const c = e.target.closest('.tt-chip.earned');
      if(c && ident){
        const id = c.dataset.ttId;
        update(ref(db, base()), { rep: data.rep === id ? null : id }).catch(()=>{});
      }
    });
    document.body.appendChild(overlay);
    renderBook();
  }
  function closeBook(){ if(overlay){ overlay.remove(); overlay = null; } }
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && overlay) closeBook(); });

  const api = {
    setIdentity(cls, name){
      name = String(name || '').trim().slice(0, 20);
      if(ident && cls && name && ident.cls === cls && ident.name === name) return;
      if(unsub){ unsub(); unsub = null; }
      data = {}; loaded = false; lastRepSig = null; lastDay = null; announced = new Set();
      ident = (cls && name) ? { cls: String(cls), name } : null;
      updateButtons();
      if(!ident){ if(overlay) renderBook(); return; }
      mountedAt = nowMs();
      let first = true;
      unsub = onValue(ref(db, base()), (snap) => {
        data = snap.val() || {};
        loaded = true;
        if(first){ first = false; if(!data.histDone) backfill(); }
        evaluate();
      });
      if(overlay) renderBook();
    },
    // 문제를 풀 때마다 (수업 게임·혼자 연습 공통)
    recordAnswer(qid, correct){
      if(!ident || !qid) return;
      runTransaction(ref(db, `${base()}/q/${qid}`), (cur) => ({
        c: ((cur && cur.c) || 0) + (correct ? 1 : 0),
        w: ((cur && cur.w) || 0) + (correct ? 0 : 1)
      })).catch(()=>{});
      const dk = dayKey(nowMs());
      if(lastDay !== dk){
        lastDay = dk;
        if(!(data.days && data.days[dk])) update(ref(db, `${base()}/days`), { [dk]: true }).catch(()=>{});
      }
      const hr = new Date(nowMs()).getHours();
      if(hr >= 22 || hr < 5) api.unlockHidden('owl');
    },
    unlockHidden(id){
      if(!ident || (data.hidden && data.hidden[id])) return;
      update(ref(db, `${base()}/hidden`), { [id]: nowMs() }).catch(()=>{});
    },
    refresh(){ evaluate(); updateButtons(); },
    repInfo,
    syncRep: () => syncRep(true),
    openBook,
    // 도감 열기 버튼: <button data-tt-open> — 대표 칭호가 버튼에 함께 표시된다
    bindButton(btn, beforeOpen){
      if(!btn) return;
      btn.setAttribute('data-tt-open', '');
      btn.classList.add('tt-open-btn');
      btn.onclick = () => { if(beforeOpen && beforeOpen() === false) return; openBook(); };
      updateButtons();
    }
  };
  return api;
}
