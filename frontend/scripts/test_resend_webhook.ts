import { fetch } from 'undici';

async function main() {
    console.log('Simulating Resend Webhook...');

    // Payload from user
    const payload = {
        created_at: "2026-01-09T19:35:18.000Z",
        data: {
            attachments: [],
            bcc: [],
            cc: [],
            created_at: "2026-01-09T19:35:56.312Z",
            email_id: "293d285a-dd1f-4153-85bf-1a542a1502c2",
            from: "kkingsbe@gmail.com", // Assuming no Name <email> format here as per user payload
            message_id: "<CAO36ha+sEkh1TQfLyOS6zTiqQFSFrPhipV=X7=7qZegt7s1Fdw@mail.gmail.com>",
            subject: "Re: Order Confirmed - Carto-Art #BEADE35F",
            to: [
                "orders@cartoart.net"
            ],
            text: "This is a reply to my order!"
        },
        type: "email.received"
    };

    try {
        // Assuming local server is running on localhost:3000
        // We can't easily test the ROUTE handler directly without starting the next server,
        // so this script assumes "next dev" is running.
        // IF NOT, we should rewrite this to import the handler and call it with a mocked Request?
        // Importing the handler is better for unit testing, but mocking Next.js Request/headers/cookies is hard.
        // Let's rely on fetch against the local server if running, OR just log intent.

        // Since I cannot know if server is running, I'll try to fetch.
        const response = await fetch('http://localhost:3000/api/webhooks/resend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('Response Status:', response.status);
        const text = await response.text();
        console.log('Response Body:', text);

        if (response.status === 200) {
            console.log('SUCCESS: Webhook processed correctly.');
        } else {
            console.log('FAILURE: Webhook check failed.');
        }

    } catch (err) {
        console.error('Error running test:', err);
        console.log('Make sure your local Next.js server is running (npm run dev).');
    }
}

main();
