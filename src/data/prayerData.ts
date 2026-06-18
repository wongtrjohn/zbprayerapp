import type { PrayerRequest } from "@/types";

/**
 * Curated prayer dataset for Zion Bishan, organised under the three filters:
 * Our Church (Home Missions), Our People (leaders & community), and
 * Our World (Foreign Missions / mission partners).
 *
 * The first entries in each category mirror the live bulletin's "Prayer Points"
 * (https://www.zionbishan.org.sg/services/english/bulletins/latest/). When
 * Supabase + the /api/bulletin scraper are wired up, these become the offline
 * fallback. Until then the app runs entirely on this file.
 *
 * Add or edit points freely — `featured: true` marks an entry as a candidate
 * for the home-page "This week's prayer focus" cards (one per category).
 */
export const curatedPrayers: PrayerRequest[] = [
  // ----------------------------------------------------------------- Our People
  {
    id: "people-j-and-sa",
    seedPrayers: 86,
    title: "J and SA — Mindanao earthquake",
    category: "our-people",
    subcategory: "community",
    description:
      "Sister SA and her husband were caught up in the 7.8-magnitude earthquake that struck Mindanao, Philippines on 8 June, which claimed 41 lives. By God's grace they were unharmed.",
    prayerPoints: [
      "Thanksgiving that SA and her husband were kept safe",
      "Comfort and provision for families who lost loved ones",
      "Strength for the relief and rebuilding effort in the region",
    ],
    source: "Zion Bishan Bulletin",
    sourceUrl: "https://www.zionbishan.org.sg/services/english/bulletins/latest/",
    featured: true,
    weekOf: "2026-06-15",
  },
  {
    id: "people-church-leaders",
    seedPrayers: 142,
    title: "Our pastors and ministry leaders",
    category: "our-people",
    subcategory: "church-leaders",
    description:
      "Uphold the pastoral team, elders, deacons and ministry leaders as they shepherd the congregation, preach the Word and care for those in need.",
    prayerPoints: [
      "Wisdom, health and spiritual covering for the pastoral team",
      "Unity and clear direction among the elders and deacons",
      "Renewed strength for leaders serving across the ministries",
    ],
    source: "Zion Bishan Bulletin",
    featured: false,
    weekOf: "2026-06-15",
  },

  // ----------------------------------------------------------------- Our Church
  {
    id: "church-zbcs-camp",
    seedPrayers: 97,
    title: "ZBCS Camp in Batam",
    category: "our-church",
    subcategory: "events",
    description:
      "97 participants are attending the Zion Bishan Chinese Services (ZBCS) camp in Batam from 19–22 June, with messages brought by Preacher Jacky Chua.",
    prayerPoints: [
      "Travelling mercies and safety for all 97 participants",
      "That the messages by Preacher Jacky Chua would speak deeply",
      "Real encounters with God and lasting spiritual fruit",
    ],
    source: "Zion Bishan Bulletin",
    sourceUrl: "https://www.zionbishan.org.sg/services/english/bulletins/latest/",
    featured: true,
    weekOf: "2026-06-15",
  },
  {
    id: "church-tuition-ministry",
    seedPrayers: 54,
    title: "Tuition Ministry",
    category: "our-church",
    subcategory: "tuition-ministry",
    description:
      "Our tuition ministry serves students from the neighbourhood, offering academic help and a caring Christian presence to families in the community.",
    prayerPoints: [
      "Tutors who serve faithfully and build genuine relationships",
      "Students to grow in confidence, character and faith",
      "Open doors into the families being served",
    ],
    source: "Zion Bishan Ministries",
    featured: false,
  },
  {
    id: "church-terusan-ministry",
    seedPrayers: 38,
    title: "Terusan Ministry",
    category: "our-church",
    subcategory: "terusan-ministry",
    description:
      "Pray for the Terusan ministry and the people it reaches, that the love of Christ would be made known through its ongoing work.",
    prayerPoints: [
      "Faithfulness and unity among the ministry workers",
      "Fruitful outreach and discipleship",
      "Provision of resources and volunteers",
    ],
    source: "Zion Bishan Ministries",
    featured: false,
  },

  // ------------------------------------------------------------------ Our World
  {
    id: "world-smo-bacolod",
    seedPrayers: 73,
    title: "SMO mission partner — Bacolod City",
    category: "our-world",
    subcategory: "mission-partners",
    description:
      "Our former ministry partner SMO (Student Missionary Outreach) in Bacolod City grieves Jay Ligutan, an SMO alumnus and teacher who died in the Mindanao earthquake while trapped under warehouse debris.",
    prayerPoints: [
      "God's comfort for Jay Ligutan's family",
      "Comfort for his fiancée, daughter of Pastor Elmer Polo",
      "Strength and continued gospel witness for the SMO team",
    ],
    source: "Zion Bishan Bulletin",
    sourceUrl: "https://www.zionbishan.org.sg/services/english/bulletins/latest/",
    featured: true,
    weekOf: "2026-06-15",
  },
];
