import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import process from 'node:process';

// Manually load .env variables for local development
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=');
            value = value.trim(); // Remove newlines/spaces
            // Remove wrapping quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key.trim()] = value;
        }
    });
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Firebase environment variables must be set in your .env file or hosting environment.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const baseUrl = 'https://softmonk.co';

async function generateSitemap() {
    console.log('Generating sitemap...');

    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/about', priority: '0.8', changefreq: 'monthly' },
        { url: '/forum', priority: '0.9', changefreq: 'weekly' },
        { url: '/blogs', priority: '0.9', changefreq: 'weekly' },
        { url: '/file-verifier', priority: '0.7', changefreq: 'monthly' },
    ];

    // Fetch blog posts
    console.log('Fetching blog posts...');
    let blogPosts = [];
    try {
        const blogPostsRef = collection(db, 'blog_posts');
        const blogQ = query(blogPostsRef, orderBy('created_at', 'desc'));
        const blogSnap = await getDocs(blogQ);
        blogPosts = blogSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Warning: Failed to fetch blog posts for sitemap. Firestore API might be disabled or unreachable.", e.message);
    }

    // Fetch forum posts (approved only)
    console.log('Fetching forum posts...');
    let forumPosts = [];
    try {
        const forumPostsRef = collection(db, 'forum_posts');
        const forumQ = query(forumPostsRef, where('status', '==', 'approved'), orderBy('created_at', 'desc'));
        const forumSnap = await getDocs(forumQ);
        forumPosts = forumSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Warning: Failed to fetch forum posts for sitemap.", e.message);
    }

    const sitemapContent = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticPages.map(page => `
    <url>
        <loc>${baseUrl}${page.url}</loc>
        <lastmod>${today}</lastmod>
        <priority>${page.priority}</priority>
        <changefreq>${page.changefreq}</changefreq>
    </url>
    `).join('')}
    ${blogPosts.map((post) => `
    <url>
        <loc>${baseUrl}/blog-post/${post.id}</loc>
        <lastmod>${new Date(post.created_at).toISOString().split('T')[0]}</lastmod>
        <priority>0.8</priority>
        <changefreq>yearly</changefreq>
    </url>
    `).join('')}
    ${forumPosts.map((post) => `
    <url>
        <loc>${baseUrl}/forum#post-${post.id}</loc>
        <lastmod>${new Date(post.created_at).toISOString().split('T')[0]}</lastmod>
        <priority>0.7</priority>
        <changefreq>weekly</changefreq>
    </url>
    `).join('')}
</urlset>
    `.trim();

    // Use process.cwd() which points to the project root in Vercel's build environment.
    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }
    const sitemapPath = path.resolve(publicDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent);

    console.log(`Sitemap generated successfully at ${sitemapPath}`);
    process.exit(0);
}

generateSitemap().catch(e => {
    console.error(e);
    process.exit(1);
});
