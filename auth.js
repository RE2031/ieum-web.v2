/* 자람새 - 데모용 로그인 상태 관리 (실제 서버 인증 없음, localStorage 기반) */
const AUTH_KEY = 'jaramsae_auth';

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch (e) {
    return null;
  }
}

function setAuth(id, role) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ id, role }));
}

// 로그인 안 되어 있으면 로그인 페이지로 이동. 로그인 상태 객체를 반환.
function requireAuth() {
  const auth = getAuth();
  if (!auth) {
    location.href = 'login.html';
    return null;
  }
  return auth;
}

// 교사 전용 페이지 보호: 로그인 안 됐거나 교사가 아니면 접근 차단.
function requireTeacher() {
  const auth = requireAuth();
  if (!auth) return null;
  if (auth.role !== 'teacher') {
    alert('교사 계정만 접근할 수 있는 공간입니다.');
    location.href = 'index.html';
    return null;
  }
  return auth;
}

// 관리자 전용 페이지 보호(신고 검토 큐 등).
function requireAdmin() {
  const auth = requireAuth();
  if (!auth) return null;
  if (auth.role !== 'admin') {
    alert('관리자만 접근할 수 있는 공간입니다.');
    location.href = 'index.html';
    return null;
  }
  return auth;
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  location.href = 'login.html';
}

// 댓글 작성용 본인인증(휴대폰 번호, 데모용). 계정별로 한 번 인증하면 계속 유지됨.
const VERIFIED_KEY = 'jaramsae_verified_users';

function isPhoneVerified(userId) {
  try {
    const map = JSON.parse(localStorage.getItem(VERIFIED_KEY) || '{}');
    return !!(map[userId] && map[userId].phone);
  } catch (e) {
    return false;
  }
}

function getVerifiedPhone(userId) {
  try {
    const map = JSON.parse(localStorage.getItem(VERIFIED_KEY) || '{}');
    return map[userId] ? map[userId].phone : null;
  } catch (e) {
    return null;
  }
}

function setPhoneVerified(userId, phone) {
  let map = {};
  try { map = JSON.parse(localStorage.getItem(VERIFIED_KEY) || '{}'); } catch (e) {}
  map[userId] = { phone, date: new Date().toISOString() };
  localStorage.setItem(VERIFIED_KEY, JSON.stringify(map));
}

// 전문가 Q&A 답변 작성 권한(등록된 전문가 명단과 전화번호가 일치해야 부여됨).
// 댓글용 일반 본인인증(VERIFIED_KEY)과는 별도로 관리.
const VERIFIED_EXPERT_KEY = 'jaramsae_verified_experts';

function getVerifiedExpert(userId) {
  try {
    const map = JSON.parse(localStorage.getItem(VERIFIED_EXPERT_KEY) || '{}');
    return map[userId] || null;
  } catch (e) {
    return null;
  }
}

function setVerifiedExpert(userId, expertInfo) {
  let map = {};
  try { map = JSON.parse(localStorage.getItem(VERIFIED_EXPERT_KEY) || '{}'); } catch (e) {}
  map[userId] = { ...expertInfo, date: new Date().toISOString() };
  localStorage.setItem(VERIFIED_EXPERT_KEY, JSON.stringify(map));
}

/*
 * 이웃 신뢰도 (당근 온도 벤치마킹, 단 경쟁/비교 요소는 뺌)
 * - 신규 계정은 중립값 50에서 시작 (당근처럼 특정 상징값 대신 중립값)
 * - 본인에게만 정확한 점수를 보여주고, 다른 사람에게는 문턱값 이상일 때만
 *   정성적 배지(trustBadge)로만 노출한다. 순위/전체 목록은 절대 만들지 않는다.
 * - 점수는 "활동량"이 아니라 "타인에게 인정받은 기여"와 "관리자가 확정한 위반"에만 반응한다.
 */
const TRUST_KEY = 'jaramsae_trust';
const TRUST_DEFAULT = 50;

function getTrustScore(userId) {
  try {
    const map = JSON.parse(localStorage.getItem(TRUST_KEY) || '{}');
    return map[userId] !== undefined ? map[userId] : TRUST_DEFAULT;
  } catch (e) {
    return TRUST_DEFAULT;
  }
}

function adjustTrustScore(userId, delta) {
  let map = {};
  try { map = JSON.parse(localStorage.getItem(TRUST_KEY) || '{}'); } catch (e) {}
  const current = map[userId] !== undefined ? map[userId] : TRUST_DEFAULT;
  const next = Math.max(0, Math.min(100, current + delta));
  map[userId] = next;
  localStorage.setItem(TRUST_KEY, JSON.stringify(map));
  return next;
}

// 다른 이용자에게 보이는 건 숫자가 아니라 이 정성적 배지뿐 (없으면 아무것도 안 보임).
// 비교를 막기 위해 공개용은 일부러 2단계로만 굵게 나눈다.
function trustBadge(score) {
  if (score >= 70) return { emoji: '🌳', label: '든든한 이웃' };
  if (score >= 40) return { emoji: '🌱', label: '함께하는 이웃' };
  return null;
}

// 본인만 보는 프로필 화면 전용 성장 단계 (다른 사람에게는 절대 노출 안 됨).
// 공개 배지와 달리 비교 위험이 없으니 세분화해서 "성장하는 재미"를 준다.
const GROWTH_STAGES = [
  { min: 0, emoji: '🌰', label: '씨앗' },
  { min: 20, emoji: '🌱', label: '새싹' },
  { min: 40, emoji: '🍀', label: '떡잎' },
  { min: 55, emoji: '🌿', label: '어린나무' },
  { min: 70, emoji: '🌳', label: '튼튼한 나무' },
  { min: 85, emoji: '🌲', label: '마을의 큰 나무' },
];

function growthStage(score) {
  let current = GROWTH_STAGES[0];
  for (const stage of GROWTH_STAGES) {
    if (score >= stage.min) current = stage;
  }
  return current;
}

// 게시글/댓글 작성자 이름 옆에 붙일 배지 HTML (없으면 빈 문자열).
function trustBadgeHTML(userId) {
  const b = trustBadge(getTrustScore(userId));
  if (!b) return '';
  return ` <span style="display:inline-flex;align-items:center;gap:2px;font-size:.72rem;font-weight:600;color:#2f9e6e;background:#e3f7ee;padding:1px 7px;border-radius:8px;vertical-align:middle;">${b.emoji} ${b.label}</span>`;
}

// 클린 안심 서약 관리
const PLEDGE_KEY = 'jaramsae_pledges';

function getUserPledge(userId) {
  try {
    const list = JSON.parse(localStorage.getItem(PLEDGE_KEY) || '[]');
    return list.find(p => p.userId === userId || p.name === userId) || null;
  } catch(e) {
    return null;
  }
}

// 헤더의 사용자 영역(아바타/이름/역할뱃지/로그아웃)과, 교사/관리자일 때만 보이는
// 상단 메뉴, 사이드바, 드로어, 환영 배너 및 클린 서약 카드를 채워준다. index.html에서 호출.
function renderAuthUI(auth) {
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRoleBadge');
  const teacherCard = document.getElementById('teacherMenuCard');
  const teacherSection = document.getElementById('teacherSidebarSection');
  const drawerTeacher = document.getElementById('drawerTeacherMenuCard');
  const topNavTeacher = document.getElementById('topNavTeacherLibrary');
  const teacherBanner = document.getElementById('teacherWelcomeBanner');
  const adminCard = document.getElementById('adminMenuCard');
  const drawerAdmin = document.getElementById('drawerAdminMenuCard');

  const sidebarPledgeCard = document.getElementById('sidebarPledgeCard');
  const drawerPledgeCard = document.getElementById('drawerPledgeCard');
  const sidebarPledgeDate = document.getElementById('sidebarPledgeDate');
  const drawerPledgeDate = document.getElementById('drawerPledgeDate');

  if (nameEl) nameEl.textContent = auth.id;
  if (roleEl) {
    roleEl.textContent = auth.role === 'teacher' ? '교사' : auth.role === 'admin' ? '관리자' : '학부모';
  }

  // 좌측 메뉴 '당신은 서약서에 서명했습니다' 서약일 표기 (심리적 넛지)
  const pledge = getUserPledge(auth.id);
  const dateText = pledge ? `${pledge.date.split(' ')[0]} 서명 완료` : '2026.09.29 서명 완료';
  if (sidebarPledgeDate) sidebarPledgeDate.textContent = dateText;
  if (drawerPledgeDate) drawerPledgeDate.textContent = dateText;

  if (auth.role === 'teacher') {
    if (teacherCard) teacherCard.hidden = false;
    if (teacherSection) teacherSection.hidden = false;
    if (drawerTeacher) drawerTeacher.hidden = false;
    if (topNavTeacher) topNavTeacher.hidden = false;
    if (teacherBanner) teacherBanner.hidden = false;
  }
  if (auth.role === 'admin') {
    if (adminCard) adminCard.hidden = false;
    if (drawerAdmin) drawerAdmin.hidden = false;
  }
}
