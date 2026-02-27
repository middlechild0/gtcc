import { Button as ReactEmailButton } from "@react-email/components";
import type React from "react";
import { getEmailInlineStyles, getEmailThemeClasses } from "./theme";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  const baseClasses =
    "text-[14px] font-medium no-underline text-center px-6 py-3 border border-solid";
  const variantClasses =
    variant === "primary"
      ? themeClasses.button
      : "bg-transparent border-gray-300 text-gray-600";

  // Inline styles for maximum email client compatibility (primary = solid blue like website)
  const buttonStyle =
    variant === "primary"
      ? {
          backgroundColor: lightStyles.button.backgroundColor,
          color: lightStyles.button.color,
          borderColor: lightStyles.button.borderColor,
        }
      : {
          backgroundColor: "transparent",
          color: "#6b7280",
          borderColor: "#d1d5db",
        };

  return (
    <ReactEmailButton
      className={`${baseClasses} ${variantClasses} ${className}`}
      href={href}
      style={buttonStyle}
    >
      {children}
    </ReactEmailButton>
  );
}
