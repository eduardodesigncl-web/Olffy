"use client";

import { ContactoPage } from "../pages/ContactoPage";
import { submitContactAction } from "./marketing-actions";

export function ContactoPageClient() {
  return <ContactoPage onSubmit={submitContactAction} />;
}
