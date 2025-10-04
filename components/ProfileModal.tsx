import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Session, UserDevice } from '../types';
import { CloseIcon, PlusIcon, LaptopIcon, PencilIcon, TrashIcon, CheckCircleIcon } from './Icons';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session | null;
    userDevices: UserDevice[];
    onDevicesUpdate: (newDevices: UserDevice[]) => void;
}

const avatars = ['/images/monks_1.png', '/images/monks_2.png', '/images/monks_3.png', '/images/boy.png', '/images/girl.png', '/images/rabbit.png', '/images/logo.png'];

// Default empty state for the device form
const emptyDevice: Omit<UserDevice, 'id' | 'user_id' | 'created_at'> = {
    device_name: '', manufacturer: '', model: '', serial_number: '', os: 'Windows 11'
};

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, session, userDevices, onDevicesUpdate }) => {
    const [selectedAvatar, setSelectedAvatar] = useState(session?.user?.user_metadata?.avatar_url || '');
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);
    
    // State for device management
    const [isDeviceFormOpen, setIsDeviceFormOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Partial<UserDevice> | null>(null);
    const [isSavingDevice, setIsSavingDevice] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Effect to auto-clear the success message after a few seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const resetForm = () => {
        setIsDeviceFormOpen(false);
        setEditingDevice(null);
        setError('');
    };

    const handleAvatarSave = async () => {
        if (!session || selectedAvatar === session.user.user_metadata.avatar_url) return;
        setIsSavingAvatar(true);
        setError('');
        setSuccessMessage('');
        const { error } = await supabase.auth.updateUser({ data: { avatar_url: selectedAvatar } });
        setIsSavingAvatar(false);
        if (error) {
            setError(error.message);
        } else {
            setSuccessMessage('Avatar saved successfully!');
        }
    };

    const handleDeviceSave = async (deviceData: Partial<UserDevice>) => {
        if (!session) return;
        setIsSavingDevice(true);
        setError('');
        setSuccessMessage('');

        // --- START: DUPLICATE CHECK LOGIC ---
        // 1. Check for duplicate device name for the current user
        const { data: nameCheck, error: nameError } = await supabase
            .from('user_devices')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('device_name', deviceData.device_name)
            .neq('id', deviceData.id || 0); // Exclude the current device if editing

        if (nameError) {
            setError(nameError.message);
            setIsSavingDevice(false);
            return;
        }
        if (nameCheck && nameCheck.length > 0) {
            setError('You already have a device with this name. Please choose a unique name.');
            setIsSavingDevice(false);
            return;
        }

        // 2. Check for duplicate serial number globally (if provided and not empty)
        if (deviceData.serial_number && deviceData.serial_number.trim() !== '') {
            const { data: serialCheck, error: serialError } = await supabase
                .from('user_devices')
                .select('id')
                .eq('serial_number', deviceData.serial_number.trim())
                .neq('id', deviceData.id || 0); // Exclude the current device if editing

            if (serialError) {
                setError(serialError.message);
                setIsSavingDevice(false);
                return;
            }
            if (serialCheck && serialCheck.length > 0) {
                setError('This serial number is already registered to another device.');
                setIsSavingDevice(false);
                return;
            }
        }
        // --- END: DUPLICATE CHECK LOGIC ---
        
        const dataToSave = {
            ...deviceData,
            user_id: session.user.id,
            // Ensure serial number is trimmed or null
            serial_number: deviceData.serial_number?.trim() || undefined
        };

        if (deviceData.id) { // Editing existing device
            const { data, error: updateError } = await supabase.from('user_devices').update(dataToSave).eq('id', deviceData.id).select().single();
            if (updateError) {
                setError(updateError.message);
            } else {
                onDevicesUpdate(userDevices.map(d => d.id === data.id ? data : d));
                resetForm();
                setSuccessMessage('Device updated successfully!');
            }
        } else { // Adding new device
            const { data, error: insertError } = await supabase.from('user_devices').insert(dataToSave).select().single();
            if (insertError) {
                setError(insertError.message);
            } else {
                onDevicesUpdate([...userDevices, data]);
                resetForm();
                setSuccessMessage('Device added successfully!');
            }
        }
        setIsSavingDevice(false);
    };
    
    const handleDeviceDelete = async (deviceId: number) => {
        if (!session || !window.confirm("Are you sure you want to delete this device?")) return;
        setError('');
        setSuccessMessage('');
        const { error } = await supabase.from('user_devices').delete().eq('id', deviceId);
        if (error) {
            setError(error.message);
        } else {
            onDevicesUpdate(userDevices.filter(d => d.id !== deviceId));
            setSuccessMessage('Device deleted successfully!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your avatar and saved devices.</p>
                     <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* --- Avatar Section --- */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Choose Your Avatar</h3>
                         <div className="flex items-center gap-6">
                            <div className="grid grid-cols-4 gap-4 flex-1">
                                {avatars.map(url => (
                                    <button key={url} onClick={() => setSelectedAvatar(url)} className={`aspect-square rounded-full overflow-hidden focus:outline-none focus:ring-4 focus:ring-green-500 transition-all ${selectedAvatar === url ? 'ring-4 ring-green-500 scale-110' : 'ring-2 ring-transparent hover:ring-green-300'}`}>
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleAvatarSave} disabled={isSavingAvatar} className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300">
                                {isSavingAvatar ? 'Saving...' : 'Save Avatar'}
                            </button>
                        </div>
                    </section>
                    
                    {/* --- My Devices Section --- */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">My Devices</h3>
                            {!isDeviceFormOpen && (
                                <button onClick={() => { setIsDeviceFormOpen(true); setEditingDevice(emptyDevice); }} className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-semibold rounded-md hover:bg-green-200 dark:hover:bg-green-900">
                                    <PlusIcon /> Add New Device
                                </button>
                            )}
                        </div>
                        
                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm flex items-center gap-2" role="alert">
                                <CheckCircleIcon className="h-5 w-5" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {isDeviceFormOpen && editingDevice && (
                            <DeviceForm 
                                device={editingDevice} 
                                onSave={handleDeviceSave} 
                                onCancel={resetForm} 
                                isLoading={isSavingDevice} 
                                formError={error}
                            />
                        )}

                        <div className="space-y-2 mt-4">
                            {userDevices.length > 0 ? userDevices.map(device => (
                                <div key={device.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <LaptopIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{device.device_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{device.manufacturer} {device.model} &bull; {device.os}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setEditingDevice(device); setIsDeviceFormOpen(true); setError(''); }} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <PencilIcon />
                                        </button>
                                        <button onClick={() => handleDeviceDelete(device.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                !isDeviceFormOpen && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No devices saved yet. Add a device to speed up driver searches!</p>
                            )}
                        </div>
                    </section>
                    
                    {error && !isDeviceFormOpen && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
                </div>

                 <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-right rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};


const DeviceForm: React.FC<{device: Partial<UserDevice>, onSave: (device: Partial<UserDevice>) => void, onCancel: () => void, isLoading: boolean, formError: string}> = ({ device, onSave, onCancel, isLoading, formError }) => {
    const [formData, setFormData] = useState(device);

    useEffect(() => {
        setFormData(device);
    }, [device]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }
    
    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <h4 className="font-semibold text-md text-gray-800 dark:text-gray-200">{device.id ? 'Edit Device' : 'Add New Device'}</h4>
            <div>
                <label htmlFor="device_name" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Device Name</label>
                <input type="text" name="device_name" value={formData.device_name || ''} onChange={handleChange} placeholder="e.g., My Gaming PC" required className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="manufacturer" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Manufacturer</label>
                    <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} placeholder="e.g., Dell" required className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                    <label htmlFor="model" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Model</label>
                    <input type="text" name="model" value={formData.model || ''} onChange={handleChange} placeholder="e.g., XPS 15 9520" required className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="serial_number" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Serial Number (Optional)</label>
                    <input type="text" name="serial_number" value={formData.serial_number || ''} onChange={handleChange} className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                    <label htmlFor="os" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Operating System</label>
                    <select name="os" value={formData.os || ''} onChange={handleChange} required className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500">
                        <option>Windows 11</option>
                        <option>Windows 10 (64-bit)</option>
                        <option>Windows 10 (32-bit)</option>
                        <option>Windows 8.1</option>
                        <option>Windows 7</option>
                        <option>macOS Sonoma</option>
                        <option>macOS Ventura</option>
                        <option>macOS Monterey</option>
                        <option>Linux (Debian-based)</option>
                        <option>Linux (Arch-based)</option>
                        <option>Linux (Fedora-based)</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>

            {formError && <p className="text-sm text-red-500 text-center">{formError}</p>}

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300">{isLoading ? 'Saving...' : 'Save Device'}</button>
            </div>
        </form>
    );
};

export default ProfileModal;