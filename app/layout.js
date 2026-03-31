export const metadata = {
  title: 'AngelLift® Quiz - Find Your Perfect DermaStrip',
  description: 'Take our 60-second quiz to discover the right DermaStrip for your unique needs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
