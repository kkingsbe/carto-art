const url = "https://printful-upload.s3-accelerate.amazonaws.com/tmp/7a37a608122183b6f7d5aa67c75ae9d3/enhanced-matte-paper-framed-poster-(in)-black-24x36-front-6960845e325d8.png";

async function test() {
    console.log("Testing URL:", url);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log("Status:", res.status);
        console.log("Headers:", Object.fromEntries(res.headers.entries()));
        if (!res.ok) {
            console.log("Body:", await res.text());
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
