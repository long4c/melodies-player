# Melodies Player

ChatGPT가 생성한 ABC notation 멜로디를 URL 파라미터로 전달받아 브라우저에서 악보로 렌더링하고 재생할 수 있는 Vite 기반 정적 웹앱입니다.

## 설치 방법

```bash
npm install
```

## 실행 방법

```bash
npm run dev
```

개발 서버가 안내하는 로컬 URL을 브라우저에서 엽니다.

## 빌드 방법

```bash
npm run build
```

정적 배포 결과물은 `dist/` 디렉터리에 생성됩니다.

## 미리보기

```bash
npm run preview
```

## Netlify 배포 방법

1. 이 프로젝트를 Git 저장소에 푸시합니다.
2. Netlify에서 새 사이트를 만들고 저장소를 연결합니다.
3. Build command는 `npm run build`로 설정합니다.
4. Publish directory는 `dist`로 설정합니다.
5. `public/_redirects` 파일이 포함되어 있어 `/m?a=...` 경로를 새로고침해도 `index.html`로 정상 라우팅됩니다.

## URL 포맷

멜로디 링크는 다음 자체 포맷을 사용합니다.

```text
/m?a=<base64url-encoded-abc>
```

`a` 파라미터에는 UTF-8 안전 base64url 방식으로 인코딩된 ABC notation 원문이 들어갑니다. `+`, `/`, `=` 문자는 URL-safe하게 변환되거나 제거됩니다.

## ABC 예시

```abc
X:1
T:Sample Moonlit Pop Hook
M:4/4
L:1/8
Q:1/4=98
K:Am
"Am" E A B c B A E2 | "F" F A c d c A F2 | "C" G E G c B G E2 | "G" D G A B A G G2 |
```

## 주의사항

이 앱은 서버 저장소를 사용하지 않습니다. 생성된 링크 안에 ABC 원문이 그대로 인코딩되어 포함되므로 긴 곡은 링크가 길어질 수 있습니다. 개인정보나 비공개 데이터를 ABC에 넣지 마세요.
