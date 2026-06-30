import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 150;
const STAGES = [
  {
    frame: 18,
    title: "Stalčiai",
    subtitle: "Tylaus uždarymo bėgeliai",
    text: "Aukščiausios kokybės Blum stalčių sistema su pilnu ištraukimu. Ergonomiškas uždarymas be triukšmo, atlaikantis iki 40 kg krovinį.",
  },
  {
    frame: 60,
    title: "Cargo krepšys",
    subtitle: "Maksimali talpa siauroje erdvėje",
    text: "Praktiškas siauras cargo modulis prieskoniams ir buteliams. Lengvai pasiekiamas iš abiejų pusių, su minkšto uždarymo mechanizmu.",
  },
  {
    frame: 102,
    title: "Lankstai",
    subtitle: "110° kampo atidarymas",
    text: "Integruoti soft-close lankstai su 3D reguliavimu. Tiksli durelių linija, ilgaamžiškumas testuotas 80 000 atidarymo ciklų.",
  },
  {
    frame: 138,
    title: "Pakeliamos durelės",
    subtitle: "Aventos pakėlimo sistema",
    text: "Modernios pakeliamos durelės su pneumatiniais amortizatoriais. Lengvas valdymas vienu pirštu, sustojimas bet kuriame aukštyje.",
  },
];

// Procedurally draw a stylized cabinet whose state morphs with frame index.
function drawFrame(ctx: CanvasRenderingContext2D, frame: number, w: number, h: number) {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Background wash
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#fbf6ec");
  bg.addColorStop(1, "#efe2c9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Floor shadow
  ctx.fillStyle = "rgba(120, 90, 50, 0.10)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.82, w * 0.34, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cabinet geometry
  const cabW = Math.min(w * 0.55, 520);
  const cabH = Math.min(h * 0.62, 520);
  const cx = w / 2;
  const cy = h * 0.5;
  const left = cx - cabW / 2;
  const top = cy - cabH / 2;

  // Cabinet body (sonoma)
  const wood = ctx.createLinearGradient(left, top, left + cabW, top + cabH);
  wood.addColorStop(0, "#d9bd92");
  wood.addColorStop(0.5, "#c9a673");
  wood.addColorStop(1, "#b08a55");
  ctx.fillStyle = wood;
  roundRect(ctx, left, top, cabW, cabH, 18);
  ctx.fill();

  // Inner frame
  ctx.strokeStyle = "rgba(80, 50, 20, 0.25)";
  ctx.lineWidth = 2;
  roundRect(ctx, left + 10, top + 10, cabW - 20, cabH - 20, 12);
  ctx.stroke();

  // Stage progress (0..1 across full sequence)
  const t = frame / (TOTAL_FRAMES - 1);

  // Stage 1: drawers slide out (frames 0-37)
  const drawerOut = clamp01((frame - 0) / 36);
  // Stage 2: cargo basket rises (frames 38-75)
  const cargoOut = clamp01((frame - 38) / 36);
  // Stage 3: door swings open on hinge (frames 76-115)
  const doorAngle = clamp01((frame - 76) / 38);
  // Stage 4: lift door rises (frames 116-149)
  const liftUp = clamp01((frame - 116) / 33);

  // --- Drawers (left column) ---
  const colW = cabW * 0.42;
  const colX = left + 18;
  const drawerCount = 3;
  const drawerH = (cabH - 36) / drawerCount;
  for (let i = 0; i < drawerCount; i++) {
    const y = top + 18 + i * drawerH;
    const offset = drawerOut * (60 + i * 10) * (1 - liftUp * 0.5);
    drawPanel(ctx, colX - offset, y + 6, colW - 12, drawerH - 12, "#e6cda1");
    // handle
    ctx.fillStyle = "rgba(60,40,15,0.55)";
    roundRect(ctx, colX - offset + colW * 0.3, y + drawerH / 2 - 2, colW * 0.35, 4, 2);
    ctx.fill();
  }

  // --- Cargo basket (middle slim, rising) ---
  const cargoX = left + colW + 26;
  const cargoW = cabW * 0.12;
  const cargoTravel = cargoOut * (cabH * 0.55);
  const cargoY = top + cabH - 30 - cargoTravel;
  ctx.fillStyle = "rgba(40,25,10,0.15)";
  roundRect(ctx, cargoX, top + 20, cargoW, cabH - 40, 6);
  ctx.fill();
  // basket
  const basketH = cabH * 0.3;
  drawPanel(ctx, cargoX - 2, cargoY - basketH, cargoW + 4, basketH, "#f1e0bd");
  // wire lines
  ctx.strokeStyle = "rgba(80,55,25,0.5)";
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) {
    const yy = cargoY - basketH + (basketH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(cargoX, yy);
    ctx.lineTo(cargoX + cargoW, yy);
    ctx.stroke();
  }

  // --- Right door with hinge swing ---
  const doorX = left + colW + cargoW + 40;
  const doorW = cabW - (doorX - left) - 18;
  const doorH = cabH - 36;
  const doorY = top + 18;
  ctx.save();
  ctx.translate(doorX, doorY + doorH / 2);
  const angle = doorAngle * (-Math.PI / 2.4) * (1 - liftUp);
  ctx.transform(Math.cos(angle), 0, 0, 1, 0, 0); // perspective squish via x scale
  drawPanel(ctx, 0, -doorH / 2, doorW, doorH, "#ead0a4");
  // hinge dots
  ctx.fillStyle = "rgba(50,30,10,0.6)";
  ctx.beginPath();
  ctx.arc(6, -doorH / 2 + 24, 3, 0, Math.PI * 2);
  ctx.arc(6, doorH / 2 - 24, 3, 0, Math.PI * 2);
  ctx.fill();
  // handle
  ctx.fillStyle = "rgba(60,40,15,0.55)";
  roundRect(ctx, doorW - 18, -6, 4, 36, 2);
  ctx.fill();
  ctx.restore();

  // --- Lift door (top, rises up) ---
  const liftH = cabH * 0.22;
  const liftY = top - liftUp * liftH * 1.1;
  drawPanel(ctx, left + 8, liftY, cabW - 16, liftH, "#f3dfb8");
  ctx.fillStyle = "rgba(60,40,15,0.5)";
  roundRect(ctx, left + cabW / 2 - 18, liftY + liftH - 10, 36, 4, 2);
  ctx.fill();

  // Soft highlight
  const hl = ctx.createLinearGradient(left, top, left + cabW, top);
  hl.addColorStop(0, "rgba(255,255,255,0.18)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  roundRect(ctx, left, top, cabW, cabH, 18);
  ctx.fill();

  // Frame counter watermark
  ctx.fillStyle = "rgba(80,55,25,0.35)";
  ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`${String(frame + 1).padStart(3, "0")} / ${TOTAL_FRAMES}`, 20, h - 20);

  void t;
}

function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, color);
  g.addColorStop(1, shade(color, -0.12));
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(80,50,15,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function shade(hex: string, amt: number) {
  // simple hex shade
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  let r = (num >> 16) + Math.round(255 * amt);
  let g = ((num >> 8) & 0xff) + Math.round(255 * amt);
  let b = (num & 0xff) + Math.round(255 * amt);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

export function ScrollSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ frame: 0 });
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      drawFrame(ctx, Math.round(stateRef.current.frame), rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      drawFrame(ctx, Math.round(stateRef.current.frame), rect.width, rect.height);
    };

    const stagePauses = STAGES.map((s) => s.frame / (TOTAL_FRAMES - 1));

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * 5}`,
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          // detect nearest stage
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

    // Build segments with pauses at each stage
    let prev = 0;
    stagePauses.forEach((sp) => {
      tl.to(stateRef.current, {
        frame: sp * (TOTAL_FRAMES - 1),
        ease: "none",
        duration: sp - prev,
        onUpdate: render,
      });
      tl.to({}, { duration: 0.18 }); // dwell
      prev = sp;
    });
    tl.to(stateRef.current, {
      frame: TOTAL_FRAMES - 1,
      ease: "none",
      duration: 1 - prev,
      onUpdate: render,
    });

    return () => {
      window.removeEventListener("resize", resize);
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      aria-label="Baldų funkcijų animacija"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Stage indicator pills - top */}
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
              style={{
                right: "1rem",
                bottom: "1rem",
              }}
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

      {/* Scroll hint */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20">
        <div className="glass rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:text-xs">
          Skrolinkite ↓
        </div>
      </div>
    </section>
  );
}
