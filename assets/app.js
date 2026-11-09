/*
 PUBLIC PAGE SCRIPT
 Loads content, renders page sections and handles page interactions.
 jQuery controls the mobile menu and light/dark theme button.
*/

let portfolio = {};

async function loadPortfolio() {
    try {
        const r = await fetch("assets/default-content.json");
        portfolio = await r.json();

        const c = window.PORTFOLIO_CONFIG || {};

        if (
            c.supabaseUrl &&
            !c.supabaseUrl.includes("YOUR_") &&
            c.supabaseAnonKey &&
            !c.supabaseAnonKey.includes("YOUR_") &&
            window.supabase
        ) {
            const sb = window.supabase.createClient(
                c.supabaseUrl,
                c.supabaseAnonKey
            );

            const { data } = await sb
                .from("portfolio_content")
                .select("content")
                .eq("id", 1)
                .maybeSingle();

            if (data?.content) portfolio = data.content;
        }
    } catch (e) {
        console.error(e);
    }

    renderPage();
    renderProjects();
}

const el = id => document.getElementById(id);

function put(id, value) {
    if (el(id)) el(id).textContent = value || "";
}

function safeLink(label, url) {
    if (!url) return "";

    return `<a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${label} ↗</a>`;
}

function renderPage() {
    put("year", new Date().getFullYear());

    put("heroName", portfolio.name);
    put("heroHeadline", portfolio.headline);
    put("heroSummary", portfolio.summary);
    put("homeAbout", portfolio.summary);

    put("resumeName", portfolio.name);
    put("resumeSummary", portfolio.summary);
    put("careerObjective", portfolio.bio?.careerObjective);

    const photo = portfolio.photoUrl;

    ["heroPhoto", "bioPhoto"].forEach(id => {
        if (el(id)) {
            el(id).hidden = !photo;
            if (photo) el(id).src = photo;
        }
    });

    ["photoFallback", "bioFallback"].forEach(id => {
        if (el(id)) el(id).hidden = !!photo;
    });

    if (el("homeProjects")) {
        el("homeProjects").innerHTML = (portfolio.projects || [])
            .slice(0, 2)
            .map(p => `
                <article>
                    <h3>${esc(p.name)}</h3>
                    <p>${esc(p.description)}</p>
                </article>
            `).join("");
    }

    if (el("educationList")) {
        el("educationList").innerHTML = (portfolio.education || [])
            .map(x => `
                <article class="record">
                    <h3>${esc(x.degree)}</h3>
                    <p>${esc(x.institution)}</p>
                    <small>${esc(x.year)} · ${esc(x.score)}</small>
                </article>
            `).join("");
    }

    if (el("skillsList")) {
        el("skillsList").innerHTML = (portfolio.skills || [])
            .map(x => `
                <div class="skill-row">
                    <b>${esc(x.group)}</b>
                    <span>${esc(x.items)}</span>
                </div>
            `).join("");
    }

    if (el("projectList")) {
        el("projectList").innerHTML = (portfolio.projects || [])
            .map(p => {
                const imgs = [
                    p.image,
                    ...(p.gallery || "").split(",")
                ].map(x => x.trim()).filter(Boolean);

                return `
                    <article class="project-record">
                        ${imgs.length ? `
                            <div class="project-gallery">
                                ${imgs.map(src => `
                                    <img
                                        src="${esc(src)}"
                                        alt="${esc(p.name)} project image"
                                    >
                                `).join("")}
                            </div>
                        ` : ""}

                        <div>
                            <h3>${esc(p.name)}</h3>
                            <p class="muted">
                                ${esc(p.stack)} · ${esc(p.status)}
                            </p>
                            <p>${esc(p.description)}</p>
                        </div>
                    </article>
                `;
            }).join("");
    }

    if (el("certList")) {
        el("certList").innerHTML = (portfolio.certifications || [])
            .map(x => `
                <article class="record">
                    <h3>${esc(x.name)}</h3>
                    <p>${esc(x.issuer)} · ${esc(x.date)}</p>
                </article>
            `).join("");
    }

    if (el("participationList")) {
        el("participationList").innerHTML = (portfolio.participation || [])
            .map(x => `
                <article class="record">
                    <h3>${esc(x.name)}</h3>
                    <p>${esc(x.organizer)} · ${esc(x.date)}</p>
                </article>
            `).join("");
    }

    if (el("languageList")) {
        el("languageList").innerHTML = (portfolio.languages || [])
            .map(x => `
                <span>${esc(x.name)} — ${esc(x.level)}</span>
            `).join("");
    }

    if (el("bioDetails")) {
        const b = portfolio.bio || {};

        const rows = [
            ["Name", portfolio.name],
            ["Course", portfolio.headline],
            ["Location", portfolio.location],
            ["Date of birth", b.dateOfBirth],
            ["Gender", b.gender],
            ["Nationality", b.nationality],
            ["Address", b.address],
            ["Email", portfolio.email],
            ["Phone", portfolio.phone]
        ];

        el("bioDetails").innerHTML = rows
            .filter(x => x[1])
            .map(x => `
                <div>
                    <small>${x[0]}</small>
                    <b>${esc(x[1])}</b>
                </div>
            `).join("");
    }

    if (el("contactDetails")) {
        el("contactDetails").innerHTML = `
            <p>
                <small>EMAIL</small>
                <b>
                    ${portfolio.email
                        ? `<a href="mailto:${encodeURIComponent(portfolio.email)}">${esc(portfolio.email)}</a>`
                        : "Not added"}
                </b>
            </p>

            <p>
                <small>PHONE</small>
                <b>${esc(portfolio.phone)}</b>
            </p>

            <p>
                <small>LOCATION</small>
                <b>${esc(portfolio.location)}</b>
            </p>

            <p>
                <small>LINKS</small>
                <b>
                    ${safeLink("GitHub", portfolio.github)}
                    ${safeLink("LinkedIn", portfolio.linkedin)}
                </b>
            </p>
        `;
    }
}

function renderProjects() {
    const root = el("allProjects");

    if (root) {
        root.innerHTML = (portfolio.projects || [])
            .map((p, i) => {
                const category = p.category || "Other";

                const tags = (p.stack || "")
                    .split(",")
                    .map(x => x.trim())
                    .filter(Boolean);

                return `
                    <article
                        class="project-card"
                        data-category-card="${esc(category + " " + (p.status || ""))}"
                    >

                        <img
                            src="${esc(p.image || "assets/project-images/offlinepay.svg")}"
                            alt="Project cover for ${esc(p.name)}"
                            loading="lazy"
                        >

                        <div class="project-card-body">

                            <span class="project-status">
                                ${esc(p.status || "Project")}
                            </span>

                            <p class="project-meta">
                                ${esc(category)}
                            </p>

                            <h2>${esc(p.name)}</h2>

                            <p>${esc(p.description)}</p>

                            <div class="project-tags">
                                ${tags.map(t => `
                                    <span>${esc(t)}</span>
                                `).join("")}
                            </div>

                            ${(p.gallery || "")
                                .split(",")
                                .map(x => x.trim())
                                .filter(Boolean)
                                .map(src => `
                                    <img
                                        class="project-gallery-thumb"
                                        src="${esc(src)}"
                                        alt="${esc(p.name)} additional project image"
                                        loading="lazy"
                                    >
                                `).join("")}

                            ${p.github ? `
                                <a
                                    class="inline-link"
                                    href="${esc(p.github)}"
                                    target="_blank"
                                    rel="noreferrer"
                                >GitHub ↗</a>
                            ` : ""}

                            ${p.demo ? `
                                <a
                                    class="inline-link"
                                    href="${esc(p.demo)}"
                                    target="_blank"
                                    rel="noreferrer"
                                >Live demo ↗</a>
                            ` : ""}

                        </div>
                    </article>
                `;
            }).join("");
    }

    // Display the original PDF uploaded through Admin.
    const holder = el("resumePdfViewer");

    if (holder) {
        let pdfUrl = portfolio.resumePdfUrl || "";
        const config = window.PORTFOLIO_CONFIG || {};

        // Older saved records may not contain the URL. The Admin uploader uses
        // this fixed Storage path, so resolve its public URL directly as fallback.
        if (
            !pdfUrl &&
            window.supabase &&
            config.supabaseUrl &&
            !config.supabaseUrl.includes("YOUR_") &&
            config.supabaseAnonKey &&
            !config.supabaseAnonKey.includes("YOUR_")
        ) {
            const storageClient = window.supabase.createClient(
                config.supabaseUrl,
                config.supabaseAnonKey
            );

            const storedPath =
                portfolio.resumePdfPath || "resume/portfolio-resume.pdf";

            pdfUrl = storageClient.storage
                .from("portfolio-media")
                .getPublicUrl(storedPath).data.publicUrl;
        }

        if (pdfUrl) {
            const viewerUrl =
                pdfUrl +
                (pdfUrl.includes("?") ? "&" : "?") +
                "v=" +
                Date.now();

            holder.innerHTML = `
                <div class="resume-pdf-panel">

                    <div class="resume-pdf-actions">
                        <p><strong>Your original resume</strong></p>

                        <a
                            class="btn"
                            href="${esc(viewerUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >Open PDF</a>

                        <a
                            class="btn secondary"
                            href="${esc(viewerUrl)}"
                            download="Nafeesath-Thanzeeh-Resume.pdf"
                        >Download PDF</a>
                    </div>

                    <iframe
                        class="resume-pdf-frame"
                        src="${esc(viewerUrl)}#toolbar=1&navpanes=0"
                        title="Uploaded resume PDF"
                        loading="lazy"
                    ></iframe>

                </div>
            `;

            document.querySelectorAll(".resume-section:not(#resumePdfViewer)")
                .forEach(section => section.hidden = true);

        } else {
            holder.innerHTML = `
                <p class='muted'>
                    No resume PDF has been uploaded yet. Upload it from Admin.
                </p>
            `;
        }
    }
}

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

loadPortfolio();

// Theme preference, back-to-top, visitor counter (per browser), and contact mailto form.

const savedTheme = localStorage.getItem("btc-theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
}

document.querySelector(".back-top")?.addEventListener("click", () =>
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    })
);

const visitKey = "btc-visits:" + location.pathname;

let visits = Number(localStorage.getItem(visitKey) || 0) + 1;

localStorage.setItem(visitKey, String(visits));

put("visitCount", visits);

document.getElementById("contactForm")?.addEventListener("submit", e => {
    e.preventDefault();

    const subject = encodeURIComponent(
        "Portfolio enquiry from " +
        document.getElementById("visitorName").value
    );

    const body = encodeURIComponent(
        "Name: " + document.getElementById("visitorName").value +
        "\nEmail: " + document.getElementById("visitorEmail").value +
        "\n\n" + document.getElementById("visitorMessage").value
    );

    location.href =
        "mailto:" + (portfolio.email || "") +
        "?subject=" + subject +
        "&body=" + body;
});

// jQuery is used here for the responsive menu and theme switch.

$(function () {
    $(".menu").on("click", function () {
        $("nav").toggleClass("open");
    });

    $(".theme-toggle").on("click", function () {
        $("body").toggleClass("dark");

        const theme = $("body").hasClass("dark")
            ? "dark"
            : "light";

        localStorage.setItem("btc-theme", theme);
    });
});
// Enlarge project images when clicked
document.addEventListener("click", function (event) {
    const img = event.target.closest(
        ".project-card > img, .project-gallery-thumb, .project-gallery img"
    );

    if (!img) return;

    let viewer = document.getElementById("imageViewer");

    if (!viewer) {
        viewer = document.createElement("div");
        viewer.id = "imageViewer";

        viewer.innerHTML = `
            <button id="closeImageViewer" type="button">&times;</button>
            <img id="enlargedImage" src="" alt="Enlarged project image">
        `;

        document.body.appendChild(viewer);

        viewer.addEventListener("click", function (e) {
            if (
                e.target === viewer ||
                e.target.id === "closeImageViewer"
            ) {
                viewer.style.display = "none";
            }
        });
    }

    document.getElementById("enlargedImage").src = img.src;
    document.getElementById("enlargedImage").alt = img.alt;
    viewer.style.display = "flex";
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        const viewer = document.getElementById("imageViewer");

        if (viewer) viewer.style.display = "none";
    }
});