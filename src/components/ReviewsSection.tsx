import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShieldCheck,
  Camera,
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  createProductReview,
  deleteReview,
  fetchAllReviews,
  fetchProductReviews,
  uploadReviewImage,
  type ReviewItem,
} from "../lib/api";

interface ReviewsSectionProps {
  productId?: string;
  productName?: string;
}

export default function ReviewsSection({
  productId,
}: ReviewsSectionProps) {
  const { firebaseUser, profile } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [canReview, setCanReview] = useState(false);

  // Review Form State
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (profile?.name && !authorName) setAuthorName(profile.name);
    else if (firebaseUser?.displayName && !authorName)
      setAuthorName(firebaseUser.displayName);
  }, [profile, firebaseUser]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      if (productId) {
        const res = await fetchProductReviews(productId);
        setReviews(res.reviews);
        setAverageRating(res.averageRating ?? 0);
        setTotalCount(res.totalCount ?? res.reviews.length);
        setAlreadyReviewed(Boolean(res.alreadyReviewed));
        setCanReview(Boolean(res.canReview));
      } else {
        const res = await fetchAllReviews();
        setReviews(res.reviews);
        setAverageRating(res.averageRating ?? 0);
        setTotalCount(res.totalCount ?? res.reviews.length);
      }
    } catch {
      setReviews([]);
      setAverageRating(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId, firebaseUser]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const uploadedUrl = await uploadReviewImage(file);
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      setError(err?.message || "Could not upload photo. Please try another image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || submitting) return;
    if (!body.trim()) {
      setError("Please share a few words about your charm.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createProductReview(productId, {
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        authorName: authorName.trim() || undefined,
      });
      const updated = [created, ...reviews];
      setReviews(updated);
      setTotalCount(updated.length);
      setAverageRating(
        Number(
          (
            updated.reduce((sum, r) => sum + r.rating, 0) / updated.length
          ).toFixed(1)
        )
      );
      setAlreadyReviewed(true);
      setCanReview(false);
      setShowForm(false);
      setTitle("");
      setBody("");
      setImageUrl("");
      setSuccessMsg("Your verified review has been published!");
    } catch (err: any) {
      setError(
        err?.message ||
          "Only verified buyers who have ordered this charm can submit a review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    try {
      await deleteReview(reviewId);
      loadReviews();
    } catch {
      // Ignore delete error
    }
  };

  // On the homepage (when no productId is passed), if there are no reviews in the DB yet,
  // still show the section header or hide empty grid gracefully.
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* TOP HEADER & VERIFIED TRANSPARENCY BANNER */}
        <div className="bg-[#fbf5e9] border-2 border-[#1e1a18] rounded-3xl p-6 sm:p-8 shadow-[0_5px_0_#1e1a18] mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] text-[11px] font-semibold uppercase tracking-wider text-espresso mb-3">
                <ShieldCheck size={14} className="text-cola-red" />
                100% Verified Buyers Only
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-espresso">
                {productId ? "Collector Reviews & Photos" : "What Collectors Are Saying"}
              </h2>
              <p className="text-sm text-espresso/65 mt-1 max-w-xl">
                For complete transparency, only customers with a confirmed BerryCola order can post ratings and photos.
              </p>
            </div>

            {/* Aggregate Score & Action CTA */}
            <div className="flex flex-wrap items-center gap-4">
              {totalCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18]">
                  <span className="font-display text-3xl text-espresso leading-none">
                    {averageRating.toFixed(1)}
                  </span>
                  <div>
                    <div className="flex items-center gap-0.5 text-cola-red">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={14}
                          fill={n <= Math.round(averageRating) ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] font-medium text-espresso/60 mt-0.5">
                      {totalCount} verified {totalCount === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </div>
              )}

              {productId && (
                <div>
                  {canReview ? (
                    <button
                      type="button"
                      onClick={() => setShowForm((s) => !s)}
                      className="px-5 py-3 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 hover:bg-[#b81d1d] transition-all text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      {showForm ? "Close Form" : "Write a Review"}
                    </button>
                  ) : alreadyReviewed ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border-2 border-[#1e1a18] text-xs font-medium text-emerald-800">
                      <CheckCircle2 size={15} />
                      Reviewed by You
                    </div>
                  ) : firebaseUser ? (
                    <div
                      title="Order this charm to unlock verified review submission"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 border-2 border-[#1e1a18]/50 text-xs font-medium text-espresso/70"
                    >
                      <Lock size={13} className="text-cola-red" />
                      Order this charm to review
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-xs font-semibold text-espresso hover:text-cola-red transition-all"
                    >
                      <Lock size={13} />
                      Sign in (Verified Buyers)
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border-2 border-[#1e1a18] text-emerald-900 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={15} />
              {successMsg}
            </div>
          )}

          {/* WRITE A REVIEW FORM (VERIFIED BUYERS ONLY) */}
          <AnimatePresence>
            {productId && showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitReview}
                className="mt-6 pt-6 border-t-2 border-dashed border-[#1e1a18]/20 space-y-4 overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-2">
                      Your Rating *
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating ?? rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setRating(star)}
                            className={`w-10 h-10 rounded-full border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 flex items-center justify-center transition-all cursor-pointer ${
                              active
                                ? "bg-cola-red text-[#fbf5e9]"
                                : "bg-white text-espresso/40 hover:text-cola-red"
                            }`}
                            aria-label={`Rate ${star} out of 5 stars`}
                          >
                            <Star size={17} fill={active ? "currentColor" : "none"} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 min-w-[200px] max-w-xs">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm text-espresso focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
                      Review Headline (Optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Clips right onto my everyday bag!"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm text-espresso focus:outline-none"
                    />
                  </div>

                  {/* Optional Image Upload */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
                      Add a Photo (Optional)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 text-xs font-semibold text-espresso hover:text-cola-red flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Camera size={15} />
                        {uploadingImage
                          ? "Uploading…"
                          : imageUrl
                            ? "Change Photo"
                            : "Upload Photo"}
                      </button>

                      {imageUrl && (
                        <div className="relative w-11 h-11 rounded-xl border-2 border-[#1e1a18] overflow-hidden bg-white shrink-0">
                          <img
                            src={imageUrl}
                            alt="Review preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#1e1a18] text-white flex items-center justify-center"
                            aria-label="Remove photo"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-espresso mb-1.5">
                    Your Review *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="How does the charm look and feel on your bag or keychain?"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#1e1a18] text-sm text-espresso focus:outline-none resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs font-semibold text-cola-red">{error}</p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || uploadingImage}
                    className="px-6 py-3 rounded-full bg-cola-red text-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] active:translate-y-0.5 hover:bg-[#b81d1d] transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Publishing…" : "Publish Verified Review"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* REVIEWS GRID */}
        {loading ? (
          <p className="text-center text-sm text-espresso/50 py-8">
            Loading verified reviews…
          </p>
        ) : reviews.length === 0 ? (
          <div className="bg-[#fbf5e9] border-2 border-[#1e1a18] rounded-3xl p-8 shadow-[0_4px_0_#1e1a18] text-center">
            <p className="font-display text-lg text-espresso mb-1">
              No verified reviews yet
            </p>
            <p className="text-sm text-espresso/65">
              {productId
                ? "Be the first verified buyer to review this charm!"
                : "Verified collector reviews will appear here as orders are completed."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.slice(0, productId ? 12 : 6).map((rev) => {
              const dateLabel = rev.createdAt
                ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Verified Order";
              const canDelete =
                profile?.isAdmin || (profile?.id && rev.userId === profile.id);

              return (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-[#fbf5e9] border-2 border-[#1e1a18] rounded-3xl p-6 shadow-[0_4px_0_#1e1a18] flex flex-col justify-between gap-4"
                >
                  <div>
                    {/* Top row: Stars + Verified Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-0.5 text-cola-red">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={14}
                            fill={n <= rev.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#1e1a18] text-[10px] font-semibold uppercase tracking-wider text-espresso">
                        <ShieldCheck size={11} className="text-cola-red" />
                        Verified Buyer
                      </span>
                    </div>

                    {rev.title && (
                      <h3 className="font-display text-lg text-espresso mb-1.5">
                        {rev.title}
                      </h3>
                    )}

                    <p className="text-sm text-espresso/75 leading-relaxed">
                      &ldquo;{rev.body}&rdquo;
                    </p>

                    {rev.imageUrl && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setLightboxImage(rev.imageUrl!)}
                          className="group relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#1e1a18] shadow-[0_2px_0_#1e1a18] bg-white block cursor-pointer"
                        >
                          <img
                            src={rev.imageUrl}
                            alt={rev.title || "Customer review photo"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1e1a18]/15 flex items-center justify-between text-xs text-espresso/65">
                    <div>
                      <span className="font-semibold text-espresso">
                        {rev.authorName}
                      </span>
                      <span className="mx-1.5">·</span>
                      <span>{dateLabel}</span>
                      {!productId && rev.productName && (
                        <Link
                          to={`/product/${rev.productId}`}
                          className="block text-[11px] text-cola-red hover:underline mt-0.5 font-medium"
                        >
                          on {rev.productName} →
                        </Link>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(rev.id)}
                        title="Delete review"
                        className="w-7 h-7 rounded-full bg-white border border-[#1e1a18] flex items-center justify-center text-espresso/60 hover:text-cola-red cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[90] bg-espresso/75 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-[#fbf5e9] border-2 border-[#1e1a18] rounded-3xl p-3 shadow-[0_8px_0_#1e1a18]"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-[#fbf5e9] border-2 border-[#1e1a18] shadow-[0_3px_0_#1e1a18] flex items-center justify-center text-espresso hover:text-cola-red cursor-pointer"
                aria-label="Close photo"
              >
                <X size={16} />
              </button>
              <img
                src={lightboxImage}
                alt="Customer review photo"
                className="w-full max-h-[70vh] object-contain rounded-2xl bg-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
