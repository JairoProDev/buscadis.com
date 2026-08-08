/**
 * @buscadis/tokens — generated Tailwind preset. Do not edit.
 * Rebuild: npm run tokens:build
 * Usage: presets: [require('@buscadis/tokens/tailwind-preset')]
 */

module.exports = {
  "theme": {
    "extend": {
      "colors": {
        "adis": {
          "50": "#F0FAFC",
          "100": "#DAF2F7",
          "200": "#B7E5EF",
          "300": "#8AD3E4",
          "400": "#53ACC5",
          "500": "#3796B0",
          "600": "#2A7C94",
          "700": "#1F6076",
          "800": "#1B4E5F",
          "900": "#163D4A",
          "950": "#0E2530"
        },
        "sol": {
          "50": "#FFF8E8",
          "100": "#FFEFC6",
          "200": "#FFE29A",
          "300": "#FFD06A",
          "400": "#FFC24A",
          "500": "#F2A81F",
          "600": "#C9820A",
          "700": "#9E6206",
          "800": "#7A4A08",
          "900": "#5E3908"
        },
        "neutral": {
          "0": "#FFFFFF",
          "25": "#FAFCFD",
          "50": "#F5F8FA",
          "100": "#EDF2F5",
          "200": "#DFE7EC",
          "300": "#C7D3DA",
          "400": "#9AAAB4",
          "500": "#6E7F8A",
          "600": "#55666F",
          "700": "#3F4E56",
          "800": "#2A353C",
          "900": "#1A2227",
          "950": "#10161A"
        },
        "bs": {
          "canvas": "var(--bs-bg-canvas)",
          "surface": "var(--bs-bg-surface)",
          "surface-2": "var(--bs-bg-surface-2)",
          "sunken": "var(--bs-bg-sunken)",
          "action": "var(--bs-action)",
          "action-hover": "var(--bs-action-hover)",
          "identity": "var(--bs-identity)",
          "warm": "var(--bs-identity-warm)",
          "publish": "var(--bs-publish-bg)",
          "danger": "var(--bs-danger-fg)",
          "success": "var(--bs-success-fg)",
          "warning": "var(--bs-warning-fg)"
        }
      },
      "spacing": {
        "0": "0",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "20": "80px"
      },
      "borderRadius": {
        "xs": "4px",
        "sm": "8px",
        "md": "12px",
        "lg": "16px",
        "xl": "20px",
        "2xl": "28px",
        "full": "9999px"
      },
      "screens": {
        "sm": "480px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px"
      },
      "boxShadow": {
        "1": "var(--bs-elevation-1)",
        "2": "var(--bs-elevation-2)",
        "3": "var(--bs-elevation-3)",
        "4": "var(--bs-elevation-4)",
        "focus": "var(--bs-focus-ring)"
      },
      "zIndex": {
        "base": "0",
        "raised": "10",
        "sticky": "100",
        "header": "200",
        "nav": "300",
        "dropdown": "400",
        "overlay": "500",
        "modal": "600",
        "toast": "700",
        "tooltip": "800"
      },
      "maxWidth": {
        "prose": "640px",
        "feed": "480px",
        "app": "1440px",
        "panel": "420px"
      },
      "transitionDuration": {
        "instant": "100ms",
        "fast": "150ms",
        "normal": "250ms",
        "slow": "400ms"
      },
      "transitionTimingFunction": {
        "out": "cubic-bezier(0, 0, 0.2, 1)",
        "inout": "cubic-bezier(0.4, 0, 0.2, 1)",
        "smooth": "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      "fontFamily": {
        "sans": [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "Roboto",
          "\"Helvetica Neue\"",
          "Arial",
          "sans-serif"
        ],
        "display": [
          "var(--font-archivo)",
          "system-ui",
          "-apple-system",
          "sans-serif"
        ]
      }
    }
  }
};
