/* ============================================================
   자람새 커뮤니티 데이터 레이어 (store.js)
   ------------------------------------------------------------
   config.js 에 Supabase 키가 있으면 "서버 모드":
     모든 방문자가 같은 글/댓글/좋아요를 봅니다.
   키가 없으면 "데모 모드": 지금처럼 localStorage 만 사용합니다.

   기존 페이지 코드(data.js 의 동기 함수들)는 손대지 않아도 됩니다.
   - 서버 모드에서도 localStorage 를 캐시로 써서 그대로 렌더링
   - 페이지 로드 시 서버와 동기화(pull) 후 내용이 바뀌면
     window.onStoreRefresh() 를 호출해 화면을 다시 그립니다.
   - 글쓰기/댓글/좋아요는 기존 함수를 감싸서 서버에도 함께 기록
   ============================================================ */
(function () {
  'use strict';

  const cfg = window.JARAMSAE_CONFIG || {};
  const isServerMode = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);

  const store = {
    isServerMode,
    ready: false,       // 서버 pull 완료 여부
    lastError: null,
    syncNow: null,      // 수동 동기화 (서버 모드에서만)
  };
  window.JaramsaeStore = store;

  if (!isServerMode) return; // 데모 모드: 기존 localStorage 동작 그대로

  // ---------- Supabase 클라이언트 로드 ----------
  let clientPromise = null;
  function client() {
    if (!clientPromise) {
      clientPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload = () => {
          try {
            resolve(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey));
          } catch (e) { reject(e); }
        };
        s.onerror = () => reject(new Error('supabase-js 로드 실패'));
        document.head.appendChild(s);
      });
    }
    return clientPromise;
  }

  // ---------- 모양 변환: DB 행 -> data.js 게시글 객체 ----------
  function rowToPost(row, comments, likes) {
    return {
      id: row.id,
      category: row.category,
      author: row.author,
      title: row.title,
      content: row.content,
      date: row.created_at,
      images: row.images || 0,
      photos: row.photos || [],
      textAlign: 'center',
      isAd: Boolean(row.is_ad),
      hidden: Boolean(row.hidden),
      expertAnswer: row.expert_answer || undefined,
      reports: row.reports || [],
      likes: likes,
      comments: comments,
    };
  }

  function postToRow(p) {
    return {
      id: p.id,
      category: p.category,
      author: p.author,
      title: p.title,
      content: p.content,
      images: p.images || 0,
      photos: p.photos || [],
      is_ad: Boolean(p.isAd),
      hidden: Boolean(p.hidden),
      expert_answer: p.expertAnswer || null,
      reports: p.reports || [],
      created_at: p.date,
    };
  }

  // ---------- pull: 서버 -> localStorage 캐시 병합 ----------
  async function pull() {
    const sb = await client();
    const [postsRes, commentsRes, likesRes] = await Promise.all([
      sb.from('posts').select('*').order('created_at', { ascending: false }),
      sb.from('comments').select('*').order('created_at', { ascending: true }),
      sb.from('likes').select('*'),
    ]);
    if (postsRes.error) throw postsRes.error;

    const commentsByPost = {};
    (commentsRes.data || []).forEach((c) => {
      (commentsByPost[c.post_id] = commentsByPost[c.post_id] || []).push({
        id: c.id, author: c.author, content: c.content,
        date: c.created_at, helpful: Boolean(c.helpful),
      });
    });
    const likesByPost = {};
    (likesRes.data || []).forEach((l) => {
      (likesByPost[l.post_id] = likesByPost[l.post_id] || []).push(l.user_id);
    });

    const serverPosts = (postsRes.data || []).map((r) =>
      rowToPost(r, commentsByPost[r.id] || [], likesByPost[r.id] || [])
    );

    // 병합: 시드 글 + 서버 글 + (서버에 아직 없는) 로컬 사용자 글
    const local = loadPosts() || [];
    const seeds = seedPosts();
    const seedIds = new Set(seeds.map((p) => p.id));
    const serverIds = new Set(serverPosts.map((p) => p.id));
    const localOnly = local.filter((p) => !seedIds.has(p.id) && !serverIds.has(p.id));
    const merged = seeds.concat(serverPosts, localOnly);

    const before = JSON.stringify(local);
    savePosts(merged);
    const after = JSON.stringify(merged);
    return before !== after;
  }

  // ---------- push 래퍼: 기존 함수를 감싸 서버에도 기록 ----------
  function fireAndForget(promise) {
    promise.catch((e) => {
      store.lastError = e;
      console.warn('[자람새] 서버 기록 실패 (로컬에는 저장됨):', e);
    });
  }

  const _addPost = window.addPost;
  window.addPost = function (args) {
    const post = _addPost.call(this, args);
    fireAndForget(client().then((sb) => sb.from('posts').insert(postToRow(post))));
    return post;
  };

  const _addComment = window.addComment;
  window.addComment = function (id, payload) {
    const comment = _addComment.call(this, id, payload);
    if (comment) {
      fireAndForget(client().then((sb) => sb.from('comments').insert({
        id: comment.id, post_id: id, author: comment.author,
        content: comment.content, helpful: false, created_at: comment.date,
      })));
    }
    return comment;
  };

  const _toggleLike = window.toggleLike;
  window.toggleLike = function (id, userId) {
    const post = _toggleLike.call(this, id, userId);
    if (post) {
      const liked = (post.likes || []).includes(userId);
      fireAndForget(client().then((sb) => liked
        ? sb.from('likes').upsert({ post_id: id, user_id: userId })
        : sb.from('likes').delete().eq('post_id', id).eq('user_id', userId)
      ));
    }
    return post;
  };

  const _reportPost = window.reportPost;
  window.reportPost = function (id, userId, reason) {
    const post = _reportPost.call(this, id, userId, reason);
    if (post) {
      fireAndForget(client().then((sb) => sb.from('posts')
        .update({ reports: post.reports || [], hidden: Boolean(post.hidden) })
        .eq('id', id)));
    }
    return post;
  };

  // ---------- 초기 동기화 + 주기적 갱신 ----------
  async function refresh(notify) {
    try {
      const changed = await pull();
      store.ready = true;
      store.lastError = null;
      if (notify && changed && typeof window.onStoreRefresh === 'function') {
        window.onStoreRefresh();
      }
    } catch (e) {
      store.lastError = e;
      console.warn('[자람새] 서버 동기화 실패 (캐시로 표시 중):', e);
    }
  }
  store.syncNow = () => refresh(true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => refresh(true));
  } else {
    refresh(true);
  }
  // 다른 탭에서 올라온 새 글까지 반영 (30초 폴링 — 출시 후엔 Supabase Realtime 으로 교체 가능)
  setInterval(() => refresh(true), 30000);
})();
