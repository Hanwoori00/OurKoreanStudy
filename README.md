# 한국어 롤플레이 앱

## 배포 방법 (Vercel — 무료)

### 1. 이 폴더를 GitHub에 올리기
1. [github.com](https://github.com) 로그인
2. "New repository" 클릭 → 이름 입력 (예: `korean-roleplay`) → Create
3. 폴더 안에서 터미널 열고:
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/korean-roleplay.git
git push -u origin main
```

### 2. Vercel에서 배포
1. [vercel.com](https://vercel.com) 접속 → GitHub으로 로그인
2. "Add New Project" → GitHub repo 선택
3. Framework: **Vite** 선택
4. **Environment Variables** 추가:
   - `VITE_ANTHROPIC_API_KEY` = 본인의 Anthropic API 키
5. Deploy 클릭!

### 3. Anthropic API 키 발급
1. [console.anthropic.com](https://console.anthropic.com) 접속
2. API Keys → Create Key
3. 복사해서 Vercel 환경변수에 붙여넣기

### Firebase Firestore 규칙 설정
Firebase Console → Firestore → Rules에 아래 붙여넣기:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true;
    }
  }
}
```

## 로컬 실행
```bash
npm install
npm run dev
```
