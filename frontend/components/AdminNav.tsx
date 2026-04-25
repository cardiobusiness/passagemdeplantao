"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin-saas-page.module.css";

const adminLinks = [
  { href: "/admin", label: "Usuarios" },
  { href: "/admin/organization", label: "Organizacao" },
  { href: "/admin/sectors", label: "Setores" },
  { href: "/admin/beds", label: "Leitos" }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.adminNav} aria-label="Administracao">
      {adminLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? styles.navLinkActive : styles.navLink}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
