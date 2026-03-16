import "./globals.css";

export const metadata = {
  title: "ВЕКТРА — Проверка документов",
  description: "Система проверки конкурентных предложений на подлинность с форензик-анализом",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
