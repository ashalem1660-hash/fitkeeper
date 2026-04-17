import Link from "next/link";
import { Mail } from "lucide-react";

export default function ConfirmPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="card max-w-md p-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-accent" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">בדוק את האימייל שלך</h1>
        <p className="text-muted mb-6">
          שלחנו אליך קישור לאישור כתובת המייל. לאחר האישור תוכל להתחבר לחשבון.
        </p>
        <Link href="/auth/login" className="btn-primary w-full">
          חזרה להתחברות
        </Link>
      </div>
    </div>
  );
}
