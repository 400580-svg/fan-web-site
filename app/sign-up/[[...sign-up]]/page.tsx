import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Link className="auth-brand" href="/">
          <img src="/gridiron-mark.svg" alt="" width="42" height="42" />
          <span>GRIDIRON <b>CENTRAL</b></span>
        </Link>
        <div className="auth-copy">
          <div className="eyebrow">Build your own playbook</div>
          <h1>Your football work, all in one place.</h1>
          <p>Create an account to save your lineups, playbook, and player favorites across sessions and devices.</p>
        </div>
        <Link className="auth-back" href="/">← Back to Gridiron Central</Link>
      </section>
      <section className="auth-form-panel">
        <SignUp signInUrl="/sign-in" />
      </section>
    </main>
  );
}
