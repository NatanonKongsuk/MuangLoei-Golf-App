import React, { useState } from 'react';
import { theme } from '../styles/theme';
import StaffManagement from './StaffManagement';
import SystemSettings from './SystemSettings';
import ClubManagement from './ClubManagement';

// 1. เพิ่ม { handleLogout } เข้าไปในวงเล็บเพื่อรับฟังก์ชันจาก App.js
function OwnerDashboard({ handleLogout }) { 
  const [activeTab, setActiveTab] = useState('staff');
  const s = theme.admin;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-emerald-900 text-white p-6 shadow-2xl">
        <h2 className="text-xl font-black mb-10 tracking-tighter">MLG ADMIN</h2>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('staff')} 
            className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'staff' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
            👥 จัดการพนักงาน
          </button>
          <button onClick={() => setActiveTab('clubs')} 
            className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'clubs' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
            🏌️ จัดการไม้กอล์ฟ
          </button>
          <button onClick={() => setActiveTab('settings')} 
            className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
            ⚙️ ตั้งค่าค่าบริการ
          </button>
        </nav>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <h1 className="text-3xl font-black text-slate-800 uppercase">
            {activeTab === 'staff' ? 'Staff Management' : activeTab === 'clubs' ? 'Club Management' : 'System Settings'}
          </h1>
          
          {/* 2. เปลี่ยนตรงนี้จาก window.location.reload() เป็น handleLogout */}
          <button 
            onClick={handleLogout} 
            className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-all shadow-sm"
          >
            ออกจากระบบ
          </button>
        </header>

        {/* แสดงเนื้อหาตามแท็บที่เลือก */}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'clubs' && <ClubManagement />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
    </div>
  );
}

export default OwnerDashboard;