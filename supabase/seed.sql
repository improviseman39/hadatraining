-- Seeds the 8 sessions + 4 announcements that previously lived in
-- src/data/sessions.ts / src/data/announcements.ts. Every session gets
-- exactly 2 content blocks (video, then pdf — both with a null url,
-- matching the "not yet uploaded" placeholder state every session is
-- currently in), preserving today's video-then-material reading order as
-- the new top-to-bottom stacked order.
--
-- Fixed literal UUIDs for readability in DBeaver. `on conflict (slug) do
-- nothing` makes rerunning against an already-seeded DB harmless. Once
-- real admin-authored content exists, stop treating `supabase db reset`
-- as routine — it drops and rebuilds the whole schema.

-- Session 1: Introduction (Foundations, free)
insert into public.sessions (id, slug, title, category, summary, duration, image_id, is_free, position)
values (
  '00000000-0000-0000-0000-000000000001',
  'introduction',
  'Introduction',
  'Foundations',
  'An orientation to the HADA curriculum, clinical philosophy, and what to expect across the eight-session program.',
  '25 min',
  '1576091160550-2173dba999ef',
  true,
  1
)
on conflict (slug) do nothing;

-- Session 2: Facial Anatomy (Foundations)
insert into public.sessions (id, slug, title, category, summary, duration, image_id, is_free, position)
values (
  '00000000-0000-0000-0000-000000000002',
  'facial-anatomy',
  'Facial Anatomy',
  'Foundations',
  'A layer-by-layer review of facial musculature, vasculature, and danger zones essential to safe aesthetic practice.',
  '55 min',
  '1559757148-5c350d0d3c56',
  false,
  2
)
on conflict (slug) do nothing;

-- Session 3: HA Filler (Injectables)
insert into public.sessions (id, slug, title, category, summary, duration, image_id, is_free, position)
values (
  '00000000-0000-0000-0000-000000000003',
  'ha-filler',
  'HA Filler',
  'Injectables',
  'Hyaluronic acid filler selection, injection technique, and volumizing strategy across the mid and lower face.',
  '60 min',
  '1512290923902-8a9f81dc236c',
  false,
  3
)
on conflict (slug) do nothing;

-- Session 4: Botox (Injectables)
insert into public.sessions (id, slug, title, category, summary, duration, image_id, is_free, position)
values (
  '00000000-0000-0000-0000-000000000004',
  'botox',
  'Botox',
  'Injectables',
  'Neuromodulator dosing, dilution, and site mapping for upper and lower face treatment protocols.',
  '50 min',
  '1584515979956-d9f6e5d09982',
  false,
  4
)
on conflict (slug) do nothing;

-- Session 5: HIFU (Devices)
insert into public.sessions (id, slug, title, category, summary, duration, image_id, is_free, position)
values (
  '00000000-0000-0000-0000-000000000005',
  'hifu',
  'HIFU',
  'Devices',
  'High-intensity focused ultrasound fundamentals: energy settings, depth targeting, and patient selection.',
  '40 min',
  '1629909613654-28e377c37b09',
  false,
  5
)
on conflict (slug) do nothing;

-- Session 6: Skin Booster (Injectables)
insert into public.sessions (id, slug, title, category, summary, duration, image_id, is_free, position)
values (
  '00000000-0000-0000-0000-000000000006',
  'skin-booster',
  'Skin Booster',
  'Injectables',
  'Microdroplet hydration therapy technique for skin quality, elasticity, and fine-line improvement.',
  '35 min',
  '1522337360788-8b13dee7a37e',
  false,
  6
)
on conflict (slug) do nothing;

-- Session 7: Mesofat (Injectables)
insert into public.sessions (id, slug, title, category, summary, duration, image_id, is_free, position)
values (
  '00000000-0000-0000-0000-000000000007',
  'mesofat',
  'Mesofat',
  'Injectables',
  'Localized fat-dissolving injection protocols, patient assessment, and post-treatment care.',
  '40 min',
  '1571019613454-1cb2f99b2d8b',
  false,
  7
)
on conflict (slug) do nothing;

-- Session 8: Precaution (Safety)
insert into public.sessions (id, slug, title, category, summary, duration, image_id, is_free, position)
values (
  '00000000-0000-0000-0000-000000000008',
  'precaution',
  'Precaution',
  'Safety',
  'Complication recognition, emergency management, and risk-mitigation protocols across all treatment modalities.',
  '45 min',
  '1579684385127-1ef15d508118',
  false,
  8
)
on conflict (slug) do nothing;

-- Two placeholder content blocks (video, then pdf) per session.
insert into public.content_blocks (session_id, type, position, title, video_url, pdf_url, body)
select s.id, blocks.type, blocks.position, blocks.title, null, null, null
from public.sessions s
cross join (
  values
    ('video', 1, 'Video lesson'),
    ('pdf',   2, 'Session material')
) as blocks(type, position, title)
where not exists (
  select 1 from public.content_blocks cb where cb.session_id = s.id
);

-- Announcements
insert into public.announcements (id, category, title, description, date, image_id, href, position)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'Seminar',
    'Advanced Injectables Masterclass — Live Q&A',
    'Join senior faculty for a live case-review session covering complex HA filler and neuromodulator planning.',
    '2026-08-04',
    '1620733723572-11c53f73a416',
    '/sessions/ha-filler',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'News',
    'New Faculty: Meet Our Newest Clinical Trainer',
    'HADA welcomes a new clinical trainer specializing in device-based treatments to the teaching faculty.',
    '2026-07-22',
    '1622253692010-333f2da6031d',
    null,
    2
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Event',
    'Emergency Protocols & Safety Workshop',
    'A hands-on workshop on complication recognition and emergency response, open to all enrolled students.',
    '2026-08-18',
    '1600959907703-125ba1374a12',
    '/sessions/precaution',
    3
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'Seminar',
    'HIFU Live Demo Day — Limited Seats',
    'See high-intensity focused ultrasound technique demonstrated live on-model, with Q&A on settings and depth targeting.',
    '2026-09-01',
    '1580281657702-257584239a55',
    '/sessions/hifu',
    4
  )
on conflict (id) do nothing;
