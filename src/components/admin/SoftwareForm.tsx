import React, { useState, useEffect } from 'react';
import type { VerifiedSoftware } from '../../types';
import { CloseIcon } from '../ui/Icons';

interface SoftwareFormProps {
    initialData?: Partial<VerifiedSoftware> | null;
    onSave: (software: Partial<VerifiedSoftware>) => Promise<void>;
    onCancel: () => void;
}

const SoftwareForm: React.FC<SoftwareFormProps> = ({ initialData, onSave, onCancel }) => {
    const [software, setSoftware] = useState<Partial<VerifiedSoftware>>(initialData || {});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setSoftware(initialData || {});
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSoftware(prev => ({ ...prev, [name]: value === '' ? null : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!software.name || !software.homepage_url) {
            setError('Name and Homepage URL are required.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await onSave(software);
        } catch (err: any) {
            setError(err.message || 'Failed to save software.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{software.id ? 'Edit Software' : 'Add New Software'}</h2>
                    <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                        <input type="text" name="name" value={software.name || ''} onChange={handleChange} required className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                        <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor</label>
                        <input type="text" name="vendor" value={software.vendor || ''} onChange={handleChange} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                        <label htmlFor="homepage_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Homepage URL *</label>
                        <input type="url" name="homepage_url" value={software.homepage_url || ''} onChange={handleChange} required className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea name="description" value={software.description || ''} onChange={handleChange} rows={3} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="windows_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Windows URL</label>
                            <input type="url" name="windows_url" value={software.windows_url || ''} onChange={handleChange} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label htmlFor="macos_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">macOS URL</label>
                            <input type="url" name="macos_url" value={software.macos_url || ''} onChange={handleChange} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                            <label htmlFor="linux_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Linux URL</label>
                            <input type="url" name="linux_url" value={software.linux_url || ''} onChange={handleChange} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                        </div>
                         <div>
                            <label htmlFor="android_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Android URL</label>
                            <input type="url" name="android_url" value={software.android_url || ''} onChange={handleChange} className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md focus:ring-2 focus:ring-green-500" />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300">
                            {isLoading ? 'Saving...' : 'Save Software'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SoftwareForm;
