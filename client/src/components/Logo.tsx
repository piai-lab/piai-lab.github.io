import symbol from "@/assets/piai-lab-symbol.svg";

/** The approved symbol, paired with the lab name in navigation and footers. */
export default function Logo() {
  return (
    <span className="brand-lockup brand-lab-lockup">
      <img
        className="brand-symbol-image"
        src={symbol}
        alt=""
        width={1024}
        height={672}
        draggable={false}
      />
      <span className="brand-lab-name">πAI Lab</span>
    </span>
  );
}
