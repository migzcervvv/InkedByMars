import { Camera, MessageCircle, Music2 } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-red bg-leather text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="order-last md:order-first">
          <img src="/mars-logo.svg" alt="Inked by Mars logo" className="h-40" />
        </div>
        <div>
          <p className="font-display text-3xl font-black tracking-[0.08em]">
            INKED BY <span className="text-red">MARS</span>
          </p>
          <p className="mt-4 max-w-xs font-body text-2xl italic text-cream/75">
            Fine line, blackwork, and neo-traditional pieces made for warm skin
            and lasting memory.
          </p>
        </div>
        <div>
          <p className="footer-heading">Quick Links</p>
          <div className="mt-4 grid gap-3 font-mono text-xs uppercase tracking-[0.18em]">
            <Link to="/" className="hover:text-red">
              Work
            </Link>
            <Link to="/gallery" className="hover:text-red">
              Gallery
            </Link>
            <Link to="/availability" className="hover:text-red">
              Availability
            </Link>
            <Link to="/booking" className="hover:text-red">
              Book
            </Link>
            <Link to="/contact" className="hover:text-red">
              Contact
            </Link>
          </div>
        </div>
        <div>
          <p className="footer-heading">Social</p>

          <a
            href="https://instagram.com/flash.designs.by.mars"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block font-mono text-xs uppercase tracking-[0.18em] text-cream/75 hover:text-red"
          >
            @flash.designs.by.mars
          </a>
          <a
            href="https://instagram.com/inkedbymars"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block font-mono text-xs uppercase tracking-[0.18em] text-cream/75 hover:text-red"
          >
            @inkedbymars
          </a>
        </div>
      </div>
      <div className="border-t border-cream/10 px-6 py-5 text-center font-mono text-[0.65rem] uppercase tracking-[0.24em] text-cream/60">
        Designed with &#129656; in Manila
      </div>
    </footer>
  );
}
