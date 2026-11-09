import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Link className="auth-brand" href="/">
          <img src="/gridiron-mark.svg" alt="" width="42" height="42" />
          <span>GRIDIRON <b>CENTRAL</b></span>
        </Link>
        <div className="auth-copy">
          <div className="eyebrow">Your film room, saved</div>
          <h1>Pick up where the game left off.</h1>
          <p>Sign in to keep your custom plays, lineups, favorites, and player ratings available on your other devices.</p>
        </div>
        <Link className="auth-back" href="/">← Back to Gridiron Central</Link>
      </section>
      <section className="auth-form-panel">
        <SignIn signUpUrl="/sign-up" />
      </section>
    </main>
  );
}
