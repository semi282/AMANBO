# 📥 김준호 RAW 데이터 보관소 (Raw Data Vault)

> **연구자**: 김준호  
> **팀 주제**: 게임 제작을 위한 AI 활용은 어디까지 인정될 수 있을까?  
> **용도**: 게임 개발 AI 관련 학술 논문, 소송 판결문, 노조 성명서, 일자리 대체 사례, 유저 불매 보도 등 **가공되지 않은 날것의 원본 데이터**를 보관합니다.  
> **최근 업데이트**: `260917 09:40`

---

## 🏷️ 파일 명명 규칙
* `[김준호-자료제목_원문].md` (또는 원본 PDF/MD 파일)
* 예시: `[김준호-게임성우_AI음성복제_파업합의안_원문].md`

---

## 🔄 처리 파이프라인
1. 이 폴더에 원문 텍스트나 PDF 논문, AI 대화 내용을 저장합니다.
2. `[김준호 변환 프롬프트](../schema/prompt_pipeline.md)`를 사용하여 LLM에 원문을 입력합니다.
3. LLM이 생성한 정제 문서를 `../wiki/` 폴더에 저장합니다.
4. `[김준호 리드미](../README.md)` 활동 로그에 `YYMMDD HH:mm` 형식으로 기록합니다.

---

## 📁 보관된 원천 데이터 및 인제스트(Ingested) 현황

### 📑 Paper/ (학술 연구 논문 2건)
* 📄 [`KCI_FI003253366.pdf`](./Paper/KCI_FI003253366.pdf) : 생성형 AI 이미지 도구의 단계별 학습 전략 (중앙대학교 첨단영상대학원, 2025)  
  ➡️ 정제 WIKI: [김준호-생성형AI_이미지도구_단계별학습전략과_창작통제권.md](../wiki/[김준호-생성형AI_이미지도구_단계별학습전략과_창작통제권].md)
* 📄 [`KCI_FI003305950.pdf`](./Paper/KCI_FI003305950.pdf) : 생성형 AI 코딩 도입에서 IT관리자와 개발자 간 인식 차이: 상호지향성 모형을 중심으로 (고려대·한동대·가천대, 2026)  
  ➡️ 정제 WIKI: [김준호-AI코딩도입에_따른_관리자_개발자_인식격차와_직무위협.md](../wiki/[김준호-AI코딩도입에_따른_관리자_개발자_인식격차와_직무위협].md)

### 📰 news/ (게임 산업 언론 보도 8건)
* 📄 [`news_byline_ai_slop_game_platform.md`](./news/news_byline_ai_slop_game_platform.md) : 쏟아지는 신작에 AI 슬롭까지…게임 플랫폼 '풍요 속 빈곤' (Byline Network)  
  ➡️ 정제 WIKI: [김준호-게임_플랫폼_AI슬롭_범람과_인디_생태계_교란.md](../wiki/[김준호-게임_플랫폼_AI슬롭_범람과_인디_생태계_교란].md)
* 📄 [`news_chosun_expedition33_ai_debate.md`](./news/news_chosun_expedition33_ai_debate.md) : '33원정대' 수상 취소로 불거진 게임업계 'AI 창작' 논쟁 (조선비즈)  
  ➡️ 정제 WIKI: [김준호-33원정대_수상취소와_AI창작_인정범위_논쟁.md](../wiki/[김준호-33원정대_수상취소와_AI창작_인정범위_논쟁].md)
* 📄 [`news_game_donga_ananta_ai_controversy.md`](./news/news_game_donga_ananta_ai_controversy.md) : 유명 버튜버도 방송 중단... '서브컬처 GTA' 이환, AI 논란 무슨 일? (게임동아)  
  ➡️ 정제 WIKI: [김준호-이환_AI에셋_논란과_초기기획_투명성_가이드라인.md](../wiki/[김준호-이환_AI에셋_논란과_초기기획_투명성_가이드라인].md)
* 📄 [`news_hankyung_ai_game_retro.md`](./news/news_hankyung_ai_game_retro.md) : AI로 만든 건 재미없어…더 잘나가는 옛날 게임 (한국경제)  
  ➡️ 정제 WIKI: [김준호-AI_양산형_게임_외면과_고전_게임의_역설적_부상.md](../wiki/[김준호-AI_양산형_게임_외면과_고전_게임의_역설적_부상].md)
* 📄 [`news_news1_crimson_desert_ai_apology.md`](./news/news_news1_crimson_desert_ai_apology.md) : '말 다리가 3개' AI 사용 미고지 사과한 붉은사막…환불사태 우려 (뉴스1)  
  ➡️ 정제 WIKI: [김준호-붉은사막_AI에셋_미고지_혼입_사태와_사전검수_리스크.md](../wiki/[김준호-붉은사막_AI에셋_미고지_혼입_사태와_사전검수_리스크].md)
* 📄 [`news_newspim_nexon_generative_ai.md`](./news/news_newspim_nexon_generative_ai.md) : 넥슨코리아, 생성형 AI 통해 보안 혁신…게임핵 인식 (뉴스핌)  
  ➡️ 정제 WIKI: [김준호-넥슨_생성형AI_도입과_개발보조_도구로서의_인정기준.md](../wiki/[김준호-넥슨_생성형AI_도입과_개발보조_도구로서의_인정기준].md)
* 📄 [`news_pressian_ai_game_limits.md`](./news/news_pressian_ai_game_limits.md) : AI로 누구나 게임을 만들 수는 없는 이유 (프레시안)  
  ➡️ 정제 WIKI: [김준호-AI게임_제작의_한계와_인간_창작자의_디렉팅_필수성.md](../wiki/[김준호-AI게임_제작의_한계와_인간_창작자의_디렉팅_필수성].md)
* 📄 [`news_yna_crimson_desert_3m_sales.md`](./news/news_yna_crimson_desert_3m_sales.md) : AI 논란에도 멈추지 않았다…붉은사막 300만장 돌파 (연합뉴스)  
  ➡️ 정제 WIKI: [김준호-붉은사막_300만장_돌파와_AI논란_조기진화_선례.md](../wiki/[김준호-붉은사막_300만장_돌파와_AI논란_조기진화_선례].md)

---

## 🔗 상호 참조
* 🎮 [김준호 연구 WIKI 홈](../README.md)
* 🧠 [김준호 WIKI 보관소](../wiki/README.md)
* 📐 [김준호 SCHEMA 명세서](../schema/schema.md)
