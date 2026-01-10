
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { DownloadHistoryItem, SafetyActionId, Session, UserDevice, Testimonial, FullUserProfile, Page } from './types';
import ChatWindow from './components/chat/ChatWindow';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PrivacyPolicyModal from './components/modals/PrivacyPolicyModal';
import SocialProof from './components/home/SocialProof';
import CoreFeatures from './components/home/CoreFeatures';
import CookiePolicyModal from './components/modals/CookiePolicyModal';
import GdprModal from './components/modals/GdprModal';
import DownloadHistoryModal from './components/modals/DownloadHistoryModal';
import TrendingTopics from './components/home/TrendingTopics';
import QuickSafetyActions from './components/home/QuickSafetyActions';
import TopAntivirus from './components/home/TopAntivirus';
import SafetyActionModal from './components/modals/SafetyActionModal';
import OnboardingTour from './components/tour/OnboardingTour';
import LoginModal from './components/modals/LoginModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { authService } from './services/authService';
import { dbService } from './services/dbService';
import { getBlogPostById } from './services/blogService';
import AboutPage from './pages/AboutPage';
import ForumPage from './pages/ForumPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ForumPostPage from './pages/ForumPostPage';
import FileVerifierPage from './pages/FileVerifierPage';
import { UserInfoPanel } from './components/home/UserInfoPanel';
// FIX: Changed import to be a named import as 'AdminPage' no longer has a default export.
import { AdminPage } from './pages/AdminPage';
import TestimonialSlider from './components/home/TestimonialSlider';
import FeedbackButton from './components/ui/FeedbackButton';
import Toast from './components/ui/Toast';
import PasswordResetModal from './components/modals/PasswordResetModal';
import AppLoader from './components/ui/AppLoader';
import CookieConsentBanner from './components/ui/CookieConsentBanner';


// Define the interface for the exposed ChatWindow methods
export interface ChatWindowRef {
  sendMessage: (message: string) => void;
}

const getPageAndIdFromPathname = (): { page: Page, id: string | null } => {
  const segments = window.location.pathname.split('/').filter(Boolean);

  const page = (segments[0] as Page) || 'home';
  const id = segments[1] || null;

  const validPages: Page[] = ['home', 'about', 'forum', 'blogs', 'file-verifier', 'blog-post', 'admin', 'forum-post'];

  if (validPages.includes(page)) {
    if ((page === 'blog-post' || page === 'forum-post') && id) {
      return { page, id };
    }
    return { page, id: null };
  }

  return { page: 'home', id: null };
};


const AppContent: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<FullUserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [userTestimonial, setUserTestimonial] = useState<Testimonial | null>(null);

  const [currentPage, setCurrentPage] = useState<Page>(() => getPageAndIdFromPathname().page);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(() => getPageAndIdFromPathname().page === 'blog-post' ? getPageAndIdFromPathname().id : null);
  const [selectedForumPostId, setSelectedForumPostId] = useState<number | null>(() => {
    const { page, id } = getPageAndIdFromPathname();
    return page === 'forum-post' && id ? parseInt(id, 10) : null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isCookiePolicyModalOpen, setIsCookiePolicyModalOpen] = useState(false);
  const [isGdprModalOpen, setIsGdprModalOpen] = useState(false);
  const [isDownloadHistoryModalOpen, setIsDownloadHistoryModalOpen] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([]);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [safetyModalAction, setSafetyModalAction] = useState<SafetyActionId | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showCookieBanner, setShowCookieBanner] = useState(false);
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

  const isAdmin = userProfile?.role === 'admin' || session?.user.email === 'folarin.gbenga@gmail.com';
  const isAdminPage = currentPage === 'admin';
  const onboardingKey = session ? `onboarding_complete_${session.user.id}` : 'onboarding_complete_guest';

  const handleLocationChange = useCallback(() => {
    const { page, id } = getPageAndIdFromPathname();
    setCurrentPage(page);
    if (page === 'blog-post' && id) {
      setSelectedPostId(id);
      setSelectedForumPostId(null);
    } else if (page === 'forum-post' && id) {
      setSelectedForumPostId(parseInt(id, 10));
      setSelectedPostId(null);
    } else {
      setSelectedPostId(null);
      setSelectedForumPostId(null);
    }
  }, []);

  // Check cookie consent on initial load
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowCookieBanner(true);
    }
  }, []);

  // Effect to handle routing from URL path
  useEffect(() => {
    window.addEventListener('popstate', handleLocationChange);
    // Initial check on load
    handleLocationChange();

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [handleLocationChange]);

  // Effect to handle scrolling to a specific comment from a notification link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const commentId = params.get('comment');
    if (commentId) {
      // A timeout gives the page content time to render before we try to scroll.
      setTimeout(() => {
        const element = document.getElementById(`comment-${commentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-post');
          setTimeout(() => {
            element.classList.remove('highlight-post');
          }, 2000); // Highlight duration
        }
      }, 500);
    }
  }, [currentPage, selectedForumPostId, selectedPostId]); // Rerun when page changes

  // Effect to handle auth state changes and initial session load.
  // This is the primary effect for determining if the app is ready to display.
  useEffect(() => {
    setIsInitializing(true);

    const unsubscribe = authService.onAuthStateChange((event, session) => {
      setSession(session);

      // Crucially, we stop initializing as soon as we get the first auth event.
      // This prevents the UI from getting stuck if profile fetching is slow.
      if (isInitializing) {
        setIsInitializing(false);
      }

      // Handle specific auth events
      if (event === 'SIGNED_IN') {
        setIsLoginModalOpen(false);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordModalOpen(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Effect to fetch the user's profile *whenever the session changes*.
  // This runs after the main initialization is complete.
  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        const { data: profile, error: profileError } = await authService.getUserProfile(session.user.id);

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          // If profile is missing (e.g. new Firebase user), we might want to create a default one or just return null
          setUserProfile(null);
        } else {
          setUserProfile(profile as FullUserProfile | null);
        }
      };
      fetchProfile();
    } else {
      // If there's no session, ensure the profile is cleared.
      setUserProfile(null);
    }
  }, [session]);

  // Check if onboarding tour should run
  useEffect(() => {
    // Don't run the tour while the app is still initializing
    if (isInitializing) return;

    const hasCompletedTour = localStorage.getItem(onboardingKey);
    if (!hasCompletedTour && window.innerWidth >= 1024) {
      setTimeout(() => setIsTourOpen(true), 500);
    }
  }, [onboardingKey, session, isInitializing]);

  // Effect for dynamic SEO tags
  useEffect(() => {
    const updateMetaTags = async () => {
      let title = "SoftMonk: Your AI Guide to Safe Software, Games & Drivers";
      let description = "Find and install any software or game with confidence. SoftMonk is your cross-platform AI assistant for safe, verified download links from official sources, step-by-step installation guides, and the right drivers for your PC.";
      let canonicalPath = window.location.pathname;

      // Normalize path: remove trailing slash if not root, and handle '/home'
      if (canonicalPath !== '/' && canonicalPath.endsWith('/')) {
        canonicalPath = canonicalPath.slice(0, -1);
      }
      if (canonicalPath === '/home') canonicalPath = '/';

      switch (currentPage) {
        case 'about':
          title = "About SoftMonk | Safe & Verified Software Downloads";
          description = "Learn about SoftMonk's mission to provide safe, simple, and transparent software downloads. Find out how our AI-powered guide helps you avoid malware and bundleware.";
          break;
        case 'forum':
          title = "Community Forum | SoftMonk";
          description = "Join the SoftMonk community forum to ask questions, share software finds, and connect with other users in a safe environment.";
          break;
        case 'blogs':
          title = "The SoftMonk Blog | Software, Security & Productivity Tips";
          description = "Read insights from the SoftMonk team on software, online security, productivity tips, and how to find safe downloads for any device.";
          break;
        case 'blog-post':
          if (selectedPostId) {
            try {
              // We fetch only the title and excerpt to keep this fast.
              const post = await getBlogPostById(selectedPostId);

              if (post) {
                title = `${post.title} | The SoftMonk Blog`;
                description = post.excerpt;
              } else {
                title = "Post Not Found | The SoftMonk Blog";
                description = "The blog post you are looking for could not be found.";
              }
            } catch (e) {
              title = "Error Loading Post | The SoftMonk Blog";
              console.error("Failed to fetch post for meta tags:", e);
            }
          }
          break;
        case 'file-verifier':
          title = "File Verifier | Check SHA256 Hashes with SoftMonk";
          description = "Verify the integrity of your downloaded files. Paste the SHA256 hash provided by our AI to ensure your file is authentic and hasn't been tampered with.";
          break;
        case 'admin':
          title = "Admin Dashboard | SoftMonk";
          description = "Manage users, software, and content for the SoftMonk platform.";
          break;
        case 'home':
        default:
          // Default title and description are already set
          break;
      }

      document.title = title;

      const setMetaTag = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('name', name);
          document.head.appendChild(element);
        }
        element.content = content;
      };

      const setPropertyTag = (property: string, content: string) => {
        let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('property', property);
          document.head.appendChild(element);
        }
        element.content = content;
      };

      const setCanonical = (url: string) => {
        let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!element) {
          element = document.createElement('link');
          element.setAttribute('rel', 'canonical');
          document.head.appendChild(element);
        }
        element.href = url;
      };

      const canonicalUrl = `${import.meta.env.VITE_APP_URL}${canonicalPath}`;

      setMetaTag('description', description);
      setPropertyTag('og:title', title);
      setPropertyTag('twitter:title', title);
      setPropertyTag('og:description', description);
      setPropertyTag('twitter:description', description);
      setPropertyTag('og:url', canonicalUrl);
      setPropertyTag('twitter:url', canonicalUrl);
      setCanonical(canonicalUrl);
    };

    updateMetaTags();
  }, [currentPage, selectedPostId, session]);


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
      const { data: historyData, error: historyError } = await dbService.getDownloadHistory(session.user.id);

      if (historyError) {
        console.error("Error fetching download history:", historyError);
      } else {
        setDownloadHistory(historyData || []);
      }

      // Fetch user devices
      const { data: devicesData, error: devicesError } = await dbService.getUserDevices(session.user.id);

      if (devicesError) {
        console.error("Error fetching user devices:", devicesError);
      } else {
        setUserDevices(devicesData || []);
      }
    };

    fetchData();
  }, [session]);

  const handleProfileUpdate = (updatedProfile: FullUserProfile) => {
    setUserProfile(updatedProfile);
  };

  const openPrivacyModal = () => setIsPrivacyModalOpen(true);
  const closePrivacyModal = () => setIsPrivacyModalOpen(false);

  const openCookiePolicyModal = () => setIsCookiePolicyModalOpen(true);
  const closeCookiePolicyModal = () => setIsCookiePolicyModalOpen(false);

  const openGdprModal = () => setIsGdprModalOpen(true);
  const closeGdprModal = () => setIsGdprModalOpen(false);

  const openDownloadHistoryModal = () => {
    if (!session) {
      setToastMessage("Please sign in to view your download history.");
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

    // dbService handles timestamp and user_id internally or we pass them?
    // Checking dbService implementation: it expects everything except id/timestamp/user_id, but adds them.
    // Wait, our local dbService.addDownloadHistory expects Omit<..., 'id'|'timestamp'>.

    // Let's refine the object passed to addDownloadHistory
    const newItemForDb: Omit<DownloadHistoryItem, 'id' | 'timestamp' | 'user_id'> = {
      software_name: item.software_name,
      version: item.version,
      status: 'verified', // Default or explicit status
      url: item.url,
      file_size: item.file_size,
      icon_url: item.icon_url,
      type: item.type
    };

    const { error } = await dbService.addDownloadHistory(session.user.id, newItemForDb);

    if (error) {
      console.error("Error saving download history:", error);
    } else {
      // Optimistically add to list (we don't get the full object back from addDoc helper easily unless modified)
      // For now, let's just re-fetch or construct it locally.
      const newItem: DownloadHistoryItem = {
        ...item,
        id: Date.now(), // Temporary ID for UI until refresh
        timestamp: new Date().toISOString(),
        user_id: session.user.id
      };
      setDownloadHistory(prev => [newItem, ...prev.filter(p => p.url !== item.url)]);
    }
  };

  const handleDeleteDownloadItem = async (itemId: string | number) => {
    if (!session) return;
    const { error } = await dbService.deleteDownloadHistoryItem(session.user.id, String(itemId));

    if (error) {
      console.error("Error deleting download item:", error);
      setToastMessage("Could not delete item. Please try again.");
    } else {
      setDownloadHistory(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleUpdateDownloadStatus = async (itemId: number | string, status: 'verified' | 'failed') => {
    if (!session) return;

    const { error } = await dbService.updateDownloadStatus(session.user.id, String(itemId), status);

    if (error) {
      console.error("Error updating download status:", error);
    } else {
      setDownloadHistory(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, status: status } : item
        )
      );
    }
  };

  const handleNavClick = (page: Page) => {
    const path = `/${page === 'home' ? '' : page}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      handleLocationChange();
    }
  };

  const handleSelectPost = (postId: string) => {
    const path = `/blog-post/${postId}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      handleLocationChange();
    }
  };

  const handleForumPostSelect = (postId: string) => {
    const path = `/forum-post/${postId}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      handleLocationChange();
    }
  };

  const handleTopicClick = (topic: string) => {
    if (currentPage !== 'home') {
      handleNavClick('home');
    }
    setTimeout(() => {
      chatWindowRef.current?.sendMessage(topic);
    }, 100); // A small delay to ensure the chat window is rendered
  };

  const handleDevicesUpdate = (newDevices: UserDevice[]) => {
    setUserDevices(newDevices);
  }

  const handleTestimonialUpdate = (newTestimonial: Testimonial | null) => {
    setUserTestimonial(newTestimonial);
  }

  const handleUserDataChange = async () => {
    if (session) {
      const { data: profile } = await authService.getUserProfile(session.user.id);
      setUserProfile(profile as FullUserProfile | null);
    }
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setShowCookieBanner(false);
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setShowCookieBanner(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <AboutPage />;
      case 'forum':
        return <ForumPage session={session} onLoginClick={() => setIsLoginModalOpen(true)} isAdmin={isAdmin} onSelectPost={handleForumPostSelect} />;
      case 'blogs':
        return <BlogPage onSelectPost={handleSelectPost} session={session} />;
      case 'blog-post':
        return selectedPostId ? <BlogPostPage postId={selectedPostId} onBack={() => handleNavClick('blogs')} session={session} onLoginClick={() => setIsLoginModalOpen(true)} /> : <BlogPage onSelectPost={handleSelectPost} session={session} />;
      case 'forum-post':
        return selectedForumPostId ? <ForumPostPage postId={selectedForumPostId} onBack={() => handleNavClick('forum')} session={session} onLoginClick={() => setIsLoginModalOpen(true)} /> : <ForumPage session={session} onLoginClick={() => setIsLoginModalOpen(true)} isAdmin={isAdmin} onSelectPost={handleForumPostSelect} />;
      case 'file-verifier':
        return <FileVerifierPage />;
      case 'admin':
        // Secure admin route
        if (session && !userProfile) {
          // If we have a session but are still fetching the profile for that session.
          return (
            <div className="p-10 text-center">
              <p>Verifying permissions...</p>
            </div>
          );
        }

        if (isAdmin) {
          return <AdminPage session={session} onUserDataChange={handleUserDataChange} />;
        } else {
          return (
            <div className="p-10 text-center">
              <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">Access Denied</h1>
              <p className="mt-4 text-gray-600 dark:text-white">You do not have permission to view this page. Please contact an administrator if you believe this is an error.</p>
              <button onClick={() => handleNavClick('home')} className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Go to Homepage</button>
            </div>
          );
        }
      default:
        return null; // Home page content is rendered outside this switch
    }
  };

  if (isInitializing) {
    return <AppLoader />;
  }

  return (
    <div className={`font-sans flex flex-col ${currentPage === 'home' ? 'h-screen' : 'min-h-screen'}`}>
      <Header
        session={session}
        isAdmin={isAdmin}
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
          <div className="w-full max-w-screen-2xl mx-auto lg:grid lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-6 xl:gap-8 px-4 flex-1 min-h-0">

            {/* Left Column */}
            <aside className="hidden lg:flex flex-col gap-4 py-4 overflow-y-auto">
              <TrendingTopics onTopicClick={handleTopicClick} />
              <TopAntivirus onTopicClick={handleTopicClick} />
            </aside>

            {/* Center Column */}
            <div className="flex flex-col min-h-0 py-4">
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col h-full">
                  <CoreFeatures />
                  <div className="flex-1 flex flex-col min-h-0">
                    <ChatWindow
                      ref={chatWindowRef}
                      onDownload={handleDownload}
                      session={session}
                      onLoginRequest={() => setIsLoginModalOpen(true)}
                      onShowToast={(msg: string) => setToastMessage(msg)}
                    />
                  </div>
                </div>
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
                userProfile={userProfile}
                onProfileClick={() => setIsProfileModalOpen(true)}
              />
              <div data-tour-id="safety-actions">
                <QuickSafetyActions onActionClick={openSafetyModal} />
              </div>
              <TestimonialSlider />
              <SocialProof />
            </aside>
          </div>
        ) : (
          <div className={`w-full ${isAdminPage ? 'max-w-screen-xl' : 'max-w-screen-2xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {renderPage()}
            </div>
            <Footer
              onPrivacyClick={openPrivacyModal}
              onCookiePolicyClick={openCookiePolicyModal}
              onGdprClick={openGdprModal}
            />
          </div>
        )}
      </main>

      <OnboardingTour isOpen={isTourOpen} onClose={handleTourClose} />
      {isLoginModalOpen && <LoginModal onClose={() => setIsLoginModalOpen(false)} />}
      {isResetPasswordModalOpen && (
        <PasswordResetModal
          onClose={() => {
            setIsResetPasswordModalOpen(false);
            // Clear the URL hash fragment to prevent the modal from re-appearing on page refresh.
            window.history.replaceState(null, '', window.location.pathname);
          }}
        />
      )}
      {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} session={session} userProfile={userProfile} onProfileUpdate={handleProfileUpdate} userDevices={userDevices} onDevicesUpdate={handleDevicesUpdate} userTestimonial={userTestimonial} onTestimonialUpdate={handleTestimonialUpdate} />}
      {isPrivacyModalOpen && <PrivacyPolicyModal onClose={closePrivacyModal} />}
      {isCookiePolicyModalOpen && <CookiePolicyModal onClose={closeCookiePolicyModal} />}
      {isGdprModalOpen && <GdprModal onClose={closeGdprModal} />}
      {isDownloadHistoryModalOpen && <DownloadHistoryModal history={downloadHistory} onClose={closeDownloadHistoryModal} onUpdateStatus={handleUpdateDownloadStatus} onDeleteItem={handleDeleteDownloadItem} />}
      {isSafetyModalOpen && safetyModalAction && <SafetyActionModal actionType={safetyModalAction} onClose={closeSafetyModal} />}

      {showCookieBanner && (
        <CookieConsentBanner
          onAccept={handleAcceptCookies}
          onDecline={handleDeclineCookies}
          onOpenCookiePolicy={openCookiePolicyModal}
        />
      )}

      <FeedbackButton session={session} userProfile={userProfile} onSuccess={setToastMessage} onLoginClick={() => setIsLoginModalOpen(true)} onProfileClick={() => setIsProfileModalOpen(true)} />
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
    </div>
  );
}

const App: React.FC = () => (
  <AppContent />
);

export default App;