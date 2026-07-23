import { useEffect } from "react";

const INJECT_SCRIPT_SRC = "https://cdn.botpress.cloud/webchat/v3.6/inject.js";
const BOT_CONFIG_SCRIPT_SRC = "https://files.bpcontent.cloud/2026/06/19/22/20260619224434-QWHVJZIU.js";

export function BotpressChat() {
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.src = INJECT_SCRIPT_SRC;
    script1.async = true;

    const script2 = document.createElement("script");
    script2.src = BOT_CONFIG_SCRIPT_SRC;
    script2.defer = true;

    document.body.appendChild(script1);
    script1.onload = () => {
      document.body.appendChild(script2);
    };

    return () => {
      script1.remove();
      script2.remove();
      document.getElementById("bp-web-widget-container")?.remove();
    };
  }, []);

  return null;
}
