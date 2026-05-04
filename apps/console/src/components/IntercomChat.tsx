// components/IntercomChat.tsx
"use client";

import { useEffect } from "react";
import Intercom from "@intercom/messenger-js-sdk";

export default function IntercomChat() {
  useEffect(() => {
    Intercom({
      app_id: "o3oa4ds3",
    });
  }, []);

  return null;
}
