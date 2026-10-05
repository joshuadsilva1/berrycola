import { useEffect, useRef, useState } from "react";
import { motion, type Transition } from "framer-motion";
import canClosed from "../assets/coke-closed.png";
import canOpened from "../assets/coke-opened.png";
import popSound from "../assets/coke-opening.mp3";

interface IntroSplashProps {
  onFinish: () => void;
}

type Phase = "shaking" | "opened" | "zooming" | "exiting";

const SHAKE_MS = 1550;
const POP_MS = 300;
const ZOOM_MS = 850;
const EXIT_MS = 850;

// A hand-jittered shake, not a clean decaying sine — irregular amplitudes and
// a couple of quick direction reversals, like someone actually gripping and
// rattling the can before cracking it.
const SHAKE_ROTATE = [0, -9, 7, -15, 12, -6, 10, -16, 9, -5, 6, -2, 0];
const SHAKE_X = [0, -5, 4, -7, 6, -4, 5, -6, 3, -3, 2, -1, 0];
const SHAKE_Y = [0, 3, -2, 4, -3, 2, -4, 3, -1, 2, -1, 1, 0];
const SHAKE_TIMES = SHAKE_ROTATE.map((_, i) => i / (SHAKE_ROTATE.length - 1));

const fizzBubbles = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 220,
  y: -(100 + Math.random() * 160),
  delay: Math.random() * 0.15,
  scale: 0.4 + Math.random() * 0.8,
}));

export default function IntroSplash({ onFinish }: IntroSplashProps) {
  const [phase, setPhase] = useState<Phase>("shaking");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    timers.current.push(
      setTimeout(() => {
        setPhase("opened");
        audioRef.current?.play().catch(() => {});
      }, SHAKE_MS),
      setTimeout(() => setPhase("zooming"), SHAKE_MS + POP_MS),
      setTimeout(() => setPhase("exiting"), SHAKE_MS + POP_MS + ZOOM_MS),
      setTimeout(() => finish(), SHAKE_MS + POP_MS + ZOOM_MS + EXIT_MS)
    );
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onFinish();
  };

  const opened = phase === "opened" || phase === "zooming" || phase === "exiting";
  const zoomed = phase === "zooming" || phase === "exiting";

  const canAnimate = () => {
    if (phase === "shaking") return { rotate: SHAKE_ROTATE, x: SHAKE_X, y: SHAKE_Y };
    if (phase === "opened") return { rotate: 0, x: 0, y: 0, scale: [1, 1.14, 1.06] };
    return { rotate: 0, x: 0, y: 0, scale: 2.5 };
  };

  const canTransition = (): Transition => {
    if (phase === "shaking") {
      return { duration: SHAKE_MS / 1000, ease: "easeInOut", times: SHAKE_TIMES };
    }
    if (phase === "opened") {
      return { duration: POP_MS / 1000, ease: "easeOut" };
    }
    return { duration: ZOOM_MS / 1000, ease: [0.5, 0, 0.3, 1] };
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #3c2620 0%, #2a1a15 100%)" }}
      initial={{ clipPath: "circle(150% at 50% 50%)" }}
      animate={{ clipPath: phase === "exiting" ? "circle(0% at 50% 50%)" : "circle(150% at 50% 50%)" }}
      transition={{ duration: EXIT_MS / 1000, ease: [0.76, 0, 0.24, 1] }}
    >
      <audio ref={audioRef} src={popSound} preload="auto" />

      <button
        onClick={finish}
        className="absolute bottom-8 right-8 z-10 text-xs uppercase tracking-[0.2em] text-cream/50 hover:text-cream transition-colors cursor-pointer"
      >
        Skip
      </button>

      <div className="relative flex items-center justify-center" style={{ width: 220, height: 340 }}>
        <motion.div
          className="relative"
          style={{ width: 220, height: 340, transformOrigin: zoomed ? "50% 56%" : "50% 85%" }}
          animate={canAnimate()}
          transition={canTransition()}
        >
          <img
            src={canClosed}
            alt=""
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

        {phase === "opened" && (
          <div className="absolute" style={{ left: "50%", top: "8%" }}>
            {fizzBubbles.map((b) => (
              <motion.span
                key={b.id}
                className="absolute rounded-full bg-cream/80"
                style={{ width: 7 * b.scale, height: 7 * b.scale }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: b.x, y: b.y }}
                transition={{ duration: 0.9, delay: b.delay, ease: "easeOut" }}
              />
            ))}
            <motion.span
              className="absolute rounded-full border-2"
              style={{ borderColor: "#fffffe", width: 20, height: 20, left: -10, top: -10 }}
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 12, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
