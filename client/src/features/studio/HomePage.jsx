import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { seoPages } from "../../config/seo.js";
import { usePageMeta } from "../../hooks/usePageMeta";
import { bookingQuestions, studio, workCategories } from "../../config/studio";
import { useStudioMotion } from "./useStudioMotion";
import { HeroArtwork } from "./HeroArtwork";

import "./homepage.css";

const styleColors = {
  custom: "#35121d",
  freehand: "#65242c",
  minimalistic: "#414c54",
  flash: "#721d29",
};
const descriptions = {
  custom:
    "A one-of-a-kind piece built around your idea, references, and placement.",
  freehand:
    "Drawn directly on skin to follow the shape and movement of your body.",
  minimalistic: "Fine lines and simple shapes for a small, understated piece.",
  flash:
    "Choose from Mars’s ready-to-tattoo illustrations, then decide on size and placement.",
};

export default function HomePage() {
  const scope = useRef(null);
  const [categoryId, setCategoryId] = useState("custom");
  const activeIndex = workCategories.findIndex(
    (item) => item.id === categoryId,
  );
  usePageMeta(seoPages["/"].title, seoPages["/"].description, {
    canonicalPath: "/",
  });
  const selectStyle = useStudioMotion(scope, setCategoryId);

  return (
    <div ref={scope} className="studio-home">
      <div className="hero-stage">
        <section className="portrait-hero" aria-labelledby="home-title">
          <HeroArtwork />
          <div className="portrait-title">
            <p>Custom tattoos / Las Piñas</p>
            <h1 id="home-title">
              Inked
              <br />
              by Mars
            </h1>
            <span>A little of you, drawn by me.</span>
          </div>
          <Link to="/booking" className="glass-book">
            Request a session ↗
          </Link>
        </section>
      </div>
      <section id="work" className="ink-wall" aria-labelledby="wall-title">
        <div className="wall-stage">
          <div className="wall-grid">
            {[
              "flash",
              "custom",
              "minimalistic",
              "freehand",
              "artist",
              "sample",
              "hero-tattoo-1",
            ].map((file, i) => (
              <div key={file} className={"wall-cell cell-" + i}>
                <img loading="lazy" src={"/" + file + ".jpg"} alt="" />
              </div>
            ))}
            <div className="wall-caption">
              <h2 id="wall-title">made to be worn</h2>
              <Link to="/works">Explore my works ↗</Link>
            </div>
          </div>
        </div>
      </section>
      <div className="chapter-entry">
        <section
          className="artist-section"
          id="about"
          aria-labelledby="about-title"
        >
          <div className="frame artist-grid">
            <div className="artist-copy">
              <h2 id="about-title">Hi, I’m Mars.</h2>
              <p className="statement">
                I draw tattoos for the person who wears them.
              </p>
              <p>
                I’m a tattoo artist working in BF Resort, Las Piñas. My work
                moves between custom pieces, freehand drawings, minimalistic
                marks, and illustrated flash.
              </p>
              <p>
                Bring a reference, a story, or an idea you haven’t quite put
                into words. We’ll start there and find a design and placement
                that feel like you.
              </p>
              <a
                href={studio.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Find me on Instagram
              </a>
            </div>
            <figure className="artist-collection">
              <img
                src="/artist.jpg"
                alt="Collection of tattoos and a photograph of Mars in the center"
                width="1080"
                height="1080"
                loading="lazy"
              />
            </figure>
          </div>
        </section>
      </div>

      <section
        className="section-space frame style-section"
        aria-labelledby="style-title"
      >
        <div className="section-heading">
          <h2 id="style-title" data-reveal>
            Where do we start?
          </h2>
          <p data-reveal>
            A drawing of your own.
            <br />
            Or something from mine.
          </p>
        </div>
        <div className="style-folds">
          {workCategories.map((item, index) => (
            <div
              className="style-fold"
              key={item.id}
              data-ahead={index > activeIndex}
              style={{
                "--panel-color": styleColors[item.id],
                "--rail-index": index,
              }}
            >
              <button
                type="button"
                aria-expanded={index === activeIndex}
                aria-controls={"style-" + item.id}
                onClick={() => selectStyle(index, item.id)}
              >
                {item.name}
              </button>
              <div
                className="fold-detail"
                id={"style-" + item.id}
                aria-hidden={index !== activeIndex}
              >
                <p>{descriptions[item.id]}</p>
                <img loading="lazy" src={item.image} alt={item.alt} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="chapter-entry">
        <section className="ink-booking" aria-labelledby="ink-booking-title">
          <img src="/hero-hand.jpg" alt="" loading="lazy" />
          <div className="frame">
            <h2 id="ink-booking-title">
              Your idea,
              <br />
              in ink.
            </h2>
            <p>
              Tell me what you’re imagining, where it might go, and what
              inspires it. We’ll work out the design together.
            </p>
            <Button to="/booking">
              Request a session <ArrowUpRight size={18} />
            </Button>
            <ol>
              <li>Share your idea</li>
              <li>Refine the design</li>
              <li>Meet in the studio</li>
            </ol>
          </div>
        </section>
      </div>
      <section
        className="section-space frame questions-section"
        aria-labelledby="questions-title"
      >
        <div>
          <h2 id="questions-title" data-reveal>
            Before the ink.
          </h2>
          <p data-reveal>A few things to know before requesting a session.</p>
        </div>
        <div className="question-list">
          {bookingQuestions.map((item) => (
            <div key={item.question} data-reveal>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
