import "./globals.css";

export const metadata = {
  title: "TaskFlow",
  description: "Simple Task Manager",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
