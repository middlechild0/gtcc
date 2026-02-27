/**
 * Example: Invite email template
 *
 * Usage:
 *   import { InviteEmail } from "@visyx/email/emails/invite";
 *   import { render } from "@visyx/email/render";
 *   const html = await render(
 *     <InviteEmail
 *       invitedByName="Jane"
 *       teamName="Acme"
 *       email="user@example.com"
 *       inviteLink="https://app.visyx.co.ke/invite/abc123"
 *     />
 *   );
 */

import {
  Body,
  Container,
  Heading,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { getAppUrl } from "@visyx/utils/envs";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

interface Props {
  invitedByName?: string;
  appName?: string;
  email?: string;
  inviteLink?: string;
}

export const InviteEmail = ({
  invitedByName = "Administrator",
  appName = "Visyx",
  email = "user@example.com",
  inviteLink = `${getAppUrl()}/auth/sign-in`,
}: Props) => {
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider preview={<Preview>Welcome to {appName}!</Preview>}>
      <Body
        className={`my-auto mx-auto font-sans ${themeClasses.body}`}
        style={lightStyles.body}
      >
        <Container
          className={`my-[40px] mx-auto p-[20px] max-w-[600px] ${themeClasses.container}`}
          style={{
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: lightStyles.container.borderColor,
            borderRadius: "8px",
          }}
        >
          <Logo />
          <Heading
            className={`mx-0 my-[30px] p-0 text-[24px] font-normal text-center ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            Welcome to <strong>{appName}</strong>
          </Heading>

          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Hello there,
          </Text>
          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {invitedByName} has created an account for you on {appName}. Your
            account is ready to use!
          </Text>

          <div
            className="p-[16px] my-[24px]"
            style={{
              backgroundColor: "#f9fafb", // subtle gray background for instructions
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
            }}
          >
            <Heading
              as="h3"
              className="text-[16px] m-0 mb-[8px]"
              style={{ color: lightStyles.text.color }}
            >
              How to sign in:
            </Heading>
            <Text
              className={`text-[14px] leading-[24px] m-0 ${themeClasses.text}`}
              style={{ color: lightStyles.text.color }}
            >
              <strong>1. Request an OTP:</strong> Click the link below and enter
              your email address ({email}). We will email you a secure One-Time
              Password.
              <br />
              <strong>2. Log In:</strong> Enter the OTP to securely access your
              account dashboard.
              <br />
              <strong>3. Set a Password (Optional):</strong> Once logged in, you
              can visit your Account Settings to set up a permanent password if
              you prefer that over OTPs.
            </Text>
          </div>

          <Section className="mb-[32px] mt-[16px] text-center">
            <Button href={inviteLink}>Sign In to Your Account</Button>
          </Section>
          <Text
            className={`text-[12px] break-all ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            Or copy this link:{" "}
            <Link
              href={inviteLink}
              className="underline"
              style={{ color: lightStyles.mutedText.color }}
            >
              {inviteLink}
            </Link>
          </Text>
          <Text
            className={`text-[12px] mt-4 ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            This invite was sent to {email}. If you weren&apos;t expecting it,
            you can ignore this email.
          </Text>
          <Footer />
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InviteEmail;
