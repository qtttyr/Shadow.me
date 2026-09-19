"use client";

const ITEMS = [
  "LinkedIn · 700M · 2021",
  "Facebook · 533M · 2019",
  "Adobe · 153M · 2013",
  "Canva · 137M · 2019",
  "Dubsmash · 162M · 2018",
  "Dropbox · 68M · 2012",
  "Twitter · 200M · 2023",
  "Zynga · 173M · 2019",
];

/** Бегущая строка реальных катастроф — фоновый пульс лендинга. */
export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="relative border-y border-ink/15 py-3 overflow-hidden bg-bone/60">
      <div className="marquee-track flex w-max whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="mono-label text-ink/45 mx-6 flex items-center gap-6">
            {item}
            <span className="text-ruby">×</span>
          </span>
        ))}
      </div>
    </div>
  );
}
