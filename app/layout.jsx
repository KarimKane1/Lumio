import "./globals.css";
import React from "react";
import Providers from "./providers";
import { AuthProvider } from "../context/AuthContext";
import { I18nProvider } from "../context/I18nContext";
import LanguageGate from "../components/LanguageGate";

export const metadata = { title: "Lumio", description: "Provider recommendations" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <LanguageGate>
            <I18nProvider forcedLang={undefined}>
              <Providers>{children}</Providers>
            </I18nProvider>
          </LanguageGate>
        </AuthProvider>
      </body>
    </html>
  );
}

