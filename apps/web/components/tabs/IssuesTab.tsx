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
      case 'critical': return 'bg-red-50 dark:bg-red-900/30 border-red-500';
      case 'high': return 'bg-orange-50 dark:bg-orange-900/30 border-orange-500';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500';
      case 'low': return 'bg-blue-50 dark:bg-blue-900/30 border-blue-500';
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-500';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
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
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              {issues.length} Issues Found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {severityCounts.critical > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">{severityCounts.critical} critical</span>
              )}
              {severityCounts.critical > 0 && severityCounts.high > 0 && ' • '}
              {severityCounts.high > 0 && (
                <span className="text-orange-600 dark:text-orange-400 font-medium">{severityCounts.high} high priority</span>
              )}
              {(severityCounts.critical > 0 || severityCounts.high > 0) && ' — address these first'}
            </p>
          </div>
          {currentScore && totalPotentialImprovement > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Potential improvement</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{currentScore}</span>
                <span className="text-gray-400">→</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ~{Math.min(100, currentScore + Math.round(totalPotentialImprovement * 0.7))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Severity Quick Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
        {severities.map(severity => {
          const info = severityInfo[severity];
          const isActive = severityFilter.includes(severity);
          return (
            <button
              key={severity}
              onClick={() => toggleSeverity(severity)}
              className={`${getSeverityColor(severity)} border-l-4 rounded-lg p-2 sm:p-4 text-left transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
              }`}
            >
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{info.label}</div>
              <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{severityCounts[severity]}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block mt-1">{info.description}</div>
            </button>
          );
        })}
      </div>

      {/* View Mode Toggle & Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View by:</span>
            <div className="inline-flex bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('priority')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'priority'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Priority
              </button>
              <button
                onClick={() => setViewMode('category')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'category'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
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
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <span>{catInfo.icon}</span>
                <span>{category}</span>
                <span className="text-gray-400">({issues.filter(i => i.category === category).length})</span>
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
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
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
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span>{groupInfo.label}</span>
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
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
                        className={`border-l-4 rounded-lg overflow-hidden ${getSeverityColor(issue.severity)} transition-all`}
                      >
                        {/* Issue Header - Always visible */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => toggleIssueExpanded(globalIdx)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                {issue.message}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {viewMode !== 'category' && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {categoryDescriptions[issue.category?.toLowerCase()]?.icon || '📋'} {issue.category}
                                  </span>
                                )}
                                {viewMode !== 'priority' && (
                                  <span className={`px-2 py-0.5 rounded-full ${getSeverityBadgeColor(issue.severity)}`}>
                                    {issue.severity}
                                  </span>
                                )}
                                {scoreImprovement > 0 && (
                                  <span className="text-green-600 dark:text-green-400 font-semibold">
                                    +{scoreImprovement} pts if fixed
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-gray-400 text-sm">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            {/* Why it matters */}
                            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Why it matters
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {issue.severity === 'critical' 
                                  ? 'This issue prevents AI systems from properly understanding your content. AI may completely miss or misinterpret important information.'
                                  : issue.severity === 'high'
                                  ? 'This significantly reduces how accurately AI can process your content. May lead to incomplete or partially incorrect information.'
                                  : issue.severity === 'medium'
                                  ? 'This may cause AI to miss some nuances or make minor errors when presenting your content.'
                                  : 'A minor optimization that can improve AI understanding, but not critical.'}
                              </p>
                            </div>
                            
                            {/* How to fix */}
                            {issue.suggested_fix && (
                              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide mb-1 flex items-center gap-1">
                                  <span>💡</span> How to fix
                                </div>
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  {issue.suggested_fix}
                                </p>
                              </div>
                            )}
                            
                            {/* Technical details (if available) */}
                            {issue.element && (
                              <div className="mt-3">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                  Technical details
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                  {issue.element}
                                </div>
                              </div>
                            )}
                            
                            {/* Impact estimate */}
                            {currentScore && scoreImprovement > 0 && (
                              <div className="mt-3 flex items-center gap-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Fixing this could improve your score:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{currentScore}</span>
                                <span className="text-gray-400">→</span>
                                <span className="font-bold text-green-600 dark:text-green-400">
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
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {issues.length === 0 ? 'No issues found!' : 'No issues match your filters'}
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {issues.length === 0 
              ? 'Your site is well-optimized for AI systems.' 
              : 'Try adjusting your filters to see more issues.'}
          </p>
        </div>
      )}
    </div>
  );
}
