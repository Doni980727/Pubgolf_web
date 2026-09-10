export default function AppLogo({ size = 80 }: { size?: number }) {
  return (
    <img
      className="app-logo"
      src="https://raw.githubusercontent.com/TiZiZAAiT/Pubgolf/main/assets/images/icon_pubgolf.png"
      width={size}
      height={size}
      alt="PubGolf"
    />
  );
}
