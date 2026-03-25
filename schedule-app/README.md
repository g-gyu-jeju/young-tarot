# 직원 근태 스케줄 (Google Sheets)

Next.js + Tailwind CSS + Google Sheets API로 구글 시트의 근태 데이터를 월간 캘린더로 표시합니다.

## 준비

1. Google Cloud에서 서비스 계정을 만들고 Sheets API를 활성화합니다.
2. 스프레드시트 `공유`에 **서비스 계정 이메일**을 추가합니다 (뷰어 이상).
3. 프로젝트 루트에 `.env.local`을 만들고 아래를 채웁니다.

```bash
cp .env.example .env.local
```

`GOOGLE_PRIVATE_KEY`는 JSON의 `private_key` 값을 그대로 넣되, **줄바꿈은 `\n`으로 이스케이프**한 문자열로 넣는 것을 권장합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## Vercel 배포

1. GitHub 등에 저장소를 푸시합니다.
2. Vercel에서 프로젝트를 import합니다.
3. **Root Directory**를 `schedule-app`으로 지정합니다 (이 저장소가 타로 앱과 같이 루트에 있을 때).
4. Environment Variables에 `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`를 등록합니다.
5. Deploy합니다.

**보안:** `.env.local`과 실제 private key는 저장소에 커밋하지 마세요. 채팅/이슈에 키를 노출했다면 Google Cloud에서 **키를 회전(재발급)** 하는 것을 권장합니다.

## 노션 임베드

`next.config.ts`에서 `Content-Security-Policy: frame-ancestors *` 및 `X-Frame-Options: ALLOWALL`을 설정해 두었습니다. 노션에 URL을 `/embed` 형태로 넣을 때는 노션 쪽 임베드 정책도 확인하세요.

## 시트 범위

- 스프레드시트 ID: `1L70Kqo-LgO5JCmCuCWNGu5Q3CRDvNwXbqj8uQQmyGOo`
- 범위: `'근무상황신청'!A2:F100` (1행 헤더 제외, API 표기)
