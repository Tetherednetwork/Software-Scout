import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { dbService } from '../../services/dbService';
import type { Session, SavedDevice, Testimonial, FullUserProfile } from '../../types';
import { CloseIcon, PlusIcon, LaptopIcon, PencilIcon, TrashIcon, SuccessIcon, LogoutIcon } from '../ui/Icons';
import StarRating from '../ui/StarRating';
import { upsertUserTestimonial, getUserTestimonial } from '../../services/testimonialService';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session | null;
    userProfile: FullUserProfile | null;
    onProfileUpdate: (profile: FullUserProfile) => void;
    userDevices: SavedDevice[];
    onDevicesUpdate: (newDevices: SavedDevice[]) => void;
    userTestimonial: Testimonial | null;
    onTestimonialUpdate: (newTestimonial: Testimonial | null) => void;
}

const avatars = ['/images/monks_1.png', '/images/monks_2.png', '/images/monks_3.png', '/images/boy.png', '/images/girl.png', '/images/rabbit.png', '/images/dog.png', '/images/dinosaur.png'];

// Default empty state for the device form
const emptyDevice: Omit<SavedDevice, 'id' | 'created_at' | 'updated_at'> = {
    name: '', brand: '', model: '', serial_number: '', os_family: 'Windows', os_version: '11', type: 'laptop'
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, session, userProfile, onProfileUpdate, userDevices, onDevicesUpdate, userTestimonial, onTestimonialUpdate }) => {
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [username, setUsername] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Testimonial state
    const [testimonialContent, setTestimonialContent] = useState('');
    const [testimonialRating, setTestimonialRating] = useState(0);
    const [isSavingTestimonial, setIsSavingTestimonial] = useState(false);

    // State for device management
    const [isDeviceFormOpen, setIsDeviceFormOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Partial<SavedDevice> | null>(null);
    const [isSavingDevice, setIsSavingDevice] = useState(false);

    // Granular error and success states
    const [profileError, setProfileError] = useState('');
    const [deviceError, setDeviceError] = useState('');
    const [testimonialError, setTestimonialError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (session && isOpen) {
            setUsername(userProfile?.username || '');
            setSelectedAvatar(userProfile?.custom_avatar_url || userProfile?.avatar_url || '');
            const fetchTestimonial = async () => {
                const existing = await getUserTestimonial(session.user.id);
                onTestimonialUpdate(existing);
                if (existing) {
                    setTestimonialContent(existing.content);
                    setTestimonialRating(existing.rating);
                }
            };
            fetchTestimonial();
        }
    }, [session, isOpen, userProfile, onTestimonialUpdate]);

    useEffect(() => {
        if (userTestimonial) {
            setTestimonialContent(userTestimonial.content);
            setTestimonialRating(userTestimonial.rating);
        }
    }, [userTestimonial]);

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
        setDeviceError('');
    };

    const handleProfileSave = async () => {
        if (!session || !userProfile) return;

        setProfileError('');
        setSuccessMessage('');

        const trimmedUsername = username.trim();
        const usernameChanged = trimmedUsername !== (userProfile.username || '').trim();
        const avatarChanged = selectedAvatar !== (userProfile.custom_avatar_url || userProfile.avatar_url);

        if (!usernameChanged && !avatarChanged) {
            return; // Nothing to save. Exit early.
        }

        setIsSavingProfile(true);

        try {
            if (!trimmedUsername) {
                throw new Error("Nickname cannot be empty.");
            }

            // Prepare updates for the 'profiles' table
            const profileUpdates: { username?: string; custom_avatar_url?: string } = {};
            if (usernameChanged) profileUpdates.username = trimmedUsername;
            if (avatarChanged) profileUpdates.custom_avatar_url = selectedAvatar;

            const { data: updatedProfile, error: profileError } = await authService.updateUserProfile(session.user.id, profileUpdates);

            if (profileError) {
                if (profileError.message.includes('duplicate key value violates unique constraint')) {
                    throw new Error(`Nickname "${trimmedUsername}" is already taken.`);
                }
                throw profileError;
            }

            if (!updatedProfile) {
                throw new Error("Profile update failed, no data returned.");
            }

            // Update local state and show success
            onProfileUpdate(updatedProfile as FullUserProfile);
            setSuccessMessage('Profile saved successfully!');

        } catch (err: any) {
            setProfileError(err.message);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleDeviceSave = async (deviceData: Partial<SavedDevice>) => {
        if (!session) return;
        setIsSavingDevice(true);
        setDeviceError('');
        setSuccessMessage('');

        try {
            // Name uniqueness locally check
            const { data: existingDevices } = await dbService.getUserDevices(session.user.id);
            if (existingDevices && existingDevices.some((d: SavedDevice) => d.name === deviceData.name && d.id !== deviceData.id)) {
                throw new Error('You already have a device with this name. Please choose a unique name.');
            }

            if (deviceData.id) {
                const { data, error: updateError } = await dbService.updateDevice(session.user.id, { ...deviceData, id: deviceData.id } as any);
                if (updateError) throw updateError;
                onDevicesUpdate(userDevices.map(d => d.id === data!.id ? data as SavedDevice : d));
                setSuccessMessage('Device updated successfully!');
            } else {
                const { data, error: insertError } = await dbService.addDevice(session.user.id, deviceData as any);
                if (insertError) throw insertError;
                onDevicesUpdate([...userDevices, data as SavedDevice]);
                setSuccessMessage('Device added successfully!');
            }
            resetForm();
        } catch (err: any) {
            setDeviceError(err.message);
        } finally {
            setIsSavingDevice(false);
        }
    };

    const handleDeviceDelete = async (deviceId: string) => {
        if (!session || !window.confirm("Are you sure you want to delete this device?")) return;
        setDeviceError('');
        setSuccessMessage('');

        const { error } = await dbService.deleteDevice(session.user.id, deviceId);

        if (error) {
            setDeviceError(error.message);
        } else {
            onDevicesUpdate(userDevices.filter(d => d.id !== deviceId));
            setSuccessMessage('Device deleted successfully!');
        }
    };

    const handleTestimonialSave = async () => {
        if (!session) {
            setTestimonialError("You must be logged in to leave feedback.");
            return;
        }
        if (!testimonialRating || !testimonialContent.trim()) {
            setTestimonialError("Please provide a rating and a comment for your feedback.");
            return;
        }
        setIsSavingTestimonial(true);
        setTestimonialError('');
        setSuccessMessage('');
        try {
            const newTestimonial = await upsertUserTestimonial({
                userId: session.user.id,
                rating: testimonialRating,
                content: testimonialContent,
            });
            onTestimonialUpdate(newTestimonial);
            setSuccessMessage('Your feedback has been submitted for review!');
        } catch (err: any) {
            setTestimonialError(err.message || 'Failed to save feedback.');
        } finally {
            setIsSavingTestimonial(false);
        }
    };

    const handleSessionRefresh = async () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setSuccessMessage("Session permissions are up to date.");
        }, 500);
    };

    const handleLogout = async () => {
        const { error } = await authService.signOut();
        if (error) {
            console.error("Logout failed:", error);
            alert('Logout failed. Please try again.');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-left relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h2>
                    <p className="text-sm text-gray-500 dark:text-white">Manage your profile, devices, and feedback.</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* --- Profile Section --- */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Public Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="grid grid-cols-4 gap-4 flex-1">
                                {avatars.map(url => (
                                    <button key={url} onClick={() => setSelectedAvatar(url)} className={`aspect-square rounded-full overflow-hidden focus:outline-none focus:ring-4 focus:ring-green-500 transition-all ${selectedAvatar === url ? 'ring-4 ring-green-500 scale-110' : 'ring-2 ring-transparent hover:ring-green-300'}`}>
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Nickname</label>
                                    <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
                                </div>
                                <button onClick={handleProfileSave} disabled={isSavingProfile} className="w-full px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300">
                                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                                </button>
                                {profileError && <p className="text-sm text-red-500 text-center mt-2">{profileError}</p>}
                            </div>
                        </div>
                    </section>

                    {/* --- Testimonial Section --- */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Your Feedback</h3>
                        <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                            {userTestimonial && <p className="text-xs text-center font-semibold uppercase tracking-wider p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">Status: {userTestimonial.status.toUpperCase()}</p>}
                            <StarRating rating={testimonialRating} setRating={setTestimonialRating} size="lg" />
                            <textarea
                                value={testimonialContent}
                                onChange={(e) => setTestimonialContent(e.target.value)}
                                placeholder="Share your experience with SoftMonk..."
                                rows={3}
                                className="w-full bg-white dark:bg-gray-700 p-2 rounded-md focus:ring-green-500 focus:border-green-500"
                            />
                            <div className="text-right">
                                <button onClick={handleTestimonialSave} disabled={isSavingTestimonial} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300">
                                    {isSavingTestimonial ? 'Saving...' : (userTestimonial ? 'Update Feedback' : 'Submit Feedback')}
                                </button>
                            </div>
                            {testimonialError && <p className="text-sm text-red-500 text-center mt-2">{testimonialError}</p>}
                        </div>
                    </section>

                    {/* --- My Devices Section --- */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">My Devices</h3>
                            {!isDeviceFormOpen && (
                                <button onClick={() => { setIsDeviceFormOpen(true); setEditingDevice(emptyDevice); }} className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-semibold rounded-md hover:bg-green-200 dark:hover:bg-green-900">
                                    <PlusIcon /> Add New Device
                                </button>
                            )}
                        </div>

                        {isDeviceFormOpen && editingDevice && (
                            <DeviceForm
                                device={editingDevice}
                                onSave={handleDeviceSave}
                                onCancel={resetForm}
                                isLoading={isSavingDevice}
                                formError={deviceError}
                            />
                        )}

                        <div className="space-y-2 mt-4">
                            {userDevices.length > 0 ? userDevices.map(device => (
                                <div key={device.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <LaptopIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">{device.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-white">{device.brand} {device.model} &bull; {device.os_family} {device.os_version}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setEditingDevice(device); setIsDeviceFormOpen(true); setDeviceError(''); }} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <PencilIcon />
                                        </button>
                                        <button onClick={() => handleDeviceDelete(device.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                !isDeviceFormOpen && <p className="text-sm text-gray-500 dark:text-white text-center py-4">No devices saved yet. Add a device to speed up driver searches!</p>
                            )}
                        </div>
                    </section>

                    {successMessage && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm flex items-center gap-2" role="alert">
                            <SuccessIcon className="h-5 w-5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Account Actions</h3>
                        <div className="flex items-center gap-4">
                            <button onClick={handleSessionRefresh} disabled={isRefreshing} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">
                                {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
                            </button>
                            <p className="text-xs text-gray-500 dark:text-white">If your user role has changed, click here to update your session permissions.</p>
                        </div>
                    </section>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-b-2xl">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                        aria-label="Sign out of your account"
                    >
                        <LogoutIcon />
                        <span>Sign Out</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};


const DeviceForm: React.FC<{ device: Partial<SavedDevice>, onSave: (device: Partial<SavedDevice>) => void, onCancel: () => void, isLoading: boolean, formError: string }> = ({ device, onSave, onCancel, isLoading, formError }) => {
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
            <h4 className="font-semibold text-md text-gray-800 dark:text-white">{device.id ? 'Edit Device' : 'Add New Device'}</h4>
            <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-600 dark:text-white mb-1">Device Name</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., My Gaming PC" required className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="brand" className="block text-xs font-medium text-gray-600 dark:text-white mb-1">Brand</label>
                    <input type="text" name="brand" value={formData.brand || ''} onChange={handleChange} placeholder="e.g., Dell" required className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                    <label htmlFor="model" className="block text-xs font-medium text-gray-600 dark:text-white mb-1">Model</label>
                    <input type="text" name="model" value={formData.model || ''} onChange={handleChange} placeholder="e.g., XPS 15 9520" required className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="serial_number" className="block text-xs font-medium text-gray-600 dark:text-white mb-1">Serial Number (Optional)</label>
                    <input type="text" name="serial_number" value={formData.serial_number || ''} onChange={handleChange} className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                    <label htmlFor="os_family" className="block text-xs font-medium text-gray-600 dark:text-white mb-1">Operating System</label>
                    <select name="os_family" value={formData.os_family || 'Windows'} onChange={handleChange} required className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500">
                        <option value="Windows">Windows</option>
                        <option value="macOS">macOS</option>
                        <option value="Linux">Linux</option>
                        <option value="Android">Android</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>

            {/* OS Version - Can be optional or text input */}
            <div>
                <label htmlFor="os_version" className="block text-xs font-medium text-gray-600 dark:text-white mb-1">OS Version (e.g. 11, 22H2, 14.0)</label>
                <input type="text" name="os_version" value={formData.os_version || ''} onChange={handleChange} className="w-full bg-white dark:bg-gray-700 text-sm p-2 rounded-md focus:ring-green-500 focus:border-green-500" />
            </div>

            {formError && <p className="text-sm text-red-500 text-center mt-2">{formError}</p>}

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300">{isLoading ? 'Saving...' : 'Save Device'}</button>
            </div>
        </form>
    );
};
