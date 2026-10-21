import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Edit2, Check, X, UploadCloud, User, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { updateProfile, updateEmail } from "firebase/auth";
import { useAuth, isProfileComplete } from "../context/AuthContext";
import { updateMyProfile } from "../lib/api";

const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`;



// Center chain holding the heavy ID card
const NUM_MAIN_LINKS = 6;
const MAIN_LINK_LEN = 14;

// Side mini-chains holding the Heart (left) and Star (right) charms
const NUM_SIDE_LINKS = 4;
const SIDE_LINK_LEN = 11;

export default function Account() {
  const { firebaseUser, profile, loading, logOut, refreshProfile, updateLocalProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAfterSave = (location.state as { from?: string } | null)?.from;

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [statusRank, setStatusRank] = useState("Charm Addict");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const profileDone = isProfileComplete(profile);
  const needsSetup = !loading && Boolean(firebaseUser) && !profileDone;

  useEffect(() => {
    if (needsSetup) {
      setIsEditingAddress(true);
      setShowDeliveryModal(true);
    }
  }, [needsSetup]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // DOM Refs for 60fps autonomous articulation
  const mainLinkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftLinkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightLinkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heartCharmRef = useRef<HTMLDivElement>(null);
  const starCharmRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // --- AUTONOMOUS MULTI-CHAIN SWAY ENGINE ---
  useEffect(() => {
    let rafId: number;
    const startTime = performance.now();

    // All three chains hook onto the bottom of the central Split O-Ring (y = 76px)
    const RING_BOTTOM_Y = 76;

    const animateSway = (now: number) => {
      const t = (now - startTime) * 0.0015;

      // 1. CENTER MAIN CHAIN + ID BADGE
      let mainX = 0;
      let mainY = RING_BOTTOM_Y + 4;

      for (let i = 0; i < NUM_MAIN_LINKS; i++) {
        const wave = Math.sin(t - i * 0.14) * 0.042 + Math.cos(t * 0.65 - i * 0.08) * 0.015;
        const theta = wave * (1 + i * 0.08);

        const nextX = mainX + Math.sin(theta) * MAIN_LINK_LEN;
        const nextY = mainY + Math.cos(theta) * MAIN_LINK_LEN;

        const el = mainLinkRefs.current[i];
        if (el) {
          const midX = (mainX + nextX) / 2;
          const midY = (mainY + nextY) / 2;
          const deg = -theta * (180 / Math.PI);
          el.style.transform = `translate3d(${midX}px, ${midY}px, 0) translate(-50%, -50%) rotate(${deg}deg)`;
        }

        mainX = nextX;
        mainY = nextY;
      }

      const cardTheta = Math.sin(t - NUM_MAIN_LINKS * 0.14 - 0.2) * 0.04 + Math.cos(t * 0.65) * 0.012;
      if (cardRef.current) {
        const cardDeg = -cardTheta * (180 / Math.PI);
        cardRef.current.style.transform = `translate3d(${mainX}px, ${mainY}px, 0) translate(-50%, 0) rotate(${cardDeg}deg)`;
      }

      // 2. LEFT SUB-CHAIN + PUFFY HEART CHARM
      let leftX = -7;
      let leftY = RING_BOTTOM_Y - 2;

      for (let i = 0; i < NUM_SIDE_LINKS; i++) {
        const baseAngle = -0.58 + i * 0.075;
        const sway = Math.sin(t * 1.25 - i * 0.22 + 0.6) * 0.065;
        const theta = baseAngle + sway;

        const nextX = leftX + Math.sin(theta) * SIDE_LINK_LEN;
        const nextY = leftY + Math.cos(theta) * SIDE_LINK_LEN;

        const el = leftLinkRefs.current[i];
        if (el) {
          const midX = (leftX + nextX) / 2;
          const midY = (leftY + nextY) / 2;
          const deg = -theta * (180 / Math.PI);
          el.style.transform = `translate3d(${midX}px, ${midY}px, 0) translate(-50%, -50%) rotate(${deg}deg)`;
        }

        leftX = nextX;
        leftY = nextY;
      }

      if (heartCharmRef.current) {
        const heartDeg = 12 + Math.sin(t * 1.25 - 0.8) * 6;
        heartCharmRef.current.style.transform = `translate3d(${leftX}px, ${leftY}px, 0) translate(-50%, -6px) rotate(${heartDeg}deg)`;
      }

      // 3. RIGHT SUB-CHAIN + STAR CHARM
      let rightX = 7;
      let rightY = RING_BOTTOM_Y - 2;

      for (let i = 0; i < NUM_SIDE_LINKS; i++) {
        const baseAngle = 0.60 - i * 0.075;
        const sway = Math.sin(t * 1.18 - i * 0.22 + 1.9) * 0.065;
        const theta = baseAngle + sway;

        const nextX = rightX + Math.sin(theta) * SIDE_LINK_LEN;
        const nextY = rightY + Math.cos(theta) * SIDE_LINK_LEN;

        const el = rightLinkRefs.current[i];
        if (el) {
          const midX = (rightX + nextX) / 2;
          const midY = (rightY + nextY) / 2;
          const deg = -theta * (180 / Math.PI);
          el.style.transform = `translate3d(${midX}px, ${midY}px, 0) translate(-50%, -50%) rotate(${deg}deg)`;
        }

        rightX = nextX;
        rightY = nextY;
      }

      if (starCharmRef.current) {
        const starDeg = -14 + Math.sin(t * 1.18 - 0.5) * 6.5;
        starCharmRef.current.style.transform = `translate3d(${rightX}px, ${rightY}px, 0) translate(-50%, -6px) rotate(${starDeg}deg)`;
      }

      rafId = requestAnimationFrame(animateSway);
    };

    rafId = requestAnimationFrame(animateSway);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (firebaseUser || profile) {
      setNewName(profile?.name || firebaseUser?.displayName || "");
      setNewEmail(profile?.email || firebaseUser?.email || "");
      setNewPhone(profile?.phone || firebaseUser?.phoneNumber || "");
      setNewAddress(profile?.address || "");
      setNewCity(profile?.city || "");
      setNewState(profile?.state || "");
      setNewPincode(profile?.pincode || "");
      setNewPhoto(firebaseUser?.photoURL || "");

      
    }
  }, [firebaseUser, profile, isEditing, showDeliveryModal]);

  const handleLogOut = async () => {
    setIsLoggingOut(true);
    await logOut();
    navigate("/");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setNewPhoto(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firebaseUser) return;
    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      city: newCity.trim(),
      state: newState.trim() || undefined,
      pincode: newPincode.trim(),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.address || !payload.city || !payload.pincode) {
      setErrorMsg("Please fill in your name, email, phone, address, city, and pincode.");
      setIsSaving(false);
      return;
    }

    try {
      localStorage.setItem(`bc-rank-${firebaseUser.uid}`, statusRank);

      // Persist immediately in local profile cache so checkout & profile state work seamlessly
      updateLocalProfile({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        city: payload.city,
        state: payload.state ?? null,
        pincode: payload.pincode,
        profileCompleted: true,
      });

      await updateMyProfile(payload).catch((err) => {
        console.warn("Backend profile sync pending:", err);
      });

      if (newName !== firebaseUser.displayName || newPhoto !== firebaseUser.photoURL) {
        await updateProfile(firebaseUser, {
          displayName: newName.trim(),
          photoURL: newPhoto,
        }).catch(() => {});
      }

      if (newEmail.trim() && newEmail !== firebaseUser.email) {
        await updateEmail(firebaseUser, newEmail.trim()).catch(() => {});
      }

      await refreshProfile();
      setIsEditing(false);
      setIsEditingAddress(false);
      setShowDeliveryModal(false);

      if (redirectAfterSave) {
        navigate(redirectAfterSave, { replace: true });
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      setErrorMsg(error?.message || "Failed to save profile. Please check all required fields.");
    } finally {
      setIsSaving(false);
    }
  };

  const serialNumber = firebaseUser?.uid ? firebaseUser.uid.substring(0, 8).toUpperCase() : "000-000";

  return (
    <div className="min-h-screen bg-cream pt-20 pb-24 px-5 flex flex-col items-center overflow-hidden select-none">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
          .font-handwritten { font-family: 'Caveat', cursive; }
        `}
      </style>

      {/* SHARED HIGH-GLOSS CHROME SVG GRADIENTS & LIGHTING */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          {/* Polished Flat Metal Clip Surface */}
          <linearGradient id="clip-surface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="15%" stopColor="#e4e7ec" />
            <stop offset="50%" stopColor="#b8bdc6" />
            <stop offset="78%" stopColor="#6c717a" />
            <stop offset="92%" stopColor="#26282c" />
            <stop offset="100%" stopColor="#d0d4dc" />
          </linearGradient>

          {/* High-Contrast 3D Chrome Torus Ring */}
          <linearGradient id="chrome-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="18%" stopColor="#d4d7dc" />
            <stop offset="42%" stopColor="#484c54" />
            <stop offset="55%" stopColor="#f8f9fa" />
            <stop offset="78%" stopColor="#858a94" />
            <stop offset="100%" stopColor="#1e2024" />
          </linearGradient>

          {/* Horizontal Cylinder Chrome for side-facing links */}
          <linearGradient id="chrome-cylinder" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2c2f36" />
            <stop offset="28%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#b0b5bd" />
            <stop offset="82%" stopColor="#3b3f46" />
            <stop offset="100%" stopColor="#9ca1a9" />
          </linearGradient>

          {/* Puffy 3D Radial Chrome for the Heart Charm */}
          <radialGradient id="puffy-chrome-heart" cx="34%" cy="32%" r="68%" fx="28%" fy="26%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="22%" stopColor="#f3f4f6" />
            <stop offset="48%" stopColor="#b4b9c2" />
            <stop offset="74%" stopColor="#4e525b" />
            <stop offset="90%" stopColor="#1f2126" />
            <stop offset="100%" stopColor="#9ea4b0" />
          </radialGradient>

          {/* Beveled Metallic Surface for the Star Charm */}
          <linearGradient id="star-chrome" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#e5e7eb" />
            <stop offset="65%" stopColor="#9ba1ab" />
            <stop offset="88%" stopColor="#3f434a" />
            <stop offset="100%" stopColor="#1f2124" />
          </linearGradient>

          {/* Rim Specular Highlight */}
          <linearGradient id="chrome-specular" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
          </linearGradient>

          <filter id="metal-drop-shadow" x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.2" floodColor="#1a110e" floodOpacity="0.34" />
          </filter>
        </defs>
      </svg>

      {errorMsg && (
        <div className="mb-4 bg-cola-red/10 border border-cola-red text-cola-red px-4 py-2 rounded-xl text-sm max-w-sm text-center z-50">
          {errorMsg}
        </div>
      )}

      {/* Stage Container */}
<div className="relative w-full max-w-[360px] h-[800px] sm:h-[760px]">
        {/* 1. TOP RECTANGULAR SILVER CLIP & SPLIT O-RING (From your reference image) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <svg width="90" height="92" viewBox="0 0 90 92" className="overflow-visible">
            <g filter="url(#metal-drop-shadow)">
              {/* Large Split O-Ring hanging under the clip */}
              <circle
                cx="45"
                cy="62"
                r="16"
                fill="none"
                stroke="url(#chrome-body)"
                strokeWidth="4.8"
              />
              <circle
                cx="45"
                cy="62"
                r="16"
                fill="none"
                stroke="url(#chrome-specular)"
                strokeWidth="1.2"
              />

              {/* Side hinge pins on the alligator clip */}
              <rect x="25" y="18" width="4" height="12" rx="2" fill="url(#chrome-cylinder)" />
              <rect x="61" y="18" width="4" height="12" rx="2" fill="url(#chrome-cylinder)" />

              {/* Main Rectangular Silver Clip Body */}
              <rect
                x="28"
                y="2"
                width="34"
                height="48"
                rx="4"
                fill="url(#clip-surface)"
                stroke="#2b2e33"
                strokeWidth="0.8"
              />
              {/* Top & Left glossy bevel highlight inside clip */}
              <path
                d="M 31 46 L 31 5 L 59 5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                 strokeLinejoin="round"
                opacity="0.9"
              />
              {/* Bottom dark rolled metal lip of the clip */}
              <rect x="29" y="42" width="32" height="6" rx="2" fill="#202226" />
              <line x1="31" y1="43.5" x2="59" y2="43.5" stroke="#ffffff" strokeWidth="1" opacity="0.65" />

              {/* Center vertical bail hooking into the top of the main chain */}
              <rect
                x="41.5"
                y="67"
                width="7"
                height="20"
                rx="3.5"
                fill="url(#chrome-cylinder)"
                stroke="#25282c"
                strokeWidth="0.6"
              />
              <line x1="43.8" y1="69" x2="43.8" y2="85" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* 2. LEFT SUB-CHAIN LINKS (Leading to Puffy Heart Charm) */}
        {Array.from({ length: NUM_SIDE_LINKS }).map((_, i) => (
          <div
            key={`left-${i}`}
            ref={(el) => {
              leftLinkRefs.current[i] = el;
            }}
            style={{ zIndex: i % 2 === 0 ? 22 : 26 }}
            className="absolute top-0 left-1/2 pointer-events-none will-change-transform"
          >
            {i % 2 === 0 ? (
              <svg width="18" height="24" viewBox="0 0 18 24" className="overflow-visible">
                <g filter="url(#metal-drop-shadow)">
                  <rect
                    x="3"
                    y="2"
                    width="12"
                    height="20"
                    rx="6"
                    fill="none"
                    stroke="url(#chrome-body)"
                    strokeWidth="3.8"
                  />
                </g>
              </svg>
            ) : (
              <svg width="12" height="20" viewBox="0 0 12 20" className="overflow-visible">
                <g filter="url(#metal-drop-shadow)">
                  <rect x="3" y="2" width="6" height="16" rx="3" fill="url(#chrome-cylinder)" />
                </g>
              </svg>
            )}
          </div>
        ))}

        {/* 3. PUFFY 3D SILVER HEART CHARM (Left Branch) */}
        <div
          ref={heartCharmRef}
          style={{ transformOrigin: "50% 6px", zIndex: 28 }}
          className="absolute top-0 left-1/2 pointer-events-none will-change-transform"
        >
          <svg width="56" height="60" viewBox="0 0 56 60" className="overflow-visible">
            <g filter="url(#metal-drop-shadow)">
              {/* Top jump ring on heart */}
              <circle cx="28" cy="8" r="5.5" fill="none" stroke="url(#chrome-body)" strokeWidth="3.2" />
              {/* 3D Puffy Heart Body */}
              <path
                d="M 28 52 C 28 52, 6 38, 6 22 C 6 12, 16 10, 24 16 C 26.5 18, 28 20.5, 28 20.5 C 28 20.5, 29.5 18, 32 16 C 40 10, 50 12, 50 22 C 50 38, 28 52, 28 52 Z"
                fill="url(#puffy-chrome-heart)"
                stroke="#3a3d45"
                strokeWidth="0.7"
              />
              {/* Glossy curved studio reflection on upper-left lobe */}
              <ellipse
                cx="18"
                cy="22"
                rx="6"
                ry="3.5"
                transform="rotate(-28 18 22)"
                fill="#ffffff"
                opacity="0.85"
              />
              {/* Secondary soft rim highlight */}
              <path
                d="M 11 26 C 12 35, 23 44, 27.5 48"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.55"
              />
            </g>
          </svg>
        </div>

        {/* 4. RIGHT SUB-CHAIN LINKS (Leading to Silver Star Charm) */}
        {Array.from({ length: NUM_SIDE_LINKS }).map((_, i) => (
          <div
            key={`right-${i}`}
            ref={(el) => {
              rightLinkRefs.current[i] = el;
            }}
            style={{ zIndex: i % 2 === 0 ? 22 : 26 }}
            className="absolute top-0 left-1/2 pointer-events-none will-change-transform"
          >
            {i % 2 === 0 ? (
              <svg width="18" height="24" viewBox="0 0 18 24" className="overflow-visible">
                <g filter="url(#metal-drop-shadow)">
                  <rect
                    x="3"
                    y="2"
                    width="12"
                    height="20"
                    rx="6"
                    fill="none"
                    stroke="url(#chrome-body)"
                    strokeWidth="3.8"
                  />
                </g>
              </svg>
            ) : (
              <svg width="12" height="20" viewBox="0 0 12 20" className="overflow-visible">
                <g filter="url(#metal-drop-shadow)">
                  <rect x="3" y="2" width="6" height="16" rx="3" fill="url(#chrome-cylinder)" />
                </g>
              </svg>
            )}
          </div>
        ))}

        {/* 5. BEVELED 3D SILVER STAR CHARM (Right Branch) */}
        <div
          ref={starCharmRef}
          style={{ transformOrigin: "50% 6px", zIndex: 28 }}
          className="absolute top-0 left-1/2 pointer-events-none will-change-transform"
        >
          <svg width="58" height="62" viewBox="0 0 58 62" className="overflow-visible">
            <g filter="url(#metal-drop-shadow)">
              {/* Top jump ring on star */}
              <circle cx="29" cy="7" r="5" fill="none" stroke="url(#chrome-body)" strokeWidth="3.2" />
              {/* 5-Pointed Metallic Star */}
              <polygon
                points="29,11 34.8,24.2 49,25.8 38.2,35.4 41.2,49.5 29,42.2 16.8,49.5 19.8,35.4 9,25.8 23.2,24.2"
                fill="url(#star-chrome)"
                stroke="#373a40"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              {/* Inner 3D facet lines for realistic metallic bevel */}
              <polyline
                points="29,12.5 29,31 47,26.2"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <polyline
                points="11,26.2 29,31 17.5,48"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                opacity="0.6"
              />
            </g>
          </svg>
        </div>

        {/* 6. CENTER MAIN CHAIN LINKS (Leading down to the ID Badge) */}
        {Array.from({ length: NUM_MAIN_LINKS }).map((_, i) => (
          <div
            key={`main-${i}`}
            ref={(el) => {
              mainLinkRefs.current[i] = el;
            }}
            style={{ zIndex: i % 2 === 0 ? 15 : 24 }}
            className="absolute top-0 left-1/2 pointer-events-none will-change-transform"
          >
            {i % 2 === 0 ? (
              <svg width="24" height="32" viewBox="0 0 24 32" className="overflow-visible">
                <g filter="url(#metal-drop-shadow)">
                  <rect
                    x="3.5"
                    y="2.5"
                    width="17"
                    height="27"
                    rx="8.5"
                    fill="none"
                    stroke="url(#chrome-body)"
                    strokeWidth="5"
                  />
                  <rect
                    x="3"
                    y="2"
                    width="18"
                    height="28"
                    rx="9"
                    fill="none"
                    stroke="url(#chrome-specular)"
                    strokeWidth="1.1"
                  />
                </g>
              </svg>
            ) : (
              <svg width="14" height="28" viewBox="0 0 14 28" className="overflow-visible">
                <g filter="url(#metal-drop-shadow)">
                  <rect
                    x="3"
                    y="2"
                    width="8"
                    height="24"
                    rx="4"
                    fill="url(#chrome-cylinder)"
                    stroke="#2b2e33"
                    strokeWidth="0.6"
                  />
                  <line
                    x1="5.8"
                    y1="4"
                    x2="5.8"
                    y2="24"
                    stroke="#ffffff"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </g>
              </svg>
            )}
          </div>
        ))}

        {/* 7. HANGING ID BADGE */}
        <div
          ref={cardRef}
          style={{ transformOrigin: "50% 0px" }}
          className="absolute top-0 left-1/2 w-[330px] sm:w-[340px] z-20 will-change-transform"
        >
          {/* U-Shaped Metal Badge Hook looping into the pouch slot hole */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none z-30">
            <svg width="36" height="44" viewBox="0 0 36 44" className="overflow-visible">
              <g filter="url(#metal-drop-shadow)">
                <circle
                  cx="18"
                  cy="9"
                  r="7"
                  fill="none"
                  stroke="url(#chrome-body)"
                  strokeWidth="4.5"
                />
                <path
                  d="M 13 13 C 11 24, 12 35, 18 35 C 24 35, 25 24, 21 15"
                  fill="none"
                  stroke="url(#chrome-cylinder)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 12.5 14 C 11 23, 12 33, 17.5 33.5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </g>
            </svg>
          </div>

          {/* Clear Plastic Pouch */}
          <div className="relative bg-white/25 backdrop-blur-[3px] border-2 border-white/75 rounded-2xl p-3 sm:p-4 shadow-[0_25px_50px_rgba(0,0,0,0.14),inset_0_0_24px_rgba(255,255,255,0.75)]">
            {/* Top Slot Hole & Side Rivets */}
            <div className="flex justify-between items-center px-6 mb-2 pt-0.5 pointer-events-none">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/80 bg-cream/60 shadow-[inset_0_2px_3px_rgba(0,0,0,0.2)]" />
              <div className="w-12 h-3.5 rounded-full border-2 border-white/80 bg-cream/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]" />
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/80 bg-cream/60 shadow-[inset_0_2px_3px_rgba(0,0,0,0.2)]" />
            </div>

            {/* Ziploc seal line */}
            <div className="absolute top-10 inset-x-0 h-1 border-y border-white/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] pointer-events-none" />

            {/* Paper Card */}
            <div className="relative mt-4 bg-[#fdfbf7] rounded-sm shadow-sm overflow-hidden border border-black/5">
              <div
                className="absolute inset-0 mix-blend-multiply opacity-50 pointer-events-none"
                style={{ backgroundImage: PAPER_TEXTURE }}
              />

              <div className="relative z-10 p-5 sm:p-6 flex flex-col items-center text-center">
                <div className="w-full text-left mb-6 border-b-2 border-espresso pb-2 relative">
                  <span className="absolute top-0 right-0 text-[9px] uppercase tracking-widest text-espresso/60">
                    Tier: {profile?.isAdmin ? "Admin" : "Member"}
                  </span>
                  <h1 className="font-display text-4xl leading-none text-espresso tracking-tight uppercase">
                    The
                    <br />
                    Collector
                  </h1>
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-espresso mt-2">
                    Official Member · BerryCola
                  </p>
                </div>

                {/* PROFILE IMAGE UPLOAD */}
                <div
                  className={`relative w-32 h-32 mb-6 p-1 bg-white border border-espresso/15 shadow-sm rotate-1 group ${
                    isEditing ? "cursor-pointer hover:border-cola-red transition-colors" : ""
                  }`}
                  onClick={() => isEditing && fileInputRef.current?.click()}
                >
                  {newPhoto || firebaseUser?.photoURL ? (
                    <img
                      src={isEditing ? newPhoto : firebaseUser?.photoURL || ""}
                      alt="Profile"
                      draggable={false}
                      className="w-full h-full object-cover filter contrast-110 saturate-110 pointer-events-none"
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#e8dff5] flex items-center justify-center">
                      <User size={40} className="text-espresso/30" />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />

                  {isEditing && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-center">
                      <UploadCloud size={24} className="text-espresso mb-1" />
                      <span className="text-[9px] uppercase font-bold text-espresso tracking-widest">
                        Upload
                        <br />
                        Photo
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full flex flex-col gap-5 mt-2">
                  {/* NAME ROW */}
                  <div className="relative flex items-end border-b-[1.5px] border-dashed border-espresso/40 pb-1">
                    <span className="text-[10px] uppercase tracking-widest text-espresso font-semibold w-20 text-left">
                      Name
                    </span>

                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1 z-20">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="font-handwritten text-3xl leading-none text-espresso/90 bg-white/50 border border-espresso/20 rounded px-2 outline-none w-full -rotate-2 -mb-2 shadow-inner"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="font-handwritten text-3xl leading-none text-espresso/90 absolute left-20 bottom-1 -rotate-2 truncate max-w-[130px]">
                          {profile?.name || firebaseUser?.displayName || "Guest"}
                        </span>
                        <button
                          onClick={() => {
                            setIsEditingAddress(!profileDone);
                            setShowDeliveryModal(true);
                          }}
                          className="absolute right-0 bottom-1 z-20 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold bg-espresso/5 border border-espresso/10 text-espresso/60 px-2 py-1 rounded-md hover:bg-cola-red hover:text-cream hover:border-cola-red transition-all shadow-sm cursor-pointer"
                        >
                          <Edit2 size={10} /> Edit
                        </button>
                      </>
                    )}
                  </div>

                  {/* EMAIL ROW */}
                  <div className="relative flex items-end border-b-[1.5px] border-dashed border-espresso/40 pb-1">
                    <span className="text-[10px] uppercase tracking-widest text-espresso font-semibold w-20 text-left">
                      Email
                    </span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="font-handwritten text-2xl leading-none text-espresso/90 bg-white/50 border border-espresso/20 rounded px-2 outline-none w-full -mb-1 shadow-inner truncate"
                      />
                    ) : (
                      <span className="font-handwritten text-2xl leading-none text-espresso/90 absolute left-20 bottom-1 truncate max-w-[160px]">
                        {profile?.email || firebaseUser?.email || "Unknown"}
                      </span>
                    )}
                  </div>

                 

                  {/* DELIVERY ROW */}
                  <div className="relative flex items-center justify-between border-b-[1.5px] border-dashed border-espresso/40 pb-1.5 pt-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-espresso font-semibold w-20 text-left">
                      Delivery
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAddress(!profileDone);
                        setShowDeliveryModal(true);
                      }}
                      className="flex items-center gap-1.5 text-[9px] font-bold uppercase  text-espresso bg-espresso/5 hover:bg-cola-red hover:text-cream px-2 py-1 rounded-md border border-espresso/15 transition-all cursor-pointer shadow-sm ml-auto z-20"
                    >
                      <MapPin size={10} className="text-cola-red" />
                      <span className="truncate max-w-[130px]">
                        {profile?.city ? `${profile.city}, ${profile.pincode}` : "+ Add Address"}
                      </span>
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="w-full flex justify-end gap-2 mt-4 z-20 relative">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-espresso/10 text-espresso p-2 rounded-md hover:bg-espresso/20 transition-colors shadow-sm"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleSaveProfile()}
                      disabled={isSaving}
                      className="bg-cola-red text-cream p-2 rounded-md hover:bg-cola-red-dark transition-colors shadow-sm"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                )}

                <div className="w-full flex justify-between items-end mt-8">
                  <span className="text-[7px] uppercase tracking-widest text-espresso/50 text-left max-w-[100px] leading-tight">
                    The holder of this card is an official BerryCola collector.
                  </span>
                  <span className="font-display text-xl tracking-widest text-espresso">
                    {serialNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* ACTION DOCK UNDERNEATH HANGING BADGE */}
      {/* Changed from z-30 to relative z-10 so the chains (z-15+) float above it */}
      <div className="relative flex flex-wrap items-center justify-center gap-3 mt-4 z-10">
        <button
          type="button"
          onClick={() => {
            setIsEditingAddress(!profileDone);
            setShowDeliveryModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#fbf5e9] text-espresso border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 hover:text-cola-red text-xs font-bold uppercase  transition-all cursor-pointer"
        >
          <MapPin size={14} className="text-cola-red" />
          {profileDone ? (
            <span>
              Delivery Address: <span className="font-semibold">{profile?.city || "Saved"}, {profile?.pincode}</span>
            </span>
          ) : (
            <span className="text-cola-red">+ Add Shipping Address</span>
          )}
          <span
            className={`w-2 h-2 rounded-full ${
              profileDone ? "bg-emerald-500" : "bg-cola-red animate-ping"
            }`}
          />
        </button>

        {redirectAfterSave === "/checkout" && profileDone && (
          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 hover:bg-[#b81d1d] text-xs font-bold uppercase  transition-all cursor-pointer"
          >
            Checkout <ArrowRight size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={handleLogOut}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white text-espresso/75 border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 hover:text-cola-red text-xs font-bold uppercase  transition-all cursor-pointer disabled:opacity-50"
        >
          <LogOut size={13} />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>

      {/* SHIPPING & DELIVERY ADDRESS MODAL */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 bg-[#1e1a18]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop click to close (when setup is complete) */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => {
              if (!needsSetup) setShowDeliveryModal(false);
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_8px_0_#1e1a18] rounded-3xl p-6 sm:p-8 text-espresso my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-dashed border-[#1e1a18]/20 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] flex items-center justify-center text-cola-red shrink-0">
                  <MapPin size={22} />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-espresso leading-tight">
                    {isEditingAddress
                      ? needsSetup
                        ? "Complete Delivery Profile"
                        : "Edit Delivery Address"
                      : "Shipping & Delivery Address"}
                  </h2>
                  <p className="text-xs text-espresso/65 mt-0.5">
                    {isEditingAddress
                      ? "Saved once so checkout and dispatch are always instant."
                      : "Official recipient and shipping destination for your orders."}
                  </p>
                </div>
              </div>

              {!needsSetup && (
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="w-8 h-8 rounded-full bg-white border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center text-espresso hover:text-cola-red transition-all cursor-pointer shrink-0"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Modal Content */}
            {!isEditingAddress && profileDone ? (
              /* VIEW MODE */
              <div className="flex flex-col gap-5">
                <div className="bg-white border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#1e1a18]/10 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase  text-espresso/50 block">Recipient</span>
                      <span className="text-base font-bold text-espresso">{profile?.name || "Collector"}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase  px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Primary Address
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-espresso/85">
                    <div>
                      <span className="text-[10px] font-bold uppercase  text-espresso/50 block mb-0.5">Contact</span>
                      <p className="flex items-center gap-1.5 font-medium">
                        <Phone size={12} className="text-cola-red shrink-0" />
                        {profile?.phone || "—"}
                      </p>
                      <p className="flex items-center gap-1.5 font-medium mt-1 truncate">
                        <Mail size={12} className="text-cola-red shrink-0" />
                        {profile?.email || "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase  text-espresso/50 block mb-0.5">Shipping Destination</span>
                      <p className="font-medium leading-relaxed">
                        {profile?.address}
                        <br />
                        {profile?.city}{profile?.state ? `, ${profile.state}` : ""}
                        <br />
                        <span className="font-bold text-espresso">{profile?.pincode}</span> · India
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-espresso border-2 border-[#1e1a18] shadow-[0_2.5px_0_#1e1a18] active:translate-y-0.5 hover:text-cola-red text-xs font-bold uppercase  transition-all cursor-pointer"
                  >
                    <Edit2 size={13} /> Edit Address
                  </button>

                  {redirectAfterSave === "/checkout" ? (
                    <button
                      type="button"
                      onClick={() => navigate("/checkout")}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 hover:bg-[#b81d1d] text-xs font-bold uppercase  transition-all cursor-pointer"
                    >
                      Proceed to Checkout <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeliveryModal(false)}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-espresso text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_2.5px_0_#1e1a18] active:translate-y-0.5 text-xs font-bold uppercase  transition-all cursor-pointer"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-[11px] font-bold uppercase  text-espresso/70">
                  Full Name *
                  <input
                    required
                    type="text"
                    placeholder="Your full name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm font-semibold text-espresso focus:outline-none focus:border-cola-red"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-[11px] font-bold uppercase  text-espresso/70">
                    Email Address *
                    <input
                      required
                      type="email"
                      placeholder="you@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm font-semibold text-espresso focus:outline-none focus:border-cola-red"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-bold uppercase  text-espresso/70">
                    Phone Number *
                    <input
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm font-semibold text-espresso focus:outline-none focus:border-cola-red"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-[11px] font-bold uppercase  text-espresso/70">
                  Street Address / Flat / Building *
                  <input
                    required
                    type="text"
                    placeholder="Flat No., Wing, Building, Street, Area"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm font-semibold text-espresso focus:outline-none focus:border-cola-red"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1 text-[11px] font-bold uppercase  text-espresso/70">
                    City *
                    <input
                      required
                      type="text"
                      placeholder="Mumbai"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm font-semibold text-espresso focus:outline-none focus:border-cola-red"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-bold uppercase  text-espresso/70">
                    State
                    <input
                      type="text"
                      placeholder="Maharashtra"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm font-semibold text-espresso focus:outline-none focus:border-cola-red"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-bold uppercase  text-espresso/70">
                    Pincode *
                    <input
                      required
                      type="text"
                      placeholder="400001"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm font-semibold text-espresso focus:outline-none focus:border-cola-red"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
                  {!needsSetup && profileDone && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="px-5 py-2.5 rounded-full bg-white text-espresso border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] active:translate-y-0.5 text-xs font-bold uppercase  transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 hover:bg-[#b81d1d] text-xs font-bold uppercase  transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check size={14} />
                    {isSaving
                      ? "Saving Address…"
                      : redirectAfterSave === "/checkout"
                        ? "Save & Continue to Checkout →"
                        : "Save Delivery Address"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}