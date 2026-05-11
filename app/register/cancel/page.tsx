import Link from "next/link";

export default function RegisterCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8 text-amber-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Payment cancelled</h1>
        <p className="text-slate-500 text-sm mb-8">
          Your registration wasn&apos;t completed. No charge was made. You can try again whenever you&apos;re ready.
        </p>
        <Link
          href="/register"
          className="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-2xl text-sm hover:bg-blue-700 transition-colors"
        >
          Try again
        </Link>
        <p className="text-slate-400 text-xs mt-4">
          Need help?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
