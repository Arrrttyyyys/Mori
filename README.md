# Mori Website

A gentle digital companion for reminiscence therapy, memory care, and life-story conversations.

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build the production version:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable React components (Header, Footer)
- `/app/globals.css` - Global styles and Tailwind configuration

## Pages

1. **Home** (`/`) - Landing page with hero, intro, and audience sections
2. **How It Works** (`/how-it-works`) - Process explanation
3. **For Families** (`/for-families`) - Family-focused content
4. **For Caregivers** (`/for-caregivers`) - Caregiver-focused content
5. **Research** (`/research`) - Evidence-based research content
6. **Auth** (`/auth`) - Sign in/Sign up page

## Design System

- **Colors**: Warm off-white background, sage green primary, soft beige secondary
- **Typography**: Lora serif font (Google Fonts)
- **Style**: Rounded corners, soft shadows, gentle transitions
- **Accessibility**: Large text, good contrast, semantic HTML

## Supabase (Auth & Photo Storage)

The app uses Supabase for sign-in/sign-up and for storing photos uploaded in the Memory Library.

### Environment variables

Add to `.env.local` (get values from [Supabase Dashboard](https://supabase.com/dashboard) → your project → Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Storage bucket for photos

Photos uploaded by patients and families are stored in Supabase Storage. Create the bucket once:

1. In Supabase Dashboard go to **Storage** and **New bucket**.
2. Name: `memories`. Optionally make it **Public** so image URLs work without signed links.
3. Under **Policies** for the `memories` bucket, add:
   - **INSERT**: Allow authenticated users to upload only to their own folder.  
     Policy: `(bucket_id = 'memories') AND ((storage.foldername(name))[1] = auth.uid()::text)`
   - **DELETE**: Same condition so users can only delete their own files.  
     Policy: `(bucket_id = 'memories') AND ((storage.foldername(name))[1] = auth.uid()::text)`
   - **SELECT**: For a public bucket you can allow all; or use the same folder condition for private access.

Files are stored under `memories/{userId}/{unique-filename}.jpg` (or .png, .gif, .webp).

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Google Fonts (Lora)
- Supabase (Auth + Storage)

## Supervised pilot

Apply every migration in `supabase/migrations`, complete `docs/pilot/STAGING_REHEARSAL.md`, and obtain every accountable approval in `docs/pilot/LAUNCH_CHECKLIST.md` before using Mori with real participants. A passing build is not pilot authorization.
