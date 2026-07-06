import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScrollSequence, type ScrollSequenceHandle } from "@/components/ScrollSequence";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "INNOVA BALDAI — Modernūs baldai su Liquid Glass dizainu" },
      {
        name: "description",
        content:
          "INNOVA BALDAI — kokybiški virtuvės ir spintų baldai. Stalčiai, cargo sistemos, lankstai ir pakeliamos durelės. Sonoma medis, švelnios pastelinės spalvos.",
      },
      { property: "og:title", content: "INNOVA BALDAI" },
      {
        property: "og:description",
        content: "Modernūs baldai su pažangiomis mechanizmų sistemomis.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  // Nav stiliaus progresas — grubiai sekamas pagal scrollY (per pirmus ~120vh).
  const [navP, setNavP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = window.innerHeight;
      const y = Math.min(Math.max(window.scrollY, 0), h);
      setNavP(y / h);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const navBg = 0.72 - navP * 0.42;
  const navBlur = 14 + navP * 22;

  return (
    <main className="relative">
      {/* Floating glass nav */}
      <header className="fixed left-1/2 top-4 z-50 w-[min(94%,960px)] -translate-x-1/2">
        <nav
          className="flex items-center justify-between rounded-full px-4 py-2.5 sm:px-6 sm:py-3 transition-[background-color,backdrop-filter] duration-300"
          style={{
            backgroundColor: `rgba(255,255,255,${navBg})`,
            backdropFilter: `blur(${navBlur}px) saturate(${140 + navP * 40}%)`,
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "var(--shadow-glass)",
          }}
        >
          <a
            href="#top"
            className="flex items-center gap-2 text-sm font-extrabold tracking-tight sm:text-base"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--sonoma-deep)] text-[var(--cream-soft)] text-[11px] font-black">
              IB
            </span>
            <span className="truncate">INNOVA BALDAI</span>
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {[
              ["Sprendimai", "#sequence"],
              ["Privalumai", "#features"],
              ["Kontaktai", "#contact"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-white/40 hover:text-[var(--foreground)]"
              >
                {label}
              </a>
            ))}
          </div>
          <a
            href="#contact"
            className="glass rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm"
          >
            Konsultacija
          </a>
        </nav>
      </header>

      {/* HERO + Canvas sequence — viena pinuota sekcija, be perėjimo */}
      <div id="top" />
      <div id="sequence">
        <ScrollSequence
          heroOverlay={(p) => {
            // p: 0 pradžioje (blur + tekstai), 1 kai matomas grynas kadras.
            const blurPx = (1 - p) * 22.4;
            const contentOpacity = Math.max(0, 1 - p * 1.4);
            const contentTranslate = -p * 160;
            return (
              <div className="relative h-full w-full">
                {/* Blur perdanga virš kadro */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backdropFilter: `blur(${blurPx}px) saturate(105%)`,
                    WebkitBackdropFilter: `blur(${blurPx}px) saturate(105%)`,
                  }}
                />
                {/* Šiltas cream overlay */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(246,236,217,0.55) 0%, rgba(246,236,217,0.25) 45%, rgba(246,236,217,0.1) 100%)",
                    opacity: 0.85 - p * 0.7,
                  }}
                />

                {/* Hero turinys */}
                <div
                  className="relative z-10 flex h-full w-full items-center justify-center px-4"
                  style={{
                    opacity: contentOpacity,
                    transform: `translate3d(0, ${contentTranslate}px, 0)`,
                    willChange: "transform, opacity",
                    pointerEvents: contentOpacity < 0.05 ? "none" : "auto",
                  }}
                >
                  <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
                    <span className="glass mb-6 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--sonoma-deep)] sm:text-xs">
                      Lietuviški baldai • 2008
                    </span>

                    <h1 className="font-extrabold leading-[0.85] tracking-tight text-[var(--foreground)] [text-shadow:0_2px_30px_rgba(255,255,255,0.6)]">
                      <span className="block text-[clamp(3rem,14vw,10rem)]">
                        INNOVA
                      </span>
                      <span
                        className="block text-[clamp(2.5rem,12vw,8.5rem)] italic"
                        style={{
                          background: "var(--gradient-sonoma)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        BALDAI
                      </span>
                    </h1>

                    <p className="mt-8 max-w-xl text-base text-[var(--foreground)]/85 sm:text-lg [text-shadow:0_1px_18px_rgba(255,255,255,0.7)]">
                      Sonoma ąžuolas, kreminiai paviršiai ir pažangūs vokiški
                      mechanizmai — baldai, kurie tarnauja kasdien ir veikia
                      kaip tobula mašina.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
                      <a
                        href="#sequence"
                        className="rounded-full bg-[var(--sonoma-deep)] px-8 py-4 text-sm font-semibold text-[var(--cream-soft)] shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 sm:text-base"
                      >
                        Pažiūrėti, kaip veikia →
                      </a>
                      <a
                        href="#contact"
                        className="glass rounded-full px-8 py-4 text-sm font-semibold sm:text-base"
                      >
                        Užsisakyti matavimus
                      </a>
                    </div>
                  </div>
                </div>

                <div
                  className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--foreground)]/70"
                  style={{ opacity: contentOpacity }}
                >
                  Skrolinkite žemyn
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Features grid */}
      <section id="features" className="px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sonoma-deep)]">
              Kodėl INNOVA
            </span>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Inžinerija slypi detalėse.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                t: "Vokiški mechanizmai",
                d: "Blum, Hettich ir Aventos sistemos — 25 metų garantija mechanizmams.",
              },
              {
                t: "Sonoma ąžuolas",
                d: "Natūralios tekstūros laminatas, atsparus drėgmei ir įbrėžimams.",
              },
              {
                t: "3D vizualizacija",
                d: "Pamatysite savo baldus prieš gamybą — be staigmenų ir nesusipratimų.",
              },
              {
                t: "Gamyba per 14 d.",
                d: "Sava gamykla Lietuvoje, trumpiausi terminai rinkoje.",
              },
              {
                t: "Tylus uždarymas",
                d: "Visi stalčiai ir durelės su soft-close standartiškai.",
              },
              {
                t: "Modulinis dizainas",
                d: "Pritaikoma bet kuriai erdvei — nuo 4 iki 40 kv. m.",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="glass rounded-3xl p-6 transition-transform hover:-translate-y-1"
              >
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-[var(--sonoma)]/40 text-[var(--sonoma-deep)] font-black">
                  ✦
                </div>
                <h3 className="text-lg font-bold">{f.t}</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {f.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="glass-strong relative overflow-hidden rounded-[2rem] p-8 sm:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-60 blur-3xl"
              style={{ background: "var(--gradient-sonoma)" }}
            />
            <div className="relative grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
              <div>
                <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                  Pradėkime nuo nemokamų matavimų.
                </h2>
                <p className="mt-4 max-w-md text-[var(--muted-foreground)]">
                  Mūsų dizaineris atvyks, išmatuos erdvę ir per 3 dienas paruoš
                  3D projektą bei sąmatą.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href="tel:+37060000000"
                  className="glass flex items-center justify-between rounded-2xl px-5 py-4"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Telefonu
                  </span>
                  <span className="font-bold">+370 600 00 000</span>
                </a>
                <a
                  href="mailto:info@innovabaldai.lt"
                  className="glass flex items-center justify-between rounded-2xl px-5 py-4"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    El. paštu
                  </span>
                  <span className="font-bold">info@innovabaldai.lt</span>
                </a>
                <a
                  href="#"
                  className="rounded-2xl bg-[var(--sonoma-deep)] px-5 py-4 text-center font-semibold text-[var(--cream-soft)]"
                >
                  Užpildyti užklausą →
                </a>
              </div>
            </div>
          </div>

          <footer className="mt-10 flex flex-col items-center justify-between gap-3 text-xs text-[var(--muted-foreground)] sm:flex-row">
            <span>
              © {new Date().getFullYear()} INNOVA BALDAI. Visos teisės saugomos.
            </span>
            <span>Vilnius • Kaunas • Klaipėda</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
