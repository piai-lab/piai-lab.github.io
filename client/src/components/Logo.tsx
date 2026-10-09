import symbol from "@/assets/piai-lab-symbol.svg?raw";

// Trusted local SVG: preserve the approved paths; CSS supplies the surface color.
const decorativeSymbol = symbol
  .replace(/\s(?:role|aria-labelledby)="[^"]*"/g, "")
  .replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, "");

/** The approved symbol, paired with the lab name in navigation and footers. */
export default function Logo() {
  return (
    <span className="brand-lockup brand-lab-lockup">
      <span
        className="brand-symbol-image"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: decorativeSymbol }}
      />
      <span className="brand-lab-name">πAI Lab</span>
    </span>
  );
}
