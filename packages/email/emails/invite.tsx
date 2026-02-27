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
  teamName?: string;
  email?: string;
  inviteLink?: string;
}

export const InviteEmail = ({
  invitedByName = "Someone",
  teamName = "a team",
  email = "user@example.com",
  inviteLink = `${getAppUrl()}/invite`,
}: Props) => {
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <EmailThemeProvider preview={<Preview>Join {teamName} on Visyx</Preview>}>
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
          }}
        >
          <Logo />
          <Heading
            className={`mx-0 my-[30px] p-0 text-[24px] font-normal text-center ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            Join <strong>{teamName}</strong> on Visyx
          </Heading>
          <Text
            className={`text-[14px] leading-[24px] ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            {invitedByName} has invited you to join the {teamName} team.
          </Text>
          <Section className="mb-[32px] mt-[32px] text-center">
            <Button href={inviteLink}>Join the team</Button>
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
