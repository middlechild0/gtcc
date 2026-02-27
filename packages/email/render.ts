import { render as reactEmailRender } from "@react-email/render";
import type React from "react";

export const render = async (component: React.ReactNode): Promise<string> => {
  return reactEmailRender(component);
};
