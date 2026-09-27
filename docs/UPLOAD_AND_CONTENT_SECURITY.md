# Upload and content security

Mori accepts at most 10 files in one browser selection. The server independently enforces a 20-upload-per-minute account limit, no more than 500 stored objects, and 250 MB of media per uploading account. Hosted uploads are limited to 4 MB so the complete multipart request remains below Vercel's 4.5 MB Function payload limit.

## Images

The browser first decodes each selected image, limits it to 2048 by 2048 pixels, and encodes it as WebP below 4 MB. This avoids sending the original metadata and keeps the request within Vercel's limit. The server independently decodes the result with Sharp, rejects malformed data and images over 40 megapixels, limits the output dimensions again, removes metadata by creating a new image, and encodes it as WebP. The original file is never written to storage. If `MORI_FILE_SCAN_URL` is configured, uploaded bytes must also pass that private scanner before server decoding.

## Audio and video

The hosted demo accepts audio and video only below 4 MB. The server checks container signatures rather than trusting the browser MIME value. Audio and video fail closed unless `MORI_FILE_SCAN_URL` is configured. Larger audio/video requires a future authenticated direct-to-storage flow with asynchronous scanning. The scanner must accept raw bytes in a POST request and return JSON containing `{ "clean": true }`. Set `MORI_FILE_SCAN_TOKEN` when the endpoint requires a bearer token. Use a private scanning service whose retention and logging behavior has passed the project privacy review.

## Storage and access

Uploads require a valid account, a same-origin mutation request, and the caller's Supabase access token. Objects use unpredictable server-generated names under the uploader's storage prefix. The bucket remains private and the API returns a one-hour signed URL. Deleting a memory also deletes its storage object.

## Browser content security

React renders user strings as escaped text and the application does not use `dangerouslySetInnerHTML`. Global headers block framing, MIME sniffing, object embedding, inline script attributes, and unapproved network and media origins. The production CSP excludes `unsafe-eval`; Next.js currently requires inline framework bootstrapping, so a future nonce-based CSP would require dynamic rendering and separate performance testing.
