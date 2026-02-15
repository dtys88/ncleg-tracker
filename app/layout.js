import './globals.css';

export const metadata = {
  title: 'NC Leg Tracker — North Carolina General Assembly Legislative Dashboard',
  description: 'Real-time legislative tracking dashboard for the North Carolina General Assembly. Monitor bills, committee actions, and healthcare-related legislation.',
  openGraph: {
    title: 'NC Leg Tracker',
    description: 'North Carolina General Assembly Legislative Dashboard',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
