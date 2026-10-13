-- ============================================================
-- 자람새 커뮤니티 DB 스키마 (Supabase SQL Editor 에 전체 붙여넣어 실행)
-- 글(posts) / 댓글(comments) / 좋아요(likes) 를 모든 방문자가 공유합니다.
-- ============================================================

create table if not exists posts (
  id            text primary key,              -- 클라이언트가 생성한 id (p + 타임스탬프)
  category      text not null default 'story',
  author        text not null,
  title         text not null,
  content       text not null,
  images        int  not null default 0,
  photos        jsonb not null default '[]',
  is_ad         boolean not null default false,
  hidden        boolean not null default false,
  expert_answer jsonb,
  reports       jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

create table if not exists comments (
  id         text primary key,
  post_id    text not null references posts(id) on delete cascade,
  author     text not null,
  content    text not null,
  helpful    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists likes (
  post_id    text not null references posts(id) on delete cascade,
  user_id    text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists posts_created_idx on posts (created_at desc);
create index if not exists posts_category_idx on posts (category);
create index if not exists comments_post_idx on comments (post_id);

-- ------------------------------------------------------------
-- 접근 정책 (RLS)
-- 글/댓글/좋아요는 모두가 읽을 수 있고, 누구나 쓸 수 있게 둡니다.
-- (출시 1단계: 전화번호 인증 등 계정 검증은 다음 단계에서 조이면 됩니다.
--  주의: 이 정책에서는 서버에 쓰기 권한이 열려 있으므로,
--  운영 시작 후에는 Supabase Auth 연동 + author 일치 검사로 강화하세요.)
-- ------------------------------------------------------------
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

create policy "posts_read"   on posts for select using (true);
create policy "posts_write"  on posts for insert with check (true);
create policy "posts_update" on posts for update using (true);

create policy "comments_read"  on comments for select using (true);
create policy "comments_write" on comments for insert with check (true);
create policy "comments_update" on comments for update using (true);

create policy "likes_read"  on likes for select using (true);
create policy "likes_write" on likes for insert with check (true);
create policy "likes_delete" on likes for delete using (true);
