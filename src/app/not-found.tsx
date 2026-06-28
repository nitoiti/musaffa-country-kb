import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Country not found</h1>
      <p className="mt-2 text-slate-600">
        The country you are looking for does not exist in the knowledge base.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-musaffa-700 hover:underline"
      >
        Return to dashboard
      </Link>
    </div>
  );
}
