interface AnnouncementBannerProps {
  visible: boolean;
  messages: string[];
}

export default function AnnouncementBanner({ visible, messages }: AnnouncementBannerProps) {
  const content = messages.map((message) => message.trim()).filter(Boolean);
  if (!visible || content.length === 0) return null;

  return (
    <div
      className="announcement-banner fixed inset-x-0 top-0 z-[60] h-8 overflow-hidden bg-cola-red text-white"
      role="region"
      aria-label="Store announcement"
    >
      <div className="announcement-track flex h-full w-max items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-[11px]">
        {[0, 1].map((copy) => (
          <span key={copy} aria-hidden={copy === 1} className="inline-flex shrink-0 items-center">
            {content.map((message, index) => (
              <span key={`${copy}-${index}`} className="inline-flex items-center">
                <span className="px-8">{message}</span>
                {index < content.length - 1 && <span aria-hidden="true" className="text-white/70">✦</span>}
              </span>
            ))}
            <span aria-hidden="true" className="px-8 text-white/70">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
