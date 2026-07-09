import React, { useState, useEffect } from 'react';
// นำเข้า secondaryAuth เพิ่มเติม
import { db, secondaryAuth } from '../firebase'; 
import { collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
// นำเข้าฟังก์ชันสร้าง User และฟังก์ชัน SignOut ของ Auth ชุดรอง
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { theme } from '../styles/theme';
import Popup from './Popup';

function StaffManagement() {
  const [staffs, setStaffs] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [newStaff, setNewStaff] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [editData, setEditData] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [modal, setModal] = useState({ isOpen: false, id: null, status: null, email: '' });
  
  const s = theme.admin;
  const m = theme.modal; 

<<<<<<< HEAD
  // 🟢 แก้ไขจุดที่ 1: กรองรายชื่อไม่ให้ข้อมูลฝั่ง 'customer' หลุดเข้ามาโชว์ในหน้านี้
  const fetchStaff = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const allUsers = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      
      // กรองเอาเฉพาะคนที่เป็น staff หรือ owner เท่านั้น (ไม่เอา customer)
      // ป้องกันเรื่องตัวพิมพ์เล็ก-ใหญ่ด้วยการใช้ .toLowerCase()
      const filteredStaffs = allUsers.filter(user => {
        const userRole = user.role ? user.role.toString().trim().toLowerCase() : '';
        return userRole === 'staff' || userRole === 'owner';
      });
      
      setStaffs(filteredStaffs);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
=======
  const fetchStaff = async () => {
    const snap = await getDocs(collection(db, "users"));
    setStaffs(snap.docs.map(d => ({ ...d.data(), id: d.id })));
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
  };

  useEffect(() => { fetchStaff(); }, []);

  // --- ฟังก์ชันหลักที่แก้ไข: สร้างพนักงานให้ล็อกอินได้ ---
  const handleAddStaff = async () => {
    if (!newStaff.fullName || !newStaff.email || !newStaff.password) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    try {
      // 1. สร้างบัญชีใน Firebase Auth (ใช้ secondaryAuth เพื่อไม่ให้เจ้าของร้านหลุดจากระบบ)
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        newStaff.email, 
        newStaff.password
      );
      const user = userCredential.user;

      // 2. บันทึกข้อมูลลง Firestore โดยใช้ UID จาก Auth เป็น Document ID
<<<<<<< HEAD
      // 🟢 แก้ไขจุดที่ 2: เปลี่ยนจาก 'STAFF' (ตัวพิมพ์ใหญ่) เป็น 'staff' (ตัวพิมพ์เล็ก) ให้ตรงกับมาตรฐานระบบ
=======
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: newStaff.fullName,
        email: newStaff.email,
        phone: newStaff.phone,
        password: newStaff.password, // เก็บไว้เพื่อให้ Admin ดูหรือแก้ไขได้ง่าย
<<<<<<< HEAD
        role: 'staff', 
=======
        role: 'STAFF',
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
        isActive: true,
        joinDate: new Date()
      });

      // 3. ออกจากระบบ Auth ชุดรองทันทีเพื่อล้างสถานะ
      await signOut(secondaryAuth);

      setNewStaff({ fullName: '', email: '', phone: '', password: '' });
      setIsAddModalOpen(false);
      fetchStaff();
      alert("เพิ่มพนักงานและสร้างบัญชีเข้าใช้งานเรียบร้อยแล้ว!");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการสร้างบัญชี: " + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editData.fullName || !editData.email) return;
    const staffRef = doc(db, "users", editingId);
    await updateDoc(staffRef, { ...editData });
    setIsEditModalOpen(false);
    setEditingId(null);
    fetchStaff();
  };

  const toggleStaffStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, "users", id), { isActive: !currentStatus });
    setModal({ ...modal, isOpen: false });
    fetchStaff();
  };

  return (
<<<<<<< HEAD
    <div className={s.card}>
      <div className="flex justify-between items-center mb-10">
        <h2 className={s.title + " !mb-0"}>จัดการข้อมูลพนักงาน</h2>
        <button onClick={() => setIsAddModalOpen(true)} className={s.btnEmerald + " !py-3 !px-6 text-sm"}>
          เพิ่มพนักงานใหม่
=======
    // ... ส่วน JSX ของคุณคงเดิม ...
    <div className={s.card}>
      {/* ... โค้ดส่วนแสดงผลของคุณที่ส่งมา ... */}
      <div className="flex justify-between items-center mb-10">
        <h2 className={s.title + " !mb-0"}>👥 จัดการข้อมูลพนักงาน</h2>
        <button onClick={() => setIsAddModalOpen(true)} className={s.btnEmerald + " !py-3 !px-6 text-sm"}>
          ➕ เพิ่มพนักงานใหม่
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
        </button>
      </div>

      <div className="grid grid-cols-4 px-8 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
        <div className="col-span-2 ml-16 text-[15px]">ข้อมูลพนักงาน</div>
        <div className="text-center text-[15px]">บทบาท</div>
        <div className="text-right mr-8 text-[15px]">การจัดการ</div>
      </div>

      <div className="space-y-3">
        {staffs.map(staff => {
          const isOwner = staff.role?.toString().trim().toUpperCase() === 'OWNER';
          return (
            <div key={staff.id} className={staff.isActive === false ? s.itemCardDisabled : s.itemCard}>
              <div className="grid grid-cols-4 w-full items-center">
                <div className="col-span-2 flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${staff.isActive === false ? 'bg-slate-200' : 'bg-slate-50'}`}>👤</div>
                  <div className="flex flex-col text-left">
                    <span className={`font-black ${staff.isActive === false ? 'text-slate-400' : 'text-slate-700'}`}>
                      {staff.fullName || 'ไม่ระบุชื่อ'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{staff.email}</span>
                  </div>
                </div>
                <div className="flex justify-center">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${isOwner ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-500'}`}>
                    {staff.role}
                  </span>
                </div>
                <div className="flex justify-end gap-2 pr-4">
                  {!isOwner && staff.isActive !== false && (
                    <button 
                      onClick={() => { 
                        setEditingId(staff.id); 
                        setEditData({ fullName: staff.fullName, email: staff.email, phone: staff.phone || '', password: staff.password || '' });
                        setIsEditModalOpen(true);
                      }} 
                      className={s.btnAmber + " !px-5"}
                    >
                      แก้ไข
                    </button>
                  )}
                  {!isOwner && (
                    <button 
                      onClick={() => setModal({ isOpen: true, id: staff.id, status: staff.isActive, email: staff.email, title: staff.isActive ? "ยกเลิกพนักงาน?" : "เปิดใช้งาน?", message: `ยืนยันการเปลี่ยนสถานะของพนักงาน ${staff.email}` })} 
                      className={staff.isActive === false ? s.btnRestore : s.btnCancelAction}
                    >
                      {staff.isActive === false ? "นำกลับมาใช้" : "ยกเลิกข้อมูล"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

<<<<<<< HEAD
      {/* Popups สำหรับแก้ไขและเพิ่ม */}
      {isEditModalOpen && (
        <div className={m.overlay}>
          <div className={m.card + " !max-w-lg"}>
            <h3 className={m.title}>แก้ไขข้อมูลพนักงาน</h3>
=======
      {/* Popups สำหรับแก้ไขและเพิ่ม (ใช้ handleAddStaff ที่อัปเดตแล้ว) */}
      {/* ... ส่วน Popup ของคุณคงเดิม ... */}
      {isEditModalOpen && (
        <div className={m.overlay}>
          <div className={m.card + " !max-w-lg"}>
            <h3 className={m.title}>📝 แก้ไขข้อมูลพนักงาน</h3>
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
            <div className="space-y-4 mb-8 text-left">
              <div>
                <label className={s.inputLabel}>ชื่อจริง-นามสกุล</label>
                <input value={editData.fullName} onChange={(e) => setEditData({...editData, fullName: e.target.value})} className={s.input} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={s.inputLabel}>อีเมล (Email)</label>
                  <input value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} className={s.input} />
                </div>
                <div>
                  <label className={s.inputLabel}>เบอร์โทรศัพท์</label>
                  <input value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className={s.input} />
                </div>
              </div>
              <div>
                <label className={s.inputLabel}>รหัสผ่าน (Password)</label>
                <input type="password" value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})} className={s.input} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleUpdate} className={m.btnConfirm}>บันทึกการแก้ไข</button>
              <button onClick={() => { setIsEditModalOpen(false); setEditingId(null); }} className={m.btnCancel}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className={m.overlay}>
          <div className={m.card + " !max-w-lg"}>
            <h3 className={m.title}>➕ เพิ่มพนักงานใหม่</h3>
            <div className="space-y-4 mb-8 text-left">
              <div>
                <label className={s.inputLabel}>ชื่อจริง-นามสกุล</label>
                <input value={newStaff.fullName} onChange={(e) => setNewStaff({...newStaff, fullName: e.target.value})} className={s.input} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={s.inputLabel}>อีเมล (Email)</label>
                  <input value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} className={s.input} />
                </div>
                <div>
                  <label className={s.inputLabel}>เบอร์โทรศัพท์</label>
                  <input value={newStaff.phone} onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})} className={s.input} />
                </div>
              </div>
              <div>
                <label className={s.inputLabel}>รหัสผ่าน (Password)</label>
                <input type="password" value={newStaff.password} onChange={(e) => setNewStaff({...newStaff, password: e.target.value})} className={s.input} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleAddStaff} className={m.btnConfirm}>ยืนยันการเพิ่มพนักงาน</button>
              <button onClick={() => setIsAddModalOpen(false)} className={m.btnCancel}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <Popup isOpen={modal.isOpen} type={modal.status === false ? 'info' : 'danger'} title={modal.title} message={modal.message} onConfirm={() => toggleStaffStatus(modal.id, modal.status)} onCancel={() => setModal({ ...modal, isOpen: false })} />
    </div>
  );
}

export default StaffManagement;