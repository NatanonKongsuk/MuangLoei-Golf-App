import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

function LaneManagement() {
  const [lanes, setLanes] = useState([]);

  // 1. ดึงข้อมูลสถานะเลนทั้งหมด
  const fetchLanes = async () => {
    const querySnapshot = await getDocs(collection(db, "lanes"));
    const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    // เรียงลำดับตามเลขเลน
    setLanes(data.sort((a, b) => a.laneNumber - b.laneNumber));
  };

  useEffect(() => {
    fetchLanes();
  }, []);

  // 2. ฟังก์ชันเปิด/ปิดเลน (Check-in / Check-out)
  const toggleLaneStatus = async (lane) => {
    const newStatus = lane.status === "available" ? "occupied" : "available";
    const laneRef = doc(db, "lanes", lane.id);
    
    try {
      await updateDoc(laneRef, { 
        status: newStatus,
        // ถ้าเปิดเลนให้ใส่ชื่อลูกค้าสมมติ (ในระบบจริงจะดึงจากหน้าจอง)
        customerName: newStatus === "occupied" ? "ลูกค้าทั่วไป" : "" 
      });
      fetchLanes(); // อัปเดตหน้าจอ
    } catch (error) {
      alert("ไม่สามารถอัปเดตสถานะได้: " + error.message);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-green-800">ผังเลนซ้อม - Muang Loei Golf</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-500 rounded"></span> ว่าง</div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-500 rounded"></span> กำลังใช้งาน</div>
        </div>
      </div>

      {/* แสดงเลนในรูปแบบ Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {lanes.map((lane) => (
          <div 
            key={lane.id}
            onClick={() => toggleLaneStatus(lane)}
            className={`cursor-pointer p-6 rounded-2xl shadow-md border-t-8 transition-all hover:scale-105 ${
              lane.status === "available" ? "bg-white border-green-500" : "bg-red-50 border-red-500"
            }`}
          >
            <div className="text-center">
              <span className="text-gray-500 text-sm font-semibold uppercase">Lane</span>
              <p className="text-4xl font-black text-gray-800">{lane.laneNumber}</p>
              <p className={`mt-2 font-bold ${lane.status === "available" ? "text-green-600" : "text-red-600"}`}>
                {lane.status === "available" ? "ว่าง" : "กำลังใช้งาน"}
              </p>
              {lane.customerName && <p className="text-xs text-gray-500 mt-1">{lane.customerName}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LaneManagement;