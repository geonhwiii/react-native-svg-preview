# React Native SVG Preview

[한국어](#한국어) | [English](#english)

---

## 한국어

React Native TSX 파일에서 SVG 컴포넌트를 미리보기할 수 있는 VSCode 확장 프로그램입니다.

### ✨ 주요 기능

- **🎨 미니 SVG 프리뷰**: Explorer 패널 하단에 작은 SVG 미리보기 박스
- **🔄 실시간 업데이트**: 코드 편집 시 자동으로 미리보기 업데이트
- **📱 전체 미리보기**: 새 탭에서 상세한 SVG 미리보기
- **🌍 다국어 지원**: 한국어/영어 자동 지원
- **🎭 테마 연동**: VSCode 테마 색상과 완벽 연동

### 🎯 지원하는 SVG 컴포넌트

- `Svg` - 기본 SVG 컨테이너
- `Circle` - 원형
- `Rect` - 사각형
- `Path` - 경로
- `Ellipse` - 타원
- `Line` - 직선
- `Polygon` - 다각형
- `Polyline` - 폴리라인
- `Text` - 텍스트
- `G` - 그룹
- 기타 React Native SVG 컴포넌트들

### 📋 사용법

#### 미니 프리뷰 (새로운 기능!)
1. React Native 프로젝트에서 `.tsx` 파일을 엽니다
2. **Explorer 패널 하단**에 "SVG Preview" 박스가 자동으로 나타납니다
3. SVG 컴포넌트가 있는 파일을 편집하면 실시간으로 업데이트됩니다

#### 전체 미리보기
1. 파일 탐색기에서 파일을 우클릭하거나 편집기에서 우클릭합니다
2. "Preview SVG" 메뉴를 선택합니다
3. 새 패널에서 SVG 컴포넌트들의 상세 미리보기를 확인합니다

### 🚀 설치 및 개발

```bash
# 의존성 설치
npm install

# TypeScript 컴파일
npm run compile

# Watch 모드로 컴파일
npm run watch

# 패키징
npm run package
```

### 📋 요구사항

- VSCode 1.74.0 이상
- React Native SVG 라이브러리를 사용하는 프로젝트

---

## English

A VSCode extension for previewing SVG components in React Native TSX files.

### ✨ Key Features

- **🎨 Mini SVG Preview**: Small SVG preview box at the bottom of Explorer panel
- **🔄 Real-time Updates**: Automatic preview updates when editing code
- **📱 Full Preview**: Detailed SVG preview in new tab
- **🌍 Multi-language**: Automatic Korean/English support
- **🎭 Theme Integration**: Perfect integration with VSCode theme colors

### 🎯 Supported SVG Components

- `Svg` - Basic SVG container
- `Circle` - Circle
- `Rect` - Rectangle
- `Path` - Path
- `Ellipse` - Ellipse
- `Line` - Line
- `Polygon` - Polygon
- `Polyline` - Polyline
- `Text` - Text
- `G` - Group
- Other React Native SVG components

### 📋 Usage

#### Mini Preview (New Feature!)
1. Open a `.tsx` file in your React Native project
2. The "SVG Preview" box will automatically appear at the **bottom of Explorer panel**
3. Edit files with SVG components and see real-time updates

#### Full Preview
1. Right-click on a file in the file explorer or in the editor
2. Select "Preview SVG" from the menu
3. View detailed preview of SVG components in a new panel

### 🚀 Installation & Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Compile in watch mode
npm run watch

# Package extension
npm run package
```

### 📋 Requirements

- VSCode 1.74.0 or higher
- Project using React Native SVG library

### 📄 License

MIT 