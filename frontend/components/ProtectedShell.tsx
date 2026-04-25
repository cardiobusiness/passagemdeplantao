"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { clearSession, getStoredToken, getStoredUser } from "@/lib/auth";
import { logout } from "@/lib/api";
import { User } from "@/lib/types";
import {
  AppRouteKey,
  getDefaultRouteForRole,
  getRoleLabel,
  hasPermission
} from "@/lib/permissions";
import styles from "./protected-shell.module.css";

type ProtectedShellProps = {
  children: ReactNode;
  routeKey?: AppRouteKey;
};

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", routeKey: "dashboard" as const, match: ["/dashboard"] },
  { href: "/analytics", label: "Analytics", routeKey: "analytics" as const, match: ["/analytics"] },
  { href: "/patients", label: "Pacientes", routeKey: "patients" as const, match: ["/patients"] },
  { href: "/handover", label: "Passagem", routeKey: "handover" as const, match: ["/handover"] },
  { href: "/admin", label: "Administracao", routeKey: "admin" as const, match: ["/admin"] }
];

function isActivePath(pathname: string, matchers: string[]) {
  return matchers.some((matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`));
}

export function ProtectedShell({ children, routeKey }: ProtectedShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    if (!storedUser || !storedToken) {
      clearSession();
      setUser(null);
      setRedirectPath(pathname === "/" ? null : "/");
      setReady(true);
      return;
    }

    if (routeKey && !hasPermission(storedUser.role, routeKey)) {
      const nextPath = getDefaultRouteForRole(storedUser.role);

      setUser(storedUser);
      setRedirectPath(nextPath !== pathname ? nextPath : null);
      setReady(true);
      return;
    }

    setUser(storedUser);
    setRedirectPath(null);
    setReady(true);
  }, [pathname, routeKey]);

  useEffect(() => {
    if (redirectPath) {
      router.replace(redirectPath);
    }
  }, [redirectPath, router]);

  const navigation = useMemo(() => {
    return navigationItems.filter((item) => hasPermission(user?.role, item.routeKey));
  }, [user]);

  async function handleLogout() {
    const token = getStoredToken();
    setLoggingOut(true);

    try {
      if (token) {
        await logout(token);
      }
    } catch {
      // Keep logout resilient even if the backend session is already gone.
    } finally {
      clearSession();
      router.replace("/");
      router.refresh();
    }
  }

  if (!ready) {
    return (
      <main className={`${styles.page} page-shell`}>
        <div className="container">
          <div className={`${styles.loadingCard} card`}>Validando sessao...</div>
        </div>
      </main>
    );
  }

  if (!user || redirectPath) {
    return null;
  }

  return (
    <main className={`${styles.page} page-shell`}>
      <div className="container">
        <header className={`${styles.topbar} card print-hidden`}>
          <div className={styles.brandBlock}>
            <Link href={getDefaultRouteForRole(user?.role)} className={styles.brand}>
              Passagem de Plantao
            </Link>
            <nav className={styles.nav}>
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActivePath(pathname, item.match) ? styles.navLinkActive : styles.navLink}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.userBlock}>
            <div>
              <strong>{user?.name}</strong>
              <span>
                {user ? `${getRoleLabel(user.role)} | ${user.jobTitle}` : ""}
              </span>
            </div>
            <button type="button" className={styles.logoutButton} onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "Saindo..." : "Logout"}
            </button>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
