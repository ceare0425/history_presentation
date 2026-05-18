---
name: feedback-follow-existing-style
description: 새 프레젠테이션 제작 시 기존 파일의 CSS·구조·JS를 그대로 복사하고 내용만 교체해야 함
metadata:
  type: feedback
---

새 프레젠테이션을 만들 때 스킬 스펙을 처음부터 재해석하지 말고, **같은 시리즈의 기존 파일을 직접 Read해서 CSS·레이아웃·컴포넌트·JS를 그대로 복사한 뒤 내용만 교체**해야 한다.

**Why:** 스킬 스펙은 가이드라인이지 매번 새로 구현하는 설계도가 아님. 기존 파일과 달라지면 시리즈 전체의 일관성이 깨지고 사용자 불만이 발생함. ("왜 스타일을 마음대로 바꿔?" 피드백)

**How to apply:**
- 같은 단원·과목의 기존 index.html을 Read로 먼저 읽는다
- font-size, aspect-ratio, .browser-card, .ruler-card, .blank/.ans-btn, nav JS 등 모든 CSS와 스크립트를 그대로 유지
- 바꾸는 것은 제목·topbar 텍스트·슬라이드 내용·data-reveal 위치뿐
- 기존 파일이 없을 때만 스킬 스펙을 참고해 새로 설계
