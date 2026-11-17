// 새 버전 알림: 이 페이지(와 공용 스크립트)가 배포로 바뀌었으면 화면 아래에 "새로고침" 안내 띠를 띄운다.
// - 자동으로 새로고침하지 않는다(연습·게임 도중 화면이 초기화되면 안 되므로). 학생이 쉬는 타이밍에 직접 누른다.
// - 서버에 HEAD 요청만 보내 ETag/Last-Modified가 처음과 달라졌는지 비교한다(본문을 다시 받지 않아 가볍다).
// 사용: <script src="(상대경로)/shared/update-notice.js" defer></script>
(function(){
  'use strict';
  if(window.__updateNoticeLoaded) return;
  window.__updateNoticeLoaded = true;

  var POLL_MS = 90 * 1000;      // 화면이 보이는 동안 이 간격으로 확인
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var sharedDir = scriptSrc ? scriptSrc.replace(/[^\/]*$/, '') : '';
  var pageUrl = location.origin + location.pathname;   // 쿼리·해시는 빼고 페이지 파일만
  var watch = [pageUrl];
  if(sharedDir){ ['lib.js', 'pets.js', 'titles.js'].forEach(function(f){ watch.push(sharedDir + f); }); }

  var baseline = {};   // url → 처음 본 서명
  var shown = false;
  var timer = null;

  function sig(res){
    return res.headers.get('etag') || res.headers.get('last-modified') || null;
  }
  async function fetchSig(url){
    try{
      var res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if(!res.ok) return null;
      return sig(res);
    }catch(_e){ return null; }
  }

  async function check(){
    if(shown) return;
    var sigs = await Promise.all(watch.map(fetchSig));
    for(var i = 0; i < watch.length; i++){
      var s = sigs[i];
      if(!s) continue;                       // 못 가져온 파일(없음·오프라인)은 건너뜀
      if(!(watch[i] in baseline)){ baseline[watch[i]] = s; continue; }
      if(baseline[watch[i]] !== s){ showBanner(); return; }
    }
  }

  function showBanner(){
    if(shown) return;
    shown = true;
    stop();
    var bar = document.createElement('div');
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed; left:50%; bottom:12px; transform:translateX(-50%); z-index:2147483000;'
      + 'display:flex; align-items:center; gap:10px; max-width:calc(100vw - 24px); padding:10px 12px 10px 16px;'
      + 'background:#2b3a67; color:#fff; border-radius:999px; box-shadow:0 4px 18px rgba(0,0,0,.28);'
      + 'font:600 14px/1.3 system-ui,-apple-system,"Malgun Gothic",sans-serif;';
    var msg = document.createElement('span');
    msg.textContent = '🔄 새 버전이 나왔어요!';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '새로고침';
    btn.style.cssText = 'border:0; border-radius:999px; padding:8px 14px; background:#ffd54a; color:#3a2a00;'
      + 'font:700 14px system-ui,-apple-system,"Malgun Gothic",sans-serif; cursor:pointer;';
    btn.onclick = function(){ location.reload(); };
    var close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', '닫기');
    close.textContent = '✕';
    close.style.cssText = 'border:0; background:transparent; color:#cfd6f0; font-size:16px; padding:6px 8px; cursor:pointer;';
    close.onclick = function(){ bar.remove(); };
    bar.appendChild(msg); bar.appendChild(btn); bar.appendChild(close);
    document.body.appendChild(bar);
  }

  function start(){
    if(timer || shown) return;
    timer = setInterval(function(){ if(!document.hidden) check(); }, POLL_MS);
  }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', function(){ if(!document.hidden) check(); });
  check();   // 처음 서명 저장
  start();
})();
