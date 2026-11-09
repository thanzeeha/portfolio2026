/*
  ADMIN SCRIPT
  Handles:
  1. Admin login
  2. Editing portfolio information
  3. Profile photo upload
  4. Resume PDF upload
  5. Project image uploads and previews
  6. Removing project images
  7. Saving and publishing changes
*/

const cfg = window.PORTFOLIO_CONFIG || {};

const configured = !!(
    window.supabase &&
    cfg.supabaseUrl &&
    !cfg.supabaseUrl.includes("YOUR_") &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseAnonKey.includes("YOUR_")
);

let sb;
let data = {};
let photoFile = null;
let resumePdfFile = null;
let removePdf = false;

const $ = id => document.getElementById(id);

const keys = [
    "education",
    "skills",
    "projects",
    "certifications",
    "participation",
    "languages"
];

const templates = {
    education: {
        degree: "",
        institution: "",
        year: "",
        score: ""
    },
    skills: {
        group: "",
        items: ""
    },
    projects: {
        name: "",
        category: "",
        stack: "",
        description: "",
        status: "",
        image: "",
        gallery: "",
        github: "",
        demo: "",
        problem: "",
        solution: "",
        contribution: "",
        challenges: "",
        outcomes: ""
    },
    certifications: {
        name: "",
        issuer: "",
        date: ""
    },
    participation: {
        name: "",
        organizer: "",
        date: ""
    },
    languages: {
        name: "",
        level: ""
    }
};


// Show or hide an element.
function show(id, on) {
    $(id).hidden = !on;
}


// Display a message.
function note(id, message) {
    $(id).textContent = message;
}


// Escape text before inserting it into HTML.
function esc(value = "") {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(value)
        .split("")
        .map(character => entities[character] || character)
        .join("");
}


// Get unique project image URLs.
function getProjectImages(card) {
    const cover = card.querySelector('[data-field="image"]');
    const gallery = card.querySelector('[data-field="gallery"]');

    const urls = [
        cover.value,
        ...gallery.value.split(",")
    ]
        .map(url => url.trim())
        .filter(Boolean);

    return [...new Set(urls)];
}


// Display large project image previews.
function renderProjectImagePreviews(card) {
    let preview = card.querySelector(".project-image-previews");

    if (!preview) {
        preview = document.createElement("div");
        preview.className = "project-image-previews";
        card.appendChild(preview);
    }

    preview.innerHTML = "";

    const images = getProjectImages(card);

    if (!images.length) {
        preview.textContent = "No project images uploaded yet.";
        return;
    }

    images.forEach((url, index) => {
        const item = document.createElement("div");
        item.className = "project-image-item";

        const image = document.createElement("img");
        image.src = url;
        image.alt = "Project image " + (index + 1);
        image.loading = "lazy";

        image.onerror = () => {
            image.alt = "Image could not be loaded";
        };

        const details = document.createElement("div");
        details.className = "project-image-details";

        const label = document.createElement("span");
        label.textContent =
            index === 0 ? "Cover image" : "Gallery image";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-project-image";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            const remaining = getProjectImages(card)
                .filter(imageUrl => imageUrl !== url);

            const cover = card.querySelector('[data-field="image"]');
            const gallery = card.querySelector('[data-field="gallery"]');

            cover.value = remaining[0] || "";
            gallery.value = remaining.slice(1).join(", ");

            renderProjectImagePreviews(card);

            note(
                "saveMessage",
                "Image removed from this project. Click Save and publish all changes."
            );
        });

        details.appendChild(label);
        details.appendChild(removeButton);

        item.appendChild(image);
        item.appendChild(details);

        preview.appendChild(item);
    });
}


// Upload project images to Supabase Storage.
// The original OfflinePay SVG is already in the project,
// so save its local path instead of uploading it.
async function uploadProjectImages(files) {
    const urls = [];

    for (const file of files) {

        if (file.name.toLowerCase() === "offlinepay.svg") {
            urls.push("assets/project-images/offlinepay.svg");
            continue;
        }

        if (!file.type.startsWith("image/")) {
            throw new Error("Please select image files only.");
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error(file.name + " is larger than 5 MB.");
        }

        const extension =
            (file.name.split(".").pop() || "jpg")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

        const path =
            `projects/${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.${extension}`;

        const { error } = await sb
            .storage
            .from("portfolio-media")
            .upload(path, file, {
                upsert: false,
                contentType: file.type
            });

        if (error) {
            throw error;
        }

        const result = sb
            .storage
            .from("portfolio-media")
            .getPublicUrl(path);

        urls.push(result.data.publicUrl);
    }

    return urls;
}


// Display editable sections.
function renderArray(key) {
    const root = $(key + "Editor");
    root.innerHTML = "";

    (data[key] || []).forEach((obj, index) => {
        const card = document.createElement("div");
        card.className = "edit-card";

        card.innerHTML = `
            <div class="edit-card-top">
                <b>${key.slice(0, -1).toUpperCase()} ${index + 1}</b>
                <button type="button" class="remove">
                    Remove
                </button>
            </div>
        `;

        // Create input fields.
        Object.keys(templates[key]).forEach(field => {
            const input =
                field === "description"
                    ? document.createElement("textarea")
                    : document.createElement("input");

            input.value = obj[field] || "";
            input.dataset.field = field;

            if (field === "description") {
                input.rows = 3;
            }

            // Image URLs are stored automatically.
            if (
                key === "projects" &&
                (field === "image" || field === "gallery")
            ) {
                input.type = "hidden";
                card.appendChild(input);
                return;
            }

            const label = document.createElement("label");

            label.textContent = ({
                degree: "Degree / qualification",
                institution: "Institution",
                year: "Year / duration",
                score: "Score / CGPA",
                group: "Skill category",
                items: "Skills (comma separated)",
                name: "Name / title",
                stack: "Technologies / stack",
                description: "Description",
                status: "Status",
                category: "Category",
                github: "GitHub URL",
                demo: "Live demo URL",
                problem: "Problem statement",
                solution: "Proposed solution",
                contribution: "My contribution",
                challenges: "Challenges faced",
                outcomes: "Outcomes",
                issuer: "Issuer",
                date: "Date",
                organizer: "Organizer",
                level: "Proficiency"
            })[field] || field;

            label.appendChild(input);
            card.appendChild(label);
        });


        // Project image upload section.
        if (key === "projects") {
            const uploadLabel = document.createElement("label");
            uploadLabel.className = "project-image-upload";

            uploadLabel.textContent =
                "Upload project images from your device";

            const help = document.createElement("small");

            help.textContent =
                "Choose one or multiple images. " +
                "The first image becomes the cover. " +
                "Maximum 5 MB per image.";

            uploadLabel.appendChild(help);

            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*,.svg";
            fileInput.multiple = true;


            // When images are selected.
            fileInput.addEventListener("change", async () => {
                const files = [...fileInput.files];

                if (!files.length) return;

                if (!sb) {
                    note(
                        "saveMessage",
                        "Connect Supabase before uploading."
                    );
                    return;
                }

                // Check image sizes and file types.
                const invalidFile = files.find(file => {
                    const isOfflinePaySvg =
                        file.name.toLowerCase() === "offlinepay.svg";

                    return (
                        (!file.type.startsWith("image/") && !isOfflinePaySvg) ||
                        file.size > 5 * 1024 * 1024
                    );
                });

                if (invalidFile) {
                    note(
                        "saveMessage",
                        "Please select image files smaller than 5 MB."
                    );

                    fileInput.value = "";
                    return;
                }

                try {
                    note(
                        "saveMessage",
                        "Uploading project images..."
                    );

                    const urls = await uploadProjectImages(files);

                    const imageField = card.querySelector(
                        '[data-field="image"]'
                    );

                    const galleryField = card.querySelector(
                        '[data-field="gallery"]'
                    );

                    const existingImages = getProjectImages(card);

                    const allImages = [
                        ...existingImages,
                        ...urls
                    ];

                    const uniqueImages = [...new Set(allImages)];

                    imageField.value = uniqueImages[0] || "";

                    galleryField.value =
                        uniqueImages.slice(1).join(", ");

                    renderProjectImagePreviews(card);

                    note(
                        "saveMessage",
                        `${urls.length} image(s) selected successfully. ` +
                        "Click Save and publish all changes."
                    );

                } catch (error) {
                    note(
                        "saveMessage",
                        "Image upload failed: " + error.message
                    );
                }

                fileInput.value = "";
            });

            uploadLabel.appendChild(fileInput);
            card.appendChild(uploadLabel);

            renderProjectImagePreviews(card);
        }


        // Remove an entire entry.
        card.querySelector(".remove").onclick = () => {
            data[key].splice(index, 1);
            renderArray(key);
        };

        root.appendChild(card);
    });
}


// Fill the Admin form with saved information.
function fill() {
    if (data.resumePdfUrl) {
        $("resumePdfCurrent").href = data.resumePdfUrl;
        $("resumePdfCurrent").hidden = false;
    } else {
        $("resumePdfCurrent").hidden = true;
    }

    [
        "name",
        "headline",
        "location",
        "email",
        "phone",
        "github",
        "linkedin",
        "summary"
    ].forEach(key => {
        $(key).value = data[key] || "";
    });

    const bio = data.bio || {};

    [
        "dateOfBirth",
        "gender",
        "nationality",
        "address",
        "careerObjective"
    ].forEach(key => {
        $(key).value = bio[key] || "";
    });

    keys.forEach(renderArray);

    if (data.photoUrl) {
        $("preview").src = data.photoUrl;
        $("preview").hidden = false;
    } else {
        $("preview").hidden = true;
    }
}


// Collect information from editable sections.
function collect(key) {
    return [
        ...$(key + "Editor").querySelectorAll(".edit-card")
    ].map(card => {
        const obj = {};

        card.querySelectorAll("[data-field]").forEach(input => {
            obj[input.dataset.field] = input.value.trim();
        });

        return obj;
    });
}


// Supabase configuration.
if (!configured) {
    show("setup", true);
    show("login", false);
    show("editor", false);

} else {
    sb = window.supabase.createClient(
        cfg.supabaseUrl,
        cfg.supabaseAnonKey
    );

    show("setup", false);

    sb.auth.getSession().then(async ({ data: sessionData }) => {
        if (sessionData.session) {
            await openEditor();
        } else {
            show("login", true);
        }
    });
}


// Open Admin editor.
async function openEditor() {
    show("login", false);
    show("editor", true);

    const { data: result, error } = await sb
        .from("portfolio_content")
        .select("content")
        .eq("id", 1)
        .maybeSingle();

    if (error) {
        note("saveMessage", error.message);
        return;
    }

    if (result?.content) {
        data = result.content;
    } else {
        const response = await fetch("assets/default-content.json");
        data = await response.json();
    }

    fill();
}


// Admin login.
$("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    note("loginMessage", "Signing in...");

    const { error } = await sb.auth.signInWithPassword({
        email: $("adminEmail").value,
        password: $("adminPassword").value
    });

    if (error) {
        note("loginMessage", error.message);
        return;
    }

    await openEditor();
});


// Logout.
$("logout").onclick = async () => {
    await sb.auth.signOut();

    show("editor", false);
    show("login", true);
};


// Add new entries.
document.querySelectorAll("[data-add]").forEach(button => {
    button.onclick = () => {
        const key = button.dataset.add;

        data[key] = data[key] || [];
        data[key].push({ ...templates[key] });

        renderArray(key);
    };
});


// Resume PDF selection.
$("resumePdf").onchange = event => {
    resumePdfFile = event.target.files[0] || null;
    removePdf = false;

    if (
        resumePdfFile &&
        (
            resumePdfFile.type !== "application/pdf" ||
            resumePdfFile.size > 10 * 1024 * 1024
        )
    ) {
        note("saveMessage", "Choose a PDF smaller than 10 MB.");

        resumePdfFile = null;
        event.target.value = "";
    }
};


// Remove resume PDF.
$("removeResumePdf").onclick = () => {
    resumePdfFile = null;
    removePdf = true;

    $("resumePdf").value = "";
    $("resumePdfCurrent").hidden = true;

    note(
        "saveMessage",
        "Resume PDF will be removed when you save."
    );
};


// Profile photo selection.
$("photo").onchange = event => {
    photoFile = event.target.files[0] || null;

    if (photoFile) {
        if (
            !photoFile.type.startsWith("image/") ||
            photoFile.size > 5 * 1024 * 1024
        ) {
            note("saveMessage", "Choose an image smaller than 5 MB.");

            photoFile = null;
            event.target.value = "";
            return;
        }

        $("preview").src = URL.createObjectURL(photoFile);
        $("preview").hidden = false;
    }
};


// Remove profile photo.
$("removePhoto").onclick = () => {
    data.photoUrl = "";

    photoFile = null;

    $("photo").value = "";
    $("preview").hidden = true;
};


// Save and publish all changes.
$("editForm").onsubmit = async event => {
    event.preventDefault();

    note("saveMessage", "Saving...");

    try {
        let photoUrl = data.photoUrl || "";
        let resumePdfUrl = data.resumePdfUrl || "";

        // Remove old resume PDF.
        if (removePdf && data.resumePdfPath) {
            const { error } = await sb
                .storage
                .from("portfolio-media")
                .remove([data.resumePdfPath]);

            if (error) throw error;

            resumePdfUrl = "";
            data.resumePdfPath = "";
        }

        // Upload new resume PDF.
        if (resumePdfFile) {
            const path = "resume/portfolio-resume.pdf";

            const { error } = await sb
                .storage
                .from("portfolio-media")
                .upload(path, resumePdfFile, {
                    upsert: true,
                    contentType: "application/pdf"
                });

            if (error) throw error;

            resumePdfUrl = sb
                .storage
                .from("portfolio-media")
                .getPublicUrl(path).data.publicUrl;

            data.resumePdfPath = path;
        }

        // Upload profile photo.
        if (photoFile) {
            const extension =
                photoFile.name.split(".").pop().toLowerCase();

            const path =
                "profile/photo-" + Date.now() + "." + extension;

            const { error } = await sb
                .storage
                .from("portfolio-media")
                .upload(path, photoFile, {
                    upsert: true,
                    contentType: photoFile.type
                });

            if (error) throw error;

            photoUrl = sb
                .storage
                .from("portfolio-media")
                .getPublicUrl(path).data.publicUrl;
        }

        // Collect main information.
        const output = {};

        [
            "name",
            "headline",
            "location",
            "email",
            "phone",
            "github",
            "linkedin",
            "summary"
        ].forEach(key => {
            output[key] = $(key).value.trim();
        });

        output.photoUrl = photoUrl;
        output.resumePdfUrl = resumePdfUrl;
        output.resumePdfPath = data.resumePdfPath || "";

        // Collect all sections.
        keys.forEach(key => {
            output[key] = collect(key);
        });

        // Collect bio-data.
        output.bio = {};

        [
            "dateOfBirth",
            "gender",
            "nationality",
            "address",
            "careerObjective"
        ].forEach(key => {
            output.bio[key] = $(key).value.trim();
        });

        // Save to Supabase database.
        const { error } = await sb
            .from("portfolio_content")
            .upsert(
                {
                    id: 1,
                    content: output,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: "id"
                }
            );

        if (error) throw error;

        data = output;

        photoFile = null;
        resumePdfFile = null;
        removePdf = false;

        $("photo").value = "";
        $("resumePdf").value = "";

        fill();

        note(
            "saveMessage",
            "Saved and published successfully!"
        );

    } catch (error) {
        console.error(error);

        note(
            "saveMessage",
            "Save failed: " + error.message
        );
    }
};