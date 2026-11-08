import React from 'react';

/**
 * CONSAgrado Official Vector Mark & Typography Component
 * Standardized across the entire B2C application
 */
export const OfficialCupSvg = ({ className = "w-full h-full", withBackground = true }) => (
  <svg
    viewBox="130.686 249.432 320 320"
    className={className}
    style={{ display: 'block', width: '100%', height: '100%' }}
    aria-hidden="true"
  >
    {withBackground && (
      <path
        d="M 167.0227989385392 249.43204477231683 L 414.34934812574494 249.43204477231683 C 434.4175674264872 249.43204477231683, 450.6860735321421 265.7005508779717, 450.6860735321421 285.76877017871396 L 450.6860735321421 533.0953193659197 C 450.6860735321421 553.1635386666621, 434.4175674264872 569.4320447723169, 414.34934812574494 569.4320447723169 L 167.0227989385392 569.4320447723169 C 146.95457963779694 569.4320447723169, 130.68607353214207 553.1635386666621, 130.68607353214207 533.0953193659197 L 130.68607353214207 285.76877017871396 C 130.68607353214207 265.7005508779717, 146.95457963779694 249.43204477231683, 167.0227989385392 249.43204477231683 Z"
        fill="#1a1a1a"
      />
    )}
    <path
      d="M 189.18340112426574 394.57077157448344 L 392.18874594001835 360.74554988711765 C 391.3030000091057 385.6571541940365, 395.7535293881465 497.66125142471594, 375.59620445776017 508.27581476224293 C 365.84869962269283 513.4087134882392, 315.91810262272134 517.3951548082418, 303.5088304156865 518.9938953993324 C 291.82001489564317 520.4998164172522, 245.21486858095295 528.8071875025074, 234.96856258587388 526.3030791448972 C 211.33443077732466 520.527102220621, 195.19317184749116 418.24926822399135, 189.18340112426574 394.57077157448344 Z"
      fill="#f7941d"
    />
    <path
      d="M 392.18874594001835 360.74554988711765 L 189.18340112426574 394.57077157448344 C 185.66131296150354 380.6937442132004, 173.71602325717652 349.58576292013777, 181.59090546588766 336.79965163972565 C 184.11377199325602 332.70338057056915, 187.87416934038708 329.5105688178939, 192.3388260983894 327.7121468787836 C 210.52121173548835 320.3880449360052, 354.1316072080902 288.17007767526457, 371.53057184638084 288.2371566719379 C 377.56926692997297 288.2604379197503, 383.3336521941635 290.74805969063704, 387.5473285322896 295.0628049886623 C 398.4178076384559 306.1940226823953, 392.7639776904535 344.5671569061293, 392.18874594001835 360.74554988711765 Z"
      fill="#ffffff"
    />
  </svg>
);

export const BrandTypography = ({ size = "md", contrast = "dark", style = {} }) => {
  const fontSizes = {
    xs: "0.85rem",
    sm: "1.05rem",
    md: "1.35rem",
    lg: "1.85rem",
    xl: "2.35rem",
  };

  let resolvedFontSize = fontSizes[size];
  if (!resolvedFontSize) {
    if (typeof size === "number") {
      // Map pixel size of emblem to pleasant proportional font size (e.g. 72-84px icon -> ~1.9rem)
      const rem = Math.min(2.1, Math.max(0.95, size * 0.024)).toFixed(2);
      resolvedFontSize = `${rem}rem`;
    } else {
      resolvedFontSize = size;
    }
  }

  const textColor = contrast === "light" ? "#18181b" : "#ffffff";

  return (
    <span
      style={{
        fontSize: resolvedFontSize,
        fontWeight: 800,
        letterSpacing: "-0.035em",
        color: textColor,
        lineHeight: 1.1,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: "inline-block",
        whiteSpace: "nowrap",
        maxWidth: "100%",
        ...style,
      }}
    >
      CONSA<span style={{ color: "#f59e0b" }}>grado</span>
    </span>
  );
};

export const BrandLogo = ({
  variant = "vertical", // 'vertical' | 'horizontal' | 'icon' | 'text'
  size = "md", // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  tagline,
  style = {},
  className = "",
  glow = true,
  onClick,
}) => {
  const iconDimensions = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 72,
    xl: 96,
  };

  const px = typeof size === "number" ? size : (iconDimensions[size] || 48);
  const borderRadius = Math.round(px * 0.28);

  const emblem = (
    <div
      style={{
        width: `${px}px`,
        height: `${px}px`,
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: glow
          ? `0 0 0 1px rgba(245, 158, 11, 0.15), 0 12px 24px -6px rgba(247, 148, 29, 0.25)`
          : "0 4px 12px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <OfficialCupSvg />
    </div>
  );

  if (variant === "icon") {
    return (
      <div style={{ display: "inline-flex", cursor: onClick ? "pointer" : "default", ...style }} className={className} onClick={onClick}>
        {emblem}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div style={{ display: "inline-flex", cursor: onClick ? "pointer" : "default", ...style }} className={className} onClick={onClick}>
        <BrandTypography size={size} />
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: `${Math.max(8, Math.round(px * 0.28))}px`,
          cursor: onClick ? "pointer" : "default",
          ...style,
        }}
        className={className}
        onClick={onClick}
      >
        {emblem}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <BrandTypography size={size} />
          {tagline && (
            <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)", marginTop: "-2px" }}>
              {tagline}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Vertical layout (default for login / splash)
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "0.85rem",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      className={className}
      onClick={onClick}
    >
      {emblem}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
        <BrandTypography size={size} />
        {tagline && (
          <p style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "0.95rem", fontWeight: 400, margin: 0 }}>
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
