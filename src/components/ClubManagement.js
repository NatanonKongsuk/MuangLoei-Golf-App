import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
<<<<<<< HEAD
// เพิ่ม query และ where เพื่อคัดกรองประวัติการเช่าไม้ตามวันที่เลือกดู
import { collection, getDocs, doc, updateDoc, addDoc, query, where } from "firebase/firestore";
=======
import { collection, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
import { theme } from '../styles/theme';
import Popup from './Popup';

function ClubManagement() {
<<<<<<< HEAD
  // เพิ่ม State เลือกวันที่สำหรับดูสถานะคลัง (เริ่มต้นที่วันที่ปัจจุบัน)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });

  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
=======
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ปรับ State ให้ตรงตาม ER: Club_Name, Quantity_Total, Quantity_Avail
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClub, setNewClub] = useState({ Club_Name: '', Quantity_Total: 0 });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ Club_Name: '', Quantity_Total: 0 });

  const [modal, setModal] = useState({ isOpen: false, id: null, status: null, name: '' });

  const s = theme.admin;
  const m = theme.modal;

<<<<<<< HEAD
  // ปรับปรุงฟังก์ชันการโหลดและคำนวณจำนวนไม้กอล์ฟว่างให้ผันแปรตามวันที่เลือก
  const fetchClubsAndCalculateAvail = async () => {
    try {
      // 1. ดึงข้อมูลไม้กอล์ฟทั้งหมดจากฐานข้อมูลหลัก
      const clubSnap = await getDocs(collection(db, "golf_clubs"));
      const baseClubs = clubSnap.docs.map(d => ({ ...d.data(), id: d.id }));

      // 2. ดึงข้อมูลใบจองทั้งหมดที่มีการระบุเช่าไม้กอล์ฟในวันที่เลือกดู
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef, 
        where("bookingDate", "==", selectedDate),
        where("status", "in", ["pending", "confirmed", "occupied"]) // คิดเฉพาะใบจองที่มีผลใช้งานอยู่
      );
      const bookingSnap = await getDocs(q);

      // 3. สร้าง Map สรุปจำนวนไม้กอล์ฟที่ถูกดึงไปใช้ในวันนั้น
      const rentedQtyMap = {};
      bookingSnap.forEach(doc => {
        const data = doc.data();
        if (data && data.rentedClubs && Array.isArray(data.rentedClubs)) {
          data.rentedClubs.forEach(item => {
            const qty = Number(item.qty || 0);
            rentedQtyMap[item.clubId] = (rentedQtyMap[item.clubId] || 0) + qty;
          });
        }
      });

      // 4. ผสมข้อมูล: คำนวณค่า Quantity_Avail ใหม่ตามสูตร (จำนวนทั้งหมด - จำนวนที่ถูกเช่าในวันนั้น)
      const finalClubsData = baseClubs.map(club => {
        const total = Number(club.Quantity_Total || 0);
        const rented = rentedQtyMap[club.id] || 0;
        
        return {
          ...club,
          // จำนวนที่พร้อมใช้งานจะถูกคำนวณใหม่แบบไดนามิกตามวันที่เลือกดูเสมอ!
          Quantity_Avail: Math.max(0, total - rented) 
        };
      });

      setClubs(finalClubsData);
    } catch (err) {
      console.error("Error fetching or processing clubs inventory:", err);
    }
  };

  // ให้ระบบโหลดข้อมูลใหม่ทุกครั้งที่แอดมินทำการสลับปฏิทินดูวันที่
  useEffect(() => { 
    fetchClubsAndCalculateAvail(); 
  }, [selectedDate]);

=======
  const fetchClubs = async () => {
    const snap = await getDocs(collection(db, "golf_clubs"));
    setClubs(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  };

  useEffect(() => { fetchClubs(); }, []);

  // --- จัดการข้อมูลตามโครงสร้างใหม่ ---
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
  const handleAddClub = async () => {
    if (!newClub.Club_Name) return;
    try {
      const total = Number(newClub.Quantity_Total);
      await addDoc(collection(db, "golf_clubs"), {
        Club_Name: newClub.Club_Name,
        Quantity_Total: total,
<<<<<<< HEAD
        Quantity_Avail: total, 
=======
        Quantity_Avail: total, // เริ่มต้นจำนวนที่ใช้ได้เท่ากับจำนวนทั้งหมด
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
        Is_Active: true,
        createdAt: new Date()
      });
      setNewClub({ Club_Name: '', Quantity_Total: 0 });
      setIsAddModalOpen(false);
<<<<<<< HEAD
      fetchClubsAndCalculateAvail();
=======
      fetchClubs();
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
    } catch (err) {
      console.error("Error adding club:", err);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      const total = Number(editData.Quantity_Total);
      await updateDoc(doc(db, "golf_clubs", editingId), { 
        Club_Name: editData.Club_Name, 
<<<<<<< HEAD
        Quantity_Total: total
      });
      setIsEditModalOpen(false);
      fetchClubsAndCalculateAvail();
=======
        Quantity_Total: total,
        // หมายเหตุ: Quantity_Avail ปกติจะคำนวณจาก (Total - จำนวนที่ถูกเช่าอยู่)
        Quantity_Avail: total 
      });
      setIsEditModalOpen(false);
      fetchClubs();
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
    } catch (err) {
      console.error("Error updating club:", err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, "golf_clubs", id), { Is_Active: !currentStatus });
    setModal({ ...modal, isOpen: false });
<<<<<<< HEAD
    fetchClubsAndCalculateAvail();
=======
    fetchClubs();
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
  };

  const filteredClubs = clubs.filter(c => 
    c.Club_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={s.card}>
<<<<<<< HEAD
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className={s.title + " !mb-0"}>จัดการคลังไม้กอล์ฟ (Admin)</h2>
          <p className="text-xs font-black text-indigo-600 mt-1">
            สต็อกที่แสดงถูกคำนวณตามรายการจองของวันที่: {new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/*  เพิ่มกล่องปฏิทินด้านบนแถบควบคุมเพื่อให้ระบุวันที่ต้องการดูคลังได้ */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 p-2 rounded-xl">
            <label className="text-xs font-black text-indigo-700 uppercase tracking-wider pl-1">วันที่ตรวจสอบคลัง:</label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-indigo-200 p-1 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className={s.btnEmerald + " !py-2.5 !px-5 text-sm !rounded-xl md:ml-auto"}
          >
            ➕ เพิ่มไม้กอล์ฟใหม่
          </button>
        </div>
      </div>

      <div className={s.searchWrapper}>
        <span className={s.searchIcon}></span>
=======
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
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
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
<<<<<<< HEAD
                
=======
                ⛳
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-lg ${club.Is_Active === false ? 'text-slate-400' : 'text-slate-800'}`}>{club.Club_Name}</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-[15px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg w-fit">
                    ทั้งหมด: {club.Quantity_Total}
                  </span>
<<<<<<< HEAD
                  <span className={`text-[15px] font-black px-2 py-0.5 rounded-lg w-fit ${club.Quantity_Avail === 0 ? 'text-rose-600 bg-rose-50' : 'text-blue-600 bg-blue-50'}`}>
                    ว่างประจำวันนี้: {club.Quantity_Avail}
=======
                  <span className="text-[15px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg w-fit">
                    ว่าง: {club.Quantity_Avail}
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
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
<<<<<<< HEAD
        {filteredClubs.length === 0 && <p className="text-slate-400 font-bold italic py-4">ไม่พบข้อมูลรายการไม้กอล์ฟที่ค้นหา</p>}
=======
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
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
<<<<<<< HEAD
            <h3 className={m.title}>แก้ไขข้อมูล</h3>
=======
            <h3 className={m.title}>📝 แก้ไขข้อมูล</h3>
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
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