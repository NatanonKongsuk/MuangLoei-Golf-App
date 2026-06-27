import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { theme, ACCESS_KEYS } from '../styles/theme';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
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
        // ตรวจสอบสิทธิ์ด้วย Secret Key
        let role = 'CUSTOMER';
        if (accessKey === ACCESS_KEYS.OWNER_KEY) role = 'OWNER';
        else if (accessKey === ACCESS_KEYS.STAFF_KEY) role = 'STAFF';

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // บันทึกข้อมูลเริ่มต้นลง Firestore
        await setDoc(doc(db, "users", userCred.user.uid), {
          uid: userCred.user.uid,
          email,
          role,
          isActive: true,
          createdAt: new Date()
        });
        alert(`ลงทะเบียนสำเร็จ! สิทธิ์ของคุณคือ: ${role}`);
      }
    } catch (err) {
      // แจ้งเตือนเมื่อข้อมูลผิดพลาด
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
          {/* ปรับหัวข้อตามโหมดที่เลือก */}
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

          {mode === 'register' && (
            <input 
              type="password" 
              value={accessKey} 
              onChange={(e)=>setAccessKey(e.target.value)} 
              className={s.input + " border-emerald-100 bg-emerald-50/30"} 
              placeholder="Secret Access Key" 
              required
            />
          )}

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
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm font-black text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {mode === 'login' ? 'สมัครสมาชิกใหม่' : 'กลับไปหน้าเข้าสู่ระบบ'}
          </button>
          
          {mode === 'login' && (
            <button 
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