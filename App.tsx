
import React, { useState, useEffect, useRef } from 'react';
import type { DownloadHistoryItem, SafetyActionId, Session, UserDevice } from './types';
import ChatWindow from './components/ChatWindow';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import SocialProof from './components/SocialProof';
import CoreFeatures from './components/CoreFeatures';
import CookiePolicyModal from './components/CookiePolicyModal';
import GdprModal from './components/GdprModal';
import DownloadHistoryModal from './components/DownloadHistoryModal';
import TrendingTopics from './components/TrendingTopics';
import QuickSafetyActions from './components/QuickSafetyActions';
import TopAntivirus from './components/TopAntivirus';
import SafetyActionModal from './components/SafetyActionModal';
import { FileIcon, InformationIcon } from './components/Icons';
import OnboardingTour from './components/OnboardingTour';
import LoginModal from './components/LoginModal';
// FIX: Changed to a named import for ProfileModal to match its export.
import { ProfileModal } from './components/ProfileModal';
import { supabase } from './services/supabase';
import AboutPage from './components/AboutPage';
import ForumPage from './components/ForumPage';
import BlogPage from './BlogPage';
import BlogPostPage from './components/BlogPostPage';
import FileVerifier from './components/FileVerifier';
import UserInfoPanel from './components/UserInfoPanel';

// Define the interface for the exposed ChatWindow methods
export interface ChatWindowRef {
  sendMessage: (message: string) => void;
}

type Page = 'home' | 'about' | 'forum' | 'blogs' | 'file-verifier' | 'blog-post';

const AppContent: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isCookiePolicyModalOpen, setIsCookiePolicyModalOpen] = useState(false);
  const [isGdprModalOpen, setIsGdprModalOpen] = useState(false);
  const [isDownloadHistoryModalOpen, setIsDownloadHistoryModalOpen] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [safetyModalAction, setSafetyModalAction] = useState<SafetyActionId | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') as 'light' | 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
  });

  const chatWindowRef = useRef<ChatWindowRef>(null);
  
  const onboardingKey = session ? `onboarding_complete_${session.user.id}` : 'onboarding_complete_guest';

  // Handle authentication state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN') {
        setIsLoginModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if onboarding tour should run
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(onboardingKey);
    if (!hasCompletedTour && window.innerWidth >= 1024) {
      setTimeout(() => setIsTourOpen(true), 500);
    }
  }, [onboardingKey, session]);

  const startTour = () => {
    setTimeout(() => setIsTourOpen(true), 100);
  };
  
  const handleTourClose = () => {
      setIsTourOpen(false);
      localStorage.setItem(onboardingKey, 'true');
  };

  // Effect to apply theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Load download history and user devices from Supabase
  useEffect(() => {
    if (!session) {
        setDownloadHistory([]); // Clear history if logged out
        setUserDevices([]);
        return;
    }

    const fetchData = async () => {
        // Fetch download history
        const { data: historyData, error: historyError } = await supabase
            .from('download_history')
            .select('*')
            .eq('user_id', session.user.id)
            .order('timestamp', { ascending: false });

        if (historyError) {
            console.error("Error fetching download history:", historyError);
        } else {
            const history = historyData.map(item => ({...item, timestamp: item.timestamp ?? new Date().toISOString() })) as DownloadHistoryItem[]
            setDownloadHistory(history);
        }
        
        // Fetch user devices
        const { data: devicesData, error: devicesError } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true });
        
        if (devicesError) {
            console.error("Error fetching user devices:", devicesError);
        } else {
            setUserDevices(devicesData as UserDevice[]);
        }
    };

    fetchData();
  }, [session]);

  const openPrivacyModal = () => setIsPrivacyModalOpen(true);
  const closePrivacyModal = () => setIsPrivacyModalOpen(false);

  const openCookiePolicyModal = () => setIsCookiePolicyModalOpen(true);
  const closeCookiePolicyModal = () => setIsCookiePolicyModalOpen(false);

  const openGdprModal = () => setIsGdprModalOpen(true);
  const closeGdprModal = () => setIsGdprModalOpen(false);

  const openDownloadHistoryModal = () => {
    if (!session) {
      alert("Please sign in to view your download history.");
      setIsLoginModalOpen(true);
      return;
    }
    setIsDownloadHistoryModalOpen(true);
  };
  const closeDownloadHistoryModal = () => setIsDownloadHistoryModalOpen(false);

  const openSafetyModal = (action: SafetyActionId) => {
    setSafetyModalAction(action);
    setIsSafetyModalOpen(true);
  };

  const closeSafetyModal = () => {
      setIsSafetyModalOpen(false);
      setSafetyModalAction(null);
  };


  const handleDownload = async (item: Omit<DownloadHistoryItem, 'id' | 'timestamp' | 'status'>) => {
     if (!session) return; // Downloads are not tracked for guests

    const newItem: Omit<DownloadHistoryItem, 'id'> = {
        ...item,
        timestamp: new Date().toISOString(),
        user_id: session.user.id
    };

    const { data, error } = await supabase
        .from('download_history')
        .insert(newItem)
        .select()
        .single();
    
    if (error) {
        console.error("Error saving download history:", error);
    } else if (data) {
        // Add to the top of the list and prevent duplicates based on URL
        setDownloadHistory(prev => [data as DownloadHistoryItem, ...prev.filter(p => p.url !== newItem.url)]);
    }
  };

  const handleUpdateDownloadStatus = async (itemId: number | string, status: 'verified' | 'failed') => {
    if (!session) return;

    const { data, error } = await supabase
      .from('download_history')
      .update({ status })
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) {
        console.error("Error updating download status:", error);
    } else {
        setDownloadHistory(prev => 
            prev.map(item => 
                item.id === itemId ? { ...item, status: data.status } : item
            )
        );
    }
  };

  const handleTopicClick = (topic: string) => {
    if (currentPage !== 'home') {
        setCurrentPage('home');
    }
    setTimeout(() => {
      chatWindowRef.current?.sendMessage(topic);
    }, 100); // A small delay to ensure the chat window is rendered
  };
  
  const handleDevicesUpdate = (newDevices: UserDevice[]) => {
      setUserDevices(newDevices);
  }

  const handleNavClick = (page: Page) => {
    setSelectedPostId(null);
    setCurrentPage(page);
  };
  
  const handleSelectPost = (postId: string) => {
      setSelectedPostId(postId);
      setCurrentPage('blog-post');
  };

  const renderPage = () => {
    switch (currentPage) {
        case 'about':
            return <AboutPage />;
        case 'forum':
            return <ForumPage />;
        case 'blogs':
            // FIX: Removed unused `onCreatePost` prop from BlogPage component.
            return <BlogPage onSelectPost={handleSelectPost} />;
        case 'blog-post':
            // FIX: Removed unused `onCreatePost` prop from BlogPage component.
            return selectedPostId ? <BlogPostPage postId={selectedPostId} onBack={() => handleNavClick('blogs')} /> : <BlogPage onSelectPost={handleSelectPost} />;
        case 'file-verifier':
            return <FileVerifier />;
        default:
            return null; // Home page content is rendered outside this switch
    }
  };


  return (
    <div className={`font-sans flex flex-col ${currentPage === 'home' ? 'h-screen' : 'min-h-screen'}`}>
      <Header 
        session={session}
        currentPage={currentPage}
        onNavClick={handleNavClick}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onProfileClick={() => setIsProfileModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        onStartTour={startTour}
        onOpenDownloadHistoryModal={openDownloadHistoryModal}
      />
      
      <main className="flex-1 flex flex-col min-h-0">
        {currentPage === 'home' ? (
             <div className="w-full max-w-screen-2xl mx-auto lg:grid lg:grid-cols-[288px_1fr_288px] gap-6 px-4 flex-1 min-h-0">
        
                {/* Left Column */}
                <aside className="hidden lg:flex flex-col gap-4 py-4 overflow-y-auto">
                <div className="flex-1 flex flex-col justify-center gap-4 min-h-0">
                    <TrendingTopics onTopicClick={handleTopicClick} />
                    <TopAntivirus onTopicClick={handleTopicClick} />
                </div>
                </aside>

                {/* Center Column */}
                <div className="flex flex-col min-h-0 pt-4">
                    <CoreFeatures />
                    <div className="w-full flex-1 flex flex-col min-h-0">
                      <ChatWindow 
                          ref={chatWindowRef}
                          onDownload={handleDownload}
                          session={session}
                          onLoginRequest={() => setIsLoginModalOpen(true)}
                      />
                    </div>
                    <Footer 
                        onPrivacyClick={openPrivacyModal} 
                        onCookiePolicyClick={openCookiePolicyModal}
                        onGdprClick={openGdprModal}
                    />
                </div>

                {/* Right Column */}
                <aside className="hidden lg:flex flex-col gap-4 py-4 overflow-y-auto">
                    <UserInfoPanel 
                        session={session} 
                        onProfileClick={() => setIsProfileModalOpen(true)}
                    />
                    <div className="flex-1 flex flex-col justify-center gap-4 min-h-0">
                        <div data-tour-id="safety-actions">
                            <QuickSafetyActions onActionClick={openSafetyModal} />
                        </div>
                    </div>
                    <div>
                        <SocialProof />
                    </div>
                </aside>
            </div>
        ) : (
            <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {renderPage()}
                </div>
            </div>
        )}
      </main>
      
      {currentPage !== 'home' && <Footer 
        onPrivacyClick={openPrivacyModal} 
        onCookiePolicyClick={openCookiePolicyModal}
        onGdprClick={openGdprModal}
      />}

      <OnboardingTour isOpen={isTourOpen} onClose={handleTourClose} />
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}
      {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} session={session} userDevices={userDevices} onDevicesUpdate={handleDevicesUpdate} />}
      {isPrivacyModalOpen && <PrivacyPolicyModal onClose={closePrivacyModal} />}
      {isCookiePolicyModalOpen && <CookiePolicyModal onClose={closeCookiePolicyModal} />}
      {isGdprModalOpen && <GdprModal onClose={closeGdprModal} />}
      {isDownloadHistoryModalOpen && <DownloadHistoryModal history={downloadHistory} onClose={closeDownloadHistoryModal} onUpdateStatus={handleUpdateDownloadStatus} />}
      {isSafetyModalOpen && safetyModalAction && <SafetyActionModal actionType={safetyModalAction} onClose={closeSafetyModal} />}

    </div>
  );
}


const App: React.FC = () => (
    <AppContent />
);

export default App;