import { Hr, Section, Text } from "@react-email/components";
import { getEmailInlineStyles, getEmailThemeClasses } from "./theme";

export function Footer() {
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <Section className="w-full mt-8">
      <Hr
        className={themeClasses.border}
        style={{ borderColor: lightStyles.container.borderColor }}
      />
      <Text
        className={`text-[12px] mt-4 ${themeClasses.mutedText}`}
        style={{ color: lightStyles.mutedText.color }}
      >
        Visyx Optical Clinic Management System.
      </Text>
    </Section>
  );
}
