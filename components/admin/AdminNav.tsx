import Link from "next/link";
import { logout } from "@/app/admin/actions";

export default function AdminNav({ current }: { current: "roles" | "pool" | "moves" }) {
  const item = (key: typeof current, href: string, label: string) => (
    <Link href={href} aria-current={current === key ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <header className="site-header">
      <nav aria-label="Admin" className="site-nav wrap">
        <div className="site-nav-left">
          <Link href="/admin" className="logo">
            <span className="logo-word">adjacent</span>
            <span className="logo-tag">OPERATOR</span>
          </Link>
          <div className="site-links">
            {item("roles", "/admin", "ROLES")}
            {item("pool", "/admin/pool", "POOL")}
            {item("moves", "/admin/moves", "PROVEN MOVES")}
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="text-button">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
