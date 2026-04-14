import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Twitter, Facebook, Copy, Share2 } from "lucide-react";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    title?: string;
    text?: string;
    url?: string;
  } | null;
  onCopyPath: (text: string) => void;
}

const ShareSheet: React.FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  shareData,
  onCopyPath,
}) => {
  if (!shareData) return null;

  const url = shareData.url || window.location.href;
  const text = shareData.text || "";
  const title = shareData.title || "Laxmart";

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <MessageCircle className="w-6 h-6 text-green-500" />,
      color: "bg-green-50",
      action: () => {
        const message = `${text} ${url}`;
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
        onClose();
      },
    },
    {
      name: "X (Twitter)",
      icon: <Twitter className="w-6 h-6 text-neutral-900" />,
      color: "bg-neutral-100",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(text)}`,
          "_blank"
        );
        onClose();
      },
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-50",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        onClose();
      },
    },
    {
      name: "Copy Link",
      icon: <Copy className="w-6 h-6 text-amber-600" />,
      color: "bg-amber-50",
      action: () => {
        onCopyPath(url);
        onClose();
      },
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] md:z-[60]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-[101] md:z-[61] overflow-hidden"
          >
            <div className="p-6">
              {/* Handle */}
              <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">
                      Share with friends
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Select how you'd like to share
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info Preview (Optional) */}
              {shareData.title && (
                <div className="mb-8 p-4 bg-neutral-50 rounded-2xl flex items-center gap-4 border border-neutral-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {shareData.title}
                    </p>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {url}
                    </p>
                  </div>
                </div>
              )}

              {/* Grid of Options */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`w-14 h-14 ${option.color} rounded-2xl flex items-center justify-center transition-transform group-active:scale-90 group-hover:scale-105`}
                    >
                      {option.icon}
                    </div>
                    <span className="text-[11px] font-medium text-neutral-600 text-center">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* URL Display and Quick Copy */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 flex items-center gap-3 mb-2">
                <div className="flex-1 text-xs text-neutral-500 truncate font-mono">
                  {url}
                </div>
                <button
                  onClick={() => onCopyPath(url)}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 px-3 py-1.5 bg-amber-50 rounded-lg"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Safe Area Spacer for Mobile */}
            <div className="h-6 bg-white" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareSheet;
