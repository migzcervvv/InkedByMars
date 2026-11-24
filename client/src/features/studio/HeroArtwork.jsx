import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const signature =
  "M182 374 C189 365 195 349 198 334 C201 322 204 324 204 335 L203 360 C206 348 209 323 220 321 C230 318 229 340 227 354 C231 339 235 314 246 313 C257 312 251 334 257 344 C261 349 267 342 273 336 269 324 273 302 280 295 286 282 300 284 302 290 299 312 291 335 280 335 268 334 273 316 276 308 281 296 287 286 303 287 299 301 296 324 304 324 319 326 328 283 329 265 325 257 314 258 319 268 323 276 337 270 352 260 348 271 346 299 357 298 368 302 373 269 377 246 377 259 389 268 394 275 400 286 385 294 387 281 391 270 402 256 419 247";

export function HeroArtwork({ showIntro }) {
  const overlay = useRef(null);
  useEffect(() => {
    if (!showIntro) return;
    const layer = overlay.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const refreshing =
      performance.getEntriesByType("navigation")[0]?.type === "reload";
    if (reduced.matches || (!refreshing && (location.hash || window.scrollY)))
      return;
    const mark = layer.querySelector("svg");
    const stroke = mark.querySelector("path");
    const pen = layer.querySelector("img");
    const length = stroke.getTotalLength();
    const start = performance.now();
    const button = layer.querySelector("button");
    let raf;
    let flight;
    function hide() {
      cancelAnimationFrame(raf);
      layer.hidden = true;
      flight?.cancel();
    }
    function finish() {
      const target = document
        .querySelector(".home-seal")
        ?.getBoundingClientRect();
      const box = mark.getBoundingClientRect();
      layer.classList.add("docking");
      const visible = target && target.bottom > 0 && target.top < innerHeight;
      const x = visible
        ? target.left + target.width / 2 - box.left - box.width / 2
        : 0;
      const y = visible
        ? target.top + target.height / 2 - box.top - box.height / 2
        : 0;
      const scale = visible ? (target.width * 0.55) / box.width : 1;
      flight = mark.animate(
        [
          { transform: "translate(0, 0) scale(1)" },
          {
            transform:
              "translate(" + x + "px," + y + "px) scale(" + scale + ")",
          },
        ],
        {
          duration: 1150,
          easing: "cubic-bezier(.45,0,.18,1)",
          fill: "forwards",
        },
      );
      flight.onfinish = hide;
    }
    function draw(now) {
      const elapsed = now - start;
      const t = Math.min(1, Math.max(0, (elapsed - 220) / 2500));
      const progress = t - (0.65 * Math.sin(2 * Math.PI * t)) / (2 * Math.PI);
      stroke.style.strokeDashoffset = String(length * (1 - progress));
      const point = stroke
        .getPointAtLength(length * progress)
        .matrixTransform(mark.getScreenCTM());
      pen.style.left = point.x + "px";
      pen.style.top = point.y + "px";
      if (t === 1) pen.style.opacity = "0";
      if (elapsed >= 2990) finish();
      else raf = requestAnimationFrame(draw);
    }
    layer.classList.remove("docking");
    layer.hidden = false;
    pen.style.opacity = "1";
    stroke.style.strokeDasharray = String(length);
    draw(start);
    button.addEventListener("click", hide);
    window.addEventListener("keydown", hide);
    reduced.addEventListener("change", hide);
    return () => {
      hide();
      button.removeEventListener("click", hide);
      window.removeEventListener("keydown", hide);
      reduced.removeEventListener("change", hide);
    };
  }, [showIntro]);
  return (
    <>
      <picture className="portrait-back">
        <source
          media="(max-width: 650px)"
          srcSet="/studio-portrait-mobile.jpg"
        />
        <img
          src="/studio-portrait.webp"
          alt="Mars seated in her tattoo studio"
          fetchPriority="high"
        />
      </picture>
      {showIntro && createPortal(
        <div className="signature-entry" ref={overlay} hidden>
          <svg viewBox="175 230 260 155" aria-hidden="true">
            <path
              d={signature}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <img src="/studio-pen.webp" alt="" />
          <button type="button">Skip intro</button>
        </div>,
        document.body,
      )}
    </>
  );
}
