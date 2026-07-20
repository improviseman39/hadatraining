import Link from "next/link";
import BulkImportForm from "@/components/admin/BulkImportForm";

export default function BulkImportPage() {
  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-teal"
      >
        &larr; Back to users
      </Link>
      <h2 className="mb-6 font-serif text-xl text-ink">Bulk import users</h2>
      <BulkImportForm />
    </div>
  );
}
