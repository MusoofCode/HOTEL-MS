type PrintSection = {
  title: string;
  html: string;
};

function escapeHtml(s: string) {
  // Avoid String.prototype.replaceAll for wider TS lib compatibility.
  return s
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;")
    .split('"')
    .join("&quot;");
}

function cssVarsSnapshot() {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const vars = [
    "--background",
    "--foreground",
    "--card",
    "--card-foreground",
    "--muted",
    "--muted-foreground",
    "--border",
    "--primary",
    "--primary-foreground",
    "--accent",
    "--accent-foreground",
    "--brand-warm",
    "--radius",
  ];
  return vars
    .map((v) => `${v}:${cs.getPropertyValue(v).trim()};`)
    .filter((x) => !x.endsWith(":;"))
    .join("\n");
}

export function openPrintWindow({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle?: string;
  sections: PrintSection[];
}) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  const vars = cssVarsSnapshot();
  const now = new Date();
  const printedAt = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

  const body = `
    <header class="hdr">
      <div class="brand">
        <div class="mark" aria-hidden="true"></div>
        <div>
          <div class="title">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ""}
        </div>
      </div>
      <div class="meta">Printed: ${escapeHtml(printedAt)}</div>
    </header>
    ${sections
      .map(
        (s) => `
        <section class="sec">
          <div class="sec-title">${escapeHtml(s.title)}</div>
          <div class="sec-body">${s.html}</div>
        </section>
      `,
      )
      .join("\n")}
  `;

  w.document.open();
  w.document.write(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        :root { ${vars} }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 28px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          color: hsl(var(--foreground));
          background: hsl(var(--background));
        }
        .hdr {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 18px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          border-radius: calc(var(--radius) * 0.9);
          box-shadow: 0 14px 34px -22px hsl(0 0% 0% / 0.18);
        }
        .brand { display: flex; gap: 12px; align-items: center; }
        .mark {
          width: 44px; height: 44px;
          border-radius: 16px;
          border: 1px solid hsl(var(--border));
          background:
            radial-gradient(18px 18px at 30% 30%, hsl(var(--accent) / .35), transparent 60%),
            radial-gradient(20px 20px at 70% 65%, hsl(var(--primary) / .25), transparent 62%),
            hsl(var(--card));
        }
        .title { font-weight: 750; font-size: 18px; letter-spacing: -0.01em; }
        .sub { margin-top: 2px; font-size: 12px; color: hsl(var(--muted-foreground)); }
        .meta { font-size: 12px; color: hsl(var(--muted-foreground)); padding-top: 2px; white-space: nowrap; }

        .sec { margin-top: 18px; page-break-inside: avoid; }
        .sec-title {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
        }
        .sec-title:before {
          content: "";
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: hsl(var(--primary));
          box-shadow: 0 0 0 4px hsl(var(--primary) / .15);
        }
        .sec-body {
          margin-top: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          border-radius: calc(var(--radius) * 0.9);
          overflow: hidden;
        }

        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; border-bottom: 1px solid hsl(var(--border)); text-align: left; font-size: 12px; }
        th { background: hsl(var(--muted)); font-weight: 700; }
        tr:nth-child(even) td { background: hsl(var(--background) / 0.35); }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .muted { color: hsl(var(--muted-foreground)); }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          font-size: 11px;
        }

        @media print {
          body { padding: 0; background: white; }
          .hdr, .sec-body { box-shadow: none; }
          .sec { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      ${body}
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => window.print(), 50);
        });
      </script>
    </body>
  </html>`);
  w.document.close();
}
