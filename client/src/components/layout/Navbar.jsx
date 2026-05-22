import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const links = [
  { label: "Work", to: "/" },
  { label: "About", to: "/about" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Availability", to: "/availability" },
  { label: "Book", to: "/booking" },
  { label: "Contact", to: "/contact" },
];

export function Navbar() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 60,
      end: 99999,
      onUpdate: (self) => setSolid(self.scroll() > 60),
    });
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[70] transition-colors duration-300 ${
          solid || open
            ? "bg-ink/95 shadow-leather backdrop-blur"
            : "bg-ink/90 md:bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <NavLink
            to="/"
            className="font-display text-xl font-black tracking-[0.08em]"
            onClick={() => setOpen(false)}
          >
            <span className="text-cream">INKED BY </span>
            <span className="text-red">MARS</span>
          </NavLink>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className="nav-link">
                {link.label}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="grid size-11 place-items-center border border-cream/25 text-cream md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] overflow-y-auto bg-ink px-6 pb-12 pt-28 text-cream md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="grid gap-8"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.09 } },
              }}
            >
              {links.map((link) => (
                <motion.div
                  key={link.to}
                  variants={{
                    hidden: { y: 28, opacity: 0 },
                    show: { y: 0, opacity: 1 },
                  }}
                >
                  <NavLink
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="font-display text-5xl italic text-cream transition hover:text-red"
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
