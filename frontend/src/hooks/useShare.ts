import { useState } from "react";
import { useToast } from "../context/ToastContext";

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export const useShare = () => {
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const { showToast } = useToast();

  const share = async (data: ShareData) => {
    setShareData(data);

    // Try native share first (only works on HTTPS or localhost)
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Native share failed:", err);
        } else {
          // User cancelled native share
          return;
        }
      }
    }

    // Fallback: Open custom share sheet for HTTP or unsupported browsers
    setIsShareSheetOpen(true);
  };

  const closeShareSheet = () => {
    setIsShareSheetOpen(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showToast("Link copied to clipboard!", "success");
        return true;
      }
      
      // Legacy fallback for non-secure contexts (HTTP)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showToast("Link copied to clipboard!", "success");
        return true;
      }
    } catch (err) {
      console.error("Clipboard fallback failed:", err);
    }
    
    showToast("Failed to copy link", "error");
    return false;
  };

  return {
    share,
    isShareSheetOpen,
    shareData,
    closeShareSheet,
    copyToClipboard,
  };
};
