import { Analytics } from "@vercel/analytics/next";
import ResetPassword from "@/components/auth/resetpassword/resetpassword";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetPassword token={token} />;
}
