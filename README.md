# Beyond the Code — portfolio website

A multi-page personal portfolio built with HTML, CSS, JavaScript and jQuery.

## Pages
- `index.html` — introduction and selected work
- `projects.html` — complete project gallery with category filters
- `resume.html` — online resume, or the uploaded PDF when one is published
- `biodata.html` — optional personal bio-data
- `contact.html` — contact information and email-draft form
- `admin.html` — private content editor

## Project gallery
The starter content includes projects and ideas previously discussed: OfflinePay, NirmanCheck, the breast pre-screening patch, IQ/WAV signal analysis, SmartPrint, ScamCart, Beach Water Quality Monitoring, Salescope, EMG monitoring, footstep energy, drone prototype, Tap-Less Canteen and One Face, One Card. Each entry is labelled with its current stage so a concept is not presented as a completed product. Update descriptions, status, stack and links in Admin before publishing. The included SVG covers are illustrative placeholders; replace them with real project screenshots/photos from Admin.

## Local preview
1. Extract the ZIP.
2. Open the extracted `beyond-the-code-final-assignment` folder in VS Code.
3. Install/enable Live Server if needed.
4. Right-click `index.html` → **Open with Live Server**.
5. To open the editor, visit the same local address with `/admin.html` appended.

The public pages can be previewed using the starter JSON without Supabase. Admin editing, cloud PDF/image uploads and online publishing require Supabase.

## Supabase setup for secure Admin
1. Create a Supabase project.
2. In Authentication, create your own user and disable public sign-ups.
3. Copy the Project URL and anon/publishable key into `assets/config.js`. Never put a service-role key in browser code.
4. Open SQL Editor and run `supabase/schema.sql`.
5. Before running the SQL, replace every `00000000-0000-0000-0000-000000000000` with your own Auth user UUID. This is intentionally a deny-by-default placeholder; without replacement Admin writes/uploads will be blocked.
6. Set the Supabase Auth Site URL and allowed redirect URL to your deployed site URL.
7. Sign in at `/admin.html`.

The SQL allows public reads but restricts content writes and media uploads/updates/deletes to the configured admin UUID. Do not broaden these policies to all authenticated users.

## Admin features
- Edit personal information, education, skills, projects, certifications, activities, languages and optional bio-data.
- Upload/remove profile photo.
- Upload, replace or remove your actual resume PDF (PDF, up to 10 MB).
- Upload multiple project images (JPG/PNG/WebP, up to 5 MB each); image URLs are stored in project records.
- Add/remove project entries and edit category, status, technologies, description and repository/demo links.

## Important notes
- Project covers included in this package are original illustrative SVG graphics, not evidence/photos of completed hardware or software. Replace them with your actual screenshots in Admin.
- Empty project URLs are intentionally blank; add only real repository/demo links.
- Some project entries are concepts or ongoing prototypes, as labelled. Review every description and stage before publishing.
- The contact form opens the visitor's email application; it does not store messages.
- The visit count is local to each browser, not a global analytics counter.
- jQuery and Supabase libraries load from CDNs, so those features require internet access.
- Do not publish personal details such as date of birth or full home address unless you deliberately choose to share them.
