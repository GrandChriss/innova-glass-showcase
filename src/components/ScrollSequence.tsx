import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Load all frame asset pointers and sort by filename.
const frameModules = import.meta.glob<{ url: string }>(
  "../assets/sequence/frame-*.webp.asset.json",
  { eager: true, import: "default" },
);
const FRAME_URLS: string[] = Object.keys(frameModules)
  .sort()
  .map((k) => frameModules[k].url);
const TOTAL_FRAMES = FRAME_URLS.length;

const STAGES = [
  {
    frame: Math.round(TOTAL_FRAMES * 0.12),
    title: "Stalčiai",
    subtitle: "Tylaus uždarymo bėgeliai",
    text: "Aukščiausios kokybės Blum stalčių sistema su pilnu ištraukimu. Ergonomiškas uždarymas be triukšmo, atlaikantis iki 40 kg krovinį.",
  },
  {
    frame: Math.round(TOTAL_FRAMES * 0.4),
    title: "Cargo krepšys",
    subtitle: "Maksimali talpa siauroje erdvėje",
    text: "Praktiškas siauras cargo modulis prieskoniams ir buteliams. Lengvai pasiekiamas iš abiejų pusių, su minkšto uždarymo mechanizmu.",
  },
  {
    frame: Math.round(TOTAL_FRAMES * 0.68),
    title: "Lankstai",
    subtitle: "110° kampo atidarymas",
    text: "Integruoti soft-close lankstai su 3D reguliavimu. Tiksli durelių linija, ilgaamžiškumas testuotas 80 000 atidarymo ciklų.",
  },
  {
    frame: Math.round(TOTAL_FRAMES * 0.92),
    title: "Pakeliamos durelės",
    subtitle: "Aventos pakėlimo sistema",
    text: "Modernios pakeliamos durelės su pneumatiniais amortizatoriais. Lengvas valdymas vienu pirštu, sustojimas bet kuriame aukštyje.",
  },
];

function drawImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // soft cream background wash
  ctx.fillStyle = "#f6ecd9";
  ctx.fillRect(0, 0, w, h);

  if (!img.complete || !img.naturalWidth) return;

  // cover-fit
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

export function ScrollSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const stateRef = useRef({ frame: 0 });
  const [activeStage, setActiveStage] = useState(0);
  const [loaded, setLoaded] = useState(0);

  // Preload all frames
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

    // re-render as images stream in
    const interval = window.setInterval(render, 120);

    const stagePauses = STAGES.map((s) => s.frame / (TOTAL_FRAMES - 1));

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * 6}`,
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          let nearest = 0;
          let best = Infinity;
          stagePauses.forEach((sp, i) => {
            const d = Math.abs(p - sp);
            if (d < best) {
              best = d;
              nearest = i;
            }
          });
          setActiveStage(nearest);
        },
      },
    });

    let prev = 0;
    stagePauses.forEach((sp) => {
      tl.to(stateRef.current, {
        frame: sp * (TOTAL_FRAMES - 1),
        ease: "none",
        duration: Math.max(0.0001, sp - prev),
        onUpdate: render,
      });
      tl.to({}, { duration: 0.22 });
      prev = sp;
    });
    tl.to(stateRef.current, {
      frame: TOTAL_FRAMES - 1,
      ease: "none",
      duration: Math.max(0.0001, 1 - prev),
      onUpdate: render,
    });

    return () => {
      window.removeEventListener("resize", resize);
      window.clearInterval(interval);
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  const progress = Math.round((loaded / TOTAL_FRAMES) * 100);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-[#f6ecd9]"
      aria-label="Baldų funkcijų animacija"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Loader */}
      {loaded < TOTAL_FRAMES && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
          <div className="glass rounded-full px-4 py-2 text-xs font-semibold text-[var(--sonoma-deep)]">
            Kraunama… {progress}%
          </div>
        </div>
      )}

      {/* Stage indicator pills */}
      <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2">
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

      {/* Sliding glass info cards */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-end p-4 sm:items-center sm:p-10">
        {STAGES.map((s, i) => {
          const active = i === activeStage;
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

      <div className="pointer-events-none absolute bottom-4 left-4 z-20">
        <div className="glass rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:text-xs">
          Skrolinkite ↓
        </div>
      </div>
    </section>
  );
}
