import React, { useState, useCallback } from 'react';
import { DocumentCheckIcon, SuccessIcon, CloseCircleIcon } from '../components/ui/Icons';
import TrustpilotWidget from '../components/ui/TrustpilotWidget';

const FileVerifierPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [calculatedHash, setCalculatedHash] = useState<string>('');
    const [expectedHash, setExpectedHash] = useState<string>('');
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

    const calculateSHA256 = async (fileToHash: File): Promise<string> => {
        const buffer = await fileToHash.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    const handleFileChange = useCallback(async (selectedFile: File | null) => {
        if (!selectedFile) return;

        // Reset state for new file
        setFile(selectedFile);
        setCalculatedHash('');
        setError('');
        setIsCalculating(true);

        try {
            const hash = await calculateSHA256(selectedFile);
            setCalculatedHash(hash);
        } catch (err) {
            console.error("Error calculating hash:", err);
            setError("Could not calculate the file's hash. The file might be too large or unreadable.");
        } finally {
            setIsCalculating(false);
        }
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            handleFileChange(event.dataTransfer.files[0]);
            event.dataTransfer.clearData();
        }
    }, [handleFileChange]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };
    
    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
    };


    const getVerificationStatus = () => {
        if (!calculatedHash || !expectedHash.trim() || expectedHash.trim().length !== 64) {
            return 'pending';
        }
        if (calculatedHash.toLowerCase() === expectedHash.trim().toLowerCase()) {
            return 'success';
        }
        return 'fail';
    };

    const status = getVerificationStatus();
    const isVerified = status === 'success';
    const isFailed = status === 'fail';

    return (
        <div className="p-6 sm:p-10">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">SoftMonk File Verifier</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Verify that your downloaded file is authentic and hasn't been tampered with. Your file is processed locally in your browser and is never uploaded.
                </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-6">
                {/* File Drop Zone */}
                <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${isDragOver ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                >
                    <div className="flex flex-col items-center justify-center">
                        <DocumentCheckIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Drag & Drop your file here</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">or</p>
                        <label htmlFor="file-upload" className="mt-2 cursor-pointer font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                            <span>Select a file from your computer</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
                        </label>
                    </div>
                </div>

                {file && (
                     <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected File: <span className="font-bold text-gray-900 dark:text-white">{file.name}</span></p>
                     </div>
                )}


                {/* Hash Inputs */}
                <div>
                    <label htmlFor="expected-hash" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected SHA256 Hash</label>
                    <input
                        id="expected-hash"
                        type="text"
                        value={expectedHash}
                        onChange={(e) => setExpectedHash(e.target.value)}
                        className="w-full font-mono text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
                        placeholder="Paste the hash provided by the AI here..."
                    />
                </div>
                 <div>
                    <label htmlFor="calculated-hash" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Calculated File Hash</label>
                    <div className="w-full font-mono text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg p-3 min-h-[44px]">
                       {isCalculating ? (
                            <span className="italic">Calculating hash...</span>
                       ) : (
                           <span className="break-all">{calculatedHash || "Select a file to calculate its hash."}</span>
                       )}
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                {/* Verification Result */}
                {status !== 'pending' && (
                    <div className={`p-4 rounded-lg flex items-center gap-4 ${isVerified ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700' : ''} ${isFailed ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700' : ''}`}>
                        {isVerified && <SuccessIcon className="h-8 w-8 text-green-600 dark:text-green-400 flex-shrink-0" />}
                        {isFailed && <CloseCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400 flex-shrink-0" />}
                        <div>
                             <h3 className={`text-lg font-bold ${isVerified ? 'text-green-800 dark:text-green-200' : ''} ${isFailed ? 'text-red-800 dark:text-red-200' : ''}`}>
                                {isVerified ? 'Verification Successful' : 'Verification Failed'}
                            </h3>
                             <p className={`text-sm ${isVerified ? 'text-green-700 dark:text-green-300' : ''} ${isFailed ? 'text-red-700 dark:text-red-300' : ''}`}>
                                {isVerified ? 'The file hash matches the expected hash. The file is authentic.' : 'The file hash does NOT match. Do NOT open this file, it may have been tampered with.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <TrustpilotWidget />
            </div>
        </div>
    );
};

export default FileVerifierPage;
