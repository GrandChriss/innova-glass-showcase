import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Load all frame images and sort by filename.
const frameModules = import.meta.glob<string>(
  "../assets/sequence/*.webp",
  { eager: true, import: "default", query: "?url" },
);
const FRAME_URLS: string[] = Object.keys(frameModules)
  .sort()
  .map((k) => frameModules[k]);
const TOTAL_FRAMES = FRAME_URLS.length;

// Hero fazė užima šią bendro pinuoto scroll dalį — jos metu kadras stovi ties 0.
const HERO_FRACTION = 1 / 7;
const HERO_SCROLL_VH = 1;
const SEQUENCE_SCROLL_VH = 8;
const TOTAL_SCROLL_VH = HERO_SCROLL_VH + SEQUENCE_SCROLL_VH;

// Scenų kadrų ribos (1-based, kaip nurodė vartotojas):
// 1 Scena  1–100    Stalčiai
// 2 Scena  120–220  Cargo krepšys
// 3 Scena  240–340  Durelės ir lankstai
// 4 Scena  360–460  Automatinių pakeliamų durelių sistema
// 5 Scena  480–540  Produktai (be kortelės)
const STAGES = [
  {
    startFrame: 1,
    endFrame: 100,
    title: "Stalčiai",
    subtitle: "Tylaus uždarymo bėgeliai",
    text: "Aukščiausios kokybės Blum stalčių sistema su pilnu ištraukimu. Ergonomiškas uždarymas be triukšmo, atlaikantis iki 40 kg krovinį.",
  },
  {
    startFrame: 120,
    endFrame: 220,
    title: "Cargo krepšys",
    subtitle: "Maksimali talpa siauroje erdvėje",
    text: "Praktiškas siauras cargo modulis prieskoniams ir buteliams. Lengvai pasiekiamas iš abiejų pusių, su minkšto uždarymo mechanizmu.",
  },
  {
    startFrame: 240,
    endFrame: 340,
    title: "Durelės ir lankstai",
    subtitle: "110° kampo atidarymas",
    text: "Integruoti soft-close lankstai su 3D reguliavimu. Tiksli durelių linija, ilgaamžiškumas testuotas 80 000 atidarymo ciklų.",
  },
  {
    startFrame: 360,
    endFrame: 460,
    title: "Pakeliamos durelės",
    subtitle: "Aventos pakėlimo sistema",
    text: "Automatinė pakeliamų durelių sistema su pneumatiniais amortizatoriais. Lengvas valdymas vienu pirštu, sustojimas bet kuriame aukštyje.",
  },
];

// Kadras, nuo kurio prasideda 5-oji scena (be kortelės) — nuo čia slepiame korteles.
const CARDS_HIDE_FROM_FRAME = 470;

function drawImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f6ecd9";
  ctx.fillRect(0, 0, w, h);
  if (!img.complete || !img.naturalWidth) return;
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw = w;
  let dh = h;
  if (ir > cr) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

interface Props {
  /** Overlay virš kadrų. `heroP` — 0 pradžioje, 1 kai hero fazė baigta. */
  heroOverlay?: (heroP: number) => ReactNode;
}

export function ScrollSequence({ heroOverlay }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const stateRef = useRef({ frame: 0 });
  const [activeStage, setActiveStage] = useState(0);
  const [heroP, setHeroP] = useState(0);
  const [seqP, setSeqP] = useState(0); // 0 hero fazėje, > 0 kai prasideda sequence
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let done = 0;
    const imgs: HTMLImageElement[] = FRAME_URLS.map((url) => {
      const im = new Image();
      im.decoding = "async";
      im.src = url;
      im.onload = () => {
        if (cancelled) return;
        done += 1;
        setLoaded(done);
      };
      im.onerror = () => {
        done += 1;
        setLoaded(done);
      };
      return im;
    });
    imagesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const idx = Math.max(
        0,
        Math.min(TOTAL_FRAMES - 1, Math.round(stateRef.current.frame)),
      );
      const img = imagesRef.current[idx];
      if (img) drawImage(ctx, img, rect.width, rect.height);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      render();
    };
    resize();
    window.addEventListener("resize", resize);
    const interval = window.setInterval(render, 120);

    const stageFractions = STAGES.map((s) => s.frame / (TOTAL_FRAMES - 1));

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${window.innerHeight * TOTAL_SCROLL_VH}`,
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        if (p <= HERO_FRACTION) {
          const hp = p / HERO_FRACTION; // 0 → 1
          setHeroP(hp);
          setSeqP(0);
          stateRef.current.frame = 0;
          render();
        } else {
          setHeroP(1);
          const sp = (p - HERO_FRACTION) / (1 - HERO_FRACTION);
          setSeqP(sp);
          stateRef.current.frame = sp * (TOTAL_FRAMES - 1);
          render();
          let nearest = 0;
          let best = Infinity;
          stageFractions.forEach((sf, i) => {
            const d = Math.abs(sp - sf);
            if (d < best) {
              best = d;
              nearest = i;
            }
          });
          setActiveStage(nearest);
        }
      },
    });

    return () => {
      window.removeEventListener("resize", resize);
      window.clearInterval(interval);
      st.kill();
    };
  }, []);

  const progress = Math.round((loaded / TOTAL_FRAMES) * 100);
  const showStageUI = seqP > 0.01;

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-[#f6ecd9]"
      aria-label="Baldų funkcijų animacija"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Hero overlay virš to paties kadro — jokio fizinio perėjimo */}
      {heroOverlay && (
        <div className="pointer-events-none absolute inset-0 z-30">
          <div className="pointer-events-auto h-full w-full">
            {heroOverlay(heroP)}
          </div>
        </div>
      )}

      {loaded < TOTAL_FRAMES && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center">
          <div className="glass rounded-full px-4 py-2 text-xs font-semibold text-[var(--sonoma-deep)]">
            Kraunama… {progress}%
          </div>
        </div>
      )}

      {/* Stage pills — matomi tik sequence fazėje */}
      <div
        className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 transition-opacity duration-300"
        style={{ opacity: showStageUI ? 1 : 0 }}
      >
        <div className="glass flex items-center gap-1.5 rounded-full px-2 py-2 sm:gap-2 sm:px-3">
          {STAGES.map((s, i) => (
            <div
              key={s.title}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all sm:px-3 sm:text-xs ${
                i === activeStage
                  ? "bg-[var(--sonoma-deep)] text-[var(--cream-soft)]"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              {s.title}
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-end p-4 sm:items-center sm:p-10">
        {STAGES.map((s, i) => {
          const active = showStageUI && i === activeStage;
          return (
            <article
              key={s.title}
              aria-hidden={!active}
              className={`glass-strong pointer-events-auto absolute max-w-md rounded-3xl p-6 transition-all duration-700 ease-out sm:p-8 ${
                active
                  ? "translate-x-0 opacity-100"
                  : "translate-x-[120%] opacity-0"
              }`}
              style={{ right: "1rem", bottom: "1rem" }}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sonoma-deep)]">
                Etapas 0{i + 1}
              </div>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{s.title}</h3>
              <p className="mt-1 text-sm font-medium text-[var(--muted-foreground)]">
                {s.subtitle}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/85 sm:text-base">
                {s.text}
              </p>
            </article>
          );
        })}
      </div>

      <div
        className="pointer-events-none absolute bottom-4 left-4 z-20 transition-opacity duration-300"
        style={{ opacity: showStageUI ? 1 : 0 }}
      >
        <div className="glass rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:text-xs">
          Skrolinkite ↓
        </div>
      </div>
    </section>
  );
}
