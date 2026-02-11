"use client";

import * as React from "react";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Este componente asegura que los estilos de Emotion se inserten correctamente durante SSR
export default function EmotionRegistry({ children }) {
  const [cache] = React.useState(() => {
    const cache = createCache({ key: "css", prepend: true });
    cache.compat = true;
    return cache;
  });

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted);
    if (names.length === 0) {
      return null;
    }
    let styles = "";
    for (const name of names) {
      const style = cache.inserted[name];
      if (typeof style !== "boolean" && style !== undefined) {
        styles += style;
      }
    }
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

