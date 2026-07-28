import React, { useEffect, useState } from 'react';
import { TopBar } from './TopBar';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { SuggestionsPanel } from './SuggestionsPanel';
import { FlowCanvas } from './canvas/FlowCanvas';
import { useFlowEngine } from '../hooks/useFlowEngine';
import { useTheme } from '../hooks/useTheme';

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const engine = useFlowEngine();

  // Only one right-hand panel at a time.
  useEffect(() => {
    if (isCheckOpen) setIsHistoryOpen(false);
  }, [isCheckOpen]);

  const handleCheckFlow = () => {
    setIsCheckOpen(true);
    engine.runCompletenessCheck();
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg font-ui text-text-primary">
      <TopBar
        theme={theme}
        onToggleTheme={toggleTheme}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => {
          setIsHistoryOpen((open) => !open);
          setIsCheckOpen(false);
        }}
        versionLabel={engine.versions[0]?.label ?? null}
        canCheckFlow={engine.hasFlow && !engine.isGenerating}
        isChecking={engine.isChecking}
        onCheckFlow={handleCheckFlow} />
      
      <main className="relative min-h-0 w-full flex-1 overflow-hidden">
        <FlowCanvas engine={engine} />
        <VersionHistoryPanel
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          versions={engine.versions} />
        
        <SuggestionsPanel
          isOpen={isCheckOpen}
          isChecking={engine.isChecking}
          suggestions={engine.suggestions}
          onClose={() => setIsCheckOpen(false)}
          onApprove={engine.approveSuggestion}
          onReject={engine.rejectSuggestion} />
        
      </main>
    </div>);

}