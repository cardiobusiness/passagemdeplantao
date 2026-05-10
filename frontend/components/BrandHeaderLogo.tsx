import Image from "next/image";
import styles from "./brand-header-logo.module.css";

type BrandHeaderLogoProps = {
  className?: string;
};

export function BrandHeaderLogo({ className = "" }: BrandHeaderLogoProps) {
  return (
    <div className={`${styles.logoWrap} ${className}`.trim()}>
      <Image
        src="/brand/logo-horizontal.png"
        alt="PASSAGEM DE PLANTAO"
        width={420}
        height={180}
        priority
        className={styles.logo}
      />
    </div>
  );
}
