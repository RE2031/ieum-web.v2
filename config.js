/* ============================================================
   자람새 서버 연결 설정
   ------------------------------------------------------------
   Supabase(https://supabase.com) 프로젝트를 만들고 아래 두 값을
   채우면, 모든 방문자가 같은 글/댓글/좋아요를 공유하는
   "진짜 커뮤니티"가 됩니다. (가입: 무료 플랜 충분)

   1) supabase.com 에서 프로젝트 생성
   2) SQL Editor 에 supabase-schema.sql 전체를 붙여넣어 실행
   3) Project Settings > API 에서 두 값을 복사해 아래에 붙여넣기

   값이 비어 있으면 데모 모드로 동작합니다
   (지금처럼 내 브라우저 localStorage 에만 저장 — 서버 없음).
   ============================================================ */
window.JARAMSAE_CONFIG = {
  supabaseUrl: '',      // 예: https://abcdefghij.supabase.co
  supabaseAnonKey: '',  // Project Settings > API > anon public
};
