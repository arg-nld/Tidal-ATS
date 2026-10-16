import { useState, useEffect } from 'react';
import { 
  CheckCircle2, Calendar, Clock, Video, Copy, Check, 
  ExternalLink, User, Mail, Sparkles, X, Briefcase 
} from 'lucide-react';

export function InterviewSuccessModal({
  isOpen,
  onClose,
  candidate,
  interview,
  meetingLink,
  job,
  emailSent = true
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scheduledAt = interview?.scheduledAt || candidate?.interview?.scheduledAt;
  const interviewer = interview?.interviewer || candidate?.interview?.interviewer || 'Recruiting Team';
  const effectiveMeetingLink = meetingLink || interview?.meetingLink || candidate?.interview?.meetingLink || '';
  const candidateName = candidate?.name || 'Candidate';
  const candidateEmail = candidate?.email || '';
  const jobTitle = job?.title || candidate?.role || 'Interview';

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: 'Scheduled Date', time: '' };
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return { date: dateStr, time: '' };
      return {
        date: d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  const { date, time } = formatDateTime(scheduledAt);

  const handleCopyLink = async () => {
    if (!effectiveMeetingLink) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(effectiveMeetingLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = effectiveMeetingLink;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Failed to copy meeting link to clipboard:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[75] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-success-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

        {/* Close icon button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Hero icon and header */}
        <div className="flex items-start gap-4 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={30} className="stroke-[2.2]" />
          </div>
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles size={11} /> Confirmed
              </span>
            </div>
            <h3 id="interview-success-title" className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Interview Scheduled!
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The interview invitation and schedule link have been created and dispatched to the candidate.
            </p>
          </div>
        </div>

        {/* Interview Summary Card */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 md:p-5 space-y-3.5 divide-y divide-slate-800/60">
          {/* Candidate & Role info */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                {candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{candidateName}</p>
                {candidateEmail && <p className="text-[11px] text-slate-400">{candidateEmail}</p>}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                <Briefcase size={11} /> {jobTitle}
              </span>
            </div>
          </div>

          {/* Date, Time & Interviewer */}
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Calendar size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date & Time</p>
                <p className="text-xs font-medium text-slate-200">{date}</p>
                {time && <p className="text-[11px] text-slate-400">{time}</p>}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User size={15} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Interviewer</p>
                <p className="text-xs font-medium text-slate-200">{interviewer}</p>
              </div>
            </div>
          </div>

          {/* Meeting Link Section */}
          <div className="pt-3">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
              Interview Meeting Link
            </p>
            {effectiveMeetingLink ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 truncate">
                  <Video size={16} className="text-teal-400 shrink-0" />
                  <a 
                    href={effectiveMeetingLink} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-indigo-400 hover:text-indigo-300 truncate underline underline-offset-2 flex items-center gap-1"
                    title={effectiveMeetingLink}
                  >
                    <span className="truncate">{effectiveMeetingLink}</span>
                    <ExternalLink size={12} className="shrink-0 opacity-70" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={13} className="stroke-[2.5]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 italic">
                No meeting URL provided (in-person or phone interview scheduled).
              </div>
            )}
          </div>

          {/* Email dispatch badge */}
          <div className="pt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Mail size={14} className="text-emerald-400 shrink-0" />
              <span>Notification status:</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
              emailSent 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${emailSent ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {emailSent ? 'Invitation sent to candidate' : 'Saved in ATS'}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
          {effectiveMeetingLink && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Link Copied to Clipboard' : 'Copy Meeting Link'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
