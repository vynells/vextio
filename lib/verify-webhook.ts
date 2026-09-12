import crypto from "crypto";

/**
 * Verifies a Resend (Svix-format) webhook signature.
 * Docs: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
 */
export function verifyResendWebhook(
  body: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  // Reject requests older than 5 minutes to prevent replay attacks
  const timestampSeconds = parseInt(svixTimestamp, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > 300) return false;

  const secretBytes = Buffer.from(secret.split("_")[1] || secret, "base64");
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // svix-signature header can contain multiple space-separated "v1,<sig>" values
  const providedSignatures = svixSignature
    .split(" ")
    .map((s) => s.split(",")[1])
    .filter(Boolean);

  return providedSignatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig, "base64"),
        Buffer.from(expectedSignature, "base64")
      );
    } catch {
      return false;
    }
  });
}
