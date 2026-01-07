'use client';

import { useState, useMemo } from 'react';

interface IssuesTabProps {
  issues: any[];
  currentScore?: number;
}

// Human-friendly category descriptions
const categoryDescriptions: Record<string, { icon: string; description: string }> = {
  'content': { icon: '📝', description: 'Content clarity and quality' },
  'structure': { icon: '🏗️', description: 'HTML structure and semantics' },
  'crawlability': { icon: '🔍', description: 'AI discovery and access' },
  'schema': { icon: '🏷️', description: 'Structured data markup' },
  'accessibility': { icon: '♿', description: 'Assistive technology support' },
  'performance': { icon: '⚡', description: 'Page speed and loading' },
  'security': { icon: '🔒', description: 'Security best practices' },
  'seo': { icon: '🎯', description: 'Search optimization' },
};

// Severity explanations for users
const severityInfo: Record<string, { label: string; description: string }> = {
  'critical': { label: '🔴 Critical', description: 'Blocks AI from understanding your content' },
  'high': { label: '🟠 High', description: 'Significantly reduces AI accuracy' },
  'medium': { label: '🟡 Medium', description: 'May cause minor misunderstandings' },
  'low': { label: '🔵 Low', description: 'Nice to fix, but not urgent' },
};

export default function IssuesTab({ issues, currentScore }: IssuesTabProps) {
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'priority' | 'category'>('priority');

  // Extract unique categories and severities
  const categories = useMemo(() => {
    return Array.from(new Set(issues.map(issue => issue.category))).sort();
  }, [issues]);

  const severities = ['critical', 'high', 'medium', 'low'];

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Severity filter
      if (severityFilter.length > 0 && !severityFilter.includes(issue.severity)) {
        return false;
      }
      
      // Category filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(issue.category)) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          issue.message.toLowerCase().includes(query) ||
          issue.category.toLowerCase().includes(query) ||
          (issue.suggested_fix && issue.suggested_fix.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [issues, severityFilter, categoryFilter, searchQuery]);

  const toggleSeverity = (severity: string) => {
    setSeverityFilter(prev =>
      prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  const toggleCategory = (category: string) => {
    setCategoryFilter(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleIssueExpanded = (idx: number) => {
    setExpandedIssues(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/5 border-red-500/30';
      case 'high': return 'bg-orange-500/5 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/5 border-yellow-500/30';
      case 'low': return 'bg-blue-500/5 border-blue-500/30';
      default: return 'bg-zinc-800/50 border-zinc-700';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-zinc-800 text-gray-400 border border-zinc-700';
    }
  };

  // Count by severity
  const severityCounts = useMemo(() => {
    return severities.reduce((acc, sev) => {
      acc[sev] = issues.filter(i => i.severity === sev).length;
      return acc;
    }, {} as Record<string, number>);
  }, [issues]);

  // Group issues by severity for priority view or by category
  const groupedIssues = useMemo(() => {
    if (viewMode === 'priority') {
      return {
        'critical': filteredIssues.filter(i => i.severity === 'critical'),
        'high': filteredIssues.filter(i => i.severity === 'high'),
        'medium': filteredIssues.filter(i => i.severity === 'medium'),
        'low': filteredIssues.filter(i => i.severity === 'low'),
      };
    } else {
      const groups: Record<string, any[]> = {};
      filteredIssues.forEach(issue => {
        const cat = issue.category || 'other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(issue);
      });
      return groups;
    }
  }, [filteredIssues, viewMode]);

  // Calculate total potential score improvement
  const totalPotentialImprovement = useMemo(() => {
    return filteredIssues.reduce((sum, issue) => sum + (issue.scoreImpact || 0), 0);
  }, [filteredIssues]);

  return (
    <div>
      {/* Summary Banner */}
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {issues.length} Issues Found
            </h3>
            <p className="text-sm sm:text-base text-gray-400">
              {severityCounts.critical > 0 && (
                <span className="text-red-400 font-semibold">{severityCounts.critical} critical</span>
              )}
              {severityCounts.critical > 0 && severityCounts.high > 0 && ' • '}
              {severityCounts.high > 0 && (
                <span className="text-orange-400 font-semibold">{severityCounts.high} high priority</span>
              )}
              {(severityCounts.critical > 0 || severityCounts.high > 0) && ' — address these first'}
            </p>
          </div>
          {currentScore && totalPotentialImprovement > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3">
              <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide mb-1">Potential Improvement</div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">{currentScore}</span>
                <span className="text-gray-600">→</span>
                <span className="text-2xl font-bold text-green-400">
                  {Math.min(100, currentScore + Math.round(totalPotentialImprovement * 0.7))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Severity Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {severities.map(severity => {
          const info = severityInfo[severity];
          const isActive = severityFilter.includes(severity);
          const getSeverityBg = (sev: string) => {
            switch (sev) {
              case 'critical': return 'bg-gradient-to-br from-red-950/40 to-red-900/20 border-red-900/50';
              case 'high': return 'bg-gradient-to-br from-orange-950/40 to-orange-900/20 border-orange-900/50';
              case 'medium': return 'bg-gradient-to-br from-yellow-950/40 to-yellow-900/20 border-yellow-900/50';
              case 'low': return 'bg-gradient-to-br from-blue-950/40 to-blue-900/20 border-blue-900/50';
              default: return 'bg-zinc-900 border-zinc-800';
            }
          };
          return (
            <button
              key={severity}
              onClick={() => toggleSeverity(severity)}
              className={`${getSeverityBg(severity)} border rounded-2xl p-3 sm:p-5 text-left transition-all hover:scale-105 ${
                isActive ? 'ring-2 ring-white' : ''
              }`}
            >
              <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide font-semibold mb-2">{severity}</div>
              <div className="text-2xl sm:text-4xl font-bold text-white mb-1">{severityCounts[severity]}</div>
              <div className="text-xs text-gray-500 hidden sm:block">{info.description}</div>
            </button>
          );
        })}
      </div>

      {/* View Mode Toggle & Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">View by:</span>
            <div className="inline-flex bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('priority')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'priority'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Priority
              </button>
              <button
                onClick={() => setViewMode('category')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'category'
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Category
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-zinc-800 text-white placeholder:text-gray-500 text-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const catInfo = categoryDescriptions[category.toLowerCase()] || { icon: '📋', description: category };
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  categoryFilter.includes(category)
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 border border-zinc-700'
                }`}
              >
                <span>{catInfo.icon}</span>
                <span>{category}</span>
                <span className="text-gray-500">({issues.filter(i => i.category === category).length})</span>
              </button>
            );
          })}
        </div>

        {/* Clear Filters */}
        {(severityFilter.length > 0 || categoryFilter.length > 0 || searchQuery) && (
          <button
            onClick={() => {
              setSeverityFilter([]);
              setCategoryFilter([]);
              setSearchQuery('');
            }}
            className="mt-3 text-sm text-teal-400 hover:text-teal-300 font-medium"
          >
            ✕ Clear all filters
          </button>
        )}
      </div>

      {/* Issues List */}
      {filteredIssues.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedIssues).map(([group, groupIssues]) => {
            if (groupIssues.length === 0) return null;
            
            const groupInfo = viewMode === 'priority' 
              ? severityInfo[group] 
              : { label: `${categoryDescriptions[group.toLowerCase()]?.icon || '📋'} ${group}`, description: categoryDescriptions[group.toLowerCase()]?.description || '' };
            
            return (
              <div key={group}>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span>{groupInfo.label}</span>
                  <span className="text-sm font-normal text-gray-500">
                    ({groupIssues.length} issue{groupIssues.length !== 1 ? 's' : ''})
                  </span>
                </h4>
                <div className="space-y-3">
                  {groupIssues.map((issue: any, idx: number) => {
                    const globalIdx = filteredIssues.indexOf(issue);
                    const isExpanded = expandedIssues.has(globalIdx);
                    const scoreImprovement = issue.scoreImpact || 0;

                    return (
                      <div
                        key={idx}
                        className={`border-l-4 border rounded-2xl overflow-hidden ${getSeverityColor(issue.severity)} transition-all hover:shadow-lg`}
                      >
                        {/* Issue Header - Always visible */}
                        <div
                          className="p-4 sm:p-5 cursor-pointer hover:bg-zinc-800/50 transition-all"
                          onClick={() => toggleIssueExpanded(globalIdx)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white mb-2 text-sm sm:text-base leading-relaxed">
                                {issue.message}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {viewMode !== 'category' && (
                                  <span className="text-gray-400 bg-zinc-800/50 px-2 py-1 rounded-md">
                                    {categoryDescriptions[issue.category?.toLowerCase()]?.icon || '📋'} {issue.category}
                                  </span>
                                )}
                                {viewMode !== 'priority' && (
                                  <span className={`px-2.5 py-1 rounded-md font-medium uppercase tracking-wide ${getSeverityBadgeColor(issue.severity)}`}>
                                    {issue.severity}
                                  </span>
                                )}
                                {scoreImprovement > 0 && (
                                  <span className="text-green-400 font-bold bg-green-500/10 px-2.5 py-1 rounded-md">
                                    +{scoreImprovement} pts
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="bg-zinc-800 px-2 py-1 rounded-md text-gray-400 text-sm">
                                {isExpanded ? '▼' : '▶'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-zinc-800">
                            {/* How to fix */}
                            {issue.suggested_fix && (
                              <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                                <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                                  <span className="text-lg">💡</span> How to fix
                                </div>
                                <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                                  {issue.suggested_fix}
                                </p>
                              </div>
                            )}

                            {/* Technical details (if available) */}
                            {issue.element && (
                              <div className="mt-3">
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                  Technical details
                                </div>
                                <div className="text-xs text-gray-400 font-mono bg-zinc-800 border border-zinc-700 p-2 rounded overflow-x-auto">
                                  {issue.element}
                                </div>
                              </div>
                            )}

                            {/* Impact estimate */}
                            {currentScore && scoreImprovement > 0 && (
                              <div className="mt-3 flex items-center gap-2 text-sm">
                                <span className="text-gray-400">Fixing this could improve your score:</span>
                                <span className="font-medium text-white">{currentScore}</span>
                                <span className="text-gray-500">→</span>
                                <span className="font-bold text-teal-400">
                                  ~{Math.min(100, currentScore + scoreImprovement)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎉</div>
          <div className="text-xl font-semibold text-white mb-2">
            {issues.length === 0 ? 'No issues found!' : 'No issues match your filters'}
          </div>
          <p className="text-gray-400">
            {issues.length === 0
              ? 'Your site is well-optimized for AI systems.'
              : 'Try adjusting your filters to see more issues.'}
          </p>
        </div>
      )}
    </div>
  );
}
