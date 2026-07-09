import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null); 
  const [editForm, setEditForm] = useState({ displayName: '', phone: '' }); 

  // 1. ฟังก์ชันดึงข้อมูลลูกค้าจาก Firestore (Read)
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const customerList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'customer') {
          customerList.push({ id: doc.id, ...data });
        }
      });
      setCustomers(customerList);
    } catch (error) {
      console.error("Error fetching customers: ", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 2. ฟังก์ชันเปิดโหมดแก้ไข (เซ็ตค่าเริ่มต้นใส่ฟอร์ม)
  const handleEditClick = (customer) => {
    setEditingCustomer(customer.id);
    setEditForm({
      displayName: customer.displayName || '',
      phone: customer.phone || ''
    });
  };

  // 3. ฟังก์ชันบันทึกการแก้ไขข้อมูลลง Firestore (Update)
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const customerRef = doc(db, 'users', editingCustomer);
      await updateDoc(customerRef, {
        displayName: editForm.displayName,
        phone: editForm.phone
      });
      alert("อัปเดตข้อมูลลูกค้าสำเร็จ");
      setEditingCustomer(null); 
      fetchCustomers(); 
    } catch (error) {
      console.error("Error updating customer: ", error);
      alert("ไม่สามารถแก้ไขข้อมูลได้");
    }
  };

  // 4. ฟังก์ชันเปิด/ปิด สลับสถานะผู้ใช้งาน (ยกเลิกข้อมูล - Soft Delete/Toggle Active)
  const handleToggleActive = async (customer) => {
    const currentStatus = customer.isActive !== false; 
    const actionText = currentStatus ? "ระงับการใช้งาน (ยกเลิกข้อมูล)" : "เปิดกลับมาใช้งานปกติ";
    
    if (window.confirm(`คุณแน่ใจใช่ไหมที่จะทำรายการ "${actionText}" สำหรับลูกค้าคนนี้?`)) {
      try {
        const customerRef = doc(db, 'users', customer.id);
        await updateDoc(customerRef, {
          isActive: !currentStatus 
        });
        alert("ปรับปรุงสถานะบัญชีลูกค้าสำเร็จ");
        fetchCustomers(); 
      } catch (error) {
        console.error("Error toggling active status: ", error);
        alert("ไม่สามารถเปลี่ยนสถานะข้อมูลได้");
      }
    }
  };

  // 5. ฟังก์ชันลบข้อมูลลูกค้า (Delete ถาวรออกจากระบบ)
  const handleDelete = async (id) => {
    if (window.confirm("คำเตือน: คุณแน่ใจใช่ไหมที่จะลบข้อมูลลูกค้าคนนี้แบบถาวร? (การลบนี้จะลบออกจากฐานข้อมูลและกู้คืนไม่ได้)")) {
      try {
        await deleteDoc(doc(db, 'users', id));
        alert("ลบข้อมูลลูกค้าถาวรเรียบร้อยแล้ว");
        fetchCustomers(); 
      } catch (error) {
        console.error("Error deleting customer: ", error);
        alert("ไม่สามารถลบข้อมูลได้");
      }
    }
  };

  if (loading) return <div className="text-center py-10 font-bold text-slate-500">กำลังโหลดข้อมูลลูกค้า...</div>;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-left">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">จัดการข้อมูลลูกค้า</h2>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
          ทั้งหมด {customers.length} คน
        </span>
      </div>

      {/* --- ส่วนที่ 1: ฟอร์มแก้ไขข้อมูล --- */}
      {editingCustomer && (
        <form onSubmit={handleUpdate} className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-3">แก้ไขข้อมูลลูกค้า</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-1.5 bg-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-400">ยกเลิก</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700">บันทึก</button>
          </div>
        </form>
      )}

      {/* --- ส่วนที่ 2: ตารางแสดงรายชื่อลูกค้า --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold">
              <th className="py-3 px-4">อีเมล</th>
              <th className="py-3 px-4">ชื่อผู้ใช้งาน</th>
              <th className="py-3 px-4">เบอร์โทร</th>
              <th className="py-3 px-4 text-center">สถานะ</th>
              <th className="py-3 px-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="text-slate-600 text-sm font-medium">
            {customers.map((customer) => {
              const isAccountActive = customer.isActive !== false;
              return (
                <tr key={customer.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-all ${!isAccountActive ? 'bg-red-50/40 text-slate-400' : ''}`}>
                  <td className="py-3 px-4 text-slate-800 font-semibold">{customer.email}</td>
                  <td className="py-3 px-4">
                    {customer.displayName || <span className="text-slate-300 italic">ไม่ได้ระบุ</span>}
                  </td>
                  <td className="py-3 px-4">
                    {customer.phone || <span className="text-slate-300 italic">ไม่ได้ระบุ</span>}
                  </td>
                  
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAccountActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isAccountActive ? 'ปกติ' : 'ถูกยกเลิก'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1.5">
                      <button 
                        onClick={() => handleEditClick(customer)}
                        className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors"
                      >
                        แก้ไข
                      </button>

                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors"
                      >
                        ลบ
                      </button>

                      <button 
                        onClick={() => handleToggleActive(customer)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                          isAccountActive 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {isAccountActive ? 'ยกเลิกข้อมูล' : 'เปิดใช้งาน'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-400 italic">ไม่มีข้อมูลลูกค้าในระบบ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CustomerManagement;