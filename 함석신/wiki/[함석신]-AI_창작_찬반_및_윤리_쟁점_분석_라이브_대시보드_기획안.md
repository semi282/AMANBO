---
title: "[함석신-AI_창작_찬반_및_윤리_쟁점_분석_라이브_대시보드_기획안]"
author: "함석신"
created: "260916 21:50"
updated: "260918 19:35"
topic: "게임 제작을 위한 AI 활용 인정 바운더리"
source_raw: "[[함석신/raw/ai_creation_issue_dashboard_proposal.md]]"
tags:
  - 게임AI
  - 거버넌스
  - 바운더리기준
  - 아만보팀
  - 프로젝트기획
  - 라이브대시보드
  - FastAPI
  - GeminiAPI
  - 웹검색그라운딩
summary: "FastAPI, Gemini API(Google Search Grounding), 반응형 대시보드를 연계하여 게임 창작 쟁점의 찬반 논거와 팀 가이드라인을 실시간 진단하는 라이브 시연 프로덕트 기획안"
boundary_rules:
  - "단순 의견 나열형 발표를 탈피하고 기술 스택으로 직접 개발한 실시간 진단 프로덕트를 제시"
  - "사용자 키워드 입력 시 찬성(효율), 반대(저작권), 가이드라인(마지노선) 3단 카드로 구조화 출력"
---

# 📖 [함석신-AI_창작_찬반_및_윤리_쟁점_분석_라이브_대시보드_기획안]

> **연구자**: 함석신 | **최종 수정**: 260918 19:35  
> **팀 주제**: 게임 제작을 위한 AI 활용은 어디까지 인정될 수 있을까?  
> **원천 자료 (RAW)**: [[ai_creation_issue_dashboard_proposal]](../raw/ai_creation_issue_dashboard_proposal.md)  

---

## 📌 1. 핵심 요약 (3-Line Summary)

1. **기획 배경**: 말뿐인 텍스트 나열형 PPT를 탈피하여, **"우리가 직접 데이터를 분석해 기준을 세우고, 우리가 배운 기술(FastAPI, Gemini, 대시보드)로 이를 판별하는 실시간 도구까지 개발했다"**는 실증 프로덕트를 제시한다.
2. **3단 분석 카드 파이프라인**: 쟁점 키워드(예: "NPC 풀 보이스 더빙", "미드저니 일러스트") 입력 시, 최신 웹 검색 그라운딩을 거쳐 **[1] 찬성 논거(비용절감) ➔ [2] 반대 리스크(파업/소송) ➔ [3] 팀 가이드라인(마지노선)**을 실시간 렌더링한다.
3. **발표 시연 각본**: 현장에서 교수님이나 청중으로부터 논쟁적 키워드를 즉석에서 제안받아 3초 만에 결과를 도출하는 라이브 데모를 통해 폭발적인 반응을 유도한다.

---

## ⚖️ 2. 게임 개발 파이프라인별 허용 가이드라인 (Detailed Boundary)

### 2.1 시스템 아키텍처 다이어그램

```mermaid
graph TD
    subgraph Frontend [사용자 인터페이스 (UI)]
        UI["🌐 반응형 웹 대시보드<br>• 쟁점 키워드 검색창<br>• 찬반/윤리 3단 그리드 카드 UI<br>• JSON/MD 내보내기"]
    end

    subgraph Backend [비동기 API 서버 (FastAPI)]
        API["⚡ FastAPI Application<br>• POST /api/analyze<br>• Pydantic 입출력 검증<br>• 비동기 호출"]
    end

    subgraph AI_Engine [지능형 분석 엔진]
        Gemini["🤖 Google Gemini API<br>• 최적화 시스템 프롬프트<br>• Structured JSON Output"]
        Search["🔍 Google Search Grounding<br>• 최신 판례, 스팀 정책, 기사 크롤링"]
        Gemini <--> Search
    end

    UI -->|HTTP Request| API
    API -->|Prompt with Grounding| Gemini
    Gemini -->|검증된 분석 결과| API
    API -->|Clean JSON Payload| UI
```

### 2.2 3대 핵심 분석 카드 구성 및 데이터 연계

| 카드 구분 | 분석 데이터 내용 | 팀원 전문 영역과의 연계 |
| :--- | :--- | :--- |
| **🟢 [1] 찬성 측 논거 (Pros)** | • 제작비 절감 수치 (60~80%)<br>• 프로토타이핑 가속 및 다국어 로컬라이징 | 김민주 연구 연계 (생산성 혁신) |
| **🔴 [2] 반대 측 리스크 (Cons)** | • SAG-AFTRA 파업 및 디지털 복제 소송<br>• 스팀 유저 거부감 및 평점 테러 리스크 | 김준호 연구 연계 (리스크 & 생태계) |
| **🟡 [3] 실무 가이드라인 (Boundary)** | • **3단계 스크리닝(학습-생성-이용)** 원칙<br>• 인간 디렉터 검수 및 스토어 사전 공시 | 함석신 총괄 (AI 거버넌스 마지노선) |

---

## 🛡️ 3. 기술적·제도적 안전장치 검토

### 3.1 기술 스택 선정의 정당성
* **FastAPI**: Python 비동기 지원으로 실시간 AI 스트리밍 및 SDK 호환 최적화. 자동 생성 Swagger UI(`/docs`)로 백엔드 완성도 입증.
* **Google Gemini API with Search Grounding**: 2024~2026년 최신 판례(USCO, 미드저니 소송, SAG-AFTRA 협약)를 실시간 반영하여 정적 모델의 할루시네이션 원천 방지.
* **Structured Output**: 일관된 JSON 스키마를 강제하여 프론트엔드 파싱 오류 차단.

### 3.2 라이브 시연 각본 (1분 30초)
* **00:00 ~ 00:20**: 대시보드 화면 전체 송출 및 프로덕트 개발 배경 소개
* **00:20 ~ 00:45**: 청중 즉석 질문 접수 (*"인디 게임에서 메인 일러스트를 미드저니로 뽑는 건 어떤가요?"*) 및 키워드 입력
* **00:45 ~ 01:10**: 3초 만에 3단 카드가 팝업되며 실시간 찬반/윤리 진단 리포트 출력
* **01:10 ~ 01:30**: "기술은 위험하지만, 우리가 올바른 거버넌스와 도구를 갖춘다면 창작의 훌륭한 파트너가 될 수 있다"는 감동적 마무리

---

## 🔗 4. 연결된 문서 (References)

* 📥 [AI 창작 찬반 및 윤리 쟁점 분석 대시보드 기획안 원문 (RAW)](../raw/ai_creation_issue_dashboard_proposal.md)
* 📄 [게임 개발 및 창작 AI 활용 가이드 WIKI](./[함석신]-게임_개발_및_창작_AI_활용_가이드.md)
* 📄 [게임 개발 및 창작 생태계 내 AI 도입의 한계와 허용 기준 연구 WIKI](./[함석신]-게임_개발_및_창작_생태계_내_AI_도입의_한계와_허용_기준_연구.md)
* 🏠 [함석신 연구 WIKI 홈](../README.md)
