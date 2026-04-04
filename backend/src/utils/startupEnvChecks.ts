import { logRazorpayConfigStatus } from "../services/paymentService";

export const logStartupEnvChecks = () => {
  const razorpayStatus = logRazorpayConfigStatus("startup");

  if (!razorpayStatus.hasKeyId || !razorpayStatus.hasKeySecret) {
    console.error(
      "[Startup] Razorpay environment variables are missing. Check backend/.env on the VPS and restart PM2."
    );
  }

  if (razorpayStatus.modeMismatch) {
    console.error(
      `[Startup] Razorpay mode mismatch detected. RAZORPAY_KEY_ID uses ${razorpayStatus.keyIdPrefix} while RAZORPAY_KEY_SECRET uses ${razorpayStatus.keySecretPrefix}.`
    );
  }
};
