import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase'; // เพิ่ม db เข้ามาด้วย
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // สำหรับดึงข้อมูล Role
import Auth from './components/Auth';
import Checkout from './components/Checkout';
import OwnerDashboard from './components/OwnerDashboard'; // นำเข้า Dashboard ของเจ้าของ

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // เพิ่ม State สำหรับเก็บสิทธิ์ (owner, staff, customer)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // --- ส่วนสำคัญ: ดึงสิทธิ์จาก Firestore ---
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => alert("ออกจากระบบเรียบร้อยแล้ว"));
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-emerald-900 text-white font-bold animate-pulse">
      MUANG LOEI GOLF IS LOADING...
    </div>
  );

  // --- กรณีที่ 1: ยังไม่ได้เข้าสู่ระบบ ---
  if (!user) return <Auth />;

  // --- กรณีที่ 2: ล็อกอินแล้ว (แยกตาม Role) ---
  return (
    <div className="min-h-screen bg-slate-50">
      {role === 'owner' ? (
        // 2.1 หน้าสำหรับ "เจ้าของร้าน"
        <OwnerDashboard user={user} handleLogout={handleLogout} />
      ) : role === 'staff' ? (
        // 2.2 หน้าสำหรับ "พนักงาน"
        <>
          <nav className="bg-emerald-700 p-4 text-white flex justify-between shadow-xl">
            <h1 className="font-black tracking-tighter uppercase">Staff Mode | MLG</h1>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span>พนักงาน: {user.email}</span>
              <button onClick={handleLogout} className="bg-red-500 px-4 py-1 rounded-xl hover:bg-red-600 transition-all">LOGOUT</button>
            </div>
          </nav>
          <main className="p-10">
            <Checkout userId={user.uid} />
          </main>
        </>
      ) : (
        // 2.3 หน้าสำหรับ "ลูกค้า"
        <div className="flex flex-col items-center justify-center h-screen space-y-6">
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border-t-8 border-emerald-500">
              <h2 className="text-2xl font-black text-slate-800">ยินดีต้อนรับคุณลูกค้า</h2>
              <p className="text-slate-400 mt-2 mb-6">{user.email}</p>
              <div className="bg-emerald-50 p-6 rounded-3xl">
                <p className="text-xs font-bold text-emerald-600 uppercase">แต้มสะสมทั้งหมด</p>
                <p className="text-5xl font-black text-emerald-800 mt-2">622 <span className="text-sm">PTS</span></p>
              </div>
              <button onClick={handleLogout} className="mt-8 text-slate-400 font-bold hover:text-red-500 transition-all">ออกจากระบบ</button>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;