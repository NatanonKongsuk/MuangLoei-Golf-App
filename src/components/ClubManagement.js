import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import { theme } from '../styles/theme';
import Popup from './Popup';

function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ปรับ State ให้ตรงตาม ER: Club_Name, Quantity_Total, Quantity_Avail
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClub, setNewClub] = useState({ Club_Name: '', Quantity_Total: 0 });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ Club_Name: '', Quantity_Total: 0 });

  const [modal, setModal] = useState({ isOpen: false, id: null, status: null, name: '' });

  const s = theme.admin;
  const m = theme.modal;

  const fetchClubs = async () => {
    const snap = await getDocs(collection(db, "golf_clubs"));
    setClubs(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  };

  useEffect(() => { fetchClubs(); }, []);

  // --- จัดการข้อมูลตามโครงสร้างใหม่ ---
  const handleAddClub = async () => {
    if (!newClub.Club_Name) return;
    try {
      const total = Number(newClub.Quantity_Total);
      await addDoc(collection(db, "golf_clubs"), {
        Club_Name: newClub.Club_Name,
        Quantity_Total: total,
        Quantity_Avail: total, // เริ่มต้นจำนวนที่ใช้ได้เท่ากับจำนวนทั้งหมด
        Is_Active: true,
        createdAt: new Date()
      });
      setNewClub({ Club_Name: '', Quantity_Total: 0 });
      setIsAddModalOpen(false);
      fetchClubs();
    } catch (err) {
      console.error("Error adding club:", err);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      const total = Number(editData.Quantity_Total);
      await updateDoc(doc(db, "golf_clubs", editingId), { 
        Club_Name: editData.Club_Name, 
        Quantity_Total: total,
        // หมายเหตุ: Quantity_Avail ปกติจะคำนวณจาก (Total - จำนวนที่ถูกเช่าอยู่)
        Quantity_Avail: total 
      });
      setIsEditModalOpen(false);
      fetchClubs();
    } catch (err) {
      console.error("Error updating club:", err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, "golf_clubs", id), { Is_Active: !currentStatus });
    setModal({ ...modal, isOpen: false });
    fetchClubs();
  };

  const filteredClubs = clubs.filter(c => 
    c.Club_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={s.card}>
      <div className="flex justify-between items-center mb-10">
        <h2 className={s.title + " !mb-0"}>⛳ จัดการคลังไม้กอล์ฟ (Admin)</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className={s.btnEmerald + " !py-3 !px-6 text-sm"}
        >
          ➕ เพิ่มไม้กอล์ฟใหม่
        </button>
      </div>

      <div className={s.searchWrapper}>
        <span className={s.searchIcon}>🔍</span>
        <input 
          placeholder="ค้นหาชื่อไม้กอล์ฟ..." 
          className={s.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredClubs.map(club => (
          <div key={club.id} className={club.Is_Active === false ? s.itemCardDisabled : s.itemCard}>
            <div className="flex items-center gap-6 flex-1 text-left">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-2xl ${club.Is_Active === false ? 'bg-slate-200' : 'bg-emerald-50'}`}>
                ⛳
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-lg ${club.Is_Active === false ? 'text-slate-400' : 'text-slate-800'}`}>{club.Club_Name}</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-[15px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg w-fit">
                    ทั้งหมด: {club.Quantity_Total}
                  </span>
                  <span className="text-[15px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg w-fit">
                    ว่าง: {club.Quantity_Avail}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {club.Is_Active !== false && (
                <button 
                  onClick={() => {
                    setEditingId(club.id);
                    setEditData({ Club_Name: club.Club_Name, Quantity_Total: club.Quantity_Total });
                    setIsEditModalOpen(true);
                  }}
                  className={s.btnAmber + " !px-6"}
                >
                  แก้ไข
                </button>
              )}
              <button 
                onClick={() => setModal({ isOpen: true, id: club.id, status: club.Is_Active, name: club.Club_Name })}
                className={club.Is_Active === false ? s.btnRestore : s.btnCancelAction}
              >
                {club.Is_Active === false ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Popup สำหรับเพิ่มไม้ */}
      {isAddModalOpen && (
        <div className={m.overlay}>
          <div className={m.card + " !max-w-sm"}>
            <h3 className={m.title}>➕ เพิ่มไม้กอล์ฟ</h3>
            <div className="space-y-5 mb-8 text-left">
              <div>
                <label className={s.inputLabel}>ชื่อไม้กอล์ฟ (Club Name)</label>
                <input 
                  value={newClub.Club_Name} 
                  onChange={(e) => setNewClub({...newClub, Club_Name: e.target.value})} 
                  className={s.input} 
                  placeholder="ระบุชื่อไม้..."
                />
              </div>
              <div>
                <label className={s.inputLabel}>จำนวนทั้งหมด (Quantity Total)</label>
                <input 
                  type="number" 
                  value={newClub.Quantity_Total} 
                  onChange={(e) => setNewClub({...newClub, Quantity_Total: e.target.value})} 
                  className={s.input + " text-center"} 
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleAddClub} className={m.btnConfirm}>บันทึกเข้าคลัง</button>
              <button onClick={() => setIsAddModalOpen(false)} className={m.btnCancel}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup สำหรับแก้ไขไม้ */}
      {isEditModalOpen && (
        <div className={m.overlay}>
          <div className={m.card + " !max-w-sm"}>
            <h3 className={m.title}>📝 แก้ไขข้อมูล</h3>
            <div className="space-y-5 mb-8 text-left">
              <div>
                <label className={s.inputLabel}>ชื่อไม้กอล์ฟ</label>
                <input value={editData.Club_Name} onChange={(e) => setEditData({...editData, Club_Name: e.target.value})} className={s.input} />
              </div>
              <div>
                <label className={s.inputLabel}>จำนวนสต็อกทั้งหมด</label>
                <input type="number" value={editData.Quantity_Total} onChange={(e) => setEditData({...editData, Quantity_Total: e.target.value})} className={s.input + " text-center"} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleUpdateInfo} className={m.btnConfirm}>บันทึกการแก้ไข</button>
              <button onClick={() => { setIsEditModalOpen(false); setEditingId(null); }} className={m.btnCancel}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <Popup 
        isOpen={modal.isOpen} 
        type={modal.status === false ? 'info' : 'danger'} 
        title={modal.status === false ? 'เปิดใช้งาน?' : 'ปิดใช้งานข้อมูล?'} 
        message={`ยืนยันการเปลี่ยนสถานะของไม้ "${modal.name}"`} 
        onConfirm={() => toggleStatus(modal.id, modal.status)} 
        onCancel={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
}

export default ClubManagement;