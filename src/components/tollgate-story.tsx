"use client";

import { useEffect, useRef, useState } from "react";

const scenes = [
  {
    number: "01",
    label: "The task",
    title: "One instruction goes in.",
    body: "You ask an agent to review a pull request. From your side, it looks like one job.",
  },
  {
    number: "02",
    label: "The hidden work",
    title: "Several model calls happen.",
    body: "Context reads, retries, and the final response each consume tokens while you focus on the result.",
  },
  {
    number: "03",
    label: "The Tollgate moment",
    title: "The cost becomes visible.",
    body: "See every supported call, its available raw cost, and the same tokens priced against a cheaper model when verified pricing exists.",
  },
];

export function TollgateStory() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observers = stepRefs.current.map((element, index) => {
      if (!element) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(index);
        },
        { rootMargin: "-38% 0px -38% 0px", threshold: 0 },
      );
      observer.observe(element);
      return observer;
    });

    return () => observers.forEach((observer) => observer?.disconnect());
  }, []);

  return (
    <section className="story" id="story" aria-label="How Tollgate reveals hidden AI agent cost">
      <div className="story-copy">
        <header>
          <p className="section-code">See the unseen</p>
          <h2>One task.<br />More than one call.</h2>
        </header>
        {scenes.map((scene, index) => (
          <article
            className={active === index ? "story-step is-active" : "story-step"}
            key={scene.number}
            ref={(element) => { stepRefs.current[index] = element; }}
          >
            <span>{scene.number} / {scene.label}</span>
            <h3>{scene.title}</h3>
            <p>{scene.body}</p>
          </article>
        ))}
      </div>

      <div className="story-visual-wrap">
        <div className={`story-visual scene-${active + 1}`} aria-live="polite">
          <div className="visual-grid" />
          <div className="request-ticket"><small>AGENT TASK</small><b>Review this pull request</b><span>RUN / 0842</span></div>
          <div className="toll-gate" aria-hidden="true"><i /><i /><b>T</b><span>METER</span></div>
          <div className="hidden-calls">
            <div><span>READ CONTEXT</span><b>12,840 tok</b><strong>$0.0164</strong></div>
            <div><span>RETRY ANALYSIS</span><b>9,210 tok</b><strong>$0.0121</strong></div>
            <div><span>WRITE REVIEW</span><b>6,478 tok</b><strong>$0.0093</strong></div>
          </div>
          <div className="live-total"><small>THIS RUN · ESTIMATED</small><strong>$0.0378</strong><span>Same tokens on cheaper model <b>$0.0106</b></span><em>Estimate only. Quality not tested.</em></div>
          <div className="visual-progress"><i /><span>0{active + 1} / 03</span></div>
        </div>
      </div>
    </section>
  );
}
