"use client";

import React, { useState } from "react";
import Button from "@mui/material/Button";

function SafeButton({ onClick, disabled, syncLockMs = 900, ...props }) {
  const [locked, setLocked] = useState(false);

  const handleClick = async (event) => {
    if (disabled || locked) return;

    let isAsync = false;
    try {
      const result = onClick?.(event);

      // Keep disabled until async action ends.
      if (result && typeof result.then === "function") {
        isAsync = true;
        setLocked(true);
        await result;
        return;
      }

      // For sync actions, block quick double-clicks.
      setLocked(true);
      window.setTimeout(() => setLocked(false), syncLockMs);
    } finally {
      if (isAsync) setLocked(false);
    }
  };

  return <Button {...props} disabled={Boolean(disabled || locked)} onClick={handleClick} />;
}

export default SafeButton;
