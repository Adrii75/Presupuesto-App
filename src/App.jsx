import { useState, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { cargarPresupuesto, guardarPresupuesto } from "./presupuestoDb";

/* ─── GLOBAL STYLES injected once ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f7fbff;
    --surface:  #ffffff;
    --card:     #ffffff;
    --border:   #e6eef8;
    --border2:  #d1e3f8;
    --text:     #0b1320;
    --muted:    #6b7280;
    --subtle:   #94a3b8;
    --accent:   #3b7cf4;
    --accent2:  #5b9cf9;
    --green:    #22d07a;
    --orange:   #f87439;
    --red:      #f05252;
    --sidebar-w: 260px;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; font-variant-numeric: tabular-nums lining-nums; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  input, textarea, button { font-family: inherit; }

  .syne { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.02em; }

  .nums { font-family: 'Space Grotesk', sans-serif; font-variant-numeric: tabular-nums lining-nums; letter-spacing: -0.03em; }

  /* Sidebar layout */
  .app-shell {
    display: flex;
    min-height: 100vh;
  }

  /* ─── SIDEBAR ─── */
  .sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 50;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .sidebar-logo {
    padding: 28px 22px 20px;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-logo .badge {
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .sidebar-logo .title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.05;
    color: var(--text);
  }

  .sidebar-logo .email {
    font-size: 11px;
    color: var(--muted);
    margin-top: 3px;
  }

  .sidebar-section {
    padding: 18px 14px 0;
  }

  .sidebar-section-label {
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--muted);
    text-transform: uppercase;
    padding: 0 8px;
    margin-bottom: 8px;
  }

  .sidebar-tab {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: var(--subtle);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: all 0.18s ease;
    margin-bottom: 4px;
  }
  .sidebar-tab:hover { background: rgba(59,124,244,0.08); color: var(--text); }
  .sidebar-tab.active {
    background: rgba(59,124,244,0.15);
    color: var(--accent2);
    border: 1px solid rgba(59,124,244,0.2);
  }

  .sidebar-tab .tab-icon {
    width: 32px; height: 32px;
    border-radius: 10px;
    display: grid; place-items: center;
    font-size: 16px;
    background: rgba(255,255,255,0.04);
    flex-shrink: 0;
  }
  .sidebar-tab.active .tab-icon {
    background: rgba(59,124,244,0.2);
  }

  .sidebar-year {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px 22px 14px;
    border-top: 1px solid var(--border);
    margin-top: auto;
  }

  .year-btn {
    flex: 1;
    padding: 8px 0;
    border-radius: 10px;
    border: 1px solid var(--border2);
    background: transparent;
    color: var(--subtle);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }
  .year-btn:hover { background: var(--border); color: var(--text); }

  .year-display {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums lining-nums;
    color: var(--text);
    text-align: center;
    flex: 2;
  }

  /* ─── MAIN CONTENT ─── */
  .main-content {
    margin-left: var(--sidebar-w);
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  /* ─── TOP BAR ─── */
  .topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .view-toggle {
    display: flex;
    background: var(--card);
    border-radius: 12px;
    padding: 4px;
    gap: 4px;
  }

  .view-btn {
    padding: 8px 18px;
    border-radius: 9px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    transition: all 0.18s;
    color: var(--muted);
    background: transparent;
  }
  .view-btn.active {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 14px rgba(59,124,244,0.35);
  }

  /* Month strip */
  .month-strip {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
    overflow: visible;
    padding: 0;
    min-width: 0;
    max-width: 100%;
    scrollbar-width: none;
  }
  .month-strip::-webkit-scrollbar { display: none; }

  .month-btn {
    flex: 0 0 auto;
    min-width: 48px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    background: transparent;
    color: var(--muted);
    transition: all 0.15s;
  }
  .month-btn:hover { color: var(--text); background: var(--card); }
  .month-btn.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
    box-shadow: 0 3px 12px rgba(59,124,244,0.4);
  }

  /* ─── KPI CARDS ─── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 24px 32px 0;
  }

  .kpi-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 22px 20px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }

  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 20px 20px 0 0;
  }
  .kpi-card.income::before { background: linear-gradient(90deg, var(--green), #0ea96e); }
  .kpi-card.expense::before { background: linear-gradient(90deg, var(--orange), #f43f5e); }
  .kpi-card.available::before { background: linear-gradient(90deg, var(--accent), #818cf8); }

  .kpi-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .kpi-value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 30px;
    font-weight: 700;
    line-height: 0.95;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums lining-nums;
  }

  /* ─── SECTION CARDS ─── */
  .content-area {
    padding: 24px 32px 80px;
    flex: 1;
  }

  .section-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    margin-bottom: 20px;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    cursor: pointer;
    border-bottom: 1px solid transparent;
    transition: background 0.15s;
    user-select: none;
  }
  .section-header:hover { background: rgba(255,255,255,0.02); }
  .section-header.open { border-bottom-color: var(--border); }

  .section-title-wrap { display: flex; align-items: center; gap: 10px; }

  .section-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
  }

  .section-count {
    font-size: 11px;
    color: var(--muted);
    margin-top: 2px;
  }

  .section-total-badge {
    font-size: 14px;
    font-weight: 800;
    padding: 6px 14px;
    border-radius: 999px;
  }

  .cats-grid {
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  /* ─── CATEGORY CARD ─── */
  .cat-card {
    border-radius: 16px;
    border: 1px solid var(--border);
    background: var(--surface);
    padding: 16px;
    cursor: pointer;
    transition: all 0.18s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100px;
    position: relative;
    overflow: hidden;
  }
  .cat-card:hover {
    border-color: var(--border2);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  }
  .cat-card.has-value {
    border-color: var(--border2);
    background: linear-gradient(160deg, var(--card) 0%, var(--surface) 100%);
  }
  .cat-card.readonly { opacity: 0.6; cursor: default; }
  .cat-card.readonly:hover { transform: none; box-shadow: none; }

  .cat-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .cat-icon-wrap {
    width: 38px; height: 38px;
    border-radius: 12px;
    display: grid; place-items: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .cat-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.3;
    flex: 1;
  }

  .cat-edit-icon {
    font-size: 11px;
    color: var(--muted);
    opacity: 0.7;
  }

  .cat-amount {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums lining-nums;
  }

  .cat-hint {
    font-size: 10px;
    color: var(--muted);
    margin-top: 2px;
  }

  /* ─── BALANCE BANNER ─── */
  .balance-banner {
    border-radius: 20px;
    padding: 22px 24px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid transparent;
  }
  .balance-banner.positive {
    background: linear-gradient(135deg, #03200f 0%, #052e16 100%);
    border-color: rgba(34,208,122,0.2);
  }
  .balance-banner.negative {
    background: linear-gradient(135deg, #2d0707 0%, #450a0a 100%);
    border-color: rgba(240,82,82,0.2);
  }

  /* ─── TOOLBAR ─── */
  .toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 18px;
    border-radius: 14px;
    border: none;
    background: var(--accent);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
    box-shadow: 0 4px 16px rgba(59,124,244,0.3);
  }
  .btn-primary:hover { background: var(--accent2); box-shadow: 0 6px 22px rgba(59,124,244,0.4); transform: translateY(-1px); }

  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 18px;
    border-radius: 14px;
    border: 1px solid var(--border2);
    background: var(--card);
    color: var(--subtle);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
  }
  .btn-secondary:hover { background: var(--surface); color: var(--text); border-color: var(--muted); }

  /* ─── MODALS ─── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(4,8,16,0.85);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .modal-sheet {
    background: var(--card);
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 24px 24px 0 0;
    padding: 28px 24px 44px;
    border: 1px solid var(--border2);
    border-bottom: none;
  }

  .modal-handle {
    width: 36px; height: 4px;
    background: var(--border2);
    border-radius: 2px;
    margin: 0 auto 22px;
  }

  .modal-box {
    background: var(--card);
    width: 100%;
    max-width: 480px;
    border-radius: 24px;
    padding: 28px 24px;
    border: 1px solid var(--border2);
  }

  .modal-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.05;
    color: var(--text);
    margin-bottom: 6px;
  }

  .modal-subtitle {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 20px;
  }

  /* ─── FORM ELEMENTS ─── */
  .form-label {
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 7px;
    display: block;
  }

  .form-input {
    width: 100%;
    padding: 13px 16px;
    border-radius: 14px;
    border: 1px solid var(--border2);
    background: var(--surface);
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    outline: none;
    transition: border 0.15s;
  }
  .form-input:focus { border-color: var(--accent); }

  .form-input-lg {
    width: 100%;
    padding: 16px 52px 16px 18px;
    border-radius: 16px;
    border: 2px solid var(--accent);
    background: var(--surface);
    color: var(--text);
    font-size: 22px;
    font-weight: 800;
    font-family: 'Space Grotesk', sans-serif;
    outline: none;
  }

  .input-group { position: relative; margin-bottom: 14px; }
  .input-suffix {
    position: absolute;
    right: 18px; top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    font-size: 18px;
    pointer-events: none;
  }

  /* ─── CHOICE BUTTONS ─── */
  .choice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }

  .choice-btn {
    padding: 13px;
    border-radius: 14px;
    border: 1px solid var(--border2);
    background: var(--surface);
    color: var(--subtle);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }
  .choice-btn.active-blue { background: rgba(59,124,244,0.2); border-color: var(--accent); color: var(--accent2); }
  .choice-btn.active-green { background: rgba(34,208,122,0.15); border-color: var(--green); color: var(--green); }
  .choice-btn.active-orange { background: rgba(248,116,57,0.15); border-color: var(--orange); color: var(--orange); }

  /* ─── EMOJI PICKER ─── */
  .emoji-strip {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .emoji-strip::-webkit-scrollbar { display: none; }
  .emoji-btn {
    flex-shrink: 0;
    width: 40px; height: 40px;
    border-radius: 12px;
    border: 1px solid var(--border2);
    background: var(--surface);
    cursor: pointer;
    font-size: 18px;
    display: grid; place-items: center;
    transition: all 0.15s;
  }
  .emoji-btn.selected { border-color: var(--accent); background: rgba(59,124,244,0.15); }

  /* ─── MOVEMENT ITEM ─── */
  .mov-item {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .mov-delete-btn {
    padding: 7px 12px;
    border-radius: 10px;
    border: none;
    background: rgba(240,82,82,0.15);
    color: var(--red);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .mov-delete-btn:hover { background: rgba(240,82,82,0.3); }

  /* ─── ANNUAL VIEW ─── */
  .annual-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 20px;
    align-items: start;
  }

  .annual-table-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
  }

  .annual-table-header {
    padding: 16px 20px;
    background: rgba(59,124,244,0.08);
    border-bottom: 1px solid var(--border);
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px;
  }

  .annual-table-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(26,42,63,0.6);
    cursor: pointer;
    transition: background 0.15s;
  }
  .annual-table-row:hover { background: rgba(255,255,255,0.02); }
  .annual-table-row:last-child { border-bottom: none; }
  .annual-table-row.active-month { background: rgba(59,124,244,0.06); }
  .annual-table-row.dim { opacity: 0.4; }

  .annual-side { display: grid; gap: 16px; }

  .stat-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 18px;
  }

  .stat-card-label { font-size: 11px; color: var(--muted); margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; }
  .stat-card-value { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 4px; }
  .stat-card-sub { font-size: 11px; color: var(--muted); }

  /* ─── NOTES ─── */
  .notes-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .notes-textarea {
    width: 100%;
    min-height: 100px;
    resize: vertical;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid var(--border2);
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    line-height: 1.55;
    outline: none;
    transition: border 0.15s;
  }
  .notes-textarea:focus { border-color: var(--accent); }

  /* ─── READ-ONLY NOTICE ─── */
  .readonly-notice {
    background: rgba(78,106,138,0.08);
    border: 1px solid rgba(78,106,138,0.2);
    border-radius: 12px;
    padding: 11px 16px;
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ─── RANKING BAR ─── */
  .rank-bar-bg {
    height: 6px;
    background: var(--surface);
    border-radius: 999px;
    overflow: hidden;
    margin: 7px 0 4px;
  }
  .rank-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s ease;
  }

  /* ─── MOBILE OVERRIDES ─── */
  @media (max-width: 899px) {
    :root { --sidebar-w: 0px; }

    .sidebar { display: none; }
    .main-content { margin-left: 0; }

    .topbar {
      padding: 14px 16px;
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .topbar-top { display: flex; flex-direction: column; align-items: stretch; gap: 10px; width: 100%; }
    .topbar-user { width: 100%; }
    .topbar-actions { width: 100%; justify-content: flex-start; order: 2; }
    .mobile-year {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
      order: 3;
      margin-top: 2px;
    }
    .month-strip { justify-content: flex-start; }

    .kpi-grid {
      grid-template-columns: 1fr;
      gap: 10px;
      padding: 16px 16px 0;
    }

    .kpi-value { font-size: 18px; }

    .content-area { padding: 16px 16px 80px; }

    .cats-grid { grid-template-columns: 1fr; gap: 10px; }

    .insight-grid, .history-grid { grid-template-columns: 1fr; }

    .month-strip { justify-content: flex-start; }

    .annual-grid { grid-template-columns: 1fr; }

    /* Mobile bottom nav */
    .mobile-nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: var(--surface);
      border-top: 1px solid var(--border);
      display: flex;
      z-index: 50;
      padding: 8px 0 max(8px, env(safe-area-inset-bottom));
    }

    .mobile-nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 8px 4px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.15s;
    }
    .mobile-nav-btn.active { color: var(--accent2); }
    .mobile-nav-btn .icon { font-size: 20px; }

    .modal-sheet { border-radius: 20px 20px 0 0; padding: 24px 18px 44px; }
    .modal-box { border-radius: 20px; padding: 24px 18px; max-width: 100%; }
  }

  @media (min-width: 900px) {
    .mobile-nav { display: none; }
    .topbar-top { display: contents; }
    .topbar-actions { flex-wrap: nowrap; }
    .month-strip { flex: 1; }
  }

  /* ─── HEADER USER SECTION ─── */
  .topbar-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-avatar {
    width: 34px; height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent) 0%, #818cf8 100%);
    display: grid; place-items: center;
    font-size: 14px;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
  }

  .topbar-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
    justify-content: flex-end;
  }

  .mobile-year {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
  }


  .month-health-card {
    background: linear-gradient(180deg, rgba(17,28,43,0.98) 0%, rgba(12,21,33,0.98) 100%);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 18px 20px;
    margin-bottom: 18px;
  }

  .month-health-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .month-health-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .status-pill {
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .progress-track {
    height: 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.35s ease;
  }

  .insight-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .mini-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 18px;
  }

  .mini-card-title {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 10px;
  }

  .mini-card-value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .mini-card-sub {
    font-size: 12px;
    color: var(--subtle);
    margin-top: 8px;
    line-height: 1.45;
  }

  .alert-list {
    display: grid;
    gap: 10px;
    margin-bottom: 20px;
  }

  .alert-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.02);
  }

  .alert-item.warn {
    border-color: rgba(248,116,57,0.28);
    background: rgba(248,116,57,0.08);
  }

  .alert-item.good {
    border-color: rgba(34,208,122,0.22);
    background: rgba(34,208,122,0.07);
  }

  .history-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 18px 20px;
    margin-bottom: 20px;
  }

  .history-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 14px;
    margin-top: 14px;
  }

  .history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .history-item.active {
    border-color: rgba(59,124,244,0.35);
    background: rgba(59,124,244,0.08);
  }

  .kpi-card, .section-card, .notes-card, .history-card, .mini-card, .month-health-card, .annual-table-card, .stat-card {
    animation: fadeUp 0.28s ease;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }


  /* ─── ERROR BANNER ─── */
  .error-banner {
    background: rgba(133,77,14,0.15);
    border: 1px solid rgba(133,77,14,0.4);
    border-radius: 12px;
    padding: 11px 16px;
    font-size: 12px;
    color: #fcd34d;
    margin: 16px 32px 0;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  @media (max-width: 899px) {
    .error-banner { margin: 12px 16px 0; }
  }

  /* ─── SEPARATOR LINE ─── */
  .sep { border: none; border-top: 1px solid var(--border); margin: 14px 0; }
`;

/* ─── INJECT STYLES ─── */
if (!document.getElementById("app-premium-styles")) {
  const style = document.createElement("style");
  style.id = "app-premium-styles";
  style.textContent = GLOBAL_CSS;
  document.head.appendChild(style);
}

const EMAIL_ADRI = "adri12gg@gmail.com";
const EMAIL_GISELA = "mateogisela05@gmail.com";

function puedeEditarTipo(email, tipo) {
  const e = (email || "").toLowerCase();
  if (tipo === "familiar") return true;
  if (tipo === "adri") return e === EMAIL_ADRI;
  if (tipo === "gisela") return e === EMAIL_GISELA;
  return false;
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const AÑO_ACTUAL = new Date().getFullYear();
const MES_ACTUAL = new Date().getMonth();

const CATEGORIAS_FAMILIAR = {
  ingresos: ["Adri","Gisela","Otros ingresos"],
  gastos: ["Vivienda","Agua","Luz","Supermercado","Seguros (hogar, vida)","Teléfono (fibra + móvil)","Alarma","Restaurante","Ropa","Basuras","IBI","Otros"]
};

const CATEGORIAS_ADRI = {
  ingresos: ["Adri","Otros ingresos"],
  gastos: ["Vivienda","Coche seguro","Gasolina coche","Seguro salud Adeslas","PS5","Netflix","Ocio","Spotify","Ahorro mensual","Inversión","Otros"]
};

const CATEGORIAS_GISELA = {
  ingresos: ["Gisela","Otros ingresos"],
  gastos: ["Vivienda","Coche seguro","Préstamo","Gasolina coche","Seguro salud Adeslas","Amazon","Spotify","iPad","Otros"]
};

const BASE_PRESUPUESTOS = {
  familiar: { label: "Familiar", icon: "🏠", cats: CATEGORIAS_FAMILIAR },
  adri: { label: "Adri", icon: "👤", cats: CATEGORIAS_ADRI },
  gisela: { label: "Gisela", icon: "👤", cats: CATEGORIAS_GISELA }
};

const STORAGE_KEY = "presupuesto_familiar_v1";

const CHART_COLORS = [
  "#3b7cf4","#22d07a","#f87439","#a78bfa","#f59e0b",
  "#06b6d4","#f05252","#14b8a6","#8b5cf6","#84cc16","#f43f5e","#64748b"
];

const ICONOS_CATEGORIA = {
  "Adri": "👤","Gisela": "👤","Otros ingresos": "💼","Vivienda": "🏠",
  "Agua": "💧","Luz": "💡","Supermercado": "🛒","Seguros (hogar, vida)": "🛡️",
  "Teléfono (fibra + móvil)": "📱","Alarma": "🚨","Restaurante": "🍽️",
  "Ropa": "👕","Basuras": "🗑️","IBI": "📄","Otros": "📦","Coche seguro": "🚗",
  "Gasolina coche": "⛽","Seguro salud Adeslas": "🏥","PS5": "🎮",
  "Netflix": "📺","Ocio": "🎉","Spotify": "🎵","Ahorro mensual": "💰",
  "Inversión": "📈","Préstamo": "💳","Amazon": "📦","iPad": "📱"
};

const EMOJIS_SUGERIDOS = [
  "🏠","🚗","⛽","🛒","🍽️","🎮","🎵","📺","💡","💧","🧾","💳",
  "💰","📈","🏥","🛡️","✈️","🐶","🏋️","🎁","📚","👕","📱","🧴",
  "🍼","🛠️","📦","🎉","🍕","☕"
];

function getInitialData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    2025: { familiar: {}, adri: {}, gisela: {} },
    _meta: {
      customCats: {
        familiar: { ingresos: [], gastos: [] },
        adri: { ingresos: [], gastos: [] },
        gisela: { ingresos: [], gastos: [] }
      },
      automatismos: {
        familiar: [],
        adri: [],
        gisela: []
      },
      backupsVisuales: []
    }
  };
}

function normalizarNumero(valor) {
  if (valor === "" || valor === null || valor === undefined) return 0;
  const n = parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
}

function obtenerMovimientosDeValor(valorCategoria) {
  if (valorCategoria && typeof valorCategoria === "object" && !Array.isArray(valorCategoria) && Array.isArray(valorCategoria.movimientos)) {
    return valorCategoria.movimientos;
  }
  return [];
}

function calcularValorCategoria(valorCategoria) {
  if (valorCategoria && typeof valorCategoria === "object" && !Array.isArray(valorCategoria) && Array.isArray(valorCategoria.movimientos)) {
    return valorCategoria.movimientos.reduce((acc, mov) => acc + normalizarNumero(mov?.importe), 0);
  }
  return normalizarNumero(valorCategoria);
}

function asegurarMeta(data) {
  if (!data._meta) data._meta = {};
  if (!data._meta.customCats) {
    data._meta.customCats = {
      familiar: { ingresos: [], gastos: [] },
      adri: { ingresos: [], gastos: [] },
      gisela: { ingresos: [], gastos: [] }
    };
  }
  if (!data._meta.automatismos) {
    data._meta.automatismos = {
      familiar: [],
      adri: [],
      gisela: []
    };
  }
  if (!Array.isArray(data._meta.backupsVisuales)) {
    data._meta.backupsVisuales = [];
  }
  for (const tipo of ["familiar", "adri", "gisela"]) {
    if (!data._meta.customCats[tipo]) data._meta.customCats[tipo] = { ingresos: [], gastos: [] };
    if (!Array.isArray(data._meta.customCats[tipo].ingresos)) data._meta.customCats[tipo].ingresos = [];
    if (!Array.isArray(data._meta.customCats[tipo].gastos)) data._meta.customCats[tipo].gastos = [];
    if (!Array.isArray(data._meta.automatismos[tipo])) data._meta.automatismos[tipo] = [];
  }
  return data;
}

function getCustomCats(data, tipo, seccion) {
  return data?._meta?.customCats?.[tipo]?.[seccion] || [];
}

function getAutomatismos(data, tipo) {
  return data?._meta?.automatismos?.[tipo] || [];
}

function crearIdUnico() {
  return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ymDesdeFechaMes(fechaMes) {
  if (!fechaMes || typeof fechaMes !== "string") return null;
  const partes = fechaMes.split("-");
  if (partes.length !== 2) return null;
  const year = parseInt(partes[0], 10);
  const month = parseInt(partes[1], 10) - 1;
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) return null;
  return { año: year, mes: month };
}

function fechaMesDesdeYM(año, mes) {
  return `${año}-${String(mes + 1).padStart(2, "0")}`;
}

function compararFechaMes(a, b) {
  if (!a || !b) return 0;
  if (a.año !== b.año) return a.año - b.año;
  return a.mes - b.mes;
}

function limiteDiaMes(año, mes, dia) {
  return Math.max(1, Math.min(Number(dia) || 1, new Date(año, mes + 1, 0).getDate()));
}

function aplicarAutomatismosPendientes(data, fechaRef = new Date()) {
  const next = JSON.parse(JSON.stringify(data));
  asegurarMeta(next);

  const hoy = {
    año: fechaRef.getFullYear(),
    mes: fechaRef.getMonth(),
    dia: fechaRef.getDate()
  };

  let cambios = 0;

  for (const tipo of ["familiar", "adri", "gisela"]) {
    const automatismos = getAutomatismos(next, tipo);
    const catsGastos = getAllCats(next, tipo, "gastos");

    automatismos.forEach((auto) => {
      if (!auto?.activo) return;
      if (auto?.seccion && auto.seccion !== "gastos") return;
      if (!auto?.categoria || !catsGastos.includes(auto.categoria)) return;

      const desde = ymDesdeFechaMes(auto.desde);
      if (!desde) return;
      const hasta = auto.ilimitado ? { año: hoy.año, mes: hoy.mes } : ymDesdeFechaMes(auto.hasta);
      if (!hasta) return;

      let cursor = { ...desde };
      while (compararFechaMes(cursor, hasta) <= 0 && compararFechaMes(cursor, { año: hoy.año, mes: hoy.mes }) <= 0) {
        const esMesActual = cursor.año === hoy.año && cursor.mes === hoy.mes;
        const diaAplicacion = limiteDiaMes(cursor.año, cursor.mes, auto.dia || 1);
        const yaToca = !esMesActual || hoy.dia >= diaAplicacion;

        if (yaToca) {
          asegurarMeta(next);
          if (!next[cursor.año]) next[cursor.año] = {};
          if (!next[cursor.año][tipo]) next[cursor.año][tipo] = {};
          if (!next[cursor.año][tipo][cursor.mes]) next[cursor.año][tipo][cursor.mes] = { ingresos: {}, gastos: {}, notasMes: "" };
          if (!next[cursor.año][tipo][cursor.mes].gastos) next[cursor.año][tipo][cursor.mes].gastos = {};

          let actual = next[cursor.año][tipo][cursor.mes].gastos[auto.categoria];
          if (!actual || typeof actual !== "object" || Array.isArray(actual) || !Array.isArray(actual.movimientos)) {
            const num = normalizarNumero(actual);
            actual = { movimientos: num !== 0 ? [{ importe: num, fecha: hoyISO(), nota: "Importe inicial" }] : [] };
            next[cursor.año][tipo][cursor.mes].gastos[auto.categoria] = actual;
          }

          const yaExiste = actual.movimientos.some((mov) => mov?.automatismoId === auto.id && mov?.fecha?.slice(0, 7) === fechaMesDesdeYM(cursor.año, cursor.mes));
          if (!yaExiste) {
            actual.movimientos.push({
              importe: Math.abs(normalizarNumero(auto.importe)),
              fecha: `${cursor.año}-${String(cursor.mes + 1).padStart(2, "0")}-${String(diaAplicacion).padStart(2, "0")}`,
              nota: auto.nota?.trim() || "Automatismo mensual",
              automatismoId: auto.id,
              automatico: true
            });
            cambios += 1;
          }
        }

        if (cursor.mes === 11) {
          cursor = { año: cursor.año + 1, mes: 0 };
        } else {
          cursor = { año: cursor.año, mes: cursor.mes + 1 };
        }
      }
    });
  }

  return { next, cambios };
}

function getAllCats(data, tipo, seccion) {
  const base = BASE_PRESUPUESTOS[tipo].cats[seccion] || [];
  const custom = getCustomCats(data, tipo, seccion).map((x) => x.name);
  return [...base, ...custom];
}

function getEmojiCategoria(data, tipo, seccion, cat) {
  const custom = getCustomCats(data, tipo, seccion).find((x) => x.name === cat);
  if (custom?.emoji) return custom.emoji;
  return ICONOS_CATEGORIA[cat] || "•";
}

function calcTotales(data, tipo, año, mes) {
  const ingCats = getAllCats(data, tipo, "ingresos");
  const gasCats = getAllCats(data, tipo, "gastos");
  const mesData = data?.[año]?.[tipo]?.[mes] || {};
  const ing = ingCats.reduce((s, c) => s + calcularValorCategoria(mesData.ingresos?.[c]), 0);
  const gas = gasCats.reduce((s, c) => s + calcularValorCategoria(mesData.gastos?.[c]), 0);
  return { ingresos: ing, gastos: gas, disponible: ing - gas };
}

function calcAnual(data, tipo, año) {
  let ing = 0, gas = 0;
  for (let m = 0; m < 12; m++) {
    const t = calcTotales(data, tipo, año, m);
    ing += t.ingresos; gas += t.gastos;
  }
  return { ingresos: ing, gastos: gas, disponible: ing - gas };
}

function calcCategoriaAnual(data, tipo, año, seccion) {
  const categorias = getAllCats(data, tipo, seccion);
  const resultado = categorias.map((cat) => {
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const valor = data?.[año]?.[tipo]?.[m]?.[seccion]?.[cat];
      total += calcularValorCategoria(valor);
    }
    return { categoria: cat, total };
  });
  return resultado.sort((a, b) => b.total - a.total);
}

function resumirTopCategorias(items, topN = 5) {
  const positivas = items.filter((x) => x.total > 0);
  const top = positivas.slice(0, topN);
  const resto = positivas.slice(topN);
  const totalResto = resto.reduce((acc, x) => acc + x.total, 0);
  if (totalResto > 0) top.push({ categoria: "Otros", total: totalResto });
  return top;
}

function fmtDisplay(n) {
  return (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
}

function fmtSignedDisplay(n) {
  const num = Number(n) || 0;
  return `${num < 0 ? "-" : ""}${Math.abs(num).toFixed(2).replace(".", ",")} €`;
}

function fmtPct(n) {
  return `${(Number(n) || 0).toFixed(1).replace(".", ",")}%`;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function limpiarTextoPdf(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/€/g, "EUR")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E]/g, " ");
}

function partirLineaPdf(texto, maxChars = 88) {
  const limpio = limpiarTextoPdf(texto).trim();
  if (!limpio) return [""];
  const palabras = limpio.split(/\s+/);
  const lineas = [];
  let actual = "";
  palabras.forEach((palabra) => {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length <= maxChars) {
      actual = candidata;
    } else {
      if (actual) lineas.push(actual);
      if (palabra.length > maxChars) {
        for (let i = 0; i < palabra.length; i += maxChars) {
          lineas.push(palabra.slice(i, i + maxChars));
        }
        actual = "";
      } else {
        actual = palabra;
      }
    }
  });
  if (actual) lineas.push(actual);
  return lineas;
}

function escaparPdf(texto) {
  return String(texto || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function crearPdfBasico(lineasPorPagina, nombreArchivo = "documento.pdf") {
  const width = 595;
  const height = 842;
  const objects = [];

  function addObject(body) {
    objects.push(body);
    return objects.length;
  }

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];

  lineasPorPagina.forEach((lineas) => {
    let contenido = "BT\n/F1 11 Tf\n40 800 Td\n14 TL\n";
    lineas.forEach((linea, idx) => {
      contenido += `(${escaparPdf(linea)}) Tj\n`;
      if (idx < lineas.length - 1) contenido += "T*\n";
    });
    contenido += "ET";
    const stream = `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`;
    const contentId = addObject(stream);
    const pageId = addObject(`<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  const pagesId = addObject(`<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`);
  pageIds.forEach((pageId) => {
    objects[pageId - 1] = objects[pageId - 1].replace("PAGES_REF", `${pagesId} 0 R`);
  });
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new File([new Blob([pdf], { type: "application/pdf" })], nombreArchivo, { type: "application/pdf" });
}

function construirLineasBackupMensual(data, año, mes) {
  const lineas = [];
  lineas.push("CIERRE MENSUAL - COPIA VISUAL");
  lineas.push(`${MESES[mes].toUpperCase()} ${año}`);
  lineas.push(`Generado: ${new Date().toLocaleString("es-ES")}`);
  lineas.push("");

  ["familiar", "adri", "gisela"].forEach((tipo) => {
    const base = BASE_PRESUPUESTOS[tipo];
    const totales = calcTotales(data, tipo, año, mes);
    const mesData = data?.[año]?.[tipo]?.[mes] || {};
    lineas.push("============================================================");
    lineas.push(`${base.label.toUpperCase()} ${base.icon}`);
    lineas.push(`Ingresos: ${fmtDisplay(totales.ingresos)} | Gastos: ${fmtDisplay(totales.gastos)} | Disponible: ${fmtSignedDisplay(totales.disponible)}`);
    lineas.push("");

    ["ingresos", "gastos"].forEach((seccion) => {
      lineas.push(seccion === "ingresos" ? "INGRESOS" : "GASTOS");
      const categorias = getAllCats(data, tipo, seccion);
      const conValor = categorias
        .map((cat) => ({ cat, raw: mesData?.[seccion]?.[cat], total: calcularValorCategoria(mesData?.[seccion]?.[cat]) }))
        .filter((item) => item.total !== 0);

      if (conValor.length === 0) {
        lineas.push("- Sin datos");
      } else {
        conValor.forEach((item) => {
          lineas.push(`- ${item.cat}: ${fmtDisplay(item.total)}`);
          const movimientos = obtenerMovimientosDeValor(item.raw);
          movimientos.forEach((mov) => {
            const etiqueta = `${formatearFecha(mov.fecha)} | ${fmtSignedDisplay(normalizarNumero(mov.importe))}${mov.nota ? ` | ${mov.nota}` : ""}${mov.automatico ? " | AUTO" : ""}`;
            lineas.push(`   - ${etiqueta}`);
          });
        });
      }
      lineas.push("");
    });

    const nota = (mesData?.notasMes || "").trim();
    lineas.push("NOTAS");
    if (nota) {
      partirLineaPdf(nota, 82).forEach((l) => lineas.push(`- ${l}`));
    } else {
      lineas.push("- Sin notas");
    }
    lineas.push("");

    const automatismos = getAutomatismos(data, tipo).filter((a) => a?.activo);
    lineas.push("AUTOMATISMOS ACTIVOS");
    if (automatismos.length === 0) {
      lineas.push("- Ninguno");
    } else {
      automatismos.forEach((auto) => {
        lineas.push(`- ${auto.categoria}: ${fmtDisplay(auto.importe)} | Dia ${auto.dia} | Desde ${auto.desde}${auto.ilimitado ? " | Sin fin" : ` | Hasta ${auto.hasta || "-"}`}${auto.nota ? ` | ${auto.nota}` : ""}`);
      });
    }
    lineas.push("");
    lineas.push("");
  });
  return lineas;
}

function paginarLineasPdf(lineas, maxLineasPorPagina = 52) {
  const paginas = [];
  let actual = [];
  lineas.forEach((linea) => {
    const trozos = partirLineaPdf(linea, 88);
    trozos.forEach((trozo) => {
      if (actual.length >= maxLineasPorPagina) {
        paginas.push(actual);
        actual = [];
      }
      actual.push(trozo);
    });
  });
  if (actual.length) paginas.push(actual);
  return paginas;
}

function descargarArchivo(file) {

  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(angleInRadians), y: cy + r * Math.sin(angleInRadians) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

function DonutChart({ items, total, size = 200, strokeWidth = 26 }) {
  if (!items.length || total <= 0) {
    return (
      <div style={{ height: size, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13 }}>
        Sin datos
      </div>
    );
  }
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  let currentAngle = 0;
  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--surface)" strokeWidth={strokeWidth} />
        {items.map((item, index) => {
          const angle = (item.total / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle += angle;
          if (angle <= 0) return null;
          return (
            <path
              key={item.categoria}
              d={describeArc(center, center, radius, startAngle, endAngle)}
              fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          );
        })}
        <circle cx={center} cy={center} r={radius - strokeWidth / 2} fill="var(--card)" />
        <text x="50%" y="46%" textAnchor="middle" fill="var(--muted)" fontSize="10" fontWeight="600" letterSpacing="1">TOTAL</text>
        <text x="50%" y="58%" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700" fontFamily="Space Grotesk, sans-serif">{Math.round(total)}€</text>
      </svg>
    </div>
  );
}

/* ─── SECCION COMPONENT ─── */
function Seccion({ titulo, color, cats, seccion, tipo, getValor, onTap, total, editable, data }) {
  const [abierta, setAbierta] = useState(true);

  const iconoSeccion = seccion === "ingresos" ? "💰" : "💸";
  const tituloLimpio = seccion === "ingresos" ? "Ingresos" : "Gastos";

  return (
    <div className="section-card">
      <div
        className={`section-header ${abierta ? "open" : ""}`}
        onClick={() => setAbierta((a) => !a)}
      >
        <div className="section-title-wrap">
          <div
            style={{
              width: 38, height: 38,
              borderRadius: 12,
              background: `${color}18`,
              border: `1px solid ${color}24`,
              display: "grid", placeItems: "center",
              fontSize: 18
            }}
          >
            {iconoSeccion}
          </div>
          <div>
            <div className="section-title syne">{tituloLimpio}</div>
            <div className="section-count">{cats.length} apartados</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="section-total-badge nums"
            style={{
              color,
              background: `${color}14`,
              border: `1px solid ${color}28`
            }}
          >
            {fmtDisplay(total)}
          </span>
          <span style={{ color: "var(--muted)", fontSize: 11, transition: "transform 0.2s", display: "block", transform: abierta ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </div>
      </div>

      {abierta && (
        <div className="cats-grid">
          {cats.map((cat) => {
            const val = getValor(tipo, seccion, cat);
            const tieneValor = val !== "" && val !== 0;
            return (
              <div
                key={cat}
                className={`cat-card ${tieneValor ? "has-value" : ""} ${!editable ? "readonly" : ""}`}
                onClick={() => editable && onTap(tipo, seccion, cat)}
              >
                <div className="cat-card-top">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div
                      className="cat-icon-wrap"
                      style={{ background: `${color}14`, border: `1px solid ${color}20` }}
                    >
                      {getEmojiCategoria(data, tipo, seccion, cat)}
                    </div>
                    <span className="cat-name">{cat}</span>
                  </div>
                  <span className="cat-edit-icon">{editable ? "✏️" : "🔒"}</span>
                </div>
                <div>
                  <div
                    className="cat-amount nums"
                    style={{ color: tieneValor ? color : "var(--muted)" }}
                  >
                    {tieneValor ? fmtDisplay(val) : "—"}
                  </div>
                  <div className="cat-hint">
                    {editable ? "Editar o añadir movimientos" : "Solo lectura"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN APP ─── */
export default function App() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [año, setAño] = useState(AÑO_ACTUAL);
  const [mes, setMes] = useState(MES_ACTUAL);
  const [tab, setTab] = useState("familiar");
  const [vista, setVista] = useState("mes");
  const [editando, setEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [movFecha, setMovFecha] = useState(hoyISO());
  const [movNota, setMovNota] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("gasto");
  const [errorCarga, setErrorCarga] = useState("");
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 900 : false);
  const [notaMesInput, setNotaMesInput] = useState("");
  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [seccionNuevaCategoria, setSeccionNuevaCategoria] = useState("gastos");
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState("");
  const [emojiNuevaCategoria, setEmojiNuevaCategoria] = useState("📦");
  const [modalGestionApartados, setModalGestionApartados] = useState(false);
  const [apartadoAEliminar, setApartadoAEliminar] = useState(null);
  const [modalAutomatismosAbierto, setModalAutomatismosAbierto] = useState(false);
  const [generandoCierre, setGenerandoCierre] = useState(false);
  const [mensajeBackup, setMensajeBackup] = useState("");
  const [automatismoDia, setAutomatismoDia] = useState(15);
  const [automatismoCategoria, setAutomatismoCategoria] = useState("");
  const [automatismoImporte, setAutomatismoImporte] = useState("");
  const [automatismoDesde, setAutomatismoDesde] = useState(`${AÑO_ACTUAL}-${String(MES_ACTUAL + 1).padStart(2, "0")}`);
  const [automatismoHasta, setAutomatismoHasta] = useState(`${AÑO_ACTUAL + 1}-12`);
  const [automatismoIlimitado, setAutomatismoIlimitado] = useState(false);
  const [automatismoNota, setAutomatismoNota] = useState("");
  const firmaAutoAplicadaRef = useRef("");

  const emailActual = (user?.email || "").toLowerCase();
  const puedeEditarTabActual = puedeEditarTipo(emailActual, tab);
  const puedeGenerarCierreMensual = emailActual === EMAIL_ADRI;

  useEffect(() => {
    function handleResize() { setIsDesktop(window.innerWidth >= 900); }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) { setData(null); setErrorCarga(""); return; }
      try {
        const remoto = await cargarPresupuesto();
        const inicial = asegurarMeta(remoto || getInitialData());
        setData(inicial);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inicial)); } catch (e) {}
      } catch (e) {
        console.error("Error cargando presupuesto compartido:", e);
        setErrorCarga("No se pudo cargar la nube. Se ha cargado la copia local.");
        setData(asegurarMeta(getInitialData()));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!data) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }, [data]);

  useEffect(() => {
    if (!data || !user) return;
    const timer = setTimeout(() => {
      guardarPresupuesto(data).catch((e) => console.error("Error guardando:", e));
    }, 500);
    return () => clearTimeout(timer);
  }, [data, user]);

  useEffect(() => {
    if (!data) return;
    const nota = data?.[año]?.[tab]?.[mes]?.notasMes || "";
    setNotaMesInput(nota);
  }, [data, año, mes, tab]);

  useEffect(() => {
    if (!data) return;
    const catsGastos = getAllCats(data, tab, "gastos");
    if (!automatismoCategoria || !catsGastos.includes(automatismoCategoria)) {
      setAutomatismoCategoria(catsGastos[0] || "");
    }
  }, [data, tab, automatismoCategoria]);

  useEffect(() => {
    if (!data || !user) return;
    const hoyFirma = new Date().toISOString().slice(0, 10);
    const firma = `${hoyFirma}::${JSON.stringify(data?._meta?.automatismos || {})}`;
    if (firmaAutoAplicadaRef.current === firma) return;
    const { next, cambios } = aplicarAutomatismosPendientes(data, new Date());
    firmaAutoAplicadaRef.current = firma;
    if (cambios > 0) setData(next);
  }, [data, user]);

  function asegurarRuta(next, tipo, seccion, cat) {
    asegurarMeta(next);
    if (!next[año]) next[año] = {};
    if (!next[año][tipo]) next[año][tipo] = {};
    if (!next[año][tipo][mes]) next[año][tipo][mes] = { ingresos: {}, gastos: {}, notasMes: "" };
    if (!next[año][tipo][mes].ingresos) next[año][tipo][mes].ingresos = {};
    if (!next[año][tipo][mes].gastos) next[año][tipo][mes].gastos = {};
    if (next[año][tipo][mes].notasMes === undefined) next[año][tipo][mes].notasMes = "";
    if (!next[año][tipo][mes][seccion]) next[año][tipo][mes][seccion] = {};
    if (next[año][tipo][mes][seccion][cat] === undefined) next[año][tipo][mes][seccion][cat] = "";
  }

  function asegurarRutaMes(next, tipo) {
    asegurarMeta(next);
    if (!next[año]) next[año] = {};
    if (!next[año][tipo]) next[año][tipo] = {};
    if (!next[año][tipo][mes]) next[año][tipo][mes] = { ingresos: {}, gastos: {}, notasMes: "" };
    if (!next[año][tipo][mes].ingresos) next[año][tipo][mes].ingresos = {};
    if (!next[año][tipo][mes].gastos) next[año][tipo][mes].gastos = {};
    if (next[año][tipo][mes].notasMes === undefined) next[año][tipo][mes].notasMes = "";
  }

  function getRawValor(tipo, seccion, cat) {
    return data?.[año]?.[tipo]?.[mes]?.[seccion]?.[cat];
  }

  function getValor(tipo, seccion, cat) {
    return calcularValorCategoria(getRawValor(tipo, seccion, cat));
  }

  function getMovimientos(tipo, seccion, cat) {
    return obtenerMovimientosDeValor(getRawValor(tipo, seccion, cat));
  }

  function setValorManual(tipo, seccion, cat, valor) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarRuta(next, tipo, seccion, cat);
      next[año][tipo][mes][seccion][cat] = valor === "" ? "" : normalizarNumero(valor);
      return next;
    });
  }

  function setNotaMes(tipo, texto) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarRutaMes(next, tipo);
      next[año][tipo][mes].notasMes = texto;
      return next;
    });
  }

  function convertirAMovimientosSiHaceFalta(tipo, seccion, cat) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarRuta(next, tipo, seccion, cat);
      const actual = next[año][tipo][mes][seccion][cat];
      if (actual && typeof actual === "object" && !Array.isArray(actual) && Array.isArray(actual.movimientos)) return next;
      const numeroActual = normalizarNumero(actual);
      next[año][tipo][mes][seccion][cat] = numeroActual === 0
        ? { movimientos: [] }
        : { movimientos: [{ importe: numeroActual, fecha: hoyISO(), nota: "Importe inicial" }] };
      return next;
    });
  }

  function agregarMovimiento(tipo, seccion, cat, movimiento) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarRuta(next, tipo, seccion, cat);
      const actual = next[año][tipo][mes][seccion][cat];
      if (!actual || typeof actual !== "object" || Array.isArray(actual) || !Array.isArray(actual.movimientos)) {
        const num = normalizarNumero(actual);
        next[año][tipo][mes][seccion][cat] = { movimientos: num !== 0 ? [{ importe: num, fecha: hoyISO(), nota: "Importe inicial" }] : [] };
      }
      next[año][tipo][mes][seccion][cat].movimientos.push(movimiento);
      return next;
    });
  }

  function borrarMovimiento(tipo, seccion, cat, index) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const movimientos = next?.[año]?.[tipo]?.[mes]?.[seccion]?.[cat]?.movimientos;
      if (Array.isArray(movimientos)) movimientos.splice(index, 1);
      return next;
    });
  }


  function guardarAutomatismo() {
    if (!puedeEditarTabActual) return;
    const categoria = automatismoCategoria;
    const importe = Math.abs(normalizarNumero(automatismoImporte));
    const dia = Math.max(1, Math.min(31, parseInt(automatismoDia, 10) || 1));
    if (!categoria || !importe || !automatismoDesde) return;

    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarMeta(next);
      next._meta.automatismos[tab].push({
        id: crearIdUnico(),
        activo: true,
        seccion: "gastos",
        categoria,
        importe,
        dia,
        desde: automatismoDesde,
        hasta: automatismoIlimitado ? null : automatismoHasta,
        ilimitado: automatismoIlimitado,
        nota: automatismoNota.trim(),
        creadoEn: new Date().toISOString()
      });
      return next;
    });

    setAutomatismoImporte("");
    setAutomatismoDia(15);
    setAutomatismoNota("");
    setAutomatismoIlimitado(false);
    setAutomatismoDesde(`${año}-${String(mes + 1).padStart(2, "0")}`);
    setAutomatismoHasta(`${año + 1}-12`);
    setModalAutomatismosAbierto(false);
  }

  function cambiarEstadoAutomatismo(tipo, automatismoId, activo) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarMeta(next);
      next._meta.automatismos[tipo] = next._meta.automatismos[tipo].map((item) =>
        item.id === automatismoId ? { ...item, activo } : item
      );
      return next;
    });
  }

  function borrarAutomatismo(tipo, automatismoId) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarMeta(next);
      next._meta.automatismos[tipo] = next._meta.automatismos[tipo].filter((item) => item.id !== automatismoId);
      return next;
    });
  }

  function agregarCategoriaPersonalizada() {
    if (!puedeEditarTabActual) return;
    const nombre = nombreNuevaCategoria.trim();
    const emoji = emojiNuevaCategoria || "📦";
    if (!nombre) return;
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarMeta(next);
      const yaExisteBase = BASE_PRESUPUESTOS[tab].cats[seccionNuevaCategoria].includes(nombre);
      const yaExisteCustom = getCustomCats(next, tab, seccionNuevaCategoria).some((x) => x.name.toLowerCase() === nombre.toLowerCase());
      if (yaExisteBase || yaExisteCustom) return next;
      next._meta.customCats[tab][seccionNuevaCategoria].push({ name: nombre, emoji });
      return next;
    });
    setNombreNuevaCategoria("");
    setEmojiNuevaCategoria("📦");
    setSeccionNuevaCategoria("gastos");
    setModalCategoriaAbierto(false);
  }

  function borrarCategoriaPersonalizada(tipo, seccion, nombreCategoria) {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      asegurarMeta(next);
      next._meta.customCats[tipo][seccion] = next._meta.customCats[tipo][seccion].filter((item) => item.name !== nombreCategoria);
      Object.keys(next).forEach((yearKey) => {
        if (yearKey === "_meta") return;
        if (!next[yearKey]?.[tipo]) return;
        Object.keys(next[yearKey][tipo]).forEach((mesKey) => {
          if (next[yearKey][tipo][mesKey]?.[seccion]?.[nombreCategoria] !== undefined) {
            delete next[yearKey][tipo][mesKey][seccion][nombreCategoria];
          }
        });
      });
      return next;
    });
    setApartadoAEliminar(null);
  }

  function abrirEdicion(tipo, seccion, cat) {
    if (!puedeEditarTipo(emailActual, tipo)) return;
    const val = getValor(tipo, seccion, cat);
    const raw = getRawValor(tipo, seccion, cat);
    const yaUsaMovimientos = raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.movimientos);
    setEditando({ tipo, seccion, cat });
    // Si la categoría ya usa el modo "movimientos", dejamos el input vacío
    // para facilitar añadir un nuevo movimiento (no prefijar con el total).
    setInputVal(yaUsaMovimientos ? "" : (val === 0 ? "" : String(val)));
    setMovFecha(hoyISO());
    setMovNota("");
    setTipoMovimiento("gasto");
    setModalAbierto(true);
  }

  function guardarEdicionManual() {
    if (!editando) return;
    if (!puedeEditarTipo(emailActual, editando.tipo)) return;
    setValorManual(editando.tipo, editando.seccion, editando.cat, inputVal);
    setModalAbierto(false);
    setEditando(null);
    setInputVal("");
    setMovNota("");
    setMovFecha(hoyISO());
    setTipoMovimiento("gasto");
  }

  function guardarNuevoMovimiento() {
    if (!editando) return;
    if (!puedeEditarTipo(emailActual, editando.tipo)) return;
    const importeBase = normalizarNumero(inputVal);
    if (!inputVal || !Number.isFinite(importeBase)) return;
    const importe = tipoMovimiento === "abono" ? -Math.abs(importeBase) : Math.abs(importeBase);
    agregarMovimiento(editando.tipo, editando.seccion, editando.cat, {
      importe, fecha: movFecha || hoyISO(), nota: movNota.trim()
    });
    setInputVal("");
    setMovNota("");
    setMovFecha(hoyISO());
    setTipoMovimiento("gasto");
  }

  async function generarCierreMensual() {
    if (!puedeGenerarCierreMensual || !data || generandoCierre) return;
    setGenerandoCierre(true);
    setMensajeBackup("");

    try {
      const nombreMes = MESES[mes].toLowerCase();
      const fileName = `cierre-${año}-${String(mes + 1).padStart(2, "0")}-${nombreMes}.pdf`;
      const lineas = construirLineasBackupMensual(data, año, mes);
      const paginas = paginarLineasPdf(lineas);
      const pdfFile = crearPdfBasico(paginas, fileName);

      descargarArchivo(pdfFile);
      setMensajeBackup("PDF del cierre mensual generado y descargado.");
    } catch (error) {
      console.error("Error generando cierre mensual:", error);
      setMensajeBackup("No se pudo generar el PDF del cierre mensual. Revisa la consola para ver el detalle.");
    } finally {
      setGenerandoCierre(false);
    }
  }

  const cats = useMemo(() => {
    if (!data) return { ingresos: [], gastos: [] };
    return { ingresos: getAllCats(data, tab, "ingresos"), gastos: getAllCats(data, tab, "gastos") };
  }, [data, tab]);

  const automatismosTabActual = useMemo(() => {
    if (!data) return [];
    return getAutomatismos(data, tab);
  }, [data, tab]);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            💶 Presupuesto
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</div>
        </div>
      </div>
    );
  }

  const totales = calcTotales(data, tab, año, mes);
  const totalesAnuales = calcAnual(data, tab, año);
  const disponibleColor = (n) => n >= 0 ? "var(--green)" : "var(--red)";

  const movimientosActuales = editando ? getMovimientos(editando.tipo, editando.seccion, editando.cat) : [];
  const rawEditado = editando ? getRawValor(editando.tipo, editando.seccion, editando.cat) : null;
  const usandoMovimientos = !!(rawEditado && typeof rawEditado === "object" && !Array.isArray(rawEditado) && Array.isArray(rawEditado.movimientos));

  const categoriasGastoAnual = calcCategoriaAnual(data, tab, año, "gastos");
  const totalGastoAnual = categoriasGastoAnual.reduce((acc, item) => acc + item.total, 0);
  const categoriasGrafica = resumirTopCategorias(categoriasGastoAnual, 5);
  const principalGasto = categoriasGastoAnual.find((x) => x.total > 0);
  const mesesConGasto = MESES.reduce((acc, _, i) => acc + (calcTotales(data, tab, año, i).gastos > 0 ? 1 : 0), 0);
  const mediaMensualGasto = mesesConGasto > 0 ? totalGastoAnual / mesesConGasto : 0;

  const prevRef = mes === 0 ? { año: año - 1, mes: 11 } : { año, mes: mes - 1 };
  const totalesMesAnterior = calcTotales(data, tab, prevRef.año, prevRef.mes);
  const deltaDisponible = totales.disponible - totalesMesAnterior.disponible;
  const ratioGastoIngresos = totales.ingresos > 0 ? (totales.gastos / totales.ingresos) * 100 : (totales.gastos > 0 ? 100 : 0);
  const progressWidth = Math.min(ratioGastoIngresos, 100);
  const ratioColor = ratioGastoIngresos <= 70 ? "var(--green)" : ratioGastoIngresos <= 100 ? "var(--orange)" : "var(--red)";
  const estadoMes = ratioGastoIngresos > 100 ? "En rojo" : ratioGastoIngresos > 85 ? "Ajustado" : "Bajo control";
  const categoriasGastoMes = cats.gastos
    .map((cat) => ({ categoria: cat, total: getValor(tab, "gastos", cat) }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
  const principalGastoMes = categoriasGastoMes[0] || null;
  const mediaHistoricaDisponible = MESES.reduce((acc, _, i) => acc + calcTotales(data, tab, año, i).disponible, 0) / 12;
  const alertas = [];
  if (totales.disponible < 0) {
    alertas.push({ tipo: "warn", icono: "⚠️", texto: `Este mes vas en negativo por ${fmtDisplay(Math.abs(totales.disponible))}.` });
  }
  if (ratioGastoIngresos > 100 && totales.ingresos > 0) {
    alertas.push({ tipo: "warn", icono: "📈", texto: `Has gastado ${fmtPct(ratioGastoIngresos)} de tus ingresos.` });
  }
  if (principalGastoMes && principalGastoMes.total > 0) {
    const pctPrincipal = totales.gastos > 0 ? (principalGastoMes.total / totales.gastos) * 100 : 0;
    if (pctPrincipal >= 35) {
      alertas.push({ tipo: "warn", icono: "🎯", texto: `${principalGastoMes.categoria} concentra ${fmtPct(pctPrincipal)} del gasto del mes.` });
    }
  }
  if (totales.disponible > 0 && deltaDisponible >= 0) {
    alertas.push({ tipo: "good", icono: "✅", texto: `Vas mejor que ${MESES[prevRef.mes]}: ${fmtSignedDisplay(deltaDisponible)} frente al mes anterior.` });
  }
  if (alertas.length === 0) {
    alertas.push({ tipo: "good", icono: "👌", texto: "Mes estable: no hay alertas importantes en este momento." });
  }
  const historialMeses = MESES.map((nombre, i) => ({ nombre, index: i, ...calcTotales(data, tab, año, i) }));

  const kpiData = [
    { label: "Ingresos",    val: vista === "mes" ? totales.ingresos   : totalesAnuales.ingresos,   color: "var(--green)",  cls: "income",    icon: "↑" },
    { label: "Gastos",      val: vista === "mes" ? totales.gastos     : totalesAnuales.gastos,     color: "var(--orange)", cls: "expense",   icon: "↓" },
    { label: "Disponible",  val: vista === "mes" ? totales.disponible : totalesAnuales.disponible, color: disponibleColor(vista === "mes" ? totales.disponible : totalesAnuales.disponible), cls: "available", icon: "◈" },
  ];

  return (
    <div className="app-shell">
      {/* ─── SIDEBAR (desktop only) ─── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="badge">Presupuesto compartido</div>
          <div className="title syne">💶 Finanzas {año}</div>
          <div className="email">{user?.email || "Sin usuario"}</div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Vista</div>
          {["mes", "anual"].map((v) => (
            <button
              key={v}
              className={`sidebar-tab ${vista === v ? "active" : ""}`}
              onClick={() => setVista(v)}
            >
              <span className="tab-icon">{v === "mes" ? "📅" : "📊"}</span>
              {v === "mes" ? "Mensual" : "Anual"}
            </button>
          ))}
        </div>

        <div className="sidebar-section" style={{ marginTop: 8 }}>
          <div className="sidebar-section-label">Presupuesto</div>
          {Object.entries(BASE_PRESUPUESTOS).map(([key, { label, icon }]) => (
            <button
              key={key}
              className={`sidebar-tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              <span className="tab-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {puedeEditarTabActual && (
          <div className="sidebar-section" style={{ marginTop: 8 }}>
            <div className="sidebar-section-label">Gestión</div>
            <button className="sidebar-tab" onClick={() => setModalCategoriaAbierto(true)}>
              <span className="tab-icon">＋</span>
              Añadir apartado
            </button>
            <button className="sidebar-tab" onClick={() => setModalGestionApartados(true)}>
              <span className="tab-icon">🗂</span>
              Gestionar apartados
            </button>
            <button className="sidebar-tab" onClick={() => setModalAutomatismosAbierto(true)}>
              <span className="tab-icon">🔁</span>
              Automatizar gastos
            </button>
            {puedeGenerarCierreMensual && (
              <button className="sidebar-tab" onClick={generarCierreMensual}>
                <span className="tab-icon">📄</span>
                {generandoCierre ? "Generando cierre..." : "Generar cierre mensual"}
              </button>
            )}
          </div>
        )}

        <div className="sidebar-year">
          <button className="year-btn" onClick={() => setAño((y) => y - 1)}>◀ {año - 1}</button>
          <div className="year-display syne nums">{año}</div>
          <button className="year-btn" onClick={() => setAño((y) => y + 1)}>{año + 1} ▶</button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="main-content">

        {/* TOP BAR */}
        <header className="topbar">
          <div className="topbar-top">
            <div className="topbar-user">
              <div className="user-avatar">
                {(user?.email || "?")[0].toUpperCase()}
              </div>
              <div>
                <div className="topbar-title syne">
                  {BASE_PRESUPUESTOS[tab].icon} {BASE_PRESUPUESTOS[tab].label} · {año}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{user?.email || "Sin usuario"}</div>
              </div>
            </div>

            <div className="topbar-actions">
              {vista === "mes" && (
                <div className="month-strip">
                  {MESES.map((m, i) => (
                    <button key={i} className={`month-btn ${mes === i ? "active" : ""}`} onClick={() => setMes(i)}>
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mobile-year">
              <button
                onClick={() => setAño((y) => y - 1)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border2)", background: "transparent", color: "var(--subtle)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >{año - 1}</button>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700 }}>{año}</span>
              <button
                onClick={() => setAño((y) => y + 1)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border2)", background: "transparent", color: "var(--subtle)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >{año + 1}</button>
            </div>
          </div>
        </header>

        {/* ERROR BANNER */}
        {errorCarga && (
          <div className="error-banner">
            ⚠️ {errorCarga}
          </div>
        )}
        {mensajeBackup && (
          <div className="error-banner" style={{ background: "rgba(34,208,122,0.10)", borderColor: "rgba(34,208,122,0.28)", color: "#86efac" }}>
            📄 {mensajeBackup}
          </div>
        )}

        {/* KPI GRID */}
        <div className="kpi-grid">
          {kpiData.map(({ label, val, color, cls, icon }) => (
            <div key={label} className={`kpi-card ${cls}`}>
              <div className="kpi-label">
                <span style={{ fontFamily: "monospace", fontSize: 14, color }}>{icon}</span>
                {label}
              </div>
              <div className="kpi-value syne nums" style={{ color }}>
                {label === "Disponible" ? fmtSignedDisplay(val) : fmtDisplay(val)}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                {vista === "mes" ? MESES[mes] : `Todo ${año}`}
              </div>
            </div>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="content-area">

          {/* Read-only notice */}
          {!puedeEditarTabActual && (
            <div className="readonly-notice">
              🔒 Solo lectura — Esta sección pertenece al otro usuario.
            </div>
          )}

          {/* Mobile toolbar */}
          {vista === "mes" && puedeEditarTabActual && (
            <div className="toolbar" style={{ display: isDesktop ? "none" : "flex" }}>
              <button className="btn-primary" onClick={() => setModalCategoriaAbierto(true)}>
                ＋ Añadir apartado
              </button>
              <button className="btn-secondary" onClick={() => setModalGestionApartados(true)}>
                🗂 Gestionar
              </button>
              <button className="btn-secondary" onClick={() => setModalAutomatismosAbierto(true)}>
                🔁 Automatismos
              </button>
              {puedeGenerarCierreMensual && (
                <button className="btn-secondary" onClick={generarCierreMensual}>
                  {generandoCierre ? "⏳ Generando..." : "📄 Cierre mensual"}
                </button>
              )}
            </div>
          )}

          {/* ─── ANNUAL VIEW ─── */}
          {vista === "anual" && (
            <div className="annual-grid">
              {/* LEFT: monthly table */}
              <div className="annual-table-card">
                <div className="annual-table-header">
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--subtle)" }}>MES</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>INGRESOS</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--orange)" }}>GASTOS</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--subtle)" }}>BALANCE</span>
                </div>
                {MESES.map((m, i) => {
                  const t = calcTotales(data, tab, año, i);
                  const hasDatos = t.ingresos > 0 || t.gastos > 0;
                  return (
                    <div
                      key={i}
                      className={`annual-table-row ${mes === i ? "active-month" : ""} ${!hasDatos ? "dim" : ""}`}
                      onClick={() => { setMes(i); setVista("mes"); }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{m.slice(0,3)}</span>
                      <span style={{ fontSize: 12, color: "var(--green)" }}>{t.ingresos > 0 ? fmtDisplay(t.ingresos) : "—"}</span>
                      <span style={{ fontSize: 12, color: "var(--orange)" }}>{t.gastos > 0 ? fmtDisplay(t.gastos) : "—"}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: disponibleColor(t.disponible) }}>
                        {hasDatos ? fmtSignedDisplay(t.disponible) : "—"}
                      </span>
                    </div>
                  );
                })}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "14px 20px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "Syne, sans-serif" }}>TOTAL</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--green)" }}>{fmtDisplay(totalesAnuales.ingresos)}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--orange)" }}>{fmtDisplay(totalesAnuales.gastos)}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: disponibleColor(totalesAnuales.disponible) }}>{fmtSignedDisplay(totalesAnuales.disponible)}</span>
                </div>
              </div>

              {/* RIGHT: charts & stats */}
              <div className="annual-side">
                <div className="stat-card">
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Distribución de gastos</div>
                  <DonutChart items={categoriasGrafica} total={totalGastoAnual} size={180} strokeWidth={22} />
                  <hr className="sep" />
                  {categoriasGrafica.map((item, index) => {
                    const pct = totalGastoAnual > 0 ? (item.total / totalGastoAnual) * 100 : 0;
                    return (
                      <div key={item.categoria} style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: CHART_COLORS[index % CHART_COLORS.length], flexShrink: 0, display: "block" }} />
                            <span style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.categoria}</span>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 800 }}>{fmtDisplay(item.total)}</div>
                            <div style={{ fontSize: 10, color: "var(--muted)" }}>{fmtPct(pct)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="stat-card">
                    <div className="stat-card-label">Mayor gasto</div>
                    <div className="stat-card-value syne" style={{ color: "var(--orange)", fontSize: 16 }}>
                      {principalGasto ? principalGasto.categoria : "—"}
                    </div>
                    <div className="stat-card-sub">{principalGasto ? fmtDisplay(principalGasto.total) : "Sin datos"}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">{mesesConGasto <= 1 ? "Meses con gasto" : "Media mensual"}</div>
                    <div className="stat-card-value syne" style={{ color: "var(--accent2)", fontSize: 16 }}>
                      {mesesConGasto <= 1 ? mesesConGasto : fmtDisplay(mediaMensualGasto)}
                    </div>
                    <div className="stat-card-sub">{mesesConGasto <= 1 ? "Aún poco histórico" : `${mesesConGasto} meses`}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Ranking de gastos</div>
                  {categoriasGastoAnual.filter((x) => x.total > 0).length === 0 ? (
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>Sin datos suficientes.</div>
                  ) : (
                    categoriasGastoAnual.filter((x) => x.total > 0).map((item, index) => {
                      const pct = totalGastoAnual > 0 ? (item.total / totalGastoAnual) * 100 : 0;
                      return (
                        <div key={item.categoria} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{index + 1}. {item.categoria}</span>
                            <span style={{ fontSize: 12, fontWeight: 800 }}>{fmtDisplay(item.total)}</span>
                          </div>
                          <div className="rank-bar-bg">
                            <div className="rank-bar-fill" style={{ width: `${pct}%`, background: CHART_COLORS[index % CHART_COLORS.length] }} />
                          </div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{fmtPct(pct)} del gasto anual</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── MONTHLY VIEW ─── */}
          {vista === "mes" && (
            <>
              <div className="month-health-card">
                <div className="month-health-top">
                  <div>
                    <div className="month-health-title">Estado del mes</div>
                    <div style={{ fontSize: 12, color: "var(--subtle)", marginTop: 4 }}>
                      Has gastado {fmtPct(ratioGastoIngresos)} de tus ingresos en {MESES[mes]}.
                    </div>
                  </div>
                  <span
                    className="status-pill"
                    style={{
                      color: ratioColor,
                      background: `${ratioColor}18`,
                      border: `1px solid ${ratioColor}30`
                    }}
                  >
                    {estadoMes}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progressWidth}%`,
                      background: ratioGastoIngresos > 100
                        ? 'linear-gradient(90deg, var(--orange) 0%, var(--red) 100%)'
                        : 'linear-gradient(90deg, var(--green) 0%, var(--accent) 100%)'
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 10, fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
                  <span>Ingresos: <strong className="nums" style={{ color: "var(--text)" }}>{fmtDisplay(totales.ingresos)}</strong></span>
                  <span>Gastos: <strong className="nums" style={{ color: "var(--text)" }}>{fmtDisplay(totales.gastos)}</strong></span>
                  <span>Disponible: <strong className="nums" style={{ color: disponibleColor(totales.disponible) }}>{fmtSignedDisplay(totales.disponible)}</strong></span>
                </div>
              </div>

              <Seccion
                titulo="Ingresos"
                color="var(--green)"
                cats={cats.ingresos}
                seccion="ingresos"
                tipo={tab}
                getValor={getValor}
                onTap={abrirEdicion}
                total={totales.ingresos}
                editable={puedeEditarTabActual}
                data={data}
              />

              <Seccion
                titulo="Gastos"
                color="var(--orange)"
                cats={cats.gastos}
                seccion="gastos"
                tipo={tab}
                getValor={getValor}
                onTap={abrirEdicion}
                total={totales.gastos}
                editable={puedeEditarTabActual}
                data={data}
              />

              <div className="insight-grid single-card">
                <div className="mini-card">
                  <div className="mini-card-title">Comparación con mes anterior</div>
                  <div className="mini-card-value nums" style={{ color: deltaDisponible >= 0 ? "var(--green)" : "var(--red)" }}>
                    {fmtSignedDisplay(deltaDisponible)}
                  </div>
                  <div className="mini-card-sub">
                    Frente a {MESES[prevRef.mes]} {prevRef.año !== año ? prevRef.año : ""}. Disponible anterior: <span className="nums">{fmtSignedDisplay(totalesMesAnterior.disponible)}</span>
                  </div>
                </div>

              </div>

              <div className="alert-list">
                {alertas.map((alerta, index) => (
                  <div key={`${alerta.tipo}-${index}`} className={`alert-item ${alerta.tipo}`}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{alerta.icono}</span>
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{alerta.texto}</div>
                  </div>
                ))}
              </div>

            <div className="section-card" style={{ marginBottom: 20 }}>
              <div className="section-header open" onClick={() => puedeEditarTabActual && setModalAutomatismosAbierto(true)}>
                <div className="section-title-wrap">
                  <div
                    style={{
                      width: 38, height: 38,
                      borderRadius: 12,
                      background: "rgba(59,124,244,0.14)",
                      border: "1px solid rgba(59,124,244,0.20)",
                      display: "grid", placeItems: "center",
                      fontSize: 18
                    }}
                  >
                    🔁
                  </div>
                  <div>
                    <div className="section-title syne">Automatismos mensuales</div>
                    <div className="section-count">{automatismosTabActual.length} reglas en {BASE_PRESUPUESTOS[tab].label}</div>
                  </div>
                </div>
                {puedeEditarTabActual && (
                  <div className="section-total-badge nums" style={{ color: "var(--accent2)", background: "rgba(59,124,244,0.14)", border: "1px solid rgba(59,124,244,0.24)" }}>
                    Gestionar
                  </div>
                )}
              </div>
              <div style={{ padding: "0 16px 16px" }}>
                {automatismosTabActual.length === 0 ? (
                  <div style={{ padding: "14px 16px", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", fontSize: 13 }}>
                    No hay gastos automatizados todavía.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {automatismosTabActual.map((auto) => (
                      <div key={auto.id} className="mov-item" style={{ marginBottom: 0 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
                            {getEmojiCategoria(data, tab, "gastos", auto.categoria)} {auto.categoria} · {fmtDisplay(auto.importe)}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                            Día {auto.dia} · desde {auto.desde}{auto.ilimitado ? " · sin fin" : ` · hasta ${auto.hasta}`} · {auto.activo ? "activo" : "pausado"}
                          </div>
                        </div>
                        {puedeEditarTabActual && (
                          <button className="btn-secondary" style={{ padding: "8px 12px", borderRadius: 10 }} onClick={() => setModalAutomatismosAbierto(true)}>
                            Ver
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

              <div className="history-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700 }}>Historial del año</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Resumen rápido del disponible por mes.</div>
                  </div>
                  <div className="nums" style={{ fontSize: 12, color: "var(--subtle)", fontWeight: 700 }}>{año}</div>
                </div>
                <div className="history-grid">
                  {historialMeses.map((item) => (
                    <div key={item.index} className={`history-item ${item.index === mes ? "active" : ""}`}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{item.nombre.slice(0, 3)}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                          {item.ingresos > 0 || item.gastos > 0 ? `${fmtDisplay(item.ingresos)} / ${fmtDisplay(item.gastos)}` : 'Sin datos'}
                        </div>
                      </div>
                      <div className="nums" style={{ fontSize: 13, fontWeight: 700, color: disponibleColor(item.disponible) }}>
                        {item.ingresos > 0 || item.gastos > 0 ? fmtSignedDisplay(item.disponible) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="notes-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>📝</span>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 14, fontWeight: 700 }}>Notas del mes</span>
                </div>
                <textarea
                  className="notes-textarea"
                  value={notaMesInput}
                  onChange={(e) => {
                    setNotaMesInput(e.target.value);
                    if (puedeEditarTabActual) setNotaMes(tab, e.target.value);
                  }}
                  readOnly={!puedeEditarTabActual}
                  placeholder={puedeEditarTabActual ? "Ej: Adeslas descontado en nómina: 62,40 €. No sumarlo como gasto aparte." : "Sin notas"}
                />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Estas notas son informativas y no alteran ingresos ni gastos.</div>
              </div>

              {/* Balance banner */}
              <div className={`balance-banner ${totales.disponible >= 0 ? "positive" : "negative"}`}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--subtle)", marginBottom: 6 }}>
                    {MESES[mes]} — Dinero disponible
                  </div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 32, fontWeight: 700, color: "#fff" }}>
                    {fmtSignedDisplay(totales.disponible)}
                  </div>
                </div>
                <div style={{ fontSize: 36 }}>
                  {totales.disponible >= 0 ? "✅" : "⚠️"}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── MOBILE BOTTOM NAV ─── */}
        <nav className="mobile-nav">
          {Object.entries(BASE_PRESUPUESTOS).map(([key, { label, icon }]) => (
            <button
              key={key}
              className={`mobile-nav-btn ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              <span className="icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
          <button
            className={`mobile-nav-btn ${vista === "anual" ? "active" : ""}`}
            onClick={() => setVista(v => v === "anual" ? "mes" : "anual")}
          >
            <span className="icon">📊</span>
            <span>Anual</span>
          </button>
        </nav>

      </main>

      {/* ─── MODAL: Add Category ─── */}
      {modalCategoriaAbierto && (
        <div className="modal-overlay" style={{ alignItems: "center" }} onClick={() => setModalCategoriaAbierto(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Añadir apartado</div>
            <div className="modal-subtitle">
              Se guardará para {BASE_PRESUPUESTOS[tab].label} en todos los meses.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Sección</label>
              <div className="choice-grid">
                <button
                  className={`choice-btn ${seccionNuevaCategoria === "gastos" ? "active-orange" : ""}`}
                  onClick={() => setSeccionNuevaCategoria("gastos")}
                >💸 Gasto</button>
                <button
                  className={`choice-btn ${seccionNuevaCategoria === "ingresos" ? "active-green" : ""}`}
                  onClick={() => setSeccionNuevaCategoria("ingresos")}
                >💰 Ingreso</button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                value={nombreNuevaCategoria}
                onChange={(e) => setNombreNuevaCategoria(e.target.value)}
                placeholder="Ej. Gym, Dentista, Mascota..."
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Emoji</label>
              <div className="emoji-strip">
                {EMOJIS_SUGERIDOS.map((emoji) => (
                  <button
                    key={emoji}
                    className={`emoji-btn ${emojiNuevaCategoria === emoji ? "selected" : ""}`}
                    onClick={() => setEmojiNuevaCategoria(emoji)}
                  >{emoji}</button>
                ))}
              </div>
            </div>

            <div className="choice-grid">
              <button className="choice-btn" onClick={() => setModalCategoriaAbierto(false)}>Cancelar</button>
              <button
                className="choice-btn active-blue"
                style={{ fontWeight: 800 }}
                onClick={agregarCategoriaPersonalizada}
              >Guardar apartado</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Manage Categories ─── */}
      {modalGestionApartados && (
        <div className="modal-overlay" style={{ alignItems: "center" }} onClick={() => setModalGestionApartados(false)}>
          <div className="modal-box" style={{ maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Gestionar apartados</div>
            <div className="modal-subtitle">Apartados personalizados de {BASE_PRESUPUESTOS[tab].label}.</div>

            {["ingresos", "gastos"].map((seccion) => {
              const custom = getCustomCats(data, tab, seccion);
              return (
                <div key={seccion} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--subtle)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                    {seccion === "ingresos" ? "💰 Ingresos" : "💸 Gastos"}
                  </div>
                  {custom.length === 0 ? (
                    <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface)", color: "var(--muted)", fontSize: 13, border: "1px solid var(--border)" }}>
                      No hay apartados personalizados.
                    </div>
                  ) : (
                    custom.map((item) => (
                      <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 8, borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{item.emoji || "📦"}</span>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</span>
                        </div>
                        <button
                          onClick={() => setApartadoAEliminar({ tipo: tab, seccion, nombre: item.name })}
                          className="mov-delete-btn"
                        >Borrar</button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}

            <button
              style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: "var(--border2)", color: "var(--text)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              onClick={() => setModalGestionApartados(false)}
            >Cerrar</button>
          </div>
        </div>
      )}

      {/* ─── MODAL: Confirm Delete ─── */}
      {apartadoAEliminar && (
        <div className="modal-overlay" style={{ alignItems: "center" }} onClick={() => setApartadoAEliminar(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">¿Borrar apartado?</div>
            <div style={{ fontSize: 14, color: "var(--subtle)", marginBottom: 24, lineHeight: 1.55 }}>
              Se eliminará <strong style={{ color: "var(--text)" }}>{apartadoAEliminar.nombre}</strong> y todos sus valores guardados. Esta acción no se puede deshacer.
            </div>
            <div className="choice-grid">
              <button className="choice-btn" onClick={() => setApartadoAEliminar(null)}>Cancelar</button>
              <button
                className="choice-btn"
                style={{ background: "rgba(240,82,82,0.15)", borderColor: "var(--red)", color: "var(--red)", fontWeight: 800 }}
                onClick={() => borrarCategoriaPersonalizada(apartadoAEliminar.tipo, apartadoAEliminar.seccion, apartadoAEliminar.nombre)}
              >Sí, borrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Automatismos ─── */}
      {modalAutomatismosAbierto && (
        <div className="modal-overlay" style={{ alignItems: "center" }} onClick={() => setModalAutomatismosAbierto(false)}>
          <div className="modal-box" style={{ maxHeight: "88vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Automatizar gastos</div>
            <div className="modal-subtitle">
              Crea reglas mensuales para {BASE_PRESUPUESTOS[tab].label}. Se ejecutan automáticamente al entrar en la app y puedes pausarlas o borrarlas cuando quieras.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Apartado</label>
              <select className="form-input" value={automatismoCategoria} onChange={(e) => setAutomatismoCategoria(e.target.value)}>
                {cats.gastos.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Importe mensual</label>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  className="form-input-lg nums"
                  value={automatismoImporte}
                  onChange={(e) => setAutomatismoImporte(e.target.value)}
                  placeholder="0,00"
                />
                <span className="input-suffix">€</span>
              </div>
            </div>

            <div className="choice-grid" style={{ marginBottom: 14 }}>
              <div>
                <label className="form-label">Día del mes</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="form-input"
                  value={automatismoDia}
                  onChange={(e) => setAutomatismoDia(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Desde</label>
                <input
                  type="month"
                  className="form-input"
                  value={automatismoDesde}
                  onChange={(e) => setAutomatismoDesde(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Fin</label>
              <div className="choice-grid" style={{ marginBottom: 10 }}>
                <button
                  className={`choice-btn ${!automatismoIlimitado ? "active-blue" : ""}`}
                  onClick={() => setAutomatismoIlimitado(false)}
                >
                  Hasta fecha
                </button>
                <button
                  className={`choice-btn ${automatismoIlimitado ? "active-green" : ""}`}
                  onClick={() => setAutomatismoIlimitado(true)}
                >
                  Ilimitado
                </button>
              </div>
              {!automatismoIlimitado && (
                <input
                  type="month"
                  className="form-input"
                  value={automatismoHasta}
                  onChange={(e) => setAutomatismoHasta(e.target.value)}
                />
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Nota opcional</label>
              <input
                className="form-input"
                value={automatismoNota}
                onChange={(e) => setAutomatismoNota(e.target.value)}
                placeholder="Ej. Suscripción PS5"
              />
            </div>

            <div className="choice-grid" style={{ marginBottom: 24 }}>
              <button className="choice-btn" onClick={() => setModalAutomatismosAbierto(false)}>Cerrar</button>
              <button
                className="choice-btn active-blue"
                style={{ fontWeight: 800 }}
                onClick={guardarAutomatismo}
              >
                Guardar automatismo
              </button>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--subtle)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Reglas actuales
            </div>

            {automatismosTabActual.length === 0 ? (
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface)", color: "var(--muted)", fontSize: 13, border: "1px solid var(--border)" }}>
                No hay automatismos creados.
              </div>
            ) : (
              automatismosTabActual.map((auto) => (
                <div key={auto.id} style={{ padding: "14px", marginBottom: 10, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>
                        {getEmojiCategoria(data, tab, "gastos", auto.categoria)} {auto.categoria} · {fmtDisplay(auto.importe)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                        Día {auto.dia} · desde {auto.desde} · {auto.ilimitado ? "sin fin" : `hasta ${auto.hasta}`}
                      </div>
                      {auto.nota && (
                        <div style={{ fontSize: 11, color: "var(--subtle)", marginTop: 4 }}>{auto.nota}</div>
                      )}
                    </div>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: auto.activo ? "var(--green)" : "var(--muted)",
                        background: auto.activo ? "rgba(34,208,122,0.12)" : "rgba(138,164,194,0.08)",
                        border: auto.activo ? "1px solid rgba(34,208,122,0.22)" : "1px solid var(--border)"
                      }}
                    >
                      {auto.activo ? "Activo" : "Pausado"}
                    </span>
                  </div>
                  <div className="choice-grid">
                    <button
                      className={`choice-btn ${auto.activo ? "" : "active-green"}`}
                      onClick={() => cambiarEstadoAutomatismo(tab, auto.id, !auto.activo)}
                    >
                      {auto.activo ? "Pausar" : "Reactivar"}
                    </button>
                    <button
                      className="choice-btn"
                      style={{ background: "rgba(240,82,82,0.15)", borderColor: "var(--red)", color: "var(--red)", fontWeight: 800 }}
                      onClick={() => borrarAutomatismo(tab, auto.id)}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Movement ─── */}
      {modalAbierto && editando && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />

            <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>
              {editando.seccion === "ingresos" ? "Ingreso" : "Gasto"} · {MESES[mes]} {año}
            </div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {getEmojiCategoria(data, editando.tipo, editando.seccion, editando.cat)} {editando.cat}
            </div>
            <div style={{ fontSize: 13, color: "var(--accent2)", marginBottom: 22 }}>
              Total actual: {fmtDisplay(getValor(editando.tipo, editando.seccion, editando.cat))}
            </div>

            {!usandoMovimientos && (
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => convertirAMovimientosSiHaceFalta(editando.tipo, editando.seccion, editando.cat)}
                  style={{ width: "100%", padding: "12px", borderRadius: 14, border: "1px solid var(--border2)", background: "var(--surface)", color: "var(--subtle)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Pasar a modo movimientos
                </button>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                  Añade varios importes que se suman o restan automáticamente.
                </div>
              </div>
            )}

            {usandoMovimientos ? (
              <>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Añadir movimiento</div>

                <div className="choice-grid">
                  <button
                    className={`choice-btn ${tipoMovimiento === "gasto" ? "active-blue" : ""}`}
                    onClick={() => setTipoMovimiento("gasto")}
                  >Gasto</button>
                  <button
                    className={`choice-btn ${tipoMovimiento === "abono" ? "active-green" : ""}`}
                    onClick={() => setTipoMovimiento("abono")}
                  >Abono / devolución</button>
                </div>

                <div className="input-group">
                  <input
                    type="number" inputMode="decimal"
                    className="form-input-lg nums"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="0,00"
                  />
                  <span className="input-suffix">€</span>
                </div>

                <input
                  type="date" value={movFecha}
                  onChange={(e) => setMovFecha(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: 10 }}
                />

                <input
                  type="text" value={movNota}
                  onChange={(e) => setMovNota(e.target.value)}
                  placeholder="Nota opcional: Repsol, BP..."
                  className="form-input"
                  style={{ marginBottom: 14 }}
                />

                <button
                  onClick={guardarNuevoMovimiento}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginBottom: 22, background: tipoMovimiento === "abono" ? "var(--green)" : "var(--accent)" }}
                >
                  {tipoMovimiento === "abono" ? "➕ Añadir abono" : "➕ Añadir gasto"}
                </button>

                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Historial</div>

                {movimientosActuales.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>Sin movimientos aún.</div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    {movimientosActuales.map((mov, index) => (
                      <div key={index} className="mov-item">
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: normalizarNumero(mov.importe) >= 0 ? "var(--green)" : "var(--red)" }}>
                            {fmtDisplay(normalizarNumero(mov.importe))}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                            {formatearFecha(mov.fecha)}{mov.nota ? ` · ${mov.nota}` : ""}
                          </div>
                        </div>
                        <button className="mov-delete-btn" onClick={() => borrarMovimiento(editando.tipo, editando.seccion, editando.cat, index)}>
                          Borrar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="input-group">
                  <input
                    autoFocus
                    type="number" inputMode="decimal"
                    className="form-input-lg nums"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && guardarEdicionManual()}
                    placeholder="0,00"
                  />
                  <span className="input-suffix">€</span>
                </div>

                <div className="choice-grid">
                  <button className="choice-btn" onClick={() => setModalAbierto(false)}>Cancelar</button>
                  <button className="choice-btn active-blue" style={{ fontWeight: 800 }} onClick={guardarEdicionManual}>
                    Guardar total
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
