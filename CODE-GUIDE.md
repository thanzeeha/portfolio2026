# Code guide

- `index.html`, `projects.html`, `resume.html`, `biodata.html`, `contact.html`: public pages and their semantic HTML structure.
- `admin.html`: login and editing controls. It is separate from the public navigation and can be opened directly at `/admin.html`.
- `assets/style.css`: layout, typography, colours, responsive rules and project-card styling.
- `assets/app.js`: reads the default JSON or published Supabase content and renders each page. It also uses jQuery for navigation/theme interactions.
- `assets/admin.js`: authenticated editing, project-image upload and resume-PDF upload.
- `assets/default-content.json`: starter content used before Supabase is connected.
- `assets/config.js`: Supabase URL and anon key placeholders.
- `assets/project-images/`: replaceable illustrative SVG project covers.
- `supabase/schema.sql`: database, storage bucket and row-level security policies.

## Updating project pictures
Open Admin → Projects → select the project → choose one or more files under “Upload project images”. The first uploaded image becomes the cover if no cover exists; remaining images are appended to the gallery. Save and publish after uploading. Supabase must be configured first.

## Updating the actual resume
Open Admin → Actual Resume PDF → choose your PDF → Save and publish. To replace it, upload another PDF and save. To remove it, select Remove uploaded PDF and save. The public Resume page then shows the uploaded PDF instead of the generated text resume sections.
