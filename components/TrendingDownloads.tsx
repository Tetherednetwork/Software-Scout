
import React from 'react';

const trendingSoftware = [
    { name: 'Google Chrome', category: 'Browser', downloads: '1.8B+', iconUrl: 'https://www.google.com/chrome/static/images/chrome-logo-m100.svg' },
    { name: 'VLC Media Player', category: 'Media Player', downloads: '1.2B+', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/VLC_icon.svg/2048px-VLC_icon.svg.png' },
    { name: 'Visual Studio Code', category: 'Code Editor', downloads: '950M+', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Visual_Studio_Code_1.35_icon.svg/2048px-Visual_Studio_Code_1.35_icon.svg.png' },
    { name: 'Mozilla Firefox', category: 'Browser', downloads: '880M+', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/1200px-Firefox_logo%2C_2019.svg.png' },
    { name: 'GIMP', category: 'Photo Editor', downloads: '500M+', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/The_GIMP_icon_-_gnome.svg/1200px-The_GIMP_icon_-_gnome.svg.png' },
    { name: '7-Zip', category: 'File Archiver', downloads: '450M+', iconUrl: 'https://www.7-zip.org/7ziplogo.png' },
    { name: 'Blender', category: '3D Graphics', downloads: '300M+', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Blender_logo_no_text.svg/2503px-Blender_logo_no_text.svg.png' },
    { name: 'OBS Studio', category: 'Streaming', downloads: '280M+', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/OBS_Studio_Logo.svg/1200px-OBS_Studio_Logo.svg.png' },
    { name: 'Audacity', category: 'Audio Editor', downloads: '250M+', iconUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/Audacity_Logo_vectorial.svg/1200px-Audacity_Logo_vectorial.svg.png' },
];

const TrendingDownloads: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <h3 className="font-bold text-gray-800">Trending Downloads</h3>
                </div>
            </div>
            <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                {trendingSoftware.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg p-1.5 flex items-center justify-center">
                            <img src={item.iconUrl} alt={`${item.name} logo`} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                            <p className="text-gray-500 text-xs">{item.category}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-green-600 text-sm">{item.downloads}</p>
                            <p className="text-gray-500 text-xs">Downloads</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrendingDownloads;
