import React from 'react';

const AboutPage: React.FC = () => {
    const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">{title}</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                {children}
            </div>
        </div>
    );

    return (
        <div className="p-6 sm:p-10">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-8">About SoftMonk</h1>
            
            <Section title="Our Mission">
                <p>SoftMonk helps you find safe software across Windows, macOS, Linux, Android, and games. No clutter. No risk. Just the right software, for any device.</p>
                <p>SoftMonk is built with AI and guided by cybersecurity experts. It sources safe, malware-free software, drivers, and games. You get the direct OEM download link every time. We know finding safe software, drivers, and games is hard. The web holds billions of malware samples, fake installers, phishing plug-ins, and buggy builds, including some posing as free open-source tools.</p>
            </Section>

            <Section title="Our Commitment to Safety">
                <p>We point you to vendor pages for each platform. We flag fake mirrors and bundleware. We show version, file size, SHA256, and signer when available. We guide clean installs. For PCs we match drivers to your model and device IDs, with OEM first and WHQL status where it applies.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    <div>
                        <h3 className="font-semibold text-xl text-gray-700 dark:text-gray-200 mb-2">What We Do</h3>
                        <ul className="list-disc pl-5">
                            <li>We whitelist trusted domains.</li>
                            <li>We never host installers, we link to the source.</li>
                            <li>We verify signatures and hashes vendors publish.</li>
                            <li>We prefer offline installers when offered.</li>
                            <li>We keep an audit log of source changes.</li>
                        </ul>
                    </div>
                    <div>
                         <h3 className="font-semibold text-xl text-gray-700 dark:text-gray-200 mb-2">What We Avoid</h3>
                        <ul className="list-disc pl-5">
                            <li>We avoid adware links and download managers.</li>
                            <li>We avoid third-party mirrors.</li>
                            <li>We give clear notes on opt-out screens and silent switches.</li>
                        </ul>
                    </div>
                </div>
            </Section>

            <Section title="Data, Privacy & Accessibility">
                 <p>We keep data practices transparent. We collect minimal data. You control cookies and analytics. We follow UK and EU privacy rules. See our Privacy Policy and Cookie Policy for details.</p>
                 <p>Accessibility is included. We support keyboard navigation, screen readers, high contrast mode, and clear focus states. We write labels and messages in plain language.</p>
            </Section>
            
            <Section title="Who We Help">
                 <p>We help everyday users who want clean installs. We help IT admins who need verified sources and hashes. We help power users who want silent installs and repeatable setups.</p>
            </Section>

            <Section title="What's Next">
                 <p>You will see a larger catalog across all platforms. You will see more OEM driver coverage. You will get a Windows helper app for auto-detect and file checks. You will get a browser add-on that warns on fake download pages.</p>
            </Section>

             <Section title="Disclaimer & Contact">
                 <p>All product names and logos belong to their owners. SoftMonk is independent unless stated.</p>
                 <p>
                    For support and takedowns, email <a href="mailto:support@softmonk.co" className="text-green-600 hover:underline dark:text-green-400">support@softmonk.co</a>.
                    For security reports, email <a href="mailto:security@softmonk.co" className="text-green-600 hover:underline dark:text-green-400">security@softmonk.co</a>.
                 </p>
            </Section>

            <div className="text-center mt-12">
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">Our promise.</p>
                <p className="text-xl text-gray-600 dark:text-gray-400">Right source. Right file. Clear instructions. Every time.</p>
            </div>
        </div>
    );
};

export default AboutPage;