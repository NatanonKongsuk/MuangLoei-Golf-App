import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, Timestamp } from "firebase/firestore";
import { theme } from '../styles/theme';
import Popup from './Popup'; // เรียกใช้งานคอมโพเนนต์ที่คุณสร้างไว้

function ShopClosureManagement() {
  const [closedDates, setClosedDates] = useState([]);
  const [newClosedDate, setNewClosedDate] = useState({ date: '', reason: '' });
  const [loading, setLoading] = useState(true);

  // 🔥 State สำหรับควบคุมการทำงานของระบบแจ้งเตือนสากลผ่าน Popup คอมโพเนนต์
  const [alertPopup, setAlertPopup] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  const s = theme.admin;

  // ฟังก์ชันแปลง Firestore Timestamp หรือ Date Object ให้เป็นรูปแบบภาษาไทย
  const formatThaiDate = (dateInput) => {
    if (!dateInput) return "";
    // รองรับทั้งแบบที่มาจาก Firestore (.toDate()) หรือ Date Object ทั่วไป
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const fetchClosedDates = async () => {
    setLoading(true);
    try {
      const closureSnap = await getDocs(collection(db, "shop_closures"));
      const closureList = closureSnap.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          id: doc.id
        };
      });
      
      // เรียงลำดับวันที่ปิดร้าน (แปลง Timestamp เป็นวินาทีก่อนนำมาเปรียบเทียบ)
      closureList.sort((a, b) => a.date.seconds - b.date.seconds);
      
      setClosedDates(closureList);
    } catch (error) {
      console.error("Error fetching closures:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClosedDates();
  }, []);

  const handleAddClosureDate = async () => {
    if (!newClosedDate.date) {
      setAlertPopup({
        isOpen: true,
        type: 'danger',
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณาเลือกวันที่ต้องการปิดร้านก่อนดำเนินการบันทึกข้อมูลครับ',
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    try {
      // 1. แปลงค่า String จาก input type="date" (YYYY-MM-DD) ให้เป็น Date Object
      const targetDate = new Date(newClosedDate.date);
      // ตั้งค่าเวลาให้เป็น 00:00:00 เพื่อให้การเทียบวันที่ในวันนั้นๆ แม่นยำ ไม่ติดเรื่องเวลาเศษวินาที
      targetDate.setHours(0, 0, 0, 0); 

      // 2. ใช้ Timestamp.fromDate() ในการบันทึกลง Firestore
      await addDoc(collection(db, "shop_closures"), {
        date: Timestamp.fromDate(targetDate), 
        reason: newClosedDate.reason || "ปรับปรุงสนามประจำปี",
        createdAt: Timestamp.now() // เปลี่ยนมาใช้ Timestamp.now() ของ Firebase
      });

      setNewClosedDate({ date: '', reason: '' });
      
      setAlertPopup({
        isOpen: true,
        type: 'info',
        title: 'บันทึกสำเร็จ',
        message: 'บันทึกวันปิดร้านล่วงหน้า (วันหยุดสนาม) เรียบร้อยแล้ว',
        onConfirm: () => {
          setAlertPopup(prev => ({ ...prev, isOpen: false }));
          fetchClosedDates();
        }
      });
    } catch (error) {
      setAlertPopup({
        isOpen: true,
        type: 'danger',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกวันหยุดได้เนื่องจาก: ' + error.message,
        onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleDeleteClosureDate = (id, firestoreTimestamp) => {
    const formattedDate = formatThaiDate(firestoreTimestamp);
    
    setAlertPopup({
      isOpen: true,
      type: 'danger',
      title: 'ยกเลิกวันหยุดสนาม?',
      message: `คุณต้องการยกเลิกวันปิดบริการในวันที่ ${formattedDate} เพื่อกลับมาเปิดให้บริการสนามกอล์ฟตามปกติใช่หรือไม่?`,
      onCancel: () => setAlertPopup(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "shop_closures", id));
          
          setAlertPopup({
            isOpen: true,
            type: 'info',
            title: 'ดำเนินการสำเร็จ',
            message: 'เปลี่ยนสถานะให้กลับมาเปิดให้บริการสนามตามปกติแล้ว',
            onConfirm: () => {
              setAlertPopup(prev => ({ ...prev, isOpen: false }));
              fetchClosedDates();
            }
          });
        } catch (error) {
          setAlertPopup({
            isOpen: true,
            type: 'danger',
            title: 'เกิดข้อผิดพลาด',
            message: error.message,
            onConfirm: () => setAlertPopup(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  if (loading) return <div className="text-center py-10 font-bold text-slate-500">กำลังโหลดข้อมูลวันปิดร้าน...</div>;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-left font-sans relative">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">ตั้งวันปิดร้านล่วงหน้า (วันหยุดสนาม)</h2>
        <p className="text-slate-400 text-xs mt-1">กำหนดวันหยุดของสนามไดร์ฟกอล์ฟ เพื่อล็อกไม่ให้ระบบเปิดให้จองคิวในวันดังกล่าว</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">เลือกวันที่</label>
          <input type="date" value={newClosedDate.date} onChange={(e) => setNewClosedDate({ ...newClosedDate, date: e.target.value })} className={s.input + " !py-2.5 text-base"} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">หมายเหตุ / เหตุผลการปิดร้าน</label>
          <input type="text" placeholder="เช่น ปรับปรุงพรมช่องไดร์ฟ..." value={newClosedDate.reason} onChange={(e) => setNewClosedDate({ ...newClosedDate, reason: e.target.value })} className={s.input + " !py-2.5 text-base"} />
        </div>
        <div className="flex items-end">
          <button onClick={handleAddClosureDate} className={s.btnEmerald + " w-full !py-3 text-base font-black"}>➕ บันทึกวันปิดร้าน</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs font-bold uppercase">
              <th className="p-4">วันที่หยุดบริการ</th>
              <th className="p-4">เหตุผลการปิดปรับปรุง</th>
              <th className="p-4 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="text-slate-600 text-sm font-medium">
            {closedDates.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                {/* 🔥 เรียกใช้งานฟังก์ชัน formatThaiDate ร่วมกับฟิลด์ที่เป็น Timestamp */}
                <td className="p-4 text-slate-800 font-bold">{formatThaiDate(item.date)}</td>
                <td className="p-4 text-slate-500">{item.reason}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeleteClosureDate(item.id, item.date)} className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                    เปิดให้บริการปกติ
                  </button>
                </td>
              </tr>
            ))}
            {closedDates.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-8 text-slate-400 italic">ไม่มีการตั้งวันปิดร้านล่วงหน้า</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔥 วางแท็กคอมโพเนนต์อินเทอร์เฟซเพื่อสลับหน้าต่าง Popup ไว้ที่ท้ายสุดของโค้ด */}
      <Popup 
        isOpen={alertPopup.isOpen} 
        type={alertPopup.type} 
        title={alertPopup.title} 
        message={alertPopup.message} 
        onConfirm={alertPopup.onConfirm} 
        onCancel={alertPopup.onCancel} 
      />
    </div>
  );
}

export default ShopClosureManagement;