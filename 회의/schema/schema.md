# 📐 회의록 LLM WIKI 스키마 (Meeting Schema Specification)

> **팀명**: 아만보 (아는 만큼 보인다)  
> **스키마 버전**: v1.0 (`260916 18:00`)  
> **적용 범위**: `회의/raw/` → `회의/wiki/` 변환 시 필수 준수

---

## 1. 메타데이터 (YAML Frontmatter) 스키마

모든 `회의/wiki/` 회의록 문서는 아래 Frontmatter 스키마를 충족해야 합니다.

```yaml
---
title: "[yy.mm.dd]-주제"
date: "YYYY-MM-DD"
attendees:
  - "함석신"
  - "김민주"
  - "김준호"
agendas:
  - "안건 1"
  - "안건 2"
consensus:
  - "합의 사항 1"
  - "합의 사항 2"
action_items:
  - owner: "담당자"
    task: "실행 과제"
    due: "마감일"
tags:
  - 회의록
  - 하브루타
  - LLM_WIKI
---
```

---

## 2. 회의록 필수 섹션 구조
1. **# 📋 [yy.mm.dd] 종합 회의록 제목**
2. **## 🧭 [RULE] 아만보팀 아카이빙 & 회의록 운영 규칙**
3. **## 🎯 오늘 회의 아젠다 (Agenda)**
4. **## [안건별 상세 논의 & 하브루타 공방]**
5. **## 🏁 종합 결론 및 Action Items (실행 과제 표)**
