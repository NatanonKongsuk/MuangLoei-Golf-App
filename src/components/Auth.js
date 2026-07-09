import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { theme } from '../styles/theme'; // นำ ACCESS_KEYS ออกเนื่องจากไม่ได้ใช้แล้ว

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // ควบคุมโหมด: login, register, forgot
  const [loading, setLoading] = useState(false);

  const s = theme.auth; // ใช้สไตล์จาก theme.js

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        // 1. ตรวจสอบบัญชีจากระบบ Auth
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        
        // 2. ตรวจสอบสถานะ isActive จาก Firestore
        const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
        if (userDoc.exists() && userDoc.data().isActive === false) {
          alert("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อเจ้าของร้าน");
          await auth.signOut();
          setLoading(false);
          return;
        }
      } else if (mode === 'register') {
        // 💡 เปลี่ยนตรงนี้: บังคับให้ทุกคนที่สมัครใหม่มีสิทธิ์เป็น 'customer' ทั้งหมด
        const role = 'customer'; 

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // บันทึกข้อมูลเริ่มต้นลงคอลเลกชัน "users" ใน Firestore
        await setDoc(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          email,
          role, // ค่าที่บันทึกจะเป็น 'customer'
          isActive: true,
          createdAt: new Date()
        });
        alert(`ลงทะเบียนสมัครสมาชิกสำเร็จแล้วครับ!`);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว!");
      setMode('login');
    } catch (err) { alert(err.message); }
  };

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <div className={s.header}>
          <h2 className={s.title}>
            {mode === 'forgot' ? 'RESET PASSWORD' : mode === 'register' ? 'REGISTER' : 'LOGIN'}
          </h2>
          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mt-2">
            MUANG LOEI GOLF MANAGEMENT
          </p>
        </div>

        <form onSubmit={mode === 'forgot' ? handleForgot : handleAuth} className="space-y-4">
          <input 
            type="email" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)} 
            className={s.input} 
            placeholder="Email Address" 
            required 
          />
          
          {mode !== 'forgot' && (
            <input 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              className={s.input} 
              placeholder="Password" 
              required 
            />
          )}

          {/* 💡 ช่องกรอก Secret Access Key เดิมถูกถอดออกแล้ว เพื่อให้สมัครเป็นลูกค้าได้ปกติทันที */}

          <button 
            type="submit" 
            disabled={loading}
            className={s.btnPrimary}
          >
            {loading ? 'PROCESSING...' : mode.toUpperCase()}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 items-center">
          <button 
            type="button" // เปลี่ยนเป็นประเภท button ป้องกันการสั่ง submit ฟอร์มซ้ำ
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            className="text-sm font-black text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {mode === 'login' ? 'สมัครสมาชิกใหม่' : 'กลับไปหน้าเข้าสู่ระบบ'}
          </button>
          
          {mode === 'login' && (
            <button 
              type="button"
              onClick={() => setMode('forgot')} 
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ลืมรหัสผ่านใช่หรือไม่?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;