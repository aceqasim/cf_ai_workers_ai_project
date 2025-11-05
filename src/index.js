export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // API route
        if (url.pathname === "/api/chat" && request.method === "POST") {
            try {
                const { prompt } = await request.json();

                if (!prompt)
                    return new Response(
                        JSON.stringify({ error: "Prompt is required." }),
                        {
                            status: 400,
                            headers: { "Content-Type": "application/json" },
                        }
                    );

                const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", { prompt });

                // Some models return structured objects like { response: "text here" }
                const text =
                    typeof aiResponse === "string"
                        ? aiResponse
                        : aiResponse.response || JSON.stringify(aiResponse);

                return new Response(JSON.stringify({ reply: text }), {
                    headers: { "Content-Type": "application/json" },
                });

            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        // Serve static frontend
        if (url.pathname === "/" || url.pathname === "/index.html") {
            const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Cloudflare AI Chat</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 2rem; background: #f9fafb; }
          textarea { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid #ccc; }
          button { margin-top: 1rem; padding: 0.6rem 1.2rem; border: none; border-radius: 6px; background: #0066ff; color: white; cursor: pointer; }
          button:hover { background: #004fcc; }
          pre { background: #fff; border-radius: 8px; padding: 1rem; margin-top: 1rem; border: 1px solid #eee; }
        </style>
      </head>
      <body>
        <h1>💬 Cloudflare AI Chat</h1>
        <p>Ask anything below, and get an AI response powered by Cloudflare Workers AI.</p>
        
        <textarea id="prompt" rows="4" placeholder="Type your question..."></textarea>
        <button id="send">Send</button>
        
        <pre id="reply"></pre>

        <script>
          const sendBtn = document.getElementById('send');
          const replyEl = document.getElementById('reply');

          sendBtn.onclick = async () => {
            const prompt = document.getElementById('prompt').value.trim();
            if (!prompt) {
              replyEl.textContent = "⚠️ Please enter a question first.";
              return;
            }

            replyEl.textContent = "⏳ Thinking...";
            try {
              const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
              });
              const data = await res.json();
              if (data.reply) replyEl.textContent = data.reply;
              else replyEl.textContent = "❌ Error: " + (data.error || "Unknown error");
            } catch (e) {
              replyEl.textContent = "⚠️ Failed to connect: " + e.message;
            }
          };
        </script>
      </body>
      </html>`;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        }

        // Default fallback
        return new Response("Cloudflare AI Worker is running!", {
            headers: { "Content-Type": "text/plain" },
        });
    },
};
