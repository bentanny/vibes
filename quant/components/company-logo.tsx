"use client";

import { Image } from "@heroui/image";

interface CompanyLogoProps {
  domain: string;
  token?: string;
  size?: number;
  className?: string;
  radius?: "none" | "sm" | "md" | "lg" | "full";
}

export const CompanyLogo = ({
  domain,
  token = process.env.NEXT_PUBLIC_LOGODEV_TOKEN || "pk_RZs6nh7dTBSce8pi4IKWbg",
  size = 64,
  className,
  radius = "sm",
}: CompanyLogoProps) => {
  const logoUrl = `https://img.logo.dev/${domain}?token=${token}&size=${size}&retina=true`;

  return (
    <Image
      alt={`${domain} logo`}
      className={className}
      height={size}
      radius={radius}
      src={logoUrl}
      width={size}
    />
  );
};
