import React from "react";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-cream text-espresso flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-espresso/5 flex items-center justify-center text-cola-red mb-2">
          <Sparkles size={28} />
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tight">
          Something Sweet is Coming Soon
        </h1>
        <p className="text-espresso/70 text-sm leading-relaxed">
          We are currently working behind the scenes to get our shop ready. Stay tuned!
        </p>

        {/* Subtle Link for Admin Login
        <Link
          to="/login"
          className="mt-8 text-xs text-espresso/40 hover:text-espresso flex items-center gap-1 transition-colors"
        >
          <Lock size={12} /> Admin Login
        </Link> */}
      </div>
    </div>
  );
}