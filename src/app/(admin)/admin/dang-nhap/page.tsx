import type { Metadata } from "next";
import { signIn } from "@/auth";
import { getSafeCallbackUrl } from "@/lib/auth/getSafeCallbackUrl";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

interface AdminLoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { callbackUrl, error } = await searchParams;
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-5 py-20">
      <div className="flex w-full max-w-[480px] flex-col items-center gap-8">
        <div className="relative w-full overflow-hidden rounded-lg border border-[rgba(0,40,103,0.05)] bg-surface-container-lowest shadow-md">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-secondary-container/0 via-secondary-container to-secondary-container/0" />

          <div className="flex flex-col items-center p-12">
            <div className="flex w-full flex-col items-center gap-2">
              <h1 className="text-center text-[40px] uppercase leading-[1.15] tracking-[0.1em] text-primary">
                Otter Beer
              </h1>
              <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Cổng quản trị
              </p>
            </div>

            <div className="my-8 h-px w-12 bg-[rgba(196,198,210,0.3)]" />

            {error ? (
              <p
                role="alert"
                className="mb-4 w-full rounded bg-error-container px-4 py-3 text-center text-sm text-on-error-container"
              >
                Truy cập bị từ chối. Tài khoản của bạn chưa được cấp quyền
                hoặc đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.
              </p>
            ) : null}

            <form
              className="w-full"
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: safeCallbackUrl });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold uppercase tracking-[0.1em] text-on-primary transition-colors [filter:drop-shadow(0px_1px_1px_rgba(0,0,0,0.05))] hover:bg-primary-container"
              >
                <GoogleIcon />
                Đăng nhập với Google
              </button>
            </form>

            <p className="mt-4 text-center text-[13px] text-on-surface-variant">
              Chỉ những tài khoản đã được cấp quyền mới có thể đăng nhập.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-center text-xs font-medium uppercase tracking-[0.1em] text-on-surface-variant opacity-60">
          Chỉ dành cho nhân viên được ủy quyền
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
      <svg width="13" height="13" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
        />
      </svg>
    </span>
  );
}
