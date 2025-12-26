'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, UserRole } from '@/types/database';

export default function NewAccountPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('kiosk');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create auth user using service role (via API route)
      const response = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          projectId: role === 'super_admin' ? null : projectId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      router.push('/dashboard/accounts');
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
            href="/dashboard/accounts"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← 계정 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">새 계정 생성</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="최소 6자"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              이름
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="홍길동"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              역할
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isSuperAdmin && (
                <>
                  <option value="super_admin">Super Admin</option>
                  <option value="project_admin">Project Admin</option>
                </>
              )}
              <option value="kiosk">Kiosk</option>
            </select>
          </div>

          {role !== 'super_admin' && (
            <div className="mb-6">
              <label
                htmlFor="project"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                프로젝트
              </label>
              {isSuperAdmin ? (
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
              ) : (
                <input
                  type="text"
                  value={
                    projects.find((p) => p.id === projectId)?.name ||
                    '현재 프로젝트'
                  }
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '계정 생성'}
            </button>
            <Link
              href="/dashboard/accounts"
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
