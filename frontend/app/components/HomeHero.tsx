"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Film, LineChart, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Film,
    title: "Scores by topic",
    desc: "Acting, story, visuals, and pacing at a glance",
  },
  {
    icon: LineChart,
    title: "Mood over time",
    desc: "See how tone shifts from sentence to sentence",
  },
  {
    icon: Sparkles,
    title: "Important words",
    desc: "Discover which words pushed the rating up or down",
  },
] as const;

function AnimatedWords({
  text,
  className,
  wordDelay = 0.06,
  letterDelay = 0.025,
  gradient = false,
}: {
  text: string;
  className?: string;
  wordDelay?: number;
  letterDelay?: number;
  gradient?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (reduceMotion) {
    return (
      <span className={className}>
        {gradient ? <span>{text}</span> : text}
      </span>
    );
  }

  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={`${word}-${wi}`} className="inline-block whitespace-pre">
          {word.split("").map((char, ci) => (
            <motion.span
              key={`${wi}-${ci}`}
              className="inline-block"
              initial={{ opacity: 0, y: 28, rotateX: 40 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                delay: wi * wordDelay + ci * letterDelay,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char}
            </motion.span>
          ))}
          {wi < words.length - 1 ? "\u00A0" : null}
        </span>
      ))}
    </span>
  );
}

const fadeUp = (delay: number, reduceMotion: boolean) =>
  reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
      };

export function HomeHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-24 sm:px-6 sm:pt-28 min-h-[88vh] overflow-hidden">
      <div className="home-aurora pointer-events-none absolute inset-0 z-0" aria-hidden />

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        <motion.p
          {...fadeUp(0.1, !!reduceMotion)}
          className="home-badge-shimmer inline-flex items-center gap-2 rounded-full border border-sunrise-coral/35 bg-white/95 px-4 py-1.5 text-xs font-semibold text-sunrise-burgundy shadow-md shadow-sunrise-coral/15 backdrop-blur-sm"
        >
          <motion.span
            animate={reduceMotion ? undefined : { rotate: [0, 12, -8, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5 text-sunrise-coral" />
          </motion.span>
          No sign-in · Instant ML sentiment insights
        </motion.p>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.12] text-sunrise-burgundy perspective-[800px]">
          <AnimatedWords text="Critique intelligence" wordDelay={0.07} letterDelay={0.022} />
          <span className="home-tagline mt-2 sm:mt-3 block text-[#c93d38]">
            <AnimatedWords
              text="in every critique"
              wordDelay={0.09}
              letterDelay={0.028}
              gradient
            />
          </span>
        </h1>

        <motion.p
          {...fadeUp(0.85, !!reduceMotion)}
          className="text-xl sm:text-2xl text-sunrise-burgundy max-w-2xl mx-auto font-bold tracking-tight"
        >
          <span className="home-subline-shimmer">Explore reviews.</span>{" "}
          <span className="home-subline-shimmer home-subline-shimmer-delay">
            Reveal the sentiment.
          </span>
        </motion.p>

        <motion.p
          {...fadeUp(1.05, !!reduceMotion)}
          className="text-sm sm:text-base text-sunrise-burgundy/90 max-w-xl mx-auto font-medium leading-relaxed"
        >
          Ready to analyze? Jump into the lab—paste a critique and get sentiment breakdowns in
          seconds.
        </motion.p>

        <motion.div {...fadeUp(1.25, !!reduceMotion)} className="flex justify-center pt-2">
          <Link
            href="/dashboard"
            className="home-cta-glow group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f04a45] via-sunrise-coral to-[#e83832] px-10 py-3.5 text-base font-bold text-white shadow-xl shadow-sunrise-coral/40 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Get started
            <motion.span
              className="inline-flex"
              animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.span>
          </Link>
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 mt-16 sm:mt-20 w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 px-2"
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={{ once: true, margin: "-40px" }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
        }}
      >
        {FEATURES.map((item, index) => (
          <motion.div
            key={item.title}
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: { opacity: 0, y: 32, scale: 0.96 },
                    show: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { type: "spring", stiffness: 260, damping: 22 },
                    },
                  }
            }
            whileHover={reduceMotion ? undefined : { y: -6, scale: 1.02 }}
            className="home-feature-card rounded-xl border border-sunrise-coral/25 bg-white/95 backdrop-blur-md p-5 text-left shadow-lg shadow-sunrise-burgundy/10"
          >
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -4, 0] }
              }
              transition={{
                duration: 3 + index * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              }}
            >
              <item.icon className="h-6 w-6 text-[#e83832] mb-3" />
            </motion.div>
            <h2 className="text-base font-bold text-sunrise-burgundy">{item.title}</h2>
            <p className="text-sm text-sunrise-burgundy/80 mt-1.5 leading-relaxed font-medium">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
