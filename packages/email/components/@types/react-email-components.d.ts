declare module "@react-email/components" {
  export const Html: any;
  export const Head: any;
  export const Tailwind: any;
  export const Preview: any;

  export const Body: any;
  export const Container: any;
  export const Section: any;
  export const Text: any;
  export const Heading: any;
  export const Hr: any;

  export const Link: any;
  export const Button: any;
  export const Img: any;
  export const Font: any;
}

declare module "@react-email/render" {
  export function render(component: any): Promise<string>;
}
