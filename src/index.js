export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === "/api/chat" && request.method === "POST") {
            try {
                const { prompt } = await request.json();

                if (!prompt) {
                    return new Response(JSON.stringify({ error: "Prompt is required." }), {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    });
                }

                const aiResponse = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
                    prompt,
                });

                return new Response(JSON.stringify({ reply: aiResponse }), {
                    headers: { "Content-Type": "application/json" },
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        // Serve frontend file
        if (url.pathname === "/" || url.pathname === "/index.html") {
            return new Response(await env.ASSETS.fetch(request));
        }

        return new Response("Cloudflare AI Worker is live!", {
            headers: { "Content-Type": "text/plain" },
        });
    },
};
