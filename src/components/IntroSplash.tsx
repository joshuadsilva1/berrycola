import { useEffect, useRef, useState } from "react";
import { motion, type Transition } from "framer-motion";
import canClosed from "../assets/coke-closed.png";
import canOpened from "../assets/coke-opened.png";
import popSound from "../assets/coke-opening.mp3";
import fairyCharm from "../assets/fairy.png";
import batmanCharm from "../assets/batman.png";
import marlboroCharm from "../assets/marlboro.png";
import skullDiceCharm from "../assets/charm-skull-dice.png";

interface IntroSplashProps {
  onFinish: () => void;
  onUnlockSound?: () => void;
}

type Phase = "waiting" | "shaking" | "opened" | "zooming" | "exiting";

const SHAKE_MS = 1550;
const POP_MS = 1250;
const ZOOM_MS = 850;
const EXIT_MS = 850;


// a couple of quick direction reversals, like someone actually gripping and
// rattling the can before cracking it.
const SHAKE_ROTATE = [0, -9, 7, -15, 12, -6, 10, -16, 9, -5, 6, -2, 0];
const SHAKE_X = [0, -5, 4, -7, 6, -4, 5, -6, 3, -3, 2, -1, 0];
const SHAKE_Y = [0, 3, -2, 4, -3, 2, -4, 3, -1, 2, -1, 1, 0];
const SHAKE_TIMES = SHAKE_ROTATE.map((_, i) => i / (SHAKE_ROTATE.length - 1));

const fizzBubbles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 360,
  y: -(140 + Math.random() * 220),
  delay: Math.random() * 0.15,
  scale: 0.5 + Math.random() * 1.0,
}));

// Charms that erupt out of the mouth of the can when it pops open.
// All keyframe arrays use 3 matching steps so Framer Motion interpolates cleanly.
const POP_CHARMS = [
  {
    id: "fairy-left",
    src: fairyCharm,
    size: 135,
    midX: -110,
    endX: -215,
    peakY: -195,
    endY: -95,
    rotate: -26,
    delay: 0.0,
  },
  {
    id: "skull-mid-left",
    src: skullDiceCharm,
    size: 145,
    midX: -55,
    endX: -105,
    peakY: -230,
    endY: -165,
    rotate: -14,
    delay: 0.04,
  },
  {
    id: "marlboro-mid-right",
    src: marlboroCharm,
    size: 140,
    midX: 55,
    endX: 110,
    peakY: -225,
    endY: -160,
    rotate: 18,
    delay: 0.03,
  },
  {
    id: "batman-right",
    src: batmanCharm,
    size: 135,
    midX: 115,
    endX: 220,
    peakY: -190,
    endY: -90,
    rotate: 28,
    delay: 0.06,
  },
  {
    id: "fairy-center",
    src: fairyCharm,
    size: 118,
    midX: 0,
    endX: 0,
    peakY: -255,
    endY: -200,
    rotate: 10,
    delay: 0.08,
  },
];

export default function IntroSplash({ onFinish, onUnlockSound }: IntroSplashProps) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const startSplash = () => {
    if (phase !== "waiting") return;
    onUnlockSound?.();

    // Prime the audio element inside the direct user click handler so Safari/Chrome
    // allow playing it 1.55s later when the can pops open.
    const el = audioRef.current;
    if (el) {
      el.muted = true;
      el.play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = false;
        })
        .catch(() => {
          el.muted = false;
        });
    }

    setPhase("shaking");

    timers.current.push(
      setTimeout(() => {
        setPhase("opened");
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.muted = false;
          audioRef.current.play().catch(() => {});
        }
      }, SHAKE_MS),
      setTimeout(() => setPhase("zooming"), SHAKE_MS + POP_MS),
      setTimeout(() => setPhase("exiting"), SHAKE_MS + POP_MS + ZOOM_MS),
      setTimeout(() => finish(), SHAKE_MS + POP_MS + ZOOM_MS + EXIT_MS)
    );
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onUnlockSound?.();
    onFinish();
  };

  const opened = phase === "opened" || phase === "zooming" || phase === "exiting";
  const zoomed = phase === "zooming" || phase === "exiting";

  const canAnimate = () => {
    if (phase === "waiting") {
      return { rotate: [0, -2, 2, 0], x: 0, y: [0, -8, 0], scale: 1 };
    }
    if (phase === "shaking") {
      return { rotate: SHAKE_ROTATE, x: SHAKE_X, y: SHAKE_Y, scale: 1 };
    }
    if (phase === "opened") {
      return { rotate: 0, x: 0, y: 0, scale: [1, 1.12, 1.05] };
    }
    return { rotate: 0, x: 0, y: 50, scale: 2.1 };
  };

  const canTransition = (): Transition => {
    if (phase === "waiting") {
      return { duration: 2.4, repeat: Infinity, ease: "easeInOut" };
    }
    if (phase === "shaking") {
      return { duration: SHAKE_MS / 1000, ease: "easeInOut", times: SHAKE_TIMES };
    }
    if (phase === "opened") {
      return { duration: 0.35, ease: "easeOut" };
    }
    return { duration: ZOOM_MS / 1000, ease: [0.5, 0, 0.3, 1] };
  };

  return (
    <motion.div
      onClick={phase === "waiting" ? startSplash : undefined}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none ${
        phase === "waiting" ? "cursor-pointer" : ""
      }`}
      style={{ background: "linear-gradient(160deg, #3c2620 0%, #2a1a15 100%)" }}
      initial={{ clipPath: "circle(150% at 50% 50%)" }}
      animate={{ clipPath: phase === "exiting" ? "circle(0% at 50% 50%)" : "circle(150% at 50% 50%)" }}
      transition={{ duration: EXIT_MS / 1000, ease: [0.76, 0, 0.24, 1] }}
    >
      <audio ref={audioRef} src={popSound} preload="auto" />

      <div className="relative flex items-center justify-center w-[380px] h-[480px] sm:w-[500px] sm:h-[430px]">
        <motion.div
          className="relative w-full h-full z-10"
          style={{ transformOrigin: zoomed ? "50% 75%" : "50% 95%" }}
          animate={canAnimate()}
          transition={canTransition()}
        >
          <img
            src={canClosed}
            alt="BerryCola Can"
            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.5)]"
            style={{ opacity: opened ? 0 : 1, transition: "opacity 0.15s ease" }}
          />
          <img
            src={canOpened}
            alt="BerryCola"
            className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.5)]"
            style={{ opacity: opened ? 1 : 0, transition: "opacity 0.15s ease" }}
          />
        </motion.div>

        {/* Charms & Fizz Erupting Out of the Can Opening on Pop (z-30 so always visible in front of can) */}
        {opened && (
          <div className="absolute pointer-events-none z-30" style={{ left: "50%", top: "24%" }}>
            {fizzBubbles.map((b) => (
              <motion.span
                key={b.id}
                className="absolute rounded-full bg-cream/85"
                style={{ width: 9 * b.scale, height: 9 * b.scale }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: b.x, y: b.y }}
                transition={{ duration: 1.1, delay: b.delay, ease: "easeOut" }}
              />
            ))}

            {POP_CHARMS.map((charm) => (
              <motion.img
                key={charm.id}
                src={charm.src}
                alt=""
                style={{
                  width: charm.size,
                  height: charm.size,
                  marginLeft: -charm.size / 2,
                  marginTop: -charm.size / 2,
                }}
                className="absolute object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]"
                initial={{ opacity: 0, x: 0, y: 30, scale: 0.1, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1],
                  x: [0, charm.midX, charm.endX],
                  y: [30, charm.peakY, charm.endY],
                  scale: [0.1, 1.18, 1.0],
                  rotate: [0, charm.rotate * 0.65, charm.rotate],
                }}
                transition={{
                  duration: 1.15,
                  delay: charm.delay,
                  times: [0, 0.48, 1],
                  ease: "easeOut",
                }}
              />
            ))}

            <motion.span
              className="absolute rounded-full border-2"
              style={{ borderColor: "#fffffe", width: 26, height: 26, left: -13, top: -13 }}
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 14, opacity: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      {phase === "waiting" && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0.55, 1, 0.55], y: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mt-6 text-sm uppercase tracking-[0.25em] text-cream/85 font-medium z-30"
        >
          Tap anywhere to start
        </motion.p>
      )}
    </motion.div>
  );
}