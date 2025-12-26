'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PROJECT_TYPES = ['호텔', '펜션', '캠핑', 'F&B', '기타'] as const;

const PROVINCES = [
  '강원특별자치도',
  '경기도',
  '경상남도',
  '경상북도',
  '광주광역시',
  '대구광역시',
  '대전광역시',
  '부산광역시',
  '서울특별시',
  '세종특별자치시',
  '울산광역시',
  '인천광역시',
  '전라남도',
  '전라북도',
  '제주특별자치도',
  '충청남도',
  '충청북도',
] as const;

export default function NewProjectPage() {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<string>('호텔');
  const [province, setProvince] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!province) {
      setError('시를 선택해주세요');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          projectType,
          province,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project');
      }

      router.push('/dashboard/projects');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <div className="mb-8">
          <Link
            href="/dashboard/projects"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← 프로젝트 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">새 프로젝트 생성</h1>
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
              프로젝트명 (호텔명)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 그랜드 호텔"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="projectType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              업종
            </label>
            <select
              id="projectType"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label
              htmlFor="province"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              시
            </label>
            <select
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택하세요</option>
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '프로젝트 생성'}
            </button>
            <Link
              href="/dashboard/projects"
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
