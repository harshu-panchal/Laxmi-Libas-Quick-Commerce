export const logStartupEnvChecks = () => {
    const clientId = process.env.PHONEPE_CLIENT_ID?.trim() || '';
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim() || '';
  
    console.log('[Debug] PHONEPE_CLIENT_ID:', clientId ? 'Found' : 'Missing');
    console.log('[Debug] PHONEPE_CLIENT_SECRET:', clientSecret ? 'Found' : 'Missing');
  
    if (!clientId || !clientSecret) {
      console.error(
        "[Startup] PhonePe environment variables are missing. Check backend/.env."
      );
    }
  };
