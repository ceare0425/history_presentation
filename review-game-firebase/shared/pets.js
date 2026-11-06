// 🐾 펫 — 코인 모으기·상점·돌봄·진화, 게임 화면 캐릭터 (수업 게임 play.html · 혼자 연습 solo.html · 전광판 board.html 공용)
// titles.js처럼 lib.js를 직접 import하지 않고 쓰는 쪽에서 db 함수들을 넘겨받는다.
//
// 저장 위치: pets/<학년-반>/<이름>/   — 한국사·세계사 공용 (지갑 하나, 산 펫은 두 과목 게임 모두에 데려감)
//   coins          지금 가진 코인
//   earned         지금까지 모은 코인 합계 (쓴 코인도 포함, 금돼지 해금 조건)
//   welcome        처음 들어올 때 받은 축하 코인 (한 번만)
//   day: {k, c}    오늘(yyyymmdd) 맞힌 문제 수 (혼자 연습 + 수업 게임)
//   maxDay         하루에 가장 많이 맞힌 문제 수 (크라켄 해금 조건)
//   soloBest       혼자 연습 탑 오르기 최고 층 (불사조 해금 조건, 이 기능 이후 기록부터)
//   bonus/<라운드token>: 받은 수업 게임 등수 보너스 (같은 라운드는 한 번만)
//   active         데려가는 펫 id
//   gifts/<키>: {a, r, at}  선생님이 주거나 뺀 코인 알림 (관리자 화면 ⑧) — 학생 화면이 알림을 띄우고 지운다
//   room: {paper, floor, window, wall, left, right, rug, toy}  방 자리마다 끼운 물건 id (방 꾸미기)
//   deco: {<종류>_<id>: 개수}   산 방 물건 (가구는 양쪽에 두려면 2개)
//   toyNext / playUntil         장난감 '같이 놀기' 다음 가능 시각 / 노는 장면이 끝나는 시각
//   hearts                      친구에게 받은 하트 합계 · heartDay: {k, by:{이름:true}} 오늘 하트 준 친구
//   heartNews/<키>: {f, at}     받은 하트 알림 (띄우고 지움)
//   items: {rice, snack, med}  가지고 있는 밥·간식·약 개수 (상점 용품)
//   owned/<펫id>: {stage, exp, food, fun, energy, t, sleepUntil, at, poop, poopT, sick, walkUntil, walkNext}
//       stage 0·1·2 진화 단계 · exp 데려가서 맞힌 문제 수 · food/fun/energy 0~100 (t 시각 기준 값, 시간이 지나면 줄어듦)
//       poop 쌓인 똥 개수(poopT부터 일정 시간마다 하나씩) · sick 아픔(똥이 많이 쌓이거나 굶으면) · walkUntil 산책 중 · walkNext 다음 산책 가능 시각

// ── 규칙 숫자 ─────────────────────────────────────────
export const PET_RULES = {
  welcome: 200,          // 처음 받는 축하 코인 (한 번만)
  classBonus: [10, 6, 3],// 수업 게임 개인전 1·2·3등 보너스
  teamBonus: 5,          // 수업 게임 팀전 1등 팀 보너스
  // 상점 용품 (가지고 있으면 그걸 쓰고, 없으면 펫 키우기에서 바로 사서 줄 수 있음)
  items: {
    rice:  { label: '🍙 밥',   price: 10, food: 30 },            // 먹으면 똥이 하나 생김
    snack: { label: '🍪 간식', price: 15, food: 10, fun: 15 },
    med:   { label: '💊 약',   price: 20 }                        // 아플 때만 먹일 수 있음
  },
  poopEveryMs: 6 * 3600000, // 이만큼 지날 때마다 똥이 하나 생김
  poopMax: 5,            // 똥은 최대 이만큼 쌓임
  sickPoop: 4,           // 똥이 이만큼 쌓이면 아픔 (배부름이 0이 되어도 아픔)
  walkMs: 20000,         // 산책 나가 있는 시간 (그동안 화면에서 걷는 모습)
  walkCooldownMs: 60 * 60000, // 산책은 이 간격마다 한 번
  walkFun: 20, walkEnergy: 10, walkFood: 5,   // 산책: 기분 +, 체력 -, 배부름 -
  walkCoinChance: 0.3, walkCoinMax: 5,         // 산책하다 동전을 주울 확률·최대 개수
  cozyStep: 0.04, cozyMax: 0.5,  // 아늑함 1점마다 기분이 4%씩 천천히 떨어짐 (최대 50%)
  cozyHappy: 8,          // 아늑함이 이보다 높으면 '신남' 기준이 60 → 50으로 낮아짐
  toyCooldownMs: 30 * 60000, toyPlayMs: 6000,  // 장난감 같이 놀기 간격 · 노는 장면 길이
  heartFun: 5,           // 친구에게 하트를 받으면 펫 기분 +
  foodDecay: 1,          // 시간당 줄어드는 배부름
  funDecay: 1,           // 시간당 줄어드는 기분
  funPerCorrect: 1.5,    // 데려가서 맞힐 때마다 오르는 기분
  energyPerCorrect: 0.4, // 데려가서 맞힐 때마다 줄어드는 체력
  energyRegen: 2,        // 시간당 저절로 차는 체력
  sleepMs: 10 * 60000,   // 재우면 이만큼 자고 일어나 체력이 가득 참
  evolve: [300, 1000]    // 2단계·3단계로 진화하는 경험치 (3단계는 기분 좋음 상태여야 함)
};

// ── 도트 데이터 (16×16, 8글자 줄은 좌우 대칭으로 펼침) ───────────
const DATA = {"common":{"o":"#2b2233","e":"#1d1726","w":"#ffffff","p":"#ff8fa3","m":"#c2334d","g":"#ffcf3f","G":"#c98a12","h":"#f4ead2","H":"#d9c9a3","r":"#f3e8ff","y":"#f2a43a","k":"#2b2233","N":"#1d1726","v":"#c38bff"},"pets":[{"id":"haechi","pal":{"b":"#f6b04a","d":"#d9822b","l":"#ffe0a3","a":"#b5562a","n":"#7a3a1c"},"stages":[{"px":["........","........","........","........","...oo.oo","..oaaoaa","..oaaaaa","..oabbbb","..obwebb","..obeebb","..opbllN","..obbllo","..obblol","..obbbbb","...obbbb","....oooo"]},{"px":["........","..oo.oo.",".oaaoaao",".oaaaaaa","oaanaaaa","oaabbbbb","oabbbbbb","oabbwebb","oabbeebb","oapbbllN","oaabbllo",".oaoblol","...obbll","..obbbll","..obdbbo","..oooo.."]},{"px":[".......o","......og","..oo.oog",".ogaoaGg","oaaaaaaa","oanabbbb","oabbbbbb","oabbwebb","oabbeebb","oapbbllN","oaabbllo","oaaoblol",".oammmmm","..obbbog",".obdbbbo",".oooooo."]}]},{"id":"dragon","pal":{"b":"#4fa3e0","d":"#2f6fb0","l":"#c8ecff","a":"#7fd1c7"},"stages":[{"px":["........","........","........","....oooo","...ohhhh","..ohhhhH","..obohoh","..obbbbb","..obwebb","..obeebb","..opbbbb","..obbbNb","..obbbbb","..obblll","...obbll","....oooo"]},{"px":["........","..oo....","..ogoooo","..oobbbb",".obbbbbb","aobbbbbb","aobbbbbb","aobbwebb",".obbeebb",".obpbbbb",".obbbbNb","..oobbbb","..aoblll",".aaoblll","...obbbo","...oooo."]},{"px":[".o.o....",".gog....","..ogoooo","..oobbbb",".obbbbbb","aobbbbbb","aobbbbbb","aobbwebb","aobbeebb","aobpbbbb","oo.obbNb","...obbbo",".aaoblor","aaaoblor","...obbbo","...oooo."]}]},{"id":"dokkaebi","pal":{"b":"#ef6a5a","d":"#c2453b","l":"#ffb3a1","n":"#3a2a4a"},"stages":[{"px":["........","........","........",".......o","......oh","....onnh","...onnnn","..onbnnb","..obwebb","..obeebb","..opbbbb","..obbowm","..obbboo","..oykyky","...obbbo","....ooo."]},{"px":["........","...o....","...ho...","..ohoooo",".onhnnnn",".onnnnnn","onnbnnbn","onbbbbbb","onbbwebb","obbbeebb","obbpbbbb",".obbbowm","..obbboo",".obykyky","...obbbo","...oooo."]},{"px":[".o......",".go.....",".hho....","..hhoooo",".onhnnnn","onnnnnnn","onnbnnbn","onbbbbbb","onbbwebb","obbbeebb","obpbbbbb","obbbbowm",".obbbboo",".obgbgbg","oykykyko","..oooooo"]}]},{"id":"bulgasari","pal":{"b":"#9aa4b5","d":"#66707f","l":"#d3dae5","a":"#4a5262","s":"#e0603a"},"stages":[{"px":["........","........","........","........","....o..o","....aooa","...obbbb","..obbbbb","..obwebb","..obeebb","..opbbod","..obbbod","..obbbbo","..obllll","...obbll","....oooo"]},{"px":["........","...o.o.o","..oaoaoa",".oaaaaaa",".oabbbbb","oabbbbbb","obbbbbbb","obbbwebb","obbbeebb","obbpbbod",".obbbbod","..obbbod","..obbllo","..obllll","...obbbo","...oooo."]},{"px":["..o..o..",".oa.oa.o","oaaoaaoa","oaaaaaaa","oaabbbbb","oabbbbbb","oabbbbbb","oabbwsbb","oabbssbb","oabpbbod","oagbbbod",".oabbbod","oaaobbbo","oagaagaa",".oobbbbo","..ooooo."]}]},{"id":"tiger","pal":{"b":"#f39a3c","d":"#c96a1e","l":"#fff1d6"},"stages":[{"px":["........","........","........","........","..oo....","..opoooo","..obbkbk","..obbbbb","..obwebb","..okeebb","..opbllN","..okbllo","..obblol","..obbbbb","...obbbb","....oooo"]},{"px":["........",".oo.....",".opo....",".opooooo",".obbkbkb",".obbbbbb","obbbbbbb","okkbwebb","obkbeebb","obpbbllN","obbbbllo",".obbblol","..okllll","..obkbll","..obkbbo","..oooo.."]},{"pal":{"b":"#eeeaf4","d":"#b8b4c8","l":"#ffffff","e":"#2a4a8a"},"px":[".oo.....",".opo....",".opooooo",".obbbbkk","obbkbbbk","obbbbbkk","obkbbbbb","okkbwebb","obkbeebb","obpbbllN","obbbbllo","obbbblol",".oobllll","okbobbll",".obkbbbo",".oooooo."]}]},{"id":"sapsal","pal":{"b":"#e8c98f","d":"#b8925a","l":"#f7e6c0","a":"#a77b48"},"stages":[{"px":["........","........","........","........","...o.o.o","..oaoaoa",".oabbbbb",".oaabaab",".obbwebb",".oabeebb",".oabbllN","oaabbllo","oabpblol",".oabbbbb","..oaobbb","...oo.oo"]},{"px":["........","..o.o.o.",".oaoaoao",".oabbbbb","oaaaabaa","oabbbbbb","oabbwebb","oabbeebb","oaabbllN","oaabbllo","oapbblol",".oabbbbb","..oallll","..oallll","..oabbbo","..oooo.."]},{"pal":{"b":"#f6f2e8","d":"#cfc8b8","l":"#ffffff","a":"#bdb3a0"},"px":["...o.o.o","..oaoaoa",".oaaaaaa","oaabbbbb","oaaaabaa","oabbbbbb","oabbwebb","oabbeebb","oaabbllN","oaabbllo","oapbblol","oaabbbbb",".ommmmmm","..oabbog",".oaabbbo",".oooooo."]}]},{"id":"turtle","pal":{"b":"#6fbf73","d":"#3f8a4a","l":"#e9f0b0","a":"#9a7444","n":"#5e4424"},"stages":[{"px":["........","........","........","........","........","....oooo","...obbbb","...obebb","...obebb","...opbbb","...ooooo","..oaanaa",".oaanaaa",".onnnnnn",".obbolll","..oooooo"]},{"px":["........","........",".....ooo","....obbb","...obbbb","...obweb","...obeeb","...opbbb","...obbob","....obbo","..oooooo",".oaanaan","obanaaan","obnnnnnn",".obollll","..oooooo"]},{"pal":{"a":"#9c4a32","n":"#4a2c18"},"px":["........",".....ooo","....obbb","....obeb","....opbb","....ommm","..w.w.oo",".ononono","onnnnnnn","onnnnnnn","oaaaaaaa","oakaakaa","oaaaaaaa",".oaaaaaa","..oooooo",".a..a..a"]}]},{"id":"bonghwang","pal":{"b":"#ff6f61","d":"#d9483d","l":"#ffd27a","a":"#3fb39a"},"stages":[{"px":["........","........","........",".......o","....oooa","...obbbb","..obbbbb","..obwebb","..obeebb","..opbbgg","..obbbbG",".aobllll",".aobllll","..obllll","...obbbb","....g.g."]},{"px":["........",".....o.o",".....aoa","....oooo","...obbbb","..obbbbb","..obwebb","..obeebb","..opbbgg","aaobbbbG","aaobllll",".aobllll","..obllll","...obbbb","..aaoaao","....g.g."]},{"px":["....g..g","....og.o","....oaoa","...ogooo","..obbbbb","..obbbbb","g.obwebb","aaobeebb","aaopbbgg","aaaobbbG","gaaollll",".aaollll","..aollll","...obbbb","..aaaoaa",".a.ag.g."]}]},{"id":"sphinx","pal":{"b":"#e8c27a","d":"#b88e44","l":"#fff0c8","a":"#2f5fb0"},"stages":[{"px":["........","........","........","..o.....","..opoooo","..obbbbb","..obbbbb","..obwebb","..obeebb","..opbbbp","..obbbob","..obbbbo","..obbbbb","..obllll","...obbll","....oooo"]},{"px":["........","..o.....","..oo....","..opo...","..opoooo","..obbbbb",".obbbbbb",".obbwebb",".obbeebb",".opbbbbp",".obbbbob","..obbbbo","..oggggg","..obllll","..obllll","..oooooo"]},{"px":["....oooo","...ogggg","..oaaaaa","..oggggg",".oaaobbb",".oggobbb",".oaaobeb",".oggobeb",".oaaobbN",".oggobob","oaaaaoGo","oggggoGo","oaaaaoGo","obbbbbbb","obllbbll","oooooooo"]}]},{"id":"griffin","pal":{"b":"#e2b04a","d":"#b27d24","l":"#f6dc98","a":"#8a5a2b","n":"#5c3a1a"},"stages":[{"px":["........","........","........","........","....o.o.","...ohoho","..ohhhhh","..ohwehh","..oheehh","..ohhhog","..ohhhoG","..ohhhho",".aohhhhh",".aohhhhh","..ohhhhh","...ooooo"]},{"px":["........","....oooo","...ohhhh","..ohhhhh","..ohwehh","..oheehh","..ohhhog","aoohhhoG","aaobhhhh","aaobbbbb","aaobbbll",".aobbbll","..obdbbl","..obdbbo","..ooo.oo","........"]},{"px":["o.......","ag..oooo","aaaohhhh","naohhhhh","naohwehh","naoheehh","naohhhog","naohhhoG",".naobhhh","..aobbbb","..obbbll","..obbbll","..obdbbl","..obdbbo","..ogo.og","........"]}]},{"id":"mammoth","pal":{"b":"#a5704a","d":"#7a4f2e","l":"#c99a6e"},"stages":[{"px":["........","........","........","........","....oooo","...odbdb","..obbbbb","..obwebb","..obeebb","..opbbod","..obhbod","..obhbod","..obbboo","..obbbbb","..obdbbo","..oooo.."]},{"px":["........","....oooo","...odbdb","..odbdbb",".obbbbbb","obbbbbbb","obbbwebb","obbbeebb","obpbbbod","obbhbbod",".obhbbod","..ohhbod","..obbbbo","..obbbbb","..obdbbo","..oooo.."]},{"pal":{"b":"#8a5a3a","d":"#5e3a22","l":"#b07a52"},"px":["...o.o.o","..ododod",".odddddd","odbdbdbd","obbbbbgg","obbbbbbb","obbbwebb","obbbeebb","obpbbbod","obbbbbod","ohbbbbod","ohbbbbod",".ohhbbod","..ohhbbo","..obdbbo","..oooo.."]}]},{"id":"owl","pal":{"b":"#8b6b4f","d":"#5c4430","l":"#e6d3b0","v":"#7fae4a"},"stages":[{"px":["........","........","........","........","...o....","...obooo","..obbbbb","..obllll","..olggll","..olgell","..obbllG","..obbbbb","..obldld","..obdldl","...obbbb","....g.g."]},{"px":["........","..o.....","..oo....","..obo...","..oboooo",".obbbbbb",".oblllll",".oblggll",".oblgell",".obblllG","dobbbbbb","dobldldl","dobdldld",".obldldl","..obbbbb","...g.g.."]},{"px":[".o......",".oo.....",".obooooo",".obvvvvv","obbbbbbb","obllllll","obllggll","obllgell","obbllllG","dobbbbbb","dobldldr","dobdldrr","dobldldr",".obdldld","..obbbbb","...g.g.."]}]},{"id":"scarab","pal":{"b":"#3aa38f","d":"#24705f","l":"#8fe0c8","a":"#2f5fb0"},"stages":[{"px":["........","........","........","........","........",".....ooo","....obbb","....obeb","..oooooo",".oblbbbo","oolbbbbo",".obbbbbo","oobbbbdo","..obbbdo","..oooooo","........"]},{"px":["........","........",".......o",".....ooo","....obbb","...obweb","...obeeb","..oooooo",".oblbbbo","oolbbbbo",".olbbbbo","oobbbbbo",".obbbbdo","oobbbddo","..obbddo","...ooooo"]},{"pal":{"b":"#ffcf3f","d":"#c98a12","l":"#fff3b0"},"px":["......mm",".....mmm","......mm",".....ooo","....obbb","...obweb","...obeeb","..oooooo","aoblbbbo","aolbbbbo","aolbbbbo","aobbbbbo","aobbbbdo",".obbbddo","..obbddo","...ooooo"]}]},{"id":"wolf","pal":{"b":"#8e95a3","d":"#5f6573","l":"#e4e6ec","v":"#7fae4a"},"stages":[{"px":["........","........","........","..o.....","..opo...","..opoooo","..obbbbb","..obwebb","..obeebb","..olbllN","..ollllo","..obllol","..obbbbb","..obllll","...obbll","....oooo"]},{"px":[".o......",".oo.....",".opo....",".opooooo",".obbbbbb","obbbbbbb","obbbwebb","obbbeebb","olbbbllN","olllbllo",".ollllol","..obllll","..obllll","..obbbll","..obdbbo","..oooo.."]},{"pal":{"b":"#c08a4a","d":"#8a5a2a","l":"#e8c48a"},"px":[".o......",".oo.....",".opooooo",".obvbvbv","obbbbbbb","obbbbbbb","obbbwebb","obbbeebb","olbbbllN","olllbllo",".ollllol","..obllll","..obllll",".obbbbll",".obdbbbo",".oooooo."]}]},{"id":"camel","pal":{"b":"#d9a55a","d":"#a8762e","l":"#f2d39a"},"stages":[{"px":["........","........","........","........","........","....oooo","...obbbb","..obbbbb","..obddbb","..obeebb","..obbbbb","..obllll","..ollNll","...olllo","....oooo","........"]},{"px":["........","........",".ooo....","obbbo...","obbboooo","obbobbbb",".oobbbbb","..obddbb","..obeebb","..obbbbb","..obllll","..ollNll","..olllll","...olllo","...obbbb","...oooo."]},{"px":["........",".ooo....","oyyyo...","ommmo...","obbboooo","obbobbbb",".oobbbbb","..obddbb","..obeebb","..ombbbb","..omllll","..olmNmm","..olllll","...olllo","..y.obbb","..g.ooo."]}]},{"id":"elephant","pal":{"b":"#a7a2b8","d":"#7d7892","l":"#cfcadf","h":"#f4ead2"},"stages":[{"px":["........","........","........","........","....oooo","..oobbbb","oddobbbb","oddobweb","oddobeeb","oddopbod",".ooobbod","..obbbod","..obbbbo","..obbbbb","..obdbbo","..oooo.."]},{"px":["........","........","....oooo","...obbbb","ooobbbbb","oddobbbb","oddobbbb","oddobweb","oddobeeb","oddopbod","oddobbod",".ooohbod","..obhbod","..obbbbo","..obdbbo","..oooo.."]},{"px":[".......g","......om","...oommm","..ommgmm","ooommmmm","oddogmgm","oddobbbb","oddobweb","oddobeeb","oddopbod","oddobbod",".ooohbod","..ohhbod",".ommgmmo",".obdbbbo",".oooooo."]}]},{"id":"giraffe","pal":{"b":"#f2c14e","d":"#c98a2e","l":"#fff3cf","n":"#a0612d"},"stages":[{"px":["........","........","........","....o...","...ono..","...ooooo",".oobbnbb","..obwebb","..obeebb","..obbbbb","..obllll","..ollNll","...olllo","....obnb","....onbb","....oooo"]},{"px":["....o...","...ono..","...ooooo",".oobbnbb","..obwebb","..obeebb","..obbbbb","..obllll","..ollNll","...olllo","....obnb","....onbb","..obnbbb","..obbbnb","..obdbbo","..oooo.."]},{"px":[".......o",".m....og","mym.oooo","myyobbnb","mmobwebb",".mobeebb","mmobbbbb","myobllll","mmollNll",".m.olllo","....obnb","....onbb","..obnbbb","..obbbnb","..obdbbo","..oooo.."]}]},{"id":"wyvern","pal":{"b":"#d9453b","d":"#9e2a24","l":"#ffd27a","a":"#7a2a3a"},"stages":[{"px":["........","........","........","........","....o...","...ooooo","..obbbbb","..obwebb","..obeebb","..opbbbb","..ohbhbh",".ohhhhhh",".ohhHhhh",".ohhhhhh","..ohhhhh","...ooooo"]},{"px":["........","...o....","...ho...","...ooooo","..obbbbb","a.obbbbb","aaobwebb","aaobeebb","aaopbbbb","aaobbNbb","..oollll","..obllll","..obllll","..obbbbb","..obdbbo","..oooo.."]},{"pal":{"e":"#ffcf3f","w":"#fff6c8"},"px":["o..o....","ao.ho...","aaohoooo","aaaobbbb","aaobbbbb","aaobbbbb","aaobwebb","aaobeebb","aaopbbbb","aaobbNbb","a.oollll","a.obllll","..obllll",".oobbbbb","..obdbbo","..oooo.."]}]},{"id":"samjogo","rare":true,"pal":{"o":"#120f1c","b":"#3a3550","d":"#24203a","l":"#5a5478","e":"#ffcf3f","w":"#fff3b0","m":"#e0503a","y":"#ffb13f"},"stages":[{"px":["........","........","........",".......o","....oooo","...obbbb","..obbbbb","..obwebb","..obeebb","..obbbgg","..obbbbG",".dobbbbb",".dobbbbb","..obbbbb","...obbbb","....g..g"]},{"px":["........","........","....oooo","...obbbb","..obbbbb","..obwebb","..obeebb","..obbbgg","ddobbbbG","ddobbbbb","ddobbbbb",".dobbbbb","..obbbbb","...obbbb","....obbo","....g..g"]},{"px":[".....yyyyyy.....","...yymmmmmmyy...","..yymmmmmmmmyy..",".yymmmmoommmmyy.",".ymmoooooooommy.","ymmobbbbbbbbommy","ymobbbbbbbbbbomy","ymobwebbbbewbomy","ymobeebbbbeebomy","ymobbbggggbbbomy","ymobbbbGGbbbbomy",".dobbbbbbbbbbod.",".dobbbbbbbbbbod.","..obbbbbbbbbbo..","...obbbbbbbbo...","....gyyggyyg...."]}]},{"id":"gumiho","rare":true,"pal":{"b":"#fbf4ea","d":"#d8cbb8","l":"#ffe3f0","v":"#c38bff"},"stages":[{"px":["........","........","........","..o.....","..opo...","..opoooo","..obbbbb","..obwebb","..obeebb",".olpbbbb","..olbblN","...olllo","....oooo","...obbll","...obbll","....oooo"]},{"px":["........",".......o","......ol","..o...ol","..opo.ol","ooopoooo","llobbbbb","llobwebb","ooobeebb",".olpbbbb","..olbblN","...olllo","....oooo","...obbll","...obbll","....oooo"]},{"px":[".....o.o","....ovov","....ovol","o.o.olol","voopolob","vlopoooo","lbobbbbb","bbobwebb","ooobeebb","volpbbbb","vlolbblN","bboolllo","oo..oooo",".vlobbll",".obobbll","..o.oooo"]}]},{"id":"phoenix","rare":true,"pal":{"b":"#ff8a3d","d":"#e04a2a","l":"#ffd35a","a":"#ff5a4a","y":"#ffe066"},"stages":[{"px":["........","........","........","........",".......o","......oa","...obbbb","..obbbbb","..obwebb","..obeebb","..opbbgg","..obbbbG","..obllll","..obllll","...obbbb","....g..."]},{"px":["................",".......oo.......","...o..oyyo..o...","..oyo.oyyo.oyo..","..oyyooaaooyyo..","o.oaooooooooao.o","yooobbbbbbbboooy","yyobbbbbbbbbboyy","oaobwebbbbewboao",".oobeebbbbeeboo.","..opbbggggbbpo..","..obbbbGGbbbbo..","..obllllllllbo..","..obllllllllbo..","...obbbbbbbbo...","....g......g...."]},{"px":["................",".......oo.......","......oyyo......","..oo..oyyo..oo..",".oyyo.oaao.oyyo.",".oyyooooooooyyo.","..oobbbbbbbboo..","..obbbbbbbbbbo..","ooobwebbbbewbooo","yaobeebbbbeeboay","yaopbbggggbbpoay","ooobbbbGGbbbbooo",".oobllllllllboo.","oaobllllllllboao","yaaobbbbbbbboaay","....g......g...."]}]},{"id":"anubis","rare":true,"pal":{"o":"#0f0c18","b":"#2f2b3d","d":"#4a4560","l":"#3d3850","e":"#ffcf3f","w":"#fff6c8","a":"#2f5fb0","N":"#0f0c18"},"stages":[{"px":["........","........","..o.....","..odo...","..odo...","..odoooo","..obbbbb","..obbbbb","..obwebb","..obeebb","..obbbbb","...obbbN","...obbbo","...ooooo","...obbbb","....oooo"]},{"px":["..o.....","..oo....","..odo...","..odo...","..odo...","..odoooo",".obbbbbb",".obbbbbb",".obbwebb",".obbeebb",".obbbbbb","..obbbbN","...obbbo","..oggggg","..obbbbb","..oooooo"]},{"px":["..o.....","..og....","..oao...","..ogo...","..oao...","..ogoooo",".obbbbbb","oaobbbbb","ogobwebb","oaobeebb","ogobbbbb","oaaobbbN","oggoobbo",".ogagaga","..obbbbb","..oooooo"]}]},{"id":"hyeonmu","rare":true,"pal":{"b":"#4d6f8f","d":"#2f4a66","l":"#9fb7c9","a":"#2a3550","n":"#161c2e","v":"#4caf6a","e":"#ffcf3f","w":"#fff6c8"},"stages":[{"px":["................","................","................","................","................","....oooooooo....","...obbbbbbbbo...","...obebbbbebo...","...obebbbbebo.o.","...opbbbbbbpooeo","...oooooooooovvo","..oaanaaaanaavo.",".oaanaaaaaanavo.",".onnnnnnnnnnvno.",".obbollllllobbo.","..oooooooooooo.."]},{"px":["................","................",".....oooooo.....","....obbbbbbo....","...obbbbbbbbo...","...obwebbewboo..","...obeebbeebevo.","...opbbbbbbmvvo.","...obbobbobbovo.","....obboobbo.ovo","..oooooooooooovo",".oaanaannaanaavo","obanaaannaaanvbo","obnnnnnnnnnvvnbo",".obollllllllobo.","..oooooooooooo.."]},{"px":["................","................","..oo.oooooo.oo..",".oveobbbbbboevo.",".ovvmbbbbbbmvvo.",".ovobwebbewbovo.","ovoobeebbeeboovo","ovoopbbbbbbpoovo","ovoobbobbobboovo","ovo.obboobbo..ov","voooooooooooooov","voaanaannaanaaov","vbanaaannaaanavo","ovnnnnnnnnnnnvbo",".ovollllllllobo.","..oooooooooooo.."]}]},{"id":"pig","rare":true,"pal":{"b":"#ffcf3f","d":"#e0a020","l":"#fff3b0","N":"#8a5a12"},"stages":[{"pal":{"b":"#ffb3c1","d":"#e58aa0","l":"#ffd6df","N":"#9c4a5c"},"px":["........","........","........","........","..oo....","..odoooo","..obbbbb","..obwebb","..obeebb","..opbddd","..obbdNd","..obbddd","..obbbbb","..obbbbb","...obbbb","....oooo"]},{"pal":{"b":"#ffb3c1","d":"#e58aa0","l":"#ffd6df","N":"#9c4a5c"},"px":["........","........",".oo.....",".odo....",".odooooo",".obbbbbb","obbbbbbb","obbbwebb","obbbeebb","obpbbddd","obbbbdNd",".obbbddd","..obbbgg","..obbbgo","..obbbgg","..oooooo"]},{"pal":{"g":"#ff8a3d","G":"#c2334d"},"px":[".....g.g","....gggG",".oo.gggg",".odooooo",".obbbbbb","obbbbbbb","obbbwebb","obbbeebb","obpbbddd","obbbbdNd","obbbbddd",".obbbbbb","..obbbgg","..obbbgo",".obbbbgg",".ooooooo"]}]},{"id":"kraken","rare":true,"pal":{"b":"#7e5bd6","d":"#5a3aa8","l":"#b79cff"},"stages":[{"px":["........","........","........","........","....oooo","...obbbb","..oblbbb","..obbbbb","..obwebb","..obeebb","..opbbbb","..obbbob","..obbbbo",".obobbob",".ob.ob.o","..o..o.."]},{"px":["........","....oooo","...obbbb","..oblbbb","..obbblb","..obbbbb",".obbwebb",".obbeebb",".obpbbbb",".obbbbob",".obbbbbo","obobbobb","ob.obobb","ob.ob.ob",".o..o..o","........"]},{"pal":{"b":"#4a3aa0","d":"#2e2470","l":"#8f7cff","e":"#ffcf3f","w":"#fff6c8"},"px":["....oooo","...obbbb","o.oblbbb","bo.obblb","bo.obbbb","bobbwebb",".obbeebb","..obbbbb","obobbbob","bobbbbbo","bobobbob","ob.obobb",".o.ob.ob","...ob.ob","....o..o","........"]}]},{"id":"cerberus","rare":true,"pal":{"b":"#4a3f5c","d":"#2f2840","l":"#6d5f85","o":"#120f1c","e":"#ff5a4a","w":"#ffd0c8","N":"#120f1c"},"stages":[{"px":["........","........","........","..o.....","..odo...","..odoooo","..obbbbb","..obwebb","..obeebb","..olbllN","..ollllo","..obllol","..obbbbb","..obllll","...obbll","....oooo"]},{"px":["........","........","........",".o...o..","obo.obo.","obbbbbo.","obebebo.","obbbbbo.","oblNlbo.",".obbbooo","..oobbbb","...obbbb","...obbll","...obbll","...obbbo","...oooo."]},{"px":[".....o..","....obo.","....oboo","o.o.obbb","obooobeb","obbbobbb","obeboblN","obbboobl","obllo.oo",".obbobbb","..oobbbb","...obbbb","..obbbll","..obbbll","..obdbbo","..oooo.."]}]},{"id":"minotaur","rare":true,"pal":{"b":"#8a5a3a","d":"#5e3a22","l":"#c99a6e","h":"#f4ead2"},"stages":[{"px":["........","........","........","........","..h.....","..hooooo","oddobbbb",".ooobweb","...obeeb","...ollll","...olNll","...ollll","....oooo","...obbbb","...obbbb","....oooo"]},{"px":["........","h.......","h.......","oh......",".hhooooo","oddobbbb","oddobbbb",".oobbweb","..obbeeb","..obllll","..obolNl","..obllll","...ooooo","..obbbbb","..obdbbo","..oooo.."]},{"pal":{"h":"#ffcf3f","H":"#c98a12"},"px":["h.......","hH......","hh......","oh......",".hhooooo","oddobbbb","oddobbbb",".oobbweb","..obbeeb","..obllll","..obolNl","..oblllg","...oooog","..obbbbb","..obdbbo","..oooo.."]}]}]};

export const PET_INFO = {
 "haechi": {
  "price": 300,
  "name": "해치",
  "names": [
   "아기 해치",
   "해치",
   "수호 해치"
  ],
  "lore": "옳고 그름을 가린다는 상상의 동물. 경복궁 앞을 지키던 그 해치예요."
 },
 "dragon": {
  "price": 400,
  "name": "이무기",
  "names": [
   "꼬마 이무기",
   "이무기",
   "청룡"
  ],
  "lore": "오래 수련한 이무기가 여의주를 얻으면 용이 된다는 이야기에서 왔어요."
 },
 "dokkaebi": {
  "price": 300,
  "name": "도깨비",
  "names": [
   "꼬마 도깨비",
   "도깨비",
   "대장 도깨비"
  ],
  "lore": "장난을 좋아하지만 정 많은 우리 옛이야기 속 도깨비예요."
 },
 "bulgasari": {
  "price": 500,
  "name": "불가사리",
  "names": [
   "아기 불가사리",
   "불가사리",
   "무쇠 불가사리"
  ],
  "lore": "쇠를 먹고 자란다는 고려 말 전설 속 괴물. 클수록 단단해져요."
 },
 "tiger": {
  "price": 400,
  "name": "호랑이",
  "names": [
   "아기 호랑이",
   "호랑이",
   "백호"
  ],
  "lore": "옛이야기와 민화에 가장 많이 나오는 동물. 다 크면 이마에 王 무늬가 생겨요."
 },
 "sapsal": {
  "price": 300,
  "name": "삽살개",
  "names": [
   "아기 삽살이",
   "삽살개",
   "신령 삽살개"
  ],
  "lore": "귀신을 쫓는 개라는 뜻의 이름을 가진 우리 토종개예요. 천연기념물이에요."
 },
 "turtle": {
  "price": 500,
  "name": "거북",
  "names": [
   "꼬마 거북",
   "바다거북",
   "거북선"
  ],
  "lore": "끝까지 키우면 임진왜란 때 이순신 장군이 이끈 거북선이 돼요."
 },
 "bonghwang": {
  "price": 500,
  "name": "봉황",
  "names": [
   "아기 봉황",
   "어린 봉황",
   "봉황"
  ],
  "lore": "어진 임금이 나라를 다스릴 때 나타난다는 상서로운 새예요."
 },
 "sphinx": {
  "price": 400,
  "name": "스핑크스",
  "names": [
   "아기 고양이",
   "이집트 고양이",
   "스핑크스"
  ],
  "lore": "고양이를 아낀 고대 이집트. 다 크면 기자의 스핑크스처럼 두건을 써요."
 },
 "griffin": {
  "price": 400,
  "name": "그리핀",
  "names": [
   "아기 독수리",
   "그리핀",
   "황금 그리핀"
  ],
  "lore": "독수리 머리에 사자 몸. 페르시아·그리스 유물에 자주 나오는 수호 동물이에요."
 },
 "mammoth": {
  "price": 300,
  "name": "매머드",
  "names": [
   "아기 매머드",
   "매머드",
   "털매머드"
  ],
  "lore": "빙하기 구석기 사람들이 사냥하고 동굴 벽에 그리던 동물이에요."
 },
 "owl": {
  "price": 300,
  "name": "부엉이",
  "names": [
   "아기 부엉이",
   "부엉이",
   "아테나의 부엉이"
  ],
  "lore": "지혜의 여신 아테나의 새. 아테네 은화에 새겨져 있었어요."
 },
 "scarab": {
  "price": 300,
  "name": "스카라베",
  "names": [
   "아기 쇠똥구리",
   "스카라베",
   "황금 스카라베"
  ],
  "lore": "이집트 사람들은 쇠똥구리가 해를 굴린다고 믿었어요. 다 크면 태양을 이고 다녀요."
 },
 "wolf": {
  "price": 400,
  "name": "늑대",
  "names": [
   "아기 늑대",
   "늑대",
   "로마의 늑대"
  ],
  "lore": "로마를 세운 쌍둥이 형제를 젖 먹여 키웠다는 늑대. 청동상처럼 구릿빛이 돼요."
 },
 "camel": {
  "price": 300,
  "name": "낙타",
  "names": [
   "아기 낙타",
   "쌍봉낙타",
   "대상 낙타"
  ],
  "lore": "비단길을 오가던 상인들의 동반자. 다 크면 장식 고삐와 방울을 달아요."
 },
 "elephant": {
  "price": 400,
  "name": "코끼리",
  "names": [
   "아기 코끼리",
   "코끼리",
   "전투 코끼리"
  ],
  "lore": "한니발이 알프스를 넘을 때 데려간 코끼리. 다 크면 붉은 장식을 둘러요."
 },
 "giraffe": {
  "price": 400,
  "name": "기린",
  "names": [
   "아기 기린",
   "기린",
   "신수 기린"
  ],
  "lore": "명나라 정화의 함대가 데려온 기린을 사람들은 전설의 동물 기린이라 믿었어요."
 },
 "wyvern": {
  "price": 500,
  "name": "드래곤",
  "names": [
   "알 속 드래곤",
   "드래곤",
   "붉은 용"
  ],
  "lore": "중세 유럽 기사 이야기 속 용. 웨일스 깃발의 붉은 용이 돼요."
 },
 "samjogo": {
  "price": 2000,
  "name": "삼족오",
  "names": [
   "아기 까마귀",
   "세발까마귀",
   "삼족오"
  ],
  "lore": "고구려 고분 벽화 속 해에 사는 세 발 까마귀. 다 크면 해를 등에 져요.",
  "rare": true,
  "unlock": "한국사 👑 ‘광복의 증인’ 칭호 받기"
 },
 "gumiho": {
  "price": 2500,
  "name": "구미호",
  "names": [
   "아기 여우",
   "세꼬리 여우",
   "구미호"
  ],
  "lore": "천 년을 산 여우는 꼬리가 아홉 개가 된대요. 진화할 때마다 꼬리가 늘어나요.",
  "rare": true,
  "unlock": "문제 푼 날 30일 채우기"
 },
 "phoenix": {
  "price": 3000,
  "name": "불사조",
  "names": [
   "불씨 새",
   "불새",
   "불사조"
  ],
  "lore": "불에 타도 재 속에서 다시 태어난다는 새. 이집트·그리스 신화에 나와요.",
  "rare": true,
  "unlock": "혼자 연습 탑 100층 오르기"
 },
 "anubis": {
  "price": 2000,
  "name": "아누비스",
  "names": [
   "아기 자칼",
   "자칼",
   "아누비스"
  ],
  "lore": "이집트에서 죽은 이의 심장을 저울에 달던 자칼 머리의 신이에요.",
  "rare": true,
  "unlock": "세계사 👑 ‘고대 문명 순례자’ 칭호 받기"
 },
 "hyeonmu": {
  "price": 2500,
  "name": "현무",
  "names": [
   "아기 현무",
   "현무",
   "북방의 현무"
  ],
  "lore": "고구려 강서대묘 벽화의 북쪽 수호신. 거북을 뱀이 휘감고 있어요.",
  "rare": true,
  "unlock": "한국사 👑 ‘민주주의의 증인’ 칭호 받기"
 },
 "pig": {
  "price": 1500,
  "name": "금돼지",
  "names": [
   "아기 돼지",
   "복돼지",
   "금돼지"
  ],
  "lore": "최치원 설화에 나오는 금돼지. 다 크면 금빛으로 변하고 엽전을 품어요.",
  "rare": true,
  "unlock": "코인 누적 5,000개 모으기"
 },
 "kraken": {
  "price": 2500,
  "name": "크라켄",
  "names": [
   "아기 문어",
   "큰 문어",
   "크라켄"
  ],
  "lore": "바이킹 뱃사람들이 두려워한 북쪽 바다의 거대 괴물이에요.",
  "rare": true,
  "unlock": "하루에 100문제 맞히기"
 },
 "cerberus": {
  "price": 3000,
  "name": "케르베로스",
  "names": [
   "아기 강아지",
   "오르트로스",
   "케르베로스"
  ],
  "lore": "그리스 신화의 저승 문지기. 머리가 하나, 둘, 셋으로 늘어나요.",
  "rare": true,
  "unlock": "혼자 보스 레이드 어려움 깨기"
 },
 "minotaur": {
  "price": 2000,
  "name": "미노타우로스",
  "names": [
   "아기 송아지",
   "황소",
   "미노타우로스"
  ],
  "lore": "크레타섬 크노소스 궁전의 미궁에 갇혀 있었다는 소머리 괴물이에요.",
  "rare": true,
  "unlock": "수업 게임 1등 3번 하기"
 }
};
export const PET_ORDER = DATA.pets.map(p => p.id);

const petById = {};
DATA.pets.forEach(p => { petById[p.id] = p; });

function fullRows(rows){ return rows.map(r => r.length === 8 ? r + r.split('').reverse().join('') : r); }
const gridCache = {};
function baseGrid(id, si){
  const k = id + si;
  if(gridCache[k]) return gridCache[k];
  const st = petById[id].stages[si];
  const g = fullRows(st.px).map(r => r.split(''));
  (st.over || []).forEach(([x, y, c]) => { g[y][x] = c; });
  return (gridCache[k] = g);
}
function modGrid(id, si, closed, sad){
  if(!closed && !sad) return baseGrid(id, si);
  const g = baseGrid(id, si).map(r => r.slice());
  if(closed){
    // 눈 감기: 눈 칸 중 맨 윗줄은 피부색, 나머지는 선으로
    for(let x = 0; x < 16; x++){
      let top = -1;
      for(let y = 0; y < 16; y++){
        const c = g[y][x];
        if(c === 'e' || c === 'w' || c === 's'){ if(top < 0){ top = y; g[y][x] = 'b'; } else g[y][x] = 'o'; }
      }
    }
  } else if(sad){
    for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++) if(g[y][x] === 'w') g[y][x] = 'e';
  }
  return g;
}
function palette(id, si){
  const p = petById[id];
  return Object.assign({}, DATA.common, p.pal, p.stages[si].pal || {});
}
const ICONS = {
  heart: ['.mm.mm.', 'mmmmmmm', 'mmmmmmm', '.mmmmm.', '..mmm..', '...m...'],
  rice:  ['...h...', '..hhh..', '.hhhhh.', 'hhhhhhh', 'hkkkkkh', '.kkkkk.'],
  zz:    ['....kkk', 'kkkk..k', '...kkkk', '..k....', '.k.....', 'kkkk...'],
  drop:  ['...b...', '..bbb..', '.bbbbb.', '.bbbbb.', '..bbb..', '.......'],
  sick:  ['.mmm.', 'mmwmm', 'mwwwm', 'mmwmm', '.mmm.'],
  poop:  ['...o...', '..obo..', '.obbbo.', 'obbdbbo', 'ooooooo'],
  poopS: ['..o..', '.obo.', 'obbbo', 'ooooo'],
  coin:  ['.ooo.', 'oggGo', 'ogGgo', 'oggGo', '.ooo.']
};
const POOP_COL = { b: '#9a6534', d: '#6b4220', o: '#3a2412' };
function drawIcon(ctx, name, ox, oy, colors){
  const pal = Object.assign({}, DATA.common, colors || {});
  ICONS[name].forEach((r, y) => r.split('').forEach((c, x) => {
    if(c === '.') return;
    ctx.fillStyle = pal[c]; ctx.fillRect(ox + x, oy + y, 1, 1);
  }));
}
// 펫 하나를 ctx의 (ox, oy)에 그린다
export function drawPet(ctx, id, si, ox, oy, mods){
  if(!petById[id]) return;
  si = Math.max(0, Math.min(2, si | 0));
  const pal = palette(id, si);
  const g = modGrid(id, si, mods && mods.closed, mods && mods.sad);
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const c = g[y][x]; if(c === '.') continue;
    ctx.fillStyle = pal[c]; ctx.fillRect(ox + x, oy + y, 1, 1);
  }
}

// ── 움직이는 캔버스 (숨쉬기·눈 깜빡임·기분 말풍선) ─────────────
// 펫 도트는 작은 그림이 살짝 들썩이고 깜빡이는 정도라, 기기의 '동작 줄이기·애니메이션 제거'(절전 모드에서 자동으로
// 켜지는 기기가 많음) 설정과 상관없이 항상 움직이게 한다 (2026-11-06 사용자 요청). 다시 설정을 따르게 하려면
// 아래를 matchMedia('(prefers-reduced-motion: reduce)').matches 로 바꾸면 된다 — 그때도 멈춘 그림은 계속 다시 그려진다.
const reduceMotion = false;
const actors = new Set();
let loopOn = false, lastStill = -1e9;
// '애니메이션 줄이기'(동작 줄이기)가 켜진 기기에서도 그림은 계속 다시 그려야 한다 — 펫을 사거나 기분·장면이 바뀌면
// 그 상태로 바뀌어야 하므로. 그때는 움직임 없이(t=0 고정) 0.4초마다 한 번만 다시 그린다.
function loop(t){
  if(reduceMotion && t - lastStill < 400){ requestAnimationFrame(loop); return; }
  lastStill = t;
  actors.forEach(a => {
    if(!a.cv.isConnected){ if(a.seen) actors.delete(a); return; }
    a.seen = true;
    a.ctx.clearRect(0, 0, a.cv.width, a.cv.height);
    a.draw(a.ctx, reduceMotion ? 0 : t);
  });
  if(actors.size) requestAnimationFrame(loop); else loopOn = false;
}
function addActor(cv, draw){
  const a = { cv, ctx: cv.getContext('2d'), draw, seen: false };
  actors.add(a);
  try{ a.draw(a.ctx, 0); }catch(_e){}   // 첫 프레임을 기다리지 않고 바로 한 번 그린다
  if(!loopOn){ loopOn = true; lastStill = -1e9; requestAnimationFrame(loop); }
  return a;
}
// info: {id, s(단계), m(기분)} → 20×20 캔버스. 몸짓은 기분에 따라 다르다.
export function petCanvas(info, px){
  const cv = document.createElement('canvas');
  cv.width = 20; cv.height = 20;
  cv.className = 'pt-cv';
  if(px) { cv.style.width = px + 'px'; cv.style.height = px + 'px'; }
  const phase = Math.random() * 10;
  cv._pet = { id: info.id, s: info.s | 0, m: info.m || 'normal', poop: info.p | 0, jumpAt: -1e9 };
  addActor(cv, (ctx, t) => {
    const st = cv._pet;
    if(!petById[st.id]) return;
    const m = st.m;
    const dt = t - st.jumpAt;
    let oy = 3, ox = 2, closed = false, sad = false;
    if(dt >= 0 && dt < 550) oy = 3 - Math.round(Math.sin(dt / 550 * Math.PI) * 3);
    else if(m === 'sleep'){ closed = true; oy = 3 + ((t / 900) % 2 < 1 ? 0 : 1); }
    else if(m === 'happy'){ oy = 3 - (Math.abs(Math.sin(t / 260 + phase)) > .75 ? 1 : 0); }
    else if(m === 'hungry' || m === 'sad' || m === 'sick' || m === 'dirty'){ sad = true; ox = 2 + (Math.sin(t / (m === 'sick' ? 1700 : 1100) + phase) > 0 ? 1 : 0); oy = 4; }
    else if(m === 'walk'){ oy = 3 - (Math.abs(Math.sin(t / 180 + phase)) > .6 ? 1 : 0); }
    else if(m === 'tired'){ closed = !reduceMotion && (t / 1000 + phase) % 2.2 < 0.9; oy = 4; }
    else { oy = 3 + (Math.sin(t / 420 + phase) > 0 ? 0 : 1); }
    if(!closed && !reduceMotion && m !== 'sleep' && ((t / 1000 + phase) % 3.3) < 0.13) closed = true;
    if(st.sadUntil && t < st.sadUntil) sad = true;
    drawPet(ctx, st.id, st.s, ox, oy, { closed, sad });
    const blinkOn = (t / 700 + phase) % 2 < 1.3;
    if(m === 'happy' && blinkOn && !(dt >= 0 && dt < 550)) drawIcon(ctx, 'heart', 13, 0);
    else if(m === 'hungry' && blinkOn) drawIcon(ctx, 'rice', 13, 0, { k: '#3f7d52' });
    else if(m === 'sleep' && blinkOn) drawIcon(ctx, 'zz', 13, 0, { k: '#5b6b8c' });
    else if(m === 'tired' && blinkOn) drawIcon(ctx, 'drop', 14, 1, { b: '#7cc3ff' });
    else if(m === 'sick' && blinkOn) drawIcon(ctx, 'sick', 15, 0, { m: '#e5484d' });
    if(m === 'dirty' || (m === 'sick' && st.poop)) drawIcon(ctx, 'poopS', 15, 16, POOP_COL);
  });
  return cv;
}
export function updatePetCanvas(cv, info){
  if(!cv || !cv._pet) return;
  cv._pet.id = info.id; cv._pet.s = info.s | 0; cv._pet.m = info.m || 'normal'; cv._pet.poop = info.p | 0;
}
function jumpPetCanvas(cv, correct){
  if(!cv || !cv._pet) return;
  const now = performance.now();
  if(correct) cv._pet.jumpAt = now; else cv._pet.sadUntil = now + 900;
}
// ── 펫 방 꾸미기: 64×40 도트 방, 정해진 자리(슬롯)에 물건을 끼운다 ──
// 벽 y 0~27 · 바닥 y 28~39
// slots: paper(벽지) floor(바닥) window(창문) wall(벽 장식) left(왼쪽 가구) right(오른쪽 가구) rug(러그)
const R = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const P = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
function skyMode(hour){ return hour >= 6 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'eve' : 'night'; }
// 창 안쪽 하늘: inside(x,y)가 true인 칸만 칠한다
function drawSky(ctx, x0, y0, w, h, mode, t, inside){
  const top = { day: '#7cc4f0', eve: '#e9876b', night: '#1b1f4a' }[mode];
  const bot = { day: '#b9e2f8', eve: '#f6c27a', night: '#2c3270' }[mode];
  for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){
    if(inside && !inside(x, y)) continue;
    P(ctx, x0 + x, y0 + y, y < h / 2 ? top : bot);
  }
  const put = (x, y, c) => { if(x >= 0 && y >= 0 && x < w && y < h && (!inside || inside(x, y))) P(ctx, x0 + x, y0 + y, c); };
  if(mode === 'night'){
    put(w - 5, 2, '#fff3b0'); put(w - 4, 2, '#fff3b0'); put(w - 5, 3, '#fff3b0'); put(w - 6, 3, '#fff3b0'); put(w - 6, 4, '#fff3b0'); put(w - 5, 5, '#fff3b0');
    [[2, 2], [5, 6], [9, 3], [3, 9], [11, 8], [7, 11]].forEach(([sx, sy], i) => { if((t / 600 + i) % 3 > .6) put(sx % w, sy % h, '#ffffff'); });
  } else {
    const sy = mode === 'day' ? 2 : h - 5;
    for(let dy = 0; dy < 3; dy++) for(let dx = 0; dx < 3; dx++) put(w - 5 + dx, sy + dy, mode === 'day' ? '#ffe066' : '#ff9a4a');
    const cx = Math.round(((t / 120) % (w + 10)) - 6);
    [[0, 1], [1, 0], [2, 0], [3, 1], [1, 1], [2, 1], [4, 1]].forEach(([dx, dy]) => put(cx + dx, 5 + dy, '#ffffff'));
  }
}

export const DECOR = {
  paper: {
    cream:  { name: '크림 벽지', price: 0, cozy: 0, draw(ctx){ R(ctx, 0, 0, 64, 28, '#f3e6c8'); for(let y = 3; y < 27; y += 6) for(let x = (y % 12 ? 3 : 6); x < 64; x += 6) P(ctx, x, y, '#e6d4ae'); } },
    hanji:  { name: '한지 격자 벽', price: 120, cozy: 1, draw(ctx){ R(ctx, 0, 0, 64, 28, '#f4ecd8'); for(let x = 0; x < 64; x += 8) R(ctx, x, 0, 1, 27, '#d9c9a3'); for(let y = 0; y < 27; y += 9) R(ctx, 0, y, 64, 1, '#d9c9a3'); } },
    brick:  { name: '벽돌 벽', price: 120, cozy: 1, draw(ctx){ R(ctx, 0, 0, 64, 28, '#c46a4c'); for(let y = 0; y < 27; y += 4){ R(ctx, 0, y, 64, 1, '#a85a40'); for(let x = (y / 4) % 2 ? 4 : 0; x < 64; x += 8) R(ctx, x, y, 1, 4, '#a85a40'); } } },
    stripe: { name: '하늘 줄무늬 벽지', price: 100, cozy: 1, draw(ctx){ R(ctx, 0, 0, 64, 28, '#d5e8f7'); for(let x = 2; x < 64; x += 6) R(ctx, x, 0, 2, 27, '#bcd6ee'); } },
    starry: { name: '밤하늘 벽지', price: 180, cozy: 2, draw(ctx, t){ R(ctx, 0, 0, 64, 28, '#2e3466'); [[5,4],[14,9],[23,3],[31,12],[40,6],[50,10],[58,3],[9,18],[27,21],[45,19],[60,22],[36,24]].forEach(([x, y], i) => P(ctx, x, y, (t / 700 + i) % 3 > .5 ? '#fff3b0' : '#8f95c9')); } }
  },
  floor: {
    wood:    { name: '나무 마루', price: 0, cozy: 0, draw(ctx){ R(ctx, 0, 28, 64, 12, '#b9824f'); for(let y = 30; y < 40; y += 3) R(ctx, 0, y, 64, 1, '#9c6a3d'); for(let i = 0; i < 4; i++) for(let x = (i % 2 ? 9 : 2); x < 64; x += 14) P(ctx, x, 28 + i * 3, '#9c6a3d'); } },
    jangpan: { name: '노란 장판', price: 100, cozy: 1, draw(ctx){ R(ctx, 0, 28, 64, 12, '#e6c464'); for(let x = 0; x < 64; x += 10) R(ctx, x, 28, 1, 12, '#d6b04e'); R(ctx, 0, 33, 64, 1, '#d6b04e'); } },
    marble:  { name: '대리석 바닥', price: 150, cozy: 1, draw(ctx){ for(let y = 28; y < 40; y += 3) for(let x = 0; x < 64; x += 4) R(ctx, x, y, 4, 3, ((x / 4 + (y - 28) / 3) % 2) ? '#e9e9ef' : '#c9cad6'); } }
  },
  window: {
    basic: { name: '네모 창문', price: 0, cozy: 1, draw(ctx, t, hour){
      const x = 6, y = 5;
      drawSky(ctx, x + 1, y + 1, 14, 12, skyMode(hour), t);
      R(ctx, x, y, 16, 1, '#8b5a33'); R(ctx, x, y + 13, 16, 1, '#8b5a33'); R(ctx, x, y, 1, 14, '#8b5a33'); R(ctx, x + 15, y, 1, 14, '#8b5a33');
      R(ctx, x + 7, y, 2, 14, '#8b5a33'); R(ctx, x, y + 6, 16, 1, '#8b5a33'); R(ctx, x - 1, y + 14, 18, 1, '#6b4423'); } },
    hanok: { name: '한옥 띠살창', price: 150, cozy: 2, draw(ctx, t, hour){
      const x = 6, y = 4, m = skyMode(hour);
      R(ctx, x, y, 16, 16, '#6b4423');
      R(ctx, x + 1, y + 1, 14, 14, m === 'night' ? '#e8b866' : m === 'eve' ? '#f6d7a0' : '#f4ead2');   // 밤엔 방 불빛이 창호지에 비침
      for(let i = 0; i < 14; i += 3) R(ctx, x + 1 + i, y + 1, 1, 14, '#8b5a33');
      R(ctx, x + 1, y + 4, 14, 1, '#8b5a33'); R(ctx, x + 1, y + 11, 14, 1, '#8b5a33'); R(ctx, x + 7, y + 1, 2, 14, '#6b4423'); } },
    moon:  { name: '둥근 달창', price: 180, cozy: 2, draw(ctx, t, hour){
      const x = 5, y = 4, c = 8.5, r = 7.5;
      const inC = (px, py) => Math.hypot(px + .5 - c, py + .5 - c) <= r;
      drawSky(ctx, x, y, 17, 17, skyMode(hour), t, (px, py) => Math.hypot(px + .5 - c, py + .5 - c) <= r - 1);
      for(let py = 0; py < 17; py++) for(let px = 0; px < 17; px++){ const d = Math.hypot(px + .5 - c, py + .5 - c); if(d <= r && d > r - 1.3) P(ctx, x + px, y + py, '#7a4b2a'); }
      for(let i = 3; i < 15; i += 4){ for(let k = 0; k < 17; k++){ if(inC(i, k)) P(ctx, x + i, y + k, '#9b6a43'); if(inC(k, i)) P(ctx, x + k, y + i, '#9b6a43'); } } } },
    stained: { name: '스테인드글라스', price: 220, cozy: 3, draw(ctx, t, hour){
      const x = 7, y = 3, m = skyMode(hour);
      const cols = m === 'night' ? ['#5a2a3a', '#23305e', '#6b5a24', '#255036'] : ['#e5484d', '#3b6fe0', '#f2c230', '#3fae6a'];
      for(let py = 0; py < 18; py++) for(let px = 0; px < 14; px++){
        if(py < 6 && Math.hypot(px + .5 - 7, py + .5 - 7) > 7) continue;      // 위가 둥근 아치
        const lead = px % 7 === 0 || px === 13 || py % 6 === 0 || py === 17 || (py < 6 && Math.hypot(px + .5 - 7, py + .5 - 7) > 6);
        P(ctx, x + px, y + py, lead ? '#2b2233' : cols[((px / 7 | 0) + (py / 6 | 0)) % 4]);
      }
      R(ctx, x - 1, y + 18, 16, 1, '#6b6f80'); } }
  },
  wall: {
    none:   { name: '없음', price: 0, cozy: 0, draw(){} },
    clock:  { name: '벽시계', price: 100, cozy: 1, draw(ctx, t, hour, min){
      const cx = 51, cy = 10;
      for(let py = -5; py <= 5; py++) for(let px = -5; px <= 5; px++){ const d = Math.hypot(px, py); if(d <= 5.3) P(ctx, cx + px, cy + py, d > 4.3 ? '#6b4423' : '#fffaf0'); }
      const hand = (ang, len, c) => { for(let k = 0; k <= len; k++) P(ctx, cx + Math.round(Math.sin(ang) * k), cy - Math.round(Math.cos(ang) * k), c); };
      hand(((hour % 12) + min / 60) / 12 * Math.PI * 2, 2, '#2b2233'); hand(min / 60 * Math.PI * 2, 3.5, '#5b6b8c'); P(ctx, cx, cy, '#e5484d'); } },
    tiger:  { name: '민화 호랑이 액자', price: 160, cozy: 2, draw(ctx){
      const x = 45, y = 5; R(ctx, x, y, 13, 11, '#6b4423'); R(ctx, x + 1, y + 1, 11, 9, '#f2e6c8');
      R(ctx, x + 2, y + 2, 2, 5, '#3f7d52'); R(ctx, x + 1, y + 2, 4, 1, '#3f7d52'); R(ctx, x + 1, y + 4, 4, 1, '#3f7d52');   // 소나무
      R(ctx, x + 5, y + 5, 6, 3, '#f39a3c'); R(ctx, x + 9, y + 4, 3, 3, '#f39a3c'); P(ctx, x + 6, y + 5, '#2b2233'); P(ctx, x + 8, y + 6, '#2b2233'); P(ctx, x + 10, y + 5, '#2b2233'); P(ctx, x + 5, y + 8, '#f39a3c'); P(ctx, x + 10, y + 8, '#f39a3c'); P(ctx, x + 4, y + 5, '#f39a3c'); } },
    scroll: { name: '산수화 족자', price: 140, cozy: 2, draw(ctx){
      const x = 47, y = 3; R(ctx, x - 1, y, 11, 1, '#6b4423'); R(ctx, x, y + 1, 9, 15, '#f4ecd8'); R(ctx, x - 1, y + 16, 11, 1, '#6b4423');
      [[1, 9], [2, 8], [3, 7], [4, 8], [5, 9], [4, 6], [5, 5], [6, 6], [7, 7]].forEach(([dx, dy]) => P(ctx, x + dx, y + dy, '#55606e'));
      R(ctx, x + 1, y + 11, 7, 1, '#9fb0bf'); P(ctx, x + 7, y + 3, '#e5484d'); } },
    map:    { name: '옛 세계 지도', price: 180, cozy: 2, draw(ctx){
      const x = 44, y = 5; R(ctx, x, y, 15, 11, '#7a4b2a'); R(ctx, x + 1, y + 1, 13, 9, '#e9d9a6');
      [[2, 2, 3, 3], [3, 5, 2, 3], [7, 2, 3, 2], [7, 4, 2, 4], [10, 2, 3, 3], [11, 6, 2, 2]].forEach(([a, b, w, h]) => R(ctx, x + a, y + b, w, h, '#8aa05a'));
      P(ctx, x + 6, y + 7, '#e5484d'); } },
    egypt:  { name: '이집트 벽화', price: 200, cozy: 2, draw(ctx){
      const x = 44, y = 4; R(ctx, x, y, 15, 12, '#d9b56a'); R(ctx, x, y, 15, 1, '#2f5fb0'); R(ctx, x, y + 11, 15, 1, '#2f5fb0');
      R(ctx, x + 4, y + 4, 7, 1, '#2b2233'); R(ctx, x + 3, y + 5, 9, 1, '#2b2233'); R(ctx, x + 6, y + 5, 3, 2, '#2f5fb0'); R(ctx, x + 4, y + 7, 6, 1, '#2b2233');
      P(ctx, x + 7, y + 8, '#2b2233'); P(ctx, x + 7, y + 9, '#2b2233'); P(ctx, x + 8, y + 9, '#2b2233'); P(ctx, x + 10, y + 8, '#2b2233'); } }
  },
  // 가구는 왼쪽·오른쪽 자리에 함께 쓴다 (x: 자리의 왼쪽 끝, 바닥선 y=31에 붙어 섬)
  furn: {
    none:    { name: '없음', price: 0, cozy: 0, draw(){} },
    celadon: { name: '청자 화분', price: 150, cozy: 2, draw(ctx, t, x){
      const sway = Math.sin(t / 900) > 0 ? 1 : 0;
      [[6, 10], [5, 9], [4, 8], [7, 8], [8, 7], [9, 8], [10, 9], [6, 6], [5, 5], [9, 5], [10, 4]].forEach(([dx, dy]) => P(ctx, x + dx + (dy < 7 ? sway : 0), 14 + dy, '#3f9a52'));
      R(ctx, x + 5, 25, 7, 1, '#6faa96'); R(ctx, x + 4, 26, 9, 3, '#8fc7b0'); R(ctx, x + 5, 29, 7, 2, '#8fc7b0'); R(ctx, x + 6, 31, 5, 1, '#6faa96'); P(ctx, x + 7, 27, '#e8f6ef'); P(ctx, x + 9, 28, '#5f9a86'); } },
    jagae:   { name: '자개장', price: 280, cozy: 3, draw(ctx, t, x){
      R(ctx, x + 1, 14, 14, 17, '#2a1a12'); R(ctx, x + 1, 31, 2, 1, '#2a1a12'); R(ctx, x + 13, 31, 2, 1, '#2a1a12');
      R(ctx, x + 2, 15, 5, 14, '#3a2418'); R(ctx, x + 9, 15, 5, 14, '#3a2418');
      [[3, 17], [5, 19], [4, 22], [3, 25], [10, 17], [12, 20], [11, 23], [12, 26], [6, 26], [10, 25]].forEach(([dx, dy], i) => P(ctx, x + dx, dy, (t / 500 + i) % 4 > 1 ? '#e8f0ff' : '#ffd6f0'));
      P(ctx, x + 7, 22, '#ffcf3f'); P(ctx, x + 8, 22, '#ffcf3f'); } },
    books:   { name: '책장', price: 180, cozy: 2, draw(ctx, t, x){
      R(ctx, x + 1, 12, 14, 19, '#8b5a33'); R(ctx, x + 1, 31, 14, 1, '#6b4423');
      const cols = ['#e5484d', '#3b6fe0', '#f2c230', '#3fae6a', '#a46be8', '#f39a3c'];
      [14, 20, 26].forEach((sy, r) => { R(ctx, x + 2, sy, 12, 5, '#5e3a1f'); for(let i = 0; i < 6; i++) R(ctx, x + 2 + i * 2, sy + (i % 3 === r % 3 ? 1 : 0), 2, 5 - (i % 3 === r % 3 ? 1 : 0), cols[(i + r * 2) % 6]); R(ctx, x + 1, sy + 5, 14, 1, '#8b5a33'); }); } },
    globe:   { name: '지구본', price: 200, cozy: 2, draw(ctx, t, x){
      const cx = x + 8, cy = 20;
      for(let py = -5; py <= 5; py++) for(let px = -5; px <= 5; px++){
        if(Math.hypot(px, py) > 5.2) continue;
        const lon = ((px + Math.round(t / 260)) % 12 + 12) % 12;          // 천천히 돎
        P(ctx, cx + px, cy + py, (lon < 4 && Math.abs(py) < 4) || (lon > 7 && lon < 10 && py > -2) ? '#5fae5a' : '#3b8fe0');
      }
      for(let a = 0; a < 12; a++){ P(ctx, cx + Math.round(Math.cos(a / 12 * Math.PI) * 6), cy - Math.round(Math.sin(a / 12 * Math.PI) * 6), '#c98a12'); }
      R(ctx, cx, 26, 1, 4, '#6b4423'); R(ctx, cx - 3, 30, 7, 1, '#6b4423'); R(ctx, cx - 4, 31, 9, 1, '#4a2c18'); } },
    armor:   { name: '기사 갑옷', price: 260, cozy: 2, draw(ctx, t, x){
      const g = '#b8bfcc', d = '#7d8597';
      R(ctx, x + 6, 12, 5, 5, g); R(ctx, x + 6, 14, 5, 1, '#2b2233'); P(ctx, x + 8, 11, '#e5484d'); P(ctx, x + 8, 10, '#e5484d');
      R(ctx, x + 4, 17, 9, 7, g); R(ctx, x + 8, 17, 1, 7, d); R(ctx, x + 3, 17, 1, 6, d); R(ctx, x + 13, 17, 1, 6, d);
      R(ctx, x + 5, 24, 3, 6, g); R(ctx, x + 9, 24, 3, 6, g); R(ctx, x + 4, 30, 9, 1, d); R(ctx, x + 3, 31, 11, 1, '#4a2c18');
      R(ctx, x + 14, 11, 1, 20, '#7a5a3a'); P(ctx, x + 14, 10, '#d9d9e3'); P(ctx, x + 13, 11, '#d9d9e3'); P(ctx, x + 15, 11, '#d9d9e3'); } },
    column:  { name: '로마 기둥', price: 220, cozy: 2, draw(ctx, t, x){
      R(ctx, x + 3, 12, 11, 2, '#e9e5da'); R(ctx, x + 2, 11, 13, 1, '#d4cfc1'); R(ctx, x + 5, 14, 7, 15, '#f2efe6');
      for(let i = 6; i < 12; i += 2) R(ctx, x + i, 14, 1, 15, '#d4cfc1');
      R(ctx, x + 3, 29, 11, 2, '#e9e5da'); R(ctx, x + 2, 31, 13, 1, '#c9c3b2');
      R(ctx, x + 6, 6, 5, 5, '#e9e5da'); P(ctx, x + 7, 8, '#9a958a'); P(ctx, x + 9, 8, '#9a958a'); R(ctx, x + 5, 5, 7, 1, '#7fae4a'); } }
  },
  rug: {
    none:   { name: '없음', price: 0, cozy: 0, draw(){} },
    hwamun: { name: '화문석 돗자리', price: 120, cozy: 1, draw(ctx){
      R(ctx, 18, 33, 28, 5, '#e3c987'); for(let x = 18; x < 46; x += 2) R(ctx, x, 33, 1, 5, '#d4b773');
      R(ctx, 18, 33, 28, 1, '#a5302a'); R(ctx, 18, 37, 28, 1, '#a5302a');
      [[23, 35], [31, 35], [39, 35]].forEach(([fx, fy]) => { P(ctx, fx, fy, '#e5484d'); P(ctx, fx - 1, fy, '#3f7d52'); P(ctx, fx + 1, fy, '#3f7d52'); }); } },
    persia: { name: '페르시아 양탄자', price: 220, cozy: 2, draw(ctx){
      R(ctx, 17, 32, 30, 7, '#c9a227'); R(ctx, 18, 33, 28, 5, '#9e2a2a');
      R(ctx, 29, 34, 6, 3, '#2f5fb0'); R(ctx, 31, 33, 2, 5, '#2f5fb0'); P(ctx, 32, 35, '#f2c230');
      for(let x = 20; x < 45; x += 4){ P(ctx, x, 34, '#f2c230'); P(ctx, x + 2, 36, '#f2c230'); }
      for(let x = 17; x < 47; x += 2){ P(ctx, x, 39, '#f2e6c8'); } } },
    round:  { name: '무지개 러그', price: 150, cozy: 1, draw(ctx){
      const cols = ['#ff8fa3', '#ffcf3f', '#8fdc8f', '#7cc4f0'];
      for(let py = 0; py < 7; py++) for(let px = 0; px < 28; px++){
        const d = Math.hypot((px + .5 - 14) / 14, (py + .5 - 3.5) / 3.5);
        if(d <= 1) P(ctx, 18 + px, 32 + py, cols[Math.min(3, Math.floor(d * 4))]);
      } } }
  },
  // 장난감: 바닥 오른쪽 앞(x 45~58) — play(같이 노는 중)이면 더 크게 움직인다
  toy: {
    none:  { name: '없음', price: 0, cozy: 0, fun: 0, draw(){} },
    ball:  { name: '고무공', price: 80, cozy: 1, fun: 8, draw(ctx, t, play){
      const up = play ? Math.round(Math.abs(Math.sin(t / 180)) * 7) : 0, x = 45, y = 31 - up;
      R(ctx, x + 1, 37, 5, 1, 'rgba(0,0,0,.18)');
      for(let py = 0; py < 6; py++) for(let px = 0; px < 6; px++){ const d = Math.hypot(px - 2.5, py - 2.5); if(d <= 3) P(ctx, x + px, y + py, d > 2.4 ? '#a5302a' : (px + Math.round(t / (play ? 90 : 400))) % 4 < 2 ? '#e5484d' : '#ffffff'); }
      P(ctx, x + 1, y + 1, '#ffd6d6'); } },
    top:   { name: '팽이', price: 100, cozy: 1, fun: 10, draw(ctx, t, play){
      const x = 45, y = 30, s = Math.floor(t / (play ? 60 : 160)) % 4;
      const tilt = play ? 0 : (Math.sin(t / 700) > 0 ? 1 : 0);
      R(ctx, x + 1, 37, 6, 1, 'rgba(0,0,0,.18)');
      R(ctx, x + 3 + tilt, y - 2, 1, 2, '#6b4423');
      R(ctx, x + tilt, y, 8, 3, '#c98a4a');
      for(let i = 0; i < 8; i++) P(ctx, x + tilt + i, y + 1, (i + s) % 4 < 2 ? '#e5484d' : '#3b6fe0');
      [[0, 8], [1, 6], [2, 4], [3, 2]].forEach(([dy, w]) => R(ctx, x + tilt + (8 - w) / 2, y + 3 + dy, w, 1, '#b07a3e'));
      if(play && s % 2){ P(ctx, x - 2, y + 2, '#ffffff'); P(ctx, x + 10, y + 1, '#ffffff'); } } },
    jegi:  { name: '제기', price: 90, cozy: 1, fun: 9, draw(ctx, t, play){
      const up = play ? Math.round(Math.abs(Math.sin(t / 260)) * 10) : 0, x = 46, y = 32 - up;
      const sway = Math.sin(t / 200) > 0 ? 1 : 0;
      R(ctx, x + 1, 37, 5, 1, 'rgba(0,0,0,.18)');
      ['#e5484d', '#f2c230', '#3fae6a', '#3b6fe0', '#a46be8'].forEach((c, i) => R(ctx, x + i + (i % 2 ? sway : 0), y - 4, 1, 4, c));
      R(ctx, x, y, 6, 2, '#c98a12'); P(ctx, x + 2, y, '#7a4b12'); P(ctx, x + 3, y, '#7a4b12'); } },
    horse: { name: '나무 목마', price: 200, cozy: 2, fun: 12, draw(ctx, t, play){
      const rock = Math.round(Math.sin(t / (play ? 160 : 600)) * (play ? 2 : 1)), x = 45, y = 27;
      const W = '#b0773f', D = '#7a4b2a', a = rock > 0 ? 1 : 0, b = rock < 0 ? 1 : 0;
      R(ctx, x + 1, 37, 11, 1, D); P(ctx, x, 36, D); P(ctx, x + 12, 36, D);
      R(ctx, x + 3, 30, 1, 6, D); R(ctx, x + 9, 30, 1, 6, D);
      R(ctx, x + 2, y + 1 + a, 9, 3, W); R(ctx, x + 3, y + 2 + a, 7, 1, D);
      R(ctx, x + 9, y - 3 + b, 3, 5, W); P(ctx, x + 12, y - 2 + b, W); P(ctx, x + 10, y - 2 + b, '#2b2233');
      R(ctx, x + 8, y - 3 + b, 1, 4, '#e5484d');
      P(ctx, x + 1, y + 1 + a, '#e5484d'); P(ctx, x, y + 2 + a, '#e5484d'); } },
    bear:  { name: '곰인형', price: 160, cozy: 2, fun: 11, draw(ctx, t, play){
      const up = play ? Math.round(Math.abs(Math.sin(t / 220)) * 3) : 0, x = 45, y = 27 - up;
      const B = '#eab676', L = '#fbe3c0', O = '#6b3f22', K = '#2b2233', blink = t % 3200 < 160;
      const wave = play && Math.sin(t / 150) > 0;
      const body = [[2, 0, 2, 2], [8, 0, 2, 2], [3, 1, 6, 1], [2, 2, 8, 5], [2, 7, 8, 3], [1, 7, 1, 3], [10, wave ? 4 : 7, 1, 3], [1, 9, 3, 2], [8, 9, 3, 2]];
      R(ctx, x, 37, 12, 1, 'rgba(0,0,0,.2)');
      body.forEach(([dx, dy, w, h]) => R(ctx, x + dx - 1, y + dy - 1, w + 2, h + 2, O));
      body.forEach(([dx, dy, w, h]) => R(ctx, x + dx, y + dy, w, h, B));
      P(ctx, x + 3, y + 1, '#f2a0a0'); P(ctx, x + 8, y + 1, '#f2a0a0');
      if(blink){ R(ctx, x + 3, y + 3, 2, 1, K); R(ctx, x + 7, y + 3, 2, 1, K); }
      else { P(ctx, x + 4, y + 3, K); P(ctx, x + 7, y + 3, K); }
      R(ctx, x + 4, y + 5, 4, 2, L); R(ctx, x + 5, y + 5, 2, 1, K);
      R(ctx, x + 4, y + 8, 4, 2, L);
      P(ctx, x + 4, y + 7, '#e5484d'); P(ctx, x + 7, y + 7, '#e5484d'); R(ctx, x + 5, y + 7, 2, 1, '#a5302a');
      P(ctx, x + 2, y + 10, L); P(ctx, x + 9, y + 10, L); } },
    car:   { name: '장난감 자동차', price: 140, cozy: 1, fun: 11, draw(ctx, t, play){
      const mv = play ? Math.round(Math.sin(t / 400) * 4) : 0, x = 46 + mv, C = '#3b6fe0', G = '#bfe3ff';
      R(ctx, x, 37, 11, 1, 'rgba(0,0,0,.18)');
      R(ctx, x + 3, 31, 5, 1, C); R(ctx, x + 2, 32, 7, 1, C); R(ctx, x + 3, 32, 2, 1, G); R(ctx, x + 6, 32, 2, 1, G);
      R(ctx, x, 33, 11, 3, C); R(ctx, x + 1, 35, 9, 1, '#2a4fa8'); P(ctx, x + 10, 34, '#ffe066'); P(ctx, x, 34, '#e5484d');
      const spin = Math.floor(t / (play ? 80 : 500)) % 2;
      [2, 7].forEach(wx => { R(ctx, x + wx, 36, 2, 2, '#2b2233'); P(ctx, x + wx + spin, 36, '#9aa3b5'); });
      if(play && Math.abs(Math.cos(t / 400)) > .3){ const back = Math.cos(t / 400) > 0 ? -2 : 12; P(ctx, x + back, 35, '#dddddd'); P(ctx, x + back + (back < 0 ? -1 : 1), 34, '#eeeeee'); } } },
    blocks:{ name: '쌓기 블록', price: 100, cozy: 1, fun: 9, draw(ctx, t, play){
      const x = 45, hop = play ? Math.round(Math.abs(Math.sin(t / 200)) * 4) : 0, tilt = play && Math.sin(t / 100) > 0 ? 1 : 0;
      const blk = (bx, by, c, d) => { R(ctx, bx, by, 4, 4, c); R(ctx, bx, by + 3, 4, 1, d); P(ctx, bx + 1, by + 1, '#ffffff'); };
      R(ctx, x, 37, 14, 1, 'rgba(0,0,0,.18)');
      blk(x, 33, '#e5484d', '#a5302a'); blk(x + 4, 33, '#3b6fe0', '#2a4fa8');
      blk(x + 2 + tilt, 29 - hop, '#f2c230', '#c98a12');
      R(ctx, x + 11, 34, 1, 1, '#3fae6a'); R(ctx, x + 10, 35, 3, 1, '#3fae6a'); R(ctx, x + 9, 36, 5, 1, '#2f8a52'); } },
    ottogi:{ name: '오뚝이', price: 110, cozy: 1, fun: 10, draw(ctx, t, play){
      const x = 46, sway = play ? Math.sin(t / 150) * 2.5 : Math.sin(t / 700) * 1;
      R(ctx, x + 1, 37, 7, 1, 'rgba(0,0,0,.18)');
      for(let py = 24; py <= 37; py++){
        const sh = Math.round(sway * (37 - py) / 12);
        for(let px = 0; px <= 8; px++){
          let c = null;
          if(Math.hypot(px - 4, py - 33.5) <= 4) c = Math.hypot(px - 4, py - 34) <= 2 ? '#fff3b0' : '#e5484d';
          else if(Math.hypot(px - 4, py - 27) <= 3) c = py <= 25 ? '#2b2233' : '#ffe0c0';
          if(px === 3 && py === 27 || px === 5 && py === 27) c = '#2b2233';
          if(px === 4 && py === 29) c = '#e5484d';
          if((px === 2 || px === 6) && py === 28) c = '#ff9aa8';
          if(c) P(ctx, x + px + sh, py, c);
        }
      } } }
  }
};
export const SLOT_LABEL = { paper: '🧱 벽지', floor: '🟫 바닥', window: '🪟 창문', wall: '🖼️ 벽 장식', left: '🪑 왼쪽 가구', right: '🪑 오른쪽 가구', rug: '🟥 러그', toy: '🧸 장난감' };
export const SLOT_KIND = { paper: 'paper', floor: 'floor', window: 'window', wall: 'wall', left: 'furn', right: 'furn', rug: 'rug', toy: 'toy' };
export const DEFAULT_ROOM = { paper: 'cream', floor: 'wood', window: 'basic', wall: 'none', left: 'none', right: 'none', rug: 'none', toy: 'none' };
export function roomCozy(room){
  let n = 0;
  Object.keys(SLOT_KIND).forEach(s => { const it = DECOR[SLOT_KIND[s]][(room || {})[s] || DEFAULT_ROOM[s]]; if(it) n += it.cozy; });
  return n;
}
// 방 전체 그리기 (펫 제외) — 펫은 쓰는 쪽에서 바닥 위에 그린다
export function drawRoom(ctx, room, t, hour, min, play){
  room = Object.assign({}, DEFAULT_ROOM, room || {});
  const get = (s) => DECOR[SLOT_KIND[s]][room[s]] || DECOR[SLOT_KIND[s]][DEFAULT_ROOM[s]];
  get('paper').draw(ctx, t);
  R(ctx, 0, 27, 64, 1, '#7a5a3a');
  get('floor').draw(ctx, t);
  get('window').draw(ctx, t, hour);
  get('wall').draw(ctx, t, hour, min);
  get('rug').draw(ctx, t);
  get('left').draw(ctx, t, 1);
  get('right').draw(ctx, t, 47);
  get('toy').draw(ctx, t, !!play);
}


// 펫 키우기 장면 = 꾸민 방 64×40: st = {id, s, m, poop, room, playUntil} (id가 없으면 빈 방만)
function sceneCanvas(st){
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 40; cv.className = 'pt-cv pt-scene';
  cv._scene = st;
  const POOP_X = [3, 10, 17, 38, 31];   // 펫(가운데)·장난감(오른쪽 앞)에 가리지 않게 주로 왼쪽 앞
  addActor(cv, (ctx, t) => {
    const s = cv._scene;
    const m = s.m, walking = m === 'walk', sleeping = m === 'sleep', hasPet = !!petById[s.id];
    const d = new Date(), play = hasPet && s.playUntil && Date.now() < s.playUntil && !walking && !sleeping;
    if(walking && hasPet){
      // 산책 중: 풀밭이 흘러감
      ctx.fillStyle = '#cfe8b0'; ctx.fillRect(0, 0, 64, 40);
      ctx.fillStyle = '#8cc46a'; ctx.fillRect(0, 33, 64, 7);
      ctx.fillStyle = '#5f9e45';
      for(let i = 0; i < 8; i++){ const x = Math.round(((i * 11 - t / 35) % 88 + 88) % 88) - 12; ctx.fillRect(x, 32, 1, 2); ctx.fillRect(x + 2, 31, 1, 3); }
      ctx.fillStyle = '#ffffff';
      for(let i = 0; i < 3; i++){ const x = Math.round(((i * 25 - t / 90) % 75 + 75) % 75) - 9; ctx.fillRect(x, 5 + i * 4, 6, 1); ctx.fillRect(x + 1, 4 + i * 4, 4, 1); }
    } else {
      drawRoom(ctx, s.room, t, d.getHours(), d.getMinutes(), play);
    }
    if(!hasPet) return;
    let px = 22, py = 19, closed = false, sad = false;
    if(walking){ px = 22; py = 19 - (Math.abs(Math.sin(t / 160)) > .55 ? 1 : 0); }
    else if(sleeping){ py = 19 + ((t / 900) % 2 < 1 ? 0 : 1); closed = true; }
    else if(play){ px = 27 + Math.round(Math.sin(t / 400) * 2); py = 19 - Math.round(Math.abs(Math.sin(t / 220)) * 4); }
    else if(m === 'sick'){ px = 20 + (Math.sin(t / 1700) > 0 ? 1 : 0); py = 20; sad = true; }
    else {
      px = 22 + Math.round(Math.sin(t / 2300) * (m === 'happy' ? 6 : 4));
      py = 19 - (m === 'happy' && Math.abs(Math.sin(t / 260)) > .8 ? 1 : 0);
      sad = m === 'hungry' || m === 'sad' || m === 'dirty';
    }
    if(!closed && !reduceMotion && ((t / 1000) % 3.3) < 0.13) closed = true;
    // 똥 (산책 중엔 집에 두고 나감)
    if(!walking){
      for(let i = 0; i < Math.min(s.poop | 0, POOP_X.length); i++){
        drawIcon(ctx, 'poop', POOP_X[i], 32, POOP_COL);
        if((t / 500 + i) % 2 < 1){ ctx.fillStyle = '#9bb36a'; ctx.fillRect(POOP_X[i] + 2, 29, 1, 1); ctx.fillRect(POOP_X[i] + 4, 28, 1, 1); }
      }
    }
    drawPet(ctx, s.id, s.s, px, py, { closed, sad });
    const blinkOn = (t / 700) % 2 < 1.3;
    const bx = Math.min(57, px + 14);
    if(play && blinkOn) drawIcon(ctx, 'heart', bx, py - 6);
    else if(m === 'sick' && blinkOn) drawIcon(ctx, 'sick', bx, py - 5, { m: '#e5484d' });
    else if(m === 'hungry' && blinkOn) drawIcon(ctx, 'rice', bx, py - 6, { k: '#3f7d52' });
    else if(m === 'happy' && blinkOn) drawIcon(ctx, 'heart', bx, py - 6);
    else if(m === 'tired' && blinkOn) drawIcon(ctx, 'drop', bx, py - 5, { b: '#7cc3ff' });
    if(sleeping){
      ctx.fillStyle = 'rgba(30,30,70,.35)'; ctx.fillRect(0, 0, 64, 40);
      if(blinkOn) drawIcon(ctx, 'zz', px + 14, py - 6, { k: '#ffffff' });
    }
  });
  return cv;
}

// 상점 목록용: 움직이지 않는 한 장짜리 그림
function staticCanvas(id, si, px){
  const cv = document.createElement('canvas');
  cv.width = 16; cv.height = 16; cv.className = 'pt-cv';
  if(px){ cv.style.width = px + 'px'; cv.style.height = px + 'px'; }
  drawPet(cv.getContext('2d'), id, si, 0, 0);
  return cv;
}

// ── 돌봄 계산 ────────────────────────────────────────
const clamp = (v) => Math.max(0, Math.min(100, v));
let CUR_COZY = 0;   // 지금 학생 방의 아늑함 (데이터를 받을 때마다 갱신) — careNow의 기본값
export function careNow(p, now, cozy = CUR_COZY){
  p = p || {};
  const h = Math.max(0, (now - (p.t || now)) / 3600000);
  let sleepUntil = p.sleepUntil || 0;
  let energy = clamp((p.energy == null ? 100 : p.energy) + h * PET_RULES.energyRegen);
  if(sleepUntil && now >= sleepUntil){ energy = 100; sleepUntil = 0; }
  // 똥: poopT부터 poopEveryMs마다 하나씩 (최대 poopMax)
  let poop = p.poop | 0, poopT = p.poopT || p.t || now;
  const n = Math.floor((now - poopT) / PET_RULES.poopEveryMs);
  if(n > 0){ poop = Math.min(PET_RULES.poopMax, poop + n); poopT += n * PET_RULES.poopEveryMs; }
  let sick = !!p.sick;
  const food = clamp((p.food == null ? 80 : p.food) - h * PET_RULES.foodDecay);
  const slow = 1 - Math.min(PET_RULES.cozyMax, (cozy || 0) * PET_RULES.cozyStep);   // 방이 아늑할수록 기분이 천천히 떨어짐
  const fun = clamp((p.fun == null ? 80 : p.fun) - h * PET_RULES.funDecay * (sick ? 2 : 1) * slow);
  if(!sick && (poop >= PET_RULES.sickPoop || food <= 0)) sick = true;
  return {
    stage: p.stage | 0, exp: p.exp || 0, food, fun,
    energy, sleepUntil, at: p.at || now,
    poop, poopT, sick, walkUntil: p.walkUntil || 0, walkNext: p.walkNext || 0, cozy: cozy || 0
  };
}
export function moodOf(c, now){
  if(c.sleepUntil && c.sleepUntil > now) return 'sleep';
  if(c.walkUntil && c.walkUntil > now) return 'walk';
  if(c.sick) return 'sick';
  if(c.food < 25) return 'hungry';
  if(c.poop >= 2) return 'dirty';
  if(c.energy < 20) return 'tired';
  if(c.fun < 25) return 'sad';
  const th = (c.cozy || 0) > PET_RULES.cozyHappy ? 50 : 60;   // 아늑한 방이면 더 쉽게 신남
  if(c.food >= th && c.fun >= th && c.energy >= th && !c.poop) return 'happy';
  return 'normal';
}
export const MOOD_LABEL = { happy: '😊 신남', normal: '🙂 보통', hungry: '🍙 배고픔', tired: '😪 지침', sad: '😞 심심함', sleep: '💤 자는 중',
  walk: '🦮 산책 중', sick: '🤒 아픔', dirty: '💩 지저분함' };
function storeCare(c, now){
  return { stage: c.stage, exp: Math.round(c.exp), food: Math.round(c.food * 10) / 10, fun: Math.round(c.fun * 10) / 10,
           energy: Math.round(c.energy * 10) / 10, t: now, sleepUntil: c.sleepUntil || null, at: c.at,
           poop: c.poop | 0, poopT: c.poopT || now, sick: c.sick || null, walkUntil: c.walkUntil || null, walkNext: c.walkNext || null };
}
function evolveReady(c, now){
  if(c.stage === 0) return c.exp >= PET_RULES.evolve[0];
  if(c.stage === 1) return c.exp >= PET_RULES.evolve[1] && moodOf(c, now) === 'happy';
  return false;
}

export function josa(word, withB, noB){
  const s = String(word || ''), c = s.charCodeAt(s.length - 1);
  if(!(c >= 0xAC00 && c <= 0xD7A3)) return s + withB;
  const jong = (c - 0xAC00) % 28;
  if(withB === '으로') return s + (jong === 0 || jong === 8 ? '로' : '으로');   // ㄹ 받침은 '로'
  return s + (jong ? withB : noB);
}

export function dayKey(ms){
  const d = new Date(ms);
  return '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}

// ── 희귀 펫 해금 조건 ─────────────────────────────────
// ext: 칭호 기록(두 과목) { world:{seen,days,histDays,log}, korea:{...} }
function rareProgress(id, d, ext){
  const seen = (room, tid) => !!(ext[room] && ext[room].seen && ext[room].seen[tid]);
  const logCount = (suffix) => ['world', 'korea'].reduce((n, r) => n + Object.keys((ext[r] && ext[r].log) || {}).filter(k => k.endsWith('_' + suffix)).length, 0);
  switch(id){
    case 'samjogo':  return { ok: seen('korea', 'g_1'), text: seen('korea', 'g_1') ? '달성' : '아직' };
    case 'hyeonmu':  return { ok: seen('korea', 'g_2'), text: seen('korea', 'g_2') ? '달성' : '아직' };
    case 'anubis':   return { ok: seen('world', 'g_1'), text: seen('world', 'g_1') ? '달성' : '아직' };
    case 'gumiho': {
      const set = new Set();
      ['world', 'korea'].forEach(r => { const e = ext[r] || {}; Object.keys(e.days || {}).forEach(k => set.add(k)); Object.keys(e.histDays || {}).forEach(k => set.add(k)); });
      return { ok: set.size >= 30, text: `${Math.min(set.size, 30)} / 30일` };
    }
    case 'phoenix':  return { ok: (d.soloBest || 0) >= 100, text: `최고 ${d.soloBest || 0} / 100층` };
    case 'pig':      return { ok: (d.earned || 0) >= 5000, text: `${(d.earned || 0).toLocaleString()} / 5,000코인` };
    case 'kraken':   return { ok: (d.maxDay || 0) >= 100, text: `최고 ${d.maxDay || 0} / 100문제` };
    case 'cerberus': { const n = logCount('soloraidd2'); return { ok: n > 0, text: n > 0 ? '달성' : '아직' }; }
    case 'minotaur': { const n = logCount('first'); return { ok: n >= 3, text: `${Math.min(n, 3)} / 3번` }; }
  }
  return { ok: false, text: '' };
}

// ── 화면 ─────────────────────────────────────────────
let cssAdded = false;
function addCss(){
  if(cssAdded) return;
  cssAdded = true;
  const st = document.createElement('style');
  st.textContent = `
  .pt-cv{ image-rendering:pixelated; image-rendering:crisp-edges; display:block; }
  .pt-avatar{ display:inline-flex; align-items:flex-end; justify-content:center; }
  .pt-avatar .pt-cv{ width:40px; height:40px; }
  .pt-open-btn{ margin-top:10px; background:#eef6ff; color:#1d4f91; border:2px solid #b9d6f7; border-radius:12px; padding:10px 16px; font-weight:800; font-size:1rem; cursor:pointer; }
  .pt-open-btn .pt-sub{ display:block; font-size:.78rem; font-weight:700; opacity:.85; margin-top:2px; }
  .pt-overlay{ position:fixed; inset:0; z-index:9000; background:rgba(15,23,42,.6); display:flex; align-items:center; justify-content:center; padding:16px; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; }
  .pt-panel{ background:#fff; color:#1f2937; width:min(860px,100%); max-height:92vh; max-height:min(92vh,100%); max-height:min(92dvh,100%); margin:auto; flex-shrink:0; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.35); text-align:left; }
  .pt-head{ display:flex; align-items:center; gap:10px; padding:14px 18px 10px; border-bottom:1px solid #e5e7eb; flex-wrap:wrap; }
  .pt-head h3{ margin:0; font-size:1.2rem; }
  .pt-coins{ font-weight:900; color:#a86b00; background:#fff4d6; border-radius:999px; padding:4px 12px; font-size:1rem; }
  .pt-body{ overflow-y:auto; padding:12px 18px 20px; }
  .pt-sec h4{ margin:16px 0 6px; font-size:1rem; }
  .pt-note{ font-size:.8rem; color:#6b7280; margin-bottom:8px; line-height:1.45; }
  .pt-mine{ display:flex; gap:16px; align-items:center; background:#f6f8fc; border-radius:14px; padding:12px 14px; flex-wrap:wrap; }
  .pt-mine .pt-big{ background:linear-gradient(#dfe9fb,#c9daf6); border-radius:12px; padding:6px; }
  .pt-mine .pt-big .pt-cv{ width:120px; height:120px; }
  .pt-mine .pt-big .pt-scene{ width:256px; height:160px; border-radius:6px; }
  .pt-ctabs{ padding:2px 0 4px; margin:0 0 2px; }
  .pt-items{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .pt-empty{ font-size:.76rem; color:#9ca3af; }
  .pt-prev{ position:sticky; top:-12px; z-index:2; margin-bottom:6px; box-shadow:0 6px 12px -8px rgba(0,0,0,.25); }
  .pt-good.on{ border-style:solid; border-color:#6c8cf5; background:#f1f5ff; }
  .pt-good-btns{ display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
  .pt-good-btns .pt-buy{ flex:1; width:auto !important; }
  .pt-overlay .pt-good-btns button{ white-space:nowrap; font-size:.8rem; padding:6px 8px; }
  .pt-goods.pt-decor{ grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); }
  .pt-cls{ gap:4px; }
  .pt-cls .pt-tab{ padding:3px 9px !important; font-size:.8rem !important; }
  .pt-overlay button.pt-item{ width:auto; flex:0 0 auto; font-size:.82rem; font-weight:700; padding:5px 10px; border-radius:10px; border:2px solid #e5e7eb; background:#fff; color:#374151; cursor:pointer; transition:none; }
  .pt-overlay button.pt-item small{ color:#a86b00; font-weight:800; margin-left:2px; }
  .pt-overlay button.pt-item.on{ border-color:#6c8cf5; background:#f1f5ff; box-shadow:0 0 0 1px #6c8cf5 inset; }
  .pt-overlay button.pt-item:disabled{ opacity:1; cursor:default; }
  .pt-overlay button.pt-item:disabled:not(.on){ opacity:.45; }
  .pt-slot h4{ margin:12px 0 6px !important; font-size:.92rem !important; }
  .pt-friends{ display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:8px; }
  .pt-overlay button.pt-friend{ width:auto; display:flex; flex-direction:column; align-items:flex-start; gap:2px; padding:8px 12px; border-radius:12px; border:2px solid #e5e7eb; background:#fff; color:#1f2937; cursor:pointer; text-align:left; transition:none; font-size:.95rem; }
  .pt-overlay button.pt-friend span{ font-size:.76rem; color:#6b7280; font-weight:600; }
  .pt-overlay button.pt-friend:hover{ border-color:#6c8cf5; }
  .pt-mine .pt-big{ padding:4px; }
  .pt-poops{ grid-column:2 / 4; font-size:.86rem; letter-spacing:1px; }
  .pt-status{ font-size:.84rem; font-weight:800; color:#8a5a00; background:#fff3d6; border-radius:8px; padding:5px 9px; }
  .pt-status.bad{ color:#b42318; background:#fde8e7; }
  .pt-overlay button.pt-act.warn{ background:#e5484d; border-color:#e5484d; color:#fff; }
  .pt-overlay button.pt-act small{ font-weight:700; opacity:.8; }
  .pt-sub-h{ margin:10px 0 6px !important; font-size:.92rem !important; }
  .pt-sub-h small{ font-weight:600; color:#6b7280; font-size:.74rem; margin-left:6px; }
  .pt-goods{ display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:8px; margin-bottom:12px; }
  .pt-good{ border:2px dashed #e5d3a2; border-radius:12px; padding:8px 10px; display:flex; flex-direction:column; gap:3px; background:#fffcf3; }
  .pt-good b{ font-size:.95rem; }
  .pt-good span{ font-size:.76rem; color:#6b7280; }
  .pt-good small{ font-size:.72rem; color:#8a5a00; font-weight:700; }
  .pt-mine-info{ flex:1; min-width:220px; display:flex; flex-direction:column; gap:6px; }
  .pt-mine-name{ font-size:1.15rem; font-weight:900; }
  .pt-mine-name small{ font-size:.8rem; font-weight:700; color:#6b7280; margin-left:6px; }
  .pt-bar{ display:grid; grid-template-columns:62px 1fr 42px; align-items:center; gap:8px; font-size:.8rem; color:#4b5563; }
  .pt-bar i{ display:block; height:9px; background:#e5e7eb; border-radius:99px; overflow:hidden; }
  .pt-bar i b{ display:block; height:100%; background:#f5b62a; border-radius:99px; }
  .pt-bar i b.low{ background:#f26b7a; }
  .pt-bar i b.exp{ background:#6c8cf5; }
  .pt-bar span{ text-align:right; font-variant-numeric:tabular-nums; }
  .pt-acts{ display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
  .pt-overlay button.pt-act{ width:auto; flex:0 0 auto; font-size:.86rem; font-weight:800; padding:7px 12px; border-radius:10px; border:2px solid #d1d5db; background:#fff; color:#374151; cursor:pointer; transition:none; }
  .pt-overlay button.pt-act.go{ background:#6c8cf5; border-color:#6c8cf5; color:#fff; }
  .pt-overlay button.pt-act.gold{ background:#ffcf3f; border-color:#e0a920; color:#5a3b00; }
  .pt-overlay button.pt-act:disabled{ opacity:.45; cursor:default; }
  .pt-msg{ font-size:.82rem; color:#4b5563; min-height:1.1em; }
  .pt-owned{ display:flex; gap:8px; flex-wrap:wrap; }
  .pt-overlay button.pt-own{ width:auto; flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 8px 5px; border-radius:12px; border:2px solid #e5e7eb; background:#fff; color:#374151; font-size:.74rem; font-weight:700; cursor:pointer; transition:none; }
  .pt-overlay button.pt-own.on{ border-color:#6c8cf5; box-shadow:0 0 0 2px #6c8cf5 inset; background:#f1f5ff; }
  .pt-own .pt-cv{ width:48px; height:48px; }
  .pt-tabs{ display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap; }
  .pt-overlay button.pt-tab{ width:auto; flex:0 0 auto; padding:5px 12px; font-size:.86rem; font-weight:800; border-radius:999px; border:2px solid #e5e7eb; background:#fff; color:#6b7280; cursor:pointer; transition:none; }
  .pt-overlay button.pt-tab.on{ background:#1f2937; border-color:#1f2937; color:#fff; }
  .pt-shop{ display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:10px; }
  .pt-card{ border:2px solid #e5e7eb; border-radius:14px; padding:10px 12px; display:flex; flex-direction:column; gap:6px; background:#fff; }
  .pt-card.rare{ border-color:#d9b44a; background:linear-gradient(#fffdf4,#fff); }
  .pt-card-top{ display:flex; align-items:baseline; gap:6px; }
  .pt-card-top b{ font-size:1rem; }
  .pt-rare{ font-size:.7rem; font-weight:900; color:#fff; background:linear-gradient(90deg,#e0a920,#a46be8); border-radius:6px; padding:1px 6px; }
  .pt-price{ margin-left:auto; font-weight:900; color:#a86b00; white-space:nowrap; font-size:.9rem; }
  .pt-evo{ display:flex; align-items:flex-end; justify-content:space-around; background:#f6f8fc; border-radius:10px; padding:6px 4px; }
  .pt-evo .pt-cv{ width:48px; height:48px; }
  .pt-evo .pt-cv.lk{ filter:brightness(0) opacity(.25); }
  .pt-lore{ font-size:.76rem; color:#6b7280; line-height:1.4; }
  .pt-lock{ font-size:.76rem; color:#8a5a00; background:#fff6dc; border-radius:8px; padding:4px 8px; line-height:1.4; }
  .pt-lock.ok{ color:#1f7a3a; background:#e8f7ec; }
  .pt-overlay button.pt-buy{ width:100%; padding:7px; font-size:.86rem; font-weight:800; border-radius:10px; border:none; background:#ffcf3f; color:#5a3b00; cursor:pointer; transition:none; }
  .pt-overlay button.pt-buy:disabled{ background:#eef0f4; color:#9ca3af; cursor:default; opacity:1; }
  .pt-overlay button.pt-close{ width:auto; flex:0 0 auto; margin-left:auto; padding:8px 12px; font-size:.9rem; font-weight:700; color:#374151; background:#f3f4f6; border:none; border-radius:10px; cursor:pointer; }
  .pt-toasts{ position:fixed; bottom:18px; left:50%; transform:translateX(-50%); z-index:9100; display:flex; flex-direction:column; gap:8px; align-items:center; pointer-events:none; }
  .pt-toast{ background:#1f2937; color:#fff; border-radius:14px; padding:9px 16px; font-weight:800; font-size:.95rem; box-shadow:0 10px 30px rgba(0,0,0,.35); animation:ptIn .3s ease; text-align:center; }
  .pt-toast small{ display:block; font-size:.74rem; font-weight:600; opacity:.8; }
  @keyframes ptIn{ from{ transform:translateY(10px); opacity:0; } to{ transform:none; opacity:1; } }
  .pt-coinpop{ position:absolute; font-weight:900; color:#d99a00; font-size:.85rem; pointer-events:none; animation:ptCoin .9s ease-out forwards; text-shadow:0 1px 0 #fff; white-space:nowrap; }
  @keyframes ptCoin{ from{ opacity:1; transform:translateY(0); } to{ opacity:0; transform:translateY(-26px); } }
  @media (max-width:520px){ .pt-mine .pt-big .pt-cv{ width:96px; height:96px; } .pt-mine .pt-big .pt-scene{ width:256px; height:160px; max-width:100%; } .pt-mine{ justify-content:center; } .pt-prev{ flex-wrap:nowrap; gap:10px; padding:8px; } .pt-prev .pt-big .pt-scene{ width:144px; height:90px; } .pt-prev .pt-mine-info{ min-width:0; } .pt-prev .pt-mine-name{ font-size:.9rem; } .pt-prev .pt-mine-name small{ display:block; margin:2px 0 0; font-size:.7rem; } .pt-shop{ grid-template-columns:1fr; } }
  `;
  document.head.appendChild(st);
}

export function mountPets(deps, opts){
  const { db, ref, get, runTransaction, onValue, serverNow, escapeHtml } = deps;
  const source = opts.source === 'class' ? 'class' : 'solo';
  let ident = null;
  let data = {};
  let loaded = false;
  let unsub = null;
  let overlay = null;
  let shopTab = 'normal';
  let sceneCv = null;       // 펫 키우기 장면 캔버스 (창을 닫을 때까지 재사용)
  let tickTimer = null;
  let lastMood = null;
  let careTab = 'care';     // 펫 키우기 탭: 'care' 돌보기 · 'room' 방 꾸미기 · 'friends' 친구 방
  let friends = null, friendsBusy = false, friendSel = null, friendCv = null, friendCls = null;
  let shopPrev = null, prevCv = null;   // 상점 꾸미기 미리보기 {kind, id}
  let view = 'all';         // 'all' 펫+상점 한 창 · 'shop' 상점만 · 'care' 펫 키우기만
  let ext = null;           // 희귀 해금 조건용 칭호 기록 (상점을 열 때 한 번 불러옴)
  let msg = '';
  let lastSig = null;
  let readyToasted = {};
  const avatars = new Set();
  addCss();

  const base = () => `pets/${ident.cls}/${ident.name}`;
  const nowMs = () => (serverNow ? serverNow() : Date.now());

  function toast(text, sub){
    let box = document.querySelector('.pt-toasts');
    if(!box){ box = document.createElement('div'); box.className = 'pt-toasts'; document.body.appendChild(box); }
    const d = document.createElement('div');
    d.className = 'pt-toast';
    d.innerHTML = escapeHtml(text) + (sub ? `<small>${escapeHtml(sub)}</small>` : '');
    box.appendChild(d);
    setTimeout(() => d.remove(), 3600);
  }

  function activeInfo(){
    if(!ident || !data.active || !data.owned || !data.owned[data.active] || !petById[data.active]) return null;
    const now = nowMs();
    const c = careNow(data.owned[data.active], now);
    return { id: data.active, s: c.stage, m: moodOf(c, now), p: c.poop };
  }
  function sync(force){
    const info = activeInfo();
    const sig = JSON.stringify(info);
    avatars.forEach(a => renderAvatar(a, info));
    if(!force && sig === lastSig) return;
    lastSig = sig;
    if(opts.onPet) opts.onPet(info);
  }
  // 기분은 시간이 지나며 바뀌므로 1분마다 다시 본다
  setInterval(() => { if(ident && loaded) sync(); }, 60000);

  function renderAvatar(a, info){
    if(!info){
      if(a.cv){ a.cv.remove(); a.cv = null; }
      a.el.classList.remove('pt-avatar');
      if(a.el.dataset.ptEmoji != null && !a.el.textContent) a.el.textContent = a.el.dataset.ptEmoji;
      return;
    }
    if(!a.cv){
      if(a.el.dataset.ptEmoji == null) a.el.dataset.ptEmoji = a.el.textContent;
      a.el.textContent = '';
      a.el.classList.add('pt-avatar');
      a.cv = petCanvas(info);
      a.el.appendChild(a.cv);
    } else updatePetCanvas(a.cv, info);
  }

  const VIEW_TITLE = { all: '🐾 내 펫 · 상점', shop: '🏪 상점', care: '🐾 펫 키우기' };
  function updateButtons(){
    document.querySelectorAll('[data-pt-open]').forEach(b => {
      const v = b.getAttribute('data-pt-open') || 'all';
      const info = activeInfo();
      const nm = info ? PET_INFO[info.id].names[info.s] : '';
      const sub = !(ident && loaded) ? ''
        : v === 'care' ? (info ? `${escapeHtml(nm)} · ${MOOD_LABEL[info.m]}` : '아직 펫이 없어요')
        : v === 'shop' ? `🪙 ${(data.coins || 0).toLocaleString()}코인`
        : `🪙 ${(data.coins || 0).toLocaleString()}코인${nm ? ' · ' + escapeHtml(nm) : ''}`;
      b.innerHTML = VIEW_TITLE[v] + (sub ? `<span class="pt-sub">${sub}</span>` : '');
    });
  }

  // 🎁 선생님이 준 코인 알림 (관리자 화면에서 gifts/<키>로 남김) — 띄운 뒤 지운다
  const giftShown = new Set();
  // ❤️ 친구에게 받은 하트 알림
  const heartShown = new Set();
  function showHearts(){
    const g = data.heartNews || {};
    const keys = Object.keys(g).filter(k => !heartShown.has(k)).sort();
    if(!keys.length) return;
    keys.forEach(k => { heartShown.add(k); const x = g[k] || {}; const who = (x.c && x.c !== ident.cls ? x.c.split('-')[1] + '반 ' : '') + (x.f || '친구'); toast(`❤️ ${josa(who, '이', '가')} 하트를 보냈어요!`, `펫 기분 +${PET_RULES.heartFun}`); });
    tx((cur) => {
      if(!cur.heartNews) return;
      let changed = false;
      keys.forEach(k => { if(cur.heartNews[k]){ delete cur.heartNews[k]; changed = true; } });
      return changed ? cur : undefined;
    });
  }
  const nameKey = (n) => String(n).replace(/[.#$\[\]\/]/g, '_');

  function showGifts(){
    const g = data.gifts || {};
    const keys = Object.keys(g).filter(k => !giftShown.has(k)).sort();
    if(!keys.length) return;
    keys.forEach(k => {
      giftShown.add(k);
      const x = g[k] || {}, a = x.a | 0;
      if(a === 0) return;
      if(a > 0) toast(`🎁 선생님이 코인 ${a}개를 주셨어요!`, x.r ? `이유: ${x.r}` : '🏪 상점에서 써 보세요');
      else toast(`🪙 선생님이 코인 ${-a}개를 가져가셨어요`, x.r ? `이유: ${x.r}` : '');
    });
    tx((cur) => {
      if(!cur.gifts) return;
      let changed = false;
      keys.forEach(k => { if(cur.gifts[k]){ delete cur.gifts[k]; changed = true; } });
      return changed ? cur : undefined;
    });
  }

  function checkReady(){
    const info = activeInfo();
    if(!info) return;
    const now = nowMs();
    const c = careNow(data.owned[info.id], now);
    if(evolveReady(c, now) && !readyToasted[info.id + c.stage]){
      readyToasted[info.id + c.stage] = true;
      toast(`✨ ${josa(PET_INFO[info.id].names[c.stage], '이', '가')} 진화할 수 있어요!`, '🐾 펫 키우기에서 진화하기를 눌러 주세요');
    }
  }

  // 지갑·펫 기록 한 번에 고치기 (여러 탭에서 동시에 풀어도 코인이 꼬이지 않게 트랜잭션으로)
  function tx(fn){
    if(!ident) return Promise.resolve(null);
    return runTransaction(ref(db, base()), (cur) => fn(cur || {}, nowMs())).catch(() => null);
  }

  function welcomeIfNeeded(){
    if(data.welcome) return;
    tx((cur) => {
      if(cur.welcome) return;   // undefined → 바꾸지 않음
      cur.welcome = true;
      cur.coins = (cur.coins || 0) + PET_RULES.welcome;
      cur.earned = (cur.earned || 0) + PET_RULES.welcome;
      return cur;
    }).then(res => {
      if(res && res.committed) toast(`🎁 펫 상점 오픈 기념 ${PET_RULES.welcome}코인!`, '🏪 상점에서 첫 펫을 골라 보세요');
    });
  }

  const decoHave = (kind, id) => DECOR[kind][id] && DECOR[kind][id].price === 0 ? Infinity : ((data.deco || {})[kind + '_' + id] | 0);
  function roomHtml(info, now){
    const room = Object.assign({}, DEFAULT_ROOM, data.room || {});
    const cozy = roomCozy(room), coins = data.coins || 0;
    const toy = DECOR.toy[room.toy] || DECOR.toy.none;
    const toyLeft = (data.toyNext || 0) > now ? Math.ceil((data.toyNext - now) / 60000) : 0;
    const busy = info && (info.m === 'sleep' || info.m === 'walk');
    let s = `<div class="pt-sec"><h4>🏠 내 방</h4><div class="pt-mine"><div class="pt-big" data-slot="big"></div><div class="pt-mine-info">
      <div class="pt-mine-name">아늑함 ${cozy}<small>기분이 ${Math.round(Math.min(PET_RULES.cozyMax, cozy * PET_RULES.cozyStep) * 100)}% 천천히 떨어져요${cozy > PET_RULES.cozyHappy ? ' · 펫이 더 쉽게 신나요' : ''}</small></div>
      <div class="pt-bar"><span style="text-align:left">🛋️ 아늑함</span><i><b class="exp" style="width:${Math.min(100, cozy / 18 * 100)}%"></b></i><span>${cozy}</span></div>
      <div class="pt-bar"><span style="text-align:left">❤️ 하트</span><span class="pt-poops">친구에게 받은 하트 ${data.hearts | 0}개</span><span></span></div>
      <div class="pt-acts"><button type="button" class="pt-act gold" data-act="play" ${info && room.toy !== 'none' && !busy && !toyLeft ? '' : 'disabled'}>${room.toy === 'none' ? '🧸 장난감을 끼우면 같이 놀 수 있어요' : toyLeft ? `🧸 같이 놀기 <small>(${toyLeft}분 뒤)</small>` : `🧸 ${josa(toy.name, '으로')} 같이 놀기 <small>(기분 +${toy.fun})</small>`}</button></div>
      <div class="pt-msg">${escapeHtml(msg)}</div>
    </div></div><div class="pt-note">가지고 있는 물건만 보여요. 누르면 바로 끼워지고 코인은 들지 않아요. 새 물건은 🏪 상점 → 🛋️ 꾸미기에서 미리 보고 살 수 있어요. 같은 가구를 양쪽에 두려면 두 개가 필요해요.</div>
      <button type="button" class="pt-act gold" data-goshop="decor">🛋️ 꾸미기 상점 가기</button></div>`;
    Object.keys(SLOT_LABEL).forEach(slot => {
      const kind = SLOT_KIND[slot];
      const other = slot === 'left' ? 'right' : slot === 'right' ? 'left' : null;
      const mine = Object.entries(DECOR[kind]).filter(([id]) => decoHave(kind, id) > 0);
      const bought = mine.some(([, it]) => it.price);
      s += `<div class="pt-sec pt-slot"><h4>${SLOT_LABEL[slot]}</h4><div class="pt-items">` + mine.map(([id, it]) => {
        const on = room[slot] === id;
        const need = (other && id !== 'none' && room[other] === id) ? 2 : 1;
        const have = decoHave(kind, id);
        const can = have >= need;
        const tag = on ? '✓ 끼움' : can ? '끼우기' : '1개뿐 (양쪽엔 2개 필요)';
        return `<button type="button" class="pt-item ${on ? 'on' : ''}" data-place="${slot}:${id}" ${on || !can ? 'disabled' : ''}>${escapeHtml(it.name)} <small>${tag}${it.cozy ? ' · 아늑+' + it.cozy : ''}${have !== Infinity && have > 1 ? ' · ' + have + '개' : ''}</small></button>`;
      }).join('') + (bought ? '' : `<span class="pt-empty">아직 산 물건이 없어요</span>`) + `</div></div>`;
    });
    return s;
  }
  function clsLabel(c){ const [g, n] = String(c).split('-'); return `${g}학년 ${n}반`; }
  // 상점 🛋️ 꾸미기: 위에 '내 방에 끼워 보면' 미리보기, 아래에 물건 목록 (사기를 눌러야만 결제)
  const SHOP_KINDS = [['paper', '🧱 벽지'], ['floor', '🟫 바닥'], ['window', '🪟 창문'], ['wall', '🖼️ 벽 장식'], ['furn', '🪑 가구 (왼쪽·오른쪽 자리, 2개까지)'], ['rug', '🟥 러그'], ['toy', '🧸 장난감']];
  const prevSlot = (kind) => kind === 'furn' ? 'left' : kind;
  function prevRoom(){
    const saved = Object.assign({}, DEFAULT_ROOM, data.room || {});
    if(!shopPrev) return saved;
    return Object.assign({}, saved, { [prevSlot(shopPrev.kind)]: shopPrev.id });
  }
  function decorShopHtml(){
    const coins = data.coins || 0, saved = Object.assign({}, DEFAULT_ROOM, data.room || {});
    const pit = shopPrev && DECOR[shopPrev.kind][shopPrev.id];
    const c0 = roomCozy(saved), c1 = roomCozy(prevRoom());
    let s = `<div class="pt-mine pt-prev"><div class="pt-big" data-slot="shopprev"></div><div class="pt-mine-info">
      <div class="pt-mine-name">${pit ? `👀 ${escapeHtml(pit.name)} 미리보기` : '👀 미리보기'}<small>${pit ? '내 방에 끼우면 이렇게 보여요 · 아직 코인이 나가지 않았어요' : '물건의 미리보기를 누르면 내 방에 끼운 모습이 여기 보여요'}</small></div>
      ${pit ? `<div class="pt-bar"><span style="text-align:left">🛋️ 아늑함</span><span class="pt-poops">${c0} → ${c1}${c1 > c0 ? ' ⬆' : ''}</span><span></span></div>` : ''}
    </div></div>`;
    SHOP_KINDS.forEach(([kind, label]) => {
      s += `<h4 class="pt-sub-h">${label}</h4><div class="pt-goods pt-decor">` + Object.entries(DECOR[kind]).filter(([, it]) => it.price).map(([id, it]) => {
        const have = ((data.deco || {})[kind + '_' + id]) | 0, max = kind === 'furn' ? 2 : 1;
        const full = have >= max, on = shopPrev && shopPrev.kind === kind && shopPrev.id === id;
        return `<div class="pt-good ${on ? 'on' : ''}"><b>${escapeHtml(it.name)}</b><span>아늑함 +${it.cozy}${it.fun ? ` · 같이 놀면 기분 +${it.fun}` : ''}</span><small>가진 개수 ${have}개</small>
          <div class="pt-good-btns"><button type="button" class="pt-act" data-dprev="${kind}:${id}">👀 미리보기</button>
          <button type="button" class="pt-buy" data-buydeco="${kind}:${id}" ${full || coins < it.price ? 'disabled' : ''}>${full ? '✔ 가지고 있어요' : `🪙 ${it.price} 사기`}</button></div></div>`;
      }).join('') + `</div>`;
    });
    return s;
  }
  function friendsHtml(now){
    if(!friendCls) friendCls = ident.cls;
    const grade = ident.cls.split('-')[0];
    const pick = `<div class="pt-tabs pt-cls">${Array.from({ length: 10 }, (_, i) => `${grade}-${i + 1}`).map(c => `<button type="button" class="pt-tab ${friendCls === c ? 'on' : ''}" data-fcls="${c}">${c.split('-')[1]}반${c === ident.cls ? ' (우리 반)' : ''}</button>`).join('')}</div>`;
    if(!friends){ if(!friendsBusy) loadFriends(); return pick + `<div class="pt-sec"><p class="pt-note">${clsLabel(friendCls)} 친구 방을 불러오는 중…</p></div>`; }
    if(friendSel){
      const f = friends.find(x => x.name === friendSel);
      if(f){
        const dk = dayKey(now), hd = f.d.heartDay;
        const gave = !!(hd && hd.k === dk && hd.by && (hd.by[heartKey()] || (f.cls === ident.cls && hd.by[nameKey(ident.name)])));
        const pn = f.info ? PET_INFO[f.info.id].names[f.info.s] : '펫 없음';
        return `<div class="pt-sec"><button type="button" class="pt-act" data-fback="1">← ${clsLabel(f.cls)} 목록</button><h4>🏘️ ${f.cls !== ident.cls ? clsLabel(f.cls) + ' ' : ''}${escapeHtml(f.name)}의 방</h4>
          <div class="pt-mine"><div class="pt-big" data-slot="friend"></div><div class="pt-mine-info">
            <div class="pt-mine-name">${escapeHtml(pn)}<small>${f.info ? MOOD_LABEL[f.info.m] : ''}</small></div>
            <div class="pt-bar"><span style="text-align:left">🛋️ 아늑함</span><i><b class="exp" style="width:${Math.min(100, roomCozy(f.d.room) / 18 * 100)}%"></b></i><span>${roomCozy(f.d.room)}</span></div>
            <div class="pt-bar"><span style="text-align:left">❤️ 하트</span><span class="pt-poops">받은 하트 ${f.d.hearts | 0}개</span><span></span></div>
            <div class="pt-acts"><button type="button" class="pt-act ${gave ? '' : 'warn'}" data-heart="${escapeHtml(f.name)}" ${gave ? 'disabled' : ''}>${gave ? '❤️ 오늘 하트를 줬어요' : `❤️ 하트 주기 <small>(친구 펫 기분 +${PET_RULES.heartFun})</small>`}</button></div>
            <div class="pt-msg">${escapeHtml(msg)}</div>
          </div></div><div class="pt-note">하트는 친구 한 명에게 하루에 한 번 줄 수 있어요. 같은 학년 다른 반 친구에게도 줄 수 있어요.</div></div>`;
      }
    }
    if(!friends.length) return pick + `<div class="pt-sec"><p class="pt-note">아직 ${clsLabel(friendCls)}에는 펫 기록이 있는 친구가 없어요.</p></div>`;
    return pick + `<div class="pt-sec"><h4>🏘️ ${clsLabel(friendCls)}${friendCls === ident.cls ? '(우리 반)' : ''} 친구 방 (${friends.length}명)</h4><div class="pt-note">친구를 누르면 그 친구 방에 놀러 가요</div><div class="pt-friends">${friends.map(f =>
      `<button type="button" class="pt-friend" data-friend="${escapeHtml(f.name)}"><b>${escapeHtml(f.name)}</b><span>${f.info ? escapeHtml(PET_INFO[f.info.id].names[f.info.s]) : '펫 없음'} · 🛋️${roomCozy(f.d.room)} · ❤️${f.d.hearts | 0}</span></button>`).join('')}</div>
      <button type="button" class="pt-act" data-freload="1" style="margin-top:8px">↻ 새로 불러오기</button></div>`;
  }
  // 하트 준 사람 표시 키: 다른 반 동명이인과 겹치지 않게 반까지 넣는다
  const heartKey = () => nameKey(ident.cls + '_' + ident.name);
  function friendEntry(name, d, now, cls){
    const id = d.active && d.owned && d.owned[d.active] && petById[d.active] ? d.active : null;
    let info = null;
    if(id){ const c = careNow(d.owned[id], now, roomCozy(d.room)); info = { id, s: c.stage, m: moodOf(c, now), p: c.poop }; }
    return { name, d, info, cls: cls || friendCls || ident.cls };
  }
  async function loadFriends(){
    if(!ident) return;
    friendsBusy = true;
    const me = ident;
    try{
      const cls = friendCls || me.cls;
      const snap = await get(ref(db, `pets/${cls}`));
      if(me !== ident || cls !== (friendCls || me.cls)) return;
      const now = nowMs();
      friends = Object.entries(snap.val() || {}).filter(([n]) => !(cls === me.cls && n === me.name)).map(([n, d]) => friendEntry(n, d || {}, now, cls)).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }catch(_e){ friends = []; }
    friendsBusy = false;
    render();
  }

  function render(){
    if(!overlay) return;
    overlay.querySelector('.pt-coins').textContent = `🪙 ${(data.coins || 0).toLocaleString()}`;
    const body = overlay.querySelector('.pt-body');
    if(!ident){ body.innerHTML = '<p>학년·반·이름을 먼저 입력해 주세요.</p>'; return; }
    if(!loaded){ body.innerHTML = '<p>불러오는 중…</p>'; return; }
    const keepScroll = body.scrollTop;
    const now = nowMs();
    const owned = data.owned || {};
    const frag = document.createElement('div');
    let h = '';
    const info = activeInfo();
    const showCare = view !== 'shop', showShop = view === 'shop' || (view === 'all' && careTab === 'care');
    overlay.querySelector('.pt-head h3').textContent = VIEW_TITLE[view];
    if(showCare){
      h += `<div class="pt-tabs pt-ctabs">${[['care', '🐾 돌보기'], ['room', '🏠 방 꾸미기'], ['friends', '🏘️ 친구 방']].map(([k, l]) => `<button type="button" class="pt-tab ${careTab === k ? 'on' : ''}" data-ctab="${k}">${l}</button>`).join('')}</div>`;
      if(careTab === 'room') h += roomHtml(info, now);
      if(careTab === 'friends') h += friendsHtml(now);
    }
    if(showCare && careTab === 'care' && info){
      const c = careNow(owned[info.id], now);
      const inf = PET_INFO[info.id];
      const nextNeed = c.stage < 2 ? PET_RULES.evolve[c.stage] : null;
      const ready = evolveReady(c, now);
      const busy = info.m === 'sleep' || info.m === 'walk';
      const items = data.items || {};
      const coins = data.coins || 0;
      const R = PET_RULES;
      const bar = (label, v, cls) => `<div class="pt-bar"><span style="text-align:left">${label}</span><i><b class="${cls || (v < 25 ? 'low' : '')}" style="width:${Math.max(0, Math.min(100, v))}%"></b></i><span>${Math.round(v)}</span></div>`;
      // 용품 버튼: 가진 게 있으면 그걸 쓰고, 없으면 그 자리에서 사서 준다
      const itemBtn = (k, off, cls) => {
        const it = R.items[k], have = items[k] | 0;
        const can = !off && (have > 0 || coins >= it.price);
        return `<button type="button" class="pt-act ${cls || ''}" data-act="${k}" ${can ? '' : 'disabled'}>${it.label} ${have > 0 ? `<small>(${have}개)</small>` : `<small>(🪙${it.price})</small>`}</button>`;
      };
      const walkLeft = c.walkNext > now ? Math.ceil((c.walkNext - now) / 60000) : 0;
      const status = info.m === 'walk' ? `🦮 산책 중… ${Math.max(0, Math.ceil((c.walkUntil - now) / 1000))}초 뒤 돌아와요`
        : info.m === 'sleep' ? `💤 쿨쿨 자는 중… ${Math.max(1, Math.ceil((c.sleepUntil - now) / 60000))}분 뒤 일어나요`
        : c.sick ? `🤒 아파요! 💊 약을 먹여 주세요${c.poop >= R.sickPoop ? ' (먼저 🧹 똥을 치워야 해요)' : c.food <= 0 ? ' (먼저 🍙 밥을 줘야 해요)' : ''} · 아픈 동안은 경험치가 오르지 않아요`
        : c.food <= 0 ? '🍙 배가 너무 고파요! 밥을 주세요'
        : c.poop >= 2 ? `💩 똥이 ${c.poop}개 쌓였어요! ${R.sickPoop}개가 되면 아파요`
        : c.food < 25 ? '🍙 배고파요! 밥을 주세요'
        : c.energy < 20 ? '😪 지쳤어요. 재워 주세요'
        : c.fun < 25 ? '😞 심심해요. 산책을 가거나 같이 문제를 풀어요' : '';
      const hint = c.stage < 2 && !ready ? (c.exp >= (nextNeed || 0) && c.stage === 1 ? '😊 신남 상태가 되면 진화할 수 있어요 (배부름·기분·체력 60 이상, 똥 없음, 안 아픔)' : `데려가서 문제를 ${nextNeed - c.exp}개 더 맞히면 진화할 수 있어요`) : '';
      h += `<div class="pt-sec"><h4>🐾 데려가는 펫</h4><div class="pt-mine"><div class="pt-big" data-slot="big"></div><div class="pt-mine-info">
        <div class="pt-mine-name">${escapeHtml(inf.names[c.stage])}<small>${c.stage + 1}단계 · ${MOOD_LABEL[info.m]}</small></div>
        ${bar('🍙 배부름', c.food)}${bar('😊 기분', c.fun)}${bar('⚡ 체력', c.energy)}
        <div class="pt-bar"><span style="text-align:left">💩 똥</span><span class="pt-poops">${c.poop ? '💩'.repeat(c.poop) : '깨끗해요 ✨'}</span><span></span></div>
        ${nextNeed ? `<div class="pt-bar"><span style="text-align:left">✨ 경험치</span><i><b class="exp" style="width:${Math.min(100, c.exp / nextNeed * 100)}%"></b></i><span>${Math.min(c.exp, nextNeed)}/${nextNeed}</span></div>` : `<div class="pt-note">✨ 다 자랐어요! (맞힌 문제 ${c.exp}개)</div>`}
        ${status ? `<div class="pt-status ${c.sick || c.food <= 0 ? 'bad' : ''}">${escapeHtml(status)}</div>` : ''}
        <div class="pt-acts">
          ${itemBtn('rice', c.food >= 95 || busy, 'gold')}
          ${itemBtn('snack', c.fun >= 100 || busy, 'gold')}
          <button type="button" class="pt-act" data-act="clean" ${c.poop && info.m !== 'walk' ? '' : 'disabled'}>🧹 똥 치우기</button>
          ${itemBtn('med', !c.sick || busy, c.sick ? 'warn' : '')}
          <button type="button" class="pt-act" data-act="walk" ${!busy && !c.sick && !walkLeft && c.energy >= 15 ? '' : 'disabled'}>${walkLeft ? `🦮 산책 <small>(${walkLeft}분 뒤)</small>` : '🦮 산책 가기'}</button>
          <button type="button" class="pt-act" data-act="sleep" ${busy || c.energy >= 95 ? 'disabled' : ''}>💤 재우기</button>
          ${c.stage < 2 ? `<button type="button" class="pt-act go" data-act="evolve" ${ready ? '' : 'disabled'}>✨ 진화하기</button>` : ''}
        </div>
        <div class="pt-msg">${escapeHtml(msg || hint)}</div>
      </div></div>
      <div class="pt-note">데려간 펫과 함께 문제를 맞히면 경험치와 기분이 올라요 · 배부름·기분은 1시간에 1씩 줄어요 · ${R.poopEveryMs / 3600000}시간마다, 그리고 밥을 먹으면 똥을 싸요 · 똥이 ${R.sickPoop}개 쌓이거나 배부름이 0이 되면 아파요 · 산책은 ${R.walkCooldownMs / 60000}분에 한 번 (가끔 동전을 주워요) · 재우면 ${R.sleepMs / 60000}분 뒤 체력이 가득 차요</div></div>`;
    } else if(showCare && careTab === 'care'){
      h += `<div class="pt-sec"><h4>🐾 데려가는 펫</h4><div class="pt-note">아직 펫이 없어요. ${showShop ? '아래 상점에서' : '상점에서'} 골라 보세요! 펫이 생기면 수업 게임 전광판과 혼자 연습 화면에 내 캐릭터로 나와요.</div>${showShop ? '' : '<button type="button" class="pt-act gold" data-view="shop">🏪 상점으로 가기</button>'}</div>`;
    }
    const ownIds = showCare && careTab === 'care' ? PET_ORDER.filter(id => owned[id]) : [];
    if(ownIds.length){
      h += `<div class="pt-sec"><h4>📦 내가 가진 펫 (${ownIds.length})</h4><div class="pt-note">누르면 그 펫을 데려가요</div><div class="pt-owned">${ownIds.map(id => {
        const c = careNow(owned[id], now);
        return `<button type="button" class="pt-own ${data.active === id ? 'on' : ''}" data-own="${id}"><span data-slot="own-${id}"></span>${escapeHtml(PET_INFO[id].names[c.stage])}</button>`;
      }).join('')}</div></div>`;
    }
    if(view === 'care' && careTab === 'care' && info) h += `<div class="pt-sec"><button type="button" class="pt-act" data-view="shop">🏪 상점에서 새 펫 보기</button></div>`;
    if(view === 'shop' && info) h += `<div class="pt-sec"><div class="pt-note">지금 데려가는 펫: <b>${escapeHtml(PET_INFO[info.id].names[info.s])}</b> · 밥 주기·진화는 🐾 펫 키우기에서 해요 <button type="button" class="pt-act" data-view="care">🐾 펫 키우기로 가기</button></div></div>`;
    if(showShop){
    h += `<div class="pt-sec"><h4>${view === 'shop' ? '🛒 펫 고르기' : '🏪 상점'}</h4><div class="pt-note">🪙 코인 모으기: 혼자 연습·수업 게임 정답 1개 = 1코인 + 1·2·3등 보너스 ${PET_RULES.classBonus.join('·')}코인 · 한국사·세계사 코인은 하나로 합쳐져요</div>
      <h4 class="pt-sub-h">🧺 용품 <small>펫 키우기에서 없으면 바로 사서 줄 수도 있어요</small></h4>
      <div class="pt-goods">${Object.entries(PET_RULES.items).map(([k, it]) => `<div class="pt-good"><b>${it.label}</b><span>${k === 'rice' ? `배부름 +${it.food} (먹으면 똥 하나)` : k === 'snack' ? `배부름 +${it.food} · 기분 +${it.fun}` : '아플 때 먹이면 나아요'}</span><small>가진 개수 ${((data.items || {})[k] | 0)}개</small><button type="button" class="pt-buy" data-buyitem="${k}" ${(data.coins || 0) >= it.price ? '' : 'disabled'}>🪙 ${it.price}코인에 사기</button></div>`).join('')}</div>
      <h4 class="pt-sub-h">🐾 펫 · 🛋️ 꾸미기</h4>
      <div class="pt-tabs"><button type="button" class="pt-tab ${shopTab === 'normal' ? 'on' : ''}" data-tab="normal">일반 펫</button><button type="button" class="pt-tab ${shopTab === 'rare' ? 'on' : ''}" data-tab="rare">✦ 희귀 펫</button><button type="button" class="pt-tab ${shopTab === 'decor' ? 'on' : ''}" data-tab="decor">🛋️ 꾸미기</button></div>
      ${shopTab === 'decor' ? decorShopHtml() : ''}
      <div class="pt-shop">`;
    PET_ORDER.filter(id => shopTab !== 'decor' && !!PET_INFO[id].rare === (shopTab === 'rare')).forEach(id => {
      const inf = PET_INFO[id];
      const have = !!owned[id];
      let lockHtml = '', canBuy = !have && (data.coins || 0) >= inf.price;
      if(inf.rare){
        const pr = ext ? rareProgress(id, data, ext) : null;
        if(!pr){ lockHtml = `<div class="pt-lock">🔒 ${escapeHtml(inf.unlock)} · 확인 중…</div>`; canBuy = false; }
        else {
          lockHtml = `<div class="pt-lock ${pr.ok ? 'ok' : ''}">${pr.ok ? '🔓' : '🔒'} ${escapeHtml(inf.unlock)} · ${escapeHtml(pr.text)}</div>`;
          if(!pr.ok) canBuy = false;
        }
      }
      const btnText = have ? '✔ 가지고 있어요' : (inf.rare && !(ext && rareProgress(id, data, ext).ok)) ? '🔒 조건을 채우면 열려요' : (data.coins || 0) < inf.price ? `🪙 ${(inf.price - (data.coins || 0)).toLocaleString()}코인 더 필요해요` : `🪙 ${inf.price.toLocaleString()}코인에 사기`;
      h += `<div class="pt-card ${inf.rare ? 'rare' : ''}"><div class="pt-card-top"><b>${escapeHtml(inf.name)}</b>${inf.rare ? '<span class="pt-rare">희귀</span>' : ''}<span class="pt-price">🪙 ${inf.price.toLocaleString()}</span></div>
        <div class="pt-evo" data-slot="evo-${id}"></div>
        <div class="pt-lore">${escapeHtml(inf.lore)}</div>${lockHtml}
        <button type="button" class="pt-buy" data-buy="${id}" ${canBuy ? '' : 'disabled'}>${btnText}</button></div>`;
    });
    h += `</div>${shopTab === 'decor' ? '' : '<div class="pt-note" style="margin-top:8px">진화 전 모습은 상점에서도 볼 수 있어요. 3단계 모습은 펫을 키워서 확인해 보세요!</div>'}</div>`;
    }
    frag.innerHTML = h;
    // 캔버스 끼우기
    {
      const slot = frag.querySelector('[data-slot="big"]');
      if(slot){
        if(!sceneCv) sceneCv = sceneCanvas({});
        Object.assign(sceneCv._scene, info ? { id: info.id, s: info.s, m: info.m, poop: info.p } : { id: null }, { room: data.room, playUntil: data.playUntil || 0 });
        slot.appendChild(sceneCv);
      }
      const pslot = frag.querySelector('[data-slot="shopprev"]');
      if(pslot){
        if(!prevCv) prevCv = sceneCanvas({});
        Object.assign(prevCv._scene, info ? { id: info.id, s: info.s, m: info.m === 'walk' || info.m === 'sleep' ? 'normal' : info.m, poop: 0 } : { id: null }, { room: prevRoom(), playUntil: 0 });
        pslot.appendChild(prevCv);
      }
      const fslot = frag.querySelector('[data-slot="friend"]');   // 친구 방
      if(fslot && friendSel && friends){
        const f = friends.find(x => x.name === friendSel);
        if(f){
          if(!friendCv || friendCv._who !== f.name){ friendCv = sceneCanvas({}); friendCv._who = f.name; }
          Object.assign(friendCv._scene, f.info ? { id: f.info.id, s: f.info.s, m: f.info.m, poop: f.info.p } : { id: null }, { room: f.d.room, playUntil: f.d.playUntil || 0 });
          fslot.appendChild(friendCv);
        }
      }
    }
    ownIds.forEach(id => {
      const slot = frag.querySelector(`[data-slot="own-${id}"]`);
      if(slot) slot.replaceWith(staticCanvas(id, careNow(owned[id], now).stage, 48));
    });
    PET_ORDER.forEach(id => {
      const slot = frag.querySelector(`[data-slot="evo-${id}"]`);
      if(!slot) return;
      const stageHave = owned[id] ? careNow(owned[id], now).stage : -1;
      [0, 1, 2].forEach(si => {
        const cv = staticCanvas(id, si, 48);
        if(si === 2 && stageHave < 2) cv.classList.add('lk');   // 다 자란 모습은 키워야 보인다 (실루엣만)
        slot.appendChild(cv);
      });
    });
    body.innerHTML = '';
    while(frag.firstChild) body.appendChild(frag.firstChild);
    body.scrollTop = keepScroll;
  }

  async function loadExt(){
    if(!ident) return;
    const me = ident;
    const rooms = ['world', 'korea'];
    const parts = ['seen', 'days', 'hist/days', 'log'];
    try{
      const snaps = await Promise.all(rooms.flatMap(r => parts.map(p => get(ref(db, `titles/${r}/${me.cls}/${me.name}/${p}`)))));
      if(me !== ident) return;
      const out = {};
      rooms.forEach((r, i) => {
        const v = (k) => snaps[i * parts.length + k].val() || {};
        out[r] = { seen: v(0), days: v(1), histDays: v(2), log: v(3) };
      });
      ext = out;
    }catch(_e){ ext = { world: {}, korea: {} }; }
    render();
  }

  function setMsg(t){ msg = t; render(); clearTimeout(setMsg._t); setMsg._t = setTimeout(() => { msg = ''; render(); }, 3500); }

  async function act(kind, id){
    if(!ident) return;
    if(kind === 'buy'){
      const inf = PET_INFO[id];
      if(inf.rare && !(ext && rareProgress(id, data, ext).ok)) return;
      const res = await tx((cur, now) => {
        cur.owned = cur.owned || {};
        if(cur.owned[id] || (cur.coins || 0) < inf.price) return;
        cur.coins -= inf.price;
        cur.owned[id] = storeCare({ stage: 0, exp: 0, food: 80, fun: 80, energy: 100, sleepUntil: 0, at: now }, now);
        if(!cur.active || !cur.owned[cur.active]) cur.active = id;
        return cur;
      });
      if(res && res.committed){ toast(`🎉 ${josa(inf.names[0], '이', '가')} 생겼어요!`, data.active === id ? '지금부터 게임에 함께 나가요 · 🐾 펫 키우기에서 돌봐 주세요' : '🐾 펫 키우기의 내가 가진 펫에서 누르면 데려가요'); }
      return;
    }
    if(kind === 'own'){
      await tx((cur) => { if(!cur.owned || !cur.owned[id]) return; cur.active = id; return cur; });
      return;
    }
    if(kind === 'buyitem'){
      const it = PET_RULES.items[id];
      const res = await tx((cur) => {
        if((cur.coins || 0) < it.price) return;
        cur.coins -= it.price;
        cur.items = cur.items || {};
        cur.items[id] = (cur.items[id] | 0) + 1;
        return cur;
      });
      if(res && res.committed) toast(`${it.label} 1개를 샀어요!`, '🐾 펫 키우기에서 줄 수 있어요');
      return;
    }
    if(kind === 'place'){
      const [slot, did] = id.split(':');
      const dk = SLOT_KIND[slot], it = DECOR[dk] && DECOR[dk][did];
      if(!it) return;
      const res = await tx((cur) => {
        const room = Object.assign({}, DEFAULT_ROOM, cur.room || {});
        if(room[slot] === did) return;
        const other = slot === 'left' ? 'right' : slot === 'right' ? 'left' : null;
        const need = (other && did !== 'none' && room[other] === did) ? 2 : 1;
        const have = it.price === 0 ? Infinity : (((cur.deco || {})[dk + '_' + did]) | 0);
        if(have < need) return;                       // 산 물건만 끼울 수 있다 (여기서는 절대 결제하지 않음)
        room[slot] = did;
        cur.room = room;
        return cur;
      });
      if(res && res.committed) setMsg(did === 'none' ? `${SLOT_LABEL[slot]} 자리를 비웠어요` : `${josa(it.name, '을', '를')} 끼웠어요`);
      return;
    }
    if(kind === 'buydeco'){
      const [dk, did] = id.split(':');
      const it = DECOR[dk] && DECOR[dk][did];
      if(!it || !it.price) return;
      const res = await tx((cur) => {
        cur.deco = cur.deco || {};
        const key = dk + '_' + did, have = cur.deco[key] | 0;
        if(have >= (dk === 'furn' ? 2 : 1) || (cur.coins || 0) < it.price) return;
        cur.coins -= it.price;
        cur.deco[key] = have + 1;
        return cur;
      });
      if(res && res.committed) toast(`🛋️ ${josa(it.name, '을', '를')} 샀어요!`, '🐾 펫 키우기 → 🏠 방 꾸미기에서 끼워 보세요');
      return;
    }
    if(kind === 'heart'){
      const fname = id, me = ident;
      const fe = friends && friends.find(x => x.name === fname);
      const fcls = (fe && fe.cls) || me.cls;
      let fresh = null;
      const res = await runTransaction(ref(db, `pets/${fcls}/${fname}`), (cur) => {
        if(!cur) return null;   // 아직 서버 값을 못 받았으면 null로 시도 → 서버가 다른 값이면 진짜 값으로 다시 불림
        const now = nowMs(), dk = dayKey(now), mk = nameKey(me.cls + '_' + me.name);
        cur.heartDay = (cur.heartDay && cur.heartDay.k === dk) ? cur.heartDay : { k: dk, by: {} };
        cur.heartDay.by = cur.heartDay.by || {};
        if(cur.heartDay.by[mk]) return;
        cur.heartDay.by[mk] = true;
        cur.hearts = (cur.hearts | 0) + 1;
        const p = cur.active && cur.owned && cur.owned[cur.active];
        if(p){ const c = careNow(p, now, roomCozy(cur.room)); c.fun = clamp(c.fun + PET_RULES.heartFun); cur.owned[cur.active] = storeCare(c, now); }
        cur.heartNews = cur.heartNews || {};
        cur.heartNews['h' + now.toString(36) + Math.random().toString(36).slice(2, 5)] = { f: me.name, c: me.cls, at: now };
        return cur;
      }).catch(() => null);
      if(res && res.committed){
        fresh = res.snapshot.val() || {};
        if(friends){ const i = friends.findIndex(x => x.name === fname); if(i >= 0) friends[i] = friendEntry(fname, fresh, nowMs(), fcls); }
        setMsg(`❤️ ${fname}에게 하트를 보냈어요!`);
      } else setMsg('오늘은 이미 하트를 줬어요');
      return;
    }
    const aid = data.active;
    if(!aid) return;
    if(kind === 'play'){
      let fun = 0;
      const res = await tx((cur, now) => {
        const p = cur.owned && cur.owned[cur.active];
        const room = Object.assign({}, DEFAULT_ROOM, cur.room || {});
        const toy = DECOR.toy[room.toy];
        if(!p || !toy || room.toy === 'none' || (cur.toyNext || 0) > now) return;
        const c = careNow(p, now, roomCozy(room)), m = moodOf(c, now);
        if(m === 'sleep' || m === 'walk') return;
        fun = toy.fun;
        c.fun = clamp(c.fun + toy.fun);
        cur.owned[cur.active] = storeCare(c, now);
        cur.toyNext = now + PET_RULES.toyCooldownMs;
        cur.playUntil = now + PET_RULES.toyPlayMs;
        return cur;
      });
      if(res && res.committed) setMsg(`🧸 신나게 놀았어요! 기분 +${fun}`);
      return;
    }
    if(kind === 'rice' || kind === 'snack' || kind === 'med'){
      const it = PET_RULES.items[kind];
      let why = '';
      const res = await tx((cur, now) => {
        why = '';
        const p = cur.owned && cur.owned[aid];
        if(!p) return;
        const c = careNow(p, now), m = moodOf(c, now);
        if(m === 'sleep' || m === 'walk') return;
        if(kind === 'rice' && c.food >= 95) return;
        if(kind === 'snack' && c.fun >= 100) return;
        if(kind === 'med'){
          if(!c.sick) return;
          if(c.poop >= PET_RULES.sickPoop){ why = '🧹 똥부터 치워 주세요! 똥이 그대로면 약을 먹어도 다시 아파요'; return; }
          if(c.food <= 0){ why = '🍙 밥부터 주세요! 굶으면 약을 먹어도 다시 아파요'; return; }
        }
        cur.items = cur.items || {};
        if((cur.items[kind] | 0) > 0) cur.items[kind] -= 1;
        else { if((cur.coins || 0) < it.price) return; cur.coins -= it.price; }
        if(it.food) c.food = clamp(c.food + it.food);
        if(it.fun) c.fun = clamp(c.fun + it.fun);
        if(kind === 'rice') c.poop = Math.min(PET_RULES.poopMax, c.poop + 1);
        if(kind === 'med'){ c.sick = false; c.fun = clamp(c.fun + 10); }
        cur.owned[aid] = storeCare(c, now);
        return cur;
      });
      if(res && res.committed) setMsg(kind === 'rice' ? '🍙 냠냠! 배부름이 올랐어요 · 먹었더니 똥을 쌌어요 💩' : kind === 'snack' ? '🍪 맛있다! 기분이 올랐어요' : '💊 약을 먹고 다 나았어요!');
      else if(why) setMsg(why);
    } else if(kind === 'clean'){
      const res = await tx((cur, now) => {
        const p = cur.owned && cur.owned[aid];
        if(!p) return;
        const c = careNow(p, now);
        if(!c.poop || moodOf(c, now) === 'walk') return;
        c.poop = 0; c.poopT = now; c.fun = clamp(c.fun + 3);
        cur.owned[aid] = storeCare(c, now);
        return cur;
      });
      if(res && res.committed) setMsg('🧹 싹싹! 깨끗해졌어요 ✨');
    } else if(kind === 'walk'){
      let found = 0;
      const res = await tx((cur, now) => {
        const p = cur.owned && cur.owned[aid];
        if(!p) return;
        const c = careNow(p, now), m = moodOf(c, now);
        if(m === 'sleep' || m === 'walk' || c.sick || c.walkNext > now || c.energy < 15) return;
        found = Math.random() < PET_RULES.walkCoinChance ? 1 + Math.floor(Math.random() * PET_RULES.walkCoinMax) : 0;
        c.walkUntil = now + PET_RULES.walkMs;
        c.walkNext = now + PET_RULES.walkCooldownMs;
        c.fun = clamp(c.fun + PET_RULES.walkFun);
        c.energy = clamp(c.energy - PET_RULES.walkEnergy);
        c.food = clamp(c.food - PET_RULES.walkFood);
        cur.owned[aid] = storeCare(c, now);
        cur.coins = (cur.coins || 0) + found;
        cur.earned = (cur.earned || 0) + found;
        return cur;
      });
      if(res && res.committed){
        setMsg('🦮 산책 출발! 기분이 좋아져요');
        if(found) setTimeout(() => toast(`🪙 산책하다가 동전 ${found}개를 주웠어요!`), PET_RULES.walkMs / 2);
      }
    } else if(kind === 'sleep'){
      const res = await tx((cur, now) => {
        const p = cur.owned && cur.owned[aid];
        if(!p) return;
        const c = careNow(p, now);
        const m = moodOf(c, now);
        if(m === 'sleep' || m === 'walk') return;
        c.sleepUntil = now + PET_RULES.sleepMs;
        cur.owned[aid] = storeCare(c, now);
        return cur;
      });
      if(res && res.committed) setMsg(`💤 쿨쿨… ${PET_RULES.sleepMs / 60000}분 뒤 체력이 가득 차요`);
    } else if(kind === 'evolve'){
      const res = await tx((cur, now) => {
        const p = cur.owned && cur.owned[aid];
        if(!p) return;
        const c = careNow(p, now);
        if(!evolveReady(c, now)) return;
        c.stage += 1;
        cur.owned[aid] = storeCare(c, now);
        return cur;
      });
      if(res && res.committed){
        const c = careNow(res.snapshot.val().owned[aid], nowMs());
        toast(`✨ 진화! ${PET_INFO[aid].names[c.stage]}`, '게임 화면의 내 캐릭터도 바뀌어요');
      }
    }
  }

  function open(v){
    view = (v === 'shop' || v === 'care') ? v : 'all';
    careTab = 'care';
    if(overlay){ render(); return; }
    overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    overlay.innerHTML = `<div class="pt-panel" role="dialog" aria-label="내 펫과 상점"><div class="pt-head"><h3>🐾 내 펫 · 상점</h3><span class="pt-coins"></span><button type="button" class="pt-close">닫기 ✕</button></div><div class="pt-body"></div></div>`;
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay || e.target.closest('.pt-close')){ close(); return; }
      const b = e.target.closest('button');
      if(!b || b.disabled) return;
      if(b.dataset.tab){ shopTab = b.dataset.tab; shopPrev = null; render(); return; }
      if(b.dataset.view){ careTab = 'care'; view = b.dataset.view; overlay.querySelector('.pt-body').scrollTop = 0; render(); updateButtons(); return; }
      if(b.dataset.buy){ act('buy', b.dataset.buy); return; }
      if(b.dataset.buyitem){ act('buyitem', b.dataset.buyitem); return; }
      if(b.dataset.ctab){ careTab = b.dataset.ctab; friendSel = null; msg = ''; if(careTab === 'friends') friends = null; overlay.querySelector('.pt-body').scrollTop = 0; render(); return; }
      if(b.dataset.place){ act('place', b.dataset.place); return; }
      if(b.dataset.buydeco){ act('buydeco', b.dataset.buydeco); return; }
      if(b.dataset.dprev){ const [k, i] = b.dataset.dprev.split(':'); shopPrev = { kind: k, id: i }; render(); const pv = overlay.querySelector('.pt-prev'); if(pv && pv.scrollIntoView) pv.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      if(b.dataset.goshop){ view = 'shop'; shopTab = b.dataset.goshop; careTab = 'care'; shopPrev = null; overlay.querySelector('.pt-body').scrollTop = 0; render(); updateButtons(); return; }
      if(b.dataset.friend){ friendSel = b.dataset.friend; msg = ''; overlay.querySelector('.pt-body').scrollTop = 0; render(); return; }
      if(b.dataset.fback){ friendSel = null; msg = ''; render(); return; }
      if(b.dataset.freload){ friends = null; render(); return; }
      if(b.dataset.fcls){ friendCls = b.dataset.fcls; friends = null; friendSel = null; msg = ''; render(); return; }
      if(b.dataset.heart){ act('heart', b.dataset.heart); return; }
      if(b.dataset.own){ act('own', b.dataset.own); return; }
      if(b.dataset.act){ act(b.dataset.act); }
    });
    document.body.appendChild(overlay);
    ext = null;
    render();
    loadExt();
    clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      if(!overlay) return;
      const i = activeInfo();
      const m = i ? i.m : null;
      if(m === 'walk' || m === 'sleep' || m !== lastMood){ render(); sync(); }
      lastMood = m;
    }, 1000);
  }
  function close(){ clearInterval(tickTimer); tickTimer = null; sceneCv = null; friendCv = null; friendSel = null; friends = null; friendCls = null; shopPrev = null; prevCv = null; if(overlay){ overlay.remove(); overlay = null; } }
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && overlay) close(); });

  const api = {
    setIdentity(cls, name){
      name = String(name || '').trim().slice(0, 20);
      if(ident && cls && name && ident.cls === String(cls) && ident.name === name) return;
      if(unsub){ unsub(); unsub = null; }
      data = {}; loaded = false; lastSig = null; ext = null; readyToasted = {};
      ident = (cls && name) ? { cls: String(cls), name } : null;
      updateButtons();
      sync(true);
      if(!ident){ if(overlay) render(); return; }
      let first = true;
      unsub = onValue(ref(db, base()), (snap) => {
        data = snap.val() || {};
        loaded = true;
        if(first){ first = false; welcomeIfNeeded(); }
        CUR_COZY = roomCozy(data.room);
        showGifts();
        showHearts();
        sync();
        updateButtons();
        checkReady();
        if(overlay) render();
      }, () => { loaded = true; updateButtons(); if(overlay) render(); });
      if(overlay) render();
    },
    // 문제를 풀 때마다: 맞히면 코인 +1 (상한 없음), 데려간 펫 경험치·기분 +, 체력 -
    recordAnswer(correct){
      if(!ident || !correct) return;
      tx((cur, now) => {
        const dk = dayKey(now);
        const day = (cur.day && cur.day.k === dk) ? cur.day : { k: dk, c: 0 };
        day.c = (day.c || 0) + 1;
        cur.maxDay = Math.max(cur.maxDay || 0, day.c);
        cur.coins = (cur.coins || 0) + 1;
        cur.earned = (cur.earned || 0) + 1;
        cur.day = day;
        const p = cur.active && cur.owned && cur.owned[cur.active];
        if(p){
          const c = careNow(p, now);
          if(c.food > 0 && !c.sick) c.exp += 1;   // 배고프거나 아프면 경험치가 오르지 않음
          c.fun = clamp(c.fun + PET_RULES.funPerCorrect);
          c.energy = clamp(c.energy - PET_RULES.energyPerCorrect);
          cur.owned[cur.active] = storeCare(c, now);
        }
        return cur;
      });
      avatars.forEach(a => {
        if(!a.cv) return;
        const pop = document.createElement('span');
        pop.className = 'pt-coinpop';
        pop.textContent = '+1🪙';
        const host = a.el;
        if(getComputedStyle(host).position === 'static') host.style.position = 'relative';
        pop.style.left = '70%'; pop.style.top = '-6px';
        host.appendChild(pop);
        setTimeout(() => pop.remove(), 950);
      });
    },
    // 수업 게임이 끝났을 때 등수 보너스 (같은 라운드는 한 번만)
    classBonus(token, rank, teamMode){
      if(!ident || !token || !rank) return;
      const amt = teamMode ? (rank === 1 ? PET_RULES.teamBonus : 0) : (PET_RULES.classBonus[rank - 1] || 0);
      if(!amt) return;
      const key = String(token).replace(/[.#$\/\[\]]/g, '_');
      tx((cur) => {
        cur.bonus = cur.bonus || {};
        if(cur.bonus[key]) return;
        cur.bonus[key] = amt;
        cur.coins = (cur.coins || 0) + amt;
        cur.earned = (cur.earned || 0) + amt;
        return cur;
      }).then(res => {
        if(res && res.committed) toast(`🪙 ${teamMode ? '1등 팀' : rank + '등'} 보너스 +${amt}코인!`);
      });
    },
    // 혼자 연습 탑 오르기 층수 (불사조 해금 조건)
    noteSoloFloor(floor){
      if(!ident || !loaded || !(floor > (data.soloBest || 0))) return;
      tx((cur) => { if((cur.soloBest || 0) >= floor) return; cur.soloBest = floor; return cur; });
    },
    // 정답·오답 몸짓 (게임 화면 캐릭터)
    react(correct){ avatars.forEach(a => jumpPetCanvas(a.cv, correct)); },
    hasPet(){ return !!activeInfo(); },
    petInfo: activeInfo,
    syncPet: () => sync(true),
    // 게임 화면의 캐릭터 자리 (원래 이모지가 들어 있던 요소) — 펫이 있으면 펫 그림으로 바뀐다
    bindAvatar(el){
      if(!el || [...avatars].some(a => a.el === el)) return;
      const a = { el, cv: null };
      avatars.add(a);
      renderAvatar(a, activeInfo());
    },
    open,
    // v: 'all'(기본, 게임 화면) · 'shop' 상점만 · 'care' 펫 키우기만 (학생 첫 화면은 둘을 따로 둔다)
    bindButton(btn, beforeOpen, v){
      if(!btn) return;
      btn.setAttribute('data-pt-open', v || 'all');
      btn.classList.add('pt-open-btn');
      btn.onclick = () => { if(beforeOpen && beforeOpen() === false) return; open(v); };
      updateButtons();
    }
  };
  return api;
}
