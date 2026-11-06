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
//   owned/<펫id>: {stage, exp, food, fun, energy, t, sleepUntil, at}
//       stage 0·1·2 진화 단계 · exp 데려가서 맞힌 문제 수 · food/fun/energy 0~100 (t 시각 기준 값, 시간이 지나면 줄어듦)

// ── 규칙 숫자 ─────────────────────────────────────────
export const PET_RULES = {
  welcome: 200,          // 처음 받는 축하 코인 (한 번만)
  classBonus: [10, 6, 3],// 수업 게임 개인전 1·2·3등 보너스
  teamBonus: 5,          // 수업 게임 팀전 1등 팀 보너스
  feedCost: 10,          // 밥 한 번 값
  feedAmount: 30,        // 밥 한 번에 차는 배부름
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
  drop:  ['...b...', '..bbb..', '.bbbbb.', '.bbbbb.', '..bbb..', '.......']
};
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
const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const actors = new Set();
let loopOn = false;
function loop(t){
  actors.forEach(a => {
    if(!a.cv.isConnected){ if(a.seen) actors.delete(a); return; }
    a.seen = true;
    a.ctx.clearRect(0, 0, a.cv.width, a.cv.height);
    a.draw(a.ctx, t);
  });
  if(actors.size && !reduceMotion) requestAnimationFrame(loop); else loopOn = false;
}
function addActor(cv, draw){
  const a = { cv, ctx: cv.getContext('2d'), draw, seen: false };
  actors.add(a);
  if(reduceMotion){ a.draw(a.ctx, 0); return a; }
  if(!loopOn){ loopOn = true; requestAnimationFrame(loop); }
  return a;
}
// info: {id, s(단계), m(기분)} → 20×20 캔버스. 몸짓은 기분에 따라 다르다.
export function petCanvas(info, px){
  const cv = document.createElement('canvas');
  cv.width = 20; cv.height = 20;
  cv.className = 'pt-cv';
  if(px) { cv.style.width = px + 'px'; cv.style.height = px + 'px'; }
  const phase = Math.random() * 10;
  cv._pet = { id: info.id, s: info.s | 0, m: info.m || 'normal', jumpAt: -1e9 };
  addActor(cv, (ctx, t) => {
    const st = cv._pet;
    if(!petById[st.id]) return;
    const m = st.m;
    const dt = t - st.jumpAt;
    let oy = 3, ox = 2, closed = false, sad = false;
    if(dt >= 0 && dt < 550) oy = 3 - Math.round(Math.sin(dt / 550 * Math.PI) * 3);
    else if(m === 'sleep'){ closed = true; oy = 3 + ((t / 900) % 2 < 1 ? 0 : 1); }
    else if(m === 'happy'){ oy = 3 - (Math.abs(Math.sin(t / 260 + phase)) > .75 ? 1 : 0); }
    else if(m === 'hungry' || m === 'sad'){ sad = true; ox = 2 + (Math.sin(t / 1100 + phase) > 0 ? 1 : 0); oy = 4; }
    else if(m === 'tired'){ closed = (t / 1000 + phase) % 2.2 < 0.9; oy = 4; }
    else { oy = 3 + (Math.sin(t / 420 + phase) > 0 ? 0 : 1); }
    if(!closed && m !== 'sleep' && ((t / 1000 + phase) % 3.3) < 0.13) closed = true;
    if(st.sadUntil && t < st.sadUntil) sad = true;
    drawPet(ctx, st.id, st.s, ox, oy, { closed, sad });
    const blinkOn = (t / 700 + phase) % 2 < 1.3;
    if(m === 'happy' && blinkOn && !(dt >= 0 && dt < 550)) drawIcon(ctx, 'heart', 13, 0);
    else if(m === 'hungry' && blinkOn) drawIcon(ctx, 'rice', 13, 0, { k: '#3f7d52' });
    else if(m === 'sleep' && blinkOn) drawIcon(ctx, 'zz', 13, 0, { k: '#5b6b8c' });
    else if(m === 'tired' && blinkOn) drawIcon(ctx, 'drop', 14, 1, { b: '#7cc3ff' });
  });
  return cv;
}
export function updatePetCanvas(cv, info){
  if(!cv || !cv._pet) return;
  cv._pet.id = info.id; cv._pet.s = info.s | 0; cv._pet.m = info.m || 'normal';
}
function jumpPetCanvas(cv, correct){
  if(!cv || !cv._pet) return;
  const now = performance.now();
  if(correct) cv._pet.jumpAt = now; else cv._pet.sadUntil = now + 900;
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
export function careNow(p, now){
  p = p || {};
  const h = Math.max(0, (now - (p.t || now)) / 3600000);
  let sleepUntil = p.sleepUntil || 0;
  let energy = clamp((p.energy == null ? 100 : p.energy) + h * PET_RULES.energyRegen);
  if(sleepUntil && now >= sleepUntil){ energy = 100; sleepUntil = 0; }
  return {
    stage: p.stage | 0, exp: p.exp || 0,
    food: clamp((p.food == null ? 80 : p.food) - h * PET_RULES.foodDecay),
    fun: clamp((p.fun == null ? 80 : p.fun) - h * PET_RULES.funDecay),
    energy, sleepUntil, at: p.at || now
  };
}
export function moodOf(c, now){
  if(c.sleepUntil && c.sleepUntil > now) return 'sleep';
  if(c.food < 25) return 'hungry';
  if(c.energy < 20) return 'tired';
  if(c.fun < 25) return 'sad';
  if(c.food >= 60 && c.fun >= 60 && c.energy >= 60) return 'happy';
  return 'normal';
}
export const MOOD_LABEL = { happy: '😊 신남', normal: '🙂 보통', hungry: '🍙 배고픔', tired: '😪 지침', sad: '😞 심심함', sleep: '💤 자는 중' };
function storeCare(c, now){
  return { stage: c.stage, exp: Math.round(c.exp), food: Math.round(c.food * 10) / 10, fun: Math.round(c.fun * 10) / 10,
           energy: Math.round(c.energy * 10) / 10, t: now, sleepUntil: c.sleepUntil || null, at: c.at };
}
function evolveReady(c, now){
  if(c.stage === 0) return c.exp >= PET_RULES.evolve[0];
  if(c.stage === 1) return c.exp >= PET_RULES.evolve[1] && moodOf(c, now) === 'happy';
  return false;
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
  @media (max-width:520px){ .pt-mine .pt-big .pt-cv{ width:96px; height:96px; } .pt-shop{ grid-template-columns:1fr; } }
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
    return { id: data.active, s: c.stage, m: moodOf(c, now) };
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

  function checkReady(){
    const info = activeInfo();
    if(!info) return;
    const now = nowMs();
    const c = careNow(data.owned[info.id], now);
    if(evolveReady(c, now) && !readyToasted[info.id + c.stage]){
      readyToasted[info.id + c.stage] = true;
      toast(`✨ ${PET_INFO[info.id].names[c.stage]}가 진화할 수 있어요!`, '🐾 펫 키우기에서 진화하기를 눌러 주세요');
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
    const showCare = view !== 'shop', showShop = view !== 'care';
    overlay.querySelector('.pt-head h3').textContent = VIEW_TITLE[view];
    if(showCare && info){
      const c = careNow(owned[info.id], now);
      const inf = PET_INFO[info.id];
      const nextNeed = c.stage < 2 ? PET_RULES.evolve[c.stage] : null;
      const ready = evolveReady(c, now);
      const bar = (label, v, cls) => `<div class="pt-bar"><span style="text-align:left">${label}</span><i><b class="${cls || (v < 25 ? 'low' : '')}" style="width:${Math.max(0, Math.min(100, v))}%"></b></i><span>${Math.round(v)}</span></div>`;
      h += `<div class="pt-sec"><h4>🐾 데려가는 펫</h4><div class="pt-mine"><div class="pt-big" data-slot="big"></div><div class="pt-mine-info">
        <div class="pt-mine-name">${escapeHtml(inf.names[c.stage])}<small>${c.stage + 1}단계 · ${MOOD_LABEL[info.m]}</small></div>
        ${bar('🍙 배부름', c.food)}${bar('😊 기분', c.fun)}${bar('⚡ 체력', c.energy)}
        ${nextNeed ? `<div class="pt-bar"><span style="text-align:left">✨ 경험치</span><i><b class="exp" style="width:${Math.min(100, c.exp / nextNeed * 100)}%"></b></i><span>${Math.min(c.exp, nextNeed)}/${nextNeed}</span></div>` : `<div class="pt-note">✨ 다 자랐어요! (맞힌 문제 ${c.exp}개)</div>`}
        <div class="pt-acts">
          <button type="button" class="pt-act gold" data-act="feed" ${(data.coins || 0) < PET_RULES.feedCost || c.food >= 95 || info.m === 'sleep' ? 'disabled' : ''}>🍙 밥 주기 (🪙${PET_RULES.feedCost})</button>
          <button type="button" class="pt-act" data-act="sleep" ${info.m === 'sleep' || c.energy >= 95 ? 'disabled' : ''}>${info.m === 'sleep' ? `💤 자는 중 (${Math.ceil((c.sleepUntil - now) / 60000)}분)` : '💤 재우기'}</button>
          ${c.stage < 2 ? `<button type="button" class="pt-act go" data-act="evolve" ${ready ? '' : 'disabled'}>✨ 진화하기</button>` : ''}
        </div>
        <div class="pt-msg">${escapeHtml(msg || (c.food <= 0 ? '🍙 배가 고파서 경험치가 오르지 않아요! 밥을 주세요' : c.stage < 2 && !ready ? (c.exp >= (nextNeed || 0) && c.stage === 1 ? '기분이 😊신남 상태가 되면 진화할 수 있어요 (배부름·기분·체력 모두 60 이상)' : `데려가서 문제를 ${nextNeed - c.exp}개 더 맞히면 진화할 수 있어요`) : ''))}</div>
      </div></div>
      <div class="pt-note">데려간 펫과 함께 문제를 맞히면 경험치와 기분이 올라요 · 배부름이 0이면 경험치가 오르지 않아요 · 배부름·기분은 1시간에 1씩 줄어요 · 재우면 ${PET_RULES.sleepMs / 60000}분 뒤 체력이 가득 차요</div></div>`;
    } else if(showCare){
      h += `<div class="pt-sec"><h4>🐾 데려가는 펫</h4><div class="pt-note">아직 펫이 없어요. ${showShop ? '아래 상점에서' : '상점에서'} 골라 보세요! 펫이 생기면 수업 게임 전광판과 혼자 연습 화면에 내 캐릭터로 나와요.</div>${showShop ? '' : '<button type="button" class="pt-act gold" data-view="shop">🏪 상점으로 가기</button>'}</div>`;
    }
    const ownIds = showCare ? PET_ORDER.filter(id => owned[id]) : [];
    if(ownIds.length){
      h += `<div class="pt-sec"><h4>📦 내가 가진 펫 (${ownIds.length})</h4><div class="pt-note">누르면 그 펫을 데려가요</div><div class="pt-owned">${ownIds.map(id => {
        const c = careNow(owned[id], now);
        return `<button type="button" class="pt-own ${data.active === id ? 'on' : ''}" data-own="${id}"><span data-slot="own-${id}"></span>${escapeHtml(PET_INFO[id].names[c.stage])}</button>`;
      }).join('')}</div></div>`;
    }
    if(view === 'care' && info) h += `<div class="pt-sec"><button type="button" class="pt-act" data-view="shop">🏪 상점에서 새 펫 보기</button></div>`;
    if(view === 'shop' && info) h += `<div class="pt-sec"><div class="pt-note">지금 데려가는 펫: <b>${escapeHtml(PET_INFO[info.id].names[info.s])}</b> · 밥 주기·진화는 🐾 펫 키우기에서 해요 <button type="button" class="pt-act" data-view="care">🐾 펫 키우기로 가기</button></div></div>`;
    if(showShop){
    h += `<div class="pt-sec"><h4>${view === 'shop' ? '🛒 펫 고르기' : '🏪 상점'}</h4><div class="pt-note">🪙 코인 모으기: 혼자 연습·수업 게임 정답 1개 = 1코인 + 1·2·3등 보너스 ${PET_RULES.classBonus.join('·')}코인 · 한국사·세계사 코인은 하나로 합쳐져요</div>
      <div class="pt-tabs"><button type="button" class="pt-tab ${shopTab === 'normal' ? 'on' : ''}" data-tab="normal">일반 펫</button><button type="button" class="pt-tab ${shopTab === 'rare' ? 'on' : ''}" data-tab="rare">✦ 희귀 펫</button></div>
      <div class="pt-shop">`;
    PET_ORDER.filter(id => !!PET_INFO[id].rare === (shopTab === 'rare')).forEach(id => {
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
    h += `</div><div class="pt-note" style="margin-top:8px">진화 전 모습은 상점에서도 볼 수 있어요. 3단계 모습은 펫을 키워서 확인해 보세요!</div></div>`;
    }
    frag.innerHTML = h;
    // 캔버스 끼우기
    if(info){
      const slot = frag.querySelector('[data-slot="big"]');
      if(slot) slot.appendChild(petCanvas(info));
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
      if(res && res.committed){ toast(`🎉 ${inf.names[0]}가 생겼어요!`, data.active === id ? '지금부터 게임에 함께 나가요 · 🐾 펫 키우기에서 돌봐 주세요' : '🐾 펫 키우기의 내가 가진 펫에서 누르면 데려가요'); }
      return;
    }
    if(kind === 'own'){
      await tx((cur) => { if(!cur.owned || !cur.owned[id]) return; cur.active = id; return cur; });
      return;
    }
    const aid = data.active;
    if(!aid) return;
    if(kind === 'feed'){
      const res = await tx((cur, now) => {
        const p = cur.owned && cur.owned[aid];
        if(!p || (cur.coins || 0) < PET_RULES.feedCost) return;
        const c = careNow(p, now);
        if(c.food >= 95 || (c.sleepUntil && c.sleepUntil > now)) return;
        c.food = clamp(c.food + PET_RULES.feedAmount);
        cur.coins -= PET_RULES.feedCost;
        cur.owned[aid] = storeCare(c, now);
        return cur;
      });
      if(res && res.committed) setMsg('🍙 냠냠! 배부름이 올랐어요');
    } else if(kind === 'sleep'){
      const res = await tx((cur, now) => {
        const p = cur.owned && cur.owned[aid];
        if(!p) return;
        const c = careNow(p, now);
        if(c.sleepUntil && c.sleepUntil > now) return;
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
    if(overlay){ render(); return; }
    overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    overlay.innerHTML = `<div class="pt-panel" role="dialog" aria-label="내 펫과 상점"><div class="pt-head"><h3>🐾 내 펫 · 상점</h3><span class="pt-coins"></span><button type="button" class="pt-close">닫기 ✕</button></div><div class="pt-body"></div></div>`;
    overlay.addEventListener('click', (e) => {
      if(e.target === overlay || e.target.closest('.pt-close')){ close(); return; }
      const b = e.target.closest('button');
      if(!b || b.disabled) return;
      if(b.dataset.tab){ shopTab = b.dataset.tab; render(); return; }
      if(b.dataset.view){ view = b.dataset.view; overlay.querySelector('.pt-body').scrollTop = 0; render(); updateButtons(); return; }
      if(b.dataset.buy){ act('buy', b.dataset.buy); return; }
      if(b.dataset.own){ act('own', b.dataset.own); return; }
      if(b.dataset.act){ act(b.dataset.act); }
    });
    document.body.appendChild(overlay);
    ext = null;
    render();
    loadExt();
  }
  function close(){ if(overlay){ overlay.remove(); overlay = null; } }
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
          if(c.food > 0) c.exp += 1;
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
