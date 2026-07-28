"use client";
import '@xyflow/react/dist/style.css';
import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AppShell } from '@/components/AppShell';

export default function CanvasApp() {
  return (
    <ReactFlowProvider>
      <AppShell />
    </ReactFlowProvider>);

}