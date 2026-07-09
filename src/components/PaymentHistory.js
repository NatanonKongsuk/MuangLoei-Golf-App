import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

function PaymentHistory({ userId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      // ดึงข้อมูลเฉพาะของลูกค้าที่ล็อกอินอยู่ และเรียงจากใหม่ไปเก่า
      const q = query(
        collection(db, "payments"),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      setHistory(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchHistory();
  }, [userId]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-green-800 mb-6">ประวัติการใช้บริการ</h2>
      
      {history.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีประวัติการชำระเงินครับ</p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="bg-white border-l-8 border-green-500 p-4 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">
                  {item.date?.toDate().toLocaleDateString('th-TH', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </p>
                <div className="flex gap-4 mt-1 text-gray-700">
                  <span>ลูกกอล์ฟ: {item.ballCount} ถาด</span>
                  <span>เช่าไม้: {item.clubCount} ไม้</span>
                  {item.isDamaged && <span className="text-red-500 font-bold">(มีค่าปรับ)</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-700">{item.totalAmount} บาท</p>
                <p className="text-xs text-blue-600">ได้รับ +{item.pointsEarned} แต้ม</p>
                {item.pointsUsed > 0 && <p className="text-xs text-red-400">ใช้ไป -{item.pointsUsed} แต้ม</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;