'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, Profile } from '@/types/database';

export default function NewKioskPage() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [kioskProfiles, setKioskProfiles] = useState<Profile[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user's profile via API
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const { profile } = await profileResponse.json();
          setCurrentUserRole(profile.role);
          if (profile.role === 'project_admin') {
            setProjectId(profile.project_id);
          }
        }

        // Load projects via API
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const { projects: projectsData } = await projectsResponse.json();
          setProjects(projectsData || []);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    }
    loadData();
  }, []);

  // Load kiosk profiles when project changes
  useEffect(() => {
    async function loadProfiles() {
      if (!projectId) {
        setKioskProfiles([]);
        return;
      }

      try {
        const response = await fetch(`/api/profiles?projectId=${projectId}&role=kiosk`);
        if (response.ok) {
          const { profiles } = await response.json();
          setKioskProfiles(profiles || []);
        }
      } catch (err) {
        console.error('Error loading profiles:', err);
      }
    }
    loadProfiles();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/kiosks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          location,
          projectId,
          profileId: profileId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create kiosk');
      }

      router.push('/dashboard/kiosks');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const isSuperAdmin = currentUserRole === 'super_admin';

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <div className="mb-8">
          <Link
            href="/dashboard/kiosks"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← 키오스크 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">새 키오스크 등록</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              키오스크 이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 로비 키오스크 1"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              위치
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 1층 로비"
            />
          </div>

          {isSuperAdmin && (
            <div className="mb-6">
              <label
                htmlFor="project"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                프로젝트
              </label>
              <select
                id="project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">프로젝트 선택</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="profile"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              로그인 계정 (선택)
            </label>
            <select
              id="profile"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">계정 선택 (나중에 설정)</option>
              {kioskProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.email} {profile.full_name && `(${profile.full_name})`}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              키오스크에서 로그인할 계정을 선택하세요
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '등록 중...' : '키오스크 등록'}
            </button>
            <Link
              href="/dashboard/kiosks"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
