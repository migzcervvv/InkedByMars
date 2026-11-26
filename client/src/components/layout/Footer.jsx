import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { studio } from "../../config/studio";

export function Footer({ onPrivacy }) {
  const marquee = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(marquee.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="footer-entry">
      <footer className="studio-footer" id="contact">
        <div className="studio-footer-info">
          <Link to="/" aria-label="Inked by Mars home">
            <img src="/studio-seal.webp" alt="" width="160" height="160" />
          </Link>
          <div>
            <h2>See you in Las Piñas.</h2>
            <p>
              <a href={studio.map}>{studio.location}</a>
              <br />
              Private sessions by appointment.
            </p>
            <a href={`mailto:${studio.email}`}>{studio.email}</a>
            <Link className="studio-footer-book" to="/booking">
              Request a session ↗
            </Link>
          </div>
          <div>
            <nav aria-label="Footer navigation">
              <h2>Index</h2>
              <Link to="/">Overview</Link>
              <Link to="/works">My Works</Link>
              <Link to="/booking">Booking</Link>
            </nav>
            <div className="studio-footer-social">
              <h2>Instagram</h2>
              <a href={studio.instagram} target="_blank" rel="noreferrer">
                {studio.instagramHandle}
              </a>
              <a href={studio.flashInstagram} target="_blank" rel="noreferrer">
                {studio.flashHandle}
              </a>
            </div>
          </div>
        </div>
        <div className="studio-footer-marquee" ref={marquee} aria-hidden="true">
          <div className="studio-footer-track" data-playing={visible}>
            <span>INKEDBYMARS</span>
            <span>INKEDBYMARS</span>
          </div>
        </div>
        <div className="studio-footer-meta">
          <span>
            Made by{" "}
            <a href={studio.developerLink} target="_blank" rel="noreferrer">
              Miggz Cervantes
            </a>{" "}
            | {studio.location} · {studio.country}
          </span>
          <button type="button" className="text-button" onClick={onPrivacy}>
            Privacy
          </button>
        </div>
      </footer>
    </div>
  );
}
