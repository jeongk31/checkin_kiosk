import './kiosk.css';

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="kiosk-app">
      {children}
    </div>
  );
}
