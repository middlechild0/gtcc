import { Img, Section } from "@react-email/components";
import { getEmailUrl } from "@visyx/utils/envs";

const baseUrl = getEmailUrl();

export function Logo() {
  return (
    <Section className="mt-[32px] mb-[24px]">
      <Img
        src={`${baseUrl}/email/logo.png`}
        width="40"
        height="40"
        alt="visyx"
        className="my-0 mx-auto block"
      />
    </Section>
  );
}
