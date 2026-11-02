import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Sparkles, PlusCircle, Search, ExternalLink, Heart,
  MessageSquare, ChevronRight, Database, AlertCircle,
  Zap, FolderGit2, X, Send, RefreshCw, Camera, Image,
  UserRound, Pencil, Save, AtSign, Trophy, Users
} from 'lucide-react';

import { Analytics } from '@vercel/analytics/react';

import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
const AVATAR_BUCKET = 'avatars';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?name=SV&background=0B1B35&color=22D3EE&size=150';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80';

const INITIAL_PROJECTS = [
  {
    id: 'sample-p1',
    title: 'VYBE App Launcher',
    category: 'Web Application',
    description: 'A dark-mode glassmorphic dashboard and app launcher with interactive visual effects.',
    creator_name: 'Ayan Mehdi',
    creator_handle: '@ayanmehdi',
    creator_avatar: DEFAULT_AVATAR,
    skills: ['React', 'Tailwind CSS', 'Vite', 'Glassmorphism'],
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    likes_count: 142,
    comments_count: 18,
    proof_badge: 'Sample Project',
    external_url: 'https://vybe-app-beta.vercel.app',
    isSample: true
  },
  {
    id: 'sample-p2',
    title: 'Neural Skill Graph Visualizer',
    category: 'Data Visualization',
    description: 'Interactive visualization connecting creator skills with project evidence.',
    creator_name: 'Demo Creator',
    creator_handle: '@demo_creator',
    creator_avatar: DEFAULT_AVATAR,
    skills: ['TypeScript', 'Canvas API', 'D3.js'],
    cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    likes_count: 89,
    comments_count: 12,
    proof_badge: 'Sample Project',
    external_url: '#',
    isSample: true
  },
  {
    id: 'sample-p3',
    title: 'Decentralized Micro-Grant Vaults',
    category: 'Blockchain',
    description: 'A concept for funding open-source contributors through smart contracts.',
    creator_name: 'Demo Creator',
    creator_handle: '@demo_creator',
    creator_avatar: DEFAULT_AVATAR,
    skills: ['Solidity', 'Ethers.js', 'Next.js'],
    cover_image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80',
    likes_count: 210,
    comments_count: 34,
    proof_badge: 'Sample Project',
    external_url: '#',
    isSample: true
  }
];

const EMPTY_PROJECT = {
  title: '',
  category: 'Web Application',
  description: '',
  skills: '',
  cover_image: '',
  external_url: ''
};

const inputClass =
  'w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';

export default function App() {
  const [view, setView] = useState('landing');
  const [selectedCreatorId, setSelectedCreatorId] = useState(null);
  const [legalPage, setLegalPage] = useState('about');
  const [notificationChallengeId, setNotificationChallengeId] = useState(null);
  const [notificationProjectId, setNotificationProjectId] = useState(null);
const [notificationProjectType, setNotificationProjectType] = useState(null);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [newProject, setNewProject] = useState(EMPTY_PROJECT);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileSaveMessage, setProfileSaveMessage] = useState('');

  // AUTH SESSION
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) setAuthError(error.message);
      setSession(data?.session || null);
      setAuthLoading(false);
    };

    getSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // LOAD PROJECTS
  const loadProjects = useCallback(async () => {
    if (!supabase) {
      setProjects(INITIAL_PROJECTS);
      return;
    }

    setProjectsLoading(true);
    setProjectError('');

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];
      const projectIds = rows.map(row => row.id);

      let profileMap = {};
      let likesMap = {};
      let commentsMap = {};
      const likedProjectIds = new Set();

      if (projectIds.length > 0) {
        const [likesResult, commentsResult] = await Promise.all([
          supabase
            .from('project_likes')
            .select('project_id, user_id')
            .in('project_id', projectIds),

          supabase
            .from('project_comments')
            .select('project_id')
            .in('project_id', projectIds)
        ]);

        if (likesResult.error) throw likesResult.error;
        if (commentsResult.error) throw commentsResult.error;

        (likesResult.data || []).forEach(like => {
          likesMap[like.project_id] =
            (likesMap[like.project_id] || 0) + 1;

          if (session?.user?.id === like.user_id) {
            likedProjectIds.add(like.project_id);
          }
        });

        (commentsResult.data || []).forEach(comment => {
          commentsMap[comment.project_id] =
            (commentsMap[comment.project_id] || 0) + 1;
        });
      }

      const userIds = [
        ...new Set(rows.map(row => row.user_id).filter(Boolean))
      ];

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, bio')
          .in('id', userIds);

        if (!profileError && profiles) {
          profileMap = Object.fromEntries(
            profiles.map(profile => [profile.id, profile])
          );
        }
      }

      const realProjects = rows.map(row => {
        const profile = profileMap[row.user_id];

        return {
          id: row.id,
          created_at: row.created_at,
          user_id: row.user_id,
          title: row.title || 'Untitled Project',
          category: row.category || 'Other',
          description: row.description || '',
          creator_name: profile?.full_name || 'SKILLVERSE Member',
          creator_handle: profile?.username
            ? `@${profile.username}`
            : '@member',
          creator_avatar: profile?.avatar_url || DEFAULT_AVATAR,
          skills: Array.isArray(row.skills) ? row.skills : [],
          cover_image: row.image_url || DEFAULT_COVER,
          likes_count: likesMap[row.id] || 0,
          comments_count: commentsMap[row.id] || 0,
          is_liked: likedProjectIds.has(row.id),
          proof_badge: 'Self-Declared',
          external_url: row.project_url || '#',
          isSample: false
        };
      });

      setProjects([...realProjects, ...INITIAL_PROJECTS]);
    } catch (error) {
      console.error('Supabase project loading error:', error);
      setProjectError(error.message || 'Could not load projects.');
      setProjects(INITIAL_PROJECTS);
    } finally {
      setProjectsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // PROFILE PHOTO UPLOAD
  const handleAvatarUpload = async (file) => {
    setAvatarError('');
    setAvatarMessage('');

    if (!file) return;

    if (!session?.user || !supabase) {
      setAvatarError('Please log in before changing your profile photo.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size must be 5 MB or smaller.');
      return;
    }

    setAvatarUploading(true);

    try {
      const userId = session.user.id;

      const extensionByType = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/avif': 'avif'
      };

      const extension = extensionByType[file.type] || 'jpg';
      const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(uploadData.path);

      const avatarUrl = publicData?.publicUrl;

      if (!avatarUrl) {
        throw new Error('Could not generate the profile photo URL.');
      }

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select('id')
        .maybeSingle();

      if (profileError) throw profileError;

      if (!updatedProfile) {
        throw new Error('Profile record not found. Please log in again.');
      }

      const { data: authData, error: authError } =
        await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl }
        });

      if (authError) throw authError;

      if (authData?.user) {
        setSession(current => current
          ? { ...current, user: authData.user }
          : current
        );
      }

      setAvatarMessage('Profile photo updated successfully!');
      await loadProjects();
    } catch (error) {
      console.error('Avatar upload error:', error);
      setAvatarError(error.message || 'Could not upload your profile photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // SAVE PROFILE DETAILS
  const handleProfileSave = async ({ full_name, username, bio }) => {
    setProfileSaveError('');
    setProfileSaveMessage('');

    if (!session?.user || !supabase) {
      setProfileSaveError('Please log in before editing your profile.');
      return false;
    }

    const cleanName = full_name.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanBio = bio.trim();

    if (!cleanName) {
      setProfileSaveError('Full name is required.');
      return false;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setProfileSaveError(
        'Username must be 3–20 characters and use only letters, numbers or underscores.'
      );
      return false;
    }

    if (cleanBio.length > 160) {
      setProfileSaveError('Bio must be 160 characters or less.');
      return false;
    }

    setProfileSaving(true);

    try {
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: cleanName,
          username: cleanUsername,
          bio: cleanBio
        })
        .eq('id', session.user.id)
        .select('id, full_name, username, bio')
        .maybeSingle();

      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('This username is already taken. Try another one.');
        }
        throw profileError;
      }

      if (!updatedProfile) {
        throw new Error('Your profile record was not found. Please log in again.');
      }

      const { data: authData, error: authError } =
        await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
            username: cleanUsername,
            bio: cleanBio
          }
        });

      if (authError) throw authError;

      if (authData?.user) {
        setSession(current => current
          ? { ...current, user: authData.user }
          : current
        );
      }

      setProfileSaveMessage('Profile updated successfully!');
      await loadProjects();
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileSaveError(error.message || 'Could not update your profile.');
      return false;
    } finally {
      setProfileSaving(false);
    }
  };

  // LOGIN / SIGNUP
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');

    if (!supabase) {
      setAuthError('Supabase is not configured. Check your .env file.');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: { full_name: authName.trim() }
          }
        });

        if (error) throw error;

        if (data?.session) {
          setView('feed');
          setAuthMessage('Account created successfully!');
        } else {
          setAuthMessage(
            'Account created! Please verify your email, then log in.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword
        });

        if (error) throw error;
        setView('feed');
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      return;
    }

    setView('landing');
    setAvatarError('');
    setAvatarMessage('');
    setProfileSaveError('');
    setProfileSaveMessage('');
  };

  // OPEN PUBLISH
  const openPublish = () => {
    setProjectError('');

    if (!session?.user) {
      setAuthMode('login');
      setAuthError('Please log in before publishing a project.');
      setAuthMessage('');
      setView('auth');
      return;
    }

    setNewProject(EMPTY_PROJECT);
    setIsPublishModalOpen(true);
  };

  // PUBLISH PROJECT
  const handlePublishProject = async (e) => {
    e.preventDefault();
    setProjectError('');

    if (!session?.user) {
      setIsPublishModalOpen(false);
      setAuthMode('login');
      setAuthError('Please log in before publishing a project.');
      setView('auth');
      return;
    }

    if (!newProject.title.trim() || !newProject.description.trim()) {
      setProjectError('Project title and description are required.');
      return;
    }

    if (!supabase) {
      setProjectError('Supabase is not configured.');
      return;
    }

    setIsPublishing(true);

    try {
      const skills = newProject.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean);

      const payload = {
        user_id: session.user.id,
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        category: newProject.category,
        skills,
        project_url: newProject.external_url.trim() || null,
        image_url: newProject.cover_image.trim() || null,
        status: 'published'
      };

      const { error } = await supabase
        .from('projects')
        .insert(payload);

      if (error) throw error;

      setNewProject(EMPTY_PROJECT);
      setIsPublishModalOpen(false);
      setView('feed');
      setSearchQuery('');
      setSelectedCategory('All');

      await loadProjects();
    } catch (error) {
      console.error('Project publishing error:', error);
      setProjectError(error.message || 'Project could not be published.');
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      (project.creator_name || '').toLowerCase().includes(query) ||
      (project.skills || []).some(skill =>
        skill.toLowerCase().includes(query)
      );

    const matchesCategory =
      selectedCategory === 'All' ||
      project.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const currentAvatar =
    session?.user?.user_metadata?.avatar_url || DEFAULT_AVATAR;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <button
            onClick={() => setView('landing')}
            className="flex items-center space-x-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[2px]">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                SKILLVERSE
              </span>
              <p className="text-[10px] text-cyan-400 font-medium -mt-1 tracking-wider uppercase">
                By Ayan Mehdi
              </p>
            </div>
          </button>

          <div className="hidden md:flex items-center space-x-1 text-sm font-medium text-slate-300">
            <NavButton active={view === 'feed'} onClick={() => setView('feed')}>
              Discover
            </NavButton>
            <NavButton active={view === 'skillgraph'} onClick={() => setView('skillgraph')}>
              Skill Graph
            </NavButton>
            <NavButton active={view === 'challenges'} onClick={() => setView('challenges')}>
              Challenges
            </NavButton>
            <NavButton active={view === 'sql'} onClick={() => setView('sql')}>
              Database Schema
            </NavButton>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isSupabaseConfigured && (
            <span className="hidden xl:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              Demo Mode
            </span>
          )}

         {session ? (
  <>
  
<Notifications
  session={session}
  setView={setView}
  setNotificationChallengeId={setNotificationChallengeId}
  setNotificationProjectId={setNotificationProjectId}
  setNotificationProjectType={setNotificationProjectType}
/>

    <button
      onClick={handleLogout}
      className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700 hover:border-cyan-400"
    >
      Log out
    </button>
  </>
) : (
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
                setAuthMessage('');
                setView('auth');
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700 hover:border-cyan-400"
            >
              Log in
            </button>
          )}

          <button
            onClick={openPublish}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish Project</span>
          </button>

          <button
            onClick={() => setView('profile')}
            title="Open Profile"
            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden hover:border-cyan-400"
          >
            <img
              src={currentAvatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </nav>

      <main className="flex-1">
        {view === 'landing' && (
          <LandingView setView={setView} openPublish={openPublish} />
        )}

        {view === 'auth' && (
          <AuthView
            authMode={authMode}
            setAuthMode={setAuthMode}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authName={authName}
            setAuthName={setAuthName}
            authError={authError}
            authMessage={authMessage}
            authLoading={authLoading}
            handleAuth={handleAuth}
            configured={isSupabaseConfigured}
          />
        )}

        {view === 'feed' && (
          <FeedView
            projects={filteredProjects}
            session={session}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            openPublish={openPublish}
            loading={projectsLoading}
            error={projectError}
            refreshProjects={loadProjects}
                        notificationProjectId={notificationProjectId}
            notificationProjectType={notificationProjectType}
            setNotificationProjectId={setNotificationProjectId}
            setNotificationProjectType={setNotificationProjectType}
          />
        )}

        {view === 'skillgraph' && (
  <SkillGraphView projects={projects} session={session} />
)}

        {view === 'challenges' && (
          <ChallengesView
  session={session}
  notificationChallengeId={notificationChallengeId}
  setNotificationChallengeId={setNotificationChallengeId}
/>
        )}

        {view === 'profile' && (
          <ProfileView
            projects={projects}
            session={session}
            setView={setView}
            refreshProjects={loadProjects}
            onAvatarChange={handleAvatarUpload}
            avatarUploading={avatarUploading}
            avatarError={avatarError}
            avatarMessage={avatarMessage}
            onProfileSave={handleProfileSave}
            profileSaving={profileSaving}
            profileSaveError={profileSaveError}
            profileSaveMessage={profileSaveMessage}
          />
        )}
        {view === 'public-profile' && (
  <PublicProfileView
    creatorId={selectedCreatorId}
    projects={projects}
    setView={setView}
  />
)}

        {view === 'sql' && <SqlSchemaView />}

        {view === 'legal' && (
          <LegalPage page={legalPage} setLegalPage={setLegalPage} />
        )}

        {projectError && view !== 'feed' && (
          <div className="max-w-3xl mx-auto px-4 pb-6">
            <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
              {projectError}
            </p>
          </div>
        )}
      </main>

      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131927] border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                if (!isPublishing) setIsPublishModalOpen(false);
              }}
              disabled={isPublishing}
              className="absolute top-4 right-4 text-slate-400 hover:text-white disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center space-x-2">
              <FolderGit2 className="w-5 h-5 text-cyan-400" />
              <span>Publish New Project</span>
            </h3>

            <p className="text-sm text-slate-400 mb-6">
              Showcase your skills with real proof-of-work evidence.
            </p>

            {projectError && (
              <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4">
                {projectError}
              </p>
            )}

            <form onSubmit={handlePublishProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={newProject.title}
                  onChange={e => setNewProject({
                    ...newProject,
                    title: e.target.value
                  })}
                  placeholder="e.g. VYBE Dashboard"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newProject.category}
                    onChange={e => setNewProject({
                      ...newProject,
                      category: e.target.value
                    })}
                    className={inputClass}
                  >
                    <option>Web Application</option>
                    <option>Data Visualization</option>
                    <option>Blockchain</option>
                    <option>Mobile App</option>
                    <option>AI / Machine Learning</option>
                    <option>UI / UX Design</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    External Link
                  </label>
                  <input
                    type="url"
                    value={newProject.external_url}
                    onChange={e => setNewProject({
                      ...newProject,
                      external_url: e.target.value
                    })}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Description
                </label>
                <textarea
                  required
                  maxLength={2000}
                  rows={3}
                  value={newProject.description}
                  onChange={e => setNewProject({
                    ...newProject,
                    description: e.target.value
                  })}
                  placeholder="Describe what you built and how you built it..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Skills Used (Comma Separated)
                </label>
                <input
                  type="text"
                  value={newProject.skills}
                  onChange={e => setNewProject({
                    ...newProject,
                    skills: e.target.value
                  })}
                  placeholder="React, TypeScript, Tailwind CSS, Vite"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={newProject.cover_image}
                  onChange={e => setNewProject({
                    ...newProject,
                    cover_image: e.target.value
                  })}
                  placeholder="https://images.unsplash.com/..."
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {isPublishing ? 'Publishing...' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 bg-[#0B0F19] py-8 px-4 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} SKILLVERSE — Founded by Ayan Mehdi. Build Your Skills. Prove Your Potential.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-3 text-slate-400">
          {[
            ['About Us', 'about'], ['Contact Us', 'contact'],
            ['Privacy Policy', 'privacy'], ['Terms & Conditions', 'terms'],
            ['Cookie Policy', 'cookies'], ['Community Guidelines', 'community'],
            ['Copyright Policy', 'copyright'], ['Account & Data Deletion', 'deletion'],
            ['Safety & Reporting', 'safety']
          ].map(([label, page]) => (
            <button key={page} onClick={() => { setLegalPage(page); setView('legal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-cyan-400 transition-colors">
              {label}
            </button>
          ))}
        </div>
        <p className="mt-4">Support: <a className="text-cyan-400 hover:underline" href="mailto:ayanmehdi773@gmail.com">ayanmehdi773@gmail.com</a></p>
      </footer>
    </div>
  );
}

// LEGAL, INFORMATION AND CONTACT PAGES
function LegalPage({ page, setLegalPage }) {
  const pages = {
    about: {
      title: 'About SKILLVERSE',
      intro: 'SKILLVERSE is a community concept for discovering projects, showcasing practical skills and learning from other creators.',
      sections: [
        ['Our purpose', 'We aim to help people present evidence of what they build, explore projects and connect around shared skills.'],
        ['Who can use SKILLVERSE', 'The platform is intended for teenagers and adults. Users should communicate respectfully and avoid sharing sensitive personal information.'],
        ['Founder', 'SKILLVERSE is founded by Ayan Mehdi.']
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      intro: 'This Privacy Policy describes the information that may be processed when you use SKILLVERSE. It applies to the features currently available on this website. This page should be updated if the website changes how it collects or uses information.',
      sections: [
        ['Information you provide', 'When you create an account or use community features, SKILLVERSE may process your account identifier and email through Supabase Authentication, profile details such as your name, username, avatar and bio, and content you submit such as projects, skills, comments and likes. The exact information depends on the features you use. Never publish passwords, verification codes, financial details, home addresses or private documents.'],
        ['How information is used', 'Information may be used to provide account access, display profiles and projects, operate challenges and other enabled community features, protect the service, respond to support requests and diagnose technical problems.'],
        ['Service providers', 'The current application uses Supabase for authentication and database services. Information handled by Supabase is also subject to Supabase terms and privacy documentation. The website may be hosted by a separate hosting provider. Provider practices and terms may change.'],
        ['Cookies and local storage', 'The application and its service providers may use browser storage or cookies needed for sign-in, session management, security and core site functions. Your browser can usually block or clear cookies, but doing so may affect sign-in or other features.'],
     ['Advertising', 'SKILLVERSE uses or may use Google AdSense to display advertisements. Google and its advertising partners may use cookies or similar technologies to serve, measure and personalize advertisements, subject to applicable settings and consent requirements. Visitors can learn more at https://policies.google.com/technologies/ads.'],
        ['Children and teenagers', 'SKILLVERSE is intended for teenagers and adults. Users should not share sensitive personal details. Anyone using the service should communicate respectfully and report unsafe content or interactions. Interactive features involving contact between users should be used only when suitable access controls and safety measures are in place.'],
        ['Data security and retention', 'Reasonable steps are taken to protect information, but no website or internet transmission can be guaranteed completely secure. Information may remain in active systems or backups for as long as needed to operate the service, address security issues and meet legal obligations. Actual retention can depend on the data type and service provider.'],
        ['Your choices', 'You may contact SKILLVERSE to ask about access, correction or deletion of account information. Requests may require reasonable account verification. Some information may need to be retained for legal, security or dispute-related reasons.'],
        ['Contact', 'For privacy questions or requests, email ayanmehdi773@gmail.com. Include only the information needed to explain your request; never send your password or verification code.']
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      intro: 'By using SKILLVERSE, you agree to use the service lawfully and respectfully. If you do not agree, do not use the website.',
      sections: [
        ['Accounts', 'Use accurate account information, keep your sign-in credentials private and notify the team if you believe your account has been accessed without permission. Do not impersonate another person or create accounts to abuse the service.'],
        ['User content', 'You are responsible for the content you submit and must have permission to share it. Do not post unlawful, misleading, harassing, infringing, private or harmful material. You keep any rights you already hold in your own content; you allow the service to host and display it as needed to operate the features you use.'],
        ['Acceptable use', 'Do not harass, threaten, impersonate, spam, attempt unauthorized access, disrupt the service or misuse another person’s information.'],
        ['Moderation', 'SKILLVERSE may review reports and restrict or remove content or accounts where reasonably necessary for safety, legal compliance, security or enforcement of these terms. Not every item is reviewed before it appears.'],
        ['Availability', 'Features may change, become temporarily unavailable or be removed. The service is provided without a guarantee of uninterrupted availability or permanent storage of submitted content.'],
        ['Contact', 'Questions about these terms can be sent to ayanmehdi773@gmail.com. These terms do not remove any rights that cannot legally be excluded.']
      ]
    },
    contact: {
      title: 'Contact Us',
      intro: 'For support, privacy questions, safety concerns, copyright notices or general feedback, contact the SKILLVERSE team.',
      sections: [
        ['Support email', 'ayanmehdi773@gmail.com'],
        ['What to include', 'Describe the issue, the page or feature involved and any relevant public project link. Do not email passwords, one-time codes, bank details or government identity documents.'],
        ['Response times', 'We will try to review messages as reasonably possible. A specific response-time guarantee is not currently offered.']
      ]
    },
    cookies: {
      title: 'Cookie Policy',
      intro: 'Cookies and similar browser storage can help a website remember sessions and provide essential functionality.',
      sections: [
        ['Essential technologies', 'Authentication and hosting providers may use cookies or browser storage required for sign-in, security and site operation.'],
        ['Optional analytics and advertising', 'If optional analytics or advertising technologies are introduced, SKILLVERSE should identify the relevant providers and explain their purposes and available privacy choices before or when those technologies are enabled, as required by applicable rules.'],
        ['Manage cookies', 'You can manage or delete cookies through your browser settings. Blocking essential cookies may prevent sign-in or other features from working.'],
        ['Questions', 'Contact ayanmehdi773@gmail.com.']
      ]
    },
    community: {
      title: 'Community Guidelines',
      intro: 'SKILLVERSE should be a respectful place to share work and learn.',
      sections: [
        ['Be respectful', 'No bullying, harassment, hate, threats, sexual exploitation, discriminatory abuse or targeted humiliation.'],
        ['Share authentic work', 'Credit collaborators and sources. Do not impersonate others, steal projects or misrepresent someone else’s work as your own.'],
        ['Protect privacy', 'Do not publish private contact details, personal documents, precise location information or another person’s private information without permission.'],
        ['Teen safety', 'Do not pressure teenagers to move conversations off-platform, share private images or reveal personal details. Report suspicious or uncomfortable interactions.'],
        ['Enforcement', 'Content may be removed and accounts may be restricted for violations. Serious safety concerns may be escalated where appropriate.']
      ]
    },
    copyright: {
      title: 'Copyright & Content Removal',
      intro: 'Only publish content that you created or are authorized to share.',
      sections: [
        ['Report infringement', 'Email ayanmehdi773@gmail.com with the URL of the material, a description of the copyrighted work, your contact details and a statement explaining your rights and the concern.'],
        ['Review', 'Reports will be reviewed and additional information may be requested. Content may be restricted or removed where appropriate.'],
        ['False claims', 'Do not submit knowingly false or misleading reports.']
      ]
    },
    deletion: {
      title: 'Account & Data Deletion',
      intro: 'You can request help with deleting your SKILLVERSE account and associated personal information.',
      sections: [
        ['How to request deletion', 'Email ayanmehdi773@gmail.com from the email associated with your account and use the subject “SKILLVERSE Account Deletion Request”. Do not include your password.'],
        ['What happens next', 'We may need to verify account ownership. Information may be retained where required by law or reasonably needed for security, fraud prevention or dispute resolution.'],
        ['Before deletion', 'Save any projects or information you want to keep. Deletion may be irreversible.']
      ]
    },
    safety: {
      title: 'Safety, Blocking & Reporting',
      intro: 'User safety matters. If you see harmful content or experience unwanted contact, use available in-product reporting and blocking tools when enabled.',
      sections: [
        ['Report a concern', 'Email ayanmehdi773@gmail.com with the relevant public profile or project link and a concise description of the concern. Do not include passwords, verification codes, private images or unnecessary sensitive information.'],
        ['Block and restrict', 'Where blocking is available, use it to limit unwanted interaction. Do not continue engaging with threatening or coercive accounts.'],
        ['Teen users', 'Never share passwords, verification codes, private images, financial details or your live location with people you meet online. Tell a trusted adult if an interaction makes you feel unsafe.'],
        ['Feature status', 'Some safety controls described here may depend on features being implemented and enabled. Do not treat this page as confirmation that every reporting or blocking tool is already active.']
      ]
    }
  };
  const data = pages[page] || pages.about;
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <button onClick={() => setLegalPage('about')} className="text-sm text-cyan-400 hover:text-cyan-300 mb-6">← About SKILLVERSE</button>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold mb-3">SKILLVERSE • By Ayan Mehdi</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">{data.title}</h1>
        <p className="text-slate-300 leading-7 mb-8">{data.intro}</p>
        <div className="space-y-7">
          {data.sections.map(([heading, body]) => (
            <article key={heading}>
              <h2 className="text-lg font-bold text-white mb-2">{heading}</h2>
              <p className="text-sm sm:text-base text-slate-400 leading-7">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap gap-3">
          {Object.entries(pages).filter(([key]) => key !== page).map(([key, item]) => (
            <button key={key} onClick={() => setLegalPage(key)} className="text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300">{item.title}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

// NAV BUTTON
function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg transition-all ${
        active
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
          : 'hover:bg-slate-800/60 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

// AUTH VIEW
function AuthView({
  authMode, setAuthMode,
  authEmail, setAuthEmail,
  authPassword, setAuthPassword,
  authName, setAuthName,
  authError, authMessage,
  authLoading, handleAuth, configured
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-7">
        <div className="text-center mb-7">
          <Sparkles className="w-9 h-9 text-cyan-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">
            {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Join SKILLVERSE and showcase your work.
          </p>
        </div>

        {!configured && (
          <p className="text-sm text-amber-400 mb-4">
            Supabase is not configured. Check your environment settings.
          </p>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'signup' && (
            <input
              type="text"
              required
              maxLength={80}
              placeholder="Full name"
              value={authName}
              onChange={e => setAuthName(e.target.value)}
              className={inputClass}
            />
          )}

          <input
            type="email"
            required
            placeholder="Email address"
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
            className={inputClass}
          />

          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
            className={inputClass}
          />

          {authError && (
            <p className="text-sm text-rose-400">{authError}</p>
          )}

          {authMessage && (
            <p className="text-sm text-emerald-400">{authMessage}</p>
          )}

          <button
            type="submit"
            disabled={authLoading || !configured}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
          >
            {authLoading
              ? 'Please wait...'
              : authMode === 'signup'
                ? 'Create Account'
                : 'Log In'}
          </button>
        </form>

        <button
          onClick={() => {
            setAuthMode(authMode === 'signup' ? 'login' : 'signup');
          }}
          className="w-full text-sm text-cyan-400 mt-5 hover:text-cyan-300"
        >
          {authMode === 'signup'
            ? 'Already have an account? Log in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}


// LANDING PAGE
function LandingView({ setView, openPublish }) {
  const steps = [
    { step: '01', title: 'DISCOVER', desc: 'Explore real projects and creators.' },
    { step: '02', title: 'BUILD', desc: 'Turn your ideas into real work.' },
    { step: '03', title: 'SHOWCASE', desc: 'Publish your skills with proof.' },
    { step: '04', title: 'CONNECT', desc: 'Meet creators with similar interests.' },
    { step: '05', title: 'GROW', desc: 'Learn, improve and keep creating.' }
  ];

  return (
    <div className="relative overflow-hidden bg-[#080D18] text-white pb-20">

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="absolute top-96 -left-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute top-[650px] -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:55px_55px]" />
      </div>

      {/* HERO */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-24 lg:grid-cols-2 lg:px-10 lg:pb-32 lg:pt-32">

        <div className="relative z-10 text-center lg:text-left">

          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-2 text-xs font-semibold tracking-wide text-cyan-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            THE GLOBAL PROJECT-FIRST SKILL NETWORK
          </div>

          <h1 className="mb-7 text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Your Skills.
            <br />
            Your Projects.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Your Universe.
            </span>
          </h1>

          <p className="mx-auto mb-9 max-w-xl text-base leading-8 text-slate-400 sm:text-lg lg:mx-0">
            A place where creators turn skills into real projects,
            showcase their work, connect with people and build
            a digital identity that speaks for itself.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">

            <button
              onClick={() => setView('feed')}
              className="group flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/30"
            >
              Explore Projects
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={openPublish}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-8 py-4 text-sm font-bold text-slate-200 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.08]"
            >
              Publish Your Work
            </button>

          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs text-slate-500 lg:justify-start">
            <span className="flex items-center gap-2">
              <span className="text-cyan-400">✦</span> Project-first community
            </span>
            <span className="flex items-center gap-2">
              <span className="text-cyan-400">✦</span> Real proof of work
            </span>
            <span className="flex items-center gap-2">
              <span className="text-cyan-400">✦</span> Creator focused
            </span>
          </div>

        </div>

        {/* VISUAL SHOWCASE */}
        <div className="relative mx-auto w-full max-w-xl">

          <div className="absolute inset-8 rounded-full bg-blue-500/20 blur-[90px]" />

          <div className="relative rounded-3xl border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-blue-950/50 backdrop-blur-2xl">

            <div className="rounded-2xl border border-white/10 bg-[#0D1525] p-5 sm:p-7">

              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    SKILLVERSE
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-white">
                    Creator Workspace
                  </h2>
                </div>
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-300">
                  YOUR SPACE
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-600/20 via-[#111D35] to-cyan-500/10 p-5">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-200">
                    YOUR CREATIVE JOURNEY
                  </span>
                  <span className="text-lg text-cyan-300">✦</span>
                </div>
                <h3 className="text-2xl font-black leading-tight sm:text-3xl">
                  Build something
                  <br />
                  worth showing.
                </h3>
                <p className="mt-3 text-xs leading-6 text-slate-400">
                  Ideas become projects. Projects become proof.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-3 text-xl text-cyan-400">⌘</div>
                  <p className="text-sm font-bold text-white">Discover</p>
                  <p className="mt-1 text-xs text-slate-500">Find inspiration</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-3 text-xl text-blue-400">◇</div>
                  <p className="text-sm font-bold text-white">Showcase</p>
                  <p className="mt-1 text-xs text-slate-500">Share your work</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-3 text-xl text-indigo-400">◎</div>
                  <p className="text-sm font-bold text-white">Connect</p>
                  <p className="mt-1 text-xs text-slate-500">Meet creators</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-3 text-xl text-emerald-400">↗</div>
                  <p className="text-sm font-bold text-white">Grow</p>
                  <p className="mt-1 text-xs text-slate-500">Improve your skills</p>
                </div>

              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-slate-500">Made for creators</span>
                <span className="text-xs font-semibold text-cyan-300">SKILLVERSE ↗</span>
              </div>

            </div>
          </div>

          <div className="absolute -left-5 top-1/4 hidden rounded-xl border border-cyan-400/20 bg-[#101C2E]/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
            <p className="text-[10px] text-slate-400">CREATE</p>
            <p className="mt-1 text-sm font-bold text-cyan-300">Build your future</p>
          </div>

          <div className="absolute -right-4 bottom-12 hidden rounded-xl border border-indigo-400/20 bg-[#101C2E]/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
            <p className="text-[10px] text-slate-400">SHOWCASE</p>
            <p className="mt-1 text-sm font-bold text-indigo-300">Let your work speak</p>
          </div>

        </div>
      </section>

      {/* PRODUCT LOOP */}
      <section className="relative mx-auto max-w-7xl px-5 lg:px-10">

        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
            HOW IT WORKS
          </p>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            From Skill to <span className="text-cyan-400">Impact.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
            More than a profile. A complete journey to create,
            demonstrate and grow through real work.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {steps.map((item, index) => (
            <div
              key={item.step}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
            >
              <div className="absolute -right-5 -top-7 text-7xl font-black text-white/[0.025] transition-colors group-hover:text-cyan-300/[0.08]">
                {item.step}
              </div>

              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-300">
                {item.step}
              </div>

              <h3 className="mb-2 text-sm font-extrabold tracking-wider text-white">
                {item.title}
              </h3>

              <p className="text-xs leading-6 text-slate-500">
                {item.desc}
              </p>

              {index !== steps.length - 1 && (
                <div className="mt-5 hidden h-px w-full bg-gradient-to-r from-cyan-400/30 to-transparent lg:block" />
              )}
            </div>
          ))}

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative mx-auto mt-24 max-w-7xl px-5 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-blue-600/15 via-[#10192B] to-indigo-600/15 px-6 py-14 text-center sm:px-12">

          <div className="absolute left-1/2 top-0 h-40 w-2/3 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[70px]" />

          <div className="relative">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              YOUR NEXT CHAPTER STARTS HERE
            </p>

            <h2 className="mx-auto max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl">
              Don't just say what you can do.
              <span className="text-cyan-400"> Show it.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400">
              Explore real work, share your projects and let your skills
              create opportunities.
            </p>

            <button
              onClick={() => setView('feed')}
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-7 py-4 text-sm font-extrabold text-slate-950 transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-100"
            >
              Enter SKILLVERSE
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}


function FeedView({
  projects, session, searchQuery, setSearchQuery,
  selectedCategory, setSelectedCategory,
  openPublish, loading, error, refreshProjects,
  notificationProjectId, notificationProjectType,
  setNotificationProjectId, setNotificationProjectType
}) {
  const categories = [
    'All', 'Web Application', 'Data Visualization',
    'Blockchain', 'Mobile App', 'AI / Machine Learning',
    'UI / UX Design', 'Other'
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080D18] px-4 py-10 text-white sm:px-6 lg:px-10">

      {/* BACKGROUND EFFECTS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute right-0 top-96 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:55px_55px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* PAGE HEADER */}
        <section className="mb-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            THE CREATOR PROJECT NETWORK
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Discover
                <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Extraordinary Work.
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Explore projects, discover new skills and find inspiration
                from creators building things that matter.
              </p>
            </div>

            <button
              onClick={refreshProjects}
              disabled={loading}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Projects'}
            </button>
          </div>
        </section>

        {/* SEARCH PANEL */}
        <section className="mb-7 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400" />

              <input
                type="text"
                placeholder="Search projects, creators or skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#080D18]/80 py-4 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#080D18]/80 px-5 py-3 text-xs font-semibold text-slate-400">
              <FolderGit2 className="h-4 w-4 text-cyan-400" />
              PROJECT DISCOVERY
            </div>
          </div>
        </section>

        {/* CATEGORY FILTERS */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Explore Categories
            </p>
            <span className="text-[10px] text-slate-600">
              FILTER PROJECTS
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'border-cyan-400/40 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                    : 'border-white/[0.08] bg-white/[0.035] text-slate-400 hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/[0.08] p-4 text-sm text-rose-300">
            Database message: {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
            <p className="text-sm text-cyan-300">
              Loading projects from database...
            </p>
          </div>
        )}

        {/* PROJECT COUNT HEADER */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
              COMMUNITY SHOWCASE
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
              Explore Projects
            </h2>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs text-slate-400">
            <span className="font-bold text-white">{projects.length}</span>
            {' '}Projects
          </div>
        </div>

        {/* EMPTY STATE */}
        {projects.length === 0 && !loading ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] px-5 py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <FolderGit2 className="h-8 w-8 text-cyan-400" />
            </div>

            <h3 className="text-xl font-extrabold text-white">
              No Projects Found
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
              No projects match your current search or category.
              Try another filter or publish something new.
            </p>

            <button
              onClick={openPublish}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1"
            >
              Publish a Project
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* PROJECT GRID */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                session={session}
                onCreatorClick={(creatorId) => {
                  console.log('Clicked Creator ID:', creatorId);
                  setSelectedCreatorId(creatorId);
                  setView('public-profile');
                }}
                onRefresh={refreshProjects}
                notificationProjectId={notificationProjectId}
                notificationProjectType={notificationProjectType}
                setNotificationProjectId={setNotificationProjectId}
                setNotificationProjectType={setNotificationProjectType}
              />
            ))}
          </div>
        )}

        {/* BOTTOM NOTE */}
        <div className="mt-12 border-t border-white/[0.07] pt-6 text-center">
          <p className="text-xs text-slate-500">
            SKILLVERSE — Discover ideas. Explore skills. Build your universe.
          </p>
        </div>

      </div>
    </div>
  );
}

// PROJECT CARD WITH REAL LIKES AND COMMENTS
function ProjectCard({
  project,
  session,
  onCreatorClick,
  onRefresh,
  notificationProjectId,
  notificationProjectType,
  setNotificationProjectId,
  setNotificationProjectType
}) {
  const [liked, setLiked] = useState(Boolean(project.is_liked));
  const [likes, setLikes] = useState(project.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(
    project.comments_count || 0
  );

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    setLiked(Boolean(project.is_liked));
    setLikes(project.likes_count || 0);
    setCommentsCount(project.comments_count || 0);
  }, [project.id, project.is_liked, project.likes_count, project.comments_count]);

  const toggleLike = async () => {
    if (project.isSample) return;

    if (!session?.user) {
      setActionError('Please log in to like projects.');
      return;
    }

    if (!supabase || likeLoading) return;

    setActionError('');
    setLikeLoading(true);

    const previousLiked = liked;
    const previousLikes = likes;

    setLiked(!previousLiked);
    setLikes(Math.max(0, previousLikes + (previousLiked ? -1 : 1)));

    try {
      if (previousLiked) {
        const { error } = await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', project.id)
          .eq('user_id', session.user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_likes')
          .insert({
            project_id: project.id,
            user_id: session.user.id
          });

        if (error) throw error;

        // Send notification to project owner
        try {
          if (project.user_id && project.user_id !== session.user.id) {
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                recipient_id: project.user_id,
                actor_id: session.user.id,
                type: 'like',
                message: `${session.user.user_metadata?.full_name || 'Someone'} liked your project "${project.title}".`,
                entity_id: project.id
              });

            if (notificationError) {
              console.error('Like notification error:', notificationError);
            }
          }
        } catch (notificationError) {
          console.error('Like notification error:', notificationError);
        }
      }

      if (onRefresh) await onRefresh();
    } catch (error) {
      setLiked(previousLiked);
      setLikes(previousLikes);
      setActionError(error.message || 'Like could not be saved.');
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    if (project.isSample || !supabase) {
      setComments([]);
      return;
    }

    setCommentsLoading(true);
    setActionError('');

    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select('id, user_id, content, created_at')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rows = data || [];
      const userIds = [...new Set(rows.map(row => row.user_id))];
      let profileMap = {};

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profileError) throw profileError;

        profileMap = Object.fromEntries(
          (profiles || []).map(profile => [profile.id, profile])
        );
      }

      setComments(rows.map(comment => ({
        ...comment,
        author_name:
          profileMap[comment.user_id]?.full_name || 'SKILLVERSE Member',
        author_avatar:
          profileMap[comment.user_id]?.avatar_url || DEFAULT_AVATAR
      })));

      setCommentsCount(rows.length);
    } catch (error) {
      setActionError(error.message || 'Could not load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const openComments = async () => {
    if (project.isSample) {
      setActionError('Comments are not available on sample projects.');
      return;
    }

    setCommentsOpen(true);
    await loadComments();
  };
  const [notificationHighlight, setNotificationHighlight] = useState(false);

useEffect(() => {
  if (notificationProjectId !== project.id) return;

  setNotificationHighlight(true);

  if (notificationProjectType === 'comment') {
    openComments();
  }

  setNotificationProjectId(null);
  setNotificationProjectType(null);

  const timer = setTimeout(() => {
    setNotificationHighlight(false);
  }, 3000);

  return () => clearTimeout(timer);
}, [notificationProjectId, notificationProjectType, project.id]);

  const submitComment = async (e) => {
    e.preventDefault();

    if (!session?.user) {
      setActionError('Please log in to comment.');
      return;
    }

    const content = commentText.trim();
    if (!content || !supabase || commentSending) return;

    setCommentSending(true);
    setActionError('');

    try {
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: project.id,
          user_id: session.user.id,
          content
        });

      if (error) throw error;
      // Send notification to project owner
try {
  if (project.user_id && project.user_id !== session.user.id) {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: project.user_id,
        actor_id: session.user.id,
        type: 'comment',
        message: `${session.user.user_metadata?.full_name || 'Someone'} commented on your project "${project.title}".`,
        entity_id: project.id
      });

    if (notificationError) {
      console.error('Comment notification error:', notificationError);
    }
  }
} catch (notificationError) {
  console.error('Comment notification error:', notificationError);
}

      setCommentText('');
      await loadComments();
      if (onRefresh) await onRefresh();
    } catch (error) {
      setActionError(error.message || 'Comment could not be posted.');
    } finally {
      setCommentSending(false);
    }
  };

  return (
    <>
      <div className={`bg-[#131927] rounded-2xl overflow-hidden transition-all flex flex-col group ${
  notificationHighlight
    ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-[1.01]'
    : 'border border-slate-800 hover:border-slate-700'
}`}>
        <div className="relative h-48 overflow-hidden bg-slate-900">
          <img
            src={project.cover_image || DEFAULT_COVER}
            alt={project.title}
            onError={e => { e.currentTarget.src = DEFAULT_COVER; }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
            {project.proof_badge}
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <button
  type="button"
  onClick={() => {
    if (project.user_id && onCreatorClick) {
      onCreatorClick(project.user_id);
    }
  }}
  disabled={!project.user_id || !onCreatorClick}
  className="flex items-center space-x-2.5 mb-2 text-left group disabled:cursor-default"
  title="View creator profile"
>
  <img
    src={project.creator_avatar || DEFAULT_AVATAR}
    alt={project.creator_name}
    className="w-6 h-6 rounded-full object-cover group-hover:ring-2 group-hover:ring-cyan-400 transition-all"
  />
  <div className="min-w-0">
    <span className="text-xs text-slate-300 font-medium block group-hover:text-cyan-400 transition-colors">
      {project.creator_name}
    </span>
    <span className="text-[10px] text-slate-500">
      {project.creator_handle}
    </span>
  </div>
</button>

            <button
  type="button"
  onClick={() => setDetailsOpen(true)}
  className="text-left text-lg font-bold text-white mb-1.5 line-clamp-1 hover:text-cyan-400 transition-colors"
  title="View project details"
>
  {project.title}
</button>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(project.skills || []).map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium border border-slate-700/50"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLike}
                disabled={project.isSample || likeLoading}
                className={`flex items-center space-x-1.5 transition-colors disabled:opacity-60 ${
                  liked ? 'text-rose-500' : 'hover:text-rose-400'
                }`}
                title={project.isSample ? 'Sample project' : 'Like project'}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                <span>{likes}</span>
              </button>

              <button
                onClick={openComments}
                disabled={project.isSample}
                className="flex items-center space-x-1.5 hover:text-cyan-400 transition-colors disabled:opacity-60"
                title="View comments"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{commentsCount}</span>
              </button>
            </div>

            {project.external_url && project.external_url !== '#' && (
              <a
                href={project.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold"
              >
                <span>Live Demo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {actionError && !commentsOpen && (
            <p className="text-xs text-rose-400">{actionError}</p>
          )}

          {project.isSample && (
            <p className="text-[10px] text-amber-400/80">
              Sample content — not a community submission
            </p>
          )}
        </div>
      </div>


{detailsOpen && (
  <div
    className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={() => setDetailsOpen(false)}
  >
    <div
      className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#131927] border border-slate-700 rounded-2xl shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="relative h-56 sm:h-72 bg-slate-900">
        <img
          src={project.cover_image || DEFAULT_COVER}
          alt={project.title}
          onError={e => {
            e.currentTarget.src = DEFAULT_COVER;
          }}
          className="w-full h-full object-cover"
        />

        <button
          type="button"
          onClick={() => setDetailsOpen(false)}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-3">
          <img
            src={project.creator_avatar || DEFAULT_AVATAR}
            alt={project.creator_name || 'Creator'}
            onError={e => {
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
            className="w-11 h-11 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-white">
              {project.creator_name || 'SKILLVERSE Member'}
            </p>
            <p className="text-xs text-slate-500">
              {project.creator_handle || '@member'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-cyan-400 font-semibold uppercase mb-2">
            {project.category || 'Community Project'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white break-words">
            {project.title}
          </h2>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
  <span className="text-cyan-400">Published:</span>
  <span>
    {project.created_at
      ? new Date(project.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Date unavailable'}
  </span>
</div>
          <h3 className="text-sm font-bold text-white mb-2">
            About this project
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
            {project.description || 'No project description provided.'}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white mb-3">
            Skills & Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {(project.skills || []).length > 0 ? (
              project.skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-500">No skills listed.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
          {project.external_url && project.external_url !== '#' && (
            <a
              href={project.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold"
            >
              Open Live Project
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      {commentsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-[#131927] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Project Comments</h3>
                <p className="text-xs text-slate-400 mt-1">{project.title}</p>
              </div>

              <button
                onClick={() => {
                  setCommentsOpen(false);
                  setActionError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {actionError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                  {actionError}
                </p>
              )}

              {commentsLoading ? (
                <p className="text-center text-cyan-400 text-sm py-8">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="w-9 h-9 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No comments yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Start the conversation.
                  </p>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <img
                      src={comment.author_avatar}
                      alt={comment.author_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />

                    <div className="flex-1 min-w-0 bg-[#0B0F19] border border-slate-800 rounded-xl p-3">
                      <div className="text-xs font-semibold text-cyan-300 mb-1">
                        {comment.author_name}
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={submitComment}
              className="p-4 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                maxLength={1000}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={session?.user ? 'Write a comment...' : 'Log in to comment'}
                disabled={!session?.user || commentSending}
                className="flex-1 min-w-0 bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!session?.user || !commentText.trim() || commentSending}
                className="p-3 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Post comment"
              >
                {commentSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


// COMMUNITY SKILL GRAPH — LIVE PUBLISHED PROJECTS
function SkillGraphView({ projects = [] }) {
  // Only real projects are used. Demo/sample cards are intentionally excluded.
  const communityProjects = projects.filter(
    project =>
      !project.isSample &&
      Array.isArray(project.skills) &&
      project.skills.length > 0
  );

  const creatorMap = communityProjects.reduce((map, project) => {
    const creatorId = project.user_id || project.creator_handle || project.creator_name;

    if (!map[creatorId]) {
      map[creatorId] = {
        id: creatorId,
        name: project.creator_name || 'SKILLVERSE Member',
        handle: project.creator_handle || '@member',
        avatar: project.creator_avatar || DEFAULT_AVATAR,
        projects: []
      };
    }

    map[creatorId].projects.push(project);
    return map;
  }, {});

  const creators = Object.values(creatorMap).sort(
    (a, b) => b.projects.length - a.projects.length
  );

  const skillCounts = communityProjects
    .flatMap(project => project.skills)
    .reduce((counts, skill) => {
      const cleanSkill = String(skill || '').trim();
      if (cleanSkill) counts[cleanSkill] = (counts[cleanSkill] || 0) + 1;
      return counts;
    }, {});

  const popularSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const totalSkills = popularSkills.length;
  const totalCreators = creators.length;
  const totalProjects = communityProjects.length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080D18] px-4 py-10 text-white sm:px-6 lg:px-10">

      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute -right-40 top-96 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:55px_55px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* HERO */}
        <section className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            LIVE COMMUNITY NETWORK
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Community
            <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Skill Graph.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            A living network of creators, skills and real projects.
            Discover the talent behind the work and the skills that connect them.
          </p>
        </section>

        {/* REAL DATABASE STATS */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="group relative overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/[0.12] to-transparent p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Creators</p>
              <p className="mt-3 text-4xl font-black text-white">{totalCreators}</p>
              <p className="mt-2 text-xs text-slate-400">With published projects</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.12] to-transparent p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Projects</p>
              <p className="mt-3 text-4xl font-black text-white">{totalProjects}</p>
              <p className="mt-2 text-xs text-slate-400">Real community evidence</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/[0.12] to-transparent p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/40">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-500/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-300">Unique Skills</p>
              <p className="mt-3 text-4xl font-black text-white">{totalSkills}</p>
              <p className="mt-2 text-xs text-slate-400">Found across published work</p>
            </div>
          </div>
        </section>

        {/* SHARED SKILL NETWORK */}
        <section className="mb-10 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                SKILL INTELLIGENCE
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
                Shared Skill Network
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Skills appearing across real community projects.
              </p>
            </div>

            <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-300">
              LIVE DATA
            </span>
          </div>

          {popularSkills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {popularSkills.map(([skill, count], index) => (
                <div
                  key={skill}
                  className="group flex items-center gap-3 rounded-xl border border-purple-400/15 bg-[#0B1220] px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-cyan-400/[0.05]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-xs font-black text-cyan-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">{skill}</span>
                  <span className="rounded-full border border-purple-400/15 bg-purple-400/10 px-2.5 py-1 text-[10px] font-bold text-purple-300">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-[#0B1220] py-10 text-center">
              <Users className="mx-auto mb-3 h-9 w-9 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No community skills yet</p>
              <p className="mt-2 text-xs text-slate-500">
                Published projects with skills will appear here.
              </p>
            </div>
          )}
        </section>

        {/* CREATOR NETWORK */}
        <section className="mb-10">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400">
                PEOPLE BEHIND THE PROJECTS
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                Creator Network
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Creators connected through their published work.
              </p>
            </div>
            <span className="w-fit rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs text-slate-400">
              {totalCreators} creators
            </span>
          </div>

          {creators.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {creators.map(creator => {
                const creatorSkills = [
                  ...new Set(creator.projects.flatMap(project => project.skills))
                ];

                return (
                  <article
                    key={creator.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.055]"
                  >
                    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-500/[0.07] blur-3xl transition-all group-hover:bg-cyan-400/10" />

                    <div className="relative">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px]">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            onError={e => { e.currentTarget.src = DEFAULT_AVATAR; }}
                            className="h-12 w-12 rounded-full border-2 border-[#080D18] object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-white">
                            {creator.name}
                          </h3>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {creator.handle}
                          </p>
                        </div>

                        <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
                      </div>

                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.06] bg-[#080D18]/70 p-3">
                          <p className="text-lg font-extrabold text-cyan-300">
                            {creator.projects.length}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                            Projects
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-[#080D18]/70 p-3">
                          <p className="text-lg font-extrabold text-purple-300">
                            {creatorSkills.length}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                            Skills
                          </p>
                        </div>
                      </div>

                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                        SKILLS & EXPERTISE
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {creatorSkills.slice(0, 6).map(skill => (
                          <span
                            key={skill}
                            className="rounded-lg border border-blue-400/10 bg-blue-400/[0.07] px-2.5 py-1.5 text-[10px] font-medium text-blue-200"
                          >
                            {skill}
                          </span>
                        ))}

                        {creatorSkills.length > 6 && (
                          <span className="rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-slate-500">
                            +{creatorSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] py-12 text-center">
              <Users className="mx-auto mb-3 h-9 w-9 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">
                No published creators to display
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Be the first to publish a project with skills.
              </p>
            </div>
          )}
        </section>

        {/* PROJECT EVIDENCE */}
        <section>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                PROOF OF SKILL
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                Project Evidence
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Real published projects connected to creator skills.
              </p>
            </div>

            <span className="w-fit rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs text-slate-400">
              {totalProjects} projects
            </span>
          </div>

          {communityProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {communityProjects.slice(0, 12).map(project => (
                <article
                  key={project.id}
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        {project.category}
                      </p>
                      <h3 className="break-words text-base font-bold text-white transition-colors group-hover:text-cyan-300">
                        {project.title}
                      </h3>
                    </div>

                    <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] p-3">
                      <FolderGit2 className="h-5 w-5 text-cyan-300" />
                    </div>
                  </div>

                  <p className="mb-4 line-clamp-2 text-xs leading-6 text-slate-400">
                    {project.description}
                  </p>

                  <div className="mb-4 flex min-w-0 items-center gap-2 border-t border-white/[0.06] pt-4">
                    <img
                      src={project.creator_avatar || DEFAULT_AVATAR}
                      alt={project.creator_name || 'Creator'}
                      onError={e => { e.currentTarget.src = DEFAULT_AVATAR; }}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <span className="truncate text-xs font-semibold text-slate-300">
                      {project.creator_name || 'SKILLVERSE Member'}
                    </span>
                    <span className="truncate text-[10px] text-slate-500">
                      {project.creator_handle || '@member'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill, index) => (
                      <span
                        key={`${project.id}-${skill}-${index}`}
                        className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-cyan-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] py-12 text-center">
              <FolderGit2 className="mx-auto mb-3 h-9 w-9 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">
                No project evidence yet
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Community projects with skills will appear here.
              </p>
            </div>
          )}

          {communityProjects.length > 12 && (
            <p className="mt-5 text-center text-xs text-slate-500">
              Showing 12 of {communityProjects.length} published projects.
              Explore Discover to view the full project feed.
            </p>
          )}
        </section>

        {/* DATA NOTE */}
        <div className="mt-12 border-t border-white/[0.07] pt-6 text-center">
          <p className="text-xs text-slate-500">
            SKILLVERSE — Real creator skills. Real project evidence. No sample data.
          </p>
        </div>

      </div>
    </div>
  );
}

function ChallengesView({
  session,
  notificationChallengeId,
  setNotificationChallengeId
}) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [submissionChallenge, setSubmissionChallenge] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Frontend',
    difficulty: 'beginner',
    ends_at: ''
  });

  const [submission, setSubmission] = useState({
    title: '',
    description: '',
    project_url: ''
  });

  const user = session?.user;

  const loadChallenges = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (challengeError) throw challengeError;

      const rows = data || [];
      const ids = rows.map(item => item.id);

      let participants = [];
      let submissions = [];
      let profiles = {};

      if (ids.length) {
        const [participantResult, submissionResult] = await Promise.all([
          supabase
            .from('challenge_participants')
            .select('*')
            .in('challenge_id', ids),

          supabase
            .from('challenge_submissions')
            .select('*')
            .in('challenge_id', ids)
        ]);

        if (participantResult.error) throw participantResult.error;
        if (submissionResult.error) throw submissionResult.error;

        participants = participantResult.data || [];
        submissions = submissionResult.data || [];

        const userIds = [
          ...new Set([
            ...rows.map(item => item.created_by),
            ...participants.map(item => item.user_id),
            ...submissions.map(item => item.user_id)
          ].filter(Boolean))
        ];

        if (userIds.length && user) {
          const { data: profileRows, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', userIds);

          if (profileError) throw profileError;

          profiles = Object.fromEntries(
            (profileRows || []).map(item => [item.id, item])
          );
        }
      }

      setChallenges(rows.map(challenge => ({
        ...challenge,
        creator: profiles[challenge.created_by] || null,
        participants: participants
          .filter(item => item.challenge_id === challenge.id)
          .map(item => ({
            ...item,
            profile: profiles[item.user_id] || null
          })),
        submissions: submissions
          .filter(item => item.challenge_id === challenge.id)
          .map(item => ({
            ...item,
            profile: profiles[item.user_id] || null
          }))
      })));
    } catch (err) {
      console.error('Challenge loading error:', err);
      setError(err.message || 'Could not load challenges.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  useEffect(() => {
    if (!notificationChallengeId || !challenges.length) return;

    const challengeExists = challenges.some(
      challenge => challenge.id === notificationChallengeId
    );

    if (challengeExists) {
      setDetailsId(notificationChallengeId);
      setNotificationChallengeId(null);
    }
  }, [notificationChallengeId, challenges, setNotificationChallengeId]);

  const createChallenge = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!user) {
      setError('Please log in to create a challenge.');
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('challenges')
        .insert({
          created_by: user.id,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          difficulty: form.difficulty,
          ends_at: form.ends_at
            ? new Date(form.ends_at).toISOString()
            : null,
          status: 'published'
        });

      if (error) throw error;

      setForm({
        title: '',
        description: '',
        category: 'Frontend',
        difficulty: 'beginner',
        ends_at: ''
      });

      setCreateOpen(false);
      setMessage('Challenge published successfully!');
      await loadChallenges();
    } catch (err) {
      setError(err.message || 'Could not create challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  const joinChallenge = async (challenge) => {
    setError('');
    setMessage('');

    if (!user) {
      setError('Please log in before joining a challenge.');
      return;
    }

    if (challenge.participants.some(item => item.user_id === user.id)) {
      setMessage('You have already joined this challenge.');
      return;
    }

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          status: 'joined'
        });

      if (error) throw error;

      try {
        if (challenge.created_by && challenge.created_by !== user.id) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              recipient_id: challenge.created_by,
              actor_id: user.id,
              type: 'challenge_join',
              message: `${user.user_metadata?.full_name || 'Someone'} joined your challenge "${challenge.title}".`,
              entity_id: challenge.id
            });

          if (notificationError) {
            console.error('Challenge join notification error:', notificationError);
          }
        }
      } catch (notificationError) {
        console.error('Challenge join notification error:', notificationError);
      }

      setMessage('You successfully joined the challenge!');
      await loadChallenges();
    } catch (err) {
      setError(err.message || 'Could not join challenge.');
    }
  };

  const openSubmission = (challenge) => {
    const existing = challenge.submissions.find(
      item => item.user_id === user?.id
    );

    setSubmission({
      title: existing?.title || '',
      description: existing?.description || '',
      project_url: existing?.project_url || ''
    });

    setSubmissionChallenge(challenge);
    setError('');
  };

  const submitProject = async (event) => {
    event.preventDefault();

    if (!user || !submissionChallenge) return;

    setError('');
    setMessage('');

    const challenge = submissionChallenge;

    const participant = challenge.participants.find(
      item => item.user_id === user.id
    );

    if (!participant) {
      setError('Join the challenge before submitting your project.');
      return;
    }

    if (
      !submission.title.trim() ||
      !submission.description.trim() ||
      !submission.project_url.trim()
    ) {
      setError('Please complete all submission fields.');
      return;
    }

    try {
      setSubmitting(true);

      const existing = challenge.submissions.find(
        item => item.user_id === user.id
      );

      const payload = {
        challenge_id: challenge.id,
        user_id: user.id,
        title: submission.title.trim(),
        description: submission.description.trim(),
        project_url: submission.project_url.trim()
      };

      const result = existing
        ? await supabase
            .from('challenge_submissions')
            .update(payload)
            .eq('id', existing.id)
        : await supabase
            .from('challenge_submissions')
            .insert(payload);

      if (result.error) throw result.error;

      const { error: participantError } = await supabase
        .from('challenge_participants')
        .update({ status: 'submitted' })
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      try {
        if (challenge.created_by && challenge.created_by !== user.id) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              recipient_id: challenge.created_by,
              actor_id: user.id,
              type: 'submission',
              message: `${user.user_metadata?.full_name || 'Someone'} submitted a project for your challenge "${challenge.title}".`,
              entity_id: challenge.id
            });

          if (notificationError) {
            console.error('Submission notification error:', notificationError);
          }
        }
      } catch (notificationError) {
        console.error('Submission notification error:', notificationError);
      }

      setSubmissionChallenge(null);
      setSubmission({
        title: '',
        description: '',
        project_url: ''
      });

      setMessage('Your project submission has been saved!');
      await loadChallenges();
    } catch (err) {
      setError(err.message || 'Submission could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectWinner = async (challenge, participant) => {
    if (!user || challenge.created_by !== user.id) {
      setError('Only the challenge creator can select a winner.');
      return;
    }

    const confirmed = window.confirm(
      'Select this participant as the challenge winner?'
    );

    if (!confirmed) return;

    try {
      setError('');

      const { error: resetError } = await supabase
        .from('challenge_participants')
        .update({ status: 'submitted' })
        .eq('challenge_id', challenge.id)
        .eq('status', 'winner');

      if (resetError) throw resetError;

      const { error } = await supabase
        .from('challenge_participants')
        .update({ status: 'winner' })
        .eq('challenge_id', challenge.id)
        .eq('user_id', participant.user_id);

      if (error) throw error;

      setMessage('Challenge winner selected successfully!');
      await loadChallenges();
    } catch (err) {
      setError(err.message || 'Could not select winner.');
    }
  };

  const inputStyle = "w-full rounded-xl border border-slate-700 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080d18] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-80 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.035]" style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.5) 1px, transparent 1px)',
          backgroundSize: '42px 42px'
        }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
              <Zap className="h-3.5 w-3.5" />
              Real Community Challenges
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Live
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Community
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Challenges.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
              Build something real. Submit your work. Show what you can do.
              Turn your skills into projects and your projects into proof.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadChallenges}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => {
                if (!user) {
                  setError('Please log in to create a challenge.');
                  return;
                }
                setCreateOpen(true);
                setError('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:shadow-cyan-500/20"
            >
              <PlusCircle className="h-4 w-4" />
              Create Challenge
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-500">Available challenges</p>
            <p className="mt-2 text-3xl font-black text-white">{challenges.length}</p>
            <p className="mt-1 text-xs text-slate-500">Published by the community</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-500">Total participants</p>
            <p className="mt-2 text-3xl font-black text-cyan-300">
              {challenges.reduce((sum, item) => sum + item.participants.length, 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Creators taking part</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs text-slate-500">Projects submitted</p>
            <p className="mt-2 text-3xl font-black text-blue-300">
              {challenges.reduce((sum, item) => sum + item.submissions.length, 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Real community work</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 py-24 text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm text-slate-400">Loading community challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
              <Zap className="h-8 w-8 text-cyan-300" />
            </div>
            <h3 className="text-xl font-bold">No Challenges Yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Be the first person to create a community challenge and invite others to build something meaningful.
            </p>
            <button
              onClick={() => {
                if (!user) {
                  setError('Please log in to create a challenge.');
                  return;
                }
                setCreateOpen(true);
              }}
              className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Create the first challenge
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {challenges.map(challenge => {
              const joined = challenge.participants.some(
                item => item.user_id === user?.id
              );

              const mySubmission = challenge.submissions.find(
                item => item.user_id === user?.id
              );

              const isCreator = challenge.created_by === user?.id;
              const detailsOpen = detailsId === challenge.id;

              return (
                <article
                  key={challenge.id}
                  className="group overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-[#0b1220] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-2xl hover:shadow-cyan-950/20"
                >
                  <div className="p-5 sm:p-7">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                            {challenge.category || 'General'}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                            {challenge.difficulty || 'beginner'}
                          </span>
                          {mySubmission && (
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                              Submitted
                            </span>
                          )}
                          {isCreator && (
                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                              Your challenge
                            </span>
                          )}
                        </div>

                        <h2 className="break-words text-2xl font-bold tracking-tight text-white transition group-hover:text-cyan-100">
                          {challenge.title}
                        </h2>

                        <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-slate-400">
                          {challenge.description}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-2">
                            <Users className="h-4 w-4 text-cyan-400" />
                            {challenge.participants.length} participants
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <FolderGit2 className="h-4 w-4 text-blue-400" />
                            {challenge.submissions.length} submissions
                          </span>
                          {challenge.ends_at && (
                            <span className="inline-flex items-center gap-2">
                              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                              Deadline: {new Date(challenge.ends_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-[230px] xl:justify-end">
                        {!joined && !isCreator && (
                          <button
                            onClick={() => joinChallenge(challenge)}
                            className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
                          >
                            Join Challenge
                          </button>
                        )}

                        {joined && (
                          <button
                            onClick={() => openSubmission(challenge)}
                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
                          >
                            {mySubmission ? 'Update Submission' : 'Submit Project'}
                          </button>
                        )}

                        <button
                          onClick={() => setDetailsId(detailsOpen ? null : challenge.id)}
                          className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300"
                        >
                          {detailsOpen ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </div>

                    {detailsOpen && (
                      <div className="mt-7 grid gap-6 border-t border-slate-800 pt-6 lg:grid-cols-2">
                        <div>
                          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                            <Users className="h-4 w-4 text-cyan-400" />
                            Participants
                          </h3>

                          {challenge.participants.length === 0 ? (
                            <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-500">
                              No one has joined yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {challenge.participants.map(participant => (
                                <div
                                  key={participant.id}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-200">
                                      {participant.profile?.full_name || 'SKILLVERSE Member'}
                                    </p>
                                    <p className="mt-1 text-[11px] capitalize text-slate-500">
                                      {participant.status}
                                    </p>
                                  </div>

                                  {isCreator && participant.status === 'submitted' && (
                                    <button
                                      onClick={() => selectWinner(challenge, participant)}
                                      className="shrink-0 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[11px] font-bold text-amber-300 hover:bg-amber-400/20"
                                    >
                                      Select Winner
                                    </button>
                                  )}

                                  {participant.status === 'winner' && (
                                    <span className="shrink-0 text-xs font-bold text-amber-300">
                                      <Trophy className="mr-1 inline h-4 w-4" />
                                      Winner
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                            <FolderGit2 className="h-4 w-4 text-blue-400" />
                            Project Submissions
                          </h3>

                          {challenge.submissions.length === 0 ? (
                            <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-500">
                              No submissions yet.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {challenge.submissions.map(item => (
                                <div
                                  key={item.id}
                                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                                >
                                  <h4 className="break-words text-sm font-bold text-white">
                                    {item.title}
                                  </h4>
                                  <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-400">
                                    {item.description}
                                  </p>
                                  <a
                                    href={item.project_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                                  >
                                    Open Project
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center">
          <p className="text-xs leading-6 text-slate-500">
            SKILLVERSE Community Challenges — Build your skills, collaborate with creators and prove your potential through real work.
          </p>
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-[#101827] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Community workspace
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">Create Challenge</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={createChallenge} className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Challenge Title
                </label>
                <input
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className={inputStyle}
                  placeholder="e.g. Build a portfolio website"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={3000}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className={inputStyle}
                  placeholder="Explain the challenge and what participants need to build..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className={inputStyle}
                  >
                    <option>Frontend</option>
                    <option>Backend</option>
                    <option>Fullstack</option>
                    <option>UI / UX Design</option>
                    <option>Data Science</option>
                    <option>Mobile Development</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-300">
                    Difficulty
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm({ ...form, difficulty: e.target.value })}
                    className={inputStyle}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Submission Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={e => setForm({ ...form, ends_at: e.target.value })}
                  className={inputStyle}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {submissionChallenge && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-[#101827] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Challenge workspace
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">Submit Your Project</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {submissionChallenge.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmissionChallenge(null)}
                className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitProject} className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Project Title
                </label>
                <input
                  required
                  maxLength={120}
                  value={submission.title}
                  onChange={e => setSubmission({ ...submission, title: e.target.value })}
                  placeholder="Project title"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Project Description
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={submission.description}
                  onChange={e => setSubmission({ ...submission, description: e.target.value })}
                  placeholder="Describe your project..."
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Project URL
                </label>
                <input
                  required
                  type="url"
                  value={submission.project_url}
                  onChange={e => setSubmission({ ...submission, project_url: e.target.value })}
                  placeholder="https://your-project-link.com"
                  className={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


// USER PROFILE + EDIT PROFILE
// PUBLIC CREATOR PROFILE
function PublicProfileView({ creatorId, projects = [], setView }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCreatorProfile() {
      if (!creatorId) {
        setError('Creator not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, bio, avatar_url')
        .eq('id', creatorId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setError('Unable to load this creator profile.');
        setProfile(null);
      } else if (!data) {
        setError('This creator profile is not available.');
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    loadCreatorProfile();

    return () => {
      active = false;
    };
  }, [creatorId]);

  const creatorProjects = projects.filter(
    project =>
      project.user_id === creatorId &&
      !project.isSample
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-cyan-400">
        Loading creator profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <p className="text-rose-400 mb-5">
          {error || 'Profile unavailable.'}
        </p>
        <button
          onClick={() => setView('feed')}
          className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button
        onClick={() => setView('feed')}
        className="mb-8 text-sm text-cyan-400 hover:text-cyan-300"
      >
        ← Back to Feed
      </button>

      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-7 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <img
            src={profile.avatar_url || DEFAULT_AVATAR}
            alt={profile.full_name || 'Creator'}
            className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500/40"
          />

          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">
              {profile.full_name || 'Creator'}
            </h1>

            <p className="text-sm text-cyan-400 mt-1">
              @{profile.username || 'creator'}
            </p>

            <p className="text-sm text-slate-400 mt-4 max-w-2xl">
              {profile.bio || 'No bio added yet.'}
            </p>

            <p className="text-xs text-slate-500 mt-4">
              {creatorProjects.length} published projects
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">
          Published Projects
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Projects created by this member
        </p>
      </div>

      {creatorProjects.length === 0 ? (
        <div className="bg-[#131927] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          No published projects yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creatorProjects.map(project => (
            <div
              key={project.id}
              className="bg-[#131927] border border-slate-800 rounded-xl overflow-hidden"
            >
              <img
                src={project.cover_image || DEFAULT_COVER}
                alt={project.title}
                className="w-full h-44 object-cover"
              />

              <div className="p-5">
                <h3 className="text-white font-bold">
                  {project.title}
                </h3>

                <p className="text-sm text-slate-400 mt-2 line-clamp-3">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {(project.skills || []).map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="text-xs px-2 py-1 rounded bg-slate-800 text-cyan-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {project.external_url && (
                  <a
                    href={project.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-5 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    Open Live Project →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function ProfileView({
  projects,
  session,
  setView,
  refreshProjects,
  onAvatarChange,
  avatarUploading,
  avatarError,
  avatarMessage,
  onProfileSave,
  profileSaving,
  profileSaveError,
  profileSaveMessage
}) {
  const user = session?.user;

  const [profile, setProfile] = useState({
    full_name: user?.user_metadata?.full_name || '',
    username: user?.user_metadata?.username || '',
    bio: user?.user_metadata?.bio || '',
    avatar_url: user?.user_metadata?.avatar_url || ''
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [localError, setLocalError] = useState('');

  const myProjects = projects.filter(
    project =>
      !project.isSample &&
      project.user_id === user?.id
  );

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user?.id || !supabase) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, username, bio, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (active && data) {
          setProfile({
            full_name: data.full_name || user.user_metadata?.full_name || '',
            username: data.username || user.user_metadata?.username || '',
            bio: data.bio || user.user_metadata?.bio || '',
            avatar_url: data.avatar_url || user.user_metadata?.avatar_url || ''
          });
        }
      } catch (error) {
        console.error('Profile load error:', error);
        if (active) setLocalError(error.message);
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id, user?.user_metadata?.full_name, user?.user_metadata?.username]);

  const avatarUrl =
    profile.avatar_url ||
    user?.user_metadata?.avatar_url ||
    DEFAULT_AVATAR;

  const openEditProfile = () => {
    setEditName(profile.full_name || '');
    setEditUsername(profile.username || '');
    setEditBio(profile.bio || '');
    setLocalError('');
    setEditOpen(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (file && onAvatarChange) {
      onAvatarChange(file);

      const reader = new FileReader();
      reader.onload = () => {
        setProfile(current => ({
          ...current,
          avatar_url: String(reader.result)
        }));
      };
      reader.readAsDataURL(file);
    }

    event.target.value = '';
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setLocalError('');

    const username = editUsername.trim().toLowerCase().replace(/^@/, '');

    if (!editName.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setLocalError(
        'Username must be 3–20 characters. Use only letters, numbers or underscores.'
      );
      return;
    }

    if (editBio.trim().length > 160) {
      setLocalError('Bio must be 160 characters or less.');
      return;
    }

    const success = await onProfileSave({
      full_name: editName,
      username,
      bio: editBio
    });

    if (success) {
      setProfile(current => ({
        ...current,
        full_name: editName.trim(),
        username,
        bio: editBio.trim()
      }));
      setEditOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-[#131927] border border-slate-800 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center space-y-5 md:space-y-0 md:space-x-6 text-center md:text-left">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group">
            <img
              src={avatarUrl}
              alt="Profile"
              onError={e => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
              className="w-24 h-24 rounded-full border-2 border-cyan-400 object-cover"
            />

            <label
              htmlFor="skillverse-avatar-upload"
              title="Choose photo from Gallery"
              className={`absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                avatarUploading ? 'opacity-100 cursor-wait' : ''
              }`}
            >
              {avatarUploading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] mt-1 font-semibold">Change</span>
                </>
              )}
            </label>

            <input
              id="skillverse-avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={avatarUploading}
              className="hidden"
            />
          </div>

          <label
            htmlFor="skillverse-avatar-upload"
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/10 cursor-pointer ${
              avatarUploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {avatarUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Image className="w-3.5 h-3.5" />
                Choose from Gallery
              </>
            )}
          </label>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">
            {profile.full_name || 'My Profile'}
          </h1>

          <p className="text-sm text-cyan-400 font-semibold mt-1">
            {profile.username ? `@${profile.username}` : 'Username not set'}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            {user?.email || 'SKILLVERSE Member'}
          </p>

          <p className="text-sm text-slate-300 mt-3 max-w-xl leading-relaxed">
            {profile.bio || 'Build your profile by publishing projects and sharing your skills.'}
          </p>

          <p className="text-[10px] text-slate-500 mt-3">
            JPG, PNG, WEBP or other image formats • Maximum 5 MB
          </p>

          {avatarUploading && (
            <p className="text-xs text-cyan-400 mt-3">
              Uploading your photo to SKILLVERSE...
            </p>
          )}

          {avatarMessage && (
            <p className="text-xs text-emerald-400 mt-3">
              {avatarMessage}
            </p>
          )}

          {avatarError && (
            <p className="text-xs text-rose-400 mt-3">
              {avatarError}
            </p>
          )}

          <button
            onClick={openEditProfile}
            disabled={!user || profileLoading}
            className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">My Published Projects</h2>
        <button
          onClick={() => setView('feed')}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          Discover projects
        </button>
      </div>

      {myProjects.length === 0 ? (
        <div className="text-center py-12 bg-[#131927] border border-slate-800 rounded-xl">
          <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-4">
            You have not published any projects yet.
          </p>
          <button
            onClick={() => setView('feed')}
            className="text-cyan-400 text-sm font-semibold"
          >
            Explore the project feed →
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {myProjects.map(project => (
            <ProjectCard
  key={project.id}
  project={project}
  session={session}
  onRefresh={refreshProjects}

/>
          ))}
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#131927] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Update your SKILLVERSE identity.
                </p>
              </div>

              <button
                onClick={() => setEditOpen(false)}
                disabled={profileSaving}
                className="text-slate-400 hover:text-white p-1 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src={avatarUrl}
                  alt="Your profile"
                  className="w-16 h-16 rounded-full border-2 border-cyan-500 object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Profile photo
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Change it using the Gallery button on your profile.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={20}
                    value={editUsername}
                    onChange={e => setEditUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    )}
                    placeholder="your_username"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  3–20 characters. Letters, numbers and underscores only.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Bio
                </label>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tell the community about yourself..."
                  className={inputClass}
                />
                <p className="text-[10px] text-slate-500 text-right mt-1">
                  {editBio.length}/160
                </p>
              </div>

              {localError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                  {localError}
                </p>
              )}

              {profileSaveError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                  {profileSaveError}
                </p>
              )}

              {profileSaveMessage && (
                <p className="text-xs text-emerald-400">
                  {profileSaveMessage}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={profileSaving}
                  className="px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-5 py-2.5 rounded-lg text-sm disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// DATABASE INFORMATION
function SqlSchemaView() {
  const databaseTables = [
    {
      name: 'profiles',
      columns: ['id', 'username', 'full_name', 'avatar_url', 'bio', 'created_at']
    },
    {
      name: 'projects',
      columns: ['id', 'user_id', 'title', 'description', 'category', 'skills', 'project_url', 'image_url', 'status', 'created_at', 'updated_at']
    },
    {
      name: 'project_likes',
      columns: ['id', 'project_id', 'user_id', 'created_at']
    },
    {
      name: 'project_comments',
      columns: ['id', 'project_id', 'user_id', 'content', 'created_at']
    },
    {
      name: 'project_bookmarks',
      columns: ['id', 'project_id', 'user_id', 'created_at']
    },
    {
      name: 'challenges',
      columns: ['id', 'created_by', 'title', 'description', 'category', 'difficulty', 'starts_at', 'ends_at', 'status', 'created_at']
    },
    {
      name: 'challenge_participants',
      columns: ['id', 'challenge_id', 'user_id', 'status', 'joined_at']
    },
    {
      name: 'challenge_submissions',
      columns: ['id', 'challenge_id', 'user_id', 'title', 'description', 'project_url', 'submitted_at']
    },
    {
      name: 'notifications',
      columns: ['id', 'recipient_id', 'actor_id', 'type', 'message', 'entity_id', 'is_read', 'created_at'],
      note: 'Used by the in-app notification system.'
    }
  ];

  const [checks, setChecks] = useState([]);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);
  const [checkError, setCheckError] = useState('');

  const runDatabaseCheck = async () => {
    if (!supabase) {
      setCheckError('Supabase client is not configured. Check src/lib/supabaseClient.');
      return;
    }

    setChecking(true);
    setCheckError('');

    const results = await Promise.all(databaseTables.map(async (table) => {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select(table.columns.join(','), { count: 'exact', head: true });

        if (error) {
          const message = error.message || 'Database request failed.';
          const missingTable = error.code === 'PGRST205' || /table .* not found|could not find the table/i.test(message);
          const missingColumn = error.code === '42703' || /column .* does not exist|could not find the .* column/i.test(message);
          return {
            ...table,
            status: missingTable ? 'missing' : missingColumn ? 'columns' : 'blocked',
            detail: missingTable
              ? 'Table not found in the connected schema.'
              : missingColumn
                ? 'One or more expected columns do not match the database.'
                : message,
            count: null
          };
        }

        return {
          ...table,
          status: 'connected',
          detail: 'Table and listed columns are accessible.',
          count: count ?? 0
        };
      } catch (error) {
        return {
          ...table,
          status: 'blocked',
          detail: error?.message || 'Unexpected connection error.',
          count: null
        };
      }
    }));

    setChecks(results);
    setCheckedAt(new Date());
    setChecking(false);
  };

  useEffect(() => {
    runDatabaseCheck();
  }, []);

  const connectedCount = checks.filter(item => item.status === 'connected').length;
  const issueCount = checks.filter(item => item.status !== 'connected').length;

  const statusStyle = (status) => {
    if (status === 'connected') return 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20';
    if (status === 'missing') return 'text-rose-300 bg-rose-400/10 border-rose-400/20';
    if (status === 'columns') return 'text-amber-300 bg-amber-400/10 border-amber-400/20';
    return 'text-orange-300 bg-orange-400/10 border-orange-400/20';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-400" />
            <span>Supabase Database</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Live checks against the tables and columns used by SKILLVERSE.
          </p>
        </div>
        <button
          type="button"
          onClick={runDatabaseCheck}
          disabled={checking}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking database...' : 'Check again'}
        </button>
      </div>

      {checkError && (
        <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {checkError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Tables checked</p>
          <p className="text-2xl font-bold text-white mt-1">{checks.length}/{databaseTables.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <p className="text-xs text-emerald-200/70">Accessible tables</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{connectedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Needs attention</p>
          <p className="text-2xl font-bold text-white mt-1">{issueCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-white">Table verification</h2>
          <span className="text-[11px] text-slate-500">
            {checkedAt ? `Last checked ${checkedAt.toLocaleTimeString()}` : 'Waiting for first check'}
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {databaseTables.map(table => {
            const result = checks.find(item => item.name === table.name);
            return (
              <div key={table.name} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-200 font-mono">{table.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 break-words">{table.columns.join(' · ')}</p>
                    {table.note && <p className="text-[11px] text-slate-500 mt-1">{table.note}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {result?.status === 'connected' && (
                      <span className="text-[11px] text-slate-400">{result.count} visible rows</span>
                    )}
                    <span className={`text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border ${statusStyle(result?.status)}`}>
                      {checking && !result ? 'Checking' : result?.status || 'Pending'}
                    </span>
                  </div>
                </div>
                {result && result.status !== 'connected' && (
                  <p className="text-xs text-amber-200/90 mt-2">{result.detail}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
        <p className="text-xs text-amber-100 font-semibold mb-1">Important</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          “Accessible” means Supabase accepted a read request for the listed columns. The row count is what the current user can see under Row Level Security (RLS), not necessarily the total database count. This check does not change your database, create tables, or modify security policies.
        </p>
      </div>
    </div>
  );
}

function Notifications({
  session,
  setView,
  setNotificationChallengeId,
  setNotificationProjectId,
  setNotificationProjectType
}) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    let active = true;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Notifications loading error:', error);
      } else if (active) {
        setNotifications(data || []);
      }

      if (active) setLoading(false);
    };

    loadNotifications();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          setNotifications((current) => {
            if (current.some((item) => item.id === payload.new.id)) {
              return current;
            }

            return [payload.new, ...current].slice(0, 50);
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('recipient_id', userId);

    if (error) {
      console.error('Mark read error:', error);
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  };

  const markAllRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all read error:', error);
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true }))
    );
  };
 const handleNotificationClick = async (item) => {
  await markAsRead(item.id);
  setOpen(false);

  // Challenge notifications
  if (
    (item.type === 'challenge_join' ||
      item.type === 'submission') &&
    item.entity_id
  ) {
    setView('challenges');
    setNotificationChallengeId(item.entity_id);
    return;
  }

  // Project like and comment notifications
  if (
    (item.type === 'like' ||
      item.type === 'comment') &&
    item.entity_id
  ) {
    setView('feed');
    setNotificationProjectId(item.entity_id);
    setNotificationProjectType(item.type);
  }
};
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-all"
        title="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4.5-5.8V4a1.5 1.5 0 00-3 0v1.2A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold border-2 border-[#080d18]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-12 z-50 w-[340px] max-w-[90vw] bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Notifications
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {unreadCount} unread notifications
                </p>
              </div>

              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-40"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-300">
                    No notifications yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Your updates will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full text-left p-4 flex gap-3 border-b border-slate-800/70 hover:bg-slate-800/60 transition-colors ${
                      !item.is_read ? 'bg-cyan-500/5' : ''
                    }`}
                  >
                    <div className="w-9 h-9 shrink-0 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                      {item.type === 'like'
                        ? '♥'
                        : item.type === 'comment'
                        ? 'C'
                        : item.type === 'submission'
                        ? 'S'
                        : '✦'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {item.message ||
                          item.content ||
                          (item.type === 'like'
                            ? 'Someone liked your project.'
                            : item.type === 'comment'
                            ? 'Someone commented on your project.'
                            : item.type === 'challenge_join'
                            ? 'Someone joined your challenge.'
                            : item.type === 'submission'
                            ? 'A new challenge submission is available.'
                            : 'You have a new notification.')}
                      </p>

                      <p className="text-[10px] text-slate-500 mt-2">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : ''}
                      </p>
                    </div>

                    {!item.is_read && (
                      <span className="w-2 h-2 mt-1 rounded-full bg-cyan-400 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
