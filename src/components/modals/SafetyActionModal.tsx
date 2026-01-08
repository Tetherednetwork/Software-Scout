import React from 'react';
import { CloseIcon, RestoreIcon, CleanIcon, VirusScanIcon, UpdateIcon, KeyboardIcon, UserPlusIcon, ShieldExclamationIcon, LockIcon, CloudUploadIcon, SpotlightIcon, ScreenshotIcon, GatekeeperIcon, TimeMachineIcon, MissionControlIcon, AirdropIcon } from '../ui/Icons';
import type { SafetyActionId } from '../../types';

interface SafetyActionModalProps {
    actionType: SafetyActionId;
    onClose: () => void;
}

const SafetyActionModal: React.FC<SafetyActionModalProps> = ({ actionType, onClose }) => {
    const actions = {
        restore: {
            title: "Create a Restore Point",
            icon: <RestoreIcon />,
            disclaimer: "This is a powerful system action. Please proceed with caution. SoftMonk is not responsible for any data loss or system issues that may occur.",
            steps: [
                { 
                    title: "Open System Properties", 
                    description: "Press the Windows Key, type 'Create a restore point', and press Enter.",
                    media: { type: 'gif', src: '/images/tutorials/win-restore-1.gif', alt: "Animation showing the Windows search bar with 'Create a restore point' being typed and selected." }
                },
                { 
                    title: "Start Creation", 
                    description: "In the 'System Protection' tab, click the 'Create...' button.",
                    media: { type: 'gif', src: '/images/tutorials/win-restore-2.gif', alt: "Animation showing the System Properties window and the 'Create' button being clicked." }
                },
                { 
                    title: "Name Your Restore Point", 
                    description: "Give your restore point a descriptive name, like 'Before installing new software', and click 'Create'.",
                    media: { type: 'gif', src: '/images/tutorials/win-restore-3.gif', alt: "Animation showing a name being typed for the restore point and the 'Create' button being clicked." }
                },
                { 
                    title: "Wait for Completion", 
                    description: "The process will take a few moments. Once it's done, you'll see a success message." 
                },
            ]
        },
        clean: {
            title: "Clean Temporary Files",
            icon: <CleanIcon />,
            disclaimer: "This is a powerful system action. Please proceed with caution. SoftMonk is not responsible for any data loss or system issues that may occur.",
            steps: [
                { title: "Open the Run Command", description: "Press the Windows Key + R to open the Run dialog box." },
                { title: "Navigate to Temp Folder", description: "Type `%temp%` and press Enter. This will open your user's temporary files folder." },
                { title: "Select All Files", description: "Once the folder is open, press Ctrl + A to select all files and folders." },
                { title: "Delete the Files", description: "Press Shift + Delete to permanently delete the files. Choose to skip any files that are currently in use by other programs." },
            ]
        },
        'virus-scan': {
            title: "Run a Quick Virus Scan",
            icon: <VirusScanIcon />,
            disclaimer: "This is a powerful system action. Please proceed with caution. SoftMonk is not responsible for any data loss or system issues that may occur.",
            steps: [
                { title: "Open Windows Security", description: "Press the Windows Key, type 'Windows Security', and press Enter." },
                { title: "Go to Protection Area", description: "In the new window, click on 'Virus & threat protection'." },
                { title: "Start a Scan", description: "Under 'Current threats', click on 'Quick scan' to start a fast check of your system. For a deeper check, click 'Scan options' and choose 'Full scan'." },
                { title: "Review Results", description: "Wait for the scan to complete. Windows Defender will notify you if it finds any threats and guide you on the next steps." },
            ]
        },
        'check-updates': {
            title: "Check for Updates",
            icon: <UpdateIcon />,
            disclaimer: "This is a powerful system action. Please proceed with caution. SoftMonk is not responsible for any data loss or system issues that may occur.",
            steps: [
                 { 
                    title: "Open Settings", 
                    description: "Right-click the Start button and select 'Settings', or press Windows Key + I.",
                    media: { type: 'gif', src: '/images/tutorials/win-updates-1.gif', alt: "Animation showing the Windows Start menu being right-clicked and 'Settings' selected." }
                },
                { 
                    title: "Navigate to Windows Update", 
                    description: "In the Settings window, click on 'Windows Update' from the left-hand menu (on Windows 11) or 'Update & Security' (on Windows 10).",
                    media: { type: 'gif', src: '/images/tutorials/win-updates-2.gif', alt: "Animation showing the Windows Update section in the Settings app." }
                },
                { 
                    title: "Check for Updates", 
                    description: "Click the 'Check for updates' button. Windows will search for, download, and install any available updates.",
                    media: { type: 'gif', src: '/images/tutorials/win-updates-3.gif', alt: "Animation of the 'Check for updates' button being clicked." }
                },
                { title: "Restart if Needed", description: "Some updates may require you to restart your computer. If so, save your work and restart when prompted." },
            ]
        },
        shortcuts: {
            title: "Learn Useful Shortcuts",
            icon: <KeyboardIcon />,
            disclaimer: undefined,
            steps: [
                { title: "Ctrl + C (or Ctrl + Insert)", description: "Copy the selected item." },
                { title: "Ctrl + X", description: "Cut the selected item." },
                { title: "Ctrl + V (or Shift + Insert)", description: "Paste the selected item." },
                { title: "Ctrl + Z", description: "Undo an action." },
                { title: "Ctrl + Y", description: "Redo an action." },
                { title: "Ctrl + A", description: "Select all content." },
                { title: "Ctrl + F", description: "Search for text on a page or in a document." },
                { title: "Alt + Tab", description: "Switch between open applications." },
                { title: "Alt + F4", description: "Close the active window or application." },
                { title: "F5", description: "Refresh the active window (e.g., browser, File Explorer)." },
                { title: "Windows key", description: "Open or close the Start Menu." },
                { title: "Win + D", description: "Display and hide the desktop." },
                { title: "Win + E", description: "Open File Explorer." },
                { title: "Win + I", description: "Open the Settings app." },
                { title: "Win + L", description: "Lock your computer." },
                { title: "Win + M", description: "Minimize all windows." },
                { title: "Win + R", description: "Open the Run dialog box." },
                { title: "Win + S (or Win + Q)", description: "Open the search bar." },
                { title: "Win + X", description: "Open the Quick Link (Power User) menu." },
                { title: "Win + Tab", description: "Open Task View to see all open windows and virtual desktops." },
                { title: "Win + . (period)", description: "Open the emoji, GIF, and symbol panel." },
                { title: "Win + A", description: "Open Quick Settings (Action Center in Windows 10)." },
                { title: "Win + P", description: "Choose a presentation display mode (for projectors/external monitors)." },
                { title: "PrtScn", description: "Take a screenshot of your entire screen and copy it to the clipboard." },
                { title: "Win + PrtScn", description: "Take a screenshot of your entire screen and save it to your Pictures > Screenshots folder." },
                { title: "Win + Shift + S", description: "Open the Snipping Tool to capture a specific region, window, or fullscreen." },
                { title: "Win + Up Arrow", description: "Maximize the active window." },
                { title: "Win + Down Arrow", description: "Minimize the active window." },
                { title: "Win + Left/Right Arrow", description: "Snap the active window to the left or right half of the screen." },
                { title: "Ctrl + Shift + Esc", description: "Open the Task Manager directly." },
                { title: "Ctrl + Alt + Delete", description: "Open the security screen (Lock, Switch user, Sign out, Task Manager)." },
                { title: "Win + Ctrl + D", description: "Create a new virtual desktop." },
                { title: "Win + Ctrl + F4", description: "Close the current virtual desktop." },
                { title: "Win + Ctrl + Left/Right Arrow", description: "Switch between virtual desktops." },
                { title: "Ctrl + N", description: "Open a new File Explorer window." },
                { title: "Ctrl + Shift + N", description: "Create a new folder in the current directory." },
                { title: "F2", description: "Rename the selected file or folder." },
                { title: "Alt + Enter", description: "View the properties for the selected item." },
                { title: "Ctrl + W", description: "Close the current File Explorer window." }
            ]
        },
        'new-user': {
            title: "Create a New User Account",
            icon: <UserPlusIcon />,
            disclaimer: "You must have administrator privileges on your PC to add a new user account.",
            steps: [
                { title: "Open Settings", description: "Press the Windows Key + I to open the Settings app." },
                { title: "Go to Accounts", description: "Click on the 'Accounts' section." },
                { title: "Select Other Users", description: "Choose 'Family & other users' (or just 'Other users' depending on your Windows version)." },
                { title: "Add Account", description: "Click 'Add someone else to this PC' or 'Add account'." },
                { title: "Follow Wizard", description: "Follow the on-screen instructions. You can create a local account by selecting 'I don't have this person's sign-in information' and then 'Add a user without a Microsoft account'." },
            ]
        },
        'wipe-pc': {
            title: "Securely Wipe Your PC",
            icon: <ShieldExclamationIcon />,
            disclaimer: "Warning: This action is irreversible and will permanently delete all your personal files, apps, and settings. Back up anything you want to keep before you begin.",
            steps: [
                { title: "Open Settings", description: "Press Windows Key + I to open Settings." },
                { title: "Go to Recovery", description: "Click 'Update & Security', then select the 'Recovery' tab." },
                { title: "Reset this PC", description: "Under the 'Reset this PC' section, click 'Get started'." },
                { title: "Choose 'Remove everything'", description: "To ensure your data is gone, you MUST select the 'Remove everything' option." },
                { title: "Select 'Clean data'", description: "On the next screen, choose 'Change settings' and turn ON the 'Clean data' option. This securely erases the drive but takes much longer. It is the best option if you're selling or recycling the PC." },
                { title: "Confirm and Reset", description: "Follow the final on-screen prompts to start the reset process. Your computer will restart several times and this may take a few hours." },
            ]
        },
        'recover-password': {
            title: "Recover a Lost Password",
            icon: <LockIcon className="h-6 w-6 text-green-600 dark:text-green-400" />,
            disclaimer: "The recovery method depends on whether you use a Microsoft account or a local account to log in.",
            steps: [
                { title: "For a Microsoft Account", description: "On the login screen, click 'I forgot my password'. On another device, go to account.live.com/password/reset and follow the steps to verify your identity and set a new password." },
                { title: "For a Local Account (with security questions)", description: "After entering an incorrect password on the login screen, click the 'Reset password' link that appears. Answer your pre-set security questions correctly to create a new password." },
                { title: "For a Local Account (no security questions)", description: "If you didn't set security questions, you'll need a password reset disk if you created one in advance. If not, recovery is much more complex and may require advanced tools or a full system reinstall, which could lead to data loss." },
            ]
        },
        'backup-onedrive': {
            title: "Back Up Your PC to OneDrive",
            icon: <CloudUploadIcon />,
            disclaimer: "This feature backs up personal files in your Desktop, Documents, and Pictures folders. It does not back up installed applications. A free Microsoft account includes 5GB of storage.",
            steps: [
                { title: "Open OneDrive Settings", description: "Right-click the white or blue OneDrive cloud icon in your taskbar's notification area and select 'Settings' (or 'Help & Settings' > 'Settings')." },
                { title: "Go to 'Sync and backup'", description: "In the OneDrive settings window, navigate to the 'Sync and backup' tab on the left." },
                { title: "Manage Backup", description: "Click the 'Manage backup' button." },
                { title: "Select Folders to Back Up", description: "A new window will appear. Select the toggles for the Desktop, Documents, and Pictures folders you wish to sync." },
                { title: "Start Backup", description: "Click the 'Start backup' button. OneDrive will begin uploading your files to the cloud, making them safe and accessible from other devices." },
            ]
        },
        'mac-spotlight': {
            title: "Master Spotlight Search",
            icon: <SpotlightIcon />,
            disclaimer: undefined,
            steps: [
                { 
                    title: "Open Spotlight", 
                    description: "Press Command (⌘) + Spacebar. A search bar will appear in the middle of your screen.",
                    media: { type: 'gif', src: '/images/tutorials/mac-spotlight-1.gif', alt: "Animation showing the Command and Spacebar keys being pressed, and the Spotlight search bar appearing." }
                },
                { 
                    title: "Find Anything", 
                    description: "Start typing what you're looking for. This can be an app name, a document, an email, or even a contact.",
                    media: { type: 'gif', src: '/images/tutorials/mac-spotlight-2.gif', alt: "Animation showing an application name being typed into Spotlight and results appearing." }
                },
                { 
                    title: "Perform Quick Actions", 
                    description: "You can also type calculations (e.g., '5*99'), currency conversions ('100 USD to GBP'), or definitions ('define serendipity').",
                    media: { type: 'gif', src: '/images/tutorials/mac-spotlight-3.gif', alt: "Animation showing a calculation '5*99' being typed into Spotlight and the answer appearing." }
                },
                { title: "Preview Files", description: "Use the arrow keys to highlight a result. A preview will appear on the right. Press Enter to open the selected item." }
            ]
        },
        'mac-screenshot': {
            title: "Take Advanced Screenshots",
            icon: <ScreenshotIcon />,
            disclaimer: undefined,
            steps: [
                { 
                    title: "Capture the Entire Screen", 
                    description: "Press Shift + Command (⌘) + 3. The screenshot is saved to your desktop.",
                    media: { type: 'gif', src: '/images/tutorials/mac-screenshot-1.gif', alt: "Animation showing the keyboard shortcut for a full screen capture on macOS." }
                },
                { 
                    title: "Capture a Portion of the Screen", 
                    description: "Press Shift + Command (⌘) + 4. Your cursor will change to a crosshair. Drag to select the area, then release.",
                    media: { type: 'gif', src: '/images/tutorials/mac-screenshot-2.gif', alt: "Animation showing a specific area of the screen being selected for a screenshot." }
                },
                { 
                    title: "Capture a Specific Window", 
                    description: "Press Shift + Command (⌘) + 4, then press the Spacebar. The cursor becomes a camera. Click on the window you want to capture.",
                    media: { type: 'gif', src: '/images/tutorials/mac-screenshot-3.gif', alt: "Animation showing the window capture mode for screenshots on macOS." }
                },
                { title: "Open Screenshot Options", description: "Press Shift + Command (⌘) + 5 to open a control panel. Here you can record your screen, set a timer, and choose where to save captures." }
            ]
        },
        'mac-force-quit': {
            title: "Force Quit Unresponsive Apps",
            icon: <ShieldExclamationIcon />,
            disclaimer: "Only force quit apps that are completely frozen, as you will lose any unsaved work.",
            steps: [
                { title: "Open the Force Quit Window", description: "Press Option + Command (⌘) + Escape (Esc) at the same time." },
                { title: "Select the App", description: "In the window that appears, find and select the name of the unresponsive application." },
                { title: "Force Quit", description: "Click the 'Force Quit' button. You will be asked to confirm. Click 'Force Quit' again." }
            ]
        },
        'mac-check-updates': {
            title: "Keep Your Mac Updated",
            icon: <UpdateIcon />,
            disclaimer: "It's a good practice to back up your Mac with Time Machine before a major OS update.",
            steps: [
                { title: "Open System Settings", description: "Click the Apple menu () in the top-left corner and choose 'System Settings...'." },
                { title: "Go to General", description: "In the sidebar, click on 'General'." },
                { title: "Click Software Update", description: "Select 'Software Update'. Your Mac will automatically check for available macOS updates." },
                { title: "Install Updates", description: "If updates are available, click 'Upgrade Now' or 'Update Now' to begin the installation. For App Store apps, open the App Store and click the 'Updates' tab." }
            ]
        },
        'mac-gatekeeper': {
            title: "Understand Gatekeeper Security",
            icon: <GatekeeperIcon />,
            disclaimer: "Be cautious when allowing apps from unidentified developers. Only do so if you trust the source completely.",
            steps: [
                { title: "How it Protects You", description: "By default, macOS allows apps from the App Store and identified developers. This prevents most malware from running on your system." },
                { title: "Open an App from an Unidentified Developer", description: "If you try to open an app that isn't signed, you'll see a warning. To bypass this for a trusted app, right-click (or Control-click) the app icon and choose 'Open'." },
                { title: "Confirm Your Choice", description: "You'll see another warning. Click the 'Open' button to grant a permanent exception for that specific app." },
                { title: "View Security Settings", description: "Go to Apple menu > System Settings... > Privacy & Security. Scroll down to see options for allowing applications downloaded from the App Store or identified developers." }
            ]
        },
        'mac-time-machine': {
            title: "Back Up with Time Machine",
            icon: <TimeMachineIcon />,
            disclaimer: "You will need an external hard drive with enough free space to store your backups.",
            steps: [
                { title: "Connect an External Drive", description: "Plug an external hard drive directly into your Mac." },
                { title: "Set Up Time Machine", description: "A dialog may ask if you want to use the drive with Time Machine. Choose 'Use as Backup Disk'. If not, go to System Settings > General > Time Machine and click 'Add Backup Disk'." },
                { title: "Select Your Disk", description: "Choose your external drive from the list and click 'Set Up Disk'. Time Machine may need to erase the drive first." },
                { title: "Let it Run", description: "Time Machine will start its first backup automatically. After that, it will perform hourly backups in the background whenever the drive is connected." }
            ]
        },
        'mac-lock-screen': {
            title: "Quickly Lock Your Screen",
            icon: <LockIcon />,
            disclaimer: undefined,
            steps: [
                { title: "Use the Keyboard Shortcut", description: "Press Control + Command (⌘) + Q. This will immediately lock your screen, requiring your password to get back in." },
                { title: "Use the Apple Menu", description: "Click the Apple menu () in the top-left corner and choose 'Lock Screen'." },
                { title: "Use Hot Corners", description: "In System Settings > Desktop & Dock > Hot Corners..., you can set a corner of your screen to activate the screen saver or lock the screen when you move your mouse there." }
            ]
        },
        'mac-mission-control': {
            title: "Use Mission Control",
            icon: <MissionControlIcon />,
            disclaimer: undefined,
            steps: [
                { title: "Activate Mission Control", description: "Press the Mission Control key (F3 on most Mac keyboards), or swipe up with three or four fingers on your trackpad." },
                { title: "View All Windows", description: "You will see all your open windows from the current application grouped together, making it easy to find the one you need." },
                { title: "Manage Virtual Desktops (Spaces)", description: "At the top of the screen is the Spaces bar. You can drag windows up into this bar to create new virtual desktops, or switch between them." }
            ]
        },
        'mac-airdrop': {
            title: "Share Files with AirDrop",
            icon: <AirdropIcon />,
            disclaimer: "Both devices need to have Wi-Fi and Bluetooth turned on and be relatively close to each other.",
            steps: [
                { title: "Open Finder and Select AirDrop", description: "Open a Finder window and click 'AirDrop' in the sidebar. You will see nearby AirDrop users." },
                { title: "Send a File", description: "Drag and drop a file onto the icon of the person you want to send it to. Alternatively, right-click a file, choose Share > AirDrop, and select the recipient." },
                { title: "Receive a File", description: "When someone sends you a file, a notification will appear. You can accept or decline. Accepted files are saved to your Downloads folder." }
            ]
        },
        'mac-virus-scan': {
            title: "Run a Virus & Malware Scan on Mac",
            icon: <VirusScanIcon />,
            disclaimer: "macOS has built-in security features, but a manual scan can provide extra peace of mind, especially if you've downloaded software from untrusted sources.",
            steps: [
                { title: "Understand Built-in Protection (XProtect)", description: "macOS includes a technology called XProtect that automatically checks for known malware in the background whenever you open a downloaded app. You don't need to do anything to run it." },
                { title: "When to Perform a Manual Scan", description: "You should consider a manual scan if your Mac is running unusually slow, you see unexpected ads or pop-ups, or you've recently installed software from a source you don't fully trust." },
                { title: "Use a Reputable Third-Party Scanner", description: "For manual scans, it's recommended to use a trusted, well-known antivirus for Mac. A popular and effective free option is Malwarebytes for Mac." },
                { title: "Download and Run a Scan", description: "Download Malwarebytes from its official website, install it, and run a 'Scan'. It will check your system for common Mac threats and allow you to quarantine anything it finds." },
            ]
        },
    };
    
    const actionData = actions[actionType];

    if (!actionData) {
        return null; // Or some fallback UI
    }

    const { title, icon, steps, disclaimer } = actionData;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-green-100 dark:bg-green-900/50 rounded-full">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
                        <p className="text-sm text-gray-500 dark:text-white">Follow these steps to perform this action safely.</p>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {disclaimer && (
                        <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 text-yellow-800 dark:text-yellow-300 text-sm rounded-r-md">
                            <p><strong className="font-semibold">Disclaimer:</strong> {disclaimer}</p>
                        </div>
                    )}
                    <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-8">
                        {steps.map((step, index) => (
                            <li key={index} className="ml-6">
                                <span className="absolute flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full -left-4 ring-4 ring-white dark:ring-gray-800 text-green-700 dark:text-green-300 font-bold">
                                    {index + 1}
                                </span>
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{step.title}</h3>
                                <p className="text-base font-normal text-gray-500 dark:text-white">{step.description}</p>
                                {'media' in step && step.media && (
                                    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 shadow-md bg-gray-50 dark:bg-gray-900">
                                        <img 
                                            src={step.media.src} 
                                            alt={step.media.alt}
                                            className="w-full h-auto"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>

                 <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-right rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Got it. Thanks Monk!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SafetyActionModal;
