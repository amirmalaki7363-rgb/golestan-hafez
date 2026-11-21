import Image from "next/image";
import { Reveal } from "./reveal";

const CONTACTS: { term: string; value: string; href?: string }[] = [
  { term: "استور تهران :", value: "دیباجی" },
  { term: "استور اصفهان :", value: "شیخ صدوق" },
  { term: "اپراتور فروش :", value: "09127385527", href: "tel:09127385527" },
];

/** Organizations the studio has collaborated with — shown in the footer strip. */
const PARTNERS: { name: string; logo: string }[] = [
  { name: "بانک ملی ایران", logo: "/images/logos/bank-melli-official.png" },
  { name: "آتش‌نشانی تهران", logo: "/images/logos/tehran-fire-official.png" },
  { name: "مرکز تصویربرداری آرینا", logo: "/images/logos/ariana-film.png" },
  { name: "شرکت نفت ایران", logo: "/images/logos/iran-oil-official.png" },
];

const MOMENTS = ["روز پدر", "روز مادر", "ولنتاین", "کریسمس", "یلدا", "عید"];
const SEASONS = ["Spring Collection", "Summer Collection", "Autumn Collection", "Winter Collection"];
const WORLD = ["بلاگ", "درباره گلستان حافظ", "تماس با ما", "سوالات پرتکرار", "همکاری سازمانی"];

function FooterColumn({
  title,
  children,
  latin,
}: {
  title: string;
  children: React.ReactNode;
  latin?: boolean;
}) {
  return (
    <div className="border-border/60 px-4 md:border-s md:px-6 [&:first-child]:md:border-s-0">
      <h3 className={`mb-5 text-[14px] font-medium text-cream ${latin ? "font-latin whitespace-nowrap" : ""}`}>
        {title}
      </h3>
      {children}
    </div>
  );
}

const footerLink =
  "block py-[7px] text-[13.5px] font-light text-cream/65 transition-colors hover:text-cream";

export function Footer() {
  return (
    <footer className="mt-auto bg-earth-dark text-cream">
      <div className="mx-auto max-w-[1220px] px-6 pt-16 md:px-10 md:pt-20">
        <Reveal>
          <p
            dir="ltr"
            className="font-latin mb-14 text-right text-[17px] tracking-[0.6em] text-cream/95"
          >
            GOLESTANE HAFEZ
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr] lg:gap-0">
          {/* Contact — visually rightmost (first in rtl) */}
          <FooterColumn title="تماس با استور گلستان حافظ">
            <dl className="space-y-[13px]">
              {CONTACTS.map((c) => (
                <div key={c.term} className="flex items-baseline justify-between gap-4">
                  <dt className="shrink-0 text-[12.5px] font-light text-muted-foreground">
                    {c.term}
                  </dt>
                  <dd className="text-left text-[13px] font-light">
                    {c.href ? (
                      <a
                        href={c.href}
                        dir={c.href.startsWith("tel") ? "ltr" : undefined}
                        className="font-latin transition-colors hover:text-cream text-cream/85"
                      >
                        {c.value}
                      </a>
                    ) : (
                      <span className="text-cream/85">{c.value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </FooterColumn>

          <FooterColumn title="Golestane Hafez Moments" latin>
            <ul>
              {MOMENTS.map((m) => (
                <li key={m}>
                  <a href="#occasions" className={footerLink}>
                    {m}
                  </a>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn title="Golestane Hafez Seasons" latin>
            <ul>
              {SEASONS.map((s) => (
                <li key={s}>
                  <a href="#collections" className={`${footerLink} font-latin`}>
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </FooterColumn>

          <FooterColumn title="Golestane Hafez World" latin>
            <ul>
              {WORLD.map((w) => (
                <li key={w}>
                  <a href="#top" className={footerLink}>
                    {w}
                  </a>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Trust badge placeholder — visually leftmost */}
          <div className="px-4 md:px-6">
            <h3 className="sr-only">نماد اعتماد الکترونیکی</h3>
            <div className="flex h-[110px] w-[92px] items-center justify-center rounded border border-dashed border-cream/25 p-2 text-center">
              <span className="text-[10px] leading-relaxed text-muted-foreground">
                نماد اعتماد
                <br />
                الکترونیکی
              </span>
            </div>
          </div>
        </div>

        {/* collaboration strip — organizations the studio works with */}
        <Reveal>
          <div className="border-t border-border/60 py-10 md:py-12">
            <h3 className="mb-8 text-center text-[13.5px] font-light tracking-wide text-cream/80">
              همکاری گلستان حافظ با سازمان‌های زیر
            </h3>
            <ul className="flex flex-wrap items-start justify-center gap-x-8 gap-y-7 sm:gap-x-14">
              {PARTNERS.map((p) => (
                <li key={p.name} className="flex flex-col items-center gap-2.5">
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white p-2.5 transition-transform duration-300 hover:scale-105 md:h-[76px] md:w-[76px]">
                    <Image
                      src={p.logo}
                      alt={`لوگوی ${p.name}`}
                      width={128}
                      height={128}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="text-center text-[11px] font-light leading-5 text-cream/70">
                    {p.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 py-6 text-[12px] font-light text-muted-foreground sm:flex-row">
          <p>تمامی حقوق سایت متعلق به استودیو گل گلستان حافظ است.</p>
          <p>
            توسعه یافته توسط{" "}
            <span className="font-latin tracking-wider text-cream/75">
              Golestane Hafez Studio
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
