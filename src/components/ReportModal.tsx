'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string | undefined;
}

export default function ReportModal({ isOpen, onClose, projectId, userId }: ReportModalProps) {
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  if (!isOpen) return null;

  const handleReportSubmit = async () => {
    if (!reportReason) {
      alert('報告の理由を選択してください。');
      return;
    }
    setIsReporting(true);

    const { error } = await supabase.from('reports').insert({
      project_id: projectId,
      reason: reportReason,
      details: reportDetails,
      reported_by: userId || null,
      status: 'pending'
    });

    setIsReporting(false);

    if (error) {
      alert('報告の送信に失敗しました。時間をおいて再度お試しください。');
      console.error(error);
    } else {
      alert('管理者に報告を送信しました。ご協力ありがとうございます。');
      setReportReason('');
      setReportDetails('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-red-500">⚠️</span> 問題を報告
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          著作権侵害や、不適切・攻撃的なコンテンツが含まれている場合、管理者に報告できます。
        </p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3 mb-5">
          <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
            ※悪質な規約違反が見られる場合は、お手数ですが
            <a href={`https://scratch.mit.edu/projects/${projectId}/`} target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-600 mx-1">
              本家Scratchのページ
            </a>
            からも報告を行ってください。
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">報告の理由 <span className="text-red-500">*</span></label>
            <select 
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white text-sm"
            >
              <option value="">選択してください</option>
              <option value="copyright">著作権侵害（無断転載など）</option>
              <option value="inappropriate">不適切・暴力的な表現</option>
              <option value="spam">スパム・荒らし</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">詳細（任意）</label>
            <textarea 
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="問題の箇所や詳しい理由をご記入ください。"
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white text-sm resize-none"
            ></textarea>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button 
            onClick={handleReportSubmit}
            disabled={isReporting}
            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isReporting ? '送信中...' : '報告を送信'}
          </button>
        </div>
      </div>
    </div>
  );
}