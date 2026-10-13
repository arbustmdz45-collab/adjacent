import Link from "next/link";

type Props = { current?: "home" | "tool" };

export default function SiteHeader({ current = "home" }: Props) {
  return (
    <header className="site-header">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <nav aria-label="Main" className="site-nav wrap">
        <div className="site-nav-left">
          <Link href="/" className="logo" aria-label="adjacent, home">
            <span className="logo-word">adjacent</span>
            <span className="logo-tag">CAREER PIVOTS</span>
          </Link>
          <div className="site-links">
            <Link href="/try" aria-current={current === "tool" ? "page" : undefined}>
              THE TOOL
            </Link>
            <Link href="/#fit">HOW WE JUDGE A FIT</Link>
            <Link href="/#employers">FOR EMPLOYERS</Link>
          </div>
        </div>
        {current !== "tool" && (
          <Link href="/try" className="site-cta">
            <span aria-hidden="true" className="dot" />
            READ MY DAY
          </Link>
        )}
      </nav>
    </header>
  );
}
