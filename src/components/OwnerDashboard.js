import React, { useState } from 'react';
import { theme } from '../styles/theme';
import StaffManagement from './StaffManagement';
<<<<<<< HEAD
import ClubManagement from './ClubManagement';
import CustomerManagement from './CustomerManagement'; 
import LaneManagement from './LaneManagement';
import SystemSettings from './SystemSettings';
import ShopClosureManagement from './ShopClosureManagement'; 
import BookingFlow from './BookingFlow'; 
import PaymentManager from './PaymentManager'; 
import ReviewManagement from './ReviewManagement'; // นำเข้าคอมโพเนนต์จัดการคะแนนและความคิดเห็น

=======
import SystemSettings from './SystemSettings';
import ClubManagement from './ClubManagement';

// 1. เพิ่ม { handleLogout } เข้าไปในวงเล็บเพื่อรับฟังก์ชันจาก App.js
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
function OwnerDashboard({ handleLogout }) { 
  const [activeTab, setActiveTab] = useState('staff');
  const s = theme.admin;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* --- SIDEBAR --- */}
<<<<<<< HEAD
      <div className="w-64 bg-emerald-900 text-white p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-black mb-10 tracking-tighter">MLG ADMIN</h2>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('staff')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'staff' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              จัดการพนักงาน
            </button>
            
            <button onClick={() => setActiveTab('customers')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'customers' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              จัดการข้อมูลลูกค้า
            </button>

            <button onClick={() => setActiveTab('lanes')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'lanes' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              จัดการเลนซ้อม
            </button>

            <button onClick={() => setActiveTab('payment')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'payment' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              คิดเงินและจัดการรายได้
            </button>

            <button onClick={() => setActiveTab('new_booking')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'new_booking' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              เพิ่มการจองใหม่
            </button>

            <button onClick={() => setActiveTab('closures')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'closures' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              ตั้งวันปิดร้านล่วงหน้า
            </button>

            <button onClick={() => setActiveTab('clubs')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'clubs' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              จัดการไม้กอล์ฟ
            </button>
            
            <button onClick={() => setActiveTab('settings')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              ตั้งค่าค่าบริการ
            </button>

            {/* เพิ่มปุ่มเมนูตรวจสอบคะแนนและความคิดเห็นตามขอบเขตโครงการ */}
            <button onClick={() => setActiveTab('reviews')} 
              className={`w-full text-left p-4 rounded-2xl font-bold transition-all ${activeTab === 'reviews' ? 'bg-emerald-600 shadow-lg' : 'hover:bg-emerald-800'}`}>
              ตรวจสอบคะแนนและความคิดเห็น
            </button>
          </nav>
        </div>
=======
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
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-center">
          <h1 className="text-3xl font-black text-slate-800 uppercase">
<<<<<<< HEAD
            {activeTab === 'staff' ? 'Staff Management' : 
             activeTab === 'customers' ? 'Customer Management' : 
             activeTab === 'lanes' ? 'Lane Management' :
             activeTab === 'payment' ? 'Payment Management' :
             activeTab === 'new_booking' ? 'Create New Booking' :
             activeTab === 'closures' ? 'Shop Closure Management' :
             activeTab === 'clubs' ? 'Club Management' : 
             activeTab === 'settings' ? 'System Settings' : 'Review Management'}
          </h1>
          
=======
            {activeTab === 'staff' ? 'Staff Management' : activeTab === 'clubs' ? 'Club Management' : 'System Settings'}
          </h1>
          
          {/* 2. เปลี่ยนตรงนี้จาก window.location.reload() เป็น handleLogout */}
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
          <button 
            onClick={handleLogout} 
            className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-all shadow-sm"
          >
            ออกจากระบบ
          </button>
        </header>

        {/* แสดงเนื้อหาตามแท็บที่เลือก */}
        {activeTab === 'staff' && <StaffManagement />}
<<<<<<< HEAD
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'lanes' && <LaneManagement />}
        {activeTab === 'payment' && <PaymentManager />}
        {activeTab === 'new_booking' && <BookingFlow />}
        {activeTab === 'closures' && <ShopClosureManagement />}  
        {activeTab === 'clubs' && <ClubManagement />}
        {activeTab === 'settings' && <SystemSettings />}
        {activeTab === 'reviews' && <ReviewManagement />} {/* แสดงหน้าจอรีวิวเมื่อเลือกแท็บ reviews */}
=======
        {activeTab === 'clubs' && <ClubManagement />}
        {activeTab === 'settings' && <SystemSettings />}
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
      </div>
    </div>
  );
}

export default OwnerDashboard;