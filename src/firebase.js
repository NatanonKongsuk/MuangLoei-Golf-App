<<<<<<< HEAD
// 1. Import SDKs ที่จำเป็นต้องใช้ในโปรเจกต์
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 2. ค่า Configuration ของโปรเจกต์คุณ
=======
// 1. นำเข้าฟังก์ชันที่จำเป็น
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. Config ของคุณ (ถูกต้องแล้วครับ)
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
const firebaseConfig = {
  apiKey: "AIzaSyBLoeMsabyHYLwG5axZ1pvOg3d3oxBtHlc",
  authDomain: "muangloeigolf.firebaseapp.com",
  projectId: "muangloeigolf",
  storageBucket: "muangloeigolf.firebasestorage.app",
  messagingSenderId: "62676532771",
  appId: "1:62676532771:web:36b5a94e8afc9ab76ffb96",
  measurementId: "G-G927NZXVR8"
};

<<<<<<< HEAD
// 3. เริ่มต้นการทำงานของ Firebase App ตัวหลัก
const app = initializeApp(firebaseConfig);

// 4. เริ่มต้น Firebase App ตัวรอง (สำหรับฟังก์ชันเพิ่มพนักงานใหม่ เพื่อไม่ให้ Admin หลุดจากระบบ)
const secondaryApp = initializeApp(firebaseConfig, "Secondary"); 

// 5. ส่งออก (Export) ตัวแปรไปใช้ตามหน้าจอต่างๆ (เช่น หน้าจองเลน, หน้าจัดการพนักงาน)
export const db = getFirestore(app);
export const auth = getAuth(app); // ตัวหลักสำหรับ Login/Logout ทั่วไป
export const secondaryAuth = getAuth(secondaryApp); // ตัวรองสำหรับฟังก์ชันพนักงาน
=======
// 1. เริ่มต้น Firebase App หลัก
const app = initializeApp(firebaseConfig);

// 2. เริ่มต้น Firebase App สำรอง (สำหรับสร้างพนักงานใหม่โดย Admin ไม่หลุดจากระบบ)
const secondaryApp = initializeApp(firebaseConfig, "Secondary"); 

// 3. สร้างตัวแปรส่งออก (Export) โดยประกาศเพียงครั้งเดียว
export const db = getFirestore(app);
export const auth = getAuth(app); // ตัวหลักสำหรับ Login/Logout ทั่วไป
export const secondaryAuth = getAuth(secondaryApp); // ตัวรองสำหรับฟังก์ชันเพิ่มพนักงาน
>>>>>>> b3d2be7e844e9327d022a994c2815786d77bdbfe
