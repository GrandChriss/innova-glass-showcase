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
// Hero + 1-oji scena sudaro pirmą snap segmentą: blur išnyksta ir 1 scena grojama vienu skrolo judesiu.
const HERO_FRACTION = 1 / 7;
const HERO_SCROLL_VH = 1;
const SEQUENCE_SCROLL_VH = 8;
const TOTAL_SCROLL_VH = HERO_SCROLL_VH + SEQUENCE_SCROLL_VH;

// Scenų kadrų ribos (1-based). Pauzės tarp scenų praleidžiamos scroll’o metu.
const STAGES = [
  {
    startFrame: 1,
    endFrame: 100,
    cardStartFrame: 79, // +1 kadrą ilgiau nei anksčiau
    cardEndFrame: 100,
    title: "Stalčiai",
    subtitle: "Tylaus uždarymo bėgeliai",
    text: "Aukščiausios kokybės Blum stalčių sistema su pilnu ištraukimu. Ergonomiškas uždarymas be triukšmo, atlaikantis iki 40 kg krovinį.",
  },
  {
    startFrame: 120,
    endFrame: 220,
    cardStartFrame: 199,
    cardEndFrame: 220,
    title: "Cargo krepšys",
    subtitle: "Maksimali talpa siauroje erdvėje",
    text: "Praktiškas siauras cargo modulis prieskoniams ir buteliams. Lengvai pasiekiamas iš abiejų pusių, su minkšto uždarymo mechanizmu.",
  },
  {
    startFrame: 240,
    endFrame: 340,
    cardStartFrame: 319,
    cardEndFrame: 340,
    title: "Durelės ir lankstai",
    subtitle: "110° kampo atidarymas",
    text: "Integruoti soft-close lankstai su 3D reguliavimu. Tiksli durelių linija, ilgaamžiškumas testuotas 80 000 atidarymo ciklų.",
  },
  {
    startFrame: 360,
    endFrame: 460,
    cardStartFrame: 439,
    cardEndFrame: 460,
    title: "Pakeliamos durelės",
    subtitle: "Aventos pakėlimo sistema",
    text: "Automatinė pakeliamų durelių sistema su pneumatiniais amortizatoriais. Lengvas valdymas vienu pirštu, sustojimas bet kuriame aukštyje.",
  },
  {
    // 5-oji scena — produktai (be teksto kortelės; glow + pirkimo kortelės žemiau).
    startFrame: 480,
    endFrame: 560,
    cardStartFrame: -1,
    cardEndFrame: -1,
    title: "Produktai",
    subtitle: "",
    text: "",
  },
];

// Sujungtos scenos (praleidžiant pauzes) — virtualus kadrų srautas scroll mapping’ui.
const SCENE_LENGTHS = STAGES.map((s) => s.endFrame - s.startFrame + 1);
const TOTAL_SCENE_FRAMES = SCENE_LENGTHS.reduce((a, b) => a + b, 0);

// 5-oji scena — produktai pardavimui (butelis + šluostės). Glow + kortelės atsiranda nuo 540 kadro iki galo.
const PRODUCTS_START_FRAME = 540;
const PRODUCTS_END_FRAME = 560;

// Objektų padėtys pačiame paskutiniame (560) kadre, image-relative koordinatėse (0..1 nuo 1920x1080).
// Reikšmės nuskaitytos iš paskutinio kadro (butelis kairėje, šluostės centre-dešinėje).
const BOTTLE = { cx: 0.193, cy: 0.481, w: 0.09, h: 0.42 };
const CLOTHS = { cx: 0.599, cy: 0.593, w: 0.22, h: 0.24 };

const PRODUCTS = [
  {
    name: "Baldų valiklis 500ml",
    tagline: "Sonoma paviršiams",
    desc: "Švelnus pH-neutralus valiklis, saugus laminuotiems ir natūralios medienos paviršiams. Nepalieka dryžių, atgaivina spalvą ir sukuria apsauginį sluoksnį nuo pirštų atspaudų.",
    price: "14,90 €",
  },
  {
    name: "Mikropluošto šluostės (2 vnt.)",
    tagline: "Anti-scratch komplektas",
    desc: "Ilgapluoštės mikrofibros šluostės specialiai baldų fasadams. Nepalieka žymių, plaunamos iki 300 kartų. Viena sausam blizginimui, kita drėgnam valymui.",
    price: "8,50 €",
  },
];

// Frame aspect ratio (visi kadrai 1920x1080).
const FRAME_AR = 16 / 9;

interface DrawnRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Grąžina, kaip 16:9 kadras yra faktiškai atvaizduotas ant kanvo su "cover" logika. */
function computeDrawnRect(w: number, h: number): DrawnRect {
  const cr = w / h;
  let dw: number;
  let dh: number;
  if (FRAME_AR > cr) {
    dh = h;
    dw = h * FRAME_AR;
  } else {
    dw = w;
    dh = w / FRAME_AR;
  }
  return { left: (w - dw) / 2, top: (h - dh) / 2, width: dw, height: dh };
}

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
  const [activeCard, setActiveCard] = useState(-1);
  const [heroP, setHeroP] = useState(0);
  const [seqP, setSeqP] = useState(0); // 0 hero fazėje, > 0 kai prasideda sequence
  const [productsP, setProductsP] = useState(0); // 0 ne produktų scenoje, 0→1 įėjimo animacijai
  const [loaded, setLoaded] = useState(0);
  const [drawnRect, setDrawnRect] = useState<DrawnRect>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

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
      setDrawnRect(computeDrawnRect(rect.width, rect.height));
      render();
    };
    resize();
    window.addEventListener("resize", resize);
    const interval = window.setInterval(render, 16);

    // Snap taškai: hero+1 scena, tada kiekvienos kitos scenos pabaiga.
    const snapPoints: number[] = [0];
    {
      let cum = 0;
      for (let i = 0; i < SCENE_LENGTHS.length; i++) {
        cum += SCENE_LENGTHS[i];
        const virtualEnd = cum - 1;
        const pSeq = virtualEnd / (TOTAL_SCENE_FRAMES - 1);
        snapPoints.push(HERO_FRACTION + pSeq * (1 - HERO_FRACTION));
      }
    }

    // Kiekvienas snap taškas atitinka „sceną": 0 = hero, 1..N = scenų pabaigos.
    // Frame animacija ATSIETA nuo scroll progreso — vartotojas skrolindamas TIK
    // aktyvuoja perėjimą į kitą sceną; kadrai animuojami tolygiai (60fps) per
    // gsap tween, jų negalima „scrubinti" pele.
    const frameTarget = { v: 0 };
    let currentSceneIdx = 0;
    let frameTween: gsap.core.Tween | null = null;

    const applyFrame = (virtualFrame: number) => {
      const clamped = Math.max(
        0,
        Math.min(TOTAL_SCENE_FRAMES - 1, virtualFrame),
      );
      let cum = 0;
      let frame1 = STAGES[0].startFrame;
      let stageIdx = 0;
      for (let i = 0; i < STAGES.length; i++) {
        const len = SCENE_LENGTHS[i];
        if (clamped < cum + len) {
          frame1 = STAGES[i].startFrame + (clamped - cum);
          stageIdx = i;
          break;
        }
        cum += len;
      }
      stateRef.current.frame = frame1 - 1;
      render();
      setActiveStage(stageIdx);

      // Kortelė matoma nuo cardStartFrame iki scenos pabaigos —
      // dingsta tik prasidėjus sekančiai scenai.
      const s = STAGES[stageIdx];
      const cardOn =
        s.cardStartFrame > 0 &&
        frame1 >= s.cardStartFrame &&
        frame1 <= s.endFrame;
      setActiveCard(cardOn ? stageIdx : -1);

      if (frame1 >= PRODUCTS_START_FRAME && frame1 <= PRODUCTS_END_FRAME) {
        const range = PRODUCTS_END_FRAME - PRODUCTS_START_FRAME;
        const raw = (frame1 - PRODUCTS_START_FRAME) / range;
        setProductsP(Math.min(1, raw / 0.15));
      } else if (frame1 > PRODUCTS_END_FRAME) {
        setProductsP(1);
      } else {
        setProductsP(0);
      }
    };

    const sceneToVirtualFrame = (idx: number) => {
      if (idx <= 0) return 0;
      let cum = 0;
      for (let i = 0; i < idx; i++) cum += SCENE_LENGTHS[i];
      return cum - 1;
    };

    const goToScene = (idx: number) => {
      const target = sceneToVirtualFrame(idx);
      if (frameTween) frameTween.kill();
      setHeroP(idx === 0 ? 0 : 1);
      setSeqP(idx === 0 ? 0 : 0.01 + idx * 0.001);
      frameTween = gsap.to(frameTarget, {
        v: target,
        duration: 1.95,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: () => applyFrame(frameTarget.v),
      });
    };

    // Skrolinimas keičia scenas TIK po vieną — nesvarbu kaip stipriai vartotojas
    // paslenka, per vieną „scroll gesture" pereinama tik į kaimyninę sceną.
    let lastStepTime = 0;
    const STEP_COOLDOWN_MS = 1400;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${window.innerHeight * TOTAL_SCROLL_VH}`,
      scrub: 0.001,
      pin: true,
      anticipatePin: 1,
      snap: {
        // Snap taškas ribojamas iki dabartinės scenos ±1 — negalima peršokti kelių scenų.
        snapTo: (value) => {
          const currentP = snapPoints[currentSceneIdx];
          const dir = value > currentP ? 1 : value < currentP ? -1 : 0;
          const nextIdx = Math.max(
            0,
            Math.min(snapPoints.length - 1, currentSceneIdx + dir),
          );
          return snapPoints[nextIdx];
        },
        duration: { min: 0.2, max: 0.4 },
        delay: 0,
        ease: "power2.inOut",
      },
      onUpdate: (self) => {
        const p = self.progress;
        const currentP = snapPoints[currentSceneIdx];
        const delta = p - currentP;
        // Reikalaujame juntamo poslinkio nuo dabartinio snap taško + cooldown,
        // kad greitas / ilgas skrolo judesys neperšoktų kelių scenų iš karto.
        if (Math.abs(delta) > 0.03) {
          const now = performance.now();
          if (now - lastStepTime > STEP_COOLDOWN_MS) {
            const dir = delta > 0 ? 1 : -1;
            const target = Math.max(
              0,
              Math.min(snapPoints.length - 1, currentSceneIdx + dir),
            );
            if (target !== currentSceneIdx) {
              lastStepTime = now;
              currentSceneIdx = target;
              goToScene(target);
            }
          }
        }
        if (currentSceneIdx === 0) {
          setHeroP(Math.min(1, p / HERO_FRACTION));
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
          const active = showStageUI && i === activeCard;
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

      {/* 5-oji scena: butelio + šluosčių glow + produktų kortelės — atsiranda tik nuo 540 kadro */}
      {productsP > 0 && drawnRect.width > 0 && (
        (() => {
          // Konvertuojame image-relative koordinates į viewport px pagal faktinę drawnRect padėtį.
          const toPx = (fx: number, fy: number) => ({
            x: drawnRect.left + fx * drawnRect.width,
            y: drawnRect.top + fy * drawnRect.height,
          });
          const bottleC = toPx(BOTTLE.cx, BOTTLE.cy);
          const bottleW = BOTTLE.w * drawnRect.width;
          const bottleH = BOTTLE.h * drawnRect.height;
          const bottleRightPx = bottleC.x + bottleW / 2;
          const clothsC = toPx(CLOTHS.cx, CLOTHS.cy);
          const clothsW = CLOTHS.w * drawnRect.width;
          const clothsH = CLOTHS.h * drawnRect.height;
          const clothsRightPx = clothsC.x + clothsW / 2;

          const GAP = 20;
          const CARD_W = 300;

          return (
            <>
              {/* Švytintys akcentai — pagal butelio ir šluosčių formas */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10"
                style={{ opacity: productsP }}
              >
                {/* Butelio glow — vertikalus ovalas apie butelį */}
                <div
                  className="absolute animate-pulse"
                  style={{
                    left: bottleC.x,
                    top: bottleC.y,
                    width: bottleW * 1.9,
                    height: bottleH * 1.25,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,236,180,0.95) 0%, rgba(255,210,120,0.45) 40%, rgba(255,210,120,0) 75%)",
                    filter: "blur(10px)",
                    mixBlendMode: "screen",
                  }}
                />
                {/* Šluosčių glow — horizontalus ovalas apie šluostes */}
                <div
                  className="absolute animate-pulse"
                  style={{
                    left: clothsC.x,
                    top: clothsC.y,
                    width: clothsW * 1.4,
                    height: clothsH * 1.7,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(200,230,255,0.9) 0%, rgba(160,210,255,0.4) 40%, rgba(160,210,255,0) 75%)",
                    filter: "blur(10px)",
                    mixBlendMode: "screen",
                    animationDelay: "0.4s",
                  }}
                />
              </div>

              {/* Butelio kortelė — dešinėje butelio pusėje */}
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  left: bottleRightPx + GAP,
                  top: bottleC.y,
                  transform: `translateY(-50%) translateX(${(1 - productsP) * -20}px)`,
                  opacity: productsP,
                  transition: "opacity 300ms ease, transform 400ms ease",
                  width: `min(90vw, ${CARD_W}px)`,
                }}
              >
                <article className="glass-strong pointer-events-auto rounded-3xl p-4 sm:p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sonoma-deep)]">
                    {PRODUCTS[0].tagline}
                  </div>
                  <h4 className="mt-1 text-base font-bold leading-tight sm:text-lg">
                    {PRODUCTS[0].name}
                  </h4>
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--foreground)]/85 sm:text-sm">
                    {PRODUCTS[0].desc}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-lg font-extrabold text-[var(--sonoma-deep)]">
                      {PRODUCTS[0].price}
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-[var(--sonoma-deep)] px-4 py-2 text-xs font-semibold text-[var(--cream-soft)] shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 sm:text-sm"
                    >
                      Pirkti →
                    </button>
                  </div>
                </article>
              </div>

              {/* Šluosčių kortelė — dešinėje šluosčių pusėje, vienodame aukštyje su butelio kortele */}
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  left: clothsRightPx + GAP,
                  top: bottleC.y,
                  transform: `translateY(-50%) translateX(${(1 - productsP) * 20}px)`,
                  opacity: productsP,
                  transition: "opacity 300ms ease, transform 400ms ease",
                  width: `min(90vw, ${CARD_W}px)`,
                }}
              >
                <article className="glass-strong pointer-events-auto rounded-3xl p-4 sm:p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sonoma-deep)]">
                    {PRODUCTS[1].tagline}
                  </div>
                  <h4 className="mt-1 text-base font-bold leading-tight sm:text-lg">
                    {PRODUCTS[1].name}
                  </h4>
                  <p className="mt-2 text-[12px] leading-relaxed text-[var(--foreground)]/85 sm:text-sm">
                    {PRODUCTS[1].desc}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-lg font-extrabold text-[var(--sonoma-deep)]">
                      {PRODUCTS[1].price}
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-[var(--sonoma-deep)] px-4 py-2 text-xs font-semibold text-[var(--cream-soft)] shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 sm:text-sm"
                    >
                      Pirkti →
                    </button>
                  </div>
                </article>
              </div>
            </>
          );
        })()
      )}

    </section>
  );
}
