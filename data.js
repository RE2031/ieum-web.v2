/* 자람새 - 데모용 게시글 데이터 저장소 (실제 서버 없음, localStorage 기반) */
const POSTS_KEY = 'jaramsae_posts_v1';

const CATEGORIES = {
  story: { label: '최신 육아 이야기', desc: '이웃 부모들과 나누는 오늘의 육아 이야기', board: 'index.html' },
  guide: { label: '자람새 안내', desc: '공지사항 및 이용 가이드', board: 'board.html?cat=guide' },
  growth: { label: '성장 기록 연구소', desc: '아이의 소중한 순간 기록', board: 'board.html?cat=growth' },
  edu: { label: '집으로 이어지는 배움', desc: '육아 교육 및 추천 교구', board: 'board.html?cat=edu' },
  expert: { label: '전문가 Q&A', desc: '아이 발달·심리·훈육 고민을 전문가에게 직접 물어보세요', board: 'board.html?cat=expert' },
  share: { label: '지역별 나눔', desc: '이웃과 함께하는 육아 나눔', board: 'board.html?cat=share' },
};

const PHOTO_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>';

// 전문가 Q&A에 공식 답변을 달 수 있는, 관리자가 미리 등록해둔 전문가 명단(데모용).
// 실제 서비스에서는 자격증 확인 등을 거쳐 관리자가 등록하는 절차가 필요함.
const REGISTERED_EXPERTS = [
  { phone: '01011112222', name: '한소희', title: '마음이음 아동청소년정신건강의학과 · 전문의' },
  { phone: '01022223333', name: '이하늘', title: '소아언어발달센터 · 언어재활사 1급' },
  { phone: '01033334444', name: '정우진', title: '육아상담센터 마음숲 · 임상심리전문가' },
];

function findRegisteredExpert(phone) {
  return REGISTERED_EXPERTS.find((e) => e.phone === phone) || null;
}

// 실제 업로드 사진이 없는 데모 환경이라, 사진 대신 상황을 짐작할 수 있는
// 컬러 일러스트 타일을 보여준다. 게시글에 photos 배열이 없으면 DEFAULT_CYCLE을 순환해서 사용.
const PHOTO_TYPES = {
  steps: {
    bg: 'linear-gradient(135deg,#ffe4d6,#ffd3bd)', color: '#e8815a',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="8" cy="14" rx="3.2" ry="5.2" transform="rotate(-12 8 14)"/><ellipse cx="16" cy="10" rx="3.2" ry="5.2" transform="rotate(12 16 10)"/></svg>',
  },
  cry: {
    bg: 'linear-gradient(135deg,#e9e4fb,#d9d0f7)', color: '#8a6fd6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r=".8" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".8" fill="currentColor" stroke="none"/><path d="M8 16.5c1.5-1.5 6.5-1.5 8 0"/><path d="M9 12c-.4 1.4-.4 2.8-1.3 3.8"/></svg>',
  },
  dogpaw: {
    bg: 'linear-gradient(135deg,#f3e4d0,#e7cfae)', color: '#b9793a',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="16" rx="4.2" ry="3.2"/><circle cx="7.3" cy="9.3" r="1.6"/><circle cx="12" cy="7.3" r="1.7"/><circle cx="16.7" cy="9.3" r="1.6"/></svg>',
  },
  teether: {
    bg: 'linear-gradient(135deg,#dcebff,#c3ddff)', color: '#4f83d6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6"/></svg>',
  },
  bone: {
    bg: 'linear-gradient(135deg,#dff5ec,#c6ecdd)', color: '#3fa384',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="7.5" r="2"/><circle cx="7.5" cy="5.5" r="2"/><circle cx="16.5" cy="18.5" r="2"/><circle cx="18.5" cy="16.5" r="2"/><line x1="7.5" y1="7.5" x2="16.5" y2="16.5"/></svg>',
  },
  generic: {
    bg: 'linear-gradient(135deg,#e9ecf6,#dde1ef)', color: '#b7bdd4',
    icon: PHOTO_ICON_SVG,
  },
};
const DEFAULT_CYCLE = ['steps', 'dogpaw', 'teether', 'cry', 'bone', 'generic'];

function tileType(photos, i) {
  if (photos && photos.length) return PHOTO_TYPES[photos[i % photos.length]] || PHOTO_TYPES.generic;
  return PHOTO_TYPES[DEFAULT_CYCLE[i % DEFAULT_CYCLE.length]];
}

function tileHTML(type, extraCount, extraClass) {
  const cls = extraClass ? `img-tile ${extraClass}` : 'img-tile';
  const overlay = extraCount ? `<div class="more-count">+${extraCount}</div>` : '';
  return `<div class="${cls}" style="background:${type.bg};color:${type.color}">${type.icon}${overlay}</div>`;
}

function seedPosts() {
  const now = Date.now();
  const days = (n) => new Date(now - n * 86400000).toISOString();
  return [
    {
      id: 's1', category: 'story', author: '자람맘', date: days(0.2), images: 11,
      photos: ['steps', 'cry', 'dogpaw', 'teether', 'bone'],
      title: '오늘 드디어 첫 걸음마 뗐어요! 다들 언제쯤 걸었나요?',
      content:
        '아침에 아기 침대 붙잡고 서 있길래 그냥 지켜만 봤는데, 갑자기 손을 놓고 세 걸음이나 걸었어요. 너무 놀라서 소리 지르다가 오히려 아기가 놀라서 주저앉아 울어버렸네요.\n\n' +
        '오후에는 마당에서 아랫집 강아지랑 처음 만났는데 처음엔 무서워하다가 나중엔 손을 뻗어서 만져보려고 하더라고요. 이가 나기 시작해서 요즘 실리콘 치발기를 손에서 놓지 않는데, 오늘은 치발기 대신 강아지 발을 만지느라 정신이 없었습니다.\n\n' +
        '다른 분들은 첫 걸음마 몇 개월쯤에 떼셨는지 댓글로 알려주시면 감사하겠어요. 저희 아기는 이제 11개월 접어들었어요.',
      likes: ['이웃맘1', '토순이맘', '초보아빠'],
      comments: [
        { id: 'c1', author: '이웃맘1', content: '축하드려요! 저희 아이는 13개월쯤 걸었어요 :)', date: days(0.15) },
        { id: 'c2', author: '초보아빠', content: '와 11개월이면 빠른 편이네요! 부럽습니다 ㅎㅎ', date: days(0.1) },
      ],
    },
    {
      id: 's2', category: 'story', author: '자람맘', date: days(0.5), images: 7,
      photos: ['dogpaw', 'bone', 'cry', 'teether', 'dogpaw'],
      title: '아랫집 강아지랑 첫 만남, 저희 아이가 낯가림 심한데 괜찮을까요?',
      content:
        '평소에 낯가림이 심해서 걱정했는데 강아지한테는 의외로 마음을 빨리 열더라고요. 처음엔 소파에 앉아서 눈치만 보다가, 강아지가 먼저 다가오니까 손을 뻗어서 만져봤어요.\n\n' +
        '혹시 반려동물이랑 아기 처음 만나게 해주실 때 주의하신 점 있으면 공유 부탁드려요. 다음 주에도 다시 만나기로 했거든요.',
      likes: ['토순이맘'],
      comments: [
        { id: 'c3', author: '토순이맘', content: '천천히 거리 좁혀가시면 될 것 같아요! 강아지가 순한가 봐요~', date: days(0.4) },
      ],
    },
    {
      id: 's3', category: 'story', author: '초보아빠', date: days(1.3), images: 0,
      title: '낮잠을 통 안 자려는 15개월 아기, 다들 어떻게 재우세요?',
      content:
        '15개월인데 낮잠 시간만 되면 자지러지게 울면서 안 자려고 버팁니다. 재우는 타이밍을 못 맞추는 건지, 낮잠이 필요 없어진 건지 헷갈려서 여쭤봐요.\n\n' +
        '수면 교육을 다시 해야 하나 고민 중인데, 비슷한 경험 있으신 분들 방법 좀 알려주세요.',
      likes: [],
      comments: [],
    },
    {
      id: 'g1', category: 'guide', author: '자람새 운영팀', date: days(6), images: 0,
      title: '[필독] 자람새 서비스 이용 가이드',
      content:
        '안녕하세요, 자람새를 찾아주셔서 감사합니다. 처음 오신 분들을 위해 주요 메뉴를 간단히 안내드려요.\n\n' +
        '· 최신 육아 이야기: 이웃 부모님들과 일상 육아 이야기를 나누는 공간이에요.\n' +
        '· 성장 기록 연구소: 아이의 사진과 함께 성장 기록을 남길 수 있어요.\n' +
        '· 집으로 이어지는 배움: 저녁 메뉴 추천, 놀이 추천 등 육아 교육 콘텐츠를 만나보세요.\n' +
        '· 전문가 Q&A: 아이 발달·심리·훈육 고민을 전문가에게 직접 질문할 수 있는 공간이에요.\n' +
        '· 지역별 나눔: 이웃과 육아용품을 나누고 정보를 주고받는 공간이에요.\n\n' +
        '모든 게시판에서 자유롭게 글을 쓰실 수 있으니, 편하게 이용해주세요. 궁금하신 점은 언제든 댓글이나 문의로 남겨주세요.',
      likes: [], comments: [],
    },
    {
      id: 'g2', category: 'guide', author: '자람새 운영팀', date: days(0.3), images: 0,
      title: '[필독] 비교 없는 커뮤니티, 자람새가 지키는 원칙',
      content:
        '자람새는 다른 아이와 비교하거나 경쟁하지 않는, 각자의 속도를 응원하는 커뮤니티를 지향합니다. 아래 원칙을 꼭 지켜주세요.\n\n' +
        '1. 비교·경쟁 게시물 지양: 다른 아이와 발달 속도를 비교하거나 학습 경쟁을 유발하는 글은 삼가주세요. 알림장 문구 길이, 사진 수, 앨범 완성도 등을 비교하는 것도 포함돼요.\n' +
        '2. 비전문가의 낙인성 진단 금지: "우리 아이도 그랬는데 OO 같다", "심리 상담 받아봐야 한다" 같은 비전문가적 진단은 삼가주세요. 발달·심리 관련 고민은 전문가 Q&A를 이용해주세요.\n' +
        '3. 특정 교사·기관 비방 금지: 근거 없는 소문이나 마녀사냥성 게시물은 다른 이웃과 기관 모두에게 깊은 상처가 됩니다.\n' +
        '4. 광고성·위장 후기 금지: 특정 업체를 대가성으로 홍보하는 글은 사전 예고 없이 삭제될 수 있어요.\n' +
        '5. 아이 사진을 올리실 때는 개인정보(얼굴, 이름표 등) 노출에 유의해주세요.\n\n' +
        '부적절한 글을 보시면 언제든 신고해주세요. 자람새는 서로를 비교하지 않고 각자의 속도를 응원하는 공간이 되고자 합니다.',
      likes: [], comments: [],
    },
    {
      id: 'g3', category: 'guide', author: '자람새 운영팀', date: days(1), images: 0,
      title: '9월 정기 서버 점검 안내 (9/20 새벽 2시~4시)',
      content:
        '더 안정적인 서비스 제공을 위해 아래와 같이 정기 점검을 진행합니다.\n\n' +
        '· 점검 일시: 9월 20일 새벽 2:00 ~ 4:00 (2시간)\n' +
        '· 점검 내용: 서버 안정화 및 사진 업로드 속도 개선\n' +
        '· 점검 시간 동안에는 글쓰기, 로그인 등 모든 기능 이용이 일시적으로 제한됩니다.\n\n' +
        '이용에 불편을 드려 죄송하며, 더 나은 서비스로 찾아뵙겠습니다.',
      likes: [], comments: [],
    },
    {
      id: 'e1', category: 'expert', author: '걱정많은엄마', date: days(2.6), images: 0,
      title: '38개월 아이가 어린이집 갈 때마다 심하게 울어요. 분리불안일까요?',
      content:
        '요즘 어린이집 등원할 때마다 제 다리를 붙잡고 자지러지게 울어요. 몇 달 잘 다니다가 갑자기 이러니까 당황스럽고, 원에 가서도 한참을 울다가 그친다고 하더라고요. 밤에도 자다가 깨서 저를 찾는 일이 많아졌어요.\n\n' +
        '분리불안 같은데, 이 시기에 자연스러운 건지 아니면 전문 상담을 받아봐야 하는 건지 궁금합니다.',
      likes: ['이웃맘1', '토순이맘'],
      comments: [
        { id: 'c4', author: '걱정많은엄마', content: '답변 감사합니다! 말씀해주신 대로 인사를 짧게 하고 나오는 연습을 해볼게요.', date: days(2.3) },
      ],
      expertAnswer: {
        expert: '한소희 전문의',
        title: '마음이음 아동청소년정신건강의학과 · 전문의',
        date: days(2.5),
        content:
          '많이 걱정되셨겠어요. 36개월 전후 아이들에게 분리불안은 흔히 나타나는 정상적인 발달 과정이에요. 다만 몇 달 잘 적응하다가 갑자기 심해졌다면, 최근 환경 변화(동생 출생, 이사, 담임 교체 등)가 있었는지 먼저 살펴보시면 좋아요.\n\n' +
          '1) 등원 전 "엄마는 항상 데리러 온다"는 걸 짧고 일관된 말로 반복해서 안심시켜 주세요.\n' +
          '2) 헤어질 때 오래 머무르기보다 짧고 확실하게 인사하고 떠나는 게 아이 적응에 더 도움이 됩니다.\n' +
          '3) 밤에 자주 깨서 찾는 것도 함께 나타난다면, 낮 동안의 불안이 수면에도 영향을 준 것일 수 있어요.\n\n' +
          '2~3주 이상 지속되거나 일상생활(식사, 수면, 또래 관계)에 뚜렷한 지장이 있다면 소아정신건강의학과에서 직접 평가받아보시길 권해드려요.',
      },
    },
    {
      id: 'e2', category: 'expert', author: '느린거북맘', date: days(1.9), images: 0,
      title: '24개월인데 아직 두 단어 문장을 못 해요. 언어치료를 받아야 할까요?',
      content:
        '주변 또래 아이들은 "엄마 물 줘" 같은 문장을 하는데, 저희 아이는 아직 "엄마", "맘마", "빠빠" 같은 단어 몇 개만 말해요. 어린이집 선생님도 조금 늦는 편이라고 하시는데, 지금 언어치료를 시작해야 할지 조금 더 지켜봐야 할지 고민입니다.',
      likes: ['자람맘'],
      comments: [],
      expertAnswer: {
        expert: '이하늘 언어재활사',
        title: '소아언어발달센터 · 언어재활사 1급',
        date: days(1.8),
        content:
          '걱정되실 것 같아요. 24개월 기준으로 두 단어 조합이 아직 안 나온다면 언어발달을 한번 점검해볼 시기는 맞습니다. 다만 바로 치료가 필요하다는 뜻은 아니고, 정확한 평가가 먼저예요.\n\n' +
          '보건소나 소아청소년과에서 받을 수 있는 영유아 언어발달 선별검사를 먼저 받아보시길 권해드려요. 검사 결과 또래보다 유의미하게 늦다면 언어치료를 병행하시는 게 좋고, 경계선 수준이라면 그림책 함께 읽기, 아이 행동에 말 붙여주기 같은 상호작용만으로도 좋아지는 경우가 많습니다.\n\n' +
          '너무 걱정하지 마시고, 늦어도 3개월 안에는 꼭 한번 전문 평가를 받아보세요.',
      },
    },
    {
      id: 'e3', category: 'expert', author: '지친아빠', date: days(1), images: 0,
      title: '마트에서 드러눕고 떼쓰는 30개월 아기, 어떻게 훈육해야 할까요?',
      content:
        '요즘 마음에 안 들면 바닥에 드러눕고 소리를 지릅니다. 특히 마트에서 장난감 안 사준다고 그러면 사람들 시선도 있고 너무 당황스러운데, 그때마다 그냥 들어주게 돼요. 이렇게 계속 받아주면 버릇이 나빠질까 걱정입니다.',
      likes: ['초보아빠', '이웃맘1'],
      comments: [
        { id: 'c5', author: '지친아빠', content: '예고하고 일관되게 대응하는 게 핵심이군요. 오늘부터 해봐야겠어요 감사합니다!', date: days(0.7) },
      ],
      expertAnswer: {
        expert: '정우진 임상심리전문가',
        title: '육아상담센터 마음숲 · 임상심리전문가',
        date: days(0.9),
        content:
          '30개월 전후는 자기 뜻대로 안 되면 감정을 조절하기 어려운 시기라, 떼쓰기 자체는 정상적인 발달 과정이에요. 다만 지금처럼 매번 요구를 들어주면 "떼쓰면 통한다"는 학습이 될 수 있어서 일관된 대응이 중요합니다.\n\n' +
          '1) 마트 가기 전 "오늘은 장난감 안 사는 날이야"처럼 미리 규칙을 예고해주세요.\n' +
          '2) 떼쓰기가 시작되면 짧게 감정을 읽어주되("사고 싶었구나") 요구는 들어주지 마세요.\n' +
          '3) 진정된 후에 짧게 칭찬해주는 것도 도움이 됩니다.\n\n' +
          '공공장소 시선 때문에 힘드시겠지만, 지금 일관성을 유지하시는 게 장기적으로는 훨씬 편해지는 길이에요.',
      },
    },
    {
      id: 'e4', category: 'expert', author: '복직고민맘', date: days(0.2), images: 0,
      title: '육아휴직 중인데 회사에서 복직 시기를 앞당기라고 압박해요. 괜찮은 건가요?',
      content:
        '1년 육아휴직을 신청해서 사용 중인데, 회사에서 인력이 부족하다며 예정보다 3개월 일찍 복직해달라고 계속 연락이 옵니다. 법적으로 거부할 수 있는 건지, 응하지 않으면 불이익이 있을지 궁금합니다.',
      likes: [],
      comments: [],
    },
    {
      id: 'gw1', category: 'growth', author: '토순이맘', date: days(0.4), images: 4,
      photos: ['steps', 'teether', 'dogpaw', 'bone'],
      title: '14개월 아기 돌 이후 첫 발걸음과 치아 8개 달성 기록!',
      content:
        '지난달만 해도 기어다니기만 하더니, 이제는 제법 혼자서 거실을 종횡무진 걸어 다녀요. 오늘 치과 영유아 검진 다녀왔는데 어금니도 예쁘게 나오고 있다고 하네요. 작은 발자국 하나하나가 너무 기특하고 소중해서 사진으로 남겨둡니다.',
      likes: ['자람맘', '초보아빠'],
      comments: [
        { id: 'c_gw1', author: '자람맘', content: '우와 혼자 걷기 시작하면 정말 하루하루가 새롭죠! 축하드려요~', date: days(0.3) },
      ],
    },
    {
      id: 'ed1', category: 'edu', author: '행복한선생님', date: days(0.8), images: 3,
      photos: ['teether', 'generic', 'bone'],
      title: '집에서 오감 발달! 미역 촉감 놀이 & 물감 번지기 팁',
      content:
        '비 오는 날 집에서 아이와 무엇을 할지 고민이신 부모님들을 위해 준비했어요. 불린 미역을 욕조나 큰 김장 매트에 풀어놓고 조물조물 만지는 놀이는 촉각 자극과 소근육 발달에 최고랍니다. 미역 냄새가 부담된다면 쌀국수나 한천 젤리로 대체하셔도 좋아요.',
      likes: ['자람맘', '걱정많은엄마', '지친아빠'],
      comments: [
        { id: 'c_ed1', author: '초보아빠', content: '주말에 바로 시도해봐야겠네요! 좋은 팁 감사합니다.', date: days(0.5) },
      ],
    },
    {
      id: 'sh1', category: 'share', author: '나눔천사', date: days(1.1), images: 2,
      photos: ['generic', 'bone'],
      title: '[나눔] 원목 아기 식탁의자 & 그림책 세트 필요하신 분께 드려요',
      content:
        '아이가 훌쩍 자라서 이제 일반 의자에 앉게 되어, 깨끗하게 사용한 스토케 트립트랩 호환 원목 식탁의자와 보드북 10권을 나눔합니다. 직접 픽업 오실 수 있는 분이면 좋겠어요. 깨끗이 소독해 두었습니다.',
      likes: ['지친아빠'],
      comments: [
        { id: 'c_sh1', author: '초보아빠', content: '혹시 아직 나눔 가능할까요? 쪽지나 댓글 부탁드려요!', date: days(0.9) },
      ],
    },
  ];
}

function loadPosts() {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function savePosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

// 기본 제공 게시글(seedPosts의 id)은 항상 최신 정의로 덮어써서 내용이 바뀌면
// 기존 방문자 브라우저에도 반영되게 한다. 사용자가 직접 쓴 글(다른 id)은 그대로 둠.
function ensureSeeded() {
  const posts = loadPosts() || [];
  const seeds = seedPosts();
  const seedIds = new Set(seeds.map((p) => p.id));
  const userPosts = posts.filter((p) => !seedIds.has(p.id));
  savePosts(seeds.concat(userPosts));
}

function getAllPosts() {
  ensureSeeded();
  return loadPosts()
    .filter((p) => !p.hidden)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getPostsByCategory(cat) {
  ensureSeeded();
  return loadPosts()
    .filter((p) => p.category === cat && !p.hidden)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getPostById(id) {
  ensureSeeded();
  return loadPosts().find((p) => p.id === id) || null;
}

function addPost({ category, title, content, author, images, isAd, textAlign, photos }) {
  ensureSeeded();
  const posts = loadPosts();
  const post = {
    id: 'p' + Date.now(),
    category,
    title: title.trim(),
    content: content.trim(),
    author,
    date: new Date().toISOString(),
    images: Number(images) || (photos ? photos.length : 0),
    photos: photos || [],
    textAlign: textAlign || 'center',
    isAd: Boolean(isAd),
    likes: [],
    comments: [],
    reports: [],
    hidden: false,
  };
  posts.push(post);
  savePosts(posts);
  return post;
}

// 좋아요 토글. userId가 이미 눌렀으면 취소, 아니면 추가하고 최신 게시글을 반환.
function toggleLike(id, userId) {
  ensureSeeded();
  const posts = loadPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) return null;
  if (!post.likes) post.likes = [];
  const idx = post.likes.indexOf(userId);
  if (idx === -1) post.likes.push(userId);
  else post.likes.splice(idx, 1);
  savePosts(posts);
  return post;
}

function addComment(id, { author, content }) {
  ensureSeeded();
  const posts = loadPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) return null;
  if (!post.comments) post.comments = [];
  const comment = {
    id: 'c' + Date.now(),
    author,
    content: content.trim(),
    date: new Date().toISOString(),
    helpful: false,
  };
  post.comments.push(comment);
  savePosts(posts);
  return comment;
}

// 글쓴이가 댓글을 "도움이 됐어요"로 채택/해제. 반환값의 comment.helpful로
// 방향을 판단해 호출부에서 댓글 작성자의 신뢰도 점수를 조정한다.
function toggleCommentHelpful(postId, commentId) {
  ensureSeeded();
  const posts = loadPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  const comment = (post.comments || []).find((c) => c.id === commentId);
  if (!comment) return null;
  comment.helpful = !comment.helpful;
  savePosts(posts);
  return { post, comment };
}

// 신고 접수. 서로 다른 계정 3명 이상이 신고하면 자동으로 임시 비공개된다.
// (관리자가 없어도 즉시 확산을 막기 위한 1단계 방어선 - 실제 신뢰도 점수는 건드리지 않음)
const AUTO_HIDE_THRESHOLD = 3;

function reportPost(id, userId, reason) {
  ensureSeeded();
  const posts = loadPosts();
  const post = posts.find((p) => p.id === id);
  if (!post || !userId || post.author === userId || post.violationConfirmed) return null;
  if (!post.reports) post.reports = [];
  if (post.reports.some((r) => r.by === userId)) return post; // 중복 신고 무시
  post.reports.push({ by: userId, reason, date: new Date().toISOString() });
  if (post.reports.length >= AUTO_HIDE_THRESHOLD && !post.hidden) {
    post.hidden = true;
    post.hiddenAt = new Date().toISOString();
  }
  savePosts(posts);
  return post;
}

// 관리자 검토 대기 큐: 자동 비공개됐지만 아직 확정/해제 처리 안 된 글.
function getPendingReports() {
  ensureSeeded();
  return loadPosts()
    .filter((p) => p.hidden && !p.violationConfirmed)
    .sort((a, b) => new Date(a.hiddenAt || a.date) - new Date(b.hiddenAt || b.date));
}

// 관리자 처리: 'confirm'(위반 확정, 계속 비공개 + 신뢰도 차감은 호출부에서 처리) /
// 'dismiss'(문제없음, 비공개 해제하고 신고 기록 초기화).
function resolveReport(id, action) {
  ensureSeeded();
  const posts = loadPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) return null;
  if (action === 'dismiss') {
    post.hidden = false;
    post.reports = [];
    delete post.hiddenAt;
  } else if (action === 'confirm') {
    post.hidden = true;
    post.violationConfirmed = true;
  }
  savePosts(posts);
  return post;
}

// 등록된 전문가가 미답변 질문에 공식 답변을 등록.
function submitExpertAnswer(id, { expert, title, content }) {
  ensureSeeded();
  const posts = loadPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) return null;
  post.expertAnswer = {
    expert,
    title,
    content: content.trim(),
    date: new Date().toISOString(),
  };
  savePosts(posts);
  return post;
}

function formatDate(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  h = h % 12; if (h === 0) h = 12;
  return `${y}. ${m}. ${day}, ${ampm} ${h}:${min}`;
}

// 피드 카드용 미니 갤러리 HTML (5장까지 보여주고 나머지는 "+N")
function galleryHTML(imageCount, photos) {
  if (!imageCount) return '';
  if (imageCount >= 5) {
    const extra = imageCount - 5;
    let tiles = '';
    for (let i = 0; i < 5; i++) {
      tiles += tileHTML(tileType(photos, i), i === 4 ? extra : 0);
    }
    return `<div class="gallery-feature">${tiles}</div>`;
  }
  let tiles = '';
  for (let i = 0; i < imageCount; i++) {
    tiles += tileHTML(tileType(photos, i));
  }
  return `<div class="gallery-strip" style="grid-template-columns:repeat(${imageCount},1fr)">${tiles}</div>`;
}

// 상세 페이지용 큰 갤러리 (있는 만큼 모두 표시)
function galleryHTMLDetail(imageCount, photos) {
  if (!imageCount) return '';
  let tiles = '';
  for (let i = 0; i < imageCount; i++) {
    tiles += tileHTML(tileType(photos, i), 0, 'detail-tile');
  }
  return `<div class="gallery-detail">${tiles}</div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
