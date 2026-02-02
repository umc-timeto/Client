
<div align="center">

# timeto

</div>

<br/>

## 🙋🏻‍♀️ Page Partner의 FE Developer를 소개합니다!

| <a href="https://github.com/p1001q"><img src="https://avatars.githubusercontent.com/u/201849046?v=4" width="120px;" alt=""/></a> | <a href="https://github.com/yeon-yeon1"><img src="https://avatars.githubusercontent.com/u/158417764?v=4" width="120px;" alt=""/></a> |
| --- | --- |
| 박수연 | 노진경 

<br>

## 📚 서비스 소개
**timeto**는 ADHD를 가진 개인을 지원하기 위해 설계된 태스크 관리 서비스입니다.

최근 ADHD 진단을 받는 인구가 꾸준히 증가하면서, 기존의 단순한 일정 관리 도구를 넘어서는 새로운 형태의 지원 도구에 대한 필요성이 커지고 있습니다. 많은 일정 관리 서비스가 점점 더 간소화되고 자동화되는 흐름과 달리, TimeTo는 사용자가 **스스로 시간 관리를 연습하고 이를 지속 가능한 습관으로 만들도록 유도**하는 데 초점을 둡니다.

**timeto**는 ADHD를 위한 **인지행동치료(CBT)** 이론을 기반으로, 시간 계획 – 행동 계획 – 보상의 흐름을 구조화한 디지털 프레임워크를 제공합니다. 사용자는 목표를 세분화하고, 과제를 우선 순위를 설정하고, 타임 블로킹을 통해 하루를 계획하는 방법을 학습합니다. 또한 일일 회고 기능을 통해 자신의 수행 과정을 돌아보고 성취감을 쌓을 수 있습니다.

**timeto**는 단순한 일정 관리 도구를 넘어, ADHD 사용자가 **지속 가능한 루틴을 형성하고 시간에 대한 주도권을 회복하며 의미 있는 성장을 이루도록 돕는 것**을 목표로 합니다.

<br>

## 💻 기술 스택

| **역할** | **종류** | **선정 이유** |
| --- | --- | --- |
| Library | <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=React&logoColor=white"> | 컴포넌트 기반 구조로 재사용성과 유지보수성이 높아 개발 효율을 극대화 가능 |
| Programming Language | <img src="https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/> | 정적 타입을 제공하여 코드의 안정성과 가독성을 높이고, 개발 중 오류를 사전에 방지할 수 있어 유지보수에 유리 |
| Styling | <img src="https://img.shields.io/badge/tailwindcss-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"> | 유틸리티 클래스 기반의 스타일링으로 반복되는 CSS 코드 작성을 줄이고, 빠르고 일관된 UI 구현 가능 |
| Data Fetching | <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=Axios&logoColor=white"> | 직관적인 API 사용법과 자동 JSON 변환 기능으로 비동기 통신이 간편 |
| State management | <img src="https://img.shields.io/badge/zustand-orange?style=for-the-badge&logo=zustand&logoColor=white"> | 가볍고 직관적인 구조로 전역 상태를 쉽게 관리하며, selector 구독을 통한 최소 리렌더링으로 높은 성능 제공 |
| Routing | <img src="https://img.shields.io/badge/ReactRouter-CA4245?style=for-the-badge&logo=ReactRouter&logoColor=white"> | SPA에 최적화된 라우팅 기능 제공, 선언적 방식으로 라우트를 쉽게 구성 가능 |
| Formatting | <img src="https://img.shields.io/badge/eslint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white"> <img src="https://img.shields.io/badge/prettier-000000?style=for-the-badge&logo=prettier&logoColor=F7B93E"> <img src="https://img.shields.io/badge/stylelint-263238?style=for-the-badge&logo=stylelint&logoColor=white"> | 코드 스타일을 통일하고 잠재적인 오류를 사전에 방지하여 협업 시 효율성을 높임 |
| Package Manager | <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white"> | 빠른 설치 속도와 안정적인 패키지 관리 기능으로 프로젝트 환경 설정에 용이 |
| Bundler | <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white"> | 빠른 서버 시작과 모듈 번들링 성능으로 개발 생산성을 향상 |

<br>

## 🧩 Package Manager

- **pnpm 버전**
  - 10.12.1

- **pnpm 버전 설치 방법**
```
pnpm set version 버전 # 프로젝트 최상위 폴더 위치에서 명령어 입력
```

- **pnpm 명령어 예시**
```
pnpm install # 전체 설치
pnpm add 라이브러리 # 라이브러리 설치
pnpm dev # 실행
```

<br>

## ⌨️ Code Styling

- **camelCase**
  - 변수명, 함수명에 적용
  - 첫글자는 소문자로 시작, 띄어쓰기는 붙이고 뒷 단어의 시작을 대문자로
    - ex- handleDelete
  - 언더바 사용 X (클래스명은 허용)

<br>

## 🎉Git Convention

### 📌 Git Flow

```
develop ← 작업 브랜치
```

- `main branch` : 배포 브랜치
- `develop branch` : 개발 브랜치, feature 브랜치가 merge됨
- `feature branch` : 페이지/기능 브랜치

  <br>

### ✨ Flow
- `develop 브랜치`에서 새로운 브랜치를 생성.
- 작업을 완료하고 커밋 메시지에 맞게 커밋.
- Pull Request 생성
- `develop` 브랜치로 병합.

<br>

### 🔥 Commit Message Convention

- **커밋 유형**
  - 🎉 Init: 프로젝트 세팅
  - ✨ Feat: 새로운 기능 추가
  - 🐛 Fix : 버그 수정
  - 💄 Design : UI(CSS) 수정
  - ✏️ Typing Error : 오타 수정
  - 📝 Docs : 문서 수정
  - 🚚 Mod : 폴더 구조 이동 및 파일 이름 수정
  - 💡 Add : 파일 추가 (ex- 이미지 추가)
  - 🔥 Del : 파일 삭제
  - ♻️ Refactor : 코드 리펙토링
  - 🚧 Chore : 배포, 빌드 등 기타 작업
  - 🔀 Merge : 브랜치 병합

- **형식**: `커밋유형: 상세설명 (#이슈번호)`
- **예시**:
  - 🎉 Init: 프로젝트 초기 세팅 (#1)
  - ✨ Feat: 메인페이지 개발 (#2)

<br>

### 🌿 Branch Convention

**Branch Naming 규칙**

- **브랜치 종류**
  - `init`: 프로젝트 세팅
  - `feat`: 새로운 기능 추가
  - `fix` : 버그 수정
  - `refactor` : 코드 리펙토링

- **형식**: `브랜치종류/#이슈번호/상세기능`
- **예시**:
  - init/#1/init
  - fix/#2/splash

<br>

### 📋 Issue Convention

**Issue Title 규칙**

- **태그 목록**:
  - `Init`: 프로젝트 세팅
  - `Feat`: 새로운 기능 추가
  - `Fix` : 버그 수정
  - `Refactor` : 코드 리펙토링

- **형식**: [태그] 작업 요약
- **예시**:
  - [Init] 프로젝트 초기 세팅
  - [Feat] Header 컴포넌트 구현

<br>

## 📂 프로젝트 구조

```
📦ZERO-Helper-FE
 ┣ 📂.github
 ┃ ┣ 📂ISSUE_TEMPLATE
 ┃ ┗ 📜pull_request_template.md
 ┣ 📂public
 ┃ ┗ 📂fonts
 ┃ ┗ 📜Logo.svg
 ┣ 📂src
 ┃ ┣ 📂apis
 ┃ ┣ 📂assets
 ┃ ┣ 📂components
 ┃ ┣ 📂constants
 ┃ ┣ 📂hooks
 ┃ ┣ 📂layouts
 ┃ ┣ 📂pages
 ┃ ┃ ┣ 📂LoginPage
 ┃ ┃ ┣ 📂HomePage
 ┃ ┃ ┣ 📂GoalPage
 ┃ ┃ ┣ 📂FolderPage
 ┃ ┃ ┣ 📂TaskPage
 ┃ ┃ ┣ 📂TimeBlockPage
 ┃ ┃ ┣ 📂MyLogPage
 ┃ ┃ ┗ 📜index.ts
 ┃ ┣ 📂routes
 ┃ ┣ 📂types
 ┃ ┣ 📂utils
 ┃ ┣ 📜App.tsx
 ┃ ┗ 📜main.jsx
 ┣ 📜.env
 ┣ 📜.gitignore
 ┣ 📜.prettierrc
 ┣ 📜.stylelintrc
 ┣ 📜eslint.config.js
 ┣ 📜index.html
 ┣ 📜package.json
 ┣ 📜pnpm-lock.yaml
 ┣ 📜README.md
 ┣ 📜tsconfig.app.json
 ┣ 📜tsconfig.json
 ┣ 📜tsconfig.node.json
 ┗ 📜vite.config.ts
```

- public
  - fonts - 폰트
- src
  - apis - 서버와 통신하는 API 함수 모음
  - assets - 사용되는 모든 에셋
  - components - 공용 컴포넌트 및 스타일
  - constants - 프로젝트 전역에서 사용되는 상수값 및 설정 모음
  - hooks - 전역으로 사용되는 훅
  - layouts - 페이지의 공통 레이아웃 컴포넌트
  - pages - 실제 라우팅되는 페이지 컴포넌트
  - routes - 도메인 별 라우팅 페이지와 컴포넌트 및 스타일 등
  - types - TypeScript 타입 정의 모음
  - utils - 전역으로 사용되는 함수


