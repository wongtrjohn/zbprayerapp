-- ZBPrayerApp — seed data (mirrors src/data/prayerData.ts)
-- Run AFTER 00001_initial_schema.sql. Safe to re-run (upserts on title+week_of).
-- All seeded rows are 'approved' so they show immediately.

insert into public.prayer_requests
  (title, category, subcategory, description, prayer_points, source, source_url, featured, prayer_count, week_of, status)
values
  (
    'J and SA — Mindanao earthquake',
    'our-people', 'community',
    'Sister SA and her husband were caught up in the 7.8-magnitude earthquake that struck Mindanao, Philippines on 8 June, which claimed 41 lives. By God''s grace they were unharmed.',
    array[
      'Thanksgiving that SA and her husband were kept safe',
      'Comfort and provision for families who lost loved ones',
      'Strength for the relief and rebuilding effort in the region'
    ],
    'Zion Bishan Bulletin', 'https://www.zionbishan.org.sg/services/english/bulletins/latest/',
    true, 86, date '2026-06-15', 'approved'
  ),
  (
    'Our pastors and ministry leaders',
    'our-people', 'church-leaders',
    'Uphold the pastoral team, elders, deacons and ministry leaders as they shepherd the congregation, preach the Word and care for those in need.',
    array[
      'Wisdom, health and spiritual covering for the pastoral team',
      'Unity and clear direction among the elders and deacons',
      'Renewed strength for leaders serving across the ministries'
    ],
    'Zion Bishan Bulletin', null, false, 142, date '2026-06-15', 'approved'
  ),
  (
    'ZBCS Camp in Batam',
    'our-church', 'events',
    '97 participants are attending the Zion Bishan Chinese Services (ZBCS) camp in Batam from 19-22 June, with messages brought by Preacher Jacky Chua.',
    array[
      'Travelling mercies and safety for all 97 participants',
      'That the messages by Preacher Jacky Chua would speak deeply',
      'Real encounters with God and lasting spiritual fruit'
    ],
    'Zion Bishan Bulletin', 'https://www.zionbishan.org.sg/services/english/bulletins/latest/',
    true, 97, date '2026-06-15', 'approved'
  ),
  (
    'Tuition Ministry',
    'our-church', 'tuition-ministry',
    'Our tuition ministry serves students from the neighbourhood, offering academic help and a caring Christian presence to families in the community.',
    array[
      'Tutors who serve faithfully and build genuine relationships',
      'Students to grow in confidence, character and faith',
      'Open doors into the families being served'
    ],
    'Zion Bishan Ministries', null, false, 54, null, 'approved'
  ),
  (
    'Terusan Ministry',
    'our-church', 'terusan-ministry',
    'Pray for the Terusan ministry and the people it reaches, that the love of Christ would be made known through its ongoing work.',
    array[
      'Faithfulness and unity among the ministry workers',
      'Fruitful outreach and discipleship',
      'Provision of resources and volunteers'
    ],
    'Zion Bishan Ministries', null, false, 38, null, 'approved'
  ),
  (
    'SMO mission partner — Bacolod City',
    'our-world', 'mission-partners',
    'Our former ministry partner SMO (Student Missionary Outreach) in Bacolod City grieves Jay Ligutan, an SMO alumnus and teacher who died in the Mindanao earthquake while trapped under warehouse debris.',
    array[
      'God''s comfort for Jay Ligutan''s family',
      'Comfort for his fiancée, daughter of Pastor Elmer Polo',
      'Strength and continued gospel witness for the SMO team'
    ],
    'Zion Bishan Bulletin', 'https://www.zionbishan.org.sg/services/english/bulletins/latest/',
    true, 73, date '2026-06-15', 'approved'
  )
on conflict (title, week_of) do nothing;
