// components/userjot-widget.tsx
"use client";

import Script from "next/script";

export function UserJotWidget() {
  return (
    <>
      <Script strategy="afterInteractive">
        {`window.$ujq=window.$ujq||[];window.uj=window.uj||new Proxy({},{get:(_,p)=>(...a)=>window.$ujq.push([p,...a])});document.head.appendChild(Object.assign(document.createElement('script'),{src:'https://cdn.userjot.com/sdk/v2/uj.js',type:'module',async:!0}));`}
      </Script>
      <Script strategy="afterInteractive">
        {`window.uj.init('cmj6zg7ap00ux14mmuuj2e4ei', {
          widget: true,
          position: 'left',
          theme: 'light'
        });`}
      </Script>
    </>
  );
}
