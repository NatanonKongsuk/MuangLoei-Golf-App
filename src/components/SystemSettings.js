import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, addDoc, setDoc, getDoc } from "firebase/firestore";
import { theme } from '../styles/theme';
import Popup from './Popup';

function SystemSettings() {
  const [services, setServices] = useState([]);
  const [pointSettings, setPointSettings] = useState(null); 
  
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceData, setEditServiceData] = useState({ Service_Name: '', Price_Rate: '' });

  const [newService, setNewService] = useState({ Service_Name: '', Price_Rate: '' });
  const [tempEarn, setTempEarn] = useState({ baht: '', points: '' });
  const [tempRedeem, setTempRedeem] = useState({ points: '', baht: '' });
  
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  const s = theme.admin;
  const m = theme.modal;

  const fetchData = async () => {
    // 1. ดึงข้อมูล Service Settings
    const serviceSnap = await getDocs(collection(db, "service_settings"));
    setServices(serviceSnap.docs.map(d => ({ ...d.data(), id: d.id })));

    // 2. ดึงข้อมูล Point Settings (ดึง ID คงที่ 'config_01')
    const pointDocRef = doc(db, "point_configs", "config_01");
    const pointSnap = await getDoc(pointDocRef);
    
    if (pointSnap.exists()) {
      const data = pointSnap.data();
      setPointSettings({ ...data, id: pointSnap.id });
      setTempEarn({ baht: data.Earning_Rate_Amount || '', points: data.Earning_Rate_Points || '' });
      setTempRedeem({ points: data.RDT_Rate_Points || '', baht: data.RDT_Rate_Discount || '' });
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Service Handlers ---
  const handleAddService = async () => {
    if (!newService.Service_Name || !newService.Price_Rate) return;
    await addDoc(collection(db, "service_settings"), { 
      Service_Name: newService.Service_Name, 
      Price_Rate: Number(newService.Price_Rate), 
      Is_Active: true 
    });
    setNewService({ Service_Name: '', Price_Rate: '' });
    fetchData();
  };

  const handleUpdateService = async () => {
    if (!editServiceData.Service_Name || !editServiceData.Price_Rate) return;
    await updateDoc(doc(db, "service_settings", editingServiceId), { 
      Service_Name: editServiceData.Service_Name, 
      Price_Rate: Number(editServiceData.Price_Rate) 
    });
    setIsEditServiceOpen(false);
    fetchData();
  };

  // --- Point Handlers ---
  const savePointRule = async (pointType) => {
    const pointDocRef = doc(db, "point_configs", "config_01");
    let updateData = {};

    if (pointType === 'earn') {
      updateData = {
        Earning_Rate_Amount: Number(tempEarn.baht),
        Earning_Rate_Points: Number(tempEarn.points),
        Earning_Is_Active: true
      };
    } else {
      updateData = {
        RDT_Rate_Points: Number(tempRedeem.points),
        RDT_Rate_Discount: Number(tempRedeem.baht),
        Redemption_Is_Active: true
      };
    }

    await setDoc(pointDocRef, updateData, { merge: true });
    fetchData();
    setModal({
      isOpen: true, type: 'info', title: 'บันทึกสำเร็จ', message: 'อัปเดตข้อมูลเกณฑ์แต้มเรียบร้อยแล้ว',
      onConfirm: () => setModal({ ...modal, isOpen: false })
    });
  };

  // --- Common Toggle Status ---
  const askToggleStatus = (id, currentStatus, label, type) => {
    setModal({
      isOpen: true, type: 'danger', title: currentStatus ? 'ยืนยันการยกเลิก?' : 'เปิดใช้งานอีกครั้ง?',
      message: `คุณต้องการเปลี่ยนสถานะ "${label}" ใช่หรือไม่?`,
      onConfirm: async () => {
        if (type === 'service') {
          await updateDoc(doc(db, "service_settings", id), { Is_Active: !currentStatus });
        } else if (type === 'earn') {
          await updateDoc(doc(db, "point_configs", id), { Earning_Is_Active: !currentStatus });
        } else if (type === 'redeem') {
          await updateDoc(doc(db, "point_configs", id), { Redemption_Is_Active: !currentStatus });
        }
        setModal({ ...modal, isOpen: false });
        fetchData();
      }
    });
  };

  return (
    <div className={s.card}>
      <h2 className={s.title}>⚙️ ตั้งค่าระบบบริหารจัดการ (D3)</h2>

      <div className={s.sectionWrapper}>
        {/* บริการ Section */}
        <div className={s.settingGroup}>
          <h3 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2">💰 รายการค่าบริการ</h3>
          
          <div className="flex gap-2 mb-8">
            <input placeholder="ชื่อบริการ..." value={newService.Service_Name} onChange={(e)=>setNewService({...newService, Service_Name: e.target.value})} className={s.input + " !py-3 text-base"} />
            <input type="number" placeholder="ราคา" value={newService.Price_Rate} onChange={(e)=>setNewService({...newService, Price_Rate: e.target.value})} className={s.input + " !py-3 w-28 text-base"} />
            <button onClick={handleAddService} className={s.btnEmerald + " !px-8 !py-3 text-base font-black"}>เพิ่ม</button>
          </div>

          <div className="space-y-4">
            {services.map(item => (
              <div key={item.id} className={item.Is_Active ? s.itemRow + " !py-4" : s.itemRowDisabled + " !py-4"}>
                <div className="flex flex-col text-left ml-4">
                  <span className="font-black text-slate-700 text-base">{item.Service_Name}</span>
                  <span className={item.Is_Active ? "text-emerald-600 font-bold" : "text-slate-400 font-bold"}>{item.Price_Rate} บาท</span>
                </div>
                <div className="flex gap-3 mr-4">
                  {item.Is_Active && (
                    <button 
                      onClick={() => { setEditingServiceId(item.id); setEditServiceData({ Service_Name: item.Service_Name, Price_Rate: item.Price_Rate }); setIsEditServiceOpen(true); }} 
                      className={s.btnAmber + " !px-6 !py-2.5 text-sm font-black"}
                    >แก้ไข</button>
                  )}
                  <button 
                    onClick={() => askToggleStatus(item.id, item.Is_Active, item.Service_Name, 'service')} 
                    className={(item.Is_Active ? s.btnCancelAction : s.btnRestore) + " !px-6 !py-2.5 text-sm font-black"}
                  >
                    {item.Is_Active ? "ยกเลิก" : "ใช้ใหม่"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* เกณฑ์แต้ม Section */}
        <div className={s.settingGroup}>
          <h3 className="text-lg font-black text-slate-700 mb-6">🌟 กำหนดเกณฑ์แต้ม</h3>
          
          {/* สะสมแต้ม */}
          <div className={`p-8 rounded-[3rem] mb-6 border-2 ${!pointSettings?.Earning_Is_Active ? 'bg-slate-50 grayscale' : 'bg-white border-emerald-50'}`}>
            <label className={s.inputLabel}>📈 ได้รับแต้ม (สะสม)</label>
            <div className="flex items-center gap-4">
              <input type="number" placeholder="บาท" value={tempEarn.baht} onChange={(e)=>setTempEarn({...tempEarn, baht: e.target.value})} className={s.input + " !py-3 text-center text-lg"} />
              <span className="font-black text-slate-300">➔</span>
              <input type="number" placeholder="แต้ม" value={tempEarn.points} onChange={(e)=>setTempEarn({...tempEarn, points: e.target.value})} className={s.input + " !py-3 text-center text-lg"} />
              <button onClick={()=>savePointRule('earn')} className={s.btnEmerald + " !px-8 !py-3 text-base"}>บันทึก</button>
            </div>
            {pointSettings && (
              <div className="mt-5 flex justify-between items-center border-t pt-5 border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ปัจจุบัน: {pointSettings.Earning_Rate_Amount} บ. = {pointSettings.Earning_Rate_Points} แต้ม</span>
                <button onClick={()=>askToggleStatus(pointSettings.id, pointSettings.Earning_Is_Active, "เกณฑ์สะสมแต้ม", 'earn')} className="text-xs font-black text-emerald-600 underline">
                  {pointSettings.Earning_Is_Active ? "ปิดเกณฑ์" : "เปิดเกณฑ์"}
                </button>
              </div>
            )}
          </div>

          {/* แลกส่วนลด */}
          <div className={`p-8 rounded-[3rem] border-2 ${!pointSettings?.Redemption_Is_Active ? 'bg-slate-50 grayscale' : 'bg-white border-emerald-50'}`}>
            <label className={s.inputLabel}>📉 แลกส่วนลด (Redeem)</label>
            <div className="flex items-center gap-4">
              <input type="number" placeholder="แต้ม" value={tempRedeem.points} onChange={(e)=>setTempRedeem({...tempRedeem, points: e.target.value})} className={s.input + " !py-3 text-center text-lg"} />
              <span className="font-black text-slate-300">➔</span>
              <input type="number" placeholder="บาท" value={tempRedeem.baht} onChange={(e)=>setTempRedeem({...tempRedeem, baht: e.target.value})} className={s.input + " !py-3 text-center text-lg"} />
              <button onClick={()=>savePointRule('redeem')} className={s.btnEmerald + " !px-8 !py-3 text-base"}>บันทึก</button>
            </div>
            {pointSettings && (
              <div className="mt-5 flex justify-between items-center border-t pt-5 border-slate-100">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ปัจจุบัน: {pointSettings.RDT_Rate_Points} แต้ม = {pointSettings.RDT_Rate_Discount} บ.</span>
                <button onClick={()=>askToggleStatus(pointSettings.id, pointSettings.Redemption_Is_Active, "เกณฑ์แลกแต้ม", 'redeem')} className="text-xs font-black text-emerald-600 underline">
                  {pointSettings.Redemption_Is_Active ? "ปิดเกณฑ์" : "เปิดเกณฑ์"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal แก้ไขบริการ */}
      {isEditServiceOpen && (
        <div className={m.overlay}>
          <div className={m.card + " !max-w-md !p-10"}>
            <h3 className={m.title}>📝 แก้ไขค่าบริการ</h3>
            <div className="space-y-6 mb-10 text-left">
              <div>
                <label className={s.inputLabel}>ชื่อรายการ</label>
                <input value={editServiceData.Service_Name} onChange={(e) => setEditServiceData({...editServiceData, Service_Name: e.target.value})} className={s.input + " !py-3"} />
              </div>
              <div>
                <label className={s.inputLabel}>ราคา (บาท)</label>
                <input type="number" value={editServiceData.Price_Rate} onChange={(e) => setEditServiceData({...editServiceData, Price_Rate: e.target.value})} className={s.input + " !py-3"} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleUpdateService} className={m.btnConfirm + " !py-4 text-lg"}>บันทึกการแก้ไข</button>
              <button onClick={() => setIsEditServiceOpen(false)} className={m.btnCancel + " !py-3"}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      <Popup isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.type === 'danger' ? () => setModal({ ...modal, isOpen: false }) : null} />
    </div>
  );
}

export default SystemSettings;