
import type { BlogPost } from '../types';

const BLOG_STORAGE_key = 'softmonk_blog_posts';

// Seed data to initialize localStorage if it's empty
const initialBlogPosts: BlogPost[] = [
    {
        id: 'post-1',
        title: "5 Telltale Signs of a Fake Download Website",
        date: "October 1, 2025",
        author: "The SoftMonk Team",
        excerpt: "The internet is filled with traps, and fake download sites are among the most common. Learn how to spot the red flags, from misleading ads to suspicious URLs, and keep your computer safe from malware.",
        image: '/images/blog1_SoftMonk.jpg',
        content: `In the digital age, downloading software is a daily task for many. But with convenience comes risk. Malicious actors create convincing fake download websites to trick users into installing malware, adware, or spyware. Protecting yourself starts with knowing what to look for. Here are five telltale signs that a download website might not be what it seems.\n\n**1. Overloaded with Misleading Ads and Buttons**\n\nOfficial websites are typically clean and focused on their product. Fake sites, on the other hand, are often cluttered with aggressive advertisements. Be wary of:\n\n*   **Multiple "Download" Buttons:** You might see several large, flashy buttons. Often, only one is the real link, while the others lead to ads or malicious downloads. The real button is usually less prominent.\n*   **Pop-ups and Banners:** Constant pop-ups, banners that cover content, or ads for unrelated products (like "scan your PC now!") are major red flags.\n*   **Urgent Warnings:** Fake sites create a sense of urgency with messages like "Your PC is at risk!" or "Update required immediately!" These are tactics to make you click without thinking.\n\n**2. The URL Looks Suspicious**\n\nAlways check the address bar. Scammers often use URLs that are slight misspellings or variations of the official domain. For example:\n\n*   **Official:** \`get.adobe.com/reader/\`\n*   **Suspicious:** \`get-adobereader.com\` or \`adobe.download-now.biz\`\n\nLook for the padlock icon and \`https://\` in the URL, which indicates a secure connection, but remember that even malicious sites can use HTTPS. The domain name itself is the most important clue.\n\n**3. The Website Design is Unprofessional**\n\nLegitimate companies invest in professional web design. While some fake sites are sophisticated, many exhibit signs of poor quality, such as:\n\n*   Low-resolution logos and images.\n*   Grammatical errors and typos in the text.\n*   Outdated design and broken links.\n*   A lack of essential pages like "About Us," "Contact," or a "Privacy Policy."\n\n**4. They Force You to Use a "Download Manager"**\n\nOne of the most common tricks is bundling the software you want with a proprietary "download manager" or "installer." These tools often install adware, browser toolbars, or other potentially unwanted programs (PUPs) alongside the software you intended to download. Official sources will almost always provide a direct download link to the installer file (e.g., an \`.exe\`, \`.dmg\`, or \`.msi\` file).\n\n**5. The File Information Doesn't Match**\n\nIf you do proceed to download, be cautious. Before running the installer, check the file's properties. The file name should make sense (e.g., \`vlc-3.0.20-win64.exe\`), not something generic like \`download.exe\` or \`installer.exe\`. Check the file size; if you're expecting a large program and get a tiny file, it's likely just a downloader for malware. When in doubt, don't run it. Use a tool like SoftMonk to verify the source first.\n\nBy staying vigilant and looking for these signs, you can significantly reduce your risk of falling victim to a fake download site. Your digital safety is worth the extra moment of scrutiny.`
    },
    {
        id: 'post-2',
        title: "Why You Should Always Use Official Drivers (And How to Find Them)",
        date: "September 28, 2025",
        author: "The SoftMonk Team",
        excerpt: "Using outdated or incorrect drivers can cause system instability and security vulnerabilities. We break down why official drivers matter and how SoftMonk's guided process makes finding them easy.",
        image: '/images/blog2_SoftMonk.png',
        content: `Your computer's hardware—the graphics card, network adapter, sound card—all need special software to communicate with your operating system. This software is called a driver. While Windows does a great job of installing generic drivers, using the official ones from your hardware manufacturer is crucial for performance, stability, and security.\n\n**What's the Risk of Using the Wrong Drivers?**\n\nUsing generic, outdated, or third-party drivers can lead to a host of problems:\n\n*   **Performance Issues:** Generic drivers often lack optimizations for specific hardware, leading to lower frame rates in games, slower Wi-Fi speeds, or poor audio quality.\n*   **System Instability:** Incorrect drivers are a common cause of system crashes, blue screens of death (BSOD), and unexpected hardware behavior.\n*   **Security Vulnerabilities:** Drivers operate at a deep level of the operating system. Flaws can be exploited by malware to gain control of your system. Manufacturers regularly release updates to patch these vulnerabilities.\n*   **Malware from Shady Sources:** Many third-party "driver update" tools bundle adware or malware with their downloads. They are almost never a safe choice.\n\n**The Golden Rule: Get Drivers from the Source**\n\nThere are only two places you should ever get drivers from:\n\n1.  **The PC Manufacturer's Website (e.g., Dell, HP, Lenovo):** This is the best place to start, especially for laptops. They provide drivers that are tested and certified for your specific model.\n2.  **The Component Manufacturer's Website (e.g., NVIDIA, AMD, Intel):** For components like graphics cards, it's often best to get the latest drivers directly from the source for the best gaming performance and newest features.\n\n**How SoftMonk Simplifies the Process**\n\nWe know that navigating manufacturer websites can be confusing. That's why we built the **Guided Driver Finder**. When you tell SoftMonk you need drivers, it walks you through a simple, step-by-step process:\n\n1.  **Identify Your PC Manufacturer.**\n2.  **Provide Your Model or Serial Number.**\n3.  **Specify Your Operating System.**\n4.  **Choose the Hardware Component.**\n\nSoftMonk then uses this information to find the exact, official download page for you, providing a direct link and eliminating the guesswork. It's the safest and easiest way to ensure your PC is running with the correct, up-to-date drivers.`
    },
    {
        id: 'post-3',
        title: "Productivity Boost: Top 5 Free Utilities You Didn't Know You Needed",
        date: "September 20, 2025",
        author: "The SoftMonk Team",
        excerpt: "Beyond the big names, there's a world of incredible free software that can make your daily tasks easier. Discover our top picks for utilities that will supercharge your workflow.",
        image: '/images/blog2_SoftMonk.jpg',
        content: `While everyone knows about the big names in software, a world of powerful, free utilities flies under the radar. These tools solve specific problems and can dramatically improve your daily workflow. Here are five of our favorite free utilities that you'll wonder how you ever lived without.\n\n**1. Everything - Lightning-Fast File Search**\n\nWindows Search has gotten better, but it's still no match for *Everything* by voidtools. This incredibly lightweight program indexes your file names in seconds and finds any file or folder instantly as you type. It's the search function that should have been built into Windows from the start. It uses minimal resources and will change the way you find files on your PC forever.\n\n**2. ShareX - The Ultimate Screenshot Tool**\n\nForget the basic Snipping Tool. *ShareX* is a free, open-source powerhouse for screen captures. It can take screenshots of any shape, record your screen as a GIF or video, and then automatically perform actions on the capture. You can have it automatically add a watermark, copy it to your clipboard, and upload it to an image host, all with a single key press. Its workflow customization is unmatched.\n\n**3. PowerToys - The Windows Supercharger from Microsoft**\n\nDeveloped by Microsoft itself, *PowerToys* is a collection of utilities for power users. It includes tools like:\n\n*   **FancyZones:** Create complex window layouts to easily snap applications into place.\n*   **PowerRename:** A bulk renaming tool with advanced search and replace features.\n*   **Image Resizer:** Quickly resize images directly from the right-click context menu in File Explorer.\n*   **Color Picker:** Instantly get the hex or RGB code for any color on your screen.\n\n**4. f.lux - Save Your Eyes at Night**\n\nStaring at a bright blue screen late at night can strain your eyes and disrupt your sleep. *f.lux* is a simple utility that automatically adjusts the color temperature of your display based on the time of day. It makes your screen warmer at night, reducing eye strain and making it easier to wind down before bed. It's a must-have for anyone who works late.\n\n**5. 7-Zip - The King of Compression**\n\nWhile Windows has built-in support for \`.zip\` files, it struggles with other formats. *7-Zip* is a free, open-source file archiver that can handle almost any compression format you throw at it, including \`.7z\`, \`.rar\`, \`.tar\`, and \`.gz\`. It's lightweight, fast, and integrates seamlessly into the right-click menu. For managing compressed files, it's an essential tool.`
    },
];

// Initialize storage with seed data if it doesn't exist
const initializePosts = () => {
    const storedPosts = localStorage.getItem(BLOG_STORAGE_key);
    if (!storedPosts) {
        localStorage.setItem(BLOG_STORAGE_key, JSON.stringify(initialBlogPosts));
    }
};

initializePosts();

export const getBlogPosts = (): BlogPost[] => {
    const storedPosts = localStorage.getItem(BLOG_STORAGE_key);
    if (storedPosts) {
        try {
            const posts = JSON.parse(storedPosts);
            // Sort by date, newest first
            return posts.sort((a: BlogPost, b: BlogPost) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (e) {
            console.error("Failed to parse blog posts from localStorage", e);
            return [];
        }
    }
    return [];
};

export const getBlogPostById = (id: string): BlogPost | undefined => {
    const posts = getBlogPosts();
    return posts.find(post => post.id === id);
};

export const saveBlogPost = (postData: Omit<BlogPost, 'id' | 'date' | 'author'>): BlogPost => {
    const posts = getBlogPosts();
    const newPost: BlogPost = {
        ...postData,
        id: `post-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        author: "The SoftMonk Team"
    };
    const updatedPosts = [newPost, ...posts];
    localStorage.setItem(BLOG_STORAGE_key, JSON.stringify(updatedPosts));
    return newPost;
};